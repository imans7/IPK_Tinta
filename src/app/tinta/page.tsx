import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import TintaTable from "./TintaTable";
import TintaFilter from "./TintaFilter";

export default async function DaftarTintaPage({
  searchParams,
}: {
  searchParams: { cari?: string; customer?: string };
}) {
  const cari = searchParams.cari ?? "";
  const customer = searchParams.customer ?? "";

  const where: Prisma.TintaWhereInput = {
    ...(customer ? { namaCustomer: customer } : {}),
    ...(cari
      ? {
          OR: [
            { namaCustomer: { contains: cari } },
            { namaCetakan: { contains: cari } },
            { tcPantone: { contains: cari } },
          ],
        }
      : {}),
  };

  const [daftar, semuaCustomer] = await Promise.all([
    prisma.tinta.findMany({
      where,
      include: { komposisi: true },
      // Stok paling sedikit di paling atas; urutan berikutnya hanya agar hasilnya konsisten.
      orderBy: [{ jumlahStock: "asc" }, { namaCustomer: "asc" }, { namaCetakan: "asc" }],
    }),
    // Daftar nama customer unik untuk dropdown filter
    prisma.tinta.findMany({
      select: { namaCustomer: true },
      distinct: ["namaCustomer"],
      orderBy: { namaCustomer: "asc" },
    }),
  ]);

  const filterAktif = Boolean(cari || customer);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Daftar Tinta</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Pilih customer atau cari berdasarkan nama cetakan / kode TC-Pantone
      </p>

      <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
        <TintaFilter customers={semuaCustomer.map((c) => c.namaCustomer)} cari={cari} customer={customer} />
        <Link
          href="/tinta/tambah"
          className="text-center px-4 py-3 sm:py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold text-sm whitespace-nowrap"
        >
          + Tambah Tinta
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-neutral-500 mb-4">
        <span>
          {daftar.length} tinta · diurutkan dari stok paling sedikit
        </span>
        {filterAktif && (
          <Link href="/tinta" className="text-amber-400 hover:underline whitespace-nowrap">
            Reset filter
          </Link>
        )}
      </div>

      <TintaTable daftar={daftar} />
    </div>
  );
}
