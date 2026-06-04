"use server";

import prisma from "@/lib/prisma";

export async function saveDokumen(data: any) {
  try {
    const newDoc = await prisma.dokumen.create({
      data: {
        id_user: data.id_user,
        sumber: data.sumber,
        tipe: data.tipe,
        fase: data.fase,
        mapel: data.mapel,
        topik: data.topik,
        konten_ai: data.konten_ai,
        namaSekolah: data.namaSekolah,
        kotaSekolah: data.kotaSekolah,
        namaKepsek: data.namaKepsek,
        nipKepsek: data.nipKepsek,
        namaGuru: data.namaGuru,
        nipGuru: data.nipGuru,
      }
    });

    await prisma.user.update({
      where: { id: data.id_user },
      data: { sisa_kuota: { decrement: 1 } }
    });

    return newDoc.id;
  } catch (error) {
    console.error("Gagal menyimpan dokumen ke MySQL:", error);
    throw new Error("Gagal menyimpan dokumen");
  }
}

export async function updateDokumenKonten(docId: string, konten: string) {
  try {
    await prisma.dokumen.update({
      where: { id: docId },
      data: { konten_ai: konten }
    });
    return true;
  } catch (error) {
    console.error("Gagal update dokumen di MySQL:", error);
    throw new Error("Gagal update dokumen");
  }
}

export async function syncUserToDatabase(uid: string, email: string, nama: string) {
  try {
    let user = await prisma.user.findUnique({
      where: { id: uid }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uid,
          email: email,
          nama: nama,
          role: "guru",
          sisa_kuota: 50,
        }
      });
    }
    return true;
  } catch (error) {
    console.error("Gagal sinkronisasi user ke MySQL:", error);
    throw new Error("Gagal menyimpan data user");
  }
}