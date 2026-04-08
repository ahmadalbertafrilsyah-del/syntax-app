// lib/auth.ts
import { auth, db } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Provider untuk Login Google
const googleProvider = new GoogleAuthProvider();

// 1. FUNGSI DAFTAR DENGAN EMAIL & PASSWORD
export const registerWithEmail = async (email: string, password: string, nama: string, sekolah: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Simpan data tambahan ke Firestore (Koleksi 'users')
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      nama: nama,
      email: user.email,
      role: "guru",           // Default role adalah guru
      sekolah: sekolah,
      sisa_kuota: 50,         // Memberikan modal awal 50x generate
      dibuat_pada: serverTimestamp(),
    });

    return user;
  } catch (error) {
    throw error;
  }
};

// 2. FUNGSI LOGIN DENGAN EMAIL & PASSWORD
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// 3. FUNGSI LOGIN / DAFTAR DENGAN GOOGLE
export const loginWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;

    // Cek apakah user Google ini sudah pernah daftar sebelumnya di database
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // Jika belum pernah ada (user baru), buatkan profil di Firestore
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        nama: user.displayName || "Pengguna Google",
        email: user.email,
        role: "guru",
        sekolah: "Belum Diisi",
        sisa_kuota: 50,
        dibuat_pada: serverTimestamp(),
      });
    }

    return user;
  } catch (error) {
    throw error;
  }
};

// 4. FUNGSI LOGOUT
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};