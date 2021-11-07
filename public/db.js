// let db;
// // create a new db request for a "BudgetDB" database.
// const request = window.indexedDB.open("BudgetDB", 1);

// request.onupgradeneeded = function (event) {
//   // create object store called "BudgetStore" and set autoIncrement to true
//   db = event.target.result;
//   const budgetStore = db.createObjectStore("BudgetStore", {
//     autoIncrement: true
//   });
// };



// request.onerror = function (event) {
//   // log error here
//   console.log(event);
// };

// function saveRecord(record) {
//   // create a transaction on the pending db with readwrite access
//   const transaction = db.transaction(["BudgetStore"], "readwrite");
//   // access your pending object store
//   const budgetStore = transaction.objectStore("BudgetStore");
//   // add record to your store with add method.
//   console.log(record);
//   budgetStore.add(record);
// }

// function checkDatabase() {
//   console.log("Inside CheckDatabase");
//   // open a transaction on your pending db
//   const transaction = db.transaction(["BudgetStore"], "readwrite");
//   // access your pending object store
//   const budgetStore = transaction.objectStore("BudgetStore");
//   const getCursorRequest = budgetStore.openCursor();
//   // access your pending object store
//   // get all records from store and set to a variable
//   // const getAll = getCursorRequest.onsuccess = e => {
//   //   const cursor = e.target.result;
//   //   if (cursor) {
//   //     console.log(cursor.value);
//   //     cursor.continue();
//   //   } else {
//   //     console.log("No documents left!");
//   //   }
//   // };

//   const getAll = budgetStore.getAll();

//   getAll.onsuccess = function () {
//     if (getAll.result.length > 0) {
//       fetch('/api/transaction/bulk', {
//         method: 'POST',
//         body: JSON.stringify(getAll.result),
//         headers: {
//           Accept: 'application/json, text/plain, */*',
//           'Content-Type': 'application/json',
//         },
//       })
//         .then((response) => response.json())
//         .then(() => {
//           // if successful, open a transaction on your pending db
//           // access your pending object store
//           // clear all items in your store
//           const transaction = db.transaction(["BudgetStore"], "readwrite");
//           // access your pending object store
//           const budgetStore = transaction.objectStore("BudgetStore");
//           budgetStore.clear();
//         });
//     }
//   };
// }
// request.onsuccess = function (event) {
//   db = event.target.result;
// console.log("Navigator:",navigator.onLine)
//   if (navigator.onLine) {
//     checkDatabase();
//   }
// };
// // listen for app coming back online
// document.addEventListener('online', checkDatabase);
let db;
let budgetVersion;

// Create a new db request for a "budget" database.
const request = indexedDB.open('BudgetDB', budgetVersion || 21);

request.onupgradeneeded = function (e) {
  console.log('Upgrade needed in IndexDB');

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log('check db invoked');

  // Open a transaction on your BudgetStore db
  let transaction = db.transaction(['BudgetStore'], 'readwrite');

  // access your BudgetStore object
  const store = transaction.objectStore('BudgetStore');

  // Get all records from store and set to a variable
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // If there are items in the store, we need to bulk add them when we are back online
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
        .then((res) => {
          // If our returned response is not empty
          if (res.length !== 0) {
            // Open another transaction to BudgetStore with the ability to read and write
            transaction = db.transaction(['BudgetStore'], 'readwrite');

            // Assign the current store to a variable
            const currentStore = transaction.objectStore('BudgetStore');

            // Clear existing entries because our bulk add was successful
            currentStore.clear();
            console.log('Clearing store 🧹');
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('Save record invoked');
  // Create a transaction on the BudgetStore db with readwrite access
  const transaction = db.transaction(['BudgetStore'], 'readwrite');

  // Access your BudgetStore object store
  const store = transaction.objectStore('BudgetStore');

  // Add record to your store with add method.
  store.add(record);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);
