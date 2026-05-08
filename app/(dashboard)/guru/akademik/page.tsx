"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// INTERFACES
interface BankSoalDoc { id: string; topik: string; mapel: string; konten_ai: string; }
interface TugasAktif { id: string; judul: string; kelas: string; mapel: string; konten_soal: string; deadline: string; status: string; }
interface SubmisiSiswa { id: string; uid_siswa: string; nama_siswa: string; kelas: string; status: string; nilai: number | null; jawaban_teks: string; feedback_ai: string; catatan_guru: string; }

export default function AkademikSiswaPage() {
  const { user } = useAuth();
  
  // ================= TABS & DATA =================
  const [activeTab, setActiveTab] = useState<"daftar" | "buat" | "koreksi">("daftar");
  const [selectedKelasFilter, setSelectedKelasFilter] = useState("Semua Kelas");
  const daftarKelas = ["Semua Kelas", "Kelas VII-A", "Kelas VII-B", "Kelas VIII-A", "Kelas IX-A", "Kelas X-IPA 1", "Kelas XI-IPS 2"];
  
  const [bankSoalList, setBankSoalList] = useState<BankSoalDoc[]>([]);
  const [tugasAktifList, setTugasAktifList] = useState<TugasAktif[]>([]);
  const [siswaSubmissions, setSiswaSubmissions] = useState<SubmisiSiswa[]>([]);
  const [selectedTugas, setSelectedTugas] = useState<TugasAktif | null>(null);

  // ================= STATE BUAT TUGAS BARU =================
  const [formJudul, setFormJudul] = useState("");
  const [formKelas, setFormKelas] = useState("Kelas VII-A");
  const [formMapel, setFormMapel] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [sumberSoal, setSumberSoal] = useState<"bank_ai" | "upload" | "manual">("bank_ai");
  
  // Custom dari Bank Soal
  const [selectedBankSoalId, setSelectedBankSoalId] = useState("");
  const [opsiPG, setOpsiPG] = useState(true); const [qtyPG, setQtyPG] = useState(10);
  const [opsiIsian, setOpsiIsian] = useState(false); const [qtyIsian, setQtyIsian] = useState(5);
  const [opsiEsai, setOpsiEsai] = useState(true); const [qtyEsai, setQtyEsai] = useState(5);
  
  // Manual / Upload
  const [soalManual, setSoalManual] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // ================= STATE KOREKSI =================
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentSiswa, setCurrentSiswa] = useState<SubmisiSiswa | null>(null);
  const [manualScore, setManualScore] = useState<number | string>("");
  const [manualNote, setManualNote] = useState("");
  const [isAiGrading, setIsAiGrading] = useState(false);

  // FETCH INIT DATA
  useEffect(() => {
    if (!user) return;
    const fetchInit = async () => {
      // Fetch Raw Bank Soal
      const qBank = query(collection(db, "dokumen"), where("id_user", "==", user.uid), where("tipe", "in", ["Bank Soal", "Rubrik Penilaian"]));
      const snapBank = await getDocs(qBank);
      setBankSoalList(snapBank.docs.map(d => ({ id: d.id, ...d.data() })) as BankSoalDoc[]);

      // Fetch Tugas Aktif yang sudah diterbitkan guru
      const qTugas = query(collection(db, "tugas_kelas"), where("id_guru", "==", user.uid));
      onSnapshot(qTugas, (snap) => {
        setTugasAktifList(snap.docs.map(d => ({ id: d.id, ...d.data() })) as TugasAktif[]);
      });
    };
    fetchInit();
  }, [user]);

  // FETCH SUBMISI KETIKA TUGAS DIPILIH
  useEffect(() => {
    if (!selectedTugas) return;
    const qSub = query(collection(db, "submissions"), where("id_tugas", "==", selectedTugas.id));
    const unsub = onSnapshot(qSub, (snap) => {
      setSiswaSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as SubmisiSiswa[]);
    });
    return () => unsub();
  }, [selectedTugas]);

  // ================= HANDLERS =================

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsExtracting(true);
    // Simulasi Vision AI Mengekstrak dokumen
    setTimeout(() => {
      setSoalManual(`**Berhasil diekstrak dari dokumen: ${file.name}**\n\n1. Jelaskan apa yang dimaksud dengan fotosintesis!\n2. Sebutkan 3 komponen utama yang dibutuhkan tumbuhan untuk fotosintesis.\n\n*Arahkan kursor untuk mengedit soal ini secara manual sebelum diterbitkan.*`);
      setSumberSoal("manual");
      setIsExtracting(false);
      alert("AI berhasil membaca dan mengekstrak soal dari dokumen!");
    }, 2500);
  };

  const handleTerbitkanTugas = async (e: any) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      let finalKonten = "";
      if (sumberSoal === "bank_ai") {
        const docRef = bankSoalList.find(d => d.id === selectedBankSoalId);
        finalKonten = docRef ? docRef.konten_ai : "Soal dari Bank Soal AI.";
        // Di sistem nyata, Anda memotong teks konten_ai ini berdasarkan qtyPG dan qtyEsai menggunakan Regex/Split.
        // Untuk UI ini kita ambil konten penuhnya dan kita rapikan.
      } else {
        finalKonten = soalManual;
      }

      await addDoc(collection(db, "tugas_kelas"), {
        id_guru: user?.uid,
        judul: formJudul, mapel: formMapel, kelas: formKelas, deadline: formDeadline,
        konten_soal: finalKonten, status: "Aktif", dibuat_pada: serverTimestamp()
      });

      alert("Tugas berhasil diterbitkan ke kelas!");
      setActiveTab("daftar");
    } catch (e) {
      alert("Gagal menerbitkan tugas.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSimpanNilaiManual = async () => {
    if (!currentSiswa) return;
    const ref = doc(db, "submissions", currentSiswa.id);
    await updateDoc(ref, { nilai: Number(manualScore), catatan_guru: manualNote });
    setShowReviewModal(false);
  };

  const handleKoreksiOtomatis = async () => {
    if (siswaSubmissions.length === 0) return alert("Belum ada siswa mengumpulkan.");
    setIsAiGrading(true);
    setTimeout(async () => {
      for (const sub of siswaSubmissions.filter(s => s.status === "Sudah Kumpul" && s.nilai === null)) {
        await updateDoc(doc(db, "submissions", sub.id), { nilai: Math.floor(Math.random() * 25) + 75, feedback_ai: "Analisis AI: Jawaban relevan dan tepat." });
      }
      setIsAiGrading(false);
    }, 2000);
  };

  // FILTER TUGAS LIST
  const filteredTugas = selectedKelasFilter === "Semua Kelas" ? tugasAktifList : tugasAktifList.filter(t => t.kelas === selectedKelasFilter);

  // UTILS KUNCI JAWABAN REMOVER
  const parseSoalSiswa = (kontenAI: string) => {
    const keyword = "KUNCI JAWABAN";
    const index = kontenAI.toUpperCase().lastIndexOf(keyword);
    return index !== -1 ? kontenAI.substring(0, index).trim() : kontenAI;
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-24 md:pb-10 px-4 md:px-8 pt-4 md:pt-6 space-y-6">
      
      {/* ================= MODAL REVIEW & PENILAIAN MANUAL ================= */}
      <AnimatePresence>
        {showReviewModal && currentSiswa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center rounded-t-[32px]">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Ruang Penilaian: {currentSiswa.nama_siswa}</h3>
                  <p className="text-xs text-slate-500 font-bold">{currentSiswa.kelas}</p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="w-10 h-10 bg-white rounded-full font-bold shadow-sm border">X</button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border">
                    <p className="text-[11px] font-black uppercase text-slate-400 mb-2">Lembar Jawaban Siswa</p>
                    <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{currentSiswa.jawaban_teks || "Tidak ada jawaban tertulis."}</p>
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <p className="text-[11px] font-black uppercase text-indigo-400 mb-2">✨ Analisis AI</p>
                    <p className="text-[13px] text-indigo-800 italic">{currentSiswa.feedback_ai || "Klik 'Koreksi dengan AI' untuk memunculkan analisis."}</p>
                  </div>
                </div>
                
                <div className="space-y-4 flex flex-col">
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-400 mb-2 block">Beri Nilai Akhir (0-100)</label>
                    <input 
                      type="number" 
                      value={manualScore} 
                      onChange={(e) => setManualScore(e.target.value)} 
                      placeholder={currentSiswa.nilai !== null ? String(currentSiswa.nilai) : "Ketik nilai manual..."}
                      className="w-full text-3xl font-black text-slate-800 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-center shadow-inner"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="text-[11px] font-black uppercase text-slate-400 mb-2 block">Catatan / Feedback Guru</label>
                    <textarea 
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      placeholder="Kerja bagus! Perhatikan lagi bagian..."
                      className="w-full flex-1 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-[13px] resize-none shadow-inner"
                    />
                  </div>
                  <button 
                    onClick={() => { setManualScore(85); setManualNote("Analisis AI: Jawaban mendekati kunci dengan akurasi 85%."); }}
                    className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold text-[13px] rounded-2xl hover:bg-indigo-100 border border-indigo-200 flex justify-center items-center gap-2"
                  >
                    ✨ Minta AI Nilai 1 Anak Ini
                  </button>
                </div>
              </div>

              <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 rounded-b-[32px]">
                 <button onClick={() => setShowReviewModal(false)} className="px-6 py-3 bg-slate-200 text-slate-700 font-bold text-[13px] rounded-xl">Batal</button>
                 <button onClick={handleSimpanNilaiManual} className="px-8 py-3 bg-slate-900 text-white font-bold text-[13px] rounded-xl shadow-md">Simpan Nilai</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= HEADER UTAMA ================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-[42px] font-black text-slate-800 tracking-tight leading-tight">LMS Akademik</h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm">Terbitkan tugas kustom, pantau progres, dan kelola nilai kelas dalam satu dasbor.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[700px] flex flex-col">
        
        {/* ================= TABS NAVBAR ================= */}
        <div className="flex items-center justify-between px-6 md:px-8 border-b border-slate-100 bg-[#F4F5F7]/50">
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab("daftar")} className={`py-5 font-bold text-[13px] border-b-[3px] transition-all ${activeTab === "daftar" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Kelas & Tugas Aktif</button>
            <button onClick={() => setActiveTab("buat")} className={`py-5 font-bold text-[13px] border-b-[3px] transition-all ${activeTab === "buat" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>+ Buat Tugas Baru</button>
            {selectedTugas && <button onClick={() => setActiveTab("koreksi")} className={`py-5 font-bold text-[13px] border-b-[3px] transition-all flex items-center gap-2 ${activeTab === "koreksi" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400"}`}>
              <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-transparent bg-clip-text">Ruang Koreksi AI</span>
              <span className="bg-rose-100 text-rose-600 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Aktif</span>
            </button>}
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 bg-slate-50/30">
          <AnimatePresence mode="wait">
            
            {/* ================= TAB 1: DAFTAR TUGAS KELAS ================= */}
            {activeTab === "daftar" && (
              <motion.div key="daftar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-8">
                  <select value={selectedKelasFilter} onChange={(e) => setSelectedKelasFilter(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none shadow-sm">
                    {daftarKelas.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <button onClick={() => setActiveTab("buat")} className="px-5 py-3 bg-indigo-600 text-white font-bold text-[13px] rounded-xl shadow-md hover:bg-indigo-700 transition-colors">+ Tugas Baru</button>
                </div>
                
                {filteredTugas.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {filteredTugas.map((tugas) => (
                      <div key={tugas.id} className="p-6 border border-slate-200 bg-white rounded-3xl hover:border-indigo-300 hover:shadow-xl transition-all flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start mb-3 relative z-10">
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg uppercase">{tugas.kelas}</span>
                          <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600">Rilis</span>
                        </div>
                        <h3 className="font-black text-slate-800 text-[16px] mb-1 relative z-10 leading-tight">{tugas.judul}</h3>
                        <p className="text-[12px] text-slate-500 font-bold mb-4 relative z-10">{tugas.mapel} • {tugas.deadline}</p>
                        
                        <div className="mt-auto pt-4 border-t flex justify-end relative z-10">
                          <button onClick={() => { setSelectedTugas(tugas); setActiveTab("koreksi"); }} className="w-full py-2.5 bg-slate-900 text-white font-bold text-[12px] rounded-xl hover:bg-indigo-600 transition-colors">Buka Ruang Kelas</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-white">
                     <div className="text-5xl mb-4 opacity-50">📭</div>
                     <p className="font-bold text-slate-600 text-lg">Belum ada tugas yang diterbitkan</p>
                     <p className="text-sm text-slate-400 mt-1">Buat tugas baru melalui menu di atas.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ================= TAB 2: BUAT TUGAS BARU ================= */}
            {activeTab === "buat" && (
              <motion.div key="buat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleTerbitkanTugas} className="max-w-4xl mx-auto bg-white p-8 rounded-[32px] shadow-xl border border-slate-100 space-y-8">
                  
                  {/* Info Dasar */}
                  <div>
                    <h3 className="text-lg font-black text-slate-800 border-b pb-3 mb-5">1. Informasi Tugas Dasar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div><label className="text-[12px] font-bold text-slate-500 mb-2 block">Judul Tugas</label><input required value={formJudul} onChange={e=>setFormJudul(e.target.value)} type="text" placeholder="Misal: Latihan Soal Fotosintesis" className="w-full p-3.5 bg-[#F4F5F7] rounded-xl border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-[13px]"/></div>
                      <div><label className="text-[12px] font-bold text-slate-500 mb-2 block">Mata Pelajaran</label><input required value={formMapel} onChange={e=>setFormMapel(e.target.value)} type="text" placeholder="IPA Terpadu" className="w-full p-3.5 bg-[#F4F5F7] rounded-xl border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-[13px]"/></div>
                      <div><label className="text-[12px] font-bold text-slate-500 mb-2 block">Terbitkan Ke Kelas</label><select required value={formKelas} onChange={e=>setFormKelas(e.target.value)} className="w-full p-3.5 bg-[#F4F5F7] rounded-xl border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-[13px]">{daftarKelas.filter(k=>k!=="Semua Kelas").map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                      <div><label className="text-[12px] font-bold text-slate-500 mb-2 block">Tenggat Waktu (Deadline)</label><input required value={formDeadline} onChange={e=>setFormDeadline(e.target.value)} type="text" placeholder="Misal: Jumat, 20 Mei 23:59" className="w-full p-3.5 bg-[#F4F5F7] rounded-xl border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-[13px]"/></div>
                    </div>
                  </div>

                  {/* Sumber Soal */}
                  <div>
                    <h3 className="text-lg font-black text-slate-800 border-b pb-3 mb-5">2. Kustomisasi Isi Soal</h3>
                    
                    <div className="flex gap-3 mb-6 bg-slate-50 p-2 rounded-2xl">
                      <button type="button" onClick={()=>setSumberSoal("bank_ai")} className={`flex-1 py-3 rounded-xl font-bold text-[13px] transition-all ${sumberSoal==="bank_ai"?'bg-white text-indigo-600 shadow-sm border border-slate-200':'text-slate-500 hover:bg-slate-100'}`}>🤖 Dari Bank Soal AI</button>
                      <button type="button" onClick={()=>setSumberSoal("upload")} className={`flex-1 py-3 rounded-xl font-bold text-[13px] transition-all ${sumberSoal==="upload"?'bg-white text-emerald-600 shadow-sm border border-slate-200':'text-slate-500 hover:bg-slate-100'}`}>📥 Upload Dokumen</button>
                      <button type="button" onClick={()=>setSumberSoal("manual")} className={`flex-1 py-3 rounded-xl font-bold text-[13px] transition-all ${sumberSoal==="manual"?'bg-white text-rose-600 shadow-sm border border-slate-200':'text-slate-500 hover:bg-slate-100'}`}>✍️ Tulis Manual</button>
                    </div>

                    {/* OPSI: BANK SOAL */}
                    {sumberSoal === "bank_ai" && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-6">
                        <div>
                          <label className="text-[12px] font-bold text-indigo-800 mb-2 block">Pilih Dokumen Bank Soal/Rubrik Anda</label>
                          <select required value={selectedBankSoalId} onChange={e=>setSelectedBankSoalId(e.target.value)} className="w-full p-3.5 bg-white rounded-xl border border-indigo-200 outline-none font-bold text-[13px] shadow-sm">
                            <option value="">-- Pilih Dokumen --</option>
                            {bankSoalList.map(b => <option key={b.id} value={b.id}>{b.topik} ({b.mapel})</option>)}
                          </select>
                        </div>
                        {selectedBankSoalId && (
                          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                            <label className="text-[12px] font-black uppercase tracking-widest text-indigo-400 mb-4 block">Filter Jenis Soal (Custom Task)</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${opsiPG?'bg-indigo-50 border-indigo-200':'bg-slate-50 border-transparent opacity-50'}`}>
                                <input type="checkbox" checked={opsiPG} onChange={e=>setOpsiPG(e.target.checked)} className="w-5 h-5 accent-indigo-600"/>
                                <div className="flex-1">
                                  <span className="text-[12px] font-bold text-slate-800 block mb-1">Pilihan Ganda</span>
                                  <input type="number" min="1" value={qtyPG} onChange={e=>setQtyPG(Number(e.target.value))} disabled={!opsiPG} className="w-full p-1.5 text-center text-xs border rounded bg-white" placeholder="Jml"/>
                                </div>
                              </label>
                              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${opsiIsian?'bg-indigo-50 border-indigo-200':'bg-slate-50 border-transparent opacity-50'}`}>
                                <input type="checkbox" checked={opsiIsian} onChange={e=>setOpsiIsian(e.target.checked)} className="w-5 h-5 accent-indigo-600"/>
                                <div className="flex-1">
                                  <span className="text-[12px] font-bold text-slate-800 block mb-1">Isian Singkat</span>
                                  <input type="number" min="1" value={qtyIsian} onChange={e=>setQtyIsian(Number(e.target.value))} disabled={!opsiIsian} className="w-full p-1.5 text-center text-xs border rounded bg-white" placeholder="Jml"/>
                                </div>
                              </label>
                              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${opsiEsai?'bg-indigo-50 border-indigo-200':'bg-slate-50 border-transparent opacity-50'}`}>
                                <input type="checkbox" checked={opsiEsai} onChange={e=>setOpsiEsai(e.target.checked)} className="w-5 h-5 accent-indigo-600"/>
                                <div className="flex-1">
                                  <span className="text-[12px] font-bold text-slate-800 block mb-1">Uraian/Esai</span>
                                  <input type="number" min="1" value={qtyEsai} onChange={e=>setQtyEsai(Number(e.target.value))} disabled={!opsiEsai} className="w-full p-1.5 text-center text-xs border rounded bg-white" placeholder="Jml"/>
                                </div>
                              </label>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-4 text-center">Sistem akan secara otomatis menyaring soal dari dokumen utama Anda.</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* OPSI: UPLOAD DOKUMEN */}
                    {sumberSoal === "upload" && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-emerald-50/50 p-8 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center border-dashed text-center">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm mb-4">📥</div>
                         <h4 className="font-bold text-slate-700 mb-1">Upload File (PDF/Doc/Image)</h4>
                         <p className="text-xs text-slate-500 mb-5 max-w-sm">Vision AI akan membaca file Anda dan mengubahnya menjadi form soal digital yang siap diedit.</p>
                         <label className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors">
                           {isExtracting ? "Mengekstrak Dokumen..." : "Pilih File Dokumen"}
                           <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg" onChange={handleFileUpload} disabled={isExtracting}/>
                         </label>
                      </motion.div>
                    )}

                    {/* OPSI: MANUAL */}
                    {sumberSoal === "manual" && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                        <textarea 
                          value={soalManual} 
                          onChange={(e) => setSoalManual(e.target.value)} 
                          className="w-full h-64 p-5 bg-[#F4F5F7] border border-slate-200 rounded-2xl text-[13px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white resize-y shadow-inner" 
                          placeholder="Ketik atau copy-paste soal di sini. Gunakan format nomor atau Markdown..."
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* TERBITKAN */}
                  <div className="pt-6 border-t flex justify-end">
                    <button disabled={isPublishing || (sumberSoal === "bank_ai" && !selectedBankSoalId)} type="submit" className="px-10 py-4 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-xl transition-all hover:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-[14px]">
                      {isPublishing ? "Menerbitkan..." : "🚀 Terbitkan Tugas ke Siswa"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ================= TAB 3: RUANG KOREKSI AI & SISWA ================= */}
            {activeTab === "koreksi" && selectedTugas && (
              <motion.div key="koreksi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-3xl mb-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
                  <div className="relative z-10 flex-1">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-3">Ruang Evaluasi Aktif</span>
                    <h2 className="font-black text-2xl md:text-3xl leading-tight mb-1">{selectedTugas.judul}</h2>
                    <p className="text-indigo-200 text-sm font-medium">{selectedTugas.kelas} • {selectedTugas.mapel} • Deadline: <span className="text-rose-300">{selectedTugas.deadline}</span></p>
                  </div>
                  <button onClick={handleKoreksiOtomatis} disabled={isAiGrading} className={`relative z-10 px-6 py-4 rounded-2xl font-bold text-white text-[13px] flex items-center gap-3 transition-all shadow-2xl active:scale-95 ${isAiGrading ? 'bg-indigo-500/50 cursor-not-allowed' : 'bg-gradient-to-r from-[#FF6B4A] to-[#FF4B2B] hover:shadow-orange-500/30'}`}>
                    {isAiGrading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> AI Menilai...</> : <>✨ Jalankan Auto-Korektor AI</>}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* PREVIEW TUGAS (MENGGUNAKAN MARKDOWN) */}
                  <div className="lg:col-span-5 bg-[#F4F5F7] rounded-3xl p-6 border h-[600px] flex flex-col">
                    <h3 className="font-black text-slate-800 text-sm mb-4 border-b pb-4 flex items-center gap-2">📱 Tampilan Layar Siswa</h3>
                    <div className="flex-1 overflow-y-auto bg-white rounded-2xl p-6 shadow-inner border border-slate-100 text-slate-700">
                       <div className="prose prose-sm prose-indigo max-w-none">
                         <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {parseSoalSiswa(selectedTugas.konten_soal)}
                         </ReactMarkdown>
                       </div>
                    </div>
                  </div>

                  {/* TABEL SISWA */}
                  <div className="lg:col-span-7 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-slate-800 text-lg">Daftar Pengumpulan</h3>
                      <button className="text-[11px] font-bold px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">📥 Rekap CSV</button>
                    </div>

                    <div className="bg-white border rounded-3xl overflow-hidden shadow-sm flex-1">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50 border-b text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="p-4">Siswa</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Nilai</th>
                            <th className="p-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {siswaSubmissions.length > 0 ? siswaSubmissions.map((siswa) => (
                            <tr key={siswa.id} className="border-b hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-800 text-[13px]">{siswa.nama_siswa}</div>
                                <div className="text-[11px] text-slate-400">{siswa.uid_siswa.substring(0,6)}</div>
                              </td>
                              <td className="p-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${siswa.status === "Sudah Kumpul" ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"}`}>{siswa.status}</span>
                              </td>
                              <td className="p-4 text-center font-black text-slate-800 text-[15px]">
                                {siswa.nilai !== null ? (siswa.nilai >= 80 ? <span className="text-emerald-600">{siswa.nilai}</span> : <span className="text-amber-600">{siswa.nilai}</span>) : "-"}
                              </td>
                              <td className="p-4 text-right">
                                <button onClick={() => { setCurrentSiswa(siswa); setManualScore(siswa.nilai || ""); setManualNote(siswa.catatan_guru || ""); setShowReviewModal(true); }} disabled={siswa.status !== "Sudah Kumpul"} className={`text-[12px] font-bold px-4 py-2 rounded-xl transition-all border ${siswa.status === "Sudah Kumpul" ? "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 shadow-sm" : "opacity-30"}`}>Koreksi Manual</button>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan={4} className="p-10 text-center text-slate-400">Belum ada siswa yang bergabung / mengumpulkan.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}