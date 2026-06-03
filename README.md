# SignageQA MCP Server

TypeScript MCP server that gives AI agents (Claude Desktop, Cursor, etc.) real tools to inspect and diagnose digital signage systems.

## Tools

| Tool | Description |
|------|-------------|
| `inspect_url` | Full URL inspection: HTTP status, iframe compatibility, auth walls, headers |
| `check_iframe_compatibility` | Check CSP + X-Frame-Options for iframe embedding |
| `capture_screenshot` | Headless Playwright screenshot at any resolution |
| `generate_bug_report` | AI-written or template-based Markdown bug report |

## Setup

```bash
pnpm install
pnpm build
```

### Claude Desktop config

Copy `examples/claude-desktop-config.json` and update the path:

```json
{
  "mcpServers": {
    "signageqa": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "AI_PROVIDER": "claude",
        "ANTHROPIC_API_KEY": "sk-..."
      }
    }
  }
}
```

## Environment Variables

```env
AI_PROVIDER=claude          # or: openai (optional — tools work without AI)
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
SCREENSHOTS_DIR=./screenshots
```

AI is **optional** — all 4 tools work without API keys. AI only enhances `generate_bug_report` summaries.

## Example Usage with Claude

> "Check why this customer URL won't load in our signage iframe."

Claude will call:
1. `check_iframe_compatibility` → detect CSP/X-Frame-Options block
2. `capture_screenshot` → visual evidence
3. `generate_bug_report` → structured report with customer explanation

## Tech Stack

- TypeScript (ESM, strict)
- `@modelcontextprotocol/sdk`
- Playwright (headless browser)
- Zod (schema validation)
- Anthropic SDK / OpenAI SDK

## Production Checks

```bash
pnpm type-check
pnpm test
pnpm build
```

## Release Notes

- Do not commit `.env` files, captured screenshots, or local MCP client config with real keys.
- `SCREENSHOTS_DIR` should point to writable runtime storage if screenshot capture is enabled.
- Playwright is runtime functionality for screenshot capture, not a browser smoke-test dependency.

## License

MIT
