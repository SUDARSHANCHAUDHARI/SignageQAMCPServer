import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import {
  InspectUrlInputSchema,
  CheckIframeInputSchema,
  CaptureScreenshotInputSchema,
  GenerateBugReportInputSchema,
} from "./schemas/tool-schemas.js";
import { inspectUrl } from "./tools/inspect-url.tool.js";
import { checkIframe } from "./tools/check-iframe.tool.js";
import { captureScreenshot } from "./tools/capture-screenshot.tool.js";
import { generateBugReport } from "./tools/generate-bug-report.tool.js";

const server = new Server(
  { name: "signageqa-mcp-server", version: "0.1.0" },
  { capabilities: { tools: {}, resources: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "inspect_url",
      description: "Inspect a URL for signage, iframe, kiosk, and browser compatibility issues.",
      inputSchema: {
        type: "object" as const,
        properties: {
          url: { type: "string", description: "URL to inspect" },
          checkIframe: { type: "boolean", description: "Check iframe compatibility", default: false },
          captureScreenshot: { type: "boolean", description: "Capture a screenshot", default: false },
        },
        required: ["url"],
      },
    },
    {
      name: "check_iframe_compatibility",
      description: "Check if a URL can be embedded in a signage player iframe. Checks CSP and X-Frame-Options headers.",
      inputSchema: {
        type: "object" as const,
        properties: { url: { type: "string", description: "URL to check" } },
        required: ["url"],
      },
    },
    {
      name: "capture_screenshot",
      description: "Capture a screenshot of a URL using a headless browser.",
      inputSchema: {
        type: "object" as const,
        properties: {
          url: { type: "string", description: "URL to screenshot" },
          width: { type: "number", description: "Viewport width (default 1920)", default: 1920 },
          height: { type: "number", description: "Viewport height (default 1080)", default: 1080 },
          outputPath: { type: "string", description: "Save path (optional)" },
        },
        required: ["url"],
      },
    },
    {
      name: "generate_bug_report",
      description: "Generate a structured Markdown bug report from issues found during signage QA.",
      inputSchema: {
        type: "object" as const,
        properties: {
          title: { type: "string", description: "Report title" },
          url: { type: "string", description: "Affected URL (optional)" },
          issuesFound: { type: "array", description: "Array of issues with code, severity, description" },
          screenshots: { type: "array", items: { type: "string" }, description: "Screenshot paths (optional)" },
          devicePlatform: { type: "string", description: "Device platform e.g. signage device, Windows, Android" },
          notes: { type: "string", description: "Additional notes" },
        },
        required: ["title", "issuesFound"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "inspect_url": {
        const input = InspectUrlInputSchema.parse(args);
        const result = await inspectUrl(input);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      }
      case "check_iframe_compatibility": {
        const input = CheckIframeInputSchema.parse(args);
        const result = await checkIframe(input);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      }
      case "capture_screenshot": {
        const input = CaptureScreenshotInputSchema.parse(args);
        const result = await captureScreenshot(input);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      }
      case "generate_bug_report": {
        const input = GenerateBugReportInputSchema.parse(args);
        const result = await generateBugReport(input);
        return { content: [{ type: "text" as const, text: result.report }] };
      }
      default:
        return { content: [{ type: "text" as const, text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
