import { prisma } from "@/lib/prisma";
import { komposisiRingkas, toNumber } from "@/lib/format";
import ExcelJS from "exceljs";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const periode = searchParams.get("periode") ?? "6";
  const cari = searchParams.get("cari") ?? "";

  const riwayat = await prisma.transaksiPeminjaman.findMany({
    where: {
      tanggalPinjam: { gte: new Date(Date.now() - Number(periode) * 30 * 86400000) },
      ...(cari
        ? { OR: [{ namaPeminjam: { contains: cari } }, { tinta: { namaCetakan: { contains: cari } } }] }
        : {}),
    },
    include: { tinta: { include: { komposisi: true } } },
    orderBy: { tanggalPinjam: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Riwayat Peminjaman");

  sheet.columns = [
    { header: "Tanggal Pinjam", key: "tanggal", width: 16 },
    { header: "Operator", key: "operator", width: 14 },
    { header: "Customer", key: "customer", width: 20 },
    { header: "Cetakan", key: "cetakan", width: 24 },
    { header: "Berat Dipinjam (Kg)", key: "pinjam", width: 16 },
    { header: "Berat Kembali (Kg)", key: "kembali", width: 16 },
    { header: "Terpakai (Kg)", key: "terpakai", width: 14 },
    { header: "Komposisi Warna", key: "komposisi", width: 28 },
    { header: "Status", key: "status", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const trx of riwayat) {
    sheet.addRow({
      tanggal: trx.tanggalPinjam.toLocaleString("id-ID"),
      operator: trx.namaPeminjam,
      customer: trx.tinta.namaCustomer,
      cetakan: trx.tinta.namaCetakan,
      pinjam: toNumber(trx.beratPinjam),
      kembali: trx.beratKembali != null ? toNumber(trx.beratKembali) : "-",
      terpakai: trx.beratTerpakai != null ? toNumber(trx.beratTerpakai) : "-",
      komposisi: komposisiRingkas(trx.tinta.komposisi),
      status: trx.status === "dipinjam" ? "Dipinjam" : "Selesai",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="riwayat-peminjaman-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
