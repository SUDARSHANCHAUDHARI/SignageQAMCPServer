import { checkHeaders } from "../services/header.service.js";
import { captureScreenshot } from "../services/screenshot.service.js";
import type { InspectUrlInput, InspectUrlResult } from "../schemas/tool-schemas.js";

export async function inspectUrl(input: InspectUrlInput): Promise<InspectUrlResult> {
  const headerResult = await checkHeaders(input.url);

  const result: InspectUrlResult = {
    url: input.url,
    status: headerResult.status,
    iframeAllowed: headerResult.iframeAllowed,
    authWallDetected: headerResult.authWallDetected,
    issues: headerResult.issues,
    headers: headerResult.headers,
    recommendedAction: headerResult.recommendation,
  };

  if (input.captureScreenshot) {
    const ssResult = await captureScreenshot(input.url);
    if (ssResult.success) result.screenshotPath = ssResult.filePath;
  }

  return result;
}
