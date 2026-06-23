"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RaportSiswa() {
  const { user } = useAuth();
  const router = useRouter();

  const [tugasList, setTugasList] = useState<any[]>([]);
  const [submisiList, setSubmisiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return router.push("/login");
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists() && docSnap.data().role === "siswa") {
          const snapTugas = await getDocs(collection(db, "tugas_kelas"));
          setTugasList(snapTugas.docs.map(d => ({ id: d.id, ...d.data() })));
          
          const snapSubmisi = await getDocs(query(collection(db, "submissions"), where("uid_siswa", "==", user.uid)));
          setSubmisiList(snapSubmisi.docs.map(d => ({ id: d.id, ...d.data() })));
        } else router.push("/guru");
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, [user, router]);

  const nilaiSiswa = submisiList.filter(s => s.nilai !== null).map(s => s.nilai as number);
  const ipk = nilaiSiswa.length > 0 ? ((nilaiSiswa.reduce((a,b)=>a+b,0) / nilaiSiswa.length) / 100 * 4.0).toFixed(2) : "0.00";

  if (loading) return <div className="flex justify-center h-screen items-center"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="pb-24 px-4 md:px-8 pt-2 md:pt-4 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
         <div className="flex justify-between items-center mb-6">
           <div>
              <h2 className="text-2xl font-black text-slate-800">Transkrip Nilai</h2>
              <p className="text-sm text-slate-500 font-medium">Rekapitulasi seluruh nilai tugas dan ujian Anda.</p>
           </div>
           <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-black text-lg border border-indigo-100 shadow-sm">
              IPK: {ipk}
           </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                 <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400">
                       <th className="p-5 pl-8">Mata Kuliah / Kelas</th>
                       <th className="p-5">Judul Tugas</th>
                       <th className="p-5 text-center">Status</th>
                       <th className="p-5 text-center">Nilai Angka</th>
                       <th className="p-5 pr-8 text-center">Mutu</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-700">
                    {submisiList.length > 0 ? submisiList.map((sub, idx) => {
                       const tgs = tugasList.find(t => t.id === sub.id_tugas);
                       const n = sub.nilai !== null ? sub.nilai : 0;
                       const huruf = n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : n > 0 ? 'D' : '-';
                       const warna = huruf === 'A' ? 'text-emerald-500' : huruf === 'B' ? 'text-indigo-500' : huruf === 'C' ? 'text-amber-500' : 'text-rose-500';

                       return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                             <td className="p-5 pl-8 font-black text-slate-800">{sub.kelas}</td>
                             <td className="p-5">{tgs?.judul || "Tugas/Ujian"}</td>
                             <td className="p-5 text-center"><span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border">{sub.status}</span></td>
                             <td className="p-5 text-center font-black">{sub.nilai !== null ? sub.nilai : "Menunggu"}</td>
                             <td className={`p-5 pr-8 text-center font-black text-lg ${warna}`}>{sub.nilai !== null ? huruf : "-"}</td>
                          </tr>
                       );
                    }) : (
                       <tr><td colSpan={5} className="p-16 text-center text-slate-400"><p className="font-bold">Belum ada nilai raport.</p></td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </motion.div>
    </div>
  );
}