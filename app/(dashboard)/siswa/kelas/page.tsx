"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RuangKelasSiswa() {
  const { user } = useAuth();
  const router = useRouter();

  const [siswaData, setSiswaData] = useState<any>(null);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [tugasList, setTugasList] = useState<any[]>([]);
  const [submisiList, setSubmisiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Gabung Kelas
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const fetchSiswaData = async () => {
    if (!user) return router.push("/login");
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists() && docSnap.data().role === "siswa") {
        const data = docSnap.data();
        setSiswaData(data);

        const joinedIds = data.kelas_diikuti || [];
        if (joinedIds.length > 0) {
           // Tarik Data Kelas
           const snapKelas = await getDocs(query(collection(db, "kelas"), where("__name__", "in", joinedIds)));
           const kList = snapKelas.docs.map(d => ({ id: d.id, ...d.data() }));
           setKelasList(kList);

           // Tarik Data Tugas untuk menghitung Notifikasi (Badge)
           const namaKelasArray = kList.map((k:any) => k.nama_kelas);
           if(namaKelasArray.length > 0) {
             const snapTugas = await getDocs(query(collection(db, "tugas_kelas"), where("kelas", "in", namaKelasArray), where("status", "==", "Aktif")));
             setTugasList(snapTugas.docs.map(d => ({ id: d.id, ...d.data() })));
           }
        }
        
        // Tarik Data Submisi
        const snapSubmisi = await getDocs(query(collection(db, "submissions"), where("uid_siswa", "==", user.uid)));
        setSubmisiList(snapSubmisi.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        router.push("/guru");
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchSiswaData(); }, [user, router]);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !user) return;
    setIsJoining(true);
    try {
      const snap = await getDocs(query(collection(db, "kelas"), where("kode_kelas", "==", joinCode.trim().toUpperCase())));
      if (snap.empty) {
        alert("Kode kelas tidak ditemukan.");
      } else {
        const classId = snap.docs[0].id;
        const currentJoined = siswaData.kelas_diikuti || [];
        if (currentJoined.includes(classId)) {
          alert("Kamu sudah terdaftar di kelas ini.");
        } else {
          await updateDoc(doc(db, "users", user.uid), { kelas_diikuti: arrayUnion(classId) });
          alert("Berhasil bergabung dengan kelas!");
          setJoinCode(""); 
          setShowJoinModal(false); 
          fetchSiswaData(); 
        }
      }
    } catch (error) { 
      alert("Terjadi kesalahan sistem saat mencoba bergabung."); 
    } finally { 
      setIsJoining(false); 
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-bold text-slate-500 animate-pulse">Memuat Ruang Kelas...</p>
    </div>
  );

  return (
    <div className="pb-24 px-4 md:px-8 pt-2 md:pt-4 space-y-6">
      
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 relative">
              <button onClick={() => setShowJoinModal(false)} className="absolute top-6 right-6 w-8 h-8 bg-slate-100 text-slate-500 rounded-full font-bold hover:bg-rose-50 hover:text-rose-500">X</button>
              <div className="text-4xl mb-4">🏫</div>
              <h3 className="text-xl font-black mb-2">Pendaftaran Kelas</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">Masukkan kode kelas dari Gurumu untuk mulai belajar.</p>
              <form onSubmit={handleJoinClass}>
                <input required type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Contoh: AB12CD34" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl uppercase text-center font-black text-xl mb-4 outline-none focus:border-indigo-500 transition-colors"/>
                <button type="submit" disabled={isJoining} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-colors disabled:opacity-50">
                  {isJoining ? "Mencari..." : "Gabung Sekarang"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        
        <div className="flex justify-between items-center mb-6">
           <div>
              <h2 className="text-2xl font-black text-slate-800">Ruang Kelas</h2>
              <p className="text-sm text-slate-500 font-medium">Daftar kelas yang Anda ambil semester ini.</p>
           </div>
           <button onClick={() => setShowJoinModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-colors active:scale-95">
             + Gabung Kelas
           </button>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 md:p-8 min-h-[500px]">
          {kelasList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {kelasList.map(kelas => {
                // Hitung notifikasi tugas yang belum dikerjakan
                const pending = tugasList.filter(t => t.kelas === kelas.nama_kelas && !submisiList.some(s => s.id_tugas === t.id)).length;
                
                return (
                  // 🔥 DYNAMIC ROUTING: Mengarahkan ke /siswa/kelas/[id_kelas]
                  <Link href={`/siswa/kelas/${kelas.id}`} key={kelas.id}>
                    <div className="bg-white border border-slate-200 p-6 rounded-[24px] cursor-pointer hover:border-indigo-300 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-6xl pointer-events-none">🏫</div>
                       
                       <div className="relative z-10 flex-1">
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Kode: {kelas.kode_kelas}</span>
                          <h4 className="font-black text-lg text-slate-800 mt-3 group-hover:text-indigo-600 transition-colors">{kelas.nama_kelas}</h4>
                       </div>
                       
                       <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6 relative z-10">
                          <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">Masuk Kelas &rarr;</span>
                          {pending > 0 && <span className="w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">{pending}</span>}
                       </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 font-bold border-2 border-dashed border-slate-200 rounded-[24px]">
              <div className="text-5xl mb-4 opacity-40">📭</div>
              <p>KRS Kosong.</p>
              <p className="text-sm font-medium mt-1">Gabung kelas menggunakan kode dari Gurumu untuk memulai.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}