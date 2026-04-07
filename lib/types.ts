export type Difficulty = "easy" | "medium" | "hard";

export type Question = {
  id: number;
  question: string;
  choices: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
  category: string;
};
