"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function RiwayatFilter({ periode, cari }: { periode: string; cari: string }) {
  const router = useRouter();
  const [cariInput, setCariInput] = useState(cari);
  const [, startTransition] = useTransition();

  function terapkan(periodeBaru: string, cariBaru: string) {
    const params = new URLSearchParams();
    if (periodeBaru !== "6") params.set("periode", periodeBaru);
    if (cariBaru) params.set("cari", cariBaru);
    startTransition(() => router.push(`/?${params.toString()}`));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[13px] font-semibold text-neutral-400">Riwayat Peminjaman</div>
        <a
          href={`/api/export?periode=${periode}&cari=${encodeURIComponent(cari)}`}
          className="text-xs px-3 py-1.5 rounded border border-neutral-700 hover:border-amber-400 hover:text-amber-400"
        >
          ⬇ Export ke Excel
        </a>
      </div>
      <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
        <select
          value={periode}
          onChange={(e) => terapkan(e.target.value, cariInput)}
          className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm w-full sm:w-44"
        >
          <option value="6">6 bulan terakhir</option>
          <option value="3">3 bulan terakhir</option>
          <option value="1">1 bulan terakhir</option>
        </select>
        <input
          type="text"
          value={cariInput}
          onChange={(e) => setCariInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && terapkan(periode, cariInput)}
          onBlur={() => terapkan(periode, cariInput)}
          placeholder="Cari nama peminjam atau cetakan… (Enter untuk cari)"
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm placeholder:text-neutral-500"
        />
      </div>
    </div>
  );
}
