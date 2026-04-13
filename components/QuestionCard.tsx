"use client";

import { Question } from "@/lib/types";
import { Language } from "@/lib/language";

import { AnswerChoices } from "./AnswerChoices";
import { SurfaceCard } from "./SurfaceCard";

type QuestionCardProps = {
  question: Question;
  language: Language;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showFeedback: boolean;
  onNextQuestion: () => void;
};

export function QuestionCard({
  question,
  language,
  selectedAnswer,
  onSelectAnswer,
  showFeedback,
  onNextQuestion,
}: QuestionCardProps) {
  const isCorrect = selectedAnswer === question.correctAnswer;
  const questionText =
    typeof question.question === "string"
      ? question.question
      : question.question[language] || question.question.en;

  return (
    <SurfaceCard
      tone="brand"
      className={[
        "p-6 sm:p-8",
        // Subtle entrance on mount (respects reduced-motion).
        "paws-enter",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide sm:text-xs">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
          {question.category}
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
          {question.subcategory}
        </span>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
          {question.difficulty}
        </span>
      </div>

      <h2 className="mt-5 text-balance text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl sm:leading-snug">
        {questionText}
      </h2>

      <AnswerChoices
        choices={question.choices}
        selectedAnswer={selectedAnswer}
        correctAnswer={question.correctAnswer}
        onSelectAnswer={onSelectAnswer}
        isLocked={showFeedback}
      />

      <div
        className={[
          "mt-5 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4",
          "transition-all duration-300 ease-out motion-reduce:transition-none",
          showFeedback ? "opacity-100 translate-y-0" : "pointer-events-none h-0 p-0 opacity-0 -translate-y-1",
        ].join(" ")}
        aria-hidden={!showFeedback}
      >
        {showFeedback && (
          <>
          <p
            className={`text-sm font-semibold ${
              isCorrect ? "text-green-800" : "text-red-800"
            }`}
          >
            {isCorrect ? "Correct! Nice work." : "Not quite. Keep going."}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {question.explanation}
          </p>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onNextQuestion}
        className={[
          "mt-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white",
          "transition duration-200 ease-out motion-reduce:transition-none",
          "hover:scale-[1.02] hover:shadow-md active:scale-[0.99]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        ].join(" ")}
      >
        Next Question
      </button>
    </SurfaceCard>
  );
}
