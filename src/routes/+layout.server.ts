import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ locals, url }) => {
  const activeNavigation = url.pathname === "/" ? ("home" as const) : null;

  return {
    activeNavigation,
    locale: locals.locale,
  };
};
