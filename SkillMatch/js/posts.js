import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import { getFirestore, 
         collection,
         getDocs,
         getDoc, 
         addDoc, 
         doc, 
         updateDoc, 
         increment, 
         arrayUnion, 
         arrayRemove } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

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

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dihfkfstr/image/upload";
const CLOUDINARY_PRESET = "skillMatch";

const postsContainer = document.getElementById("posts-container");
const createPostBtn = document.getElementById("create-post-btn");
const submitPostBtn = document.getElementById("submit-post-btn");
let currentUserId = null;

async function fetchUserData(userId) {
    const userRef = doc(db, "profile", userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;  
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        fetchPosts();
    } else {
        alert("Please log in to view and create posts.");
    }
});

async function fetchPosts() {
    postsContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
    try {
        const querySnapshot = await getDocs(collection(db, "posts"));
        postsContainer.innerHTML = "";

        for (const docSnap of querySnapshot.docs) {
            const post = docSnap.data();
            const isLikedByUser = post.likedBy && post.likedBy.includes(currentUserId);

            const recentCommentsHTML = (post.comments || [])
                .slice(-3)
                .reverse()
                .map(comment => {
                    const canDelete = (comment.userId === currentUserId);
                    return `
                        <li class="list-group-item d-flex justify-content-between">
                            <span><strong>${comment.userName}:</strong> ${comment.text}</span>
                            ${
                                canDelete
                                    ? `<button class="btn btn-sm btn-light delete-comment-btn" data-post-id="${docSnap.id}" data-comment-text="${encodeURIComponent(comment.text)}"><i class="bi bi-trash-fill"></i></button>`
                                    : ""
                            }
                        </li>
                    `;
                })
                .join("");

            const maxDescriptionLength = 100;
            const isLongDescription = post.description.length > maxDescriptionLength;
            const truncatedDescription = isLongDescription
                ? post.description.slice(0, maxDescriptionLength) + "..."
                : post.description;

            const postHTML = `
                <div class="card mb-3 shadow-sm" style="max-width: 780px; margin: auto;">
                    <img src="${post.imageUrl}" class="card-img-top" alt="${post.title}" style="height: 480px; object-fit: cover;">
                    <div class="card-body">
                        <h3 class="post-name text-success" style=" padding: 2px; font-weight:600;">${post.userName}</h3>
                        <h5 class="card-title text-danger">"${post.title}"</h5>
                        <p class="card-text" id="description-${docSnap.id}">
                            ${truncatedDescription}
                            ${isLongDescription ? `<button class="btn btn-link read-more-btn" data-id="${docSnap.id}" data-full="${encodeURIComponent(post.description)}">Read More</button>` : ""}
                        </p>
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-outline-primary like-btn" data-id="${docSnap.id}" data-liked="${isLikedByUser}">
                                <i class="bi bi-hand-thumbs-up"></i> Like (${post.likes || 0})
                            </button>
                            <button class="btn btn-outline-secondary comment-toggle-btn" data-id="${docSnap.id}">
                                <i class="bi bi-chat"></i> Comment
                            </button>
                        </div>
                        <div class="comments-section mt-3" id="comments-${docSnap.id}" style="display: none;">
                            <ul class="list-group mb-2">${recentCommentsHTML}</ul>
                            ${
                                (post.comments || []).length > 3
                                    ? `<button class="btn btn-link view-all-comments-btn" data-id="${docSnap.id}">View All Comments</button>`
                                    : ""
                            }
                            <textarea class="form-control mb-2" placeholder="Add a comment"></textarea>
                            <button class="btn btn-primary submit-comment-btn" data-id="${docSnap.id}">Post Comment</button>
                        </div>
                    </div>
                </div>`;

            postsContainer.innerHTML += postHTML;
        }

        attachEventListeners();
    } catch (error) {
        console.error("Error fetching posts:", error);
        postsContainer.innerHTML = "<p>Error loading posts. Please try again later.</p>";
    }
}

async function createPost() {
    const postModal = bootstrap.Modal.getInstance(document.getElementById("postModal"));
    postModal.hide();
    const title = document.getElementById("post-title").value.trim();
    const description = document.getElementById("post-description").value.trim();
    const file = document.getElementById("post-image-input").files[0];

    if (!title || !description || !file) {
        alert("All fields are required.");
        return;
    }

    try {
        let userName = auth.currentUser?.displayName || "Anonymous";
        if (userName === "Anonymous" && currentUserId) {
            const userData = await fetchUserData(currentUserId);
            if (userData) userName = userData.name || "Anonymous";
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_PRESET);

        const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
        const data = await response.json();

        if (!data.secure_url) throw new Error("Image upload failed");

        const postData = {
            userId: currentUserId,
            userName: userName,
            title,
            description,
            imageUrl: data.secure_url,
            likes: 0,
            likedBy: [],
            comments: [],
            createdAt: new Date(),
        };

        await addDoc(collection(db, "posts"), postData);
        alert("post sucessfully!")
        fetchPosts();
    } catch (error) {
        console.error("Error creating post:", error);
        alert("There was an error creating your post.");
    }
}

