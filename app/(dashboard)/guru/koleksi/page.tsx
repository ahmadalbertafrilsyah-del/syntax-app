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
          const dateObj = docData.dibuat_pada ? docData.dibuat_pada.toDate() : new Date();
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
    <div className="max-w-[1400px] mx-auto pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 space-y-6">
      
      {/* HEADER TERPADU (Gaya Dashboard Premium) */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8">
        
        {/* Teks Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">📚</div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Arsip Koleksi</h1>
            <p className="text-[12px] md:text-sm text-slate-500 mt-1 font-medium">Dokumen perangkat ajar Anda yang telah di-generate AI.</p>
          </div>
        </div>

        {/* Kontrol Pencarian & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-[260px] lg:w-[320px]">
            <svg className="w-4 h-4 md:w-5 md:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Cari topik atau mapel..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-3 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full shadow-sm text-[13px] md:text-sm font-medium text-slate-700 transition-all"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-full sm:w-[160px]">
            <select 
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="w-full py-3 md:py-3.5 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-[13px] md:text-sm font-bold text-slate-600 transition-all appearance-none shadow-sm cursor-pointer"
            >
              <option value="Semua">Semua Tipe</option>
              <option value="Modul Ajar (PPM)">Modul Ajar (PPM)</option>
              <option value="RPP">RPP</option>
              <option value="Alur TP (ATP)">Alur TP (ATP)</option>
              <option value="Analisis TP">Analisis TP</option>
              <option value="PROMES">PROMES</option>
              <option value="PROTA">PROTA</option>
              <option value="Bank Soal">Bank Soal</option>
              <option value="Rubrik Penilaian">Rubrik</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence>
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                // Tentukan warna tema berdasarkan Tipe Dokumen
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
                    className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all p-5 md:p-6 group flex flex-col h-full"
                  >
                    
                    <div className="flex justify-between items-start mb-4">
                      {/* Lencana (Badge) Tipe Dokumen */}
                      <span className={`text-[10px] md:text-[11px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5
                        ${themeColor === "indigo" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : 
                          themeColor === "rose" ? "bg-rose-50 text-rose-700 border-rose-100" : 
                          themeColor === "purple" ? "bg-purple-50 text-purple-700 border-purple-100" : 
                          "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          themeColor === "indigo" ? "bg-indigo-500" : themeColor === "rose" ? "bg-rose-500" : themeColor === "purple" ? "bg-purple-500" : "bg-emerald-500"
                        }`}></div>
                        {item.tipe}
                      </span>
                      {/* Tanggal */}
                      <span className="text-[10px] md:text-[11px] text-slate-400 font-bold bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">{item.tanggal}</span>
                    </div>

                    {/* Judul & Detail */}
                    <div className="flex-1">
                      <h3 className="font-bold text-base md:text-lg text-slate-800 leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {item.topik}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] md:text-xs font-semibold text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[120px] md:max-w-[150px]">{item.mapel}</span>
                        <span>•</span>
                        <span>{item.fase.split(' ')[0] + " " + (item.fase.split(' ')[1] || '')}</span>
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                      <Link href={`/guru/koleksi/${item.id}`} className="flex-1">
                        <button className="w-full bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 py-2.5 rounded-xl text-[12px] md:text-[13px] font-bold transition-all border border-slate-200 hover:border-indigo-200 flex items-center justify-center gap-2 active:scale-[0.98]">
                          Buka Dokumen
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-slate-200 hover:border-rose-200 flex items-center justify-center active:scale-[0.98]" 
                        title="Hapus Dokumen"
                      >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                  </motion.div>
                );
              })
            ) : (
              // EMPTY STATE YANG LEBIH INTERAKTIF
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="col-span-full py-16 md:py-24 flex flex-col items-center justify-center text-center bg-white rounded-[32px] border border-slate-100 border-dashed"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mb-6 text-4xl md:text-5xl shadow-inner">🗂️</div>
                <h3 className="font-black text-slate-800 mb-2 text-lg md:text-xl">Lemari Arsip Kosong</h3>
                <p className="text-[13px] md:text-sm text-slate-500 max-w-sm px-4 mb-6">
                  {search !== "" 
                    ? "Kata kunci yang Anda cari tidak ditemukan dalam arsip." 
                    : "Anda belum pernah meracik dokumen apa pun. Mari mulai buat perangkat ajar pertama Anda!"}
                </p>
                {search === "" && (
                  <Link href="/guru/generator">
                    <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-[13px] md:text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Buat Dokumen Sekarang
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