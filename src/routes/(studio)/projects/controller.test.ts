import type { StoredProject } from "#lib/client/projects/database.js";

import {
  PROJECTS_PAGE,
  type PicturePreviews,
  type ProjectsControllerOptions,
  type ProjectsModel,
  type SaveResult,
  createProjectsController,
} from "./controller.svelte";
import { harbor, manyProjects, now, projects } from "./projects.fixture";

import { describe, expect, it, vi } from "vitest";

import type { PictureSource, WholePictureFiles } from "@a-novel-kit/uikit";
import { Language } from "@a-novel/service-narrative-engine-rest";

/** A promise the test settles by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((settle, fail) => {
    resolve = settle;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function source(name: string): PictureSource {
  return { url: `blob:${name}`, width: 1600, height: 900 };
}

function fakePictures(): WholePictureFiles & { opened: ReturnType<typeof deferred<PictureSource>>[] } {
  const opened: ReturnType<typeof deferred<PictureSource>>[] = [];
  return {
    opened,
    open: vi.fn(() => {
      const next = deferred<PictureSource>();
      opened.push(next);
      return next.promise;
    }),
    encodeWhole: vi.fn(async () => new Blob(["encoded"], { type: "image/webp" })),
    release: vi.fn(),
  };
}

function fakePreviews(): PicturePreviews {
  let shown = 0;
  return { show: vi.fn(() => `blob:preview-${++shown}`), release: vi.fn() };
}

/** A project as a save returns it. */
const saved: StoredProject = {
  ...harbor,
  updatedAt: new Date("2026-11-08T11:00:00.123Z"),
  logoChecksum: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
};

function projectsController(options: Partial<ProjectsControllerOptions> = {}) {
  const pictures = fakePictures();
  const previews = fakePreviews();
  const submit = vi.fn<(form: FormData) => Promise<SaveResult>>(async () => ({ status: "saved", project: saved }));
  const controller = createProjectsController({
    getModel: () => ({ status: "ready", now, projects }),
    defaultLanguage: Language.Fr,
    retryHref: "/projects",
    initialColumns: 1,
    submit,
    pictures,
    previews,
    ...options,
  });
  return { controller, pictures, previews, submit };
}

const file = new File(["image"], "photo.png", { type: "image/png" });

