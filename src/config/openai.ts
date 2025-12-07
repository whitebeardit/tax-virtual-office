import OpenAI from "openai";
import { env } from "./env";

export const openaiClient = new OpenAI({ apiKey: env.openAiApiKey });

export function ensureApiKey() {
  if (!env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
}
