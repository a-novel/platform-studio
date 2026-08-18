import type { ShortCodeJourney, ShortCodeScreenModel, ShortCodeState } from "$lib/application/auth/types";

import { type AuthValidationMessages, parseShortCodeLink, validateNewPassword } from "./forms";

import { isHttpStatusError } from "@a-novel-kit/nodelib-browser/http";
import {
  AuthenticationApi,
  type Token,
  credentialsCreate,
  credentialsResetPassword,
  credentialsUpdateEmail,
} from "@a-novel/service-authentication-rest";

export interface ShortCodeClient {
  register(accessToken: string, input: { email: string; password: string; shortCode: string }): Promise<Token>;
  resetPassword(accessToken: string, input: { password: string; shortCode: string; userID: string }): Promise<void>;
  updateEmail(accessToken: string, input: { shortCode: string; userID: string }): Promise<void>;
}

export interface ShortCodeCompletionContext {
  accept(token: Token): void;
  accessToken(): Promise<string>;
  client: ShortCodeClient;
}

export type ShortCodeCompletionOutcome = "success" | "invalid" | "validation-error" | "service-error";

export interface ShortCodeCompletionResult {
  model: ShortCodeScreenModel;
  outcome: ShortCodeCompletionOutcome;
}

export function createShortCodeClient(api: AuthenticationApi): ShortCodeClient {
  return {
    register: async (accessToken, input) => await credentialsCreate(api, accessToken, input),
    resetPassword: async (accessToken, input) => {
      await credentialsResetPassword(api, accessToken, input);
    },
    updateEmail: async (accessToken, input) => {
      await credentialsUpdateEmail(api, accessToken, input);
    },
  };
}

export function readShortCodeModel(journey: ShortCodeJourney, url: URL, successMessage: string): ShortCodeScreenModel {
  const result = url.searchParams.getAll("result");

  if (result.length === 1 && result[0] === "success") {
    return screenModel(journey, { status: "success", message: successMessage });
  }
  if (result.length === 1 && result[0] === "invalid") {
    return screenModel(journey, { status: "invalid" });
  }

  const parsed = parseShortCodeLink(journey, url);
  if (parsed.status !== "ready") {
    return screenModel(journey, { status: parsed.status });
  }

  return screenModel(journey, { status: "ready" }, "targetHint" in parsed ? parsed.targetHint : undefined);
}

export async function completeShortCode(
  journey: ShortCodeJourney,
  url: URL,
  form: FormData,
  messages: AuthValidationMessages,
  serviceErrorMessage: string,
  successMessage: string,
  context: ShortCodeCompletionContext
): Promise<ShortCodeCompletionResult> {
  const parsed = parseShortCodeLink(journey, url);
  if (parsed.status !== "ready") {
    return {
      outcome: "invalid",
      model: screenModel(journey, { status: "invalid" }),
    };
  }

  const hint = "targetHint" in parsed ? parsed.targetHint : undefined;
  let operation: (accessToken: string) => Promise<void>;

  if (parsed.journey === "email-update") {
    operation = async (accessToken) => {
      await context.client.updateEmail(accessToken, {
        shortCode: parsed.shortCode,
        userID: parsed.userId,
      });
    };
  } else {
    const validation = validateNewPassword(form, messages);
    if (!validation.success) {
      return {
        outcome: "validation-error",
        model: screenModel(journey, { status: "validation-error", issues: validation.issues }, hint),
      };
    }

    const password = validation.value.password;
    if (parsed.journey === "register") {
      operation = async (accessToken) => {
        const token = await context.client.register(accessToken, {
          email: parsed.email,
          password,
          shortCode: parsed.shortCode,
        });
        context.accept(token);
      };
    } else {
      operation = async (accessToken) => {
        await context.client.resetPassword(accessToken, {
          password,
          shortCode: parsed.shortCode,
          userID: parsed.userId,
        });
      };
    }
  }

  try {
    await operation(await context.accessToken());
  } catch (error) {
    if (isHttpStatusError(error, 403, 404, 409)) {
      return {
        outcome: "invalid",
        model: screenModel(journey, { status: "invalid" }),
      };
    }

    return {
      outcome: "service-error",
      model: screenModel(journey, { status: "service-error", message: serviceErrorMessage }, hint),
    };
  }

  return {
    outcome: "success",
    model: screenModel(journey, { status: "success", message: successMessage }, hint),
  };
}

function screenModel(journey: ShortCodeJourney, state: ShortCodeState, targetHint?: string): ShortCodeScreenModel {
  return targetHint ? { journey, state, targetHint } : { journey, state };
}
