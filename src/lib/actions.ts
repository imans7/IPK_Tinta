"use server";

import { prisma } from "@/lib/prisma";
import { LOKASI_KOLOM, LOKASI_BARIS, LOKASI_KEDALAMAN } from "@/lib/lokasi";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type KomposisiInput = { warnaDasar: string; persentase: number };

// ---------- TINTA (tambah / edit) ----------

export async function simpanTinta(formData: FormData): Promise<{ id?: number; error?: string }> {
  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;

  const namaCustomer = String(formData.get("namaCustomer") ?? "").trim();
  const namaCetakan = String(formData.get("namaCetakan") ?? "").trim();
  const tcPantone = String(formData.get("tcPantone") ?? "").trim();
  const jumlahStock = Number(formData.get("jumlahStock") ?? 0);
  const lokasiKolom = String(formData.get("lokasiKolom") ?? "");
  const lokasiBaris = String(formData.get("lokasiBaris") ?? "");
  const lokasiKedalaman = Number(formData.get("lokasiKedalaman") ?? 0);
  const komposisi: KomposisiInput[] = JSON.parse(String(formData.get("komposisi") ?? "[]"));

  if (!namaCustomer || !namaCetakan) return { error: "Nama customer dan nama cetakan wajib diisi." };
  if (!lokasiKolom || !lokasiBaris || !lokasiKedalaman) return { error: "Lokasi rak wajib dipilih lengkap." };
  if (
    !(LOKASI_KOLOM as readonly string[]).includes(lokasiKolom) ||
    !(LOKASI_BARIS as readonly string[]).includes(lokasiBaris) ||
    !(LOKASI_KEDALAMAN as readonly number[]).includes(lokasiKedalaman)
  ) {
    return { error: "Pilihan lokasi rak tidak valid." };
  }
  if (komposisi.length === 0) return { error: "Komposisi warna wajib diisi minimal satu." };

  const totalPersen = komposisi.reduce((sum, k) => sum + Number(k.persentase || 0), 0);
  if (totalPersen !== 100) return { error: `Total komposisi warna harus 100% (saat ini ${totalPersen}%).` };

  // Upload foto ke Cloudinary
  let gambarProduk = String(formData.get("fotoLama") ?? "") || null;
  const foto = formData.get("foto") as File | null;
  
  if (foto && foto.size > 0) {
    const buffer = Buffer.from(await foto.arrayBuffer());
    const base64Image = `data:${foto.type};base64,${buffer.toString("base64")}`;

    try {
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "gudang_tinta",
      });

      // Jika ada gambar lama dan itu dari Cloudinary, hapus gambar lamanya
      if (gambarProduk && gambarProduk.includes("cloudinary.com")) {
        const urlParts = gambarProduk.split("/");
        const fileName = urlParts.pop()?.split(".")[0];
        const folderName = urlParts.pop();
        if (fileName && folderName) {
          await cloudinary.uploader.destroy(`${folderName}/${fileName}`).catch(() => {});
        }
      }

      gambarProduk = uploadResult.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      return { error: "Gagal mengunggah gambar ke server." };
    }
  }

  const data = {
    namaCustomer,
    namaCetakan,
    tcPantone: tcPantone || null,
    jumlahStock,
    gambarProduk,
    lokasiKolom,
    lokasiBaris,
    lokasiKedalaman,
  };

  const tinta = id
    ? await prisma.tinta.update({ where: { id }, data })
    : await prisma.tinta.create({ data });

  await prisma.komposisiTinta.deleteMany({ where: { tintaId: tinta.id } });
  await prisma.komposisiTinta.createMany({
    data: komposisi.map((k) => ({ tintaId: tinta.id, warnaDasar: k.warnaDasar, persentase: Number(k.persentase) })),
  });

  revalidatePath("/tinta");
  revalidatePath("/");
  revalidatePath("/peminjaman");

  return { id: tinta.id };
}

export async function hapusTinta(id: number): Promise<{ error?: string }> {
  const tinta = await prisma.tinta.findUnique({ where: { id } });
  if (!tinta) return { error: "Tinta tidak ditemukan." };

  const masihDipinjam = await prisma.transaksiPeminjaman.findFirst({
    where: { tintaId: id, status: "dipinjam" },
  });
  if (masihDipinjam) return { error: "Tinta ini masih dalam status dipinjam dan tidak bisa dihapus." };

  // Hapus gambar dari Cloudinary
  if (tinta.gambarProduk && tinta.gambarProduk.includes("cloudinary.com")) {
    const urlParts = tinta.gambarProduk.split("/");
    const fileName = urlParts.pop()?.split(".")[0];
    const folderName = urlParts.pop();
    if (fileName && folderName) {
      await cloudinary.uploader.destroy(`${folderName}/${fileName}`).catch(() => {});
    }
  }

  await prisma.tinta.delete({ where: { id } });
  revalidatePath("/tinta");
  revalidatePath("/");

  return {};
}

// ---------- PEMINJAMAN ----------

export async function cariTinta(keyword: string) {
  if (!keyword.trim()) return [];

  return prisma.tinta.findMany({
    where: {
      OR: [
        { namaCustomer: { contains: keyword } },
        { namaCetakan: { contains: keyword } },
        { tcPantone: { contains: keyword } },
      ],
    },
    include: { komposisi: true },
    take: 8,
  });
}

export async function catatPeminjaman(tintaId: number, namaPeminjam: string): Promise<{ error?: string }> {
  if (!namaPeminjam.trim()) return { error: "Nama peminjam wajib diisi." };

  const tinta = await prisma.tinta.findUnique({ where: { id: tintaId } });
  if (!tinta) return { error: "Tinta tidak ditemukan." };
  if (Number(tinta.jumlahStock) <= 0) return { error: "Stok tinta ini sedang habis / tidak tersedia." };

  await prisma.transaksiPeminjaman.create({
    data: {
      tintaId,
      namaPeminjam: namaPeminjam.trim(),
      beratPinjam: tinta.jumlahStock,
      tanggalPinjam: new Date(),
      status: "dipinjam",
    },
  });

  revalidatePath("/");
  revalidatePath("/pengembalian");

  return {};
}

// ---------- PENGEMBALIAN ----------

export async function konfirmasiPengembalian(
  transaksiId: number,
  beratKembali: number
): Promise<{ error?: string }> {
  const trx = await prisma.transaksiPeminjaman.findUnique({ where: { id: transaksiId } });
  if (!trx) return { error: "Transaksi tidak ditemukan." };
  if (Number.isNaN(beratKembali) || beratKembali < 0) return { error: "Berat hasil timbang tidak valid." };

  const beratTerpakai = Number((Number(trx.beratPinjam) - beratKembali).toFixed(2));

  await prisma.$transaction([
    prisma.transaksiPeminjaman.update({
      where: { id: transaksiId },
      data: {
        beratKembali,
        beratTerpakai,
        tanggalKembali: new Date(),
        status: "selesai",
      },
    }),
    prisma.tinta.update({
      where: { id: trx.tintaId },
      data: { jumlahStock: beratKembali },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/pengembalian");
  revalidatePath("/tinta");

  return {};
}