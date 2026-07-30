# Asclepius

Asclepius is a clinical-reference web application for high-acuity Emergency Department
and ICU workflows. Its hospital library is sourced from the supplied
`all_hospitals_protocols.zip` schema and keeps HJH, CMJAH, CHBAH, and RMMCH
protocols as independent facility collections.

## Clinical status

**This repository is under clinical validation and is not approved for
independent clinical decision-making.**

Protocol content is currently transcribed as it appears in the supplied
material. Repeated subjects are intentionally retained under every hospital
that supplies them. Where two printed versions conflict, the application keeps
them as separate, source-labelled entries pending clinical review.

The HJH source states that it is largely aimed at adult emergency patients and
should be used with RMMCH protocols for paediatric patients. Paediatric content
in this repository must therefore have its own approved provenance.

## Controlled source & Categorisation

The complete supplied JSON archive is extracted under `clinical-sources/raw/all_hospitals_protocols/`.
Its archive checksum, extracted tree checksum, file census, and per-facility counts are recorded in
[`clinical-sources/all-hospitals-protocols-manifest.json`](clinical-sources/all-hospitals-protocols-manifest.json).

The hospital landing pages currently expose:

- **HJH (Helen Joseph Hospital)**: 97 entries (Fully audited against official 2026 PDF Table of Contents across 17 clinical specialty categories)
- **CMJAH (Charlotte Maxeke Academic)**: 79 entries
- **CHBAH (Chris Hani Baragwanath ICU)**: 68 entries
- **RMMCH (Rahima Moosa Mother & Child)**: 51 entries

Scoring systems, trial reference datasets (v1, v2, v3), and global reference guides remain global collections.

The current HJH source is:

- Helen Joseph Tertiary Hospital Emergency Department Clinical Guidelines
- Version: January 2026 (Editor: Dr Jana du Plessis)
- PDF pages: 247
- SHA-256:
  `2845afd7491ff8937c2eac22bc99eb25e94531bbb0774fc3a66c51ca5ba805f8`

Source metadata is recorded in
[`clinical-sources/source-manifest.json`](clinical-sources/source-manifest.json).
Known source ambiguities are recorded in
[`clinical-sources/errata.json`](clinical-sources/errata.json).

## Features & UX Enhancements

- **Smart Clinical Text Rendering**: Raw clinical text and extracted protocol fields are parsed and formatted using `FormattedClinicalText` into structured clinical cards, bold subheader banners, emerald checkmark lists, and urgent warning badges (e.g. female pregnancy test requirements, contraindications).
- **Patient-Specific Calculations**: Weight-based dose calculator automatically computes inline doses (mg, mcg, mL, units) across management steps and drug fields upon patient weight entry.
- **Continuous Infusion Dosing**: Interactive dose, concentration, and rate calculator with pre-configured HJH standard formulations and user-specified ICU preparations.
- **Global Clinical Reference & Trials**: Searchable trials dataset (v1, v2, v3) and markdown pocket reference guides (`GlobalReferenceDocumentPage.tsx`).
- **PWA & Progressive Offline Support**: Service worker registration and PWA asset generator (`scripts/generate-pwa-assets.js`) enable offline caching and home screen installation.

## Local development

Prerequisites:

- Node.js 22
- npm

Install and run:

```bash
npm ci
npm run dev
```

The application runs locally as a Vite + React client-side web application.

## Validation & Auditing

Run the complete local release check:

```bash
npm run check
```

This runs:

1. TypeScript checking (`tsc --noEmit`)
2. Clinical-data validation
3. Unit and golden calculation tests (`vitest`)
4. Production compilation (`vite build`)

Individual validation commands:

```bash
npm run typecheck
npm run validate:data
npm test
npm run build
```

PDF Audit & Categorisation tools:

```bash
python scripts/audit-hjh-pdf.py
python scripts/fix-all-hjh-extractions.py
```

## Clinical content workflow

Every retained clinical entry should have:

- A stable ID
- Entry type
- Source document
- Source PDF page
- Transformation classification
- Review state
- Structured warnings

Clinical changes to doses, concentrations, units, contraindications, warnings,
score criteria, thresholds, management actions, or disposition require
two-person review including a designated clinical reviewer.

Unresolved source discrepancies must remain in the errata register and block
the affected feature. Developers must not silently choose between conflicting
clinical values.

## Repository structure

```text
clinical-sources/         Source manifests, errata, correction overrides, and the
                          raw transcription corpora (HJH, CMJAH, CHBAH, RMMCH)
scripts/                  Clinical-data validation, PWA asset generation, and
                          automated PDF audit/fix utilities
src/clinical/             Types, source registry, normalization, weight/dose calculations,
                          hospital protocol index, and global reference documents
src/components/           React UI components (HomePage, HospitalProtocolsPage,
                          ProtocolLandingPage, GlobalReferenceDocumentPage, PWAInstallPrompt)
src/App.tsx               Main application routing and state management
```

## Release requirements

A clinical release must not proceed unless:

- Every enabled calculator has approved golden tests.
- Every approved entry has resolved provenance.
- No critical warning is suppressed.
- No score interprets incomplete input.
- No calculation assumes patient weight or concentration.
- The clinical-content version and reviewer sign-off are recorded.

## Copyright and licensing

Application code contains Apache-2.0 SPDX notices. Clinical guideline content
remains subject to its source owners' rights; redistribution permission must be
confirmed separately before public distribution.
