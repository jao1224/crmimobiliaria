

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD1A0-zi4QvVEu98iL0p0D14f_YuQcc2bY",
  authDomain: "leadflow-uhk3k.firebaseapp.com",
  projectId: "leadflow-uhk3k",
  storageBucket: "leadflow-uhk3k.firebasestorage.app",
  messagingSenderId: "489878858388",
  appId: "1:489878858388:web:f7bc91fee58cdac2186281",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);


export { app, db, storage, auth };
