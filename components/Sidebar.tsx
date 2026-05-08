"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen?: boolean, setIsSidebarOpen?: (val: boolean) => void }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRole(docSnap.data().role);
          }
        } catch (error) {
          console.error("Gagal mengambil role:", error);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // MENU GURU (Sudah ditambahkan menu Akademik)
  const menuItems = [
    { name: "Beranda", path: "/guru", icon: "🏠", mobileName: "Beranda" },
    { name: "Akademik", path: "/guru/akademik", icon: "🎓", mobileName: "Akademik" },
    { name: "Generator", path: "/guru/generator", icon: "✨", mobileName: "Generate" },
    { name: "Vision", path: "/guru/vision", icon: "📸", mobileName: "Vision" },
    { name: "Auto-Korektor", path: "/guru/evaluator", icon: "💯", mobileName: "Koreksi" },
    { name: "Koleksi", path: "/guru/koleksi", icon: "📚", mobileName: "Koleksi" },
    { name: "Pengaturan", path: "/guru/pengaturan", icon: "⚙️", mobileName: "Profil" }, 
  ];

  // MENU ADMIN
  const adminMenuItems = [
    { name: "Overview", path: "/admin", icon: "🔐", mobileName: "Overview" },
    { name: "Kelola Pengguna", path: "/admin/users", icon: "👥", mobileName: "Pengguna" },
    { name: "Kurikulum", path: "/admin/kurikulum", icon: "📚", mobileName: "Kurikulum" },
    { name: "Manajemen Koleksi", path: "/admin/koleksi", icon: "🗂️", mobileName: "Koleksi" }, 
    { name: "API Keys", path: "/admin/apikeys", icon: "🔑", mobileName: "API Keys" }, 
    { name: "Pengaturan", path: "/admin/pengaturan", icon: "⚙️", mobileName: "Profil" }, 
  ];

  if (loading) return null;

  const currentMenuItems = role === "admin" ? adminMenuItems : menuItems;

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR (Bento Floating Style)                      */}
      {/* ========================================================= */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white rounded-[32px] m-4 h-[calc(100vh-32px)] shadow-sm sticky top-4 border border-white/40 overflow-hidden shrink-0">
        
        {/* LOGO AREA */}
        <div className="p-7 flex items-center justify-center mb-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <img src="https://i.ibb.co.com/JjK2w93q/LOGO-SYNTAX.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
            Syntax
          </h2>
        </div>

        {/* NAV LINKS */}
        <nav className="flex-1 px-4 pb-6 space-y-6 overflow-y-auto hide-scrollbar">
          {role !== "admin" && (
            <div>
              <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
              <div className="space-y-1.5">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link key={item.name} href={item.path} className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all font-bold text-[13px] ${isActive ? "bg-[#1E1E1E] text-white shadow-md shadow-slate-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
                      <span className={`text-[18px] ${isActive ? '' : 'opacity-80'}`}>{item.icon}</span> 
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {role === "admin" && (
            <div>
              <div className="px-3 flex items-center gap-2 mb-4">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Admin</p>
                <div className="h-[2px] flex-1 bg-orange-100 rounded-full"></div>
              </div>
              <div className="space-y-1.5">
                {adminMenuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link key={item.name} href={item.path} className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all font-bold text-[13px] ${isActive ? "bg-[#1E1E1E] text-orange-400 shadow-md shadow-slate-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
                      <span className={`text-[18px] ${isActive ? '' : 'opacity-80'}`}>{item.icon}</span> 
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION (Floating Pill Style)              */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md border border-white/50 rounded-full flex flex-nowrap items-center h-16 z-50 px-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-x-auto hide-scrollbar gap-1">
        {currentMenuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.name} href={item.path} className={`flex-1 flex flex-col items-center justify-center h-[85%] min-w-[64px] rounded-full space-y-1 active:scale-95 transition-all shrink-0 ${isActive ? 'bg-[#1E1E1E]' : 'bg-transparent'}`}>
              <span className={`text-[18px] ${isActive ? 'grayscale-0 opacity-100 scale-110 transition-transform' : 'grayscale opacity-60'}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-bold truncate px-1 max-w-full ${
                isActive 
                  ? 'text-white' 
                  : 'text-slate-500'
              }`}>
                {item.mobileName}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}