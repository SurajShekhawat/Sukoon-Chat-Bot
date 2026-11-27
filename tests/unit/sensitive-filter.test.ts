import { describe, it, expect } from "vitest";
import { scanSensitiveContent } from "@/lib/services/sensitive-filter";

describe("Phase 5: Memory Sensitive Content Filter", () => {
  it("allows safe, benign personal reflections", () => {
    const safeInputs = [
      "I am preparing for UPSC civil services exam next June.",
      "My elder sister's name is Kavita and she lives in Bangalore.",
      "I love morning walks and drinking black coffee before work.",
      "Currently working as a software developer at a logistics firm.",
      "My target is to read 15 books this year.",
    ];

    for (const text of safeInputs) {
      const result = scanSensitiveContent(text);
      expect(result.hasSensitiveData).toBe(false);
      expect(result.detectedTypes.length).toBe(0);
    }
  });

  it("detects and flags credit and debit card numbers", () => {
    const cardInputs = [
      "My card number is 4111 2222 3333 4444",
      "Saved card: 5105105105105100",
      "Visa card 4012-8888-9999-1881",
    ];

    for (const text of cardInputs) {
      const result = scanSensitiveContent(text);
      expect(result.hasSensitiveData).toBe(true);
      expect(result.detectedTypes).toContain("financial_card");
    }
  });

  it("detects and flags banking PINs and CVV security codes", () => {
    const authInputs = [
      "My atm pin is 4821",
      "UPI PIN: 9942",
      "card CVV is 842",
      "cvc: 123",
    ];

    for (const text of authInputs) {
      const result = scanSensitiveContent(text);
      expect(result.hasSensitiveData).toBe(true);
      expect(result.detectedTypes).toContain("financial_auth");
    }
  });

  it("detects and flags Indian national identification (Aadhaar / PAN)", () => {
    const aadhaarInput = "My aadhaar number is 2456 7890 1234";
    const aadhaarResult = scanSensitiveContent(aadhaarInput);
    expect(aadhaarResult.hasSensitiveData).toBe(true);
    expect(aadhaarResult.detectedTypes).toContain("national_id_aadhaar");

    const panInput = "My PAN card is ABCDE1234F";
    const panResult = scanSensitiveContent(panInput);
    expect(panResult.hasSensitiveData).toBe(true);
    expect(panResult.detectedTypes).toContain("national_id_pan");
  });

  it("detects and flags credentials, passwords, and API keys", () => {
    const credInputs = [
      "My password is SecretPassword123!",
      "OpenAI key sk-proj-1234567890abcdef1234567890abcdef12",
      "Github token ghp_1234567890abcdefghijklmnopqrstuvwxyz",
    ];

    for (const text of credInputs) {
      const result = scanSensitiveContent(text);
      expect(result.hasSensitiveData).toBe(true);
      expect(result.detectedTypes).toContain("credentials");
    }
  });
});

