"use client";

import { useState, useTransition } from "react";
import { masuk } from "@/lib/auth-actions";

export default function LoginForm({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null);
  const [lihatPassword, setLihatPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    fd.set("next", next);

    startTransition(async () => {
      const res = await masuk(fd); // bila berhasil, action mengalihkan halaman sendiri
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
      {error && (
        <div role="alert" className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-xs text-neutral-400 mb-1.5">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs text-neutral-400 mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type={lihatPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm"
        />
        <label className="mt-2 flex items-center gap-2 text-xs text-neutral-400 select-none">
          <input
            type="checkbox"
            checked={lihatPassword}
            onChange={(e) => setLihatPassword(e.target.checked)}
            className="accent-amber-400"
          />
          Tampilkan password
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-5 py-3 rounded-lg bg-amber-400 text-neutral-900 font-semibold text-sm disabled:opacity-60"
      >
        {isPending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
