import type {
  CategoryPerformance,
  DiagnosticAnswer,
  DiagnosticResult,
  Difficulty,
  McatCategory,
  Question,
} from "@/lib/types";

const CATEGORIES: McatCategory[] = ["cp", "bb", "ps", "cars"];

const QUESTIONS_PER_CATEGORY = 3;

const DIFFICULTY_TARGETS: Difficulty[] = ["easy", "medium", "hard"];

/** Fisher-Yates shuffle — returns a new array */
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Picks questions from a category trying to match the difficulty targets.
 * Falls back to any available question if the desired difficulty is not found.
 */
function pickFromCategory(questions: Question[], count: number): Question[] {
  const byDifficulty: Record<Difficulty, Question[]> = {
    easy: shuffle(questions.filter((q) => q.difficulty === "easy")),
    medium: shuffle(questions.filter((q) => q.difficulty === "medium")),
    hard: shuffle(questions.filter((q) => q.difficulty === "hard")),
  };

  const picked: Question[] = [];
  const usedIds = new Set<string>();
  const targets = DIFFICULTY_TARGETS.slice(0, count);

  for (const difficulty of targets) {
    const pool = byDifficulty[difficulty];
    const candidate = pool.find((q) => !usedIds.has(q.id));

    if (candidate) {
      picked.push(candidate);
      usedIds.add(candidate.id);
    } else {
      // Fallback: pick any unused question from this category
      const fallback = shuffle(questions).find((q) => !usedIds.has(q.id));
      if (fallback) {
        picked.push(fallback);
        usedIds.add(fallback.id);
      }
    }
  }

  return picked;
}

/**
 * Selects a balanced set of diagnostic questions.
 * Returns QUESTIONS_PER_CATEGORY questions per MCAT category, shuffled.
 */
export function generateDiagnosticTest(allQuestions: Question[]): Question[] {
  const selected: Question[] = [];

  for (const category of CATEGORIES) {
    const categoryQuestions = allQuestions.filter((q) => q.category === category);
    const picks = pickFromCategory(categoryQuestions, QUESTIONS_PER_CATEGORY);
    selected.push(...picks);
  }

  return shuffle(selected);
}

/**
 * Computes overall accuracy, per-category accuracy, and per-subcategory accuracy
 * from a set of answered diagnostic questions.
 */
export function analyzeResults(answers: DiagnosticAnswer[]): {
  overallAccuracy: number;
  categoryPerformance: Record<McatCategory, CategoryPerformance>;
  subcategoryPerformance: Record<string, CategoryPerformance>;
} {
  const totalCorrect = answers.filter((a) => a.isCorrect).length;
  const overallAccuracy =
    answers.length === 0 ? 0 : Math.round((totalCorrect / answers.length) * 100);

  const categoryPerformance = {} as Record<McatCategory, CategoryPerformance>;
  const subcategoryPerformance: Record<string, CategoryPerformance> = {};

  for (const category of CATEGORIES) {
    const forCategory = answers.filter((a) => a.category === category);
    const correct = forCategory.filter((a) => a.isCorrect).length;
    const total = forCategory.length;
    categoryPerformance[category] = {
      total,
      correct,
      accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
    };
  }

  for (const answer of answers) {
    const key = `${answer.category}:${answer.subcategory}`;
    const existing = subcategoryPerformance[key] ?? { total: 0, correct: 0, accuracy: 0 };
    existing.total += 1;
    if (answer.isCorrect) existing.correct += 1;
    existing.accuracy = Math.round((existing.correct / existing.total) * 100);
    subcategoryPerformance[key] = existing;
  }

  return { overallAccuracy, categoryPerformance, subcategoryPerformance };
}

const WEAK_THRESHOLD = 60;

/**
 * Returns categories sorted from weakest to strongest.
 * Categories below WEAK_THRESHOLD% accuracy are considered "weak".
 */
export function getWeakAreas(
  categoryPerformance: Record<McatCategory, CategoryPerformance>,
): McatCategory[] {
  return CATEGORIES.filter(
    (category) => categoryPerformance[category].accuracy < WEAK_THRESHOLD,
  ).sort(
    (a, b) => categoryPerformance[a].accuracy - categoryPerformance[b].accuracy,
  );
}

const CATEGORY_FULL_NAMES: Record<McatCategory, string> = {
  cp: "Chemical & Physical Sciences (CP)",
  bb: "Biological & Biochemical Sciences (BB)",
  ps: "Psychological & Social Sciences (PS)",
  cars: "Critical Analysis & Reasoning Skills (CARS)",
};

export type StudyPlan = {
  focusAreas: Array<{ category: McatCategory; label: string; accuracy: number }>;
  suggestedMode: string;
  message: string;
};

/**
 * Generates a simple, actionable study plan based on weak areas.
 */
export function generateStudyPlan(
  categoryPerformance: Record<McatCategory, CategoryPerformance>,
  weakAreas: McatCategory[],
): StudyPlan {
  // Sort all categories from weakest to strongest for the focus list
  const focusAreas = [...CATEGORIES]
    .sort(
      (a, b) => categoryPerformance[a].accuracy - categoryPerformance[b].accuracy,
    )
    .map((category) => ({
      category,
      label: CATEGORY_FULL_NAMES[category],
      accuracy: categoryPerformance[category].accuracy,
    }));

  const hasWeakAreas = weakAreas.length > 0;

  const suggestedMode = hasWeakAreas
    ? `Practice weak ${weakAreas.length === 1 ? "category" : "categories"}: ${weakAreas.map((c) => c.toUpperCase()).join(", ")}`
    : "Practice all sections to maintain your strong performance";

  const message = hasWeakAreas
    ? `You scored below 60% in ${weakAreas.length} ${weakAreas.length === 1 ? "section" : "sections"}. Focus on those first to build a strong foundation.`
    : "Great job! You performed well across all sections. Keep practicing to stay sharp.";

  return { focusAreas, suggestedMode, message };
}

/**
 * Assembles a DiagnosticResult ready for storage or display.
 */
export function buildDiagnosticResult(answers: DiagnosticAnswer[]): DiagnosticResult {
  const { overallAccuracy, categoryPerformance } = analyzeResults(answers);
  const weakAreas = getWeakAreas(categoryPerformance);

  return {
    overallAccuracy,
    categoryPerformance,
    weakAreas,
    completedAt: new Date().toISOString(),
  };
}
