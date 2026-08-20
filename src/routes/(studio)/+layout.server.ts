import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ url }) => ({
  activeNavigation: url.pathname === "/" ? ("home" as const) : null,
});
