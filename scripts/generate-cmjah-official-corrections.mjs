import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const rawDirectory = path.join(root, 'clinical-sources/raw/all_hospitals_protocols/CMJAH');
const correctionDirectory = path.join(root, 'clinical-sources/corrections/CMJAH');
const corpusDirectory = path.join(root, 'clinical-sources/official/CMJAH');

const EXPECTED_ENTRY_COUNT = 79;
const EXPECTED_PDF_SHA256 = '70187c9d418f08dc36faf6637c85a50a4aed4229371f5b73004c14fa152502b9';
const SOURCE_LABEL = 'CMJAH ED December 2020';
const SOURCE_FIDELITY =
  'Official CMJAH Emergency Department Protocols Version 2, December 2020 page-bounded transcription';

const IMAGE_OVERLAYS = {
  asthma_pefr: '/clinical-sources/cmjah/asthma-pefr-normal-values.jpg',
  paracetamol_nomogram: '/clinical-sources/cmjah/paracetamol-treatment-nomogram.png',
};

const isRecord = value =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const sha256 = value =>
  createHash('sha256').update(value, 'utf8').digest('hex');

const partNames = (await readdir(corpusDirectory))
  .filter(name => /^cmjah-official-pdf-corpus\.json\.gz\.b64\.part-\d+$/.test(name))
  .sort();

if (partNames.length === 0) {
  throw new Error('CMJAH official PDF corpus parts are missing.');
}

const encoded = (await Promise.all(
  partNames.map(name => readFile(path.join(corpusDirectory, name), 'utf8')),
)).join('').replace(/\s+/g, '');

const corpus = JSON.parse(
  gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'),
);

if (
  corpus.facility !== 'CMJAH' ||
  corpus.sourcePdfSha256 !== EXPECTED_PDF_SHA256 ||
  !isRecord(corpus.entries)
) {
  throw new Error('CMJAH official PDF corpus metadata is invalid.');
}

const rawNames = (await readdir(rawDirectory))
  .filter(name => name.endsWith('.json'))
  .sort();
const rawSlugs = rawNames.map(name => name.replace(/\.json$/, ''));
const corpusSlugs = Object.keys(corpus.entries).sort();

if (
  rawSlugs.length !== EXPECTED_ENTRY_COUNT ||
  corpusSlugs.length !== EXPECTED_ENTRY_COUNT ||
  JSON.stringify(rawSlugs) !== JSON.stringify(corpusSlugs)
) {
  const missing = rawSlugs.filter(slug => !corpusSlugs.includes(slug));
  const extra = corpusSlugs.filter(slug => !rawSlugs.includes(slug));
  throw new Error(
    `CMJAH official corpus mismatch. raw=${rawSlugs.length}, official=${corpusSlugs.length}, ` +
    `missing=${missing.join(', ') || 'none'}, extra=${extra.join(', ') || 'none'}.`,
  );
}

await mkdir(correctionDirectory, {recursive: true});

for (const name of rawNames) {
  const slug = name.replace(/\.json$/, '');
  const raw = JSON.parse(await readFile(path.join(rawDirectory, name), 'utf8'));
  const rawMeta = isRecord(raw._meta) ? raw._meta : {};
  const rawProtocol = isRecord(raw.protocol) ? raw.protocol : raw;
  const official = corpus.entries[slug];

  if (
    !isRecord(official) ||
    !Array.isArray(official.pdfPages) ||
    official.pdfPages.length === 0
  ) {
    throw new Error(`CMJAH entry has no official PDF pages: ${slug}`);
  }

  let correction;

  if (official.sourceKind === 'image-overlay') {
    const expectedAsset = IMAGE_OVERLAYS[slug];
    if (!expectedAsset) {
      throw new Error(`Unexpected CMJAH image-only entry: ${slug}`);
    }

    const correctionPath = path.join(correctionDirectory, name);
    const existing = JSON.parse(await readFile(correctionPath, 'utf8'));
    const existingMeta = isRecord(existing._meta) ? existing._meta : rawMeta;
    const existingProtocol = isRecord(existing.protocol) ? existing.protocol : {};

    if (existingProtocol.source_image !== expectedAsset) {
      throw new Error(`CMJAH image overlay asset mismatch: ${slug}`);
    }

    correction = {
      ...existing,
      _meta: {
        ...existingMeta,
        id: slug,
        source_doc: SOURCE_LABEL,
        review_state: 'source_verified',
      },
      protocol: {
        ...existingProtocol,
        item:
          existingProtocol.item ||
          rawMeta.title ||
          rawProtocol.item ||
          slug.replaceAll('_', ' '),
        protocol_type:
          existingProtocol.protocol_type ||
          rawProtocol.protocol_type ||
          'ed_protocol',
        sourceDoc: SOURCE_LABEL,
        source_fidelity:
          'Official CMJAH Emergency Department Protocols Version 2, December 2020 image-page overlay',
        sourcePdfSha256: EXPECTED_PDF_SHA256,
        pdfPages: official.pdfPages,
      },
    };
  } else if (official.sourceKind === 'page-bounded-text') {
    if (
      !Array.isArray(official.pageTexts) ||
      official.pageTexts.length !== official.pdfPages.length
    ) {
      throw new Error(`CMJAH page transcription count mismatch: ${slug}`);
    }

    const pageNumbers = official.pageTexts.map(page => page?.page);
    if (JSON.stringify(pageNumbers) !== JSON.stringify(official.pdfPages)) {
      throw new Error(`CMJAH page transcription order mismatch: ${slug}`);
    }

    const sourceText = official.pageTexts
      .map(page => typeof page?.text === 'string' ? page.text.trim() : '')
      .filter(Boolean)
      .join('\n\n')
      .trim();

    if (!sourceText) {
      throw new Error(`CMJAH protocol has no official PDF transcription: ${slug}`);
    }

    const sourceTextSha256 = sha256(sourceText);
    if (sourceTextSha256 !== official.sourceTextSha256) {
      throw new Error(`CMJAH transcription checksum mismatch: ${slug}`);
    }

    correction = {
      _meta: {
        ...rawMeta,
        id: slug,
        source_doc: SOURCE_LABEL,
        review_state: 'source_verified',
      },
      protocol: {
        item:
          rawMeta.title ||
          rawProtocol.item ||
          slug.replaceAll('_', ' '),
        protocol_type: rawProtocol.protocol_type || 'ed_protocol',
        sourceDoc: SOURCE_LABEL,
        source_fidelity: SOURCE_FIDELITY,
        sourcePdfSha256: EXPECTED_PDF_SHA256,
        sourceTextSha256,
        pdfPages: official.pdfPages,
        source_text: sourceText,
      },
    };
  } else {
    throw new Error(`Unknown CMJAH source kind for ${slug}`);
  }

  await writeFile(
    path.join(correctionDirectory, name),
    `${JSON.stringify(correction, null, 2)}\n`,
    'utf8',
  );
}

console.log(
  `Generated ${rawNames.length} source-faithful CMJAH corrections from the official PDF corpus.`,
);
