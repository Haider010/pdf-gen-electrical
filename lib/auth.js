import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail, findUserById } from "./store";

const cookieName = "edoc_session";
const oneWeekSeconds = 60 * 60 * 24 * 7;

function secret() {
  return process.env.SESSION_SECRET || "development-session-secret-change-me";
}

function sign(value) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function makeToken(userId) {
  const expiresAt = Date.now() + oneWeekSeconds * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function parseToken(token) {
  if (!token || !token.includes(".")) return null;

  const [payload, signature] = token.split(".");
  if (!safeEqual(sign(payload), signature)) return null;

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!data.expiresAt || data.expiresAt < Date.now()) return null;
  return data;
}

export async function registerUser(email, password) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("An account already exists for that email.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  return createUser({ email, passwordHash });
}

export async function authenticateUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export async function setSession(userId) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: oneWeekSeconds,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  const parsed = parseToken(token);
  if (!parsed) return null;

  const user = await findUserById(parsed.userId);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, response: Response.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { user, response: null };
}
