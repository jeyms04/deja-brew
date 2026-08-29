import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ==========================================
// REGISTER
// ==========================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const fullname =
            document.getElementById("fullname").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("registerMessage");


        try {

            // Create Firebase Authentication account
            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;


            // Set user's display name
            await updateProfile(user, {
                displayName: fullname
            });


            // Create user document in Firestore
            await setDoc(
                doc(db, "users", user.uid),
                {
                    uid: user.uid,
                    fullname: fullname,
                    email: email,
                    role: "staff",
                    createdAt: serverTimestamp()
                }
            );


            // Success message
            message.textContent =
                "Account created successfully!";

            message.className =
                "success-message";


            // Go to dashboard
            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 1000);


        } catch (error) {

            console.error(
                "REGISTRATION ERROR:",
                error
            );


            let errorMessage =
                "Unable to create account.";


            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                errorMessage =
                    "This email is already registered.";

            }

            else if (
                error.code ===
                "auth/weak-password"
            ) {

                errorMessage =
                    "Password must be at least 6 characters.";

            }

            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                errorMessage =
                    "Please enter a valid email.";

            }

            else if (
                error.code ===
                "auth/operation-not-allowed"
            ) {

                errorMessage =
                    "Email/Password authentication is not enabled.";

            }

            else if (
                error.code ===
                "auth/unauthorized-domain"
            ) {

                errorMessage =
                    "This website is not authorized in Firebase.";

            }

            else if (
                error.code ===
                "permission-denied"
            ) {

                errorMessage =
                    "Firestore permission denied. Check your Security Rules.";

            }

            else {

                errorMessage =
                    error.code +
                    " - " +
                    error.message;

            }


            message.textContent =
                errorMessage;

            message.className =
                "error-message";

        }

    });

}


// ==========================================
// LOGIN
// ==========================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("loginMessage");


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            message.textContent =
                "Login successful!";

            message.className =
                "success-message";


            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 800);


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            let errorMessage =
                "Invalid email or password.";


            if (
                error.code ===
                "auth/user-not-found"
            ) {

                errorMessage =
                    "No account exists with this email.";

            }

            else if (
                error.code ===
                "auth/wrong-password"
            ) {

                errorMessage =
                    "Incorrect password.";

            }

            else if (
                error.code ===
                "auth/invalid-credential"
            ) {

                errorMessage =
                    "Incorrect email or password.";

            }

            else if (
                error.code ===
                "auth/too-many-requests"
            ) {

                errorMessage =
                    "Too many attempts. Please try again later.";

            }


            message.textContent =
                errorMessage;

            message.className =
                "error-message";

        }

    });

}