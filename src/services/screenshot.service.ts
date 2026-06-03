import { mkdir } from "fs/promises";
import { join } from "path";
import type { CaptureScreenshotResult } from "../schemas/tool-schemas.js";
import { getEnv } from "../config/env.js";
import { isBlockedHost } from "./header.service.js";

export async function captureScreenshot(
  url: string,
  width = 1920,
  height = 1080,
  outputPath?: string
): Promise<CaptureScreenshotResult> {
  const dir = getEnv().SCREENSHOTS_DIR;
  const targetUrl = new URL(url);

  if (isBlockedHost(targetUrl.hostname)) {
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

  const filename = outputPath ?? join(dir, `screenshot-${Date.now()}.png`);

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width, height } });

    await page.goto(targetUrl.toString(), { waitUntil: "networkidle", timeout: 15000 });
    await page.screenshot({ path: filename, fullPage: false });
    await browser.close();

    return { success: true, filePath: filename, dimensions: { width, height } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, filePath: "", dimensions: { width, height }, error: message };
  }
}
