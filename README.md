# SignageQA MCP Server

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![MCP](https://img.shields.io/badge/MCP-Server-111827)
![License](https://img.shields.io/badge/License-MIT-blue)

MCP server for inspecting digital signage URLs, iframe compatibility, screenshots, and bug reports from AI tools such as Claude Desktop or Cursor.

## What It Does

SignageQA MCP Server gives an AI agent real diagnostic tools instead of asking it to guess from a URL. It can inspect headers, detect iframe blockers, capture visual evidence, and produce a structured bug report for support or engineering.

## Tools

| Tool | Purpose |
|---|---|
| `inspect_url` | Checks HTTP status, redirects, headers, iframe risk, and auth-wall signals. |
| `check_iframe_compatibility` | Detects CSP and `X-Frame-Options` policies that block signage iframe playback. |
| `capture_screenshot` | Captures a headless browser screenshot at a requested viewport size. |
| `generate_bug_report` | Creates a Markdown bug report with either AI or deterministic fallback text. |

## Tech Stack

- TypeScript, ESM, strict mode
- Model Context Protocol TypeScript SDK
- Playwright for runtime screenshot capture
- Zod for tool input validation
- Anthropic SDK and OpenAI SDK for optional AI summaries
- Vitest for focused URL safety tests

## Setup

```bash
pnpm install
pnpm build
```

## Environment Variables

```env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
SCREENSHOTS_DIR=./screenshots
```

AI keys are optional. The inspection, iframe, and screenshot tools work without them.

## Claude Desktop Config

Copy `examples/claude-desktop-config.json`, then update the built `dist/index.js` path:

```json
{
  "mcpServers": {
    "signageqa": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "AI_PROVIDER": "claude",
        "ANTHROPIC_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Example Prompt

```text
Check why this customer URL will not load inside our signage iframe.
```

Expected flow:

1. Run `check_iframe_compatibility`.
2. Capture a screenshot if the page loads.
3. Generate a support-ready bug report.

## Production Checks

```bash
pnpm type-check
pnpm test
pnpm build
```

## Release Notes

- Do not commit `.env` files, captured screenshots, or MCP client config containing real keys.
- Set `SCREENSHOTS_DIR` to writable runtime storage when screenshot capture is enabled.
- Playwright is product runtime functionality for screenshot capture. It is not a browser smoke-test dependency.

## Author

Built by [Sudarshan Chaudhari](https://github.com/SUDARSHANCHAUDHARI) for **SudarshanTechLabs**.

## License

MIT
