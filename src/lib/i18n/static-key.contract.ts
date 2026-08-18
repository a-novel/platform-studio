import type { TFunction } from "i18next";

declare const runtimeMessageKey: string;
declare const translate: TFunction<"common">;

// @ts-expect-error Runtime-composed keys are outside the generated resource contract.
translate(runtimeMessageKey);
