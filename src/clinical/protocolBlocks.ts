/**
 * Structural display units for protocol field text.
 *
 * A ProtocolBlock records only what the source wrote as structure: document
 * order, an optional list marker, and indent depth. It does not encode
 * clinical meaning. Tokens such as YES / NO, uppercase lines, and warning
 * words remain ordinary text. The renderer must not infer chips, headings,
 * or checkmarks from those tokens.
 */

export type ProtocolBlockKind = 'paragraph' | 'item';

export interface ProtocolBlock {
  kind: ProtocolBlockKind;
  text: string;
  /** Marker as written, e.g. `1.`, `a)`, `•`. */
  marker?: string;
  /** 0 for a top-level line, 1+ for indented sub-points. */
  level: number;
}

/** Indent (in columns) at which a line is treated as a sub-point. */
const SUB_POINT_INDENT = 3;

/**
 * Glyph markers may abut their text (`*History:`). Ordinals keep a mandatory
 * space so `1.5mg` is not read as item `1.`.
 */
const ORDINAL_MARKER = /^((?:\d+|[a-zA-Z])[.)])\s+(\S.*)$/;
const GLYPH_MARKER =
  /^([\u2022\u25aa\u25b2\u2192*\-\u2013\u2014▪◦‣·●■§Ø►])\s*(\S.*)$/;

const INLINE_BULLET = /\s+[•▪]\s+/;

const indentOf = (line: string): number => line.length - line.trimStart().length;

const levelOf = (indent: number): number => (indent >= SUB_POINT_INDENT ? 1 : 0);

const toBlock = (raw: string, impliedMarker?: string): ProtocolBlock | null => {
  const indent = indentOf(raw);
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const ordinal = ORDINAL_MARKER.exec(trimmed);
  if (ordinal) {
    return {
      kind: 'item',
      marker: ordinal[1],
      text: ordinal[2],
      level: levelOf(indent),
    };
  }

  const glyph = GLYPH_MARKER.exec(trimmed);
  if (glyph) {
    return {
      kind: 'item',
      marker: glyph[1],
      text: glyph[2],
      level: levelOf(indent),
    };
  }

  if (impliedMarker) {
    return {
      kind: 'item',
      marker: impliedMarker,
      text: trimmed,
      level: levelOf(indent),
    };
  }

  return {
    kind: 'paragraph',
    text: trimmed,
    level: levelOf(indent),
  };
};

/**
 * Splits source text into ProtocolBlocks. Newlines and inline `•` / `▪`
 * separators are structural only. Nothing is classified as a warning,
 * heading, or decision outcome.
 */
export const parseProtocolBlocks = (raw: string): ProtocolBlock[] => {
  if (!raw || !raw.trim()) return [];

  const blocks: ProtocolBlock[] = [];

  for (const line of raw.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) continue;

    const pieces = line.split(INLINE_BULLET);
    pieces.forEach((piece, index) => {
      const block = toBlock(piece, index > 0 ? '•' : undefined);
      if (block) blocks.push(block);
    });
  }

  return blocks;
};
