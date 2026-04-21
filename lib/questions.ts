import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { McatCategory, Question } from "@/lib/types";

import { normalizeRawQuestion, type RawQuestion } from "@/lib/rawToQuestion";

export { filterQuestions } from "@/lib/filterQuestions";

const QUESTIONS_ROOT = join(process.cwd(), "data", "questions");
const QUESTIONS_JSON_FALLBACK = join(process.cwd(), "data", "questions.json");

async function readQuestionsFromCategory(category: McatCategory): Promise<Question[]> {
  const categoryPath = join(QUESTIONS_ROOT, category);
  const fileNames = await readdir(categoryPath);
  const jsonFiles = fileNames.filter((fileName) => fileName.endsWith(".json"));

  const questionsFromFiles = await Promise.all(
    jsonFiles.map(async (fileName) => {
      const filePath = join(categoryPath, fileName);
      try {
        const fileContents = await readFile(filePath, "utf8");
        const parsed = JSON.parse(fileContents) as Question[];
        return parsed;
      } catch {
        return [] as Question[];
      }
    }),
  );

  return questionsFromFiles.flat();
}

async function loadQuestionsFromJsonFallback(): Promise<Question[]> {
  try {
    const fileContents = await readFile(QUESTIONS_JSON_FALLBACK, "utf8");
    const parsed = JSON.parse(fileContents) as RawQuestion[];
    return parsed.map(normalizeRawQuestion);
  } catch {
    return [];
  }
}

export async function loadAllQuestions(): Promise<Question[]> {
  try {
    const categories: McatCategory[] = ["cp", "bb", "ps", "cars"];
    const allQuestions = await Promise.all(
      categories.map((category) => readQuestionsFromCategory(category)),
    );
    const merged = allQuestions.flat();
    if (merged.length > 0) {
      return merged;
    }
  } catch {
    // Missing data/questions layout or read errors — use JSON fallback.
  }
  return loadQuestionsFromJsonFallback();
}
