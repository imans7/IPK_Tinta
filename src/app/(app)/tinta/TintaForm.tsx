"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { simpanTinta } from "@/lib/actions";
import { LOKASI_KOLOM, LOKASI_BARIS, LOKASI_KEDALAMAN } from "@/lib/lokasi";
import type { Tinta, KomposisiTinta } from "@prisma/client";

type Props = {
  tinta?: (Tinta & { komposisi: KomposisiTinta[] }) | null;
};

const PILIHAN_KOLOM = LOKASI_KOLOM;
const PILIHAN_BARIS = LOKASI_BARIS;
const PILIHAN_KEDALAMAN = LOKASI_KEDALAMAN;

export default function TintaForm({ tinta }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [namaCustomer, setNamaCustomer] = useState(tinta?.namaCustomer ?? "");
  const [namaCetakan, setNamaCetakan] = useState(tinta?.namaCetakan ?? "");
  const [tcPantone, setTcPantone] = useState(tinta?.tcPantone ?? "");
  const [jumlahStock, setJumlahStock] = useState(tinta ? String(tinta.jumlahStock) : "");
  const [lokasiKolom, setLokasiKolom] = useState(tinta?.lokasiKolom ?? "");
  const [lokasiBaris, setLokasiBaris] = useState(tinta?.lokasiBaris ?? "");
  const [lokasiKedalaman, setLokasiKedalaman] = useState(tinta ? String(tinta.lokasiKedalaman) : "");
  const [foto, setFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(tinta?.gambarProduk ?? null);

  const [komposisi, setKomposisi] = useState<{ warnaDasar: string; persentase: string }[]>(
    tinta?.komposisi?.length
      ? tinta.komposisi.map((k) => ({ warnaDasar: k.warnaDasar, persentase: String(k.persentase) }))
      : [
          { warnaDasar: "", persentase: "" },
          { warnaDasar: "", persentase: "" },
        ]
  );

  const totalPersen = komposisi.reduce((s, k) => s + (Number(k.persentase) || 0), 0);

  function tambahBaris() {
    setKomposisi((prev) => [...prev, { warnaDasar: "", persentase: "" }]);
  }
  function hapusBaris(i: number) {
    setKomposisi((prev) => prev.filter((_, idx) => idx !== i));
  }
  function ubahBaris(i: number, field: "warnaDasar" | "persentase", value: string) {
    setKomposisi((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFoto(file);
    if (file) setPreviewFoto(URL.createObjectURL(file));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!namaCustomer || !namaCetakan) return setError("Nama customer dan nama cetakan wajib diisi.");
    if (!lokasiKolom || !lokasiBaris || !lokasiKedalaman) return setError("Lokasi rak wajib dipilih lengkap.");
    if (totalPersen !== 100) return setError(`Total komposisi warna harus 100% (saat ini ${totalPersen}%).`);

    const fd = new FormData();
    if (tinta) fd.set("id", String(tinta.id));
    fd.set("namaCustomer", namaCustomer);
    fd.set("namaCetakan", namaCetakan);
    fd.set("tcPantone", tcPantone);
    fd.set("jumlahStock", jumlahStock);
    fd.set("lokasiKolom", lokasiKolom);
    fd.set("lokasiBaris", lokasiBaris);
    fd.set("lokasiKedalaman", lokasiKedalaman);
    fd.set("fotoLama", tinta?.gambarProduk ?? "");
    if (foto) fd.set("foto", foto);
    fd.set(
      "komposisi",
      JSON.stringify(komposisi.map((k) => ({ warnaDasar: k.warnaDasar, persentase: Number(k.persentase) })))
    );

    startTransition(async () => {
      const res = await simpanTinta(fd);
      if (res.error) {
        setError(res.error);
      } else {
        router.push("/tinta");
      }
    });
  }

  return (
    <form onSubmit={submit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-7 w-full space-y-5">
      {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{error}</div>}

      <div>
        <label className="block text-xs text-neutral-400 mb-1.5">Nama Customer</label>
        <input
          value={namaCustomer}
          onChange={(e) => setNamaCustomer(e.target.value)}
          placeholder="Contoh: PT Sumber Jaya"
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Nama Cetakan</label>
          <input
            value={namaCetakan}
            onChange={(e) => setNamaCetakan(e.target.value)}
            placeholder="Contoh: Label Botol Saus"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Kode TC/Pantone</label>
          <input
            value={tcPantone}
            onChange={(e) => setTcPantone(e.target.value)}
            placeholder="PMS 186C"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1.5">Foto Produk</label>
        <input type="file" accept="image/*" onChange={handleFoto} className="block w-full text-sm text-neutral-300 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-700 file:px-4 file:py-2.5 file:text-sm file:text-neutral-100 hover:file:bg-neutral-600" />
        {previewFoto && <img src={previewFoto} className="mt-2 h-24 rounded-md border border-neutral-700" alt="Preview" />}
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1.5">Komposisi Warna</label>
        <div className="space-y-2">
          {komposisi.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_76px_40px] gap-2">
              <input
                value={row.warnaDasar}
                onChange={(e) => ubahBaris(i, "warnaDasar", e.target.value)}
                placeholder="Warna dasar (mis. Merah)"
                className="bg-neutral-800 border border-neutral-700 rounded-md px-2.5 py-2 text-sm"
              />
              <input
                type="number"
                value={row.persentase}
                onChange={(e) => ubahBaris(i, "persentase", e.target.value)}
                placeholder="%"
                className="bg-neutral-800 border border-neutral-700 rounded-md px-2.5 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => hapusBaris(i)}
                className="w-10 h-10 rounded-lg border border-neutral-700 text-neutral-400 hover:border-red-400 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={tambahBaris} className="mt-2 px-3 py-1.5 text-xs rounded border border-dashed border-neutral-700 text-amber-400">
          + Tambah warna
        </button>
        <p className={`text-xs mt-1.5 ${totalPersen === 100 ? "text-teal-400" : "text-neutral-500"}`}>
          Total: {totalPersen}% {totalPersen === 100 ? "— pas 100%" : totalPersen > 100 ? "— melebihi 100%" : "— tambahkan hingga 100%"}
        </p>
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1.5">Lokasi Rak</label>
        <div className="grid grid-cols-3 gap-2.5">
          <select value={lokasiKolom} onChange={(e) => setLokasiKolom(e.target.value)} className="bg-neutral-800 border border-neutral-700 rounded-md px-2.5 py-2 text-sm">
            <option value="">Kolom (X)</option>
            {PILIHAN_KOLOM.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={lokasiBaris} onChange={(e) => setLokasiBaris(e.target.value)} className="bg-neutral-800 border border-neutral-700 rounded-md px-2.5 py-2 text-sm">
            <option value="">Baris (Y)</option>
            {PILIHAN_BARIS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={lokasiKedalaman} onChange={(e) => setLokasiKedalaman(e.target.value)} className="bg-neutral-800 border border-neutral-700 rounded-md px-2.5 py-2 text-sm">
            <option value="">Kedalaman (Z)</option>
            {PILIHAN_KEDALAMAN.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1.5">Jumlah Stok {tinta ? "" : "Awal"} (Kg)</label>
        <input
          type="number"
          step="0.01"
          value={jumlahStock}
          onChange={(e) => setJumlahStock(e.target.value)}
          placeholder="0.0"
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2.5 pt-4 border-t border-neutral-800">
        <button type="submit" disabled={isPending} className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 rounded-lg bg-amber-400 text-neutral-900 font-semibold text-sm disabled:opacity-60">
          {isPending ? "Menyimpan…" : "Simpan Tinta"}
        </button>
        <button type="button" onClick={() => router.push("/tinta")} className="flex-1 sm:flex-none px-5 py-3 sm:py-2.5 rounded-lg border border-neutral-700 text-sm">
          Batal
        </button>
      </div>
    </form>
  );
}
