import { mkdir } from "fs/promises";
import { join, resolve, sep } from "path";
import type { Browser } from "playwright";
import type { CaptureScreenshotResult } from "../schemas/tool-schemas.js";
import { getEnv } from "../config/env.js";
import { isPublicHost } from "./header.service.js";

export async function captureScreenshot(
  url: string,
  width = 1920,
  height = 1080,
  outputPath?: string
): Promise<CaptureScreenshotResult> {
  const dir = resolve(getEnv().SCREENSHOTS_DIR);
  const targetUrl = new URL(url);

  if (!(await isPublicHost(targetUrl.hostname))) {
    return {
      success: false,
      filePath: "",
      dimensions: { width, height },
      error: "Local or private hostnames are not allowed",
    };
  }

  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // directory may already exist
  }

  // outputPath is caller input: keep it inside SCREENSHOTS_DIR.
  const filename = outputPath ? resolve(dir, outputPath) : join(dir, `screenshot-${Date.now()}.png`);
  if (!filename.startsWith(dir + sep)) {
    return {
      success: false,
      filePath: "",
      dimensions: { width, height },
      error: "outputPath must be inside SCREENSHOTS_DIR",
    };
  }

  let browser: Browser | undefined;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width, height } });

    await page.goto(targetUrl.toString(), { waitUntil: "networkidle", timeout: 15000 });
    await page.screenshot({ path: filename, fullPage: false });

    return { success: true, filePath: filename, dimensions: { width, height } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, filePath: "", dimensions: { width, height }, error: message };
  } finally {
    await browser?.close().catch(() => {});
  }
}
