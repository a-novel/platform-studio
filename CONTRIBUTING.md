# Contributing to platform-studio

This document is about shaping and verifying Studio changes. Read the [project overview](./README.md) first, and use the [developer onboarding guide](https://github.com/a-novel-kit/.github/blob/master/README.md) for platform setup and shared commands.

## Building a screen

A screen starts as pure UI with its behavior supplied through typed props. Add its Storybook states first so reviewers can inspect empty, loading, error, and populated states without live services.

Once those states render correctly, add the logic behind a mockable boundary. Unit tests cover the logic, browser tests cover behavior that needs the DOM, and the route or layout supplies the production wiring.

Keep reusable controls in UIKit. Studio owns screen composition and product-specific behavior.

## Working with translations

Messages live in the locale JSON files under `src/lib/i18n/locales`. Call the typed translation function with static keys so extraction can keep source and locale files aligned.

Run `pnpm i18n:extract` after adding or removing messages. Review both languages, then run `pnpm i18n:check` before committing. The check covers extraction drift, generated types, missing translations, and unused translations.

## Reviewing the application

Use Storybook for screen review and the development server for route wiring. The application imports shared fonts and design tokens once in its root layout.

The server runtime reads private configuration. Values exposed through `VITE_` become part of the browser bundle and must be public.

## Questions?

[Open an issue](https://github.com/a-novel/platform-studio/issues) and include the relevant logs and environment details.
