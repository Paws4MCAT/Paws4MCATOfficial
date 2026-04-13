import { cookies } from "next/headers";
import crypto from "crypto";
import { promisify } from "util";

import { pool } from "@/lib/db";

const scryptAsync = promisify(crypto.scrypt);
const sessionCookieName = "paws_session";
const sessionDurationSeconds = 60 * 60 * 24 * 30;

export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
};

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string) {
  return /^[a-z0-9._-]{3,40}$/.test(username);
}

export function validatePassword(password: string) {
  return password.length >= 8 && password.length <= 128;
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${hash.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "base64url");
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;

  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected)
  );
}

function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);

  await pool.query(
    "INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [tokenHash, userId, expiresAt],
  );

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionDurationSeconds,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await pool.query("DELETE FROM user_sessions WHERE token_hash = $1", [
      hashSessionToken(token),
    ]);
  }

  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) return null;

  await pool.query("DELETE FROM user_sessions WHERE expires_at <= NOW()");

  const result = await pool.query<{
    id: string;
    username: string;
    display_name: string;
  }>(
    `SELECT users.id, users.username, users.display_name
     FROM user_sessions
     JOIN users ON users.id = user_sessions.user_id
     WHERE user_sessions.token_hash = $1
       AND user_sessions.expires_at > NOW()
     LIMIT 1`,
    [hashSessionToken(token)],
  );

  const user = result.rows[0];
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
  };
}