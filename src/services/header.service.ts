import type { Issue } from "../schemas/tool-schemas.js";

export interface HeaderCheckResult {
  status: number | null;
  headers: Record<string, string>;
  iframeAllowed: boolean;
  xFrameOptions?: string;
  cspPolicy?: string;
  mixedContentRisk: boolean;
  authWallDetected: boolean;
  issues: Issue[];
  recommendation: string;
}

function parseCspFrameAncestors(csp: string): boolean {
  const match = csp.match(/frame-ancestors\s+([^;]+)/i);
  if (!match?.[1]) return true;
  const value = match[1].trim();
  return value === "*" || value === "'*'";
}

export async function checkHeaders(url: string): Promise<HeaderCheckResult> {
  const headers: Record<string, string> = {};
  let status: number | null = null;
  let authWallDetected = false;

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    status = res.status;
    res.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });
    if (status === 401 || status === 403) authWallDetected = true;
  } catch {
    return {
      status: null,
      headers: {},
      iframeAllowed: false,
      mixedContentRisk: false,
      authWallDetected: false,
      issues: [{ code: "FETCH_FAILED", severity: "high", description: "Could not reach URL", recommendation: "Verify the URL is publicly accessible" }],
      recommendation: "Verify the URL is publicly accessible and not behind a VPN or firewall.",
    };
  }

  const issues: Issue[] = [];
  const xfo = headers["x-frame-options"] ?? "";
  const csp = headers["content-security-policy"] ?? "";

  let iframeAllowed = true;

  if (xfo) {
    const upper = xfo.toUpperCase();
    if (upper === "DENY" || upper === "SAMEORIGIN") {
      iframeAllowed = false;
      issues.push({ code: "X_FRAME_OPTIONS_BLOCK", severity: "high", description: `X-Frame-Options: ${xfo} blocks iframe embedding`, recommendation: "Ask the site owner to remove or relax this header" });
    }
  }

  if (csp && csp.includes("frame-ancestors")) {
    if (!parseCspFrameAncestors(csp)) {
      iframeAllowed = false;
      issues.push({ code: "CSP_FRAME_ANCESTORS", severity: "high", description: "CSP frame-ancestors restricts embedding", recommendation: "Ask the site owner to add your signage domain to frame-ancestors" });
    }
  }

  const isHttps = url.startsWith("https://");
  const mixedContentRisk = !isHttps;
  if (mixedContentRisk) {
    issues.push({ code: "MIXED_CONTENT", severity: "medium", description: "URL is HTTP — may cause mixed content warnings on HTTPS signage players", recommendation: "Use HTTPS version of the URL" });
  }

  if (!xfo && !csp.includes("frame-ancestors")) {
    issues.push({ code: "NO_FRAME_RESTRICTION", severity: "low", description: "No iframe restriction headers — embedding likely allowed" });
  }

  const recommendation = iframeAllowed
    ? "URL appears safe to embed in a signage player iframe."
    : "URL blocks iframe embedding. Use direct kiosk mode or contact the site owner.";

  const result: HeaderCheckResult = { status, headers, iframeAllowed, mixedContentRisk, authWallDetected, issues, recommendation };
  if (xfo) result.xFrameOptions = xfo;
  if (csp) result.cspPolicy = csp;
  return result;
}
