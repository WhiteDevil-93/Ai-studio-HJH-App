import {describe, expect, it} from 'vitest';
import {
  calculateInfusionRate,
  INFUSION_DEFINITIONS,
} from './infusions';

describe('infusion rate calculations', () => {
  it('configures every HJH infusion page from 105 through 117', () => {
    const coveredPages = new Set(
      Object.values(INFUSION_DEFINITIONS)
        .filter(definition => definition.sourceId === 'hjh-ed-2026-v1')
        .flatMap(definition => definition.pdfPages),
    );
    expect([...coveredPages].sort((left, right) => left - right))
      .toEqual([105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117]);
    expect(
      Object.values(INFUSION_DEFINITIONS)
        .every(definition => definition.status === 'available'),
    ).toBe(true);
  });

  it('keeps errata-flagged calculators (ketamine, phenylephrine) exposed with an explicit source-table warning', () => {
    // The release-blocking errata register (ERR-HJH-002, ERR-HJH-003) flags
    // inconsistent printed table cells on pages 106 and 111. The shipped design
    // exposes these calculators but computes the rate from the user-confirmed
    // concentration and must warn that the printed table cells are unreliable.
    // If a future change hides the warning or silently removes it, the UI would
    // present a plausible rate with no caution - this test guards against that.
    for (const id of ['ketamine', 'phenylephrine'] as const) {
      const definition = INFUSION_DEFINITIONS[id];
      expect(definition.status).toBe('available');
      expect(
        definition.warnings.some(warning =>
          /concentration|table/i.test(warning),
        ),
      ).toBe(true);
    }
  });

  it('matches the HJH adrenaline table for 70 kg at 0.05 mcg/kg/min', () => {
    const result = calculateInfusionRate(INFUSION_DEFINITIONS.adrenaline, {
      dose: 0.05,
      concentration: 0.06,
      weight: 70,
    });
    expect(result.mlPerHour).toBeCloseTo(3.5, 8);
  });

  it('matches the HJH dobutamine table for 70 kg at 2.5 mcg/kg/min', () => {
    const result = calculateInfusionRate(INFUSION_DEFINITIONS.dobutamine, {
      dose: 2.5,
      concentration: 1.25,
      weight: 70,
    });
    expect(result.mlPerHour).toBeCloseTo(8.4, 8);
  });

  it('derives phenylephrine from the stated concentration instead of inconsistent table cells', () => {
    const result = calculateInfusionRate(INFUSION_DEFINITIONS.phenylephrine, {
      dose: 0.1,
      concentration: 0.1,
      weight: 70,
    });
    expect(result.mlPerHour).toBeCloseTo(4.2, 8);
  });

  it('does not assume a patient weight', () => {
    expect(() =>
      calculateInfusionRate(INFUSION_DEFINITIONS.adrenaline, {
        dose: 0.05,
        concentration: 0.06,
      }),
    ).toThrow('A patient weight is required');
  });

  it('calculates propofol from the explicitly entered concentration', () => {
    expect(calculateInfusionRate(INFUSION_DEFINITIONS.propofol, {
      dose: 1,
      concentration: 20,
      weight: 70,
    }).mlPerHour).toBeCloseTo(3.5, 8);
    expect(calculateInfusionRate(INFUSION_DEFINITIONS.propofol, {
      dose: 1,
      concentration: 10,
      weight: 70,
    }).mlPerHour).toBeCloseTo(7, 8);
  });

  it('retains the Bara noradrenaline definition', () => {
    const result = calculateInfusionRate(INFUSION_DEFINITIONS.noradrenaline, {
      dose: 0.05,
      concentration: 0.05,
      weight: 70,
    });
    expect(result.mlPerHour).toBeCloseTo(4.2, 8);
  });

  it('calculates unit-based and mg-per-minute infusions', () => {
    const unitDefinition = {
      ...INFUSION_DEFINITIONS.noradrenaline,
      doseUnit: 'units/kg/hr' as const,
      concentrationUnit: 'units/mL' as const,
    };
    expect(calculateInfusionRate(unitDefinition, {
      dose: 18,
      concentration: 500,
      weight: 70,
    }).mlPerHour).toBeCloseTo(2.52, 8);

    const mgMinuteDefinition = {
      ...INFUSION_DEFINITIONS.noradrenaline,
      doseUnit: 'mg/kg/min' as const,
    };
    expect(calculateInfusionRate(mgMinuteDefinition, {
      dose: 0.01,
      concentration: 1,
      weight: 70,
    }).mlPerHour).toBeCloseTo(42, 8);
  });

  it('flags doses outside the configured source range', () => {
    const result = calculateInfusionRate(INFUSION_DEFINITIONS.dobutamine, {
      dose: 50,
      concentration: 1.25,
      weight: 70,
    });
    expect(result.outsideRecommendedRange).toBe(true);
  });
});
