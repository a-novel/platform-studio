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

Once those states render correctly, add the logic behind a mockable boundary. Unit tests cover the logic, browser tests cover behavior that needs the DOM, and the route or layout supplies the production wiring.

Keep reusable controls in UIKit. Studio owns screen composition and product-specific behavior.

## Working with translations

Messages live in the YAML locale catalogs under `src/lib/i18n/locales`. Call the typed translation function with static keys so extraction can keep source and locale files aligned.

Run `pnpm i18n:extract` after adding or removing messages. Review both languages, then run `pnpm i18n:check` before committing. The check covers extraction drift, generated types, missing translations, and unused translations.

## Reviewing the application

Use Storybook for screen review and the development server for route wiring. The application imports shared fonts and design tokens once in its root layout.

The server runtime reads private configuration. Values exposed through `VITE_` become part of the browser bundle and must be public.

## Questions?

[Open an issue](https://github.com/a-novel/platform-studio/issues) and include the relevant logs and environment details.
