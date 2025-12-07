export function extractFirstText(
  output: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>
): string {
  const message = output.find((item) => item?.type === "message");
  if (!message || !Array.isArray(message.content)) {
    return "";
  }

  const textPart = message.content.find((part) => part?.type === "text");
  return typeof textPart?.text === "string" ? textPart.text : "";
}
