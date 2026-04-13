import { Language } from "./language";

export type Difficulty = "easy" | "medium" | "hard";
export type McatCategory = "cp" | "bb" | "ps" | "cars";

export type LocalizedQuestionText = {
  en: string;
} & Partial<Record<Language, string>> &
  Partial<Record<string, string>>;

export type Question = {
  id: string;
  question: LocalizedQuestionText;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
  category: McatCategory;
  subcategory: string;
};

export type AnswerRecord = {
  questionId: string;
  isCorrect: boolean;
  category: McatCategory;
  subcategory: string;
  timestamp: number;
};
