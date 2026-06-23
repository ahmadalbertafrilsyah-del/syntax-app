"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function DetailKelasSiswa() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id as string;

  const [siswaData, setSiswaData] = useState<any>(null);
  const [kelasData, setKelasData] = useState<any>(null);
  const [tugasList, setTugasList] = useState<any[]>([]);
  const [submisiList, setSubmisiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"materi" | "tutor_ai">("materi");
  
  // State Chatbot AI
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string; }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDetailKelas = async () => {
      if (!user || !kelasId) return;
      try {
        // 1. Cek Role Siswa
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists() || userSnap.data().role !== "siswa") {
          return router.push("/guru");
        }
        const dataUser = userSnap.data();
        setSiswaData(dataUser);

        // Keamanan: Pastikan siswa benar-benar terdaftar di kelas ini
        const joinedIds = dataUser.kelas_diikuti || [];
        if (!joinedIds.includes(kelasId)) {
          alert("Akses ditolak. Anda belum bergabung dengan kelas ini.");
          return router.push("/siswa/kelas");
        }

        // 2. Tarik Data Kelas
        const kelasSnap = await getDoc(doc(db, "kelas", kelasId));
        if (!kelasSnap.exists()) {
          alert("Kelas tidak ditemukan.");
          return router.push("/siswa/kelas");
        }
        const dataKelas = kelasSnap.data();
        setKelasData({ id: kelasSnap.id, ...dataKelas });

        // Set pesan pembuka AI Tutor
        setChatMessages([{ role: "ai", text: `Halo! Saya AI Tutor kelas ${dataKelas.nama_kelas}. Ada materi yang ingin didiskusikan hari ini?` }]);

        // 3. Tarik Data Tugas & Materi Kelas Ini
        const qTugas = query(collection(db, "tugas_kelas"), where("kelas", "==", dataKelas.nama_kelas), where("status", "==", "Aktif"));
        const snapTugas = await getDocs(qTugas);
        setTugasList(snapTugas.docs.map(d => ({ id: d.id, ...d.data() })));

        // 4. Tarik Riwayat Pengerjaan (Submisi) Siswa
        const qSubmisi = query(collection(db, "submissions"), where("uid_siswa", "==", user.uid));
        const snapSubmisi = await getDocs(qSubmisi);
        setSubmisiList(snapSubmisi.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) {
        console.error("Gagal memuat kelas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetailKelas();
  }, [user, kelasId, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !kelasData) return;
    
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatInput(""); 
    setIsChatting(true);
    
    const konteksMateri = tugasList.map(t => t.judul).join(", ");
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: "ai", 
        text: `Berdasarkan silabus kelas ${kelasData.nama_kelas} yang meliputi: [${konteksMateri || 'Belum ada'}]. Menjawab pertanyaanmu terkait "${userMsg}", berikut penjelasannya...` 
      }]);
      setIsChatting(false);
    }, 1500);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-bold text-slate-500 animate-pulse">Menyiapkan Ruang Kelas...</p>
    </div>
  );

  return (
    <div className="pb-24 px-4 md:px-8 pt-2 md:pt-4 space-y-6">
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 flex flex-col h-[calc(100vh-120px)]">
        
        {/* HEADER KELAS */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm w-max pr-8">
          <Link href="/siswa/kelas">
            <button className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm">&larr;</button>
          </Link>
          <div>
             <h2 className="text-xl font-black text-slate-800 leading-tight">{kelasData?.nama_kelas}</h2>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kode: {kelasData?.kode_kelas}</p>
          </div>
        </div>

        {/* AREA UTAMA (TABS & KONTEN) */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
           
           {/* NAVIGASI TABS */}
           <div className="flex border-b border-slate-100 bg-[#F4F5F7]/30 px-4 pt-2 shrink-0">
             <button onClick={() => setActiveTab("materi")} className={`px-6 py-4 font-black text-[13px] border-b-[3px] rounded-t-xl transition-colors ${activeTab === "materi" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"}`}>
               📚 Materi & Ujian
             </button>
             <button onClick={() => setActiveTab("tutor_ai")} className={`px-6 py-4 font-black text-[13px] border-b-[3px] rounded-t-xl transition-colors flex items-center gap-2 ${activeTab === "tutor_ai" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"}`}>
               ✨ AI Tutor Kelas <span className="bg-indigo-100 text-indigo-600 text-[9px] px-1.5 py-0.5 rounded-md">BETA</span>
             </button>
           </div>

           <div className="flex-1 overflow-y-auto bg-slate-50/30 relative">
             
             {/* ================= TAB 1: MATERI & UJIAN ================= */}
             {activeTab === "materi" && (
               <div className="p-6 md:p-8 space-y-4">
                  {tugasList.length > 0 ? tugasList.map(tugas => {
                    const isDone = submisiList.some(s => s.id_tugas === tugas.id);
                    const isUjian = tugas.tipe_tugas === 'Kuis CBT';
                    
                    // Logika Penentuan Rute (Ujian vs Materi Biasa)
                    const routeTujuan = isUjian ? `/siswa/kelas/ujian/${tugas.id}` : `/siswa/kelas/materi/${tugas.id}`;

                    return (
                      <div key={tugas.id} className="bg-white border border-slate-200 p-5 md:p-6 rounded-[24px] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-300 hover:shadow-md transition-all group">
                         <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-inner ${isDone ? 'bg-emerald-50 border-emerald-100' : isUjian ? 'bg-purple-50 border-purple-100' : 'bg-orange-50 border-orange-100'}`}>
                              {isDone ? '✅' : isUjian ? '💻' : '📝'}
                            </div>
                            <div>
                               <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-1.5 inline-block ${isUjian ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                 {tugas.tipe_tugas}
                               </span>
                               <h3 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors leading-tight">{tugas.judul}</h3>
                               <p className="text-[11px] font-bold text-slate-500 mt-1">
                                 Batas Waktu: <span className={isDone ? 'text-slate-400' : 'text-rose-500'}>{tugas.deadline || "Tidak ada batas waktu"}</span>
                               </p>
                            </div>
                         </div>
                         
                         {!isDone ? (
                           <Link href={routeTujuan} className="w-full sm:w-auto">
                             <button className={`w-full sm:w-auto px-6 py-3.5 text-white font-black text-[13px] rounded-xl shadow-md transition-all active:scale-95 ${isUjian ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' : 'bg-slate-900 hover:bg-indigo-600'}`}>
                               {isUjian ? "Mulai Ujian CBT" : "Buka Materi"}
                             </button>
                           </Link>
                         ) : (
                           <div className="px-5 py-3 bg-emerald-50 text-emerald-600 font-bold text-[12px] rounded-xl border border-emerald-100 text-center w-full sm:w-auto">
                             Selesai Mengerjakan
                           </div>
                         )}
                      </div>
                    );
                  }) : (
                    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[24px]">
                      <div className="text-4xl mb-3 opacity-50">📂</div>
                      <h4 className="font-black text-slate-700 text-lg">Belum ada materi atau ujian</h4>
                      <p className="text-sm font-medium text-slate-500 mt-1">Guru belum menerbitkan apa-apa di kelas ini.</p>
                    </div>
                  )}
               </div>
             )}

             {/* ================= TAB 2: TUTOR AI ================= */}
             {activeTab === "tutor_ai" && (
               <div className="flex flex-col h-full absolute inset-0">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                     <div className="text-center mb-8 pt-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full border-4 border-white shadow-md text-3xl mb-3">🤖</div>
                        <h3 className="font-black text-slate-800 text-lg">Tutor AI: {kelasData?.nama_kelas}</h3>
                        <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto mt-1">Tanyakan apapun seputar materi kelas ini. Asisten akan membantu menjelaskannya untukmu.</p>
                     </div>
                     
                     {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-sm font-black border-2 border-white ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'}`}>
                              {msg.role === 'user' ? '👤' : '✨'}
                           </div>
                           <div className={`p-4 max-w-[80%] rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                              {msg.text}
                           </div>
                        </div>
                     ))}
                     
                     {isChatting && (
                        <div className="flex gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-sm font-black border-2 border-white">✨</div>
                           <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-sm text-slate-400 text-xs italic flex gap-2 items-center shadow-sm">
                              Asisten sedang mengetik <span className="flex gap-0.5"><span className="animate-bounce w-1 h-1 bg-slate-400 rounded-full"></span><span className="animate-bounce w-1 h-1 bg-slate-400 rounded-full delay-75"></span><span className="animate-bounce w-1 h-1 bg-slate-400 rounded-full delay-150"></span></span>
                           </div>
                        </div>
                     )}
                     <div ref={chatEndRef} />
                  </div>
                  
                  <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                     <form onSubmit={handleSendMessage} className="flex gap-2 relative max-w-4xl mx-auto">
                        <input required type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ketik pertanyaanmu di sini..." className="flex-1 p-4 pr-16 bg-[#F4F5F7] border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white text-sm font-medium transition-colors shadow-inner"/>
                        <button type="submit" disabled={isChatting} className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-700 text-white rounded-[14px] flex items-center justify-center transition-all disabled:opacity-50 shadow-md active:scale-95">
                           <svg className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                     </form>
                  </div>
               </div>
             )}
           </div>
        </div>
      </motion.div>
    </div>
  );
}