<script module lang="ts">
  import type { AuthDialogView } from "$lib/application/shell/types";

  import type { StudioShellController } from "./controller.svelte";

  import type { Snippet } from "svelte";

  /** Props for the pure, application-agnostic Studio shell surface. */
  export interface StudioShellProps {
    controller: StudioShellController;
    children?: Snippet;
  }
</script>

<script lang="ts">
  import AuthenticationPanel from "./(authentication)/screen.svelte";

  import { getI18nContext } from "@a-novel-kit/nodelib-i18n/svelte";
  import { Avatar, Button, Dialog, IconButton, NavList, SkipLink, Spinner } from "@a-novel-kit/uikit";

  import { CircleAlert, House, LogIn, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "@lucide/svelte";

  let { controller, children }: StudioShellProps = $props();

  const model = $derived(controller.state.model);
  const homeHref = $derived(controller.state.homeHref);
  const accountHref = $derived(controller.state.accountHref);
  const logoutAction = $derived(controller.state.logoutAction);
  const authenticationState = $derived(controller.authentication.state.model.state.status);
  const authActionsVisible = $derived(authenticationState !== "pending-email" && authenticationState !== "success");

  const componentId = $props.id();
  const desktopNavigationId = `${componentId}-desktop-navigation`;
  const drawerId = `${componentId}-navigation-drawer`;
  const authenticationId = `${componentId}-authentication`;
  const compactRail = $derived(model.rail === "collapsed");
  const { t } = getI18nContext();
  const authenticatedSession = $derived(model.session.status === "authenticated" ? model.session : null);
  const authDialogTitle = $derived(getAuthDialogTitle(model.authView));

  function closeDrawerAfterNavigation(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest("a")) controller.navigationDialog.close();
  }

  function submitLogout(event: SubmitEvent) {
    if (!controller.logout()) event.preventDefault();
  }

  function getAuthDialogTitle(view: AuthDialogView | null): string {
    switch (view) {
      case "register":
        return t("shell.auth.register.title");
      case "reset":
        return t("shell.auth.reset.title");
      case "login":
      default:
        return t("shell.auth.login.title");
    }
  }
</script>