function attachEventListeners() {

    // Like Button Functionality
    document.querySelectorAll(".like-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
            const postId = event.currentTarget.getAttribute("data-id");
            const isLiked = event.currentTarget.getAttribute("data-liked") === "true";
            const postRef = doc(db, "posts", postId);

            try {
                await updateDoc(postRef, {
                    likes: isLiked ? increment(-1) : increment(1),
                    likedBy: isLiked ? arrayRemove(currentUserId) : arrayUnion(currentUserId),
                });
            } catch (error) {
                console.error(`Failed to update post with ID: ${postId}`, error);
            }
            

            fetchPosts();
        });
    });

// Comment Toggle Functionality
    document.querySelectorAll(".comment-toggle-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            const postId = event.currentTarget.getAttribute("data-id");
            const commentSection = document.getElementById(`comments-${postId}`);
            commentSection.style.display = commentSection.style.display === "none" ? "block" : "none";
        });
    });

    // Submit Comment Functionality
    document.querySelectorAll(".submit-comment-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
        const postId = event.currentTarget.getAttribute("data-id");
        const commentSection = document.getElementById(`comments-${postId}`);
        const commentInput = commentSection.querySelector("textarea").value.trim();

        if (!commentInput) return;

        let userName = auth.currentUser?.displayName || "Anonymous";
        let userId = currentUserId;
        
// Fetch user data from Firestore if displayName is not set
        if (userName === "Anonymous" && currentUserId) {
            const userData = await fetchUserData(currentUserId);
            if (userData) userName = userData.name || "Anonymous";
            }

        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            comments: arrayUnion({ userName, userId, text: commentInput })
        });
        fetchPosts(); 
    });
});

//Delete comment functionllity
    document.querySelectorAll(".delete-comment-btn").forEach(button => {
        button.addEventListener("click", async event => {
            const postId = event.currentTarget.getAttribute("data-post-id");
            const commentText = decodeURIComponent(event.currentTarget.getAttribute("data-comment-text"));
            
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const post = postSnap.data();
                const updatedComments = post.comments.filter(comment => comment.text !== commentText || comment.userId !== currentUserId);
                if (!confirm("Are you sure you want to delete this Comment?")) return;
                try {
                    await updateDoc(postRef, { comments: updatedComments });
                    fetchPosts(); 
                } catch (error) {
                    console.error("Error deleting comment:", error);
                }
            } else {
                console.error("Post not found:", postId);
            }
        });
    });


// View All Comments and Show Less Toggle
document.querySelectorAll(".view-all-comments-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
        const postId = event.currentTarget.getAttribute("data-id");
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
            const post = postSnap.data();
            const commentSection = document.getElementById(`comments-${postId}`);
            const commentList = commentSection.querySelector("ul");
            const viewAllButton = commentSection.querySelector(".view-all-comments-btn");

            if (viewAllButton.innerText === "View All Comments") {
                const allCommentsHTML = post.comments.map(comment => `
                    <li class="list-group-item"><strong>${comment.userName}:</strong> ${comment.text}</li>
                `).join("");

                commentList.innerHTML = allCommentsHTML;

                viewAllButton.innerText = "Show Less";
            } else {
                const recentCommentsHTML = post.comments
                    .slice(-3)
                    .reverse()
                    .map(comment => `
                        <li class="list-group-item"><strong>${comment.userName}:</strong> ${comment.text}</li>
                    `).join("");

                commentList.innerHTML = recentCommentsHTML;
                
                viewAllButton.innerText = "View All";
            }
        } else {
            console.error("Post not found:", postId);
        }
    });
});
            attachReadMoreListeners();
}

function attachReadMoreListeners() {
    document.querySelectorAll(".read-more-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            const postId = button.getAttribute("data-id");
            const fullText = decodeURIComponent(button.getAttribute("data-full")); 
            const descriptionElement = document.getElementById(`description-${postId}`);
            const isExpanded = button.innerText === "Show Less";

            if (isExpanded) {
                const truncatedText = fullText.slice(0, 100) + "...";
                descriptionElement.innerHTML = `
                    <span>${truncatedText}</span>
                    <button class="btn btn-link read-more-btn" data-id="${postId}" data-full="${encodeURIComponent(fullText)}">Read More</button>
                `;
            } else {
                descriptionElement.innerHTML = `
                    <div>${fullText}</div>
                    <button class="btn btn-link read-more-btn" data-id="${postId}" data-full="${encodeURIComponent(fullText)}">Show Less</button>
                `;
            }

            attachReadMoreListeners();
        });
    });
}

createPostBtn.addEventListener("click", () => {
    const postModal = new bootstrap.Modal(document.getElementById("postModal"));
    postModal.show();
});

submitPostBtn.addEventListener("click", createPost);