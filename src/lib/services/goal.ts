import { createClient } from "@/lib/supabase/server";
import { CreateGoalInput, UpdateGoalInput } from "@/lib/validation/mood";
import { UserGoal } from "@/types/mood";
import { GoalStatus } from "@/types/database";

export interface GoalsSummary {
  total: number;
  inProgress: number;
  completed: number;
  paused: number;
}

/**
 * Creates a new personal growth goal for the authenticated user.
 */
export async function createGoal(
  userId: string,
  input: CreateGoalInput
): Promise<{ goal: UserGoal | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description || null,
      status: "in_progress",
      target_date: input.targetDate || null,
    })
    .select()
    .single();

  if (error || !data) {
    return { goal: null, error: error?.message || "Failed to create goal" };
  }

  return {
    goal: {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      status: data.status as GoalStatus,
      targetDate: data.target_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

/**
 * Lists user goals with optional status filtering.
 */
export async function listGoals(
  userId: string,
  options?: { status?: GoalStatus }
): Promise<{ goals: UserGoal[]; error?: string }> {
  const supabase = await createClient();

  let query = supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error) {
    return { goals: [], error: error.message };
  }

  const goals: UserGoal[] = (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status as GoalStatus,
    targetDate: row.target_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { goals };
}

/**
 * Retrieves a single goal by ID, verifying ownership.
 */
export async function getGoalById(
  userId: string,
  goalId: string
): Promise<{ goal: UserGoal | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { goal: null, error: error?.message || "Goal not found" };
  }

  return {
    goal: {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      status: data.status as GoalStatus,
      targetDate: data.target_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

/**
 * Updates a goal (title, description, status, target date).
 */
export async function updateGoal(
  userId: string,
  goalId: string,
  input: UpdateGoalInput
): Promise<{ goal: UserGoal | null; error?: string }> {
  const supabase = await createClient();

  const updates: {
    title?: string;
    description?: string | null;
    status?: GoalStatus;
    target_date?: string | null;
  } = {};

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.status !== undefined) updates.status = input.status;
  if (input.targetDate !== undefined) updates.target_date = input.targetDate;

  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", goalId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return { goal: null, error: error?.message || "Failed to update goal" };
  }

  return {
    goal: {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      status: data.status as GoalStatus,
      targetDate: data.target_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

/**
 * Permanently deletes a goal.
 */
export async function deleteGoal(
  userId: string,
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Aggregates summary statistics for goals.
 */
export async function getGoalsSummary(userId: string): Promise<GoalsSummary> {
  const { goals } = await listGoals(userId);

  return {
    total: goals.length,
    inProgress: goals.filter((g) => g.status === "in_progress").length,
    completed: goals.filter((g) => g.status === "completed").length,
    paused: goals.filter((g) => g.status === "paused").length,
  };
}