{#snippet homeIcon()}<House size="var(--icon-size-sm)" />{/snippet}

{#snippet brand()}
  <span class="brand-name">{t("shell.brand")}</span>
{/snippet}

{#snippet primaryNavigation(onNavigate?: (event: MouseEvent) => void)}
  <nav aria-label={t("shell.navigation")}>
    <NavList
      class="shell-navigation"
      onclick={onNavigate}
      items={[
        {
          href: homeHref,
          label: t("shell.home"),
          current: model.activeNavigation === "home",
          icon: homeIcon,
        },
      ]}
    />
  </nav>
{/snippet}

{#snippet accountWidget(compact: boolean, surface: "rail" | "drawer")}
  <div class="account-widget" data-session={model.session.status}>
    {#if model.session.status === "loading"}
      <div
        class="account-status"
        class:compact
        role="status"
        aria-label={compact ? t("shell.sessionLoading") : undefined}
        title={compact ? t("shell.sessionLoading") : undefined}
      >
        <Spinner label={t("shell.sessionLoading")} size="sm" />
        {#if !compact}<span>{t("shell.sessionLoading")}</span>{/if}
      </div>
    {:else if model.session.status === "error"}
      <div
        id={`${componentId}-${surface}-session-error`}
        class="account-status error"
        class:compact
        role="alert"
        aria-label={compact ? t("shell.sessionUnavailable") : undefined}
        title={compact ? t("shell.sessionUnavailable") : undefined}
      >
        <CircleAlert size="var(--icon-size-sm)" aria-hidden="true" />
        {#if !compact}<span>{t("shell.sessionUnavailable")}</span>{/if}
      </div>
    {:else if authenticatedSession}
      <!-- eslint-disable svelte/no-navigation-without-resolve -- The pure shell receives an app-resolved URL. -->
      <a
        class="account-link"
        class:compact
        href={accountHref}
        aria-label={compact
          ? t("shell.manageAccountFor", { name: authenticatedSession.displayName })
          : authenticatedSession.displayName}
        title={compact ? authenticatedSession.displayName : t("shell.manageAccount")}
      >
        <Avatar label={authenticatedSession.displayName} initials={authenticatedSession.initials} size="sm" />
        {#if !compact}
          <span class="account-name">{authenticatedSession.displayName}</span>
        {/if}
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
      <form class="logout-form" method="POST" action={logoutAction} onsubmit={submitLogout}>
        <Button
          class="shell-account-button {compact ? 'compact-control' : ''}"
          type="submit"
          variant="ghost"
          tone="danger"
          size="sm"
          square={compact}
          aria-label={compact ? t("shell.logout") : undefined}
          title={compact ? t("shell.logout") : undefined}
        >
          <span class="account-action-icon" aria-hidden="true">
            <LogOut size="var(--icon-size-sm)" />
          </span>
          {#if !compact}<span>{t("shell.logout")}</span>{/if}
        </Button>
      </form>
    {:else}
      <Button
        class="shell-account-button {compact ? 'compact-control' : ''}"
        variant="ghost"
        tone="neutral"
        size="sm"
        square={compact}
        aria-label={compact ? t("shell.signIn") : undefined}
        title={compact ? t("shell.signIn") : undefined}
        onclick={() => controller.openAuthentication("login")}
      >
        <span class="account-action-icon" aria-hidden="true">
          <LogIn size="var(--icon-size-sm)" />
        </span>
        <span class="control-label">{t("shell.signIn")}</span>
      </Button>
    {/if}
  </div>
{/snippet}

{#snippet authActions()}
  {#if model.authView === "login"}
    <Button
      class="authentication-secondary-action"
      variant="ghost"
      tone="neutral"
      size="sm"
      onclick={() => controller.openAuthentication("reset")}
    >
      <span class="authentication-secondary-action-label">{t("shell.auth.forgotPassword")}</span>
    </Button>
    <Button
      class="authentication-secondary-action"
      variant="ghost"
      tone="neutral"
      size="sm"
      onclick={() => controller.openAuthentication("register")}
    >
      <span class="authentication-secondary-action-label">{t("shell.auth.createAccount")}</span>
    </Button>
  {:else if model.authView === "register"}
    <Button
      class="authentication-secondary-action"
      variant="ghost"
      tone="neutral"
      size="sm"
      onclick={() => controller.openAuthentication("login")}
    >
      <span class="authentication-secondary-action-label">{t("shell.auth.signInInstead")}</span>
    </Button>
  {:else if model.authView === "reset"}
    <Button
      class="authentication-secondary-action"
      variant="ghost"
      tone="neutral"
      size="sm"
      onclick={() => controller.openAuthentication("login")}
    >
      <span class="authentication-secondary-action-label">{t("shell.auth.backToSignIn")}</span>
    </Button>
  {/if}
{/snippet}

<div class="shell-viewport">
  <SkipLink href="#main-content">{t("shell.skipToContent")}</SkipLink>

  <div class="shell" data-rail={model.rail}>
    <aside class="rail" class:collapsed={compactRail} aria-label={t("shell.navigation")}>
      <div class="rail-header">
        {#if !compactRail}{@render brand()}{/if}
        <IconButton
          label={compactRail ? t("shell.expandNavigation") : t("shell.collapseNavigation")}
          variant="ghost"
          tone="neutral"
          size="sm"
          aria-controls={desktopNavigationId}
          aria-expanded={!compactRail}
          onclick={() => controller.toggleRail()}
        >
          {#if compactRail}
            <PanelLeftOpen size="var(--icon-size-sm)" aria-hidden="true" />
          {:else}
            <PanelLeftClose size="var(--icon-size-sm)" aria-hidden="true" />
          {/if}
        </IconButton>
      </div>

      <div id={desktopNavigationId} class="rail-navigation">
        {@render primaryNavigation()}
      </div>

      <div class="rail-account">
        {@render accountWidget(compactRail, "rail")}
      </div>
    </aside>

    <div class="workspace">
      <header class="mobile-header">
        <IconButton
          label={t("shell.openNavigation")}
          variant="ghost"
          tone="neutral"
          size="sm"
          aria-controls={drawerId}
          aria-expanded={controller.navigationDialog.state.open}
          onclick={() => controller.navigationDialog.open()}
        >
          <Menu size="var(--icon-size-sm)" aria-hidden="true" />
        </IconButton>
        {@render brand()}
      </header>

      <main id="main-content" class="main-content" tabindex="-1">
        {@render children?.()}
      </main>
    </div>
  </div>

  <Dialog
    id={drawerId}
    class="studio-navigation-dialog"
    controller={controller.navigationDialog}
    title={t("shell.navigation")}
    closeOnBackdrop
  >
    <IconButton
      class="navigation-dialog-close"
      label={t("shell.closeNavigation")}
      variant="ghost"
      tone="neutral"
      size="sm"
      onclick={() => controller.navigationDialog.close()}
    >
      <X size="var(--icon-size-sm)" aria-hidden="true" />
    </IconButton>
    <div class="drawer-navigation">{@render primaryNavigation(closeDrawerAfterNavigation)}</div>
    <div class="drawer-account">
      {@render accountWidget(false, "drawer")}
    </div>
  </Dialog>

  <Dialog
    id={authenticationId}
    class="authentication-dialog"
    controller={controller.authenticationDialog}
    title={authDialogTitle}
    actions={authActionsVisible ? authActions : undefined}
    closeOnBackdrop
  >
    {#if model.authView}
      <AuthenticationPanel controller={controller.authentication} />
    {/if}
    <IconButton
      class="authentication-dialog-close"
      label={t("shell.closeAuthentication")}
      variant="ghost"
      tone="neutral"
      size="sm"
      onclick={() => controller.authenticationDialog.close()}
    >
      <X size="var(--icon-size-sm)" aria-hidden="true" />
    </IconButton>
  </Dialog>
</div>

<style>
  .shell-viewport {
    container: studio-shell / inline-size;
    background: var(--color-surface-canvas);
    min-block-size: 100dvb;
    color: var(--color-text-primary);
  }

  .shell {
    --studio-rail-width: clamp(var(--layout-sidebar-min), var(--layout-sidebar), 18rem);

    display: grid;
    grid-template-columns: var(--studio-rail-width) minmax(0, 1fr);
    min-block-size: 100dvb;
  }

  .shell[data-rail="collapsed"] {
    --studio-rail-width: calc(var(--control-height-sm) + var(--space-4));
  }

  .rail {
    display: grid;
    position: sticky;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: var(--space-3);
    z-index: var(--layer-sticky);
    box-sizing: border-box;
    inset-block-start: 0;
    background: var(--color-surface-island-strong);
    padding: var(--space-2);
    inline-size: var(--studio-rail-width);
    block-size: 100dvb;
    overflow: hidden;
  }

  .rail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-1);
    min-inline-size: 0;
  }

  .collapsed .rail-header {
    justify-content: center;
  }

  .brand-name {
    min-inline-size: 0;
    overflow: hidden;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-display);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .account-name {
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rail-navigation {
    min-block-size: 0;
    overflow-y: auto;
    overscroll-behavior-block: contain;
  }

  :global(.shell-navigation) {
    inline-size: 100%;
  }

  :global(.shell-navigation .item) {
    inline-size: 100%;
  }

  .collapsed :global(.shell-navigation .item) {
    justify-content: center;
    padding-inline: 0;
  }

  .collapsed :global(.shell-navigation .label) {
    position: absolute;
    clip-path: inset(50%);
    inline-size: var(--border-width-thin);
    block-size: var(--border-width-thin);
    overflow: hidden;
    white-space: nowrap;
  }

  .rail-account,
  .drawer-account {
    min-inline-size: 0;
  }

  .account-widget {
    display: grid;
    gap: var(--space-2);
    min-inline-size: 0;
  }

  .logout-form {
    margin: 0;
    min-inline-size: 0;
  }

  .account-action-icon {
    display: inline-flex;
    flex: none;
    justify-content: center;
    align-items: center;
    inline-size: var(--icon-size-sm);
  }

  .account-status,
  .account-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: var(--control-height-sm);
  }

  .account-status {
    border: var(--border-width-thin) solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    background: var(--color-surface-island-subtle);
    padding: var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    line-height: var(--line-height-tight);
  }

  .account-status.error {
    border-color: var(--color-feedback-error-border);
    background: var(--color-feedback-error-surface);
    color: var(--color-feedback-error-text);
  }

  .account-status.compact,
  .account-link.compact {
    justify-content: center;
    padding: 0;
    inline-size: var(--control-height-sm);
    block-size: var(--control-height-sm);
  }

  .account-link {
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    padding: var(--space-2);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
    text-decoration: none;
  }

  .account-link:hover {
    background: var(--color-surface-hover);
  }

  .account-link:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-focus-ring);
    outline-offset: var(--focus-ring-offset);
  }

  :global(.shell-account-button) {
    max-inline-size: 100%;
  }

  :global(button.shell-account-button:not(.compact-control)) {
    justify-content: flex-start;
    inline-size: 100%;
    overflow: hidden;
    text-align: start;
  }

  :global(.shell-account-button.compact-control .control-label) {
    position: absolute;
    clip-path: inset(50%);
    inline-size: var(--border-width-thin);
    block-size: var(--border-width-thin);
    overflow: hidden;
    white-space: nowrap;
  }

  .workspace {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    min-inline-size: 0;
    min-block-size: 100dvb;
  }

  .mobile-header {
    display: none;
  }

  .main-content {
    outline: none;
    min-inline-size: 0;
  }

  .main-content:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-focus-ring);
    outline-offset: calc(var(--focus-ring-offset) * -1);
  }

  .drawer-navigation {
    min-block-size: 0;
    overflow-y: auto;
    overscroll-behavior-block: contain;
  }

  .drawer-account {
    margin-block-start: var(--space-2);
  }

  .drawer-navigation :global(.shell-navigation .icon),
  .drawer-account .account-action-icon {
    justify-content: center;
    inline-size: var(--control-height-sm);
  }

  .drawer-account .account-link,
  .drawer-account :global(button.shell-account-button:not(.compact-control)) {
    padding: var(--space-2) var(--space-3);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-compact);
  }

  .rail-account :global(button.shell-account-button.danger:not(.compact-control)),
  .drawer-account :global(button.shell-account-button.danger:not(.compact-control)) {
    --button-foreground: color-mix(in oklab, var(--color-text-primary) var(--color-mix-3), var(--base-pressure));
    --button-foreground-hover: color-mix(in oklab, var(--color-text-primary) var(--color-mix-7), var(--base-pressure));
  }

  .drawer-account .account-link:hover,
  .drawer-account :global(button.shell-account-button:not(.compact-control):hover:not(:disabled)) {
    background: var(--color-navigation-hover-surface);
  }

  :global(.navigation-dialog-close),
  :global(.authentication-dialog-close) {
    z-index: 1;
    inset-block-start: var(--space-3);
    inset-inline-end: var(--space-3);
  }

  :global(.navigation-dialog-close) {
    position: fixed;
  }

  :global(.authentication-dialog-close) {
    position: absolute;
  }

  :global(dialog.authentication-dialog > .panel > header) {
    padding-inline-end: calc(var(--space-5) + var(--control-height-sm));
    padding-block-end: var(--space-2);
  }

  :global(dialog.authentication-dialog > .panel > .content) {
    padding-block: var(--space-3);
  }

  :global(dialog.authentication-dialog > .panel > footer) {
    justify-content: flex-start;
    padding-block-start: var(--space-2);
  }

  :global(.authentication-secondary-action) {
    min-inline-size: 0;
    max-inline-size: 100%;
    white-space: normal;
  }

  .authentication-secondary-action-label {
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  :global(dialog.studio-navigation-dialog.studio-navigation-dialog) {
    margin: 0;
    box-shadow: none;
    border-radius: 0;
    inline-size: 100vi;
    max-inline-size: 100vi;
    block-size: 100dvb;
    max-block-size: 100dvb;
    overflow: hidden;
  }

  :global(dialog.studio-navigation-dialog > .panel) {
    grid-template-rows: auto minmax(0, 1fr);
    inline-size: 100%;
    min-inline-size: 0;
    block-size: 100%;
    min-block-size: 100%;
  }

  :global(dialog.studio-navigation-dialog > .panel > header) {
    padding-inline-end: calc(var(--space-5) + var(--control-height-sm));
  }

  :global(dialog.studio-navigation-dialog > .panel > .content) {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: var(--space-2);
    min-block-size: 0;
    overflow: visible;
  }

  @container studio-shell (max-width: 47.999rem) {
    .shell {
      grid-template-columns: minmax(0, 1fr);
    }

    .rail {
      display: none;
    }

    .workspace {
      grid-template-rows: auto minmax(0, 1fr);
    }

    .mobile-header {
      display: flex;
      position: sticky;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2);
      z-index: var(--layer-sticky);
      inset-block-start: 0;
      background: var(--color-surface-sunken);
      padding: var(--space-2);
    }

    :global(dialog.studio-navigation-dialog > .panel > header) {
      padding: var(--space-3);
      padding-inline-end: calc(var(--space-3) + var(--control-height-sm));
    }

    :global(dialog.studio-navigation-dialog > .panel > .content) {
      padding: var(--space-2);
    }

    :global(dialog.authentication-dialog.authentication-dialog) {
      inline-size: calc(100vi - var(--space-4));
      max-inline-size: calc(100vi - var(--space-4));
      max-block-size: calc(100dvb - var(--space-4));
    }

    :global(dialog.authentication-dialog > .panel) {
      min-inline-size: 0;
    }

    :global(dialog.authentication-dialog > .panel > header) {
      padding-inline: var(--space-4) calc(var(--space-4) + var(--control-height-sm));
      padding-block-start: var(--space-4);
    }

    :global(dialog.authentication-dialog > .panel > .content) {
      padding-inline: var(--space-4);
    }

    :global(dialog.authentication-dialog > .panel > footer) {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-1);
      padding-inline: var(--space-4);
      padding-block-end: var(--space-4);
    }

    :global(dialog.authentication-dialog > .panel > footer > .authentication-secondary-action) {
      justify-content: flex-start;
      padding-inline: var(--space-2);
      inline-size: 100%;
      text-align: start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rail {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .rail,
    .mobile-header {
      border: var(--border-width-thin) solid CanvasText;
    }
  }
</style>
