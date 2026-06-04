"use server";

import { db } from "@/lib/firebase"; // Memanggil koneksi Firebase Anda
import { collection, addDoc, doc, updateDoc, getDoc, setDoc, increment } from "firebase/firestore";

export async function saveDokumen(data: any) {
  try {
    // 1. Menyimpan dokumen ke dalam koleksi 'dokumen' di Firestore
    const docRef = await addDoc(collection(db, "dokumen"), {
      id_user: data.id_user,
      sumber: data.sumber,
      tipe: data.tipe,
      fase: data.fase,
      mapel: data.mapel,
      topik: data.topik,
      konten_ai: data.konten_ai,
      namaSekolah: data.namaSekolah,
      kotaSekolah: data.kotaSekolah,
      namaKepsek: data.namaKepsek,
      nipKepsek: data.nipKepsek,
      namaGuru: data.namaGuru,
      nipGuru: data.nipGuru,
      createdAt: new Date().toISOString()
    });

    // 2. Operasi pemotongan token (sisa_kuota) di koleksi 'users'
    const userRef = doc(db, "users", data.id_user);
    await updateDoc(userRef, {
      sisa_kuota: increment(-1) // Secara otomatis mengurangi 1 dari database
    });

    return docRef.id;
  } catch (error) {
    console.error("Gagal menyimpan dokumen ke Firebase:", error);
    throw new Error("Gagal menyimpan dokumen");
  }
}

export async function updateDokumenKonten(docId: string, konten: string) {
  try {
    const docRef = doc(db, "dokumen", docId);
    await updateDoc(docRef, {
      konten_ai: konten,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Gagal update dokumen di Firebase:", error);
    throw new Error("Gagal update dokumen");
  }
}

export async function syncUserToDatabase(uid: string, email: string, nama: string) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    // Jika user baru pertama kali login, buatkan datanya dan beri 50 token gratis
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        id: uid,
        email: email,
        nama: nama,
        role: "guru",
        sisa_kuota: 50,
        createdAt: new Date().toISOString()
      });
    }
    return true;
  } catch (error) {
    console.error("Gagal sinkronisasi user ke Firebase:", error);
    throw new Error("Gagal menyimpan data user");
  }
}