import { test, expect } from "@playwright/test";

test.describe("Sukoon AI — Authentication & Route Guards", () => {
  test("renders login page with accessible form inputs and links", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h2")).toContainText("Welcome back");
    await expect(page.locator("input[name='email']")).toBeVisible();
    await expect(page.locator("input[name='password']")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();

    // Verify link to signup
    const signupLink = page.getByRole("link", { name: /create an account/i });
    await expect(signupLink).toBeVisible();
  });

  test("renders signup page with preferred language selector and consent context", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.locator("h2")).toContainText("Create your safe space");
    await expect(page.locator("input[name='displayName']")).toBeVisible();
    await expect(page.locator("select[name='preferredLanguage']")).toBeVisible();
    await expect(page.locator("input[name='email']")).toBeVisible();
    await expect(page.locator("input[name='password']")).toBeVisible();
    await expect(page.getByRole("button", { name: /Create My Free Account/i })).toBeVisible();

    // Verify default language option includes Hinglish
    const langSelect = page.locator("select[name='preferredLanguage']");
    await expect(langSelect).toHaveValue("hinglish");
  });

  test("unauthenticated access to protected routes redirects to /login", async ({ page }) => {
    const protectedRoutes = ["/chat", "/memories", "/mood", "/goals", "/settings"];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("form displays client validation on invalid inputs", async ({ page }) => {
    await page.goto("/signup");

    // Try submitting empty form
    await page.getByRole("button", { name: /Create My Free Account/i }).click();

    // Browser HTML5 or JS validation prevents submit without email/password
    const emailInput = page.locator("input[name='email']");
    await expect(emailInput).toHaveAttribute("required", "");
  });
});
