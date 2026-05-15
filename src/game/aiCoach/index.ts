import { removePair } from "@/game/engine/actions";
import { getAvailableMoves, isTileFree } from "@/game/engine/rules";
import { getTileLabel } from "@/game/tiles";
import type { AvailableMove, Tile } from "@/game/types";

export type AiCoachRecommendation = {
  move: AvailableMove;
  score: number;
  title: string;
  explanation: string;
  nextSteps: string[];
  risk: "low" | "medium" | "high";
};

const countFreeTiles = (tiles: Tile[]) =>
  tiles.filter((tile) => !tile.isRemoved && isTileFree(tile, tiles)).length;

const countTopLayerRemoved = (move: AvailableMove) =>
  Math.max(move.tile1.z, move.tile2.z);

export const getAiCoachRecommendation = (
  tiles: Tile[],
): AiCoachRecommendation | null => {
  const moves = getAvailableMoves(tiles);

  if (moves.length === 0) {
    return null;
  }

  const currentFreeTiles = countFreeTiles(tiles);
  const scoredMoves = moves
    .map((move) => {
      const nextBoard = removePair(tiles, move.tile1, move.tile2);
      const nextFreeTiles = countFreeTiles(nextBoard);
      const nextMoves = getAvailableMoves(nextBoard).length;
      const opensTiles = Math.max(0, nextFreeTiles - currentFreeTiles + 2);
      const topLayerScore = countTopLayerRemoved(move) * 2;
      const score = opensTiles * 4 + nextMoves * 2 + topLayerScore;
      const risk: AiCoachRecommendation["risk"] =
        nextMoves <= 1 ? "high" : opensTiles === 0 ? "medium" : "low";

      return {
        move,
        score,
        opensTiles,
        nextMoves,
        risk,
      };
    })
    .sort((first, second) => second.score - first.score);

  const best = scoredMoves[0];
  const label = getTileLabel(best.move.tile1.type);

  return {
    move: best.move,
    score: best.score,
    title:
      best.risk === "high"
        ? `Risk warning: ${label}`
        : `Recommended move: ${label}`,
    explanation:
      best.opensTiles > 0
        ? `This pair opens ${best.opensTiles} tile${best.opensTiles === 1 ? "" : "s"} and leaves ${best.nextMoves} legal pair${best.nextMoves === 1 ? "" : "s"}.`
        : `This pair is legal, but it does not open new tiles. It leaves ${best.nextMoves} legal pair${best.nextMoves === 1 ? "" : "s"}, so consider it only if stronger top-layer moves are unavailable.`,
    nextSteps: [
      "Remove this highlighted pair first; it is the highest-value move in the current position.",
      best.opensTiles > 0
        ? "After removing it, scan the newly opened tiles before taking another easy side pair."
        : "Because it does not open much, look for a top-layer pair immediately after this move.",
      best.risk === "high"
        ? "This board is getting tight, so avoid shuffle until you confirm there are no strategic alternatives."
        : "Keep prioritizing pairs that uncover covered tiles or reduce the highest layer.",
    ],
    risk: best.risk,
  };
};
