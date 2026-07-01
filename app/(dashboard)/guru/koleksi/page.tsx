"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function KoleksiPage() {
  const { user } = useAuth();
  
  const [koleksiData, setKoleksiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterTipe, setFilterTipe] = useState("Semua");

  useEffect(() => {
    const fetchKoleksi = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const q = query(collection(db, "dokumen"), where("id_user", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        const data = querySnapshot.docs.map((docSnap) => {
          const docData = docSnap.data();
          
          // 🔥 PERBAIKAN: Menangkap berbagai kemungkinan nama field tanggal dari Firestore
          const rawDate = docData.createdAt || docData.dibuat_pada || docData.created_at || docData.timestamp || docData.date;
          
          let dateObj = new Date();
          if (rawDate) {
            if (typeof rawDate.toDate === 'function') {
              dateObj = rawDate.toDate(); // Jika format asli Firebase Timestamp
            } else if (rawDate.seconds) {
              dateObj = new Date(rawDate.seconds * 1000); // Jika ter-parse sebagai objek seconds
            } else {
              dateObj = new Date(rawDate); // Jika disave sebagai string/number biasa
            }
          }

          const tanggalFormat = dateObj.toLocaleDateString("id-ID", { 
            day: "numeric", month: "short", year: "numeric" 
          });

          return {
            id: docSnap.id,
            tipe: docData.tipe,
            mapel: docData.mapel,
            topik: docData.topik,
            fase: docData.fase,
            tanggal: tanggalFormat,
            rawDate: dateObj,
          };
        });

        data.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
        setKoleksiData(data);
      } catch (error) {
        console.error("Gagal mengambil data koleksi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKoleksi();
  }, [user]);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus dokumen ini secara permanen dari arsip?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "dokumen", id));
      setKoleksiData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Gagal menghapus dokumen:", error);
      alert("Terjadi kesalahan saat menghapus dokumen.");
    }
  };

  const filteredData = koleksiData.filter((item) => {
    const matchSearch = item.topik.toLowerCase().includes(search.toLowerCase()) || item.mapel.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterTipe === "Semua" || item.tipe === filterTipe;
    return matchSearch && matchFilter;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-24 md:pb-10 px-3 md:px-6 pt-4 md:pt-6 space-y-4 md:space-y-6">
      
      {/* HEADER TERPADU (Desain Minimalis & Ringkas) */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-4">
        
        {/* Teks Header - Lebih Kecil di HP */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl md:text-2xl shrink-0">📚</div>
          <div>
            <h1 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-none">Arsip Koleksi</h1>
            <p className="text-[11px] md:text-sm text-slate-500 mt-1 font-medium">Dokumen perangkat ajar Anda.</p>
          </div>
        </div>

        {/* Kontrol Pencarian & Filter - Sejajar di HP */}
        <div className="flex flex-row gap-2 w-full">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Cari mapel..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-2 py-2 md:py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full shadow-sm text-[12px] md:text-sm font-medium text-slate-700 transition-all h-9 md:h-10"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-[110px] sm:w-[150px] shrink-0">
            <select 
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="w-full py-2 md:py-2.5 px-2 pr-7 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-[11px] md:text-sm font-bold text-slate-600 transition-all appearance-none shadow-sm cursor-pointer h-9 md:h-10 truncate"
            >
              <option value="Semua">Semua</option>
              <option value="Modul Ajar (PPM)">Modul Ajar</option>
              <option value="RPP">RPP</option>
              <option value="Alur TP (ATP)">ATP</option>
              <option value="Analisis TP">Analisis TP</option>
              <option value="PROMES">PROMES</option>
              <option value="PROTA">PROTA</option>
              <option value="Bank Soal">Soal</option>
              <option value="Penilaian">Rubrik</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

        </div>
      </motion.div>

      {/* AREA KONTEN */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="relative mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-indigo-50 rounded-full"></div>
            <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-2xl">🗂️</div>
          </div>
          <p className="animate-pulse font-bold text-slate-600 text-sm md:text-base">Membuka Lemari Arsip...</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          <AnimatePresence>
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                const isModul = item.tipe.includes("Modul") || item.tipe.includes("RPP");
                const isSoal = item.tipe.includes("Soal");
                const isRubrik = item.tipe.includes("Rubrik");
                
                const themeColor = isModul ? "indigo" : isSoal ? "rose" : isRubrik ? "purple" : "emerald";

                return (
                  <motion.div 
                    key={item.id}
                    variants={itemVariants}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="bg-white rounded-[16px] md:rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md transition-all p-3 md:p-4 flex flex-col h-full"
                  >
                    
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                      <span className={`text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-md border inline-flex items-center gap-1 w-max
                        ${themeColor === "indigo" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : 
                          themeColor === "rose" ? "bg-rose-50 text-rose-700 border-rose-100" : 
                          themeColor === "purple" ? "bg-purple-50 text-purple-700 border-purple-100" : 
                          "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          themeColor === "indigo" ? "bg-indigo-500" : themeColor === "rose" ? "bg-rose-500" : themeColor === "purple" ? "bg-purple-500" : "bg-emerald-500"
                        }`}></div>
                        <span className="truncate max-w-[80px] md:max-w-full">{item.tipe}</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold">{item.tanggal}</span>
                    </div>

                    <div className="flex-1 mt-1">
                      <h3 className="font-bold text-[13px] md:text-sm text-slate-800 leading-tight mb-1.5 line-clamp-2" title={item.topik}>
                        {item.topik}
                      </h3>
                      <div className="text-[10px] md:text-[11px] font-semibold text-slate-500 flex flex-col gap-0.5">
                        <span className="truncate">{item.mapel}</span>
                        <span>{item.fase.split(' ')[0] + " " + (item.fase.split(' ')[1] || '')}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-50 flex gap-1.5">
                      <Link href={`/guru/koleksi/${item.id}`} className="flex-1">
                        <button className="w-full bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 py-1.5 md:py-2 rounded-lg text-[10px] md:text-[12px] font-bold transition-all border border-slate-200 hover:border-indigo-200 flex items-center justify-center gap-1 active:scale-[0.98]">
                          Buka
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-1.5 md:p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all border border-slate-200 hover:border-rose-200 flex items-center justify-center active:scale-[0.98] shrink-0" 
                        title="Hapus"
                      >
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-[24px] border border-slate-100 border-dashed"
              >
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4 text-3xl shadow-inner">🗂️</div>
                <h3 className="font-black text-slate-800 mb-1 text-base">Arsip Kosong</h3>
                <p className="text-[11px] md:text-[13px] text-slate-500 max-w-xs px-4 mb-4">
                  {search !== "" 
                    ? "Kata kunci tidak ditemukan." 
                    : "Belum ada dokumen yang dibuat."}
                </p>
                {search === "" && (
                  <Link href="/guru/generator">
                    <button className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-sm text-[11px] md:text-[13px]">
                      Buat Sekarang
                    </button>
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}