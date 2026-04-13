"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { LanguageToggle } from "@/components/LanguageToggle";
import { SurfaceCard } from "@/components/SurfaceCard";
import { QuestionCard } from "@/components/QuestionCard";
import { filterQuestions } from "@/lib/filterQuestions";
import { Language } from "@/lib/language";
import { AnswerRecord, McatCategory, Question } from "@/lib/types";

const categoryOptions: Array<{ value: McatCategory | "all"; label: string }> = [
  { value: "all", label: "All Sections" },
  { value: "cp", label: "CP (Chemical & Physical)" },
  { value: "bb", label: "BB (Biological & Biochemical)" },
  { value: "ps", label: "PS (Psychological & Social)" },
  { value: "cars", label: "CARS" },
];

const categoryShortLabels: Record<McatCategory, string> = {
  cp: "CP",
  bb: "BB",
  ps: "PS",
  cars: "CARS",
};

type QuestionsClientProps = {
  initialQuestions: Question[];
};

function QuestionsSession({
  questions,
  language,
}: {
  questions: Question[];
  language: Language;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>([]);
  const [feedbackPopup, setFeedbackPopup] = useState<"correct" | "wrong" | null>(null);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  const currentQuestion = useMemo(
    () => questions[currentQuestionIndex],
    [questions, currentQuestionIndex],
  );
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentPosition = questions.length === 0 ? 0 : currentQuestionIndex + 1;
  const progressPercentage =
    questions.length === 0 ? 0 : Math.round((currentPosition / questions.length) * 100);

  const totalAnswered = answerHistory.length;
  const totalCorrect = useMemo(
    () => answerHistory.filter((record) => record.isCorrect).length,
    [answerHistory],
  );
  const totalIncorrect = totalAnswered - totalCorrect;
  const accuracyPercentage =
    totalAnswered === 0 ? 0 : Math.round((totalCorrect / totalAnswered) * 100);

  const categoryPerformance = useMemo(() => {
    return answerHistory.reduce(
      (accumulator, record) => {
        const categoryStats = accumulator[record.category] ?? { total: 0, correct: 0 };
        categoryStats.total += 1;
        if (record.isCorrect) {
          categoryStats.correct += 1;
        }
        accumulator[record.category] = categoryStats;
        return accumulator;
      },
      {} as Record<McatCategory, { total: number; correct: number }>,
    );
  }, [answerHistory]);

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer || !currentQuestion) return;
    setSelectedAnswer(answer);

    const isCorrect = answer === currentQuestion.correctAnswer;
    setFeedbackPopup(isCorrect ? "correct" : "wrong");
    setIsFeedbackVisible(true);

    const answerRecord: AnswerRecord = {
      questionId: currentQuestion.id,
      isCorrect,
      category: currentQuestion.category,
      subcategory: currentQuestion.subcategory,
      timestamp: Date.now(),
    };
    setAnswerHistory((previous) => [...previous, answerRecord]);

    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    popupTimeoutRef.current = setTimeout(() => {
      setIsFeedbackVisible(false);
      // Allow exit animation to finish before unmount.
      setTimeout(() => setFeedbackPopup(null), 220);
    }, 3000);
  };

  const handleNextQuestion = () => {
    if (questions.length === 0) return;
    setSelectedAnswer(null);
    setFeedbackPopup(null);
    setIsFeedbackVisible(false);
    if (!isLastQuestion) {
      setCurrentQuestionIndex((previous) => previous + 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setFeedbackPopup(null);
    setIsFeedbackVisible(false);
    setAnswerHistory([]);
  };

  const showCompletion =
    questions.length > 0 &&
    currentQuestionIndex === questions.length - 1 &&
    Boolean(selectedAnswer);

  return (
    <>
      <SurfaceCard className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
          <span>
            Question {currentPosition} of {questions.length}
          </span>
          <span className="tabular-nums">{progressPercentage}%</span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 shadow-inner"
          role="progressbar"
          aria-label="Practice progress"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={[
              "h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600",
              "transition-[width] duration-500 ease-out motion-reduce:transition-none",
            ].join(" ")}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Accuracy</span>:{" "}
            <span className="font-semibold tabular-nums">{accuracyPercentage}%</span>{" "}
            <span className="text-slate-500">
              ({totalCorrect}/{totalAnswered} correct)
            </span>
          </p>
          <p className="text-xs font-medium text-slate-500">
            Incorrect: <span className="tabular-nums">{totalIncorrect}</span>
          </p>
        </div>
      </SurfaceCard>

      <SurfaceCard className="mb-6">
        <h2 className="text-sm font-semibold text-slate-800">Category Performance</h2>
        {Object.keys(categoryPerformance).length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Answer a few questions to see section breakdowns.
          </p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {Object.entries(categoryPerformance).map(([categoryKey, stats]) => (
              <li key={categoryKey} className="flex items-center justify-between">
                <span className="font-medium">
                  {categoryShortLabels[categoryKey as McatCategory]}
                </span>
                <span className="tabular-nums text-slate-600">
                  {stats.correct}/{stats.total} correct
                </span>
              </li>
            ))}
          </ul>
        )}
      </SurfaceCard>

      {!currentQuestion && (
        <p className="rounded-xl bg-white p-4 text-center text-slate-600 shadow">
          No questions found for this filter.
        </p>
      )}

      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          language={language}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={handleSelectAnswer}
          showFeedback={Boolean(selectedAnswer)}
          onNextQuestion={handleNextQuestion}
        />
      )}

      {showCompletion && (
        <SurfaceCard className="mt-6 p-5 text-center">
          <p className="text-lg font-semibold text-slate-900">You finished this set.</p>
          <p className="mt-1 text-sm text-slate-600">
            Final accuracy: {accuracyPercentage}% ({totalCorrect}/{totalAnswered} correct)
          </p>
          <button
            type="button"
            onClick={handleRestart}
            className={[
              "mt-4 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white",
              "transition duration-200 ease-out motion-reduce:transition-none",
              "hover:bg-slate-800 hover:shadow-md active:scale-[0.99]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            ].join(" ")}
          >
            Restart this set
          </button>
        </SurfaceCard>
      )}

      {feedbackPopup && (
        <div
          className={[
            "pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4",
            "transition duration-200 ease-out motion-reduce:transition-none",
            isFeedbackVisible ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-hidden={!isFeedbackVisible}
        >
          <Image
            src={
              feedbackPopup === "correct"
                ? "/paws4mcat-correct.png"
                : "/paws4mcat-wrong.png"
            }
            alt={feedbackPopup === "correct" ? "Correct answer" : "Wrong answer"}
            width={900}
            height={560}
            className={[
              "h-auto w-full max-w-xl drop-shadow-2xl",
              "transition duration-200 ease-out motion-reduce:transition-none",
              isFeedbackVisible ? "scale-100" : "scale-[0.98]",
            ].join(" ")}
            priority
          />
        </div>
      )}
    </>
  );
}

export function QuestionsClient({ initialQuestions }: QuestionsClientProps) {
  const [language, setLanguage] = useState<Language>("en");
  const [selectedCategory, setSelectedCategory] = useState<McatCategory | "all">("all");

  const questions = useMemo(
    () =>
      filterQuestions(initialQuestions, {
        category: selectedCategory,
        difficulty: "all",
      }),
    [initialQuestions, selectedCategory],
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10">
      <header className="mb-8">
        <div className="mb-4 flex justify-center sm:justify-end">
          <LanguageToggle language={language} onChangeLanguage={setLanguage} />
        </div>
        <div className="text-center">
          <Image
            src="/paws4mcat-logo-transparent.png"
            alt="Paws4MCAT logo"
            width={900}
            height={560}
            className="mx-auto mb-3 h-auto w-full max-w-xs sm:max-w-sm"
          />
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Practice Questions
          </h1>
          <p className="mt-2 text-slate-600">Choose a section and start learning.</p>
        </div>
      </header>

      <SurfaceCard className="mb-6">
        <label
          htmlFor="section-filter"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          MCAT section
        </label>
        <select
          id="section-filter"
          value={selectedCategory}
          onChange={(event) =>
            setSelectedCategory(event.target.value as McatCategory | "all")
          }
          className={[
            "w-full rounded-xl border border-slate-300/80 bg-white/90 px-3 py-2.5 text-sm font-medium text-slate-900",
            "shadow-sm transition duration-200 ease-out motion-reduce:transition-none",
            "hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          ].join(" ")}
        >
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </SurfaceCard>

      {/* Remount session per category to reset state (lint-safe). */}
      <QuestionsSession
        key={selectedCategory}
        questions={questions}
        language={language}
      />
    </main>
  );
}
