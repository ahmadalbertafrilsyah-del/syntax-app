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

  // Helper untuk mengubah File menjadi Base64 string murni (tanpa header data:image/jpeg;base64,)
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <span className="text-4xl">📸</span> Vision AI
        </h1>
        <p className="text-slate-500 mt-2">Unggah foto halaman buku cetak atau catatan, biarkan AI membacanya dan menyulapnya menjadi soal-soal berkualitas.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: FORM & UPLOAD */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 space-y-6">
          <form onSubmit={handleGenerate} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-5">
            
            {/* AREA DROPZONE GAMBAR */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Unggah Foto Materi</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${
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
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-90" />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-3xl mb-2">📥</div>
                    <p className="text-sm font-bold text-slate-600">Klik untuk Pilih Foto</p>
                    <p className="text-xs text-slate-400 mt-1">Maksimal 4MB (JPG/PNG)</p>
                  </div>
                )}
                
                {imagePreview && (
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white font-bold text-sm bg-slate-900/80 px-4 py-2 rounded-lg">Ganti Foto</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Fase / Kelas</label>
              <select required value={fase} onChange={(e) => setFase(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer font-medium">
                <option value="">Pilih Fase (Kurmer)</option>
                <option value="Fase A (Kelas 1-2 SD/MI)">Fase A (Kelas 1-2 SD/MI)</option>
                <option value="Fase B (Kelas 3-4 SD/MI)">Fase B (Kelas 3-4 SD/MI)</option>
                <option value="Fase C (Kelas 5-6 SD/MI)">Fase C (Kelas 5-6 SD/MI)</option>
                <option value="Fase D (Kelas 7-9 SMP/MTs)">Fase D (Kelas 7-9 SMP/MTs)</option>
                <option value="Fase E (Kelas 10 SMA/MA)">Fase E (Kelas 10 SMA/MA)</option>
                <option value="Fase F (Kelas 11-12 SMA/MA)">Fase F (Kelas 11-12 SMA/MA)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mata Pelajaran</label>
              <input required type="text" value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Contoh: Biologi, Sejarah" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
            </div>

            <button type="submit" disabled={isLoading || isStreaming || !imageFile} className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 mt-2 ${isLoading || isStreaming || !imageFile ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}>
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Membaca Gambar...</>
              ) : isStreaming ? (
                <><div className="w-5 h-5 bg-white rounded-sm animate-pulse"></div> Sedang Mengetik...</>
              ) : (
                <>Ekstrak Jadi Soal ✨</>
              )}
            </button>
          </form>
        </motion.div>

        {/* KOLOM KANAN: PREVIEW HASIL */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 flex flex-col">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex-1 min-h-[600px] flex flex-col relative overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-xl">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Hasil Ekstraksi & Soal
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
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">👀</div>
                    </div>
                    <p className="animate-pulse font-medium text-lg mt-4">AI sedang menganalisis foto Anda...</p>
                  </motion.div>
                ) : hasil ? (
                  <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-indigo prose-sm md:prose-base lg:prose-lg max-w-none text-slate-700 px-2 pb-10">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{hasil}</ReactMarkdown>
                    {isStreaming && <span className="inline-block w-2.5 h-5 ml-1 bg-slate-400 animate-pulse -mb-1"></span>}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400 pt-32 pb-32 text-center px-4">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-5xl">🖼️</div>
                    <h3 className="font-bold text-slate-600 mb-2 text-xl">Kanvas Masih Kosong</h3>
                    <p className="text-base max-w-md">Unggah foto materi dari buku cetak/catatan, lalu AI akan menyusun soal evaluasi berdasarkan isi foto tersebut.</p>
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