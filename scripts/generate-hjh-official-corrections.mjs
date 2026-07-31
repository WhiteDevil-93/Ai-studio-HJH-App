import {gunzipSync} from 'node:zlib';
import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const rawDirectory = path.join(root, 'clinical-sources/raw/all_hospitals_protocols/HJH');
const correctionDirectory = path.join(root, 'clinical-sources/corrections/HJH');
const corpusDirectory = path.join(root, 'clinical-sources/official/HJH');
const partNames = (await readdir(corpusDirectory))
  .filter(name => /^hjh-official-pdf-corpus\.json\.gz\.b64\.part-\d+$/.test(name))
  .sort();

if (partNames.length === 0) {
  throw new Error('HJH official PDF corpus parts are missing.');
}

const encoded = (await Promise.all(
  partNames.map(name => readFile(path.join(corpusDirectory, name), 'utf8')),
)).join('').replace(/\s+/g, '');
const corpus = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'));
const rawNames = (await readdir(rawDirectory)).filter(name => name.endsWith('.json')).sort();
const rawSlugs = rawNames.map(name => name.replace(/\.json$/, ''));
const corpusSlugs = Object.keys(corpus).sort();

if (rawSlugs.length !== 97 || corpusSlugs.length !== 97) {
  throw new Error(`Expected 97 HJH protocols; raw=${rawSlugs.length}, official=${corpusSlugs.length}.`);
}
if (JSON.stringify(rawSlugs) !== JSON.stringify(corpusSlugs)) {
  const missing = rawSlugs.filter(slug => !corpusSlugs.includes(slug));
  const extra = corpusSlugs.filter(slug => !rawSlugs.includes(slug));
  throw new Error(`HJH official corpus mismatch. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`);
}

await mkdir(correctionDirectory, {recursive: true});
for (const name of rawNames) {
  const slug = name.replace(/\.json$/, '');
  const raw = JSON.parse(await readFile(path.join(rawDirectory, name), 'utf8'));
  const official = corpus[slug];
  if (!Array.isArray(official?.pdfPages) || official.pdfPages.length === 0 || typeof official?.sourceText !== 'string' || !official.sourceText.trim()) {
    throw new Error(`Invalid official HJH entry: ${slug}`);
  }
  if (/[\uf000-\uf0ff]|⟦unreadable source glyph/i.test(official.sourceText)) {
    throw new Error(`Unresolved source glyph in official HJH entry: ${slug}`);
  }

  const rawMeta = raw && typeof raw._meta === 'object' && raw._meta ? raw._meta : {};
  const rawProtocol = raw && typeof raw.protocol === 'object' && raw.protocol ? raw.protocol : {};
  const correction = {
    _meta: {
      ...rawMeta,
      id: slug,
      source_doc: 'HJH ED 2026',
      review_state: 'source_verified',
    },
    protocol: {
      item: rawProtocol.item || rawMeta.title || slug.replaceAll('_', ' '),
      protocol_type: rawProtocol.protocol_type || 'ed_protocol',
      sourceDoc: 'HJH ED 2026',
      source_fidelity: 'Official HJH Emergency Department Clinical Guidelines 2026 page-bounded transcription',
      pdfPages: official.pdfPages,
      source_text: official.sourceText,
    },
  };
  await writeFile(path.join(correctionDirectory, name), `${JSON.stringify(correction, null, 2)}\n`, 'utf8');
}

console.log(`Generated ${rawNames.length} source-faithful HJH corrections from the official PDF corpus.`);
