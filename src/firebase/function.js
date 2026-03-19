import { auth, db, storage } from "./config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const handleSignUp = async (role, formData, file) => {
  try {
    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      formData.email, 
      formData.password
    );
    const user = userCredential.user;

    let fileUrl = "";

    // 2. Handle File Upload (Only for Doctors/Pharmacists)
    if (file && (role === 'doctor' || role === 'pharmacist')) {
      const storageRef = ref(storage, `${role}_proofs/${user.uid}`);
      await uploadBytes(storageRef, file);
      fileUrl = await getDownloadURL(storageRef);
    }

    // 3. Save Data to Firestore
    const userData = {
      uid: user.uid,
      role: role,
      createdAt: new Date().toISOString(),
      ...formData,
      proofUrl: fileUrl, // Will be empty for patients
    };

    // Remove password from Firestore for security
    delete userData.password;

    await setDoc(doc(db, "users", user.uid), userData);
    
    return { success: true, user: userData };
  } catch (error) {
    console.error("Firebase Error:", error);
    throw error;
  }
};