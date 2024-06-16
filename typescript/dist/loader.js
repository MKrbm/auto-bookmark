import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
export function loadDocs(filePath) {
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const data = fs.readFileSync(path.resolve(dirname, filePath), 'utf8');
    return JSON.parse(data);
}
