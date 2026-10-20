import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
    authDomain: "tomato-8d2bc.firebaseapp.com",
    projectId: "tomato-8d2bc",
    storageBucket: "tomato-8d2bc.firebasestorage.app",
    messagingSenderId: "980509151853",
    appId: "1:980509151853:web:1a785d6d67f812d65f2564"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };