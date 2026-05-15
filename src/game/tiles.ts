import type { TileType } from "@/game/types";

export const BONUS_TILE_TYPE = "bonus-factorial";

const numberedFamilies = [
  { id: "bamboo", label: "Bamboo", glyph: "竹" },
  { id: "circle", label: "Circle", glyph: "○" },
  { id: "character", label: "Character", glyph: "萬" },
  { id: "lotus", label: "Lotus", glyph: "✿" },
  { id: "cloud", label: "Cloud", glyph: "☁" },
  { id: "knot", label: "Knot", glyph: "◇" },
] as const;

const honorTiles = [
  ["wind-east", "East Wind", "東"],
  ["wind-south", "South Wind", "南"],
  ["wind-west", "West Wind", "西"],
  ["wind-north", "North Wind", "北"],
  ["dragon-red", "Red Dragon", "龍"],
  ["dragon-green", "Green Dragon", "玉"],
  ["dragon-white", "White Dragon", "白"],
  ["season-spring", "Spring", "春"],
  ["season-summer", "Summer", "夏"],
  ["season-autumn", "Autumn", "秋"],
  ["season-winter", "Winter", "冬"],
  ["flower-plum", "Plum", "梅"],
  ["flower-orchid", "Orchid", "蘭"],
  ["flower-bamboo", "Bamboo Flower", "竹"],
  ["flower-chrysanthemum", "Chrysanthemum", "菊"],
] as const;

const numberedTiles = numberedFamilies.flatMap((family) =>
  Array.from({ length: 9 }, (_, index) => {
    const number = index + 1;

    return {
      id: `${family.id}-${number}`,
      label: `${family.label} ${number}`,
      glyph: `${family.glyph}${number}`,
    };
  }),
);

const accentTiles = Array.from({ length: 18 }, (_, index) => {
  const number = index + 1;

  return {
    id: `focus-${number}`,
    label: `Focus ${number}`,
    glyph: `✦${number}`,
  };
});

export const tileCatalogue = [
  ...numberedTiles,
  ...honorTiles.map(([id, label, glyph]) => ({ id, label, glyph })),
  ...accentTiles,
  { id: BONUS_TILE_TYPE, label: "n!", glyph: "n!" },
] satisfies Array<{ id: TileType; label: string; glyph: string }>;

export const tileTypes = tileCatalogue
  .map((tile) => tile.id)
  .filter((type) => type !== BONUS_TILE_TYPE);

export const tileLabels: Record<TileType, string> = Object.fromEntries(
  tileCatalogue.map((tile) => [tile.id, tile.label]),
);

export const tileGlyphs: Record<TileType, string> = Object.fromEntries(
  tileCatalogue.map((tile) => [tile.id, tile.glyph]),
);

export const getTileLabel = (type: TileType) => tileLabels[type] ?? type;

export const getTileGlyph = (type: TileType) => tileGlyphs[type] ?? type.slice(0, 3);

export const isBonusTile = (tile: { type: TileType }) => tile.type === BONUS_TILE_TYPE;

export const countBonusTiles = (tiles: Array<{ type: TileType }>) =>
  tiles.filter((tile) => isBonusTile(tile)).length;
