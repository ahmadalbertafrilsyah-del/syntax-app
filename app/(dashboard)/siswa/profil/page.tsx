"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ProfilSiswa() {
  const { user } = useAuth();
  const router = useRouter();

  const [siswaData, setSiswaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return router.push("/login");
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists() && docSnap.data().role === "siswa") setSiswaData(docSnap.data());
        else router.push("/guru");
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, [user, router]);

  const handleSimpanProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", user!.uid), {
        nama: siswaData.nama, sekolah: siswaData.sekolah, nisn: siswaData.nisn || "", bio: siswaData.bio || ""
      });
      alert("Profil berhasil diperbarui!");
    } catch (error) { alert("Gagal menyimpan profil."); }
  };

  if (loading) return <div className="flex justify-center h-screen items-center"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="pb-24 px-4 md:px-8 pt-2 md:pt-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
         <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-r from-slate-900 to-indigo-900"></div>
            <div className="relative z-10 flex flex-col items-center mt-10 mb-8">
               <div className="w-24 h-24 bg-white p-1 rounded-full shadow-lg mb-4">
                  <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-3xl font-black text-slate-400 overflow-hidden">
                     {siswaData?.fotoProfile ? <img src={siswaData.fotoProfile} className="w-full h-full object-cover"/> : siswaData?.nama?.charAt(0).toUpperCase()}
                  </div>
               </div>
               <h2 className="text-2xl font-black text-slate-800">{siswaData?.nama}</h2>
               <p className="text-sm font-bold text-slate-500 bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-full mt-3 shadow-sm">NISN: {siswaData?.nisn || "Belum diatur"}</p>
            </div>

            <form onSubmit={handleSimpanProfil} className="space-y-5 border-t border-slate-100 pt-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div><label className="text-[11px] font-black uppercase text-slate-400 mb-2 block">Nama Lengkap</label><input required type="text" value={siswaData?.nama || ""} onChange={e => setSiswaData({...siswaData, nama: e.target.value})} className="w-full p-4 bg-[#F4F5F7] rounded-xl text-[13px] font-bold outline-none border focus:bg-white focus:border-indigo-500"/></div>
                 <div><label className="text-[11px] font-black uppercase text-slate-400 mb-2 block">Asal Sekolah</label><input required type="text" value={siswaData?.sekolah || ""} onChange={e => setSiswaData({...siswaData, sekolah: e.target.value})} className="w-full p-4 bg-[#F4F5F7] rounded-xl text-[13px] font-bold outline-none border focus:bg-white focus:border-indigo-500"/></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="text-[11px] font-black uppercase text-slate-400 mb-2 block">NISN (Nomor Induk)</label><input type="text" value={siswaData?.nisn || ""} onChange={e => setSiswaData({...siswaData, nisn: e.target.value})} className="w-full p-4 bg-[#F4F5F7] rounded-xl text-[13px] font-bold outline-none border focus:bg-white focus:border-indigo-500"/></div>
                  <div><label className="text-[11px] font-black uppercase text-slate-400 mb-2 block">Status Akademik</label><input disabled type="text" value="Siswa Aktif" className="w-full p-4 bg-emerald-50 text-emerald-600 rounded-xl text-[13px] font-bold border border-emerald-100 cursor-not-allowed"/></div>
               </div>
               <div><label className="text-[11px] font-black uppercase text-slate-400 mb-2 block">Catatan / Bio Belajar</label><textarea value={siswaData?.bio || ""} onChange={e => setSiswaData({...siswaData, bio: e.target.value})} className="w-full p-4 bg-[#F4F5F7] rounded-xl text-[13px] font-bold outline-none border focus:bg-white focus:border-indigo-500 h-24 resize-none"></textarea></div>
               <div className="pt-4 flex justify-end">
                  <button type="submit" className="px-8 py-4 bg-slate-900 hover:bg-indigo-600 text-white font-black text-[13px] rounded-xl shadow-lg transition-all active:scale-95">Simpan Perubahan</button>
               </div>
            </form>
         </div>
      </motion.div>
    </div>
  );
}