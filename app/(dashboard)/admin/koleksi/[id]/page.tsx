"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// IMPORT MARKDOWN RENDERER
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function AdminDetailKoleksiPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "dokumen", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          alert("Dokumen tidak ditemukan!");
          router.push("/admin/koleksi"); // Kembali ke koleksi admin
        }
      } catch (error) {
        console.error("Gagal mengambil detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, router]);

  const handleCopy = () => {
    if (data?.konten_ai) {
      navigator.clipboard.writeText(data.konten_ai);
      alert("Konten berhasil disalin!");
    }
  };

  const handleDelete = async () => {
    if (confirm("Hapus dokumen ini dari arsip server secara permanen?")) {
      await deleteDoc(doc(db, "dokumen", id as string));
      router.push("/admin/koleksi");
    }
  };

  // 🔥 FUNGSI UNDUH WORD
  const handleDownloadWord = () => {
    if (!pdfRef.current) return;
    
    let printHtml = pdfRef.current.innerHTML;
    printHtml = printHtml.replace(/class="markdown-body"/g, '');
    
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${data?.topik || "Dokumen Perangkat Ajar"}</title>
        <style>
          @page WordSection1 { size: 21cm 29.7cm; margin: 2.54cm; }
          div.WordSection1 { page: WordSection1; }
          body, p, li, td, th, h1, h2, h3, h4, div { font-family: Arial, sans-serif !important; font-size: 11pt !important; color: black !important; font-weight: normal; }
          h1 { font-size: 16pt !important; font-weight: bold !important; margin-bottom: 12pt; text-align: center; }
          h2 { font-size: 14pt !important; font-weight: bold !important; margin-top: 18pt; margin-bottom: 6pt; }
          h3 { font-size: 12pt !important; font-weight: bold !important; margin-top: 12pt; }
          p, ul, ol { margin-bottom: 10pt; line-height: 1.5; }
          /* Fix khusus list di Word */
          li { margin-bottom: 4pt; } 
          table { width: 100%; border-collapse: collapse; margin-top: 15pt; margin-bottom: 15pt; border: 1pt solid black !important; }
          td, th { border: 1pt solid black !important; padding: 5pt 8pt; vertical-align: top; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold !important; }
          .sig-table, .sig-table td, .sig-table th, .sig-table tr { border: none !important; }
        </style>
      </head>
      <body><div class="WordSection1">${printHtml}</div></body></html>
    `;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header);
    const fileDownload = document.createElement("a"); 
    document.body.appendChild(fileDownload); 
    fileDownload.href = source; 
    fileDownload.download = `ADMIN_${data?.tipe}_${data?.mapel}.doc`.replace(/[^a-zA-Z0-9.\-_]/g, "_"); 
    fileDownload.click(); 
    document.body.removeChild(fileDownload);
  };

  // 🔥 FUNGSI CETAK PDF
  const handlePrintPDF = () => {
    const printContent = pdfRef.current?.innerHTML;
    if (!printContent) return;
    
    const iframe = document.createElement("iframe"); 
    iframe.style.display = "none"; 
    document.body.appendChild(iframe);
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(`
      <html>
      <head>
        <title>Cetak PDF - ${data?.topik}</title>
        <style>
          @page { size: A4 portrait; margin: 2.54cm; }
          body { font-family: Arial, sans-serif !important; font-size: 11pt !important; line-height: 1.5 !important; color: #000; }
          h1 { text-align: center; font-size: 16pt; margin-bottom: 2rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; margin-bottom: 1.5rem; border: 1pt solid #000; }
          th, td { border: 1pt solid #000; padding: 8px 10px; text-align: left; vertical-align: top; }
          th { background-color: #f1f5f9; font-weight: bold; }
          tr { page-break-inside: avoid; }
          h2, h3, h4 { page-break-after: avoid; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: bold; }
          ul, ol { margin-left: 20px; margin-bottom: 10px; }
          li { margin-bottom: 4px; }
          .sig-table, .sig-table td, .sig-table th, .sig-table tr { border: none !important; padding: 4px; vertical-align: top; }
        </style>
      </head>
      <body>${printContent}</body></html>
    `);
    iframe.contentWindow?.document.close();
    setTimeout(() => { 
      iframe.contentWindow?.focus(); 
      iframe.contentWindow?.print(); 
      setTimeout(() => document.body.removeChild(iframe), 1000); 
    }, 500);
  };

  const tanggalSekarang = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="font-medium animate-pulse">Mengakses Basis Data Server...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 space-y-6">
      
      {/* Tombol Kembali & Aksi Cepat */}
      <div className="flex items-center justify-between">
        <Link href="/admin/koleksi">
          <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Kembali ke Manajemen Koleksi
          </button>
        </Link>
        
        <div className="flex gap-2">
          <button 
            onClick={handleDelete}
            className="p-2.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
            title="Hapus Permanen dari Database"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* HEADER DOKUMEN */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
             <span className="bg-indigo-50 text-indigo-700 text-[10px] md:text-xs font-black px-3 py-1.5 rounded-full border border-indigo-100 uppercase tracking-wider">
               {data?.tipe}
             </span>
             <span className="text-slate-300">•</span>
             <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{data?.fase}</span>
          </div>
          
          <h1 className="text-xl md:text-3xl font-black text-slate-800 leading-tight">
            {data?.topik}
          </h1>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-lg">📚</span>
                <span className="text-xs md:text-sm font-bold text-slate-600">{data?.mapel}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-lg">🏛️</span>
                <span className="text-xs md:text-sm font-bold text-slate-600">{data?.sumber}</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-50 rounded-full blur-3xl pointer-events-none"></div>
      </motion.div>

      {/* KONTEN UTAMA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Toolbar Konten */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
            <h2 className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Arsip Dokumen Sistem
            </h2>
            
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleCopy} className="px-3 md:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] md:text-sm font-bold rounded-xl transition flex items-center gap-2 active:scale-95">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  <span className="hidden sm:inline">Salin</span>
                </button>
                <button onClick={handleDownloadWord} className="px-3 md:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] md:text-sm font-bold rounded-xl transition flex items-center gap-2 active:scale-95">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="hidden sm:inline">Word</span>
                </button>
                <button onClick={handlePrintPDF} className="px-3 md:px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[12px] md:text-sm font-bold rounded-xl transition flex items-center gap-2 active:scale-95">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span className="hidden sm:inline">Cetak / PDF</span>
                </button>
            </div>
        </div>

        {/* AREA RENDER DOKUMEN KHUSUS */}
        <div className="p-6 md:p-12">
            <div className="prose prose-sm md:prose-base prose-indigo max-w-none text-slate-700 leading-relaxed">
              
              <div ref={pdfRef} className="pdf-container relative">
                <style>{`
                  .pdf-container { font-family: Arial, sans-serif !important; font-size: 11pt !important; line-height: 1.6 !important; color: #1e293b; } 
                  .markdown-body table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; margin-bottom: 1.5rem; border-radius: 8px; overflow: hidden; } 
                  .markdown-body th, .markdown-body td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; vertical-align: top; } 
                  .markdown-body th { background-color: #f8fafc; font-weight: 800; text-align: center; color: #0f172a; } 
                  .markdown-body tr { page-break-inside: avoid; } 
                  .markdown-body h1 { font-size: 20px; font-weight: 900; text-align: center; margin-bottom: 2rem; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 1rem; } 
                  .markdown-body h2, .markdown-body h3, .markdown-body h4 { margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 800; color: #1e293b; } 
                  .markdown-body ul, .markdown-body ol { padding-left: 20px; margin-bottom: 1rem; }
                  .markdown-body li { margin-bottom: 4px; }
                  .sig-table, .sig-table td, .sig-table th, .sig-table tr { border: none !important; padding: 4px; vertical-align: top; }
                `}</style>

                {/* === KOP SURAT === */}
                {data?.namaSekolah && (
                  <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '12px', marginBottom: '24px', pageBreakAfter: 'avoid' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', color: 'black', margin: '0', letterSpacing: '1px' }}>
                      {data.namaSekolah}
                    </h1>
                  </div>
                )}

                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {data?.konten_ai}
                  </ReactMarkdown>
                </div>

                {/* === TANDA TANGAN === */}
                {(data?.namaGuru || data?.namaKepsek) && (
                  <table className="sig-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4rem', pageBreakInside: 'avoid', border: 'none' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '50%', border: 'none' }}></td>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>
                          {data?.kotaSekolah || "........................"}, {tanggalSekarang}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ border: 'none', textAlign: 'center', paddingTop: '10px', paddingBottom: '20px' }}>
                          Mengetahui,
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>
                          Kepala Sekolah
                        </td>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>
                          Guru Mata Pelajaran
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: 'none', height: '80px' }}></td>
                        <td style={{ border: 'none', height: '80px' }}></td>
                      </tr>
                      <tr>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>
                          <strong><u>{data?.namaKepsek || "..................................................."}</u></strong><br/>
                          NIP. {data?.nipKepsek || "........................"}
                        </td>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>
                          <strong><u>{data?.namaGuru || "..................................................."}</u></strong><br/>
                          NIP. {data?.nipGuru || "........................"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

              </div>
            </div>
        </div>

      </motion.div>

      <div className="text-center py-6">
          <p className="text-[10px] md:text-xs text-slate-400 font-medium">
            Arsip Server Pusat - Syntax App
          </p>
      </div>

    </div>
  );
}