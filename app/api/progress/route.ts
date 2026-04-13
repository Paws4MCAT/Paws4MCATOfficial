import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import type { McatCategory } from "@/lib/types";

const validCategories = new Set<McatCategory | "all">(["all", "cp", "bb", "ps", "cars"]);

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const result = await pool.query<{
    selected_category: McatCategory | "all";
    current_question_index: number;
    selected_answer: string | null;
    answer_history: unknown;
    updated_at: string;
  }>(
    `SELECT selected_category, current_question_index, selected_answer, answer_history, updated_at
     FROM practice_progress
     WHERE user_id = $1
     LIMIT 1`,
    [user.id],
  );

  const progress = result.rows[0];

  return NextResponse.json({
    progress: progress
      ? {
          selectedCategory: progress.selected_category,
          currentQuestionIndex: progress.current_question_index,
          selectedAnswer: progress.selected_answer,
          answerHistory: progress.answer_history,
          updatedAt: progress.updated_at,
        }
      : null,
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const body = await request.json();
  const selectedCategory = body.selectedCategory;
  const currentQuestionIndex = Number(body.currentQuestionIndex);
  const selectedAnswer = typeof body.selectedAnswer === "string" ? body.selectedAnswer : null;
  const answerHistory = Array.isArray(body.answerHistory) ? body.answerHistory : null;

  if (
    !validCategories.has(selectedCategory) ||
    !Number.isInteger(currentQuestionIndex) ||
    currentQuestionIndex < 0 ||
    !answerHistory
  ) {
    return NextResponse.json({ error: "Invalid progress payload." }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO practice_progress
       (user_id, selected_category, current_question_index, selected_answer, answer_history, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       selected_category = EXCLUDED.selected_category,
       current_question_index = EXCLUDED.current_question_index,
       selected_answer = EXCLUDED.selected_answer,
       answer_history = EXCLUDED.answer_history,
       updated_at = NOW()`,
    [
      user.id,
      selectedCategory,
      currentQuestionIndex,
      selectedAnswer,
      JSON.stringify(answerHistory),
    ],
  );

  return NextResponse.json({ ok: true });
}