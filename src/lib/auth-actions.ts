"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buatToken } from "@/lib/session";
import { simpanSesi, hapusSesi } from "@/lib/auth";
import { amankanNext } from "@/lib/next-url";

const MAKS_GAGAL = 5;
const KUNCI_MENIT = 5;

// Hash tiruan: saat username tidak ditemukan, tetap jalankan bcrypt.compare supaya waktu
// responsnya sama dan orang luar tidak bisa menebak username mana yang ada.
const HASH_TIRUAN = bcrypt.hashSync("tidak-pernah-dipakai", 12);

export async function masuk(formData: FormData): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = amankanNext(String(formData.get("next") ?? ""));

  if (!username || !password) return { error: "Username dan password wajib diisi." };

  const user = await prisma.user.findUnique({ where: { username } });

  if (user?.terkunciSampai && user.terkunciSampai > new Date()) {
    const menit = Math.ceil((user.terkunciSampai.getTime() - Date.now()) / 60000);
    return { error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${menit} menit.` };
  }

  const cocok = await bcrypt.compare(password, user?.passwordHash ?? HASH_TIRUAN);

  if (!user || !user.aktif || !cocok) {
    if (user) {
      const gagal = user.gagalLogin + 1;
      await prisma.user.update({
        where: { id: user.id },
        data:
          gagal >= MAKS_GAGAL
            ? { gagalLogin: 0, terkunciSampai: new Date(Date.now() + KUNCI_MENIT * 60000) }
            : { gagalLogin: gagal },
      });
    }
    return { error: "Username atau password salah." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { gagalLogin: 0, terkunciSampai: null } });
  simpanSesi(await buatToken({ uid: user.id, role: user.role }));

  redirect(next);
}

export async function keluar(): Promise<void> {
  hapusSesi();
  redirect("/login");
}
