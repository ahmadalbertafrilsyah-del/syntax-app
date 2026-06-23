"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function SiswaHeader() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hari = date.toLocaleDateString('id-ID', { weekday: 'short' });
    const tanggal = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${hari}, ${tanggal} • ${jam}`;
  };

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserData(docSnap.data());
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    if(confirm("Apakah Anda yakin ingin keluar dari Ruang Belajar?")) {
      await auth.signOut();
      router.push("/login");
    }
  };

  if (!user) return null;

  return (
    <header className="px-4 md:px-8 pt-4 md:pt-6 pb-2 w-full flex items-center justify-between z-40 sticky top-0 bg-[#F4F5F7]/80 backdrop-blur-md">
      
      <div className="flex md:hidden items-center gap-2 pl-1">
        <img src="https://i.ibb.co.com/JjK2w93q/LOGO-SYNTAX.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow-sm" />
        <span className="text-[18px] font-black text-indigo-600 tracking-tight">Syntax</span>
      </div>

      <div className="hidden md:flex items-center bg-white px-4 py-2.5 rounded-full shadow-sm border border-slate-100/80">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          {formatTime(currentTime)} WIB
        </span>
      </div>

      <div className="flex items-center gap-2 bg-white p-1.5 pr-2 md:pr-4 rounded-full shadow-sm border border-slate-100/80 shrink-0 relative">
        
        <div className="flex items-center gap-2 pl-1 pr-2">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden shrink-0 border-2 border-white">
            {userData?.fotoProfile ? (
              <img src={userData.fotoProfile} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{userData?.nama ? userData.nama.charAt(0).toUpperCase() : "S"}</span>
            )}
          </div>
          <div className="hidden sm:block">
            <h2 className="text-[13px] font-bold text-slate-800 leading-tight">
              {userData?.nama?.split(' ')[0] || "Siswa"}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Peserta Didik</p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

        <button onClick={handleLogout} className="p-1.5 md:p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-colors" title="Keluar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>

      </div>
    </header>
  );
}