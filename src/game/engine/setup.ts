import { generateSolvableBoard } from "@/game/engine/generator";
import { tileGlyphs, tileLabels, tileTypes } from "@/game/tiles";
import type { Layout, Tile } from "@/game/types";

export { tileGlyphs, tileLabels, tileTypes };

export const createTilesFromLayout = (layout: Layout, seed = layout.id): Tile[] => {
  if (layout.positions.length % 2 !== 0) {
    throw new Error(`Layout "${layout.id}" must contain an even number of tiles.`);
  }

  return generateSolvableBoard(layout, layout.difficulty, seed);
};
