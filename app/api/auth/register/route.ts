import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  createSession,
  hashPassword,
  normalizeUsername,
  validatePassword,
  validateUsername,
} from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawUsername = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    const username = normalizeUsername(rawUsername);

    if (!validateUsername(username)) {
      return NextResponse.json(
        { error: "Username must be 3-40 characters using letters, numbers, dots, dashes, or underscores." },
        { status: 400 },
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters." },
        { status: 400 },
      );
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await pool.query(
      "INSERT INTO users (id, username, display_name, password_hash) VALUES ($1, $2, $3, $4)",
      [id, username, rawUsername.trim(), passwordHash],
    );

    await createSession(id);

    return NextResponse.json({
      user: { id, username, displayName: rawUsername.trim() },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 },
      );
    }

    console.error("Failed to register user:", error);
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 },
    );
  }
}