import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {
  buildTreeFromFiles,
  legacyTitle,
  parseEntryPath,
  type CanonicalEntryFile,
} from '../src/clinical/entryNormalize.ts';
import manifest from '../clinical-sources/source-manifest.json' with {type: 'json'};
import errataRegisters from '../clinical-sources/errata.json' with {type: 'json'};
import hospitalArchiveManifest from '../clinical-sources/all-hospitals-protocols-manifest.json' with {type: 'json'};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENTRIES_DIR = path.join(ROOT, 'src/clinical/entries');
const HOSPITAL_ARCHIVE_DIR = path.join(
  ROOT,
  'clinical-sources/raw/all_hospitals_protocols',
);
const KNOWN_CATEGORY_IDS = new Set([
  '1_resuscitation_fluids_and_inotropes', '2_airway_and_ventilation',
  '3_sedation_analgesia_and_neurology', '4_antimicrobials_and_infectious_diseases',
  '5_metabolic_electrolytes_and_nutrition', '6_poisoning_and_toxicology',
  '7_useful_formulae', '8_cardiovascular', '9_blood_products',
  '10_endocrine_and_other', '11_ed_medical_emergencies', '12_ed_toxicology',
  '13_ed_trauma_surgical', '14_ed_metabolic', '15_ed_procedures',
  '16_score_calculators', '17_phc_primary_care',
]);
const KNOWN_SOURCE_IDS = new Set([
  ...manifest.sources.map(s => s.id),
  'source-unresolved',
]);
const MANIFEST_BY_ID = new Map(manifest.sources.map(s => [s.id, s]));
const KNOWN_ERRATA_IDS = new Set(
  errataRegisters.registers.flatMap(register => register.items.map(item => item.id)),
);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function loadCmjahPageIndex(): Map<number, string> {
  const text = fs.readFileSync(path.join(ROOT, 'cmjah_page_index.txt'), 'utf8');
  const pages = new Map<number, string>();
  const parts = text.split(/=====\s*PAGE\s+(\d+)\s*=====/);
  for (let i = 1; i < parts.length; i += 2) pages.set(Number(parts[i]), parts[i + 1] ?? '');
  return pages;
}

const errors: string[] = [];
const warnings: string[] = [];
const ids = new Set<string>();
let entryCount = 0;
let protocolCount = 0;
let mappedCount = 0;
let unresolvedCount = 0;

// --- Exact supplied archive extraction ---
// Hashes each path plus the SHA-256 of its bytes. This catches additions,
// removals, renames, and content edits without committing the ZIP itself.
if (!fs.existsSync(HOSPITAL_ARCHIVE_DIR)) {
  errors.push('Missing clinical-sources/raw/all_hospitals_protocols extraction');
} else {
  const archiveFiles = walk(HOSPITAL_ARCHIVE_DIR);
  const groupCounts = new Map<string, number>();
  const treeHash = crypto.createHash('sha256');

  for (const absolutePath of archiveFiles.sort()) {
    const relativePath = path
      .relative(HOSPITAL_ARCHIVE_DIR, absolutePath)
      .split(path.sep)
      .join('/');
    const group = relativePath.split('/')[0];
    groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);

    try {
      JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    } catch (error) {
      errors.push(`${relativePath}: invalid supplied archive JSON (${String(error)})`);
    }

    const fileHash = crypto
      .createHash('sha256')
      .update(fs.readFileSync(absolutePath))
      .digest();
    treeHash.update(relativePath);
    treeHash.update('\0');
    treeHash.update(fileHash);
    treeHash.update('\n');
  }

  if (archiveFiles.length !== hospitalArchiveManifest.files) {
    errors.push(
      `Supplied archive file count changed: ${archiveFiles.length} != ${hospitalArchiveManifest.files}`,
    );
  }
  for (const [group, expectedCount] of Object.entries(hospitalArchiveManifest.groups)) {
    const actualCount = groupCounts.get(group) ?? 0;
    if (actualCount !== expectedCount) {
      errors.push(
        `Supplied archive group ${group} changed: ${actualCount} != ${expectedCount}`,
      );
    }
  }
  const actualTreeHash = treeHash.digest('hex');
  if (actualTreeHash !== hospitalArchiveManifest.extractedTreeSha256) {
    errors.push(
      `Supplied archive tree checksum changed: ${actualTreeHash} != ${hospitalArchiveManifest.extractedTreeSha256}`,
    );
  }
}

const files: {path: string; file: CanonicalEntryFile}[] = walk(ENTRIES_DIR).map(abs => {
  const relFromRoot = path.relative(ROOT, abs).split(path.sep).join('/');
  return {
    path: relFromRoot,
    file: JSON.parse(fs.readFileSync(abs, 'utf8')) as CanonicalEntryFile,
  };
});

