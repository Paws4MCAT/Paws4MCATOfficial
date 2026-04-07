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
    <div className="mt-5 grid gap-3">
      {choices.map((choice) => {
        const isSelected = selectedAnswer === choice;
        const isCorrect = choice === correctAnswer;

        let styleClass =
          "border-slate-200 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50";

        if (isLocked && isSelected && isCorrect) {
          styleClass = "border-green-200 bg-green-50 text-green-700";
        } else if (isLocked && isSelected && !isCorrect) {
          styleClass = "border-red-200 bg-red-50 text-red-700";
        } else if (isLocked && isCorrect) {
          styleClass = "border-green-200 bg-green-50 text-green-700";
        }

        return (
          <button
            key={choice}
            type="button"
            disabled={isLocked}
            onClick={() => onSelectAnswer(choice)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${styleClass} disabled:cursor-not-allowed`}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}
