// orderTracking.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  getDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc
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


if ("Notification" in window) {

  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }

}

let unsubscribe = null;
let currentOrder = null;

let map = null;
let sellerMarker = null;
let customerMarker = null;
let routingControl = null;

function calculateDistance(lat1, lon1, lat2, lon2){

  const R = 6371;

  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2) *
    Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));

  return R * c;

}

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
"Invalid Order ID!";
     
    receiptBox.innerHTML = "";

    document.getElementById(
        "progressTracker"
    ).innerHTML = "";

    document.getElementById("eta").innerHTML = "";
    document.getElementById("eta").style.display = "none";

    document.getElementById("liveMap").style.display = "none";

    return;
}
    
  const data = snap.docs[0].data();

currentOrder = data;

    // Previous status
const key = "order-status-" + data.orderId;

const previousStatus = sessionStorage.getItem(key);

console.log("Previous:", previousStatus);
console.log("Current:", data.status);

if (
    previousStatus &&
    previousStatus !== data.status &&
    Notification.permission === "granted"
) {

  let message = "";

  if (data.status === "Accepted") {
    message = "✅ Your order has been accepted.";
  }

  if (data.status === "On The Way") {
    message = "🚚 Your gas is on the way.";
  }

  if (data.status === "Delivered") {
    message = "🎉 Your order has been delivered.";
  }
   console.log("SHOW NOTIFICATION");

  if (message) {
    console.log(message);
   
    new Notification("Adawe Gas", {
      body: message,
      icon: "images/logo.png"
    });

  }

}
    
if (
    data.status === "On The Way" &&
    data.customerLatitude != null &&
    data.customerLongitude != null &&
    data.sellerLatitude != null &&
    data.sellerLongitude != null
)
{

    // ETA
    const distance = calculateDistance(
    data.customerLatitude,
    data.customerLongitude,
    data.sellerLatitude,
    data.sellerLongitude
);

const sellerSpeed = 30;

const eta = Math.ceil(
    distance / sellerSpeed * 60
);
document.getElementById("eta").innerHTML =
`🚚 ${distance.toFixed(1)} km away • ⏱ ETA ${eta} min`;

// LIVE MAP
document.getElementById("liveMap").style.display = "block";

if (!map) {

    map = L.map("liveMap").setView(
        [data.sellerLatitude, data.sellerLongitude],
        15
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "© OpenStreetMap"
        }
    ).addTo(map);

    // Seller Marker
    sellerMarker = L.marker([
        data.sellerLatitude,
        data.sellerLongitude
    ])
    .addTo(map)
    .bindPopup("Seller");

    // Customer Marker
    customerMarker = L.marker([
        data.customerLatitude,
        data.customerLongitude
    ])
    .addTo(map)
    .bindPopup("Customer");

    // BLUE ROUTE LINE
    routingControl = L.Routing.control({

        waypoints: [

            L.latLng(
                data.customerLatitude,
                data.customerLongitude
            ),

            L.latLng(
                data.sellerLatitude,
                data.sellerLongitude
            )

        ],

        routeWhileDragging:false,
        draggableWaypoints:false,
        addWaypoints:false,
        fitSelectedRoutes:true,
        showAlternatives:false,

        lineOptions:{
            styles:[{
                color:"blue",
                weight:5,
                opacity:0.8
            }]
        },

        createMarker:()=>null

    }).addTo(map);

    setTimeout(() => {
        map.invalidateSize();
    },100);

} else {

    if (sellerMarker) {

        sellerMarker.setLatLng([
            data.sellerLatitude,
            data.sellerLongitude
        ]);

    }

    if (customerMarker) {

        customerMarker.setLatLng([
            data.customerLatitude,
            data.customerLongitude
        ]);

    }

    if (routingControl) {

        routingControl.setWaypoints([

            L.latLng(
                data.customerLatitude,
                data.customerLongitude
            ),

            L.latLng(
                data.sellerLatitude,
                data.sellerLongitude
            )

        ]);

    }

    map.panTo([
        data.sellerLatitude,
        data.sellerLongitude
    ]);

}

} else {

    const etaBox = document.getElementById("eta");

    if (etaBox) {
        etaBox.innerHTML = "";
        etaBox.style.display = "none";
    }

    document.getElementById("liveMap").style.display = "none";

    if (routingControl && map) {
        map.removeControl(routingControl);
        routingControl = null;
    }

    if (sellerMarker && map) {
        map.removeLayer(sellerMarker);
        sellerMarker = null;
    }

    if (customerMarker && map) {
        map.removeLayer(customerMarker);
        customerMarker = null;
    }

    if (map) {
        map.remove();
        map = null;

        sellerMarker = null;
        customerMarker = null;
        routingControl = null;
    }

}
    
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
data.status==="Delivered"
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

