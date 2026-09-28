import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const data = await prisma.transaksiPeminjaman.findMany({
    where: { status: "dipinjam" },
    include: { tinta: true },
    orderBy: { tanggalPinjam: "desc" },
  });

  return NextResponse.json(data);
}
