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
  import { Alert, Avatar, Button, Dialog, IconButton, InlineMessage, NavList, SkipLink } from "@a-novel-kit/uikit";
  import agoraBanner320 from "@a-novel-kit/uikit-images/files/banner/320w/agora-banner.png";
  import agoraBanner640 from "@a-novel-kit/uikit-images/files/banner/640w/agora-banner.png";
  import agoraIcon48 from "@a-novel-kit/uikit-images/files/icon/48x48/agora-icon.png";
  import agoraIcon96 from "@a-novel-kit/uikit-images/files/icon/96x96/agora-icon.png";

  import { House, LogIn, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "@lucide/svelte";

  let { controller, children }: StudioShellProps = $props();

  const model = $derived(controller.state.model);
  const homeHref = $derived(controller.state.homeHref);
  const accountHref = $derived(controller.state.accountHref);
  const logoutAction = $derived(controller.state.logoutAction);
  const authenticationState = $derived(controller.authentication.state.model.state.status);
  const authActionsVisible = $derived(authenticationState !== "pending-email");

  const componentId = $props.id();
  const desktopNavigationId = `${componentId}-desktop-navigation`;
  const drawerId = `${componentId}-navigation-drawer`;
  const authenticationId = `${componentId}-authentication`;
  const compactRail = $derived(model.rail === "collapsed");
  const { t } = getI18nContext();
  const authenticatedSession = $derived(model.session.status === "authenticated" ? model.session : null);
  const authDialogTitle = $derived(
    authenticationState === "pending-email"
      ? t("authUi.authentication.pendingTitle")
      : getAuthDialogTitle(model.authView)
  );
  const authDialogDescription = $derived(
    !authActionsVisible
      ? undefined
      : model.authView === "register"
        ? t("shell.auth.register.description")
        : model.authView === "reset"
          ? t("shell.auth.reset.description")
          : undefined
  );

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

{#snippet accountIcon()}
  {#if authenticatedSession}
    <Avatar label={authenticatedSession.displayName} initials={authenticatedSession.initials} size="sm" />
  {/if}
{/snippet}

{#snippet brand(compact: boolean)}
  <span class="brand" class:compact>
    {#if compact}
      <img
        class="brand-icon"
        src={agoraIcon48}
        srcset={`${agoraIcon48} 1x, ${agoraIcon96} 2x`}
        width="24"
        height="24"
        alt={t("shell.brand")}
      />
    {:else}
      <img
        class="brand-banner"
        src={agoraBanner320}
        srcset={`${agoraBanner320} 1x, ${agoraBanner640} 2x`}
        width="96"
        height="24"
        alt={t("shell.brand")}
      />
    {/if}
  </span>
{/snippet}

{#snippet navigationTitle()}
  {@render brand(false)}
{/snippet}

{#snippet primaryNavigation(compact: boolean, onNavigate?: (event: MouseEvent) => void)}
  <nav aria-label={t("shell.navigation")}>
    <NavList
      {compact}
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

{#snippet accountWidget(compact: boolean)}
  <div class="account-widget" data-session={model.session.status}>
    {#if model.session.status === "loading" || model.session.status === "error"}
      {@const title = model.session.status === "loading" ? t("shell.sessionLoading") : t("shell.sessionUnavailable")}
      {#if compact}
        <div class="compact-status" {title}>
          <InlineMessage tone={model.session.status} aria-label={title} />
        </div>
      {:else}
        <Alert tone={model.session.status} {title} />
      {/if}
    {:else if authenticatedSession}
      <NavList
        {compact}
        title={compact ? authenticatedSession.displayName : t("shell.manageAccount")}
        items={[
          {
            href: accountHref,
            label: compact
              ? t("shell.manageAccountFor", { name: authenticatedSession.displayName })
              : authenticatedSession.displayName,
            icon: accountIcon,
          },
        ]}
      />
      <form class="logout-form" method="POST" action={logoutAction} onsubmit={submitLogout}>
        <Button
          class="shell-account-button {compact ? 'compact-control' : ''}"
          type="submit"
          variant="ghost"
          tone="neutral"
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
        {#if !compact}<span>{t("shell.signIn")}</span>{/if}
      </Button>
    {/if}
  </div>
{/snippet}

{#snippet authActions()}
  {#if model.authView === "login"}
    <Button variant="ghost" tone="neutral" size="sm" onclick={() => controller.openAuthentication("reset")}>
      {t("shell.auth.forgotPassword")}
    </Button>
    <Button variant="ghost" tone="neutral" size="sm" onclick={() => controller.openAuthentication("register")}>
      {t("shell.auth.createAccount")}
    </Button>
  {:else if model.authView === "register"}
    <Button variant="ghost" tone="neutral" size="sm" onclick={() => controller.openAuthentication("login")}>
      {t("shell.auth.signInInstead")}
    </Button>
  {:else if model.authView === "reset"}
    <Button variant="ghost" tone="neutral" size="sm" onclick={() => controller.openAuthentication("login")}>
      {t("shell.auth.backToSignIn")}
    </Button>
  {/if}
{/snippet}

<div class="shell-viewport">
  <SkipLink href="#main-content">{t("shell.skipToContent")}</SkipLink>

  <div class="shell" data-rail={model.rail}>
    <aside class="rail" class:collapsed={compactRail} aria-label={t("shell.navigation")}>
      <div class="rail-header">
        {@render brand(compactRail)}
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
        {@render primaryNavigation(compactRail)}
      </div>

      <div class="rail-account">
        {@render accountWidget(compactRail)}
      </div>
    </aside>

    <div class="workspace">
      <header class="mobile-header">
        {@render brand(false)}
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
      </header>

      <main id="main-content" class="main-content" tabindex="-1">
        {@render children?.()}
      </main>
    </div>
  </div>

  <Dialog id={drawerId} controller={controller.navigationDialog} title={navigationTitle} presentation="fullscreen">
    {#snippet headerActions()}
      <IconButton
        label={t("shell.closeNavigation")}
        variant="ghost"
        tone="neutral"
        size="sm"
        onclick={() => controller.navigationDialog.close()}
      >
        <X size="var(--icon-size-sm)" aria-hidden="true" />
      </IconButton>
    {/snippet}
    <div class="drawer-content">
      <div class="drawer-navigation">{@render primaryNavigation(false, closeDrawerAfterNavigation)}</div>
      <div class="drawer-account">
        {@render accountWidget(false)}
      </div>
    </div>
  </Dialog>

  <Dialog
    id={authenticationId}
    controller={controller.authenticationDialog}
    title={authDialogTitle}
    description={authDialogDescription}
    actions={authActionsVisible ? authActions : undefined}
  >
    {#snippet headerActions()}
      <IconButton
        label={t("shell.closeAuthentication")}
        variant="ghost"
        tone="neutral"
        size="sm"
        onclick={() => controller.authenticationDialog.close()}
      >
        <X size="var(--icon-size-sm)" aria-hidden="true" />
      </IconButton>
    {/snippet}
    {#if model.authView}
      <AuthenticationPanel controller={controller.authentication} />
    {/if}
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
    gap: var(--space-4);
    z-index: var(--layer-sticky);
    box-sizing: border-box;
    inset-block-start: 0;
    padding: var(--space-2);
    inline-size: var(--studio-rail-width);
    block-size: 100dvb;
    overflow: hidden;
  }

  .rail,
  .mobile-header {
    background: var(--color-surface-island-strong);
  }

  .rail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-1);
    min-inline-size: 0;
  }

  .collapsed .rail-header {
    flex-direction: column;
    justify-content: center;
  }

  .brand {
    display: flex;
    align-items: center;
    padding-inline: var(--space-2);
    min-inline-size: 0;
  }

  .brand.compact {
    padding: var(--space-1);
  }

  .brand-banner,
  .brand-icon {
    display: block;
    flex: none;
    object-fit: contain;
  }

  .brand-banner {
    inline-size: calc(var(--control-height-sm) * 3);
    max-inline-size: 100%;
    block-size: var(--control-height-sm);
  }

  .brand-icon {
    inline-size: var(--icon-size-lg);
    block-size: var(--icon-size-lg);
  }

  .rail-navigation {
    min-block-size: 0;
    overflow-y: auto;
    overscroll-behavior-block: contain;
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
    inline-size: var(--control-height-sm);
  }

  .compact-status {
    display: grid;
    place-items: center;
    inline-size: var(--control-height-sm);
    block-size: var(--control-height-sm);
  }

  :global(.shell-account-button) {
    max-inline-size: 100%;
  }

  :global(button.shell-account-button:not(.compact-control)) {
    justify-content: flex-start;
    border: 0;
    padding: var(--space-2) var(--space-3);
    inline-size: 100%;
    overflow: hidden;
    text-align: start;
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

  .drawer-content {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: var(--space-2);
    min-inline-size: 0;
    min-block-size: 0;
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
      padding: var(--space-4);
    }
  }

  @media (forced-colors: active) {
    .rail,
    .mobile-header {
      border: var(--border-width-thin) solid CanvasText;
    }
  }
</style>
