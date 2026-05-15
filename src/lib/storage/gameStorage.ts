import type { GameStatus, Move, Tile } from "@/game/types";

const STORAGE_KEY_PREFIX = "mahjong-focus.current-game";
const STORAGE_VERSION = 5;

export type SavedGameState = {
  version: number;
  sessionId: string;
  mode: "classic" | "daily";
  seed: string | null;
  layoutId: string;
  tiles: Tile[];
  moves: Move[];
  status: GameStatus;
  score: number;
  elapsedSeconds: number;
  hintsUsed: number;
  shufflesUsed: number;
  undosUsed: number;
  hasStarted: boolean;
  bonusClaimed?: boolean;
  bonusClaimedAtMove?: number | null;
};

export const isSavedGameShapeValid = (state: Partial<SavedGameState>) => {
  if (
    typeof state.layoutId !== "string" ||
    typeof state.sessionId !== "string" ||
    (state.mode !== "classic" && state.mode !== "daily") ||
    (state.seed !== null && typeof state.seed !== "string") ||
    !Array.isArray(state.tiles) ||
    !Array.isArray(state.moves) ||
    typeof state.score !== "number" ||
    typeof state.elapsedSeconds !== "number" ||
    typeof state.hintsUsed !== "number" ||
    typeof state.shufflesUsed !== "number" ||
    typeof state.undosUsed !== "number" ||
    typeof state.hasStarted !== "boolean"
  ) {
    return false;
  }

  const ids = new Set<string>();
  for (const tile of state.tiles) {
    if (
      !tile ||
      typeof tile.id !== "string" ||
      typeof tile.type !== "string" ||
      ![tile.x, tile.y, tile.z].every(Number.isFinite) ||
      typeof tile.isRemoved !== "boolean"
    ) {
      return false;
    }

    if (ids.has(tile.id)) {
      return false;
    }
    ids.add(tile.id);
  }

  return state.tiles.length > 0 && state.tiles.length % 2 === 0;
};

const getStorageKey = (mode: "classic" | "daily") => `${STORAGE_KEY_PREFIX}.${mode}`;

export const loadSavedGame = (mode: "classic" | "daily"): SavedGameState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const key = getStorageKey(mode);
  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SavedGameState>;

    if (parsed.version !== STORAGE_VERSION) {
      window.localStorage.removeItem(key);
      return null;
    }

    if (!isSavedGameShapeValid(parsed)) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed as SavedGameState;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
};

export const saveGame = (state: SavedGameState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(state.mode), JSON.stringify(state));
};

export const gameStorageVersion = STORAGE_VERSION;

export const clearSavedGame = (mode: "classic" | "daily") => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getStorageKey(mode));
};
