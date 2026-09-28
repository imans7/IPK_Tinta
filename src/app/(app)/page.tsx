import { prisma } from "@/lib/prisma";
import { kodeLokasi, komposisiRingkas, formatTanggal, diffRingkas, toNumber, AMBANG_STOK_HABIS } from "@/lib/format";
import Link from "next/link";
import RiwayatFilter from "./RiwayatFilter";


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { periode?: string; cari?: string };
}) {
  const periode = searchParams.periode ?? "6";
  const cari = searchParams.cari ?? "";

  const [totalTinta, sedangDipinjam, stokHampirHabis, dipinjamAktif, riwayat] = await Promise.all([
    prisma.tinta.count(),
    prisma.transaksiPeminjaman.count({ where: { status: "dipinjam" } }),
    prisma.tinta.findMany({ where: { jumlahStock: { lte: AMBANG_STOK_HABIS } }, orderBy: { jumlahStock: "asc" } }),
    prisma.transaksiPeminjaman.findMany({
      where: { status: "dipinjam" },
      include: { tinta: true },
      orderBy: { tanggalPinjam: "desc" },
    }),
    prisma.transaksiPeminjaman.findMany({
      where: {
        tanggalPinjam: { gte: new Date(Date.now() - Number(periode) * 30 * 86400000) },
        ...(cari
          ? {
              OR: [
                { namaPeminjam: { contains: cari } },
                { tinta: { namaCetakan: { contains: cari } } },
              ],
            }
          : {}),
      },
      include: { tinta: { include: { komposisi: true } } },
      orderBy: { tanggalPinjam: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Dashboard</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Ringkasan stok gudang tinta — {formatTanggal(new Date())}
      </p>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mb-7">
        <Kartu label="Total item tinta" nilai={totalTinta} />
        <Kartu label="Sedang dipinjam" nilai={sedangDipinjam} />
        <Kartu label="Stok hampir habis" nilai={stokHampirHabis.length} warna="text-red-400" />
      </div>

      <div className="text-[13px] font-semibold text-neutral-400 mb-2.5">Stok hampir habis</div>
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden mb-7">
        {stokHampirHabis.length === 0 && (
          <div className="px-4 py-4 text-sm text-neutral-500">Tidak ada tinta dengan stok hampir habis.</div>
        )}
        {stokHampirHabis.map((t) => (
          <div key={t.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between px-4 py-3 text-sm border-b border-neutral-800 last:border-0">
            <span>
              {t.namaCustomer} — {t.namaCetakan}{" "}
              <span className="text-teal-400 font-mono text-xs ml-1">{kodeLokasi(t)}</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-400">{toNumber(t.jumlahStock)} kg</span>
          </div>
        ))}
      </div>

      <div className="text-[13px] font-semibold text-neutral-400 mb-2.5">Sedang dipinjam</div>
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden mb-7">
        {dipinjamAktif.length === 0 && (
          <div className="px-4 py-4 text-sm text-neutral-500">Tidak ada tinta yang sedang dipinjam.</div>
        )}
        {dipinjamAktif.map((trx) => (
          <div key={trx.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between px-4 py-3 text-sm border-b border-neutral-800 last:border-0">
            <span>{trx.namaPeminjam} (Operator) — {trx.tinta.namaCetakan}</span>
            <span className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-teal-400">
                Dipinjam {diffRingkas(trx.tanggalPinjam)} · belum ditimbang
              </span>
              <Link
                href={`/pengembalian?transaksi=${trx.id}`}
                className="text-xs px-3 py-1.5 rounded border border-neutral-700 hover:border-amber-400 hover:text-amber-400"
              >
                Kembalikan
              </Link>
            </span>
          </div>
        ))}
      </div>

      <RiwayatFilter periode={periode} cari={cari} />

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto mb-3">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="text-left text-neutral-400 text-xs border-b border-neutral-800">
              <Th>Tanggal Pinjam</Th><Th>Operator</Th><Th>Cetakan</Th><Th>Jumlah Cetak</Th><Th>Berat Dipinjam</Th>
              <Th>Berat Kembali</Th><Th>Terpakai</Th><Th>Komposisi Warna</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {riwayat.map((trx) => (
              <tr key={trx.id} className="border-b border-neutral-800 last:border-0">
                <td className="px-4 py-2.5">{formatTanggal(trx.tanggalPinjam)}</td>
                <td className="px-4 py-2.5">{trx.namaPeminjam}</td>
                <td className="px-4 py-2.5">{trx.tinta.namaCetakan}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{trx.jumlahCetak != null ? trx.jumlahCetak.toLocaleString("id-ID") : "—"}</td>
                <td className="px-4 py-2.5">{toNumber(trx.beratPinjam)} kg</td>
                <td className="px-4 py-2.5">{trx.beratKembali != null ? `${toNumber(trx.beratKembali)} kg` : "—"}</td>
                <td className="px-4 py-2.5">{trx.beratTerpakai != null ? `${toNumber(trx.beratTerpakai)} kg` : "—"}</td>
                <td className="px-4 py-2.5 text-neutral-400 text-xs">{komposisiRingkas(trx.tinta.komposisi)}</td>
                <td className="px-4 py-2.5">
                  {trx.status === "dipinjam" ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-teal-400">Dipinjam</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">Selesai</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kartu({ label, nilai, warna }: { label: string; nilai: number; warna?: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-4">
      <div className={`text-xl sm:text-2xl font-semibold ${warna ?? ""}`}>{nilai}</div>
      <div className="text-xs text-neutral-400 mt-1">{label}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}
