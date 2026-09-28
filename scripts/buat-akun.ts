/**
 * Skrip pembuatan akun — HANYA untuk developer/pengelola server.
 * Ini satu-satunya jalan membuat akun (termasuk Admin): tidak ada halaman atau endpoint
 * pendaftaran di aplikasi, jadi tidak ada cara membuat akun dari browser.
 *
 * Cara pakai baru (Interaktif):
 *   npx tsx scripts/buat-akun.ts
 *   (Atau jalankan melalui npm script jika sudah dikonfigurasi, mis: npm run akun:buat)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline";

const prisma = new PrismaClient();

// Fungsi untuk menerima input teks yang terlihat di terminal
function tanyaInput(pertanyaan: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(pertanyaan, (jawaban) => {
      rl.close();
      resolve(jawaban.trim());
    });
  });
}

// Fungsi khusus password (input disembunyikan / tidak tampil di layar)
function tanyaPassword(pertanyaan: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let tersembunyi = false;
    (rl as any)._writeToOutput = (teks: string) => {
      if (!tersembunyi) (rl as any).output.write(teks);
    };
    process.stdout.write(pertanyaan);
    tersembunyi = true;
    rl.question("", (jawaban) => {
      rl.close();
      process.stdout.write("\n");
      resolve(jawaban);
    });
  });
}

function keluarDenganPesan(pesan: string): never {
  console.error(`\n❌ ${pesan}\n`);
  process.exit(1);
}

async function main() {
  console.log("=== SISTEM PEMBUATAN AKUN & RESET PASSWORD ===\n");

  // 1. Tanya Username
  const inputUser = await tanyaInput("Masukkan Username: ");
  const username = inputUser.toLowerCase();

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    keluarDenganPesan("Username hanya boleh huruf kecil, angka, titik, garis bawah, atau strip (3–30 karakter).");
  }

  // Cek ke database apakah username sudah ada
  const ada = await prisma.user.findUnique({ where: { username } });
  let isReset = false;
  let nama = "";
  let role = "operator";

  if (ada) {
    // Jika akun ada, alihkan ke mode Reset Password
    console.log(`\n⚠️  Akun dengan username "${username}" sudah terdaftar.`);
    const konfirmasi = await tanyaInput("Apakah Anda ingin mereset password & membuka kuncinya? (y/n): ");
    
    if (konfirmasi.toLowerCase() !== 'y') {
      keluarDenganPesan("Aksi dibatalkan.");
    }
    isReset = true;
  } else {
    // Jika belum ada, buat akun baru
    nama = await tanyaInput("Masukkan Nama Lengkap: ");
    if (!nama) keluarDenganPesan("Nama tidak boleh kosong.");

    const inputRole = await tanyaInput("Masukkan Role (admin / operator) [Kosongkan untuk operator]: ");
    role = inputRole.toLowerCase() || "operator";

    if (role !== "admin" && role !== "operator") {
      keluarDenganPesan('Role tidak valid! Harus "admin" atau "operator".');
    }
  }

  // 2. Setup Password
  console.log(""); // jarak baris
  const password = await tanyaPassword("Masukkan Password (minimal 8 karakter): ");
  if (password.length < 8) keluarDenganPesan("Password terlalu pendek (minimal 8 karakter).");
  
  const ulang = await tanyaPassword("Ulangi Password: ");
  if (password !== ulang) keluarDenganPesan("Password yang diulangi tidak cocok.");

  const passwordHash = await bcrypt.hash(password, 12);

  // 3. Eksekusi ke Database
  if (isReset) {
    await prisma.user.update({
      where: { username },
      data: { passwordHash, gagalLogin: 0, terkunciSampai: null },
    });
    console.log(`\n✅ Password akun "${username}" berhasil diganti dan akun telah di-unlock!\n`);
  } else {
    await prisma.user.create({ data: { username, nama, passwordHash, role } });
    console.log(`\n✅ Akun baru dengan role [${role.toUpperCase()}] berhasil dibuat!`);
    console.log(`Username : ${username}`);
    console.log(`Nama     : ${nama}\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());