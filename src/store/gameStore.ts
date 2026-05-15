"use client";

import { create } from "zustand";
import { removePair, shuffleRemainingTiles, undoMove } from "@/game/engine/actions";
import {
  getAiCoachRecommendation,
  type AiCoachRecommendation,
} from "@/game/aiCoach";
import { canMatchTiles, getAvailableMoves, hasWon, isTileFree } from "@/game/engine/rules";
import { createTilesFromLayout, tileLabels } from "@/game/engine/setup";
import { defaultLayout, getLayoutById } from "@/game/layouts";
import { calculateScore } from "@/game/scoring";
import { isBonusTile } from "@/game/tiles";
import type { GameStatus, Move, Tile } from "@/game/types";
import { gameStorageVersion, type SavedGameState } from "@/lib/storage/gameStorage";

type GameStoreState = {
  sessionId: string;
  mode: "classic" | "daily";
  seed: string | null;
  layoutId: string;
  tiles: Tile[];
  selectedTileId: string | null;
  highlightedTileIds: string[];
  moves: Move[];
  status: GameStatus;
  message: string;
  aiCoachRecommendation: AiCoachRecommendation | null;
  score: number;
  elapsedSeconds: number;
  hintsUsed: number;
  shufflesUsed: number;
  undosUsed: number;
  bonusClaimed: boolean;
  bonusClaimedAtMove: number | null;
  bonusMessageId: number | null;
  isPaused: boolean;
  hasStarted: boolean;
};

type GameStoreActions = {
  restartGame: (layoutId?: string, mode?: "classic" | "daily", seed?: string | null) => void;
  selectTile: (tileId: string) => void;
  useHint: () => void;
  useAiCoach: () => void;
  undoLastMove: () => void;
  shuffleTiles: () => void;
  togglePause: () => void;
  clearBonusMessage: () => void;
  tick: () => void;
  loadSavedState: (state: SavedGameState) => void;
  getSnapshot: () => SavedGameState;
};

type GameStore = GameStoreState & GameStoreActions;

const createInitialTiles = (layoutId = defaultLayout.id, seed = `${layoutId}-initial`) =>
  createTilesFromLayout(getLayoutById(layoutId), seed);

const createSessionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createFreshState = (
  layoutId = defaultLayout.id,
  mode: "classic" | "daily" = "classic",
  seed: string | null = null,
): GameStoreState => ({
  sessionId: createSessionId(),
  mode,
  seed,
  layoutId,
  tiles: createInitialTiles(layoutId, seed ?? `${layoutId}-${Date.now()}`),
  selectedTileId: null,
  highlightedTileIds: [],
  moves: [],
  status: "playing",
  message: "New board ready. Select two matching free tiles.",
  aiCoachRecommendation: null,
  score: 0,
  elapsedSeconds: 0,
  hintsUsed: 0,
  shufflesUsed: 0,
  undosUsed: 0,
  bonusClaimed: false,
  bonusClaimedAtMove: null,
  bonusMessageId: null,
  isPaused: false,
  hasStarted: false,
});

