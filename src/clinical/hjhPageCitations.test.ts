import {describe, expect, it} from 'vitest';
import type {CanonicalEntryFile} from './entryNormalize';
import audit from '../../clinical-sources/hjh-page-citation-audit.json';

// Page citations are what a clinical reviewer opens to verify an entry, so a
// wrong page silently makes that verification worthless. These tests pin the
// citations corrected in the page-citation audit (PAGE-CITE-001/002/003) so
// they cannot drift back, and keep the audit honest about what is still open.

const entryFiles = import.meta.glob<CanonicalEntryFile>('./entries/**/*.json', {
  eager: true,
  import: 'default',
});

const byRelativePath = new Map<string, CanonicalEntryFile>(
  Object.entries(entryFiles).map(([path, file]) => [path.replace('./entries/', ''), file]),
);

const pagesOf = (relativePath: string): number[] => {
  const file = byRelativePath.get(relativePath);
  if (!file) throw new Error(`missing entry ${relativePath}`);
  return file.source?.pdfPages ?? [];
};

describe('HJH page citations corrected by the audit', () => {
  it('PAGE-CITE-001: no entry cites page 5, which is a table-of-contents page', () => {
    const offenders = [...byRelativePath.entries()]
      .filter(([, file]) => file.source?.sourceId === 'hjh-ed-2026-v1')
      .filter(([, file]) => (file.source.pdfPages ?? []).includes(5))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it('PAGE-CITE-001: the four affected entries keep their genuine content pages', () => {
    expect(pagesOf('11_ed_medical_emergencies/protocols/sexual-assault-protocol.json')).toEqual([72, 175]);
    expect(pagesOf('11_ed_medical_emergencies/protocols/snakebite-pathway-emct-hjh.json')).toEqual([176]);
    expect(pagesOf('11_ed_medical_emergencies/protocols/status-epilepticus-algorithm.json')).toEqual([177, 178]);
    expect(pagesOf('11_ed_medical_emergencies/protocols/status-epilepticus-hjh.json')).toEqual([75, 177, 178, 179]);
  });

  it('PAGE-CITE-002: TCA overdose cites page 196, not the toxicology ECG pages', () => {
    const pages = pagesOf('12_ed_toxicology/protocols/tricyclic-antidepressant-overdose-hjh.json');
    expect(pages).toEqual([196]);
    expect(pages).not.toContain(244);
  });

  it('PAGE-CITE-003: isoniazid overdose cites page 118, not the toxicology ECG pages', () => {
    const pages = pagesOf('12_ed_toxicology/protocols/isoniazid-overdose-hjh.json');
    expect(pages).toEqual([118]);
    expect(pages).not.toContain(246);
  });

  it('every resolved finding records how it was resolved', () => {
    const findings = audit.findings as Array<{status: string; resolution?: string}>;
    for (const finding of findings.filter(f => f.status !== 'awaiting-clinical-decision')) {
      expect(finding.resolution, 'resolved finding needs a resolution note').toBeTruthy();
    }
  });

  it('PAGE-CITE-004 remains open - its evidence does not identify a correct side', () => {
    const findings = audit.findings as Array<{id: string; status: string}>;
    expect(findings.find(f => f.id === 'PAGE-CITE-004')?.status).toBe('awaiting-clinical-decision');
  });
});
