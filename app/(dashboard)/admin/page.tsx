"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [stats, setStats] = useState({ totalUsers: 0, totalDocs: 0, kuotaHabis: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (!user) return router.push("/login");

        try {
          // Cek Role Admin
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().role === "admin") {
            setAdminName(docSnap.data().nama || "Super Admin");
          } else {
            return router.push("/guru"); 
          }

          // Fetch Semua Data
          const usersSnap = await getDocs(collection(db, "users"));
          const docsSnap = await getDocs(collection(db, "dokumen"));
          
          // Olah Data Users
          const semuaUser = usersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
          const daftarGuru = semuaUser.filter((u: any) => u.role !== "admin");

          const guruTerbaru = [...daftarGuru]
            .sort((a: any, b: any) => (b.dibuat_pada?.seconds || 0) - (a.dibuat_pada?.seconds || 0))
            .slice(0, 5); 
          
          const guruKehabisanKuota = daftarGuru.filter(u => (u.sisa_kuota || 0) <= 0).length;

          // Olah Data Dokumen Terkini
          const semuaDocs = docsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
          const dokumenTerbaru = [...semuaDocs]
            .sort((a: any, b: any) => (b.dibuat_pada?.seconds || 0) - (a.dibuat_pada?.seconds || 0))
            .slice(0, 5);

          // Update State
          setStats({
            totalUsers: daftarGuru.length,
            totalDocs: docsSnap.size,
            kuotaHabis: guruKehabisanKuota
          });
          
          setRecentUsers(guruTerbaru);
          setRecentDocs(dokumenTerbaru);

        } catch (error) {
          console.error("Gagal memuat data admin:", error);
          router.push("/login");
        } finally {
          setLoading(false);
        }
      });
    };

    fetchAdminData();
  }, [router]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-slate-400">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-sm animate-pulse">Memuat Sistem Admin...</div>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] mx-auto space-y-6 pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6">
      
      {/* HEADER OVERVIEW */}
      <motion.header variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Overview <span className="text-3xl">🔐</span>
          </h1>
          <p className="text-[13px] md:text-sm text-slate-500 mt-1 font-medium">Selamat datang kembali, <span className="font-bold text-indigo-600">{adminName}</span>.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] md:text-xs font-black text-emerald-700 uppercase tracking-widest">Sistem Aktif</span>
        </div>
      </motion.header>

      {/* METRICS CARDS (3 KOLOM) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
        
        {/* Card 1: Total Guru */}
        <motion.div variants={itemVariants} className="p-6 md:p-8 rounded-[24px] md:rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="text-2xl md:text-3xl bg-white/20 w-12 h-12 flex items-center justify-center rounded-2xl backdrop-blur-sm border border-white/20">👥</div>
          </div>
          <div className="relative z-10">
            <h3 className="text-blue-100 text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-1">Total Pendidik</h3>
            <div className="text-4xl md:text-5xl font-black drop-shadow-md">{stats.totalUsers}</div>
          </div>
        </motion.div>

        {/* Card 2: Total Dokumen */}
        <motion.div variants={itemVariants} className="p-6 md:p-8 rounded-[24px] md:rounded-[32px] bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="text-2xl md:text-3xl bg-emerald-50 text-emerald-600 w-12 h-12 flex items-center justify-center rounded-2xl shadow-inner border border-emerald-100">📄</div>
          </div>
          <div className="relative z-10">
            <h3 className="text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-1">Dokumen Ter-generate</h3>
            <div className="text-4xl md:text-5xl font-black text-slate-800">{stats.totalDocs}</div>
          </div>
        </motion.div>

        {/* Card 3: Kuota Habis (PERINGATAN) */}
        <motion.div variants={itemVariants} className="p-6 md:p-8 rounded-[24px] md:rounded-[32px] bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-rose-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="text-2xl md:text-3xl bg-rose-50 text-rose-600 w-12 h-12 flex items-center justify-center rounded-2xl shadow-inner border border-rose-100">⚠️</div>
          </div>
          <div className="relative z-10">
            <h3 className="text-rose-400 text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-1">Pendidik Kehabisan Kuota</h3>
            <div className="text-4xl md:text-5xl font-black text-rose-600">{stats.kuotaHabis}</div>
          </div>
        </motion.div>
      </div>

      {/* TATA LETAK BAWAH: TABEL KIRI & AKTIVITAS KANAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI (SPAN 2): TABEL PENDAFTAR TERBARU */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
            <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full block"></span>
              Pendaftar Terbaru
            </h2>
            <Link href="/admin/users">
              <button className="text-[11px] md:text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl active:scale-95">
                Kelola Pengguna &rarr;
              </button>
            </Link>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 pl-6 md:pl-8 text-[10px] uppercase tracking-widest font-black text-slate-400">Pendidik</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Instansi</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Sisa Kuota</th>
                  <th className="p-4 pr-6 text-right text-[10px] uppercase tracking-widest font-black text-slate-400">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px] md:text-sm">
                {recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 pl-6 md:pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {u.fotoProfile ? <img src={u.fotoProfile} alt="P" className="w-full h-full object-cover" /> : (u.nama ? u.nama.charAt(0).toUpperCase() : "G")}
                        </div>
                        <div className="font-bold text-slate-800 truncate max-w-[120px] sm:max-w-[150px]">{u.nama}</div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-medium truncate max-w-[120px] sm:max-w-[150px]">
                      {u.sekolah || <span className="text-slate-300 italic">Belum diisi</span>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black tracking-wide border ${
                        u.sisa_kuota <= 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : u.sisa_kuota < 10 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {u.sisa_kuota <= 0 ? 'Habis' : `${u.sisa_kuota} Token`}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Link href="/admin/users" className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 rounded-lg font-bold text-[11px] transition-all shadow-sm">
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* KOLOM KANAN (SPAN 1): LIVE ACTIVITY MONITORING */}
        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full block animate-pulse"></span>
              Aktivitas AI Terkini
            </h2>
          </div>
          <div className="p-2 flex-1">
            {recentDocs.length > 0 ? (
              <div className="flex flex-col">
                {recentDocs.map((doc, idx) => (
                  <Link key={doc.id} href="/admin/koleksi">
                    <div className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${idx !== recentDocs.length - 1 ? 'border-b border-slate-50' : ''}`}>
                      <h4 className="font-bold text-slate-800 text-[13px] leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600">{doc.topik}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500">
                        <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">{doc.tipe}</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{doc.mapel}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <div className="text-4xl mb-2 opacity-50">📭</div>
                <p className="text-xs font-bold">Belum ada aktivitas AI</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
            <Link href="/admin/koleksi" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800">Lihat Semua Arsip &rarr;</Link>
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
}