import type { AvailableMove, Tile } from "@/game/types";

const TILE_WIDTH = 2;
const TILE_HEIGHT = 2;

const activeTiles = (tiles: Tile[]) => tiles.filter((tile) => !tile.isRemoved);

const rangesOverlap = (
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
) => firstStart < secondEnd && secondStart < firstEnd;

const footprintsOverlap = (first: Tile, second: Tile) =>
  rangesOverlap(first.x, first.x + TILE_WIDTH, second.x, second.x + TILE_WIDTH) &&
  rangesOverlap(first.y, first.y + TILE_HEIGHT, second.y, second.y + TILE_HEIGHT);

export const hasTileAbove = (tile: Tile, tiles: Tile[]) =>
  activeTiles(tiles).some(
    (candidate) =>
      candidate.id !== tile.id &&
      candidate.z > tile.z &&
      footprintsOverlap(tile, candidate),
  );

export const isSideBlocked = (
  tile: Tile,
  tiles: Tile[],
  side: "left" | "right",
) => {
  const sideX = side === "left" ? tile.x : tile.x + TILE_WIDTH;

  return activeTiles(tiles).some((candidate) => {
    if (candidate.id === tile.id || candidate.z !== tile.z) {
      return false;
    }

    const candidateTouchesSide =
      side === "left"
        ? candidate.x + TILE_WIDTH === sideX
        : candidate.x === sideX;

    return (
      candidateTouchesSide &&
      rangesOverlap(tile.y, tile.y + TILE_HEIGHT, candidate.y, candidate.y + TILE_HEIGHT)
    );
  });
};

export const isTileFree = (tile: Tile, tiles: Tile[]) => {
  if (tile.isRemoved || hasTileAbove(tile, tiles)) {
    return false;
  }

  const leftBlocked = isSideBlocked(tile, tiles, "left");
  const rightBlocked = isSideBlocked(tile, tiles, "right");

  return !leftBlocked || !rightBlocked;
};

export const canMatchTiles = (first: Tile, second: Tile, tiles: Tile[]) =>
  first.id !== second.id &&
  !first.isRemoved &&
  !second.isRemoved &&
  first.type === second.type &&
  isTileFree(first, tiles) &&
  isTileFree(second, tiles);

export const getAvailableMoves = (tiles: Tile[]): AvailableMove[] => {
  const freeTiles = activeTiles(tiles).filter((tile) => isTileFree(tile, tiles));
  const moves: AvailableMove[] = [];

  for (let firstIndex = 0; firstIndex < freeTiles.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < freeTiles.length; secondIndex += 1) {
      if (freeTiles[firstIndex].type === freeTiles[secondIndex].type) {
        moves.push({
          tile1: freeTiles[firstIndex],
          tile2: freeTiles[secondIndex],
        });
      }
    }
  }

  return moves;
};

export const hasWon = (tiles: Tile[]) => activeTiles(tiles).length === 0;
