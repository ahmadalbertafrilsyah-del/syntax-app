"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const [adminData, setAdminData] = useState<any>(null);
  
  // State untuk jam real-time
  const [currentTime, setCurrentTime] = useState(new Date());

  // === JALANKAN JAM REAL-TIME SETIAP DETIK ===
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hari = date.toLocaleDateString('id-ID', { weekday: 'long' });
    const tanggal = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${hari}, ${tanggal} • ${jam} WIB`;
  };

  // Mengambil Data Admin dari Firestore
  useEffect(() => {
    const fetchAdminData = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setAdminData(docSnap.data());
      }
    };
    fetchAdminData();
  }, [user]);

  const handleLogout = async () => {
    if(confirm("Apakah Anda yakin ingin keluar dari panel Admin?")) {
      await auth.signOut();
      router.push("/login");
    }
  };

  // Jangan render jika belum login
  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between z-30 sticky top-0 shadow-sm">
      
      {/* KIRI: Foto, Nama Admin, Jam Real-time */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Lingkaran Profil Admin (Tema Slate/Gelap) */}
        <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white overflow-hidden shrink-0">
          {adminData?.fotoProfile ? (
            <img src={adminData.fotoProfile} alt="Admin Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{adminData?.nama ? adminData.nama.charAt(0).toUpperCase() : "A"}</span>
          )}
        </div>
        <div>
          {/* Nama Admin */}
          <h2 className="text-sm md:text-base font-black text-slate-800 leading-tight">
            {adminData?.nama || "Super Admin"}
          </h2>
          {/* Tampilan Waktu Real-time */}
          <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5">
            {formatTime(currentTime)}
          </p>
        </div>
      </div>

      {/* KANAN: Tombol Logout Saja (Lebih Bersih untuk Admin) */}
      <div className="flex items-center gap-1 md:gap-3">
        <button onClick={handleLogout} className="p-2 md:p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-colors flex items-center gap-2" title="Keluar">
          <span className="text-xs font-bold hidden md:inline">Keluar</span>
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>
      
    </header>
  );
}