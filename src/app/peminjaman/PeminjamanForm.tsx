"use client";

import { useState, useTransition } from "react";
import { cariTinta, catatPeminjaman } from "@/lib/actions";
import { kodeLokasi, toNumber } from "@/lib/format";
import type { Tinta, KomposisiTinta } from "@prisma/client";

// jumlahStock bisa Decimal (hasil pencarian) atau number (dari halaman server) — toNumber() menangani keduanya.
type TintaPilihan = Omit<Tinta, "jumlahStock"> & { jumlahStock: unknown; komposisi: KomposisiTinta[] };

export default function PeminjamanForm({ awal }: { awal: TintaPilihan | null }) {
  const [cari, setCari] = useState("");
  const [hasil, setHasil] = useState<TintaPilihan[]>([]);
  const [terpilih, setTerpilih] = useState<TintaPilihan | null>(awal);
  const [namaPeminjam, setNamaPeminjam] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stok = terpilih ? toNumber(terpilih.jumlahStock) : 0;
  const stokHabis = terpilih !== null && stok <= 0;

  async function handleCari(value: string) {
    setCari(value);
    if (!value.trim()) return setHasil([]);
    const res = await cariTinta(value);
    setHasil(res as TintaPilihan[]);
  }

  function pilih(t: TintaPilihan) {
    setTerpilih(t);
    setCari("");
    setHasil([]);
    setSukses(null);
    setError(null);
  }

  function submit() {
    if (!terpilih) return;
    setError(null);
    startTransition(async () => {
      const res = await catatPeminjaman(terpilih.id, namaPeminjam);
      if (res.error) {
        setError(res.error);
      } else {
        setSukses(`Peminjaman ${terpilih.namaCetakan} oleh ${namaPeminjam} berhasil dicatat.`);
        setTerpilih(null);
        setNamaPeminjam("");
        // hapus ?tinta=ID dari alamat supaya refresh tidak memilih tinta yang sama lagi
        window.history.replaceState(null, "", "/peminjaman");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Peminjaman Tinta</h1>
      <p className="text-sm text-neutral-400 mb-6">Cari nama cetakan, lalu cek foto dan komposisi warnanya sebelum meminjam</p>

      {sukses && <div className="mb-4 text-sm text-teal-400 bg-teal-950/30 border border-teal-900 rounded-md px-3 py-2">{sukses}</div>}

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-7 w-full space-y-5">
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Cari Tinta</label>
          <input
            value={cari}
            onChange={(e) => handleCari(e.target.value)}
            placeholder="Nama cetakan, customer, atau TC/Pantone…"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm"
          />
          {hasil.length > 0 && (
            <div className="mt-2 border border-neutral-800 rounded-md overflow-hidden">
              {hasil.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pilih(t)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 border-b border-neutral-800 last:border-0"
                >
                  {t.namaCetakan} — {t.namaCustomer}
                  <span className="text-teal-400 font-mono text-xs ml-1">{kodeLokasi(t)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {terpilih && (
          <>
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3.5 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Preview gambar produk */}
                <div className="sm:w-44 shrink-0">
                  {terpilih.gambarProduk ? (
                    <a href={terpilih.gambarProduk} target="_blank" rel="noreferrer" title="Klik untuk memperbesar">
                      <img
                        src={terpilih.gambarProduk}
                        alt={`Foto ${terpilih.namaCetakan}`}
                        className="w-full h-52 sm:h-44 object-contain rounded-lg border border-neutral-700 bg-neutral-900"
                      />
                    </a>
                  ) : (
                    <div className="w-full h-52 sm:h-44 rounded-lg border border-dashed border-neutral-700 bg-neutral-900 flex flex-col items-center justify-center gap-1 text-xs text-neutral-500">
                      <span className="text-2xl">🖼</span>
                      Belum ada foto
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-medium">{terpilih.namaCetakan}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {terpilih.namaCustomer}
                    {terpilih.tcPantone ? ` · ${terpilih.tcPantone}` : ""}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[11px] text-neutral-500">Stok tersedia</div>
                      <div className={stokHabis ? "text-red-400" : ""}>{stok} kg</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500">Lokasi rak</div>
                      <div className="font-mono text-teal-400">{kodeLokasi(terpilih)}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-neutral-500 mb-1.5">Komposisi warna — cek dulu sebelum meminjam</div>
                  <div className="flex flex-wrap gap-1.5">
                    {terpilih.komposisi.map((k) => (
                      <span key={k.id} className="text-xs bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1">
                        {k.warnaDasar} {k.persentase}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {stokHabis && (
              <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md px-3 py-2.5">
                Stok tinta ini sedang habis, tidak bisa dipinjam.
              </div>
            )}

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Nama Peminjam (Operator)</label>
              <input
                value={namaPeminjam}
                onChange={(e) => setNamaPeminjam(e.target.value)}
                placeholder="Contoh: Budi"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm"
              />
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>

            <div className="text-xs text-amber-400 bg-amber-950/30 border border-amber-900 rounded-md px-3 py-2.5">
              ⚖ Berat yang diambil dicatat nanti saat pengembalian (ditimbang ulang), bukan saat pinjam.
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-neutral-800">
              <button
                onClick={submit}
                disabled={isPending || stokHabis}
                className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 rounded-lg bg-amber-400 text-neutral-900 font-semibold text-sm disabled:opacity-60"
              >
                {isPending ? "Menyimpan…" : "Catat Peminjaman"}
              </button>
              <button
                onClick={() => setTerpilih(null)}
                className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 rounded-lg border border-neutral-700 text-sm"
              >
                Batal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
