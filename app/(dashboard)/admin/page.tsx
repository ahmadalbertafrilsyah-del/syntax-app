"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [stats, setStats] = useState({ totalUsers: 0, totalDocs: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      // 1. Cek Autentikasi & Keamanan Role Admin
      if (!auth.currentUser) return router.push("/login");
      try {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().role === "admin") {
          setAdminName(docSnap.data().nama || "Super Admin");
        } else {
          return router.push("/guru"); // Jika bukan admin, usir ke halaman guru
        }

        // 2. Ambil Data Statistik dari Firestore
        const usersSnap = await getDocs(collection(db, "users"));
        const docsSnap = await getDocs(collection(db, "dokumen"));
        
        // 3. Ambil 5 user (guru) pendaftar terbaru
        const recentQuery = query(collection(db, "users"), orderBy("dibuat_pada", "desc"), limit(5));
        const recentSnap = await getDocs(recentQuery);
        
        setStats({
          totalUsers: usersSnap.size,
          totalDocs: docsSnap.size
        });
        
        setRecentUsers(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      } catch (error) {
        console.error("Gagal memuat data admin:", error);
        router.push("/login");
      }
    };

    fetchAdminData();
  }, [router]);

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-slate-500 animate-pulse">Memuat Sistem Admin...</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Topbar Admin (Header) */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Admin Control Panel 🔐</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Selamat datang kembali, <span className="font-bold text-indigo-600">{adminName}</span>. Berikut adalah ringkasan sistem Anda.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Database Aktif</span>
        </div>
      </header>

      {/* STAT CARD GRID - APLIKASI (Total User & Dokumen) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="text-3xl bg-blue-50 w-12 h-12 flex items-center justify-center rounded-2xl">👥</div>
          </div>
          <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider relative z-10">Total Guru Terdaftar</h3>
          <div className="text-5xl font-black text-slate-800 relative z-10">{stats.totalUsers}</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="text-3xl bg-emerald-50 w-12 h-12 flex items-center justify-center rounded-2xl">📄</div>
          </div>
          <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wider relative z-10">Total Dokumen AI</h3>
          <div className="text-5xl font-black text-slate-800 relative z-10">{stats.totalDocs}</div>
        </motion.div>
      </div>

      {/* User Management Quick View (Menggunakan Data Asli Firestore) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm mt-8"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Pendaftar Terbaru</h2>
          <Link href="/admin/users" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
            Lihat Semua Guru &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-4 pl-6 border-b border-slate-100">Nama Guru</th>
                <th className="p-4 border-b border-slate-100">Asal Sekolah</th>
                <th className="p-4 border-b border-slate-100">Sisa Kuota</th>
                <th className="p-4 pr-6 border-b border-slate-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 pl-6 font-semibold text-slate-800">{u.nama}</td>
                  <td className="p-4 text-slate-500">{u.sekolah || "-"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      u.sisa_kuota < 10 
                        ? 'bg-red-50 text-red-600' 
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {u.sisa_kuota} Token
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Link href="/admin/users" className="inline-block px-4 py-2 bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-lg font-bold text-xs transition-colors">
                      Kelola
                    </Link>
                  </td>
                </tr>
              ))}
              
              {/* Fallback jika database masih kosong */}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-500 italic">
                    Belum ada guru yang mendaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}