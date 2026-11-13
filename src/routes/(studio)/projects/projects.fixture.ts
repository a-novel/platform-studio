import type {
  LogoDraft,
  ProjectEditor,
  ProjectRow,
  ProjectsController,
  ProjectsControllerState,
} from "./controller.svelte";

import type { SelectController } from "@a-novel-kit/uikit";
import { Language } from "@a-novel/service-narrative-engine-rest";

/** Inlines an SVG as an image address, so stories and tests stay offline. */
function svg(width: number, height: number, body: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`
  )}`;
}

/** A square emblem, as a writer would upload a logo. */
export const lanternLogo = svg(
  128,
  128,
  `<rect width="128" height="128" rx="16" fill="#26315f"/><rect x="49" y="38" width="30" height="50" rx="6" fill="#f4c26b"/>
  <path d="M54 38 Q64 22 74 38" stroke="#f4e6c2" stroke-width="4" fill="none"/>`
);

/** A wordmark wider than tall, as a writer would upload a logo. */
export const wordmarkLogo = svg(
  512,
  128,
  `<text x="0" y="96" font-family="Georgia, serif" font-size="96" fill="#f4e6c2">Salt &amp; Ash</text>`
);

/** When the stories' server read the projects. */
export const now = new Date("2026-11-08T12:00:00Z");

const hour = 3_600_000;
const day = 24 * hour;

export const harbor: ProjectRow = {
  id: "019a5f2e-0000-7000-8000-000000000001",
  title: "Les Heures claires",
  premise: "Marie attend un homme qui ne viendra pas, dans un port où les phares ne s’éteignent jamais.",
  language: Language.Fr,
  genres: ["drama", "historical"],
  tags: ["roman-maritime", "années-50"],
  createdAt: new Date(now.getTime() - 40 * day),
  editedAt: new Date(now.getTime() - 5 * 60_000),
  logo: lanternLogo,
};

export const cartographer: ProjectRow = {
  id: "019a5f2e-0000-7000-8000-000000000002",
  title: "The Cartographer of Unmapped Afternoons and Other Slow Departures",
  premise:
    "A mapmaker who only draws places that no longer exist is hired to chart a town that has not been built yet, and finds her own name already on its streets.",
  language: Language.En,
  genres: ["magicalRealism", "mystery"],
  tags: ["slow-burn"],
  createdAt: new Date(now.getTime() - 9 * day),
  editedAt: new Date(now.getTime() - 3 * hour),
};

const salt: ProjectRow = {
  id: "019a5f2e-0000-7000-8000-000000000003",
  title: "Salt",
  premise: "",
  language: Language.En,
  genres: [],
  tags: [],
  createdAt: new Date(now.getTime() - 400 * day),
  editedAt: new Date(now.getTime() - 2 * day),
  logo: wordmarkLogo,
};

export const notebooks: ProjectRow = {
  id: "019a5f2e-0000-7000-8000-000000000004",
  title: "Carnets du sixième étage",
  premise: "Un immeuble, six étages, une seule nuit de panne.",
  language: Language.Fr,
  genres: ["psychological"],
  tags: ["huis-clos"],
  createdAt: new Date(now.getTime() - 70 * day),
  editedAt: new Date(now.getTime() - 21 * day),
};

/** The writer's projects, most recently edited first. */
export const projects: ProjectRow[] = [harbor, cartographer, salt, notebooks];

/** The most a project can hold: the longest title, a premise past six lines, and every tag at its longest. */
export const longest: ProjectRow = {
  id: "019a5f2e-0000-7000-8000-000000000005",
  title: "A Treatise on the Slow Disappearance of Lighthouses Along the Northern Coastline".slice(0, 80),
  premise: Array.from({ length: 14 }, (_, index) => `Sentence ${index + 1} of a premise that keeps going.`).join(" "),
  language: Language.En,
  genres: [
    "postApocalyptic",
    "alternateHistory",
    "actionAdventure",
    "magicalRealism",
    "scienceFiction",
    "philosophical",
    "psychological",
    "comingOfAge",
    "sliceOfLife",
    "historical",
  ],
  tags: Array.from({ length: 10 }, (_, index) => `${index}-a-tag-at-its-full-size`),
  createdAt: new Date(now.getTime() - 3 * day),
  editedAt: new Date(now.getTime() - 30 * 60_000),
};

/** A logo chosen in the dialog, waiting for the project to save. */
export const chosenLogo: LogoDraft = { status: "chosen", file: new File([], "lantern.png"), src: lanternLogo };

/** The dialog opened on a new project. */
export function newProjectEditor(change: Partial<ProjectEditor> = {}): ProjectEditor {
  return {
    savedID: null,
    logo: { status: "empty" },
    readingLogo: false,
    logoRefusal: null,
    saving: false,
    failure: null,
    ...change,
  };
}

/** A projects controller that renders one fixed state and reports every request to `spy`. */
export function fixedProjectsController(
  state: Partial<ProjectsControllerState>,
  spy: (request: string, ...args: unknown[]) => void = () => {},
  dialog: { genres?: readonly string[]; genreQuery?: string; tags?: readonly string[]; languageOpen?: boolean } = {}
): ProjectsController {
  const languageSelect: SelectController<Language> = {
    state: { open: dialog.languageOpen ?? false, value: Language.En },
    open: () => spy("languageSelect.open"),
    close: () => spy("languageSelect.close"),
    toggle: () => spy("languageSelect.toggle"),
    select: (value) => spy("languageSelect.select", value),
  };

  return {
    state: {
      model: null,
      editor: null,
      retryHref: "/projects",
      columns: 1,
      pages: state.model?.status === "ready" ? [state.model.projects] : [],
      more: "done",
      ...state,
    },
    editorDialog: {
      state: { open: Boolean(state.editor) },
      open: () => spy("editorDialog.open"),
      close: () => spy("editorDialog.close"),
      toggle: () => spy("editorDialog.toggle"),
    },
    languageSelect,
    genreChips: {
      state: { value: dialog.genres ?? [], query: dialog.genreQuery ?? "", open: false },
      setValue: (value) => spy("genreChips.setValue", value),
      setQuery: (query) => spy("genreChips.setQuery", query),
      open: () => spy("genreChips.open"),
      close: () => spy("genreChips.close"),
      toggle: () => spy("genreChips.toggle"),
    },
    tagInput: {
      state: { tags: dialog.tags ?? [] },
      add: (text) => (spy("tagInput.add", text), true),
      remove: (index) => spy("tagInput.remove", index),
    },
    loadMore: async () => spy("loadMore"),
    setColumns: (columns) => spy("setColumns", columns),
    create: () => spy("create"),
    chooseLogo: async (file) => spy("chooseLogo", file),
    removeLogo: () => spy("removeLogo"),
    save: async (form) => spy("save", form),
  };
}
