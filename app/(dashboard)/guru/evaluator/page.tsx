"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { evaluateEssayStream } from "@/lib/ai";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

// IMPORT MARKDOWN RENDERER
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function EvaluatorPage() {
  const { user } = useAuth();
  
  // State Form
  const [mapel, setMapel] = useState("");
  const [topik, setTopik] = useState("");
  const [kunciJawaban, setKunciJawaban] = useState("");
  const [jawabanSiswa, setJawabanSiswa] = useState("");
  
  // State UI
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasil, setHasil] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Silakan login kembali.");
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setHasil("");
    let teksLengkap = "";

    try {
      const streamResult = await evaluateEssayStream(mapel, topik, kunciJawaban, jawabanSiswa);
      setIsLoading(false); 

      for await (const chunk of streamResult) {
        teksLengkap += chunk;
        setHasil(teksLengkap);
      }

      setIsStreaming(false);

      await addDoc(collection(db, "dokumen"), {
        id_user: user.uid,
        tipe: "Koreksi Esai Siswa",
        fase: "Umum",
        mapel: mapel,
        topik: topik,
        konten_ai: teksLengkap,
        dibuat_pada: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        sisa_kuota: increment(-1)
      });

    } catch (error) {
      console.error(error);
      setIsStreaming(false);
      alert("Terjadi kesalahan saat mengevaluasi. Pastikan API Key valid dan kuota Anda mencukupi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(hasil);
    alert("Teks evaluasi berhasil disalin!");
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] mx-auto pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 space-y-6">
      
      {/* Header Halaman */}
      <motion.div variants={itemVariants} className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-2">
          Auto-Korektor AI <span className="text-3xl">💯</span>
        </h1>
        <p className="text-[13px] md:text-sm text-slate-500 mt-1.5 md:mt-2 font-medium max-w-3xl">
          Bandingkan jawaban esai siswa dengan kunci jawaban ideal Anda. AI akan memberikan skor objektif dan umpan balik yang membangun.
        </p>
      </motion.div>

      {/* TATA LETAK ATAS-BAWAH (FLEX COLUMN FULL WIDTH) */}
      <div className="flex flex-col gap-6 md:gap-8">
        
        {/* BAGIAN ATAS: FORMULIR KOREKSI */}
        <motion.div variants={itemVariants} className="w-full">
          <form onSubmit={handleGenerate} className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-5 md:gap-6">
            
            {/* BARIS 1: MAPEL & TOPIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Mata Pelajaran</label>
                <input required type="text" value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Contoh: Sejarah" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-[13px] md:text-sm font-medium text-slate-700 transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Topik / Materi</label>
                <input required type="text" value={topik} onChange={(e) => setTopik(e.target.value)} placeholder="Contoh: Peristiwa Rengasdengklok" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-[13px] md:text-sm font-medium text-slate-700 transition-all shadow-sm" />
              </div>
            </div>

            <div className="h-px w-full bg-slate-100 hidden md:block my-1"></div>

            {/* BARIS 2: KUNCI JAWABAN (GURU) */}
            <div>
              <label className="block text-[13px] md:text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Kunci Jawaban / Standar Penilaian
              </label>
              <textarea 
                required value={kunciJawaban} onChange={(e) => setKunciJawaban(e.target.value)} 
                placeholder="Masukkan jawaban ideal atau poin-poin penting yang harus ada dalam jawaban siswa..." 
                className="w-full p-4 bg-emerald-50/30 border border-emerald-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-[13px] md:text-sm resize-none min-h-[100px] md:min-h-[120px] font-medium text-slate-700 transition-all leading-relaxed shadow-sm" 
              />
            </div>

            {/* BARIS 3: JAWABAN SISWA */}
            <div>
              <label className="block text-[13px] md:text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Teks Jawaban Siswa
              </label>
              <textarea 
                required value={jawabanSiswa} onChange={(e) => setJawabanSiswa(e.target.value)} 
                placeholder="Tempel (Paste) teks esai siswa yang ingin dinilai di sini..." 
                className="w-full p-4 bg-blue-50/30 border border-blue-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-[13px] md:text-sm resize-none min-h-[140px] md:min-h-[160px] font-medium text-slate-700 transition-all leading-relaxed shadow-sm" 
              />
            </div>

            {/* TOMBOL SUBMIT */}
            <button type="submit" disabled={isLoading || isStreaming} className={`w-full md:w-auto self-end px-8 py-3.5 md:py-4 mt-2 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md text-[14px] md:text-[15px] ${isLoading || isStreaming ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'}`}>
              {isLoading ? (
                <><div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Membaca Esai...</>
              ) : isStreaming ? (
                <><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay:"0.1s"}}></div><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay:"0.2s"}}></div></div> Menghitung Nilai...</>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Koreksi & Beri Nilai
                </>
              )}
            </button>

          </form>
        </motion.div>

        {/* BAGIAN BAWAH: PREVIEW HASIL EVALUASI */}
        <motion.div variants={itemVariants} className="w-full flex flex-col min-h-[500px] lg:h-[800px]">
          <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex-1 flex flex-col relative overflow-hidden">
            
            <div className="flex items-center justify-between px-5 md:px-8 py-4 md:py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base md:text-xl leading-tight">Laporan Penilaian</h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5">Hasil analisis dan rekomendasi AI</p>
                </div>
              </div>
              
              {hasil && !isStreaming && (
                <button onClick={handleCopyText} className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[12px] md:text-sm font-bold rounded-xl transition flex items-center gap-2 active:scale-95">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  <span className="hidden sm:inline">Salin Teks</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-white p-5 md:p-8">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-indigo-50 rounded-full"></div>
                      <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-2xl">⚖️</div>
                    </div>
                    <p className="font-bold text-slate-600 text-sm md:text-base">Membaca Silang Jawaban</p>
                    <p className="text-[12px] md:text-sm mt-1">Sistem AI sedang mencari korelasi poin penting...</p>
                  </motion.div>
                ) : hasil ? (
                  <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sm md:prose-base prose-indigo max-w-none text-slate-700 pb-10 px-2 md:px-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {hasil}
                    </ReactMarkdown>
                    {isStreaming && <span className="inline-block w-2 md:w-2.5 h-4 md:h-5 ml-1 bg-slate-400 animate-pulse align-middle"></span>}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center mb-5 md:mb-6 text-3xl md:text-4xl shadow-inner">📝</div>
                    <h3 className="font-bold text-slate-600 text-base md:text-lg">Siap Mengoreksi</h3>
                    <p className="text-[13px] md:text-sm max-w-[280px] md:max-w-sm mt-2">Masukkan kunci jawaban Anda dan tempel teks jawaban siswa. AI akan menganalisisnya dalam hitungan detik.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}