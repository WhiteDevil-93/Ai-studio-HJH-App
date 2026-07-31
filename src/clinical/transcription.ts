/**
 * Structures the verified `source_text` transcriptions into headed clinical
 * sections for display.
 *
 * The supplied archive stores each protocol's reviewed page transcription as a
 * single blob of PDF-extracted text. That extraction carries three artefacts
 * that make the text unreadable when rendered line by line:
 *
 *   1. bullet glyphs land on their own line, separated from the text they mark;
 *   2. a single clinical point wraps across several lines mid-sentence;
 *   3. section headings are distinguishable only by being upper case.
 *
 * This module reverses those artefacts. It is a presentation-layer transform
 * only: every character it emits comes from the transcription it was given, so
 * it never introduces clinical content that the reviewed source did not carry.
 */

export interface TranscriptionBlock {
  kind: 'bullet' | 'paragraph';
  /** Bold lead-in for `Label: value` lines, e.g. `History`. */
  label?: string;
  text: string;
  /** 0 for a top-level point, 1 for an indented sub-point. */
  level: number;
  /** Ordinal of a numbered step, e.g. `8.`, so ordered steps stay ordered. */
  marker?: string;
  /**
   * `directive` marks a shouted instruction such as `STOP TRANSFUSION
   * IMMEDIATELY!`. `label` marks an upper-case line that titles a run of content
   * the extraction did not keep with it — a caption, not a warning.
   */
  tone?: 'directive' | 'label';
}

export interface TranscriptionSection {
  heading: string | null;
  blocks: TranscriptionBlock[];
}

const BULLET_GLYPHS = '•▪◦‣·●■';
const ORPHAN_MARKER = new RegExp(`^[${BULLET_GLYPHS}*\\-–—]$`);
/**
 * Glyph markers frequently abut their text (`*History:`), so the separating
 * space is optional. Ordinals keep a mandatory space — without it `1.5mg` would
 * be misread as item `1.` of a list.
 */
