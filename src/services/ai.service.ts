import { getEnv, hasAiKey } from "../config/env.js";

export async function summarize(systemPrompt: string, userMessage: string): Promise<string | null> {
  const env = getEnv();
  if (!hasAiKey(env)) return null;

  try {
    if (env.AI_PROVIDER === "openai") {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      const res = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
        max_tokens: 1024,
      });
      return res.choices[0]?.message?.content ?? null;
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = res.content[0];
    return block?.type === "text" ? block.text : null;
  } catch {
    return null;
  }
}