const getPostMoveStatus = (tiles: Tile[]): Pick<GameStoreState, "status" | "message"> => {
  if (hasWon(tiles)) {
    return {
      status: "won",
      message: "Victory. Every tile has been cleared.",
    };
  }

  if (getAvailableMoves(tiles).length === 0) {
    return {
      status: "no-moves",
      message: "No available moves. Shuffle or restart this board.",
    };
  }

  return {
    status: "playing",
    message: "Pair removed.",
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  sessionId: "classic-turtle-initial",
  mode: "classic",
  seed: null,
  layoutId: defaultLayout.id,
  tiles: createInitialTiles(defaultLayout.id),
  selectedTileId: null,
  highlightedTileIds: [],
  moves: [],
  status: "playing",
  message: "Select two matching free tiles.",
  aiCoachRecommendation: null,
  score: 0,
  elapsedSeconds: 0,
  hintsUsed: 0,
  shufflesUsed: 0,
  undosUsed: 0,
  bonusClaimed: false,
  bonusClaimedAtMove: null,
  bonusMessageId: null,
  isPaused: false,
  hasStarted: false,

  restartGame: (layoutId, mode, seed) => {
    const state = get();
    const nextMode = mode ?? state.mode;
    const nextSeed = seed === undefined ? state.seed : seed;
    set(createFreshState(layoutId ?? state.layoutId, nextMode, nextSeed));
  },

  selectTile: (tileId) => {
    const state = get();

    if (state.status !== "playing" || state.isPaused) {
      return;
    }

    const tile = state.tiles.find((item) => item.id === tileId);

    if (!tile) {
      return;
    }

    if (!isTileFree(tile, state.tiles)) {
      set({
        message: "That tile is blocked. A tile needs a clear top and one open side.",
        highlightedTileIds: [],
        aiCoachRecommendation: null,
      });
      return;
    }

    if (!state.selectedTileId) {
      set({
        selectedTileId: tile.id,
        hasStarted: true,
        highlightedTileIds: [],
        aiCoachRecommendation: null,
        tiles: state.tiles.map((item) => ({
          ...item,
          isSelected: item.id === tile.id,
        })),
        message: "Good. Now choose the matching free tile.",
      });
      return;
    }

    if (state.selectedTileId === tile.id) {
      set({
        selectedTileId: null,
        highlightedTileIds: [],
        aiCoachRecommendation: null,
        tiles: state.tiles.map((item) => ({ ...item, isSelected: false })),
        message: "Selection cleared.",
      });
      return;
    }

    const firstTile = state.tiles.find((item) => item.id === state.selectedTileId);

    if (!firstTile || !canMatchTiles(firstTile, tile, state.tiles)) {
      set({
        selectedTileId: null,
        highlightedTileIds: [],
        aiCoachRecommendation: null,
        tiles: state.tiles.map((item) => ({ ...item, isSelected: false })),
        message: "Those tiles do not form a legal pair.",
      });
      return;
    }

    const scoreBefore = state.score;
    const isBonusPair = isBonusTile(firstTile) && isBonusTile(tile);
    const scoreAfter = calculateScore(scoreBefore, isBonusPair ? "bonus-pair" : "pair");
    const nextTiles = removePair(state.tiles, firstTile, tile);
    const nextMove: Move = {
      tile1: firstTile,
      tile2: tile,
      timestamp: Date.now(),
      scoreBefore,
      scoreAfter,
      isBonusPair,
    };
    const result = getPostMoveStatus(nextTiles);

    set({
      tiles: nextTiles,
      selectedTileId: null,
      highlightedTileIds: [],
      aiCoachRecommendation: null,
      moves: [...state.moves, nextMove],
      score: scoreAfter,
      hasStarted: true,
      bonusClaimed: state.bonusClaimed || isBonusPair,
      bonusClaimedAtMove: isBonusPair ? state.moves.length + 1 : state.bonusClaimedAtMove,
      bonusMessageId: isBonusPair ? Date.now() : state.bonusMessageId,
      ...result,
    });
  },

  useHint: () => {
    const state = get();

    if (state.status !== "playing" || state.isPaused) {
      return;
    }

    const [move] = getAvailableMoves(state.tiles);

    if (!move) {
      set({
        status: "no-moves",
        message: "No available moves. Shuffle or restart this board.",
      });
      return;
    }

    set({
      selectedTileId: null,
      highlightedTileIds: [move.tile1.id, move.tile2.id],
      tiles: state.tiles.map((tile) => ({ ...tile, isSelected: false })),
      score: calculateScore(state.score, "hint"),
      hintsUsed: state.hintsUsed + 1,
      hasStarted: true,
      message: `Hint: try the ${tileLabels[move.tile1.type]} pair.`,
      aiCoachRecommendation: null,
    });
  },

  useAiCoach: () => {
    const state = get();

    if (state.status !== "playing" || state.isPaused) {
      return;
    }

    const recommendation = getAiCoachRecommendation(state.tiles);

    if (!recommendation) {
      set({
        status: "no-moves",
        message: "AI Coach found no legal moves. Shuffle or restart this board.",
      });
      return;
    }

    set({
      selectedTileId: null,
      highlightedTileIds: [
        recommendation.move.tile1.id,
        recommendation.move.tile2.id,
      ],
      tiles: state.tiles.map((tile) => ({ ...tile, isSelected: false })),
      score: calculateScore(state.score, "hint"),
      hintsUsed: state.hintsUsed + 1,
      hasStarted: true,
      aiCoachRecommendation: recommendation,
      message: recommendation.title,
    });
  },

  undoLastMove: () => {
    const state = get();
    const lastMove = state.moves.at(-1);

    if (!lastMove || state.isPaused) {
      return;
    }

    set({
      tiles: undoMove(state.tiles, lastMove),
      moves: state.moves.slice(0, -1),
      selectedTileId: null,
      highlightedTileIds: [],
      aiCoachRecommendation: null,
      score: calculateScore(lastMove.scoreBefore, "undo"),
      undosUsed: state.undosUsed + 1,
      bonusClaimed: lastMove.isBonusPair ? false : state.bonusClaimed,
      bonusClaimedAtMove: lastMove.isBonusPair ? null : state.bonusClaimedAtMove,
      status: "playing",
      message: "Last pair restored. Undo applies a small score penalty.",
    });
  },

  shuffleTiles: () => {
    const state = get();

    if (state.status === "won" || state.isPaused) {
      return;
    }

    set({
      tiles: shuffleRemainingTiles(state.tiles, `shuffle-${Date.now()}`),
      selectedTileId: null,
      highlightedTileIds: [],
      aiCoachRecommendation: null,
      score: calculateScore(state.score, "shuffle"),
      shufflesUsed: state.shufflesUsed + 1,
      status: "playing",
      hasStarted: true,
      message: "Remaining tile faces shuffled. Positions stayed fixed.",
    });
  },

  togglePause: () => {
    const state = get();

    if (state.status !== "playing") {
      return;
    }

    set({
      isPaused: !state.isPaused,
      selectedTileId: null,
      highlightedTileIds: [],
      aiCoachRecommendation: null,
      tiles: state.tiles.map((tile) => ({ ...tile, isSelected: false })),
      message: state.isPaused ? "Game resumed." : "Game paused.",
    });
  },

  clearBonusMessage: () => {
    set({ bonusMessageId: null });
  },

  tick: () => {
    const state = get();

    if (state.status === "playing" && state.hasStarted && !state.isPaused) {
      set({ elapsedSeconds: state.elapsedSeconds + 1 });
    }
  },

  loadSavedState: (savedState) => {
    const layout = getLayoutById(savedState.layoutId);
    const expectedIds = new Set(
      layout.positions.map(
        (position, index) =>
          `${layout.id}-${position.x}-${position.y}-${position.z}-${index}`,
      ),
    );
    const hasMatchingGeometry =
      savedState.tiles.length === layout.positions.length &&
      savedState.tiles.every((tile) => expectedIds.has(tile.id));

    if (!hasMatchingGeometry) {
      set(createFreshState(layout.id));
      return;
    }

      set({
      sessionId: savedState.sessionId,
      mode: savedState.mode,
      seed: savedState.seed,
      layoutId: savedState.layoutId,
      tiles: savedState.tiles,
      moves: savedState.moves,
      status: savedState.status,
      score: savedState.score,
      elapsedSeconds: savedState.elapsedSeconds,
      hintsUsed: savedState.hintsUsed,
      shufflesUsed: savedState.shufflesUsed,
      undosUsed: savedState.undosUsed,
      bonusClaimed: savedState.bonusClaimed ?? false,
      bonusClaimedAtMove: savedState.bonusClaimedAtMove ?? null,
      bonusMessageId: null,
      hasStarted: savedState.hasStarted,
      selectedTileId: null,
      highlightedTileIds: [],
      aiCoachRecommendation: null,
      isPaused: false,
      message: "Saved game restored.",
    });
  },

  getSnapshot: () => {
    const state = get();

    return {
      version: gameStorageVersion,
      sessionId: state.sessionId,
      mode: state.mode,
      seed: state.seed,
      layoutId: state.layoutId,
      tiles: state.tiles,
      moves: state.moves,
      status: state.status,
      score: state.score,
      elapsedSeconds: state.elapsedSeconds,
      hintsUsed: state.hintsUsed,
      shufflesUsed: state.shufflesUsed,
      undosUsed: state.undosUsed,
      bonusClaimed: state.bonusClaimed,
      bonusClaimedAtMove: state.bonusClaimedAtMove,
      hasStarted: state.hasStarted,
    };
  },
}));
