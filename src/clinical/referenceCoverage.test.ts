import {describe, expect, it} from 'vitest';
import {clinicalData} from './legacyAdapter';
import type {CanonicalEntryFile, LegacyClinicalRecord} from './entryNormalize';
import {applyScoreCorrection, scoreCorrectionFor} from './scoreCorrections';

interface SuppliedReferenceFile {
  _meta: {
    id: string;
    type: 'drug' | 'calculator';
    category: string;
    subcategory?: string;
    title: string;
  };
  drug?: LegacyClinicalRecord;
  calculator?: Record<string, unknown>;
}

const suppliedReferenceFiles = import.meta.glob<SuppliedReferenceFile>(
  '../../clinical-sources/raw/all_hospitals_protocols/reference/**/*.json',
  {eager: true, import: 'default'},
);

const canonicalEntryFiles = import.meta.glob<CanonicalEntryFile>(
  './entries/**/*.json',
  {eager: true, import: 'default'},
);

const canonicalPathFor = (supplied: SuppliedReferenceFile): string => {
  const categoryId = supplied._meta.category;
  if (supplied.calculator) {
    return `./entries/${categoryId}/${supplied._meta.id}.json`;
  }

  const subcategoryId = supplied._meta.subcategory;
  if (!subcategoryId) {
    throw new Error(`${supplied._meta.id}: supplied drug has no subcategory`);
  }
  const slug = supplied._meta.id.replaceAll('_', '-');
  return `./entries/${categoryId}/${subcategoryId}/${slug}.json`;
};

describe('supplied global reference corpus', () => {
  it('retains the complete 93-drug and 16-formula inventory', () => {
    const paths = Object.keys(suppliedReferenceFiles);
    expect(paths).toHaveLength(109);
    expect(paths.filter(path => path.includes('/reference/drugs/'))).toHaveLength(93);
    expect(paths.filter(path => path.includes('/reference/formulae/'))).toHaveLength(16);
  });

  it('has an exact canonical app entry for every supplied record', () => {
    for (const supplied of Object.values(suppliedReferenceFiles)) {
      const canonical = canonicalEntryFiles[canonicalPathFor(supplied)];
      expect(canonical, supplied._meta.id).toBeDefined();
      expect(canonical.record, supplied._meta.id).toEqual(
        supplied.drug ?? supplied.calculator,
      );
    }
  });

  it('loads every supplied record into the runtime collection used by the UI', () => {
    for (const supplied of Object.values(suppliedReferenceFiles)) {
      const category = clinicalData[supplied._meta.category];
      expect(category, supplied._meta.id).toBeDefined();

      if (supplied.calculator) {
        // Effective runtime record = supplied raw record + any reviewed
        // correction overlay. Most calculators have no correction (identity),
        // so runtime still equals raw; corrected ones equal raw+overlay.
        const expected = applyScoreCorrection(
          supplied.calculator as LegacyClinicalRecord,
          scoreCorrectionFor(supplied._meta.category, supplied._meta.id),
        );
        expect(category[supplied._meta.id], supplied._meta.id).toEqual(expected);
        continue;
      }

      const subcategoryId = supplied._meta.subcategory!;
      const records = category[subcategoryId] as LegacyClinicalRecord[];
      const expectedId = [
        supplied._meta.category,
        subcategoryId,
        supplied._meta.id.replaceAll('_', '-'),
      ].join('.');
      const runtimeRecord = records.find(record => record._meta?.id === expectedId);
      expect(runtimeRecord, supplied._meta.id).toBeDefined();

      const {_meta: _runtimeMetadata, ...runtimeBody} = runtimeRecord!;
      expect(runtimeBody, supplied._meta.id).toEqual(supplied.drug);
    }
  });

  it('gives every supplied formula a renderable interactive schema', () => {
    const formulae = Object.values(suppliedReferenceFiles)
      .filter((file): file is SuppliedReferenceFile & {calculator: Record<string, unknown>} =>
        Boolean(file.calculator),
      );

    for (const supplied of formulae) {
      const calculator = supplied.calculator;
      const isFormula = calculator.calculator_type === 'formula';
      const hasFormulaInputs =
        isFormula &&
        typeof calculator.formula_id === 'string' &&
        Array.isArray(calculator.inputs) &&
        calculator.inputs.length > 0;
      const hasScoreComponents =
        !isFormula &&
        Array.isArray(calculator.components) &&
        calculator.components.length > 0;

      expect(
        hasFormulaInputs || hasScoreComponents,
        supplied._meta.id,
      ).toBe(true);
    }
  });
});
