import { describe, it, expect } from "vitest";
import { scanUserMessage } from "@/lib/safety/detector";
import { getDeescalationMessage } from "@/lib/safety/deescalation";
import { getHelplinesForRegion } from "@/lib/safety/helplines";

describe("Safety Subsystem — Deterministic Multilingual Screening", () => {
  describe("English acute crisis detection", () => {
    const englishCrisisInputs = [
      "I want to kill myself tonight, I can't take it anymore",
      "I am thinking of suicide",
      "I'm going to slit my wrists",
      "I feel like I want to die and end it all",
      "I have decided to hang myself",
    ];

    it.each(englishCrisisInputs)("flags '%s' as acute crisis", (input) => {
      const result = scanUserMessage(input, "en", "IN");
      expect(result.isSafe).toBe(false);
      expect(result.level).toBe("crisis");
      expect(result.detectedLanguage).toBe("en");
      expect(result.recommendedHelplines.length).toBeGreaterThan(0);
    });
  });

  describe("Hindi (Devanagari) acute crisis detection", () => {
    const hindiCrisisInputs = [
      "मुझसे अब और नहीं सहा जाता, मैं आत्महत्या करने जा रहा हूँ",
      "मेरा खुदकुशी करने का मन कर रहा है",
      "अब इस दुनिया में जी कर क्या करूँ, सब खत्म कर देना चाहता हूँ",
      "मैं अपनी जान देने की सोच रहा हूँ",
    ];

    it.each(hindiCrisisInputs)("flags '%s' as acute crisis", (input) => {
      const result = scanUserMessage(input, "hi", "IN");
      expect(result.isSafe).toBe(false);
      expect(result.level).toBe("crisis");
      expect(result.detectedLanguage).toBe("hi");
      expect(result.recommendedHelplines.length).toBeGreaterThan(0);
    });
  });

  describe("Hinglish (Romanized Hindi) acute crisis detection", () => {
    const hinglishCrisisInputs = [
      "Yaar ab jeene ka mann nahi hai bilkul bhi",
      "Mujhe lagta hai main suicide kar lunga",
      "Zinda rehna nahi chahta ab aur takleef nahi sahan hoti",
      "Main apni jaan de dunga agar aisa hua to",
      "Phaansi laga lunga main",
    ];

    it.each(hinglishCrisisInputs)("flags '%s' as acute crisis", (input) => {
      const result = scanUserMessage(input, "hinglish", "IN");
      expect(result.isSafe).toBe(false);
      expect(result.level).toBe("crisis");
      expect(result.detectedLanguage).toBe("hinglish");
      expect(result.recommendedHelplines.length).toBeGreaterThan(0);
    });
  });

  describe("False-positive prevention (Benign idioms & everyday stress)", () => {
    const benignInputs = [
      "I have a killer headache today after the meeting",
      "That stand-up comedy special was so funny, I died laughing",
      "We found a killer deal on flights to Goa",
      "Today was a really exhausting day at the office",
      "Boss se thodi behes ho gayi, mood kafi off hai",
      "Kal mera technical interview hai aur thoda nervous hoon",
      "Mujhe lagta hai mere dost mujhe ignore kar rahe hain",
    ];

    it.each(benignInputs)("does NOT flag benign input '%s' as crisis", (input) => {
      const result = scanUserMessage(input, "hinglish", "IN");
      expect(result.level).not.toBe("crisis");
      expect(result.isSafe).toBe(true);
    });
  });

  describe("Localized Helpline & De-escalation Output", () => {
    it("returns Indian helplines including Tele-MANAS by default", () => {
      const helplines = getHelplinesForRegion("IN");
      const teleManas = helplines.find((h) => h.id === "tele-manas");
      expect(teleManas).toBeDefined();
      expect(teleManas?.number).toBe("14416");
    });

    it("returns 988 for US/Canada region", () => {
      const helplines = getHelplinesForRegion("US");
      const us988 = helplines.find((h) => h.id === "us-988");
      expect(us988).toBeDefined();
      expect(us988?.number).toBe("988");
    });

    it("delivers warm de-escalation message in requested language", () => {
      const hindiMsg = getDeescalationMessage("hi");
      expect(hindiMsg).toContain("टेली-मानस");
      expect(hindiMsg).toContain("14416");

      const hinglishMsg = getDeescalationMessage("hinglish");
      expect(hinglishMsg).toContain("Tele-MANAS");
      expect(hinglishMsg).toContain("14416");

      const enMsg = getDeescalationMessage("en");
      expect(enMsg).toContain("Tele-MANAS");
    });
  });
});

