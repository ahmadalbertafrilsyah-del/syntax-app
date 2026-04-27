"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import GuruHeader from "@/components/GuruHeader"; // <--- Mengambil header yang baru dibuat
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  const isGuruArea = pathname?.startsWith("/guru");

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* HEADER GURU UNIVERSAL (HP & LAPTOP) */}
        {isGuruArea && <GuruHeader />}

        {/* HEADER KHUSUS ADMIN (TAMPIL DI HP SAJA) */}
        {!isGuruArea && (
          <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-20">
            <div className="font-extrabold text-slate-800 flex items-center gap-2">
              <span className="text-xl">🔐</span> Admin Panel
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </header>
        )}

        {/* Area Halaman Utama */}
        <main className="flex-1 overflow-y-auto relative w-full">
          {children}
        </main>

      </div>

      {/* Overlay Sidebar Admin Mobile */}
      {!isGuruArea && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}