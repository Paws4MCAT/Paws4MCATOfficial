import { NextRequest, NextResponse } from "next/server";

import { filterQuestions, loadAllQuestions } from "@/lib/questions";
import { Difficulty, McatCategory } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const difficulty = searchParams.get("difficulty") as Difficulty | "all" | null;
    const category = searchParams.get("category") as McatCategory | "all" | null;

    const allQuestions = await loadAllQuestions();
    const filteredQuestions = filterQuestions(allQuestions, {
      category: category ?? "all",
      difficulty: difficulty ?? "all",
    });

    return NextResponse.json(filteredQuestions);
  } catch (error) {
    console.error("Failed to load questions in API route:", error);
    return NextResponse.json({ error: "Failed to load questions." }, { status: 500 });
  }
}
