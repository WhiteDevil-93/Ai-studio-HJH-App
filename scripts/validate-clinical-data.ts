import {clinicalData, legacyTitle} from '../src/clinical/legacyAdapter';

interface Meta {
  id: string;
  type: string;
  title: string;
  sourceRefs: Array<{sourceId: string; pdfPages: number[]}>;
  reviewState: string;
  warnings: Array<{id: string; severity: string; text: string}>;
}

const errors: string[] = [];
const warnings: string[] = [];
const ids = new Set<string>();
let entryCount = 0;
let protocolCount = 0;
let mappedCount = 0;
let unresolvedCount = 0;

for (const [categoryId, category] of Object.entries(clinicalData)) {
  if (categoryId === '16_score_calculators') continue;

  for (const [subcategoryId, value] of Object.entries(category)) {
    const records = Array.isArray(value) ? value : [value];
    for (const record of records) {
      entryCount += 1;
      const meta = record._meta as Meta | undefined;
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

if (protocolCount < 40) {
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
