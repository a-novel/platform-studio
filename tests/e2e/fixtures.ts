import { accountCaller, callerFetch } from "./service-token";

import { randomUUID } from "node:crypto";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import { createCompose, emailLink as deliveredLink } from "@a-novel-kit/nodelib-test/playwright";
import {
  AuthenticationApi,
  Lang,
  credentialsCreate,
  shortCodeCreateRegister,
  tokenCreate,
  tokenCreateAnon,
} from "@a-novel/service-authentication-rest";

import { type Page, test as base, expect } from "playwright/test";
import { z } from "zod";

/** The account platform, where Studio signs people in. */
export const accountOrigin = "http://127.0.0.1:14102";

// Only the account platform may create accounts, and only from an invitation.
const api = new AuthenticationApi("http://127.0.0.1:14100", callerFetch(accountCaller));
const password = "Studio-test-password-42!";

/** Controls only the disposable stack owned by this test run. */
export const compose = createCompose();

/** Reads a delivered email's link, which must point at the application under test. */
export function emailLink(email: string, pathname: string): Promise<string> {
  return deliveredLink(email, pathname, { mailpit: "http://127.0.0.1:14825", origin: accountOrigin });
}

async function completeInvitation(email: string, link: string) {
  const anonymous = await tokenCreateAnon(api);
  return credentialsCreate(api, anonymous.accessToken, {
    email,
    password,
    shortCode: z.string().min(1).parse(new URL(link).searchParams.get("shortCode")),
  });
}

interface Invitation {
  email: string;
  link: string;
}
export interface Account {
  email: string;
  password: string;
}

/** Creates unique, real service accounts without repeating browser setup in every journey. */
export const test = base.extend<{ invitation: Invitation; account: Account }, { administrator: string }>({
  administrator: [
    // Playwright requires destructured fixture arguments, even with no dependencies.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const email = "admin@studio.test";
      let token;
      try {
        token = await tokenCreate(api, { email, password });
      } catch (error) {
        if (!isHttpStatusError(error, 401)) throw error;
        token = await completeInvitation(email, await emailLink(email, "/ext/account/create"));
      }
      await use(token.accessToken);
    },
    { scope: "worker" },
  ],
  invitation: async ({ administrator }, use) => {
    // The plus suffix isolates accounts while keeping the displayed handle stable.
    const email = `studio.tester+${randomUUID()}@example.com`;
    await shortCodeCreateRegister(api, administrator, { email, lang: Lang.En });
    await use({ email, link: await emailLink(email, "/ext/account/create") });
  },
  account: async ({ invitation }, use) => {
    await completeInvitation(invitation.email, invitation.link);
    await use({ email: invitation.email, password });
  },
});

export { expect } from "playwright/test";

/** Studio's home, which `/` leads to. A visitor without an account goes from it straight to the login. */
export const home = "/projects";

/** Fills and submits the account platform's login dialog. */
export async function submitLogin(page: Page, account: Account) {
  const dialog = page.getByRole("dialog", { name: "Log in" });
  await dialog.getByLabel(/^Email address/).fill(account.email);
  await dialog.getByLabel(/^Password/).fill(account.password);
  await dialog.getByRole("button", { name: "Log in", exact: true }).click();
}

/** Logs in on the account platform, where a sign-in from Studio lands a visitor signed out there. */
export async function logInOnAccountPlatform(page: Page, account: Account) {
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:14102\/account\?auth=login&returnTo=%2Fauthorize%3F/);
  await submitLogin(page, account);
}

/** Opens Studio's home, which sends the visitor to the account platform's login, and logs in there. */
export async function signIn(page: Page, account: Account) {
  await page.goto(home);
  await logInOnAccountPlatform(page, account);
  await expect(page).toHaveURL(home);
}
