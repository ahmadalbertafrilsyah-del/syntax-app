// lib/ai.ts
"use server";

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import prisma from "./prisma"; // Penghubung ke MySQL cPanel

// ============================================================================
// FUNGSI INTERNAL: Mengambil Kunci API Aktif dari MySQL
// ============================================================================
async function getActiveApiKey(): Promise<string> {
  try {
    // Mencari API Key yang statusnya aktif di tabel ApiKey MySQL
    const activeKey = await prisma.apiKey.findFirst({
      where: { isActive: true }
    });
      
    if (activeKey && activeKey.value) {
      console.log(`🔑 Menggunakan API Key dari MySQL: [${activeKey.name}]`);
      return activeKey.value;
    }
  } catch (error) {
    console.error("⚠️ Gagal membaca API Key dari MySQL, mencoba fallback ke .env...", error);
  }

  const fallbackKey = process.env.GEMINI_API_KEY;
  if (!fallbackKey) {
    throw new Error("API Key Gemini tidak ditemukan di Database maupun di .env. Hubungi Admin.");
  }
  console.log("🔑 Menggunakan API Key dari .env (Fallback)");
  return fallbackKey;
}

// ============================================================================
// FUNGSI INTERNAL: Mengambil Prompt/Instruksi dari MySQL
// ============================================================================
async function getAdminPrompt(tipeDokumen: string): Promise<string | null> {
  let docId = "";
  if (tipeDokumen.includes("Modul")) docId = "modul_ajar";
  else if (tipeDokumen.includes("RPP")) docId = "rpp";
  else if (tipeDokumen.includes("Alur TP") || tipeDokumen.includes("ATP")) docId = "alur_tp";
  else if (tipeDokumen.includes("PROTA")) docId = "prota";
  else if (tipeDokumen.includes("PROMES")) docId = "promes";
  else if (tipeDokumen.includes("Soal")) docId = "bank_soal";
  else if (tipeDokumen.includes("Rubrik")) docId = "rubrik";
  else return null;

  try {
    const promptData = await prisma.kurikulumPrompt.findUnique({
      where: { id: docId }
    });
    
    if (promptData && promptData.prompt) {
      console.log(`📑 Menggunakan instruksi AI khusus Admin untuk: ${tipeDokumen}`);
      return promptData.prompt;
    }
  } catch (error) {
    console.error("⚠️ Gagal membaca prompt kurikulum admin:", error);
  }
  return null;
}

