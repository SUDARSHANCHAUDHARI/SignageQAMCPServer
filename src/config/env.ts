import { z } from "zod";

const EnvSchema = z.object({
  AI_PROVIDER: z.enum(["claude", "openai"]).default("claude"),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  SCREENSHOTS_DIR: z.string().min(1).default("./screenshots"),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function getEnv(): AppEnv {
  return EnvSchema.parse(process.env);
}

export function hasAiKey(env: AppEnv): boolean {
  return env.AI_PROVIDER === "openai" ? !!env.OPENAI_API_KEY : !!env.ANTHROPIC_API_KEY;
}
