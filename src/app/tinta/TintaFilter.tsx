"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { customers: string[]; cari: string; customer: string };

export default function TintaFilter({ customers, cari, customer }: Props) {
  const router = useRouter();
  const [cariInput, setCariInput] = useState(cari);

  function terapkan(cariBaru: string, customerBaru: string) {
    const params = new URLSearchParams();
    if (cariBaru.trim()) params.set("cari", cariBaru.trim());
    if (customerBaru) params.set("customer", customerBaru);
    const qs = params.toString();
    router.push(qs ? `/tinta?${qs}` : "/tinta");
  }

  return (
    <>
      <select
        value={customer}
        onChange={(e) => terapkan(cariInput, e.target.value)}
        aria-label="Filter nama customer"
        className="w-full sm:w-56 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm"
      >
        <option value="">Semua customer ({customers.length})</option>
        {customers.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          terapkan(cariInput, customer);
        }}
        className="flex-1"
      >
        <input
          type="text"
          value={cariInput}
          onChange={(e) => setCariInput(e.target.value)}
          placeholder="Cari customer, cetakan, atau TC/Pantone… (Enter)"
          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm placeholder:text-neutral-500"
        />
      </form>
    </>
  );
}
