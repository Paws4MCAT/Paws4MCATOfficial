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

# Routes

- `/questions`: practice experience with login/create-account controls and autosaved progress.
- `/dashboard`: signed-in student dashboard showing overall accuracy, section accuracy, and recent answer history.