describe("createProjectsController", () => {
  it("shows the projects a page at a time, until it shows them all", () => {
    const rows = manyProjects(2 * PROJECTS_PAGE + 5);
    const { controller } = projectsController({ getModel: () => ({ status: "ready", now, projects: rows }) });
    expect(controller.state.pages).toEqual([rows.slice(0, PROJECTS_PAGE)]);
    expect(controller.state.more).toBe(true);

    controller.loadMore();
    controller.loadMore();
    controller.loadMore();

    expect(controller.state.pages).toEqual([
      rows.slice(0, PROJECTS_PAGE),
      rows.slice(PROJECTS_PAGE, 2 * PROJECTS_PAGE),
      rows.slice(2 * PROJECTS_PAGE),
    ]);
    expect(controller.state.more).toBe(false);
  });

  it("keeps the pages shown as the browser database changes, and shows none before it is read", () => {
    let model: ProjectsModel = { status: "loading" };
    const { controller } = projectsController({ getModel: () => model });
    expect(controller.state.pages).toEqual([]);
    expect(controller.state.more).toBe(false);

    model = { status: "ready", now, projects: manyProjects(PROJECTS_PAGE + 1) };
    controller.loadMore();
    const rows = manyProjects(PROJECTS_PAGE + 2);
    model = { status: "ready", now, projects: rows };

    expect(controller.state.pages).toEqual([rows.slice(0, PROJECTS_PAGE), rows.slice(PROJECTS_PAGE)]);
  });

  it("opens each new project with no genre and no tag", () => {
    const { controller } = projectsController();

    controller.create();
    controller.genreChips.setValue(["fantasy"]);
    controller.tagInput.add("maps");
    controller.editorDialog.close();
    controller.create();

    expect(controller.genreChips.state.value).toEqual([]);
    expect(controller.tagInput.state.tags).toEqual([]);
  });

  it("opens a new project in the visitor's language, without a logo", () => {
    const { controller } = projectsController();

    controller.create();
    expect(controller.languageSelect.state.value).toBe(Language.Fr);
    expect(controller.state.editor?.logo).toEqual({ status: "empty" });
  });

  it("keeps only the last file chosen, and releases an earlier one that opens late", async () => {
    const { controller, pictures, previews } = projectsController();
    controller.create();

    const first = controller.chooseLogo(file);
    const second = controller.chooseLogo(file);
    pictures.opened[1]?.resolve(source("second"));
    await second;
    pictures.opened[0]?.resolve(source("first"));
    await first;

    expect(pictures.release).toHaveBeenCalledWith(source("first"));
    expect(previews.show).toHaveBeenCalledTimes(1);
    expect(controller.state.editor).toMatchObject({ readingLogo: false, logo: { status: "chosen" } });
  });

  it("marks a file the browser cannot open, until another is chosen", async () => {
    const { controller, pictures } = projectsController();
    controller.create();

    const refused = controller.chooseLogo(file);
    pictures.opened[0]?.reject(new Error("not an image"));
    await refused;
    expect(controller.state.editor).toMatchObject({ readingLogo: false, logoRefusal: "unreadable" });

    void controller.chooseLogo(file);
    expect(controller.state.editor).toMatchObject({ readingLogo: true, logoRefusal: null });
  });

  it("encodes the whole image within the limits and previews it, until it is dropped", async () => {
    const { controller, pictures, previews } = projectsController();
    controller.create();

    const chosen = controller.chooseLogo(file);
    pictures.opened[0]?.resolve(source("logo"));
    await chosen;

    expect(pictures.encodeWhole).toHaveBeenCalledWith(source("logo"), {
      maxWidth: 1024,
      maxHeight: 128,
      maxBytes: 262144,
    });
    expect(pictures.release).toHaveBeenCalledWith(source("logo"));
    expect(controller.state.editor?.logo).toMatchObject({ status: "chosen", src: "blob:preview-1" });

    controller.removeLogo();
    expect(previews.release).toHaveBeenCalledWith("blob:preview-1");
    expect(controller.state.editor?.logo).toEqual({ status: "empty" });
  });

  it("saves the project with its logo, and closes once it saved", async () => {
    const { controller, pictures, submit } = projectsController();
    controller.create();
    const chosen = controller.chooseLogo(file);
    pictures.opened[0]?.resolve(source("logo"));
    await chosen;

    await controller.save(new FormData());

    const form = submit.mock.calls[0]?.[0];
    expect(form?.get("id")).toBeNull();
    expect(form?.get("logo")).toBeInstanceOf(File);
    expect(controller.state.editor).toBeNull();
  });

  it("finishes the project its save created, when its logo is refused", async () => {
    const refused = { status: "logo-refused", project: saved, refusal: "dimensions" } as const;
    const submit = vi.fn(async (_: FormData): Promise<SaveResult> => refused);
    const { controller } = projectsController({ submit });
    controller.create();

    await controller.save(new FormData());
    expect(controller.state.editor).toMatchObject({
      saving: false,
      failure: refused,
      savedID: saved.id,
      logoRefusal: "dimensions",
    });

    // The next save updates that project, and removes a logo that save already stored.
    controller.removeLogo();
    await controller.save(new FormData());
    expect(submit.mock.calls[1]?.[0].get("id")).toBe(saved.id);
    expect(submit.mock.calls[1]?.[0].get("logo-removed")).toBe("true");
  });

  it("keeps the dialog open while a save is under way, and shows its answer", async () => {
    const answer = deferred<SaveResult>();
    const { controller } = projectsController({ submit: () => answer.promise });
    controller.create();

    const saving = controller.save(new FormData());
    expect(controller.state.editor?.saving).toBe(true);
    controller.editorDialog.close();
    expect(controller.state.editor).not.toBeNull();

    answer.resolve({ status: "failed", feedback: "serviceUnavailable" });
    await saving;
    expect(controller.state.editor?.failure).toEqual({ status: "failed", feedback: "serviceUnavailable" });
  });
});
