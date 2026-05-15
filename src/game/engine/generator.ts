import { removePair } from "@/game/engine/actions";
import { shuffleWithSeed } from "@/game/engine/random";
import { getAvailableMoves, hasWon, isTileFree } from "@/game/engine/rules";
import { BONUS_TILE_TYPE, countBonusTiles, tileTypes } from "@/game/tiles";
import type { Difficulty, Layout, Tile, TilePosition, TileType } from "@/game/types";

type SolutionPair = {
  firstId: string;
  secondId: string;
};

export type BoardValidation = {
  isValid: boolean;
  errors: string[];
  initialMoves: number;
  isSolvable: boolean;
};

const minimumInitialMovesByDifficulty: Record<Difficulty, number> = {
  easy: 6,
  medium: 6,
  hard: 4,
  daily: 6,
};

const makeTileId = (layout: Layout, position: TilePosition, index: number) =>
  `${layout.id}-${position.x}-${position.y}-${position.z}-${index}`;

const createGeometryTiles = (layout: Layout): Tile[] =>
  layout.positions.map((position, index) => ({
    id: makeTileId(layout, position, index),
    type: tileTypes[0],
    x: position.x,
    y: position.y,
    z: position.z,
    isRemoved: false,
    isSelected: false,
  }));

const distance = (first: Tile, second: Tile) =>
  Math.abs(first.x - second.x) + Math.abs(first.y - second.y) + Math.abs(first.z - second.z) * 3;

const choosePair = (freeTiles: Tile[], seed: string, step: number): [Tile, Tile] | null => {
  if (freeTiles.length < 2) {
    return null;
  }

  const shuffled = shuffleWithSeed(freeTiles, `${seed}-free-${step}`);
  const first = shuffled[0];
  const second = shuffled
    .slice(1)
    .sort((left, right) => distance(first, right) - distance(first, left))[0];

  return second ? [first, second] : null;
};

const buildRemovalOrder = (
  layout: Layout,
  difficulty: Difficulty,
  seed: string,
): SolutionPair[] | null => {
  let tiles = createGeometryTiles(layout);
  const solutionPairs: SolutionPair[] = [];
  let step = 0;

  while (!hasWon(tiles)) {
    const freeTiles = tiles.filter((tile) => !tile.isRemoved && isTileFree(tile, tiles));
    const candidateTiles =
      difficulty === "easy"
        ? freeTiles.slice().sort((first, second) => first.z - second.z)
        : freeTiles;
    const pair = choosePair(candidateTiles, seed, step);

    if (!pair) {
      return null;
    }

    const [first, second] = pair;
    solutionPairs.push({ firstId: first.id, secondId: second.id });
    tiles = removePair(tiles, first, second);
    step += 1;
  }

  return solutionPairs;
};

const assignTypesFromSolution = (
  layout: Layout,
  solutionPairs: SolutionPair[],
  seed: string,
  bonusPairIndex: number,
): Tile[] => {
  const typeOrder = shuffleWithSeed(tileTypes, `${seed}-types`);
  const assignedTypes = new Map<string, TileType>();

  solutionPairs.forEach((pair, index) => {
    const type = index === bonusPairIndex ? BONUS_TILE_TYPE : typeOrder[index % typeOrder.length];
    assignedTypes.set(pair.firstId, type);
    assignedTypes.set(pair.secondId, type);
  });

  return createGeometryTiles(layout).map((tile) => ({
    ...tile,
    type: assignedTypes.get(tile.id) ?? typeOrder[0],
    isRemoved: false,
    isSelected: false,
  }));
};

export const hasBonusPairInitiallyAvailable = (tiles: Tile[]) =>
  getAvailableMoves(tiles).some(
    (move) => move.tile1.type === BONUS_TILE_TYPE && move.tile2.type === BONUS_TILE_TYPE,
  );

const getBonusPairCandidates = (solutionPairs: SolutionPair[], seed: string) => {
  const firstSafeIndex = Math.max(2, Math.floor(solutionPairs.length * 0.35));
  const indexes = solutionPairs
    .map((_, index) => index)
    .filter((index) => index >= firstSafeIndex);

  return shuffleWithSeed(indexes, `${seed}-bonus-indexes`);
};

const greedySolve = (tiles: Tile[]) => {
  let board = tiles.map((tile) => ({ ...tile, isRemoved: false, isSelected: false }));

  while (!hasWon(board)) {
    const moves = getAvailableMoves(board);

    if (moves.length === 0) {
      return false;
    }

    const bestMove = moves
      .map((move) => {
        const nextBoard = removePair(board, move.tile1, move.tile2);

        return {
          move,
          nextMoves: getAvailableMoves(nextBoard).length,
        };
      })
      .sort((first, second) => second.nextMoves - first.nextMoves)[0].move;

    board = removePair(board, bestMove.tile1, bestMove.tile2);
  }

  return true;
};

const stateKey = (tiles: Tile[]) =>
  tiles
    .filter((tile) => !tile.isRemoved)
    .map((tile) => tile.id)
    .sort()
    .join("|");

