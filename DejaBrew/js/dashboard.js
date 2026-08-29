import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const userName = document.getElementById("userName");
const userRole = document.getElementById("userRole");


// ==========================================
// AUTHENTICATION CHECK
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }


    // Display Firebase account name
    userName.textContent =
        user.displayName || user.email;


    // Get role from Firestore
    try {

        const userDoc =
            await getDocs(
                collection(db, "users")
            );

        let role = "Staff";

        userDoc.forEach((doc) => {

            if (doc.id === user.uid) {

                role =
                    doc.data().role || "staff";

            }

        });

        userRole.textContent =
            role.charAt(0).toUpperCase()
            + role.slice(1);

    } catch (error) {

        console.error(
            "Unable to get user role:",
            error
        );

    }

});


// ==========================================
// LOGOUT
// ==========================================

const logoutBtn =
    document.getElementById("logoutBtn");

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(error);

        }

    }
);


// ==========================================
// MOBILE SIDEBAR
// ==========================================

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");


menuBtn.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle("active");

        sidebarOverlay.classList.toggle(
            "active"
        );

    }
);


sidebarOverlay.addEventListener(
    "click",
    () => {

        sidebar.classList.remove("active");

        sidebarOverlay.classList.remove(
            "active"
        );

    }
);