import { accountDisplayFromHandle } from "#lib/application/shell/account-display.js";
import type { ShellSession } from "#lib/application/shell/types.js";
import { createAuthenticationContext } from "#lib/server/auth/context.js";

import type { RequestEvent } from "@sveltejs/kit";

export const loadStudioShell = async ({ cookies, locals, url }: Pick<RequestEvent, "cookies" | "locals" | "url">) => {
  const activeNavigation = url.pathname === "/" ? ("home" as const) : null;
  const t = locals.i18n.getFixedT(locals.locale, "common");
  let session: ShellSession = { status: "anonymous" };

  const resolved = await Promise.resolve()
    .then(() => createAuthenticationContext(cookies, url).session.current())
    .catch(() => ({ status: "unavailable" as const }));

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
    authorization:
      session.status === "authenticated"
        ? ("allowed" as const)
        : session.status === "error"
          ? ("unavailable" as const)
          : ("anonymous" as const),
  };
};
