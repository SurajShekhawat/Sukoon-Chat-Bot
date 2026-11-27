import { createClient } from "@/lib/supabase/server";
import { CreateMoodEntryInput } from "@/lib/validation/mood";
import { MoodEntry } from "@/types/mood";

export interface WeeklyReflection {
  totalCheckIns: number;
  averageScore: number;
  dominantEmotions: Array<{ emotion: string; count: number }>;
  startDate: string;
  endDate: string;
  reflectionSummary: string;
  disclaimer: string;
}

export const NON_CLINICAL_DISCLAIMER =
  "This emotional summary is generated solely for personal self-awareness and mindful reflection. It is NOT a clinical diagnosis, psychological assessment, psychiatric evaluation, or medical prediction.";

/**
 * Creates a new mood entry for an authenticated user.
 */
export async function createMoodEntry(
  userId: string,
  input: CreateMoodEntryInput
): Promise<{ entry: MoodEntry | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mood_entries")
    .insert({
      user_id: userId,
      score: input.score,
      primary_emotion: input.primaryEmotion,
      notes: input.notes || null,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    return { entry: null, error: error?.message || "Failed to record mood check-in" };
  }

  return {
    entry: {
      id: data.id,
      userId: data.user_id,
      score: data.score,
      primaryEmotion: data.primary_emotion,
      notes: data.notes,
      recordedAt: data.recorded_at,
    },
  };
}

/**
 * Lists mood entries for an authenticated user with pagination.
 */
export async function listMoodEntries(
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<{ entries: MoodEntry[]; total: number; error?: string }> {
  const supabase = await createClient();

  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(50, Math.max(1, options?.limit || 20));
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("mood_entries")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { entries: [], total: 0, error: error.message };
  }

  const entries: MoodEntry[] = (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    score: row.score,
    primaryEmotion: row.primary_emotion,
    notes: row.notes,
    recordedAt: row.recorded_at,
  }));

  return { entries, total: count || 0 };
}

/**
 * Deletes a single mood entry, verifying ownership.
 */
export async function deleteMoodEntry(
  userId: string,
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("mood_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Computes a 7-day mindful reflection of emotional trajectory.
 * Adheres strictly to non-clinical guidance.
 */
export async function getWeeklyMoodReflection(
  userId: string
): Promise<{ reflection: WeeklyReflection; error?: string }> {
  const supabase = await createClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const { data, error } = await supabase
    .from("mood_entries")
    .select("score, primary_emotion, recorded_at")
    .eq("user_id", userId)
    .gte("recorded_at", sevenDaysAgoISO)
    .order("recorded_at", { ascending: true });

  const nowISO = new Date().toISOString();

  if (error || !data || data.length === 0) {
    return {
      reflection: {
        totalCheckIns: 0,
        averageScore: 0,
        dominantEmotions: [],
        startDate: sevenDaysAgoISO,
        endDate: nowISO,
        reflectionSummary:
          "You have no mood check-ins recorded over the past 7 days. Tracking how you feel even once a day can help build self-awareness.",
        disclaimer: NON_CLINICAL_DISCLAIMER,
      },
    };
  }

  const totalCheckIns = data.length;
  const sumScores = data.reduce((sum, item) => sum + item.score, 0);
  const averageScore = Number((sumScores / totalCheckIns).toFixed(1));

  // Count emotion frequency
  const emotionCounts: Record<string, number> = {};
  for (const item of data) {
    const emotion = item.primary_emotion;
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  }

  const dominantEmotions = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count);

  // Craft non-clinical mindful reflection summary
  let reflectionSummary = "";
  if (averageScore >= 4.0) {
    reflectionSummary =
      "Your check-ins over the past week reflect a generally calm, uplifted, or steady emotional rhythm. Take a moment to appreciate what contributed to your peace.";
  } else if (averageScore >= 2.8) {
    reflectionSummary =
      "Your check-ins show a balanced mix of steady and challenging days. Acknowledging both the quiet moments and the difficult ones is a sign of healthy self-reflection.";
  } else {
    reflectionSummary =
      "Your check-ins indicate that this has been a demanding or heavy week. Remember to be gentle with yourself, rest when needed, and reach out to someone you trust.";
  }

  return {
    reflection: {
      totalCheckIns,
      averageScore,
      dominantEmotions,
      startDate: sevenDaysAgoISO,
      endDate: nowISO,
      reflectionSummary,
      disclaimer: NON_CLINICAL_DISCLAIMER,
    },
  };
}

