"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, increment, query, deleteDoc, where } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// INTERFACES
interface UserProfile {
  id: string;
  nama: string;
  email: string;
  role: string;
  fotoProfile?: string;
  sekolah?: string;
  kelas?: string; // Khusus Siswa
  sisa_kuota?: number; // Khusus Guru
  dibuat_pada?: any;
}

export default function AdminUserManagement() {
  const [guruList, setGuruList] = useState<UserProfile[]>([]);
  const [siswaList, setSiswaList] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<"guru" | "siswa">("guru");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // MENGAMBIL DATA SIVITAS AKADEMIKA
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Tarik semua user untuk mencegah error index Firebase
      const snap = await getDocs(collection(db, "users"));
      const allUsers = snap.docs.map(d => ({ ...d.data(), id: d.id }) as UserProfile);
      
      // Filter & Pisahkan Role (Abaikan Admin)
      const guru = allUsers.filter(u => u.role !== "admin" && u.role !== "siswa");
      const siswa = allUsers.filter(u => u.role === "siswa");

      // Urutkan berdasarkan waktu pendaftaran
      const sortByDate = (a: UserProfile, b: UserProfile) => {
        const timeA = a.dibuat_pada?.seconds || 0;
        const timeB = b.dibuat_pada?.seconds || 0;
        return timeB - timeA;
      };

      setGuruList(guru.sort(sortByDate));
      setSiswaList(siswa.sort(sortByDate));
    } catch (error) {
      console.error("Gagal mengambil data pengguna:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  // FUNGSI TOP UP KUOTA (KHUSUS GURU)
  const handleTopUp = async (userId: string, amount: number, userName: string) => {
    if (!confirm(`Tambahkan ${amount} token kuota untuk Pendidik ${userName}?`)) return;
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { sisa_kuota: increment(amount) });
      fetchUsers(); 
    } catch (error) {
      alert("Gagal melakukan top-up.");
    }
  };

  // 🔥 FUNGSI HAPUS SAMPAI KE AKAR (Deep Delete Terintegrasi)
  const handleDeleteUser = async (userId: string, userName: string, role: string) => {
    const tipeAkun = role === "siswa" ? "Peserta Didik" : "Pendidik";
    const peringatan = `PERINGATAN FATAL!\n\nApakah Anda yakin ingin MELENYAPKAN akun ${tipeAkun} atas nama "${userName}"?\n\nSistem akan menghapus profil beserta SELURUH DATA TERKAIT (Dokumen/Riwayat Ujian) secara permanen!\n\nTindakan ini tidak dapat dibatalkan.`;
    
    if (!confirm(peringatan)) return;
    
    try {
      if (role === "siswa") {
        // 1A. Sapu Bersih Riwayat Pengumpulan Tugas Siswa
        const qSub = query(collection(db, "submissions"), where("uid_siswa", "==", userId));
        const subSnap = await getDocs(qSub);
        const deletePromises = subSnap.docs.map(d => deleteDoc(doc(db, "submissions", d.id)));
        await Promise.all(deletePromises);
      } else {
        // 1B. Sapu Bersih Dokumen Bahan Ajar Guru
        const qDocs = query(collection(db, "dokumen"), where("id_user", "==", userId));
        const docsSnap = await getDocs(qDocs);
        const deletePromises = docsSnap.docs.map(d => deleteDoc(doc(db, "dokumen", d.id)));
        await Promise.all(deletePromises); 
      }

      // 2. Hapus Profil User Utama
      await deleteDoc(doc(db, "users", userId));

      alert(`Operasi berhasil. Akun ${userName} dan seluruh datanya telah dibumihanguskan dari sistem.`);
      fetchUsers(); // Refresh tampilan
    } catch (error) {
      console.error("Gagal menghapus:", error);
      alert("Terjadi kesalahan sistem saat menghapus pengguna. Silakan coba lagi.");
    }
  };

  // Filter pencarian adaptif
  const activeData = activeTab === "guru" ? guruList : siswaList;
  const filteredUsers = activeData.filter((u) => 
    u.nama?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.sekolah?.toLowerCase().includes(search.toLowerCase()) ||
    u.kelas?.toLowerCase().includes(search.toLowerCase())
  );

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-slate-400">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-sm animate-pulse">Sinkronisasi Database Sivitas Akademika...</div>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] mx-auto space-y-6 pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6">
      
      {/* HEADER TERPADU: Judul & Pencarian */}
      <motion.div variants={itemVariants} className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">🏛️</div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Data Sivitas Akademika</h1>
            <p className="text-[12px] md:text-sm text-slate-500 mt-1 font-medium">Pusat kelola data Pendidik dan Peserta Didik terpadu.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-[320px] lg:w-[400px]">
          <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Cari nama, email, sekolah, atau kelas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full shadow-sm text-[13px] md:text-sm font-medium text-slate-700 transition-all"
          />
        </div>
      </motion.div>

      {/* WRAPPER KONTEN UTAMA */}
      <motion.div variants={itemVariants} className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 overflow-hidden shadow-sm flex flex-col min-h-[600px]">
        
        {/* TABS KONTROL ALA STANDAR PENDIDIKAN */}
        <div className="flex items-center border-b border-slate-100 bg-[#F4F5F7]/50 px-4 md:px-8">
          <button 
            onClick={() => setActiveTab("guru")} 
            className={`py-5 px-4 font-bold text-[13px] md:text-sm border-b-[3px] transition-all flex items-center gap-2 ${activeTab === "guru" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
          >
            👨‍🏫 Data Pendidik
            <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{guruList.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("siswa")} 
            className={`py-5 px-4 font-bold text-[13px] md:text-sm border-b-[3px] transition-all flex items-center gap-2 ${activeTab === "siswa" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
          >
            👨‍🎓 Data Peserta Didik
            <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{siswaList.length}</span>
          </button>
        </div>

        {/* === TAMPILAN DESKTOP (TABEL) === */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="p-5 pl-8 text-[11px] uppercase tracking-widest font-black text-slate-400">
                  {activeTab === "guru" ? "Profil Pendidik" : "Profil Peserta Didik"}
                </th>
                <th className="p-5 text-[11px] uppercase tracking-widest font-black text-slate-400">
                  {activeTab === "guru" ? "Instansi / Sekolah" : "Kelas & Instansi"}
                </th>
                {activeTab === "guru" && (
                  <th className="p-5 text-[11px] uppercase tracking-widest font-black text-slate-400">Manajemen Kuota AI</th>
                )}
                <th className="p-5 pr-8 text-right text-[11px] uppercase tracking-widest font-black text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((u) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    key={u.id} 
                    className="transition-colors group hover:bg-slate-50"
                  >
                    {/* Kolom 1: Profil */}
                    <td className="p-4 pl-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-white shadow-sm overflow-hidden ${activeTab === "guru" ? "bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600" : "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600"}`}>
                          {u.fotoProfile ? <img src={u.fotoProfile} alt="Profile" className="w-full h-full object-cover" /> : (u.nama ? u.nama.charAt(0).toUpperCase() : "?")}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[14px]">{u.nama}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Kolom 2: Sekolah / Kelas */}
                    <td className="p-4">
                      {activeTab === "guru" ? (
                        <span className="text-slate-600 font-medium">{u.sekolah || <span className="italic opacity-50">Belum diisi</span>}</span>
                      ) : (
                        <div>
                           <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">{u.kelas || "Tanpa Kelas"}</span>
                           <div className="text-[11px] text-slate-400 mt-1">{u.sekolah || "-"}</div>
                        </div>
                      )}
                    </td>

                    {/* Kolom 3: Kuota (Khusus Guru) */}
                    {activeTab === "guru" && (
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16">
                            <span className={`font-black text-xl ${u.sisa_kuota && u.sisa_kuota <= 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                              {u.sisa_kuota !== undefined ? u.sisa_kuota : 0}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleTopUp(u.id, 10, u.nama)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors border border-indigo-100">+10</button>
                            <button onClick={() => handleTopUp(u.id, 50, u.nama)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-100">+50</button>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Kolom 4: Hapus Akun */}
                    <td className="p-4 pr-8 text-right">
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.nama, u.role || "guru")}
                        className="p-2.5 rounded-xl transition-all border bg-white text-rose-500 hover:bg-rose-600 hover:text-white border-slate-200 hover:border-rose-600 shadow-sm"
                        title="Hapus Akun & Data"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {/* Jika Kosong di Desktop */}
          {filteredUsers.length === 0 && (
             <div className="p-16 text-center text-slate-400">
               <div className="text-5xl mb-4 opacity-40">📭</div>
               <p className="font-bold">Data tidak ditemukan.</p>
             </div>
          )}
        </div>

        {/* === TAMPILAN MOBILE (KARTU) === */}
        <div className="md:hidden divide-y divide-slate-100 flex-1">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((u) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                key={u.id} 
                className="p-5 space-y-4 bg-white"
              >
                {/* Header Kartu: Profil */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border overflow-hidden ${activeTab === "guru" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                      {u.fotoProfile ? <img src={u.fotoProfile} alt="Profile" className="w-full h-full object-cover" /> : (u.nama ? u.nama.charAt(0).toUpperCase() : "?")}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-[15px] leading-tight line-clamp-1">{u.nama}</h3>
                      <p className="text-slate-400 text-[11px] mt-0.5 truncate">{u.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteUser(u.id, u.nama, u.role || "guru")}
                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors border shrink-0 bg-white text-rose-500 hover:bg-rose-600 hover:text-white border-slate-200 hover:border-rose-600 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                {/* Info Detail Berdasarkan Tab */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-2 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Asal Instansi:</span>
                    <span className="text-slate-700 font-bold text-right max-w-[150px] truncate">{u.sekolah || "-"}</span>
                  </div>
                  
                  {activeTab === "siswa" && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Kelas Aktif:</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{u.kelas || "Belum ada"}</span>
                    </div>
                  )}

                  {activeTab === "guru" && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Sisa Kuota AI:</span>
                      <span className={`font-black text-sm ${u.sisa_kuota && u.sisa_kuota <= 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                        {u.sisa_kuota !== undefined ? u.sisa_kuota : 0} Token
                      </span>
                    </div>
                  )}
                </div>

                {/* Aksi (Khusus Guru) */}
                {activeTab === "guru" && (
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => handleTopUp(u.id, 10, u.nama)} className="flex-1 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors border border-indigo-100">+10 Token</button>
                    <button onClick={() => handleTopUp(u.id, 50, u.nama)} className="flex-1 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors border border-emerald-100">+50 Token</button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Jika Kosong di Mobile */}
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner">🔍</div>
              <h3 className="font-bold text-slate-700">Tidak ada data</h3>
              <p className="text-sm text-slate-500 mt-1">Coba kata kunci pencarian lain.</p>
            </div>
          )}
        </div>

      </motion.div>
    </motion.div>
  );
}