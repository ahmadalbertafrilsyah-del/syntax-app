"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GuruDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State khusus untuk Form Profil
  const [profileForm, setProfileForm] = useState({ nama: "", sekolah: "", mapel: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Mengambil data spesifik guru dari Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            // Isi form dengan data yang ada di database
            setProfileForm({
              nama: data.nama || "",
              sekolah: data.sekolah || "",
              mapel: data.mapel || ""
            });
          }
        } catch (error) {
          console.error("Gagal mengambil data user:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Fungsi untuk menyimpan perubahan profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        nama: profileForm.nama,
        sekolah: profileForm.sekolah,
        mapel: profileForm.mapel
      });
      // Update UI langsung tanpa harus refresh halaman
      setUserData((prev: any) => ({ ...prev, ...profileForm }));
      alert("Profil berhasil diperbarui!");
    } catch (error) {
      alert("Gagal menyimpan profil.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Varian animasi untuk Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mr-3"></div>
        <div className="font-medium animate-pulse">Memuat data profil...</div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="max-w-5xl mx-auto space-y-6 pb-10"
    >
      {/* Header Selamat Datang */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Selamat datang, {userData?.nama || "Pendidik Hebat"}! 👋
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {userData?.sekolah || "Asistensi Mengajar"} • Siap meracik materi pembelajaran hari ini?
          </p>
        </div>
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kartu Sisa Kuota */}
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="font-medium">Sisa Kuota AI</span>
            </div>
            <h2 className="text-5xl font-extrabold">{userData?.sisa_kuota || 0}</h2>
            <p className="text-indigo-200 text-sm mt-1">Generasi Tersedia</p>
          </div>
          <button className="mt-6 w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition backdrop-blur-sm">
            Top Up Kuota via Admin
          </button>
        </motion.div>

        {/* Akses Cepat 1: Generator */}
        <motion.div variants={itemVariants} className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">✨</div>
            <h3 className="text-xl font-bold text-slate-800">Generator AI</h3>
            <p className="text-slate-500 text-sm mt-2">Buat Modul Ajar, RPP, atau Bank Soal otomatis dengan kecerdasan buatan.</p>
          </div>
          <Link href="/guru/generator">
            <button className="mt-6 w-full py-2.5 bg-slate-50 text-indigo-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 rounded-xl text-sm font-semibold transition">
              Mulai Generate &rarr;
            </button>
          </Link>
        </motion.div>

        {/* Akses Cepat 2: Koleksi */}
        <motion.div variants={itemVariants} className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📚</div>
            <h3 className="text-xl font-bold text-slate-800">Koleksi Saya</h3>
            <p className="text-slate-500 text-sm mt-2">Lihat, edit, atau unduh kembali materi yang sudah pernah Anda buat sebelumnya.</p>
          </div>
          <Link href="/guru/koleksi">
            <button className="mt-6 w-full py-2.5 bg-slate-50 text-blue-600 group-hover:bg-blue-50 group-hover:text-blue-700 rounded-xl text-sm font-semibold transition">
              Buka Koleksi &rarr;
            </button>
          </Link>
        </motion.div>
      </div>

      {/* FORM IDENTITAS GURU */}
      <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mt-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">👤</span> Identitas Pendidik
          </h2>
          <p className="text-sm text-slate-500 mt-1">Lengkapi data di bawah ini agar hasil generate dokumen AI lebih terpersonalisasi.</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap & Gelar</label>
              <input 
                type="text" 
                value={profileForm.nama} 
                onChange={e => setProfileForm({...profileForm, nama: e.target.value})} 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium text-slate-700" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mata Pelajaran Utama</label>
              <input 
                type="text" 
                value={profileForm.mapel} 
                onChange={e => setProfileForm({...profileForm, mapel: e.target.value})} 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium text-slate-700" 
                placeholder="Contoh: Matematika, PAI, Biologi" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Asal Sekolah / Instansi</label>
            <input 
              type="text" 
              value={profileForm.sekolah} 
              onChange={e => setProfileForm({...profileForm, sekolah: e.target.value})} 
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium text-slate-700" 
              required 
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSaving} 
              className={`px-6 py-3.5 rounded-xl font-bold text-white transition-all shadow-sm ${
                isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
              }`}
            >
              {isSaving ? "Menyimpan Perubahan..." : "Simpan Profil"}
            </button>
          </div>
        </form>
      </motion.div>

    </motion.div>
  );
}