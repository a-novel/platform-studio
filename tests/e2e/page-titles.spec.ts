import { expect, test } from "./fixtures";

const locales = [
  {
    locale: "en-US",
    routes: [
      ["/", "Home"],
      ["/?auth=login", "Login"],
      ["/?auth=register", "Join the Agora invitation list"],
      ["/?auth=reset", "Reset password"],
      ["/account", "Login"],
      ["/?auth=unknown&email=private@example.test", "Home"],
      ["/ext/account/create", "Create account: Incomplete link"],
      ["/ext/password/reset", "Reset password: Incomplete link"],
      ["/ext/email/validate", "Confirm email: Incomplete link"],
      ["/ext/password/reset?result=invalid", "Reset password: Invalid link"],
      ["/page-that-does-not-exist", "Page not found"],
    ],
  },
  {
    locale: "fr-FR",
    routes: [
      ["/", "Accueil"],
      ["/?auth=login", "Connexion"],
      ["/?auth=register", "Rejoignez la liste d’invitation Agora"],
      ["/?auth=reset", "Réinitialiser le mot de passe"],
      ["/account", "Connexion"],
      ["/?auth=unknown&email=private@example.test", "Accueil"],
      ["/ext/account/create", "Créer un compte : Lien incomplet"],
      ["/ext/password/reset", "Réinitialiser le mot de passe : Lien incomplet"],
      ["/ext/email/validate", "Confirmer le courriel : Lien incomplet"],
      ["/ext/password/reset?result=invalid", "Réinitialiser le mot de passe : Lien invalide"],
      ["/page-that-does-not-exist", "Page introuvable"],
    ],
  },
] as const;

for (const { locale, routes } of locales) {
  for (const javaScriptEnabled of [true, false]) {
    test.describe(`${locale}, JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
      test.use({ locale, javaScriptEnabled });

      test("page titles identify each route and authentication task", async ({ page }, info) => {
        for (const [route, title] of routes) {
          await test.step(route, async () => {
            const response = await page.goto(route);
            await expect(page).toHaveTitle(`${title} — Agora Studio`);
            await expect(page.locator("head > title")).toHaveCount(1);
            if (route === "/page-that-does-not-exist") expect(response?.status()).toBe(404);
            if (
              locale === "en-US" &&
              javaScriptEnabled &&
              ["/", "/?auth=login", "/?auth=register", "/?auth=reset"].includes(route)
            ) {
              if (route !== "/") await expect(page.getByRole("dialog")).toBeVisible();
              await info.attach(title, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
            }
          });
        }
      });
    });
  }
}
