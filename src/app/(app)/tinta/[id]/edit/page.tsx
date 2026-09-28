import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { wajibLogin } from "@/lib/auth";
import TintaForm from "../../TintaForm";

export default async function EditTintaPage({ params }: { params: { id: string } }) {
  const user = await wajibLogin();
  if (user.role !== "admin") redirect("/tinta"); // khusus Admin

  const tinta = await prisma.tinta.findUnique({
    where: { id: Number(params.id) },
    include: { komposisi: true },
  });

  if (!tinta) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Edit Tinta</h1>
      <p className="text-sm text-neutral-400 mb-6">Isi data produk, komposisi warna, dan lokasi rak</p>
      <TintaForm tinta={tinta} />
    </div>
  );
}
