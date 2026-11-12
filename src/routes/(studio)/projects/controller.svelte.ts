import type { ProjectColumns } from "./columns";
import { LOGO_REMOVED_FIELD } from "./project-form";
import { unseenRows } from "./rows";

import {
  type ChipGroupController,
  type OpenController,
  type PictureLimits,
  type SelectController,
  type TagInputController,
  type WholePictureFiles,
  browserPictureFiles,
  createSelectController,
  createTagInputController,
  createValueController,
} from "@a-novel-kit/uikit";
import { type Language, PROJECT_LOGO_RULES } from "@a-novel/service-narrative-engine-rest";

/** A project as its row shows it. */
export interface ProjectRow {
  id: string;
  title: string;
  premise: string;
  language: Language;
  /** The genres the writer chose, in the order they were saved. */
  genres: string[];
  /** The writer's own labels, in the writer's order. */
  tags: string[];
  createdAt: Date;
  /** When anything in the project last changed. */
  editedAt: Date;
  /** The address of the project's logo, which names its version. Absent until the writer sets one. */
  logo?: string;
}

/** The writer's projects as the page loaded them, or why it could not. */
export type ProjectsModel =
  | {
      status: "ready";
      /** When the server read the projects, which their ages count from. */
      now: Date;
      /** The first page, most recently edited first. */
      projects: ProjectRow[];
      /** How many projects the writer holds in all. */
      total: number;
    }
  | { status: "unavailable" }
  | { status: "rate-limited" };

/** A field of the project dialog. */
export type ProjectField = "title" | "premise" | "language" | "genres" | "tags";

/** A field the narrative engine would refuse, and the rule it breaks. */
export interface ProjectIssue {
  field: ProjectField;
  code: "required" | "tooLong" | "tooMany";
}

/** Why a save did not go through, beside its fields. */
export type SaveFeedback = "projectsFull" | "notFound" | "tooManyAttempts" | "serviceUnavailable";

/** The rule a logo broke: the browser could not read it, or the narrative engine refused it. */
export type LogoRefusal = "unreadable" | "format" | "dimensions" | "tooLarge";

/** What the save action answered. */
export type SaveResult =
  | { status: "saved"; projectID: string }
  | { status: "invalid"; issues: ProjectIssue[] }
  /** A project the save created before it failed is named, so the next save finishes it. */
  | { status: "failed"; feedback: SaveFeedback; projectID?: string }
  | { status: "logo-refused"; projectID: string; refusal: LogoRefusal };

/** The project's logo, as the dialog changes it. */
export type LogoDraft =
  /** No logo yet. */
  | { status: "empty" }
  /** A logo the browser encoded, saved with the project. */
  | { status: "chosen"; file: File; src: string }
  /** A logo a failed save already stored, removed when the project saves. */
  | { status: "removed" };

/** What the narrative engine accepts of a logo, and the widest one worth keeping for a row to show. */
const logoLimits: PictureLimits = { maxWidth: 1024, ...PROJECT_LOGO_RULES };

/** The project dialog's state. */
export interface ProjectEditor {
  /** The project a failed save created, which the next save updates. */
  savedID: string | null;
  logo: LogoDraft;
  /** Whether the browser is still reading the file chosen as the logo. */
  readingLogo: boolean;
  /** The rule the logo broke, shown on its field until another is chosen. */
  logoRefusal: LogoRefusal | null;
  saving: boolean;
  /** The last save's failure, shown until the next save. */
  failure: Exclude<SaveResult, { status: "saved" }> | null;
}

/** State rendered by the projects screen. */
export interface ProjectsControllerState {
  model: ProjectsModel | null;
  /** The open dialog, or null while it is closed. */
  editor: ProjectEditor | null;
  /** Loads the page again, after an outage. */
  retryHref: string;
  /** The columns the writer chose, which a page too narrow for them reduces. */
  columns: ProjectColumns;
  /** The pages of projects shown, the model's own first, each laid out on its own; empty until it is ready. */
  pages: ProjectRow[][];
  /** Whether more projects remain to load, and whether the next page is loading. */
  more: "idle" | "loading" | "done";
}

