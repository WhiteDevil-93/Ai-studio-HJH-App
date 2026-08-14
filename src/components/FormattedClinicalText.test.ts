import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FormattedClinicalText} from './FormattedClinicalText';
import {findHospitalProtocol} from '../clinical/hospitalProtocols';
import {parseProtocolBlocks} from '../clinical/protocolBlocks';

const render = (text: string, highlight?: string) =>
  renderToStaticMarkup(createElement(FormattedClinicalText, {text, highlight}));

const CHIP_CLASSES = [
  'border-rose-300',
  'bg-rose-100',
  'text-rose-950',
  'border-emerald-300',
  'bg-emerald-100',
  'text-emerald-950',
  'text-emerald-500',
];

const HEADING_CLASSES = [
  'uppercase tracking-wider text-indigo-600',
  'border-b border-indigo-100',
];

describe('FormattedClinicalText', () => {
  it('renders YES and NO as plain content, not danger or safe chips', () => {
    const html = render('YES\nNO\nYES TO ALL\nNO TO ANY');

    expect(html).toContain('YES');
    expect(html).toContain('NO');
    expect(html).toContain('YES TO ALL');
    expect(html).toContain('NO TO ANY');
    expect(html).not.toContain('<h4');
    for (const className of CHIP_CLASSES) {
      expect(html, className).not.toContain(className);
    }
  });

  it('does not promote uppercase lines or warning prefixes to headings or alerts', () => {
    const html = render(
      [
        'MANAGEMENT',
        'RED FLAGS',
        'WARNING: Do not delay reperfusion',
        'ALL FEMALE PATIENTS MUST HAVE A PREGNANCY TEST DOCUMENTED',
        'CONTRAINDICATIONS',
      ].join('\n'),
    );

    expect(html).toContain('MANAGEMENT');
    expect(html).toContain('RED FLAGS');
    expect(html).toContain('WARNING: Do not delay reperfusion');
    expect(html).toContain('ALL FEMALE PATIENTS MUST HAVE A PREGNANCY TEST DOCUMENTED');
    expect(html).toContain('CONTRAINDICATIONS');
    expect(html).not.toContain('<h4');
    expect(html).not.toContain('lucide-triangle-alert');
    for (const className of HEADING_CLASSES) {
      expect(html, className).not.toContain(className);
    }
    for (const className of CHIP_CLASSES) {
      expect(html, className).not.toContain(className);
    }
  });

  it('keeps numbered markers instead of stripping them or substituting checkmarks', () => {
    const html = render(
      ['1. Anyone DIRECTLY EXPOSED', '2. HOUSEHOLD MEMBERS', 'a) Kissing'].join('\n'),
    );

    expect(html).toContain('data-protocol-marker="1."');
    expect(html).toContain('data-protocol-marker="2."');
    expect(html).toContain('data-protocol-marker="a)"');
    expect(html).toContain('Anyone DIRECTLY EXPOSED');
    expect(html).toContain('HOUSEHOLD MEMBERS');
    expect(html).toContain('Kissing');
    expect(html).not.toContain('lucide-circle-check');
    expect(html).not.toContain('text-emerald-500');
  });

  it('preserves indent hierarchy for sub-points', () => {
    const html = render(
      [
        '• Dangerous mechanism of injury:',
        '    - Pedestrian struck by vehicle',
        '    - Fall from height > 1m',
      ].join('\n'),
    );

    expect(html).toContain('data-protocol-level="0"');
    expect(html).toContain('data-protocol-level="1"');
    expect(html).toContain('data-protocol-marker="•"');
    expect(html).toContain('data-protocol-marker="-"');
    expect(html).toContain('Dangerous mechanism of injury:');
    expect(html).toContain('Pedestrian struck by vehicle');
    expect(html).toContain('Fall from height &gt; 1m');
  });

  it('renders HJH C-spine imaging YES/NO tokens as plain protocol content', () => {
    const protocol = findHospitalProtocol('hjh', 'c_spine_imaging');
    expect(protocol).toBeDefined();
    const sourceText = String(protocol!.body.source_text);
    const html = render(sourceText);

    expect(html).toContain('YES');
    expect(html).toContain('NO');
    expect(html).toContain('YES TO ALL');
    expect(html).toContain('NO TO ANY');
    expect(html).toContain('CANADIAN C-SPINE RULE');
    expect(html).toContain('Age &gt; 65');
    expect(html).not.toContain('<h4');
    for (const className of CHIP_CLASSES) {
      expect(html, className).not.toContain(className);
    }
  });

  it('preserves numbering and order for the meningococcal close-contact list', () => {
    const protocol = findHospitalProtocol('hjh', 'meningococcal_prophylaxis');
    expect(protocol).toBeDefined();
    const sourceText = String(protocol!.body.source_text);
    const html = render(sourceText);
    const blocks = parseProtocolBlocks(sourceText);

    const firstFour = blocks
      .filter(block => /^[1-4]\.$/.test(block.marker ?? ''))
      .slice(0, 4);
    expect(firstFour.map(block => [block.marker, block.text])).toEqual([
      ['1.', expect.stringContaining('Anyone DIRECTLY EXPOSED')],
      ['2.', expect.stringContaining('HOUSEHOLD MEMBERS')],
      ['3.', expect.stringContaining('INSTITUTIONAL CONTACTS')],
      ['4.', expect.stringContaining('NURSERY SCHOOL')],
    ]);
    expect(html.indexOf('Anyone DIRECTLY EXPOSED')).toBeLessThan(html.indexOf('HOUSEHOLD MEMBERS'));
    expect(html.indexOf('HOUSEHOLD MEMBERS')).toBeLessThan(html.indexOf('INSTITUTIONAL CONTACTS'));
    expect(html.indexOf('INSTITUTIONAL CONTACTS')).toBeLessThan(html.indexOf('NURSERY SCHOOL'));
    expect(html).toContain('data-protocol-marker="1."');
    expect(html).toContain('data-protocol-marker="a)"');
    expect(html).toContain('Kissing');
  });

  it('keeps hyperkalaemia source wording including uppercase labels', () => {
    const protocol = findHospitalProtocol('hjh', 'hyperkalaemia');
    expect(protocol).toBeDefined();
    const sourceText = String(protocol!.body.source_text);
    const html = render(sourceText);

    expect(html).toContain('CAUSES');
    expect(html).toContain('ECG CHANGES');
    expect(html).toContain('1mEq/kg = 1ml/kg');
    expect(html).toContain('NORMAL ANION GAP METABOLIC ACIDOSIS');
    expect(html.indexOf('CAUSES')).toBeLessThan(html.indexOf('ECG CHANGES'));
    expect(html).not.toContain('<h4');
    expect(html).not.toContain('lucide-circle-check');
  });
});
