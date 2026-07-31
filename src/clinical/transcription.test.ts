import {describe, expect, it} from 'vitest';
import {legibleTranscriptionLines, structureTranscription} from './transcription';
import {HOSPITAL_PROTOCOLS} from './hospitalProtocols';

describe('structureTranscription', () => {
  it('returns nothing for empty transcriptions', () => {
    expect(structureTranscription('')).toEqual([]);
    expect(structureTranscription('   \n \n')).toEqual([]);
  });

  it('groups points under the upper-case heading that introduces them', () => {
    const sections = structureTranscription(
      [
        'HIGH RISK CLINICAL FEATURES',
        '* Extremes of age',
        '* Diabetes',
        'GENERAL APPROACH',
        '* Rapid ABC assessment',
      ].join('\n'),
    );

    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe('HIGH RISK CLINICAL FEATURES');
    expect(sections[0].blocks.map(block => block.text)).toEqual([
      'Extremes of age',
      'Diabetes',
    ]);
    expect(sections[1].heading).toBe('GENERAL APPROACH');
    expect(sections[1].blocks.map(block => block.text)).toEqual([
      'Rapid ABC assessment',
    ]);
  });

  it('rejoins a point that the extraction wrapped across lines', () => {
    const sections = structureTranscription(
      [
        'HYPERTHYROIDISM',
        '* History: Fatigue, palpitations, heat intolerance, anxiety, weight loss',
        'despite increased appetite, pathological fractures 2nd to',
        'osteoporosis. May be misdiagnosed as psychological condition',
        '* Examination: Tremor, pre-tibial oedema',
      ].join('\n'),
    );

    expect(sections[0].blocks).toHaveLength(2);
    expect(sections[0].blocks[0]).toEqual({
      kind: 'bullet',
      level: 0,
      label: 'History',
      text:
        'Fatigue, palpitations, heat intolerance, anxiety, weight loss despite ' +
        'increased appetite, pathological fractures 2nd to osteoporosis. ' +
        'May be misdiagnosed as psychological condition',
    });
    expect(sections[0].blocks[1].label).toBe('Examination');
  });

  it('reattaches bullet glyphs that were extracted onto their own line', () => {
    const sections = structureTranscription(
      ['HIGH RISK', '•', 'Extremes of age', '•', 'Diabetes'].join('\n'),
    );

    expect(sections[0].blocks).toEqual([
      {kind: 'bullet', level: 0, text: 'Extremes of age'},
      {kind: 'bullet', level: 0, text: 'Diabetes'},
    ]);
  });

  it('strips a glyph marker that abuts its text', () => {
    const sections = structureTranscription(
      ['HYPOTHYROIDISM', '*History: Cold intolerance', '*Examination: Dry skin'].join('\n'),
    );

    expect(sections[0].blocks).toEqual([
      {kind: 'bullet', level: 0, label: 'History', text: 'Cold intolerance'},
      {kind: 'bullet', level: 0, label: 'Examination', text: 'Dry skin'},
    ]);
  });

  it('treats a glyph-marked upper-case line as the heading it is', () => {
    const sections = structureTranscription(
      ['*THYROID STORM', '* Burch-Wartofsky score', '*ACUTE MANAGEMENT', '* Resuscitate'].join(
        '\n',
      ),
    );

    expect(sections.map(section => section.heading)).toEqual([
      'THYROID STORM',
      'ACUTE MANAGEMENT',
    ]);
  });

  it('keeps a numbered step a step rather than a heading', () => {
    const sections = structureTranscription(['STEPS', '1. ASSESS AIRWAY', '2. Give oxygen'].join('\n'));

    expect(sections).toHaveLength(1);
    expect(sections[0].blocks[0]).toEqual({
      kind: 'bullet',
      level: 0,
      marker: '1.',
      text: 'ASSESS AIRWAY',
    });
  });

  it('does not mistake a decimal dose for a numbered step', () => {
    const sections = structureTranscription(['DOSE', '1.5mg IV stat'].join('\n'));

    expect(sections[0].blocks[0].marker).toBeUndefined();
    expect(sections[0].blocks[0].text).toBe('1.5mg IV stat');
  });

  it('keeps indented sub-points at a deeper level', () => {
    const sections = structureTranscription(
      [
        'ST SEGMENT CRITERIA',
        '* J-point elevation in men',
        '    - 2mm in leads V2 and V3',
        '    - 1mm in all other leads',
      ].join('\n'),
    );

    expect(sections[0].blocks.map(block => block.level)).toEqual([0, 1, 1]);
    expect(sections[0].blocks[1].text).toBe('2mm in leads V2 and V3');
  });

  it('treats a mixed-case emphatic line as prose rather than a heading', () => {
    const sections = structureTranscription(
      ['STEMI', 'TIME IS MUSCLE – do not delay reperfusion', '* Reperfuse early'].join('\n'),
    );

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe('STEMI');
    expect(sections[0].blocks[0]).toEqual({
      kind: 'paragraph',
      level: 0,
      text: 'TIME IS MUSCLE – do not delay reperfusion',
    });
  });

  it('marks a shouted instruction as a directive rather than a heading', () => {
    const sections = structureTranscription(
      ['COMPLICATIONS', 'STOP TRANSFUSION IMMEDIATELY!', '* Send bloods'].join('\n'),
    );

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe('COMPLICATIONS');
    expect(sections[0].blocks[0]).toEqual({
      kind: 'paragraph',
      level: 0,
      text: 'STOP TRANSFUSION IMMEDIATELY!',
      tone: 'directive',
    });
  });

  it('labels an upper-case caption without dressing it as a warning', () => {
    const sections = structureTranscription(
      ['RV INFARCTION', 'HYPERTROPHY', '* Left axis deviation'].join('\n'),
    );

    expect(sections[0].blocks[0]).toEqual({
      kind: 'paragraph',
      level: 0,
      text: 'RV INFARCTION',
      tone: 'label',
    });
    expect(sections[1].heading).toBe('HYPERTROPHY');
  });

  it('drops a leading heading that only repeats the protocol title', () => {
    const sections = structureTranscription(
      ['THYROID EMERGENCIES', 'HYPERTHYROIDISM', '* Tremor'].join('\n'),
      {omitHeading: 'Thyroid Emergencies'},
    );

    expect(sections.map(section => section.heading)).toEqual(['HYPERTHYROIDISM']);
  });

  it('keeps content that sat under a title-repeating heading', () => {
    const sections = structureTranscription(
      [
        'MANAGEMENT OF MYOCARDIAL INFARCTION: STEMI',
        'TIME IS MUSCLE – do not delay reperfusion',
        'STEMI',
        '* ST elevation in 2 or more contiguous leads',
      ].join('\n'),
      {omitHeading: 'Management of Myocardial Infarction: STEMI'},
    );

    expect(sections[0].heading).toBeNull();
    expect(sections[0].blocks[0].text).toBe('TIME IS MUSCLE – do not delay reperfusion');
    expect(sections[1].heading).toBe('STEMI');
  });

  it('keeps the title heading when it is the only one carrying content', () => {
    const sections = structureTranscription(['THYROID EMERGENCIES', '* Tremor'].join('\n'), {
      omitHeading: 'Thyroid Emergencies',
    });

    expect(sections.map(section => section.heading)).toEqual(['THYROID EMERGENCIES']);
  });

  it('never emits a heading with nothing beneath it', () => {
    const sections = structureTranscription(
      ['FIRST', 'SECOND', '* Only point'].join('\n'),
    );

    expect(sections.every(section => section.blocks.length > 0)).toBe(true);
  });

  it('drops unreadable control-byte lines but keeps the legible ones', () => {
    const damaged = ['Head injuries', 'CTB Protocol', '', '\t789'];

    expect(legibleTranscriptionLines(damaged.join('\n'))).toEqual([
      'Head injuries',
      'CTB Protocol',
    ]);
  });

  it('rejects stray symbol residue without touching short clinical fragments', () => {
    expect(
      legibleTranscriptionLines(
        ['+-', '&"4= +4 &6 +4=+ 4- 4/ >/- /"? L 4"=+ " / " =+BL6,'].join('\n'),
      ),
    ).toEqual([]);

    for (const kept of ['120', '80', 'ECG', '+/- 5mg', '2mm in leads V2 and V3']) {
      expect(legibleTranscriptionLines(kept), kept).toEqual([kept]);
    }
  });

  it('keeps the numeric rows of an infusion rate table', () => {
    // These rows are almost entirely digits; a letter-count rule would delete
    // every dose in the chart and leave only its headers behind.
    const rows = [
      '0.05 2 2.5 3 3.5 4 4.5 5 5.5 6',
      '1 40 50 60 70 80 90 100 110 120',
      '2.5 4.8 6 7.2 8.4 9.6 10.8 12 13.2 14.4',
      '• 200 – 600 mg PO',
    ];

    expect(legibleTranscriptionLines(rows.join('\n'))).toEqual(rows);
  });

  it('rebuilds a table row that arrived one cell per line', () => {
    const sections = structureTranscription(
      ['Weight (kg)', '40', '50', '60', '70', 'Rate is in ml/hr'].join('\n'),
    );

    expect(sections[0].blocks.map(block => [block.text, block.tone])).toEqual([
      ['Weight (kg)', undefined],
      ['40 50 60 70', 'data'],
      ['Rate is in ml/hr', undefined],
    ]);
  });

  it('keeps numbered steps out of the table-row grouping', () => {
    const sections = structureTranscription(['STEPS', '1. Assess', '2. Treat'].join('\n'));

    expect(sections[0].blocks.map(block => [block.marker, block.text])).toEqual([
      ['1.', 'Assess'],
      ['2.', 'Treat'],
    ]);
  });

  it('does not join cells across a heading', () => {
    const sections = structureTranscription(['DOSE', '40', 'RATE', '60'].join('\n'));

    expect(sections.map(section => [section.heading, section.blocks[0].text])).toEqual([
      ['DOSE', '40'],
      ['RATE', '60'],
    ]);
  });

  it('renders both outcomes of a decision branch as siblings', () => {
    const sections = structureTranscription(
      ['NO', 'YES', 'NO', 'YES TO ALL', 'NO TO ANY'].join('\n'),
    );

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBeNull();
    expect(sections[0].blocks.map(block => [block.text, block.tone])).toEqual([
      ['NO', 'branch'],
      ['YES', 'branch'],
      ['NO', 'branch'],
      ['YES TO ALL', 'branch'],
      ['NO TO ANY', 'branch'],
    ]);
  });

  it('treats a mandatory upper-case instruction as a directive without an exclamation mark', () => {
    const sections = structureTranscription(
      [
        'ALL FEMALE PATIENTS MUST HAVE A PREGNANCY TEST DOCUMENTED',
        'MANAGEMENT',
        '* Sedate as required',
      ].join('\n'),
    );

    expect(sections[0].blocks[0]).toEqual({
      kind: 'paragraph',
      level: 0,
      text: 'ALL FEMALE PATIENTS MUST HAVE A PREGNANCY TEST DOCUMENTED',
      tone: 'directive',
    });
    expect(sections[1].heading).toBe('MANAGEMENT');
  });

  it('reads a bare `o` glyph as the second-level bullet these documents use', () => {
    const sections = structureTranscription(
      [
        'HIGH-RISK FACTORS',
        '• Dangerous mechanism of injury:',
        'o Pedestrian struck by vehicle',
        'o Fall from height > 1m',
      ].join('\n'),
    );

    expect(sections[0].blocks.map(block => [block.level, block.text])).toEqual([
      [0, 'Dangerous mechanism of injury:'],
      [1, 'Pedestrian struck by vehicle'],
      [1, 'Fall from height > 1m'],
    ]);
  });

  it('preserves every legible word of the supplied transcriptions', () => {
    const wordsIn = (value: string) => value.toLowerCase().match(/[a-z0-9]+/g) ?? [];

    for (const protocol of HOSPITAL_PROTOCOLS) {
      const sourceText = protocol.body.source_text;
      if (typeof sourceText !== 'string' || !sourceText.trim()) continue;

      const rendered = structureTranscription(sourceText)
        .flatMap(section => [
          section.heading ?? '',
          ...section.blocks.map(
            block => `${block.marker ?? ''} ${block.label ?? ''} ${block.text}`,
          ),
        ])
        .join(' ');

      // Bullet glyphs are markers rather than words. Every glyph but `o` is
      // punctuation and so never tokenises; `o` has to be dropped explicitly,
      // matching the rule the structurer applies.
      const expected = legibleTranscriptionLines(sourceText)
        .map(line => line.trim().replace(/^o\s+(?=[A-Z0-9])/, ''))
        .join(' ');

      expect(wordsIn(rendered), `${protocol.id} lost transcription content`).toEqual(
        wordsIn(expected),
      );
    }
  });

  it('structures every supplied transcription into at least one section', () => {
    const transcribed = HOSPITAL_PROTOCOLS.filter(
      protocol =>
        typeof protocol.body.source_text === 'string' &&
        protocol.body.source_text.trim().length > 0,
    );

    expect(transcribed.length).toBeGreaterThan(100);
    for (const protocol of transcribed) {
      const sections = structureTranscription(protocol.body.source_text as string, {
        omitHeading: protocol.title,
      });
      expect(sections.length, `${protocol.id} produced no sections`).toBeGreaterThan(0);
    }
  });
});
