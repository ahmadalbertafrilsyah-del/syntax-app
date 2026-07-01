"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { chatAssistantStream } from "@/lib/ai"; 
import { useAuth } from "@/lib/AuthContext";

export default function ChatWidget() {
  const { user } = useAuth();
  const [guruMapel, setGuruMapel] = useState<string>("Umum");

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "model", text: string, time: string }[]>([
    { 
      role: "model", 
      text: "Halo! Saya Asisten Syntax. Ada materi atau ide mengajar yang ingin didiskusikan hari ini?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminScope, setAdminScope] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAdminScope = async () => {
      try {
        const scopeDoc = await getDoc(doc(db, "settings", "chatbot_scope"));
        if (scopeDoc.exists()) {
          setAdminScope(scopeDoc.data().prompt || "");
        }
      } catch (error) {
        console.error("Gagal memuat scope admin:", error);
      }
    };
    fetchAdminScope();
  }, []);

  useEffect(() => {
    const fetchGuruProfile = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().mapel) {
            setGuruMapel(docSnap.data().mapel);
          }
        } catch (error) {
          console.error("Gagal memuat profil guru:", error);
        }
      }
    };
    fetchGuruProfile();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userText = input;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userText, time: currentTime }]);
    setIsLoading(true);

    try {
      // 🔥 PERBAIKAN: Potong elemen pertama (pesan sambutan model) agar history dimulai dari "user". 
      // Variabel `messages` saat ini HANYA berisi riwayat lama, belum termasuk `userText` baru. 
      // Ini sudah sangat pas dengan struktur yang diminta Gemini API.
      const historyToSend = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // 🔥 PERBAIKAN: Panggil fungsi AI dengan parameter yang rapi
      const stream = await chatAssistantStream(historyToSend, userText, guruMapel, adminScope);
      
      let aiResponse = "";
      setMessages(prev => [...prev, { role: "model", text: "", time: currentTime }]); 

      for await (const chunk of stream) {
        aiResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = aiResponse;
          return newMessages;
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "model", 
        text: "Maaf, sistem komunikasi sedang terganggu atau API Key limit. Coba lagi nanti.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative font-sans flex items-center justify-center z-50">
      
      {isOpen && (
         <div className="fixed inset-0 z-[90] bg-slate-900/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none" onClick={() => setIsOpen(false)}></div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[72px] left-4 right-4 md:absolute md:top-full md:left-auto md:right-0 md:mt-2 bg-[#E4EBEF] w-auto md:w-[380px] h-[500px] md:h-[550px] max-h-[calc(100vh-160px)] md:max-h-[calc(100vh-100px)] rounded-[20px] shadow-2xl flex flex-col overflow-hidden border border-slate-200/60 transform origin-top md:origin-top-right z-[100]"
          >
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3390EC] to-[#1E6BBA] rounded-full flex items-center justify-center text-white text-lg shadow-sm">🤖</div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-[15px] text-slate-800 leading-none">Asisten Syntax</h3>
                    <span className="bg-[#3390EC]/10 text-[#3390EC] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">BOT</span>
                  </div>
                  <p className="text-[12px] text-[#3390EC] font-medium mt-1">Spesialis {guruMapel.length > 15 ? guruMapel.substring(0, 15) + "..." : guruMapel}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-[url('https://web.telegram.org/a/chat-bg-pattern-light.png')] bg-cover bg-center">
              <div className="text-center my-2">
                <span className="bg-black/10 text-black/50 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-sm">Hari ini</span>
              </div>

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === "user" ? 'items-end' : 'items-start'} max-w-[85%] ${msg.role === "user" ? 'ml-auto' : 'mr-auto'}`}>
                  <div className={`relative px-3.5 py-2 text-[14px] leading-relaxed shadow-sm ${msg.role === "user" ? 'bg-[#EEFFDE] text-slate-800 rounded-[16px] rounded-br-sm' : 'bg-white text-slate-800 rounded-[16px] rounded-bl-sm border border-slate-100'}`}>
                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                    <div className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${msg.role === "user" ? 'text-[#4A9F54]' : 'text-slate-400'}`}>
                      {msg.time}
                      {msg.role === "user" && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start max-w-[85%] mr-auto">
                  <div className="bg-white px-4 py-3 rounded-[16px] rounded-bl-sm shadow-sm border border-slate-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white p-3 flex items-center gap-2 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] shrink-0">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Tulis pesan..." className="flex-1 bg-transparent text-[14px] text-slate-800 placeholder-slate-400 outline-none px-2" />
              {input.trim() ? (
                <button onClick={handleSend} disabled={isLoading} className="w-10 h-10 flex items-center justify-center bg-[#3390EC] text-white rounded-full hover:bg-[#2A7DCB] transition-colors shrink-0 shadow-sm disabled:opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[-1px] translate-y-[1px]"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              ) : (
                <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#3390EC] transition-colors rounded-full hover:bg-slate-50 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button onClick={() => setIsOpen(!isOpen)} className={`p-2 rounded-full transition-colors flex items-center justify-center z-50 ${isOpen ? 'text-[#3390EC] bg-blue-50' : 'text-slate-400 hover:text-[#3390EC] hover:bg-blue-50'}`} title="Asisten AI">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
      </button>
    </div>
  );
}