import Image from "next/image";
import Link from "next/link";

import { SurfaceCard } from "@/components/SurfaceCard";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { loadAllQuestions } from "@/lib/questions";
import type { AnswerRecord, McatCategory } from "@/lib/types";

const categoryLabels: Record<McatCategory, string> = {
  cp: "Chemical & Physical",
  bb: "Biological & Biochemical",
  ps: "Psychological & Social",
  cars: "CARS",
};

type ProgressRow = {
  selected_category: McatCategory | "all";
  current_question_index: number;
  answer_history: unknown;
  updated_at: Date;
};

function isAnswerRecord(value: unknown): value is AnswerRecord {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Partial<AnswerRecord>;
  return (
    typeof record.questionId === "string" &&
    typeof record.isCorrect === "boolean" &&
    typeof record.category === "string" &&
    ["cp", "bb", "ps", "cars"].includes(record.category) &&
    typeof record.subcategory === "string" &&
    typeof record.timestamp === "number"
  );
}

function parseAnswerHistory(value: unknown) {
  return Array.isArray(value) ? value.filter(isAnswerRecord) : [];
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-12">
        <SurfaceCard tone="brand" className="w-full p-8 text-center sm:p-12">
          <Image
            src="/paws4mcat-logo-transparent.png"
            alt="Paws4MCAT logo"
            width={900}
            height={560}
            priority
            className="mx-auto mb-4 h-auto w-full max-w-xs"
          />
          <h1 className="text-3xl font-extrabold text-slate-900">
            Log in to view your dashboard
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Your dashboard uses saved practice history, so sign in or create an account
            before viewing section accuracy and recent answers.
          </p>
          <Link
            href="/questions"
            className={[
              "mt-6 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white",
              "transition duration-200 ease-out motion-reduce:transition-none",
              "hover:scale-[1.02] hover:shadow-md active:scale-[0.99]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            ].join(" ")}
          >
            Go to login
          </Link>
        </SurfaceCard>
      </main>
    );
  }

  const [progressResult, questions, diagnosticResult] = await Promise.all([
    pool.query<ProgressRow>(
      `SELECT selected_category, current_question_index, answer_history, updated_at
       FROM practice_progress
       WHERE user_id = $1
       LIMIT 1`,
      [user.id],
    ),
    loadAllQuestions(),
    pool.query(
      `SELECT *
       FROM diagnostic_results
       WHERE user_id = $1
       LIMIT 1`,
      [user.id],
    ),
  ]);

  const diagnostic = diagnosticResult.rows[0] ?? null;

  const progress = progressResult.rows[0] ?? null;
  const answerHistory = parseAnswerHistory(progress?.answer_history);
  const totalAnswered = answerHistory.length;
  const totalCorrect = answerHistory.filter((record) => record.isCorrect).length;
  const totalAccuracy =
    totalAnswered === 0 ? 0 : Math.round((totalCorrect / totalAnswered) * 100);
  const questionLookup = new Map(questions.map((question) => [question.id, question]));

  const sectionStats = (Object.keys(categoryLabels) as McatCategory[]).map((category) => {
    const sectionAnswers = answerHistory.filter((record) => record.category === category);
    const correct = sectionAnswers.filter((record) => record.isCorrect).length;
    const total = sectionAnswers.length;
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

    return {
      category,
      label: categoryLabels[category],
      correct,
      total,
      accuracy,
    };
  });

  const recentAnswers = [...answerHistory]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 10)
    .map((record) => ({
      ...record,
      question: questionLookup.get(record.questionId),
    }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10">
      <header className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/questions"
            className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            Back to practice
          </Link>
          <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            {user.displayName || user.username}
          </span>
        </div>
        <div className="text-center">
          <Image
            src="/paws4mcat-logo-transparent.png"
            alt="Paws4MCAT logo"
            width={900}
            height={560}
            priority
            className="mx-auto mb-3 h-auto w-full max-w-xs sm:max-w-sm"
          />
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Student Dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            Track your MCAT accuracy and recent practice history.
          </p>
        </div>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SurfaceCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Questions answered
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{totalAnswered}</p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Overall accuracy
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{totalAccuracy}%</p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current section
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {progress?.selected_category === "all"
              ? "All"
              : progress?.selected_category?.toUpperCase() ?? "None"}
          </p>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <SurfaceCard className="p-5">
          <h2 className="text-lg font-extrabold text-slate-900">Accuracy by section</h2>
          <div className="mt-5 space-y-4">
            {sectionStats.map((section) => (
              <div key={section.category}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{section.label}</p>
                    <p className="text-xs font-medium text-slate-500">
                      {section.correct}/{section.total} correct
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">
                    {section.accuracy}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                    style={{ width: `${section.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <h2 className="text-lg font-extrabold text-slate-900">Recent practice history</h2>
          {recentAnswers.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-slate-50/80 p-5 text-sm leading-relaxed text-slate-600">
              No saved answers yet. Answer a few practice questions while logged in to
              populate this dashboard.
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-200/80">
              {recentAnswers.map((record) => (
                <li key={`${record.questionId}-${record.timestamp}`} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                        {record.category}
                      </span>
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold",
                          record.isCorrect
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700",
                        ].join(" ")}
                      >
                        {record.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {formatDate(record.timestamp)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-relaxed text-slate-800">
                    {record.question?.question.en ?? record.subcategory}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {record.subcategory}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>
      </div>
    </main>
  );
}