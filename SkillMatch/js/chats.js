import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

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

const chatsContainer = document.getElementById("chats-container");
const loadingSpinner = document.getElementById("loading-spinner");

function showLoading() {
    loadingSpinner.classList.remove("d-none");
}

function hideLoading() {
    loadingSpinner.classList.add("d-none");
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

async function loadChats() {
    showLoading();
    
    try {
        const user = await getCurrentUser();
        if (!user) {
            alert("Please log in to view your chats.");
            hideLoading();
            return;
        }

        const userId = user.uid;
        const conversationsRef = collection(db, "conversations");
        const q = query(conversationsRef, where("participants", "array-contains", userId));

        onSnapshot(q, (querySnapshot) => {
            chatsContainer.innerHTML = "<h2>Chats</h2>";

            if (querySnapshot.empty) {
                chatsContainer.innerHTML += "<p>No chats available.</p>";
                hideLoading();
                return;
            }

            querySnapshot.forEach((doc) => {
                const conversation = doc.data();
                const otherParticipantId = conversation.participants.find((id) => id !== userId);
                const profileName = conversation.participantDetails[otherParticipantId]?.name || "Unknown";

                const lastMessageObj = conversation.messages?.slice(-1)[0];
                const lastMessage = lastMessageObj ? lastMessageObj.text : "No messages yet";
                const lastMessageTime = lastMessageObj
                    ? new Date(lastMessageObj.timestamp.seconds * 1000).toLocaleString()
                    : "";

                const chatItem = document.createElement("div");
                chatItem.classList.add("chat-item");

                chatItem.innerHTML = `
                    <div>
                        <div class="profile-name">${profileName}</div>
                        <div class="last-message">${lastMessage}</div>
                    </div>
                    <div class="timestamp">${lastMessageTime}</div>
                `;
                chatItem.addEventListener("click", () => {
                    const encodedName = encodeURIComponent(profileName);
                    window.location.href = `chat_window.html?conversationId=${doc.id}&name=${encodedName}`;
                });

                chatsContainer.appendChild(chatItem);
            });

            hideLoading();
        });
    } catch (error) {
        console.error("Error loading chats:", error);
        hideLoading(); 
    }
}
loadChats();