const GLYPH_BULLET = new RegExp(`^([${BULLET_GLYPHS}]|\\*|[-–—])\\s*(\\S.*)$`);
const ORDINAL_BULLET = /^((?:\d+|[a-z])[.)])\s+(\S.*)$/;
const LABELLED = /^([A-Z][A-Za-z0-9 /&'’-]{1,40}):\s+(\S.*)$/;

/** Indent (in columns) at which a bullet is treated as a sub-point. */
const SUB_POINT_INDENT = 3;

interface RawLine {
  indent: number;
  /** Line text with any leading bullet marker removed. */
  text: string;
  /** Ordinal marker worth rendering, e.g. `8.`; glyph markers are dropped. */
  marker?: string;
  /** Whether the line carried, or inherited, a bullet marker. */
  bulleted: boolean;
}

const normalizeHeading = (value: string): string =>
  value
    .replace(/\s+/g, ' ')
    .replace(/[:\s]+$/, '')
    .trim();

const comparableHeading = (value: string): string =>
  normalizeHeading(value).toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * Upper case marks both section headings and shouted directives in the source
 * documents. Requiring several letters keeps fragments such as `NB!` out.
 */
const isUpperCaseLine = (text: string): boolean => {
  if (text.length > 70) return false;
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length < 3) return false;
  return letters === letters.toLocaleUpperCase();
};

/** A closing `!` always signals an instruction rather than a heading. */
const isDirective = (text: string): boolean => text.endsWith('!');

/**
 * A line continues the previous point when it opens the way a wrapped sentence
 * does — lower case, or punctuation that cannot start a clinical statement.
 */
const isContinuation = (text: string): boolean => /^[a-z(,;)–-]/.test(text);

/**
 * A handful of supplied pages were produced from PDFs with embedded custom font
 * encodings, so their text extracted as raw control bytes rather than letters.
 * Those bytes carry no legible clinical information; the surrounding readable
 * lines still do, so only the unreadable lines are dropped.
 */
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

/**
 * Rejects the residue those failed extractions leave behind — runs of stray
 * symbols such as `+-` or `&"4= +4 &6 +4=+ 4- 4/`. The thresholds are set so
 * that short clinical fragments (`+/- 5mg`, `120`, `ECG`) always survive.
 */
const isLegible = (text: string): boolean => {
  const letters = (text.match(/[A-Za-z]/g) ?? []).length;
  const digits = (text.match(/[0-9]/g) ?? []).length;
  if (letters === 0 && digits === 0) return false;

  const dense = text.replace(/\s/g, '').length;
  return !(letters <= 4 && dense >= 12);
};

/** Splits a transcription into the lines that carry legible text. */
export const legibleTranscriptionLines = (raw: string): string[] => {
  const lines: string[] = [];

  for (const line of raw.replace(/\r/g, '').split('\n')) {
    const hadControlBytes = CONTROL_CHARACTERS.test(line);
    const cleaned = hadControlBytes
      ? line.replace(new RegExp(CONTROL_CHARACTERS.source, 'g'), ' ')
      : line;
    const trimmed = cleaned.trim();
    if (!trimmed) continue;

    // A lone bullet glyph carries no words but still marks the line beneath it.
    if (ORPHAN_MARKER.test(trimmed)) {
      lines.push(cleaned);
      continue;
    }

    // A line the encoding failure damaged has to retain real words to be worth
    // showing; an undamaged line only has to clear the symbol-residue bar.
    if (hadControlBytes && (cleaned.match(/[A-Za-z]/g) ?? []).length < 2) continue;
    if (!isLegible(cleaned)) continue;

    lines.push(cleaned);
  }

  return lines;
};

const readLines = (raw: string): RawLine[] => {
  const lines: RawLine[] = [];
  let pendingMarker = false;

  for (const line of legibleTranscriptionLines(raw)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (ORPHAN_MARKER.test(trimmed)) {
      pendingMarker = true;
      continue;
    }

    const ordinal = ORDINAL_BULLET.exec(trimmed);
    const glyph = ordinal ? null : GLYPH_BULLET.exec(trimmed);

    lines.push({
      indent: line.length - line.trimStart().length,
      text: (ordinal?.[2] ?? glyph?.[2] ?? trimmed).trim(),
      marker: ordinal?.[1],
      bulleted: Boolean(ordinal || glyph) || pendingMarker,
    });
    pendingMarker = false;
  }

  return lines;
};

const toBlock = (line: RawLine): TranscriptionBlock => {
  const kind: TranscriptionBlock['kind'] = line.bulleted ? 'bullet' : 'paragraph';
  const level = line.bulleted && line.indent >= SUB_POINT_INDENT ? 1 : 0;

  const labelled = LABELLED.exec(line.text);
  const block: TranscriptionBlock = labelled
    ? {kind, level, label: normalizeHeading(labelled[1]), text: labelled[2].trim()}
    : {kind, level, text: line.text};

  return line.marker ? {...block, marker: line.marker} : block;
};

export interface StructureOptions {
  /**
   * Drops a leading heading that merely repeats the protocol title, which the
   * page already displays above the transcription.
   */
  omitHeading?: string;
}

export const structureTranscription = (
  raw: string,
  options: StructureOptions = {},
): TranscriptionSection[] => {
  if (!raw || !raw.trim()) return [];

  const lines = readLines(raw);
  // Headings are judged on the text alone. The source documents mark headings
  // with the same glyph they use for points, so carrying a glyph does not stop a
  // line being a heading — but a numbered item is always a step, never a heading.
  const isPlainUpperCase = (index: number): boolean => {
    const line = lines[index];
    if (!line || line.marker) return false;
    return isUpperCaseLine(line.text);
  };
  /** A directive can never become a heading, so it counts as content below one. */
  const isHeadingCandidate = (index: number): boolean =>
    isPlainUpperCase(index) && !isDirective(lines[index].text);

  const sections: TranscriptionSection[] = [];
  let current: TranscriptionSection = {heading: null, blocks: []};

  const flush = () => {
    if (current.heading !== null || current.blocks.length > 0) {
      sections.push(current);
    }
  };

  lines.forEach((line, index) => {
    if (isPlainUpperCase(index)) {
      // Only open a section when something actually sits beneath the heading.
      // Otherwise the line stays in place as a block, which keeps its wording
      // visible instead of leaving an empty header behind.
      const directive = isDirective(line.text);
      if (!directive && index + 1 < lines.length && !isHeadingCandidate(index + 1)) {
        flush();
        current = {heading: normalizeHeading(line.text), blocks: []};
      } else {
        current.blocks.push({
          kind: 'paragraph',
          level: 0,
          text: line.text,
          tone: directive ? 'directive' : 'label',
        });
      }
      return;
    }

    const previous = current.blocks[current.blocks.length - 1];
    if (!line.bulleted && previous && !previous.tone && isContinuation(line.text)) {
      previous.text = `${previous.text} ${line.text}`.replace(/\s+/g, ' ').trim();
      return;
    }

    current.blocks.push(toBlock(line));
  });

  flush();

  // The page already shows the protocol title above the transcription, so a
  // leading line that only repeats it is redundant. It reaches this point either
  // as a heading of its own or, when another heading follows it directly, as the
  // opening label of the untitled first section.
  const omit = options.omitHeading ? comparableHeading(options.omitHeading) : '';
  if (!omit || sections.length < 2) return sections;

  const [first, ...rest] = sections;

  if (first.heading !== null && comparableHeading(first.heading) === omit) {
    // Keep whatever sat under the repeated heading; only the heading goes.
    return first.blocks.length > 0 ? [{heading: null, blocks: first.blocks}, ...rest] : rest;
  }

  const repeatsTitleAsLabel =
    first.heading === null &&
    first.blocks.length === 1 &&
    Boolean(first.blocks[0].tone) &&
    comparableHeading(first.blocks[0].text) === omit;

  return repeatsTitleAsLabel ? rest : sections;
};
