"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { linkUntuk, isActive, type UserNav } from "./nav-links";
import UserBox from "./UserBox";

export default function Sidebar({ user }: { user: UserNav }) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex w-56 shrink-0 bg-neutral-900 border-r border-neutral-800 p-3.5 flex-col gap-0.5">
      <div className="px-2.5 pt-1.5 pb-5 text-[15px] font-semibold">
        Gudang<span className="text-amber-400">Tinta</span>
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
    </nav>
  );
}
