import { keluar } from "@/lib/auth-actions";
import type { UserNav } from "./nav-links";

export default function UserBox({ user }: { user: UserNav }) {
  return (
    <div className="mt-auto border-t border-neutral-800 pt-3">
      <div className="px-2.5 text-sm font-medium truncate">{user.nama}</div>
      <div className="px-2.5 text-[11px] text-neutral-500 mb-2 truncate">
        {user.role === "admin" ? "Admin" : "Operator"} · @{user.username}
      </div>
      <form action={keluar}>
        <button
          type="submit"
          className="w-full px-3 py-2.5 rounded-md text-sm text-left text-neutral-400 hover:bg-neutral-800 hover:text-red-400"
        >
          Keluar
        </button>
      </form>
    </div>
  );
}
