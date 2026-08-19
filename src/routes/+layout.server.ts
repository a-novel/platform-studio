import { loadStudioShell } from "$lib/server/auth/shell-layout";

import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = loadStudioShell;
