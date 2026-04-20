import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import type { DiagnosticResult } from "@/lib/types";

/** GET /api/diagnostic — returns the current user's diagnostic result, or null */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const result = await pool.query<{
    overall_accuracy: number;
    category_performance: DiagnosticResult["categoryPerformance"];
    weak_areas: DiagnosticResult["weakAreas"];
    completed_at: string;
  }>(
    `SELECT overall_accuracy, category_performance, weak_areas, completed_at
     FROM diagnostic_results
     WHERE user_id = $1
     LIMIT 1`,
    [user.id],
  );

  const row = result.rows[0];

  return NextResponse.json({
    diagnostic: row
      ? ({
          overallAccuracy: row.overall_accuracy,
          categoryPerformance: row.category_performance,
          weakAreas: row.weak_areas,
          completedAt: row.completed_at,
        } satisfies DiagnosticResult)
      : null,
  });
}

/** POST /api/diagnostic — saves (or replaces) the diagnostic result for the current user */
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const body = (await request.json()) as Partial<DiagnosticResult>;

  if (
    typeof body.overallAccuracy !== "number" ||
    !body.categoryPerformance ||
    !Array.isArray(body.weakAreas)
  ) {
    return NextResponse.json({ error: "Invalid diagnostic payload." }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO diagnostic_results
       (user_id, overall_accuracy, category_performance, weak_areas, completed_at)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       overall_accuracy   = EXCLUDED.overall_accuracy,
       category_performance = EXCLUDED.category_performance,
       weak_areas         = EXCLUDED.weak_areas,
       completed_at       = NOW()`,
    [
      user.id,
      body.overallAccuracy,
      JSON.stringify(body.categoryPerformance),
      JSON.stringify(body.weakAreas),
    ],
  );

  return NextResponse.json({ ok: true });
}

/** DELETE /api/diagnostic — clears the current user's diagnostic result so they can retake */
export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  await pool.query(
    `DELETE FROM diagnostic_results WHERE user_id = $1`,
    [user.id],
  );

  return NextResponse.json({ ok: true });
}
