"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { motion, AnimatePresence } from "framer-motion";

export default function FlipbookViewer() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const docRef = doc(db, "dokumen", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        }
      } catch (e) {
        console.error("Gagal memuat dokumen");
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const tanggalSekarang = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // === TAMPILAN LOADING ===
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-white rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
        <h2 className="text-xl font-black tracking-widest uppercase animate-pulse">Menyiapkan Dokumen</h2>
        <p className="text-sm text-slate-400 mt-2">Syntax Digital Library</p>
      </div>
    );
  }

  // === TAMPILAN ERROR 404 ===
  if (!data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-2xl font-black">Arsip Tidak Ditemukan</h2>
        <p className="text-slate-400 mt-2">Dokumen ini mungkin telah dihapus atau tautan tidak valid.</p>
      </div>
    );
  }

  // === TAMPILAN BUKU DIGITAL ===
  return (
    <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-slate-900 flex justify-center py-10 md:py-20 px-4 sm:px-8 overflow-x-hidden font-sans relative selection:bg-indigo-500 selection:text-white">
      
      {/* CSS KHUSUS PRINT */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .book-container { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; border: none !important; }
          @page { margin: 2cm; size: A4 portrait; }
        }
        
        /* Typography Styling Buku */
        .book-typography h1, .book-typography h2, .book-typography h3 { font-family: 'Georgia', serif; color: #0f172a; }
        .book-typography p, .book-typography li { font-family: 'Arial', sans-serif; color: #334155; line-height: 1.8; }
      `}</style>

      {/* BILAH ALAT MELAYANG (FLOATING TOOLBAR) */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl px-4 py-3 rounded-full shadow-2xl border border-slate-200 flex items-center gap-3 z-50 no-print"
      >
        <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-bold text-sm rounded-full transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          <span className="hidden sm:inline">{isCopied ? "Tautan Tersalin!" : "Bagikan Tautan"}</span>
        </button>
        <div className="w-px h-6 bg-slate-300"></div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-full shadow-lg transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          <span className="hidden sm:inline">Cetak / Simpan PDF</span>
        </button>
      </motion.div>

      {/* KERTAS BUKU (CANVAS) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
        className="book-container bg-white w-full max-w-[850px] rounded-r-3xl rounded-l-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative flex"
      >
        {/* Efek Jilid Buku di Sebelah Kiri */}
        <div className="w-8 md:w-12 bg-gradient-to-r from-slate-200 via-slate-100 to-white border-r border-slate-200 shrink-0 rounded-l-md flex flex-col justify-evenly py-10 items-center no-print relative overflow-hidden">
           <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-black/5 to-transparent"></div>
           {/* Lubang Jilid */}
           {[...Array(15)].map((_, i) => (
              <div key={i} className="w-3 h-1 bg-slate-300 rounded-full shadow-inner opacity-60"></div>
           ))}
        </div>

        {/* Konten Utama */}
        <div ref={printRef} className="flex-1 p-8 sm:p-12 md:p-16 lg:p-20 bg-white rounded-r-3xl overflow-hidden relative">
          
          {/* Watermark Logo (Background) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none no-print">
            <div className="text-[300px] font-black tracking-tighter">S</div>
          </div>

          {/* KOP SURAT / HEADER DOKUMEN */}
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-10 relative z-10">
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-black text-slate-500 tracking-widest uppercase mb-4 no-print">
                Arsip Digital Syntax
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-wide leading-tight mb-2">
                {data.namaSekolah || "DOKUMEN PENDIDIKAN RESMI"}
              </h1>
              <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
                {data.tipe} • {data.mapel} • {data.fase}
              </p>
          </div>
          
          {/* RENDER MARKDOWN */}
          <div className="markdown-body book-typography relative z-10">
              <style>{`
                  .markdown-body table { width: 100%; border-collapse: collapse; margin: 2rem 0; border: 1px solid #e2e8f0; }
                  .markdown-body th, .markdown-body td { border: 1px solid #e2e8f0; padding: 14px 16px; text-align: left; vertical-align: top; }
                  .markdown-body th { background-color: #f8fafc; color: #0f172a; font-weight: 800; font-family: 'Arial', sans-serif; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
                  .markdown-body h1 { font-size: 24px; font-weight: 900; text-align: center; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
                  .markdown-body h2 { font-size: 20px; font-weight: 800; margin-top: 32px; margin-bottom: 16px; }
                  .markdown-body h3 { font-size: 16px; font-weight: 800; margin-top: 24px; margin-bottom: 12px; }
                  .markdown-body strong { font-weight: 800; color: #0f172a; }
                  .markdown-body ul, .markdown-body ol { padding-left: 24px; margin-bottom: 16px; }
                  .markdown-body li { margin-bottom: 8px; }
              `}</style>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {data.konten_ai}
              </ReactMarkdown>
          </div>

          {/* TANDA TANGAN (Jika ada data) */}
          {(data.namaGuru || data.namaKepsek) && (
            <div className="mt-20 pt-10 relative z-10 page-break-inside-avoid">
              <div className="flex justify-end mb-8">
                <p className="font-serif text-slate-800">{data.kotaSekolah || "........................"}, {tanggalSekarang}</p>
              </div>
              <div className="flex justify-between items-end text-center font-serif text-slate-800">
                <div className="w-[45%]">
                  <p className="mb-24">Mengetahui,<br/>Kepala Sekolah</p>
                  <p className="font-bold underline">{data.namaKepsek || "..................................................."}</p>
                  <p>NIP. {data.nipKepsek || "........................"}</p>
                </div>
                <div className="w-[45%]">
                  <p className="mb-24"><br/>Guru Mata Pelajaran</p>
                  <p className="font-bold underline">{data.namaGuru || "..................................................."}</p>
                  <p>NIP. {data.nipGuru || "........................"}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}