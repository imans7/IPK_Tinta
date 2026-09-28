// Bagian sesi yang aman dipakai di middleware (Edge runtime): hanya jose, tanpa Prisma/bcrypt.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "gt_session";
export const SESSION_DURASI_DETIK = 60 * 60 * 8; // 8 jam (satu shift kerja)

export type RoleUser = "admin" | "operator";
export type SessionPayload = { uid: number; role: RoleUser };

function kunci() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET belum diisi atau kurang dari 32 karakter. Lihat .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export async function buatToken(p: SessionPayload): Promise<string> {
  return new SignJWT({ role: p.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(p.uid))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURASI_DETIK}s`)
    .sign(kunci());
}

/** Mengembalikan isi token bila tanda tangannya sah dan belum kedaluwarsa, selain itu null. */
export async function bacaToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const key = kunci(); // di luar try: salah konfigurasi harus terlihat, bukan diam-diam dianggap "belum login"
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const uid = Number(payload.sub);
    const role = payload.role;
    if (!Number.isInteger(uid) || (role !== "admin" && role !== "operator")) return null;
    return { uid, role };
  } catch {
    return null;
  }
}
