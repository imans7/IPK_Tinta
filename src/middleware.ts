import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, bacaToken } from "@/lib/session";

// Lapisan pertama: tolak yang tidak punya sesi sah. Pemeriksaan role & status akun yang
// sebenarnya dilakukan lagi di setiap halaman/Server Action (src/lib/auth.ts).
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === "/login") return NextResponse.next();

  const sesi = await bacaToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (sesi) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // foto produk (/uploads) dan aset Next dilewati
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
