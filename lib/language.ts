export const SUPPORTED_LANGUAGES = ["en", "es"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "EN",
  es: "ES",
};
