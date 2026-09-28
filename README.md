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
src/app/page.tsx             → Dashboard
src/app/tinta/               → Daftar Tinta, Tambah, Edit
src/app/peminjaman/          → Form Peminjaman
src/app/pengembalian/        → Form Pengembalian
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
- **RBAC/login**: belum ditambahkan. Kalau perlu, package yang umum
  dipakai di ekosistem Next.js adalah NextAuth.js / Auth.js.

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
