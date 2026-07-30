import {describe, expect, it} from 'vitest';
import currentReference from '../trials-reference.json';
import reviewedV2Reference from '../trials-reference-v2.json';
import reviewedV3Reference from '../trials-reference-v3.json';
import suppliedV2Reference from '../../clinical-sources/raw/trials-reference-v2.json';
import suppliedV3Reference from '../../clinical-sources/raw/trials-reference-v3.json';
import {
  TRIAL_REFERENCE_ALIASES,
  TRIALS_REFERENCE,
} from './trialsReference';

const requiredTextFields = [
  'id',
  'type',
  'title',
  'reference',
  'domain',
  'the_hook',
  'if_consultant_asks',
  'killer_stat',
  'shift_action',
] as const;

describe('global trials and guidelines reference', () => {
  it('preserves all ten supplied v2 records in the raw source archive', () => {
    expect(suppliedV2Reference).toHaveLength(10);
    expect(suppliedV2Reference.map(entry => entry.id)).toEqual([
      'adapt-2hr-adp',
      'paramedic-3',
      'rivers-egdt-targets',
      'sepsis-3-equal',
      'bougie-trial',
      'reason-1',
      'sparc-trial',
      'act-global',
      'snap-regimen',
      'mams-design',
    ]);
  });

  it('adds the ten records without replacing or duplicating the existing 60', () => {
    const combined = [...currentReference, ...reviewedV2Reference];
    const ids = combined.map(entry => entry.id);

    expect(currentReference).toHaveLength(60);
    expect(reviewedV2Reference).toHaveLength(10);
    expect(combined).toHaveLength(70);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(reviewedV2Reference.map(entry => entry.id))).toEqual(
      new Set(suppliedV2Reference.map(entry => entry.id)),
    );
  });

  it('gives every reviewed v2 card complete display data and a primary source', () => {
    for (const entry of reviewedV2Reference) {
      for (const field of requiredTextFields) {
        expect(String(entry[field]).trim(), `${entry.id}.${field}`).not.toBe('');
      }
      expect(entry.source_url, entry.id).toMatch(/^https:\/\//);
      expect(entry.evidence_status, entry.id).toMatch(
        /^(published|historical|ongoing|methodology)$/,
      );

      const displayedText = requiredTextFields
        .map(field => String(entry[field]))
        .join(' ');
      expect(displayedText, entry.id).not.toMatch(/\[[0-9,\s]+\]/);
    }
  });

  it('retains the high-risk corrections found during source review', () => {
    const byId = new Map(reviewedV2Reference.map(entry => [entry.id, entry]));

    expect(byId.get('adapt-2hr-adp')).toMatchObject({
      evidence_status: 'published',
      killer_stat: expect.stringContaining('98.9%'),
    });
    expect(byId.get('reason-1')).toMatchObject({
      type: 'observational_study',
      shift_action: expect.stringContaining('Do not use cardiac standstill as the sole reason'),
    });
    expect(byId.get('sparc-trial')).toMatchObject({
      type: 'ongoing_trial',
      evidence_status: 'ongoing',
    });
    expect(byId.get('act-global')).toMatchObject({
      type: 'ongoing_trial',
      evidence_status: 'ongoing',
    });
    expect(byId.get('snap-regimen')).toMatchObject({
      review_note: expect.stringContaining('100 mg/kg over 2 hours'),
    });
    expect(byId.get('mams-design')).toMatchObject({
      type: 'methodology',
      evidence_status: 'methodology',
    });
  });

  it('preserves all 23 supplied v3 records in the raw source archive', () => {
    expect(suppliedV3Reference).toHaveLength(23);
    expect(new Set(suppliedV3Reference.map(entry => entry.id)).size).toBe(23);
    expect(suppliedV3Reference.map(entry => entry.id)).toEqual(
      reviewedV3Reference.map(entry => entry.id),
    );
  });

  it('overlays duplicate v3 trials and adds ten new topics without duplicate runtime ids', () => {
    expect(reviewedV3Reference).toHaveLength(23);
    expect(TRIAL_REFERENCE_ALIASES).toEqual({
      'adapt-trial': 'adapt-2hr-adp',
      'process-trial': 'process-sepsis',
      'arise-trial': 'arise-sepsis',
      'promise-trial': 'promise-sepsis',
    });
    expect(TRIALS_REFERENCE).toHaveLength(80);
    expect(new Set(TRIALS_REFERENCE.map(entry => entry.id)).size).toBe(80);
  });

  it('gives every reviewed v3 card complete display data and a primary source', () => {
    for (const entry of reviewedV3Reference) {
      for (const field of requiredTextFields) {
        expect(String(entry[field]).trim(), `${entry.id}.${field}`).not.toBe('');
      }
      expect(entry.source_url, entry.id).toMatch(/^https:\/\//);
      expect(entry.evidence_status, entry.id).toMatch(
        /^(published|historical|ongoing|methodology)$/,
      );

      const displayedText = requiredTextFields
        .map(field => String(entry[field]))
        .join(' ');
      expect(displayedText, entry.id).not.toMatch(/\[[0-9,\s]+\]/);
    }
  });

  it('locks in the critical v3 source corrections', () => {
    const byId = new Map(reviewedV3Reference.map(entry => [entry.id, entry]));

    expect(byId.get('uk-rox')).toMatchObject({
      killer_stat: expect.stringContaining('35.4%'),
      review_note: expect.stringContaining('neutral'),
    });
    expect(byId.get('storm-pe')).toMatchObject({
      reference: expect.stringContaining('2026'),
      review_note: expect.stringContaining('RV/LV ratio'),
    });
    expect(byId.get('profile-trial')).toMatchObject({
      killer_stat: expect.stringContaining('interaction p=0.944'),
    });
    expect(byId.get('crash-3')).toMatchObject({
      killer_stat: expect.stringContaining('RR 0.94'),
    });
    expect(byId.get('resolve-trial')).toMatchObject({
      killer_stat: expect.stringContaining('p=0.97'),
    });
    expect(byId.get('andromeda-shock')).toMatchObject({
      killer_stat: expect.stringContaining('p=0.06'),
    });
    expect(byId.get('andromeda-shock-2')).toMatchObject({
      killer_stat: expect.stringContaining('win ratio 1.16'),
    });
  });
});
