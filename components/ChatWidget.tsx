"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chatAssistantStream } from "@/lib/ai";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "model"; text: string };

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Halo Pendidik Hebat! 👋 Ada yang bisa saya bantu untuk kelas Anda hari ini?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah setiap ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    
    // Tambahkan pesan user ke layar
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsTyping(true);

    // KUNCI PERBAIKAN: Potong pesan sapaan pertama (index ke-0) agar history murni diawali oleh "user"
    const history = messages
      .slice(1) 
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    try {
      const stream = await chatAssistantStream(history, userMessage);
      
      // Siapkan tempat kosong untuk balasan AI
      setMessages((prev) => [...prev, { role: "model", text: "" }]);
      
      let aiResponse = "";
      for await (const chunk of stream) {
        aiResponse += chunk;
        // Update pesan terakhir (pesan AI) secara real-time
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = aiResponse;
          return newMessages;
        });
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "model", text: "Maaf, koneksi saya sedang terganggu. 😔 Pastikan koneksi internet Anda stabil." }]);
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-[calc(100vw-3rem)] sm:w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
            style={{ height: "500px", maxHeight: "80vh" }}
          >
            {/* Header Chat */}
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🤖</div>
                <div>
                  <h3 className="font-bold text-sm">Asisten Syntax</h3>
                  <p className="text-xs text-indigo-200">Online & Siap Membantu</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition">
                ✕
              </button>
            </div>

            {/* Area Pesan */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-sm" 
                      : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm prose prose-sm prose-indigo"
                  }`}>
                    {msg.role === "user" ? (
                      msg.text
                    ) : (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 text-slate-400 p-3 rounded-2xl rounded-tl-sm shadow-sm text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Form Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya ide ice-breaking, kuis..." 
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                disabled={isTyping}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 transition"
              >
                <svg className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tombol Melayang */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-300 hover:scale-110 active:scale-95 transition-transform"
      >
        {isOpen ? "✕" : <span className="text-2xl">💬</span>}
      </button>
    </div>
  );
}