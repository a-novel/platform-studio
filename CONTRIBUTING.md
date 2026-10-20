# Contributing to platform-studio

This document is about working on Studio's code, copy and tests. Read the
[project overview](./README.md) first. The [developer guide](https://a-novel-kit.github.io/stack/)
sets up the workspace and its shared commands.

## Where code goes

A feature spans the runtime layers it needs, and dependencies point inward. Routes compose the layers.
Client and server code depend on application contracts. Application code stays framework-free.

| Folder                | Owns                                                                           | Never imports                               |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| `src/routes`          | URLs, layouts, loads, form actions, and wiring                                 |                                             |
| `src/lib/ui`          | Product-specific presentational components                                     | Environment, services, storage, navigation  |
| `src/lib/application` | Types, state codecs, validation, and use-case logic                            | SvelteKit, browser APIs, UI, client, server |
| `src/lib/client`      | Browser adapters, such as local-storage preferences                            | Server code                                 |
| `src/lib/server`      | Sessions, service clients, and private configuration                           | Client and UI code                          |
| `src/lib/i18n`        | Locale policy, YAML catalogs, generated key types, and stable-code translators |                                             |

Inside `src/lib`, a module imports from its own top-level folder, such as `src/lib/server`, by a
relative path, and from any other folder through `#lib/`. Reusable controls belong in UIKit and reusable runtime helpers in nodelib. Studio
keeps screen composition and product behavior.

## Building a screen

A screen keeps its files beside its SvelteKit entrypoints. `screen.svelte` renders state and reports
what the user asked for. `controller.svelte.ts` owns that state and its transitions, with no DOM,
route, storage, or network access. `+page.svelte` only connects them, and `story.svelte` gives the
screen a fixed-state controller for Storybook.

Build the screen first, with one story per meaningful state, such as loading, error, success, long
content and mobile. `pnpm storybook` then shows it without live services. Unit-test the controller
next, and wire the route last.

Each test sits beside the file it covers and takes its name, such as `controller.test.ts` for
`controller.svelte.ts`. Helpers shared between tests live in `*.fixture.ts` modules, which coverage
leaves out.

Layouts follow these rules:

- Content flows in one column at every width, so reading order matches keyboard order.
- Submit buttons span the form on mobile and fit their label, start-aligned, on desktop. Twice the
  field gap separates them from the last field.
- Errors and confirmations sit directly above the action they concern.

## Server and session rules

The Studio server is the only caller of platform services.

- Forms post to same-origin server actions and work without JavaScript.
- Tokens live in HttpOnly cookies. They never reach browser storage, page data, logs, or stories.
- Email links under `/ext` never echo their code. A GET only parses the link, completion posts to the
  same URL, and the result redirects to a code-free URL.
- Configuration is declared in `src/env.ts`. A variable stays server-only unless it is declared
  public. ESLint rejects `import.meta.env`, because Vite inlines every value read through it into the
  browser bundle.
- Pages render user content as text. ESLint rejects `{@html}`.
- A service outage keeps the session cookies and shows a recoverable state. Only a rejected token
  logs the user out.

## Writing copy

Every visible string, accessible name, and page title lives in the YAML catalogs under
`src/lib/i18n/locales`. Components call `t()` with a static key at render time. The rest of the code
passes stable codes, which components translate.

The role of a string sets its grammatical form:

| Role                                                        | Form                     | English                    | French                              |
| ----------------------------------------------------------- | ------------------------ | -------------------------- | ----------------------------------- |
| Text asking the reader to act: instructions, guidance       | Formal imperative        | Choose a new password.     | Choisissez un nouveau mot de passe. |
| Controls: buttons, links, accessible names, task tab titles | Infinitive               | Create account             | Créer le compte                     |
| Names and outcomes: field labels, section titles, results   | Noun phrase or statement | Your password was changed. | Votre mot de passe a été modifié.   |

Formal address uses `vous` in French, and the third-person formal form in languages that have one,
such as `usted` in Spanish. English imperative and infinitive share one form, so a control reads
"Log in", never the noun "Login".

Each concept keeps one term across every screen:

| Concept                      | English         | French                       |
| ---------------------------- | --------------- | ---------------------------- |
| Opening and ending a session | log in, log out | se connecter, se déconnecter |
| A user's address             | email address   | courriel                     |
| The waitlist                 | invitation list | liste d’invitation           |
| A one-time email URL         | link            | lien                         |

Copy promises only what the backend does. When a service hides whether an account exists, the
confirmation stays conditional ("If this email is registered, you’ll receive…"). A link is named for
where it leads. A password reset ends on "Log in", because the reset does not open a session.

Both languages use the typographic apostrophe (’) and the ellipsis character (…) on pending labels.
French puts no space before `:`, and a narrow no-break space before `?`, `!`, and `;`.

### Checking translations

After any copy change, run `pnpm i18n:extract`, review both languages, then run `pnpm i18n:check`.
The extraction also regenerates the catalog types. Those embed the English text, so an edited English
value needs the extraction as much as a new key does. CI runs the same checks in the
`lint-translations` job. The job compares the branch with its merge base on `master` and reports every
problem in one run:

| Check     | Fails on                                                                                      | Accepted by                     |
| --------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| Structure | Catalogs out of sync with the code, stale generated types, unused keys, translation-only keys | Nothing                         |
| Gaps      | A translation the branch left empty (`""`), which renders the English text                    | `allow-incomplete-translations` |
| Drift     | An English message the branch changed while its translation kept its value                    | `allow-translation-drift`       |

A changed meaning gets a new key. The old translation stops matching, and the new key shows as a gap.
An English-only fix, such as a typo, keeps its key and takes `allow-translation-drift` once the
translation is checked. Adding or removing a label reruns the check. Each label approves one commit, so
a push removes both.

## Testing

| Suite      | Covers                                              | Command               |
| ---------- | --------------------------------------------------- | --------------------- |
| Unit       | Application logic, server modules, controllers      | `pnpm test:unit`      |
| Browser    | Component behavior in Chromium                      | `pnpm test:browser`   |
| Storybook  | Every story's interactions and accessibility checks | `pnpm test:storybook` |
| End to end | Real journeys against disposable services           | `pnpm test:e2e`       |

`a-novel test --type=pnpm -y` runs every suite. CI runs each lint and security check as its own job,
so a failure names its concern.

CI runs on pull requests and in the merge queue. Open a draft pull request to check work in progress.
The `with-feature-env` label publishes the pull request's image as
`ghcr.io/a-novel/platform-studio:pr-<number>` for its current commit, and a push removes the label.

### End-to-end journeys

The journeys run the production build against the disposable services of `builds/compose.e2e.yaml`,
and create accounts from real invitation emails. They also replay the essential forms with JavaScript
disabled. One case stops the authentication container to simulate an outage, so the suite runs one
worker at a time.

Install the browser once, then run the suite. It needs ports 4173 to 4175, 4180, 14100, and 14825
free. With Docker Compose, omit `E2E_CONTAINER_ENGINE`.

```bash
pnpm exec playwright install --with-deps chromium
E2E_CONTAINER_ENGINE=podman pnpm test:e2e
```

### Screenshot review

The required `test-browser` check compares checkpoint screenshots against the master reference. Its
job summary links a private batch of the run's evidence, such as the HTML report and the screenshot
diffs. Extract the batch, then open its report:

```bash
pnpm exec playwright show-report playwright-report
```

Evidence lives under `studio/ci/references` and `studio/ci/results` in the
[**CI - Platform** Shared Drive](https://drive.google.com/drive/folders/0AIAPDK2TwJK7Uk9PVA). The
master reference is kept indefinitely, and each branch keeps its latest batch until it merges or is
deleted. Infra provisions the
[CI identities](https://github.com/a-novel/infra/blob/master/docs/architecture.md#identities) that
read and write the evidence, and the
[shared adoption guide](https://github.com/a-novel-kit/workflows/blob/master/docs/migrations/v1.33.0.md)
sets up the folders.

Name each checkpoint after its screen with a fixed string. A name derived from copy changes with the
copy, and the comparison then reports a removed screenshot instead of a reviewable diff.

When a visual change is intentional, review the diffs, then have a maintainer with write access apply
the `allow-screenshot-change` label. The label approves the current commit only, so a push removes it.
Apply it again once the new commit's diffs are reviewed. Functional failures and upload errors stay
blocking.

To compare locally, extract `snapshots/` from the master reference archive into `.visual/snapshots`.
Another OS, browser, or font set renders differently. Run the browser in the Playwright image of the
pinned version, and keep the suite and its services on the host:

```bash
PLAYWRIGHT_VERSION="$(node -p 'require("playwright/package.json").version')"
podman run --detach --rm --name studio-playwright --network host --init \
  --volume "$PWD:$PWD:z" --workdir "$PWD" \
  "mcr.microsoft.com/playwright:v$PLAYWRIGHT_VERSION-noble" \
  node node_modules/playwright/cli.js run-server --port 3123 --host 127.0.0.1
PW_TEST_CONNECT_WS_ENDPOINT=ws://127.0.0.1:3123/ PLAYWRIGHT_SNAPSHOT_DIR=.visual/snapshots \
  E2E_CONTAINER_ENGINE=podman pnpm test:e2e --update-snapshots=none
podman stop studio-playwright
```

## Questions?

[Open an issue](https://github.com/a-novel/platform-studio/issues) and include the relevant logs and
environment details.
