export function extractFirstText(
  completion: { choices?: Array<{ message?: { content?: string | null } }> }
): string {
  if (!completion.choices || completion.choices.length === 0) {
    return "";
  }

  const firstChoice = completion.choices[0];
  if (!firstChoice.message || !firstChoice.message.content) {
    return "";
  }

  return typeof firstChoice.message.content === "string"
    ? firstChoice.message.content
    : "";
}
