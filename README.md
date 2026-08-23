# SignageQA MCP Server

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![MCP](https://img.shields.io/badge/MCP-Server-111827)
![License](https://img.shields.io/badge/License-MIT-blue)

MCP server for inspecting digital signage URLs, iframe compatibility, screenshots, and bug reports from AI tools such as Claude Desktop or Cursor.

## Table of Contents

- [What It Does](#what-it-does)
- [Tools](#tools)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Claude Desktop Config](#claude-desktop-config)
- [Example Prompt](#example-prompt)
- [Production Checks](#production-checks)
- [Release Notes](#release-notes)
- [License](#license)
- [About](#about)

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

## License

MIT

---

## About

I'm Sudarshan Chaudhari, a Senior Quality Engineer, Test Automation specialist, and AI systems builder based in Bangkok, Thailand.

I have 13+ years of experience in software quality engineering, working across SaaS, fintech, gaming, web, mobile, cloud, and digital signage platforms. My background combines hands-on test automation with QA leadership, test strategy, CI/CD, release quality, production investigation, and cross-platform validation.

Alongside my professional QA career, I run [SudarshanTechLabs](https://sudarshantechlabs.com/), my independent engineering and product lab where I design, build, test, and ship software across Android, web, AI, cybersecurity, developer tooling, and cross-platform applications.

### What I work on

- ⚙️ **Quality Engineering & Test Automation** — Playwright, Selenium, Cypress, Appium, API testing, automation frameworks, end-to-end testing, CI/CD, release gates, GitHub Actions, risk-based testing, and production validation
- 🤖 **AI Systems & Automation** — AI agents, multi-agent orchestration, MCP servers, AI-assisted QA, prompt tooling, developer workflows, automation systems, and Claude Code plugins
- 📱 **Mobile & Cross-Platform Applications** — Android applications built with Kotlin and Jetpack Compose, Google Play releases, automated build and publishing pipelines, and cross-platform development spanning iOS, web, Windows, and macOS
- 🌐 **Web Applications & Platforms** — Full-stack applications using Next.js, TypeScript, Firebase, Cloudflare, REST APIs, and modern web infrastructure
- 🛠️ **Developer Tooling & CLI Engineering** — Rust, Python, TypeScript, CLI utilities, multi-repository tooling, build automation, release tooling, and engineering productivity systems
- 🛡️ **Cybersecurity & Observability** — Threat detection, log analysis, security auditing, vulnerability assessment, monitoring, and security-focused developer tools
- 📺 **Digital Signage & Device Platforms** — Content validation, playback testing, device compatibility, production investigation, monitoring, and QA across diverse hardware and operating-system environments

My work sits at the intersection of quality engineering, automation, AI, and software development. I approach products with a QA mindset from the beginning: understanding failure modes, designing for testability, automating repetitive work, and building release confidence into the engineering process.

Through SudarshanTechLabs, I also build products and tools from idea to production, covering architecture, development, testing, CI/CD, release automation, monitoring, and ongoing maintenance.

🌐 [sudarshantechlabs.com](https://sudarshantechlabs.com/) · 💼 [LinkedIn](https://linkedin.com/in/sudarshan-chaudhari) · 🐙 [GitHub](https://github.com/SUDARSHANCHAUDHARI) · ✉️ [sunny.sudarshan@gmail.com](mailto:sunny.sudarshan@gmail.com)
