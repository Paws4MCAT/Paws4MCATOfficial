"use client";

type AnswerChoicesProps = {
  choices: string[];
  selectedAnswer: string | null;
  correctAnswer: string;
  onSelectAnswer: (answer: string) => void;
  isLocked: boolean;
};

export function AnswerChoices({
  choices,
  selectedAnswer,
  correctAnswer,
  onSelectAnswer,
  isLocked,
}: AnswerChoicesProps) {
  return (
    <div className="mt-6 grid gap-3">
      {choices.map((choice, index) => {
        const isSelected = selectedAnswer === choice;
        const isCorrect = choice === correctAnswer;

        // Visual states: default → selected → (locked) correct/incorrect reveal.
        let styleClass =
          "border-slate-200 bg-white/90 text-slate-900 hover:border-slate-300 hover:bg-white";

        if (!isLocked && isSelected) {
          styleClass =
            "border-blue-200 bg-blue-50/80 text-slate-900 ring-2 ring-blue-200";
        } else if (isLocked && isSelected && isCorrect) {
          styleClass =
            "border-green-200 bg-green-50 text-green-800 ring-2 ring-green-200";
        } else if (isLocked && isSelected && !isCorrect) {
          styleClass =
            "border-red-200 bg-red-50 text-red-800 ring-2 ring-red-200";
        } else if (isLocked && isCorrect) {
          // Reveal the correct choice subtly even if it wasn't selected.
          styleClass =
            "border-green-200 bg-green-50/60 text-green-800";
        }

        return (
          <button
            key={`${index}-${choice}`}
            type="button"
            disabled={isLocked}
            onClick={() => onSelectAnswer(choice)}
            aria-pressed={isSelected}
            className={[
              // Card feel + consistent spacing (8px rhythm).
              "group relative rounded-2xl border px-4 py-3 text-left text-sm font-semibold",
              // Micro-interactions: subtle lift + shadow, press feedback.
              "transition duration-200 ease-out motion-reduce:transition-none",
              !isLocked &&
                "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]",
              // Accessibility: keep focus visible and consistent.
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              // Disabled is handled via isLocked; still allow correct reveal styling.
              isLocked ? "cursor-not-allowed" : "cursor-pointer",
              styleClass,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}
