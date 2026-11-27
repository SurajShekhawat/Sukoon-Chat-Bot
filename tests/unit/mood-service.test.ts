import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMoodEntry,
  listMoodEntries,
  deleteMoodEntry,
  getWeeklyMoodReflection,
  NON_CLINICAL_DISCLAIMER,
} from "@/lib/services/mood";
import * as supabaseServer from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Phase 6: Mood Service & Non-Clinical Reflection", () => {
  const userA = "user-mood-aaa";
  const userB = "user-mood-bbb";

  let mockEntries: Array<{
    id: string;
    user_id: string;
    score: number;
    primary_emotion: string;
    notes: string | null;
    recorded_at: string;
  }> = [];

  beforeEach(() => {
    vi.clearAllMocks();

    mockEntries = [
      {
        id: "mood-1",
        user_id: userA,
        score: 4,
        primary_emotion: "Calm",
        notes: "Peaceful morning walk and reflection.",
        recorded_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "mood-2",
        user_id: userA,
        score: 3,
        primary_emotion: "Grateful",
        notes: "Busy day, but managed to take deep breaths.",
        recorded_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: "mood-3",
        user_id: userB,
        score: 5,
        primary_emotion: "Hopeful",
        notes: "User B private entry.",
        recorded_at: new Date().toISOString(),
      },
    ];

    const mockSupabase: any = {
      from: (table: string) => {
        if (table === "mood_entries") {
          return {
            insert: (record: any) => ({
              select: () => ({
                single: async () => {
                  const newEntry = {
                    id: "mood-" + (mockEntries.length + 1),
                    ...record,
                  };
                  mockEntries.push(newEntry);
                  return { data: newEntry, error: null };
                },
              }),
            }),
            select: (_cols: string, opts?: any) => {
              let filtered = [...mockEntries];
              const builder: any = {
                eq: (col: string, val: any) => {
                  filtered = filtered.filter((r: any) => r[col] === val);
                  return builder;
                },
                gte: (col: string, val: string) => {
                  filtered = filtered.filter((r: any) => r[col] >= val);
                  return builder;
                },
                order: () => builder,
                range: (from: number, to: number) => {
                  const sliced = filtered.slice(from, to + 1);
                  return {
                    then: (resolve: any) =>
                      resolve({ data: sliced, count: filtered.length, error: null }),
                  };
                },
                then: (resolve: any) => resolve({ data: filtered, count: filtered.length, error: null }),
              };
              return builder;
            },
            delete: () => ({
              eq: (c1: string, v1: any) => ({
                eq: async (c2: string, v2: any) => {
                  mockEntries = mockEntries.filter(
                    (r: any) => !(r[c1] === v1 && r[c2] === v2)
                  );
                  return { error: null };
                },
              }),
            }),
          };
        }
        return {};
      },
    };

    vi.spyOn(supabaseServer, "createClient").mockResolvedValue(mockSupabase);
  });

  describe("1. CRUD Operations & Timezone Handling", () => {
    it("creates a mood check-in with UTC timestamp and valid score", async () => {
      const { entry, error } = await createMoodEntry(userA, {
        score: 5,
        primaryEmotion: "Peaceful",
        notes: "Had a great heart-to-heart conversation with a friend.",
      });

      expect(error).toBeUndefined();
      expect(entry).not.toBeNull();
      expect(entry?.score).toBe(5);
      expect(entry?.primaryEmotion).toBe("Peaceful");

      // Verify ISO 8601 UTC timestamp format
      expect(entry?.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("lists mood entries with pagination", async () => {
      const { entries, total } = await listMoodEntries(userA, { page: 1, limit: 10 });
      expect(entries.length).toBe(2);
      expect(total).toBe(2);
      expect(entries.every((e) => e.userId === userA)).toBe(true);
    });

    it("deletes a mood check-in", async () => {
      const { success } = await deleteMoodEntry(userA, "mood-1");
      expect(success).toBe(true);

      const { entries } = await listMoodEntries(userA);
      expect(entries.some((e) => e.id === "mood-1")).toBe(false);
    });
  });

  describe("2. Non-Clinical 7-Day Weekly Reflection", () => {
    it("aggregates weekly emotional trajectory without diagnostic claims", async () => {
      const { reflection } = await getWeeklyMoodReflection(userA);

      expect(reflection.totalCheckIns).toBe(2);
      expect(reflection.averageScore).toBe(3.5);
      expect(reflection.dominantEmotions.length).toBe(2);

      // Verify Non-Clinical Disclaimer is explicitly attached
      expect(reflection.disclaimer).toBe(NON_CLINICAL_DISCLAIMER);
      expect(reflection.disclaimer).toContain("NOT a clinical diagnosis");
      expect(reflection.disclaimer).toContain("medical prediction");

      // Verify reflection text uses mindful language and avoids medical diagnoses
      const summary = reflection.reflectionSummary.toLowerCase();
      expect(summary).not.toContain("depression");
      expect(summary).not.toContain("disorder");
      expect(summary).not.toContain("bipolar");
      expect(summary).not.toContain("pathology");
      expect(summary).not.toContain("clinical");
      expect(summary).not.toContain("prescription");
    });

    it("handles empty states gracefully when no check-ins exist", async () => {
      const { reflection } = await getWeeklyMoodReflection("user-no-checkins");

      expect(reflection.totalCheckIns).toBe(0);
      expect(reflection.averageScore).toBe(0);
      expect(reflection.dominantEmotions).toEqual([]);
      expect(reflection.reflectionSummary).toContain("no mood check-ins recorded");
      expect(reflection.disclaimer).toBe(NON_CLINICAL_DISCLAIMER);
    });
  });

  describe("3. Permissions & Cross-User Isolation", () => {
    it("ensures User A cannot view User B's mood entries", async () => {
      const { entries } = await listMoodEntries(userA);
      expect(entries.some((e) => e.id === "mood-3")).toBe(false);
      expect(entries.every((e) => e.userId === userA)).toBe(true);
    });

    it("ensures User A cannot delete User B's mood entry", async () => {
      // Trying to delete User B's entry with User A's ID
      await deleteMoodEntry(userA, "mood-3");

      // Entry should still exist for User B
      const { entries: userBEntries } = await listMoodEntries(userB);
      expect(userBEntries.some((e) => e.id === "mood-3")).toBe(true);
    });
  });
});

