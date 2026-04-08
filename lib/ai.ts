// lib/ai.ts
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

// PERHATIKAN: Ada tanda bintang (*) setelah function. Ini menandakan Async Generator untuk Streaming!
export async function* generatePerangkatAjar(tipe: string, fase: string, mapel: string, topik: string, sumber: string) {
  try {
    console.log(`\n--- MEMULAI PROSES AI (MODE STREAMING) ---`);
    console.log(`Request: ${tipe} | ${mapel} | ${fase} | ${topik} | ${sumber}`);

    // 1. CEK API KEY DULU
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("🛑 ERROR: GEMINI_API_KEY KOSONG ATAU TIDAK TERDETEKSI!");
      throw new Error("API Key Gemini tidak ditemukan. Tolong matikan terminal (Ctrl+C) dan ketik 'npm run dev' lagi.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. PROSES RAG (Pencarian Kurikulum)
    let konteksKurikulum = "Gunakan pengetahuan umum Kurikulum Merdeka.";
    
    try {
      const faseSingkat = fase.split(" ")[0] + " " + fase.split(" ")[1]; 
      const q = query(
        collection(db, "kurikulum"), 
        where("mapel", "==", mapel),
        where("fase", "==", faseSingkat),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        konteksKurikulum = querySnapshot.docs[0].data().konten;
        console.log("✅ RAG Firebase Berhasil: Referensi kurikulum ditemukan.");
      } else {
        console.log("⚠️ RAG Info: Tidak ada data kurikulum spesifik di database. Memakai pengetahuan bawaan AI.");
      }
    } catch (firebaseError) {
      console.error("⚠️ RAG Error (Firebase gagal dipanggil dari server):", firebaseError);
      console.log("Lanjut ke pembuatan AI tanpa RAG...");
    }

    // 3. MENYUSUN INSTRUKSI KHUSUS
    let instruksiSistem = "";

    if (sumber === "Kementerian Agama") {
      instruksiSistem += "\n- WAJIB integrasikan nilai-nilai Moderasi Beragama dan nilai Keislaman (Rahmatan Lil 'Alamin) ke dalam materi atau kegiatan.";
    } else {
      instruksiSistem += "\n- WAJIB integrasikan penguatan Profil Pelajar Pancasila (P5) yang relevan.";
    }

    if (tipe === "Modul Ajar (PPM)" || tipe === "RPP") {
      instruksiSistem += "\n- Format Wajib: Identitas Umum, Kompetensi Awal, Tujuan Pembelajaran, Pemahaman Bermakna, Pertanyaan Pemantik, Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup), dan Asesmen.";
    } 
    else if (tipe === "Analisis TP" || tipe === "Alur TP (ATP)") {
      instruksiSistem += "\n- Format Wajib: Buat tabel atau urutan logis penjabaran dari Capaian Pembelajaran (CP) menjadi beberapa Tujuan Pembelajaran (TP), dan susun menjadi Alur Tujuan Pembelajaran (ATP) yang berkesinambungan.";
    } 
    else if (tipe === "PROMES") {
      instruksiSistem += "\n- Format Wajib: Buat rancangan Program Semester. Susun tabel alokasi waktu per minggu/bulan selama satu semester untuk topik tersebut.";
    } 
    else if (tipe === "PROTA") {
      instruksiSistem += "\n- Format Wajib: Buat rancangan Program Tahunan. Susun alokasi waktu (Jam Pelajaran) selama satu tahun penuh untuk topik dan sub-topik yang relevan.";
    } 
    else if (tipe === "Bank Soal") {
      instruksiSistem += "\n- Format Wajib: Buat 10 soal Pilihan Ganda (A, B, C, D) dan 5 Soal Esai HOTS (Higher Order Thinking Skills). Berikan Kunci Jawaban dan Pembahasannya di bagian paling bawah.";
    } 
    else if (tipe === "Rubrik Penilaian") {
      instruksiSistem += "\n- Format Wajib: Buat tabel rubrik penilaian dengan kriteria tingkat pencapaian (misal: Sangat Baik, Baik, Cukup, Perlu Bimbingan) beserta deskripsi indikator yang jelas untuk topik ini.";
    }

    // 4. PROSES GENERASI AI (MODE STREAMING)
    console.log("Menghubungi server Google Gemini...");
    // Menggunakan gemini-1.5-flash karena ini versi paling stabil dan cepat untuk streaming
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Anda adalah ahli pendidikan dan penyusun kurikulum profesional di Indonesia untuk ${sumber}.
      Tugas utama Anda: Buat dokumen "${tipe}" untuk mata pelajaran "${mapel}" pada jenjang "${fase}" tentang topik "${topik}".

      REFERENSI WAJIB (Pedoman CP/Materi Dasar):
      ${konteksKurikulum}

      INSTRUKSI FORMAT & ATURAN WAJIB:
      ${instruksiSistem}
      - Tuliskan dalam format Markdown yang rapi (gunakan heading, tabel Markdown, atau list jika diperlukan).
      - Jangan berikan kalimat pengantar atau basa-basi (seperti "Berikut adalah dokumennya..."), langsung mulai dari Judul Dokumen di baris pertama.
    `;

    // INI KUNCI STREAMING-NYA: generateContentStream
    const result = await model.generateContentStream(prompt);
    
    // Perulangan untuk mengirim teks potongan demi potongan (chunk) ke frontend
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText; // yield akan langsung melempar teks ke layar tanpa menunggu selesai
    }

    console.log("✅ AI Berhasil menyelesaikan streaming dokumen!");

  } catch (error: any) {
    console.error("🛑 ERROR FATAL AI.TS:", error.message || error);
    throw new Error(error.message || "Gagal menghubungi AI. Silakan cek terminal VS Code.");
  }
}

// ============================================================================
// FITUR 2: VISION AI (FOTO JADI SOAL)
// ============================================================================
export async function* generateSoalFromImageStream(base64Data: string, mimeType: string, fase: string, mapel: string) {
  try {
    console.log(`\n--- MEMULAI VISION AI STREAMING ---`);
    console.log(`Request: ${mapel} | ${fase} | Image MimeType: ${mimeType}`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key Gemini tidak ditemukan.");

    const genAI = new GoogleGenerativeAI(apiKey);
    // Gemini 1.5 Flash sangat brilian dalam membaca gambar
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Anda adalah asisten pendidikan profesional. Saya memberikan Anda sebuah foto dari halaman buku atau materi pelajaran untuk mata pelajaran "${mapel}" jenjang "${fase}".
      Tugas Anda:
      1. Baca dan pahami teks yang ada di dalam gambar tersebut.
      2. Buatkan RINGKASAN MATERI singkat dari gambar tersebut.
      3. Buatkan 10 SOAL PILIHAN GANDA (A, B, C, D) berdasarkan materi di gambar.
      4. Buatkan 5 SOAL ESAI HOTS (Higher Order Thinking Skills).
      5. Sertakan KUNCI JAWABAN di bagian paling akhir.

      Tuliskan dalam format Markdown yang rapi. Langsung berikan hasilnya tanpa kalimat pengantar.
    `;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    // Memasukkan prompt Teks dan Gambar sekaligus ke dalam AI
    const result = await model.generateContentStream([prompt, imagePart]);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }

    console.log("✅ Vision AI Berhasil memproses gambar!");

  } catch (error: any) {
    console.error("🛑 ERROR VISION AI:", error.message || error);
    throw new Error(error.message || "Gagal memproses gambar. Pastikan format gambar valid (JPG/PNG).");
  }
}

