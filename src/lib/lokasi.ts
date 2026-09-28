// Pilihan lokasi penyimpanan tinta — satu sumber data untuk form, validasi server, dan seed.
// Kode lokasi ditampilkan sebagai "X-Y-Z", contoh: 2B-III-7.

/** Sumbu X — kolom rak (kiri ke kanan) */
export const LOKASI_KOLOM = [
  "1A", "2A", "3A",
  "1B", "2B", "3B",
  "1C", "2C", "3C",
  "1D", "2D", "3D",
  "1E", "2E", "3E",
] as const;

/** Sumbu Y — tingkat rak (atas ke bawah) */
export const LOKASI_BARIS = ["I", "II", "III", "IV"] as const;

/** Sumbu Z — kedalaman (depan ke belakang) */
export const LOKASI_KEDALAMAN = [1, 2, 3, 4, 5, 6, 7] as const;
