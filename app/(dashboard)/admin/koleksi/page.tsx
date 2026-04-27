"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function AdminKoleksiManagement() {
  const router = useRouter();
  const [dokumenList, setDokumenList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    // Tunggu auth inisialisasi sebentar jika diperlukan (opsional, tapi disarankan menggunakan onAuthStateChanged di real app)
    if (!auth.currentUser) return router.push("/login");
    
    try {
      // 1. Pastikan yang akses adalah Admin
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists() || docSnap.data().role !== "admin") {
        return router.push("/guru");
      }

      // 2. Ambil SEMUA data User (Guru) untuk mencocokkan nama
      const usersSnap = await getDocs(collection(db, "users"));
      const userMap: Record<string, string> = {};
      usersSnap.forEach((u) => {
        userMap[u.id] = u.data().nama || "Guru Tidak Dikenal";
      });

      // 3. Ambil SEMUA Dokumen yang pernah di-generate
      const q = query(collection(db, "dokumen"), orderBy("dibuat_pada", "desc"));
      const docSnapshots = await getDocs(q);
      
      const allDocs = docSnapshots.docs.map(d => {
        const data = d.data();
        const dateObj = data.dibuat_pada ? data.dibuat_pada.toDate() : new Date();
        const tanggalFormat = dateObj.toLocaleDateString("id-ID", { 
          day: "numeric", month: "short", year: "numeric", hour: '2-digit', minute:'2-digit'
        });

        return {
          id: d.id,
          ...data,
          tanggalFormatted: tanggalFormat,
          namaGuru: userMap[data.id_user] || "Sistem / Dihapus" 
        };
      });

      setDokumenList(allDocs);
    } catch (error) {
      console.error("Gagal mengambil data koleksi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Kita gunakan setTimeout kecil agar auth sempat terbaca sebelum fetching
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer);
  }, [router]);

  // Fungsi Hapus Dokumen
  const handleDelete = async (id: string, topik: string) => {
    if (!confirm(`Peringatan: Hapus dokumen "${topik}" secara permanen dari server? Aksi ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteDoc(doc(db, "dokumen", id));
      setDokumenList(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      alert("Gagal menghapus dokumen.");
    }
  };

  // Filter pencarian
  const filteredDocs = dokumenList.filter((d) => 
    d.topik?.toLowerCase().includes(search.toLowerCase()) || 
    d.namaGuru?.toLowerCase().includes(search.toLowerCase()) ||
    d.tipe?.toLowerCase().includes(search.toLowerCase())
  );

  // Helper untuk warna Lencana (Badge)
  const getBadgeColor = (tipe: string) => {
    if (!tipe) return "bg-slate-50 text-slate-600 border-slate-200";
    const t = tipe.toLowerCase();
    if (t.includes("modul") || t.includes("rpp")) return "bg-indigo-50 text-indigo-600 border-indigo-100";
    if (t.includes("soal")) return "bg-rose-50 text-rose-600 border-rose-100";
    if (t.includes("rubrik") || t.includes("analisis")) return "bg-amber-50 text-amber-600 border-amber-100";
    if (t.includes("prota") || t.includes("promes") || t.includes("alur") || t.includes("atp")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    return "bg-cyan-50 text-cyan-600 border-cyan-100";
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-slate-400">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-sm animate-pulse">Menyusun Laporan Arsip...</div>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] mx-auto space-y-6 pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6">
      
      {/* HEADER TERPADU: Judul & Pencarian */}
      <motion.div variants={itemVariants} className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">🗂️</div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Manajemen Koleksi AI</h1>
            <p className="text-[12px] md:text-sm text-slate-500 mt-1 font-medium">Pantau seluruh perangkat ajar yang di-generate di sistem.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-[320px] lg:w-[400px]">
          <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Cari judul, pembuat, atau tipe dokumen..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full shadow-sm text-[13px] md:text-sm font-medium text-slate-700 transition-all"
          />
        </div>
      </motion.div>

      {/* TAMPILAN DATA (ADAPTIF: Tabel untuk Laptop, Card untuk HP) */}
      <motion.div variants={itemVariants} className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
        
        {/* === TAMPILAN DESKTOP (TABEL) === */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="p-5 pl-8 text-[11px] uppercase tracking-widest font-black text-slate-400 w-2/5">Informasi Dokumen</th>
                <th className="p-5 text-[11px] uppercase tracking-widest font-black text-slate-400">Pembuat (Guru)</th>
                <th className="p-5 text-[11px] uppercase tracking-widest font-black text-slate-400">Waktu Generate</th>
                <th className="p-5 pr-8 text-right text-[11px] uppercase tracking-widest font-black text-slate-400">Aksi Database</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              <AnimatePresence>
                {filteredDocs.map((docItem) => (
                  <motion.tr 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={docItem.id} 
                    className="transition-colors hover:bg-slate-50 group"
                  >
                    {/* Kolom 1: Info Dokumen */}
                    <td className="p-4 pl-8">
                      <div className="flex items-start gap-4">
                        <span className={`mt-0.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border shrink-0 ${getBadgeColor(docItem.tipe)}`}>
                          {docItem.tipe || "Dokumen"}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800 text-[15px] truncate max-w-[300px] group-hover:text-indigo-600 transition-colors">{docItem.topik}</div>
                          <div className="text-slate-500 text-xs mt-1 font-medium">{docItem.mapel} • {docItem.fase}</div>
                        </div>
                      </div>
                    </td>

                    {/* Kolom 2: Pembuat */}
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{docItem.namaGuru}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-wider">ID: {docItem.id_user?.substring(0,8)}...</div>
                    </td>

                    {/* Kolom 3: Tanggal */}
                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md text-xs font-bold text-slate-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {docItem.tanggalFormatted}
                      </div>
                    </td>

                    {/* Kolom 4: Aksi */}
                    <td className="p-4 pr-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/guru/koleksi/${docItem.id}`} 
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                          Lihat Detail
                        </Link>
                        <button 
                          onClick={() => handleDelete(docItem.id, docItem.topik)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all" 
                          title="Hapus Dokumen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* === TAMPILAN MOBILE (KARTU) === */}
        <div className="md:hidden divide-y divide-slate-100">
          <AnimatePresence>
            {filteredDocs.map((docItem) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                key={docItem.id} 
                className="p-5 bg-white space-y-4"
              >
                {/* Bagian Atas Kartu: Tipe & Tanggal */}
                <div className="flex justify-between items-start">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${getBadgeColor(docItem.tipe)}`}>
                    {docItem.tipe || "Dokumen"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {docItem.tanggalFormatted.split(' ')[0]} {/* Ambil tanggalnya saja */}
                  </span>
                </div>

                {/* Judul & Detail */}
                <div>
                  <h3 className="font-bold text-slate-800 text-[15px] leading-tight line-clamp-2">{docItem.topik}</h3>
                  <p className="text-slate-500 text-[11px] font-medium mt-1.5">{docItem.mapel} • {docItem.fase}</p>
                </div>

                {/* Info Pembuat (Box Abu-abu) */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Dibuat Oleh</span>
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{docItem.namaGuru}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {docItem.namaGuru.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex gap-2 pt-1">
                  <Link 
                    href={`/guru/koleksi/${docItem.id}`} 
                    className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-xs font-bold transition-colors text-center"
                  >
                    Buka Dokumen
                  </Link>
                  <button 
                    onClick={() => handleDelete(docItem.id, docItem.topik)}
                    className="w-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 rounded-xl transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Jika Kosong */}
        {filteredDocs.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner">👻</div>
            <h3 className="font-bold text-slate-700">Tidak ada dokumen ditemukan</h3>
            <p className="text-sm text-slate-500 mt-1">Belum ada arsip atau coba kata kunci pencarian lain.</p>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
}