<p align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://raw.githubusercontent.com/a-novel-kit/ui-assets/master/packages/images/files/banner/960h/studio-banner.png"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://raw.githubusercontent.com/a-novel-kit/ui-assets/master/packages/images/files/banner/960h/studio-banner-light.png"
    />
    <img
      alt="Studio"
      src="https://raw.githubusercontent.com/a-novel-kit/ui-assets/master/packages/images/files/banner/960h/studio-banner-light.png"
      width="1010"
    />
  </picture>
</p>

# Studio platform

The creative workspace for building and managing stories in Agora.

[![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/agorastoryverse)](https://twitter.com/agorastoryverse)
[![Discord](https://img.shields.io/discord/1315240114691248138?logo=discord)](https://discord.gg/rp4Qr8cA)

<hr />

![GitHub repo file or directory count](https://img.shields.io/github/directory-file-count/a-novel/platform-studio)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/a-novel/platform-studio)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/a-novel/platform-studio/main.yaml)
[![codecov](https://codecov.io/gh/a-novel/platform-studio/graph/badge.svg)](https://codecov.io/gh/a-novel/platform-studio)

![Coverage graph](https://codecov.io/gh/a-novel/platform-studio/graphs/sunburst.svg)

## What it does

Studio is Agora's browser application for creators. Its SvelteKit server renders the pages and is
the only caller of the platform services. Session tokens stay in server-set cookies and never reach
browser code.

Studio ships as one container image. The [published Storybook](https://a-novel.github.io/platform-studio/)
shows every screen state.

## Deploying

Run a tag from the [latest release](https://github.com/a-novel/platform-studio/releases/latest) and
point it at the authentication service. The image runs as a non-root user on port `3000`, and its
container healthcheck calls `/ping`.

```bash
PLATFORM_STUDIO_VERSION="vX.Y.Z"
AUTHENTICATION_SERVICE_URL="https://authentication.example.com"
podman run --detach --name platform-studio --publish 3000:3000 \
  --env AUTHENTICATION_SERVICE_URL="$AUTHENTICATION_SERVICE_URL" \
  ghcr.io/a-novel/platform-studio:"$PLATFORM_STUDIO_VERSION"
```

### Configuration

| Name                              | Required       | Description                                                                                                          |
| --------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `AUTHENTICATION_SERVICE_URL`      | Yes            | Base HTTP or HTTPS URL for the authentication service.                                                               |
| `AUTHENTICATION_SERVICE_AUDIENCE` | Cloud Run      | Audience of the Google ID token the authentication service's IAM admits. Studio fetches it from the metadata server. |
| `SERVICE_TOKEN_PATH`              | Kubernetes     | File of the projected service token, sent instead of a Google ID token. Studio reads it on every call.               |
| `ADDRESS_HEADER`, `XFF_DEPTH`     | Behind a proxy | Where the visitor's IP is read, which Studio forwards for rate limiting. On Cloud Run, `X-Forwarded-For` and `1`.    |
| `HEALTHCHECK_TIMEOUT_MS`          | No             | Downstream timeout from 100 to 10,000 ms. The default is 2,000.                                                      |
| `DOWNTIME_URL`                    | No             | Planned downtime document. The default is the one infra publishes.                                                   |
| `OTEL`                            | No             | `true` records traces, continuing an incoming `traceparent`.                                                         |
| `OTEL_EXPORTER_OTLP_ENDPOINT`     | No             | Exports traces over OTLP/HTTP to this base URL instead of stdout.                                                    |
| `OTEL_EXPORTER_OTLP_HEADERS`      | No             | Headers each export sends, such as the backend's key. Inject it as a secret.                                         |
| `OTEL_EXPORTER_OTLP_COMPRESSION`  | No             | `gzip` compresses each export.                                                                                       |
| `HOST`                            | No             | Listen address. The image sets `0.0.0.0`.                                                                            |
| `PORT`                            | No             | Listen port. The image sets `3000`.                                                                                  |

## Operational endpoints

| Path           | Success | Purpose                                                                                            |
| -------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `/ping`        | `200`   | Liveness: the process serves traffic. No downstream call.                                          |
| `/healthcheck` | `200`   | Readiness: reports each downstream service with its own dependency map. Any failure returns `503`. |

## Running locally

Installing Studio's packages needs your
[GitHub Packages token](https://a-novel-kit.github.io/stack/dependencies/node#configure). Start the
authentication service, then Studio:

```bash
a-novel run start service-authentication/rest
eval "$(a-novel run env service-authentication)"
pnpm install
pnpm dev
```

The committed `.env.local` reads the service port from that environment. `pnpm storybook` serves the
screen catalog at `http://localhost:6006`.

## Contributing

Start with the [developer guide](https://a-novel-kit.github.io/stack/),
then read the [Studio contribution guide](./CONTRIBUTING.md).
