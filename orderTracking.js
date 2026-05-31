// orderTracking.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
const orderIdInput = document.getElementById("orderIdInput");
const trackBtn = document.getElementById("trackBtn");
const orderStatus = document.getElementById("orderStatus");

// Button Click
trackBtn.addEventListener("click", async () => {
  const orderId = orderIdInput.value.trim();

  if (!orderId) {
    orderStatus.innerText = "Fadlan geli Order ID.";
    return;
  }

  const q = query(
  collection(db, "orders"),
  where("orderId", "==", orderId)
);

const snap = await getDocs(q);

if (snap.empty) {
  orderStatus.innerText = "Order ID-kan lama helin!";
  return;
}

const data = snap.docs[0].data();

orderStatus.innerText = `Order Status: ${data.status}`;                
});
