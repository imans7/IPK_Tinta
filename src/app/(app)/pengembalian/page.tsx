"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { konfirmasiPengembalian } from "@/lib/actions";
import { diffRingkas, kodeLokasi, toNumber } from "@/lib/format";
import type { Tinta, TransaksiPeminjaman } from "@prisma/client";

type TrxDenganTinta = TransaksiPeminjaman & { tinta: Tinta };

export default function PengembalianPage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-500">Memuat…</div>}>
      <PengembalianIsi />
    </Suspense>
  );
}

function PengembalianIsi() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [daftar, setDaftar] = useState<TrxDenganTinta[]>([]);
  const [terpilihId, setTerpilihId] = useState<number | null>(null);
  const [beratKembali, setBeratKembali] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function muatDaftar() {
    setLoading(true);
    const res = await fetch("/api/dipinjam", { cache: "no-store" });
    const data: TrxDenganTinta[] = await res.json();
    setDaftar(data);

    const dariUrl = searchParams.get("transaksi");
    const default_ = dariUrl ? Number(dariUrl) : data[0]?.id ?? null;
    setTerpilihId(default_);
    setLoading(false);
  }

  useEffect(() => {
    muatDaftar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const terpilih = daftar.find((d) => d.id === terpilihId) ?? null;
  const terpakai =
    terpilih && beratKembali !== "" && !Number.isNaN(Number(beratKembali))
      ? Number((Number(terpilih.beratPinjam) - Number(beratKembali)).toFixed(2))
      : null;

  function submit() {
    if (!terpilih) return;
    setError(null);
    startTransition(async () => {
      const res = await konfirmasiPengembalian(terpilih.id, Number(beratKembali));
      if (res.error) {
        setError(res.error);
      } else {
        setSukses(`Pengembalian ${terpilih.tinta.namaCetakan} oleh ${terpilih.namaPeminjam} berhasil dicatat.`);
        setBeratKembali("");
        router.replace("/pengembalian");
        muatDaftar();
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Pengembalian Tinta</h1>
      <p className="text-sm text-neutral-400 mb-6">Pilih tinta yang sedang dipinjam, lalu input hasil timbang ulang</p>

      {sukses && <div className="mb-4 text-sm text-teal-400 bg-teal-950/30 border border-teal-900 rounded-md px-3 py-2">{sukses}</div>}

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden mb-5">
        {loading && <div className="px-4 py-4 text-sm text-neutral-500">Memuat…</div>}
        {!loading && daftar.length === 0 && (
          <div className="px-4 py-4 text-sm text-neutral-500">Tidak ada tinta yang sedang dipinjam saat ini.</div>
        )}
        {daftar.map((trx) => (
          <button
            key={trx.id}
            onClick={() => {
              setTerpilihId(trx.id);
              setBeratKembali("");
              setError(null);
            }}
            className={`w-full flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between px-4 py-3 text-sm text-left border-b border-neutral-800 last:border-0 ${
              trx.id === terpilihId ? "bg-neutral-800" : "hover:bg-neutral-800/60"
            }`}
          >
            <span>
              {trx.namaPeminjam} (Operator) — {trx.tinta.namaCetakan}
              <span className="text-teal-400 font-mono text-xs ml-1">{kodeLokasi(trx.tinta)}</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-teal-400">
              Dipinjam {diffRingkas(new Date(trx.tanggalPinjam))}
            </span>
          </button>
        ))}
      </div>

      {terpilih && (
        <>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-7 w-full space-y-5">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Tinta yang dikembalikan</label>
              <input
                disabled
                value={`${terpilih.tinta.namaCetakan} — ${terpilih.namaPeminjam}`}
                className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Berat sebelum dipinjam (Kg)</label>
                <input
                  disabled
                  value={toNumber(terpilih.beratPinjam)}
                  className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-400"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Berat sekarang (hasil timbang ulang, Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={beratKembali}
                  onChange={(e) => setBeratKembali(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}

            <div
              className={`rounded-md px-3.5 py-3 text-sm border ${
                terpakai === null
                  ? "bg-neutral-800 border-neutral-700 text-neutral-400"
                  : terpakai < 0
                  ? "bg-red-950/30 border-red-900 text-red-400"
                  : "bg-teal-950/30 border-teal-900 text-teal-400"
              }`}
            >
              {terpakai === null && "Masukkan berat hasil timbang ulang untuk melihat jumlah terpakai."}
              {terpakai !== null && terpakai < 0 &&
                `Berat sekarang lebih besar dari sebelum dipinjam (${toNumber(terpilih.beratPinjam)} kg) — periksa kembali penimbangan.`}
              {terpakai !== null && terpakai >= 0 &&
                `Terpakai: ${terpakai.toFixed(2)} kg (dari ${toNumber(terpilih.beratPinjam)} kg menjadi ${beratKembali} kg). Stok akan diperbarui jadi ${beratKembali} kg.`}
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-neutral-800">
              <button
                onClick={submit}
                disabled={isPending || beratKembali === ""}
                className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 rounded-lg bg-amber-400 text-neutral-900 font-semibold text-sm disabled:opacity-60"
              >
                {isPending ? "Menyimpan…" : "Konfirmasi Pengembalian"}
              </button>
              <button onClick={() => router.push("/")} className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 rounded-lg border border-neutral-700 text-sm">
                Batal
              </button>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-3">
            Selisih berat (terpakai) otomatis tersimpan ke Riwayat Peminjaman di Dashboard, status berubah jadi &quot;Selesai&quot;.
          </p>
        </>
      )}
    </div>
  );
}
