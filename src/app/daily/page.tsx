import { generateDailySeed } from "@/game/engine/generator";
import { GameShell } from "@/components/game/GameShell";

export default function DailyPage() {
  const seed = generateDailySeed();

  return (
    <GameShell
      mode="daily"
      initialLayoutId="beginner"
      seed={seed}
      eyebrow="Daily Challenge"
      title="Today's Focus Board"
      description="A seeded daily Mahjong board. Everyone gets the same layout for the day; hints, shuffles, and undo carry score penalties."
    />
  );
}
