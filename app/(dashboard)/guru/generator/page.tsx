"use client";

export const maxDuration = 60;

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePerangkatAjar } from "@/lib/ai";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

// IMPORT MARKDOWN RENDERER
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function GeneratorPage() {
  const { user } = useAuth(); 

  // State Form Dasar
  const [sumber, setSumber] = useState("Kemendikbud Ristek"); 
  const [tipe, setTipe] = useState("Modul Ajar (PPM)");
  const [fase, setFase] = useState("");
  const [mapel, setMapel] = useState("");
  const [topik, setTopik] = useState("");

  // State Administrasi (Kop & TTD)
  const [namaSekolah, setNamaSekolah] = useState("");
  const [kotaSekolah, setKotaSekolah] = useState(""); 
  const [namaKepsek, setNamaKepsek] = useState("");
  const [nipKepsek, setNipKepsek] = useState("");
  const [namaGuru, setNamaGuru] = useState("");
  const [nipGuru, setNipGuru] = useState("");
  
  // State Dinamis (Custom Fields)
  const [metode, setMetode] = useState("");
  const [customMetode, setCustomMetode] = useState("");
  const [alokasiWaktu, setAlokasiWaktu] = useState("");
  const [tahunPelajaran, setTahunPelajaran] = useState("");
  const [semester, setSemester] = useState("Ganjil");
  const [jumlahPG, setJumlahPG] = useState("10");
  const [jumlahEsai, setJumlahEsai] = useState("5");
  const [jenisTugas, setJenisTugas] = useState("");
  
  // STATE BARU: MEMORI KESINAMBUNGAN
  const [dokumenTerakhir, setDokumenTerakhir] = useState(""); // Menyimpan hasil generate sebelumnya
  const [gunakanKonteks, setGunakanKonteks] = useState(true); // Toggle sinkronisasi
  
  // State UI
  const [isLoading, setIsLoading] = useState(false);
  const [hasil, setHasil] = useState("");
  const [isStreaming, setIsStreaming] = useState(false); 

  // Ref untuk menarget area dokumen yang akan di-PDF-kan
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Sesi Anda telah berakhir. Silakan login kembali.");
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setHasil(""); 
    let teksLengkap = ""; 

    try {
      // PENYUSUNAN PAYLOAD DINAMIS BERDASARKAN JENIS DOKUMEN
      let topikKirim = `Materi/Topik Utama: ${topik}\n\n**INSTRUKSI CUSTOM DARI GURU:**`;
      
      if (tipe === "Modul Ajar (PPM)" || tipe === "RPP") {
        if (metode !== "") {
          const pilihanMetode = metode === "Lainnya (Custom)" ? customMetode : metode;
          topikKirim += `\n- Strategi/Model Pengajaran: Wajib gunakan sintaks "${pilihanMetode}".`;
        }
        if (alokasiWaktu !== "") {
          topikKirim += `\n- Alokasi Waktu: ${alokasiWaktu}.`;
        }
      } 
      else if (tipe === "PROTA") {
        if (tahunPelajaran !== "") topikKirim += `\n- Tahun Pelajaran: ${tahunPelajaran}.`;
      }
      else if (tipe === "PROMES") {
        if (tahunPelajaran !== "") topikKirim += `\n- Tahun Pelajaran: ${tahunPelajaran}.`;
        if (semester !== "") topikKirim += `\n- Semester: ${semester}.`;
      }
      else if (tipe === "Bank Soal") {
        topikKirim += `\n- Ketentuan Soal: ABAIKAN aturan default, Anda WAJIB membuat tepat ${jumlahPG} soal Pilihan Ganda dan ${jumlahEsai} soal Esai.`;
      }
      else if (tipe === "Rubrik Penilaian") {
        if (jenisTugas !== "") topikKirim += `\n- Jenis Tugas yang Dinilai: ${jenisTugas} (Sesuaikan kriteria rubrik dengan jenis tugas ini).`;
      }

      // INJEKSI MEMORI KESINAMBUNGAN
      if (gunakanKonteks && dokumenTerakhir) {
        topikKirim += `\n\n===========================\n**PENTING - KONTEKS BERKESINAMBUNGAN:**\nAnda WAJIB membuat dokumen "${tipe}" ini agar selaras, nyambung, dan berkesinambungan dengan dokumen yang telah dibuat sebelumnya. Gunakan Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan materi yang SAMA PERSIS dengan dokumen di bawah ini agar menjadi satu kesatuan perangkat ajar yang utuh:\n\n[DOKUMEN SEBELUMNYA MULAI]\n${dokumenTerakhir}\n[DOKUMEN SEBELUMNYA SELESAI]`;
      }

      // Memanggil AI Backend
      const streamResult = await generatePerangkatAjar(tipe, fase, mapel, topikKirim, sumber);
      setIsLoading(false); 

      // Membaca Teks Streaming
      for await (const chunk of streamResult) {
        teksLengkap += chunk;
        setHasil(teksLengkap); 
      }

      setIsStreaming(false);
      setDokumenTerakhir(teksLengkap); // Menyimpan hasil ke memori untuk dokumen selanjutnya

      // Simpan Riwayat
      await addDoc(collection(db, "dokumen"), {
        id_user: user.uid,
        sumber: sumber,
        tipe: tipe,
        fase: fase,
        mapel: mapel,
        topik: topik,
        konten_ai: teksLengkap, 
        namaSekolah: namaSekolah,
        kotaSekolah: kotaSekolah,
        namaKepsek: namaKepsek,
        nipKepsek: nipKepsek,
        namaGuru: namaGuru,
        nipGuru: nipGuru,
        dibuat_pada: serverTimestamp(),
      });

      // Kurangi Kuota
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { sisa_kuota: increment(-1) });

    } catch (error) {
      console.error("Error Generate:", error);
      setIsStreaming(false);
      alert("Terjadi kesalahan. Pastikan API Key valid dan kuota Anda mencukupi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(hasil);
    alert("Teks berhasil disalin!");
  };

  // FUNGSI 1: UNDUH WORD (PERBAIKAN FONT ARIAL & TABEL)
  const handleDownloadWord = () => {
    if (!pdfRef.current) return;

    // Bersihkan HTML dari class yang mengganggu Word sebelum diekspor
    let cleanHTML = pdfRef.current.innerHTML;
    // Hapus class "markdown-body" yang sering memicu style aneh di Word
    cleanHTML = cleanHTML.replace(/class="markdown-body"/g, '');

    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Dokumen Perangkat Ajar</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          /* MARGIN & FONT DASAR */
          @page WordSection1 { size: 21cm 29.7cm; margin: 2.54cm; mso-page-orientation: portrait; }
          div.WordSection1 { page: WordSection1; }
          
          body, p, li, td, th, h1, h2, h3, h4, div { 
            font-family: Arial, sans-serif !important; 
            font-size: 12pt !important; 
            color: black !important;
            font-weight: normal;
          }
          
          h1, h2, h3, h4 { font-weight: bold !important; margin-top: 18pt; margin-bottom: 6pt; }
          p, ul, ol { margin-bottom: 12pt; line-height: 1.5; }

          /* PENGATURAN TABEL MATERI - Anti Tabel Ganda */
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15pt; 
            margin-bottom: 15pt; 
            mso-table-lspace: 0pt; 
            mso-table-rspace: 0pt; 
          }
          table, td, th { 
            border: 1pt solid black !important; 
          }
          td, th { 
            padding: 5pt 8pt; 
            vertical-align: top; 
            text-align: left; 
          }
          th { 
            background-color: #f1f5f9; 
            font-weight: bold !important; 
            text-align: center; 
          }

          /* PENGATURAN TABEL TANDA TANGAN - Khusus Tanpa Garis */
          .sig-table, .sig-table td, .sig-table th, .sig-table tr { 
            border: none !important; 
          }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          ${cleanHTML}
        </div>
      </body>
      </html>
    `;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${tipe}_${mapel}_${fase}.doc`.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  // FUNGSI 2: CETAK PDF HD (MENGGUNAKAN IFRAME ISOLATION AGAR BISA BERLEMBAR-LEMBAR)
  const handlePrintPDF = () => {
    const printContent = pdfRef.current?.innerHTML;
    if (!printContent) return;

    // Membuat dokumen virtual tersembunyi
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Menyuntikkan HTML dan CSS langsung ke dokumen virtual
    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>${topik || "Dokumen Perangkat Ajar"}</title>
          <style>
            @page { size: A4 portrait; margin: 2.54cm; }
            body { 
              font-family: Arial, sans-serif !important; 
              font-size: 12pt !important; 
              line-height: 1.5 !important; 
              color: #000; 
              margin: 0;
              padding: 0;
            }
            .markdown-body table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; margin-bottom: 1.5rem; }
            .markdown-body th, .markdown-body td { border: 1pt solid #000; padding: 8px 10px; text-align: left; vertical-align: top; }
            .markdown-body th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
            
            .markdown-body tr { page-break-inside: avoid; }
            .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { page-break-after: avoid; color: #000; margin-top: 1.5rem; margin-bottom: 0.5rem; }
            .markdown-body p, .markdown-body ul, .markdown-body ol { margin-bottom: 0.5rem; }
            
            .sig-table { width: 100%; border-collapse: collapse; margin-top: 2rem; page-break-inside: avoid; border: none !important; }
            .sig-table td, .sig-table th, .sig-table tr { border: none !important; padding: 4px; vertical-align: top; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    iframeDoc.close();

    // Tunggu sejenak agar iframe selesai me-render sebelum print dipanggil
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Hapus dokumen virtual setelah selesai agar memori tidak bocor
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  const isEvaluasi = tipe === "Bank Soal" || tipe === "Rubrik Penilaian";
  const labelTopik = isEvaluasi 
    ? "Bahan Evaluasi / Materi Ujian" 
    : (tipe === "Modul Ajar (PPM)" || tipe === "RPP") 
      ? "Topik Pembelajaran Utama" 
      : "Capaian / Lingkup Materi";

  const tanggalSekarang = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6 space-y-6">
      
      <motion.div variants={itemVariants} className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Ruang Racik</h1>
        <p className="text-[13px] md:text-sm text-slate-500 mt-1.5 md:mt-2 font-medium">Atur parameter di bawah ini, biarkan Sistem merancang perangkat ajar Anda.</p>
      </motion.div>

      <div className="flex flex-col gap-6 md:gap-8">
        
        <motion.div variants={itemVariants} className="w-full">
          <form onSubmit={handleGenerate} className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-5 md:gap-6">
            
            {/* IDENTITAS RESMI */}
            <div className="bg-slate-50/70 p-4 md:p-5 rounded-2xl border border-slate-200 mb-6">
              <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Identitas Resmi (Opsional - Muncul Saat Cetak PDF & Word)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <input type="text" value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} placeholder="Nama Sekolah (Contoh: MA Darul Ma'arif)" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[12px] md:text-[13px] outline-none focus:border-indigo-500 shadow-sm" />
                <input type="text" value={kotaSekolah} onChange={(e) => setKotaSekolah(e.target.value)} placeholder="Kota/Kabupaten (Contoh: Lamongan)" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[12px] md:text-[13px] outline-none focus:border-indigo-500 shadow-sm" />
                <input type="text" value={namaKepsek} onChange={(e) => setNamaKepsek(e.target.value)} placeholder="Nama Kepala Sekolah" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[12px] md:text-[13px] outline-none focus:border-indigo-500 shadow-sm" />
                <input type="text" value={nipKepsek} onChange={(e) => setNipKepsek(e.target.value)} placeholder="NIP Kepala Sekolah" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[12px] md:text-[13px] outline-none focus:border-indigo-500 shadow-sm" />
                <input type="text" value={namaGuru} onChange={(e) => setNamaGuru(e.target.value)} placeholder="Nama Anda (Guru Mapel)" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[12px] md:text-[13px] outline-none focus:border-indigo-500 shadow-sm" />
                <input type="text" value={nipGuru} onChange={(e) => setNipGuru(e.target.value)} placeholder="NIP Anda" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[12px] md:text-[13px] outline-none focus:border-indigo-500 shadow-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div>
                <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Sumber Referensi Dasar</label>
                <div className="relative">
                  <select value={sumber} onChange={(e) => setSumber(e.target.value)} className="w-full p-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-[13px] md:text-sm cursor-pointer font-medium text-slate-700 transition-all appearance-none shadow-sm">
                    <option value="Kemendikbud Ristek">Kemendikbud Ristek</option>
                    <option value="Kementerian Agama">Kementerian Agama</option>
                    <option value="Muatan Lokal (Dinas Pendidikan)">Muatan Lokal (Dinas Pendidikan)</option>
                    <option value="Pedoman Adiwiyata (KLHK)">Pedoman Adiwiyata (KLHK)</option>
                    <option value="Standar Industri / SKKNI (SMK)">Standar Industri / SKKNI (SMK)</option>
                    <option value="Pendidikan Inklusif (PMPK)">Pendidikan Inklusif (PMPK)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Fase / Kelas</label>
                <div className="relative">
                  <select required value={fase} onChange={(e) => setFase(e.target.value)} className="w-full p-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-[13px] md:text-sm cursor-pointer font-medium text-slate-700 transition-all appearance-none shadow-sm">
                    <option value="">Pilih Fase</option>
                    <option value="Fase A (Kelas 1-2 SD/MI)">Fase A (Kelas 1-2)</option>
                    <option value="Fase B (Kelas 3-4 SD/MI)">Fase B (Kelas 3-4)</option>
                    <option value="Fase C (Kelas 5-6 SD/MI)">Fase C (Kelas 5-6)</option>
                    <option value="Fase D (Kelas 7-9 SMP/MTs)">Fase D (Kelas 7-9)</option>
                    <option value="Fase E (Kelas 10 SMA/MA)">Fase E (Kelas 10)</option>
                    <option value="Fase F (Kelas 11-12 SMA/MA)">Fase F (Kelas 11-12)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2">Mata Pelajaran</label>
                <input required type="text" value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Contoh: Biologi" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-[13px] md:text-sm font-medium text-slate-700 transition-all shadow-sm" />
              </div>
            </div>

            <div className="h-px w-full bg-slate-100 hidden md:block my-1"></div>

            <div>
              <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2.5">Jenis Perangkat Ajar</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                {[
                  "Modul Ajar (PPM)", "RPP", "Analisis TP", "Alur TP (ATP)", 
                  "PROMES", "PROTA", "Bank Soal", "Rubrik Penilaian"
                ].map((item) => (
                  <button
                    key={item} type="button" onClick={() => setTipe(item)}
                    className={`py-3 px-2 text-[11px] xl:text-[12px] leading-tight text-center rounded-xl font-bold transition-all border shadow-sm active:scale-95 flex items-center justify-center ${
                      tipe === item 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-100' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden -mx-2 px-2 -mb-2 pb-2">
              <AnimatePresence mode="wait">
                
                {(tipe === "Modul Ajar (PPM)" || tipe === "RPP") && (
                  <motion.div key="modul" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-2">
                    <div className={`grid grid-cols-1 ${metode === "Lainnya (Custom)" ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100 transition-all`}>
                      <div>
                        <label className="block text-[12px] md:text-[13px] font-bold text-emerald-700 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          Strategi Pengajaran
                        </label>
                        <div className="relative">
                          <select value={metode} onChange={(e) => setMetode(e.target.value)} className="w-full p-3.5 pr-10 bg-white border border-emerald-200 text-emerald-800 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-[13px] md:text-sm cursor-pointer font-bold transition-all appearance-none shadow-sm">
                            <option value="">Bebaskan/Random</option>
                            <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                            <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                            <option value="Discovery Learning">Discovery Learning</option>
                            <option value="Inquiry Learning">Inquiry Learning</option>
                            <option value="Lainnya (Custom)">💡 Lainnya (Custom Ide Sendiri...)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-emerald-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                        </div>
                      </div>

                      {metode === "Lainnya (Custom)" && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                          <label className="block text-[12px] md:text-[13px] font-bold text-emerald-700 mb-2">Ketik Model Anda</label>
                          <input type="text" required value={customMetode} onChange={(e) => setCustomMetode(e.target.value)} placeholder="Misal: Role Playing..." className="w-full p-3.5 bg-white border border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-[13px] md:text-sm font-medium text-slate-700 transition-all shadow-sm" />
                        </motion.div>
                      )}

                      <div>
                        <label className="block text-[12px] md:text-[13px] font-bold text-emerald-700 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Alokasi Waktu
                        </label>
                        <input type="text" value={alokasiWaktu} onChange={(e) => setAlokasiWaktu(e.target.value)} placeholder="Misal: 2 JP x 45 Menit" className="w-full p-3.5 bg-white border border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-[13px] md:text-sm font-medium text-slate-700 transition-all shadow-sm" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {(tipe === "PROTA" || tipe === "PROMES") && (
                  <motion.div key="prota" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/30 p-4 rounded-2xl border border-amber-100">
                      <div>
                        <label className="block text-[12px] md:text-[13px] font-bold text-amber-700 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Tahun Pelajaran
                        </label>
                        <input type="text" value={tahunPelajaran} onChange={(e) => setTahunPelajaran(e.target.value)} placeholder="Misal: 2026/2027" className="w-full p-3.5 bg-white border border-amber-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-[13px] md:text-sm font-bold text-slate-700 transition-all shadow-sm" />
                      </div>
                      
                      {tipe === "PROMES" && (
                        <div>
                          <label className="block text-[12px] md:text-[13px] font-bold text-amber-700 mb-2">Semester</label>
                          <div className="relative">
                            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full p-3.5 pr-10 bg-white border border-amber-200 text-amber-800 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-[13px] md:text-sm cursor-pointer font-bold transition-all appearance-none shadow-sm">
                              <option value="Ganjil">Semester Ganjil</option>
                              <option value="Genap">Semester Genap</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-amber-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {tipe === "Bank Soal" && (
                  <motion.div key="soal" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-2">
                    <div className="grid grid-cols-2 gap-4 bg-rose-50/30 p-4 rounded-2xl border border-rose-100">
                      <div>
                        <label className="block text-[12px] md:text-[13px] font-bold text-rose-700 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                          Soal Pilihan Ganda
                        </label>
                        <input type="number" min="0" max="50" value={jumlahPG} onChange={(e) => setJumlahPG(e.target.value)} className="w-full p-3.5 bg-white border border-rose-200 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-[13px] md:text-sm font-bold text-slate-700 transition-all shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-[12px] md:text-[13px] font-bold text-rose-700 mb-2">Soal Esai (HOTS)</label>
                        <input type="number" min="0" max="20" value={jumlahEsai} onChange={(e) => setJumlahEsai(e.target.value)} className="w-full p-3.5 bg-white border border-rose-200 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-[13px] md:text-sm font-bold text-slate-700 transition-all shadow-sm" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {tipe === "Rubrik Penilaian" && (
                  <motion.div key="rubrik" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-2">
                    <div className="bg-purple-50/30 p-4 rounded-2xl border border-purple-100">
                      <label className="block text-[12px] md:text-[13px] font-bold text-purple-700 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Jenis Tugas yang Dinilai
                      </label>
                      <input type="text" value={jenisTugas} onChange={(e) => setJenisTugas(e.target.value)} placeholder="Contoh: Makalah, Presentasi Kelompok, Poster, Jurnal..." className="w-full p-3.5 bg-white border border-purple-200 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-[13px] md:text-sm font-medium text-slate-700 transition-all shadow-sm" />
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="flex flex-col pt-2">
              <label className="block text-[13px] md:text-sm font-bold text-slate-700 mb-2 flex justify-between items-center">
                {labelTopik}
              </label>
              <textarea 
                required value={topik} onChange={(e) => setTopik(e.target.value)} 
                placeholder={isEvaluasi ? "Materi Fotosintesis, buat soal HOTS..." : "Ketik ringkasan capaian atau materi yang ingin Anda ajarkan..."} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-[13px] md:text-sm resize-none min-h-[100px] md:min-h-[120px] font-medium text-slate-700 transition-all leading-relaxed shadow-sm mb-5" 
              />

              {/* FITUR MEMORI KESINAMBUNGAN (MUNCUL JIKA ADA DOKUMEN SEBELUMNYA) */}
              {dokumenTerakhir && (
                <label className="flex items-start gap-3 p-4 mb-5 bg-indigo-50/60 rounded-xl border border-indigo-200 cursor-pointer hover:bg-indigo-100/50 transition-all">
                  <input type="checkbox" checked={gunakanKonteks} onChange={(e) => setGunakanKonteks(e.target.checked)} className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500" />
                  <div>
                    <p className="text-[13px] md:text-sm font-bold text-indigo-800">Sinkronkan dengan Dokumen Sebelumnya</p>
                    <p className="text-[11px] md:text-[12px] text-indigo-600/90 mt-0.5 leading-relaxed">Cawang ini agar AI menggunakan materi dan Tujuan Pembelajaran dari dokumen yang baru saja Anda buat ke dalam dokumen baru ini.</p>
                  </div>
                </label>
              )}

              <button type="submit" disabled={isLoading || isStreaming} className={`w-full md:w-auto self-end px-8 py-3.5 md:py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-md text-[14px] md:text-[15px] ${isLoading || isStreaming ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'}`}>
                {isLoading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menganalisis...</>
                ) : isStreaming ? (
                  <><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay:"0.1s"}}></div><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay:"0.2s"}}></div></div> Sedang Menulis...</>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    Generate {isEvaluasi ? "Evaluasi" : "Perangkat Ajar"}
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full flex flex-col min-h-[500px] lg:h-[800px]">
          <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex-1 flex flex-col relative overflow-hidden">
            
            <div className="flex items-center justify-between px-5 md:px-8 py-4 md:py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base md:text-xl leading-tight">Dokumen Hasil</h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5">Siap disalin atau dicetak PDF/Word</p>
                </div>
              </div>
              
              {hasil && !isStreaming && (
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={handleCopyText} className="px-3 md:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] md:text-sm font-bold rounded-xl transition flex items-center gap-2 active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    <span className="hidden sm:inline">Salin Teks</span>
                  </button>
                  <button onClick={handleDownloadWord} className="px-3 md:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] md:text-sm font-bold rounded-xl transition flex items-center gap-2 active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="hidden sm:inline">Unduh Word</span>
                  </button>
                  <button onClick={handlePrintPDF} className="px-3 md:px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[12px] md:text-sm font-bold rounded-xl transition flex items-center gap-2 active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    <span className="hidden sm:inline">Cetak / PDF A4</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-white p-5 md:p-8">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-indigo-50 rounded-full"></div>
                      <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-2xl">🪄</div>
                    </div>
                    <p className="font-bold text-slate-600 text-sm md:text-base">Menganalisis Kurikulum</p>
                    <p className="text-[12px] md:text-sm mt-1">Sistem AI sedang meramu struktur yang tepat...</p>
                  </motion.div>
                ) : hasil ? (
                  <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-sm md:prose-base prose-indigo max-w-none text-slate-700 pb-10 px-2 md:px-6">
                    
                    {/* BUNGKUSAN UTAMA UNTUK DOKUMEN CETAK/WORD */}
                    <div ref={pdfRef} className="pdf-container relative">
                      <style>{`
                        /* Tampilan di web saja, tampilan PDF dan Word sudah diisolasi */
                        .pdf-container { 
                          font-family: Arial, sans-serif !important; 
                          font-size: 12pt !important; 
                          line-height: 1.5 !important; 
                          color: #000; 
                        }
                        .markdown-body table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; margin-bottom: 1.5rem; }
                        .markdown-body th, .markdown-body td { border: 1pt solid #000; padding: 8px 10px; text-align: left; vertical-align: top; }
                        .markdown-body th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
                        .markdown-body tr { page-break-inside: avoid; }
                        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { margin-top: 1.5rem; margin-bottom: 0.5rem; }
                        .markdown-body p, .markdown-body ul, .markdown-body ol { margin-bottom: 0.5rem; }
                      `}</style>

                      {/* === KOP SURAT (DENGAN INLINE CSS AGAR MASUK KE IFRAME) === */}
                      {namaSekolah && (
                        <div style={{ textAlign: 'center', borderBottom: '3px solid black', paddingBottom: '12px', marginBottom: '24px', pageBreakAfter: 'avoid' }}>
                          <h1 style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', color: 'black', margin: '0' }}>
                            {namaSekolah}
                          </h1>
                        </div>
                      )}

                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                          {hasil}
                        </ReactMarkdown>
                      </div>

                      {/* === TANDA TANGAN (DENGAN INLINE CSS AGAR MASUK KE IFRAME) === */}
                      {(namaGuru || namaKepsek) && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem', pageBreakInside: 'avoid', border: 'none' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '50%', border: 'none' }}></td>
                              <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>
                                {kotaSekolah || "Nama Kota"}, {tanggalSekarang}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={2} style={{ border: 'none', textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
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
                              <td style={{ border: 'none', height: '100px' }}></td>
                              <td style={{ border: 'none', height: '100px' }}></td>
                            </tr>
                            <tr>
                              <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>
                                <strong><u>{namaKepsek || "Nama Lengkap"}</u></strong><br/>
                                NIP. {nipKepsek || "000000000000000000"}
                              </td>
                              <td style={{ width: '50%', border: 'none', textAlign: 'center' }}>
                                <strong><u>{namaGuru || "Nama Lengkap"}</u></strong><br/>
                                NIP. {nipGuru || "000000000000000000"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}

                    </div>

                    {isStreaming && <span className="inline-block w-2 md:w-2.5 h-4 md:h-5 ml-1 bg-slate-400 animate-pulse align-middle"></span>}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center mb-5 md:mb-6 text-3xl md:text-4xl shadow-inner">📄</div>
                    <h3 className="font-bold text-slate-600 text-base md:text-lg">Kanvas Masih Kosong</h3>
                    <p className="text-[13px] md:text-sm max-w-[250px] md:max-w-xs mt-2">Pilih parameter di atas lalu tekan tombol Generate untuk memunculkan materi di sini.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}