import { PrismaClient } from "@prisma/client";
import { LOKASI_KOLOM, LOKASI_BARIS } from "../src/lib/lokasi";

const prisma = new PrismaClient();

const customerAcak = [
  "PT Sumber Jaya", "CV Anugerah", "Toko Makmur", "PT Cahaya Abadi",
  "CV Berkah Mandiri", "PT Karya Sejahtera", "UD Sinar Terang",
];
const produkAcak = [
  "Label Botol Saus", "Kemasan Kopi Sachet", "Kemasan Mie Instan",
  "Dus Snack Kotak", "Label Sabun Cair", "Kemasan Deterjen Bubuk",
  "Label Minyak Goreng", "Dus Obat Herbal", "Kemasan Biskuit",
  "Label Air Mineral", "Kemasan Permen", "Dus Kosmetik",
];
const kolomPilihan = LOKASI_KOLOM;
const barisPilihan = LOKASI_BARIS;
const warnaPilihan = ["Merah", "Kuning", "Biru", "Hitam", "Putih", "Hijau", "Coklat"];

function acak<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function acakInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function komposisiAcak() {
  const jumlahWarna = acakInt(1, 2);
  if (jumlahWarna === 1) {
    return [{ warnaDasar: acak(warnaPilihan), persentase: 100 }];
  }
  const [a, b] = [...warnaPilihan].sort(() => 0.5 - Math.random()).slice(0, 2);
  const pct = acakInt(20, 80);
  return [
    { warnaDasar: a, persentase: pct },
    { warnaDasar: b, persentase: 100 - pct },
  ];
}

// Data tinta contoh — sama seperti yang dipakai di mockup UI, supaya
// tampilan langsung bisa dicek dengan data yang familiar.
const dataUtama = [
  {
    namaCustomer: "PT Sumber Jaya", namaCetakan: "Label Botol Saus", tcPantone: "PMS 186C",
    jumlahStock: 0.4, lokasi: ["2A", "II", 3], komposisi: [["Merah", 70], ["Kuning", 30]],
  },
  {
    namaCustomer: "CV Anugerah", namaCetakan: "Kemasan Kopi Sachet", tcPantone: "PMS 476C",
    jumlahStock: 0.6, lokasi: ["1A", "I", 5], komposisi: [["Coklat", 60], ["Hitam", 40]],
  },
  {
    namaCustomer: "Toko Makmur", namaCetakan: "Kemasan Mie Instan", tcPantone: "PMS 021C",
    jumlahStock: 2.1, lokasi: ["3A", "IV", 1], komposisi: [["Kuning", 85], ["Merah", 15]],
  },
  {
    namaCustomer: "PT Sumber Jaya", namaCetakan: "Dus Snack Kotak", tcPantone: "PMS 355C",
    jumlahStock: 0.8, lokasi: ["1B", "III", 2], komposisi: [["Hijau", 100]],
  },
  {
    namaCustomer: "CV Anugerah", namaCetakan: "Label Sabun Cair", tcPantone: "PMS 293C",
    jumlahStock: 3.4, lokasi: ["3B", "I", 6], komposisi: [["Biru", 50], ["Putih", 50]],
  },
  {
    namaCustomer: "PT Cahaya Abadi", namaCetakan: "Label Minyak Goreng", tcPantone: "PMS 116C",
    jumlahStock: 1.6, lokasi: ["1D", "II", 4], komposisi: [["Kuning", 90], ["Hitam", 10]],
  },
  {
    namaCustomer: "CV Berkah Mandiri", namaCetakan: "Kemasan Deterjen Bubuk", tcPantone: "PMS 300C",
    jumlahStock: 0.9, lokasi: ["1A", "III", 7], komposisi: [["Biru", 80], ["Putih", 20]],
  },
  {
    namaCustomer: "PT Karya Sejahtera", namaCetakan: "Dus Obat Herbal", tcPantone: "PMS 349C",
    jumlahStock: 2.7, lokasi: ["2C", "I", 3], komposisi: [["Hijau", 70], ["Hitam", 30]],
  },
] as const;

