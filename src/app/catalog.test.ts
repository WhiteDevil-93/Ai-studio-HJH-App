import {afterEach, describe, expect, it} from 'vitest';
import {parseHospitalHash} from './catalog';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

const setWindowHash = (hash: string) => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {location: {hash}},
  });
};

const hideWindow = () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: undefined,
  });
};

afterEach(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow);
    return;
  }
  Reflect.deleteProperty(globalThis, 'window');
});

describe('parseHospitalHash', () => {
  it('parses #/hospital/hjh', () => {
    setWindowHash('#/hospital/hjh');
    expect(parseHospitalHash()).toEqual({facilityId: 'hjh', slug: undefined});
  });

  it('parses #/hospital/hjh/slug', () => {
    setWindowHash('#/hospital/hjh/hyperkalaemia');
    expect(parseHospitalHash()).toEqual({
      facilityId: 'hjh',
      slug: 'hyperkalaemia',
    });
  });

  it('decodes a percent-encoded slug', () => {
    setWindowHash('#/hospital/hjh/acute%20asthma');
    expect(parseHospitalHash()).toEqual({
      facilityId: 'hjh',
      slug: 'acute asthma',
    });
  });

  it('returns null for invalid hashes', () => {
    setWindowHash('#/hospital/unknown');
    expect(parseHospitalHash()).toBeNull();
    setWindowHash('#/other/hjh');
    expect(parseHospitalHash()).toBeNull();
    setWindowHash('#hospital/hjh');
    expect(parseHospitalHash()).toBeNull();
    setWindowHash('#/hospital/hjh/slug/extra');
    expect(parseHospitalHash()).toBeNull();
    setWindowHash('');
    expect(parseHospitalHash()).toBeNull();
  });

  it('returns null when window is missing', () => {
    hideWindow();
    expect(parseHospitalHash()).toBeNull();
  });
});
