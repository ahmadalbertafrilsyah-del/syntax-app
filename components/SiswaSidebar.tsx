"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function SiswaSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    if(confirm("Apakah kamu yakin ingin keluar dari Portal Akademik?")) {
      await signOut(auth);
      window.location.href = "/login";
    }
  };

  const menuItems = [
    { name: "Beranda", path: "/siswa", icon: "🏠", mobileName: "Beranda" },
    { name: "Ruang Kelas", path: "/siswa/kelas", icon: "📚", mobileName: "Kelas" },
    { name: "Transkrip Raport", path: "/siswa/raport", icon: "📈", mobileName: "Raport" },
    { name: "Profil Siswa", path: "/siswa/profil", icon: "👤", mobileName: "Profil" },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex flex-col bg-white rounded-[32px] m-4 h-[calc(100vh-32px)] shadow-sm sticky top-4 border border-slate-100 shrink-0 transition-all duration-300 ease-in-out overflow-x-hidden z-50 ${isCollapsed ? 'w-[70px]' : 'w-[260px]'}`}>
        
        <div className={`pt-8 pb-4 flex items-center mb-2 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-start px-7'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img src="https://i.ibb.co.com/JjK2w93q/LOGO-SYNTAX.png" alt="Logo" className="w-8 h-8 object-contain shrink-0 drop-shadow-sm" />
            <h2 className={`text-2xl font-black text-slate-800 tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              Syntax
            </h2>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-6 overflow-y-auto hide-scrollbar mt-2 relative">
          <div>
            {isCollapsed ? (
               <div className="h-px w-8 bg-slate-200 mx-auto mb-4 rounded-full"></div>
            ) : (
               <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 whitespace-nowrap">Portal Akademik</p>
            )}
            
            <div className="space-y-1.5 flex flex-col items-center">
              {menuItems.map((item) => {
                // Logika Aktif Cerdas
                const isActive = item.path === '/siswa' ? pathname === '/siswa' : pathname?.startsWith(item.path);
                return (
                  <Link 
                    key={item.name} href={item.path} title={isCollapsed ? item.name : ""}
                    className={`flex items-center rounded-2xl transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden
                      ${isCollapsed ? 'justify-center p-3 h-12 w-12' : 'gap-3.5 px-4 py-3.5 w-full'}
                      ${isActive ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                  >
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
        </nav>

        <div className="p-4 mt-auto border-t border-slate-50 flex flex-col gap-2">
           <button onClick={handleLogout} className={`w-full h-12 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors ${isCollapsed ? '' : 'gap-2'}`}>
             <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             {!isCollapsed && <span className="font-bold text-sm">Keluar</span>}
           </button>
           <button onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? "Perluas Menu" : "Sembunyikan Menu"} className="w-full h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-800 rounded-2xl transition-colors">
             <svg className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
             </svg>
           </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-200 flex justify-around items-center h-[70px] z-[100] px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] pb-safe">
        {menuItems.map((item) => {
          const isActive = item.path === '/siswa' ? pathname === '/siswa' : pathname?.startsWith(item.path);
          return (
            <Link key={item.name} href={item.path} className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-300 ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-indigo-600 rounded-b-full shadow-sm"></span>}
              <span className={`text-[22px] transition-transform duration-300 ${isActive ? 'scale-110 mb-0.5 grayscale-0' : 'mb-0.5 grayscale opacity-70'}`}>{item.icon}</span>
              <span className={`text-[10px] font-bold tracking-tight transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.mobileName}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}