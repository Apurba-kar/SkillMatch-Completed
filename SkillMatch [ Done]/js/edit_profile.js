import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import { getFirestore,
         doc,
         setDoc, 
         getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import { getAuth, 
         onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA_c4U7uOv6cOcotBooD-zBniMEHzyYSmA",
    authDomain: "skillmatch-24689.firebaseapp.com",
    projectId: "skillmatch-24689",
    storageBucket: "skillmatch-24689.appspot.com",
    messagingSenderId: "168430588610",
    appId: "1:168430588610:web:d99323c5649d64ab78215b"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const profilePhoto = document.getElementById("profile-photo");
const profileName = document.getElementById("profile-name");
const profileTitle = document.getElementById("profile-title");
const aboutMe = document.getElementById("about-me");
const skills = document.getElementById("skills");
const contactEmail = document.getElementById("contact-email");
const contactPhone = document.getElementById("contact-phone");
const projectInterests = document.getElementById("project-interests");
const availabilityToggle = document.getElementById("availability-toggle");
const saveProfileBtn = document.getElementById("save-profile-btn");

const uploadPhotoBtn = document.getElementById("upload-photo-btn");
const profilePhotoInput = document.getElementById("profile-photo-input");

const loadingSpinner = document.getElementById("loading-spinner");

let currentUserId = null;

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dihfkfstr/image/upload";
const CLOUDINARY_PRESET = "skillMatch";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        loadUserProfile(currentUserId);
    } else {
        alert("Please log in to edit your profile.");
    }
});

async function loadUserProfile(userId) {
    try {
        showLoading();
        const userDoc = await getDoc(doc(db, "profile", userId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            profilePhoto.src = data.profilePhoto || "../images/default_profile.png";
            profileName.value = data.name || "";
            profileTitle.value = data.title || "";
            aboutMe.value = data.aboutMe || "";
            skills.value = data.skills?.join(", ") || "";
            contactEmail.value = data.email || "";
            contactPhone.value = data.phone || "";
            projectInterests.value = data.projectInterests || "";
            availabilityToggle.checked = data.isAvailable || false;
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    } finally {
        hideLoading();
    }
}

async function saveUserProfile() {
    if (!currentUserId) {
        alert("User not authenticated.");
        return;
    }

    const profileData = {
        name: profileName.value.trim(),
        title: profileTitle.value.trim(),
        aboutMe: aboutMe.value.trim(),
        skills: skills.value.split(",").map(skill => skill.trim()),
        email: contactEmail.value.trim(),
        phone: contactPhone.value.trim(),
        projectInterests: projectInterests.value.trim(),
        isAvailable: availabilityToggle.checked
    };

    if (validateProfileData(profileData)) {
        try {
            await setDoc(doc(db, "profile", currentUserId), profileData, { merge: true });
            window.location.href = "profile.html";
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("There was an error saving your profile. Please try again.");
        }
    }
}

function validateProfileData(data) {
    if (!data.name) {
        alert("Name is required.");
        return false;
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        alert("Please enter a valid email address.");
        return false;
    }
    return true;
}

uploadPhotoBtn.addEventListener("click", () => profilePhotoInput.click());
profilePhotoInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    try {
        showLoading();
        const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
        const data = await response.json();
        if (data.secure_url) {
            profilePhoto.src = data.secure_url;
            await setDoc(doc(db, "profile", currentUserId), { profilePhoto: data.secure_url }, { merge: true });
        } else {
            alert("Error uploading photo.");
        }
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Error uploading photo.");
    } finally {
        hideLoading();
    }
});

function showLoading() {
    loadingSpinner.classList.remove("d-none");
}

function hideLoading() {
    loadingSpinner.classList.add("d-none");
}


saveProfileBtn.addEventListener("click", saveUserProfile);
