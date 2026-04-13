import { NextResponse } from "next/server";

import {
  createSession,
  normalizeUsername,
  validatePassword,
  validateUsername,
  verifyPassword,
} from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = normalizeUsername(typeof body.username === "string" ? body.username : "");
    const password = typeof body.password === "string" ? body.password : "";

    if (!validateUsername(username) || !validatePassword(password)) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    const result = await pool.query<{
      id: string;
      username: string;
      display_name: string;
      password_hash: string;
    }>(
      "SELECT id, username, display_name, password_hash FROM users WHERE username = $1 LIMIT 1",
      [username],
    );

    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
      },
    });
  } catch (error) {
    console.error("Failed to log in user:", error);
    return NextResponse.json(
      { error: "Unable to log in." },
      { status: 500 },
    );
  }
}