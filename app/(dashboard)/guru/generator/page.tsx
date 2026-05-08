"use client";

export const maxDuration = 60;

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePerangkatAjar } from "@/lib/ai";
// import { generateMediaAIStream } from "@/lib/ai"; // Hapus komentar ini jika error pemanggilan import muncul
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function GeneratorPage() {
  const { user } = useAuth(); 

  const [sumber, setSumber] = useState("Kemendikbud Ristek"); 
  const [tipe, setTipe] = useState("Modul Ajar (PPM)");
  const [fase, setFase] = useState("");
  const [mapel, setMapel] = useState("");
  const [topik, setTopik] = useState("");

  const [namaSekolah, setNamaSekolah] = useState("");
  const [kotaSekolah, setKotaSekolah] = useState(""); 
  const [namaKepsek, setNamaKepsek] = useState("");
  const [nipKepsek, setNipKepsek] = useState("");
  const [namaGuru, setNamaGuru] = useState("");
  const [nipGuru, setNipGuru] = useState("");
  
  const [bahanAjarUrl, setBahanAjarUrl] = useState("");

  // === STATE DINAMIS ===
  const [metode, setMetode] = useState("");
  const [customMetode, setCustomMetode] = useState("");
  const [alokasiWaktu, setAlokasiWaktu] = useState("");
  const [profilPelajar, setProfilPelajar] = useState("");
  const [elemenCP, setElemenCP] = useState("");
  const [tahunPelajaran, setTahunPelajaran] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [totalJP, setTotalJP] = useState("");
  const [jenisTugas, setJenisTugas] = useState("");
  const [aspekPenilaian, setAspekPenilaian] = useState("");

  const [jenisUjian, setJenisUjian] = useState("Asesmen Formatif");
  const [kesulitanSoal, setKesulitanSoal] = useState("Campuran HOTS dan LOTS");
  const [opsiPG, setOpsiPG] = useState("A - D (4 Opsi)");
  const [jmlPG, setJmlPG] = useState("10");
  const [jmlPGK, setJmlPGK] = useState("0");
  const [jmlMenjodohkan, setJmlMenjodohkan] = useState("0");
  const [jmlBenarSalah, setJmlBenarSalah] = useState("0");
  const [jmlIsian, setJmlIsian] = useState("0");
  const [jmlUraian, setJmlUraian] = useState("5");
  
  const [dokumenTerakhir, setDokumenTerakhir] = useState(""); 
  const [gunakanKonteks, setGunakanKonteks] = useState(true); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasil, setHasil] = useState("");
  const [isStreaming, setIsStreaming] = useState(false); 
  const [docId, setDocId] = useState(""); 

  // Modal Media AI
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaResult, setMediaResult] = useState("");

  const pdfRef = useRef<HTMLDivElement>(null);

  // DATA DROPDOWN DINAMIS
  const p5Kemendikbud = ["Semua Dimensi P5", "Beriman, Bertakwa & Berakhlak Mulia", "Berkebinekaan Global", "Bergotong Royong", "Mandiri", "Bernalar Kritis", "Kreatif"];
  const p5Kemenag = ["Semua Nilai P5 & PPRA", "Berkeadaban (Ta'addub)", "Keteladanan (Qudwah)", "Kewarganegaraan (Muwatana)", "Mengambil jalan tengah (Tawassut)", "Berimbang (Tawazun)", "Lurus dan tegas (I'tidal)", "Kesetaraan (Musawa)", "Musyawarah (Syura)", "Toleransi (Tasamuh)", "Dinamis dan inovatif (Tathawwur)"];
  
  const elemenKemendikbud = ["Pemahaman Konsep & Keterampilan Proses", "Menyimak, Membaca, Berbicara, Menulis", "Bilangan, Aljabar, Geometri, Data", "Pancasila, UUD 1945, Bhinneka Tunggal Ika", "Lainnya"];
  const elemenKemenag = ["Al-Qur'an Hadis", "Akidah", "Akhlak", "Fikih", "Sejarah Kebudayaan Islam (SKI)", "Bahasa Arab (Istima', Kalam, Qira'ah, Kitabah)"];
  
  const aspekKemendikbud = ["Komprehensif (Sikap, Pengetahuan, Keterampilan)", "Sikap (Observasi/Jurnal)", "Pengetahuan (Tes Tulis/Lisan)", "Keterampilan (Proyek/Produk/Praktik)"];
  const aspekKemenag = ["Komprehensif (Spiritual, Sosial, Kognitif, Psikomotorik)", "Sikap Spiritual (KI-1) & Sosial (KI-2)", "Pengetahuan (KI-3)", "Keterampilan (KI-4)"];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("Sesi Anda telah berakhir."); return; }

    setIsLoading(true); setIsStreaming(true); setHasil(""); setDocId("");
    let teksLengkap = ""; 

    try {
      let topikKirim = `Topik: ${topik}\n`;

      if (tipe === "Modul Ajar (PPM)" || tipe === "RPP") {
        if (bahanAjarUrl !== "") topikKirim += `- Bahan Ajar Eksternal: ${bahanAjarUrl}\n`;
        if (metode !== "") topikKirim += `- Strategi: ${metode === "Lainnya (Custom)" ? customMetode : metode}\n`;
        if (alokasiWaktu !== "") topikKirim += `- Waktu: ${alokasiWaktu}\n`;
        if (profilPelajar !== "") topikKirim += `- Fokus Karakter: ${profilPelajar}\n`;
      } 
      else if (tipe === "Analisis TP" || tipe === "Alur TP (ATP)") {
        if (elemenCP !== "") topikKirim += `- Elemen: ${elemenCP}\n`;
        if (totalJP !== "") topikKirim += `- Total Waktu: ${totalJP} JP\n`;
      }
      else if (tipe === "PROTA" || tipe === "PROMES") {
        if (tahunPelajaran !== "") topikKirim += `- Tahun: ${tahunPelajaran}\n`;
        if (semester !== "") topikKirim += `- Semester: ${semester}\n`;
        if (totalJP !== "") topikKirim += `- Total Waktu: ${totalJP} JP\n`;
      }
      else if (tipe === "Rubrik Penilaian") {
        if (jenisTugas !== "") topikKirim += `- Penugasan: ${jenisTugas}\n`;
        if (aspekPenilaian !== "") topikKirim += `- Aspek Dinilai: ${aspekPenilaian}\n`;
      }
      else if (tipe === "Bank Soal") {
        topikKirim += `- Ujian: ${jenisUjian} | Kesulitan: ${kesulitanSoal} | Opsi: ${opsiPG}
- Jumlah: PG(${jmlPG}), PGK(${jmlPGK}), Jodoh(${jmlMenjodohkan}), B/S(${jmlBenarSalah}), Isian(${jmlIsian}), Esai(${jmlUraian})\n`;
      }

      if (gunakanKonteks && dokumenTerakhir) {
        topikKirim += `\n[Konteks Dokumen Sebelumnya]:\n${dokumenTerakhir.substring(0, 1500)}...`;
      }

      const streamResult = await generatePerangkatAjar(tipe, fase, mapel, topikKirim, sumber);
      setIsLoading(false); 

      for await (const chunk of streamResult) {
        teksLengkap += chunk;
        setHasil(teksLengkap); 
      }

      setIsStreaming(false); setDokumenTerakhir(teksLengkap); 

      const docRef = await addDoc(collection(db, "dokumen"), {
        id_user: user.uid, sumber, tipe, fase, mapel, topik, konten_ai: teksLengkap, 
        namaSekolah, kotaSekolah, namaKepsek, nipKepsek, namaGuru, nipGuru,
        dibuat_pada: serverTimestamp(),
      });
      setDocId(docRef.id);
      await updateDoc(doc(db, "users", user.uid), { sisa_kuota: increment(-1) });

    } catch (error) {
      console.error(error); setIsStreaming(false); alert("Terjadi kesalahan.");
    } finally { setIsLoading(false); }
  };

  const handleGenerateMedia = async () => {
    // Pastikan mengimpor generateMediaAIStream dari ai.ts
    const { generateMediaAIStream } = await import("@/lib/ai");
    setMediaLoading(true);
    setMediaResult("");
    let teks = "";
    try {
      const stream = await generateMediaAIStream(topik, mapel, fase);
      for await (const chunk of stream) {
        teks += chunk;
        setMediaResult(teks);
      }
    } catch (e) {
      alert("Gagal memuat media AI.");
    } finally {
      setMediaLoading(false);
    }
  };

  const handleCopyText = () => { navigator.clipboard.writeText(hasil); alert("Teks disalin!"); };

  const handleShareFlipbook = () => {
    if (docId) {
      const url = `${window.location.origin}/share/flipbook/${docId}`;
      window.open(url, '_blank');
    }
  };

  const handleDownloadWord = () => {
    if (!pdfRef.current) return;
    let cleanHTML = pdfRef.current.innerHTML.replace(/class="markdown-body"/g, '');
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Dokumen</title><style>@page WordSection1 { size: 21cm 29.7cm; margin: 2.54cm; } div.WordSection1 { page: WordSection1; } body, p, li, td, th, h1, h2, h3, h4, div { font-family: Arial, sans-serif !important; font-size: 12pt !important; color: black !important; font-weight: normal; } h1, h2, h3, h4 { font-weight: bold !important; margin-top: 18pt; margin-bottom: 6pt; } p, ul, ol { margin-bottom: 12pt; line-height: 1.5; } table { width: 100%; border-collapse: collapse; margin-top: 15pt; margin-bottom: 15pt; } table, td, th { border: 1pt solid black !important; } td, th { padding: 5pt 8pt; vertical-align: top; text-align: left; } th { background-color: #f1f5f9; font-weight: bold !important; text-align: center; } .sig-table, .sig-table td, .sig-table th, .sig-table tr { border: none !important; }</style></head><body><div class="WordSection1">${cleanHTML}</div></body></html>`;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header);
    const fileDownload = document.createElement("a"); document.body.appendChild(fileDownload); fileDownload.href = source; fileDownload.download = `${tipe}_${mapel}.doc`; fileDownload.click(); document.body.removeChild(fileDownload);
  };

  const handlePrintPDF = () => {
    const printContent = pdfRef.current?.innerHTML;
    if (!printContent) return;
    const iframe = document.createElement("iframe"); iframe.style.display = "none"; document.body.appendChild(iframe);
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(`<html><head><title>Cetak</title><style>@page { size: A4 portrait; margin: 2.54cm; } body { font-family: Arial, sans-serif !important; font-size: 12pt !important; line-height: 1.5 !important; color: #000; } table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; margin-bottom: 1.5rem; } th, td { border: 1pt solid #000; padding: 8px 10px; text-align: left; vertical-align: top; } th { background-color: #f1f5f9; font-weight: bold; text-align: center; } tr { page-break-inside: avoid; } h1, h2, h3, h4 { page-break-after: avoid; margin-top: 1.5rem; margin-bottom: 0.5rem; } .sig-table, .sig-table td, .sig-table th, .sig-table tr { border: none !important; padding: 4px; vertical-align: top; }</style></head><body>${printContent}</body></html>`);
    iframe.contentWindow?.document.close();
    setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 500);
  };

  const isEvaluasi = tipe === "Bank Soal" || tipe === "Rubrik Penilaian";
  const tanggalSekarang = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 space-y-6">
      
      {/* MODAL MEDIA AI */}
      <AnimatePresence>
        {showMediaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-5 border-b flex justify-between items-center bg-indigo-50/50">
                <h3 className="font-black text-indigo-900 flex items-center gap-2">✨ Ide Visual & Media AI</h3>
                <button onClick={() => setShowMediaModal(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-500 hover:text-rose-500 shadow-sm font-bold">X</button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 prose prose-sm prose-indigo">
                {!mediaResult && !mediaLoading ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-4">🎬🖼️</div>
                    <h4 className="font-bold text-slate-700">Dapatkan Naskah Video & Prompt Gambar AI</h4>
                    <p className="text-slate-500 text-sm mb-6">AI akan membuat naskah video animasi 1 menit dan instruksi gambar (Midjourney/Dall-E) khusus untuk materi ini.</p>
                    <button onClick={handleGenerateMedia} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg">Generate Media AI Sekarang</button>
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{mediaResult}</ReactMarkdown>
                )}
                {mediaLoading && <div className="text-center mt-4"><span className="animate-pulse font-bold text-indigo-600">AI Sedang Merancang Visual...</span></div>}
              </div>
              <div className="p-5 border-t bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
                <span>Cari Link Referensi Cepat:</span>
                <div className="flex gap-2">
                  <a href={`https://www.youtube.com/results?search_query=Materi Pembelajaran ${topik}`} target="_blank" className="px-3 py-1.5 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200">YouTube</a>
                  <a href={`https://www.google.com/search?tbm=isch&q=Ilustrasi Pembelajaran ${topik}`} target="_blank" className="px-3 py-1.5 bg-blue-100 text-blue-600 font-bold rounded-lg hover:bg-blue-200">Google Images</a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Ruang Racik HDE</h1>
        <p className="text-[13px] md:text-sm text-slate-500 mt-1.5 font-medium">Biarkan Sistem merancang perangkat ajar digital Anda.</p>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
        
        <div className="w-full">
          <form onSubmit={handleGenerate} className="bg-white p-5 md:p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-5 md:gap-6">
            
            {/* IDENTITAS */}
            <div className="bg-slate-50 p-4 rounded-2xl border mb-2">
              <label className="block text-[13px] font-bold text-slate-700 mb-3">Identitas Resmi (Opsional)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} placeholder="Nama Sekolah" className="p-3 border rounded-xl text-[12px] outline-none w-full" />
                <input type="text" value={kotaSekolah} onChange={(e) => setKotaSekolah(e.target.value)} placeholder="Kota/Kabupaten" className="p-3 border rounded-xl text-[12px] outline-none w-full" />
                <input type="text" value={namaGuru} onChange={(e) => setNamaGuru(e.target.value)} placeholder="Nama Anda (Guru Mapel)" className="p-3 border rounded-xl text-[12px] outline-none w-full" />
                <input type="text" value={nipGuru} onChange={(e) => setNipGuru(e.target.value)} placeholder="NIP Anda" className="p-3 border rounded-xl text-[12px] outline-none w-full" />
                <input type="text" value={namaKepsek} onChange={(e) => setNamaKepsek(e.target.value)} placeholder="Nama Kepala Sekolah" className="p-3 border rounded-xl text-[12px] outline-none w-full" />
                <input type="text" value={nipKepsek} onChange={(e) => setNipKepsek(e.target.value)} placeholder="NIP Kepsek" className="p-3 border rounded-xl text-[12px] outline-none w-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-bold mb-2">Sumber Referensi Dasar</label>
                <select value={sumber} onChange={(e) => setSumber(e.target.value)} className="w-full p-3.5 bg-slate-50 border rounded-xl text-[13px] font-medium outline-none">
                  <option value="Kemendikbud Ristek">Kemendikbud Ristek (Nasional)</option>
                  <option value="Kementerian Agama">Kementerian Agama (KMA 183)</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-2">Fase / Kelas</label>
                <select required value={fase} onChange={(e) => setFase(e.target.value)} className="w-full p-3.5 bg-slate-50 border rounded-xl text-[13px] font-medium outline-none">
                  <option value="">Pilih Fase</option>
                  <option value="Fase A (Kelas 1-2 SD/MI)">Fase A (Kelas 1-2)</option>
                  <option value="Fase B (Kelas 3-4 SD/MI)">Fase B (Kelas 3-4)</option>
                  <option value="Fase C (Kelas 5-6 SD/MI)">Fase C (Kelas 5-6)</option>
                  <option value="Fase D (Kelas 7-9 SMP/MTs)">Fase D (Kelas 7-9)</option>
                  <option value="Fase E (Kelas 10 SMA/MA)">Fase E (Kelas 10)</option>
                  <option value="Fase F (Kelas 11-12 SMA/MA)">Fase F (Kelas 11-12)</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-2">Mata Pelajaran</label>
                <input required type="text" value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Contoh: Fiqih / IPA" className="w-full p-3.5 bg-slate-50 border rounded-xl text-[13px] font-medium outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold mb-2">Jenis Perangkat Ajar</label>
              <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
                {["Modul Ajar (PPM)", "RPP", "Analisis TP", "Alur TP (ATP)", "PROMES", "PROTA", "Bank Soal", "Rubrik Penilaian"].map((item) => (
                  <button key={item} type="button" onClick={() => setTipe(item)} className={`py-3 px-2 text-[11px] text-center rounded-xl font-bold border ${tipe === item ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600'}`}>{item}</button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden -mx-2 px-2 -mb-2 pb-2">
              <AnimatePresence mode="wait">
                
                {/* 1. MODUL AJAR & RPP */}
                {(tipe === "Modul Ajar (PPM)" || tipe === "RPP") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100 mt-2">
                      <div>
                        <label className="block text-[12px] font-bold text-emerald-700 mb-2">Strategi Pengajaran</label>
                        <select value={metode} onChange={(e) => setMetode(e.target.value)} className="w-full p-2.5 border rounded-lg text-[12px] outline-none">
                          <option value="">Bebas/Random AI</option>
                          <option value="Problem Based Learning (PBL)">PBL</option>
                          <option value="Project Based Learning (PjBL)">PjBL</option>
                          <option value="Discovery Learning">Discovery Learning</option>
                          <option value="Lainnya (Custom)">Custom Model Sendiri</option>
                        </select>
                        {metode === "Lainnya (Custom)" && <input type="text" value={customMetode} onChange={(e) => setCustomMetode(e.target.value)} placeholder="Ketik model..." className="w-full mt-2 p-2 border rounded-lg text-[12px] outline-none" />}
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-emerald-700 mb-2">Alokasi Waktu</label>
                        <input type="text" value={alokasiWaktu} onChange={(e) => setAlokasiWaktu(e.target.value)} placeholder="Misal: 2 JP x 45 Menit" className="w-full p-2.5 border rounded-lg text-[12px] outline-none" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-emerald-700 mb-2">Fokus Karakter (P5 / PPRA)</label>
                        <select value={profilPelajar} onChange={(e) => setProfilPelajar(e.target.value)} className="w-full p-2.5 border rounded-lg text-[12px] outline-none">
                          <option value="">Pilih Fokus...</option>
                          {(sumber === "Kementerian Agama" ? p5Kemenag : p5Kemendikbud).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* INPUT BAHAN AJAR */}
                    <div className="mt-3">
                       <label className="block text-[12px] font-bold text-emerald-800 mb-2">Lampirkan URL Video/Bahan Ajar Utama</label>
                       <input type="url" value={bahanAjarUrl} onChange={(e) => setBahanAjarUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full p-3 border border-emerald-200 rounded-xl text-[12px] outline-none" />
                    </div>
                  </motion.div>
                )}

                {/* 2. ANALISIS TP & ATP */}
                {(tipe === "Analisis TP" || tipe === "Alur TP (ATP)") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-sky-50 p-4 rounded-xl border border-sky-100 mt-2">
                      <div>
                        <label className="block text-[12px] font-bold text-sky-700 mb-2">Elemen CP (Sesuai Kurikulum)</label>
                        <select value={elemenCP} onChange={(e) => setElemenCP(e.target.value)} className="w-full p-2.5 border rounded-lg text-[12px] outline-none">
                          {(sumber === "Kementerian Agama" ? elemenKemenag : elemenKemendikbud).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      {tipe === "Alur TP (ATP)" && (
                        <div>
                          <label className="block text-[12px] font-bold text-sky-700 mb-2">Estimasi Total JP (Satu Fase/Kelas)</label>
                          <input type="text" value={totalJP} onChange={(e) => setTotalJP(e.target.value)} placeholder="Misal: 36 JP" className="w-full p-2.5 border rounded-lg text-[12px] outline-none" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 3. PROTA & PROMES */}
                {(tipe === "PROTA" || tipe === "PROMES") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-amber-50 p-4 rounded-xl border border-amber-100 mt-2">
                      <div>
                        <label className="block text-[12px] font-bold text-amber-700 mb-2">Tahun Pelajaran</label>
                        <input type="text" value={tahunPelajaran} onChange={(e) => setTahunPelajaran(e.target.value)} placeholder="Misal: 2026/2027" className="w-full p-2.5 border rounded-lg text-[12px] outline-none" />
                      </div>
                      {tipe === "PROMES" && (
                        <div>
                          <label className="block text-[12px] font-bold text-amber-700 mb-2">Semester</label>
                          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full p-2.5 border rounded-lg text-[12px] font-bold outline-none"><option value="Ganjil">Ganjil</option><option value="Genap">Genap</option></select>
                        </div>
                      )}
                      <div>
                        <label className="block text-[12px] font-bold text-amber-700 mb-2">Total Alokasi JP {tipe === "PROTA" ? "Setahun" : "Semester Ini"}</label>
                        <input type="text" value={totalJP} onChange={(e) => setTotalJP(e.target.value)} placeholder="Misal: 72 JP" className="w-full p-2.5 border rounded-lg text-[12px] outline-none" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. RUBRIK PENILAIAN */}
                {tipe === "Rubrik Penilaian" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100 mt-2">
                      <div>
                        <label className="block text-[12px] font-bold text-purple-700 mb-2">Bentuk Penugasan</label>
                        <input type="text" value={jenisTugas} onChange={(e) => setJenisTugas(e.target.value)} placeholder="Misal: Proyek Video / Praktik Sholat" className="w-full p-2.5 border rounded-lg text-[12px] outline-none" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-purple-700 mb-2">Fokus Aspek Penilaian</label>
                        <select value={aspekPenilaian} onChange={(e) => setAspekPenilaian(e.target.value)} className="w-full p-2.5 border rounded-lg text-[12px] outline-none">
                          <option value="">Pilih Fokus...</option>
                          {(sumber === "Kementerian Agama" ? aspekKemenag : aspekKemendikbud).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 5. BANK SOAL */}
                {tipe === "Bank Soal" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="bg-rose-50 p-5 rounded-xl border border-rose-100 space-y-4 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[12px] font-bold text-rose-700 mb-2">Jenis Ujian</label>
                          <select value={jenisUjian} onChange={(e) => setJenisUjian(e.target.value)} className="w-full p-2.5 border rounded-lg text-[12px] font-bold text-slate-700 shadow-sm"><option value="Ujian Sekolah">Ujian Sekolah</option><option value="Sumatif Akhir Semester (SAS)">Sumatif Akhir Semester (SAS)</option><option value="Sumatif Tengah Semester (STS)">Sumatif Tengah Semester (STS)</option><option value="Sumatif Lingkup Materi">Sumatif Lingkup Materi</option><option value="Asesmen Formatif">Asesmen Formatif</option></select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-rose-700 mb-2">Tingkat Kesulitan</label>
                          <select value={kesulitanSoal} onChange={(e) => setKesulitanSoal(e.target.value)} className="w-full p-2.5 border rounded-lg text-[12px] font-bold text-slate-700 shadow-sm"><option value="Campuran HOTS dan LOTS">Campuran HOTS & LOTS</option><option value="HOTS Murni">HOTS Murni</option><option value="LOTS Murni">LOTS Murni</option></select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-rose-700 mb-2">Opsi Pilihan Ganda</label>
                          <select value={opsiPG} onChange={(e) => setOpsiPG(e.target.value)} className="w-full p-2.5 border rounded-lg text-[12px] font-bold text-slate-700 shadow-sm"><option value="A - C (3 Opsi)">A - C (3 Opsi)</option><option value="A - D (4 Opsi)">A - D (4 Opsi)</option><option value="A - E (5 Opsi)">A - E (5 Opsi)</option></select>
                        </div>
                      </div>
                      <div className="h-px bg-rose-200"></div>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <div><label className="block text-[11px] text-rose-600 font-bold mb-1">PG Biasa</label><input type="number" min="0" value={jmlPG} onChange={(e) => setJmlPG(e.target.value)} className="w-full p-2 border rounded-lg text-center" /></div>
                        <div><label className="block text-[11px] text-rose-600 font-bold mb-1">PG Kompleks</label><input type="number" min="0" value={jmlPGK} onChange={(e) => setJmlPGK(e.target.value)} className="w-full p-2 border rounded-lg text-center" /></div>
                        <div><label className="block text-[11px] text-rose-600 font-bold mb-1">Menjodohkan</label><input type="number" min="0" value={jmlMenjodohkan} onChange={(e) => setJmlMenjodohkan(e.target.value)} className="w-full p-2 border rounded-lg text-center" /></div>
                        <div><label className="block text-[11px] text-rose-600 font-bold mb-1">Benar/Salah</label><input type="number" min="0" value={jmlBenarSalah} onChange={(e) => setJmlBenarSalah(e.target.value)} className="w-full p-2 border rounded-lg text-center" /></div>
                        <div><label className="block text-[11px] text-rose-600 font-bold mb-1">Isian Singkat</label><input type="number" min="0" value={jmlIsian} onChange={(e) => setJmlIsian(e.target.value)} className="w-full p-2 border rounded-lg text-center" /></div>
                        <div><label className="block text-[11px] text-rose-600 font-bold mb-1">Uraian/Esai</label><input type="number" min="0" value={jmlUraian} onChange={(e) => setJmlUraian(e.target.value)} className="w-full p-2 border rounded-lg text-center" /></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col pt-2">
              <label className="block text-[13px] font-bold text-slate-700 mb-2">Topik / Capaian Pembelajaran</label>
              <textarea required value={topik} onChange={(e) => setTopik(e.target.value)} placeholder="Ketik ringkasan materi atau copy paste CP di sini..." className="w-full p-4 border rounded-xl outline-none text-[13px] min-h-[100px] mb-4" />

              <button type="submit" disabled={isLoading || isStreaming} className={`w-full md:w-auto self-end px-8 py-3.5 rounded-2xl font-bold text-white transition-all shadow-md text-[14px] ${isLoading || isStreaming ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {isLoading ? "Menganalisis..." : isStreaming ? "Sedang Menulis..." : `Generate ${isEvaluasi ? "Evaluasi" : "Perangkat Ajar"}`}
              </button>
            </div>
          </form>
        </div>

        <div className="w-full flex flex-col min-h-[500px] lg:h-[800px]">
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm flex-1 flex flex-col relative overflow-hidden">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 md:px-8 py-4 md:py-5 border-b border-slate-100 bg-slate-50/50 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">📖</div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base md:text-xl">Dokumen Interaktif</h2>
                </div>
              </div>
              
              {hasil && !isStreaming && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* TOMBOL IDE MEDIA AI BARU DITARUH DI SINI */}
                  <button onClick={() => setShowMediaModal(true)} className="px-3 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white text-[12px] font-bold rounded-xl flex items-center gap-1 shadow-md">
                    ✨ Ide Media AI
                  </button>

                  <button onClick={handleShareFlipbook} className="px-3 py-2 bg-emerald-500 text-white text-[12px] font-bold rounded-xl flex items-center gap-1 shadow-md">
                    📖 Jadikan Flipbook
                  </button>
                  <button onClick={handleCopyText} className="p-2 md:px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold rounded-xl flex items-center gap-1">Salin</button>
                  <button onClick={handleDownloadWord} className="p-2 md:px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-bold rounded-xl flex items-center gap-1">Word</button>
                  <button onClick={handlePrintPDF} className="p-2 md:px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[12px] font-bold rounded-xl flex items-center gap-1">PDF</button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-white p-5 md:p-8">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                   <p className="font-bold text-slate-600 text-sm">Menganalisis Kurikulum...</p>
                </div>
              ) : hasil ? (
                <div className="prose prose-sm md:prose-base prose-indigo max-w-none text-slate-700 pb-10">
                  <div ref={pdfRef} className="pdf-container relative">
                    <style>{`.pdf-container { font-family: Arial, sans-serif !important; font-size: 12pt !important; line-height: 1.5 !important; color: #000; } .markdown-body table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; margin-bottom: 1.5rem; } .markdown-body th, .markdown-body td { border: 1pt solid #000; padding: 8px 10px; text-align: left; vertical-align: top; } .markdown-body th { background-color: #f1f5f9; font-weight: bold; text-align: center; } .markdown-body tr { page-break-inside: avoid; } .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { margin-top: 1.5rem; margin-bottom: 0.5rem; } .markdown-body p, .markdown-body ul, .markdown-body ol { margin-bottom: 0.5rem; }`}</style>
                    
                    {namaSekolah && (
                      <div style={{ textAlign: 'center', borderBottom: '3px solid black', paddingBottom: '12px', marginBottom: '24px', pageBreakAfter: 'avoid' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', color: 'black', margin: '0' }}>{namaSekolah}</h1>
                      </div>
                    )}

                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{hasil}</ReactMarkdown>
                    </div>

                    {(namaGuru || namaKepsek) && (
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem', pageBreakInside: 'avoid', border: 'none' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '50%', border: 'none' }}></td>
                            <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>{kotaSekolah || "Nama Kota"}, {tanggalSekarang}</td>
                          </tr>
                          <tr><td colSpan={2} style={{ border: 'none', textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>Mengetahui,</td></tr>
                          <tr>
                            <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>Kepala Sekolah</td>
                            <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>Guru Mata Pelajaran</td>
                          </tr>
                          <tr><td style={{ border: 'none', height: '100px' }}></td><td style={{ border: 'none', height: '100px' }}></td></tr>
                          <tr>
                            <td style={{ width: '50%', border: 'none', textAlign: 'center' }}><strong><u>{namaKepsek || "Nama Lengkap"}</u></strong><br/>NIP. {nipKepsek || "-"}</td>
                            <td style={{ width: '50%', border: 'none', textAlign: 'center' }}><strong><u>{namaGuru || "Nama Lengkap"}</u></strong><br/>NIP. {nipGuru || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20">
                  <h3 className="font-bold text-slate-600 text-lg">Siap Meracik Perangkat Ajar</h3>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
}