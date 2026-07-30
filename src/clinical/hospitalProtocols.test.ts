import {describe, expect, it} from 'vitest';
import {
  findReferencedHospitalProtocol,
  findHospitalProtocol,
  hasProtocolContent,
  HOSPITALS,
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

  it('keeps every protocol summary concise and free of transcription line breaks', () => {
    for (const protocol of HOSPITAL_PROTOCOLS) {
      expect(protocol.summary.length).toBeLessThanOrEqual(181);
      expect(protocol.summary).not.toMatch(/[\r\n]/);
    }

    const mhcu = findHospitalProtocol('hjh', 'mental_health_psychosis');
    expect(mhcu?.summary).not.toContain('INDEX MHCU');
  });
});