async function main() {
  console.log("Menghapus data lama...");
  await prisma.transaksiPeminjaman.deleteMany();
  await prisma.komposisiTinta.deleteMany();
  await prisma.tinta.deleteMany();

  const tintaByNama: Record<string, { id: number }> = {};

  console.log("Membuat tinta contoh...");
  for (const item of dataUtama) {
    const tinta = await prisma.tinta.create({
      data: {
        namaCustomer: item.namaCustomer,
        namaCetakan: item.namaCetakan,
        tcPantone: item.tcPantone,
        jumlahStock: item.jumlahStock,
        lokasiKolom: item.lokasi[0],
        lokasiBaris: item.lokasi[1],
        lokasiKedalaman: Number(item.lokasi[2]),
        komposisi: {
          create: item.komposisi.map((k) => ({
            warnaDasar: k[0] as string,
            persentase: k[1] as number,
          })),
        },
      },
    });
    tintaByNama[item.namaCetakan] = tinta;
  }

  console.log("Membuat 9 tinta acak (stok normal)...");
  for (let i = 0; i < 9; i++) {
    await prisma.tinta.create({
      data: {
        namaCustomer: acak(customerAcak),
        namaCetakan: acak(produkAcak),
        tcPantone: `PMS ${acakInt(100, 899)}${acak(["C", "U"])}`,
        jumlahStock: Number((Math.random() * 4.8 + 0.2).toFixed(2)),
        lokasiKolom: acak(kolomPilihan),
        lokasiBaris: acak(barisPilihan),
        lokasiKedalaman: acakInt(1, 7),
        komposisi: { create: komposisiAcak() },
      },
    });
  }

  console.log("Membuat 3 tinta stok hampir habis...");
  for (let i = 0; i < 3; i++) {
    await prisma.tinta.create({
      data: {
        namaCustomer: acak(customerAcak),
        namaCetakan: acak(produkAcak),
        tcPantone: `PMS ${acakInt(100, 899)}${acak(["C", "U"])}`,
        jumlahStock: Number((Math.random() * 0.8 + 0.1).toFixed(2)),
        lokasiKolom: acak(kolomPilihan),
        lokasiBaris: acak(barisPilihan),
        lokasiKedalaman: acakInt(1, 7),
        komposisi: { create: komposisiAcak() },
      },
    });
  }

  console.log("Membuat riwayat peminjaman (sampai 6 bulan ke belakang)...");

  // 2 transaksi masih aktif — belum ditimbang / belum dikembalikan
  await prisma.transaksiPeminjaman.create({
    data: {
      tintaId: tintaByNama["Label Botol Saus"].id,
      namaPeminjam: "Budi",
      beratPinjam: 0.9,
      tanggalPinjam: new Date(Date.now() - 2 * 86400000),
      status: "dipinjam",
    },
  });
  await prisma.transaksiPeminjaman.create({
    data: {
      tintaId: tintaByNama["Kemasan Mie Instan"].id,
      namaPeminjam: "Rian",
      beratPinjam: 0.5,
      tanggalPinjam: new Date(Date.now() - 4 * 3600000),
      status: "dipinjam",
    },
  });

  const selesai: [string, string, number, number, number][] = [
    ["Dus Snack Kotak", "Budi", 0.9, 0.2, 8],
    ["Kemasan Kopi Sachet", "Rian", 1.1, 0.3, 24],
    ["Label Sabun Cair", "Sari", 2.0, 0.6, 43],
    ["Label Botol Saus", "Agus", 0.7, 0.1, 89],
    ["Label Minyak Goreng", "Budi", 1.2, 0.4, 95],
    ["Kemasan Deterjen Bubuk", "Rian", 0.8, 0.15, 130],
    ["Dus Obat Herbal", "Sari", 1.5, 0.5, 150],
    ["Kemasan Kopi Sachet", "Agus", 0.9, 0.2, 170],
  ];

  for (const [nama, peminjam, sebelum, sesudah, hariLalu] of selesai) {
    const tinta = tintaByNama[nama];
    if (!tinta) continue;
    const tglPinjam = new Date(Date.now() - hariLalu * 86400000);
    await prisma.transaksiPeminjaman.create({
      data: {
        tintaId: tinta.id,
        namaPeminjam: peminjam,
        beratPinjam: sebelum,
        beratKembali: sesudah,
        beratTerpakai: Number((sebelum - sesudah).toFixed(2)),
        tanggalPinjam: tglPinjam,
        tanggalKembali: new Date(tglPinjam.getTime() + acakInt(2, 48) * 3600000),
        status: "selesai",
      },
    });
  }

  console.log("Selesai seeding.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