/** Pure state and transitions consumed by the projects screen. */
export interface ProjectsController {
  readonly state: ProjectsControllerState;
  /** Opens and closes the project dialog. */
  readonly editorDialog: OpenController;
  /** Picks the project's language in the dialog. */
  readonly languageSelect: SelectController<Language>;
  /** Picks the project's genres in the dialog. */
  readonly genreChips: ChipGroupController;
  /** Collects the project's tags in the dialog. */
  readonly tagInput: TagInputController;
  /** Loads the next page of projects, unless one is loading or none remains. */
  loadMore(): Promise<void>;
  /** Lays the projects out in this many columns. */
  setColumns(columns: ProjectColumns): void;
  /** Opens the dialog on a new project. */
  create(): void;
  /** Reads a chosen file as the project's logo, or marks it unreadable. */
  chooseLogo(file: File): Promise<void>;
  /** Drops the chosen logo, and removes one a failed save already stored. */
  removeLogo(): void;
  /** Saves the dialog's fields with the logo, and closes the dialog once they save. */
  save(form: FormData): Promise<void>;
}

/** Configuration for the default projects controller. */
export interface ProjectsControllerOptions {
  /** The page's load data, which each save reloads. */
  getModel: () => ProjectsModel | null;
  /** The language a new project starts in: the visitor's own. */
  defaultLanguage: Language;
  retryHref: string;
  /** The columns the writer last chose. */
  initialColumns: ProjectColumns;
  /** Keeps the columns the writer chooses for the next visit. */
  onColumnsChange?: (columns: ProjectColumns) => void;
  /** Submits the save action, and reloads the page's data once a project saved. */
  submit: (form: FormData) => Promise<SaveResult>;
  /** Fetches the projects after the first `offset`, trying again until it can. Rejects once the page is gone. */
  fetchPage: (offset: number) => Promise<ProjectRow[]>;
  /** Decodes and encodes pictures; the browser's canvas by default. */
  pictures?: WholePictureFiles;
  /** Shows a chosen logo before it saves; the browser's object URLs by default. */
  previews?: PicturePreviews;
}

/** Shows chosen logos before they save. */
export interface PicturePreviews {
  show(file: File): string;
  release(src: string): void;
}

const browserPreviews: PicturePreviews = {
  show: (file) => URL.createObjectURL(file),
  release: (src) => URL.revokeObjectURL(src),
};

