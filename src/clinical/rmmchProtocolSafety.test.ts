import {describe, expect, it} from 'vitest';
import {extractWeightDoseResults} from './calculations/weightDose';
import {
  findHospitalProtocol,
  HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY,
} from './hospitalProtocols';

describe('RMMCH source-fidelity corrections', () => {
  it('keeps oral and rectal paediatric paracetamol doses separate', () => {
    const analgesia = findHospitalProtocol('rmmch', 'rmmch-analgesia');
    expect(analgesia?.reviewState).toBe(
      'reviewed-against-rmmch-v5-pdf-pages-6-10',
    );
    expect(analgesia?.pdfPages).toEqual([6, 7, 8, 9, 10]);

    const text = JSON.stringify(analgesia?.body.management_steps);
    expect(text).toContain('children 20 mg/kg PO STAT');
    expect(text).toContain('children 15-20 mg/kg PR STAT');
    expect(text).not.toContain('15-20 mg/kg PO STAT');

    const oralDose = extractWeightDoseResults('20 mg/kg PO STAT', 20);
    expect(oralDose).toEqual([
      {
        sourceExpression: '20 mg/kg',
        minimum: 400,
        maximum: 400,
        resultUnit: 'mg',
      },
    ]);
  });

  it('does not attribute an Hour-1 sepsis bundle to PDF pages 46-47', () => {
    const sepsis = findHospitalProtocol(
      'rmmch',
      'rmmch-sepsis-and-septic-shock',
    );
    expect(sepsis?.reviewState).toBe(
      'reviewed-against-rmmch-v5-pdf-pages-46-47',
    );
    expect(sepsis?.pdfPages).toEqual([46, 47]);
    expect(sepsis?.body.management_steps).toBeUndefined();
    expect(sepsis?.searchText).not.toMatch(
      /Hour-1|30 mL\/kg|broad-spectrum antibiotics|mean arterial pressure/i,
    );
    expect(sepsis?.searchText).toMatch(/SIRS|Q-SOFA|SOFA/);
  });

  it('withholds duplicate, title-only, unreadable and image-only pages', () => {
    const visible = HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY.rmmch;
    const visibleSlugs = new Set(visible.map(protocol => protocol.slug));
    const withheld = [
      'traumatic_cardiac_arrest',
      'bradycardia',
      'tachycardia',
      'acute_asthma',
      'airway_management_advanced',
      'anaphylaxis',
      'animal_mammalian_bites',
      'tetanus_prophylaxis',
      'upper_git_bleed',
      'analgesia',
      'cardiac_arrest_adult_paediatric',
      'post_cardiac_arrest_care',
      'sepsis_septic_shock',
      'c_spine_injuries',
      'ct_c_spine_protocol',
      'ctb_protocol',
      'triage',
      'efast',
    ];

    for (const slug of withheld) {
      expect(visibleSlugs.has(slug), slug).toBe(false);
    }
    expect(visible).toHaveLength(33);
    expect(visibleSlugs.has('rmmch-analgesia')).toBe(true);
    expect(visibleSlugs.has('rmmch-sepsis-and-septic-shock')).toBe(true);
  });
});
