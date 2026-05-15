export type TileType = string;

export type Difficulty = "easy" | "medium" | "hard" | "daily";

export type TilePosition = {
  x: number;
  y: number;
  z: number;
};

export type Tile = TilePosition & {
  id: string;
  type: TileType;
  isRemoved: boolean;
  isSelected: boolean;
};

export type Layout = {
  id: string;
  name: string;
  difficulty: Difficulty;
  positions: TilePosition[];
};

export type Move = {
  tile1: Tile;
  tile2: Tile;
  timestamp: number;
  scoreBefore: number;
  scoreAfter: number;
  isBonusPair?: boolean;
};

export type AvailableMove = {
  tile1: Tile;
  tile2: Tile;
};

export type GameStatus = "idle" | "playing" | "won" | "no-moves";

export type ScoreEvent =
  | "pair"
  | "bonus-pair"
  | "hint"
  | "shuffle"
  | "undo"
  | "daily-complete";

export type GameSession = {
  id: string;
  userId: string | null;
  mode: "classic" | "daily";
  layoutId: string;
  layoutName: string;
  difficulty: Difficulty;
  score: number;
  durationSeconds: number;
  movesCount: number;
  hintsUsed: number;
  shufflesUsed: number;
  undosUsed: number;
  completed: boolean;
  bonusClaimed?: boolean;
  bonusClaimedAtMove?: number | null;
  createdAt: string;
};

export type UserStats = {
  totalGames: number;
  totalWins: number;
  bestTimeSeconds: number | null;
  averageTimeSeconds: number | null;
  totalScore: number;
  currentStreak: number;
  bestStreak: number;
  lastDailyCompleted: string | null;
};
