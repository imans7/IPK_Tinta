"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { linkUntuk, isActive, type UserNav } from "./nav-links";
import UserBox from "./UserBox";

export default function MobileNav({ user }: { user: UserNav }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // tutup drawer otomatis tiap pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-neutral-900 border-b border-neutral-800">
        <div className="text-[15px] font-semibold">
          Gudang<span className="text-amber-400">Tinta</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          className="w-9 h-9 flex items-center justify-center rounded-md border border-neutral-700 text-neutral-300"
        >
          ☰
        </button>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70" onClick={() => setOpen(false)}>
          <div
            className="w-64 h-full bg-neutral-900 border-r border-neutral-800 p-3.5 flex flex-col gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2.5 pt-1.5 pb-5">
              <div className="text-[15px] font-semibold">
                Gudang<span className="text-amber-400">Tinta</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Tutup menu" className="text-neutral-400 text-lg px-1">
                ✕
              </button>
            </div>
            {linkUntuk(user.role).map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-2.5 rounded-md text-sm ${
                    active ? "bg-neutral-800 text-amber-400" : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <UserBox user={user} />
          </div>
        </div>
      )}
    </>
  );
}
