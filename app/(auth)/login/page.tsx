"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginWithEmail, registerWithEmail, loginWithGoogle } from "@/lib/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  
  // State untuk form
  const [isLogin, setIsLogin] = useState(true); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [sekolah, setSekolah] = useState("");
  
  // 🔥 STATE BARU: Pemilih Peran (Default: Siswa)
  const [roleDaftar, setRoleDaftar] = useState<"guru" | "siswa">("siswa");
  
  // State untuk status UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // FUNGSI UNTUK MENGECEK ROLE DAN MENGARAHKAN HALAMAN OTOMATIS
  const redirectBasedOnRole = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userRole = userDoc.data().role;
          if (userRole === "admin") router.push("/admin");
          else if (userRole === "siswa") router.push("/siswa");
          else router.push("/guru");
        } else {
          router.push("/guru"); 
        }
      } catch (err) {
        console.error("Gagal mengambil role pengguna:", err);
        router.push("/guru"); 
      }
    }
  };

  // Menangani tombol Submit (Login / Daftar Email)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, nama, sekolah);
        
        // 🔥 INJEKSI ROLE: Setelah akun terbuat, langsung update role-nya di Firestore
        if (auth.currentUser) {
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, { role: roleDaftar });
        }
      }
      await redirectBasedOnRole();
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") setError("Email sudah terdaftar. Silakan login.");
      else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") setError("Email atau password salah.");
      else if (err.code === "auth/weak-password") setError("Password minimal 6 karakter.");
      else setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  // Menangani tombol Google
  const handleGoogle = async () => {
    setIsLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      // Catatan: Login Google by default akan menjadi Guru kecuali diset manual di database
      await redirectBasedOnRole();
    } catch (err) {
      setError("Gagal login dengan Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans overflow-hidden">
      
      {/* BAGIAN KIRI: AREA FORMULIR */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 lg:p-24 relative z-10 bg-white shadow-[20px_0_40px_rgba(0,0,0,0.05)]">
        
        <Link href="/" className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          
          <div className="mb-10 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-6">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-indigo-200">
                <img src="https://i.ibb.co.com/JjK2w93q/LOGO-SYNTAX.png" alt="Logo" className="w-10 h-10 object-contain invert brightness-0" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-2">
              {isLogin ? "Selamat Datang" : "Mulai Revolusi"}
            </h1>
            <p className="text-slate-500 font-medium">
              {isLogin ? "Masuk untuk melanjutkan ke ruang kerja Anda." : "Bergabunglah ke dalam ekosistem LMS cerdas."}
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 24 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="overflow-hidden">
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[13px] font-bold flex items-center gap-3">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -10, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* 🔥 UI PEMILIH PERAN (ROLE SELECTOR) */}
                  <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 flex gap-2">
                     <button type="button" onClick={() => setRoleDaftar("siswa")} className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all ${roleDaftar === "siswa" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}`}>
                        🎓 Saya Siswa
                     </button>
                     <button type="button" onClick={() => setRoleDaftar("guru")} className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all ${roleDaftar === "guru" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}`}>
                        👨‍🏫 Saya Guru
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                      <input 
                        required={!isLogin} type="text" value={nama} onChange={(e) => setNama(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium" 
                        placeholder={roleDaftar === "guru" ? "Cth: Ahmad, S.Pd" : "Cth: Budi Santoso"}
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Instansi / Sekolah</label>
                      <input 
                        required={!isLogin} type="text" value={sekolah} onChange={(e) => setSekolah(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium" 
                        placeholder="Cth: SMAN 1 Malang"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Alamat Email</label>
              <input 
                required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium" 
                placeholder="nama@sekolah.com"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Kata Sandi</label>
              <input 
                required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium" 
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all flex justify-center items-center gap-2 mt-2 ${
                isLoading ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200'
              }`}
            >
              {isLoading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {isLoading ? "Memproses..." : isLogin ? "Masuk ke Ruang Kerja" : "Buat Akun Sekarang"}
            </button>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-slate-100"></div>
            <span className="px-4 text-slate-400 text-[11px] font-black uppercase tracking-widest">Atau masuk dengan</span>
            <div className="flex-1 border-t border-slate-100"></div>
          </div>

          <button 
            onClick={handleGoogle} disabled={isLoading} type="button"
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <div className="mt-8 text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[13px] text-slate-500 font-medium">
              {isLogin ? "Belum memiliki akses?" : "Sudah menjadi bagian dari kami?"}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(""); }} 
                className="ml-1.5 text-indigo-600 font-black hover:text-indigo-800 transition-colors underline underline-offset-4"
              >
                {isLogin ? "Daftar sekarang" : "Masuk di sini"}
              </button>
            </p>
          </div>

        </motion.div>
      </div>

      {/* BAGIAN KANAN: ILUSTRASI */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/30 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 p-16 max-w-xl">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[32px] shadow-2xl">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white mb-6 border border-white/30 text-xl">✨</div>
            <h2 className="text-2xl font-black text-white leading-tight mb-4">
              "Teknologi hadir bukan sebagai pengajar utama, melainkan asisten tak kasat mata yang mereduksi beban operasional pendidikan."
            </h2>
            <p className="text-indigo-200 font-medium text-sm">— Ahmad Albert Afrilsyah</p>
            
            <div className="mt-12 pt-8 border-t border-white/10 flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-slate-800 shadow-sm flex items-center justify-center text-xs font-bold">👩‍🏫</div>
                <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-slate-800 shadow-sm flex items-center justify-center text-xs font-bold">👨‍💼</div>
                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-800 shadow-sm flex items-center justify-center text-xs font-bold">🎓</div>
              </div>
              <p className="text-white/60 text-xs font-medium">Bergabung bersama ratusan Pendidik & Siswa lainnya.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}