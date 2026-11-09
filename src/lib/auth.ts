import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

const CLIENT_COOKIE = "ml_session";
const ADMIN_COOKIE = "ml_admin";
const CLIENT_TTL_DAYS = 60;
const ADMIN_TTL_DAYS = 7;

async function createSession(opts: { clientId?: number; isAdmin?: boolean }) {
  const token = randomBytes(32).toString("base64url");
  const days = opts.isAdmin ? ADMIN_TTL_DAYS : CLIENT_TTL_DAYS;
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  await prisma.session.create({
    data: { token, clientId: opts.clientId, isAdmin: !!opts.isAdmin, expiresAt },
  });
  const jar = await cookies();
  jar.set(opts.isAdmin ? ADMIN_COOKIE : CLIENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

async function readSession(cookieName: string) {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const s = await prisma.session.findUnique({ where: { token }, include: { client: true } });
  if (!s || s.expiresAt < new Date()) return null;
  return s;
}

async function destroySession(cookieName: string) {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  jar.delete(cookieName);
}

// ——— клиент ———

export async function loginClient(clientId: number) {
  await createSession({ clientId });
}

export async function getCurrentClient() {
  const s = await readSession(CLIENT_COOKIE);
  return s?.client ?? null;
}

/** Для страниц, доступных только после входа. */
export async function requireClient(next: string) {
  const client = await getCurrentClient();
  if (!client) redirect(`/login?next=${encodeURIComponent(next)}`);
  return client;
}

export async function logoutClient() {
  await destroySession(CLIENT_COOKIE);
}

// ——— администратор ———

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function loginAdmin(login: string, password: string): Promise<boolean> {
  const expectedLogin = process.env.ADMIN_LOGIN ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedLogin || !expectedPassword) return false;
  const ok = safeEqual(login, expectedLogin) && safeEqual(password, expectedPassword);
  if (ok) await createSession({ isAdmin: true });
  return ok;
}

export async function isAdmin() {
  const s = await readSession(ADMIN_COOKIE);
  return !!s?.isAdmin;
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function logoutAdmin() {
  await destroySession(ADMIN_COOKIE);
}
