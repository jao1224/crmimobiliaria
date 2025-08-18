
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFiI0S1U8B3Wl_f2ldyMv-iSErsx_1Zlw",
  authDomain: "leadflow-uhk3k.firebaseapp.com",
  projectId: "leadflow-uhk3k",
  storageBucket: "leadflow-uhk3k.appspot.com",
  messagingSenderId: "36735504263",
  appId: "1:36735504263:web:0b7f8c14d9b4f981f9b3b0",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);


export { app, db, storage, auth };
