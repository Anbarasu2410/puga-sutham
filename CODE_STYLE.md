# CODE_STYLE.md — Puga Sutham

## Stack
TypeScript, React, Next.js (App Router), Tailwind CSS, ESLint, Prettier

## General Principles
- Prefer readable code over clever code — this project may be handed off or judged by people reading the source directly.
- Keep functions focused: `lib/drift.ts` should only ever contain geometry math, `lib/firms.ts` only FIRMS fetching/parsing, etc.
- Do not duplicate the bearing/drift-cone calculation anywhere outside `lib/drift.ts`.

## Naming
- Components: PascalCase — `AlertBanner.tsx`, `ReadingsChart.tsx`
- Functions/variables: camelCase — `calculateBearing`, `currentWindReading`
- Constants: UPPER_SNAKE_CASE — `DRIFT_CONE_SPREAD_DEGREES`, `CACHE_TTL_SECONDS`
- Booleans read clearly: `isWithinDriftCone`, `isLoading`, `hasActiveAlert`

## Components
- Functional components only.
- Separate data-fetching (in `/app/api` route handlers or server components) from presentation (in `/components`).
- Every component that fetches data must handle loading, error/stale, and empty states explicitly — see DESIGN_SYSTEM.md's States section.

## Formatting
- Follow the project's ESLint/Prettier config — do not hand-format against it.
- Remove unused imports and variables before considering a feature done.

## Comments
Explain *why*, not *what*:
```ts
// FIRMS satellite passes are infrequent, so a 20-minute cache
// avoids showing stale-looking "just fetched" timestamps between passes.
const CACHE_TTL_SECONDS = 1200;
```

## Before Finishing Any Feature
- Run `npm run lint`
- Run `npm run build` to catch type errors
- Check the mobile layout (villager/officer use case) and the desktop layout (conservator use case)
- Remove `console.log` debugging statements
