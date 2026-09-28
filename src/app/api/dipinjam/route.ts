export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.transaksiPeminjaman.findMany({
    where: { status: "dipinjam" },
    include: { tinta: true },
    orderBy: { tanggalPinjam: "desc" },
  });

  return NextResponse.json(data);
}