import fetch from "node-fetch";

export async function httpFetch(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP fetch failed: ${response.status}`);
  }
  return response.text();
}