// ============================================================================
// FITUR 1: GENERATOR PERANGKAT AJAR (SUPER PROMPT ANTI-TERPOTONG)
// ============================================================================
export async function* generatePerangkatAjar(tipe: string, fase: string, mapel: string, topik: string, sumber: string) {
  try {
    console.log(`\n--- MEMULAI PROSES AI (MODE STREAMING) ---`);
    console.log(`Request: ${tipe} | ${mapel} | ${fase} | ${topik} | ${sumber}`);

    const apiKey = await getActiveApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);

    let konteksKurikulum = "Gunakan pengetahuan umum Kurikulum Merdeka.";
    try {
      const faseSingkat = fase.split(" ")[0] + " " + fase.split(" ")[1]; 
      
      // Pencarian RAG di tabel Kurikulum MySQL
      const kurikulumData = await prisma.kurikulum.findFirst({
        where: {
          mapel: mapel,
          fase: faseSingkat
        }
      });
      
      if (kurikulumData) {
        konteksKurikulum = kurikulumData.konten;
        console.log("✅ RAG MySQL Berhasil: Referensi kurikulum ditemukan.");
      }
    } catch (dbError) {
      console.log("⚠️ Menggunakan database pengetahuan bawaan AI...");
    }

    let instruksiSistem = await getAdminPrompt(tipe);
    let profilPelajar = "Profil Pelajar Pancasila (P5)";
    let tambahanInstruksiSumber = "";

    if (sumber === "Kementerian Agama") {
      profilPelajar = "Profil Pelajar Pancasila (P5) dan nilai-nilai Profil Pelajar Rahmatan Lil 'Alamin (PPRA)";
    } else if (sumber === "Muatan Lokal (Dinas Pendidikan)") {
      tambahanInstruksiSumber = "FOKUS RUJUKAN: Sesuaikan materi secara khusus dengan pelestarian budaya, kearifan lokal, dan karakteristik daerah (Muatan Lokal).";
    } else if (sumber === "Pedoman Adiwiyata (KLHK)") {
      tambahanInstruksiSumber = "FOKUS RUJUKAN: Wajib integrasikan materi pembelajaran dengan pedoman Adiwiyata, pelestarian lingkungan hidup, kebersihan, dan ekologi.";
    } else if (sumber === "Standar Industri / SKKNI (SMK)") {
      tambahanInstruksiSumber = "FOKUS RUJUKAN: Sesuaikan kompetensi praktik dengan Standar Kompetensi Kerja Nasional Indonesia (SKKNI) dan kebutuhan industri dunia kerja nyata.";
    } else if (sumber === "Pendidikan Inklusif (PMPK)") {
      tambahanInstruksiSumber = "FOKUS RUJUKAN: Gunakan pendekatan Pendidikan Inklusif. Rancang langkah pembelajaran agar ramah untuk Anak Berkebutuhan Khusus (ABK) namun tetap relevan untuk siswa reguler.";
    }

    if (!instruksiSistem) {
      console.log(`ℹ️ Menggunakan instruksi default (fallback) untuk: ${tipe}`);
      instruksiSistem = ""; 
      
      if (tipe === "PROTA") {
        instruksiSistem = `- FORMAT WAJIB PROTA (Program Tahunan): Buat gambaran umum alokasi waktu 1 tahun. Wajib memuat: 1. Identitas, 2. Capaian Pembelajaran, 3. Daftar Materi/TP, 4. Alokasi Waktu (JP).`;
      } 
      else if (tipe === "PROMES") {
        instruksiSistem = `- FORMAT WAJIB PROMES / PROSEM: Buat dalam format matriks/tabel. Wajib memuat: Identitas, Daftar TP, Alokasi Waktu Total, dan Distribusi Waktu (matriks minggu/bulan).`;
      } 
      else if (tipe === "Analisis TP") {
        instruksiSistem = `- FORMAT WAJIB ANALISIS TP: Bedah CP menjadi TP spesifik dalam format tabel.`;
      } 
      else if (tipe === "Alur TP (ATP)") {
        instruksiSistem = `- FORMAT WAJIB ATP (Alur Tujuan Pembelajaran): Susun urutan TP yang logis dari paling dasar hingga kompleks lengkap dengan alokasi JP.`;
      } 
      else if (tipe === "Modul Ajar (PPM)") {
        instruksiSistem = `- FORMAT WAJIB MODUL AJAR: Lengkap, padat, dan efisien. Jangan bertele-tele agar tidak terpotong. Memuat: 1. Info Umum, 2. Komponen Inti, 3. Lampiran/Asesmen.`;
      } 
      else if (tipe === "RPP") {
        instruksiSistem = `- FORMAT WAJIB RPP: Sangat ringkas, padat, 1 lembar. HANYA memuat: Tujuan, Langkah Inti, dan Penilaian.`;
      }
      else if (tipe === "Bank Soal") {
        instruksiSistem = `- FORMAT WAJIB BANK SOAL: Sertakan Kisi-kisi ringkas, Kumpulan Soal sesuai parameter, dan KUNCI JAWABAN lengkap di akhir.`;
      } 
      else if (tipe === "Rubrik Penilaian") {
        instruksiSistem = `- FORMAT WAJIB RUBRIK PENILAIAN: Buat tabel rubrik dengan kriteria capaian berskala (Mulai Berkembang hingga Mahir).`;
      }
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const prompt = `
      Anda adalah pakar kurikulum dan ahli pendidikan profesional di Indonesia.
      Tugas utama Anda: Buat dokumen "${tipe}" untuk mata pelajaran "${mapel}" pada jenjang "${fase}".
      Integrasi Profil Pelajar Wajib: ${profilPelajar}
      ${tambahanInstruksiSumber}

      INFORMASI MATERI / TOPIK / INSTRUKSI DARI GURU:
      "${topik}"

      REFERENSI KURIKULUM DASAR:
      ${konteksKurikulum}

      ATURAN BAKU & FORMAT PEMBUATAN (WAJIB DIPATUHI 100%):
      ${instruksiSistem}

      ATURAN FORMATTING GLOBAL (SANGAT PENTING):
      - Tuliskan dalam format Markdown yang sangat rapi dan siap cetak.
      - DILARANG KERAS MENGGUNAKAN LATEX (seperti simbol $ atau $$).
      - KHUSUS SOAL PILIHAN GANDA: Setiap opsi jawaban (A, B, C, D) WAJIB ditulis pada baris baru secara vertikal.
      - WAJIB GUNAKAN FORMAT TABEL MARKDOWN untuk bagian-bagian terstruktur.
      - Jika diminta menyertakan Dalil/Teks kutipan, tuliskan teksnya. JANGAN TINGGALKAN KOSONG ("...").
      - EFISIENSI TOKEN: Dilarang berbasa-basi. Tulis langsung pada intinya agar dokumen tuntas.
      - 🚨 PERINTAH MUTLAK ANTI-TERPOTONG: PASTIKAN DOKUMEN DITULIS SAMPAI SELESAI DAN TUNTAS 100%. JANGAN PERNAH BERHENTI DI TENGAH KALIMAT ATAU MENINGGALKAN DOKUMEN MENGGANTUNG TERPOTONG. PASTIKAN BAGIAN AKHIR DOKUMEN/PENUTUP TERCETAK SEMPURNA.
    `;

    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      yield chunk.text();
    }

  } catch (error: any) {
    console.error("🛑 ERROR AI.TS:", error.message || error);
    throw new Error(error.message || "Gagal menghubungi AI. Pastikan API Key valid.");
  }
}

