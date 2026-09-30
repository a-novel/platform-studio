import { relative, resolve } from "node:path";

import { type Locator, type Page, type TestInfo, expect } from "playwright/test";

/** Compare declared checkpoints when CI supplies a reference; attach them for local diagnosis otherwise. */
export async function screenshot(page: Page, info: TestInfo, name: string, mask: Locator[] = []) {
  await page.evaluate(() => document.fonts.ready);
  const options = { fullPage: true, mask, animations: "disabled" as const };
  const root = process.env.PLAYWRIGHT_SNAPSHOT_DIR;
  if (!root) {
    await info.attach(name, { body: await page.screenshot(options), contentType: "image/png" });
    return;
  }
  const filename = `${name}.png`;
  info.annotations.push({
    type: "visual-snapshot",
    description: relative(resolve(root), info.snapshotPath(filename, { kind: "screenshot" }))
      .split("\\")
      .join("/"),
  });
  await expect.soft(page).toHaveScreenshot(filename, options);
}
