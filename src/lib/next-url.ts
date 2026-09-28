/** Mencegah open-redirect setelah login: hanya path internal yang diizinkan. */
export function amankanNext(nilai: string | null | undefined): string {
  if (!nilai) return "/";
  if (!nilai.startsWith("/") || nilai.startsWith("//") || nilai.startsWith("/\\")) return "/";
  if (nilai.startsWith("/login")) return "/";
  return nilai;
}
