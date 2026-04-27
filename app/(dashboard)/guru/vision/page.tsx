"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateSoalFromImageStream } from "@/lib/ai";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function VisionAIPage() {
  const { user } = useAuth();
  
  // State Form
  const [fase, setFase] = useState("");
  const [mapel, setMapel] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // State UI
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasil, setHasil] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fungsi Menangani Upload Gambar
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar. Maksimal 4MB.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper untuk mengubah File menjadi Base64 string murni
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Fungsi Generate Vision AI
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Silakan login kembali.");
    if (!imageFile) return alert("Harap unggah foto materi terlebih dahulu!");

    setIsLoading(true);
    setIsStreaming(true);
    setHasil("");
    let teksLengkap = "";

    try {
      // Ubah gambar ke format yang bisa dibaca Gemini
      const base64Data = await fileToBase64(imageFile);
      const mimeType = imageFile.type;

      // Panggil AI Streaming
      const streamResult = await generateSoalFromImageStream(base64Data, mimeType, fase, mapel);
      setIsLoading(false); 

      // Tangkap pancaran teks
      for await (const chunk of streamResult) {
        teksLengkap += chunk;
        setHasil(teksLengkap);
      }

      setIsStreaming(false);

      // Simpan ke Firebase
      await addDoc(collection(db, "dokumen"), {
        id_user: user.uid,
        tipe: "Vision AI (Foto -> Soal)",
        fase: fase,
        mapel: mapel,
        topik: "Ekstraksi Gambar",
        konten_ai: teksLengkap,
        dibuat_pada: serverTimestamp(),
      });

      // Kurangi Kuota
      await updateDoc(doc(db, "users", user.uid), {
        sisa_kuota: increment(-1)
      });

    } catch (error) {
      console.error(error);
      setIsStreaming(false);
      alert("Terjadi kesalahan. Pastikan API Key valid dan kuota mencukupi.");
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] mx-auto pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 space-y-6">
      
      {/* Header Halaman */}
      <motion.div variants={itemVariants} className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-3">
          Vision AI <span className="text-3xl md:text-4xl">📸</span>
        </h1>
        <p className="text-[13px] md:text-sm text-slate-500 mt-1.5 md:mt-2 font-medium max-w-3xl">Unggah foto buku cetak atau catatan. AI akan membaca teks di dalamnya dan menyulapnya menjadi materi atau soal evaluasi berkualitas.</p>
      </motion.div>

      {/* TATA LETAK ATAS-BAWAH (COLUMN) */}
      <div className="flex flex-col gap-6 md:gap-8">
        
        {/* BAGIAN ATAS: FORM & UPLOAD FULL WIDTH */}
        <motion.div variants={itemVariants} className="w-full">
          <form onSubmit={handleGenerate} className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-5 md:gap-6 relative overflow-visible">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-start">
                {/* AREA DROPZONE GAMBAR (4 Kolom di desktop) */}
                <div className="md:col-span-5 lg:col-span-4">
                  <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Unggah Foto Materi</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative shadow-inner ${
                      imagePreview ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400'
                    }`}
                  >
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleImageChange}
                    />
                    
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-95" />
                    ) : (
                      <div className="text-center p-4">
                        <div className="text-3xl mb-2">📥</div>
                        <p className="text-xs md:text-sm font-bold text-slate-600">Klik / Seret Foto</p>
                        <p className="text-[10px] md:text-xs text-slate-400 mt-1">Maksimal 4MB (JPG/PNG)</p>
                      </div>
                    )}
                    
                    {imagePreview && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <p className="text-white font-black text-xs md:text-sm bg-slate-900/80 px-4 py-2 rounded-lg">Ganti Foto</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AREA PARAMETER (8 Kolom di desktop) */}
                <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-5 relative overflow-visible">
                  {/* Safe Zone untuk Input agar border ring tidak terpotong (Masalah Overflow) */}
                  <div className="-mx-2 px-2 -mb-2 pb-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 pt-1">
                        <div>
                          <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Fase / Kelas</label>
                          <div className="relative">
                            <select required value={fase} onChange={(e) => setFase(e.target.value)} className="w-full p-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-[13px] md:text-sm cursor-pointer font-bold text-slate-600 transition-all appearance-none shadow-sm">
                                <option value="">Pilih Fase</option>
                                <option value="Fase A (Kelas 1-2 SD/MI)">Fase A (Kelas 1-2)</option>
                                <option value="Fase B (Kelas 3-4 SD/MI)">Fase B (Kelas 3-4)</option>
                                <option value="Fase C (Kelas 5-6 SD/MI)">Fase C (Kelas 5-6)</option>
                                <option value="Fase D (Kelas 7-9 SMP/MTs)">Fase D (Kelas 7-9)</option>
                                <option value="Fase E (Kelas 10 SMA/MA)">Fase E (Kelas 10)</option>
                                <option value="Fase F (Kelas 11-12 SMA/MA)">Fase F (Kelas 11-12)</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Mata Pelajaran</label>
                          <input required type="text" value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Contoh: Biologi, Sejarah" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-[13px] md:text-sm font-medium text-slate-700 transition-all shadow-sm" />
                        </div>
                    </div>
                  </div>

                  {/* TOMBOL SUBMIT */}
                  <button type="submit" disabled={isLoading || isStreaming || !imageFile} className={`w-full md:w-auto md:self-end px-8 py-3.5 md:py-4 mt-1 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md text-[14px] md:text-[15px] ${isLoading || isStreaming || !imageFile ? 'bg-indigo-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'}`}>
                    {isLoading ? (
                      <><div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Membaca Gambar...</>
                    ) : isStreaming ? (
                      <><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay:"0.1s"}}></div><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay:"0.2s"}}></div></div> Menulis Materi...</>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        Ekstrak Foto Jadi Materi
                      </>
                    )}
                  </button>
                </div>
            </div>
          </form>
        </motion.div>

        {/* KOLOM BAWAH: PREVIEW HASIL (FULL WIDTH) */}
        <motion.div variants={itemVariants} className="w-full flex flex-col min-h-[600px] lg:h-[800px]">
          <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex-1 flex flex-col relative overflow-hidden">
            
            <div className="flex items-center justify-between px-5 md:px-8 py-4 md:py-5 border-b border-slate-100 bg-slate-50/50sticky top-0 z-10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base md:text-xl leading-tight">Kanvas Materi Vision AI</h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5">Siap disalin dan dipindahkan ke Word</p>
                </div>
              </div>
              
              {hasil && !isStreaming && (
                <button onClick={() => navigator.clipboard.writeText(hasil)} className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[12px] md:text-sm font-bold rounded-xl transition flex items-center gap-2 active:scale-95">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  <span className="hidden sm:inline">Salin Teks</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-white p-5 md:p-8">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-slate-400 py-20 pb-40">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-indigo-50 rounded-full"></div>
                      <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-2xl">👀</div>
                    </div>
                    <p className="font-bold text-slate-600 text-sm md:text-base">Menganalisis Foto Materi...</p>
                    <p className="text-[12px] md:text-sm mt-1">AI sedang membaca poin-poin penting di foto Anda.</p>
                  </motion.div>
                ) : hasil ? (
                  <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sm md:prose-base prose-indigo max-w-none text-slate-700 pb-20 px-2 md:px-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{hasil}</ReactMarkdown>
                    {isStreaming && <span className="inline-block w-2.5 h-5 ml-1 bg-slate-400 animate-pulse -mb-1 align-middle"></span>}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20 pb-40 px-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center mb-6 text-5xl md:text-6xl shadow-inner">🖼️</div>
                    <h3 className="font-bold text-slate-600 text-base md:text-xl">Kanvas Masih Kosong</h3>
                    <p className="text-[13px] md:text-sm max-w-md mt-2">Unggah foto materi buku cetak atau catatan Anda, lalu AI akan menyusun ulang isinya atau membuat soal evaluasi berdasarkan foto tersebut.</p>
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