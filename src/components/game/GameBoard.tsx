"use client";

import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { isTileFree } from "@/game/engine/rules";
import type { Tile } from "@/game/types";
import { GameTile } from "@/components/game/GameTile";

type GameBoardProps = {
  tiles: Tile[];
  highlightedTileIds: string[];
  isPaused: boolean;
  onSelectTile: (tile: Tile) => void;
};

type BoardMetrics = {
  tileWidth: number;
  tileHeight: number;
  stepX: number;
  stepY: number;
  layerOffset: number;
  layerRise: number;
  minHeight: number;
};

const getBoardMetrics = (tileCount: number, containerWidth: number): BoardMetrics => {
  if (containerWidth < 480) {
    return {
      tileWidth: tileCount >= 100 ? 38 : 42,
      tileHeight: tileCount >= 100 ? 48 : 52,
      stepX: tileCount >= 100 ? 13 : 15,
      stepY: tileCount >= 100 ? 16 : 18,
      layerOffset: 4,
      layerRise: 4,
      minHeight: 220,
    };
  }

  if (containerWidth < 768) {
    return {
      tileWidth: tileCount >= 100 ? 44 : 50,
      tileHeight: tileCount >= 100 ? 54 : 60,
      stepX: tileCount >= 100 ? 16 : 18,
      stepY: tileCount >= 100 ? 19 : 22,
      layerOffset: 5,
      layerRise: 5,
      minHeight: 260,
    };
  }

  if (tileCount >= 100) {
    return {
      tileWidth: 54,
      tileHeight: 68,
      stepX: 28,
      stepY: 34,
      layerOffset: 5,
      layerRise: 5,
      minHeight: 340,
    };
  }

  if (tileCount >= 72) {
    return {
      tileWidth: 61,
      tileHeight: 75,
      stepX: 33,
      stepY: 38,
      layerOffset: 6,
      layerRise: 6,
      minHeight: 340,
    };
  }

  return {
    tileWidth: 70,
    tileHeight: 84,
    stepX: 37,
    stepY: 44,
    layerOffset: 6,
    layerRise: 6,
    minHeight: 340,
  };
};

const getBoardBounds = (tiles: Tile[], metrics: BoardMetrics) => {
  const maxX = Math.max(...tiles.map((tile) => tile.x), 0);
  const maxY = Math.max(...tiles.map((tile) => tile.y), 0);
  const maxZ = Math.max(...tiles.map((tile) => tile.z), 0);

  return {
    width:
      (maxX + 2) * metrics.stepX +
      (maxZ + 2) * metrics.layerOffset +
      metrics.tileWidth,
    height: Math.max(
      metrics.minHeight,
      (maxY + 2) * metrics.stepY + metrics.tileHeight + maxZ * metrics.layerRise,
    ),
  };
};

export function GameBoard({
  tiles,
  highlightedTileIds,
  isPaused,
  onSelectTile,
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const activeTiles = tiles.filter((tile) => !tile.isRemoved);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(element.clientWidth);
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const metrics = useMemo(
    () => getBoardMetrics(tiles.length, containerWidth),
    [containerWidth, tiles.length],
  );
  const bounds = useMemo(() => getBoardBounds(tiles, metrics), [metrics, tiles]);
  const availableWidth = Math.max(0, containerWidth - 16);
  const scale = availableWidth > 0 ? Math.min(1, availableWidth / bounds.width) : 1;
  const scaledWidth = bounds.width * scale;
  const scaledHeight = bounds.height * scale;

  return (
    <div
      ref={containerRef}
      data-testid="game-board-card"
      className="w-full max-w-full overflow-hidden rounded-lg border border-white/50 bg-white/45 p-2 shadow-sm backdrop-blur sm:p-3 lg:p-4"
    >
      <div
        className="mx-auto"
        style={{
          width: scaledWidth || "100%",
          height: scaledHeight || bounds.height,
        }}
      >
        <div
          className={clsx(
            "relative rounded-lg",
            "bg-[radial-gradient(circle_at_top_left,rgb(var(--color-panel)/0.84),rgb(var(--color-sage)/0.62))]",
          )}
        style={
          {
            "--tile-width": `${metrics.tileWidth}px`,
            "--tile-height": `${metrics.tileHeight}px`,
            "--tile-step-x": `${metrics.stepX}px`,
            "--tile-step-y": `${metrics.stepY}px`,
            "--tile-layer-offset": `${metrics.layerOffset}px`,
            "--tile-layer-rise": `${metrics.layerRise}px`,
            width: bounds.width,
            height: bounds.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          } as React.CSSProperties
        }
      >
        {activeTiles.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center text-lg font-semibold text-moss">
            Board cleared
          </div>
        ) : (
          tiles
            .slice()
            .sort((first, second) => first.z - second.z || first.y - second.y)
            .map((tile) => (
              <GameTile
                key={tile.id}
                tile={tile}
                isFree={!isPaused && isTileFree(tile, tiles)}
                isHinted={highlightedTileIds.includes(tile.id)}
                onSelect={onSelectTile}
              />
            ))
        )}
        {isPaused && (
          <div className="absolute inset-0 z-[500] grid place-items-center rounded-lg bg-ink/70 text-lg font-semibold text-white backdrop-blur-sm">
            Paused
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
