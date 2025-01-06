import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import { getAuth, 
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";



const firebaseConfig = {
    apiKey: "AIzaSyA_c4U7uOv6cOcotBooD-zBniMEHzyYSmA",
    authDomain: "skillmatch-24689.firebaseapp.com",
    projectId: "skillmatch-24689",
    storageBucket: "skillmatch-24689.firebasestorage.app",
    messagingSenderId: "168430588610",
    appId: "1:168430588610:web:d99323c5649d64ab78215b"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app);


const handleAuth = async (authFunc, redirectUrl, ...args) => {
    try {
        await authFunc(auth, ...args);
        window.location.href = redirectUrl;
    } catch (error) {
        console.error("Authentication Error: ", error.code, error.message);
        alert(`Error: ${error.message}`);
    }
};


document.querySelector('#signup-form form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    handleAuth(createUserWithEmailAndPassword,'main_Desh.html', email, password);
});


document.querySelector('#login-form form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    handleAuth(signInWithEmailAndPassword, 'main_Desh.html', email, password);
});


const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            if (confirm("Are you sure you want to log out?")) {
                await signOut(auth);
                window.location.href = "index.html";
            }
        } catch (error) {
            console.error("Logout Error: ", error.message);
            alert(`Error logging out: ${error.message}`);
        }
    });
}
