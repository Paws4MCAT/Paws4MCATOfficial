"use client";

import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "@/lib/language";
import { Language } from "@/lib/language";

type LanguageToggleProps = {
  language: Language;
  onChangeLanguage: (nextLanguage: Language) => void;
};

export function LanguageToggle({
  language,
  onChangeLanguage,
}: LanguageToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/80 p-1 shadow-sm backdrop-blur-sm">
      {SUPPORTED_LANGUAGES.map((option) => {
        const isActive = language === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChangeLanguage(option)}
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold sm:text-sm",
              "transition duration-200 ease-out motion-reduce:transition-none",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              isActive
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100/80 active:scale-[0.98]",
            ].join(" ")}
            aria-pressed={isActive}
          >
            {LANGUAGE_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
