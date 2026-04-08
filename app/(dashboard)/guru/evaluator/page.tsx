"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { evaluateEssayStream } from "@/lib/ai";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
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
    if (!user) return alert("Silakan login kembali.");

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
      alert("Terjadi kesalahan saat mengevaluasi. Pastikan API Key valid.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <span className="text-4xl">💯</span> Auto-Korektor Esai
        </h1>
        <p className="text-slate-500 mt-2">Bandingkan jawaban esai siswa dengan kunci jawaban ideal. AI akan memberikan skor objektif dan umpan balik yang membangun.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: FORM KOREKSI */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-5">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mata Pelajaran</label>
                <input required type="text" value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Contoh: Sejarah" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Topik/Materi</label>
                <input required type="text" value={topik} onChange={(e) => setTopik(e.target.value)} placeholder="Contoh: Perang Dunia 2" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
                <span>✅</span> Kunci Jawaban (Guru)
              </label>
              <textarea required value={kunciJawaban} onChange={(e) => setKunciJawaban(e.target.value)} placeholder="Masukkan jawaban ideal atau rubrik poin penting yang harus ada..." className="w-full p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none min-h-[120px]" />
            </div>

            <div>
              <label className="block text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                <span>✍️</span> Jawaban Siswa
              </label>
              <textarea required value={jawabanSiswa} onChange={(e) => setJawabanSiswa(e.target.value)} placeholder="Paste teks jawaban esai siswa di sini..." className="w-full p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none min-h-[160px]" />
            </div>

            <button type="submit" disabled={isLoading || isStreaming} className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 mt-2 ${isLoading || isStreaming ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}>
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menganalisis Jawaban...</>
              ) : isStreaming ? (
                <><div className="w-5 h-5 bg-white rounded-sm animate-pulse"></div> Sedang Menilai...</>
              ) : (
                <>Koreksi & Beri Nilai ✨</>
              )}
            </button>
          </form>
        </motion.div>

        {/* KOLOM KANAN: PREVIEW HASIL */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 flex flex-col">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex-1 min-h-[600px] flex flex-col relative overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-xl">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Hasil Penilaian AI
              </h2>
              {hasil && !isStreaming && (
                <button onClick={() => navigator.clipboard.writeText(hasil)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition">Salin Teks</button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 pt-32 pb-32">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                      <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">⚖️</div>
                    </div>
                    <p className="animate-pulse font-medium text-lg mt-4">Membaca dan membandingkan jawaban...</p>
                  </motion.div>
                ) : hasil ? (
                  <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-indigo prose-sm md:prose-base lg:prose-lg max-w-none text-slate-700 px-2 pb-10">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{hasil}</ReactMarkdown>
                    {isStreaming && <span className="inline-block w-2.5 h-5 ml-1 bg-slate-400 animate-pulse -mb-1"></span>}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400 pt-32 pb-32 text-center px-4">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-5xl">📝</div>
                    <h3 className="font-bold text-slate-600 mb-2 text-xl">Siap Mengoreksi</h3>
                    <p className="text-base max-w-sm">Masukkan kunci jawaban Anda dan tempel teks jawaban siswa. AI akan menganalisisnya dalam hitungan detik.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}