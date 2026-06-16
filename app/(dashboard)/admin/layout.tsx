"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        const checkAdmin = async () => {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().role === "admin") {
            setIsAdmin(true);
          } else {
            router.push("/guru"); // Tendang ke dashboard guru jika bukan admin
          }
        };
        checkAdmin();
      }
    }
  }, [user, loading, router]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Layout murni tanpa AdminHeader terpisah, karena Header sudah menyatu di dalam page.tsx
  return (
    <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 bg-[#F4F5F7] min-h-screen">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}