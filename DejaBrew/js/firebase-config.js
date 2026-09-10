import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAfCshpwQ7y0j3zRejwEgMbrIEQvxmTKkk",
    authDomain: "deja-brew-inventory-system.firebaseapp.com",
    projectId: "deja-brew-inventory-system",
    storageBucket: "deja-brew-inventory-system.firebasestorage.app",
    messagingSenderId: "868357979276",
    appId: "1:868357979276:web:c14ee5dcaa90208f020fa9"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export {
    app,
    auth,
    db
};
