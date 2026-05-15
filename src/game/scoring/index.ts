import type { ScoreEvent } from "@/game/types";

const scoreValues: Record<ScoreEvent, number> = {
  pair: 100,
  "bonus-pair": 200,
  hint: -50,
  shuffle: -150,
  undo: -25,
  "daily-complete": 500,
};

export const calculateScore = (currentScore: number, event: ScoreEvent) =>
  Math.max(0, currentScore + scoreValues[event]);
