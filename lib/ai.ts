// lib/ai.ts
"use server";

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { db } from "./firebase";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";

// ============================================================================
// FUNGSI INTERNAL: Mengambil Kunci API Aktif dari Firestore (Diatur oleh Admin)
// ============================================================================
async function getActiveApiKey(): Promise<string> {
  try {
    const settingsDoc = await getDoc(doc(db, "settings", "api_keys"));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      const activeId = data.activeKeyId;
      const keysArray = data.keys || [];
      
      const activeKeyObj = keysArray.find((k: any) => k.id === activeId);
      
      if (activeKeyObj && activeKeyObj.value) {
        console.log(`🔑 Menggunakan API Key dari Database: [${activeKeyObj.name}]`);
        return activeKeyObj.value;
      }
    }
  } catch (error) {
    console.error("⚠️ Gagal membaca API Key dari Firebase, mencoba fallback ke .env...", error);
  }

  const fallbackKey = process.env.GEMINI_API_KEY;
  if (!fallbackKey) {
    throw new Error("API Key Gemini tidak ditemukan di Database maupun di .env. Hubungi Admin.");
  }
  console.log("🔑 Menggunakan API Key dari .env (Fallback)");
  return fallbackKey;
}

// ============================================================================
// FUNGSI INTERNAL: Mengambil Prompt/Instruksi dari Manajemen Kurikulum Admin
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
    const docRef = doc(db, "kurikulum_prompts", docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().prompt) {
      console.log(`📑 Menggunakan instruksi AI khusus Admin untuk: ${tipeDokumen}`);
      return docSnap.data().prompt;
    }
  } catch (error) {
    console.error("⚠️ Gagal membaca prompt kurikulum admin:", error);
  }
  return null;
}

