import fs from "fs";
import path from "path";
import fetch from "node-fetch";

export async function httpDownload(url: string, outputDir: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = path.join(outputDir, path.basename(url));
  fs.writeFileSync(filename, buffer);
  return filename;
}
