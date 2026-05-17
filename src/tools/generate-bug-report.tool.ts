import { summarize } from "../services/ai.service.js";
import type { GenerateBugReportInput, GenerateBugReportResult } from "../schemas/tool-schemas.js";

const SYSTEM_PROMPT = `You are a digital signage QA engineer. Generate a clear, actionable bug report in Markdown. Include: Summary, Environment, Issues Found (with severity), Screenshots (if any), Recommended Actions, and a Customer-Safe Explanation. Be concise and professional.`;

function maxSeverity(issues: GenerateBugReportInput["issuesFound"]): GenerateBugReportResult["severity"] {
  if (issues.some((i) => i.severity === "critical")) return "critical";
  if (issues.some((i) => i.severity === "high")) return "high";
  if (issues.some((i) => i.severity === "medium")) return "medium";
  return "low";
}

function templateReport(input: GenerateBugReportInput): string {
  const severity = maxSeverity(input.issuesFound);
  const lines = [
    `# Bug Report: ${input.title}`,
    ``,
    `**Severity:** ${severity.toUpperCase()}`,
    `**URL:** ${input.url ?? "N/A"}`,
    `**Platform:** ${input.devicePlatform ?? "N/A"}`,
    `**Date:** ${new Date().toISOString()}`,
    ``,
    `## Issues Found`,
    ...input.issuesFound.map((i) => `- **[${i.severity.toUpperCase()}]** ${i.description}${i.recommendation ? ` — *${i.recommendation}*` : ""}`),
    ``,
  ];
  if (input.screenshots && input.screenshots.length > 0) {
    lines.push(`## Screenshots`, ...input.screenshots.map((s) => `- ${s}`), ``);
  }
  if (input.notes) lines.push(`## Notes`, input.notes, ``);
  lines.push(
    `## Recommended Actions`,
    ...input.issuesFound.filter((i) => i.recommendation).map((i) => `- ${i.recommendation}`),
    ``
  );
  return lines.join("\n");
}

export async function generateBugReport(input: GenerateBugReportInput): Promise<GenerateBugReportResult> {
  const severity = maxSeverity(input.issuesFound);

  const aiReport = await summarize(
    SYSTEM_PROMPT,
    JSON.stringify({ title: input.title, url: input.url, platform: input.devicePlatform, issues: input.issuesFound, notes: input.notes })
  );

  return {
    report: aiReport ?? templateReport(input),
    severity,
  };
}
