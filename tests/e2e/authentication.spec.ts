import { compose, emailLink, expect, test } from "./fixtures";

import { screenshot } from "@a-novel-kit/nodelib-test/playwright";

import type { Page } from "playwright/test";

async function login(page: Page, account: { email: string; password: string }) {
  await page.getByLabel(/^Email address/).fill(account.email);
  await page.getByLabel(/^Password/).fill(account.password);
  await page.getByRole("dialog").getByRole("button", { name: "Log in", exact: true }).click();
}

/** The account link that names the signed-in visitor: in the rail, or in the menu on a phone. */
async function accountLink(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole("link", { name: "Open navigation", exact: true }).click();
  return page.getByRole("link", { name: "Studio Tester", exact: true });
}

async function authenticationResponds(): Promise<boolean> {
  try {
    return (await fetch("http://127.0.0.1:14100/v2/ping")).ok;
  } catch {
    return false;
  }
}

test("login keeps the session in secure cookies across reloads, and logout revokes it", async ({
  page,
  context,
  account,
  isMobile,
}, info) => {
  await page.goto("/?auth=login");
  await expect(page).toHaveTitle("Log in | Agora Studio");

  await login(page, account);
  await expect(page).toHaveURL("/");
  await expect(page).toHaveTitle("Home | Agora Studio");

  const cookies = (await context.cookies()).filter((cookie) => cookie.name.startsWith("studio_"));
  expect(cookies.map((cookie) => cookie.name)).toEqual(
    expect.arrayContaining(["studio_access_token", "studio_refresh_token"])
  );
  expect(cookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);

  await page.reload();
  // The account page lives on the account platform, which the account name opens.
  await expect(await accountLink(page, isMobile)).toHaveAttribute("href", "https://account.example.test/account");
  await screenshot(page, info, "authenticated-shell");

  await page.getByRole("button", { name: "Log out", exact: true }).last().click();
  await expect(page).toHaveURL("/");
  expect((await context.cookies()).filter((cookie) => cookie.name.startsWith("studio_"))).toEqual([]);

  // Logout revoked the refresh token, so the service refuses to renew the session with it.
  const tokens = Object.fromEntries(cookies.map((cookie) => [cookie.name, cookie.value]));
  const renewal = await fetch("http://127.0.0.1:14100/v2/session", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken: tokens.studio_access_token, refreshToken: tokens.studio_refresh_token }),
  });
  expect(renewal.status).toBe(403);
});

test("a password reset request sends a link to the account platform", async ({ page, account }) => {
  await page.goto("/?auth=reset");
  await expect(page).toHaveTitle("Reset password | Agora Studio");
  await page.getByLabel(/^Email address/).fill(account.email);
  await page.getByRole("button", { name: "Send link", exact: true }).click();
  await expect(page.getByText(account.email, { exact: true })).toBeVisible();
  await expect(page).toHaveTitle("Reset password: Check your inbox | Agora Studio");

  // The authentication service builds the link from its own platform URL, which names the account
  // platform; Studio no longer serves it.
  expect(await emailLink(account.email, "/ext/password/reset")).toContain("/ext/password/reset?");
});

test("dialog history and keyboard dismissal restore the shell focus", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Home | Agora Studio");
  if (isMobile) await page.getByRole("link", { name: "Open navigation", exact: true }).click();

  const trigger = page.getByRole("link", { name: "Log in", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Log in", exact: true })).toBeVisible();
  await expect(page).toHaveTitle("Log in | Agora Studio");
  await expect(page.getByRole("link", { name: "Close dialog" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel(/^Email address/)).toBeFocused();
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(isMobile ? "/?menu=open&auth=reset" : "/?auth=reset");
  await expect(page).toHaveTitle("Reset password | Agora Studio");

  await page.goBack();
  await expect(page).toHaveURL(isMobile ? "/?menu=open" : "/");
  await expect(page).toHaveTitle("Home | Agora Studio");
  await expect(page.getByRole("dialog", { name: /^(Log in|Reset your password)$/ })).toHaveCount(0);

  await page.goForward();
  await expect(page.getByRole("dialog", { name: "Reset your password" })).toBeVisible();
  await expect(page).toHaveTitle("Reset password | Agora Studio");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /^(Log in|Reset your password)$/ })).toHaveCount(0);
  await expect(page).toHaveURL(isMobile ? "/?menu=open" : "/");
  await expect(page).toHaveTitle("Home | Agora Studio");
  await expect(trigger).toBeFocused();

  if (isMobile) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: "Open navigation", exact: true })).toBeFocused();
  }
});

