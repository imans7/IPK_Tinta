export const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/tinta", label: "Daftar Tinta" },
  { href: "/tinta/tambah", label: "Tambah Tinta" },
  { href: "/peminjaman", label: "Peminjaman" },
  { href: "/pengembalian", label: "Pengembalian" },
];

/** Penentu menu aktif. "/tinta" tidak ikut aktif saat berada di "/tinta/tambah". */
export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/tinta") {
    return pathname === "/tinta" || (pathname.startsWith("/tinta/") && !pathname.startsWith("/tinta/tambah"));
  }
  return pathname === href || pathname.startsWith(href + "/");
}