// ============================================================================
// FITUR BARU: PENYAMBUNG TEKS TERPOTONG (CONTINUE GENERATION FAILSAFE)
// ============================================================================
export async function* continueGenerationStream(teksTerakhir: string) {
  try {
    const apiKey = await getActiveApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const potonganTeks = teksTerakhir.length > 1000 ? teksTerakhir.slice(-1000) : teksTerakhir;

    const prompt = `
      Anda sedang menulis dokumen Markdown, namun ketikan Anda TERPOTONG di tengah jalan karena batas karakter memori server.
      TUGAS ANDA: Lanjutkan penulisan dokumen tersebut TEPAT dari titik terpotong hingga selesai dengan sempurna. 
      
      SYARAT MUTLAK: 
      1. JANGAN memberikan kata sapaan atau penjelasan. 
      2. JANGAN mengulang kalimat yang sudah ada di ujung teks. 
      3. Langsung ketik kelanjutan kata/kalimatnya dan selesaikan sisa dokumen.
      
      Berikut adalah ujung kalimat Anda yang terpotong dan menggantung:
      "...${potonganTeks}"
    `;

    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) { 
      yield chunk.text(); 
    }
  } catch (error: any) {
    throw new Error("Gagal menyambung teks AI. Pastikan koneksi internet stabil.");
  }
}

// ============================================================================
// FITUR 2: VISION AI (FOTO JADI SOAL)
// ============================================================================
export async function* generateSoalFromImageStream(base64Data: string, mimeType: string, fase: string, mapel: string) {
  try {
    console.log(`\n--- MEMULAI VISION AI STREAMING ---`);
    console.log(`Request: ${mapel} | ${fase} | Image MimeType: ${mimeType}`);

    const apiKey = await getActiveApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const prompt = `
      Anda adalah asisten pendidikan profesional. Saya memberikan Anda sebuah foto dari halaman buku atau materi pelajaran untuk mata pelajaran "${mapel}" jenjang "${fase}".
      Tugas Anda:
      1. Baca dan pahami teks yang ada di dalam gambar tersebut.
      2. Buatkan RINGKASAN MATERI singkat dari gambar tersebut.
      3. Buatkan 10 SOAL PILIHAN GANDA (A, B, C, D) berdasarkan materi di gambar.
      4. Buatkan 5 SOAL ESAI HOTS (Higher Order Thinking Skills).
      5. Sertakan KUNCI JAWABAN di bagian paling akhir.

      ATURAN FORMATTING GLOBAL (SANGAT PENTING):
      - Tuliskan dalam format Markdown yang rapi. 
      - DILARANG KERAS MENGGUNAKAN LATEX (seperti simbol $ atau $$). Tuliskan persamaan murni menggunakan teks biasa.
      - KHUSUS SOAL PILIHAN GANDA: Setiap opsi jawaban (A, B, C, D) WAJIB diletakkan pada baris yang baru (vertikal ke bawah).
      - Langsung berikan hasilnya tanpa kalimat pengantar.
    `;

    const imagePart = {
      inlineData: { data: base64Data, mimeType: mimeType }
    };

    const result = await model.generateContentStream([prompt, imagePart]);
    for await (const chunk of result.stream) { yield chunk.text(); }
    console.log("✅ Vision AI Berhasil memproses gambar!");

  } catch (error: any) {
    console.error("🛑 ERROR VISION AI:", error.message || error);
    throw new Error(error.message || "Gagal memproses gambar.");
  }
}

