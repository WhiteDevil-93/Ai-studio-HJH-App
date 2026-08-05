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
import {SCORE_CORRECTIONS} from '../src/clinical/scoreCorrections.ts';
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

// --- HJH page-citation drift gate ---
// An entry's pdfPages are what a clinical reviewer opens to verify it, so a
// wrong page silently sends the reviewer to unrelated text. Every cited HJH page
// must be owned by an HJH correction record. The entries already known to
// violate this are listed in clinical-sources/hjh-page-citation-audit.json with
// their evidence and are awaiting a provenance decision; this gate stops the
// list GROWING while they are adjudicated.
{
  const auditPath = path.join(ROOT, 'clinical-sources/hjh-page-citation-audit.json');
  const correctionsDir = path.join(ROOT, 'clinical-sources/corrections/HJH');
  if (fs.existsSync(auditPath) && fs.existsSync(correctionsDir)) {
    const ownedPages = new Set<number>();
    for (const name of fs.readdirSync(correctionsDir).filter(n => n.endsWith('.json'))) {
      const parsed = JSON.parse(fs.readFileSync(path.join(correctionsDir, name), 'utf8'));
      const protocol = parsed?.protocol ?? parsed;
      for (const page of protocol?.pdfPages ?? []) ownedPages.add(page);
    }

    const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8')) as {
      findings: Array<{entries: string[]}>;
    };
    const known = new Set(audit.findings.flatMap(finding => finding.entries));

    for (const {path: relPath, file} of files) {
      if (file.source?.sourceId !== 'hjh-ed-2026-v1') continue;
      const unowned = (file.source.pdfPages ?? []).filter(page => !ownedPages.has(page));
      if (unowned.length === 0) continue;
      const entryKey = relPath.replace('src/clinical/entries/', '');
      if (!known.has(entryKey)) {
        errors.push(
          `${relPath}: cites HJH page(s) ${unowned.join(', ')} that no HJH correction record covers — ` +
          'either fix the citation or add it to clinical-sources/hjh-page-citation-audit.json with evidence',
        );
      }
    }
  }
}

// --- Score-corrections overlay: no orphans ---
// Every reviewed runtime correction must reference a known errata entry and
// target an existing singleton score entry + component key, so a correction can
// never silently apply to nothing (or drift off a renamed component).
{
  const filesByEntryId = new Map(
    files.map(({file}) => [`${file.categoryId}/${file.subcategoryId}`, file]),
  );
  for (const correction of SCORE_CORRECTIONS) {
    const label = `score-correction ${correction.errataId} (${correction.entryId})`;
    if (!KNOWN_ERRATA_IDS.has(correction.errataId)) {
      errors.push(`${label}: errata id not found in clinical-sources/errata.json`);
    }
    const target = filesByEntryId.get(correction.entryId);
    if (!target) {
      errors.push(`${label}: target entry not found`);
      continue;
    }
    const components = (target.record as {components?: Array<{key?: string}>}).components ?? [];
    for (const patch of correction.componentPatches) {
      if (!components.some(component => component.key === patch.componentKey)) {
        errors.push(`${label}: component key "${patch.componentKey}" not found in target entry`);
      }
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

// --- Census check: the committed baseline is an EXACT inventory. Any
// difference — loss or unexplained growth — fails CI; an intentional content
// change must update entry-census.json in the same reviewed commit. ---
const censusPath = path.join(ROOT, 'clinical-sources/entry-census.json');
if (fs.existsSync(censusPath)) {
  const census = JSON.parse(fs.readFileSync(censusPath, 'utf8'));
  const explain = 'update clinical-sources/entry-census.json in the same reviewed commit if this change is intentional';
  if (entryCount !== census.totals.entries) {
    errors.push(`entryCount ${entryCount} != committed census ${census.totals.entries} — ${explain}`);
  }
  if (protocolCount !== census.totals.protocols) {
    errors.push(`protocolCount ${protocolCount} != committed census ${census.totals.protocols} — ${explain}`);
  }
  const byCategory = new Map<string, number>();
  for (const {file} of files) {
    if (file.categoryId === '16_score_calculators') continue;
    byCategory.set(file.categoryId, (byCategory.get(file.categoryId) ?? 0) + 1);
  }
  // Score calculators are singletons counted per file.
  byCategory.set(
    '16_score_calculators',
    files.filter(({file}) => file.categoryId === '16_score_calculators').length,
  );
  for (const [categoryId, expected] of Object.entries(census.byCategory ?? {})) {
    const actual = byCategory.get(categoryId) ?? 0;
    if (actual !== expected) {
      errors.push(`census: ${categoryId} has ${actual} entries, committed baseline says ${expected} — ${explain}`);
    }
  }
} else if (protocolCount < 40) {
  errors.push(`Expected at least 40 normalized protocols/procedures, found ${protocolCount}`);
}

// --- Duplicate-payload gate: duplicates are tracked in the committed report
// (clinical-sources/duplicate-report.json) and must never grow. Deleting them
// outright is deferred until stable-ID aliases exist (favourites and
// recently-viewed lists may reference duplicate IDs), but any NEW duplicate —
// e.g. from a re-run importer — fails CI, which also makes importers
// effectively idempotent at the gate. ---
{
  const reportPath = path.join(ROOT, 'clinical-sources/duplicate-report.json');
  const payloadGroups = new Map<string, string[]>();
  for (const {path: relPath, file} of files) {
    const digest = crypto
      .createHash('sha256')
      .update(JSON.stringify(file.record))
      .digest('hex');
    const bucket = payloadGroups.get(digest) ?? [];
    bucket.push(relPath);
    payloadGroups.set(digest, bucket);
  }
  const duplicateGroups = [...payloadGroups.entries()].filter(([, paths]) => paths.length > 1);
  const excessFiles = duplicateGroups.reduce((total, [, paths]) => total + paths.length - 1, 0);

  if (!fs.existsSync(reportPath)) {
    if (excessFiles > 0) {
      errors.push(`${excessFiles} duplicate record payloads found but clinical-sources/duplicate-report.json is missing`);
    }
  } else {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
      excessFiles: number;
      groups: Array<{recordSha256: string}>;
    };
    const knownDigests = new Set(report.groups.map(group => group.recordSha256));
    if (excessFiles > report.excessFiles) {
      errors.push(
        `duplicate record payloads grew: ${excessFiles} excess files > committed baseline ${report.excessFiles} — an importer is re-adding existing content`,
      );
    } else if (excessFiles < report.excessFiles) {
      warnings.push(
        `duplicate payloads shrank to ${excessFiles} (baseline ${report.excessFiles}) — regenerate clinical-sources/duplicate-report.json to ratchet the baseline down`,
      );
    }
    for (const [digest, paths] of duplicateGroups) {
      if (!knownDigests.has(digest)) {
        errors.push(`new duplicate payload group not in duplicate-report.json: ${paths.join(', ')}`);
      }
    }
  }
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
