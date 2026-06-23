"use client";

import Sidebar from "@/components/Sidebar";
import SiswaSidebar from "@/components/SiswaSidebar"; // <-- Import Sidebar Siswa
import GuruHeader from "@/components/GuruHeader"; 
import SiswaHeader from "@/components/SiswaHeader";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Deteksi Area
  const isGuruArea = pathname?.startsWith("/guru");
  const isSiswaArea = pathname?.startsWith("/siswa");
  const isAdminArea = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        const checkAccess = async () => {
          try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const role = docSnap.data().role;
              if (isGuruArea && role === "siswa") router.push("/siswa");
              else if (isSiswaArea && role !== "siswa") router.push("/guru");
              else setIsAuthorized(true);
            } else {
              if (isSiswaArea) router.push("/guru");
              else setIsAuthorized(true);
            }
          } catch (error) {
            setIsAuthorized(true); 
          }
        };
        checkAccess();
      }
    }
  }, [user, loading, pathname, router, isGuruArea, isSiswaArea]);

  if (loading || isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F5F7]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* 🚀 LOGIKA RENDER SIDEBAR DINAMIS */}
      {(isGuruArea || isAdminArea) && <Sidebar />}
      {isSiswaArea && <SiswaSidebar />}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* HEADER DINAMIS */}
        {(isGuruArea || isAdminArea) && <GuruHeader />}
        {isSiswaArea && <SiswaHeader />}

        <main className="flex-1 overflow-y-auto relative w-full scroll-smooth hide-scrollbar">
          <div className="max-w-[1600px] mx-auto w-full h-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}