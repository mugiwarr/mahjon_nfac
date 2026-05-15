"use client";

import clsx from "clsx";
import { tileGlyphs, tileLabels } from "@/game/engine/setup";
import { isBonusTile } from "@/game/tiles";
import type { Tile } from "@/game/types";

type GameTileProps = {
  tile: Tile;
  isFree: boolean;
  isHinted: boolean;
  onSelect: (tile: Tile) => void;
};

export function GameTile({ tile, isFree, isHinted, onSelect }: GameTileProps) {
  if (tile.isRemoved) {
    return null;
  }
  const isBonus = isBonusTile(tile);

  return (
    <button
      type="button"
      aria-label={`${tileLabels[tile.type]} tile${isFree ? "" : " blocked"}`}
      aria-pressed={tile.isSelected}
      disabled={!isFree}
      onClick={() => onSelect(tile)}
      className={clsx(
        "group absolute flex h-[var(--tile-height)] w-[var(--tile-width)] select-none flex-col items-center justify-center overflow-hidden rounded-md border text-center font-semibold transition duration-150",
        "before:absolute before:inset-[0.22rem] before:rounded-[0.35rem] before:border before:border-current/10 before:content-[''] after:absolute after:left-2 after:right-2 after:top-2 after:h-1 after:rounded-full after:bg-white/45 after:content-['']",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay",
        isFree
          ? "cursor-pointer border-clay/35 bg-[image:var(--tile-pattern)] text-ink shadow-tile hover:-translate-y-1 hover:border-clay"
          : "cursor-not-allowed border-sage bg-sage/75 text-ink/45 shadow-sm",
        isBonus &&
          "border-red-500 bg-[linear-gradient(135deg,#fff1f1,#ffd6d6)] text-red-700 shadow-[0_10px_0_#b91c1c,0_16px_30px_rgba(185,28,28,0.28)] ring-2 ring-red-400/30",
        isBonus &&
          !isFree &&
          "border-red-900/40 bg-[linear-gradient(135deg,#f3d4d4,#d8a5a5)] text-red-900/60 ring-red-900/15",
        tile.isSelected &&
          "z-50 -translate-y-1 border-clay bg-linen text-clay shadow-tile-active ring-4 ring-clay/20",
        isHinted &&
          "z-40 border-moss bg-sage ring-4 ring-moss/25",
      )}
      style={{
        left: `calc(${tile.x} * var(--tile-step-x) + ${tile.z} * var(--tile-layer-offset))`,
        top: `calc(${tile.y} * var(--tile-step-y) - ${tile.z} * var(--tile-layer-rise))`,
        zIndex: tile.z * 20 + tile.y + (tile.isSelected ? 200 : 0),
      }}
    >
      <span className="relative z-10 text-[clamp(0.95rem,2.8vw,1.6rem)] leading-none">
        {tileGlyphs[tile.type]}
      </span>
      <span className="relative z-10 mt-1 hidden max-w-[90%] truncate text-[0.52rem] font-medium uppercase tracking-[0.08em] text-current opacity-70 xl:block">
        {tileLabels[tile.type]}
      </span>
    </button>
  );
}
