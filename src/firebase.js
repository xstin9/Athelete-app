// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCTjWxEu6D22AVjHFhaDtSmYcSnYiQuJLs",
  authDomain: "athlete-appa.firebaseapp.com",
  projectId: "athlete-appa",
  storageBucket: "athlete-appa.appspot.com",
  messagingSenderId: "40079497035",
  appId: "1:40079497035:web:c63e9b5ac10eee1dbd3ace",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ THESE are what you must export
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

