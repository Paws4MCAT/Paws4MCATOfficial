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

export type DiagnosticAnswer = {
  questionId: string;
  isCorrect: boolean;
  category: McatCategory;
  subcategory: string;
  difficulty: Difficulty;
};

export type CategoryPerformance = {
  total: number;
  correct: number;
  accuracy: number;
};

export type DiagnosticResult = {
  overallAccuracy: number;
  categoryPerformance: Record<McatCategory, CategoryPerformance>;
  weakAreas: McatCategory[];
  completedAt: string;
};

export type PracticeProgress = {
  selectedCategory: McatCategory | "all";
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  answerHistory: AnswerRecord[];
  updatedAt?: string;
};
