"use client";

export const maxDuration = 60;

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePerangkatAjar } from "@/lib/ai";
import { useAuth } from "@/lib/AuthContext";
import { saveDokumen, updateDokumenKonten } from "@/lib/actions";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function GeneratorPage() {
  const { user } = useAuth(); 

  const [sumber, setSumber] = useState("Kemendikbud Ristek"); 
  const [tipe, setTipe] = useState("Modul Ajar (PPM)");
  const [fase, setFase] = useState("");
  const [kelas, setKelas] = useState("");
  const [mapel, setMapel] = useState("");
  
  const [topik, setTopik] = useState("");
  const [topikPilihan, setTopikPilihan] = useState("");

  const [namaSekolah, setNamaSekolah] = useState("");
  const [kotaSekolah, setKotaSekolah] = useState(""); 
  const [namaKepsek, setNamaKepsek] = useState("");
  const [nipKepsek, setNipKepsek] = useState("");
  const [namaGuru, setNamaGuru] = useState("");
  const [nipGuru, setNipGuru] = useState("");
  
  const [bahanAjarUrl, setBahanAjarUrl] = useState("");

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

  const [mediaAjar, setMediaAjar] = useState("");
  const [customMediaAjar, setCustomMediaAjar] = useState("");

  const [jenisUjian, setJenisUjian] = useState("Asesmen Formatif");
  const [kesulitanSoal, setKesulitanSoal] = useState("Campuran HOTS dan LOTS");
  const [opsiPG, setOpsiPG] = useState("A - D (4 Opsi)");
  const [jmlPG, setJmlPG] = useState("5"); 
  const [jmlPGK, setJmlPGK] = useState("0");
  const [jmlMenjodohkan, setJmlMenjodohkan] = useState("0");
  const [jmlBenarSalah, setJmlBenarSalah] = useState("0");
  const [jmlIsian, setJmlIsian] = useState("0");
  const [jmlUraian, setJmlUraian] = useState("5"); 
  
  const [dokumenTerakhir, setDokumenTerakhir] = useState(""); 
  const [gunakanKonteks, setGunakanKonteks] = useState(true); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasil, setHasil] = useState("");
  const [isStreaming, setIsStreaming] = useState(false); 
  const [docId, setDocId] = useState(""); 

  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaResult, setMediaResult] = useState("");

  const pdfRef = useRef<HTMLDivElement>(null);

  const opsiKelas = {
    "Fase A (Kelas 1-2 SD/MI)": ["Kelas 1", "Kelas 2"],
    "Fase B (Kelas 3-4 SD/MI)": ["Kelas 3", "Kelas 4"],
    "Fase C (Kelas 5-6 SD/MI)": ["Kelas 5", "Kelas 6"],
    "Fase D (Kelas 7-9 SMP/MTs)": ["Kelas 7", "Kelas 8", "Kelas 9"],
    "Fase E (Kelas 10 SMA/MA)": ["Kelas 10"],
    "Fase F (Kelas 11-12 SMA/MA)": ["Kelas 11", "Kelas 12"],
  };

  const p5Kemendikbud = ["Semua Dimensi P5", "Beriman, Bertakwa & Berakhlak Mulia", "Berkebinekaan Global", "Bergotong Royong", "Mandiri", "Bernalar Kritis", "Kreatif"];
  const p5Kemenag = ["Semua Nilai P5 & PPRA", "Berkeadaban (Ta'addub)", "Keteladanan (Qudwah)", "Kewarganegaraan (Muwatana)", "Mengambil jalan tengah (Tawassut)", "Berimbang (Tawazun)", "Lurus dan tegas (I'tidal)", "Kesetaraan (Musawa)", "Musyawarah (Syura)", "Toleransi (Tasamuh)", "Dinamis dan inovatif (Tathawwur)"];
  
  const elemenKemendikbud = ["Pemahaman Konsep & Keterampilan Proses", "Menyimak, Membaca, Berbicara, Menulis", "Bilangan, Aljabar, Geometri, Data", "Pancasila, UUD 1945, Bhinneka Tunggal Ika", "Lainnya"];
  const elemenKemenag = ["Al-Qur'an Hadis", "Akidah", "Akhlak", "Fikih", "Sejarah Kebudayaan Islam (SKI)", "Bahasa Arab (Istima', Kalam, Qira'ah, Kitabah)"];
  
  const aspekKemendikbud = ["Komprehensif (Sikap, Pengetahuan, Keterampilan)", "Sikap (Observasi/Jurnal)", "Pengetahuan (Tes Tulis/Lisan)", "Keterampilan (Proyek/Produk/Praktik)"];
  const aspekKemenag = ["Komprehensif (Spiritual, Sosial, Kognitif, Psikomotorik)", "Sikap Spiritual (KI-1) & Sosial (KI-2)", "Pengetahuan (KI-3)", "Keterampilan (KI-4)"];

  const mediaModern = ["Canva Presentation", "Quizziz / Kahoot", "Video YouTube / TikTok Edukasi", "Wordwall / Educandy", "Padlet / Miro (Kolaborasi)", "Alat Peraga Fisik / Lingkungan Sekitar", "Lainnya (Custom)"];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && !isStreaming) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) { clearInterval(interval); return 90; }
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 800);
    } else if (isStreaming) {
      setLoadingProgress(100);
    }
    return () => clearInterval(interval);
  }, [isLoading, isStreaming]);

  useEffect(() => {
    const d = new Date();
    const curYear = d.getFullYear();
    const curMonth = d.getMonth() + 1;
    if (!tahunPelajaran) {
       setTahunPelajaran(curMonth >= 7 ? `${curYear}/${curYear+1}` : `${curYear-1}/${curYear}`);
    }
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("Sesi Anda telah berakhir."); return; }
    
    const finalTopik = topikPilihan && topik ? `${topikPilihan} - ${topik}` : topikPilihan || topik;
    if (!finalTopik) { alert("Pilih atau ketik topik pembelajaran!"); return; }

    setIsLoading(true); setIsStreaming(false); setHasil(""); setDocId("");
    let teksLengkap = ""; 

    try {
      let topikKirim = `[INSTRUKSI SISTEM]: Patuhi format standar nasional secara ketat. Jika ada kolom Institusi/Sekolah, gunakan "${namaSekolah || '[Nama Institusi]'}". Jika ada Tahun Penyusunan, gunakan "${new Date().getFullYear()}".\n\nTopik Utama: ${finalTopik}\n`;

      if (tipe === "Modul Ajar (PPM)" || tipe === "RPP") {
        if (bahanAjarUrl !== "") topikKirim += `- Bahan Ajar Eksternal: ${bahanAjarUrl}\n`;
        if (metode !== "") topikKirim += `- Strategi Pembelajaran: ${metode === "Lainnya (Custom)" ? customMetode : metode}\n`;
        if (alokasiWaktu !== "") topikKirim += `- Alokasi Waktu: ${alokasiWaktu}\n`;
        if (profilPelajar !== "") topikKirim += `- Fokus P5/PPRA: Wajib jabarkan penerapan nilai "${profilPelajar}" dalam skenario pembelajaran.\n`;
        
        const finalMedia = mediaAjar === "Lainnya (Custom)" ? customMediaAjar : mediaAjar;
        if (finalMedia) topikKirim += `- Media Ajar Spesifik: Gunakan dan integrasikan alat "${finalMedia}" di bagian kegiatan inti.\n`;

        topikKirim += `- Asesmen Formatif: Buatlah soal PG 5 butir dan Esai 5 butir. Tambahkan kalimat "Untuk membuat paket instrumen asesmen yang lebih komprehensif, silakan gunakan menu [Bank Soal] pada Syntax HDE." di bagian bawah rubrik asesmen.\n`;
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
        topikKirim += `\n[Konteks Dokumen Sebelumnya Agar Selaras]:\n${dokumenTerakhir.substring(0, 2500)}...`;
      }

      const streamResult = await generatePerangkatAjar(tipe, fase, kelas, mapel, topikKirim, sumber);
      setIsLoading(false); setIsStreaming(true);

      for await (const chunk of streamResult) {
        teksLengkap += chunk;
        setHasil(teksLengkap); 
      }

      setIsStreaming(false); setDokumenTerakhir(teksLengkap); 

      const payload = {
        id_user: user.uid, sumber, tipe, fase, mapel, topik: finalTopik, konten_ai: teksLengkap, 
        namaSekolah, kotaSekolah, namaKepsek, nipKepsek, namaGuru, nipGuru,
      };
      
      const newDocId = await saveDokumen(payload);
      setDocId(newDocId);

    } catch (error) {
      console.error(error); setIsStreaming(false); alert("Terjadi kesalahan atau Server Timeout.");
    } finally { setIsLoading(false); }
  };

  const handleLanjutkanTeks = async () => {
    const { continueGenerationStream } = await import("@/lib/ai");
    setIsStreaming(true);
    let teksTambahan = "";
    try {
      const stream = await continueGenerationStream(hasil);
      for await (const chunk of stream) {
        teksTambahan += chunk;
        setHasil(prev => prev + chunk);
      }
      
      const hasilAkhir = hasil + teksTambahan;
      setDokumenTerakhir(hasilAkhir);
      
      if (docId) { await updateDokumenKonten(docId, hasilAkhir); }

    } catch (e) {
      alert("Gagal menyambung teks. Pastikan koneksi stabil.");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleGenerateMedia = async () => {
    const { generateMediaAIStream } = await import("@/lib/ai");
    setMediaLoading(true); setMediaResult(""); let teks = "";
    try {
      const stream = await generateMediaAIStream(topik, mapel, fase);
      for await (const chunk of stream) { teks += chunk; setMediaResult(teks); }
    } catch (e) { alert("Gagal memuat media AI."); } finally { setMediaLoading(false); }
  };

  const handleCopyText = () => { navigator.clipboard.writeText(hasil); alert("Teks disalin!"); };
  const handleShareFlipbook = () => { if (docId) { window.open(`${window.location.origin}/share/flipbook/${docId}`, '_blank'); } };

  const handleDownloadWord = () => {
    if (!pdfRef.current) return;
    
    let printHtml = pdfRef.current.innerHTML;
    printHtml = printHtml.replace(/class="markdown-body"/g, '');
    
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Dokumen</title>
        <style>
          @page WordSection1 { size: 21cm 29.7cm; margin: 2.54cm; }
          div.WordSection1 { page: WordSection1; }
          body, p, li, td, th, h1, h2, h3, h4, div { font-family: Arial, sans-serif !important; font-size: 11pt !important; color: black !important; font-weight: normal; }
          h1 { font-size: 16pt !important; font-weight: bold !important; margin-bottom: 12pt; text-align: center; }
          h2 { font-size: 14pt !important; font-weight: bold !important; margin-top: 18pt; margin-bottom: 6pt; }
          h3 { font-size: 12pt !important; font-weight: bold !important; margin-top: 12pt; }
          p, ul, ol { margin-bottom: 10pt; line-height: 1.5; }
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
    fileDownload.download = `${tipe}_${mapel}.doc`.replace(/[^a-zA-Z0-9.\-_]/g, "_"); 
    fileDownload.click(); 
    document.body.removeChild(fileDownload);
  };

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
        <title>Cetak PDF</title>
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

  const isEvaluasi = tipe === "Bank Soal" || tipe === "Rubrik Penilaian";
  const tanggalSekarang = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 space-y-6">
      
      <AnimatePresence>
        {showMediaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-indigo-50/50">
                <h3 className="font-black text-indigo-900 flex items-center gap-2">✨ Ide Visual & Media AI</h3>
                <button onClick={() => setShowMediaModal(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-500 hover:text-rose-500 shadow-sm font-bold border border-slate-200">X</button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 prose prose-sm prose-indigo">
                {!mediaResult && !mediaLoading ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-4">🎬🖼️</div>
                    <h4 className="font-bold text-slate-700">Dapatkan Naskah Video & Prompt Gambar AI</h4>
                    <p className="text-slate-500 text-sm mb-6">AI akan membuat naskah video animasi 1 menit dan instruksi gambar (Midjourney/Dall-E) khusus untuk materi ini.</p>
                    <button onClick={handleGenerateMedia} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-colors">Generate Media AI Sekarang</button>
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{mediaResult}</ReactMarkdown>
                )}
                {mediaLoading && <div className="text-center mt-4"><span className="animate-pulse font-bold text-indigo-600">AI Sedang Merancang Visual...</span></div>}
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
          <form onSubmit={handleGenerate} className="bg-white p-5 md:p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-5 md:gap-6">
            
            <div className="bg-[#F4F5F7]/50 p-5 rounded-[24px] border border-slate-100 mb-2">
              <label className="block text-[13px] font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <span className="text-indigo-500 text-lg">🏫</span> Identitas Resmi (Diperlukan Untuk Export Dokumen)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} placeholder="Nama Madrasah / Sekolah" className="p-3.5 bg-white border border-slate-200 rounded-xl text-[13px] outline-none shadow-sm" />
                <input type="text" value={kotaSekolah} onChange={(e) => setKotaSekolah(e.target.value)} placeholder="Kota/Kabupaten" className="p-3.5 bg-white border border-slate-200 rounded-xl text-[13px] outline-none shadow-sm" />
                <input type="text" value={namaGuru} onChange={(e) => setNamaGuru(e.target.value)} placeholder="Nama Anda (Guru Mapel)" className="p-3.5 bg-white border border-slate-200 rounded-xl text-[13px] outline-none shadow-sm" />
                <input type="text" value={nipGuru} onChange={(e) => setNipGuru(e.target.value)} placeholder="NIP Anda" className="p-3.5 bg-white border border-slate-200 rounded-xl text-[13px] outline-none shadow-sm" />
                <input type="text" value={namaKepsek} onChange={(e) => setNamaKepsek(e.target.value)} placeholder="Nama Kepala Sekolah" className="p-3.5 bg-white border border-slate-200 rounded-xl text-[13px] outline-none shadow-sm" />
                <input type="text" value={nipKepsek} onChange={(e) => setNipKepsek(e.target.value)} placeholder="NIP Kepsek" className="p-3.5 bg-white border border-slate-200 rounded-xl text-[13px] outline-none shadow-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-[13px] font-bold mb-2 text-slate-700">Sumber Referensi Dasar</label>
                <select value={sumber} onChange={(e) => setSumber(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500">
                  <option value="Kementerian Agama">Kementerian Agama (KMA 1503 2025)</option>
                  <option value="Kemendikbud Ristek">Kemendikbud Ristek (Nasional)</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-2 text-slate-700">Fase</label>
                <select required value={fase} onChange={(e) => { setFase(e.target.value); setKelas(""); }} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500">
                  <option value="">Pilih Fase...</option>
                  <option value="Fase A (Kelas 1-2 SD/MI)">Fase A (Kelas 1-2)</option>
                  <option value="Fase B (Kelas 3-4 SD/MI)">Fase B (Kelas 3-4)</option>
                  <option value="Fase C (Kelas 5-6 SD/MI)">Fase C (Kelas 5-6)</option>
                  <option value="Fase D (Kelas 7-9 SMP/MTs)">Fase D (Kelas 7-9)</option>
                  <option value="Fase E (Kelas 10 SMA/MA)">Fase E (Kelas 10)</option>
                  <option value="Fase F (Kelas 11-12 SMA/MA)">Fase F (Kelas 11-12)</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-2 text-slate-700">Kelas</label>
                <select required value={kelas} onChange={(e) => setKelas(e.target.value)} disabled={!fase} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed">
                  <option value="">Pilih Kelas...</option>
                  {fase && opsiKelas[fase as keyof typeof opsiKelas]?.map((kls) => (
                    <option key={kls} value={kls}>{kls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-2 text-slate-700">Mata Pelajaran</label>
                <input required type="text" value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Misal: Biologi" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold mb-3 text-slate-700">Pilih Jenis Perangkat Ajar</label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {["Modul Ajar (PPM)", "RPP", "Analisis TP", "Alur TP (ATP)", "PROMES", "PROTA", "Bank Soal", "Rubrik Penilaian"].map((item) => (
                  <button key={item} type="button" onClick={() => setTipe(item)} className={`py-3.5 px-2 text-[11px] xl:text-[12px] text-center rounded-xl font-bold transition-all border ${tipe === item ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 hover:border-indigo-300'}`}>{item}</button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden -mx-2 px-2 -mb-2 pb-2">
              <AnimatePresence mode="wait">
                
                {(tipe === "Modul Ajar (PPM)" || tipe === "RPP") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 mt-4">
                      <div>
                        <label className="block text-[12px] font-bold text-emerald-800 mb-2">Strategi Pengajaran</label>
                        <select value={metode} onChange={(e) => setMetode(e.target.value)} className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-[12px] outline-none shadow-sm">
                          <option value="">Bebas/Random AI</option>
                          <option value="Problem Based Learning (PBL)">PBL</option>
                          <option value="Project Based Learning (PjBL)">PjBL</option>
                          <option value="Discovery Learning">Discovery Learning</option>
                          <option value="Lainnya (Custom)">Custom Model Sendiri</option>
                        </select>
                        {metode === "Lainnya (Custom)" && <input type="text" value={customMetode} onChange={(e) => setCustomMetode(e.target.value)} placeholder="Ketik model..." className="w-full mt-3 p-3 bg-white border border-emerald-200 rounded-xl text-[12px] outline-none shadow-sm" />}
                      </div>
                      
                      <div>
                        <label className="block text-[12px] font-bold text-emerald-800 mb-2">Rekomendasi Media Ajar</label>
                        <select value={mediaAjar} onChange={(e) => setMediaAjar(e.target.value)} className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-[12px] outline-none shadow-sm">
                          <option value="">Pilih Otomatis AI Sesuai Topik</option>
                          {mediaModern.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {mediaAjar === "Lainnya (Custom)" && <input type="text" value={customMediaAjar} onChange={(e) => setCustomMediaAjar(e.target.value)} placeholder="Misal: Flashcard Interaktif..." className="w-full mt-3 p-3 bg-white border border-emerald-200 rounded-xl text-[12px] outline-none shadow-sm" />}
                      </div>

                      <div>
                        <label className="block text-[12px] font-bold text-emerald-800 mb-2">Fokus Karakter (P5 / PPRA)</label>
                        <select value={profilPelajar} onChange={(e) => setProfilPelajar(e.target.value)} className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-[12px] outline-none shadow-sm">
                          <option value="">Pilih Fokus Utama...</option>
                          {(sumber === "Kementerian Agama" ? p5Kemenag : p5Kemendikbud).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[12px] font-bold text-emerald-800 mb-2">Alokasi Waktu Pembelajaran</label>
                        <input type="text" value={alokasiWaktu} onChange={(e) => setAlokasiWaktu(e.target.value)} placeholder="Misal: 2 JP x 45 Menit" className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-[12px] outline-none shadow-sm" />
                      </div>
                      <div className="md:col-span-1">
                         <label className="block text-[12px] font-bold text-emerald-800 mb-2">Lampirkan URL YouTube (Opsional)</label>
                         <input type="url" value={bahanAjarUrl} onChange={(e) => setBahanAjarUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-[12px] outline-none shadow-sm" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {(tipe === "Analisis TP" || tipe === "Alur TP (ATP)") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-sky-50/50 p-6 rounded-3xl border border-sky-100 mt-4">
                      <div>
                        <label className="block text-[12px] font-bold text-sky-800 mb-2">Elemen CP (Sesuai Kurikulum)</label>
                        <select value={elemenCP} onChange={(e) => setElemenCP(e.target.value)} className="w-full p-3 bg-white border border-sky-200 rounded-xl text-[12px] outline-none shadow-sm">
                          {(sumber === "Kementerian Agama" ? elemenKemenag : elemenKemendikbud).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      {tipe === "Alur TP (ATP)" && (
                        <div>
                          <label className="block text-[12px] font-bold text-sky-800 mb-2">Estimasi Total JP (Satu Fase/Kelas)</label>
                          <input type="text" value={totalJP} onChange={(e) => setTotalJP(e.target.value)} placeholder="Misal: 36 JP" className="w-full p-3 bg-white border border-sky-200 rounded-xl text-[12px] outline-none shadow-sm" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {(tipe === "PROTA" || tipe === "PROMES") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-amber-50/50 p-6 rounded-3xl border border-amber-100 mt-4">
                      <div>
                        <label className="block text-[12px] font-bold text-amber-800 mb-2">Tahun Pelajaran</label>
                        <input type="text" value={tahunPelajaran} onChange={(e) => setTahunPelajaran(e.target.value)} placeholder="Misal: 2026/2027" className="w-full p-3 bg-white border border-amber-200 rounded-xl text-[12px] outline-none shadow-sm" />
                      </div>
                      {tipe === "PROMES" && (
                        <div>
                          <label className="block text-[12px] font-bold text-amber-800 mb-2">Semester</label>
                          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full p-3 bg-white border border-amber-200 rounded-xl text-[12px] font-bold outline-none shadow-sm"><option value="Ganjil">Ganjil</option><option value="Genap">Genap</option></select>
                        </div>
                      )}
                      <div>
                        <label className="block text-[12px] font-bold text-amber-800 mb-2">Total Alokasi JP {tipe === "PROTA" ? "Setahun" : "Semester Ini"}</label>
                        <input type="text" value={totalJP} onChange={(e) => setTotalJP(e.target.value)} placeholder="Misal: 72 JP" className="w-full p-3 bg-white border border-amber-200 rounded-xl text-[12px] outline-none shadow-sm" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {tipe === "Rubrik Penilaian" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-purple-50/50 p-6 rounded-3xl border border-purple-100 mt-4">
                      <div>
                        <label className="block text-[12px] font-bold text-purple-800 mb-2">Bentuk Penugasan</label>
                        <input type="text" value={jenisTugas} onChange={(e) => setJenisTugas(e.target.value)} placeholder="Misal: Proyek Video / Praktik Sholat" className="w-full p-3 bg-white border border-purple-200 rounded-xl text-[12px] outline-none shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-purple-800 mb-2">Fokus Aspek Penilaian</label>
                        <select value={aspekPenilaian} onChange={(e) => setAspekPenilaian(e.target.value)} className="w-full p-3 bg-white border border-purple-200 rounded-xl text-[12px] outline-none shadow-sm">
                          <option value="">Pilih Fokus...</option>
                          {(sumber === "Kementerian Agama" ? aspekKemenag : aspekKemendikbud).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tipe === "Bank Soal" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 space-y-5 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-[12px] font-bold text-rose-800 mb-2">Jenis Ujian</label>
                          <select value={jenisUjian} onChange={(e) => setJenisUjian(e.target.value)} className="w-full p-3 bg-white border border-rose-200 rounded-xl text-[12px] font-bold text-slate-700 shadow-sm"><option value="Ujian Sekolah">Ujian Sekolah</option><option value="Sumatif Akhir Semester (SAS)">Sumatif Akhir Semester (SAS)</option><option value="Sumatif Tengah Semester (STS)">Sumatif Tengah Semester (STS)</option><option value="Sumatif Lingkup Materi">Sumatif Lingkup Materi</option><option value="Asesmen Formatif">Asesmen Formatif</option></select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-rose-800 mb-2">Tingkat Kesulitan</label>
                          <select value={kesulitanSoal} onChange={(e) => setKesulitanSoal(e.target.value)} className="w-full p-3 bg-white border border-rose-200 rounded-xl text-[12px] font-bold text-slate-700 shadow-sm"><option value="Campuran HOTS dan LOTS">Campuran HOTS & LOTS</option><option value="HOTS Murni">HOTS Murni</option><option value="LOTS Murni">LOTS Murni</option></select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-rose-800 mb-2">Opsi Pilihan Ganda</label>
                          <select value={opsiPG} onChange={(e) => setOpsiPG(e.target.value)} className="w-full p-3 bg-white border border-rose-200 rounded-xl text-[12px] font-bold text-slate-700 shadow-sm"><option value="A - C (3 Opsi)">A - C (3 Opsi)</option><option value="A - D (4 Opsi)">A - D (4 Opsi)</option><option value="A - E (5 Opsi)">A - E (5 Opsi)</option></select>
                        </div>
                      </div>
                      <div className="h-px bg-rose-200/60"></div>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <div><label className="block text-[11px] text-rose-700 font-bold mb-2">PG Biasa</label><input type="number" min="0" value={jmlPG} onChange={(e) => setJmlPG(e.target.value)} className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-center shadow-sm" /></div>
                        <div><label className="block text-[11px] text-rose-700 font-bold mb-2">PG Kompleks</label><input type="number" min="0" value={jmlPGK} onChange={(e) => setJmlPGK(e.target.value)} className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-center shadow-sm" /></div>
                        <div><label className="block text-[11px] text-rose-700 font-bold mb-2">Menjodohkan</label><input type="number" min="0" value={jmlMenjodohkan} onChange={(e) => setJmlMenjodohkan(e.target.value)} className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-center shadow-sm" /></div>
                        <div><label className="block text-[11px] text-rose-700 font-bold mb-2">Benar/Salah</label><input type="number" min="0" value={jmlBenarSalah} onChange={(e) => setJmlBenarSalah(e.target.value)} className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-center shadow-sm" /></div>
                        <div><label className="block text-[11px] text-rose-700 font-bold mb-2">Isian Singkat</label><input type="number" min="0" value={jmlIsian} onChange={(e) => setJmlIsian(e.target.value)} className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-center shadow-sm" /></div>
                        <div><label className="block text-[11px] text-rose-700 font-bold mb-2">Uraian/Esai</label><input type="number" min="0" value={jmlUraian} onChange={(e) => setJmlUraian(e.target.value)} className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-center shadow-sm" /></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col pt-4 border-t border-slate-100">
              <label className="block text-[13px] font-bold text-slate-700 mb-3">Topik / Capaian Pembelajaran Utama</label>
              
              <select value={topikPilihan} onChange={(e) => setTopikPilihan(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-[13px] mb-3 focus:bg-white focus:border-indigo-500 transition-colors">
                <option value="">-- Pilih Topik Rekomendasi (Atau Biarkan Kosong) --</option>
                {sumber === "Kemendikbud Ristek" ? (
                   <>
                     <option value="Menganalisis keterkaitan antara struktur dan fungsi sel">Biologi - Sel dan Fungsinya</option>
                     <option value="Memahami proses perumusan Pancasila sebagai dasar negara">PPKn - Perumusan Pancasila</option>
                     <option value="Menyelesaikan masalah yang berkaitan dengan sistem persamaan linear">Matematika - SPLDV</option>
                   </>
                ) : (
                   <>
                     <option value="Memahami sifat-sifat wajib, mustahil, dan jaiz bagi Allah SWT">Akidah - Sifat Allah</option>
                     <option value="Menganalisis sejarah masuknya Islam ke Nusantara">SKI - Islam Nusantara</option>
                     <option value="Mempraktikkan tata cara shalat jenazah dengan benar">Fikih - Pengurusan Jenazah</option>
                   </>
                )}
              </select>

              <textarea value={topik} onChange={(e) => setTopik(e.target.value)} placeholder="Atau ketik manual ringkasan materi/copy paste CP spesifik di sini..." className="w-full p-5 bg-[#F4F5F7] border border-slate-200 rounded-2xl outline-none text-[13px] min-h-[100px] mb-5 focus:bg-white focus:border-indigo-500 transition-colors" />

              {dokumenTerakhir && (
                <label className="flex items-start gap-3 p-5 mb-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="checkbox" checked={gunakanKonteks} onChange={(e) => setGunakanKonteks(e.target.checked)} className="mt-1 w-5 h-5 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500 cursor-pointer" />
                  <div>
                    <p className="text-[13px] font-black text-indigo-900">Sinkronkan dengan Dokumen Sebelumnya</p>
                    <p className="text-[12px] text-indigo-700/80 mt-1 leading-relaxed">Centang ini jika Anda ingin AI merajut benang merah dan menggunakan materi dari hasil generate terakhir Anda agar dokumen yang baru selaras (Misal: Setelah buat Modul Ajar, langsung buat Bank Soal dengan materi yang sama).</p>
                  </div>
                </label>
              )}

              <button type="submit" disabled={isLoading || isStreaming} className={`w-full md:w-auto self-end px-10 py-4 rounded-2xl font-black text-white transition-all shadow-xl text-[14px] ${isLoading || isStreaming ? 'bg-indigo-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-600 hover:scale-95'}`}>
                {isLoading ? "Menganalisis Kurikulum..." : isStreaming ? "✨ Sedang Menulis..." : `Mulai Generate ${isEvaluasi ? "Evaluasi" : "Perangkat Ajar"}`}
              </button>
            </div>
          </form>
        </div>

        <div className="w-full flex flex-col min-h-[500px] lg:h-[800px]">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm flex-1 flex flex-col relative overflow-hidden">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 bg-slate-50/50 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center font-black shadow-sm text-2xl">📖</div>
                <div>
                  <h2 className="font-black text-slate-800 text-lg md:text-xl">Dokumen Interaktif</h2>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Media siap ekspor</p>
                </div>
              </div>
              
              {hasil && !isStreaming && (
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={handleLanjutkanTeks} className="px-4 py-2.5 bg-amber-50 text-amber-700 text-[12px] font-bold rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-2">
                    ✍️ Terpotong? Lanjutkan
                  </button>
                  <button onClick={() => setShowMediaModal(true)} className="px-4 py-2.5 bg-indigo-50 text-indigo-700 text-[12px] font-bold rounded-xl flex items-center gap-2 border border-indigo-200 hover:bg-indigo-100 transition-colors">
                    ✨ Ide Media AI
                  </button>
                  <button onClick={handleShareFlipbook} className="px-4 py-2.5 bg-emerald-50 text-emerald-700 text-[12px] font-bold rounded-xl flex items-center gap-2 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                    📖 Jadikan Flipbook
                  </button>
                  <div className="h-6 w-px bg-slate-200 mx-1"></div>
                  <button onClick={handleCopyText} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold rounded-xl flex items-center gap-2 transition-colors">Salin</button>
                  <button onClick={handleDownloadWord} className="px-4 py-2.5 bg-[#F4F5F7] hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[12px] font-bold rounded-xl flex items-center gap-2 transition-colors">Word</button>
                  <button onClick={handlePrintPDF} className="px-4 py-2.5 bg-[#F4F5F7] hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-[12px] font-bold rounded-xl flex items-center gap-2 transition-colors">PDF</button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-white p-6 md:p-10">
              {isLoading && !isStreaming ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                   <div className="w-16 h-16 relative flex items-center justify-center mb-4">
                     <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                       <circle className="text-slate-100 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                       <circle className="text-indigo-600 stroke-current transition-all duration-700 ease-out" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * loadingProgress) / 100}></circle>
                     </svg>
                     <span className="absolute text-sm font-black text-indigo-600">{loadingProgress}%</span>
                   </div>
                   <p className="font-bold text-slate-600 text-sm">Menyelaraskan kurikulum & memproses data...</p>
                </div>
              ) : hasil ? (
                <div className="prose prose-sm md:prose-base prose-indigo max-w-none text-slate-700 pb-10">
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
                    
                    {namaSekolah && (
                      <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '12px', marginBottom: '24px', pageBreakAfter: 'avoid' }}>
                        <h1 style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', color: 'black', margin: '0', letterSpacing: '1px' }}>{namaSekolah}</h1>
                      </div>
                    )}

                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{hasil}</ReactMarkdown>
                    </div>

                    {(namaGuru || namaKepsek) && (
                      <table className="sig-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4rem', pageBreakInside: 'avoid', border: 'none' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '50%', border: 'none' }}></td>
                            <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>{kotaSekolah || "........................"}, {tanggalSekarang}</td>
                          </tr>
                          <tr><td colSpan={2} style={{ border: 'none', textAlign: 'center', paddingTop: '10px', paddingBottom: '20px' }}>Mengetahui,</td></tr>
                          <tr>
                            <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>Kepala Sekolah</td>
                            <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>Guru Mata Pelajaran</td>
                          </tr>
                          <tr><td style={{ border: 'none', height: '80px' }}></td><td style={{ border: 'none', height: '80px' }}></td></tr>
                          <tr>
                            <td style={{ width: '50%', border: 'none', textAlign: 'center' }}><strong><u>{namaKepsek || "..................................................."}</u></strong><br/>NIP. {nipKepsek || "........................"}</td>
                            <td style={{ width: '50%', border: 'none', textAlign: 'center' }}><strong><u>{namaGuru || "..................................................."}</u></strong><br/>NIP. {nipGuru || "........................"}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                  {isStreaming && <span className="inline-block w-2 md:w-2.5 h-4 md:h-5 ml-1 bg-indigo-500 animate-pulse align-middle mt-2 rounded-full"></span>}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20">
                  <div className="w-24 h-24 bg-[#F4F5F7] border border-slate-200 rounded-3xl flex items-center justify-center mb-6 text-5xl shadow-sm">🪄</div>
                  <h3 className="font-black text-slate-800 text-xl mb-2">Kanvas Masih Kosong</h3>
                  <p className="text-sm max-w-sm text-slate-500">Isi identitas di atas (diperlukan untuk Export), lalu tekan tombol Generate untuk mulai meracik perangkat ajar.</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
}