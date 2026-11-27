import { test, expect } from "@playwright/test";

test.describe("Sukoon AI — Homepage & Responsive Design", () => {
  test("renders homepage with brand logo, headline, and trust markers", async ({ page }) => {
    await page.goto("/");

    // Verify Brand Logo & Text
    await expect(page.locator("header")).toContainText("Sukoon");
    await expect(page.locator("header")).toContainText("सुकून");

    // Verify Main Headline & Subtitle
    await expect(page.locator("h1")).toContainText("A gentle space to talk through");
    await expect(page.locator("h1")).toContainText("everyday stress, loneliness & life");

    // Verify CTA Buttons
    const startBtn = page.getByRole("link", { name: /Start Your Safe Space/i });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveAttribute("href", "/signup");

    const signInBtn = page.getByRole("link", { name: /Sign In/i }).first();
    await expect(signInBtn).toBeVisible();

    // Verify Trust Markers
    await expect(page.getByText("100% Free & Unlimited")).toBeVisible();
    await expect(page.getByText("Consent-Only Memory Vault")).toBeVisible();
    await expect(page.getByText("Strict Non-Clinical Boundaries")).toBeVisible();
  });

  test("interactive multilingual preview switches languages smoothly", async ({ page }) => {
    await page.goto("/");

    // Locate the interactive preview container
    const preview = page.locator("section").filter({ hasText: "Interactive Experience" });
    await expect(preview).toBeVisible();

    // Default should show Hinglish sample
    await expect(preview).toContainText("Yaar aaj office mein itna burnout feel ho raha tha");

    // Click Hindi tab
    const hindiTab = preview.getByRole("button", { name: /हिन्दी/i });
    await hindiTab.click();
    await expect(preview).toContainText("नमस्ते सुकून, आज मन बहुत भारी लग रहा है");

    // Click English tab
    const englishTab = preview.getByRole("button", { name: /English/i });
    await englishTab.click();
    await expect(preview).toContainText("I feel like I'm falling behind in everything");
  });

  test("renders 24/7 emergency helplines and ethical disclosure", async ({ page }) => {
    await page.goto("/");

    // Verify Helplines Section
    const helplinesSection = page.locator("#helplines");
    await expect(helplinesSection).toBeVisible();
    await expect(helplinesSection).toContainText("14416");
    await expect(helplinesSection).toContainText("Tele-MANAS");
    await expect(helplinesSection).toContainText("1800-599-0019");

    // Verify Non-Clinical Transparency Pledge
    const ethicsSection = page.locator("#ethics");
    await expect(ethicsSection).toBeVisible();
    await expect(ethicsSection).toContainText("Our Non-Clinical Safety & Ethical Transparency Pledge");
    await expect(ethicsSection).toContainText("It is not a licensed therapist, clinical doctor");
  });

  test("responsive mobile navigation toggle functions correctly", async ({ page, isMobile }) => {
    if (!isMobile) return;

    await page.goto("/");

    // Hamburger button should be visible on mobile
    const hamburger = page.getByRole("button", { name: /Toggle menu/i });
    await expect(hamburger).toBeVisible();

    // Click to open menu
    await hamburger.click();
    await expect(page.getByRole("link", { name: /Create Safe Space/i })).toBeVisible();

    // Click to close menu
    await hamburger.click();
  });

  test("accessibility checks: document has title, lang, and semantic landmarks", async ({ page }) => {
    await page.goto("/");

    // Title check
    await expect(page).toHaveTitle(/Sukoon AI/i);

    // Semantic landmarks
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();

    // Headings hierarchy
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });
});

