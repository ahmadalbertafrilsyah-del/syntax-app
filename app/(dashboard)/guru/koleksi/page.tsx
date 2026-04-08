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
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus dokumen ini dari arsip?");
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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      
      {/* Header & Kontrol Pencarian */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 md:mb-8">
        <div>
          {/* Font diperkecil di mobile (text-2xl), normal di laptop (md:text-3xl) */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Koleksi Saya 📚</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2">Arsip perangkat ajar yang telah Anda hasilkan menggunakan AI.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <div className="relative">
            <svg className="w-4 h-4 md:w-5 md:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Cari topik atau mapel..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 md:py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64 shadow-sm text-xs md:text-sm"
            />
          </div>

          <select 
            value={filterTipe}
            onChange={(e) => setFilterTipe(e.target.value)}
            className="py-2 md:py-2.5 px-3 md:px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-xs md:text-sm font-medium text-slate-600"
          >
            <option value="Semua">Semua Dokumen</option>
            <option value="Modul Ajar">Modul Ajar</option>
            <option value="RPP">RPP</option>
            <option value="Bank Soal">Bank Soal</option>
            <option value="Rubrik">Rubrik</option>
          </select>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="animate-pulse text-sm md:text-base">Mengambil arsip dari server...</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <AnimatePresence>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <motion.div 
                  key={item.id}
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  // Padding diperkecil di mobile (p-4), normal di laptop (md:p-6)
                  className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all p-4 md:p-6 group flex flex-col h-full relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${
                    item.tipe === "Modul Ajar" ? "bg-indigo-500" : 
                    item.tipe === "Bank Soal" ? "bg-rose-500" : 
                    item.tipe === "Rubrik" ? "bg-amber-500" : "bg-emerald-500"
                  }`}></div>

                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <span className={`text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full ${
                      item.tipe === "Modul Ajar" ? "bg-indigo-50 text-indigo-600" : 
                      item.tipe === "Bank Soal" ? "bg-rose-50 text-rose-600" : 
                      item.tipe === "Rubrik" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {item.tipe}
                    </span>
                    <span className="text-[10px] md:text-xs text-slate-400 font-medium">{item.tanggal}</span>
                  </div>

                  {/* Judul diperkecil di mobile (text-base), normal di laptop (md:text-lg) */}
                  <h3 className="font-bold text-base md:text-lg text-slate-800 leading-snug mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {item.topik}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 mb-4">{item.mapel} • {item.fase}</p>

                  <div className="mt-auto pt-3 md:pt-4 border-t border-slate-50 flex gap-2">
                    <Link href={`/guru/koleksi/${item.id}`} className="flex-1">
                      <button className="w-full bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold transition-colors">
                        Detail
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="p-1.5 md:p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg md:rounded-xl transition-colors" 
                      title="Hapus Dokumen"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="col-span-full py-12 md:py-20 flex flex-col items-center justify-center text-center text-slate-400"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-3xl md:text-4xl">🗂️</div>
                <h3 className="font-bold text-slate-600 mb-1 text-sm md:text-base">Belum ada dokumen</h3>
                <p className="text-xs md:text-sm max-w-sm px-4">Anda belum pernah membuat dokumen, atau kata kunci yang dicari tidak ditemukan.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}