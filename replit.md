# Project Overview

Paws4MCAT is a Next.js 15 + TypeScript MCAT practice app with PostgreSQL, bilingual (EN/ES) questions, user authentication, progress tracking, a diagnostic test system, and a persistent adaptive learning engine.

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
- `/diagnostic`: 12-question diagnostic test (3 per MCAT section, difficulty-balanced). Saves results to PostgreSQL + localStorage. Retake clears both.
- `/questions`: practice experience with compact header, login/create-account controls, autosaved progress, and "Practice Weak Areas" mode. Accepts `?category=` query param.
- `/insights`: persistent insights dashboard showing diagnostic baseline, current practice accuracy, delta per section, weakest areas ranked, and text recommendations.
- `/dashboard`: signed-in student dashboard showing overall accuracy, section accuracy, and recent answer history.

# Adaptive Learning System

## API Routes
- `GET /api/diagnostic` — fetch saved diagnostic result
- `POST /api/diagnostic` — save/replace diagnostic result
- `DELETE /api/diagnostic` — clear diagnostic result (retake flow)
- `GET /api/insights` — returns combined `{ diagnostic, practice, improvement, recommendations, weakAreas }` from DB
- `GET /api/progress` — fetch practice progress
- `PUT /api/progress` — update practice progress

## localStorage Persistence
- Key `paws4mcat:diagnostic` stores `DiagnosticResult` JSON for offline resilience and fast "Practice Weak Areas" detection.

## Diagnostic System (`lib/diagnostic.ts`)

Modular functions for the adaptive learning engine:
- `generateDiagnosticTest(allQuestions)` — selects 12 balanced questions (3 per category, difficulty-varied).
- `analyzeResults(answers)` — computes overall, per-category, and per-subcategory accuracy.
- `getWeakAreas(categoryPerformance)` — returns categories below 60% accuracy, sorted weakest-first.
- `generateStudyPlan(categoryPerformance, weakAreas)` — produces an ordered focus list and suggested next step.
- `generateRecommendations(weakAreas, categoryPerformance)` — generates actionable text recommendations.
- `buildDiagnosticResult(answers)` — assembles the full `DiagnosticResult` for storage.
- `CATEGORY_LABELS` — exported record of full MCAT category names.
