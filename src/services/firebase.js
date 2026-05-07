import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARbkKrH72JD6tfXiOpJ3SDBRS6jUVvM2Q",
  authDomain: "ecosync-a94e1.firebaseapp.com",
  projectId: "ecosync-a94e1",
  storageBucket: "ecosync-a94e1.firebasestorage.app",
  messagingSenderId: "990462772800",
  appId: "1:990462772800:web:76243b46a1f54cc71f41a5",
  measurementId: "G-8B812TVC4B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
