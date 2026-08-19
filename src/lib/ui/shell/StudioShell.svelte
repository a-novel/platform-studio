<script module lang="ts">
  import type { AuthDialogView, StudioShellCopy, StudioShellViewModel } from "$lib/application/shell/types";

  import type { Snippet } from "svelte";

  /** Props for the pure, application-agnostic Studio shell surface. */
  export interface StudioShellProps {
    copy: StudioShellCopy;
    model: StudioShellViewModel;
    homeHref?: string;
    children?: Snippet;
    authContent?: Snippet<[AuthDialogView]>;
    onAuthViewChange?: (view: AuthDialogView | null) => void;
    onDrawerOpenChange?: (open: boolean) => void;
    onLogout?: () => void;
    onManageAccount?: () => void;
    onRetrySession?: () => void;
    onToggleRail?: () => void;
  }
</script>

<script lang="ts">
  import {
    ActionMenu,
    type ActionMenuTriggerAttributes,
    Avatar,
    Button,
    Dialog,
    IconButton,
    InlineMessage,
    NavList,
    SkipLink,
    Spinner,
  } from "@a-novel-kit/uikit";

  import {
    ChevronDown,
    CircleAlert,
    House,
    LogIn,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    X,
  } from "@lucide/svelte";

  let {
    copy,
    model,
    homeHref = "/",
    children,
    authContent,
    onAuthViewChange,
    onDrawerOpenChange,
    onLogout,
    onManageAccount,
    onRetrySession,
    onToggleRail,
  }: StudioShellProps = $props();

  const componentId = $props.id();
  const desktopNavigationId = `${componentId}-desktop-navigation`;
  const drawerId = `${componentId}-navigation-drawer`;
  const authenticationId = `${componentId}-authentication`;
  const compactRail = $derived(model.rail === "collapsed");
  const authenticatedSession = $derived(model.session.status === "authenticated" ? model.session : null);
  const authDialogCopy = $derived(model.authView ? copy.auth[model.authView] : copy.auth.login);

  function closeDrawerAfterNavigation(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest("a")) onDrawerOpenChange?.(false);
  }
</script>

