"use client";

import Sidebar from "@/components/Sidebar";
import GuruHeader from "@/components/GuruHeader"; 
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Deteksi apakah user sedang berada di halaman guru
  const isGuruArea = pathname?.startsWith("/guru");

  return (
    // UBAH: Background dirubah ke abu-abu sangat muda (#F4F5F7) 
    // agar Bento Box berwarna putih tulen bisa terlihat melayang dan kontras.
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden selection:bg-orange-500 selection:text-white">
      
      {/* SIDEBAR UTAMA (Desktop & Bottom Nav Mobile) */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* HEADER GURU UNIVERSAL (Bentuk Floating Pill) */}
        {isGuruArea && <GuruHeader />}

        {/* Area Halaman Utama */}
        <main className="flex-1 overflow-y-auto relative w-full scroll-smooth hide-scrollbar">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}