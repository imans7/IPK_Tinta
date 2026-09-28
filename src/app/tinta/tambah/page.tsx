import TintaForm from "../TintaForm";

export default function TambahTintaPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Tambah Tinta Baru</h1>
      <p className="text-sm text-neutral-400 mb-6">Isi data produk, komposisi warna, dan lokasi rak</p>
      <TintaForm />
    </div>
  );
}
