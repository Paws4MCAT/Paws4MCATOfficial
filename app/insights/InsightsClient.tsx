"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SurfaceCard } from "@/components/SurfaceCard";
import { CATEGORY_LABELS } from "@/lib/diagnostic";
import type { CategoryPerformance, DiagnosticResult, McatCategory } from "@/lib/types";

const CATEGORIES: McatCategory[] = ["cp", "bb", "ps", "cars"];

type PracticeStats = {
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  categoryPerformance: Record<McatCategory, CategoryPerformance>;
};

type ImprovementData = {
  overall: number;
  byCategory: Record<McatCategory, number>;
};

type InsightsData = {
  diagnostic: DiagnosticResult | null;
  practice: PracticeStats | null;
  improvement: ImprovementData | null;
  recommendations: string[];
  weakAreas: McatCategory[];
};

const LS_KEY = "paws4mcat:diagnostic";

function clearDiagnosticLocalStorage() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
  }
}

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return <span className="font-bold text-slate-400">–</span>;
  }
  const isPos = value > 0;
  return (
    <span className={["font-extrabold tabular-nums", isPos ? "text-green-600" : "text-red-600"].join(" ")}>
      {isPos ? "+" : ""}
      {value}%
    </span>
  );
}

function AccuracyBar({ value, isWeak }: { value: number; isWeak: boolean }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
      <div
        className={[
          "h-full rounded-full transition-[width] duration-700 ease-out",
          isWeak
            ? "bg-gradient-to-r from-red-400 to-orange-400"
            : "bg-gradient-to-r from-blue-500 to-purple-600",
        ].join(" ")}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function AccuracyBadge({ value }: { value: number }) {
  const [label, cls] =
    value >= 75
      ? ["Strong", "bg-green-100 text-green-800"]
      : value >= 60
        ? ["Good", "bg-blue-100 text-blue-800"]
        : value >= 40
          ? ["Developing", "bg-amber-100 text-amber-800"]
          : ["Needs Work", "bg-red-100 text-red-800"];
  return (
    <span className={["rounded-full px-3 py-1 text-xs font-bold", cls].join(" ")}>{label}</span>
  );
}

export function InsightsClient() {
  const router = useRouter();
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetaking, setIsRetaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      if (!res.ok) throw new Error("Unable to load insights.");
      const json = (await res.json()) as InsightsData;
      setData(json);
    } catch {
      setError("Could not load your performance data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRetake() {
    setIsRetaking(true);
    try {
      clearDiagnosticLocalStorage();
      await fetch("/api/diagnostic", { method: "DELETE" });
      router.push("/diagnostic");
    } catch {
      setIsRetaking(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
        <SurfaceCard tone="brand" className="w-full p-8 text-center">
          <p className="text-sm font-semibold text-slate-500">Loading your insights...</p>
        </SurfaceCard>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
        <SurfaceCard tone="brand" className="w-full p-8 text-center">
          <p className="mb-4 text-sm font-semibold text-red-600">{error}</p>
          <button
            type="button"
            onClick={load}
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </SurfaceCard>
      </main>
    );
  }

  const { diagnostic, practice, improvement, recommendations, weakAreas } = data ?? {
    diagnostic: null,
    practice: null,
    improvement: null,
    recommendations: [],
    weakAreas: [],
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      {/* Compact header */}
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <Image
            src="/paws4mcat-logo-transparent.png"
            alt="Paws4MCAT"
            width={900}
            height={560}
            priority
            className="h-auto w-10 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline underline-offset-2"
            >
              ← Home
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Performance Insights
            </h1>
          </div>
        </div>
      </header>

      {/* No diagnostic yet */}
      {!diagnostic && (
        <SurfaceCard tone="brand" className="p-8 text-center paws-enter">
          <p className="text-lg font-extrabold text-slate-900">No diagnostic results yet</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Take a quick diagnostic test to unlock your personalized insights dashboard. We will
            identify your strengths and weak areas across all four MCAT sections.
          </p>
          <Link
            href="/diagnostic"
            className={[
              "mt-6 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-sm font-semibold text-white",
              "transition duration-200 ease-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]",
            ].join(" ")}
          >
            Take Diagnostic Test
          </Link>
        </SurfaceCard>
      )}

      {diagnostic && (
        <>
          {/* Top overview cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3 paws-enter">
            <SurfaceCard tone="brand" className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Diagnostic Baseline
              </p>
              <p className="mt-2 text-4xl font-extrabold tabular-nums text-slate-900">
                {diagnostic.overallAccuracy}%
              </p>
              <AccuracyBadge value={diagnostic.overallAccuracy} />
              <p className="mt-2 text-xs text-slate-400">
                {new Date(diagnostic.completedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </SurfaceCard>

            <SurfaceCard className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Practice Accuracy
              </p>
              {practice ? (
                <>
                  <p className="mt-2 text-4xl font-extrabold tabular-nums text-slate-900">
                    {practice.overallAccuracy}%
                  </p>
                  <AccuracyBadge value={practice.overallAccuracy} />
                  <p className="mt-2 text-xs text-slate-400">
                    {practice.totalAnswered} question{practice.totalAnswered !== 1 ? "s" : ""} answered
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Answer practice questions to track your current accuracy.
                </p>
              )}
            </SurfaceCard>

            <SurfaceCard className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Overall Progress
              </p>
              {improvement ? (
                <>
                  <p className="mt-2 text-4xl font-extrabold tabular-nums">
                    <Delta value={improvement.overall} />
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {improvement.overall > 0
                      ? "Improvement since diagnostic"
                      : improvement.overall < 0
                        ? "Below diagnostic baseline"
                        : "Same as diagnostic baseline"}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Start practicing to see how you compare to your diagnostic.
                </p>
              )}
            </SurfaceCard>
          </div>

          {/* Section breakdown */}
          <SurfaceCard className="mb-6 paws-enter">
            <h2 className="text-lg font-extrabold text-slate-900">Section Performance</h2>
            {practice ? (
              <p className="mt-1 text-xs text-slate-500">
                Comparing your diagnostic baseline with your current practice accuracy.
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Showing your diagnostic baseline. Start practicing to see live updates.
              </p>
            )}

            <div className="mt-5 space-y-5">
              {CATEGORIES.map((cat) => {
                const diagAcc = diagnostic.categoryPerformance[cat]?.accuracy ?? 0;
                const practiceAcc = practice?.categoryPerformance[cat]?.accuracy;
                const delta = improvement?.byCategory[cat];
                const isWeak = weakAreas.includes(cat);
                const displayAcc = practiceAcc ?? diagAcc;

                return (
                  <div key={cat}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-xs font-extrabold uppercase tracking-wide text-blue-700 bg-blue-50 rounded px-1.5 py-0.5">
                          {cat.toUpperCase()}
                        </span>
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {CATEGORY_LABELS[cat]}
                        </span>
                        {isWeak && (
                          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                            Focus
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-sm">
                        {practice && (
                          <span className="text-xs text-slate-400">
                            Base: {diagAcc}%
                          </span>
                        )}
                        <span className="font-extrabold tabular-nums text-slate-900">
                          {displayAcc}%
                        </span>
                        {delta !== undefined && <Delta value={delta} />}
                      </div>
                    </div>
                    <AccuracyBar value={displayAcc} isWeak={isWeak} />
                    <p className="mt-1 text-xs text-slate-400">
                      {practice
                        ? `${practice.categoryPerformance[cat]?.correct ?? 0}/${practice.categoryPerformance[cat]?.total ?? 0} correct in practice`
                        : `${diagnostic.categoryPerformance[cat]?.correct ?? 0}/${diagnostic.categoryPerformance[cat]?.total ?? 0} correct in diagnostic`}
                    </p>
                  </div>
                );
              })}
            </div>
          </SurfaceCard>

          {/* Weak areas + Recommendations side by side */}
          <div className="mb-6 grid gap-5 sm:grid-cols-2 paws-enter">
            {/* Weak areas */}
            <SurfaceCard className="p-5">
              <h2 className="text-base font-extrabold text-slate-900">Weakest Areas</h2>
              {weakAreas.length === 0 ? (
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  No weak areas detected — you scored above 60% in every section.
                </p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {weakAreas.map((cat, i) => {
                    const acc = (practice?.categoryPerformance[cat] ?? diagnostic.categoryPerformance[cat])?.accuracy ?? 0;
                    return (
                      <li key={cat} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-extrabold text-red-700">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {cat.toUpperCase()} — {CATEGORY_LABELS[cat]}
                            </p>
                            <span className="shrink-0 text-sm font-extrabold text-red-700 tabular-nums">
                              {acc}%
                            </span>
                          </div>
                          <Link
                            href={`/questions?category=${cat}`}
                            className="mt-1 inline-block text-xs font-semibold text-blue-600 hover:underline underline-offset-2"
                          >
                            Practice now →
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </SurfaceCard>

            {/* Recommendations */}
            <SurfaceCard className="p-5">
              <h2 className="text-base font-extrabold text-slate-900">Recommendations</h2>
              <ul className="mt-4 space-y-3">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    <p className="text-sm leading-relaxed text-slate-700">{rec}</p>
                  </li>
                ))}
              </ul>
            </SurfaceCard>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center paws-enter">
            <Link
              href={weakAreas.length > 0 ? `/questions?category=${weakAreas[0]}` : "/questions"}
              className={[
                "inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 font-semibold text-white",
                "transition duration-200 ease-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
              ].join(" ")}
            >
              {weakAreas.length > 0 ? "Practice Weak Areas" : "Practice Questions"}
            </Link>
            <Link
              href="/questions"
              className={[
                "inline-flex rounded-full border border-slate-300 bg-white/80 px-7 py-3 font-semibold text-slate-700",
                "transition duration-200 ease-out hover:bg-white hover:shadow-md active:scale-[0.99]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
              ].join(" ")}
            >
              All Questions
            </Link>
          </div>

          {/* Retake */}
          <div className="mt-6 text-center paws-enter">
            <button
              type="button"
              onClick={handleRetake}
              disabled={isRetaking}
              className="text-xs font-semibold text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline disabled:cursor-not-allowed"
            >
              {isRetaking ? "Clearing..." : "Retake diagnostic test"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
