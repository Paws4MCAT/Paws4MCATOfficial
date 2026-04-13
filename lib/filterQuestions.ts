import { Difficulty, McatCategory, Question } from "@/lib/types";

/** Pure filter — safe to import from client components (no Node APIs). */
export function filterQuestions(
  questions: Question[],
  options: { category?: McatCategory | "all"; difficulty?: Difficulty | "all" },
): Question[] {
  return questions.filter((question) => {
    const matchesCategory =
      !options.category || options.category === "all" || question.category === options.category;
    const matchesDifficulty =
      !options.difficulty ||
      options.difficulty === "all" ||
      question.difficulty === options.difficulty;

    return matchesCategory && matchesDifficulty;
  });
}
