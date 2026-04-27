"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PengaturanGuru() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [profileForm, setProfileForm] = useState({ 
    nama: "", 
    sekolah: "", 
    mapel: "",
    fotoProfile: "" 
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileForm({
              nama: data.nama || "",
              sekolah: data.sekolah || "",
              mapel: data.mapel || "",
              fotoProfile: data.fotoProfile || ""
            });
          }
        } catch (error) {
          console.error("Gagal mengambil profil:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // FUNGSI UNGGAH & KOMPRESI FOTO
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
        sekolah: profileForm.sekolah,
        mapel: profileForm.mapel,
        fotoProfile: profileForm.fotoProfile
      });
      alert("Profil berhasil diperbarui!");
      window.location.reload(); 
    } catch (error) {
      alert("Gagal menyimpan profil.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if(confirm("Apakah Anda yakin ingin keluar dari aplikasi?")) {
      await auth.signOut();
      router.push("/login");
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-indigo-400">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-500 animate-pulse text-sm">Memuat Data Profil...</p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 space-y-6">
      
      {/* Header Halaman */}
      <motion.div variants={itemVariants} className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2">
          Pengaturan Akun <span className="text-3xl"></span>
        </h1>
        <p className="text-[13px] md:text-sm text-slate-500 mt-1.5 md:mt-2 font-medium max-w-3xl">
          Kelola identitas, mata pelajaran, dan foto profil Anda agar AI dapat menyesuaikan dokumen dengan lebih presisi.
        </p>
      </motion.div>

      {/* Main Settings Card */}
      <motion.div variants={itemVariants} className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <form onSubmit={handleSaveProfile} className="flex flex-col h-full">
          
          {/* SECTION 1: FOTO PROFIL */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageChange}
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-4xl shadow-md border-4 border-white cursor-pointer group overflow-hidden shrink-0 ring-4 ring-slate-50/50"
            >
              {profileForm.fotoProfile ? (
                <img src={profileForm.fotoProfile} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{profileForm.nama ? profileForm.nama.charAt(0).toUpperCase() : "G"}</span>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Ubah</span>
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 mt-2 sm:mt-4">
              <h2 className="text-base md:text-lg font-bold text-slate-800">Foto Profil</h2>
              <p className="text-[12px] md:text-[13px] text-slate-500 mt-1 max-w-md mx-auto sm:mx-0">
                Gunakan foto dengan format JPG atau PNG. Ukuran maksimal file adalah 2MB. Foto ini akan muncul di sudut kanan atas aplikasi.
              </p>
              <div className="mt-4 flex justify-center sm:justify-start gap-3">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 text-xs md:text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Pilih Foto Baru
                </button>
                {profileForm.fotoProfile && (
                  <button 
                    type="button" 
                    onClick={() => setProfileForm({...profileForm, fotoProfile: ""})}
                    className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs md:text-[13px] font-bold rounded-xl transition-all active:scale-95"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: FORM IDENTITAS */}
          <div className="p-6 md:p-8 space-y-6 bg-white flex-1">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Informasi Personal
            </h2>

            <div className="space-y-5 max-w-3xl">
              <div>
                <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Nama Lengkap (Beserta Gelar)</label>
                <input 
                  type="text" 
                  value={profileForm.nama} 
                  onChange={e => setProfileForm({...profileForm, nama: e.target.value})} 
                  placeholder="Contoh: Dr. H. Ahmad Albert Afrilsyah, M.Pd"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-all text-[13px] md:text-sm font-medium text-slate-700 shadow-sm" 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Mata Pelajaran Utama</label>
                  <input 
                    type="text" 
                    value={profileForm.mapel} 
                    onChange={e => setProfileForm({...profileForm, mapel: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-all text-[13px] md:text-sm font-medium text-slate-700 shadow-sm" 
                    placeholder="Contoh: Aqidah Akhlak" 
                  />
                </div>
                <div>
                  <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Asal Sekolah / Instansi</label>
                  <input 
                    type="text" 
                    value={profileForm.sekolah} 
                    onChange={e => setProfileForm({...profileForm, sekolah: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-all text-[13px] md:text-sm font-medium text-slate-700 shadow-sm" 
                    placeholder="Contoh: SMP Negeri Solokuro"
                    required 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: FOOTER ACTION */}
          <div className="px-6 py-5 md:px-8 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] md:text-xs text-slate-400 font-medium text-center sm:text-left">
              Pastikan nama dan mata pelajaran sudah sesuai untuk hasil AI yang lebih baik.
            </p>
            <button 
              type="submit" 
              disabled={isSaving} 
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md text-[13px] md:text-sm ${
                isSaving ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menyimpan...</>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Tombol Logout Ekstra untuk di HP */}
      <div className="md:hidden mt-8 pb-4">
        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-white hover:bg-rose-50 text-rose-600 font-bold rounded-2xl border border-rose-100 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Keluar dari Aplikasi
        </button>
      </div>

    </motion.div>
  );
}