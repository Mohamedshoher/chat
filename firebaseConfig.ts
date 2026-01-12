
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDwW-110c4I79jw2AwY3E0wKa3lftMm-DU",
    authDomain: "chat-8499c.firebaseapp.com",
    projectId: "chat-8499c",
    storageBucket: "chat-8499c.firebasestorage.app",
    messagingSenderId: "755846934914",
    appId: "1:755846934914:web:b22cdc13b137223c149f9b",
    measurementId: "G-QXLYG76DGY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db, firebaseConfig };
