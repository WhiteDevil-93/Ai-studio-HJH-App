import {describe, expect, it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ProtocolLandingPage} from '../components/ProtocolLandingPage';
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

    expect(Object.keys(HJH_PROTOCOL_CATEGORY_ASSIGNMENTS)).toHaveLength(97);
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
    ).toEqual([]);
    expect(categoryCounts).toEqual({
      '02_ed_trauma_ortho': 7,
      '03_ed_cardiovascular': 14,
      '04_ed_neurology': 8,
      '05_ed_pulmonary': 7,
      '06_ed_airway': 4,
      '07_ed_ent': 1,
      '08_ed_obstetrics_gynaecology': 2,
      '11_ed_medical_emergencies': 8,
      '12_ed_toxicology': 15,
      '13_ed_infectious_diseases': 5,
      '14_ed_metabolic': 9,
      '14_ed_psychiatry': 2,
      '15_ed_general_surgery': 4,
      '15_ed_procedures': 4,
      '16_ed_administration': 2,
      '17_ed_critical_care': 5,
    });
  });

  it('files burns and head injury under the same heading as the other facilities', () => {
    // The archive left these two HJH records under a trauma-surgical umbrella
    // that no other record used, splitting one topic across two headings.
    for (const [facilityId, slug] of [
      ['hjh', 'burns'],
      ['hjh', 'head_injury'],
      ['cmjah', 'burns'],
      ['rmmch', 'head_injuries'],
    ] as const) {
      expect(
        findHospitalProtocol(facilityId, slug)?.categoryLabel,
        `${facilityId}:${slug}`,
      ).toBe('Trauma & Orthopaedics');
    }
  });

  it('names one concept with one heading across facilities', () => {
    const labelsByConcept = new Map<string, Set<string>>();
    for (const protocol of HOSPITAL_PROTOCOLS) {
      const key = protocol.categoryLabel
        .toLocaleLowerCase()
        .split(/\s*&\s*/)
        .map(part => part.trim())
        .sort()
        .join(' & ');
      const labels = labelsByConcept.get(key) ?? new Set<string>();
      labels.add(protocol.categoryLabel);
      labelsByConcept.set(key, labels);
    }

    for (const [key, labels] of labelsByConcept) {
      expect([...labels], `${key} is worded more than one way`).toHaveLength(1);
    }
  });

  it('restores title characters the archive extraction dropped', () => {
    expect(findHospitalProtocol('hjh', 'ccb_bb_overdose')?.title).toBe(
      'β-Blocker & Calcium-Channel Blocker Overdose',
    );
    for (const protocol of HOSPITAL_PROTOCOLS) {
      expect(protocol.title, protocol.id).toMatch(/^[A-Za-zΑ-Ωα-ω0-9]/);
    }
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

  it('renders the HJH procedural-sedation checklist instead of pulmonary-embolism data', () => {
    const sedation = findHospitalProtocol('hjh', 'procedural_sedation');
    expect(sedation).toBeDefined();
    expect(sedation?.reviewState).toBe('reviewed-against-pdf-page-158');
    expect(sedation?.pdfPages).toEqual([158]);
    expect(sedation?.body.equipment).toEqual(
      expect.arrayContaining([
        expect.stringContaining('ETCO2'),
        expect.stringContaining('Reversal-agent vials'),
      ]),
    );
    expect(sedation?.embeddedDrugs).toHaveLength(6);
    expect(sedation?.embeddedDrugs.map(drug => drug.item)).toEqual([
      'Etomidate',
      'Ketamine',
      'Propofol',
      'Midazolam',
      'Fentanyl',
      'Ketofol',
    ]);

    const serialized = JSON.stringify(sedation);
    expect(serialized).not.toMatch(/PESI|PULMONARY EMBOLISM|ALTEPLASE/i);

    const html = renderToStaticMarkup(createElement(ProtocolLandingPage, {
      protocol: sedation!,
      onBack: () => undefined,
      onOpenProtocol: () => undefined,
      weight: '70',
      setWeight: () => undefined,
    }));
    expect(html).toContain('Pre Sedation Assessment');
    expect(html).toContain('Equipment');
    expect(html).toContain('Etomidate');
    expect(html).not.toMatch(/PESI|PULMONARY EMBOLISM|ALTEPLASE/i);
  });

  it('replaces the other confirmed cross-topic protocol payloads', () => {
    const difficultAirway = findHospitalProtocol('hjh', 'difficult_airway');
    const femoralBlock = findHospitalProtocol('hjh', 'femoral_nerve_block');
    const gastroenteritis = findHospitalProtocol('hjh', 'gastroenteritis_paediatrics');
    const vascular = findHospitalProtocol('cmjah', 'vascular_emergencies');

    expect(difficultAirway?.body.source_text).toContain('PREDICT THE DIFFICULT AIRWAY');
    expect(difficultAirway?.body.source_text).not.toContain('HINTS EXAM');
    expect(difficultAirway?.body.source_image).toBe(
      '/clinical-sources/hjh/difficult-airway-surgical-airway.jpg',
    );

    expect(femoralBlock?.body.source_text).toContain(
      'ULTRASOUND GUIDED FEMORAL NERVE BLOCK',
    );
    expect(femoralBlock?.body.source_text).not.toContain('Haematemesis');

    expect(gastroenteritis?.body.source_text).toContain('SIGNS OF DEHYDRATION');
    expect(gastroenteritis?.body.source_text).toContain('Oral rehydration solution');

    expect(vascular?.body.source_text).toContain('VASCULAR EMERGENCIES');
    expect(vascular?.body.source_text).toContain('ABDOMINAL AORTIC ANEURYSM');
  });

  it('renders CMJAH image-only references instead of table-of-contents text', () => {
    const pefr = findHospitalProtocol('cmjah', 'asthma_pefr');
    const nomogram = findHospitalProtocol('cmjah', 'paracetamol_nomogram');

    expect(pefr?.title).toBe('Asthma PEFR Normal Values');
    expect(pefr?.body.source_image).toBe(
      '/clinical-sources/cmjah/asthma-pefr-normal-values.jpg',
    );
    expect(nomogram?.title).toBe('Paracetamol Treatment Nomogram');
    expect(nomogram?.body.source_image).toBe(
      '/clinical-sources/cmjah/paracetamol-treatment-nomogram.png',
    );
    expect(JSON.stringify({pefr, nomogram})).not.toContain(
      'Acetylcholinesterase Inhibitor Overdose',
    );

    const html = renderToStaticMarkup(createElement(ProtocolLandingPage, {
      protocol: nomogram!,
      onBack: () => undefined,
      onOpenProtocol: () => undefined,
      weight: '70',
      setWeight: () => undefined,
    }));
    expect(html).toContain('Facility source image');
    expect(html).toContain('Open full-size source image');
    expect(html).toContain('/clinical-sources/cmjah/paracetamol-treatment-nomogram.png');
  });

  it('has no identical long clinical payloads attached to unrelated facility protocols', () => {
    for (const [facilityId, facilityProtocols] of Object.entries(
      HOSPITAL_PROTOCOLS_BY_FACILITY,
    )) {
      const occurrences = new Map<string, Set<string>>();
      const collectLongStrings = (value: unknown, protocolId: string) => {
        if (typeof value === 'string') {
          const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim();
          if (normalized.length >= 500) {
            const protocols = occurrences.get(normalized) ?? new Set<string>();
            protocols.add(protocolId);
            occurrences.set(normalized, protocols);
          }
          return;
        }
        if (Array.isArray(value)) {
          value.forEach(entry => collectLongStrings(entry, protocolId));
          return;
        }
        if (value && typeof value === 'object') {
          Object.values(value).forEach(entry => collectLongStrings(entry, protocolId));
        }
      };

      for (const protocol of facilityProtocols) {
        collectLongStrings(protocol.body, protocol.id);
        collectLongStrings(protocol.embeddedDrugs, protocol.id);
      }

      const collisions = [...occurrences.values()]
        .filter(protocolIds => protocolIds.size > 1)
        .map(protocolIds => [...protocolIds].sort());
      expect(collisions, facilityId).toEqual([]);
    }
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
