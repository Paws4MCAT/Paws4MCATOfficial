import { NextRequest, NextResponse } from "next/server";

import rawQuestions from "@/data/questions.json";
import { Difficulty, Question } from "@/lib/types";

export function GET(request: NextRequest) {
  // We read query params from the URL (example: ?difficulty=easy).
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get("difficulty") as Difficulty | null;

  const questions = rawQuestions as Question[];

  if (!difficulty) {
    return NextResponse.json(questions);
  }

  const filteredQuestions = questions.filter(
    (question) => question.difficulty === difficulty,
  );

  return NextResponse.json(filteredQuestions);
}
