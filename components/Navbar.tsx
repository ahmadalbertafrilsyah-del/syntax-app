"use client";

import { useAuth } from "@/lib/AuthContext";
import { logoutUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

// Tambahkan prop onMenuClick di sini
export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push("/login");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Tombol menu mobile yang sekarang BERFUNGSI */}
        <button 
          onClick={onMenuClick} 
          className="md:hidden text-slate-600 hover:text-cyan-600 p-1.5 bg-slate-50 rounded-lg border border-slate-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-cyan-700 md:hidden">Syntax App</h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-700">
            {user?.displayName || user?.email?.split('@')[0] || "Guru"}
          </span>
          <span className="text-xs text-slate-500">Tenaga Pendidik</span>
        </div>
        
        <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold border border-cyan-200 shadow-sm">
          {user?.email?.charAt(0).toUpperCase() || "G"}
        </div>

        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        <button 
          onClick={handleLogout}
          className="text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
        >
          Keluar
        </button>
      </div>
    </header>
  );
}