"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";

// IMPORT MARKDOWN RENDERER
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function DetailKoleksiPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          router.push("/guru/koleksi");
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
    if (confirm("Hapus dokumen ini dari arsip secara permanen?")) {
      await deleteDoc(doc(db, "dokumen", id as string));
      router.push("/guru/koleksi");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="font-medium animate-pulse">Membuka Dokumen...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 space-y-6">
      
      {/* Tombol Kembali & Aksi Cepat */}
      <div className="flex items-center justify-between">
        <Link href="/guru/koleksi">
          <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Kembali ke Koleksi
          </button>
        </Link>
        
        <div className="flex gap-2">
          <button 
            onClick={handleDelete}
            className="p-2.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-xl transition-all active:scale-95 shadow-sm"
            title="Hapus Permanen"
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
        
        {/* Dekorasi Latar Belakang */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none"></div>
      </motion.div>

      {/* KONTEN UTAMA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Toolbar Konten */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
            <h2 className="font-black text-slate-800 text-sm md:text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Pratinjau Materi
            </h2>
            <button 
              onClick={handleCopy}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-bold rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              Salin Teks
            </button>
        </div>

        {/* Render Markdown */}
        <div className="p-6 md:p-12">
            <div className="prose prose-sm md:prose-base prose-indigo max-w-none text-slate-700 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data?.konten_ai}
              </ReactMarkdown>
            </div>
        </div>

      </motion.div>

      {/* Footer / Info Tambahan */}
      <div className="text-center py-6">
          <p className="text-[10px] md:text-xs text-slate-400 font-medium">
            Dokumen ini di-generate menggunakan teknologi AI Syntax pada standar Kurikulum Merdeka.
          </p>
      </div>

    </div>
  );
}