// ============================================================================
// FITUR 1: GENERATOR PERANGKAT AJAR (SUPER PROMPT: STANDAR NASIONAL)
// ============================================================================
export async function* generatePerangkatAjar(tipe: string, fase: string, mapel: string, topik: string, sumber: string) {
  try {
    console.log(`\n--- MEMULAI PROSES AI (MODE STREAMING) ---`);
    console.log(`Request: ${tipe} | ${mapel} | ${fase} | ${topik} | ${sumber}`);

    const apiKey = await getActiveApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);

    // 1. PROSES RAG (Pencarian Kurikulum di Firebase)
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
      }
    } catch (firebaseError) {
      console.log("⚠️ Menggunakan database pengetahuan bawaan AI...");
    }

    // 2. CEK INSTRUKSI ADMIN DI FIREBASE TERLEBIH DAHULU
    let instruksiSistem = await getAdminPrompt(tipe);

    // Profil Pelajar & Fokus Referensi Dinamis
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

    // JIKA ADMIN BELUM MENGISI PROMPT, GUNAKAN FALLBACK (KODINGAN LAMA ANDA)
    if (!instruksiSistem) {
      console.log(`ℹ️ Menggunakan instruksi default (fallback) untuk: ${tipe}`);
      instruksiSistem = ""; // Reset string
      
      if (tipe === "PROTA") {
        instruksiSistem = `- FORMAT WAJIB PROTA (Program Tahunan):
          Buat gambaran umum alokasi waktu 1 tahun. Wajib memuat:
          1. Identitas: Mata pelajaran, satuan pendidikan, fase/kelas, tahun pelajaran.
          2. Capaian Pembelajaran (CP): Target kompetensi di akhir fase.
          3. Daftar Materi/Tujuan Pembelajaran (TP): Rincian materi pokok.
          4. Alokasi Waktu (JP): Total Jam Pelajaran untuk setiap TP selama satu tahun.`;
      } 
      else if (tipe === "PROMES") {
        instruksiSistem = `- FORMAT WAJIB PROMES / PROSEM (Program Semester):
          Buat dalam format matriks/tabel. Wajib memuat:
          1. Identitas: Mata pelajaran, kelas, semester, tahun pelajaran.
          2. Daftar Tujuan Pembelajaran (TP) & Materi Pokok.
          3. Alokasi Waktu Total: Jam pelajaran per materi.
          4. Distribusi Waktu: Matriks/tabel pemetaan materi ke minggu ke-1, ke-2, dst. pada setiap bulan dalam semester tersebut.
          5. Keterangan: Penanda untuk masa ujian, hari libur, dll.`;
      } 
      else if (tipe === "Analisis TP") {
        instruksiSistem = `- FORMAT WAJIB ANALISIS TP:
          Bedah CP menjadi TP yang spesifik. Wajib memuat:
          1. Elemen CP: Bagian spesifik dari CP.
          2. Kompetensi (Kata Kerja): Keterampilan yang harus dikuasai (misal: menganalisis, merancang).
          3. Lingkup Materi: Konten/ilmu pengetahuan utama.
          4. Rumusan TP: Kalimat gabungan antara kompetensi dan lingkup materi.`;
      } 
      else if (tipe === "Alur TP (ATP)") {
        instruksiSistem = `- FORMAT WAJIB ATP (Alur Tujuan Pembelajaran):
          Wajib memuat:
          1. Identitas Lengkap.
          2. Urutan Tujuan Pembelajaran (TP): Susun logis dari yang paling dasar hingga paling kompleks.
          3. Alokasi Waktu: Estimasi JP untuk tiap TP.
          4. Profil Pelajar: Cantumkan dimensi ${profilPelajar} yang relevan pada tiap TP.`;
      } 
      else if (tipe === "Modul Ajar (PPM)") {
        instruksiSistem = `- FORMAT WAJIB MODUL AJAR:
          Wajib memuat 3 komponen utama:
          1. Informasi Umum: Identitas, Kompetensi Awal, Sarpras, Target Peserta Didik, dan integrasi ${profilPelajar}.
          2. Komponen Inti: Tujuan, Pemahaman Bermakna, Pertanyaan Pemantik, Langkah Pembelajaran (Pendahuluan, Inti, Penutup), dan Rencana Asesmen.
          => SANGAT PENTING PADA LANGKAH INTI: WAJIB jabarkan strategi Pembelajaran Berdiferensiasi (Diferensiasi Konten/Proses) yang secara spesifik memfasilitasi 3 gaya belajar sekaligus: Visual, Auditori, dan Kinestetik.
          3. Lampiran: Contoh LKPD, Bahan Bacaan, Glosarium, Daftar Pustaka.`;
      } 
      else if (tipe === "RPP") {
        instruksiSistem = `- FORMAT WAJIB RPP:
          Wajib memuat:
          1. Identitas: Kelas, mata pelajaran, alokasi waktu.
          2. Tujuan Pembelajaran (TP).
          3. Langkah-langkah Pembelajaran: Urutan kegiatan (pembukaan, inti, penutup).
          => SANGAT PENTING PADA LANGKAH INTI: WAJIB jabarkan strategi Pembelajaran Berdiferensiasi untuk 3 gaya belajar: Visual, Auditori, dan Kinestetik.
          4. Penilaian (Asesmen): Cara menilai ketercapaian tujuan.`;
      }
      else if (tipe === "Bank Soal") {
        instruksiSistem = `- FORMAT WAJIB BANK SOAL:
          Wajib memuat:
          1. Kisi-kisi Soal: Pemetaan TP, indikator soal, bentuk soal, dan tingkat kesukaran (C1-C6).
          2. Kumpulan Butir Soal: Sediakan ragam instrumen (Pilihan Ganda, Isian Singkat, Esai) dalam jumlah yang banyak/fleksibel.
          3. Kunci Jawaban.`;
      } 
      else if (tipe === "Rubrik Penilaian") {
        instruksiSistem = `- FORMAT WAJIB RUBRIK PENILAIAN:
          Buat panduan scoring dalam bentuk tabel. Wajib memuat:
          1. Aspek/Kriteria yang Dinilai (misal: keakuratan konten, kreativitas).
          2. Skala Capaian: Gunakan skala "Mulai Berkembang", "Layak", "Cakap", "Mahir".
          3. Deskripsi Indikator: Penjelasan spesifik pada setiap skala.`;
      }
    }

    // 3. PROSES GENERASI AI (MODE STREAMING)
    console.log("Menghubungi Google Gemini 2.5 Pro...");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        maxOutputTokens: 8192, // Napas panjang untuk dokumen 8000 kata
        temperature: 0.7,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
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
      - DILARANG KERAS MENGGUNAKAN LATEX (seperti simbol $ atau $$) untuk rumus matematika atau variabel! Gunakan teks biasa.
      - KHUSUS SOAL PILIHAN GANDA: Setiap opsi jawaban (A, B, C, D) WAJIB ditulis pada baris baru secara vertikal.
      - WAJIB GUNAKAN FORMAT TABEL MARKDOWN untuk bagian-bagian terstruktur (seperti Informasi Umum, Rencana Asesmen, PROTA, PROMES, atau Rubrik Penilaian). 
      - Pastikan setiap tabel memiliki header kolom (contoh: | No | Kriteria | Deskripsi |). DILARANG membuat tabel yang hanya berisi satu kolom.
      - Jangan berikan kalimat pengantar. Langsung tuliskan Judul Dokumen di baris pertama dengan Heading 1 (# Judul).
    `;

    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      yield chunk.text();
    }

    console.log("✅ Dokumen berstandar nasional berhasil di-generate!");

  } catch (error: any) {
    console.error("🛑 ERROR AI.TS:", error.message || error);
    throw new Error(error.message || "Gagal menghubungi AI. Pastikan API Key valid.");
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
      generationConfig: {
        maxOutputTokens: 8192, // Napas panjang untuk dokumen 8000 kata
        temperature: 0.7,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
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
      - DILARANG KERAS MENGGUNAKAN LATEX (seperti simbol $ atau $$) untuk rumus matematika atau variabel! Tuliskan persamaan murni menggunakan teks biasa agar mudah dibaca di WhatsApp atau Word (Contoh: 3x - 2y = 12).
      - KHUSUS SOAL PILIHAN GANDA: Setiap opsi jawaban (A, B, C, D) WAJIB diletakkan pada baris yang baru (vertikal ke bawah), BUKAN menyamping di baris yang sama dengan soal.
      - Langsung berikan hasilnya tanpa kalimat pengantar.
    `;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

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

    const apiKey = await getActiveApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        maxOutputTokens: 8192, // Napas panjang untuk dokumen 8000 kata
        temperature: 0.7,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

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

      ATURAN FORMATTING GLOBAL:
      - Tuliskan hasil evaluasi Anda dalam format Markdown yang rapi, profesional, dan mudah dibaca. 
      - DILARANG KERAS MENGGUNAKAN LATEX (seperti simbol $ atau $$) untuk penulisan angka atau rumus matematika! Tuliskan dalam teks biasa.
      - Langsung mulai dari Nilai Akhir tanpa kalimat pengantar.
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
    const apiKey = await getActiveApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        maxOutputTokens: 8192, // Napas panjang untuk dokumen 8000 kata
        temperature: 0.7,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const chat = model.startChat({
      history: history,
    });

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