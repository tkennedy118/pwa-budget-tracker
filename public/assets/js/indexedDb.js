let db;

// Create new db request for a 'budget' database.
const request = indexedDB.open('budget', 1);

// onupgradeneeded handler is called when a new version of the database is created, including
// when 1) the database has not been created before or 2) a new version number is submitted by
// calling window.indexedDB.open.
request.onupgradeneeded = function(event) {
  // Create 'pending' object store and set autoincrement to true.
  db = event.target.result;
  db.createObjectStore('pending', { autoIncrement: true });
};

// onsuccess handler is called when the result of a request is successfully returned.
request.onsuccess = function(event) {
  db = event.target.result;

  // Check if the application is online before reading from db.
  if (navigator.onLine) {
    checkDatabase();
  }
};

// onerror handler is called when a request returns an error.
request.onerror = function(event) {
  console.log("Something went wrong! " + event.target.errorCode);
};

function saveRecord(record) {
  // Create a transaction on the pending database with read/write access.
  const transaction = db.transaction(['pending'], 'readwrite');

  // Access the pending object store.
  const store = transaction.objectStore('pending');

  // Add record to the object store.
  store.add(record);
}

function checkDatabase() {
  // Create a transaction on the pending database with read/write access.
  const transaction = db.transaction(['pending'], 'readwrite');

  // Access the pending object store.
  const store = transaction.objectStore('pending');

  // Get all records from the store and assign them to a variable.
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    // The pending object store had records in it.
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accespt: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(() => {
        // Response was successful. Open transaction on pending database.
        const transaction = db.transaction(['pending'], 'readwrite');

        // Access the pending object store.
        const store = transaction.objectStore('pending');

        // Clear all items in the 'pending' object store.
        store.clear();
      })
    }
  };
}

// Listen for the application to come back online.
window.addEventListener('online', checkDatabase);