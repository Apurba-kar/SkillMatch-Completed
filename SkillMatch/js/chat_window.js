import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import { getAuth,
         onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { getFirestore,
         doc,
          onSnapshot,
          updateDoc,
          arrayUnion,
          Timestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA_c4U7uOv6cOcotBooD-zBniMEHzyYSmA",
    authDomain: "skillmatch-24689.firebaseapp.com",
    projectId: "skillmatch-24689",
    storageBucket: "skillmatch-24689.appspot.com",
    messagingSenderId: "168430588610",
    appId: "1:168430588610:web:d99323c5649d64ab78215b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const urlParams = new URLSearchParams(window.location.search);
const conversationId = urlParams.get("conversationId");
const chatPartnerName = decodeURIComponent(urlParams.get("name"));

document.getElementById("chat-partner").textContent = chatPartnerName;

const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

const user = await getCurrentUser();
    if (!user) {
        alert("Please log in to chat.");
    }
const userId = user.uid;

let currentUserId = userId;

function loadMessages() {
    const conversationRef = doc(db, "conversations", conversationId);

    onSnapshot(conversationRef, (doc) => {
        const data = doc.data();
        chatMessages.innerHTML = "";
        data.messages?.forEach((message) => {
            const messageElement = document.createElement("div");
            messageElement.classList.add("chat-message");

            if (message.senderId === currentUserId) {
                messageElement.classList.add("sent");
            } else {
                messageElement.classList.add("received");
            }

            messageElement.textContent = message.text;
            chatMessages.appendChild(messageElement);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    const conversationRef = doc(db, "conversations", conversationId);

    try {
        await updateDoc(conversationRef, {
            messages: arrayUnion({
                text,
                senderId: userId,
                timestamp: Timestamp.now(),
            }),
        });
        chatInput.value = "";
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

function getCurrentUser() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user); 
            } else {
                resolve(null);
            }
        }, reject);
    });
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

loadMessages();
