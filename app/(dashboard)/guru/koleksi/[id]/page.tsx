"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";

export default function DetailDokumenPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // Mengambil ID dari URL

  const [dokumen, setDokumen] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Referensi untuk area yang akan dicetak/dijadikan PDF
  const printRef = useRef<HTMLDivElement>(null);

  // Fungsi untuk trigger PDF Download
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: dokumen ? `${dokumen.tipe} - ${dokumen.topik}` : "Dokumen Pembelajaran",
  });

  // Mengambil data spesifik 1 dokumen dari Firebase
  useEffect(() => {
    const fetchDokumen = async () => {
      if (!user || !id) return;

      try {
        const docRef = doc(db, "dokumen", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Pastikan dokumen ini memang milik user yang sedang login
          if (docSnap.data().id_user === user.uid) {
            setDokumen(docSnap.data());
          } else {
            alert("Akses ditolak. Ini bukan dokumen Anda.");
            router.push("/guru/koleksi");
          }
        } else {
          alert("Dokumen tidak ditemukan!");
          router.push("/guru/koleksi");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDokumen();
  }, [id, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse">Membuka brankas dokumen...</p>
      </div>
    );
  }

  if (!dokumen) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Tombol Kembali & Header Aksi */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm sticky top-20 z-10">
        <Link href="/guru/koleksi" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition font-medium text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali ke Koleksi
        </Link>

        <button 
          onClick={() => handlePrint()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download PDF / Print
        </button>
      </div>

      {/* KERTAS DOKUMEN UTAMA (Area yang akan di-print) */}
      <div className="bg-white rounded-t-none rounded-b-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Area Print Ref (Hanya bagian di dalam ini yang akan masuk ke PDF) */}
        <div ref={printRef} className="p-10 md:p-16 print:p-8 bg-white text-black print:text-black">
          
          {/* Kop Dokumen / Header Print */}
          <div className="border-b-2 border-slate-800 pb-6 mb-8 text-center">
            <h1 className="text-2xl font-extrabold uppercase tracking-widest">{dokumen.tipe}</h1>
            <p className="text-lg mt-1 font-semibold">{dokumen.mapel} - {dokumen.fase}</p>
          </div>

          {/* Isi Dokumen Markdown */}
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-indigo-600 print:prose-p:text-black print:prose-headings:text-black">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {dokumen.konten_ai}
            </ReactMarkdown>
          </div>
          
          {/* Footer Print (Watermark opsional) */}
          <div className="mt-20 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 hidden print:block">
            Dihasilkan secara otomatis oleh AI melalui Syntax App.
          </div>
        </div>

      </div>
    </div>
  );
}