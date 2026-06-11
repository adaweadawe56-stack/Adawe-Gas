// orderTracking.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
 const firebaseConfig = {
  apiKey: "AIzaSyBVhASqIXG5OaVk1nr8c3hZ-_liTg1UIsw",
  authDomain: "adawe-gas-system-82187.firebaseapp.com",
  projectId: "adawe-gas-system-82187",
  storageBucket: "adawe-gas-system-82187.appspot.com",
  messagingSenderId: "644303663526",
  appId: "1:644303663526:web:bacf9e5db0d7787f705f67"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Elements
const orderIdInput =
document.getElementById("orderIdInput");

const trackBtn =
document.getElementById("trackBtn");

const orderStatus =
document.getElementById("orderStatus");

const historyBtn =
document.getElementById("historyBtn");

const historyPhone =
document.getElementById("historyPhone");

const historyResults =
document.getElementById("historyResults");

const receiptBox =
document.getElementById("receiptBox");

let unsubscribe = null;

trackBtn.addEventListener("click", async () => {

  const orderId = orderIdInput.value.trim();

  if (!orderId) {
    orderStatus.innerText = "Please Enter Order ID.";
    return;
  }

  if (unsubscribe) {
    unsubscribe();
  }

  const q = query(
    collection(db, "orders"),
    where("orderId", "==", orderId)
  );

  unsubscribe = onSnapshot(q, (snap) => {

   if (snap.empty) {

  orderStatus.innerText =
  "Order ID-kan lama helin!";

  receiptBox.innerHTML = "";

  document.getElementById(
    "progressTracker"
  ).innerHTML = "";

  return;
}

   const data = snap.docs[0].data();

    let progressHtml = `
<div style="display:flex;
justify-content:space-between;
margin:20px 0;
font-size:14px;
font-weight:bold;">

<span style="
color:${
["Pending","Accepted","On The Way","Delivered"]
.includes(data.status)
? "green"
: "gray"
}">
Pending
</span>

<span style="
color:${
["Accepted","On The Way","Delivered"]
.includes(data.status)
? "green"
: "gray"
}">
Accepted
</span>

<span style="
color:${
["On The Way","Delivered"]
.includes(data.status)
? "green"
: "gray"
}">
On The Way
</span>

<span style="
color:${
data.status === "Delivered"
? "green"
: "gray"
}">
Delivered
</span>

</div>
`;

document.getElementById(
"progressTracker"
).innerHTML = progressHtml;

historyPhone.value = data.phone || "";
historyBtn.click();

let badgeColor = "#6c757d";

    if(data.status === "Accepted")
      badgeColor = "#0d6efd";

    if(data.status === "On The Way")
      badgeColor = "#ffc107";

    if(data.status === "Delivered")
      badgeColor = "#198754";

    if(data.status === "Rejected")
      badgeColor = "#dc3545";

    orderStatus.innerHTML = `
      <div class="card p-3 mt-3">

        <h4>Order Details</h4>

        <p><strong>Seller:</strong> ${data.seller || "-"}</p>

        <p><strong>Name:</strong> ${data.name}</p>

        <p><strong>Phone:</strong> ${data.phone}</p>

        <p><strong>Brand:</strong> ${data.brand}</p>

        <p><strong>Quantity:</strong> ${data.quantity}</p>

        <p><strong>Location:</strong> ${data.location}</p>

        <p>
          <strong>Status:</strong>

          <span style="
            background:${badgeColor};
            color:white;
            padding:5px 10px;
            border-radius:20px;
          ">
            ${data.status}
          </span>

        </p>

      </div>
    `;
if(data.status === "Delivered"){

  receiptBox.innerHTML = `
  <div class="card p-3 mt-3">

    <h4>Delivery Receipt</h4>

    <p><strong>Order ID:</strong> ${data.orderId}</p>

    <p><strong>Customer:</strong> ${data.name}</p>

    <p><strong>Seller:</strong> ${data.seller || "-"}</p>

    <p><strong>Brand:</strong> ${data.brand}</p>

    <p><strong>Quantity:</strong> ${data.quantity}</p>

    <p><strong>Status:</strong> Delivered</p>

    <p><strong>Date:</strong>
    ${
      data.createdAt
      ? data.createdAt.toDate().toLocaleString()
      : "-"
    }
    </p>

    <button
      onclick="window.print()"
      class="btn btn-success mt-2">
      Print Receipt
    </button>

  </div>
  `;

}else{

  receiptBox.innerHTML = "";

}
  });

});
const params = new URLSearchParams(window.location.search);

const id = params.get("id");

if(id){
  orderIdInput.value = id;
  trackBtn.click();
  }
  historyBtn.addEventListener(
"click",
async () => {

  const phone =
  historyPhone.value.trim();

  if(!phone){
    alert("Enter phone number");
    return;
  }

  const q = query(
    collection(db,"orders"),
    where("phone","==",phone)
  );

  const snap =
  await getDocs(q);

  if(snap.empty){

    historyResults.innerHTML =
    "<p>No orders found</p>";

    return;
  }

  let html = "";

  const docs = snap.docs.reverse();

  docs.forEach(docSnap => {

    const o = docSnap.data();

    let badgeColor = "#6c757d";

    if(o.status === "Accepted")
      badgeColor = "#0d6efd";

    if(o.status === "On The Way")
      badgeColor = "#ffc107";

    if(o.status === "Delivered")
      badgeColor = "#198754";

    if(o.status === "Rejected")
      badgeColor = "#dc3545";

    html += `
    <div class="card p-3 mt-2">

      <b>${o.orderId}</b>

      <p><strong>Seller:</strong> ${o.seller || "-"}</p>

      <p><strong>Brand:</strong> ${o.brand}</p>

      <p><strong>Quantity:</strong> ${o.quantity}</p>

      <p>
        <strong>Date:</strong>
        ${
          o.createdAt
          ? o.createdAt.toDate().toLocaleString()
          : "-"
        }
      </p>

      <p>
        <span style="
          background:${badgeColor};
          color:white;
          padding:5px 10px;
          border-radius:20px;
        ">
          ${o.status}
        </span>
      </p>

    </div>
    `;

  });

  historyResults.innerHTML = html;

});
