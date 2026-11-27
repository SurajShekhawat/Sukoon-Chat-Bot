import { createClient } from "@/lib/supabase/server";
import { CreateMemoryInput, UpdateMemoryInput } from "@/lib/validation/memory";
import { UserMemory } from "@/types/memory";
import { MemoryCategory } from "@/types/database";
import { scanSensitiveContent } from "./sensitive-filter";

export class MemoryServiceError extends Error {
  constructor(message: string, public code: string = "MEMORY_ERROR", public status: number = 400) {
    super(message);
    this.name = "MemoryServiceError";
  }
}

export class ConsentRequiredError extends MemoryServiceError {
  constructor(message: string = "Memory vault consent is currently disabled. Please enable memory consent in your profile.") {
    super(message, "CONSENT_REQUIRED", 403);
    this.name = "ConsentRequiredError";
  }
}

export class SensitiveDataError extends MemoryServiceError {
  constructor(message: string) {
    super(message, "SENSITIVE_DATA_DETECTED", 422);
    this.name = "SensitiveDataError";
  }
}

/**
 * Sanitizes memory text to strip malicious XML escape tags.
 */
function sanitizeMemoryText(text: string): string {
  return text
    .replace(/<\/untrusted_memory_vault>/gi, "")
    .replace(/<untrusted_memory_vault>/gi, "")
    .replace(/<\/untrusted_user_message>/gi, "")
    .trim();
}

/**
 * Retrieves all memories for an authenticated user with optional filtering.
 */
export async function listUserMemories(
  userId: string,
  options?: { onlyActive?: boolean; category?: MemoryCategory }
): Promise<{ memories: UserMemory[]; error?: string }> {
  const supabase = await createClient();

  let query = supabase
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.onlyActive) {
    query = query.eq("is_active", true);
  }

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  const { data, error } = await query;

  if (error) {
    return { memories: [], error: error.message };
  }

  const memories: UserMemory[] = (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    content: row.content,
    category: row.category as MemoryCategory,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { memories };
}

/**
 * Retrieves a single memory by ID, verifying user ownership.
 */
export async function getMemoryById(
  userId: string,
  memoryId: string
): Promise<{ memory: UserMemory | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("id", memoryId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { memory: null, error: error?.message || "Memory not found" };
  }

  return {
    memory: {
      id: data.id,
      userId: data.user_id,
      content: data.content,
      category: data.category as MemoryCategory,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

/**
 * Creates a new memory item for the user.
 * Validates active memory consent and scans for sensitive details.
 */
export async function createMemory(
  userId: string,
  input: CreateMemoryInput
): Promise<{ memory: UserMemory | null; error?: string }> {
  const supabase = await createClient();

  // 1. Verify user's global memory consent in profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("memory_consent")
    .eq("id", userId)
    .single();

  if (!profile || !profile.memory_consent) {
    throw new ConsentRequiredError();
  }

  // 2. Scan for sensitive data (financial, credentials, national IDs)
  const sensitiveCheck = scanSensitiveContent(input.content);
  if (sensitiveCheck.hasSensitiveData) {
    throw new SensitiveDataError(sensitiveCheck.reasons.join(" "));
  }

  // 3. Sanitize content against prompt injection breakouts
  const sanitizedContent = sanitizeMemoryText(input.content);

  const { data, error } = await supabase
    .from("memories")
    .insert({
      user_id: userId,
      content: sanitizedContent,
      category: input.category || "general",
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    return { memory: null, error: error?.message || "Failed to create memory" };
  }

  return {
    memory: {
      id: data.id,
      userId: data.user_id,
      content: data.content,
      category: data.category as MemoryCategory,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

/**
 * Updates an existing memory item (content, category, or active status).
 */
export async function updateMemory(
  userId: string,
  memoryId: string,
  input: UpdateMemoryInput
): Promise<{ memory: UserMemory | null; error?: string }> {
  const supabase = await createClient();

  // Verify existence & ownership
  const { memory: existing } = await getMemoryById(userId, memoryId);
  if (!existing) {
    throw new MemoryServiceError("Memory not found or unauthorized", "NOT_FOUND", 404);
  }

  const updates: {
    content?: string;
    category?: MemoryCategory;
    is_active?: boolean;
  } = {};

  if (input.content !== undefined) {
    const sensitiveCheck = scanSensitiveContent(input.content);
    if (sensitiveCheck.hasSensitiveData) {
      throw new SensitiveDataError(sensitiveCheck.reasons.join(" "));
    }
    updates.content = sanitizeMemoryText(input.content);
  }

  if (input.category !== undefined) {
    updates.category = input.category;
  }

  if (input.isActive !== undefined) {
    updates.is_active = input.isActive;
  }

  const { data, error } = await supabase
    .from("memories")
    .update(updates)
    .eq("id", memoryId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return { memory: null, error: error?.message || "Failed to update memory" };
  }

  return {
    memory: {
      id: data.id,
      userId: data.user_id,
      content: data.content,
      category: data.category as MemoryCategory,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

/**
 * Permanently deletes a single memory from the database.
 */
export async function deleteMemory(
  userId: string,
  memoryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", memoryId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Permanently erases all memories belonging to the user.
 */
export async function clearAllMemories(
  userId: string
): Promise<{ count: number; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memories")
    .delete()
    .eq("user_id", userId)
    .select("id");

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: data?.length || 0 };
}

/**
 * Updates global memory consent for the authenticated user in the profiles table.
 */
export async function updateMemoryConsent(
  userId: string,
  consent: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ memory_consent: consent })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Retrieves active, consented memories formatted strictly for AI Chat generation.
 * Enforces two-tier consent check:
 * 1. Global user profile consent (profiles.memory_consent) must be true.
 * 2. Individual memory consent (is_active) must be true.
 * Returns empty array if consent is revoked or absent.
 */
export async function getActiveMemoriesForChat(
  userId: string,
  limit: number = 15
): Promise<Array<{ category: string; content: string }>> {
  const supabase = await createClient();

  // Tier 1: Check global profile consent
  const { data: profile } = await supabase
    .from("profiles")
    .select("memory_consent")
    .eq("id", userId)
    .single();

  if (!profile || !profile.memory_consent) {
    return [];
  }

  // Tier 2: Check individual memory active consent
  const { data: memories } = await supabase
    .from("memories")
    .select("category, content")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!memories || memories.length === 0) {
    return [];
  }

  return memories.map((m) => ({
    category: m.category,
    content: m.content,
  }));
}
