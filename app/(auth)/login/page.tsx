"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Mengimpor fungsi auth yang kita buat sebelumnya
import { loginWithEmail, registerWithEmail, loginWithGoogle } from "@/lib/auth";
// Import tambahan untuk mengecek role di database
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  
  // State untuk form
  const [isLogin, setIsLogin] = useState(true); // true = Login, false = Daftar
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [sekolah, setSekolah] = useState("");
  
  // State untuk status UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // FUNGSI UNTUK MENGECEK ROLE DAN MENGARAHKAN HALAMAN OTOMATIS
  const redirectBasedOnRole = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          router.push("/admin");
        } else {
          router.push("/guru");
        }
      } catch (err) {
        console.error("Gagal mengambil role pengguna:", err);
        router.push("/guru"); // Fallback jika gagal
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
      }
      // Jika berhasil, arahkan sesuai role (Admin atau Guru)
      await redirectBasedOnRole();
    } catch (err: any) {
      // Mengubah pesan error bawaan Firebase menjadi bahasa Indonesia
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
      // Arahkan sesuai role (Admin atau Guru)
      await redirectBasedOnRole();
    } catch (err) {
      setError("Gagal login dengan Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-cyan-900/5 overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-extrabold text-cyan-700 tracking-tight flex items-center justify-center gap-2">
              <img src="https://i.ibb.co.com/JjK2w93q/LOGO-SYNTAX.png" alt="Logo" className="w-8 h-8 rounded-full object-cover border border-cyan-200" />
              Syntax App
            </Link>
            <h2 className="text-slate-500 mt-2">
              {isLogin ? "Selamat datang kembali, Pendidik!" : "Mulai revolusi mengajar Anda."}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Animasi memunculkan form tambahan jika mode "Daftar" */}
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                    <input 
                      required={!isLogin} type="text" value={nama} onChange={(e) => setNama(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition" 
                      placeholder="Gelar & Nama Anda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Asal Sekolah</label>
                    <input 
                      required={!isLogin} type="text" value={sekolah} onChange={(e) => setSekolah(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition" 
                      placeholder="Contoh: SMPN 1 Kepanjen"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Akun</label>
              <input 
                required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition" 
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition" 
                placeholder="Minimal 6 karakter"
              />
            </div>

            <button 
              type="submit" disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all ${
                isLoading 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-cyan-200/50'
              }`}
            >
              {isLoading ? "Memproses..." : isLogin ? "Masuk ke Dashboard" : "Buat Akun Sekarang"}
            </button>
          </form>

          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-3 text-slate-400 text-sm font-medium">Atau lanjutkan dengan</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          <button 
            onClick={handleGoogle} disabled={isLoading} type="button"
            className="mt-6 w-full flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            {/* Ikon Google menggunakan SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <p className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? "Belum punya akun?" : "Sudah terdaftar?"}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(""); }} 
              className="ml-1 text-cyan-600 font-bold hover:underline"
            >
              {isLogin ? "Daftar di sini" : "Login sekarang"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}