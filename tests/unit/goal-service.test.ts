import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGoal,
  listGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  getGoalsSummary,
} from "@/lib/services/goal";
import * as supabaseServer from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Phase 6: Personal Goals & Growth Service", () => {
  const userA = "user-goal-aaa";
  const userB = "user-goal-bbb";

  let mockGoals: Array<{
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    status: string;
    target_date: string | null;
    created_at: string;
    updated_at: string;
  }> = [];

  beforeEach(() => {
    vi.clearAllMocks();

    mockGoals = [
      {
        id: "goal-1",
        user_id: userA,
        title: "Practice 10 minutes of box breathing daily",
        description: "To manage afternoon stress spikes.",
        status: "in_progress",
        target_date: "2026-11-30",
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      },
      {
        id: "goal-2",
        user_id: userA,
        title: "Go for an evening walk 4 times a week",
        description: null,
        status: "completed",
        target_date: "2026-10-20",
        created_at: "2026-10-05T00:00:00Z",
        updated_at: "2026-10-20T00:00:00Z",
      },
      {
        id: "goal-3",
        user_id: userB,
        title: "User B private aspiration",
        description: "Private",
        status: "in_progress",
        target_date: null,
        created_at: "2026-10-10T00:00:00Z",
        updated_at: "2026-10-10T00:00:00Z",
      },
    ];

    const mockSupabase: any = {
      from: (table: string) => {
        if (table === "goals") {
          return {
            insert: (record: any) => ({
              select: () => ({
                single: async () => {
                  const newGoal = {
                    id: "goal-" + (mockGoals.length + 1),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    ...record,
                  };
                  mockGoals.push(newGoal);
                  return { data: newGoal, error: null };
                },
              }),
            }),
            select: (_cols: string) => {
              let filtered = [...mockGoals];
              const builder: any = {
                eq: (col: string, val: any) => {
                  filtered = filtered.filter((r: any) => r[col] === val);
                  return builder;
                },
                order: () => builder,
                single: async () => {
                  const first = filtered[0];
                  return {
                    data: first || null,
                    error: first ? null : { message: "Not found" },
                  };
                },
                then: (resolve: any) => resolve({ data: filtered, error: null }),
              };
              return builder;
            },
            update: (updates: any) => ({
              eq: (c1: string, v1: any) => ({
                eq: (c2: string, v2: any) => ({
                  select: () => ({
                    single: async () => {
                      const idx = mockGoals.findIndex(
                        (r: any) => r[c1] === v1 && r[c2] === v2
                      );
                      if (idx === -1) {
                        return { data: null, error: { message: "Not found" } };
                      }
                      mockGoals[idx] = {
                        ...mockGoals[idx],
                        ...updates,
                        updated_at: new Date().toISOString(),
                      };
                      return { data: mockGoals[idx], error: null };
                    },
                  }),
                }),
              }),
            }),
            delete: () => ({
              eq: (c1: string, v1: any) => ({
                eq: async (c2: string, v2: any) => {
                  mockGoals = mockGoals.filter(
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

  describe("1. CRUD & Status Transitions", () => {
    it("creates a new personal goal with in_progress default", async () => {
      const { goal, error } = await createGoal(userA, {
        title: "Read 20 pages every night",
        description: "Wind down mind before sleep.",
        targetDate: "2026-12-31",
      });

      expect(error).toBeUndefined();
      expect(goal).not.toBeNull();
      expect(goal?.title).toBe("Read 20 pages every night");
      expect(goal?.status).toBe("in_progress");
      expect(goal?.targetDate).toBe("2026-12-31");
    });

    it("lists goals with status filter", async () => {
      const { goals } = await listGoals(userA, { status: "completed" });
      expect(goals.length).toBe(1);
      expect(goals[0].id).toBe("goal-2");
      expect(goals[0].status).toBe("completed");
    });

    it("updates goal status from in_progress to completed", async () => {
      const { goal, error } = await updateGoal(userA, "goal-1", {
        status: "completed",
      });

      expect(error).toBeUndefined();
      expect(goal?.status).toBe("completed");
    });

    it("deletes a goal permanently", async () => {
      const { success } = await deleteGoal(userA, "goal-1");
      expect(success).toBe(true);

      const { goal } = await getGoalById(userA, "goal-1");
      expect(goal).toBeNull();
    });
  });

  describe("2. Goals Summary Statistics", () => {
    it("calculates accurate summary KPI counts", async () => {
      const summary = await getGoalsSummary(userA);

      expect(summary.total).toBe(2);
      expect(summary.inProgress).toBe(1);
      expect(summary.completed).toBe(1);
      expect(summary.paused).toBe(0);
    });

    it("returns zero counts for a new user with empty state", async () => {
      const summary = await getGoalsSummary("user-empty");

      expect(summary.total).toBe(0);
      expect(summary.inProgress).toBe(0);
      expect(summary.completed).toBe(0);
      expect(summary.paused).toBe(0);
    });
  });

  describe("3. Permissions & Cross-User Isolation", () => {
    it("ensures User A cannot view User B's goals", async () => {
      const { goals } = await listGoals(userA);
      expect(goals.some((g) => g.id === "goal-3")).toBe(false);
      expect(goals.every((g) => g.userId === userA)).toBe(true);
    });

    it("ensures User A cannot update User B's goal", async () => {
      const { goal, error } = await updateGoal(userA, "goal-3", {
        title: "Malicious Tamper",
      });

      expect(goal).toBeNull();
      expect(error).toBeDefined();
    });

    it("ensures User A cannot delete User B's goal", async () => {
      await deleteGoal(userA, "goal-3");

      const { goal } = await getGoalById(userB, "goal-3");
      expect(goal).not.toBeNull();
      expect(goal?.id).toBe("goal-3");
    });
  });
});

