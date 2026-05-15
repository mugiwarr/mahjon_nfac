import type { Layout, TilePosition } from "@/game/types";

const makeRows = (
  rowCounts: number[],
  z: number,
  maxColumns: number,
  yStart: number,
  xNudge = 0,
): TilePosition[] =>
  rowCounts.flatMap((count, rowIndex) => {
    const xStart = maxColumns - count + xNudge;
    const y = yStart + rowIndex * 2 + (z > 0 ? z % 2 : 0);

    return Array.from({ length: count }, (_, columnIndex) => ({
      x: xStart + columnIndex * 2,
      y,
      z,
    }));
  });

const makeLayout = (
  id: string,
  name: string,
  difficulty: Layout["difficulty"],
  layers: Array<{ rows: number[]; yStart: number; xNudge?: number }>,
  maxColumns: number,
): Layout => ({
  id,
  name,
  difficulty,
  positions: layers.flatMap((layer, z) =>
    makeRows(layer.rows, z, maxColumns, layer.yStart, layer.xNudge ?? z),
  ),
});

export const layouts: Layout[] = [
  makeLayout(
    "classic-turtle",
    "Classic Turtle",
    "medium",
    [
      { rows: [6, 8, 10, 12, 12, 12, 12, 10, 8, 6], yStart: 0 },
      { rows: [4, 6, 8, 8, 6, 4], yStart: 3 },
      { rows: [2, 2, 2, 2], yStart: 6 },
      { rows: [2, 2], yStart: 8 },
    ],
    12,
  ),
  makeLayout(
    "beginner",
    "Beginner",
    "easy",
    [
      { rows: [6, 8, 8, 8, 6], yStart: 0 },
      { rows: [4, 6, 6, 4], yStart: 2 },
      { rows: [2, 2, 2], yStart: 4 },
      { rows: [2], yStart: 6 },
    ],
    8,
  ),
  makeLayout(
    "pyramid",
    "Pyramid",
    "medium",
    [
      { rows: [8, 10, 10, 8, 8], yStart: 0 },
      { rows: [6, 8, 8, 6], yStart: 2 },
      { rows: [4, 4], yStart: 5 },
      { rows: [2, 2], yStart: 6 },
    ],
    10,
  ),
  makeLayout(
    "fortress",
    "Fortress",
    "hard",
    [
      { rows: [8, 10, 12, 12, 12, 10, 8], yStart: 0 },
      { rows: [6, 8, 8, 8, 6], yStart: 2 },
      { rows: [4, 4, 4], yStart: 4 },
    ],
    12,
  ),
  makeLayout(
    "mini-focus",
    "Mini Focus",
    "easy",
    [
      { rows: [6, 8, 8, 6], yStart: 0 },
      { rows: [4, 4, 4], yStart: 2 },
      { rows: [2, 2], yStart: 4 },
      { rows: [2, 2], yStart: 5 },
    ],
    8,
  ),
];

export const defaultLayout = layouts[0];

export const getLayoutById = (layoutId: string) =>
  layouts.find((layout) => layout.id === layoutId) ?? defaultLayout;
