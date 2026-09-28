export type UserNav = { nama: string; username: string; role: "admin" | "operator" };

export const NAV_LINKS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/", label: "Dashboard" },
  { href: "/tinta", label: "Daftar Tinta" },
  { href: "/tinta/tambah", label: "Tambah Tinta", adminOnly: true },
  { href: "/peminjaman", label: "Peminjaman" },
  { href: "/pengembalian", label: "Pengembalian" },
];

/** Menu yang boleh dilihat sesuai role. */
export function linkUntuk(role: UserNav["role"]) {
  return NAV_LINKS.filter((l) => !l.adminOnly || role === "admin");
}

/** Penentu menu aktif. "/tinta" tidak ikut aktif saat berada di "/tinta/tambah". */
export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/tinta") {
    return pathname === "/tinta" || (pathname.startsWith("/tinta/") && !pathname.startsWith("/tinta/tambah"));
  }
  return pathname === href || pathname.startsWith(href + "/");
}
