import dotenv from "dotenv";

dotenv.config();

export type AppMode = "api" | "daily-portals-scan";

export const env = {
  appMode: (process.env.APP_MODE as AppMode | undefined) || "api",
  port: Number(process.env.PORT || 3000),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
};
