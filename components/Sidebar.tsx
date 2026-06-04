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
  
  // STATE BARU: Untuk melipat sidebar di mode Desktop
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      {/* DESKTOP SIDEBAR (Bento Floating Style & Collapsible)        */}
      {/* ========================================================= */}
      <aside 
        className={`hidden md:flex flex-col bg-white rounded-[32px] m-4 h-[calc(100vh-32px)] shadow-sm sticky top-4 border border-slate-100 shrink-0 transition-all duration-300 ease-in-out overflow-x-hidden ${isCollapsed ? 'w-[70px]' : 'w-[260px]'}`}
      >
        
        {/* LOGO AREA */}
        <div className={`pt-8 pb-4 flex items-center mb-2 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-start px-7'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img src="https://i.ibb.co.com/JjK2w93q/LOGO-SYNTAX.png" alt="Logo" className="w-8 h-8 object-contain shrink-0 drop-shadow-sm" />
            <h2 className={`text-2xl font-black text-slate-800 tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              Syntax
            </h2>
          </div>
        </div>

        {/* NAV LINKS */}
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto hide-scrollbar mt-2 relative">
          {role !== "admin" && (
            <div>
              {isCollapsed ? (
                 <div className="h-px w-8 bg-slate-200 mx-auto mb-4 rounded-full"></div>
              ) : (
                 <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 whitespace-nowrap">Main Menu</p>
              )}
              
              <div className="space-y-1.5 flex flex-col items-center">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link 
                      key={item.name} 
                      href={item.path} 
                      title={isCollapsed ? item.name : ""} // Tooltip teks pada hover di mode lipat
                      className={`flex items-center rounded-2xl transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden
                        ${isCollapsed ? 'justify-center p-3 h-12 w-12' : 'gap-3.5 px-4 py-3.5 w-full'}
                        ${isActive ? "bg-[#1E1E1E] text-white shadow-md shadow-slate-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                    >
                      {/* MIKRO-ADJUSTMENT: Ukuran ikon diperkecil dari 18px ke 16px di mode lipat */}
                      <span className={`shrink-0 ${isCollapsed ? 'text-[16px]' : 'text-[18px] w-6 text-center'} ${isActive ? '' : 'opacity-80'}`}>
                        {item.icon}
                      </span>
                      <span className={`font-bold text-[13px] transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {role === "admin" && (
            <div>
              {isCollapsed ? (
                <div className="h-px w-8 bg-orange-200 mx-auto mb-4 rounded-full"></div>
              ) : (
                <div className="px-3 flex items-center gap-2 mb-4 whitespace-nowrap">
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Admin</p>
                  <div className="h-[2px] flex-1 bg-orange-100 rounded-full"></div>
                </div>
              )}

              <div className="space-y-1.5 flex flex-col items-center">
                {adminMenuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link 
                      key={item.name} 
                      href={item.path} 
                      title={isCollapsed ? item.name : ""}
                      className={`flex items-center rounded-2xl transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden
                        ${isCollapsed ? 'justify-center p-3 h-12 w-12' : 'gap-3.5 px-4 py-3.5 w-full'}
                        ${isActive ? "bg-[#1E1E1E] text-orange-400 shadow-md shadow-slate-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                    >
                      {/* MIKRO-ADJUSTMENT: Ukuran ikon diperkecil dari 18px ke 16px di mode lipat */}
                      <span className={`shrink-0 ${isCollapsed ? 'text-[16px]' : 'text-[18px] w-6 text-center'} ${isActive ? '' : 'opacity-80'}`}>
                        {item.icon}
                      </span>
                      <span className={`font-bold text-[13px] transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* BOTTOM TOGGLE BUTTON (Untuk Melipat Sidebar) */}
        <div className="p-4 mt-auto border-t border-slate-50 flex justify-center">
           <button 
             onClick={() => setIsCollapsed(!isCollapsed)} 
             title={isCollapsed ? "Perluas Menu" : "Sembunyikan Menu"}
             className="w-full h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-2xl transition-colors"
           >
             <svg 
               className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
               fill="none" viewBox="0 0 24 24" stroke="currentColor"
             >
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
             </svg>
           </button>
        </div>
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
                isActive ? 'text-white' : 'text-slate-500'
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