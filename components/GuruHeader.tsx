"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ChatWidget from "@/components/ChatWidget";

export default function GuruHeader() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hari = date.toLocaleDateString('id-ID', { weekday: 'short' });
    const tanggal = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${hari}, ${tanggal} • ${jam}`;
  };

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserData(docSnap.data());
    };
    fetchUserData();

    const notifRef = collection(db, "notifications");
    const q = query(notifRef, where("userId", "in", [user.uid, "all"]));
    
    const unsubscribeNotif = onSnapshot(q, (snapshot) => {
      const notifData: any[] = [];
      let unread = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifData.push({ id: doc.id, ...data });
        if (!data.isRead) unread++;
      });
      
      notifData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setNotifications(notifData);
      setUnreadCount(unread);
    }, (error) => {
      console.log("Notifikasi belum tersedia.", error);
    });

    return () => unsubscribeNotif();
  }, [user]);

  const handleLogout = async () => {
    if(confirm("Apakah Anda yakin ingin keluar?")) {
      await auth.signOut();
      router.push("/login");
    }
  };

  if (!user) return null;

  return (
    <header className="px-4 md:px-8 pt-4 md:pt-6 pb-2 w-full flex items-center justify-between z-40 sticky top-0 bg-[#F4F5F7]/80 backdrop-blur-md">
      
      <div className="flex md:hidden items-center gap-2 pl-1">
        <img src="https://i.ibb.co.com/JjK2w93q/LOGO-SYNTAX.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow-sm" />
        <span className="text-[18px] font-black text-indigo-600 tracking-tight">Syntax</span>
      </div>

      <div className="hidden md:flex items-center bg-white px-4 py-2.5 rounded-full shadow-sm border border-slate-100/80">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          {formatTime(currentTime)} WIB
        </span>
      </div>

      <div className="flex items-center gap-2 bg-white p-1.5 pr-2 md:pr-4 rounded-full shadow-sm border border-slate-100/80 shrink-0 relative">
        
        {/* WIDGET CHATBOT */}
        <ChatWidget />

        <div className="h-6 w-px bg-slate-200 mx-0.5"></div>

        {/* WADAH NOTIFIKASI */}
        <div className="relative z-50 flex items-center justify-center">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)} 
            className={`p-2 rounded-full transition-colors relative z-50 ${isNotifOpen ? 'text-[#FF4B2B] bg-orange-50' : 'text-slate-400 hover:text-[#FF4B2B] hover:bg-orange-50'}`}
            title="Pemberitahuan"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 text-white flex items-center justify-center border-2 border-white rounded-full"></span>
            )}
            {unreadCount === 0 && notifications.length === 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-300 border-2 border-white rounded-full"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="fixed inset-0 z-[90] bg-slate-900/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none" onClick={() => setIsNotifOpen(false)}></div>
          )}

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                // 🔥 PERBAIKAN DESKTOP: Menambahkan md:mt-2 agar kotak tidak menabrak batas atas
                className="fixed top-[72px] left-4 right-4 md:absolute md:top-full md:left-auto md:right-0 md:mt-2 md:w-[380px] bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden z-[100] origin-top md:origin-top-right"
              >
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    Pemberitahuan
                    {unreadCount > 0 && <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Baru</span>}
                  </h3>
                </div>

                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`p-5 border-b border-slate-50 transition-colors hover:bg-slate-50 cursor-pointer flex gap-4 items-start ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'admin' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {notif.type === 'admin' ? '📣' : '🔔'}
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
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mb-3 shadow-inner">📭</div>
                      <h4 className="font-bold text-slate-700 text-sm mb-1">Belum Ada Pemberitahuan</h4>
                      <p className="text-xs text-slate-500 max-w-[200px]">Semua informasi dari sistem dan Admin akan muncul di sini.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-0.5"></div>

        <div className="flex items-center gap-2 pl-1 pr-2">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-tr from-[#FF6B4A] to-[#FF4B2B] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden shrink-0 border-2 border-white">
            {userData?.fotoProfile ? (
              <img src={userData.fotoProfile} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{userData?.nama ? userData.nama.charAt(0).toUpperCase() : "G"}</span>
            )}
          </div>
          <div className="hidden sm:block">
            <h2 className="text-[13px] font-bold text-slate-800 leading-tight">
              {userData?.nama?.split(' ')[0] || "Pendidik"}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Guru / Staff</p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

        <button onClick={handleLogout} className="p-1.5 md:p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-colors" title="Keluar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>

      </div>
    </header>
  );
}