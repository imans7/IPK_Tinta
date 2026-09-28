import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { getCurrentUser } from "@/lib/auth";

// Semua halaman di dalam grup (app) hanya untuk user yang sudah login.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const nav = { nama: user.nama, username: user.username, role: user.role };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={nav} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav user={nav} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-4xl px-5 py-6 sm:px-8 sm:py-8 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
