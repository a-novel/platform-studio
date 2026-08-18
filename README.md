# Studio platform

The creative workspace for building and managing stories in Agora Storyverse.

[![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/agorastoryverse)](https://twitter.com/agorastoryverse)
[![Discord](https://img.shields.io/discord/1315240114691248138?logo=discord)](https://discord.gg/rp4Qr8cA)

<hr />

![GitHub repo file or directory count](https://img.shields.io/github/directory-file-count/a-novel/platform-studio)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/a-novel/platform-studio)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/a-novel/platform-studio/main.yaml)

## What it does

Studio is the browser application where creators work with the Agora platform. It serves a SvelteKit interface and keeps privileged service access in its server runtime.

The application ships as one OCI image. Storybook provides a separate static review surface for screens and their controlled states.

## Deploying

Set `PLATFORM_STUDIO_VERSION` to a release tag and provide the authentication service URL in the container environment.

```bash
podman run --detach   --name platform-studio   --publish 3000:3000   --env AUTHENTICATION_SERVICE_URL   ghcr.io/a-novel/platform-studio:"$PLATFORM_STUDIO_VERSION"
```

The image runs as a non-root user and listens on port `3000`. Pin deployments to a tag from the [latest release](https://github.com/a-novel/platform-studio/releases/latest).

### Configuration

| Name                         | Required | Description                                                     |
| ---------------------------- | -------- | --------------------------------------------------------------- |
| `AUTHENTICATION_SERVICE_URL` | Yes      | Base HTTP or HTTPS URL for the authentication service.          |
| `HEALTHCHECK_TIMEOUT_MS`     | No       | Downstream timeout from 100 to 10,000 ms. The default is 2,000. |
| `HOST`                       | No       | Listen address. The image sets `0.0.0.0`.                       |
| `PORT`                       | No       | Listen port. The image sets `3000`.                             |

Client-visible configuration is public. Keep private values in the server environment.

## Operational endpoints

| Path           | Success | Purpose                                                                    |
| -------------- | ------- | -------------------------------------------------------------------------- |
| `/ping`        | `200`   | Confirms that the Studio process can serve traffic without a downstream.   |
| `/healthcheck` | `200`   | Reports the sanitized authentication health map. Partial failure is `503`. |

The container probe calls `/ping`. An orchestrator can call `/healthcheck` when downstream readiness matters.

## Localization

English and French messages live under `src/lib/i18n/locales`. The static JSON files are the message source for the runtime, Storybook, extraction, generated key types, and offline validation.

The `i18next-cli` extraction and unused-key checks report source and locale drift.

## Running locally

Configure pnpm for GitHub Packages with a token that can read packages, then install dependencies and start the development server.

```bash
pnpm install
pnpm dev
```

Run `pnpm storybook` to review pure screen states at `http://localhost:6006`.

## Contributing

Start with the [developer onboarding guide](https://github.com/a-novel-kit/.github/blob/master/README.md), then read the [Studio contribution guide](./CONTRIBUTING.md).
