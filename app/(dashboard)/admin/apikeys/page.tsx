"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminApiKeys() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // State Manajemen API Key
  const [apiKeys, setApiKeys] = useState<{id: string, name: string, value: string}[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string>("");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!auth.currentUser) return router.push("/login");
      try {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists() || docSnap.data().role !== "admin") {
          return router.push("/guru"); 
        }

        // Ambil Data API Keys
        const keysDoc = await getDoc(doc(db, "settings", "api_keys"));
        if (keysDoc.exists()) {
          setApiKeys(keysDoc.data().keys || []);
          setActiveKeyId(keysDoc.data().activeKeyId || "");
        }
        setLoading(false);
      } catch (error) {
        console.error("Gagal memuat pengaturan API:", error);
        router.push("/login");
      }
    };

    fetchAdminData();
  }, [router]);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !newKeyValue) return;
    setIsSavingKey(true);
    
    try {
      const newKey = { id: Date.now().toString(), name: newKeyName, value: newKeyValue };
      const updatedKeys = [...apiKeys, newKey];
      // Jika ini key pertama, otomatis jadikan aktif
      const newActiveId = apiKeys.length === 0 ? newKey.id : (activeKeyId || newKey.id);

      await setDoc(doc(db, "settings", "api_keys"), {
        keys: updatedKeys,
        activeKeyId: newActiveId
      }, { merge: true });

      setApiKeys(updatedKeys);
      setActiveKeyId(newActiveId);
      setNewKeyName("");
      setNewKeyValue("");
    } catch (error) {
      console.error("Gagal menyimpan key:", error);
      alert("Gagal menyimpan API Key.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSetActiveKey = async (id: string) => {
    if (!confirm("Pindahkan akses AI ke Key ini sekarang?")) return;
    setActiveKeyId(id);
    try {
      await setDoc(doc(db, "settings", "api_keys"), {
        activeKeyId: id
      }, { merge: true });
    } catch (error) {
      console.error("Gagal mengubah key aktif:", error);
      alert("Gagal mengaktifkan kunci.");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Hapus API Key ini secara permanen? Key yang dihapus tidak bisa dikembalikan.")) return;
    
    const updatedKeys = apiKeys.filter(k => k.id !== id);
    let newActiveId = activeKeyId;
    
    if (activeKeyId === id) {
      newActiveId = updatedKeys.length > 0 ? updatedKeys[0].id : "";
    }

    try {
      await setDoc(doc(db, "settings", "api_keys"), {
        keys: updatedKeys,
        activeKeyId: newActiveId
      }, { merge: true });
      
      setApiKeys(updatedKeys);
      setActiveKeyId(newActiveId);
    } catch (error) {
      console.error("Gagal menghapus key:", error);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4 text-slate-400">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-sm animate-pulse">Membuka Brankas Keamanan...</div>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] mx-auto space-y-6 pb-24 md:pb-10 px-4 md:px-6 pt-4 md:pt-6">
      
      {/* HEADER PAGE */}
      <motion.div variants={itemVariants} className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">🔑</div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">Manajemen API Key</h1>
            <p className="text-[12px] md:text-sm text-slate-500 mt-1 font-medium">Pusat rotasi kunci Google Gemini AI untuk seluruh sistem.</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${apiKeys.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className="text-xs font-bold text-slate-600">
            {apiKeys.length > 0 ? 'Koneksi AI Tersedia' : 'Koneksi AI Terputus'}
          </span>
        </div>
      </motion.div>

      {/* MAIN VAULT CARD */}
      <motion.div variants={itemVariants} className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-100 overflow-hidden shadow-sm flex flex-col">
        
        {/* Vault Header Gelap */}
        <div className="p-6 md:p-8 bg-slate-900 flex items-center justify-between gap-4 relative overflow-hidden">
          {/* Efek Lingkaran di Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center text-2xl border border-white/10 backdrop-blur-sm shadow-inner">
              🛡️
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white">Brankas Kunci AI</h2>
              <p className="text-[11px] md:text-xs text-slate-400 mt-1 font-medium">Pastikan selalu ada setidaknya 1 kunci yang berstatus Aktif.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          {/* KOLOM KIRI: FORM TAMBAH KEY (2 Kolom) */}
          <div className="p-6 md:p-8 lg:col-span-2 bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Tambah Kunci Baru
            </h3>
            
            <form onSubmit={handleAddKey} className="space-y-5">
              <div>
                <label className="block text-[12px] md:text-[13px] font-bold text-slate-700 mb-2">Nama Label / Penanda</label>
                <input 
                  type="text" 
                  value={newKeyName} 
                  onChange={(e) => setNewKeyName(e.target.value)} 
                  required 
                  placeholder="Contoh: Key Utama Bulan Ini" 
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-[13px] md:text-sm font-medium text-slate-700 shadow-sm transition-all" 
                />
              </div>
              <div>
                <label className="block text-[12px] md:text-[13px] font-bold text-slate-700 mb-2">Google Gemini API Key</label>
                <input 
                  type="text" 
                  value={newKeyValue} 
                  onChange={(e) => setNewKeyValue(e.target.value)} 
                  required 
                  placeholder="Paste AIzaSy..." 
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-[13px] md:text-sm text-slate-700 font-mono shadow-sm transition-all" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isSavingKey} 
                className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 text-[13px] md:text-sm ${
                  isSavingKey ? 'bg-indigo-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 hover:shadow-indigo-200'
                }`}
              >
                {isSavingKey ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menyimpan...</>
                ) : (
                  "Simpan ke Brankas"
                )}
              </button>
            </form>
          </div>

          {/* KOLOM KANAN: DAFTAR KEY (3 Kolom) */}
          <div className="p-6 md:p-8 lg:col-span-3 bg-white">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Kunci Tersimpan
              </h3>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold border border-slate-200">
                {apiKeys.length} Kunci
              </span>
            </div>
            
            {apiKeys.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-amber-200 bg-amber-50 rounded-2xl flex flex-col items-center text-center">
                <span className="text-4xl mb-3">⚠️</span>
                <h4 className="font-bold text-amber-800">Sistem AI Lumpuh</h4>
                <p className="text-[12px] md:text-[13px] text-amber-700/80 mt-1 max-w-sm">
                  Belum ada API Key yang tersimpan. Semua guru tidak akan bisa meng-generate materi sampai Anda menambahkan kunci baru.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                  {apiKeys.map(key => {
                    const isActive = activeKeyId === key.id;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        key={key.id} 
                        className={`p-4 md:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isActive ? 'bg-emerald-50/50 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        {/* Info Key */}
                        <div className="flex-1 min-w-0 pr-0 sm:pr-4">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h4 className={`text-sm md:text-base font-black truncate ${isActive ? 'text-emerald-800' : 'text-slate-800'}`}>
                              {key.name}
                            </h4>
                            {isActive && (
                              <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-[9px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm shrink-0">
                                Sedang Dipakai
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] md:text-xs text-slate-400 font-mono tracking-wider truncate bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">
                            {key.value.substring(0, 15)}••••••••••••{key.value.substring(key.value.length - 5)}
                          </p>
                        </div>
                        
                        {/* Tombol Aksi */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          {!isActive && (
                            <button 
                              onClick={() => handleSetActiveKey(key.id)} 
                              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 text-slate-600 text-[11px] md:text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
                            >
                              Gunakan Key
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteKey(key.id)} 
                            className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all shrink-0" 
                            title="Hapus Key Permanen"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}