let db;
// create a new db request for a "BudgetDB" database.
const request = window.indexedDB.open("BudgetDB", 1);

request.onupgradeneeded = function (event) {
  // create object store called "BudgetStore" and set autoIncrement to true
  db = event.target.result;
  const budgetStore = db.createObjectStore("BudgetStore", {
    autoIncrement: true
  });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event);
};

function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  // access your pending object store
  const budgetStore = transaction.objectStore("BudgetStore");
  // add record to your store with add method.
  console.log(record);
  budgetStore.add(record);
}

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  // access your pending object store
  const budgetStore = transaction.objectStore("BudgetStore");
  const getCursorRequest = budgetStore.openCursor();
  // access your pending object store
  // get all records from store and set to a variable
  const getAll = getCursorRequest.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      console.log(cursor.value);
      cursor.continue();
    } else {
      console.log("No documents left!");
    }
  };

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          // access your pending object store
          // clear all items in your store
          budgetStore.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
