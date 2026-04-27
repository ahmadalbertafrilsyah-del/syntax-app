"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, increment, query, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("dibuat_pada", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(data.filter((u: any) => u.role !== "admin")); 
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const handleTopUp = async (userId: string, amount: number, userName: string) => {
    if (!confirm(`Tambahkan ${amount} token kuota untuk ${userName}?`)) return;
    
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { sisa_kuota: increment(amount) });
      fetchUsers(); 
    } catch (error) {
      alert("Gagal melakukan top-up.");
    }
  };

  const toggleStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    const action = currentStatus === false ? 'MENGAKTIFKAN' : 'MENON-AKTIFKAN';
    if (!confirm(`Peringatan: Apakah Anda yakin ingin ${action} akun ${userName}?`)) return;
    
    try {
      await updateDoc(doc(db, "users", userId), {
        isActive: currentStatus === false ? true : false
      });
      fetchUsers();
    } catch (error) {
      alert("Gagal mengubah status pengguna.");
    }
  };

  // Filter pencarian
  const filteredUsers = users.filter((u) => 
    u.nama?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.sekolah?.toLowerCase().includes(search.toLowerCase())
  );

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-slate-400">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-sm animate-pulse">Memuat Database Pendidik...</div>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] mx-auto space-y-6 pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6">
      
      {/* HEADER TERPADU: Judul & Pencarian */}
      <motion.div variants={itemVariants} className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">👥</div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Manajemen Guru</h1>
            <p className="text-[12px] md:text-sm text-slate-500 mt-1 font-medium">Kelola akses dan kuota API pendidik.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-[320px] lg:w-[400px]">
          <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Cari nama, email, atau sekolah..." 
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
                <th className="p-5 pl-8 text-[11px] uppercase tracking-widest font-black text-slate-400">Profil Guru</th>
                <th className="p-5 text-[11px] uppercase tracking-widest font-black text-slate-400">Asal Sekolah</th>
                <th className="p-5 text-[11px] uppercase tracking-widest font-black text-slate-400">Sisa Kuota & Top Up</th>
                <th className="p-5 pr-8 text-right text-[11px] uppercase tracking-widest font-black text-slate-400">Status Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              <AnimatePresence>
                {filteredUsers.map((u) => (
                  <motion.tr 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={u.id} 
                    className={`transition-colors group ${u.isActive === false ? 'bg-red-50/30' : 'hover:bg-slate-50'}`}
                  >
                    {/* Kolom 1: Profil */}
                    <td className="p-4 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 border border-white shadow-sm overflow-hidden">
                          {u.fotoProfile ? <img src={u.fotoProfile} alt="Profile" className="w-full h-full object-cover" /> : (u.nama ? u.nama.charAt(0).toUpperCase() : "G")}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{u.nama}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Kolom 2: Sekolah */}
                    <td className="p-4 text-slate-500 font-medium">
                      {u.sekolah || <span className="italic opacity-50">Belum diisi</span>}
                    </td>

                    {/* Kolom 3: Kuota */}
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16">
                          <span className={`font-black text-xl ${u.sisa_kuota <= 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                            {u.sisa_kuota}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleTopUp(u.id, 10, u.nama)} disabled={u.isActive === false} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-indigo-100">+10</button>
                          <button onClick={() => handleTopUp(u.id, 50, u.nama)} disabled={u.isActive === false} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-100">+50</button>
                        </div>
                      </div>
                    </td>

                    {/* Kolom 4: Status */}
                    <td className="p-4 pr-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                          u.isActive === false ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {u.isActive === false ? "Suspended" : "Active"}
                        </span>
                        
                        <button 
                          onClick={() => toggleStatus(u.id, u.isActive !== false, u.nama)}
                          className={`p-2 rounded-lg transition-colors border ${
                            u.isActive === false ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100' : 'bg-white text-rose-500 hover:bg-rose-50 border-slate-200 hover:border-rose-200'
                          }`}
                          title={u.isActive === false ? "Pulihkan Akses" : "Cabut Akses"}
                        >
                          {u.isActive === false ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          )}
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
            {filteredUsers.map((u) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                key={u.id} 
                className={`p-5 space-y-4 ${u.isActive === false ? 'bg-red-50/30' : 'bg-white'}`}
              >
                {/* Header Kartu: Profil & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-100 overflow-hidden">
                      {u.fotoProfile ? <img src={u.fotoProfile} alt="Profile" className="w-full h-full object-cover" /> : (u.nama ? u.nama.charAt(0).toUpperCase() : "G")}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-[15px] leading-tight line-clamp-1">{u.nama}</h3>
                      <p className="text-slate-400 text-[11px] mt-0.5 truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border shrink-0 ${
                    u.isActive === false ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {u.isActive === false ? "Suspended" : "Active"}
                  </span>
                </div>

                {/* Info Detail */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Asal Sekolah:</span>
                    <span className="text-slate-700 font-bold text-right max-w-[150px] truncate">{u.sekolah || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Sisa Kuota:</span>
                    <span className={`font-black text-sm ${u.sisa_kuota <= 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                      {u.sisa_kuota} Token
                    </span>
                  </div>
                </div>

                {/* Aksi (Top Up & Suspend) */}
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => handleTopUp(u.id, 10, u.nama)} disabled={u.isActive === false} className="flex-1 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 border border-indigo-100">+10 Token</button>
                  <button onClick={() => handleTopUp(u.id, 50, u.nama)} disabled={u.isActive === false} className="flex-1 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 border border-emerald-100">+50 Token</button>
                  <button 
                    onClick={() => toggleStatus(u.id, u.isActive !== false, u.nama)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors border shrink-0 ${
                      u.isActive === false ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100' : 'bg-white text-rose-500 hover:bg-rose-50 border-slate-200 hover:border-rose-200'
                    }`}
                  >
                    {u.isActive === false ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Jika Kosong */}
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner">🔍</div>
            <h3 className="font-bold text-slate-700">Tidak ada pendidik ditemukan</h3>
            <p className="text-sm text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
}