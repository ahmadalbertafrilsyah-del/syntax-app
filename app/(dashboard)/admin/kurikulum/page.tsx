"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// Standar Jenis Dokumen yang didukung aplikasi
const DEFAULT_TEMPLATES = [
  { id: "modul_ajar", nama: "Modul Ajar (PPM)", ikon: "📘", deskripsi: "Instruksi AI untuk menyusun Modul Ajar lengkap dengan informasi umum, komponen inti, dan lampiran." },
  { id: "rpp", nama: "RPP", ikon: "📝", deskripsi: "Instruksi AI untuk menyusun Rencana Pelaksanaan Pembelajaran ringkas 1 lembar." },
  { id: "alur_tp", nama: "Alur TP (ATP)", ikon: "🛤️", deskripsi: "Instruksi AI untuk menyusun Alur Tujuan Pembelajaran secara sistematis." },
  { id: "prota", nama: "PROTA", ikon: "📅", deskripsi: "Instruksi AI untuk menyusun Program Tahunan alokasi waktu." },
  { id: "promes", nama: "PROMES", ikon: "🗓️", deskripsi: "Instruksi AI untuk menyusun Program Semester secara mendetail." },
  { id: "bank_soal", nama: "Bank Soal", ikon: "🎯", deskripsi: "Instruksi AI untuk menyusun soal Pilihan Ganda dan Esai HOTS." },
  { id: "rubrik", nama: "Rubrik Penilaian", ikon: "⚖️", deskripsi: "Instruksi AI untuk menyusun kriteria dan tabel penilaian tugas." },
];

export default function AdminKurikulumPage() {
  const [templates, setTemplates] = useState<any[]>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(true);
  
  // State untuk Modal Edit Prompt
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [promptText, setPromptText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Mengambil konfigurasi dari Firestore (jika sudah pernah disimpan admin)
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "kurikulum_prompts"));
      
      // PERBAIKAN BUG TYPESCRIPT DI SINI: Menambahkan (d.data() as any)
      const savedData = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      
      // Gabungkan data default dengan data yang sudah disimpan di DB
      const mergedTemplates = DEFAULT_TEMPLATES.map(def => {
        const found = savedData.find(s => s.id === def.id);
        return found ? { ...def, prompt: found.prompt } : { ...def, prompt: "" };
      });
      
      setTemplates(mergedTemplates);
    } catch (error) {
      console.error("Gagal mengambil data kurikulum:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openEditModal = (item: any) => {
    setSelectedDoc(item);
    setPromptText(item.prompt || `Bertindaklah sebagai Ahli Kurikulum Merdeka. Buatlah ${item.nama} dengan struktur...`);
    setIsModalOpen(true);
  };

  const handleSavePrompt = async () => {
    if (!selectedDoc) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, "kurikulum_prompts", selectedDoc.id);
      await setDoc(docRef, {
        prompt: promptText,
        updated_at: serverTimestamp()
      }, { merge: true });
      
      alert(`Instruksi AI untuk ${selectedDoc.nama} berhasil diperbarui!`);
      setIsModalOpen(false);
      fetchTemplates(); // Refresh data
    } catch (error) {
      alert("Gagal menyimpan instruksi.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-slate-400">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-sm animate-pulse">Memuat Konfigurasi Kurikulum...</div>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] mx-auto space-y-6 pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 relative">
      
      {/* HEADER PAGE */}
      <motion.div variants={itemVariants} className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">📚</div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Manajemen Kurikulum</h1>
            <p className="text-[12px] md:text-sm text-slate-500 mt-1 font-medium">Atur instruksi dasar (Prompt AI) untuk setiap jenis perangkat ajar.</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          <span className="text-xs font-bold text-slate-600">Sistem Prompt Engine Aktif</span>
        </div>
      </motion.div>

      {/* GRID KARTU TEMPLATE */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
        {templates.map((item) => (
          <motion.div variants={itemVariants} key={item.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col h-full group relative overflow-hidden">
            {/* Dekorasi Background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl -mt-6 -mr-6 transition-transform group-hover:scale-150"></div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mb-4 border border-slate-100 shadow-inner group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                {item.ikon}
              </div>
              <h3 className="font-black text-lg text-slate-800 mb-2">{item.nama}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">
                {item.deskripsi}
              </p>
              
              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border ${
                  item.prompt ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  {item.prompt ? 'Terkonfigurasi' : 'Default AI'}
                </span>
                
                <button 
                  onClick={() => openEditModal(item)}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-indigo-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors shadow-sm border border-slate-200 hover:border-indigo-600"
                  title="Edit Instruksi AI"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* MODAL EDIT PROMPT (POPUP) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                    {selectedDoc?.ikon}
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800 text-lg">Konfigurasi Prompt AI</h2>
                    <p className="text-[11px] text-slate-500 font-bold">Template: {selectedDoc?.nama}</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6 overflow-y-auto flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  Instruksi Sistem (System Prompt)
                </label>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-700">Tips:</span> Tuliskan kerangka baku atau aturan format yang harus dipatuhi AI saat men-generate dokumen ini (misal: "Selalu gunakan tabel untuk penilaian", "Bagi menjadi 3 sesi: Pembuka, Inti, Penutup").
                </p>
                <textarea 
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ketik instruksi untuk AI di sini..."
                  className="w-full h-48 md:h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-medium text-slate-700 transition-all resize-none shadow-inner leading-relaxed"
                />
              </div>

              {/* Footer Modal */}
              <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors text-sm"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSavePrompt}
                  disabled={isSaving}
                  className={`px-8 py-2.5 rounded-xl font-bold text-white transition-all shadow-md flex items-center gap-2 text-sm ${
                    isSaving ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 hover:shadow-indigo-200'
                  }`}
                >
                  {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}