"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function RuangUjianCBT() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ujianId = params.id as string;

  const [siswaData, setSiswaData] = useState<any>(null);
  const [ruangUjian, setRuangUjian] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lembar Jawaban & Timer
  const [jawabanSiswa, setJawabanSiswa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Timer Waktu (Misal Default: 60 Menit = 3600 detik)
  // Catatan: Di sistem produksi, ambil durasi ini dari database (ruangUjian.durasi)
  const [timeLeft, setTimeLeft] = useState(3600); 
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchUjianData = async () => {
      if (!user || !ujianId) return;
      try {
        // 1. Validasi Siswa
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists() || userSnap.data().role !== "siswa") return router.push("/guru");
        setSiswaData(userSnap.data());

        // 2. Cek apakah siswa sudah pernah mengerjakan ini
        const qSubmisi = query(collection(db, "submissions"), where("uid_siswa", "==", user.uid), where("id_tugas", "==", ujianId));
        const snapSubmisi = await getDocs(qSubmisi);
        if (!snapSubmisi.empty) {
          alert("Kamu sudah mengerjakan ujian ini! Tidak bisa mengulang.");
          return router.push("/siswa/kelas");
        }

        // 3. Tarik Data Ujian
        const ujianSnap = await getDoc(doc(db, "tugas_kelas", ujianId));
        if (!ujianSnap.exists()) {
          alert("Ujian tidak ditemukan.");
          return router.push("/siswa/kelas");
        }
        setRuangUjian({ id: ujianSnap.id, ...ujianSnap.data() });

        // 4. Mulai Timer Otomatis
        startTimer(3600); // Set 60 menit saat komponen dimuat

      } catch (error) {
        console.error("Gagal memuat ujian:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUjianData();

    return () => {
       if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, ujianId, router]);

  // LOGIKA PENGHITUNG WAKTU MUNDUR
  const startTimer = (initialTime: number) => {
    setTimeLeft(initialTime);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // WAKTU HABIS -> AUTO SUBMIT
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoSubmit = async () => {
    alert("WAKTU HABIS! Sistem mengumpulkan jawabanmu secara otomatis.");
    await submitKeDatabase(jawabanSiswa || "TIDAK ADA JAWABAN (Waktu Habis)");
  };

  const handleManualSubmit = async () => {
    if (!jawabanSiswa.trim()) return alert("Jawaban tidak boleh kosong!");
    if (!confirm("Yakin ingin mengumpulkan sekarang? Waktu masih tersisa.")) return;
    await submitKeDatabase(jawabanSiswa);
  };

  const submitKeDatabase = async (jawabanAkhir: string) => {
    if (!ruangUjian || !user || isSubmitting) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const newSubmisi = {
        id_tugas: ruangUjian.id,
        uid_siswa: user.uid,
        nama_siswa: siswaData.nama,
        kelas: ruangUjian.kelas,
        status: "Sudah Kumpul",
        nilai: null,
        jawaban_teks: jawabanAkhir,
        feedback_ai: "",
        catatan_guru: "",
        dikumpulkan_pada: serverTimestamp()
      };

      await addDoc(collection(db, "submissions"), newSubmisi);
      alert("✅ Ujian berhasil dikumpulkan!");
      router.push(`/siswa/kelas/${ruangUjian.kelas}`); // Kembali ke detail kelas (fallback)
      router.back(); // Atau kembali ke halaman sebelumnya
    } catch (error) {
      alert("Gagal mengumpulkan tugas. Jangan tutup halaman ini, hubungi pengawas!");
      setIsSubmitting(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // Format Waktu MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F4F5F7]">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-bold text-slate-500 animate-pulse">Menyiapkan Enkripsi Soal CBT...</p>
    </div>
  );

  const embedUrl = getEmbedUrl(ruangUjian?.lampiran_url);
  const isTimeCritical = timeLeft < 300; // Merah jika kurang dari 5 menit

  return (
    <div className="fixed inset-0 z-[100] bg-[#F4F5F7] flex flex-col overflow-hidden selection:bg-purple-500 selection:text-white">
      
      {/* HEADER CBT (TERKUNCI) */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-sm shrink-0 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl font-black">💻</div>
              <div>
                 <h1 className="font-black text-slate-800 text-lg leading-tight">{ruangUjian?.judul}</h1>
                 <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mt-0.5">{ruangUjian?.mapel} • {ruangUjian?.kelas}</p>
              </div>
           </div>
           {/* Tombol keluar darurat */}
           <button onClick={() => confirm("Tinggalkan ruang ujian? Waktu akan terus berjalan!") && router.back()} className="md:hidden px-3 py-1.5 bg-rose-50 text-rose-600 font-bold text-xs rounded-lg border border-rose-100">
             Keluar
           </button>
        </div>

        {/* TIMER (HITUNG MUNDUR) */}
        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 shadow-inner transition-colors duration-500 ${isTimeCritical ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
           <span className="text-2xl">⏳</span>
           <div>
              <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${isTimeCritical ? 'text-rose-500' : 'text-slate-400'}`}>Sisa Waktu</p>
              <div className="font-mono font-black text-3xl leading-none mt-1 tracking-wider">
                 {formatTime(timeLeft)}
              </div>
           </div>
        </div>

        {/* Tombol Kumpul Desktop */}
        <div className="hidden md:flex gap-3">
           <button onClick={() => confirm("Tinggalkan ruang ujian? Waktu akan terus berjalan!") && router.back()} className="px-5 py-3 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-xs rounded-xl transition-colors">
             Keluar Darurat
           </button>
           <button onClick={handleManualSubmit} disabled={isSubmitting} className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
             {isSubmitting ? "Mengirim..." : "Kumpulkan Ujian"}
           </button>
        </div>
      </header>

      {/* KONTEN UJIAN (SPLIT SCREEN) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 w-full max-w-[1600px] mx-auto overflow-hidden">
        
        {/* PANEL KIRI: LEMBAR SOAL */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 font-black text-sm text-slate-700 shrink-0 flex justify-between items-center">
             <span>📖 Lembar Soal Utama</span>
             <span className="text-[10px] bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-400 uppercase tracking-widest">Read-Only</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar select-none">
             {embedUrl && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8 shadow-md border border-slate-100">
                  <iframe className="w-full h-full" src={embedUrl} allowFullScreen></iframe>
                </div>
             )}
             
             <div className="prose prose-sm md:prose-base prose-slate max-w-none">
               <style>{`
                  .prose h1, .prose h2 { color: #1e293b; font-weight: 900; }
                  .prose p, .prose li { color: #334155; line-height: 1.8; }
                  .prose strong { color: #0f172a; font-weight: 800; }
               `}</style>
               <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {ruangUjian?.konten_soal.replace(/\n(?:\*\*|#+)?\s*(Kunci Jawaban|KUNCI JAWABAN|Pedoman Penskoran)[\s\S]*/gi, '')}
               </ReactMarkdown>
             </div>
          </div>
        </div>

        {/* PANEL KANAN: LEMBAR JAWABAN KOMPUTER (LJK) DIGITAL */}
        <div className="w-full lg:w-[500px] xl:w-[550px] flex flex-col h-full shrink-0">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 bg-purple-50 border-b border-purple-100 font-black text-sm text-purple-800 shrink-0 flex items-center gap-2">
               ✍️ Lembar Jawaban (LJK)
            </div>
            
            <div className="flex-1 p-5 flex flex-col min-h-0 bg-slate-50/30">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-4">
                 <p className="text-xs font-bold text-amber-800 leading-relaxed">
                   <span className="text-amber-600 text-lg">💡</span> 
                   Ketik nomor dan jawaban pilihan ganda atau esai di bawah ini. <br/>(Contoh: 1. A, 2. B, 3. Penjelasan esai...)
                 </p>
              </div>

              <textarea 
                value={jawabanSiswa} 
                onChange={(e) => setJawabanSiswa(e.target.value)}
                placeholder="Mulai mengetik jawabanmu di sini..."
                className="flex-1 w-full p-6 bg-white border border-slate-200 rounded-[20px] outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 resize-none text-[15px] font-medium text-slate-700 transition-all shadow-inner leading-relaxed"
              ></textarea>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-white shrink-0">
              <button onClick={handleManualSubmit} disabled={isSubmitting} className="w-full py-4 bg-slate-900 hover:bg-purple-600 text-white font-black text-[15px] rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? "Enkripsi Jawaban..." : "🚀 Kumpulkan & Akhiri Ujian"}
              </button>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Mobile Submit Button (Hanya terlihat di layar kecil) */}
      <div className="md:hidden p-4 bg-white border-t border-slate-200">
        <button onClick={handleManualSubmit} disabled={isSubmitting} className="w-full py-4 bg-purple-600 text-white font-black text-sm rounded-xl shadow-lg active:scale-95">
           Kumpulkan Ujian
        </button>
      </div>

    </div>
  );
}