test("navigation controls preserve the rail preference and drawer focus", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("link", { name: "Open navigation", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: "Open navigation", exact: true })).toBeFocused();
    return;
  }

  await page.getByRole("button", { name: "Collapse navigation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Expand navigation", exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Expand navigation", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Expand navigation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Collapse navigation", exact: true })).toBeVisible();
});

test("an authentication outage preserves the session and recovers after reload", async ({
  page,
  context,
  account,
  isMobile,
}, info) => {
  await page.goto("/?auth=login");
  await login(page, account);
  await expect(page).toHaveURL("/");

  const cookies = await context.cookies();
  try {
    await compose("stop", "authentication");
    await page.reload();
    if (isMobile) await page.getByRole("link", { name: "Open navigation", exact: true }).click();
    await expect(
      page.getByText("Account details are unavailable.", { exact: true }).filter({ visible: true })
    ).toBeVisible();
    expect(await context.cookies()).toEqual(cookies);
    await screenshot(page, info, "recoverable-service-outage");
  } finally {
    await compose("start", "authentication");
    await expect.poll(authenticationResponds, { timeout: 30_000 }).toBe(true);
  }

  await page.goto("/");
  await expect(await accountLink(page, isMobile)).toBeVisible();
});

test.describe("native forms without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("shell links open, switch and close usable authentication forms", async ({ page, isMobile }) => {
    await page.goto("/?returnTo=%2Fprivacy");
    if (isMobile) {
      await page.getByRole("link", { name: "Open navigation", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Studio", exact: true })).toBeVisible();
      await page.getByRole("link", { name: "Close navigation", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.getByRole("link", { name: "Open navigation", exact: true }).click();
    }

    await page.getByRole("link", { name: "Log in", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel(/^Email address/)).toBeVisible();

    await dialog.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveTitle("Reset password | Agora Studio");
    await page.getByRole("button", { name: "Send link", exact: true }).click();
    await expect(dialog.getByText("Enter a valid email address.", { exact: true })).toBeVisible();

    await dialog.getByRole("link", { name: "Log in", exact: true }).click();
    await dialog.getByRole("link", { name: "Request an invitation", exact: true }).click();
    await expect(page).toHaveTitle("Join the Agora invitation list | Agora Studio");
    await dialog.getByLabel(/^Email address/).fill("invalid");
    await dialog.getByRole("button", { name: "Join the list", exact: true }).click();
    await expect(dialog.getByText("Enter a valid email address.", { exact: true })).toBeVisible();

    await dialog.getByRole("link", { name: "Close dialog" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).toHaveURL("/?returnTo=%2Fprivacy");
  });

  test("login validates on the server and returns where it started", async ({ page, account }) => {
    await page.goto("/?auth=login&returnTo=%2Fprivacy");
    await expect(page.getByRole("dialog", { name: "Log in", exact: true })).toBeVisible();
    await login(page, { ...account, password: "Incorrect-password-42!" });
    await expect(page.getByText("The email address or password is incorrect.", { exact: true })).toBeVisible();

    await login(page, account);
    await expect(page).toHaveURL("/privacy");
    await expect(page).toHaveTitle("Privacy | Agora Studio");
  });
});
