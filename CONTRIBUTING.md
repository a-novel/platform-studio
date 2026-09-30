# Contributing to platform-studio

This document is about shaping and verifying Studio changes. Read the [project overview](./README.md) first, and use the [developer onboarding guide](https://github.com/a-novel-kit/.github/blob/master/README.md) for platform setup and shared commands.

## Source boundaries

Studio uses feature folders inside explicit runtime layers. Create only the folders a feature needs; for example, authentication can span `ui/auth`, `application/auth`, `client/auth`, and `server/auth` without mixing those responsibilities.

- `src/routes` contains SvelteKit entrypoints and composition only. Browser route files wire UI and client controllers; server route files wire application and server modules.
- `src/lib/ui` contains product-specific, presentational Svelte components, their stories, and rendering tests. UI receives controlled state through typed props and emits interactions; it does not read the environment, call services, persist state, or navigate.
- `src/lib/application` contains framework-independent types, state codecs, and use-case logic. It does not import SvelteKit, browser APIs, UI, client, or server modules.
- `src/lib/client` contains browser-only controllers and adapters for navigation, URL state, and local persistence. It may compose application and UI modules, but never imports server code.
- `src/lib/server` contains private configuration and service-facing adapters. It may use application types, but never imports client or UI code.
- `src/lib/i18n` contains locale policy, static YAML catalogs, generated key types, and request-localization wiring.

Dependencies point inward: routes compose the runtime layers; client and server depend on application contracts; application stays framework-independent. Code that is generic across products belongs in UIKit or nodelib instead of Studio.

## Building a screen

A screen starts as pure UI with its behavior supplied through typed props. Add its Storybook states first so reviewers can inspect empty, loading, error, and populated states without live services.

Prefer a single top-to-bottom flow across screen sizes. Stack independent forms and task sections vertically so visual order follows reading and keyboard order; reserve columns for content that benefits from comparison.

Form submit buttons span the form width on mobile and use their content width, aligned to the start, on desktop. Separate them from the preceding fields with twice the normal field gap, keeping secondary actions distinct.

Once those states render correctly, add the logic behind a mockable boundary. Unit tests cover the logic, browser tests cover behavior that needs the DOM, and the route or layout supplies the production wiring.

Keep reusable controls in UIKit. Studio owns screen composition and product-specific behavior.

## Working with translations

Messages live in the YAML locale catalogs under `src/lib/i18n/locales`. Call the typed translation function with static keys so extraction can keep source and locale files aligned.

For languages with formal and informal address, use the formal form in static text (`vous` in French, `usted` in Spanish). Use the language’s conventional action-label form for buttons, links, and other controls; French uses infinitives such as `Créer le compte`.

Run `pnpm i18n:extract` after adding or removing messages. Review both languages, then run `pnpm i18n:check` before committing. The check covers extraction drift, generated types, missing translations, and unused translations.

## Reviewing the application

Use Storybook for screen review and the development server for route wiring. The application imports shared fonts and design tokens once in its root layout.

The server runtime reads private configuration. Values exposed through `VITE_` become part of the browser bundle and must be public.

## Browser integration tests

The browser journeys run against the production Studio build and disposable authentication,
JSON-key, PostgreSQL and Mailpit containers. They create accounts from real invitation emails.
Run them with the dedicated test stack; the outage case stops and restarts its authentication
container, so the suite runs one worker at a time.

```bash
E2E_CONTAINER_ENGINE=podman a-novel test --type=pnpm -y
```

Playwright starts the isolated services, waits for readiness, and removes their containers and data
afterward. For a focused run, use `E2E_CONTAINER_ENGINE=podman pnpm test:e2e`. Install the pinned browser once with `pnpm exec playwright install --with-deps chromium`. Ports 4173, 14100
and 14825 must be free. With Docker Compose, use `docker` and omit `E2E_CONTAINER_ENGINE`.

Actions runs these journeys in the required `test-browser` check. With Drive configured, the job
summary links a private batch containing the HTML report, screenshot diffs, traces and service logs.
Download and extract it, then open `playwright-report` with `pnpm exec playwright show-report`.
The latest successful master reference is retained indefinitely; each live branch keeps one completed
batch, removed after merge or deletion. Codecov continues reporting unit/component coverage as an
advisory check using small GitHub artifacts. Until Drive activation, `studio-browser-report` remains
a seven-day GitHub artifact.

Screenshot checkpoints use native Playwright comparisons in CI. Review an intentional change's diff,
then apply `allow-screenshot-change` to the PR; only a human with repository write access can approve.
The label approves the current commit and reruns CI. New commits require removing and reapplying it
after review. Functional failures, capture failures and upload errors remain blocking. Approved runs
also retain their original diff report in `.visual/comparison-report` inside the private archive.

Local runs attach checkpoint screenshots for diagnosis. To compare locally, extract `snapshots/`
from the current reference archive into `.visual/snapshots`, then run
`PLAYWRIGHT_SNAPSHOT_DIR=.visual/snapshots E2E_CONTAINER_ENGINE=podman pnpm test:e2e --update-snapshots=none`.
Compare using the same Ubuntu/Chromium/font environment as CI to avoid rendering differences.
Account identifiers and expiry timestamps are masked; roles, labels, forms and layout stay visible.

Studio stores evidence under `studio/ci/references` and `studio/ci/results` in Agorastoryverse's
dedicated **CI - Platform** Shared Drive. Shared actions own folder-scoped storage, approval and cleanup; other
platforms reuse those actions with their own folders and the same `VISUAL_*` repository variable names.
Provision and activate them using the
[infrastructure runbook](https://github.com/a-novel/infra/blob/master/docs/runbooks/visual-test-storage.md)
and [shared adoption guide](https://github.com/a-novel-kit/workflows/blob/master/docs/migrations/v1.33.0.md).

The no-JavaScript cases cover standalone invitation and account forms. The login dialog currently
requires hydration; see [the tracked fallback issue](https://github.com/a-novel/platform-studio/issues/82).

## Questions?

[Open an issue](https://github.com/a-novel/platform-studio/issues) and include the relevant logs and environment details.
