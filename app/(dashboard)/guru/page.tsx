"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function GuruDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Banner Slider (Bisa diambil dari database Admin nantinya)
  const [currentSlide, setCurrentSlide] = useState(0);
  const banners = [
    {
      id: 1,
      title: "Selamat Datang di Era Baru Pendidikan!",
      desc: "Manfaatkan kekuatan AI (Artificial Intelligence) untuk menyusun perangkat ajar berstandar nasional dalam hitungan menit.",
      bg: "from-indigo-600 to-purple-700",
      icon: "🚀"
    },
    {
      id: 2,
      title: "Coba Fitur Vision Sekarang",
      desc: "Ubah foto materi dari buku cetak menjadi teks ringkasan atau soal evaluasi secara instan.",
      bg: "from-emerald-500 to-teal-700",
      icon: "📸"
    },
    {
      id: 3,
      title: "Auto-Korektor Telah Hadir",
      desc: "Tinggalkan cara manual. Biarkan AI (Artificial Intelligence) mengoreksi esai siswa Anda berdasarkan rubrik yang Anda tentukan.",
      bg: "from-rose-500 to-pink-700",
      icon: "💯"
    }
  ];

  // Auto-slide banner
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [banners.length]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch User Data
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());

        // Fetch Recent Documents (3 Terakhir)
        const q = query(
          collection(db, "dokumen"), 
          where("id_user", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        
        // Manual sort karena tidak semua database memiliki index composite
        const docs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
        docs.sort((a, b) => b.dibuat_pada?.toMillis() - a.dibuat_pada?.toMillis());
        setRecentDocs(docs.slice(0, 3));

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

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6 pb-24 md:pb-10 px-4 md:px-8 pt-4 md:pt-6">
      
      {/* TATA LETAK ATAS: BANNER SLIDER & KUOTA (GRID 3 KOLOM) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KOLOM KIRI (2 Bagian): BANNER SLIDER OTOMATIS */}
        <motion.div variants={itemVariants} className="md:col-span-2 relative h-[200px] md:h-[240px] rounded-3xl overflow-hidden shadow-sm group">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 bg-gradient-to-br ${banners[currentSlide].bg} p-6 md:p-8 text-white flex flex-col justify-center`}
            >
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="text-4xl md:text-5xl">{banners[currentSlide].icon}</div>
                <div>
                  <h2 className="text-xl md:text-3xl font-black mb-2 leading-tight drop-shadow-sm">{banners[currentSlide].title}</h2>
                  <p className="text-white/80 text-[13px] md:text-sm max-w-md font-medium leading-relaxed">{banners[currentSlide].desc}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Slider Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {banners.map((_, idx) => (
              <button 
                key={idx} 
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all ${currentSlide === idx ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </motion.div>

        {/* KOLOM KANAN (1 Bagian): KARTU KUOTA */}
        <motion.div variants={itemVariants} className="md:col-span-1 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-50 opacity-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Sisa Token
              </div>
              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Pro</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight">{userData?.sisa_kuota !== undefined ? userData.sisa_kuota : 0}</h2>
            <p className="text-slate-400 text-xs font-medium mt-1">Gunakan dengan bijak</p>
          </div>
          <button onClick={handleTopUpWA} className="mt-6 w-full py-3.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 active:scale-95 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 border border-slate-200 hover:border-indigo-200">
            Tambahan Token
          </button>
        </motion.div>

      </div>

      {/* TATA LETAK TENGAH: STATISTIK MINI & AKSES CEPAT (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KIRI: STATISTIK MINI & PROFIL SINGKAT */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">🌱</div>
             <div>
               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Level Pengguna</p>
               <h3 className="font-black text-slate-800 text-lg">Pendidik Inovatif</h3>
             </div>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">📈</div>
             <div>
               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Aktivitas Sistem</p>
               <h3 className="font-black text-slate-800 text-lg">Sistem Berjalan Normal</h3>
             </div>
          </motion.div>
        </div>

        {/* KANAN: DOKUMEN TERAKHIR (RECENT ACTIVITY) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Riwayat Terakhir
            </h3>
            <Link href="/guru/koleksi">
              <span className="text-[12px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer">Lihat Semua &rarr;</span>
            </Link>
          </div>
          
          <div className="p-2 flex-1">
            {recentDocs.length > 0 ? (
              <div className="flex flex-col h-full justify-center">
                {recentDocs.map((doc) => (
                  <Link key={doc.id} href={`/guru/koleksi/${doc.id}`}>
                    <div className="p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer flex items-center gap-4 border border-transparent hover:border-slate-100">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg shrink-0">📄</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{doc.topik}</h4>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mt-1">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">{doc.tipe}</span>
                          <span>•</span>
                          <span className="truncate">{doc.mapel}</span>
                        </div>
                      </div>
                      <div className="text-slate-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-3">👻</div>
                <h4 className="font-bold text-slate-700 text-sm">Belum Ada Aktivitas</h4>
                <p className="text-xs text-slate-500 mt-1">Anda belum membuat dokumen apapun.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
}