import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC9gswabNQ1wvRukkxjql0DMpHxnccdozY",
  authDomain: "studio-7400746110-e1827.firebaseapp.com",
  projectId: "studio-7400746110-e1827",
  storageBucket: "studio-7400746110-e1827.firebasestorage.app",
  messagingSenderId: "254873776379",
  appId: "1:254873776379:web:40944ea53560f8be23405e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use in other files
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;