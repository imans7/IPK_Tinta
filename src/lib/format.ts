import type { KomposisiTinta } from "@prisma/client";

/** Gabungkan lokasi rak jadi kode seperti "2A-III-7" */
export function kodeLokasi(t: { lokasiKolom: string; lokasiBaris: string; lokasiKedalaman: number }) {
  return `${t.lokasiKolom}-${t.lokasiBaris}-${t.lokasiKedalaman}`;
}

/** Ringkasan komposisi warna, contoh: "Merah 70% · Kuning 30%" */
export function komposisiRingkas(komposisi: Pick<KomposisiTinta, "warnaDasar" | "persentase">[]) {
  return komposisi.map((k) => `${k.warnaDasar} ${k.persentase}%`).join(" · ");
}

export function formatTanggal(d: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

/** Selisih waktu ringkas, contoh: "2 hari", "4 jam" — dipakai di label "Dipinjam ... lalu" */
export function diffRingkas(d: Date) {
  const ms = Date.now() - d.getTime();
  const jam = Math.floor(ms / 3600000);
  if (jam < 1) return "baru saja";
  if (jam < 24) return `${jam} jam`;
  return `${Math.floor(jam / 24)} hari`;
}

export function toNumber(v: unknown): number {
  return typeof v === "object" && v !== null && "toNumber" in (v as any) ? (v as any).toNumber() : Number(v);
}

/** Batas stok (kg) — tinta dengan stok <= nilai ini dianggap hampir habis */
export const AMBANG_STOK_HABIS = 1.0;
