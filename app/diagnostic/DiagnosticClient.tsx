"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { SurfaceCard } from "@/components/SurfaceCard";
import { QuestionCard } from "@/components/QuestionCard";
import {
  buildDiagnosticResult,
  generateStudyPlan,
  getWeakAreas,
} from "@/lib/diagnostic";
import type {
  DiagnosticAnswer,
  DiagnosticResult,
  McatCategory,
  Question,
} from "@/lib/types";

type Phase = "loading" | "already-done" | "intro" | "test" | "results";

const CATEGORY_LABELS: Record<McatCategory, string> = {
  cp: "Chemical & Physical Sciences",
  bb: "Biological & Biochemical Sciences",
  ps: "Psychological & Social Sciences",
  cars: "Critical Analysis & Reasoning Skills",
};

type DiagnosticClientProps = {
  questions: Question[];
};

export function DiagnosticClient({ questions }: DiagnosticClientProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<DiagnosticAnswer[]>([]);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [existingResult, setExistingResult] = useState<DiagnosticResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackPopup, setFeedbackPopup] = useState<"correct" | "wrong" | null>(null);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, []);

  // On mount: check auth + existing diagnostic
  useEffect(() => {
    async function checkStatus() {
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      if (!meRes.ok) {
        // Not logged in — redirect to home
        window.location.href = "/";
        return;
      }

      const diagRes = await fetch("/api/diagnostic", { cache: "no-store" });
      if (diagRes.ok) {
        const data = (await diagRes.json()) as { diagnostic: DiagnosticResult | null };
        if (data.diagnostic) {
          setExistingResult(data.diagnostic);
          setPhase("already-done");
          return;
        }
      }

      setPhase("intro");
    }

    checkStatus();
  }, []);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPct =
    questions.length === 0 ? 0 : Math.round(((currentIndex + 1) / questions.length) * 100);

  function handleSelectAnswer(answer: string) {
    if (selectedAnswer || !currentQuestion) return;
    setSelectedAnswer(answer);

    const isCorrect = answer === currentQuestion.correctAnswer;
    const newAnswer: DiagnosticAnswer = {
      questionId: currentQuestion.id,
      isCorrect,
      category: currentQuestion.category,
      subcategory: currentQuestion.subcategory,
      difficulty: currentQuestion.difficulty,
    };
    setAnswers((prev) => [...prev, newAnswer]);

    setFeedbackPopup(isCorrect ? "correct" : "wrong");
    setIsFeedbackVisible(true);
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    popupTimeoutRef.current = setTimeout(() => {
      setIsFeedbackVisible(false);
      setTimeout(() => setFeedbackPopup(null), 220);
    }, 2500);
  }

  async function handleNextQuestion() {
    if (!isLastQuestion) {
      setSelectedAnswer(null);
      setFeedbackPopup(null);
      setIsFeedbackVisible(false);
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    // Last question answered — compute + save results
    const built = buildDiagnosticResult(answers);
    setResult(built);
    setPhase("results");

    setIsSaving(true);
    try {
      await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(built),
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleRetakeTest() {
    setPhase("intro");
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setResult(null);
    setExistingResult(null);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
        <SurfaceCard tone="brand" className="w-full p-8 text-center">
          <p className="text-sm font-semibold text-slate-500">Loading your profile...</p>
        </SurfaceCard>
      </main>
    );
  }

  // ── Already completed ─────────────────────────────────────────────────────
  if (phase === "already-done" && existingResult) {
    return <ResultsView result={existingResult} onRetake={handleRetakeTest} />;
  }

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
        <SurfaceCard tone="brand" className="w-full p-8 paws-enter">
          <div className="text-center">
            <Image
              src="/paws4mcat-logo-transparent.png"
              alt="Paws4MCAT logo"
              width={900}
              height={560}
              priority
              className="mx-auto mb-6 h-auto w-full max-w-xs"
            />
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Diagnostic Test
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-600">
              Take a quick {questions.length}-question diagnostic to personalize your study plan.
              We will identify your strengths and weak areas across all four MCAT sections.
            </p>

            <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 text-left">
              {(["cp", "bb", "ps", "cars"] as McatCategory[]).map((cat) => (
                <div
                  key={cat}
                  className="rounded-2xl bg-white/70 px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <span className="mb-1 block font-extrabold uppercase tracking-wide text-blue-700">
                    {cat.toUpperCase()}
                  </span>
                  {CATEGORY_LABELS[cat].split("&")[0].trim()}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPhase("test")}
              className={[
                "mt-8 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white",
                "transition duration-200 ease-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
              ].join(" ")}
            >
              Start Diagnostic Test
            </button>
            <p className="mt-3 text-xs text-slate-500">
              Takes about 5–10 minutes · {questions.length} questions
            </p>

            <div className="mt-6 border-t border-slate-200/60 pt-5">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-500 underline-offset-2 hover:underline"
              >
                Back to home
              </Link>
            </div>
          </div>
        </SurfaceCard>
      </main>
    );
  }

  // ── Test ──────────────────────────────────────────────────────────────────
  if (phase === "test" && currentQuestion) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
        <div className="mb-6 text-center">
          <Image
            src="/paws4mcat-logo-transparent.png"
            alt="Paws4MCAT logo"
            width={900}
            height={560}
            priority
            className="mx-auto mb-3 h-auto w-full max-w-[200px]"
          />
          <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Diagnostic Test</h1>
        </div>

        {/* Progress bar */}
        <SurfaceCard className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span className="tabular-nums">{progressPct}%</span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 shadow-inner"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {answers.filter((a) => a.isCorrect).length} correct so far
          </p>
        </SurfaceCard>

        <QuestionCard
          question={currentQuestion}
          language="en"
          selectedAnswer={selectedAnswer}
          onSelectAnswer={handleSelectAnswer}
          showFeedback={Boolean(selectedAnswer)}
          onNextQuestion={handleNextQuestion}
        />

        {feedbackPopup && (
          <div
            className={[
              "pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4",
              "transition duration-200 ease-out",
              isFeedbackVisible ? "opacity-100" : "opacity-0",
            ].join(" ")}
            aria-hidden={!isFeedbackVisible}
          >
            <Image
              src={feedbackPopup === "correct" ? "/paws4mcat-correct.png" : "/paws4mcat-wrong.png"}
              alt={feedbackPopup === "correct" ? "Correct" : "Incorrect"}
              width={900}
              height={560}
              className={[
                "h-auto w-full max-w-xl drop-shadow-2xl transition duration-200 ease-out",
                isFeedbackVisible ? "scale-100" : "scale-[0.98]",
              ].join(" ")}
              priority
            />
          </div>
        )}
      </main>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (phase === "results" && result) {
    return <ResultsView result={result} onRetake={handleRetakeTest} isSaving={isSaving} />;
  }

  return null;
}

// ── Results view (shared between fresh results and existing results) ─────────

function ResultsView({
  result,
  onRetake,
  isSaving = false,
}: {
  result: DiagnosticResult;
  onRetake: () => void;
  isSaving?: boolean;
}) {
  const weakAreas = getWeakAreas(result.categoryPerformance);
  const studyPlan = generateStudyPlan(result.categoryPerformance, weakAreas);
  const allCategories = studyPlan.focusAreas;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <div className="mb-8 text-center paws-enter">
        <Image
          src="/paws4mcat-logo-transparent.png"
          alt="Paws4MCAT logo"
          width={900}
          height={560}
          priority
          className="mx-auto mb-4 h-auto w-full max-w-[200px]"
        />
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Your Diagnostic Results
        </h1>
        <p className="mt-2 text-slate-600">{studyPlan.message}</p>
      </div>

      {/* Overall accuracy */}
      <SurfaceCard tone="brand" className="mb-6 p-6 paws-enter">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Overall Accuracy
            </p>
            <p className="mt-1 text-5xl font-extrabold text-slate-900">
              {result.overallAccuracy}%
            </p>
          </div>
          <div
            className={[
              "rounded-full px-4 py-2 text-sm font-bold",
              result.overallAccuracy >= 75
                ? "bg-green-100 text-green-800"
                : result.overallAccuracy >= 50
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800",
            ].join(" ")}
          >
            {result.overallAccuracy >= 75
              ? "Strong"
              : result.overallAccuracy >= 50
                ? "Developing"
                : "Needs Work"}
          </div>
        </div>
        {isSaving && (
          <p className="mt-3 text-xs font-medium text-slate-400">Saving your results...</p>
        )}
        {!isSaving && (
          <p className="mt-3 text-xs font-medium text-slate-400">Results saved to your account.</p>
        )}
      </SurfaceCard>

      {/* Section breakdown */}
      <SurfaceCard className="mb-6 paws-enter">
        <h2 className="text-lg font-extrabold text-slate-900">Section Breakdown</h2>
        <div className="mt-4 space-y-4">
          {allCategories.map(({ category, label, accuracy }) => {
            const perf = result.categoryPerformance[category];
            const isWeak = weakAreas.includes(category);
            return (
              <div key={category}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{label}</span>
                    {isWeak && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                        Focus area
                      </span>
                    )}
                  </div>
                  <span className="font-extrabold tabular-nums text-slate-900">{accuracy}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className={[
                      "h-full rounded-full transition-[width] duration-700 ease-out",
                      isWeak
                        ? "bg-gradient-to-r from-red-400 to-orange-400"
                        : "bg-gradient-to-r from-blue-600 to-purple-600",
                    ].join(" ")}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {perf.correct}/{perf.total} correct
                </p>
              </div>
            );
          })}
        </div>
      </SurfaceCard>

      {/* Study plan */}
      <SurfaceCard className="mb-6 paws-enter">
        <h2 className="text-lg font-extrabold text-slate-900">Recommended Focus Areas</h2>
        <ol className="mt-4 space-y-2">
          {allCategories.map(({ category, label, accuracy }, index) => {
            const isWeak = weakAreas.includes(category);
            return (
              <li key={category} className="flex items-start gap-3">
                <span
                  className={[
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
                    isWeak
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{accuracy}% accuracy</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 rounded-2xl bg-blue-50/80 px-4 py-3">
          <p className="text-xs font-semibold text-slate-700">
            <span className="font-extrabold text-blue-700">Suggested next step: </span>
            {studyPlan.suggestedMode}
          </p>
        </div>
      </SurfaceCard>

      {/* CTA buttons */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center paws-enter">
        <Link
          href={
            weakAreas.length > 0
              ? `/questions?category=${weakAreas[0]}`
              : "/questions"
          }
          className={[
            "inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 font-semibold text-white",
            "transition duration-200 ease-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
          ].join(" ")}
        >
          Start Personalized Practice
        </Link>
        <Link
          href="/"
          className={[
            "inline-flex rounded-full border border-slate-300 bg-white/80 px-7 py-3 font-semibold text-slate-700",
            "transition duration-200 ease-out hover:bg-white hover:shadow-md active:scale-[0.99]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
          ].join(" ")}
        >
          Go to Dashboard
        </Link>
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onRetake}
          className="text-xs font-semibold text-slate-400 underline-offset-2 hover:underline"
        >
          Retake diagnostic test
        </button>
      </div>
    </main>
  );
}
