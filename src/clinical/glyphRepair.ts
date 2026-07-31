/**
 * Repairs symbol characters the archive extraction damaged.
 *
 * The supplied PDFs set their symbols in the Symbol and Wingdings fonts. Those
 * fonts carry no usable Unicode mapping, so the extraction emitted each glyph
 * either as a Private Use Area codepoint (`U+F000` plus the font byte) or as
 * the bare font byte reinterpreted as Latin-1. Both forms reach the reader
 * wrong: PUA codepoints render as a blank or a tofu box, which turned
 * `Fentanyl 1µg/kg` into `Fentanyl 1/kg`, and the Latin-1 forms print as
 * unrelated letters, which turned `≥ 15%` into `³ 15%`.
 *
 * Every mapping below is the documented Adobe Symbol (or Wingdings) value for
 * that byte *and* is corroborated by how the character is used in the archive;
 * `glyphRepair.test.ts` records the corroborating phrase for each one. Bytes
 * whose intent could not be established are removed rather than guessed at, so
 * this never invents a clinical symbol.
 */

/** Adobe Symbol byte -> Unicode. Keys are the byte, not the PUA codepoint. */
const SYMBOL_FONT_BYTES: Record<number, string> = {
  0x3c: '<', // less
  0x3e: '>', // greater
  0x42: 'β', // Beta       — "β blockers"
  0x44: 'Δ', // Delta      — "Δ lactate"
  0x62: 'β', // beta       — "Urine-βHCG"
  0x6d: 'µ', // mu         — "Fentanyl 1µg/kg", "Esmolol 250-500µg/kg"
  0xa3: '≤', // lessequal
  0xad: '↑', // arrowup    — "↑HR", "↑↑K+ ↑PO4 ↑Uric Acid"
  0xae: '→', // arrowright
  0xaf: '↓', // arrowdown  — "↓BP", "↓ LOC", "↓Ca2+"
  0xb0: '°', // degree     — "2° orofacial infection", "sit patient up > 45°"
  0xb1: '±', // plusminus  — Winter's formula, "1.5 x HCO3 + 8 ± 2"
  0xb3: '≥', // greaterequal — "≥ 10 hrs post pain onset"
  0xd2: '®', // registerserif — "Lorazepam (Ativan®)"
};

/**
 * Wingdings bytes, which the airway pages use for list markers. `0x71` is the
 * hollow box Wingdings draws for a bullet; it only ever appears alone on a
 * line, so a bullet glyph is the faithful reading.
 */
const WINGDINGS_FONT_BYTES: Record<number, string> = {
  0x71: '•',
  0xe0: '➔', // heavy arrow — the same arrow appears undamaged elsewhere
};

const PRIVATE_USE_AREA = /[\uf000-\uf0ff]/g;

/**
 * The extraction dropped the `U+F0` prefix on some pages, leaving the font byte
 * as a Latin-1 letter. Each of these is unambiguous in context across the whole
 * archive — every `³` sits in a comparison, every `Ò` follows a brand name.
 */
const LATIN1_MOJIBAKE: Record<string, string> = {
  '£': '≤', // 0xA3 — "DOOR TO NEEDLE TIME ≤ 30 MINUTES"
  ['\u00ad']: '↑', // soft hyphen, invisible on the page: "↑HR ↓BP"
  ['\u00af']: '↓', // macron; other copies of that line carry the arrow byte
  '³': '≥', // 0xB3 — "seizures for ≥ 5 minutes", "INR ≥ 1.5", "burns ≥ 15%"
  Ò: '®', // 0xD2 — "Augmentin®", "(Valium®)"
  à: '➔', // 0xE0 — "aspiration ➔ intubate"
};

/**
 * `ß` stands for two different glyphs. Before `HCG` it is the beta of a
 * pregnancy test; standing alone before a clinical noun it is the down arrow,
 * which another copy of the same `↓ LOC` line confirms by carrying the Symbol
 * arrow byte instead.
 */
const BETA_HCG = /ß(?=-?\s*HCG)/gi;
const STANDALONE_DOWN_ARROW = /ß(?=\s)/g;

export const repairExtractionGlyphs = (text: string): string => {
  if (!text) return text;

  let repaired = text.replace(PRIVATE_USE_AREA, character => {
    const byte = character.charCodeAt(0) - 0xf000;
    return SYMBOL_FONT_BYTES[byte] ?? WINGDINGS_FONT_BYTES[byte] ?? '';
  });

  repaired = repaired.replace(BETA_HCG, 'β').replace(STANDALONE_DOWN_ARROW, '↓');

  for (const [damaged, actual] of Object.entries(LATIN1_MOJIBAKE)) {
    repaired = repaired.split(damaged).join(actual);
  }

  return repaired;
};

/**
 * Applies the repair to every string in a loaded protocol record, so the same
 * text reaches the page, the search index, and the card summaries.
 */
export const repairGlyphsDeep = <T>(value: T): T => {
  if (typeof value === 'string') {
    return repairExtractionGlyphs(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(entry => repairGlyphsDeep(entry)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        repairGlyphsDeep(entry),
      ]),
    ) as unknown as T;
  }
  return value;
};
