# GudangTinta (Next.js + Prisma)

Versi Node.js dari aplikasi manajemen stok & peminjaman tinta cetakan.
Dibangun full-stack dalam satu project pakai **Next.js 14 (App Router)**
dan **Prisma** sebagai ORM. Ini adalah rewrite langsung dari versi
Laravel/Livewire sebelumnya — fitur dan aturan bisnisnya sama persis.

## 1. Instal dependency

```bash
npm install
```

## 2. Setup database

Salin `.env.example` jadi `.env`, lalu sesuaikan `DATABASE_URL` dengan
MySQL kamu:

```bash
cp .env.example .env
```

```
DATABASE_URL="mysql://root:@localhost:3306/gudang_tinta"
```

Pastikan database `gudang_tinta` sudah dibuat di MySQL (lewat
phpMyAdmin/HeidiSQL/dsb) sebelum lanjut.

## 3. Buat tabel + isi data dummy

```bash
npx prisma db push      # buat tabel sesuai prisma/schema.prisma
npm run seed             # isi data dummy (8 tinta contoh + riwayat 6 bulan)
```

Kalau nanti skema berubah dan mau pakai migration history (bukan cuma
db push), pakai `npm run db:migrate` sebagai gantinya.

## 4. Jalankan

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Struktur penting

```
prisma/schema.prisma        → skema database (setara migration Laravel)
prisma/seed.ts               → data dummy (setara TintaSeeder.php)
src/lib/prisma.ts            → koneksi Prisma (singleton)
src/lib/format.ts            → helper: kode lokasi, ringkasan komposisi, dll
src/lib/actions.ts           → Server Actions — semua logika simpan/hapus/
                                pinjam/kembalikan ada di sini (setara Model
                                + Controller di Laravel)
src/app/(app)/               → semua halaman yang butuh login (Dashboard, tinta/,
                                peminjaman/, pengembalian/); layout-nya memeriksa sesi
src/app/login/               → halaman login
src/middleware.ts            → tolak akses tanpa sesi sah (lapisan pertama)
src/lib/session.ts           → buat/baca token sesi (JWT)
src/lib/auth.ts              → user yang login, wajibLogin(), wajibAdmin()
src/lib/auth-actions.ts      → aksi masuk & keluar
scripts/buat-akun.ts         → pembuatan akun (khusus developer, lewat terminal)
src/app/api/export/          → Export Excel (pakai ExcelJS)
src/app/api/dipinjam/        → Data untuk halaman Pengembalian
```

## Catatan alur bisnis (sama seperti versi Laravel)

- **Berat saat pinjam**: diambil otomatis dari `jumlahStock` tinta saat
  tombol "Catat Peminjaman" ditekan — operator tidak input angka apa pun.
- **Berat saat kembali**: operator input hasil timbang ulang di halaman
  Pengembalian. Sistem hitung `beratTerpakai = beratPinjam - beratKembali`,
  lalu `jumlahStock` tinta di-update jadi hasil timbang ulang itu
  (lihat `konfirmasiPengembalian` di `src/lib/actions.ts`).
- **Validasi komposisi warna**: total persentase harus tepat 100%
  sebelum tinta bisa disimpan — divalidasi di client (`TintaForm.tsx`)
  dan sekali lagi di server (`simpanTinta` di `actions.ts`).
- **Foto produk**: disimpan sebagai file fisik di `public/uploads/tinta/`,
  path-nya disimpan di kolom `gambarProduk`. Untuk production sungguhan,
  sebaiknya pindah ke storage cloud (S3, Cloudinary, dll) karena
  filesystem di banyak platform hosting Node.js bersifat sementara.
- **Login & role**: lihat bagian "Login & akun" di bawah.

## Perbedaan kecil dari versi Laravel

- Live-search di Daftar Tinta pakai submit form biasa (tekan Enter),
  bukan pencarian sambil mengetik seperti versi Livewire — supaya tetap
  server-rendered tanpa API tambahan. Kalau mau live-search juga di
  sana, tinggal contek pola yang sudah dipakai di halaman Peminjaman
  (client component + Server Action `cariTinta`).
- Belum ada pagination di tabel — untuk data ribuan baris sebaiknya
  ditambahkan (`skip`/`take` di Prisma + komponen paginasi).

## Modul pengelolaan tinta — pembaruan terbaru

- **Daftar Tinta**: ada tombol **Pinjam Tinta** di tiap baris/kartu. Tombol ini membuka
  `/peminjaman?tinta=ID` dengan tinta tersebut sudah terpilih. Untuk tinta yang stoknya 0,
  tombolnya diganti label "Stok habis".
- **Filter nama customer**: dropdown berisi semua nama customer (unik, urut abjad), jadi
  tidak perlu mengingat ejaannya. Bisa dikombinasikan dengan kotak pencarian, ada tombol
  "Reset filter".
