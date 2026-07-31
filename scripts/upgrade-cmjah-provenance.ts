// CMJAH provenance upgrade script.
// Promotes existing canonical CMJAH entries from verification: 'manual' to
// 'page-index' for the topics whose page citations have already been corrected
// against cmjah_page_index.txt.
//
// Run:
//   node --import tsx scripts/upgrade-cmjah-provenance.ts [--write]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {CanonicalEntryFile} from '../src/clinical/entryNormalize.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRIES_DIR = path.join(ROOT, 'src/clinical/entries');
const WRITE = process.argv.includes('--write');

// Verified against cmjah_page_index.txt (see migration-report.md corrections).
const UPGRADES: Array<{slug: string; pages: number[]; sectionTitle: string}> = [
  {slug: 'status-epilepticus-cmjah', pages: [119, 120], sectionTitle: 'Status Epilepticus'},
  {slug: 'subarachnoid-haemorrhage-cmjah', pages: [121], sectionTitle: 'Subarachnoid Haemorrhage'},
  {slug: 'the-agitated-patient-cmjah', pages: [131], sectionTitle: 'The Agitated Patient'},
  {slug: 'snakebite-pathway-cmjah', pages: [117, 118], sectionTitle: 'Snakebite Pathway'},
  {slug: 'toxic-alcohol-ingestion-cmjah', pages: [135], sectionTitle: 'Toxic Alcohol Ingestion'},
  {slug: 'tricyclic-antidepressant-tca-overdose-cmjah', pages: [143], sectionTitle: 'Tricyclic Antidepressant (TCA) Overdose'},
  {slug: 'thyroid-emergencies-cmjah', pages: [133, 134], sectionTitle: 'Thyroid Emergencies'},
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function main() {
  const bySlug = new Map<string, string>();
  for (const fp of walk(ENTRIES_DIR)) bySlug.set(path.basename(fp, '.json'), fp);

  let updated = 0;
  let already = 0;
  const report: string[] = [];

  for (const u of UPGRADES) {
    const fp = bySlug.get(u.slug);
    if (!fp) {
      report.push(`MISSING ${u.slug}`);
      continue;
    }
    const entry: CanonicalEntryFile = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const needsUpdate =
      entry.source?.verification !== 'page-index' ||
      JSON.stringify(entry.source.pdfPages ?? []) !== JSON.stringify(u.pages);

    if (needsUpdate) {
      entry.source = {
        sourceId: 'cmjah-ed-protocols-2020-v2',
        pdfPages: u.pages,
        sectionTitle: u.sectionTitle,
        transformation: entry.source?.transformation ?? 'condensed',
        verification: 'page-index',
      };
      entry.sourceGroup = 'cmjah';
      if (WRITE) fs.writeFileSync(fp, JSON.stringify(entry, null, 2) + '\n');
      updated++;
      report.push(`UPDATED ${u.slug} -> page-index [${u.pages.join(',')}]`);
    } else {
      already++;
      report.push(`OK      ${u.slug}`);
    }
  }

  console.log(report.join('\n'));
  console.log(`\nSummary: ${updated} updated, ${already} already page-index, ${UPGRADES.length - updated - already} missing`);
  if (!WRITE) console.log('(dry run - pass --write to apply)');
}

main();
