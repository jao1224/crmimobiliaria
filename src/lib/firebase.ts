
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCKnrPMARuUnHjjUxezLdLg2ZKW9WI2PHs",
  authDomain: "crmimobiliararia.firebaseapp.com",
  projectId: "crmimobiliararia",
  storageBucket: "crmimobiliararia.appspot.com",
  messagingSenderId: "734802968847",
  appId: "1:734802968847:web:8306023b870c7d4bcebe7a",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);


export { app, db, storage, auth };