let badgeColor = "#6c757d";

    if(data.status === "Accepted")
      badgeColor = "#0d6efd";

    if(data.status === "On The Way")
      badgeColor = "#ffc107";

    if(data.status === "Delivered")
      badgeColor = "#198754";

    if(data.status === "Rejected")
      badgeColor = "#dc3545";

    let statusMessage = "";

if (data.status === "Pending") {
  statusMessage = `
  <div class="alert alert-secondary mt-3">
    ⏳ <strong>Waiting for seller acceptance...</strong><br>
    Your order has been sent to the seller.
  </div>`;
}

if (data.status === "Accepted") {
  statusMessage = `
  <div class="alert alert-primary mt-3">
    ✅ <strong>Your order has been accepted.</strong>
  </div>`;
}

if (data.status === "On The Way") {
  statusMessage = `
  <div class="alert alert-warning mt-3">
    🚚 <strong>Your gas is on the way.</strong>
  </div>`;
}

if (data.status === "Delivered") {
  statusMessage = `
  <div class="alert alert-success mt-3">
    🎉 <strong>Order Delivered Successfully.</strong>
  </div>`;
}

if (data.status === "Rejected") {
  statusMessage = `
  <div class="alert alert-danger mt-3">
    ❌ <strong>Order Rejected.</strong>
  </div>`;
}

    orderStatus.innerHTML = `
      <div class="card p-3 mt-3">

        <h4>Order Details</h4>

        <p><strong>Seller:</strong> ${data.sellerName || data.seller || "-"}</p>

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

${statusMessage}

${data.status === "Accepted" ||
data.status === "On The Way" ||
data.status === "Delivered"
? `
<hr>

<div class="d-flex gap-2 flex-wrap">

  <a
    href="tel:${data.sellerPhone}"
    class="btn btn-primary">
    📞 Call Seller
  </a>

  <a
    href="https://wa.me/${data.sellerPhone.replace('+','')}"
    target="_blank"
    class="btn btn-success">
    💬 WhatsApp Seller
  </a>

</div>
`
: ""}

</div>
`;
    
if(data.status === "Delivered"){

  receiptBox.innerHTML = `
  <div class="card p-3 mt-3">

    <h4>Delivery Receipt</h4>

    <p><strong>Order ID:</strong> ${data.orderId}</p>

    <p><strong>Customer:</strong> ${data.name}</p>

    <p><strong>Seller:</strong> ${data.sellerName || data.seller || "-"}</p>

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
    <hr>

<h4>Rate Seller</h4>

<button onclick="rateSeller(1)">⭐</button>
<button onclick="rateSeller(2)">⭐⭐</button>
<button onclick="rateSeller(3)">⭐⭐⭐</button>
<button onclick="rateSeller(4)">⭐⭐⭐⭐</button>
<button onclick="rateSeller(5)">⭐⭐⭐⭐⭐</button>

<textarea
id="reviewText"
placeholder="Write your review..."
style="width:100%;margin-top:10px;"
></textarea>

<div id="ratingMessage"></div>

</div>
`;

}else{

  receiptBox.innerHTML = "";

}
    sessionStorage.setItem(key, data.status);
   },

