# Contributing to platform-studio

This guide covers where Studio code goes, how a screen is built, how product copy is written, and how
changes are tested. Read the [project overview](./README.md) first; the
[developer onboarding guide](https://github.com/a-novel-kit/.github/blob/master/README.md) covers
workspace setup and shared commands.

## Where code goes

A feature spans the runtime layers it needs, and dependencies point inward: routes compose the
layers, client and server code depend on application contracts, and application code stays
framework-free.

| Folder                | Owns                                                  | Never imports                               |
| --------------------- | ----------------------------------------------------- | ------------------------------------------- |
| `src/routes`          | URLs, layouts, loads, form actions, and wiring        |                                             |
| `src/lib/ui`          | Product-specific presentational components            | Environment, services, storage, navigation  |
| `src/lib/application` | Types, state codecs, validation, and use-case logic   | SvelteKit, browser APIs, UI, client, server |
| `src/lib/client`      | Browser adapters for URL state and local storage      | Server code                                 |
| `src/lib/server`      | Sessions, service clients, and private configuration  | Client and UI code                          |
| `src/lib/i18n`        | Locale policy, YAML catalogs, and generated key types |                                             |

Reusable controls belong in UIKit and reusable runtime helpers in nodelib. Studio keeps screen
composition and product behavior.

## Building a screen

Each route keeps two files beside its SvelteKit entrypoints. `screen.svelte` renders state and
reports what the user asked for. `controller.svelte.ts` owns that state and its transitions, with no
DOM, route, storage, or network access. `+page.svelte` only connects them.

Work in that order. Write stories first, one per meaningful state (loading, error, success, long
content, mobile), so the screen can be reviewed in `pnpm storybook` without live services. Then
unit-test the controller, and wire the route last.

Layouts follow three rules:

- Content flows in one column at every width, so reading order matches keyboard order.
- Submit buttons span the form on mobile and fit their label, start-aligned, on desktop. Twice the
  field gap separates them from the last field.
- Errors and confirmations sit directly above the action they concern.

## Server and session rules

The Studio server is the only caller of platform services.

- Forms post to same-origin server actions and work without JavaScript.
- Tokens live in HttpOnly cookies. They never reach browser storage, page data, logs, or stories.
- Email links under `/ext` never echo their code: a GET only parses the link, completion posts to the
  same URL, and the result redirects to a code-free URL.
- Private settings are read on the server only. Anything exposed through `VITE_` ships in the
  browser bundle.
- A service outage keeps the session cookies and shows a recoverable state. Only a rejected token
  logs the user out.

## Writing copy

Every visible string, accessible name, and page title lives in the YAML catalogs under
`src/lib/i18n/locales`. Components call `t()` with a static key at render time, and code passes
stable codes rather than prose.

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
where it leads: a password reset ends on "Log in", because the reset does not open a session.

Both languages use the typographic apostrophe (’) and the ellipsis character (…) on pending labels.
French puts a no-break space before `:` and a narrow no-break space before `?`, `!`, and `;`.

### Checking translations

After any copy change, run `pnpm i18n:extract`, review both languages, then run `pnpm i18n:check`.
The extraction also regenerates the catalog types, which embed the English text, so an edited English
value needs it as much as a new key. CI runs the same checks in the `lint-translations` job, comparing
the branch with its merge base on `master`, and reports every problem in one run:

| Check     | Fails on                                                                                      | Accepted by                     |
| --------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| Structure | Catalogs out of sync with the code, stale generated types, unused keys, translation-only keys | Nothing                         |
| Gaps      | A translation the branch left empty (`""`), which renders the English text                    | `allow-incomplete-translations` |
| Drift     | An English message the branch changed while its translation kept its value                    | `allow-translation-drift`       |

A changed meaning gets a new key: the old translation stops matching, and the new key shows as a gap.
An English-only fix, such as a typo, keeps its key and takes `allow-translation-drift` once the
translation is checked. Adding or removing a label reruns the check, and a push that changes a
catalog removes both labels.

## Testing

| Suite      | Covers                                              | Command               |
| ---------- | --------------------------------------------------- | --------------------- |
| Unit       | Application logic, server modules, controllers      | `pnpm test:unit`      |
| Browser    | Component behavior in Chromium                      | `pnpm test:browser`   |
| Storybook  | Every story's interactions and accessibility checks | `pnpm test:storybook` |
| End to end | Real journeys against disposable services           | `pnpm test:e2e`       |

`a-novel test --type=pnpm -y` runs every suite. CI also runs ESLint, Prettier, svelte-check, the
translation checks, secret scanning, and the workflow audit as separate jobs, so each failure names
its concern.

### End-to-end journeys

The journeys run the production build against disposable authentication, JSON-key, PostgreSQL, and
Mailpit containers, and create accounts from real invitation emails. They also replay the essential
forms with JavaScript disabled. One case stops the authentication container to simulate an outage,
so the suite runs one worker at a time.

```bash
pnpm exec playwright install --with-deps chromium
E2E_CONTAINER_ENGINE=podman pnpm test:e2e
```

Install the browser once. Ports 4173, 14100, and 14825 must be free. With Docker Compose, omit
`E2E_CONTAINER_ENGINE`.

### Screenshot review

The required `test-browser` check compares checkpoint screenshots against the master reference. Its
job summary links a private batch with the HTML report, screenshot diffs, traces, and service logs;
extract it and open `playwright-report` with `pnpm exec playwright show-report`.

Name each checkpoint after its screen with a fixed string. A name derived from copy changes with the
copy, and the comparison then reports a removed screenshot instead of a reviewable diff.

When a visual change is intentional, review the diffs, then have a maintainer with write access apply
the `allow-screenshot-change` label. The label approves the current commit only, so a new commit needs
it removed and reapplied. Functional failures and upload errors stay blocking.

To compare locally, extract `snapshots/` from the reference archive into `.visual/snapshots` and run
the suite in the CI image, since another OS, browser, or font set renders differently:

```bash
PLAYWRIGHT_SNAPSHOT_DIR=.visual/snapshots E2E_CONTAINER_ENGINE=podman pnpm test:e2e --update-snapshots=none
```

Evidence lives under `studio/ci/references` and `studio/ci/results` in the
[**CI - Platform** Shared Drive](https://drive.google.com/drive/folders/0AIAPDK2TwJK7Uk9PVA). The
master reference is kept indefinitely, and each branch keeps its latest batch until it merges or is
deleted. Provisioning follows the
[infrastructure runbook](https://github.com/a-novel/infra/blob/master/docs/runbooks/visual-test-storage.md)
and the [shared adoption guide](https://github.com/a-novel-kit/workflows/blob/master/docs/migrations/v1.33.0.md).

## Questions?

[Open an issue](https://github.com/a-novel/platform-studio/issues) and include the relevant logs and
environment details.
