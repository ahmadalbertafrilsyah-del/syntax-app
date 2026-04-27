"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function PengaturanAdmin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [profileForm, setProfileForm] = useState({ 
    nama: "", 
    fotoProfile: "" 
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileForm({
              nama: data.nama || "",
              fotoProfile: data.fotoProfile || ""
            });
          }
        } catch (error) {
          console.error("Gagal mengambil profil admin:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAdminData();
  }, [user]);

  // FUNGSI UNGGAH & KOMPRESI FOTO (Standard Premium)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar. Maksimal 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setProfileForm(prev => ({ ...prev, fotoProfile: dataUrl }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        nama: profileForm.nama,
        fotoProfile: profileForm.fotoProfile
      });
      alert("Profil Admin berhasil diperbarui!");
      window.location.reload(); 
    } catch (error) {
      alert("Gagal menyimpan profil.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xs animate-pulse">Menghubungkan ke Pusat Data...</p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 space-y-6">
      
      {/* Header Halaman */}
      <motion.div variants={itemVariants} className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2">
          Profil Super Admin <span className="text-3xl">🎖️</span>
        </h1>
        <p className="text-[13px] md:text-sm text-slate-500 mt-1.5 md:mt-2 font-medium max-w-2xl">
          Kelola identitas dan foto profil Anda. Nama ini akan muncul pada laporan sistem dan log aktivitas admin.
        </p>
      </motion.div>

      {/* Main Settings Card */}
      <motion.div variants={itemVariants} className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <form onSubmit={handleSaveProfile} className="flex flex-col h-full">
          
          {/* SECTION 1: FOTO PROFIL ADMIN */}
          <div className="p-6 md:p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageChange}
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-5xl shadow-xl border-4 border-white cursor-pointer group overflow-hidden shrink-0 ring-4 ring-slate-100"
            >
              {profileForm.fotoProfile ? (
                <img src={profileForm.fotoProfile} alt="Admin Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{profileForm.nama ? profileForm.nama.charAt(0).toUpperCase() : "A"}</span>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                <svg className="w-10 h-10 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[11px] font-black text-white tracking-widest uppercase">Ganti Foto</span>
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 mt-2 sm:mt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                Otoritas Admin
              </div>
              <h2 className="text-lg md:text-xl font-black text-slate-800">Avatar Sistem</h2>
              <p className="text-[12px] md:text-[13px] text-slate-500 mt-2 max-w-md mx-auto sm:mx-0 leading-relaxed">
                Gunakan foto formal profesional. Foto ini akan muncul di Header navigasi dan identitas log admin. Format yang didukung: JPG, PNG.
              </p>
              <div className="mt-5 flex justify-center sm:justify-start gap-3">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:border-slate-800 hover:text-slate-900 text-xs md:text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Pilih Berkas
                </button>
                {profileForm.fotoProfile && (
                  <button 
                    type="button" 
                    onClick={() => setProfileForm({...profileForm, fotoProfile: ""})}
                    className="px-6 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs md:text-[13px] font-bold rounded-xl transition-all active:scale-95"
                  >
                    Copot Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: FORM IDENTITAS ADMIN */}
          <div className="p-6 md:p-10 space-y-8 bg-white flex-1">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-slate-800 rounded-full block"></span>
              Detail Autentikasi
            </h2>

            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2.5">Nama Panggilan / Nama Lengkap Admin</label>
                <input 
                  type="text" 
                  value={profileForm.nama} 
                  onChange={e => setProfileForm({...profileForm, nama: e.target.value})} 
                  placeholder="Contoh: Admin Syntax Utama"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-slate-100 focus:border-slate-800 outline-none transition-all text-[13px] md:text-sm font-bold text-slate-700 shadow-sm" 
                  required 
                />
              </div>

              {/* Status Akun (Read Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2.5">Role Pengguna</label>
                  <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-[13px] md:text-sm font-bold text-slate-400 cursor-not-allowed">
                    Super Administrator
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2.5">Status Sistem</label>
                  <div className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[13px] md:text-sm font-black text-emerald-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Akun Terverifikasi
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: FOOTER ACTION */}
          <div className="px-6 py-6 md:px-10 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-[11px] md:text-xs font-bold">Terakhir diperbarui secara otomatis oleh server.</p>
            </div>
            <button 
              type="submit" 
              disabled={isSaving} 
              className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg text-[13px] md:text-sm ${
                isSaving ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-black hover:shadow-slate-200'
              }`}
            >
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menyimpan...</>
              ) : (
                "Simpan Pengaturan"
              )}
            </button>
          </div>
        </form>
      </motion.div>

    </motion.div>
  );
}