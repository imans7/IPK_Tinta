"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { hapusTinta } from "@/lib/actions";
import { kodeLokasi, komposisiRingkas, toNumber, AMBANG_STOK_HABIS } from "@/lib/format";
import type { Tinta, KomposisiTinta } from "@prisma/client";

type TintaDenganKomposisi = Tinta & { komposisi: KomposisiTinta[] };

const menipis = (t: Tinta) => toNumber(t.jumlahStock) <= AMBANG_STOK_HABIS;

export default function TintaTable({ daftar }: { daftar: TintaDenganKomposisi[] }) {
  const [lihatFoto, setLihatFoto] = useState<TintaDenganKomposisi | null>(null);
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<TintaDenganKomposisi | null>(null);
  const [errorHapus, setErrorHapus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function prosesHapus() {
    if (!konfirmasiHapus) return;
    startTransition(async () => {
      const res = await hapusTinta(konfirmasiHapus.id);
      if (res.error) {
        setErrorHapus(res.error);
      } else {
        setErrorHapus(null);
      }
      setKonfirmasiHapus(null);
    });
  }

  return (
    <>
      {errorHapus && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{errorHapus}</div>
      )}

      <div className="hidden md:block bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto mb-3">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="text-left text-neutral-400 text-xs border-b border-neutral-800">
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Cetakan</th>
              <th className="px-4 py-2.5 font-medium">TC/Pantone</th>
              <th className="px-4 py-2.5 font-medium">Komposisi Warna</th>
              <th className="px-4 py-2.5 font-medium">Stok</th>
              <th className="px-4 py-2.5 font-medium">Lokasi</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {daftar.map((t) => (
              <tr key={t.id} className="border-b border-neutral-800 last:border-0">
                <td className="px-4 py-2.5">{t.namaCustomer}</td>
                <td className="px-4 py-2.5">{t.namaCetakan}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{t.tcPantone}</td>
                <td className="px-4 py-2.5 text-neutral-400 text-xs">{komposisiRingkas(t.komposisi) || "—"}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className={menipis(t) ? "text-amber-400 font-medium" : ""}>{toNumber(t.jumlahStock)} kg</span>
                  {menipis(t) && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400">Menipis</span>}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-teal-400">{kodeLokasi(t)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5 justify-end">
                    {toNumber(t.jumlahStock) > 0 ? (
                      <Link
                        href={`/peminjaman?tinta=${t.id}`}
                        className="h-7 px-3 flex items-center whitespace-nowrap rounded border border-amber-400/70 text-amber-400 text-xs font-medium hover:bg-amber-400 hover:text-neutral-900"
                      >
                        Pinjam Tinta
                      </Link>
                    ) : (
                      <span className="h-7 px-3 flex items-center whitespace-nowrap rounded border border-neutral-800 text-neutral-600 text-xs">
                        Stok habis
                      </span>
                    )}
                    <button
                      onClick={() => setLihatFoto(t)}
                      title="Lihat foto"
                      className="w-7 h-7 rounded border border-neutral-700 text-neutral-400 hover:border-teal-400 hover:text-teal-400"
                    >
                      🖼
                    </button>
                    <Link
                      href={`/tinta/${t.id}/edit`}
                      title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded border border-neutral-700 text-neutral-400 hover:border-amber-400 hover:text-amber-400"
                    >
                      ✎
                    </Link>
                    <button
                      onClick={() => setKonfirmasiHapus(t)}
                      title="Hapus"
                      className="w-7 h-7 rounded border border-neutral-700 text-neutral-400 hover:border-red-400 hover:text-red-400"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tampilan kartu untuk HP */}
      <div className="md:hidden space-y-3 mb-3">
        {daftar.length === 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-6 text-sm text-neutral-500 text-center">
            Belum ada data tinta.
          </div>
        )}
        {daftar.map((t) => (
          <div key={t.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{t.namaCetakan}</div>
                <div className="text-xs text-neutral-400 mt-0.5">{t.namaCustomer}</div>
              </div>
              <span className="shrink-0 font-mono text-xs text-teal-400 bg-neutral-800 rounded px-2 py-1">{kodeLokasi(t)}</span>
            </div>

            {t.komposisi.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.komposisi.map((k) => (
                  <span key={k.id} className="text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5">
                    {k.warnaDasar} {k.persentase}%
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-mono text-xs text-neutral-400">{t.tcPantone ?? ""}</span>
              <span className="flex items-center gap-2">
                {menipis(t) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400">Menipis</span>}
                <span className={`font-medium ${menipis(t) ? "text-amber-400" : ""}`}>{toNumber(t.jumlahStock)} kg</span>
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2">
              {toNumber(t.jumlahStock) > 0 ? (
                <Link
                  href={`/peminjaman?tinta=${t.id}`}
                  className="h-11 flex items-center justify-center rounded-lg bg-amber-400 text-neutral-900 text-sm font-semibold"
                >
                  Pinjam Tinta
                </Link>
              ) : (
                <div className="h-11 flex items-center justify-center rounded-lg border border-neutral-800 text-neutral-600 text-sm">
                  Stok habis
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setLihatFoto(t)} className="h-10 rounded-lg border border-neutral-700 text-sm text-neutral-300">
                🖼 Foto
              </button>
              <Link href={`/tinta/${t.id}/edit`} className="h-10 flex items-center justify-center rounded-lg border border-neutral-700 text-sm text-neutral-300">
                ✎ Edit
              </Link>
              <button onClick={() => setKonfirmasiHapus(t)} className="h-10 rounded-lg border border-neutral-700 text-sm text-red-400">
                🗑 Hapus
              </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {lihatFoto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setLihatFoto(null)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">{lihatFoto.namaCetakan}</div>
              <button onClick={() => setLihatFoto(null)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            {lihatFoto.gambarProduk ? (
              <img src={lihatFoto.gambarProduk} className="w-full rounded-md" alt={`Foto ${lihatFoto.namaCetakan}`} />
            ) : (
              <div className="text-sm text-neutral-500 py-10 text-center">Belum ada foto untuk tinta ini.</div>
            )}
          </div>
        </div>
      )}

      {konfirmasiHapus && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setKonfirmasiHapus(null)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold mb-2">Hapus tinta ini?</div>
            <p className="text-sm text-neutral-400 mb-4">
              Data komposisi warna dan riwayat terkait akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setKonfirmasiHapus(null)} className="px-3 py-1.5 text-sm rounded border border-neutral-700">
                Batal
              </button>
              <button onClick={prosesHapus} disabled={isPending} className="px-3 py-1.5 text-sm rounded bg-red-500 text-white disabled:opacity-60">
                {isPending ? "Menghapus…" : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
