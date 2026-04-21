import { loadAllQuestions } from "@/lib/questions";
import type { McatCategory } from "@/lib/types";

import { QuestionsClient } from "./questions-client";

const validCategories = new Set<McatCategory>(["cp", "bb", "ps", "cars"]);

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = typeof params.category === "string" ? params.category : undefined;
  const initialCategory: McatCategory | "all" =
    raw && validCategories.has(raw as McatCategory) ? (raw as McatCategory) : "all";

  const initialQuestions = await loadAllQuestions();
  return <QuestionsClient initialQuestions={initialQuestions} initialCategory={initialCategory} />;
}