- **Urutan**: stok paling sedikit di paling atas (`orderBy jumlahStock asc`). Tinta dengan
  stok <= 1 kg diberi label "Menipis" (batas ada di `AMBANG_STOK_HABIS`, `src/lib/format.ts`,
  dipakai juga oleh Dashboard).
- **Form Pinjam Tinta**: menampilkan foto produk (klik untuk memperbesar), stok, lokasi rak,
  dan komposisi warna sebelum peminjaman dicatat.
- **Lokasi penyimpanan** (`src/lib/lokasi.ts`, satu sumber untuk form, validasi server, dan seed):
  - Kolom X: 1A, 2A, 3A, 1B, 2B, 3B, 1C, 2C, 3C, 1D, 2D, 3D, 1E, 2E, 3E
  - Baris Y: I, II, III, IV
  - Kedalaman Z: 1 sampai 7

> Data lama yang memakai kolom `4A` tidak ada lagi di daftar pilihan. Jalankan ulang
> `npm run seed` (menghapus dan mengisi ulang data dummy), atau edit tinta tersebut
> dan pilih lokasi baru.

## Jumlah cetak

- Form Peminjaman punya kolom **Jumlah Cetak** (wajib, bilangan bulat minimal 1).
- Nilainya tampil di kolom "Jumlah Cetak" pada Riwayat Peminjaman (Dashboard) dan ikut di
  file Excel hasil export. Data lama yang dibuat sebelum fitur ini menampilkan "—".
- Kolom `jumlah_cetak` di database dibuat boleh kosong, supaya data lama tidak hilang saat
  `prisma db push`.

## Login & akun

### Pemasangan (sekali saja)

```bash
npm install                 # ada dependensi baru: jose, bcryptjs, dan Next.js dinaikkan
```

1. Isi `.env` (contoh ada di `.env.example`):
   ```
   AUTH_SECRET="<teks acak minimal 32 karakter>"
   COOKIE_SECURE="false"
   ```
   Buat `AUTH_SECRET` dengan: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   Rahasiakan, jangan di-commit ke git. Isi `COOKIE_SECURE="true"` hanya bila aplikasi
   diakses lewat HTTPS; kalau lewat `http://` (mis. WiFi lokal) biarkan `false`, jika tidak
   browser menolak cookie login dan Anda terus dikembalikan ke halaman login.
2. Perbarui database (menambah tabel `users` dan kolom `jumlah_cetak`, data lama tetap ada):
   ```bash
   npx prisma db push
   ```
3. Buat akun Admin pertama:
   ```bash
   npm run akun:buat -- --username admin --nama "Developer" --role admin
   ```
   Password diketik lewat prompt (tidak tampil di layar). Kalau `npm run` bermasalah di
   PowerShell, pakai: `npx tsx scripts/buat-akun.ts --username admin --nama "Developer" --role admin`
4. Jalankan ulang `npm run dev`, buka aplikasi, lalu masuk.

> `npm run seed` hanya mengisi data tinta & peminjaman; tabel `users` tidak disentuh,
> jadi akun Anda tidak ikut terhapus.

### Membuat & mengelola akun

Tidak ada halaman atau endpoint pendaftaran di aplikasi. **Semua akun (termasuk Admin)
hanya bisa dibuat lewat terminal oleh developer** yang punya akses ke server:

```bash
# akun operator
npm run akun:buat -- --username budi --nama "Budi Santoso" --role operator
# ganti password (sekaligus membuka akun yang terkunci)
npm run akun:buat -- --username budi --reset
```

### Hak akses

| | Operator | Admin |
|---|---|---|
| Dashboard, riwayat, export Excel | ya | ya |
| Daftar Tinta (lihat, foto, filter) | ya | ya |
| Peminjaman & Pengembalian | ya | ya |
| Tambah / Edit / Hapus tinta | tidak | ya |

Aturannya ada di `wajibAdmin()` (`src/lib/actions.ts`) dan `linkUntuk()` (`src/components/nav-links.ts`).

### Catatan keamanan

- Password disimpan sebagai hash bcrypt, tidak pernah sebagai teks biasa.
- Sesi berlaku 8 jam (satu shift) lewat cookie `httpOnly`. Data akun dibaca ulang dari
  database, jadi akun yang dinonaktifkan langsung tidak bisa dipakai.
- Setelah 5 kali salah password, akun terkunci 5 menit.
- Pemeriksaan login dilakukan di tiga lapis: middleware, layout/halaman, dan tiap Server
  Action/API. Jangan hanya mengandalkan middleware.
- Versi Next.js dinaikkan ke 14.2.25 ke atas karena versi 14.2.15 punya celah yang bisa
  melewati middleware (CVE-2025-29927).
