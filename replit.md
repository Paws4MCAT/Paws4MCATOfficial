# Project Overview

Paws4MCAT is a Next.js application for multilingual MCAT practice questions. It uses the App Router, local JSON question data, and a small API route for filtered question retrieval.

# Replit Runtime

- Package manager: npm
- App location: project root
- Main workflow: `Start application`
- Workflow command: `npm run dev -- -p 5000 -H 0.0.0.0`
- Web port: 5000

# Migration Notes

- The project was migrated from Vercel to Replit.
- The workflow supplies Replit-compatible Next.js host and port flags without changing the protected package scripts.
- Next.js development resources are allowlisted for the active Replit preview domain through `REPLIT_DEV_DOMAIN`.
- No `instrumentation.ts` or `instrumentation.js` file is present.
- PostgreSQL is used for user accounts, server sessions, and saved practice progress.

# Data Model

- `users`: stores account identity and scrypt password hashes.
- `user_sessions`: stores hashed session tokens with expiration; browser cookies are HTTP-only.
- `practice_progress`: stores each user's selected section, current question, selected answer, and answer history.
- `diagnostic_results`: stores each user's diagnostic test results (overall accuracy, category performance, weak areas).

# Routes

- `/`: login/create-account entry point. Signed-in students see their study plan (if diagnostic done) or a CTA to take the diagnostic, then the full dashboard.
- `/diagnostic`: 16-question diagnostic test (4 per MCAT section, difficulty-balanced). Saves results and generates a personalized study plan.
- `/questions`: practice experience with login/create-account controls and autosaved progress. Accepts `?category=` query param to pre-select a section.
- `/dashboard`: signed-in student dashboard showing overall accuracy, section accuracy, and recent answer history.

# Diagnostic System (`lib/diagnostic.ts`)

Modular functions for the adaptive learning foundation:
- `generateDiagnosticTest(allQuestions)` — selects 16 balanced questions (4 per category, difficulty-varied).
- `analyzeResults(answers)` — computes overall, per-category, and per-subcategory accuracy.
- `getWeakAreas(categoryPerformance)` — returns categories below 60% accuracy, sorted weakest-first.
- `generateStudyPlan(categoryPerformance, weakAreas)` — produces an ordered focus list and suggested next step.
- `buildDiagnosticResult(answers)` — assembles the full `DiagnosticResult` for storage.
