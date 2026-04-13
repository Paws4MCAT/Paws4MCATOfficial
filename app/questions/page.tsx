import { loadAllQuestions } from "@/lib/questions";

import { QuestionsClient } from "./questions-client";

export default async function QuestionsPage() {
  const initialQuestions = await loadAllQuestions();
  return <QuestionsClient initialQuestions={initialQuestions} />;
}
