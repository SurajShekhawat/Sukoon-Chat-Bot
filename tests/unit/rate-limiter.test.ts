import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  recordMessageSent,
  acquireRequestLock,
  releaseRequestLock,
  resetRateLimitStore,
} from "@/lib/security/rate-limiter";

describe("Security — Rate Limiting & Quota Management", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests when under quota", () => {
    const res = checkRateLimit("user-1", 50, 15);
    expect(res.allowed).toBe(true);
    expect(res.remainingDaily).toBe(50);
  });

  it("decrements remaining quota upon recording messages", () => {
    recordMessageSent("user-1");
    recordMessageSent("user-1");
    const res = checkRateLimit("user-1", 50, 15);
    expect(res.allowed).toBe(true);
    expect(res.remainingDaily).toBe(48);
  });

  it("blocks requests when daily quota is exceeded", () => {
    for (let i = 0; i < 5; i++) {
      recordMessageSent("user-daily");
    }
    const res = checkRateLimit("user-daily", 5, 20);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("daily_quota_exceeded");
    expect(res.remainingDaily).toBe(0);
  });

  it("blocks bursts exceeding per-minute threshold", () => {
    for (let i = 0; i < 3; i++) {
      recordMessageSent("user-burst");
    }
    const res = checkRateLimit("user-burst", 50, 3);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("burst_limit_exceeded");
    expect(res.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("prevents concurrent duplicate submissions for same conversation", () => {
    const firstLock = acquireRequestLock("user-1", "conv-100");
    expect(firstLock).toBe(true);

    // Duplicate submission attempt while in flight
    const duplicateLock = acquireRequestLock("user-1", "conv-100");
    expect(duplicateLock).toBe(false);

    // After release, allows new request
    releaseRequestLock("user-1", "conv-100");
    const newLock = acquireRequestLock("user-1", "conv-100");
    expect(newLock).toBe(true);
  });
});
