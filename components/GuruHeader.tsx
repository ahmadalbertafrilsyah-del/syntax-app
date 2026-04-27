"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function GuruHeader() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State khusus Notifikasi
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Jalankan jam real-time setiap detik
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hari = date.toLocaleDateString('id-ID', { weekday: 'long' });
    const tanggal = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${hari}, ${tanggal} • ${jam} WIB`;
  };

  // Mengambil Data User & Notifikasi Real-time
  useEffect(() => {
    if (!user) return;

    // 1. Ambil Data Profil User
    const fetchUserData = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserData(docSnap.data());
    };
    fetchUserData();

    // 2. Listener Real-time Notifikasi (Dari Sistem atau Admin)
    const notifRef = collection(db, "notifications");
    // Mengambil notifikasi yang ditujukan untuk user ini, atau notifikasi 'all' (broadcast)
    const q = query(notifRef, where("userId", "in", [user.uid, "all"]));
    
    const unsubscribeNotif = onSnapshot(q, (snapshot) => {
      const notifData: any[] = [];
      let unread = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifData.push({ id: doc.id, ...data });
        if (!data.isRead) unread++;
      });
      
      // Urutkan secara manual (karena query 'in' kadang sulit digabung dengan orderBy tanpa index khusus)
      notifData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setNotifications(notifData);
      setUnreadCount(unread);
    }, (error) => {
      console.log("Notifikasi belum tersedia atau perlu setting index Firestore.", error);
    });

    return () => unsubscribeNotif();
  }, [user]);

  const handleLogout = async () => {
    if(confirm("Apakah Anda yakin ingin keluar?")) {
      await auth.signOut();
      router.push("/login");
    }
  };

  // Jangan render jika belum login
  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between z-30 sticky top-0 shadow-sm">
      
      {/* KIRI: Foto, Nama, Jam Real-time */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white overflow-hidden shrink-0">
          {userData?.fotoProfile ? (
            <img src={userData.fotoProfile} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{userData?.nama ? userData.nama.charAt(0).toUpperCase() : "G"}</span>
          )}
        </div>
        <div>
          <h2 className="text-sm md:text-base font-bold text-slate-800 leading-tight">
            {userData?.nama || "Pendidik"}
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">
            {formatTime(currentTime)}
          </p>
        </div>
      </div>

      {/* KANAN: Lonceng & Keluar */}
      <div className="flex items-center gap-2 md:gap-3">
        
        {/* WADAH NOTIFIKASI */}
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)} 
            className={`p-2 md:p-2.5 rounded-full transition-colors relative ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}
            title="Pemberitahuan"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            
            {/* Lencana Angka Notifikasi Unread */}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 w-4 h-4 md:w-4 md:h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            {/* Titik Merah jika tidak ada unread tapi ada notif (opsional), kita pakai titik merah saja jika array notif dummy */}
            {unreadCount === 0 && notifications.length === 0 && (
              <span className="absolute top-1.5 right-2 w-2 h-2 md:w-2 md:h-2 bg-slate-300 border-2 border-white rounded-full"></span>
            )}
          </button>

          {/* OVERLAY TRANSPARAN UNTUK MENUTUP DROPDOWN SAAT KLIK DI LUAR */}
          {isNotifOpen && (
            <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
          )}

          {/* PANEL DROPDOWN NOTIFIKASI */}
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 origin-top-right"
              >
                {/* Header Dropdown */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    Pemberitahuan
                    {unreadCount > 0 && <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Baru</span>}
                  </h3>
                </div>

                {/* List Notifikasi */}
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`p-5 border-b border-slate-50 transition-colors hover:bg-slate-50 cursor-pointer flex gap-4 items-start ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'admin' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {notif.type === 'admin' ? '📢' : '🤖'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1">{notif.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] font-semibold text-slate-400 mt-2 block">
                            {notif.createdAt ? notif.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Baru saja"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Jika Kosong */
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner">🔕</div>
                      <h4 className="font-bold text-slate-700 text-sm mb-1">Belum Ada Pemberitahuan</h4>
                      <p className="text-xs text-slate-500 max-w-[200px]">Semua informasi dari sistem dan Admin akan muncul di sini.</p>
                    </div>
                  )}
                </div>
                
                {/* Footer Dropdown (Opsional Sistem Welcome) */}
                {notifications.length === 0 && (
                   <div className="px-5 py-4 bg-indigo-50/50 border-t border-slate-100">
                     <div className="flex gap-3 items-center">
                       <span className="text-xl">👋</span>
                       <div>
                         <h4 className="text-xs font-bold text-indigo-800">Selamat datang di Syntax!</h4>
                         <p className="text-[10px] text-indigo-600 mt-0.5">Mulai racik perangkat ajar pertama Anda.</p>
                       </div>
                     </div>
                   </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={handleLogout} className="p-2 md:p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-colors" title="Keluar">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>
      
    </header>
  );
}