# Studio platform

The creative workspace for building and managing stories in Agora Storyverse.

[![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/agorastoryverse)](https://twitter.com/agorastoryverse)
[![Discord](https://img.shields.io/discord/1315240114691248138?logo=discord)](https://discord.gg/rp4Qr8cA)

<hr />

![GitHub repo file or directory count](https://img.shields.io/github/directory-file-count/a-novel/platform-studio)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/a-novel/platform-studio)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/a-novel/platform-studio/main.yaml)
[![codecov](https://codecov.io/gh/a-novel/platform-studio/graph/badge.svg)](https://codecov.io/gh/a-novel/platform-studio)

![Coverage graph](https://codecov.io/gh/a-novel/platform-studio/graphs/sunburst.svg)

## What it does

Studio is the browser application where creators work with the Agora platform. Its SvelteKit server
renders the pages and is the only caller of the platform services, so session tokens stay in
server-set cookies and never reach browser code.

It ships as one container image. Every screen state is also on display in the
[published Storybook](https://a-novel.github.io/platform-studio/).

## Deploying

Run a tag from the [latest release](https://github.com/a-novel/platform-studio/releases/latest) and
point it at the authentication service.

```bash
podman run --detach --name platform-studio --publish 3000:3000 \
  --env AUTHENTICATION_SERVICE_URL \
  ghcr.io/a-novel/platform-studio:"$PLATFORM_STUDIO_VERSION"
```

The image runs as a non-root user on port `3000`, and its container healthcheck calls `/ping`.

### Configuration

| Name                         | Required | Description                                                        |
| ---------------------------- | -------- | ------------------------------------------------------------------ |
| `AUTHENTICATION_SERVICE_URL` | Yes      | Base HTTP or HTTPS URL for the authentication service.             |
| `HEALTHCHECK_TIMEOUT_MS`     | No       | Downstream timeout from 100 to 10,000 ms. The default is 2,000.    |
| `DOWNTIME_URL`               | No       | Planned downtime document. The default is the one infra publishes. |
| `HOST`                       | No       | Listen address. The image sets `0.0.0.0`.                          |
| `PORT`                       | No       | Listen port. The image sets `3000`.                                |

## Operational endpoints

| Path           | Success | Purpose                                                                                            |
| -------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `/ping`        | `200`   | Liveness: the process serves traffic. No downstream call.                                          |
| `/healthcheck` | `200`   | Readiness: reports each downstream service with its own dependency map. Any failure returns `503`. |

## Running locally

Configure pnpm for GitHub Packages with a token that can read packages, then start the
authentication service and Studio:

```bash
a-novel run start service-authentication/rest
eval "$(a-novel run env service-authentication)"
pnpm install
pnpm dev
```

The committed `.env.local` reads the service port from that environment. `pnpm storybook` serves the
screen catalog at `http://localhost:6006`.

## Contributing

Start with the [developer onboarding guide](https://github.com/a-novel-kit/.github/blob/master/README.md),
then read the [Studio contribution guide](./CONTRIBUTING.md).
