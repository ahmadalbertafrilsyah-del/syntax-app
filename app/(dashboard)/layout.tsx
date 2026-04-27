"use client";

import Sidebar from "@/components/Sidebar";
import GuruHeader from "@/components/GuruHeader"; 
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Deteksi apakah user sedang berada di halaman guru
  const isGuruArea = pathname?.startsWith("/guru");

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      
      {/* SIDEBAR UTAMA (Desktop & Bottom Nav Mobile) */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* HEADER GURU UNIVERSAL (Tampil hanya di area Guru) */}
        {isGuruArea && <GuruHeader />}

        {/* CATATAN: 
          Header Khusus Admin tidak dipanggil di sini, 
          melainkan dipanggil di dalam app/(dashboard)/admin/layout.tsx 
          agar arsitekturnya lebih rapi.
        */}

        {/* Area Halaman Utama */}
        <main className="flex-1 overflow-y-auto relative w-full">
          {children}
        </main>

      </div>
    </div>
  );
}