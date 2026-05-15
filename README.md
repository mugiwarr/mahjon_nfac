# Mahjong Focus

Mahjong Focus is a modern web platform for Mahjong Solitaire built around short, calm, repeatable puzzle sessions. It combines a real rules-based Mahjong board with daily challenges, progress tracking, AI-style strategy coaching, leaderboards, visual themes, and a prototype Pro upgrade flow.

## Links

- Live demo: https://nfacmajong.vercel.app
- GitHub repository: https://github.com/mugiwarr/mahjon_nfac

## Main Features

- Classic Mahjong Solitaire gameplay with correct free-tile and pair validation
- Large solvable layouts: Classic Turtle, Beginner, Pyramid, Fortress, and Mini Focus
- Solvable board generation with validation, solver checks, and a red `n!` bonus pair
- Timer, score, remaining tiles, legal moves, hint, undo, shuffle, pause, restart
- Local autosave for playable offline/fallback sessions
- Daily Challenge with seed-based board generation
- Rule-based AI Coach that explains recommended strategic moves
- Responsive desktop and mobile game board scaling
- Global, daily, and city leaderboard MVP
- Local profile, username, city, history, and stats
- Supabase-ready auth/profile sync
- Theme switching: Calm, Light, Dark, Kazakh Ornaments, Minimal Focus, Nomad Light
- RU / EN / KZ language switching
- Store page with Pro-only themes and mock Upgrade to Pro activation

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Zustand
- Supabase
- LocalStorage fallback persistence
- Vercel-ready deployment

## Run Locally

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment Variables

Create `.env.local` from `.env.example`:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not commit `.env.local` or any private credentials. The app can still run in local fallback mode if Supabase variables are missing, but authentication and remote profile sync require Supabase configuration.

## Supabase Setup

1. Create a Supabase project.
2. Add the environment variables above to `.env.local` and to Vercel Project Settings.
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Confirm the schema includes:
   - `profiles`
   - `game_sessions`
   - `daily_challenges`
   - `daily_results`
   - `user_stats`
   - `user_unlocks`
5. After deploying, update Supabase Auth URL settings:
   - Site URL: your Vercel production URL
   - Redirect URLs:
     - `https://your-vercel-url/**`
     - `http://localhost:3000/**`

## Why It Is Valuable

Most Mahjong websites stop at a static board and a restart button. Mahjong Focus turns Mahjong Solitaire into a richer product prototype with daily retention, visible progress, local competition, strategic coaching, premium customization, and a clear monetization path. It is designed as a startup-style web app rather than a one-off puzzle demo.

## Screenshots

Screenshots can be added to the `screenshots/` folder for final presentation materials.
