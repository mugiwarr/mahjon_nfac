import { shuffleWithSeed } from "@/game/engine/random";
import type { Move, Tile } from "@/game/types";

export const removePair = (tiles: Tile[], tile1: Tile, tile2: Tile) =>
  tiles.map((tile) =>
    tile.id === tile1.id || tile.id === tile2.id
      ? { ...tile, isRemoved: true, isSelected: false }
      : { ...tile, isSelected: false },
  );

export const undoMove = (tiles: Tile[], move: Move) =>
  tiles.map((tile) =>
    tile.id === move.tile1.id || tile.id === move.tile2.id
      ? { ...tile, isRemoved: false, isSelected: false }
      : { ...tile, isSelected: false },
  );

export const shuffleRemainingTiles = (tiles: Tile[], seed: string) => {
  const remainingTypes = tiles
    .filter((tile) => !tile.isRemoved)
    .map((tile) => tile.type);
  const shuffledTypes = shuffleWithSeed(remainingTypes, seed);
  let typeIndex = 0;

  return tiles.map((tile) => {
    if (tile.isRemoved) {
      return { ...tile, isSelected: false };
    }

    const type = shuffledTypes[typeIndex];
    typeIndex += 1;

    return { ...tile, type, isSelected: false };
  });
};
