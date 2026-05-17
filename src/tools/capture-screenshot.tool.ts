import { captureScreenshot as capture } from "../services/screenshot.service.js";
import type { CaptureScreenshotInput, CaptureScreenshotResult } from "../schemas/tool-schemas.js";

export async function captureScreenshot(input: CaptureScreenshotInput): Promise<CaptureScreenshotResult> {
  return capture(input.url, input.width, input.height, input.outputPath);
}
