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
- No required environment variables were found in the current source scan.
