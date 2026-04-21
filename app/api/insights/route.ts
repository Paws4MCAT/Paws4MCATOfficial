import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { generateRecommendations } from "@/lib/diagnostic";
import { pool } from "@/lib/db";
import type { AnswerRecord, CategoryPerformance, DiagnosticResult, McatCategory } from "@/lib/types";

const CATEGORIES: McatCategory[] = ["cp", "bb", "ps", "cars"];

export type InsightsPayload = {
  diagnostic: DiagnosticResult | null;
  practice: {
    totalAnswered: number;
    totalCorrect: number;
    overallAccuracy: number;
    categoryPerformance: Record<McatCategory, CategoryPerformance>;
  } | null;
  improvement: {
    overall: number;
    byCategory: Record<McatCategory, number>;
  } | null;
  recommendations: string[];
  weakAreas: McatCategory[];
};

/** GET /api/insights — returns combined diagnostic + practice performance data */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const [diagResult, progressResult] = await Promise.all([
    pool.query<{
      overall_accuracy: number;
      category_performance: DiagnosticResult["categoryPerformance"];
      weak_areas: DiagnosticResult["weakAreas"];
      completed_at: string;
    }>(
      `SELECT overall_accuracy, category_performance, weak_areas, completed_at
       FROM diagnostic_results WHERE user_id = $1`,
      [user.id],
    ),
    pool.query<{ answer_history: AnswerRecord[] }>(
      `SELECT answer_history FROM practice_progress WHERE user_id = $1`,
      [user.id],
    ),
  ]);

  const diagRow = diagResult.rows[0];
  const progressRow = progressResult.rows[0];

  const diagnostic: DiagnosticResult | null = diagRow
    ? {
        overallAccuracy: diagRow.overall_accuracy,
        categoryPerformance: diagRow.category_performance,
        weakAreas: diagRow.weak_areas,
        completedAt: diagRow.completed_at,
      }
    : null;

  const answerHistory: AnswerRecord[] = progressRow?.answer_history ?? [];

  let practice: InsightsPayload["practice"] = null;
  if (answerHistory.length > 0) {
    const totalCorrect = answerHistory.filter((a) => a.isCorrect).length;
    const totalAnswered = answerHistory.length;
    const overallAccuracy = Math.round((totalCorrect / totalAnswered) * 100);

    const categoryPerformance = {} as Record<McatCategory, CategoryPerformance>;
    for (const cat of CATEGORIES) {
      const catAnswers = answerHistory.filter((a) => a.category === cat);
      const correct = catAnswers.filter((a) => a.isCorrect).length;
      const total = catAnswers.length;
      categoryPerformance[cat] = {
        total,
        correct,
        accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
      };
    }

    practice = { totalAnswered, totalCorrect, overallAccuracy, categoryPerformance };
  }

  let improvement: InsightsPayload["improvement"] = null;
  if (diagnostic && practice) {
    const overall = practice.overallAccuracy - diagnostic.overallAccuracy;
    const byCategory = {} as Record<McatCategory, number>;
    for (const cat of CATEGORIES) {
      const baseline = diagnostic.categoryPerformance[cat]?.accuracy ?? 0;
      const current = practice.categoryPerformance[cat]?.accuracy ?? 0;
      byCategory[cat] = current - baseline;
    }
    improvement = { overall, byCategory };
  }

  const weakAreas = diagnostic?.weakAreas ?? [];
  const currentCategoryPerf =
    practice?.categoryPerformance ??
    diagnostic?.categoryPerformance ??
    ({} as Record<McatCategory, CategoryPerformance>);
  const recommendations = generateRecommendations(weakAreas, currentCategoryPerf);

  return NextResponse.json({
    diagnostic,
    practice,
    improvement,
    recommendations,
    weakAreas,
  } satisfies InsightsPayload);
}
