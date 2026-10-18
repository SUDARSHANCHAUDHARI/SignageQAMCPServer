import { lookup } from "dns/promises";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import type { LookupFunction } from "net";
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

const MAX_REDIRECTS = 5;

function isPrivateIp(ip: string): boolean {
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127);
  }
  if (!ip.includes(":")) return false;
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6)) return true;
  // IPv4-mapped: ::ffff:1.2.3.4 (dns) or ::ffff:102:304 (URL-normalized)
  const mapped = v6.match(/^::ffff:(.+)$/);
  if (!mapped?.[1]) return false;
  const hex = mapped[1].match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!hex?.[1] || !hex[2]) return isPrivateIp(mapped[1]);
  const hi = parseInt(hex[1], 16);
  const lo = parseInt(hex[2], 16);
  return isPrivateIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
}

export function isBlockedHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
  return normalized === "localhost" ||
    /\.(localhost|local|internal)$/.test(normalized) ||
    isPrivateIp(normalized);
}

// Name/literal check plus DNS: blocked if ANY resolved address is private.
// shortcut: Playwright re-resolves, so DNS rebinding between check and page.goto
// is not covered for screenshots; route the browser through a pinning proxy if needed.
export async function isPublicHost(hostname: string): Promise<boolean> {
  if (isBlockedHost(hostname)) return false;
  try {
    const addresses = await lookup(hostname.replace(/^\[|\]$/g, ""), { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

// Resolves once and refuses if ANY address is private; the socket connects to the
// vetted address, so a second (rebinding) answer is never used. Host/SNI stay the name.
const pinnedLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { all: true })
    .then((addresses) => {
      const first = addresses[0];
      if (!first || addresses.some((a) => isPrivateIp(a.address))) throw new Error("blocked host");
      if (options.all) callback(null, addresses);
      else callback(null, first.address, first.family);
    })
    .catch((err) => callback(err, ""));
};

function headPinned(url: URL): Promise<Response> {
  return new Promise((resolve, reject) => {
    const send = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = send(url, { method: "HEAD", lookup: pinnedLookup, signal: AbortSignal.timeout(8000) }, (res) => {
      res.resume();
      try {
        const headers = new Headers();
        for (let i = 0; i + 1 < res.rawHeaders.length; i += 2) headers.append(res.rawHeaders[i]!, res.rawHeaders[i + 1]!);
        resolve(new Response(null, { status: res.statusCode ?? 0, headers }));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
    req.end();
  });
}

// Follows redirects by hand so every hop is re-validated.
async function fetchPublicHead(start: URL): Promise<Response | null> {
  let current = start;
  for (let hop = 0; ; hop++) {
    if ((current.protocol !== "http:" && current.protocol !== "https:") || !(await isPublicHost(current.hostname))) return null;
    const res = await headPinned(current);
    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) return res;
    if (hop >= MAX_REDIRECTS) throw new Error("too many redirects");
    current = new URL(location, current);
  }
}

export async function checkHeaders(url: string): Promise<HeaderCheckResult> {
  const headers: Record<string, string> = {};
  let status: number | null = null;
  let authWallDetected = false;
  const targetUrl = new URL(url);

  const blocked: HeaderCheckResult = {
    status: null,
    headers: {},
    iframeAllowed: false,
    mixedContentRisk: false,
    authWallDetected: false,
    issues: [{
      code: "LOCAL_URL_BLOCKED",
      severity: "high",
      description: "Local or private hostnames are not allowed",
      recommendation: "Use a publicly reachable http(s) URL",
    }],
    recommendation: "Use a publicly reachable http(s) URL.",
  };

  if (isBlockedHost(targetUrl.hostname)) {
    return blocked;
  }

  try {
    const res = await fetchPublicHead(targetUrl);
    if (!res) return blocked;
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

  const isHttps = targetUrl.protocol === "https:";
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