// ============================================================================
// FITUR 3: AI EVALUATOR (AUTO-KOREKTOR ESAI)
// ============================================================================
export async function* evaluateEssayStream(mapel: string, topik: string, kunciJawaban: string, jawabanSiswa: string) {
  try {
    console.log(`\n--- MEMULAI AI EVALUATOR STREAMING ---`);
    console.log(`Request: Evaluasi Esai | ${mapel} | ${topik}`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key Gemini tidak ditemukan.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Anda adalah seorang guru mata pelajaran "${mapel}" yang sangat teliti, objektif, dan bijaksana.
      Materi/Topik saat ini adalah: "${topik}".

      Berikut adalah KUNCI JAWABAN IDEAL dari Anda:
      "${kunciJawaban}"

      Berikut adalah JAWABAN SISWA yang harus Anda evaluasi:
      "${jawabanSiswa}"

      Tugas Anda:
      1. Bandingkan jawaban siswa dengan kunci jawaban secara kritis.
      2. Berikan NILAI AKHIR dalam skala 0 sampai 100. Tampilkan nilai ini di baris paling atas dengan format tebal dan besar (Gunakan heading Markdown, contoh: # NILAI AKHIR: 85/100).
      3. Berikan ANALISIS KEKUATAN: Apa saja yang sudah dijawab dengan benar atau dipahami dengan baik oleh siswa?
      4. Berikan ANALISIS KEKURANGAN: Poin penting apa dari kunci jawaban yang terlewat, salah, atau kurang dijelaskan oleh siswa?
      5. Berikan SARAN PERBAIKAN: Kalimat penyemangat dan apa yang harus dipelajari siswa ke depannya.

      Tuliskan hasil evaluasi Anda dalam format Markdown yang rapi, profesional, dan mudah dibaca. Langsung mulai dari Nilai Akhir tanpa kalimat pengantar.
    `;

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }

    console.log("✅ AI Evaluator Berhasil menilai esai!");

  } catch (error: any) {
    console.error("🛑 ERROR AI EVALUATOR:", error.message || error);
    throw new Error(error.message || "Gagal mengevaluasi jawaban. Silakan coba lagi.");
  }
}

// ============================================================================
// FITUR 4: CHAT ASISTEN MENGAJAR (WIDGET MELAYANG)
// ============================================================================
export async function* chatAssistantStream(history: {role: "user" | "model", parts: {text: string}[]}[], newMessage: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key Gemini tidak ditemukan.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Memulai sesi chat dengan menyertakan riwayat percakapan sebelumnya
    const chat = model.startChat({
      history: history,
    });

    // Mengirim pesan baru dengan instruksi sistem tersembunyi agar AI bertindak sebagai Asisten Guru
    const promptSistem = `Sebagai 'Asisten Syntax', jawab pesan ini dengan ramah, ringkas, dan fokus membantu guru terkait ide mengajar/pendidikan. Pesan: ${newMessage}`;
    
    const result = await chat.sendMessageStream(promptSistem);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }

  } catch (error: any) {
    console.error("🛑 ERROR CHAT ASISTEN:", error.message || error);
    throw new Error("Maaf, Asisten Syntax sedang sibuk. Coba beberapa saat lagi.");
  }
}