import { describe, it, expect } from "vitest";
import { signUpSchema, loginSchema, updateProfileSchema } from "@/lib/validation/auth";

describe("Auth & Profile Validation Logic", () => {
  describe("Sign Up Validation", () => {
    it("accepts valid sign up credentials", () => {
      const payload = {
        email: "priya.sharma@example.com",
        password: "SukoonPassword@123",
        displayName: "Priya",
        preferredLanguage: "hinglish",
      };
      const res = signUpSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it("rejects password shorter than 8 characters", () => {
      const payload = {
        email: "priya@example.com",
        password: "Short1",
        displayName: "Priya",
      };
      const res = signUpSchema.safeParse(payload);
      expect(res.success).toBe(false);
    });

    it("defaults preferredLanguage to hinglish and displayName to Friend", () => {
      const payload = {
        email: "rahul@example.com",
        password: "ValidPass123",
      };
      const res = signUpSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.preferredLanguage).toBe("hinglish");
        expect(res.data.displayName).toBe("Friend");
      }
    });
  });

  describe("Profile Update Validation", () => {
    it("allows partial updates to profile fields", () => {
      const update1 = { displayName: "Aarav K" };
      const update2 = { memoryConsent: false };
      const update3 = { preferredLanguage: "hi" as const, theme: "warm-dark" as const };

      expect(updateProfileSchema.safeParse(update1).success).toBe(true);
      expect(updateProfileSchema.safeParse(update2).success).toBe(true);
      expect(updateProfileSchema.safeParse(update3).success).toBe(true);
    });

    it("rejects invalid language or theme", () => {
      const invalid = { preferredLanguage: "french" };
      expect(updateProfileSchema.safeParse(invalid).success).toBe(false);
    });
  });
});