const solveWithBacktracking = (tiles: Tile[], nodeLimit: number) => {
  const memo = new Set<string>();
  let nodes = 0;

  const search = (board: Tile[]): boolean => {
    if (hasWon(board)) {
      return true;
    }

    nodes += 1;
    if (nodes > nodeLimit) {
      return false;
    }

    const key = stateKey(board);
    if (memo.has(key)) {
      return false;
    }
    memo.add(key);

    const moves = getAvailableMoves(board)
      .map((move) => {
        const nextBoard = removePair(board, move.tile1, move.tile2);

        return {
          move,
          nextMoves: getAvailableMoves(nextBoard).length,
          nextBoard,
        };
      })
      .sort((first, second) => second.nextMoves - first.nextMoves);

    for (const option of moves) {
      if (search(option.nextBoard)) {
        return true;
      }
    }

    return false;
  };

  return search(tiles.map((tile) => ({ ...tile, isRemoved: false, isSelected: false })));
};

export const isBoardSolvable = (tiles: Tile[]) => {
  if (greedySolve(tiles)) {
    return true;
  }

  const activeCount = tiles.filter((tile) => !tile.isRemoved).length;
  if (activeCount > 90) {
    return false;
  }

  return solveWithBacktracking(tiles, activeCount <= 60 ? 20000 : 8000);
};

export const countAvailableMoves = (tiles: Tile[]) => getAvailableMoves(tiles).length;

export const validateBoard = (
  tiles: Tile[],
  difficulty: Difficulty = "medium",
): BoardValidation => {
  const errors: string[] = [];
  const ids = new Set<string>();
  const coordinates = new Set<string>();
  const typeCounts = new Map<TileType, number>();
  const bonusCount = countBonusTiles(tiles);

  if (tiles.length % 2 !== 0) {
    errors.push("Tile count must be even.");
  }

  for (const tile of tiles) {
    if (ids.has(tile.id)) {
      errors.push(`Duplicate tile id: ${tile.id}`);
    }
    ids.add(tile.id);

    if (![tile.x, tile.y, tile.z].every(Number.isFinite)) {
      errors.push(`Invalid coordinate on tile: ${tile.id}`);
    }

    const coordinateKey = `${tile.x}:${tile.y}:${tile.z}`;
    if (coordinates.has(coordinateKey)) {
      errors.push(`Duplicate tile coordinate: ${coordinateKey}`);
    }
    coordinates.add(coordinateKey);

    typeCounts.set(tile.type, (typeCounts.get(tile.type) ?? 0) + 1);
  }

  for (const [type, count] of typeCounts) {
    if (count % 2 !== 0) {
      errors.push(`Tile type has an odd count: ${type}`);
    }
  }

  if (bonusCount !== 2) {
    errors.push(`Expected exactly 2 bonus tiles, got ${bonusCount}.`);
  }

  if (hasBonusPairInitiallyAvailable(tiles)) {
    errors.push("Bonus pair must not be available at the start.");
  }

  const initialMoves = countAvailableMoves(tiles);
  const minimumInitialMoves = minimumInitialMovesByDifficulty[difficulty];
  if (initialMoves < minimumInitialMoves) {
    errors.push(`Expected at least ${minimumInitialMoves} initial moves, got ${initialMoves}.`);
  }

  const isSolvable = errors.length === 0 && isBoardSolvable(tiles);
  if (!isSolvable) {
    errors.push("Board is not solvable without shuffle.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    initialMoves,
    isSolvable,
  };
};

export const createFallbackSolvableBoard = (
  layout: Layout,
  difficulty: Difficulty = layout.difficulty,
) => {
  const seed = `${layout.id}-fallback`;
  const solution = buildRemovalOrder(layout, difficulty, seed);

  if (!solution) {
    throw new Error(`Could not build a fallback solution for layout "${layout.id}".`);
  }

  for (const bonusPairIndex of getBonusPairCandidates(solution, seed)) {
    const board = assignTypesFromSolution(layout, solution, seed, bonusPairIndex);

    if (!hasBonusPairInitiallyAvailable(board)) {
      return board;
    }
  }

  return assignTypesFromSolution(layout, solution, seed, Math.max(2, solution.length - 1));
};

export const generateSolvableBoard = (
  layout: Layout,
  difficulty: Difficulty = layout.difficulty,
  seed = layout.id,
) => {
  const maxAttempts = difficulty === "hard" ? 24 : 16;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const attemptSeed = `${seed}-${attempt}`;
    const solution = buildRemovalOrder(layout, difficulty, attemptSeed);

    if (!solution || solution.length * 2 !== layout.positions.length) {
      continue;
    }

    for (const bonusPairIndex of getBonusPairCandidates(solution, attemptSeed)) {
      const board = assignTypesFromSolution(layout, solution, attemptSeed, bonusPairIndex);
      const validation = validateBoard(board, difficulty);

      if (validation.isValid) {
        return board;
      }
    }
  }

  const fallback = createFallbackSolvableBoard(layout, difficulty);
  const validation = validateBoard(fallback, difficulty);

  if (!validation.isValid) {
    throw new Error(
      `Fallback board for "${layout.id}" failed validation: ${validation.errors.join(" ")}`,
    );
  }

  return fallback;
};

export const generateDailySeed = (date = new Date()) =>
  `${date.toISOString().slice(0, 10)}-mahjong-focus`;

export const generateLayoutFromSeed = (layout: Layout, seed: string) =>
  generateSolvableBoard(layout, "daily", seed);
