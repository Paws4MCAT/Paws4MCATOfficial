import { loadAllQuestions } from "@/lib/questions";
import { generateDiagnosticTest } from "@/lib/diagnostic";
import { DiagnosticClient } from "./DiagnosticClient";

export default async function DiagnosticPage() {
  const allQuestions = await loadAllQuestions();
  const diagnosticQuestions = generateDiagnosticTest(allQuestions);

  return <DiagnosticClient questions={diagnosticQuestions} />;
}
