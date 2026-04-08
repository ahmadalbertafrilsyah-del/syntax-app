import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext"; // Import Provider yang baru dibuat

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Syntax App - Sistem AI Naskah & Tata Ajar eXpress",
  description: "Platform cerdas berbasis AI untuk mempermudah guru merancang modul, RPP, dan bank soal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        {/* Bungkus seluruh aplikasi dengan AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}