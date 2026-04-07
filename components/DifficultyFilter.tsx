"use client";

import { Difficulty } from "@/lib/types";

type DifficultyFilterProps = {
  activeDifficulty: Difficulty | "all";
  onSelectDifficulty: (difficulty: Difficulty | "all") => void;
};

const filterOptions: Array<Difficulty | "all"> = ["all", "easy", "medium", "hard"];

export function DifficultyFilter({
  activeDifficulty,
  onSelectDifficulty,
}: DifficultyFilterProps) {
  return (
    <div className="mb-6 flex flex-wrap justify-center gap-2">
      {filterOptions.map((option) => {
        const isActive = activeDifficulty === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelectDifficulty(option)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              isActive
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
