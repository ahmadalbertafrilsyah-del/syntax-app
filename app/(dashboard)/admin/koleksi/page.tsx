"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AdminKoleksiManagement() {
  const router = useRouter();
  const [dokumenList, setDokumenList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
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
          namaGuru: userMap[data.id_user] || "Sistem / Dihapus" // Cocokkan ID dengan Nama
        };
      });

      setDokumenList(allDocs);
      setLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data koleksi:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  // Fungsi Hapus Dokumen (Jika Admin ingin membersihkan server)
  const handleDelete = async (id: string, topik: string) => {
    if (!confirm(`Hapus dokumen "${topik}" secara permanen dari server?`)) return;
    try {
      await deleteDoc(doc(db, "dokumen", id));
      setDokumenList(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      alert("Gagal menghapus dokumen.");
    }
  };

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-slate-500 animate-pulse text-sm md:text-base">Menyusun Laporan Server...</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-10">
      
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Manajemen Koleksi AI 🗂️</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2">Pantau seluruh perangkat ajar yang dihasilkan oleh para guru di sistem ini.</p>
      </div>

      {/* Tabel Dokumen */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider font-bold">
                <th className="p-4 pl-6 border-b border-slate-100 whitespace-nowrap w-2/5">Informasi Dokumen</th>
                <th className="p-4 border-b border-slate-100 whitespace-nowrap">Pembuat (Guru)</th>
                <th className="p-4 border-b border-slate-100 whitespace-nowrap">Tanggal Dibuat</th>
                <th className="p-4 pr-6 border-b border-slate-100 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs md:text-sm">
              {dokumenList.map((docItem, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  key={docItem.id} 
                  className="transition-colors hover:bg-slate-50 group"
                >
                  
                  {/* Kolom 1: Info Dokumen */}
                  <td className="p-4 pl-6">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 text-[10px] md:text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                        docItem.tipe === "Modul Ajar" ? "bg-indigo-50 text-indigo-600" : 
                        docItem.tipe === "Bank Soal" ? "bg-rose-50 text-rose-600" : 
                        docItem.tipe === "Rubrik" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {docItem.tipe || "Dokumen"}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 text-sm md:text-base line-clamp-1">{docItem.topik}</div>
                        <div className="text-slate-500 text-[10px] md:text-xs mt-0.5">{docItem.mapel} • {docItem.fase}</div>
                      </div>
                    </div>
                  </td>

                  {/* Kolom 2: Pembuat */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-700">{docItem.namaGuru}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {docItem.id_user?.substring(0,8)}...</div>
                  </td>

                  {/* Kolom 3: Tanggal */}
                  <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                    {docItem.tanggalFormatted}
                  </td>

                  {/* Kolom 4: Aksi */}
                  <td className="p-4 pr-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/guru/koleksi/${docItem.id}`} 
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-bold transition-colors"
                      >
                        Lihat Dokumen
                      </Link>
                      <button 
                        onClick={() => handleDelete(docItem.id, docItem.topik)}
                        className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Hapus dari Server"
                      >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                  
                </motion.tr>
              ))}

              {dokumenList.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 md:p-10 text-center text-slate-500 italic font-medium text-xs md:text-sm">
                    Belum ada dokumen yang di-generate oleh guru.
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