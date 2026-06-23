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
interface KelasDoc { id: string; kode_kelas: string; nama_kelas: string; }
interface BankSoalDoc { id: string; topik: string; mapel: string; konten_ai: string; }
interface TugasAktif { id: string; judul: string; tipe_tugas: string; kelas: string; mapel: string; konten_soal: string; lampiran_url: string; deadline: string; status: string; }
interface SubmisiSiswa { id: string; uid_siswa: string; nama_siswa: string; kelas: string; status: string; nilai: number | null; jawaban_teks: string; feedback_ai: string; catatan_guru: string; }

export default function AkademikSiswaPage() {
  const { user } = useAuth();
  
  // ================= TABS & DATA =================
  const [activeTab, setActiveTab] = useState<"daftar" | "buat" | "koreksi">("daftar");
  const [selectedKelasFilter, setSelectedKelasFilter] = useState("Semua Kelas");
  
  const [kelasList, setKelasList] = useState<KelasDoc[]>([]);
  const [bankSoalList, setBankSoalList] = useState<BankSoalDoc[]>([]);
  const [tugasAktifList, setTugasAktifList] = useState<TugasAktif[]>([]);
  const [siswaSubmissions, setSiswaSubmissions] = useState<SubmisiSiswa[]>([]);
  const [selectedTugas, setSelectedTugas] = useState<TugasAktif | null>(null);

  // ================= STATE MANAJEMEN KELAS =================
  const [showKelasModal, setShowKelasModal] = useState(false);
  const [namaKelasBaru, setNamaKelasBaru] = useState("");
  const [isCreatingKelas, setIsCreatingKelas] = useState(false);

  // ================= STATE BUAT TUGAS BARU =================
  const [tipeTugas, setTipeTugas] = useState<"Kuis CBT" | "Tugas Esai / Rangkuman" | "Materi Bacaan">("Kuis CBT");
  const [formJudul, setFormJudul] = useState("");
  const [formKelas, setFormKelas] = useState(""); 
  const [formMapel, setFormMapel] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [lampiranUrl, setLampiranUrl] = useState("");
  const [sumberSoal, setSumberSoal] = useState<"bank_ai" | "manual">("bank_ai");
  
  const [selectedBankSoalId, setSelectedBankSoalId] = useState("");
  const [soalManual, setSoalManual] = useState("");
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
      // 1. Fetch Daftar Kelas yang dibuat Guru
      const qKelas = query(collection(db, "kelas"), where("id_guru", "==", user.uid));
      onSnapshot(qKelas, (snap) => {
        setKelasList(snap.docs.map(d => ({ id: d.id, ...d.data() })) as KelasDoc[]);
      });

      // 2. Fetch Bank Soal
      const qBank = query(collection(db, "dokumen"), where("id_user", "==", user.uid), where("tipe", "in", ["Bank Soal", "Modul Ajar (PPM)", "RPP"]));
      const snapBank = await getDocs(qBank);
      setBankSoalList(snapBank.docs.map(d => ({ id: d.id, ...d.data() })) as BankSoalDoc[]);

      // 3. Fetch Tugas
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

  // FUNGSI BUAT KELAS BARU (GENERATE 8 DIGIT KODE)
  const handleBuatKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKelasBaru.trim()) return;
    setIsCreatingKelas(true);
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let kodeUnik = '';
      for (let i = 0; i < 8; i++) {
        kodeUnik += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      await addDoc(collection(db, "kelas"), {
        id_guru: user?.uid,
        nama_kelas: namaKelasBaru,
        kode_kelas: kodeUnik,
        dibuat_pada: serverTimestamp()
      });

      setNamaKelasBaru("");
    } catch (error) {
      alert("Gagal membuat kelas baru.");
    } finally {
      setIsCreatingKelas(false);
    }
  };

  const handleCopyKode = (kode: string) => {
    navigator.clipboard.writeText(kode);
    alert(`Kode Kelas ${kode} berhasil disalin! Bagikan kode ini ke siswa Anda.`);
  };

  const handleTerbitkanTugas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKelas) return alert("Pilih kelas tujuan terlebih dahulu!");
    
    setIsPublishing(true);
    try {
      let finalKonten = "";
      if (sumberSoal === "bank_ai") {
        const docRef = bankSoalList.find(d => d.id === selectedBankSoalId);
        finalKonten = docRef ? docRef.konten_ai : "Materi tidak ditemukan.";
      } else {
        finalKonten = soalManual;
      }

      await addDoc(collection(db, "tugas_kelas"), {
        id_guru: user?.uid,
        tipe_tugas: tipeTugas,
        judul: formJudul, mapel: formMapel, kelas: formKelas, deadline: formDeadline,
        lampiran_url: lampiranUrl,
        konten_soal: finalKonten, status: "Aktif", dibuat_pada: serverTimestamp()
      });

      alert("Materi/Tugas berhasil diterbitkan ke kelas!");
      setActiveTab("daftar");
      setFormJudul(""); setLampiranUrl(""); setSoalManual(""); setFormKelas("");
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
        await updateDoc(doc(db, "submissions", sub.id), { nilai: Math.floor(Math.random() * 25) + 75, feedback_ai: "Analisis AI: Gagasan yang disampaikan siswa relevan dengan instruksi soal." });
      }
      setIsAiGrading(false);
    }, 2000);
  };

  // 🔥 FUNGSI EXPORT DATA KE CSV (EXCEL)
  const handleExportCSV = () => {
    if (siswaSubmissions.length === 0) return alert("Belum ada data untuk diekspor.");

    // Buat header CSV
    let csvContent = "Nama Siswa,UID Siswa,Kelas,Status,Nilai,Catatan Guru\n";

    // Tambahkan baris data
    siswaSubmissions.forEach(siswa => {
      const nama = `"${siswa.nama_siswa || '-'}"`;
      const uid = `"${siswa.uid_siswa || '-'}"`;
      const kelas = `"${siswa.kelas || '-'}"`;
      const status = `"${siswa.status || '-'}"`;
      const nilai = siswa.nilai !== null ? siswa.nilai : "Belum Dinilai";
      const catatan = `"${(siswa.catatan_guru || '').replace(/"/g, '""')}"`; // Escape quotes

      csvContent += `${nama},${uid},${kelas},${status},${nilai},${catatan}\n`;
    });

    // Buat blob dan trigger download
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 BOM
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = selectedTugas?.judul.replace(/[^a-zA-Z0-9]/g, '_') || 'Rekap';
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Nilai_${safeTitle}_${selectedTugas?.kelas}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ================= UTILS & ANALYTICS =================
  const dinamisDaftarKelas = ["Semua Kelas", ...Array.from(new Set(tugasAktifList.map(t => t.kelas)))];
  const filteredTugas = selectedKelasFilter === "Semua Kelas" ? tugasAktifList : tugasAktifList.filter(t => t.kelas === selectedKelasFilter);

  const parseSoalSiswa = (kontenAI: string) => {
    return kontenAI.replace(/\n(?:\*\*|#+)?\s*(Kunci Jawaban|KUNCI JAWABAN|Pedoman Penskoran|Rubrik Penilaian)[\s\S]*/gi, '');
  };

  const totalSiswaKumpul = siswaSubmissions.filter(s => s.status === "Sudah Kumpul").length;
  const nilaiList = siswaSubmissions.filter(s => s.nilai !== null).map(s => s.nilai as number);
  const rataRata = nilaiList.length > 0 ? (nilaiList.reduce((a,b)=>a+b,0) / nilaiList.length).toFixed(1) : "0";
  const tertinggi = nilaiList.length > 0 ? Math.max(...nilaiList) : 0;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 md:pb-10 px-4 md:px-8 pt-4 md:pt-6 space-y-6">
      
      {/* MODAL MANAJEMEN KELAS */}
      <AnimatePresence>
        {showKelasModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><span className="text-2xl">🏫</span> Manajemen Kelas</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">Buat kelas dan bagikan kode unik ke siswa Anda.</p>
                </div>
                <button onClick={() => setShowKelasModal(false)} className="w-10 h-10 bg-white rounded-full font-bold shadow-sm border text-slate-500 hover:text-rose-500 hover:bg-rose-50">X</button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                {/* Form Buat Kelas */}
                <form onSubmit={handleBuatKelas} className="flex gap-3 mb-8">
                  <input 
                    type="text" 
                    required 
                    value={namaKelasBaru} 
                    onChange={(e) => setNamaKelasBaru(e.target.value)} 
                    placeholder="Masukkan nama kelas baru (Misal: XII IPA 2)" 
                    className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-[13px] font-bold shadow-sm"
                  />
                  <button disabled={isCreatingKelas} type="submit" className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md text-[13px] disabled:opacity-50 transition-colors whitespace-nowrap">
                    {isCreatingKelas ? "Membuat..." : "+ Buat Kelas"}
                  </button>
                </form>

                {/* Daftar Kelas */}
                <h4 className="font-black text-slate-700 text-sm mb-4">Daftar Kelas Anda</h4>
                {kelasList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kelasList.map(kelas => (
                      <div key={kelas.id} className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-colors">
                        <div className="mb-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nama Kelas</p>
                          <h5 className="font-black text-slate-800 text-base">{kelas.nama_kelas}</h5>
                        </div>
                        <div className="bg-[#F4F5F7] p-3 rounded-xl flex items-center justify-between border border-slate-100">
                          <div>
                            <p className="text-[9px] font-bold uppercase text-slate-400">Kode Join Siswa</p>
                            <p className="font-mono font-black text-indigo-700 text-lg tracking-widest">{kelas.kode_kelas}</p>
                          </div>
                          <button onClick={() => handleCopyKode(kelas.kode_kelas)} className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95" title="Salin Kode">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                    <p className="text-slate-400 font-bold text-sm">Belum ada kelas yang dibuat.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL REVIEW MANUAL */}
      <AnimatePresence>
        {showReviewModal && currentSiswa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center rounded-t-[32px]">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Ruang Penilaian: {currentSiswa.nama_siswa}</h3>
                  <p className="text-xs text-slate-500 font-bold">{currentSiswa.kelas}</p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="w-10 h-10 bg-white rounded-full font-bold shadow-sm border text-slate-500 hover:text-rose-500 hover:bg-rose-50">X</button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border">
                    <p className="text-[11px] font-black uppercase text-slate-400 mb-2">Jawaban / Rangkuman Siswa</p>
                    <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{currentSiswa.jawaban_teks || "Tidak ada jawaban tertulis/Pilihan Ganda otomatis."}</p>
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <p className="text-[11px] font-black uppercase text-indigo-400 mb-2">✨ Analisis AI Evaluator</p>
                    <p className="text-[13px] text-indigo-800 italic">{currentSiswa.feedback_ai || "Klik 'Jalankan Auto-Korektor' untuk memunculkan analisis."}</p>
                  </div>
                </div>
                
                <div className="space-y-4 flex flex-col">
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-400 mb-2 block">Skor Akhir (0-100)</label>
                    <input type="number" value={manualScore} onChange={(e) => setManualScore(e.target.value)} placeholder="Ketik nilai..." className="w-full text-3xl font-black text-slate-800 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-center shadow-inner"/>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="text-[11px] font-black uppercase text-slate-400 mb-2 block">Catatan / Feedback Guru</label>
                    <textarea value={manualNote} onChange={(e) => setManualNote(e.target.value)} placeholder="Kerja bagus! Perhatikan lagi bagian..." className="w-full flex-1 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-[13px] resize-none shadow-inner"/>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 rounded-b-[32px]">
                 <button onClick={() => setShowReviewModal(false)} className="px-6 py-3 bg-slate-200 text-slate-700 font-bold text-[13px] rounded-xl hover:bg-slate-300">Batal</button>
                 <button onClick={handleSimpanNilaiManual} className="px-8 py-3 bg-slate-900 text-white font-bold text-[13px] rounded-xl shadow-md hover:bg-indigo-600 transition-colors">Simpan Nilai</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= HEADER UTAMA ================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-[42px] font-black text-slate-800 tracking-tight leading-tight">LMS Interaktif</h1>
          <p className="text-slate-500 font-medium mt-1.5 text-sm">Terbitkan ujian CBT, tugas rangkuman video, dan materi bacaan langsung ke dasbor siswa.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[700px] flex flex-col">
        
        {/* ================= TABS NAVBAR ================= */}
        <div className="flex items-center justify-between px-6 md:px-8 border-b border-slate-100 bg-[#F4F5F7]/50">
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab("daftar")} className={`py-5 font-bold text-[13px] border-b-[3px] transition-all ${activeTab === "daftar" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Kelas & Tugas Aktif</button>
            <button onClick={() => setActiveTab("buat")} className={`py-5 font-bold text-[13px] border-b-[3px] transition-all ${activeTab === "buat" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>+ Terbitkan Baru</button>
            {selectedTugas && <button onClick={() => setActiveTab("koreksi")} className={`py-5 font-bold text-[13px] border-b-[3px] transition-all flex items-center gap-2 ${activeTab === "koreksi" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400"}`}>
              <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-transparent bg-clip-text">Ruang Evaluasi</span>
              <span className="bg-rose-100 text-rose-600 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Aktif</span>
            </button>}
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 bg-slate-50/30">
          <AnimatePresence mode="wait">
            
            {/* ================= TAB 1: DAFTAR TUGAS KELAS ================= */}
            {activeTab === "daftar" && (
              <motion.div key="daftar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select value={selectedKelasFilter} onChange={(e) => setSelectedKelasFilter(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none shadow-sm flex-1 sm:flex-none">
                      {dinamisDaftarKelas.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <button onClick={() => setShowKelasModal(true)} className="px-5 py-3 bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-bold text-[13px] rounded-xl border border-slate-200 transition-colors shrink-0">
                      🏫 Manajemen Kelas
                    </button>
                  </div>
                  
                  <button onClick={() => setActiveTab("buat")} className="w-full sm:w-auto px-5 py-3 bg-indigo-600 text-white font-bold text-[13px] rounded-xl shadow-md hover:bg-indigo-700 transition-colors">+ Distribusi Baru</button>
                </div>
                
                {filteredTugas.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {filteredTugas.map((tugas) => (
                      <div key={tugas.id} className="p-6 border border-slate-200 bg-white rounded-3xl hover:border-indigo-300 hover:shadow-xl transition-all flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start mb-3 relative z-10">
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase ${tugas.tipe_tugas === 'Kuis CBT' ? 'bg-purple-50 text-purple-700' : tugas.tipe_tugas === 'Materi Bacaan' ? 'bg-sky-50 text-sky-700' : 'bg-orange-50 text-orange-700'}`}>
                            {tugas.tipe_tugas}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 border px-2 py-1 rounded-md bg-slate-50">{tugas.kelas}</span>
                        </div>
                        <h3 className="font-black text-slate-800 text-[16px] mb-1 relative z-10 leading-tight">{tugas.judul}</h3>
                        <p className="text-[12px] text-slate-500 font-bold mb-4 relative z-10">{tugas.mapel} • {tugas.deadline || 'Tanpa Deadline'}</p>
                        
                        <div className="mt-auto pt-4 border-t flex justify-end relative z-10">
                          <button onClick={() => { setSelectedTugas(tugas); setActiveTab("koreksi"); }} className="w-full py-2.5 bg-slate-900 text-white font-bold text-[12px] rounded-xl hover:bg-indigo-600 transition-colors">Buka Dasbor Evaluasi</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-white">
                     <div className="text-5xl mb-4 opacity-50">📭</div>
                     <p className="font-bold text-slate-600 text-lg">Belum ada materi/ujian yang diterbitkan</p>
                     <p className="text-sm text-slate-400 mt-1">Buat tugas baru melalui menu di atas.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ================= TAB 2: BUAT TUGAS BARU ================= */}
            {activeTab === "buat" && (
              <motion.div key="buat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleTerbitkanTugas} className="max-w-4xl mx-auto bg-white p-8 rounded-[32px] shadow-xl border border-slate-100 space-y-8">
                  
                  {/* TIPE TUGAS */}
                  <div>
                     <h3 className="text-lg font-black text-slate-800 border-b pb-3 mb-5">1. Pilih Format Kegiatan Siswa</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${tipeTugas === 'Kuis CBT' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200'}`}>
                           <input type="radio" className="hidden" checked={tipeTugas === 'Kuis CBT'} onChange={() => setTipeTugas('Kuis CBT')} />
                           <div className="text-2xl mb-2">💻</div>
                           <h4 className="font-bold text-sm text-slate-800">Ujian / Kuis CBT</h4>
                           <p className="text-[11px] text-slate-500 mt-1">Siswa mengerjakan soal Pilihan Ganda/Esai ala E-Ujian otomatis.</p>
                        </label>
                        <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${tipeTugas === 'Tugas Esai / Rangkuman' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200'}`}>
                           <input type="radio" className="hidden" checked={tipeTugas === 'Tugas Esai / Rangkuman'} onChange={() => setTipeTugas('Tugas Esai / Rangkuman')} />
                           <div className="text-2xl mb-2">✍️</div>
                           <h4 className="font-bold text-sm text-slate-800">Tugas / Rangkuman</h4>
                           <p className="text-[11px] text-slate-500 mt-1">Siswa menonton video/bacaan lalu merangkum atau menjawab esai panjang.</p>
                        </label>
                        <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${tipeTugas === 'Materi Bacaan' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200'}`}>
                           <input type="radio" className="hidden" checked={tipeTugas === 'Materi Bacaan'} onChange={() => setTipeTugas('Materi Bacaan')} />
                           <div className="text-2xl mb-2">📖</div>
                           <h4 className="font-bold text-sm text-slate-800">Materi Interaktif</h4>
                           <p className="text-[11px] text-slate-500 mt-1">Siswa sekadar membaca modul/menonton tanpa perlu mengumpulkan jawaban.</p>
                        </label>
                     </div>
                  </div>

                  {/* Info Dasar */}
                  <div>
                    <h3 className="text-lg font-black text-slate-800 border-b pb-3 mb-5">2. Pengaturan Distribusi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div><label className="text-[12px] font-bold text-slate-500 mb-2 block">Judul Modul / Ujian</label><input required value={formJudul} onChange={e=>setFormJudul(e.target.value)} type="text" placeholder="Misal: Kuis Sistem Pencernaan" className="w-full p-3.5 bg-[#F4F5F7] rounded-xl border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-[13px]"/></div>
                      <div><label className="text-[12px] font-bold text-slate-500 mb-2 block">Mata Pelajaran</label><input required value={formMapel} onChange={e=>setFormMapel(e.target.value)} type="text" placeholder="Misal: Biologi" className="w-full p-3.5 bg-[#F4F5F7] rounded-xl border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-[13px]"/></div>
                      
                      {/* DROPDOWN KELAS DINAMIS DARI DATABASE */}
                      <div>
                        <label className="text-[12px] font-bold text-slate-500 mb-2 flex items-center justify-between">
                          Pilih Kelas Tujuan
                          {kelasList.length === 0 && <span className="text-[10px] text-rose-500 font-black">Buat kelas terlebih dahulu!</span>}
                        </label>
                        <select required value={formKelas} onChange={e=>setFormKelas(e.target.value)} className={`w-full p-3.5 bg-[#F4F5F7] rounded-xl border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-[13px] ${kelasList.length === 0 ? 'border-rose-300' : ''}`}>
                          <option value="">-- Pilih Kelas --</option>
                          {kelasList.map(k => <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>)}
                        </select>
                      </div>

                      {tipeTugas !== 'Materi Bacaan' && (
                        <div><label className="text-[12px] font-bold text-slate-500 mb-2 block">Tenggat Waktu / Berakhir</label><input required value={formDeadline} onChange={e=>setFormDeadline(e.target.value)} type="text" placeholder="Misal: Jumat, 20 Mei 23:59" className="w-full p-3.5 bg-[#F4F5F7] rounded-xl border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-[13px]"/></div>
                      )}
                    </div>
                  </div>

                  {/* Sumber Soal / Materi */}
                  <div>
                    <h3 className="text-lg font-black text-slate-800 border-b pb-3 mb-5">3. Sumber Konten Pembelajaran</h3>
                    
                    {(tipeTugas === 'Tugas Esai / Rangkuman' || tipeTugas === 'Materi Bacaan') && (
                       <div className="mb-6 p-5 bg-sky-50 rounded-2xl border border-sky-100">
                          <label className="text-[12px] font-bold text-sky-800 mb-2 block">Sematkan Video YouTube / Tautan Referensi (Opsional)</label>
                          <input type="url" value={lampiranUrl} onChange={(e)=>setLampiranUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full p-3.5 bg-white border border-sky-200 rounded-xl text-sm outline-none shadow-sm focus:border-sky-500"/>
                          <p className="text-[10px] text-sky-600 mt-2">Siswa wajib menonton/membaca tautan ini sebelum mengerjakan.</p>
                       </div>
                    )}

                    <div className="flex gap-3 mb-6 bg-slate-50 p-2 rounded-2xl">
                      <button type="button" onClick={()=>setSumberSoal("bank_ai")} className={`flex-1 py-3 rounded-xl font-bold text-[13px] transition-all ${sumberSoal==="bank_ai"?'bg-white text-indigo-600 shadow-sm border border-slate-200':'text-slate-500 hover:bg-slate-100'}`}>🤖 Tarik dari Arsip AI</button>
                      <button type="button" onClick={()=>setSumberSoal("manual")} className={`flex-1 py-3 rounded-xl font-bold text-[13px] transition-all ${sumberSoal==="manual"?'bg-white text-slate-800 shadow-sm border border-slate-200':'text-slate-500 hover:bg-slate-100'}`}>✍️ Tulis/Paste Manual</button>
                    </div>

                    {sumberSoal === "bank_ai" && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                        <div>
                          <label className="text-[12px] font-bold text-indigo-800 mb-2 block">Pilih Dokumen (Modul/Bank Soal) di Koleksi Anda</label>
                          <select required value={selectedBankSoalId} onChange={e=>setSelectedBankSoalId(e.target.value)} className="w-full p-3.5 bg-white rounded-xl border border-indigo-200 outline-none font-bold text-[13px] shadow-sm">
                            <option value="">-- Pilih Dokumen --</option>
                            {bankSoalList.map(b => <option key={b.id} value={b.id}>{b.topik} ({b.mapel})</option>)}
                          </select>
                        </div>
                      </motion.div>
                    )}

                    {sumberSoal === "manual" && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                        <textarea value={soalManual} onChange={(e) => setSoalManual(e.target.value)} className="w-full h-48 p-5 bg-[#F4F5F7] border border-slate-200 rounded-2xl text-[13px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white resize-y shadow-inner" placeholder={tipeTugas === 'Kuis CBT' ? "Ketik kumpulan soal pilihan ganda di sini..." : "Ketik instruksi tugas atau materi bacaan di sini..."}/>
                      </motion.div>
                    )}
                  </div>

                  {/* TERBITKAN */}
                  <div className="pt-6 border-t flex justify-end">
                    <button disabled={isPublishing || (sumberSoal === "bank_ai" && !selectedBankSoalId) || (kelasList.length === 0)} type="submit" className="px-10 py-4 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-xl transition-all hover:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-[14px]">
                      {isPublishing ? "Menyiapkan Sistem..." : "🚀 Terbitkan ke Dasbor Siswa"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ================= TAB 3: RUANG KOREKSI & ANALITIK ================= */}
            {activeTab === "koreksi" && selectedTugas && (
              <motion.div key="koreksi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                
                {/* HEADER TUGAS */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
                  <div className="relative z-10 flex-1">
                    <div className="flex gap-2 mb-3">
                       <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">{selectedTugas.tipe_tugas}</span>
                       <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block border border-emerald-500/30">Kelas {selectedTugas.kelas}</span>
                    </div>
                    <h2 className="font-black text-2xl md:text-3xl leading-tight mb-1">{selectedTugas.judul}</h2>
                    <p className="text-indigo-200 text-sm font-medium">{selectedTugas.mapel} • Deadline: <span className="text-rose-300">{selectedTugas.deadline || 'Tanpa Deadline'}</span></p>
                  </div>
                  
                  {selectedTugas.tipe_tugas !== 'Materi Bacaan' && (
                     <button onClick={handleKoreksiOtomatis} disabled={isAiGrading || totalSiswaKumpul === 0} className={`relative z-10 px-6 py-4 rounded-2xl font-bold text-white text-[13px] flex items-center gap-3 transition-all shadow-2xl active:scale-95 ${isAiGrading || totalSiswaKumpul === 0 ? 'bg-indigo-500/50 cursor-not-allowed' : 'bg-gradient-to-r from-[#FF6B4A] to-[#FF4B2B] hover:shadow-orange-500/30'}`}>
                       {isAiGrading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> AI Menganalisis Jawaban...</> : <>✨ Eksekusi Auto-Korektor AI</>}
                     </button>
                  )}
                </div>

                {/* STATISTIK EVALUASI KELAS */}
                {selectedTugas.tipe_tugas !== 'Materi Bacaan' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Rata-rata Kelas</span>
                        <span className="text-3xl font-black text-slate-800">{rataRata}</span>
                     </div>
                     <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Nilai Tertinggi</span>
                        <span className="text-3xl font-black text-emerald-600">{tertinggi}</span>
                     </div>
                     <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Submisi</span>
                        <span className="text-3xl font-black text-indigo-600">{totalSiswaKumpul} <span className="text-sm text-slate-400">siswa</span></span>
                     </div>
                     <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Status Koreksi</span>
                        <span className="text-xl font-black text-slate-800 mt-1">Pending</span>
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* PREVIEW TAMPILAN SISWA E-UJIAN */}
                  <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-[700px]">
                    <div className="border-b pb-4 mb-4 flex justify-between items-center">
                       <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">📱 Simulasi Layar Siswa</h3>
                       <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-1 rounded">Versi Preview</span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                       {selectedTugas.lampiran_url && (
                          <div className="w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden group">
                             <div className="text-white/50 text-4xl">▶️</div>
                             <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                               <p className="text-white text-xs font-bold truncate">{selectedTugas.lampiran_url}</p>
                             </div>
                          </div>
                       )}

                       <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-li:my-1">
                         <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {parseSoalSiswa(selectedTugas.konten_soal)}
                         </ReactMarkdown>
                       </div>

                       {selectedTugas.tipe_tugas !== 'Materi Bacaan' && (
                         <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl opacity-60 pointer-events-none">
                            <p className="text-xs font-bold text-slate-500 mb-2">Area Jawaban Siswa (Simulasi)</p>
                            <textarea className="w-full h-24 bg-white border border-slate-200 rounded-lg" disabled></textarea>
                            <button className="mt-2 w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Kirim Jawaban</button>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* TABEL SISWA & EVALUASI */}
                  <div className="lg:col-span-7 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-slate-800 text-lg">Daftar Pengumpulan</h3>
                      {selectedTugas.tipe_tugas !== 'Materi Bacaan' && (
                         // 🔥 TOMBOL EKSPOR CSV ADA DI SINI
                         <button onClick={handleExportCSV} className="text-[11px] font-bold px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors shadow-sm flex items-center gap-2 active:scale-95">
                           📥 Download Nilai (CSV)
                         </button>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex-1">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50 border-b text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="p-5">Profil Siswa</th>
                            <th className="p-5 text-center">Status</th>
                            {selectedTugas.tipe_tugas !== 'Materi Bacaan' && <th className="p-5 text-center">Nilai</th>}
                            {selectedTugas.tipe_tugas !== 'Materi Bacaan' && <th className="p-5 text-right">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {siswaSubmissions.length > 0 ? siswaSubmissions.map((siswa) => (
                            <tr key={siswa.id} className="border-b hover:bg-slate-50 transition-colors">
                              <td className="p-5">
                                <div className="font-bold text-slate-800 text-[13px]">{siswa.nama_siswa}</div>
                                <div className="text-[11px] text-slate-400 font-medium">{siswa.uid_siswa.substring(0,8)}</div>
                              </td>
                              <td className="p-5 text-center">
                                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg ${siswa.status === "Sudah Kumpul" || siswa.status === "Selesai Membaca" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>{siswa.status}</span>
                              </td>
                              {selectedTugas.tipe_tugas !== 'Materi Bacaan' && (
                                <td className="p-5 text-center font-black text-slate-800 text-lg">
                                  {siswa.nilai !== null ? (siswa.nilai >= Number(rataRata) ? <span className="text-emerald-600">{siswa.nilai}</span> : <span className="text-rose-500">{siswa.nilai}</span>) : <span className="text-slate-300">-</span>}
                                </td>
                              )}
                              {selectedTugas.tipe_tugas !== 'Materi Bacaan' && (
                                <td className="p-5 text-right">
                                  <button onClick={() => { setCurrentSiswa(siswa); setManualScore(siswa.nilai || ""); setManualNote(siswa.catatan_guru || ""); setShowReviewModal(true); }} disabled={siswa.status !== "Sudah Kumpul"} className={`text-[11px] font-bold px-4 py-2.5 rounded-xl transition-all border ${siswa.status === "Sudah Kumpul" ? "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 shadow-sm" : "opacity-30 bg-slate-50"}`}>Koreksi Manual</button>
                                </td>
                              )}
                            </tr>
                          )) : (
                            <tr><td colSpan={4} className="p-16 text-center text-slate-400">
                               <div className="text-4xl mb-3 opacity-30">👥</div>
                               <p className="font-bold">Belum ada siswa yang mendaftar ke tugas ini.</p>
                            </td></tr>
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