/** Creates a reactive controller for the projects screen. */
export function createProjectsController({
  getModel,
  defaultLanguage,
  retryHref,
  initialColumns,
  onColumnsChange,
  submit,
  fetchPage,
  pictures = browserPictureFiles,
  previews = browserPreviews,
}: ProjectsControllerOptions): ProjectsController {
  let editor = $state.raw<ProjectEditor | null>(null);
  let columns = $state(initialColumns);
  // Counts the dialog's openings and the files chosen, so a late answer to an earlier one changes nothing.
  let opening = 0;
  let choice = 0;
  const languageSelect = createSelectController<Language>({ initialValue: defaultLanguage });
  let genreChips = $state(createGenreChips());
  let tagInput = $state(createTagInputController());
  // The pages loaded after the model's own, for the model they follow: a reload starts the list over.
  let loaded = $state.raw<{ model: ProjectsModel; pages: ProjectRow[][]; loading: boolean; exhausted: boolean }>();

  const pages = $derived.by(() => {
    const model = getModel();
    if (model?.status !== "ready") return [];
    return loaded?.model === model ? [model.projects, ...loaded.pages] : [model.projects];
  });
  const shown = $derived(pages.flat());
  const more = $derived.by(() => {
    const model = getModel();
    if (model?.status !== "ready") return "done";
    const own = loaded?.model === model ? loaded : undefined;
    if (own?.loading) return "loading";
    return own?.exhausted || shown.length >= model.total ? "done" : "idle";
  });

  const state = $derived<ProjectsControllerState>({ model: getModel(), editor, retryHref, columns, pages, more });

  async function loadMore() {
    const model = getModel();
    if (model?.status !== "ready" || more !== "idle") return;
    const own = loaded?.model === model ? loaded : { model, pages: [], loading: false, exhausted: false };
    const before = shown;
    loaded = { ...own, loading: true };

    const rows = await fetchPage(before.length).catch(() => null);
    if (!rows || getModel() !== model) return;

    const fresh = unseenRows(before, rows);
    loaded = {
      model,
      pages: fresh.length > 0 ? [...own.pages, fresh] : own.pages,
      loading: false,
      exhausted: rows.length === 0,
    };
  }

  function update(change: Partial<ProjectEditor>) {
    if (editor) editor = { ...editor, ...change };
  }

  function open() {
    close();
    opening += 1;
    languageSelect.select(defaultLanguage);
    genreChips = createGenreChips();
    tagInput = createTagInputController();
    editor = {
      savedID: null,
      logo: { status: "empty" },
      readingLogo: false,
      logoRefusal: null,
      saving: false,
      failure: null,
    };
  }

  function close() {
    if (!editor) return;
    choice += 1;
    releaseLogo(editor.logo);
    editor = null;
  }

  function releaseLogo(logo: LogoDraft) {
    if (logo.status === "chosen") previews.release(logo.src);
  }

  function setLogo(logo: LogoDraft, change: Partial<ProjectEditor>) {
    if (!editor) return;
    releaseLogo(editor.logo);
    update({ ...change, logo });
  }

  async function encodeLogo(file: File): Promise<File> {
    const source = await pictures.open(file);
    try {
      const encoded = await pictures.encodeWhole(source, logoLimits);
      // The field shows the writer's own name for the file.
      return new File([encoded], file.name, { type: encoded.type });
    } finally {
      pictures.release(source);
    }
  }

  async function chooseLogo(file: File) {
    if (!editor || editor.saving) return;
    const chosen = ++choice;
    update({ readingLogo: true, logoRefusal: null });

    try {
      const logo = await encodeLogo(file);
      if (chosen === choice)
        setLogo({ status: "chosen", file: logo, src: previews.show(logo) }, { readingLogo: false });
    } catch {
      if (chosen === choice) update({ readingLogo: false, logoRefusal: "unreadable" });
    }
  }

  return {
    get state() {
      return state;
    },
    editorDialog: {
      get state() {
        return { open: editor !== null };
      },
      open,
      // A save under way finishes before the dialog may close.
      close: () => {
        if (!editor?.saving) close();
      },
      toggle: () => (editor ? close() : open()),
    },
    languageSelect,
    get genreChips() {
      return genreChips;
    },
    get tagInput() {
      return tagInput;
    },
    loadMore,
    setColumns(next) {
      columns = next;
      onColumnsChange?.(next);
    },
    create: open,
    chooseLogo,
    removeLogo() {
      if (!editor || editor.saving) return;
      choice += 1;
      // A logo a failed save already stored goes with the next save; one only chosen just goes.
      setLogo(editor.savedID ? { status: "removed" } : { status: "empty" }, { readingLogo: false, logoRefusal: null });
    },
    async save(form) {
      const current = editor;
      if (!current || current.saving || current.readingLogo) return;
      const opened = opening;

      if (current.savedID) form.set("id", current.savedID);
      if (current.logo.status === "chosen") form.set("logo", current.logo.file);
      if (current.logo.status === "removed") form.set(LOGO_REMOVED_FIELD, "true");
      update({ saving: true, failure: null });

      const result = await submit(form).catch((): SaveResult => ({ status: "failed", feedback: "serviceUnavailable" }));
      if (opened !== opening) return;
      if (result.status === "saved") return close();

      const savedID = "projectID" in result && result.projectID ? result.projectID : (editor?.savedID ?? null);
      const logoRefusal = result.status === "logo-refused" ? result.refusal : (editor?.logoRefusal ?? null);
      update({ saving: false, failure: result, savedID, logoRefusal });
    },
  };
}

function createGenreChips(): ChipGroupController {
  return createValueController<readonly string[]>({ initialValue: [] });
}
