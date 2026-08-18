<script module lang="ts">
  import english from "../../i18n/locales/en/common.yaml";
  import french from "../../i18n/locales/fr/common.yaml";
  import StudioShellStory from "./StudioShellStory.svelte";
  import { getStudioShellCopy } from "./messages";
  import type { StudioShellViewModel } from "./types";

  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { type TFunction, createInstance } from "i18next";
  import { expect, userEvent, within } from "storybook/test";

  function createTranslator(locale: "en" | "fr", common: Record<string, unknown>): TFunction<"common"> {
    const instance = createInstance();
    void instance.init({
      defaultNS: "common",
      fallbackLng: "en",
      initAsync: false,
      lng: locale,
      ns: ["common"],
      resources: {
        [locale]: { common },
      },
    });

    return instance.getFixedT(locale, "common");
  }

  const englishCopy = getStudioShellCopy(createTranslator("en", english));
  const frenchCopy = getStudioShellCopy(createTranslator("fr", french));

  const anonymous: StudioShellViewModel = {
    activeNavigation: "home",
    authView: null,
    drawerOpen: false,
    rail: "expanded",
    session: { status: "anonymous" },
  };

  const { Story } = defineMeta({
    title: "Shell/Platform shell",
    tags: ["autodocs"],
    parameters: {
      layout: "fullscreen",
      docs: {
        description: {
          component:
            "The pure Studio shell. Every state is driven by a serializable model and callbacks; no story imports routes, sessions, storage, or network clients.",
        },
      },
    },
  });

  function clearFocus() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  async function verifyAnonymousAuthentication({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await expect(canvas.getByRole("dialog", { name: "Sign in" })).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Close authentication" }));
    await expect(canvas.queryByRole("dialog", { name: "Sign in" })).not.toBeInTheDocument();
    clearFocus();
  }

  async function verifyRailToggle({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Expand navigation" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    const collapse = canvas.getByRole("button", { name: "Collapse navigation" });
    await expect(collapse).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(collapse);
    await expect(canvas.getByRole("button", { name: "Expand navigation" })).toHaveAttribute("aria-expanded", "false");
    clearFocus();
  }

  async function verifyAccountMenu({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Account menu" });

    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("menuitem", { name: "Manage account" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await expect(trigger).toHaveFocus();
    clearFocus();
  }

  async function verifyDrawer({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const drawer = canvas.getByRole("dialog", { name: "Studio navigation" });
    await expect(drawer).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Close navigation" }));
    await expect(canvas.queryByRole("dialog", { name: "Studio navigation" })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Open navigation" }));
    await expect(await canvas.findByRole("dialog", { name: "Studio navigation" })).toBeVisible();
  }
</script>

<Story name="Expanded anonymous" asChild play={verifyAnonymousAuthentication}>
  <StudioShellStory copy={englishCopy} initialModel={anonymous} />
</Story>

<Story name="Collapsed anonymous" asChild play={verifyRailToggle}>
  <StudioShellStory copy={englishCopy} initialModel={{ ...anonymous, rail: "collapsed" }} />
</Story>

<Story name="Authenticated" asChild play={verifyAccountMenu}>
  <StudioShellStory
    copy={englishCopy}
    initialModel={{
      ...anonymous,
      session: {
        status: "authenticated",
        displayName: "Maya Chen",
        initials: "MC",
      },
    }}
  />
</Story>

<Story name="Loading account" asChild>
  <StudioShellStory copy={englishCopy} initialModel={{ ...anonymous, session: { status: "loading" } }} />
</Story>

<Story name="Account error" asChild>
  <StudioShellStory
    copy={englishCopy}
    initialModel={{
      ...anonymous,
      session: {
        status: "error",
        message: "Studio could not load the account status.",
      },
    }}
  />
</Story>

<Story name="Login modal" asChild>
  <StudioShellStory copy={englishCopy} initialModel={{ ...anonymous, authView: "login" }} />
</Story>

<Story name="Registration modal" asChild>
  <StudioShellStory copy={englishCopy} initialModel={{ ...anonymous, authView: "register" }} />
</Story>

<Story name="Password reset modal" asChild>
  <StudioShellStory copy={englishCopy} initialModel={{ ...anonymous, authView: "reset" }} />
</Story>

<Story name="Narrow drawer" asChild play={verifyDrawer}>
  <StudioShellStory copy={englishCopy} frameWidth="24rem" initialModel={{ ...anonymous, drawerOpen: true }} />
</Story>

<Story name="French long copy" asChild>
  <StudioShellStory
    copy={frenchCopy}
    initialModel={{
      ...anonymous,
      session: {
        status: "authenticated",
        displayName: "Alexandrine de la Bibliothèque des Mondes Imaginaires",
        initials: "AB",
      },
    }}
  />
</Story>
