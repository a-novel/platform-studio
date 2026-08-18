import type { ShellSession } from "$lib/application/shell/types";
import { getAuthUiCopy } from "$lib/i18n/auth-copy";
import { getStudioShellCopy } from "$lib/i18n/shell-copy";
import { createAuthenticationContext } from "$lib/server/auth/context";
import { getAuthFlowCopy } from "$lib/server/auth/messages";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies, locals, url }) => {
  const activeNavigation = url.pathname === "/" ? ("home" as const) : null;
  const standalone = url.pathname.startsWith("/ext/");
  const t = locals.i18n.getFixedT(locals.locale, "common");
  const flowCopy = getAuthFlowCopy(t);
  let session: ShellSession = { status: "anonymous" };

  if (!standalone) {
    const resolved = await createAuthenticationContext(cookies, url).session.current();

    if (resolved.status === "unavailable") {
      session = { status: "error", message: flowCopy.feedback.sessionUnavailable };
    } else if (resolved.status === "available" && resolved.claims.userID) {
      session = {
        status: "authenticated",
        displayName: flowCopy.accountName(resolved.claims.userID),
        initials: "A",
      };
    }
  }

  return {
    activeNavigation,
    authCopy: getAuthUiCopy(t).authentication,
    locale: locals.locale,
    session,
    shellCopy: getStudioShellCopy(t),
    standalone,
  };
};