// --- File-tree / envelope validations ---
for (const {path: relPath, file} of files) {
  const pos = parseEntryPath(relPath);
  if (pos.categoryId !== file.categoryId || pos.subcategoryId !== file.subcategoryId || pos.slug !== file.slug) {
    errors.push(`${relPath}: envelope (${file.categoryId}/${file.subcategoryId}/${file.slug}) disagrees with directory position (${pos.categoryId}/${pos.subcategoryId}/${pos.slug})`);
  }
  if (!KNOWN_CATEGORY_IDS.has(file.categoryId)) {
    errors.push(`${relPath}: unknown categoryId "${file.categoryId}"`);
  }
  if (!/^[a-z0-9_]+$/.test(file.subcategoryId)) {
    errors.push(`${relPath}: subcategoryId "${file.subcategoryId}" should be snake_case`);
  }
  // Score-calculator slugs are the object keys App.tsx looks them up by
  // (snake_case, e.g. "anion_gap") - every other category uses kebab-case.
  if (!/^[a-z0-9_-]+$/.test(file.slug)) {
    errors.push(`${relPath}: slug "${file.slug}" should be lowercase alphanumeric with - or _`);
  }
  if (!Number.isInteger(file.order) || file.order < 0) {
    errors.push(`${relPath}: order must be a non-negative integer, got ${file.order}`);
  }
  if (!['unreviewed', 'clinical-review', 'approved', 'retired'].includes(file.reviewState)) {
    errors.push(`${relPath}: invalid reviewState "${file.reviewState}"`);
  }

  const sourceId = file.source?.sourceId;
  if (!sourceId || !KNOWN_SOURCE_IDS.has(sourceId)) {
    errors.push(`${relPath}: source.sourceId "${sourceId}" not found in clinical-sources/source-manifest.json`);
  } else if (sourceId !== 'source-unresolved') {
    const source = MANIFEST_BY_ID.get(sourceId);
    const pdfPages = file.source.pdfPages ?? [];
    if (sourceId === 'chbah-icu-dosing-card-2024') {
      if (pdfPages.length !== 0 || file.source.transformation !== 'externally-sourced') {
        errors.push(`${relPath}: CHBAH ICU dosing has no real page citations - expected pdfPages: [] and transformation: "externally-sourced"`);
      }
    } else if (source?.pageCount && pdfPages.some(p => !Number.isInteger(p) || p < 1 || p > source.pageCount!)) {
      errors.push(`${relPath}: pdfPages ${JSON.stringify(pdfPages)} out of range for ${sourceId} (1-${source.pageCount})`);
    }
  }

  for (const errataId of file.errata ?? []) {
    if (!KNOWN_ERRATA_IDS.has(errataId)) {
      errors.push(`${relPath}: errata id "${errataId}" not found in clinical-sources/errata.json`);
    }
  }
}

// --- CMJAH page cross-check: hard gate (this is what caught the 8 bad citations) ---
const cmjahPageIndex = loadCmjahPageIndex();
const STOPWORDS = new Set(['CMJAH', 'the', 'and', 'for', 'with', 'guideline', 'pathway', 'management']);
for (const {path: relPath, file} of files) {
  if (file.source?.sourceId !== 'cmjah-ed-protocols-2020-v2') continue;
  const title = legacyTitle(file.record);
  const tokens = title
    .replace(/\(CMJAH\)/gi, '')
    .split(/[^a-zA-Z]+/)
    .filter(t => t.length >= 4 && !STOPWORDS.has(t))
    .map(t => t.toLocaleLowerCase());
  const text = (file.source.pdfPages ?? []).map(p => cmjahPageIndex.get(p) ?? '').join(' ').toLocaleLowerCase();
  if (tokens.length > 0 && !tokens.some(t => text.includes(t))) {
    errors.push(`${relPath}: CMJAH pdfPages ${JSON.stringify(file.source.pdfPages)} do not contain any title keyword from "${title}" in cmjah_page_index.txt`);
  }
}

// --- Semantic validations (same checks as before the migration) ---
const tree = buildTreeFromFiles(files);
for (const [categoryId, category] of Object.entries(tree)) {
  if (categoryId === '16_score_calculators') continue;

  for (const [subcategoryId, value] of Object.entries(category)) {
    const records = Array.isArray(value) ? value : [value];
    for (const record of records) {
      entryCount += 1;
      const meta = record._meta;
      if (!meta) {
        errors.push(`${categoryId}/${subcategoryId}: missing metadata`);
        continue;
      }
      if (!legacyTitle(record)) errors.push(`${meta.id}: empty title`);
      if (ids.has(meta.id)) errors.push(`${meta.id}: duplicate ID`);
      ids.add(meta.id);

      if (meta.type === 'protocol' || meta.type === 'procedure') {
        protocolCount += 1;
        if (!Array.isArray(record.management_steps) || record.management_steps.length === 0) {
          errors.push(`${meta.id}: protocol/procedure has no management steps`);
        }
      }

      if (meta.sourceRefs.some(source => source.sourceId === 'source-unresolved')) {
        unresolvedCount += 1;
        if (meta.reviewState === 'approved') {
          errors.push(`${meta.id}: approved entry has unresolved provenance`);
        }
      } else {
        mappedCount += 1;
      }

      for (const warning of meta.warnings) {
        if (!warning.text.trim()) errors.push(`${meta.id}: empty warning`);
        if (!['information', 'caution', 'critical'].includes(warning.severity)) {
          errors.push(`${meta.id}: invalid warning severity`);
        }
      }
    }
  }
}

// --- Census check: errors on any decrease vs the committed baseline, so silent
// content loss is a CI failure instead of an eyeball check. ---
const censusPath = path.join(ROOT, 'clinical-sources/entry-census.json');
if (fs.existsSync(censusPath)) {
  const census = JSON.parse(fs.readFileSync(censusPath, 'utf8'));
  if (entryCount < census.totals.entries) {
    errors.push(`entryCount dropped: ${entryCount} < committed baseline ${census.totals.entries} in entry-census.json`);
  }
  if (protocolCount < census.totals.protocols) {
    errors.push(`protocolCount dropped: ${protocolCount} < committed baseline ${census.totals.protocols} in entry-census.json`);
  }
} else if (protocolCount < 40) {
  errors.push(`Expected at least 40 normalized protocols/procedures, found ${protocolCount}`);
}

if (unresolvedCount > 0) {
  warnings.push(`${unresolvedCount} entries remain explicitly unreviewed with unresolved page provenance`);
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Clinical data valid: ${entryCount} entries, ${protocolCount} protocols/procedures, ` +
    `${mappedCount} source-mapped, ${unresolvedCount} awaiting provenance.`,
  );
}
