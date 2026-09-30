import type { AccountScreenModel, ShortCodeScreenModel } from "$lib/application/auth/types";
import type { StudioShellViewModel } from "$lib/application/shell/types";
import StudioI18nProvider from "$lib/i18n/StudioI18nProvider.svelte";

import ShortCodeStory from "../(standalone)/ext/(short-code)/story.svelte";
import AccountStory from "./account/story.svelte";
import ShellStory from "./story.svelte";

import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { page, userEvent } from "vitest/browser";

import "@a-novel-kit/uikit-fonts/fonts.css";
import "@a-novel-kit/uikit-tokens/tokens.css";

const wrapper = { wrapper: StudioI18nProvider, wrapperProps: { locale: "en" as const } };
const shell: StudioShellViewModel = {
  activeNavigation: "home",
  authView: "login",
  drawerOpen: false,
  rail: "expanded",
  session: { status: "anonymous" },
};

describe("fixed visual review controllers", () => {
  it("keeps the login journey open and ready after dismissal, navigation, and submission", async () => {
    render(ShellStory, { initialModel: shell }, wrapper);
    await page.getByRole("button", { name: "Close dialog" }).click();
    await userEvent.keyboard("{Escape}");
    await page.getByRole("button", { name: "Request an invitation" }).click();
    await expect.element(page.getByRole("dialog", { name: "Login" })).toBeVisible();
    await page.getByRole("textbox", { name: "Email address" }).fill("review@example.test");
    await page.getByLabelText("Password", { exact: false }).fill("long memorable test password");
    await page.getByRole("dialog").getByRole("button", { name: "Login", exact: true }).click();
    await expect.element(page.getByRole("textbox", { name: "Email address" })).toBeEnabled();
    await expect.element(page.getByRole("dialog", { name: "Login" })).toBeVisible();
  });

  it("pins account form states while retaining editable native inputs", async () => {
    const initialModel: AccountScreenModel = {
      claims: { status: "loading" },
      passwordState: { status: "ready" },
      emailState: { status: "ready" },
      logoutState: "ready",
    };
    render(AccountStory, { initialModel }, wrapper);
    const email = page.getByRole("textbox", { name: "New email address" });
    await email.fill("review@example.test");
    const input = email.element() as HTMLInputElement;
    await page.getByRole("button", { name: "Send link", exact: true }).click();
    await expect.element(email).toBeEnabled();
    expect(input.form?.getAttribute("aria-busy")).toBe("false");
  });

  it("pins secure-link completion instead of leaving the review page submitting", async () => {
    const initialModel: ShortCodeScreenModel = { journey: "password-reset", state: { status: "ready" } };
    render(ShortCodeStory, { initialModel }, wrapper);
    await page.getByLabelText(/^New password/).fill("long memorable test password");
    await page.getByLabelText("Confirm new password", { exact: false }).fill("long memorable test password");
    await page.getByRole("button").click();
    await expect.element(page.getByRole("button")).toBeEnabled();
  });
});
