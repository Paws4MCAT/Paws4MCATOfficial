"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { SurfaceCard } from "@/components/SurfaceCard";

type AuthUser = {
  id: string;
  username: string;
  displayName: string;
};

type AuthMode = "login" | "register";

type AnswerRecord = {
  questionId: string;
  isCorrect: boolean;
  category: "cp" | "bb" | "ps" | "cars";
  subcategory: string;
  timestamp: number;
};

type PracticeProgress = {
  selectedCategory: "all" | "cp" | "bb" | "ps" | "cars";
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  answerHistory: AnswerRecord[];
  updatedAt?: string;
};

const categoryLabels: Record<AnswerRecord["category"], string> = {
  cp: "Chemical & Physical",
  bb: "Biological & Biochemical",
  ps: "Psychological & Social",
  cars: "CARS",
};

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const answerHistory = progress?.answerHistory ?? [];
  const totalAnswered = answerHistory.length;
  const totalCorrect = answerHistory.filter((record) => record.isCorrect).length;
  const totalAccuracy =
    totalAnswered === 0 ? 0 : Math.round((totalCorrect / totalAnswered) * 100);

  const sectionStats = useMemo(() => {
    return (Object.keys(categoryLabels) as AnswerRecord["category"][]).map((category) => {
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
  }, [answerHistory]);

  const recentAnswers = useMemo(() => {
    return [...answerHistory]
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 4);
  }, [answerHistory]);

  async function loadProgress() {
    const response = await fetch("/api/progress", { cache: "no-store" });
    if (!response.ok) {
      setProgress(null);
      return;
    }

    const data = (await response.json()) as { progress: PracticeProgress | null };
    setProgress(data.progress);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadHome() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok || !isMounted) return;

        const data = (await response.json()) as { user: AuthUser | null };
        setUser(data.user);

        if (data.user) {
          await loadProgress();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadHome();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { user?: AuthUser; error?: string };

      if (!response.ok || !data.user) {
        setAuthError(data.error ?? "Unable to continue.");
        return;
      }

      setUser(data.user);
      setUsername("");
      setPassword("");
      await loadProgress();
    } catch {
      setAuthError("Unable to reach the account service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProgress(null);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-12">
      <SurfaceCard tone="brand" className="w-full p-6 sm:p-10 paws-enter">
        <div className="text-center">
          <Image
            src="/paws4mcat-logo-transparent.png"
            alt="Paws4MCAT logo"
            width={900}
            height={560}
            priority
            className="mx-auto mb-4 h-auto w-full max-w-sm"
          />
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
            Paws4MCAT
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            Log in to view your dashboard, then jump into MCAT practice questions.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-2xl bg-white/70 p-6 text-center text-sm font-semibold text-slate-600">
            Loading your account...
          </div>
        ) : user ? (
          <div className="mt-8">
            <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Welcome back</p>
                <p className="text-xl font-extrabold text-slate-900">
                  {user.displayName || user.username}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:shadow-sm active:scale-[0.99]"
              >
                Log out
              </button>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/75 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Questions answered
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{totalAnswered}</p>
              </div>
              <div className="rounded-2xl bg-white/75 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Overall accuracy
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{totalAccuracy}%</p>
              </div>
              <div className="rounded-2xl bg-white/75 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current section
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {progress?.selectedCategory === "all"
                    ? "All"
                    : progress?.selectedCategory?.toUpperCase() ?? "None"}
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl bg-white/75 p-5 shadow-sm">
                <h2 className="text-lg font-extrabold text-slate-900">Section accuracy</h2>
                <div className="mt-4 space-y-3">
                  {sectionStats.map((section) => (
                    <div key={section.category}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-slate-800">{section.label}</span>
                        <span className="font-extrabold text-slate-900">{section.accuracy}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                          style={{ width: `${section.accuracy}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {section.correct}/{section.total} correct
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/75 p-5 shadow-sm">
                <h2 className="text-lg font-extrabold text-slate-900">Recent history</h2>
                {recentAnswers.length === 0 ? (
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    Answer questions while logged in to fill your dashboard with recent practice history.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {recentAnswers.map((record) => (
                      <li
                        key={`${record.questionId}-${record.timestamp}`}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/80 p-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {record.category.toUpperCase()} · {record.subcategory}
                          </p>
                          <p className="text-xs font-medium text-slate-500">
                            {new Date(record.timestamp).toLocaleDateString()}
                          </p>
                        </div>
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
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/questions"
                className="inline-flex rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 font-semibold text-white transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]"
              >
                Go to Questions
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex rounded-full border border-slate-300 bg-white/80 px-7 py-3 font-semibold text-slate-700 transition hover:bg-white hover:shadow-md active:scale-[0.99]"
              >
                Open Full Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl bg-white/75 p-5 shadow-sm">
            <div className="mb-4 flex rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={[
                  "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
                  authMode === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={[
                  "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
                  authMode === "register"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="block text-left">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  placeholder="student123"
                />
              </label>
              <label className="block text-left">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Password</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete={authMode === "register" ? "new-password" : "current-password"}
                  className="w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  placeholder="8+ characters"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Please wait..." : authMode === "register" ? "Create" : "Log in"}
              </button>
            </form>

            {authError && <p className="mt-3 text-sm font-semibold text-red-700">{authError}</p>}
            <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
              After login, your dashboard appears here with your saved accuracy and practice history.
            </p>
          </div>
        )}
      </SurfaceCard>
    </main>
  );
}
