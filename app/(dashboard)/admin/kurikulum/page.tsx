"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AdminKurikulum() {
  const [fase, setFase] = useState("");
  const [mapel, setMapel] = useState("");
  const [isi, setIsi] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addDoc(collection(db, "kurikulum"), {
        fase,
        mapel,
        konten: isi,
        dibuat_pada: serverTimestamp(),
      });
      alert("Data Kurikulum Berhasil Disimpan!");
      setFase(""); setMapel(""); setIsi("");
    } catch (error) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-slate-800">Database Kurikulum 📚</h1>
      <form onSubmit={handleUpload} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input 
            required placeholder="Fase (Contoh: Fase D)" 
            value={fase} onChange={(e) => setFase(e.target.value)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          />
          <input 
            required placeholder="Mata Pelajaran" 
            value={mapel} onChange={(e) => setMapel(e.target.value)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          />
        </div>
        <textarea 
          required placeholder="Tempelkan standar Capaian Pembelajaran (CP) di sini..." 
          value={isi} onChange={(e) => setIsi(e.target.value)}
          rows={10}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
        />
        <button 
          disabled={isLoading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition"
        >
          {isLoading ? "Menyimpan..." : "Simpan ke Database Pusat"}
        </button>
      </form>
    </div>
  );
}