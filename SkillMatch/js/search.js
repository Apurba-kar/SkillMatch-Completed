import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import { getAuth, 
         onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { getFirestore,
         collection,
         getDocs,
         getDoc,
         query,
         where,
         addDoc,
         doc, 
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


let currentPage = 1;
const itemsPerPage = 4;
let allProfiles = [];
let filteredProfiles = [];

function updatePaginationControls() {
    const prevButton = document.getElementById("prev-page-button");
    const nextButton = document.getElementById("next-page-button");
    const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

    if (currentPage > 1) {
        prevButton.disabled = false;
    } else {
        prevButton.disabled = true;
    }

    if (currentPage < totalPages) {
        nextButton.disabled = false;
    } else {
        nextButton.disabled = true;
    }

    const pageInfo = document.getElementById("page-info");
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}
document.getElementById("skill-filter").addEventListener("change", performSearch);

async function getProfiles() {
    const loadingSpinner = document.getElementById("loading-spinner");
    try {
        loadingSpinner.classList.remove("d-none");
        const querySnapshot = await getDocs(collection(db, "profile"));
        const profiles = [];
        const skillSet = new Set();
        const user = await getCurrentUser();

        querySnapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() };

            if (data.id === user?.uid || data.email === user?.email) return;

            profiles.push(data);

            if (Array.isArray(data.skills)) {
                data.skills.forEach(skill => skillSet.add(skill));
            }
        });

        populateSkillFilter(Array.from(skillSet));
        return profiles;
        
    } catch (error) {
        console.error("Error fetching profiles:", error);
        alert("Failed to fetch profiles. Please try again.");
        return [];
    }finally {
        loadingSpinner.classList.add("d-none");
    }
}

function populateSkillFilter(skills) {
    const skillFilter = document.getElementById("skill-filter");
    skillFilter.innerHTML = '<option value="all">All Skills</option>';

    skills.forEach(skill => {
        const option = document.createElement("option");
        option.value = skill.toLowerCase(); 
        option.textContent = skill;
        skillFilter.appendChild(option);
    });
}


async function performSearch() {
    const searchInput = document.getElementById("search-input").value.trim().toLowerCase();
    const selectedSkill = document.getElementById("skill-filter").value.toLowerCase();
    const profilesContainer = document.getElementById("profiles-container");
    profilesContainer.innerHTML = "";
    if (allProfiles.length === 0) {
        
        allProfiles = await getProfiles();
        
    }

    filteredProfiles = allProfiles.filter(profile => {
        const name = (profile.name || "").toLowerCase();
        const title = (profile.title || "").toLowerCase();
        const skills = profile.skills ? profile.skills.map(skill => skill.toLowerCase()) : [];
        const projectInterests = (profile.projectInterests || "").toLowerCase();

        const matchesSearch = (
            name.includes(searchInput) ||
            title.includes(searchInput) ||
            projectInterests.includes(searchInput) ||
            skills.join(" ").includes(searchInput)
        );

        const matchesSkillFilter = (
            selectedSkill === "all" || skills.includes(selectedSkill)
        );
        return matchesSearch && matchesSkillFilter;
        
    });

    if (filteredProfiles.length === 0) {
        profilesContainer.innerHTML = "<p>No profiles found.</p>";
    } else {
        currentPage = 1; 
        displayProfiles();
    }
}

function displayProfiles() {
    const profilesContainer = document.getElementById("profiles-container");
    profilesContainer.innerHTML = "";

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);

    paginatedProfiles.forEach(profile => {
        const isAvailable = profile.isAvailable ? "Available" : "Not Available";
        const availabilityClass = profile.isAvailable ? "text-success" : "text-danger";

        const profileCard = document.createElement("div");
        profileCard.className = "profile-card d-flex align-items-center p-3 rounded  mb-3";
        profileCard.style.minWidth = "300px"; 
        profileCard.style.border = "2px solid #ffffff";
        profileCard.style.boxShadow = "0 5px 10px #333333";
         

        profileCard.innerHTML = `
            <!-- Profile Photo Section -->
            <div class="d-flex flex-column justify-content-center text-center" style="flex: 1; padding: 10px;">
                <img 
                    src="${profile.profilePhoto}" 
                    alt="${profile.name}" 
                    class="img-fluid rounded-circle mx-auto"
                    style="width: 150px; height: 150px; object-fit: cover;">
            </div>
            
            <!-- Profile Details Section -->
            <div class="d-flex flex-column justify-content-center" style="flex: 2; padding: 10px;">
                <h5 class="mb-2"><u><b>${profile.name}</b></u></h5>
                <p class="mb-1"><strong>Title:</strong> ${profile.title}</p>
                <p class="mb-1"><strong>Phone:</strong> ${profile.phone}</p>
                <p class="mb-1"><strong>Email:</strong> ${profile.email}</p>
                <p class="mb-1"><strong>Skills:</strong> ${profile.skills ? profile.skills.join(", ") : "N/A"}</p>
                <p class="mb-1"><strong>Project Interests:</strong> ${profile.projectInterests}</p>
                <p class="mb-1"><strong>Availability Status:</strong> <span class="${availabilityClass}">${isAvailable}</span></p>
                <button class="btn btn-primary mt-3 chat-button" onclick="openChat('${profile.id}', '${profile.name}')">
                    <i class="bi bi-chat-dots"></i> Chat
                </button>
            </div>
        `;
        profilesContainer.appendChild(profileCard);
    });

    updatePaginationControls();
}


window.openChat = async function (profileId, profileName) {
    const user = await getCurrentUser();
    if (!user) {
        alert("Please log in to chat.");
        return;
    }

    const userId = user.uid;
    const usersRef = doc(db, "profile", userId); 
    let userName = "Anonymous";

    try {
        const userDoc = await getDoc(usersRef); 
        if (userDoc.exists()) {
            userName = userDoc.data().name || "Anonymous";
        } else {
            console.warn("User document not found. Using default name.");
        }
    } catch (error) {
        console.error("Error fetching user name:", error);
    }

    const conversationsRef = collection(db, "conversations");
    const q = query(
        conversationsRef,
        where("participants", "array-contains", userId)
    );

    const querySnapshot = await getDocs(q);
    let conversationId = null;

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(profileId)) {
            conversationId = doc.id;
        }
    });

    if (!conversationId) {
        const newConversation = {
            participants: [userId, profileId],
            participantDetails: {
                [userId]: { name: userName },
                [profileId]: { name: profileName },
            },
            timestamp: Timestamp.now(),
        };
        try {
            const docRef = await addDoc(conversationsRef, newConversation);
            conversationId = docRef.id;
        } catch (error) {
            console.error("Error adding document:", error);
            return;
        }
    }
    const encodedName = encodeURIComponent(profileName);
    window.location.href = `chat_window.html?conversationId=${conversationId}&name=${encodedName}`;
};


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


document.getElementById("search-button").addEventListener("click", performSearch);
document.getElementById("prev-page-button").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        displayProfiles();
    }
});
document.getElementById("next-page-button").addEventListener("click", () => {
    if (currentPage * itemsPerPage < filteredProfiles.length) {
        currentPage++;
        displayProfiles();
    }
});


(async function initialize() {
    const user = await getCurrentUser();

    if (user) {
        allProfiles = await getProfiles();
        filteredProfiles = allProfiles;
        displayProfiles();
    } else {
        console.log("No user is logged in.");
        alert("Please log in to view profiles.");
    }
})();