// ============================================================================
// FITUR 3: GENERATE MEDIA AI (SCRIPT VIDEO & PROMPT GAMBAR)
// ============================================================================
export async function* generateMediaAIStream(topik: string, mapel: string, fase: string) {
  try {
    const apiKey = await getActiveApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro", 
      generationConfig: { temperature: 0.8 },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const prompt = `
      Buatkan "Ide Media Pendukung Pembelajaran" untuk materi: ${topik} (Mapel: ${mapel}, Fase: ${fase}).
      Berikan output dalam 2 bagian menggunakan format Markdown:
      
      ### 1. Naskah Video Animasi Pembelajaran (Durasi 1 Menit)
      Buat script ringkas berupa list/tabel yang berisi kolom Waktu, Visual (apa yang digambar di layar), dan Audio/Narator (apa yang diucapkan).

      ### 2. Prompt Generator Gambar AI
      Buatkan 2 atau 3 ide prompt mendetail dalam bahasa Inggris (cocok untuk Midjourney/DALL-E) untuk memvisualisasikan konsep ini. Awali dengan: [PROMPT: ...]
    `;

    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) { yield chunk.text(); }
  } catch (error: any) { 
    throw new Error(error.message || "Gagal membuat media pendukung."); 
  }
}

// ============================================================================
// FITUR 4: AI EVALUATOR (AUTO-KOREKTOR ESAI)
// ============================================================================
export async function* evaluateEssayStream(mapel: string, topik: string, kunciJawaban: string, jawabanSiswa: string) {
  try {
    const apiKey = await getActiveApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const prompt = `
      Anda adalah seorang guru mata pelajaran "${mapel}" yang sangat teliti. Topik: "${topik}".
      KUNCI JAWABAN IDEAL: "${kunciJawaban}"
      JAWABAN SISWA: "${jawabanSiswa}"

      Tugas Anda:
      1. Berikan NILAI AKHIR (0-100) di baris atas dengan heading (contoh: # NILAI AKHIR: 85/100).
      2. Berikan ANALISIS KEKUATAN.
      3. Berikan ANALISIS KEKURANGAN.
      4. Berikan SARAN PERBAIKAN.
      DILARANG KERAS MENGGUNAKAN LATEX. Langsung mulai dari Nilai Akhir.
    `;

    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) { yield chunk.text(); }
  } catch (error: any) {
    throw new Error(error.message || "Gagal mengevaluasi jawaban. Silakan coba lagi.");
  }
}

// ============================================================================
// FITUR 5: CHAT ASISTEN MENGAJAR (WIDGET MELAYANG)
// ============================================================================
export async function* chatAssistantStream(history: {role: "user" | "model", parts: {text: string}[]}[], newMessage: string) {
  try {
    const apiKey = await getActiveApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
    });

    const chat = model.startChat({ history: history });
    const promptSistem = `Sebagai 'Asisten Syntax', jawab pesan ini dengan ramah, ringkas, dan fokus membantu guru terkait ide mengajar. Pesan: ${newMessage}`;
    
    const result = await chat.sendMessageStream(promptSistem);
    for await (const chunk of result.stream) { yield chunk.text(); }
  } catch (error: any) {
    throw new Error("Maaf, Asisten Syntax sedang sibuk. Coba beberapa saat lagi.");
  }
}