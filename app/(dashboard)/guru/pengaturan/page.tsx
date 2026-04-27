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
    fotoProfile: "" // State baru untuk menyimpan foto (Base64)
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
          // Resize gambar ke maksimal 256x256 px agar database tidak berat
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
          
          // Ubah ke format Base64 (kualitas 80%)
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
      // Me-refresh halaman agar header ikut terupdate
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-indigo-400">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
      className="max-w-3xl mx-auto space-y-6 pb-24 md:pb-10 px-4 md:px-0 pt-6 md:pt-0"
    >
      <header className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Pengaturan Akun ⚙️</h1>
        <p className="text-sm md:text-base text-slate-500 mt-2">Kelola identitas dan preferensi sistem Anda di sini.</p>
      </header>

      <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm">
        
        {/* AREA UPLOAD FOTO PROFIL */}
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 mb-8 pb-8 border-b border-slate-100">
          
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/jpg" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageChange}
          />

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg border-4 border-white cursor-pointer group overflow-hidden shrink-0"
          >
            {/* Tampilkan Foto jika ada, jika tidak tampilkan inisial */}
            {profileForm.fotoProfile ? (
              <img src={profileForm.fotoProfile} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{profileForm.nama ? profileForm.nama.charAt(0).toUpperCase() : "G"}</span>
            )}
            
            {/* Efek Gelap (Overlay) saat di-hover */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-slate-800">Foto Profil</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">Format JPG/PNG, ukuran maksimal 2MB. Klik foto di samping untuk mengubah.</p>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-xl transition-colors"
            >
              Pilih Foto
            </button>
          </div>
        </div>

        {/* FORM IDENTITAS */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">👤</span> Identitas Pendidik
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div>
            <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Nama Lengkap & Gelar</label>
            <input 
              type="text" 
              value={profileForm.nama} 
              onChange={e => setProfileForm({...profileForm, nama: e.target.value})} 
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-all text-[13px] md:text-sm font-medium text-slate-700 shadow-sm" 
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
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-all text-[13px] md:text-sm font-medium text-slate-700 shadow-sm" 
                placeholder="Contoh: Matematika" 
              />
            </div>
            <div>
              <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Asal Sekolah / Instansi</label>
              <input 
                type="text" 
                value={profileForm.sekolah} 
                onChange={e => setProfileForm({...profileForm, sekolah: e.target.value})} 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-all text-[13px] md:text-sm font-medium text-slate-700 shadow-sm" 
                required 
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSaving} 
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98] shadow-md text-[14px] md:text-[15px] ${
                isSaving ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {isSaving ? "Menyimpan Perubahan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </div>

      {/* Tombol Logout Ekstra untuk di HP */}
      <div className="md:hidden mt-8">
        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl border border-rose-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Keluar dari Aplikasi
        </button>
      </div>

    </motion.div>
  );
}