"use client";

import Link from "next/link";
import { Brain, Crown, Lightbulb, Pause, Play, RotateCcw, Shuffle, StepBack } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAvailableMoves } from "@/game/engine/rules";
import { defaultLayout, layouts } from "@/game/layouts";
import type { Tile } from "@/game/types";
import { t } from "@/lib/i18n";
import { loadSavedGame, saveGame } from "@/lib/storage/gameStorage";
import { saveCompletedSession } from "@/lib/storage/historyStorage";
import {
  type LocalProfile,
  languageOptions,
  getDefaultProfile,
  loadLocalProfile,
  saveLocalProfile,
  themeOptions,
} from "@/lib/storage/profileStorage";
import { saveProfile } from "@/lib/supabase/profile";
import { useGameStore } from "@/store/gameStore";
import { GameBoard } from "@/components/game/GameBoard";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
};

type GameShellProps = {
  mode?: "classic" | "daily";
  initialLayoutId?: string;
  seed?: string | null;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function GameShell({
  mode = "classic",
  initialLayoutId = defaultLayout.id,
  seed = null,
  eyebrow = "Mahjong Focus",
  title = "Classic Mahjong Solitaire",
  description = "Play a focused Mahjong board with rules, score, timer, hint, undo, shuffle, pause, and autosave.",
}: GameShellProps) {
  const hasLoadedSavedGame = useRef(false);
  const [profile, setProfile] = useState<LocalProfile>(() => getDefaultProfile());
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [requestedProThemeId, setRequestedProThemeId] = useState<
    LocalProfile["preferredTheme"] | null
  >(null);
  const [requestedProThemeLabel, setRequestedProThemeLabel] = useState<string | undefined>();
  const sessionId = useGameStore((state) => state.sessionId);
  const storeMode = useGameStore((state) => state.mode);
  const layoutId = useGameStore((state) => state.layoutId);
  const tiles = useGameStore((state) => state.tiles);
  const highlightedTileIds = useGameStore((state) => state.highlightedTileIds);
  const moves = useGameStore((state) => state.moves);
  const status = useGameStore((state) => state.status);
  const message = useGameStore((state) => state.message);
  const aiCoachRecommendation = useGameStore((state) => state.aiCoachRecommendation);
  const score = useGameStore((state) => state.score);
  const elapsedSeconds = useGameStore((state) => state.elapsedSeconds);
  const hintsUsed = useGameStore((state) => state.hintsUsed);
  const shufflesUsed = useGameStore((state) => state.shufflesUsed);
  const undosUsed = useGameStore((state) => state.undosUsed);
  const bonusClaimed = useGameStore((state) => state.bonusClaimed);
  const bonusClaimedAtMove = useGameStore((state) => state.bonusClaimedAtMove);
  const bonusMessageId = useGameStore((state) => state.bonusMessageId);
  const isPaused = useGameStore((state) => state.isPaused);
  const restartGame = useGameStore((state) => state.restartGame);
  const selectTile = useGameStore((state) => state.selectTile);
  const useHint = useGameStore((state) => state.useHint);
  const useAiCoach = useGameStore((state) => state.useAiCoach);
  const undoLastMove = useGameStore((state) => state.undoLastMove);
  const shuffleTiles = useGameStore((state) => state.shuffleTiles);
  const togglePause = useGameStore((state) => state.togglePause);
  const clearBonusMessage = useGameStore((state) => state.clearBonusMessage);
  const tick = useGameStore((state) => state.tick);
  const loadSavedState = useGameStore((state) => state.loadSavedState);
  const getSnapshot = useGameStore((state) => state.getSnapshot);

  const layout = layouts.find((item) => item.id === layoutId) ?? defaultLayout;
  const tileCount = layout.positions.length;
  const remainingTiles = tiles.filter((tile) => !tile.isRemoved).length;
  const availableMoves = useMemo(() => getAvailableMoves(tiles), [tiles]);
  const language = profile.preferredLanguage;
  const selectedTheme =
    themeOptions.find((theme) => theme.id === profile.preferredTheme) ?? themeOptions[0];

  useEffect(() => {
    setProfile(loadLocalProfile());
  }, []);

  const updateProfile = async (nextProfile: LocalProfile) => {
    setProfile(nextProfile);
    saveLocalProfile(nextProfile);
    await saveProfile(nextProfile);
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
      setIsThemeMenuOpen(false);
      setShowProUpgrade(true);
      return;
    }

    setIsThemeMenuOpen(false);
    updateProfile({
      ...profile,
      preferredTheme: themeId,
    });
  };

  useEffect(() => {
    if (hasLoadedSavedGame.current) {
      return;
    }

    const savedGame = loadSavedGame(mode);
    const savedGameMatchesSeed = mode === "classic" || savedGame?.seed === seed;

    if (savedGame && savedGameMatchesSeed) {
      loadSavedState(savedGame);
    } else {
      restartGame(initialLayoutId, mode, seed);
    }
    hasLoadedSavedGame.current = true;
  }, [initialLayoutId, loadSavedState, mode, restartGame, seed]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      tick();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [tick]);

  useEffect(() => {
    if (!bonusMessageId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearBonusMessage();
    }, 1700);

    return () => window.clearTimeout(timeoutId);
  }, [bonusMessageId, clearBonusMessage]);

  useEffect(() => {
    if (!hasLoadedSavedGame.current) {
      return;
    }

    saveGame(getSnapshot());
  }, [
    sessionId,
    storeMode,
    layoutId,
    tiles,
    moves,
    status,
    score,
    elapsedSeconds,
    hintsUsed,
    shufflesUsed,
    undosUsed,
    getSnapshot,
  ]);

  useEffect(() => {
    if (status !== "won") {
      return;
    }

    saveCompletedSession({
      id: sessionId,
      userId: null,
      mode: storeMode,
      layoutId,
      layoutName: layout.name,
      difficulty: layout.difficulty,
      score,
      durationSeconds: elapsedSeconds,
      movesCount: moves.length,
      hintsUsed,
      shufflesUsed,
      undosUsed,
      completed: true,
      bonusClaimed,
      bonusClaimedAtMove,
      createdAt: new Date().toISOString(),
    });
  }, [
    bonusClaimed,
    bonusClaimedAtMove,
    elapsedSeconds,
    hintsUsed,
    layout.difficulty,
    layout.name,
    layoutId,
    moves.length,
    score,
    sessionId,
    shufflesUsed,
    status,
    storeMode,
    undosUsed,
  ]);

  const handleSelectTile = (tile: Tile) => selectTile(tile.id);

  return (
    <main className="min-h-screen max-w-[100vw] overflow-x-hidden bg-linen text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-2 py-3 sm:gap-5 sm:px-4 sm:py-5 lg:px-6 xl:px-8">
        <header className="relative z-[200] rounded-lg border border-white/60 bg-white/60 p-2 shadow-sm backdrop-blur sm:p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
                {eyebrow}
              </p>
              <h1 className="mt-1 text-xl font-semibold text-ink sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-ink/70 sm:mt-2 sm:text-sm sm:leading-6">
                {description}
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <div className="grid grid-cols-2 gap-1 rounded-md bg-linen p-1 sm:flex sm:flex-wrap sm:gap-2">
                <Link
                  href="/game"
                  className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold transition ${
                    mode === "classic" ? "bg-clay text-white" : "bg-white text-ink"
                  }`}
                >
                  {t(language, "classic")}
                </Link>
                <Link
                  href="/daily"
                  className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold transition ${
                    mode === "daily" ? "bg-clay text-white" : "bg-white text-ink"
                  }`}
                >
                  {t(language, "daily")}
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
                <Link
                  href="/profile"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-sage bg-white px-2 text-xs font-semibold text-ink transition hover:border-clay sm:px-3 sm:text-sm"
                >
                  {t(language, "profile")}
                </Link>
            <Link
              href="/leaderboard"
              className="inline-flex h-9 items-center justify-center rounded-md border border-sage bg-white px-2 text-xs font-semibold text-ink transition hover:border-clay sm:px-3 sm:text-sm"
            >
              {t(language, "ranks")}
            </Link>
            <Link
              href="/store"
              className="inline-flex h-9 items-center justify-center rounded-md border border-sage bg-white px-2 text-xs font-semibold text-ink transition hover:border-clay sm:px-3 sm:text-sm"
            >
              {profile.isPro ? "Pro Active" : t(language, "pro")}
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-9 items-center justify-center rounded-md border border-sage bg-white px-2 text-xs font-semibold text-ink transition hover:border-clay sm:px-3 sm:text-sm"
            >
              {t(language, "signIn")}
            </Link>
                <div className="relative col-span-3 sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => setIsThemeMenuOpen((isOpen) => !isOpen)}
                    className="inline-flex h-9 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-sage bg-white px-2 text-xs font-semibold text-ink transition hover:border-clay sm:w-auto sm:min-w-[170px] sm:text-sm"
                    aria-label={t(language, "theme")}
                    aria-expanded={isThemeMenuOpen}
                  >
                    <span className="truncate">{selectedTheme.label}</span>
                    {selectedTheme.isPro && (
                      <span className="rounded bg-clay px-1.5 py-0.5 text-[10px] uppercase text-white">
                        Pro
                      </span>
                    )}
                  </button>
                  {isThemeMenuOpen && (
                    <div className="absolute right-0 top-11 z-[220] w-full min-w-[230px] rounded-lg border border-sage bg-white p-2 shadow-xl sm:w-64">
                      {themeOptions.map((theme) => {
                        const isActive = theme.id === profile.preferredTheme;

                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => handleThemeChange(theme.id)}
                            className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-linen ${
                              isActive ? "bg-sage/65 font-semibold text-ink" : "text-ink/75"
                            }`}
                          >
                            <span>{theme.label}</span>
                            {theme.isPro && (
                              <span className="rounded bg-clay px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                Pro
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <select
                  value={profile.preferredLanguage}
                  onChange={(event) =>
                    updateProfile({
                      ...profile,
                      preferredLanguage: event.target.value as LocalProfile["preferredLanguage"],
                    })
                  }
                  className="h-9 min-w-0 rounded-md border border-sage bg-white px-2 text-xs font-medium outline-none focus:border-clay sm:text-sm"
                  aria-label={t(language, "language")}
                >
                  {languageOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2 border-t border-sage/70 pt-3 sm:flex sm:flex-wrap">
            <select
              value={layout.id}
              onChange={(event) => restartGame(event.target.value, mode, seed)}
              className="h-10 min-w-0 rounded-md border border-sage bg-white px-2 text-xs font-medium text-ink outline-none transition focus:border-clay sm:px-3 sm:text-sm"
              aria-label="Choose layout"
            >
              {layouts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.difficulty} - {item.positions.length} tiles
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => restartGame(undefined, mode, seed)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clay px-3 text-sm font-semibold text-white transition hover:bg-[#a96945] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay sm:px-4"
            >
              <RotateCcw className="h-4 w-4" />
              {t(language, "restart")}
            </button>
            {profile.isPro && (
              <span className="inline-flex h-10 items-center gap-2 rounded-md bg-clay/15 px-3 text-sm font-semibold text-clay">
                <Crown className="h-4 w-4" />
                Pro
              </span>
            )}
          </div>
        </header>

        <section className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-4">
          <GameBoard
            tiles={tiles}
            highlightedTileIds={highlightedTileIds}
            isPaused={isPaused}
            onSelectTile={handleSelectTile}
          />
          {bonusMessageId && (
            <div
              key={bonusMessageId}
              className="pointer-events-none fixed left-1/2 top-28 z-[1000] -translate-x-1/2 rounded-full border border-red-300 bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-xl shadow-red-900/25 animate-[bonus-float_1.6s_ease-out_forwards]"
            >
              {t(language, "bonusClaimed")}
            </div>
          )}

          <aside className="min-w-0 space-y-3 xl:space-y-4">
            <div className="rounded-lg border border-white/60 bg-white/65 p-3 shadow-sm backdrop-blur sm:p-4">
            <h2 className="text-base font-semibold">{t(language, "gameState")}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink/60">
              <span className="rounded-md bg-sage/70 px-2 py-1">{layout.name}</span>
              <span className="rounded-md bg-sage/70 px-2 py-1">{layout.difficulty}</span>
              <span className="rounded-md bg-sage/70 px-2 py-1">{tileCount} tiles</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm min-[400px]:grid-cols-3 sm:mt-4 sm:gap-3">
              <div className="rounded-md bg-linen p-3">
                <dt className="text-ink/60">{t(language, "time")}</dt>
                <dd className="mt-1 text-xl font-semibold">{formatTime(elapsedSeconds)}</dd>
              </div>
              <div className="rounded-md bg-linen p-3">
                <dt className="text-ink/60">{t(language, "score")}</dt>
                <dd className="mt-1 text-xl font-semibold">{score}</dd>
              </div>
              <div className="rounded-md bg-linen p-3">
                <dt className="text-ink/60">{t(language, "remaining")}</dt>
                <dd className="mt-1 text-xl font-semibold">{remainingTiles}</dd>
              </div>
              <div className="rounded-md bg-linen p-3">
                <dt className="text-ink/60">{t(language, "moves")}</dt>
                <dd className="mt-1 text-xl font-semibold">{moves.length}</dd>
              </div>
              <div className="rounded-md bg-linen p-3">
                <dt className="text-ink/60">{t(language, "legalPairs")}</dt>
                <dd className="mt-1 text-xl font-semibold">{availableMoves.length}</dd>
              </div>
              <div className="rounded-md bg-linen p-3">
                <dt className="text-ink/60">{t(language, "status")}</dt>
                <dd className="mt-1 text-xl font-semibold capitalize">
                  {isPaused ? "paused" : status}
                </dd>
              </div>
            </dl>

            <div className="mt-3 grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:mt-4">
              <button
                type="button"
                onClick={useHint}
                disabled={status !== "playing" || isPaused}
                className="inline-flex h-10 min-h-10 items-center justify-center gap-1 rounded-md border border-sage bg-white px-2 text-xs font-semibold transition hover:border-clay disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:text-sm"
              >
                <Lightbulb className="h-4 w-4" />
                {t(language, "hint")}
              </button>
              <button
                type="button"
                onClick={useAiCoach}
                disabled={status !== "playing" || isPaused}
                className="inline-flex h-10 min-h-10 items-center justify-center gap-1 rounded-md border border-sage bg-white px-2 text-xs font-semibold transition hover:border-clay disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:text-sm"
              >
                <Brain className="h-4 w-4" />
                {t(language, "coach")}
              </button>
              <button
                type="button"
                onClick={undoLastMove}
                disabled={moves.length === 0 || isPaused}
                className="inline-flex h-10 min-h-10 items-center justify-center gap-1 rounded-md border border-sage bg-white px-2 text-xs font-semibold transition hover:border-clay disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:text-sm"
              >
                <StepBack className="h-4 w-4" />
                {t(language, "undo")}
              </button>
              <button
                type="button"
                onClick={shuffleTiles}
                disabled={status === "won" || isPaused}
                className="inline-flex h-10 min-h-10 items-center justify-center gap-1 rounded-md border border-sage bg-white px-2 text-xs font-semibold transition hover:border-clay disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:text-sm"
              >
                <Shuffle className="h-4 w-4" />
                {t(language, "shuffle")}
              </button>
              <button
                type="button"
                onClick={togglePause}
                disabled={status !== "playing"}
                className="inline-flex h-10 min-h-10 items-center justify-center gap-1 rounded-md border border-sage bg-white px-2 text-xs font-semibold transition hover:border-clay disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:text-sm"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? t(language, "resume") : t(language, "pause")}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-ink/65">
              <span className="rounded-md bg-linen px-2 py-2">Hints {hintsUsed}</span>
              <span className="rounded-md bg-linen px-2 py-2">Shuffles {shufflesUsed}</span>
              <span className="rounded-md bg-linen px-2 py-2">Undos {undosUsed}</span>
            </div>

            <p className="mt-4 rounded-md border border-sage/80 bg-white p-3 text-sm leading-6 text-ink/75">
              {message}
            </p>
            </div>

            <div className="rounded-lg border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-base font-semibold">
                  <Brain className="h-4 w-4 text-clay" />
                  {t(language, "coachTitle")}
                </h2>
                <button
                  type="button"
                  onClick={useAiCoach}
                  disabled={status !== "playing" || isPaused}
                  className="h-9 rounded-md bg-clay px-3 text-sm font-semibold text-white transition hover:bg-[#a96945] disabled:opacity-50"
                >
                  Analyze
                </button>
              </div>
            {aiCoachRecommendation && (
              <div className="mt-3 rounded-md border border-moss/50 bg-sage/55 p-3 text-sm leading-6 text-ink/75">
                <p className="font-semibold text-ink">{aiCoachRecommendation.title}</p>
                <p className="mt-1">{aiCoachRecommendation.explanation}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-clay">
                  {t(language, "nextPlan")}
                </p>
                <ul className="mt-2 space-y-2">
                  {aiCoachRecommendation.nextSteps.map((step) => (
                    <li key={step} className="rounded-md bg-white/65 px-3 py-2">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
              {!aiCoachRecommendation && (
                <p className="mt-3 rounded-md bg-linen p-3 text-sm leading-6 text-ink/70">
                  {t(language, "coachEmpty")}
                </p>
              )}
            </div>

            {(status === "won" || status === "no-moves") && (
              <div className="mt-4 rounded-lg border border-clay/30 bg-[#fff7ea] p-4">
                <p className="text-sm font-semibold">
                  {status === "won" ? "Board complete" : "No available moves"}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink/70">
                  {status === "won"
                    ? "You cleared every tile with legal Mahjong Solitaire moves."
                    : "This route has no legal matching free pairs left."}
                </p>
                <button
                  type="button"
                  onClick={() => restartGame(undefined, mode, seed)}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-clay px-3 text-sm font-semibold text-white transition hover:bg-[#a96945]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Play again
                </button>
              </div>
            )}
          </aside>
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
