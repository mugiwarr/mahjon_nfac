"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GameSession } from "@/game/types";
import { loadGameHistory } from "@/lib/storage/historyStorage";
import { loadLocalProfile } from "@/lib/storage/profileStorage";

type LeaderboardTab = "global" | "daily" | "city";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${rest}`;
};

export function LeaderboardClient() {
  const [tab, setTab] = useState<LeaderboardTab>("global");
  const [history, setHistory] = useState<GameSession[]>([]);
  const [city, setCity] = useState("Almaty");
  const [username, setUsername] = useState("Guest Player");

  useEffect(() => {
    const profile = loadLocalProfile();
    setHistory(loadGameHistory());
    setCity(profile.city);
    setUsername(profile.username);
  }, []);

  const rows = useMemo(() => {
    const filtered = history.filter((session) => {
      if (!session.completed) {
        return false;
      }

      if (tab === "daily") {
        return session.mode === "daily";
      }

      return true;
    });

    return filtered
      .slice()
      .sort(
        (first, second) =>
          second.score - first.score || first.durationSeconds - second.durationSeconds,
      )
      .slice(0, 20);
  }, [history, tab]);

  return (
    <main className="min-h-screen bg-linen text-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-white/60 bg-white/65 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
              Leaderboards
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Rankings
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Local leaderboard now, Supabase global sync next.
            </p>
          </div>
          <Link
            href="/game"
            className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-[#223229]"
          >
            Play
          </Link>
        </header>

        <div className="flex flex-wrap gap-2 rounded-lg border border-white/60 bg-white/65 p-2 shadow-sm">
          {(["global", "daily", "city"] as LeaderboardTab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`h-10 rounded-md px-4 text-sm font-semibold capitalize transition ${
                tab === item
                  ? "bg-ink text-white"
                  : "border border-sage bg-white text-ink hover:border-clay"
              }`}
            >
              {item === "city" ? city : item}
            </button>
          ))}
        </div>

        <section className="rounded-lg border border-white/60 bg-white/65 p-4 shadow-sm">
          {rows.length === 0 ? (
            <p className="rounded-md bg-linen p-4 text-sm text-ink/70">
              No leaderboard results yet. Complete a game to create the first entry.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-ink/60">
                  <tr>
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Player</th>
                    <th className="py-2 pr-3">Mode</th>
                    <th className="py-2 pr-3">Layout</th>
                    <th className="py-2 pr-3">Score</th>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">City</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((session, index) => (
                    <tr key={session.id} className="border-t border-sage/70">
                      <td className="py-3 pr-3 font-semibold">{index + 1}</td>
                      <td className="py-3 pr-3">{username}</td>
                      <td className="py-3 pr-3 capitalize">{session.mode}</td>
                      <td className="py-3 pr-3">{session.layoutName}</td>
                      <td className="py-3 pr-3 font-semibold">{session.score}</td>
                      <td className="py-3 pr-3">{formatTime(session.durationSeconds)}</td>
                      <td className="py-3 pr-3">{city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
