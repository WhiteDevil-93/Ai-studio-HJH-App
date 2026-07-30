import {describe, expect, it} from 'vitest';
import {
  findReferencedHospitalProtocol,
  findHospitalProtocol,
  FACILITY_PROTOCOL_CATEGORY_ASSIGNMENTS,
  hasProtocolContent,
  HOSPITALS,
  HJH_PROTOCOL_CATEGORY_ASSIGNMENTS,
  HOSPITAL_PROTOCOLS,
  HOSPITAL_PROTOCOLS_BY_FACILITY,
  HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY,
} from './hospitalProtocols';

describe('supplied hospital protocol corpus', () => {
  it('loads every hospital entry from the archive without deduplicating facilities', () => {
    expect(HOSPITAL_PROTOCOLS_BY_FACILITY.hjh).toHaveLength(97);
    expect(HOSPITAL_PROTOCOLS_BY_FACILITY.cmjah).toHaveLength(79);
    expect(HOSPITAL_PROTOCOLS_BY_FACILITY.chbah).toHaveLength(68);
    expect(HOSPITAL_PROTOCOLS_BY_FACILITY.rmmch).toHaveLength(51);
    expect(HOSPITAL_PROTOCOLS).toHaveLength(295);
  });

  it('gives every facility protocol a stable, unique page id', () => {
    const ids = HOSPITAL_PROTOCOLS.map(protocol => protocol.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(HOSPITAL_PROTOCOLS.every(protocol => protocol.title.length > 0)).toBe(true);
  });

  it('keeps each hospital collection strictly facility-labelled', () => {
    for (const protocol of HOSPITAL_PROTOCOLS) {
      expect(protocol.sourceDocument).toBe(
        HOSPITALS[protocol.facilityId].sourceLabel,
      );
      expect(protocol.archiveDirectory).toBe(
        HOSPITALS[protocol.facilityId].archiveDirectory,
      );
      expect(
        HOSPITAL_PROTOCOLS_BY_FACILITY[protocol.facilityId].includes(protocol),
      ).toBe(true);
    }
  });

  it('resolves protocol page slugs within their hospital', () => {
    const hjhStroke = findHospitalProtocol('hjh', 'acute_ischaemic_stroke');
    const cmjahStroke = findHospitalProtocol('cmjah', 'acute_ischaemic_stroke');

    expect(hjhStroke?.title).toBe('Acute Ischaemic Stroke');
    expect(cmjahStroke?.title).toBe('ACUTE ISCHAEMIC STROKE');
    expect(hjhStroke?.id).not.toBe(cmjahStroke?.id);
  });

  it('resolves pointer-only pages to complete same-facility protocol content', () => {
    const acsWorkup = findHospitalProtocol('hjh', 'acs_workup_algorithm');
    expect(acsWorkup).toBeDefined();

    const parent = findReferencedHospitalProtocol(acsWorkup!);
    expect(parent?.facilityId).toBe('hjh');
    expect(parent?.slug).toBe('acute_coronary_syndrome_acs_algorithm');
    expect(hasProtocolContent(parent!)).toBe(true);
  });

  it('offers only pages that contain or resolve to clinical content', () => {
    for (const protocols of Object.values(HOSPITAL_VISIBLE_PROTOCOLS_BY_FACILITY)) {
      for (const protocol of protocols) {
        expect(
          hasProtocolContent(protocol) ||
          Boolean(findReferencedHospitalProtocol(protocol)),
        ).toBe(true);
      }
    }
  });

  it('correctly categorizes mental healthcare users, NIV, ventilator guidelines and ENT emergencies', () => {
    const mhcu = findHospitalProtocol('hjh', 'mental_health_psychosis');
    const niv = findHospitalProtocol('hjh', 'non_invasive_ventilation');
    const vent = findHospitalProtocol('hjh', 'ventilator_guidelines');
    const ent = findHospitalProtocol('hjh', 'ent_emergencies');

    expect(mhcu?.categoryLabel).toBe('Psychiatry & Mental Health');
    expect(niv?.categoryLabel).toBe('Airway & Ventilation');
    expect(vent?.categoryLabel).toBe('Airway & Ventilation');
    expect(ent?.categoryLabel).toBe('ENT (Ear, Nose & Throat)');
  });

  it('applies the complete supplied HJH category assignment table', () => {
    const hjhProtocols = HOSPITAL_PROTOCOLS_BY_FACILITY.hjh;
    const categoryCounts = Object.fromEntries(
      [...new Set(hjhProtocols.map(protocol => protocol.categoryId))]
        .sort()
        .map(categoryId => [
          categoryId,
          hjhProtocols.filter(protocol => protocol.categoryId === categoryId).length,
        ]),
    );

    expect(Object.keys(HJH_PROTOCOL_CATEGORY_ASSIGNMENTS)).toHaveLength(95);
    for (const [slug, categoryId] of Object.entries(
      HJH_PROTOCOL_CATEGORY_ASSIGNMENTS,
    )) {
      expect(findHospitalProtocol('hjh', slug)?.categoryId).toBe(categoryId);
    }
    expect(
      hjhProtocols
        .filter(protocol => !HJH_PROTOCOL_CATEGORY_ASSIGNMENTS[protocol.slug])
        .map(protocol => protocol.slug)
        .sort(),
    ).toEqual(['burns', 'head_injury']);
    expect(categoryCounts).toEqual({
      '02_ed_trauma_ortho': 5,
      '03_ed_cardiovascular': 14,
      '04_ed_neurology': 8,
      '05_ed_pulmonary': 7,
      '06_ed_airway': 5,
      '07_ed_ent': 1,
      '08_ed_obstetrics_gynaecology': 2,
      '11_ed_medical_emergencies': 8,
      '12_ed_toxicology': 15,
      '13_ed_infectious_diseases': 5,
      '13_ed_trauma_surgical': 2,
      '14_ed_metabolic': 9,
      '14_ed_psychiatry': 2,
      '15_ed_general_surgery': 4,
      '15_ed_procedures': 3,
      '16_ed_administration': 2,
      '17_ed_critical_care': 5,
    });
  });

  it('assigns every CMJAH and RMMCH protocol to a specific clinical category', () => {
    for (const facilityId of ['cmjah', 'rmmch'] as const) {
      const protocols = HOSPITAL_PROTOCOLS_BY_FACILITY[facilityId];
      const assignments = FACILITY_PROTOCOL_CATEGORY_ASSIGNMENTS[facilityId];

      expect(Object.keys(assignments)).toHaveLength(protocols.length);
      expect(
        protocols
          .filter(protocol => !assignments[protocol.slug])
          .map(protocol => protocol.slug),
      ).toEqual([]);
      for (const protocol of protocols) {
        expect(protocol.categoryId).toBe(assignments[protocol.slug]);
      }
    }
  });

  it('retains CHBAH medication-specific categories', () => {
    const chbah = HOSPITAL_PROTOCOLS_BY_FACILITY.chbah;
    const counts = Object.fromEntries(
      [...new Set(chbah.map(protocol => protocol.categoryId))]
        .sort()
        .map(categoryId => [
          categoryId,
          chbah.filter(protocol => protocol.categoryId === categoryId).length,
        ]),
    );

    expect(FACILITY_PROTOCOL_CATEGORY_ASSIGNMENTS.chbah).toEqual({});
    expect(counts).toEqual({
      airway: 5,
      antimicrobials: 33,
      cardiovascular: 5,
      metabolic: 6,
      neurology: 3,
      resuscitation: 5,
      sedation: 11,
    });
  });

  it('overlays reviewed corrections without modifying the supplied archive mirror', () => {
    const mhcu = findHospitalProtocol('hjh', 'mental_health_psychosis');
    const niv = findHospitalProtocol('hjh', 'non_invasive_ventilation');
    const vent = findHospitalProtocol('hjh', 'ventilator_guidelines');
    const ent = findHospitalProtocol('hjh', 'ent_emergencies');

    expect(mhcu?.body.clinical_features).toMatchObject({
      general_approach: expect.any(Array),
    });
    expect(niv?.title).toBe('Non-Invasive Ventilation (NIV)');
    expect(vent?.title).toBe(
      'Ventilator Guidelines: Initial ED Mechanical Ventilation',
    );
    expect(ent?.title).toBe('ENT Emergencies: Epistaxis Management');
  });

  it('keeps every protocol summary concise and free of transcription line breaks', () => {
    for (const protocol of HOSPITAL_PROTOCOLS) {
      expect(protocol.summary.length).toBeLessThanOrEqual(181);
      expect(protocol.summary).not.toMatch(/[\r\n]/);
    }

    const mhcu = findHospitalProtocol('hjh', 'mental_health_psychosis');
    expect(mhcu?.summary).not.toContain('INDEX MHCU');
  });
});
