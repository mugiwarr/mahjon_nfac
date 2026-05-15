"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import type { GameSession, UserStats } from "@/game/types";
import { getUserStats, loadGameHistory } from "@/lib/storage/historyStorage";
import {
  type LocalProfile,
  getDefaultProfile,
  languageOptions,
  saveLocalProfile,
  themeOptions,
} from "@/lib/storage/profileStorage";
import { loadRemoteProfile, saveProfile } from "@/lib/supabase/profile";

const formatTime = (seconds: number | null) => {
  if (seconds === null) {
    return "-";
  }

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${rest}`;
};

export function ProfileClient() {
  const [profile, setProfile] = useState<LocalProfile>(() => getDefaultProfile());
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<GameSession[]>([]);
  const [syncMessage, setSyncMessage] = useState("Local profile loaded.");
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [requestedProThemeId, setRequestedProThemeId] = useState<
    LocalProfile["preferredTheme"] | null
  >(null);
  const [requestedProThemeLabel, setRequestedProThemeLabel] = useState<string | undefined>();

  useEffect(() => {
    setStats(getUserStats());
    setHistory(loadGameHistory());
    loadRemoteProfile().then((remoteProfile) => {
      setProfile(remoteProfile);
      setSyncMessage(
        remoteProfile.email
          ? `Synced as ${remoteProfile.email}.`
          : "Local profile. Sign in to sync with Supabase.",
      );
    });
  }, []);

  const updateProfile = async (nextProfile: LocalProfile) => {
    setProfile(nextProfile);
    saveLocalProfile(nextProfile);
    await saveProfile(nextProfile);
    setSyncMessage(nextProfile.email ? "Profile saved to Supabase." : "Profile saved locally.");
  };

  const activatePro = async () => {
    await updateProfile({
      ...profile,
      isPro: true,
      preferredTheme: requestedProThemeId ?? profile.preferredTheme,
    });
    setRequestedProThemeId(null);
    setShowProUpgrade(false);
  };

  const handleThemeChange = (themeId: LocalProfile["preferredTheme"]) => {
    const theme = themeOptions.find((item) => item.id === themeId);

    if (theme?.isPro && !profile.isPro) {
      setRequestedProThemeId(theme.id);
      setRequestedProThemeLabel(theme.label);
      setShowProUpgrade(true);
      return;
    }

    updateProfile({
      ...profile,
      preferredTheme: themeId,
    });
  };

  return (
    <main className="min-h-screen bg-linen text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-white/60 bg-white/60 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
              Profile
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              {profile.username}
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink/70">{syncMessage}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/auth"
              className="inline-flex h-10 items-center justify-center rounded-md border border-sage bg-white px-4 text-sm font-semibold transition hover:border-clay"
            >
              Account
            </Link>
            <Link
              href="/game"
              className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/85"
            >
              Back to game
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="rounded-lg border border-white/60 bg-white/65 p-4 shadow-sm">
            <h2 className="text-base font-semibold">Player Details</h2>
            <div className="mt-3 rounded-md bg-sage/60 px-3 py-2 text-sm font-semibold">
              {profile.isPro ? "Pro Active" : "Free Account"}
            </div>
            <label className="mt-4 block text-sm font-medium text-ink/70">
              Username
              <input
                value={profile.username}
                onChange={(event) =>
                  updateProfile({ ...profile, username: event.target.value })
                }
                className="mt-1 h-10 w-full rounded-md border border-sage bg-white px-3 text-sm outline-none focus:border-clay"
              />
            </label>
            <label className="mt-3 block text-sm font-medium text-ink/70">
              City
              <input
                value={profile.city}
                onChange={(event) =>
                  updateProfile({ ...profile, city: event.target.value })
                }
                className="mt-1 h-10 w-full rounded-md border border-sage bg-white px-3 text-sm outline-none focus:border-clay"
              />
            </label>
            <label className="mt-3 block text-sm font-medium text-ink/70">
              Theme
              <select
                value={profile.preferredTheme}
                onChange={(event) =>
                  handleThemeChange(event.target.value as LocalProfile["preferredTheme"])
                }
                className="mt-1 h-10 w-full rounded-md border border-sage bg-white px-3 text-sm outline-none focus:border-clay"
              >
                {themeOptions.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                    {theme.isPro ? " - Pro" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm font-medium text-ink/70">
              Language
              <select
                value={profile.preferredLanguage}
                onChange={(event) =>
                  updateProfile({
                    ...profile,
                    preferredLanguage: event.target.value as LocalProfile["preferredLanguage"],
                  })
                }
                className="mt-1 h-10 w-full rounded-md border border-sage bg-white px-3 text-sm outline-none focus:border-clay"
              >
                {languageOptions.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-lg border border-white/60 bg-white/65 p-4 shadow-sm">
            <h2 className="text-base font-semibold">Stats</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-linen p-3">
                <p className="text-sm text-ink/60">Games</p>
                <p className="mt-1 text-2xl font-semibold">{stats?.totalGames ?? 0}</p>
              </div>
              <div className="rounded-md bg-linen p-3">
                <p className="text-sm text-ink/60">Wins</p>
                <p className="mt-1 text-2xl font-semibold">{stats?.totalWins ?? 0}</p>
              </div>
              <div className="rounded-md bg-linen p-3">
                <p className="text-sm text-ink/60">Total score</p>
                <p className="mt-1 text-2xl font-semibold">{stats?.totalScore ?? 0}</p>
              </div>
              <div className="rounded-md bg-linen p-3">
                <p className="text-sm text-ink/60">Best time</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatTime(stats?.bestTimeSeconds ?? null)}
                </p>
              </div>
              <div className="rounded-md bg-linen p-3">
                <p className="text-sm text-ink/60">Average time</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatTime(stats?.averageTimeSeconds ?? null)}
                </p>
              </div>
              <div className="rounded-md bg-linen p-3">
                <p className="text-sm text-ink/60">City</p>
                <p className="mt-1 text-2xl font-semibold">{profile.city}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-white/60 bg-white/65 p-4 shadow-sm">
          <h2 className="text-base font-semibold">Game History</h2>
          {history.length === 0 ? (
            <p className="mt-4 rounded-md bg-linen p-4 text-sm text-ink/70">
              No completed games yet. Finish a board to create your first session.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-ink/60">
                  <tr>
                    <th className="py-2 pr-3">Layout</th>
                    <th className="py-2 pr-3">Difficulty</th>
                    <th className="py-2 pr-3">Score</th>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Moves</th>
                    <th className="py-2 pr-3">Penalties</th>
                    <th className="py-2 pr-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((session) => (
                    <tr key={session.id} className="border-t border-sage/70">
                      <td className="py-3 pr-3 font-medium">{session.layoutName}</td>
                      <td className="py-3 pr-3 capitalize">{session.difficulty}</td>
                      <td className="py-3 pr-3">{session.score}</td>
                      <td className="py-3 pr-3">{formatTime(session.durationSeconds)}</td>
                      <td className="py-3 pr-3">{session.movesCount}</td>
                      <td className="py-3 pr-3">
                        H{session.hintsUsed} / S{session.shufflesUsed} / U
                        {session.undosUsed}
                      </td>
                      <td className="py-3 pr-3">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <ProUpgradeModal
        isOpen={showProUpgrade}
        onClose={() => setShowProUpgrade(false)}
        onActivate={activatePro}
        requestedThemeLabel={requestedProThemeLabel}
      />
    </main>
  );
}
