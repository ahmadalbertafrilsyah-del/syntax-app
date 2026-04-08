"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, increment, query, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";

export default function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
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
    if (!confirm(`Tambahkan ${amount} token untuk ${userName}?`)) return;
    
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { sisa_kuota: increment(amount) });
      fetchUsers(); 
    } catch (error) {
      alert("Gagal melakukan top-up.");
    }
  };

  const toggleStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    const action = currentStatus === false ? 'mengaktifkan' : 'menon-aktifkan';
    if (!confirm(`Apakah Anda yakin ingin ${action} akun ${userName}?`)) return;
    
    try {
      await updateDoc(doc(db, "users", userId), {
        isActive: currentStatus === false ? true : false
      });
      fetchUsers();
    } catch (error) {
      alert("Gagal mengubah status pengguna.");
    }
  };

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-slate-500 animate-pulse text-sm md:text-base">Memuat Data Guru...</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-10">
      
      {/* Header */}
      <div className="mb-4">
        {/* Font diperkecil di mobile, normal di laptop */}
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Manajemen Guru 👥</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2">Kelola kuota API dan status akses untuk semua guru yang terdaftar.</p>
      </div>

      {/* Tabel/List Pengguna */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] md:text-xs uppercase tracking-wider font-bold">
                <th className="p-3 pl-4 md:p-5 md:pl-6 border-b border-slate-100 whitespace-nowrap">Profil Guru</th>
                <th className="p-3 md:p-5 border-b border-slate-100 whitespace-nowrap">Asal Sekolah</th>
                <th className="p-3 md:p-5 border-b border-slate-100 whitespace-nowrap">Manajemen Kuota</th>
                <th className="p-3 pr-4 md:p-5 md:pr-6 border-b border-slate-100 text-center whitespace-nowrap">Akses Sistem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs md:text-sm">
              {users.map((u, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }}
                  key={u.id} 
                  className={`transition-colors group ${u.isActive === false ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}
                >
                  {/* Kolom 1: Profil */}
                  <td className="p-3 pl-4 md:p-5 md:pl-6 whitespace-nowrap">
                    <div className="font-bold text-slate-800 text-sm md:text-base">{u.nama}</div>
                    <div className="text-slate-500 text-[10px] md:text-xs mt-0.5 md:mt-1">{u.email}</div>
                  </td>

                  {/* Kolom 2: Sekolah */}
                  <td className="p-3 md:p-5 text-slate-500 font-medium whitespace-nowrap">
                    {u.sekolah || <span className="italic opacity-50">Belum diisi</span>}
                  </td>

                  {/* Kolom 3: Kuota & Top-Up */}
                  <td className="p-3 md:p-5 whitespace-nowrap">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Token</span>
                        <span className={`font-black text-lg md:text-xl ${u.sisa_kuota < 5 ? 'text-red-500' : 'text-indigo-600'}`}>
                          {u.sisa_kuota}
                        </span>
                      </div>
                      <div className="flex gap-1.5 md:gap-2 border-l border-slate-100 pl-3 md:pl-4">
                        <button 
                          onClick={() => handleTopUp(u.id, 10, u.nama)}
                          disabled={u.isActive === false}
                          className="px-2 py-1 md:px-3 md:py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] md:text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                          +10
                        </button>
                        <button 
                          onClick={() => handleTopUp(u.id, 50, u.nama)}
                          disabled={u.isActive === false}
                          className="px-2 py-1 md:px-3 md:py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] md:text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                          +50
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Kolom 4: Status & Suspend */}
                  <td className="p-3 pr-4 md:p-5 md:pr-6 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-2 md:gap-3">
                      <span className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest border ${
                        u.isActive === false 
                          ? 'bg-red-50 text-red-600 border-red-100' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {u.isActive === false ? "Suspended" : "Active"}
                      </span>
                      
                      <button 
                        onClick={() => toggleStatus(u.id, u.isActive !== false, u.nama)}
                        className={`text-[10px] md:text-xs font-bold underline underline-offset-4 transition-all ${
                          u.isActive === false 
                            ? 'text-emerald-600 hover:text-emerald-700' 
                            : 'text-red-500 hover:text-red-600'
                        }`}
                      >
                        {u.isActive === false ? "Pulihkan Akses" : "Cabut Akses"}
                      </button>
                    </div>
                  </td>
                  
                </motion.tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 md:p-10 text-center text-slate-500 italic font-medium text-xs md:text-sm">
                    Belum ada guru yang terdaftar selain Admin.
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