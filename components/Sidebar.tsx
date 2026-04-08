"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Menangkap prop dari layout
export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen?: boolean, setIsSidebarOpen?: (val: boolean) => void }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

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
    });
    return () => unsubscribe();
  }, []);

  const menuItems = [
    { name: "Ringkasan", path: "/guru", icon: "📊" },
    { name: "Generator AI", path: "/guru/generator", icon: "✨" },
    { name: "Koleksi Saya", path: "/guru/koleksi", icon: "📚" },
    { name: "Vision AI", path: "/guru/vision", icon: "📸" },
    { name: "Auto-Korektor", path: "/guru/evaluator", icon: "💯" },
  ];

  const adminMenuItems = [
    { name: "Overview", path: "/admin", icon: "🔐" },
    { name: "Kelola Pengguna", path: "/admin/users", icon: "👥" },
    { name: "Kurikulum", path: "/admin/kurikulum", icon: "📚" },
  ];

  // Fungsi untuk menutup sidebar di HP saat menu diklik
  const handleMenuClick = () => {
    if (setIsSidebarOpen) setIsSidebarOpen(false);
  };

  return (
    <aside className={`bg-white border-r border-slate-200 flex flex-col h-screen fixed md:sticky top-0 z-50 transition-transform duration-300 w-64 shadow-2xl md:shadow-none ${
      isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    }`}>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-cyan-700 tracking-tight flex items-center gap-2">
          <img src="https://i.ibb.co.com/J0jVHbG/Syntax-Icon.png" alt="Logo" className="w-6 h-6 object-contain" />
          Syntax
        </h2>
        {/* Tombol Tutup (Hanya di Mobile) */}
        <button onClick={handleMenuClick} className="md:hidden w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 font-bold">
          ✕
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto pb-20 md:pb-4">
        
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Menu Utama</p>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.name} 
                  href={item.path}
                  onClick={handleMenuClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    isActive 
                      ? "bg-cyan-50 text-cyan-700 shadow-sm border border-cyan-100/50" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {role === "admin" && (
          <div>
            <div className="px-4 flex items-center gap-2 mb-3 mt-6">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Admin Panel</p>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            <div className="space-y-1">
              {adminMenuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link 
                    key={item.name} 
                    href={item.path}
                    onClick={handleMenuClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                      isActive 
                        ? "bg-slate-900 text-cyan-400 shadow-md" 
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}