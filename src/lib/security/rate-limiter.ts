/**
 * In-memory Token Bucket & Daily Quota Rate Limiter.
 * Enforces per-user rate limits, burst protection, and duplicate-submission locks.
 */

interface UserRateLimitState {
  dailyCount: number;
  lastResetDay: string; // YYYY-MM-DD
  minuteTimestamps: number[];
  activeRequestIds: Set<string>;
}

const rateLimitStore = new Map<string, UserRateLimitState>();

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: "daily_quota_exceeded" | "burst_limit_exceeded" | "duplicate_submission";
  remainingDaily: number;
  retryAfterSeconds?: number;
}

const DEFAULT_DAILY_LIMIT = 50;
const BURST_LIMIT_PER_MINUTE = 15;

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Checks if a user is within their rate limit boundaries.
 */
export function checkRateLimit(
  userId: string,
  dailyLimit: number = DEFAULT_DAILY_LIMIT,
  burstLimit: number = BURST_LIMIT_PER_MINUTE
): RateLimitCheckResult {
  const now = Date.now();
  const today = getTodayString();

  let state = rateLimitStore.get(userId);
  if (!state) {
    state = {
      dailyCount: 0,
      lastResetDay: today,
      minuteTimestamps: [],
      activeRequestIds: new Set(),
    };
    rateLimitStore.set(userId, state);
  }

  // Daily quota reset if day changed
  if (state.lastResetDay !== today) {
    state.dailyCount = 0;
    state.lastResetDay = today;
    state.minuteTimestamps = [];
  }

  // Clean timestamps older than 60 seconds
  const oneMinuteAgo = now - 60 * 1000;
  state.minuteTimestamps = state.minuteTimestamps.filter((ts) => ts > oneMinuteAgo);

  // Check burst limit
  if (state.minuteTimestamps.length >= burstLimit) {
    const oldest = state.minuteTimestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + 60 * 1000 - now) / 1000);
    return {
      allowed: false,
      reason: "burst_limit_exceeded",
      remainingDaily: Math.max(0, dailyLimit - state.dailyCount),
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  // Check daily limit
  if (state.dailyCount >= dailyLimit) {
    return {
      allowed: false,
      reason: "daily_quota_exceeded",
      remainingDaily: 0,
      retryAfterSeconds: 3600, // Try next day
    };
  }

  return {
    allowed: true,
    remainingDaily: dailyLimit - state.dailyCount,
  };
}

/**
 * Increments the user's consumption count upon a valid request.
 */
export function recordMessageSent(userId: string): void {
  let state = rateLimitStore.get(userId);
  if (!state) {
    state = {
      dailyCount: 0,
      lastResetDay: getTodayString(),
      minuteTimestamps: [],
      activeRequestIds: new Set(),
    };
    rateLimitStore.set(userId, state);
  }
  state.dailyCount += 1;
  state.minuteTimestamps.push(Date.now());
}

/**
 * Prevents rapid double-clicks / duplicate submissions on the same conversation.
 */
export function acquireRequestLock(userId: string, requestId: string): boolean {
  let state = rateLimitStore.get(userId);
  if (!state) {
    state = {
      dailyCount: 0,
      lastResetDay: getTodayString(),
      minuteTimestamps: [],
      activeRequestIds: new Set(),
    };
    rateLimitStore.set(userId, state);
  }

  if (state.activeRequestIds.has(requestId)) {
    return false; // Duplicate
  }

  state.activeRequestIds.add(requestId);
  return true;
}

/**
 * Releases the active request lock.
 */
export function releaseRequestLock(userId: string, requestId: string): void {
  const state = rateLimitStore.get(userId);
  if (state) {
    state.activeRequestIds.delete(requestId);
  }
}

/**
 * Clears in-memory store or a specific user's state (primarily for unit tests).
 */
export function resetRateLimit(userId?: string): void {
  if (userId) {
    rateLimitStore.delete(userId);
  } else {
    rateLimitStore.clear();
  }
}

/**
 * Clears in-memory store (primarily for unit tests).
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
