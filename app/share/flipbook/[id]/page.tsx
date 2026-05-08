"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function FlipbookViewer() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Memuat Buku Digital...</div>;
  if (!data) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Dokumen Tidak Ditemukan (404)</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 p-4 md:p-8 flex justify-center items-start overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl p-8 md:p-12 my-8 prose prose-indigo max-w-none">
        <div className="text-center border-b-4 border-indigo-900 pb-4 mb-8">
            <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-1">{data.tipe} • {data.mapel} • {data.fase}</p>
            <h1 className="text-3xl md:text-4xl font-black text-indigo-950 mt-0">{data.namaSekolah || "DOKUMEN RESMI"}</h1>
        </div>
        
        <div className="markdown-body">
            <style>{`
                .markdown-body table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
                .markdown-body th, .markdown-body td { border: 1px solid #cbd5e1; padding: 12px; }
                .markdown-body th { background-color: #f8fafc; color: #1e293b; }
            `}</style>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {data.konten_ai}
            </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}