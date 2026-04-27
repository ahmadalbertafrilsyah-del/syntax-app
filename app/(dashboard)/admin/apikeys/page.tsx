"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";

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
      const newActiveId = activeKeyId || newKey.id;

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
    setActiveKeyId(id);
    try {
      await setDoc(doc(db, "settings", "api_keys"), {
        activeKeyId: id
      }, { merge: true });
    } catch (error) {
      console.error("Gagal mengubah key aktif:", error);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Hapus API Key ini secara permanen?")) return;
    
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

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="font-bold text-slate-500 animate-pulse">Memuat Pengaturan...</div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen API Key 🔑</h1>
        <p className="text-sm text-slate-500 mt-2">Pusat rotasi kunci Google Gemini AI. Tambahkan dan pilih kunci aktif untuk seluruh pengguna.</p>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-900 flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <div>
            <h2 className="text-lg font-bold text-white">Brankas Kunci AI</h2>
            <p className="text-xs text-slate-400">Pastikan selalu ada setidaknya 1 kunci yang berstatus Aktif.</p>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Tambah Key */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Tambah Key Baru</h3>
            <form onSubmit={handleAddKey} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Label (Contoh: Key Utama)</label>
                <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} required placeholder="Masukkan nama label..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Gemini API Key (AIzaSy...)</label>
                <input type="text" value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)} required placeholder="Paste API Key di sini..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
              </div>
              <button type="submit" disabled={isSavingKey} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                {isSavingKey ? "Menyimpan..." : "Simpan API Key"}
              </button>
            </form>
          </div>

          {/* Daftar Key */}
          <div className="border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 pt-6 md:pt-0">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide flex justify-between items-center">
              Daftar Key Tersimpan
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{apiKeys.length} Key</span>
            </h3>
            
            {apiKeys.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                Belum ada API Key yang disimpan. Aplikasi mungkin tidak bisa melakukan generate materi!
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {apiKeys.map(key => (
                  <div key={key.id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${activeKeyId === key.id ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{key.name}</p>
                        {activeKeyId === key.id && <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">Aktif</span>}
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate">{key.value.substring(0, 15)}...{key.value.substring(key.value.length - 4)}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {activeKeyId !== key.id && (
                        <button onClick={() => handleSetActiveKey(key.id)} className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 text-xs font-bold rounded-lg transition-colors">
                          Gunakan
                        </button>
                      )}
                      <button onClick={() => handleDeleteKey(key.id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Key">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

    </div>
  );
}