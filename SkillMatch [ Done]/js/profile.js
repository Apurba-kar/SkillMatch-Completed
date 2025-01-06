import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import { getFirestore,
         doc,
         getDoc,
         collection,
         getDocs,
         query,
         where,
         deleteDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

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
const projectInterests = document.getElementById("project-interests");
const availability = document.getElementById("availability");
const contactInfo = document.getElementById("contact-info");
const postsList = document.getElementById("posts-list");
const loadingAnimation = document.getElementById("loading-animation");

const allPosts = [];

function showLoading() {
    loadingAnimation.style.display = "block";
}
function hideLoading() {
    loadingAnimation.style.display = "none";
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userId = user.uid;
        try {
            showLoading();
            const profileDoc = await getDoc(doc(db, "profile", userId));
            if (profileDoc.exists()) {
                const profileData = profileDoc.data();
                const isAvailable = profileData.isAvailable ? "Available" : "Not Available";
                const availabilityClass = profileData.isAvailable ? "text-success" : "text-danger";

                profilePhoto.src = profileData.profilePhoto || "/images/default_profile.png";
                profileName.innerHTML = `<strong>Name:</strong> ${profileData.name || "No Name"}`;
                profileTitle.innerHTML = `<strong>Title:</strong> ${profileData.title || "No Title"}`;
                aboutMe.innerHTML = `<strong>About Me:</strong> ${profileData.aboutMe || "No About Me information."}`;
                skills.innerHTML = `<strong>Skills:</strong> ${profileData.skills?.join(", ") || "No Skills"}`;
                projectInterests.innerHTML = `<strong>Project Interests:</strong> ${profileData.projectInterests || "None"}`;
                availability.innerHTML = `<strong>Availability:</strong> <span class="${availabilityClass}">${isAvailable}</span>`;
                contactInfo.innerHTML = `
                    <strong>Phone:</strong> ${profileData.phone || "Not Provided"}<br>
                    <strong>Email:</strong> ${profileData.email || "Not Provided"}
                `;
            }
            await fetchPosts(userId);
        } catch (error) {
            console.error("Error loading profile or posts:", error);
            alert("Error loading profile or posts. Please try again.");
        } finally {
            hideLoading();
        }
    } else {
        console.log("User not logged in.");
        window.location.href = "login.html"; 
    }
});

document.getElementById("edit-profile-btn").addEventListener("click", () => {
    window.location.href = "edit_profile.html";
});


async function fetchPosts(userId) {
    try {
        showLoading();
        const q = query(collection(db, "posts"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        postsList.innerHTML = ""; 
        allPosts.length = 0; 
        querySnapshot.forEach((docSnapshot) => {
            const post = docSnapshot.data();
            const postId = docSnapshot.id; 
            post.id = postId; 
            allPosts.push(post);

            postsList.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card" data-id="${postId}">
                        <img src="${post.imageUrl}" class="card-img-top" alt="${post.title}">
                        <div class="card-body">
                            <h5 class="card-title">${post.title}</h5>
                            <button class="btn btn-danger btn-sm delete-post-btn" data-id="${postId}"><i class="bi bi-trash-fill"></i></button>
                        </div>
                    </div>
                </div>`;
        });

        // Add event listeners to all delete buttons
        document.querySelectorAll(".delete-post-btn").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                const postId = event.target.getAttribute("data-id");
                deletePost(postId, userId);
            });
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        alert("Error fetching posts. Please try again.");
    } finally {
        hideLoading();
    }
}

// Delete Post Function
async function deletePost(postId, userId) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
        showLoading();
        await deleteDoc(doc(db, "posts", postId));
        await fetchPosts(userId);
    } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete the post. Please try again.");
    } finally {
        hideLoading();
    }
}

document.getElementById("posts-list").addEventListener("click", function (event) {
    const postCard = event.target.closest(".card");
    if (!postCard) return;

    const postId = postCard.getAttribute("data-id");
    const post = allPosts.find(p => p.id === postId);

    if (post) {
        document.getElementById("post-detail-title").innerText = post.title;
        document.getElementById("post-detail-description").innerText = post.description;
        document.getElementById("post-detail-image").src = post.imageUrl;
        document.getElementById("post-detail-likes").innerText = post.likes || 0;

        const commentsContainer = document.getElementById("post-detail-comments");
        commentsContainer.innerHTML = "";

        const visibleComments = 2; 
        if (post.comments && post.comments.length > 0) {
            post.comments.slice(0, visibleComments).forEach(comment => {
                const commentElement = document.createElement("div");
                commentElement.className = "comment mb-2";
                commentElement.innerHTML = `
                    <strong>${comment.userName}</strong>: ${comment.text}`;
                commentsContainer.appendChild(commentElement);
            });

            if (post.comments.length > visibleComments) {
                const showMoreButton = document.createElement("button");
                showMoreButton.className = "btn btn-link btn-sm";
                showMoreButton.innerText = "Show More Comments";
                showMoreButton.addEventListener("click", () => {
                    post.comments.slice(visibleComments).forEach(comment => {
                        const commentElement = document.createElement("div");
                        commentElement.className = "comment mb-2";
                        commentElement.innerHTML = `
                            <strong>${comment.userName}</strong>: ${comment.text}`;
                        commentsContainer.appendChild(commentElement);
                    });
                    showMoreButton.style.display = "none"; 
                });
                commentsContainer.appendChild(showMoreButton);
            }
        } else {
            commentsContainer.innerHTML = "<p>No comments yet.</p>";
        }

        const modal = new bootstrap.Modal(document.getElementById("postDetailModal"));
        modal.show();
    }
});
