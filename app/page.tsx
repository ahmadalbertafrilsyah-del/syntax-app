"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden scroll-smooth">
      
      {/* Hero Section */}
      <main className="min-h-screen flex flex-col lg:flex-row items-center px-6 sm:px-12 lg:px-24 pt-24 lg:pt-0 gap-12 relative">
        
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-200/20 rounded-full blur-[100px] -z-10"></div>

        {/* SISI KIRI: TEKS & CTA */}
        <div className="flex-1 space-y-8 text-left z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-indigo-600 mb-6 uppercase tracking-widest">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              The Future of Teaching
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
              Asisten AI Untuk <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Guru Modern.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed">
              Syntax App membantu Anda merancang Modul Ajar, RPP, dan Bank Soal otomatis sesuai standar Kurikulum Merdeka hanya dalam hitungan detik.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-4 text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3">
                Mulai Sekarang <span className="text-2xl">✨</span>
              </button>
            </Link>
          </motion.div>
        </div>

        {/* SISI KANAN: LOGO & VISUAL */}
        <div className="flex-1 flex justify-center items-center relative w-full h-[400px] lg:h-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20"
          >
            {/* AREA LOGO ANDA */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-[40px] shadow-2xl border border-slate-100 flex items-center justify-center p-8 relative overflow-hidden"
            >
               {/* Ornamen di dalam kotak logo */}
               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-10 -mt-10"></div>
               
               {/* Ganti baris di bawah ini dengan tag <img src="/logo-anda.png" /> */}
               <img src="https://i.ibb.co.com/J0jVHbG/Syntax-Icon.png" />
               
               <div className="absolute bottom-4 text-sm font-bold text-slate-300 tracking-widest uppercase">Syntax App</div>
            </motion.div>

            {/* Floating Badges */}
            <motion.div 
               animate={{ x: [0, 10, 0] }}
               transition={{ duration: 3, repeat: Infinity }}
               className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-lg border border-slate-50 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold">✓</div>
              <div className="text-xs font-bold text-slate-600">Media Ajar Akurat</div>
            </motion.div>
          </motion.div>
        </div>

        {/* SCROLL INDICATOR ANIMATION */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2"
        >
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Scroll Down</span>
           <motion.div 
             animate={{ y: [0, 12, 0] }}
             transition={{ duration: 1.5, repeat: Infinity }}
             className="w-1 h-8 bg-gradient-to-b from-indigo-600 to-transparent rounded-full"
           />
        </motion.div>
      </main>

      {/* SECTION FITUR (Terbuka saat scroll kebawah) */}
      <section id="fitur" className="py-32 bg-white px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center lg:text-left mb-20">
             <h2 className="text-4xl font-black text-slate-900 mb-4">Cara Kerja <span className="text-indigo-600 italic">Syntax App.</span></h2>
             <p className="text-slate-500 max-w-xl italic">Sederhana, Cepat, dan Tetap Mengikuti Standar Pendidikan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Input Topik", desc: "Masukkan mata pelajaran dan materi yang ingin diajarkan.", color: "bg-blue-600" },
              { step: "02", title: "AI Processing", desc: "Teknologi Gemini memproses standar kurikulum terbaru.", color: "bg-indigo-600" },
              { step: "03", title: "Siap Pakai", desc: "Unduh file PDF dan perangkat ajar siap digunakan.", color: "bg-purple-600" },
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-10 rounded-[32px] bg-slate-50 border border-slate-100 transition-all"
              >
                <div className={`text-white w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center font-black mb-6 shadow-lg shadow-indigo-100`}>
                  {f.step}
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-4">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-slate-400 text-xs border-t border-slate-100 bg-white tracking-widest uppercase font-bold">
        <p>© 2026 Syntax App — Sistem AI Naskah & Tata Ajar eXpress</p>
      </footer>
    </div>
  );
}