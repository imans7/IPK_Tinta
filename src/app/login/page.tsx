import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { amankanNext } from "@/lib/next-url";
import LoginForm from "./LoginForm";

export const metadata = { title: "Masuk — GudangTinta" };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = amankanNext(searchParams.next);

  // sudah login → langsung ke tujuan
  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="text-2xl font-semibold">
            Gudang<span className="text-amber-400">Tinta</span>
          </div>
          <p className="text-sm text-neutral-400 mt-1.5">Masuk untuk mengelola stok & peminjaman tinta</p>
        </div>

        <LoginForm next={next} />

        <p className="text-xs text-neutral-500 text-center mt-5 leading-relaxed">
          Pendaftaran akun tidak tersedia di halaman ini.
          <br />
          Hubungi pengelola sistem untuk dibuatkan akun.
        </p>
      </div>
    </div>
  );
}
