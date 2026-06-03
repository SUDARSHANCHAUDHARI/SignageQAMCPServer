import { z } from "zod";

// ── Shared types ───────────────────────────────────────────────────────────

export const IssueSchema = z.object({
  code: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string(),
  recommendation: z.string().optional(),
});

export type Issue = z.infer<typeof IssueSchema>;

// ── Tool input schemas ─────────────────────────────────────────────────────

export const HttpUrlSchema = z.string().url({ message: "Must be a valid URL" }).refine((value) => {
  const url = new URL(value);
  return url.protocol === "http:" || url.protocol === "https:";
}, "Only http and https URLs are supported");

export const InspectUrlInputSchema = z.object({
  url: HttpUrlSchema,
  checkIframe: z.boolean().optional().default(false),
  captureScreenshot: z.boolean().optional().default(false),
});

export type InspectUrlInput = z.infer<typeof InspectUrlInputSchema>;

export const CheckIframeInputSchema = z.object({
  url: HttpUrlSchema,
});

export type CheckIframeInput = z.infer<typeof CheckIframeInputSchema>;

export const CaptureScreenshotInputSchema = z.object({
  url: HttpUrlSchema,
  width: z.number().int().positive().optional().default(1920),
  height: z.number().int().positive().optional().default(1080),
  outputPath: z.string().optional(),
});

export type CaptureScreenshotInput = z.infer<typeof CaptureScreenshotInputSchema>;

export const GenerateBugReportInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: HttpUrlSchema.optional(),
  issuesFound: z.array(IssueSchema),
  screenshots: z.array(z.string()).optional().default([]),
  devicePlatform: z.string().optional(),
  notes: z.string().optional(),
});

export type GenerateBugReportInput = z.infer<typeof GenerateBugReportInputSchema>;

// ── Tool output types ──────────────────────────────────────────────────────

export interface InspectUrlResult {
  url: string;
  status: number | null;
  iframeAllowed: boolean;
  authWallDetected: boolean;
  issues: Issue[];
  headers: Record<string, string>;
  recommendedAction: string;
  screenshotPath?: string;
  error?: string;
}

export interface CheckIframeResult {
  url: string;
  compatible: boolean;
  reason: string;
  cspPolicy?: string;
  xFrameOptions?: string;
  mixedContentRisk: boolean;
  issues: Issue[];
  recommendation: string;
  error?: string;
}

export interface CaptureScreenshotResult {
  success: boolean;
  filePath: string;
  dimensions: { width: number; height: number };
  error?: string;
}

export interface GenerateBugReportResult {
  report: string;
  severity: "low" | "medium" | "high" | "critical";
  error?: string;
}
