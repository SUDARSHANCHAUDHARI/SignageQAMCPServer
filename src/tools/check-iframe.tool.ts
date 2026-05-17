import { checkHeaders } from "../services/header.service.js";
import type { CheckIframeInput, CheckIframeResult } from "../schemas/tool-schemas.js";

export async function checkIframe(input: CheckIframeInput): Promise<CheckIframeResult> {
  const h = await checkHeaders(input.url);
  const out: CheckIframeResult = {
    url: input.url,
    compatible: h.iframeAllowed,
    reason: h.recommendation,
    mixedContentRisk: h.mixedContentRisk,
    issues: h.issues,
    recommendation: h.recommendation,
  };
  if (h.cspPolicy) out.cspPolicy = h.cspPolicy;
  if (h.xFrameOptions) out.xFrameOptions = h.xFrameOptions;
  return out;
}
