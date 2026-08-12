// Regenerates clinical-sources/entry-census.json, the EXACT inventory the
// clinical validator gates on. Counting mirrors validate-clinical-data.ts so
// the two can never disagree. Run this whenever an intentional content change
// adds or removes entries, and commit the result alongside that change.
//
//   node --import tsx scripts/generate-entry-census.ts

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTreeFromFiles, type CanonicalEntryFile} from '../src/clinical/entryNormalize.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRIES_DIR = path.join(ROOT, 'src/clinical/entries');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const files = walk(ENTRIES_DIR).map(abs => ({
  path: path.relative(ROOT, abs).split(path.sep).join('/'),
  file: JSON.parse(fs.readFileSync(abs, 'utf8')) as CanonicalEntryFile,
}));

const tree = buildTreeFromFiles(files);

let entries = 0;
let protocols = 0;
let sourceMapped = 0;
const bySourceGroup: Record<string, number> = {};

for (const [categoryId, category] of Object.entries(tree)) {
  if (categoryId === '16_score_calculators') continue;
  for (const value of Object.values(category)) {
    for (const record of Array.isArray(value) ? value : [value]) {
      const meta = record._meta;
      if (!meta) continue;
      entries += 1;
      if (meta.type === 'protocol' || meta.type === 'procedure') protocols += 1;
      if (!meta.sourceRefs.some(source => source.sourceId === 'source-unresolved')) sourceMapped += 1;
      const group = meta.sourceGroup ?? 'unknown';
      bySourceGroup[group] = (bySourceGroup[group] ?? 0) + 1;
    }
  }
}

// byCategory counts FILES (score calculators are singletons, one file each),
// exactly as the validator's census check does.
const byCategory: Record<string, number> = {};
for (const {file} of files) {
  byCategory[file.categoryId] = (byCategory[file.categoryId] ?? 0) + 1;
}

const sortKeys = (input: Record<string, number>) =>
  Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));

fs.writeFileSync(
  path.join(ROOT, 'clinical-sources/entry-census.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totals: {entries, protocols, sourceMapped},
      byCategory: sortKeys(byCategory),
      bySourceGroup: sortKeys(bySourceGroup),
    },
    null,
    2,
  ) + '\n',
);

console.log(`census: ${entries} entries, ${protocols} protocols, ${sourceMapped} source-mapped`);
