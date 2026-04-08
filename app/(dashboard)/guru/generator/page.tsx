"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePerangkatAjar } from "@/lib/ai";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

// IMPORT MARKDOWN RENDERER
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function GeneratorPage() {
  const { user } = useAuth(); // Mengambil data user yang sedang login

  // State Form
  const [sumber, setSumber] = useState("Kemendikbud Ristek"); // Kemendikbud atau Kemenag
  const [tipe, setTipe] = useState("Modul Ajar (PPM)");
  const [fase, setFase] = useState("");
  const [mapel, setMapel] = useState("");
  const [topik, setTopik] = useState("");
  
  // State UI
  const [isLoading, setIsLoading] = useState(false);
  const [hasil, setHasil] = useState("");
  const [isStreaming, setIsStreaming] = useState(false); // Penanda saat teks sedang mengetik

  // FUNGSI HANDLE GENERATE (SUDAH MENDUKUNG REAL-TIME STREAMING)
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Keamanan: Pastikan user sudah login sebelum memanggil AI
    if (!user) {
      alert("Sesi Anda telah berakhir. Silakan login kembali.");
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setHasil(""); // Kosongkan kanvas sebelum mulai
    let teksLengkap = ""; // Variabel sementara penyimpan teks utuh

    try {
      // 1. Memanggil Async Generator (Streaming AI)
      const streamResult = await generatePerangkatAjar(tipe, fase, mapel, topik, sumber);
      
      // Matikan loading muter-muter karena teks akan segera keluar!
      setIsLoading(false); 

      // 2. Loop penangkap teks (Mengeluarkan kata demi kata ke layar)
      for await (const chunk of streamResult) {
        teksLengkap += chunk;
        setHasil(teksLengkap); // Update layar secara real-time
      }

      // 3. Setelah streaming teks 100% SELESAI, simpan ke Firebase
      setIsStreaming(false);

      await addDoc(collection(db, "dokumen"), {
        id_user: user.uid,
        sumber: sumber,
        tipe: tipe,
        fase: fase,
        mapel: mapel,
        topik: topik,
        konten_ai: teksLengkap, // Menyimpan teks yang sudah utuh 100%
        dibuat_pada: serverTimestamp(),
      });

      // 4. Mengurangi Sisa Kuota Guru sebanyak 1 poin di Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        sisa_kuota: increment(-1)
      });

    } catch (error) {
      console.error("Error Generate:", error);
      setIsStreaming(false);
      alert("Terjadi kesalahan saat memproses materi. Pastikan API Key valid dan kuota Anda mencukupi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Copy Text
  const handleCopyText = () => {
    navigator.clipboard.writeText(hasil);
    alert("Teks berhasil disalin!");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* Header Halaman */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Ruang Racik AI ✨</h1>
        <p className="text-slate-500 mt-2">Pilih referensi dan parameter di bawah ini, biarkan AI merancang perangkat ajar Anda.</p>
      </motion.div>

      {/* TATA LETAK BARU: ATAS - FORM INPUT (LANDSCAPE) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full"
      >
        <form onSubmit={handleGenerate} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KIRI: Pengaturan Dasar */}
            <div className="space-y-5">
              {/* SUMBER KURIKULUM */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sumber Referensi Dasar</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Kemendikbud Ristek", "Kementerian Agama"].map((item) => (
                    <button
                      key={item} type="button"
                      onClick={() => setSumber(item)}
                      className={`py-2 px-2 text-xs text-center rounded-xl font-bold transition-all ${
                        sumber === item 
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200 shadow-sm' 
                          : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* FASE & KELAS */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Fase / Kelas</label>
                <select required value={fase} onChange={(e) => setFase(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer">
                  <option value="">Pilih Fase (Kurikulum Merdeka)</option>
                  <option value="Fase A (Kelas 1-2 SD/MI)">Fase A (Kelas 1-2 SD/MI)</option>
                  <option value="Fase B (Kelas 3-4 SD/MI)">Fase B (Kelas 3-4 SD/MI)</option>
                  <option value="Fase C (Kelas 5-6 SD/MI)">Fase C (Kelas 5-6 SD/MI)</option>
                  <option value="Fase D (Kelas 7-9 SMP/MTs)">Fase D (Kelas 7-9 SMP/MTs)</option>
                  <option value="Fase E (Kelas 10 SMA/MA)">Fase E (Kelas 10 SMA/MA)</option>
                  <option value="Fase F (Kelas 11-12 SMA/MA)">Fase F (Kelas 11-12 SMA/MA)</option>
                </select>
              </div>

              {/* MATA PELAJARAN */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mata Pelajaran</label>
                <input required type="text" value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Contoh: PAI, Matematika, IPA" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
            </div>

            {/* KANAN: Jenis Dokumen & Topik */}
            <div className="lg:col-span-2 space-y-5 flex flex-col">
              {/* JENIS PERANGKAT AJAR */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Perangkat Ajar</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    "Modul Ajar (PPM)", "RPP", 
                    "Analisis TP", "Alur TP (ATP)", 
                    "PROMES", "PROTA", 
                    "Bank Soal", "Rubrik Penilaian"
                  ].map((item) => (
                    <button
                      key={item} type="button"
                      onClick={() => setTipe(item)}
                      className={`py-2 px-2 text-xs text-center rounded-xl font-medium transition-all ${
                        tipe === item 
                          ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200 shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* TOPIK / MATERI */}
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-bold text-slate-700 mb-2">Topik / Materi Spesifik</label>
                <textarea 
                  required 
                  value={topik} 
                  onChange={(e) => setTopik(e.target.value)} 
                  placeholder="Contoh: Sejarah Masuknya Islam di Nusantara, atau Teorema Pythagoras" 
                  className="w-full flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none min-h-[120px]" 
                />
              </div>
            </div>

          </div>

          {/* TOMBOL SUBMIT */}
          <button type="submit" disabled={isLoading || isStreaming} className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 mt-2 ${isLoading || isStreaming ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}>
            {isLoading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menyambungkan AI...</>
            ) : isStreaming ? (
              <><div className="w-5 h-5 bg-white rounded-sm animate-pulse"></div> Sedang Mengetik...</>
            ) : (
              <>Generate Dokumen dengan AI ✨</>
            )}
          </button>
        </form>
      </motion.div>

      {/* TATA LETAK BARU: BAWAH - PREVIEW HASIL */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full flex flex-col"
      >
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex-1 min-h-[600px] flex flex-col relative overflow-hidden">
          
          {/* Header Preview */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-xl">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Dokumen Hasil
            </h2>
            {hasil && !isStreaming && (
              <div className="flex gap-2">
                <button onClick={handleCopyText} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition">Salin Seluruh Teks</button>
                <button className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-lg cursor-not-allowed opacity-60" title="Dokumen sudah otomatis tersimpan">Tersimpan di Koleksi ✓</button>
              </div>
            )}
          </div>

          {/* Area Konten Dinamis */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {isLoading ? (
                // Animasi Loading Awal
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 pt-32 pb-32">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">✨</div>
                  </div>
                  <p className="animate-pulse font-medium text-lg mt-4">Meracik kurikulum dengan AI...</p>
                </motion.div>
              ) : hasil ? (
                // Menampilkan Teks Streaming
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-indigo prose-sm md:prose-base lg:prose-lg max-w-none text-slate-700 px-2 relative pb-10">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {hasil}
                  </ReactMarkdown>
                  
                  {/* Kursor Kedip saat Streaming */}
                  {isStreaming && (
                    <span className="inline-block w-2.5 h-5 ml-1 bg-slate-400 animate-pulse -mb-1"></span>
                  )}
                </motion.div>
              ) : (
                // Keadaan Awal Kosong
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400 pt-32 pb-32 text-center px-4">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-5xl">📄</div>
                  <h3 className="font-bold text-slate-600 mb-2 text-xl">Kanvas Masih Kosong</h3>
                  <p className="text-base max-w-md">Silakan isi referensi dan parameter di atas, lalu klik tombol <b>Generate</b> untuk memulai pembuatan dokumen.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </motion.div>

    </div>
  );
}