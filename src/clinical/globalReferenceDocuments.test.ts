import {describe, expect, it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import guidelineReferenceV3 from '../../clinical-sources/raw/clinical-guidelines-reference-v3.json';
import {GlobalReferenceDocumentPage} from '../components/GlobalReferenceDocumentPage';
import {
  CLINICAL_REFERENCE_CORRECTIONS,
  GLOBAL_REFERENCE_DOCUMENTS,
  OFFICIAL_EDITION_CHECKS,
  PARSED_GLOBAL_REFERENCE_DOCUMENTS,
  SUPPLIED_GUIDELINE_LINK_AUDIT,
  getClinicalReferenceCorrection,
  getGuidelineId,
  parseReferenceDocument,
} from './globalReferenceDocuments';

describe('supplied global reference documents', () => {
  it('parses the v3 pocket guide into its 9 clickable cards', () => {
    const parsed = PARSED_GLOBAL_REFERENCE_DOCUMENTS.pocket;
    expect(parsed.entries).toHaveLength(9);
    expect(new Set(parsed.entries.map(entry => entry.title)).size).toBe(9);
    expect(parsed.entries.filter(entry => entry.title.includes('Trial'))).toHaveLength(5);
    expect(parsed.supplementarySections).toHaveLength(1);
    expect(parsed.supplementarySections[0].title).toContain('BIBLIOGRAPHY');
    expect(parsed.supplementarySections[0].body).toContain('Surviving Sepsis Guidelines');
  });

  it('parses the guideline directory into all 43 organization cards', () => {
    const parsed = PARSED_GLOBAL_REFERENCE_DOCUMENTS.guidelines;
    expect(parsed.entries).toHaveLength(43);
    expect(new Set(parsed.entries.map(entry => entry.title)).size).toBe(43);
    expect(parsed.entries[0].title).toContain('World Health Organization');
    expect(parsed.entries.at(-1)?.title).toContain('American College of Medical Toxicology');
  });

  it('retains the supplied Markdown and declared audit limitations', () => {
    for (const definition of Object.values(GLOBAL_REFERENCE_DOCUMENTS)) {
      expect(definition.markdown.length).toBeGreaterThan(10_000);
      expect(definition.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(definition.auditNotes.length).toBeGreaterThanOrEqual(4);
      expect(definition.citationMarkerCount).toBeGreaterThan(0);
      expect(definition.uniqueCitationMarkerCount).toBeGreaterThan(0);
    }
  });

  it('validates the complete v3 JSON schema and JSON-to-Markdown coverage', () => {
    expect(guidelineReferenceV3.metadata.version).toBe('3.0');
    expect(guidelineReferenceV3.guidelines).toHaveLength(43);
    expect(guidelineReferenceV3.landmark_trials).toHaveLength(5);
    expect(guidelineReferenceV3.guidelines.map(guideline => guideline.id)).toEqual(
      Array.from({length: 43}, (_, index) => index + 1),
    );

    const requiredGuidelineFields = [
      'category',
      'guideline',
      'global_standard',
      'african_reality',
      'local_adaptation',
      'rounding_pitch',
      'supporting_evidence',
      'bibliography',
      'direct_url',
    ] as const;

    for (const guideline of guidelineReferenceV3.guidelines) {
      for (const field of requiredGuidelineFields) {
        expect(guideline[field].trim(), `guideline ${guideline.id} ${field}`).not.toBe('');
      }
      expect(() => new URL(guideline.direct_url)).not.toThrow();
      expect(
        PARSED_GLOBAL_REFERENCE_DOCUMENTS.guidelines.entries.some(
          entry => getGuidelineId(entry.title) === guideline.id,
        ),
      ).toBe(true);
    }

    for (const trial of guidelineReferenceV3.landmark_trials) {
      expect(() => new URL(trial.direct_url)).not.toThrow();
      expect(
        PARSED_GLOBAL_REFERENCE_DOCUMENTS.pocket.entries.some(
          entry => entry.title.toLowerCase().includes(
            trial.name.toLowerCase().replace(/\s+trial.*$/, ''),
          ),
        ),
      ).toBe(true);
    }
  });

  it('keeps the supplied guideline URL duplication problem explicit', () => {
    expect(SUPPLIED_GUIDELINE_LINK_AUDIT).toMatchObject({
      guidelineCount: 43,
      duplicateUrlGroupCount: 11,
      recordsWithDuplicatedUrlCount: 27,
    });
    expect(new Set(SUPPLIED_GUIDELINE_LINK_AUDIT.affectedGuidelineIds).size).toBe(27);

    const directUrlCounts = guidelineReferenceV3.guidelines.reduce<Record<string, number>>(
      (counts, guideline) => ({
        ...counts,
        [guideline.direct_url]: (counts[guideline.direct_url] ?? 0) + 1,
      }),
      {},
    );
    const duplicatedUrls = Object.values(directUrlCounts).filter(count => count > 1);
    expect(duplicatedUrls).toHaveLength(11);
    expect(duplicatedUrls.reduce((total, count) => total + count, 0)).toBe(27);
  });

  it('attaches primary-source corrections to the unsafe v3 claims', () => {
    expect(CLINICAL_REFERENCE_CORRECTIONS.pocket).toHaveLength(4);
    expect(CLINICAL_REFERENCE_CORRECTIONS.guidelines).toHaveLength(2);
    expect(
      getClinicalReferenceCorrection('pocket', '🔬 GASTROSAM Trial (2021)')?.summary,
    ).toContain('no evidence of a mortality difference');
    expect(
      getClinicalReferenceCorrection(
        'guidelines',
        '🏷️ Guideline 10: Surviving Sepsis Campaign',
      )?.summary,
    ).toContain('not the rigid one-hour rule');
  });

  it('renders source links, current-source notes, and the pocket bibliography as clickable data', () => {
    const pocketHtml = renderToStaticMarkup(createElement(GlobalReferenceDocumentPage, {
      documentId: 'pocket',
      searchQuery: '',
    }));
    expect(pocketHtml).toContain('href="https://www.nejm.org/doi/full/10.1056/nejmoa1101549"');
    expect(pocketHtml).toContain('Completed GASTROSAM trial');
    expect(pocketHtml).toContain('FULL EXHAUSTIVE CLINICAL BIBLIOGRAPHY');

    const guidelineHtml = renderToStaticMarkup(createElement(GlobalReferenceDocumentPage, {
      documentId: 'guidelines',
      searchQuery: '',
    }));
    expect(guidelineHtml).toContain('Current source note');
    expect(guidelineHtml).not.toContain('this card’s direct URL is duplicated');
    expect(guidelineHtml).toContain('Official SSC 2026 guideline');
  });

  it('identifies KDIGO 2026 as a draft while linking all checked editions', () => {
    expect(OFFICIAL_EDITION_CHECKS).toHaveLength(6);
    expect(OFFICIAL_EDITION_CHECKS.find(check => check.label.includes('KDIGO'))).toMatchObject({
      status: 'Public-review draft',
    });
    for (const check of OFFICIAL_EDITION_CHECKS) {
      expect(check.url).toMatch(/^https:\/\//);
    }
  });

  it('does not silently drop entry text during parsing', () => {
    for (const definition of Object.values(GLOBAL_REFERENCE_DOCUMENTS)) {
      const parsed = parseReferenceDocument(definition.markdown);
      const parsedBodyLength = parsed.entries.reduce(
        (total, entry) => total + entry.body.length,
        0,
      ) + parsed.supplementarySections.reduce(
        (total, section) => total + section.body.length,
        0,
      ) + parsed.introduction.length;
      expect(parsedBodyLength).toBeGreaterThan(definition.markdown.length * 0.75);
    }
  });
});