{#snippet homeIcon()}<House size="var(--icon-size-sm)" />{/snippet}
{#snippet settingsIcon()}<Settings size="var(--icon-size-sm)" />{/snippet}
{#snippet logoutIcon()}<LogOut size="var(--icon-size-sm)" />{/snippet}

{#snippet brand(compact: boolean)}
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The pure shell receives an app-resolved URL. -->
  <a class="brand-link" class:compact href={homeHref} aria-label={compact ? copy.brand : undefined}>
    <span class="brand-mark" aria-hidden="true">A</span>
    {#if !compact}<span class="brand-name">{copy.brand}</span>{/if}
  </a>
{/snippet}

{#snippet primaryNavigation(onNavigate?: (event: MouseEvent) => void)}
  <nav aria-label={copy.navigation}>
    <NavList
      class="shell-navigation"
      onclick={onNavigate}
      items={[
        {
          href: homeHref,
          label: copy.home,
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
      <Button
        class="shell-account-button {compact ? 'compact-control' : ''}"
        variant="ghost"
        tone="neutral"
        size="sm"
        square={compact}
        disabled
      >
        <Spinner label={copy.sessionLoading} size="sm" />
        <span class="control-label">{copy.sessionLoading}</span>
      </Button>
    {:else if model.session.status === "error"}
      <Button
        class="shell-account-button {compact ? 'compact-control' : ''}"
        variant="ghost"
        tone="neutral"
        size="sm"
        square={compact}
        aria-describedby={compact ? undefined : `${componentId}-${surface}-session-error`}
        aria-label={compact ? `${copy.retrySession}: ${model.session.message}` : undefined}
        title={compact ? model.session.message : undefined}
        onclick={() => onRetrySession?.()}
      >
        <CircleAlert size="var(--icon-size-sm)" aria-hidden="true" />
        <span class="control-label">{copy.retrySession}</span>
      </Button>
      {#if !compact}
        <InlineMessage id={`${componentId}-${surface}-session-error`} tone="error">
          {model.session.message}
        </InlineMessage>
      {/if}
    {:else if authenticatedSession}
      {#snippet accountTrigger(attributes: ActionMenuTriggerAttributes)}
        <Button
          class="shell-account-button account-trigger {compact ? 'compact-control' : ''}"
          variant="ghost"
          tone="neutral"
          size="sm"
          square={compact}
          {...attributes}
        >
          <Avatar label={authenticatedSession.displayName} initials={authenticatedSession.initials} size="sm" />
          {#if !compact}
            <span class="account-name">{authenticatedSession.displayName}</span>
            <ChevronDown class="account-chevron" size="var(--icon-size-sm)" aria-hidden="true" />
          {/if}
        </Button>
      {/snippet}

      <ActionMenu
        label={copy.accountMenu}
        align="start"
        trigger={accountTrigger}
        items={[
          {
            id: "manage-account",
            label: copy.manageAccount,
            icon: settingsIcon,
            onSelect: onManageAccount,
          },
          { id: "account-separator", kind: "separator" },
          {
            id: "logout",
            label: copy.logout,
            tone: "danger",
            icon: logoutIcon,
            onSelect: onLogout,
          },
        ]}
      />
    {:else}
      <Button
        class="shell-account-button {compact ? 'compact-control' : ''}"
        variant="ghost"
        tone="neutral"
        size="sm"
        square={compact}
        aria-label={compact ? copy.signIn : undefined}
        title={compact ? copy.signIn : undefined}
        onclick={() => onAuthViewChange?.("login")}
      >
        <LogIn size="var(--icon-size-sm)" aria-hidden="true" />
        <span class="control-label">{copy.signIn}</span>
      </Button>
    {/if}
  </div>
{/snippet}

{#snippet authActions()}
  <Button variant="ghost" tone="neutral" size="sm" onclick={() => onAuthViewChange?.(null)}>
    {copy.closeAuthentication}
  </Button>
  {#if model.authView === "login"}
    <Button variant="outline" tone="neutral" size="sm" onclick={() => onAuthViewChange?.("reset")}>
      {copy.forgotPassword}
    </Button>
    <Button variant="solid" size="sm" onclick={() => onAuthViewChange?.("register")}>
      {copy.createAccount}
    </Button>
  {:else if model.authView === "register"}
    <Button variant="outline" tone="neutral" size="sm" onclick={() => onAuthViewChange?.("login")}>
      {copy.signInInstead}
    </Button>
  {:else if model.authView === "reset"}
    <Button variant="outline" tone="neutral" size="sm" onclick={() => onAuthViewChange?.("login")}>
      {copy.backToSignIn}
    </Button>
  {/if}
{/snippet}

<div class="shell-viewport">
  <SkipLink href="#main-content">{copy.skipToContent}</SkipLink>

  <div class="shell" data-rail={model.rail}>
    <aside class="rail" class:collapsed={compactRail} aria-label={copy.navigation}>
      <div class="rail-header">
        {@render brand(compactRail)}
        <IconButton
          label={compactRail ? copy.expandNavigation : copy.collapseNavigation}
          variant="ghost"
          tone="neutral"
          size="sm"
          aria-controls={desktopNavigationId}
          aria-expanded={!compactRail}
          onclick={() => onToggleRail?.()}
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
          label={copy.openNavigation}
          variant="ghost"
          tone="neutral"
          size="sm"
          aria-controls={drawerId}
          aria-expanded={model.drawerOpen}
          onclick={() => onDrawerOpenChange?.(true)}
        >
          <Menu size="var(--icon-size-sm)" aria-hidden="true" />
        </IconButton>
        {@render brand(false)}
      </header>

      <main id="main-content" class="main-content" tabindex="-1">
        {@render children?.()}
      </main>
    </div>
  </div>

  <Dialog
    id={drawerId}
    class="studio-navigation-dialog"
    open={model.drawerOpen}
    title={copy.navigation}
    closeOnBackdrop
    onClose={() => onDrawerOpenChange?.(false)}
  >
    <div class="drawer-toolbar">
      <IconButton
        label={copy.closeNavigation}
        variant="ghost"
        tone="neutral"
        size="sm"
        onclick={() => onDrawerOpenChange?.(false)}
      >
        <X size="var(--icon-size-sm)" aria-hidden="true" />
      </IconButton>
    </div>
    <div class="drawer-navigation">{@render primaryNavigation(closeDrawerAfterNavigation)}</div>
    <div class="drawer-account">
      {@render accountWidget(false, "drawer")}
    </div>
  </Dialog>

  <Dialog
    id={authenticationId}
    open={model.authView !== null}
    title={authDialogCopy.title}
    description={authDialogCopy.description}
    actions={authActions}
    closeOnBackdrop
    onClose={() => onAuthViewChange?.(null)}
  >
    {#if model.authView && authContent}
      {@render authContent(model.authView)}
    {:else}
      <div class="auth-placeholder" aria-label={copy.formPlaceholder}>
        <LogIn size="var(--icon-size-lg)" aria-hidden="true" />
        <span>{copy.formPlaceholder}</span>
      </div>
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
    gap: var(--space-3);
    z-index: var(--layer-sticky);
    box-sizing: border-box;
    inset-block-start: 0;
    border-inline-end: var(--border-width-thin) solid var(--color-border-subtle);
    background: var(--color-surface-sunken);
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
    flex-direction: column;
  }

  .brand-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-inline-size: 0;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-display);
    text-decoration: none;
  }

  .brand-link:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-focus-ring);
    outline-offset: var(--focus-ring-offset);
    border-radius: var(--radius-md);
  }

  .brand-mark {
    display: inline-grid;
    flex: none;
    place-items: center;
    border: var(--border-width-thin) solid var(--color-border-selected);
    border-radius: var(--radius-md);
    background: var(--color-surface-selected);
    inline-size: var(--control-height-sm);
    block-size: var(--control-height-sm);
    color: var(--color-text-accent);
    font-family: var(--font-family-display);
  }

  .brand-name,
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

  :global(.shell-account-button) {
    max-inline-size: 100%;
  }

  :global(.shell-account-button:not(.compact-control)) {
    justify-content: flex-start;
    inline-size: 100%;
    overflow: hidden;
  }

  :global(.shell-account-button.compact-control .control-label) {
    position: absolute;
    clip-path: inset(50%);
    inline-size: var(--border-width-thin);
    block-size: var(--border-width-thin);
    overflow: hidden;
    white-space: nowrap;
  }

  :global(.shell-account-button .account-chevron) {
    flex: none;
    margin-inline-start: auto;
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

  .drawer-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-block-end: var(--space-2);
  }

  .drawer-navigation {
    min-block-size: 0;
  }

  .drawer-account {
    margin-block-start: var(--space-6);
    border-block-start: var(--border-width-thin) solid var(--color-border-subtle);
    padding-block-start: var(--space-3);
  }

  .auth-placeholder {
    display: grid;
    place-items: center;
    gap: var(--space-2);
    border: var(--border-width-thin) dashed var(--color-border-default);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
    padding: var(--space-8);
    min-block-size: var(--space-24);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    text-align: center;
  }

  :global(dialog.studio-navigation-dialog.studio-navigation-dialog) {
    margin: 0 auto 0 0;
    border-radius: 0 var(--radius-xl) var(--radius-xl) 0;
    inline-size: 80vi;
    max-inline-size: 80vi;
    block-size: 100dvb;
    max-block-size: 100dvb;
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
      border-block-end: var(--border-width-thin) solid var(--color-border-subtle);
      background: var(--color-surface-sunken);
      padding: var(--space-2);
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
      border-color: CanvasText;
    }

    .brand-mark {
      border-color: CanvasText;
    }
  }
</style>
