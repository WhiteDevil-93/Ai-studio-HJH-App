import {describe, expect, it} from 'vitest';
import {repairExtractionGlyphs, repairGlyphsDeep} from './glyphRepair';
import {HOSPITAL_PROTOCOLS} from './hospitalProtocols';

/** Builds the Private Use Area codepoint the extraction emitted for a font byte. */
const pua = (byte: number) => String.fromCharCode(0xf000 + byte);

describe('repairExtractionGlyphs', () => {
  it('restores symbols that rendered as nothing at all', () => {
    // Each phrase is taken from the archive; before the repair the glyph is a
    // blank box, so the dose or comparison it carries is simply missing.
    const cases: ReadonlyArray<readonly [string, string]> = [
      [`Fentanyl 1${pua(0x6d)}g/kg IV`, 'Fentanyl 1µg/kg IV'],
      [`Esmolol 250-500${pua(0x6d)}g/kg IV`, 'Esmolol 250-500µg/kg IV'],
      [`Sit patient up > 45${pua(0xb0)}`, 'Sit patient up > 45°'],
      [`Trismus 2${pua(0xb0)} orofacial infection`, 'Trismus 2° orofacial infection'],
      [`1.5 x HCO3 + 8 ${pua(0xb1)} 2 = expected CO2`, '1.5 x HCO3 + 8 ± 2 = expected CO2'],
      [`${pua(0xad)}HR ${pua(0xaf)}BP = moderate blood loss`, '↑HR ↓BP = moderate blood loss'],
      [`${pua(0xaf)}Ca2+ ${pua(0xad)}${pua(0xad)}K+`, '↓Ca2+ ↑↑K+'],
      [`Lorazepam (Ativan${pua(0xd2)})`, 'Lorazepam (Ativan®)'],
      [`Urine-${pua(0x62)}HCG on ALL female patients`, 'Urine-βHCG on ALL female patients'],
      [`${pua(0x42)} blockers`, 'β blockers'],
      [`Late patient presentation ${pua(0xb3)} 10 hrs post pain onset`,
        'Late patient presentation ≥ 10 hrs post pain onset'],
      [`Time of onset of symptoms OR max pain ${pua(0x3c)} 12 hours?`,
        'Time of onset of symptoms OR max pain < 12 hours?'],
      [`Continuous seizures for ${pua(0x3e)} 5 minutes`, 'Continuous seizures for > 5 minutes'],
      [`pH < 7.3, ${pua(0x44)} lactate`, 'pH < 7.3, Δ lactate'],
    ];

    for (const [damaged, expected] of cases) {
      expect(repairExtractionGlyphs(damaged), damaged).toBe(expected);
    }
  });

  it('restores symbols that rendered as unrelated letters', () => {
    const cases: ReadonlyArray<readonly [string, string]> = [
      ['DOOR TO NEEDLE TIME £ 30 MINUTES', 'DOOR TO NEEDLE TIME ≤ 30 MINUTES'],
      ['Continuous seizures for ³ 5 minutes', 'Continuous seizures for ≥ 5 minutes'],
      ['impaired synthetic function (INR ³ 1.5)', 'impaired synthetic function (INR ≥ 1.5)'],
      ['Partial thickness burns ³ 15% in adults', 'Partial thickness burns ≥ 15% in adults'],
      ['IV Antibiotics – AugmentinÒ 30mg/kg', 'IV Antibiotics – Augmentin® 30mg/kg'],
      ['aspiration à intubate', 'aspiration ➔ intubate'],
    ];

    for (const [damaged, expected] of cases) {
      expect(repairExtractionGlyphs(damaged), damaged).toBe(expected);
    }
  });

  it('reads ß as beta before HCG and as a down arrow elsewhere', () => {
    // Another copy of the `↓ LOC` line carries the Symbol arrow byte instead of
    // `ß`, which is what settles the second reading.
    expect(repairExtractionGlyphs('HGT, VBG, urine ßHCG, ECG')).toBe(
      'HGT, VBG, urine βHCG, ECG',
    );
    expect(repairExtractionGlyphs('Bedside investigations: urine ß-HCG for all females')).toBe(
      'Bedside investigations: urine β-HCG for all females',
    );
    expect(repairExtractionGlyphs('U-dipstix, U-ßHCG, POCUS')).toBe('U-dipstix, U-βHCG, POCUS');
    expect(repairExtractionGlyphs('- refractory hyperkalaemia - ß urine output')).toBe(
      '- refractory hyperkalaemia - ↓ urine output',
    );
    expect(repairExtractionGlyphs('• Respiratory arrest • ß LOC')).toBe(
      '• Respiratory arrest • ↓ LOC',
    );
  });

  it('reads the Wingdings list marker as a bullet', () => {
    expect(repairExtractionGlyphs(`${pua(0x71)}`)).toBe('•');
  });

  it('removes bytes whose intent could not be established rather than guessing', () => {
    // 0x3A arrived three times in place of a single glyph, so no reading of it
    // is trustworthy. Dropping it leaves the sentence readable and asserts
    // nothing the source did not say.
    expect(
      repairExtractionGlyphs(`DOOR TO NEEDLE TIME ${pua(0x3a).repeat(3)} 30 MINUTES`),
    ).toBe('DOOR TO NEEDLE TIME  30 MINUTES');
  });

  it('leaves ordinary clinical text untouched', () => {
    for (const text of [
      'Avoid temp > 36.5°C for >24 hours',
      'Adrenaline 0.5mg IM 1:1000',
      'Rate (mL/hr) = mcg/kg/min × weight × 60',
      'GCS 15 and stable',
      '',
    ]) {
      expect(repairExtractionGlyphs(text), text).toBe(text);
    }
  });

  it('repairs every string in a nested record', () => {
    expect(
      repairGlyphsDeep({
        management_steps: [{action: `Give 1${pua(0x6d)}g/kg`, nested: {note: 'INR ³ 1.5'}}],
        count: 3,
        flag: true,
        missing: null,
      }),
    ).toEqual({
      management_steps: [{action: 'Give 1µg/kg', nested: {note: 'INR ≥ 1.5'}}],
      count: 3,
      flag: true,
      missing: null,
    });
  });
});

describe('the loaded protocol corpus', () => {
  const renderedStrings = (value: unknown, into: string[] = []): string[] => {
    if (typeof value === 'string') into.push(value);
    else if (Array.isArray(value)) value.forEach(entry => renderedStrings(entry, into));
    else if (value && typeof value === 'object') {
      Object.values(value).forEach(entry => renderedStrings(entry, into));
    }
    return into;
  };

  it('shows no unreadable Private Use Area characters anywhere', () => {
    for (const protocol of HOSPITAL_PROTOCOLS) {
      for (const text of renderedStrings([protocol.body, protocol.embeddedDrugs])) {
        expect(text, `${protocol.id} still renders a blank glyph`).not.toMatch(
          /[\uf000-\uf0ff]/,
        );
      }
    }
  });

  it('no longer prints a comparison as a superscript or a currency sign', () => {
    for (const protocol of HOSPITAL_PROTOCOLS) {
      expect(protocol.searchText, protocol.id).not.toMatch(/[£³Òà]/);
    }
  });

  it('keeps the untouched archive bytes available for provenance', () => {
    const damaged = HOSPITAL_PROTOCOLS.filter(protocol =>
      renderedStrings(protocol.raw).some(text => /[\uf000-\uf0ff£³Òà]/.test(text)),
    );

    expect(damaged.length).toBeGreaterThan(0);
  });
});
