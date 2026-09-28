// Bagian sesi yang berjalan di server Node (memakai database & cookies()).
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_DURASI_DETIK, bacaToken, type RoleUser } from "@/lib/session";

export type UserSesi = { id: number; username: string; nama: string; role: RoleUser };

/**
 * User yang sedang login, atau null. Selain memeriksa tanda tangan token, data user dibaca
 * ulang dari database sehingga akun yang dinonaktifkan/dihapus/diubah rolenya langsung berlaku.
 */
export const getCurrentUser = cache(async (): Promise<UserSesi | null> => {
  const sesi = await bacaToken(cookies().get(SESSION_COOKIE)?.value);
  if (!sesi) return null;

  const user = await prisma.user.findUnique({ where: { id: sesi.uid } });
  if (!user || !user.aktif) return null;

  return { id: user.id, username: user.username, nama: user.nama, role: user.role };
});

/** Untuk halaman & Server Action yang butuh login. Belum login → diarahkan ke /login. */
export async function wajibLogin(): Promise<UserSesi> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Untuk Server Action khusus Admin. Bukan Admin → ditolak. */
export async function wajibAdmin(): Promise<UserSesi> {
  const user = await wajibLogin();
  if (user.role !== "admin") throw new Error("Akses ditolak: hanya Admin yang boleh melakukan ini.");
  return user;
}

export function simpanSesi(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true, // tidak bisa dibaca JavaScript di browser
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_DURASI_DETIK,
  });
}

export function hapusSesi() {
  cookies().delete(SESSION_COOKIE);
}
