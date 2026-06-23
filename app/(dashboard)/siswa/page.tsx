"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TugasKelas { id: string; judul: string; kelas: string; deadline: string; }
interface SubmisiSiswa { id: string; id_tugas: string; nilai: number | null; }

export default function BerandaSiswa() {
  const { user } = useAuth();
  const router = useRouter();

  const [siswaData, setSiswaData] = useState<any>(null);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [tugasPending, setTugasPending] = useState<TugasKelas[]>([]);
  const [tugasSelesai, setTugasSelesai] = useState(0);
  const [ipk, setIpk] = useState("0.00");
  const [predikat, setPredikat] = useState("Belum Ada Nilai");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return router.push("/login");
    const fetchData = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().role === "siswa") {
          const data = docSnap.data();
          setSiswaData(data);

          const joinedIds = data.kelas_diikuti || [];
          if (joinedIds.length > 0) {
             const snapKelas = await getDocs(query(collection(db, "kelas"), where("__name__", "in", joinedIds)));
             const kList = snapKelas.docs.map(d => d.data());
             setKelasList(kList);

             const namaKelasArray = kList.map(k => k.nama_kelas);
             if(namaKelasArray.length > 0) {
               const snapTugas = await getDocs(query(collection(db, "tugas_kelas"), where("kelas", "in", namaKelasArray), where("status", "==", "Aktif")));
               const allTugas = snapTugas.docs.map(d => ({ id: d.id, ...d.data() })) as TugasKelas[];
               
               const snapSubmisi = await getDocs(query(collection(db, "submissions"), where("uid_siswa", "==", user.uid)));
               const allSubmisi = snapSubmisi.docs.map(d => ({ id: d.id, ...d.data() })) as SubmisiSiswa[];
               
               // Kalkulasi Data
               setTugasSelesai(allSubmisi.length);
               setTugasPending(allTugas.filter(t => !allSubmisi.some(s => s.id_tugas === t.id)));
               
               const nilaiSiswa = allSubmisi.filter(s => s.nilai !== null).map(s => s.nilai as number);
               const rataRataNilai = nilaiSiswa.length > 0 ? (nilaiSiswa.reduce((a,b)=>a+b,0) / nilaiSiswa.length) : 0;
               setIpk((rataRataNilai / 100 * 4.0).toFixed(2));
               setPredikat(rataRataNilai >= 85 ? "Pujian (Cum Laude)" : rataRataNilai >= 70 ? "Sangat Memuaskan" : rataRataNilai > 0 ? "Memuaskan" : "Belum Ada Nilai");
             }
          }
        } else router.push("/guru");
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, [user, router]);

  const pengumuman = [
      { id: 1, judul: "Jadwal Ujian Akhir Semester", tanggal: "25 Jun 2026", isi: "Ujian akan dilaksanakan secara daring melalui Ruang Kelas CBT." },
      { id: 2, judul: "Pembaruan Portal Syntax", tanggal: "23 Jun 2026", isi: "Penambahan fitur Indeks Prestasi Akademik pada beranda siswa." }
  ];

  if (loading) return <div className="flex flex-col items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="pb-24 px-4 md:px-8 pt-2 md:pt-4 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        
        {/* Header SIAKAD Profile */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-[32px] p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
           <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full border-4 border-white/20 flex items-center justify-center text-4xl font-black text-white shrink-0 overflow-hidden shadow-2xl relative z-10">
             {siswaData?.fotoProfile ? <img src={siswaData.fotoProfile} className="w-full h-full object-cover"/> : siswaData?.nama?.charAt(0).toUpperCase()}
           </div>
           <div className="flex-1 text-center md:text-left relative z-10">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{siswaData?.nama}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-indigo-200 text-sm font-medium">
                 <span className="bg-white/10 px-3 py-1 rounded-md border border-white/10">NISN: {siswaData?.nisn || "-"}</span>
                 <span className="bg-white/10 px-3 py-1 rounded-md border border-white/10">{siswaData?.sekolah || "Asal Sekolah"}</span>
              </div>
           </div>
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl text-center min-w-[200px] relative z-10">
              <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1">Indeks Prestasi</p>
              <h2 className="text-5xl font-black text-white mb-1">{ipk}</h2>
              <p className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full inline-block">{predikat}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Kiri: Papan Pengumuman & Stats */}
           <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black">🏫</div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">SKS / Kelas Diambil</p>
                       <h3 className="text-2xl font-black text-slate-800">{kelasList.length} <span className="text-sm font-bold text-slate-500">Kelas</span></h3>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-black">✅</div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tugas Selesai</p>
                       <h3 className="text-2xl font-black text-slate-800">{tugasSelesai} <span className="text-sm font-bold text-slate-500">Tugas</span></h3>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                 <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><span className="text-indigo-500">📢</span> Papan Pengumuman</h3>
                 <div className="space-y-4">
                    {pengumuman.map(p => (
                       <div key={p.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-4 hover:border-indigo-200 transition-colors">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center border border-slate-200 shrink-0">
                             <span className="text-[10px] font-black text-rose-500 uppercase">{p.tanggal.split(' ')[1]}</span>
                             <span className="text-lg font-black text-slate-800 leading-none">{p.tanggal.split(' ')[0]}</span>
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800 text-sm mb-1">{p.judul}</h4>
                             <p className="text-xs text-slate-500 leading-relaxed">{p.isi}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Kanan: Timeline Tugas */}
           <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 flex flex-col">
              <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><span className="text-rose-500">⏳</span> Tugas Mendatang</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                 {tugasPending.length > 0 ? tugasPending.slice(0,5).map(t => (
                    <div key={t.id} className="relative pl-6 border-l-2 border-indigo-100 pb-2">
                       <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1 border-2 border-white shadow-sm"></div>
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t.kelas}</span>
                       <h4 className="font-bold text-slate-800 text-sm leading-tight mt-1">{t.judul}</h4>
                       <p className="text-xs text-rose-500 font-bold mt-1">Batas: {t.deadline || "-"}</p>
                       <Link href="/siswa/kelas"><button className="mt-3 px-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600 transition-colors">Buka Kelas</button></Link>
                    </div>
                 )) : (
                    <div className="text-center py-10 opacity-50"><div className="text-3xl mb-2">🎉</div><p className="font-bold text-slate-500 text-sm">Tidak ada tugas tertunda!</p></div>
                 )}
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}