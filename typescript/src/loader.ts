import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export interface Document {
  title?: string;
  header?: string;
  pageContent: string;
  metadata: Record<string, any>; // metadataを必須に変更
}

export function loadDocs(filePath: string): Document[] {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const data = fs.readFileSync(path.resolve(dirname, filePath), 'utf8');
  return JSON.parse(data) as Document[];
}