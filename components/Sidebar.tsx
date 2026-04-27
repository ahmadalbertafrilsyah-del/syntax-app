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

  // MENU GURU
  const menuItems = [
    { name: "Beranda", path: "/guru", icon: "🏠", mobileName: "Beranda" },
    { name: "Generator AI", path: "/guru/generator", icon: "✨", mobileName: "Generate" },
    { name: "Vision AI", path: "/guru/vision", icon: "📸", mobileName: "Vision" },
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

  const handleMenuClick = () => {
    if (setIsSidebarOpen) setIsSidebarOpen(false);
  };

  if (loading) return null;

  // Menentukan menu mana yang dipakai berdasarkan Role
  const currentMenuItems = role === "admin" ? adminMenuItems : menuItems;

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR (Sembunyi di HP, Muncul di Desktop/MD)      */}
      {/* ========================================================= */}
      <aside className={`hidden md:flex bg-white border-r border-slate-200 flex-col h-screen sticky top-0 z-50 w-64`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-indigo-600 tracking-tight flex items-center gap-2">
            <img src="https://i.ibb.co.com/JjK2w93q/LOGO-SYNTAX.png" alt="Logo" className="w-6 h-6 object-contain" />
            Syntax
          </h2>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
          {role !== "admin" && (
            <div>
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Menu Utama</p>
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link key={item.name} href={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                      <span className="text-lg">{item.icon}</span> {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {role === "admin" && (
            <div>
              <div className="px-4 flex items-center gap-2 mb-3">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Admin Panel</p>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <div className="space-y-1">
                {adminMenuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link key={item.name} href={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${isActive ? "bg-slate-900 text-cyan-400 shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
                      <span className="text-lg">{item.icon}</span> {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM NAVIGATION (Kini Muncul untuk GURU & ADMIN)   */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex flex-nowrap items-center h-16 z-50 px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] overflow-x-auto custom-scrollbar gap-1">
        {currentMenuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.name} href={item.path} className="flex-1 flex flex-col items-center justify-center h-full min-w-[64px] space-y-1 active:scale-95 transition-transform shrink-0">
              <span className={`text-lg sm:text-xl ${isActive ? 'grayscale-0 opacity-100 scale-110 transition-transform' : 'grayscale opacity-50'}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] sm:text-[10px] font-bold truncate px-1 max-w-full ${
                isActive 
                  ? (role === 'admin' ? 'text-slate-800' : 'text-indigo-600') 
                  : 'text-slate-400'
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