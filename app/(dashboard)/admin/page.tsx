"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminData, setAdminData] = useState<any>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalDocs: 0, kuotaHabis: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Jam Real-time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hari = date.toLocaleDateString('id-ID', { weekday: 'short' });
    const tanggal = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${hari}, ${tanggal} • ${jam} WIB`;
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (!user) return router.push("/login");

        try {
          // Cek Role & Data Admin
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().role === "admin") {
            setAdminData(docSnap.data());
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

  const handleLogout = async () => {
    if(confirm("Apakah Anda yakin ingin keluar dari panel Admin?")) {
      await auth.signOut();
      router.push("/login");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 15) return "Good Afternoon";
    if (hour < 19) return "Good Evening";
    return "Good Night";
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-slate-400">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-sm animate-pulse">Memuat Command Center Admin...</div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* ================= HEADER ALA DASHBOARD GURU ================= */}
      <header className="px-4 md:px-8 pt-4 md:pt-6 pb-2 w-full flex items-center justify-between z-30 sticky top-0 bg-[#F4F5F7]/80 backdrop-blur-md">
        
        {/* Logo (Khusus HP) */}
        <div className="flex md:hidden items-center gap-2 pl-1">
          <img src="https://i.ibb.co.com/JjK2w93q/LOGO-SYNTAX.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow-sm" />
          <span className="text-[18px] font-black text-indigo-600 tracking-tight">Syntax</span>
        </div>

        {/* Jam Real-time (Desktop) */}
        <div className="hidden md:flex items-center bg-white px-4 py-2.5 rounded-full shadow-sm border border-slate-100/80">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Kanan: Profil & Logout */}
        <div className="flex items-center gap-2 bg-white p-1.5 pr-2 md:pr-4 rounded-full shadow-sm border border-slate-100/80 shrink-0">
          
          {/* Profil Admin */}
          <div className="flex items-center gap-2 pl-1 pr-2">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden shrink-0 border-2 border-white">
              {adminData?.fotoProfile ? (
                <img src={adminData.fotoProfile} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{adminData?.nama ? adminData.nama.charAt(0).toUpperCase() : "A"}</span>
              )}
            </div>
            <div className="hidden sm:block">
              <h2 className="text-[13px] font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {adminData?.nama || "Super Admin"}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-widest">Administrator</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

          {/* Tombol Logout */}
          <button onClick={handleLogout} className="p-1.5 md:p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-colors flex items-center gap-2" title="Keluar">
            <span className="text-[11px] font-bold hidden md:inline ml-1">Keluar</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>

        </div>
      </header>

      {/* ================= KONTEN UTAMA ================= */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] w-full mx-auto space-y-8 pb-24 md:pb-10 px-4 md:px-8 pt-4">
        
        {/* HEADER GREETING (Gaya SaaS) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div>
            <motion.h1 variants={itemVariants} className="text-3xl md:text-[42px] font-black text-slate-800 tracking-tight leading-tight">
              {getGreeting()}, {adminData?.nama?.split(' ')[0] || "Admin"}
            </motion.h1>
            <motion.p variants={itemVariants} className="text-slate-500 font-medium mt-1.5 md:mt-2 max-w-xl text-sm">
              Pantau total pendidik, aktivitas dokumen AI, dan kelola kuota pengguna dari satu pusat komando.
            </motion.p>
          </div>
          <motion.div variants={itemVariants} className="bg-white border border-slate-200 px-5 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-3 w-max shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-600 uppercase tracking-widest">Sistem Aktif</span>
          </motion.div>
        </div>

        {/* METRICS CARDS (3 KOLOM BENTO) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Card 1: Total Guru */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-gradient-to-br from-[#1E1E1E] to-[#333333] rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex justify-between items-start mb-6">
              <span className="font-bold text-white/70 uppercase tracking-widest text-[11px]">Total Pendidik Aktif</span>
              <span className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm shadow-inner flex items-center justify-center text-xl">👨‍🏫</span>
            </div>
            <div className="relative z-10 mt-4">
              <h2 className="text-[64px] font-black tracking-tighter leading-none">{stats.totalUsers}</h2>
              <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-sm mt-4">
                <span className="text-emerald-400">Terdaftar</span>
                <span className="text-white/80">Di sistem Syntax</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Total Dokumen */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-indigo-50 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-100 transition-colors duration-700"></div>
            <div className="relative z-10 flex justify-between items-start mb-6">
              <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px]">Dokumen Ter-generate</span>
              <span className="bg-indigo-50 p-2.5 rounded-xl shadow-inner flex items-center justify-center text-xl border border-indigo-100">📄</span>
            </div>
            <div className="relative z-10 mt-4">
              <h2 className="text-[64px] font-black text-slate-800 tracking-tighter leading-none">{stats.totalDocs}</h2>
              <div className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full text-[11px] font-bold mt-4 border border-slate-100">
                <span className="text-indigo-600">Dokumen</span>
                <span className="text-slate-500">dibuat oleh AI</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Kuota Habis */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-rose-50 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-100 transition-colors duration-700"></div>
            <div className="relative z-10 flex justify-between items-start mb-6">
              <span className="font-bold text-slate-400 uppercase tracking-widest text-[11px]">Butuh Tambahan Kuota</span>
              <span className="bg-rose-50 p-2.5 rounded-xl shadow-inner flex items-center justify-center text-xl border border-rose-100">⚠️</span>
            </div>
            <div className="relative z-10 mt-4">
              <h2 className="text-[64px] font-black text-rose-500 tracking-tighter leading-none">{stats.kuotaHabis}</h2>
              <div className="inline-flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-full text-[11px] font-bold mt-4 border border-rose-100">
                <span className="text-rose-600">Pendidik</span>
                <span className="text-slate-500">Kehabisan Token</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* TATA LETAK BAWAH: TABEL KIRI & AKTIVITAS KANAN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* KOLOM KIRI: TABEL PENDAFTAR TERBARU */}
          <motion.div variants={itemVariants} className="lg:col-span-8 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-6 md:p-8 flex justify-between items-end border-b border-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Pendaftar Terbaru</h3>
                <p className="text-[12px] text-slate-400 font-medium mt-1">Guru yang baru saja bergabung ke Syntax</p>
              </div>
              <Link href="/admin/users" className="text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full text-[11px] font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors shrink-0">
                Lihat Semua
              </Link>
            </div>
            
            <div className="overflow-x-auto flex-1 p-2">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                    <th className="p-4 pl-6">Profil Pendidik</th>
                    <th className="p-4">Instansi</th>
                    <th className="p-4 text-center">Sisa Kuota</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#F4F5F7] group-hover:bg-white border border-transparent group-hover:border-slate-200 group-hover:shadow-sm text-slate-600 flex items-center justify-center font-bold text-[15px] shrink-0 overflow-hidden transition-all">
                            {u.fotoProfile ? <img src={u.fotoProfile} alt="P" className="w-full h-full object-cover" /> : (u.nama ? u.nama.charAt(0).toUpperCase() : "G")}
                          </div>
                          <div>
                            <div className="font-bold text-[13px] text-slate-800 truncate max-w-[150px]">{u.nama}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[12px] text-slate-500 font-medium truncate max-w-[150px]">
                        {u.sekolah || <span className="text-slate-300 italic">Belum diisi</span>}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          u.sisa_kuota <= 0 ? 'bg-rose-50 text-rose-600' : u.sisa_kuota < 10 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {u.sisa_kuota <= 0 ? 'Habis' : `${u.sisa_kuota} Token`}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <Link href="/admin/users" className="px-4 py-2 bg-white border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 rounded-xl font-bold text-[11px] transition-all shadow-sm">
                          Kelola
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium">Belum ada pengguna terdaftar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* KOLOM KANAN: LIVE ACTIVITY MONITORING */}
          <motion.div variants={itemVariants} className="lg:col-span-4 bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full block animate-pulse"></span>
                  Live AI Monitor
                </h3>
                <p className="text-[12px] text-slate-400 font-medium mt-1">Aktivitas dokumen terkini</p>
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto mb-4">
              {recentDocs.length > 0 ? (
                recentDocs.map((doc) => (
                  <Link key={doc.id} href="/admin/koleksi">
                    <div className="p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 cursor-pointer group">
                      <h4 className="font-bold text-slate-800 text-[13px] leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">{doc.topik}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">{doc.tipe}</span>
                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{doc.mapel}</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="text-4xl mb-3 opacity-50">📭</div>
                  <p className="text-sm font-bold">Belum ada aktivitas</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-4">
               <Link href="/admin/koleksi" className="w-full">
                 <button className="w-full bg-[#F4F5F7] text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold text-[12px] py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    Buka Manajemen Koleksi &rarr;
                 </button>
               </Link>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}