"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GuruDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE UNTUK AI FUNNEL HEALTH (DATA REAL) ---
  const [analytics, setAnalytics] = useState({
    modulAjar: { count: 0, percentage: 0 },
    bankSoal: { count: 0, percentage: 0 },
    analisis: { count: 0, percentage: 0 },
    totalUsage: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Fetch User Data
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());

        // 2. Fetch Recent Documents & Kalkulasi Analytics
        const q = query(
          collection(db, "dokumen"), 
          where("id_user", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        
        const docs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
        docs.sort((a, b) => (b.dibuat_pada?.toMillis() || 0) - (a.dibuat_pada?.toMillis() || 0));
        setRecentDocs(docs.slice(0, 4));

        // --- PROSES KALKULASI AI FUNNEL HEALTH ---
        const totalDocs = docs.length;
        if (totalDocs > 0) {
          let countModul = 0;
          let countSoal = 0;
          let countAnalisis = 0;

          docs.forEach(doc => {
            const tipe = doc.tipe || "";
            if (tipe.includes("Modul") || tipe.includes("RPP") || tipe.includes("PPM")) countModul++;
            else if (tipe.includes("Soal") || tipe.includes("Rubrik")) countSoal++;
            else if (tipe.includes("Analisis") || tipe.includes("ATP") || tipe.includes("PROTA") || tipe.includes("PROMES")) countAnalisis++;
          });

          setAnalytics({
            modulAjar: { count: countModul, percentage: Math.round((countModul / totalDocs) * 100) },
            bankSoal: { count: countSoal, percentage: Math.round((countSoal / totalDocs) * 100) },
            analisis: { count: countAnalisis, percentage: Math.round((countAnalisis / totalDocs) * 100) },
            totalUsage: totalDocs
          });
        }

      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleTopUpWA = () => {
    const adminWhatsAppNumber = "6285648238172"; 
    const pesan = `Halo Admin Syntax, saya guru atas nama *${userData?.nama || "..."}*. Saya ingin mengajukan request penambahan kuota AI.`;
    window.open(`https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent(pesan)}`, "_blank");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 15) return "Good afternoon";
    if (hour < 19) return "Good evening";
    return "Good night";
  };

  if (loading) return <div className="p-8 animate-pulse text-slate-400 font-bold">Memuat command center...</div>;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* ... [KODE HEADER & GREETING TETAP SAMA] ... */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-[42px] font-black text-slate-800 tracking-tight leading-tight">
            {getGreeting()}, {userData?.nama?.split(' ')[0] || "Pendidik"}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-500 font-medium mt-1.5 md:mt-2 max-w-xl text-sm">
            Pantau sisa kuota, riwayat pembuatan dokumen, dan akses cepat fitur AI dari satu command center.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#1E1E1E] text-white px-5 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-3 w-max shadow-lg border border-slate-700">
          <span className="text-slate-300">Active period</span>
          <span className="bg-white/10 px-3 py-1 rounded-full">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ... [CARD 1, 2, & 3 TETAP SAMA] ... */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-4 bg-gradient-to-br from-[#FF6B4A] to-[#FF4B2B] rounded-[32px] p-8 text-white shadow-[0_20px_40px_rgba(255,107,74,0.2)] flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <span className="font-bold text-white/90 tracking-wide text-sm">Sisa Token / Kuota</span>
              <span className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-inner flex items-center justify-center">⚡</span>
            </div>
            <h2 className="text-[56px] font-black mb-1 tracking-tighter leading-none">{userData?.sisa_kuota !== undefined ? userData.sisa_kuota : 0}</h2>
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-sm mt-3">
              <span className="text-green-300">↑ Bebas Akses</span>
              <span>Seluruh Fitur AI</span>
            </div>
          </div>
          <div className="relative z-10 mt-8 flex flex-col gap-3">
            <Link href="/guru/generator" className="w-full bg-white text-[#FF4B2B] font-bold text-sm py-3.5 px-4 rounded-2xl text-center shadow-sm hover:scale-95 transition-transform flex items-center justify-center gap-2">
              ✨ Buka AI Generator
            </Link>
            <button onClick={handleTopUpWA} className="w-full bg-black/15 text-white font-bold text-[13px] py-3 px-4 rounded-2xl text-center hover:bg-black/25 transition-colors backdrop-blur-sm">
              💬 Ajukan Tambahan Kuota
            </button>
          </div>
          <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-8 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-[32px] p-8 md:p-10 text-white shadow-[0_20px_40px_rgba(16,185,129,0.2)] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
          <div className="flex-1 relative z-10">
            <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-5 inline-block shadow-inner">Fitur Unggulan</span>
            <h2 className="text-3xl md:text-[38px] font-black leading-tight mb-4">Coba Fitur Vision Sekarang</h2>
            <p className="text-emerald-50 text-[15px] font-medium mb-8 max-w-md leading-relaxed">
              Ubah foto materi dari buku cetak menjadi teks ringkasan, atau buat soal evaluasi secara instan hanya dengan memotret halaman.
            </p>
            <Link href="/guru/vision" className="bg-[#1E1E1E] text-white font-bold text-sm px-7 py-4 rounded-2xl shadow-xl hover:scale-95 transition-transform inline-flex items-center gap-2">
              📸 Buka Kamera / Upload Foto
            </Link>
          </div>
          <div className="w-32 h-32 md:w-48 md:h-48 relative z-10 shrink-0 hidden sm:flex items-center justify-center">
            <div className="w-full h-full bg-white/10 border-[6px] border-white/20 rounded-[32px] flex items-center justify-center text-7xl shadow-2xl backdrop-blur-md rotate-6 group-hover:rotate-0 transition-transform duration-500">
              🤖
            </div>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-5 bg-white rounded-[32px] p-8 shadow-sm flex flex-col border border-slate-100/50">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Riwayat Dokumen</h3>
              <p className="text-[12px] text-slate-400 font-medium mt-1">Perangkat ajar yang terakhir dibuat</p>
            </div>
            <Link href="/guru/koleksi" className="text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full text-[11px] font-bold hover:bg-slate-100 transition-colors shrink-0">
              View All
            </Link>
          </div>
          <div className="space-y-2 flex-1">
            {recentDocs.length > 0 ? recentDocs.map((doc: any, i) => (
              <Link key={doc.id} href={`/guru/koleksi/${doc.id}`}>
                <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#F4F5F7] group-hover:bg-white group-hover:shadow-sm flex items-center justify-center text-xl shrink-0 transition-all border border-slate-100">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[13px] text-slate-800 truncate">{doc.topik || "Dokumen Tanpa Judul"}</h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{doc.tipe} • {doc.mapel}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-md uppercase tracking-wider ${i === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      {i === 0 ? 'Baru' : 'Tersimpan'}
                    </span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="text-4xl mb-3 opacity-50">📭</div>
                <p className="text-sm font-bold">Belum ada riwayat dokumen</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* CARD 4: AI ANALYTICS (SEKARANG MENGGUNAKAN DATA REAL) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-7 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/50 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">AI Funnel Health</h3>
              <p className="text-[12px] text-slate-400 font-medium mt-1">Distribusi performa pembuatan perangkat ajar</p>
            </div>
            <div className="w-10 h-10 bg-[#F4F5F7] rounded-xl flex items-center justify-center text-slate-400 border border-slate-200/60">📊</div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[11px] uppercase tracking-wider font-bold mb-2">
                <span className="text-slate-500">Modul Ajar / RPP</span>
                <span className="text-slate-800">{analytics.modulAjar.percentage}%</span>
              </div>
              <div className="w-full bg-[#F4F5F7] h-3 rounded-full overflow-hidden">
                <div className="bg-[#FF6B4A] h-full rounded-full transition-all duration-1000" style={{ width: `${analytics.modulAjar.percentage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] uppercase tracking-wider font-bold mb-2">
                <span className="text-slate-500">Bank Soal & Rubrik</span>
                <span className="text-slate-800">{analytics.bankSoal.percentage}%</span>
              </div>
              <div className="w-full bg-[#F4F5F7] h-3 rounded-full overflow-hidden">
                <div className="bg-[#1E1E1E] h-full rounded-full transition-all duration-1000" style={{ width: `${analytics.bankSoal.percentage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] uppercase tracking-wider font-bold mb-2">
                <span className="text-slate-500">Analisis TP & ATP</span>
                <span className="text-slate-800">{analytics.analisis.percentage}%</span>
              </div>
              <div className="w-full bg-[#F4F5F7] h-3 rounded-full overflow-hidden">
                <div className="bg-[#10b981] h-full rounded-full transition-all duration-1000" style={{ width: `${analytics.analisis.percentage}%` }}></div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
            <div className="flex-1 bg-[#F4F5F7] p-4 rounded-2xl border border-slate-200/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Usage (Total)</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{analytics.totalUsage}</p>
              <p className="text-[10px] font-bold text-emerald-500 mt-1">Dokumen dibuat</p>
            </div>
            <div className="flex-1 bg-[#F4F5F7] p-4 rounded-2xl border border-slate-200/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efisiensi</p>
              <p className="text-2xl font-black text-slate-800 mt-1">Aktif</p>
              <p className="text-[10px] font-bold text-emerald-500 mt-1">Sistem berjalan optimal</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}