(err) => {

        console.error("Snapshot Error:", err);

    }

);
  
const params = new URLSearchParams(window.location.search);

const id = params.get("id");

if(id){
  orderIdInput.value = id;
  trackBtn.click();
  }

async function loadHistory(phone){

    phone = formatKenyaPhone(phone);

    if(!phone) return;

    const q = query(
        collection(db,"orders"),
        where("phone","==",phone),
        orderBy("createdAt","desc")
    );

    const snap = await getDocs(q);

    if (snap.empty){

        historyResults.innerHTML =
        "<p>No orders found</p>";

        return;
    }

    let html = "";

    snap.docs.forEach(docSnap => {

        const o = docSnap.data();

        let badgeColor = "#6c757d";

        if(o.status==="Accepted")
            badgeColor="#0d6efd";

        if(o.status==="On The Way")
            badgeColor="#ffc107";

        if(o.status==="Delivered")
            badgeColor="#198754";

        if(o.status==="Rejected")
            badgeColor="#dc3545";

        html += `
    <div class="card p-3 mt-2">

      <b>${o.orderId}</b>

      <p><strong>Seller:</strong> ${o.sellerName || o.seller || "-"}</p>
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
}
  historyBtn.addEventListener("click", () => {

    loadHistory(historyPhone.value);

});

function formatKenyaPhone(phone){

  phone = phone.replace(/\s+/g,"");

  if(phone.startsWith("0")){
    return "+254" + phone.substring(1);
  }

  if(phone.startsWith("254")){
    return "+" + phone;
  }

  return phone;

}

window.rateSeller = async function(rating){

  const ratingQ = query(
    collection(db,"ratings"),
    where("orderId","==",currentOrder.orderId)
  );

  const ratingSnap =
  await getDocs(ratingQ);

  if(!ratingSnap.empty){
    alert("You already rated this order");
    return;
  }

  try{

    const review =
    document.getElementById("reviewText")?.value || "";

    console.log("sellerUid =", currentOrder.sellerUid);

await addDoc(
  collection(db,"ratings"),
  {
    sellerUid: currentOrder.sellerUid,
    sellerPhone: currentOrder.sellerPhone,
    customerName: currentOrder.name,
    orderId: currentOrder.orderId,
    rating,
    review,
    brand: currentOrder.brand,
    quantity: currentOrder.quantity,
    createdAt: serverTimestamp()
  }
);

const sellerRef =
  doc(db, "sellers", currentOrder.sellerId);

const sellerSnap =
  await getDoc(sellerRef);

if (sellerSnap.exists()) {

  const sellerData = sellerSnap.data();

  console.log("Seller found:", sellerSnap.id);
  console.log("Updating seller:", sellerSnap.id);
  console.log("Current ratings:", sellerData.totalRatings);
  console.log("Current average:", sellerData.averageRating);
  console.log("New rating:", rating);

  const totalRatings =
    (sellerData.totalRatings || 0) + 1;

  const averageRating =
    (
      ((sellerData.averageRating || 0) *
      (sellerData.totalRatings || 0))
      + rating
    ) / totalRatings;

  await updateDoc(sellerRef, {
    totalRatings,
    averageRating: parseFloat(averageRating.toFixed(2))
  });

  console.log("Seller updated successfully");
}
    
    document.getElementById("ratingMessage").innerHTML =
    "✅ Thanks for your rating!";

    document.querySelectorAll(
      'button[onclick^="rateSeller"]'
    ).forEach(btn => {
      btn.disabled = true;
    });

  }catch(err){

  console.error("Rating Error:", err);
  console.error("Error code:", err.code);
  console.error("Error message:", err.message);

  alert("Rating Error: " + err.message);

}

};
window.addEventListener("beforeunload", () => {

    if (unsubscribe) {
        unsubscribe();
    }

});
