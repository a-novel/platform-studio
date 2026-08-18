import { pathToFileURL } from "node:url";

import { loadEnv } from "vite";

const viteModes = ["development", "production", "test"];
const secretSegment =
  /(?:^|_)(?:ACCESS_KEY|API_KEY|CREDENTIAL|PASSWORD|PASSPHRASE|PRIVATE_KEY|SECRET|SIGNING_KEY|TOKEN)(?:_|$)/i;

export function findSecretShapedClientVariables(environment) {
  return Object.keys(environment)
    .filter((name) => name.startsWith("VITE_") && secretSegment.test(name.slice("VITE_".length)))
    .sort();
}

export function loadClientEnvironment(directory = process.cwd(), environment = process.env) {
  const fileEnvironment = Object.assign({}, ...viteModes.map((mode) => loadEnv(mode, directory, "VITE_")));

  return { ...fileEnvironment, ...environment };
}

export function checkClientEnvironment(environment) {
  const unsafeNames = findSecretShapedClientVariables(environment);
  if (unsafeNames.length === 0) {
    return;
  }

  throw new Error(`Secret-shaped client environment variables are forbidden: ${unsafeNames.join(", ")}`);
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  try {
    checkClientEnvironment(loadClientEnvironment());
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Client environment validation failed");
    process.exitCode = 1;
  }
}
