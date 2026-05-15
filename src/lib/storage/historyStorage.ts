import type { GameSession, UserStats } from "@/game/types";

const HISTORY_KEY = "mahjong-focus.game-history";
const RECORDED_SESSIONS_KEY = "mahjong-focus.recorded-sessions";

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const loadGameHistory = () => readJson<GameSession[]>(HISTORY_KEY, []);

export const hasRecordedSession = (sessionId: string) =>
  readJson<string[]>(RECORDED_SESSIONS_KEY, []).includes(sessionId);

export const saveCompletedSession = (session: GameSession) => {
  if (hasRecordedSession(session.id)) {
    return;
  }

  const history = loadGameHistory();
  writeJson(HISTORY_KEY, [session, ...history].slice(0, 50));
  writeJson(RECORDED_SESSIONS_KEY, [
    session.id,
    ...readJson<string[]>(RECORDED_SESSIONS_KEY, []),
  ].slice(0, 100));
};

export const getUserStats = (): UserStats => {
  const history = loadGameHistory();
  const completed = history.filter((session) => session.completed);
  const totalDuration = completed.reduce(
    (sum, session) => sum + session.durationSeconds,
    0,
  );

  return {
    totalGames: history.length,
    totalWins: completed.length,
    bestTimeSeconds:
      completed.length > 0
        ? Math.min(...completed.map((session) => session.durationSeconds))
        : null,
    averageTimeSeconds:
      completed.length > 0 ? Math.round(totalDuration / completed.length) : null,
    totalScore: completed.reduce((sum, session) => sum + session.score, 0),
    currentStreak: 0,
    bestStreak: 0,
    lastDailyCompleted: null,
  };
};
