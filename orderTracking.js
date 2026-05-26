import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVhASqIXG5OaVk1nr8c3hZ-_liTg1UIsw",
  authDomain: "adawe-gas-system-82187.firebaseapp.com",
  projectId: "adawe-gas-system-82187",
  storageBucket: "adawe-gas-system-82187.appspot.com",
  messagingSenderId: "644303663526",
  appId: "1:644303663526:web:bacf9e5db0d7787f705f67"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.trackOrder = function () {
  const orderId = document.getElementById("orderIdInput").value;
  const result = document.getElementById("result");

  if (!orderId) {
    result.innerHTML = "Please enter Order ID.";
    return;
  }

  const ref = doc(db, "orders", orderId);

  onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      result.innerHTML = "❌ Order not found.";
      return;
    }

    const data = snap.data();

    result.innerHTML = `
      <p><b>Item:</b> ${data.item}</p>
      <p><b>Amount:</b> ${data.amount} Ksh</p>
      <p><b>Seller:</b> ${data.sellerId}</p>
      <p class="status">Status: ${data.status}</p>
    `;
  });
};
