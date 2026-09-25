import { accountDisplayFromHandle } from "$lib/application/shell/account-display";
import type { ShellSession } from "$lib/application/shell/types";
import { createAuthenticationContext } from "$lib/server/auth/context";

import type { RequestEvent } from "@sveltejs/kit";

export const loadStudioShell = async ({ cookies, locals, url }: Pick<RequestEvent, "cookies" | "locals" | "url">) => {
  const activeNavigation = url.pathname === "/" ? ("home" as const) : null;
  const t = locals.i18n.getFixedT(locals.locale, "common");
  let session: ShellSession = { status: "anonymous" };

  const resolved = await createAuthenticationContext(cookies, url).session.current();

  if (resolved.status === "unavailable") {
    session = { status: "error" };
  } else if (resolved.status === "available" && resolved.claims.userID) {
    const account = resolved.identityHandle
      ? accountDisplayFromHandle(resolved.identityHandle)
      : { displayName: t("shell.accountFallback"), initials: "A" };
    session = { status: "authenticated", ...account };
  }

  return {
    activeNavigation,
    session,
  };
};
