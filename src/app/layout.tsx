import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "GudangTinta",
  description: "Manajemen stok & peminjaman tinta cetakan",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <MobileNav />
            <main className="flex-1">
              <div className="mx-auto w-full max-w-4xl px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
