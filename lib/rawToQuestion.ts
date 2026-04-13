import { Difficulty, McatCategory, Question } from "@/lib/types";

export type RawQuestion = {
  id: string | number;
  question: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
  category: string;
};

const categoryMap: Record<string, McatCategory> = {
  chemistry: "cp",
  physics: "cp",
  biology: "bb",
  biochemistry: "bb",
  psychology: "ps",
  sociology: "ps",
  cars: "cars",
};

export function normalizeRawQuestion(raw: RawQuestion): Question {
  const rawCategory = raw.category.toLowerCase();
  return {
    id: String(raw.id),
    question: { en: raw.question },
    choices: raw.choices,
    correctAnswer: raw.correctAnswer,
    explanation: raw.explanation,
    difficulty: raw.difficulty,
    category: categoryMap[rawCategory] ?? "cars",
    subcategory: raw.category,
  };
}

export function questionsFromRawJson(raw: RawQuestion[]): Question[] {
  return raw.map(normalizeRawQuestion);
}
