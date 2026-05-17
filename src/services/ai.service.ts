const provider = process.env.AI_PROVIDER ?? "claude";

export async function summarize(systemPrompt: string, userMessage: string): Promise<string | null> {
  const hasKey = provider === "claude" ? !!process.env.ANTHROPIC_API_KEY : !!process.env.OPENAI_API_KEY;
  if (!hasKey) return null;

  try {
    if (provider === "openai") {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
        max_tokens: 1024,
      });
      return res.choices[0]?.message?.content ?? null;
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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
