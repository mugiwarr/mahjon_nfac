import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-linen text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
            Mahjong Focus
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
            Train your focus in a short Mahjong session.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
            The first milestone is live: a real Mahjong Solitaire board with
            free-tile validation, pair matching, removals, victory detection,
            and restart.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/game"
            className="inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-[#223229] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Play Classic
          </Link>
          <Link
            href="/daily"
            className="inline-flex h-11 items-center rounded-md border border-sage bg-white px-5 text-sm font-semibold text-ink transition hover:border-clay"
          >
            Daily Challenge
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex h-11 items-center rounded-md border border-sage bg-white px-5 text-sm font-semibold text-ink transition hover:border-clay"
          >
            Leaderboard
          </Link>
        </div>
      </section>
    </main>
  );
}
