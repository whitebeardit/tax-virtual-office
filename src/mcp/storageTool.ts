import fs from "fs";
import path from "path";

const storageRoot = path.join(process.cwd(), "storage");

export function saveFile(name: string, content: Buffer): string {
  if (!fs.existsSync(storageRoot)) {
    fs.mkdirSync(storageRoot, { recursive: true });
  }
  const filename = path.join(storageRoot, name);
  fs.writeFileSync(filename, content);
  return filename;
}
