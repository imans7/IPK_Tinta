import { prisma } from "@/lib/prisma";
import PeminjamanForm from "./PeminjamanForm";
import { wajibLogin } from "@/lib/auth";

// Bisa dibuka langsung dari tombol "Pinjam Tinta" di Daftar Tinta: /peminjaman?tinta=ID
export default async function PeminjamanPage({ searchParams }: { searchParams: { tinta?: string } }) {
  const user = await wajibLogin();
  const id = Number(searchParams.tinta);

  const tinta =
    Number.isInteger(id) && id > 0
      ? await prisma.tinta.findUnique({ where: { id }, include: { komposisi: true } })
      : null;

  // Decimal diubah ke number supaya aman dikirim ke client component
  const awal = tinta ? { ...tinta, jumlahStock: Number(tinta.jumlahStock) } : null;

  // key: form ikut di-reset bila pindah dari tinta satu ke tinta lain
  return <PeminjamanForm key={awal?.id ?? "kosong"} awal={awal} namaDefault={user.nama} />;
}
