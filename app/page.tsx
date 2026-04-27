"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden scroll-smooth relative">
      
      {/* Latar Belakang Grid Pola AI */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

      {/* NAVBAR GLASSMORPHISM */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://i.ibb.co.com/JjK2w93q/LOGO-SYNTAX.png" alt="Syntax Logo" className="w-8 h-8 object-contain" />
            <span className="font-black text-xl text-slate-800 tracking-tight">Syntax<span className="text-indigo-600">.</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#fitur" className="hidden md:block text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Cara Kerja
            </Link>
            <Link href="/login">
              <button className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95">
                Masuk / Daftar
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="min-h-screen flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-6 sm:px-12 pt-28 lg:pt-20 gap-12 relative z-10 w-full">
        
        {/* Background Decorative Blobs */}
        <div className="absolute top-20 right-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-indigo-300/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-300/20 rounded-full blur-[100px] pointer-events-none"></div>

        {/* SISI KIRI: TEKS & CTA */}
        <div className="flex-1 space-y-8 text-center lg:text-left relative z-10 pt-10 lg:pt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm text-[11px] font-black text-indigo-600 mb-6 uppercase tracking-widest mx-auto lg:mx-0">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Sistem AI Pendidikan Indonesia
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Asisten AI Untuk <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Guru Modern.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Tinggalkan administrasi yang melelahkan. Buat Modul Ajar, RPP, dan Bank Soal berstandar Kurikulum Merdeka hanya dalam <strong>hitungan detik</strong>.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-4 text-[15px] font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-3 active:scale-95 border border-indigo-500">
                Mulai Gunakan AI <span className="text-xl">✨</span>
              </button>
            </Link>
            <Link href="#fitur" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-4 text-[15px] font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95">
                Lihat Cara Kerja
              </button>
            </Link>
          </motion.div>

          {/* Social Proof Mini */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="pt-6 flex items-center justify-center lg:justify-start gap-4">
            <div className="flex -space-x-3">
              <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm" />
              <img src="https://i.pravatar.cc/100?img=2" alt="User" className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm" />
              <img src="https://i.pravatar.cc/100?img=3" alt="User" className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm" />
              <div className="w-10 h-10 rounded-full border-2 border-slate-50 bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">+1k</div>
            </div>
            <p className="text-xs font-bold text-slate-500">Dipercaya oleh ribuan pendidik.</p>
          </motion.div>
        </div>

        {/* SISI KANAN: LOGO & VISUAL FLOATING */}
        <div className="flex-1 flex justify-center items-center relative w-full h-[400px] lg:h-[600px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20"
          >
            {/* Main Logo Container */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-64 h-64 md:w-80 md:h-80 bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/50 flex flex-col items-center justify-center p-8 relative overflow-hidden ring-1 ring-slate-900/5"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <img src="https://i.ibb.co.com/J0jVHbG/Syntax-Icon.png" alt="Syntax Big Icon" className="w-40 h-40 object-contain drop-shadow-xl z-10" />
               <div className="absolute bottom-6 text-xs font-black text-slate-300 tracking-[0.3em] uppercase z-10">AI Engine</div>
            </motion.div>

            {/* Floating Badges 1 */}
            <motion.div 
               animate={{ x: [-5, 5, -5], y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
               className="absolute -top-6 -right-12 lg:-right-20 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">📄</div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generate</div>
                <div className="text-sm font-black text-slate-700">Modul Ajar PDF</div>
              </div>
            </motion.div>

            {/* Floating Badges 2 */}
            <motion.div 
               animate={{ x: [5, -5, 5], y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}
               className="absolute -bottom-10 -left-8 lg:-left-16 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">💯</div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-Korektor</div>
                <div className="text-sm font-black text-slate-700">Evaluasi Esai</div>
              </div>
            </motion.div>
          </motion.div>
        </div>

      </main>

      {/* SECTION FITUR */}
      <section id="fitur" className="py-24 bg-white px-6 sm:px-12 lg:px-24 relative z-10 border-t border-slate-100 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <span className="text-indigo-600 font-black tracking-widest uppercase text-sm">Alur Kerja</span>
             <h2 className="text-3xl md:text-5xl font-black text-slate-900 mt-2 mb-4">Cara Kerja <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 italic">Syntax.</span></h2>
             <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base font-medium">Ubah instruksi sederhana menjadi dokumen pendidikan berstandar nasional secara instan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            {/* Garis Penghubung (Hanya Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>

            {[
              { step: "01", title: "Input Instruksi", desc: "Masukkan mata pelajaran, fase, dan topik materi yang ingin diajarkan ke dalam form.", icon: "📝" },
              { step: "02", title: "AI Memproses", desc: "Mesin Gemini AI memproses struktur sesuai standar Kurikulum Merdeka terbaru.", icon: "⚙️" },
              { step: "03", title: "Dokumen Siap", desc: "Unduh file hasil langsung dalam format profesional siap cetak / PDF.", icon: "🚀" },
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-[32px] bg-white border-2 border-slate-50 hover:border-indigo-100 shadow-sm hover:shadow-xl transition-all relative z-10 text-center md:text-left group"
              >
                <div className="w-16 h-16 bg-slate-50 group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto md:mx-0 border border-slate-100 group-hover:border-indigo-200 transition-colors">
                  {f.icon}
                </div>
                <div className="text-[10px] font-black text-indigo-500 mb-2 uppercase tracking-widest">Langkah {f.step}</div>
                <h3 className="text-xl font-black text-slate-800 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-slate-400 text-[10px] border-t border-slate-100 bg-slate-50 tracking-widest uppercase font-black">
        <p>© 2026 Syntax App — Sistem AI Naskah & Tata Ajar eXpress</p>
      </footer>
    </div>
  );
}