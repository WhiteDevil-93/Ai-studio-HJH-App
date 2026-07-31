import {describe, expect, it} from 'vitest';
import {HOSPITAL_PROTOCOLS_BY_FACILITY} from './hospitalProtocols';

const EXPECTED_PDF_SHA256 =
  '70187c9d418f08dc36faf6637c85a50a4aed4229371f5b73004c14fa152502b9';

const IMAGE_PROTOCOLS = new Map([
  ['asthma_pefr', '/clinical-sources/cmjah/asthma-pefr-normal-values.jpg'],
  ['paracetamol_nomogram', '/clinical-sources/cmjah/paracetamol-treatment-nomogram.png'],
]);

describe('CMJAH official PDF source fidelity', () => {
  const protocols = HOSPITAL_PROTOCOLS_BY_FACILITY.cmjah;

  it('loads the complete 79-entry CMJAH runtime corpus', () => {
    expect(protocols).toHaveLength(79);
    expect(new Set(protocols.map(protocol => protocol.slug)).size).toBe(79);
  });

  it('loads every CMJAH entry from the designated official PDF', () => {
    for (const protocol of protocols) {
      expect(protocol.sourceDocument, protocol.id).toBe('CMJAH ED December 2020');
      expect(protocol.reviewState, protocol.id).toBe('source_verified');
      expect(protocol.pdfPages.length, protocol.id).toBeGreaterThan(0);
      expect(protocol.body.sourcePdfSha256, protocol.id).toBe(EXPECTED_PDF_SHA256);
      expect(protocol.embeddedDrugs, protocol.id).toEqual([]);
    }
  });

  it('uses page-bounded text except for the two verified image pages', () => {
    for (const protocol of protocols) {
      const expectedImage = IMAGE_PROTOCOLS.get(protocol.slug);
      if (expectedImage) {
        expect(protocol.body.source_image, protocol.id).toBe(expectedImage);
        expect(protocol.body.source_fidelity, protocol.id).toContain('image-page overlay');
        continue;
      }

      expect(typeof protocol.body.source_text, protocol.id).toBe('string');
      expect(String(protocol.body.source_text).trim().length, protocol.id).toBeGreaterThan(0);
      expect(String(protocol.body.sourceTextSha256), protocol.id).toMatch(/^[a-f0-9]{64}$/);
      expect(protocol.body.source_fidelity, protocol.id).toContain('page-bounded transcription');
      expect(protocol.body.source_image, protocol.id).toBeUndefined();
    }
  });

  it('keeps the high-risk multi-page and algorithm boundaries explicit', () => {
    const bySlug = new Map(protocols.map(protocol => [protocol.slug, protocol]));

    expect(bySlug.get('stemi_equivalents')?.pdfPages).toEqual([10, 11]);
    expect(bySlug.get('aha_resuscitation_algorithms')?.pdfPages).toEqual([
      18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    ]);
    expect(bySlug.get('infusions')?.pdfPages).toEqual([81, 82, 83, 84, 85, 86, 87, 88]);
    expect(bySlug.get('syncope_ecg')?.pdfPages).toEqual([123, 124, 125, 126, 127, 128, 129]);
    expect(bySlug.get('triage')?.pdfPages).toEqual([137, 138, 139, 140, 141, 142]);
  });
});
