// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "leadflow-uhk3k",
  appId: "1:489878858388:web:b2e95e3d4d0f8c82186281",
  storageBucket: "leadflow-uhk3k.firebasestorage.app",
  apiKey: "AIzaSyD1A0-zi4QvVEu98iL0p0D14f_YuQcc2bY",
  authDomain: "leadflow-uhk3k.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "489878858388"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
