export interface MoodEntry {
  id: string;
  userId: string;
  score: number; // 1 to 5
  primaryEmotion: string;
  notes?: string | null;
  recordedAt: string;
}

export interface UserGoal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: "in_progress" | "completed" | "paused" | "abandoned";
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

