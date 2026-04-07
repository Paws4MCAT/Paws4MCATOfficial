"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { DifficultyFilter } from "@/components/DifficultyFilter";
import { QuestionCard } from "@/components/QuestionCard";
import { Difficulty, Question } from "@/lib/types";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | "all">("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedbackPopup, setFeedbackPopup] = useState<"correct" | "wrong" | null>(
    null,
  );
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Fetch questions once when this page opens.
    const loadQuestions = async () => {
      setLoading(true);

      const query =
        activeDifficulty === "all" ? "" : `?difficulty=${activeDifficulty}`;
      const response = await fetch(`/api/questions${query}`);
      const data = (await response.json()) as Question[];

      setQuestions(data);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setLoading(false);
    };

    void loadQuestions();
  }, [activeDifficulty]);

  const currentQuestion = useMemo(
    () => questions[currentIndex],
    [questions, currentIndex],
  );

  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectDifficulty = (difficulty: Difficulty | "all") => {
    setActiveDifficulty(difficulty);
    setFeedbackPopup(null);
  };

  const handleSelectAnswer = (answer: string) => {
    // Lock answer after first click.
    if (selectedAnswer) return;
    setSelectedAnswer(answer);

    const isCorrect = answer === currentQuestion?.correctAnswer;
    setFeedbackPopup(isCorrect ? "correct" : "wrong");

    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    popupTimeoutRef.current = setTimeout(() => {
      setFeedbackPopup(null);
    }, 3000);
  };

  const handleNextQuestion = () => {
    if (questions.length === 0) return;
    setSelectedAnswer(null);
    setFeedbackPopup(null);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10">
      <header className="mb-8 text-center">
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
        <p className="mt-2 text-slate-600">Choose a difficulty and start learning.</p>
      </header>

      <DifficultyFilter
        activeDifficulty={activeDifficulty}
        onSelectDifficulty={handleSelectDifficulty}
      />

      {loading && (
        <p className="rounded-xl bg-white p-4 text-center text-slate-600 shadow">
          Loading questions...
        </p>
      )}

      {!loading && !currentQuestion && (
        <p className="rounded-xl bg-white p-4 text-center text-slate-600 shadow">
          No questions found for this filter.
        </p>
      )}

      {!loading && currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={handleSelectAnswer}
          showFeedback={Boolean(selectedAnswer)}
          onNextQuestion={handleNextQuestion}
        />
      )}

      {feedbackPopup && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <Image
            src={
              feedbackPopup === "correct"
                ? "/paws4mcat-correct.png"
                : "/paws4mcat-wrong.png"
            }
            alt={feedbackPopup === "correct" ? "Correct answer" : "Wrong answer"}
            width={900}
            height={560}
            className="h-auto w-full max-w-xl drop-shadow-2xl"
            priority
          />
        </div>
      )}
    </main>
  );
}
