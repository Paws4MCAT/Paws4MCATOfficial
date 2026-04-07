"use client";

import { Question } from "@/lib/types";

import { AnswerChoices } from "./AnswerChoices";

type QuestionCardProps = {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showFeedback: boolean;
  onNextQuestion: () => void;
};

export function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  showFeedback,
  onNextQuestion,
}: QuestionCardProps) {
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/50 sm:p-8">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
          {question.category}
        </span>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
          {question.difficulty}
        </span>
      </div>

      <h2 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
        {question.question}
      </h2>

      <AnswerChoices
        choices={question.choices}
        selectedAnswer={selectedAnswer}
        correctAnswer={question.correctAnswer}
        onSelectAnswer={onSelectAnswer}
        isLocked={showFeedback}
      />

      {showFeedback && (
        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p
            className={`font-semibold ${isCorrect ? "text-green-700" : "text-red-700"}`}
          >
            {isCorrect ? "Correct! Nice work." : "Not quite. Keep going."}
          </p>
          <p className="mt-2 text-sm text-slate-700">{question.explanation}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onNextQuestion}
        className="mt-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:shadow-md"
      >
        Next Question
      </button>
    </section>
  );
}
