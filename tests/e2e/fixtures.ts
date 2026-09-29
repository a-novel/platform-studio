import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import {
  AuthenticationApi,
  Lang,
  credentialsCreate,
  shortCodeCreateRegister,
  tokenCreate,
  tokenCreateAnon,
} from "@a-novel/service-authentication-rest";

import { JSDOM } from "jsdom";
import { test as base, expect } from "playwright/test";
import { z } from "zod";

const api = new AuthenticationApi("http://127.0.0.1:14100");
const password = "Studio-test-password-42!";
const run = promisify(execFile);

/** Controls only the disposable stack owned by this test run. */
export async function compose(...args: string[]) {
  return run(process.env.E2E_CONTAINER_ENGINE ?? "docker", ["compose", "--file", "builds/compose.e2e.yaml", ...args], {
    timeout: 120_000,
  });
}

/** Reads the actual email link and rejects links pointing outside the test application. */
export async function emailLink(email: string, pathname: string): Promise<string> {
  let deliveredLink: string | undefined;
  await expect
    .poll(
      async () => {
        const query = new URLSearchParams({ query: `to:"${email}"`, limit: "10" });
        const response = await fetch(`http://127.0.0.1:14825/api/v1/search?${query}`);
        expect(response.ok).toBe(true);
        const { messages } = z.object({ messages: z.array(z.object({ ID: z.string() })) }).parse(await response.json());
        for (const { ID } of messages) {
          const response = await fetch(`http://127.0.0.1:14825/api/v1/message/${ID}`);
          expect(response.ok).toBe(true);
          const { HTML } = z.object({ HTML: z.string() }).parse(await response.json());
          const dom = new JSDOM(HTML);
          const href = Array.from(dom.window.document.querySelectorAll<HTMLAnchorElement>("a[href]"))
            .map((link) => link.href)
            .find((href) => new URL(href).pathname === pathname);
          dom.window.close();
          if (href) {
            expect(new URL(href).origin).toBe("http://127.0.0.1:4173");
            deliveredLink = href;
            return true;
          }
        }
        return false;
      },
      { timeout: 15_000, message: `Email containing ${pathname} delivered to ${email}` }
    )
    .toBe(true);
  return z.url().parse(deliveredLink);
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
interface Account {
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
    const email = `studio-${randomUUID()}@example.com`;
    await shortCodeCreateRegister(api, administrator, { email, lang: Lang.En });
    await use({ email, link: await emailLink(email, "/ext/account/create") });
  },
  account: async ({ invitation }, use) => {
    await completeInvitation(invitation.email, invitation.link);
    await use({ email: invitation.email, password });
  },
});

export { expect } from "playwright/test";
