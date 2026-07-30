# Asclepius

Asclepius is a clinical-reference prototype for high-acuity Emergency Department
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

## Controlled source

The complete supplied JSON archive is extracted without content changes under
`clinical-sources/raw/all_hospitals_protocols/`. Its archive checksum, extracted
tree checksum, file census, and per-facility counts are recorded in
[`clinical-sources/all-hospitals-protocols-manifest.json`](clinical-sources/all-hospitals-protocols-manifest.json).

The hospital landing pages currently expose:

- HJH: 97 entries
- CMJAH: 79 entries
- CHBAH: 68 entries
- RMMCH: 51 entries

Scoring systems and trials/international guidelines remain global collections.

The current HJH source is:

- Helen Joseph Tertiary Hospital Emergency Department Clinical Guidelines
- Version: January 2026
- PDF pages: 247
- SHA-256:
  `2845afd7491ff8937c2eac22bc99eb25e94531bbb0774fc3a66c51ca5ba805f8`

Source metadata is recorded in
[`clinical-sources/source-manifest.json`](clinical-sources/source-manifest.json).
Known source ambiguities are recorded in
[`clinical-sources/errata.json`](clinical-sources/errata.json).
The PDF is not committed to this repository because distribution permission is
not yet recorded.

## Local development

Prerequisites:

- Node.js 22
- npm

Install and run:

```bash
npm ci
npm run dev
```

No Gemini API key or application server is required. This is currently a
client-side Vite application.

## Validation

Run the complete local release check:

```bash
npm run check
```

This runs:

1. TypeScript checking
2. Clinical-data validation
3. Calculation and normalization tests
4. Production compilation

Individual commands:

```bash
npm run typecheck
npm run validate:data
npm test
npm run build
```

## Patient-specific calculations

- Entering a patient weight calculates every clear numeric dose expressed per
  kilogram in adult, paediatric, protocol-dose, notes, and management-step
  text.
- Ranges remain ranges, units and time bases are preserved, and printed maximum
  doses remain visible for application by the clinician.
- Continuous infusion expressions receive a dose/concentration/rate calculator.
  The actual prepared concentration must be entered and confirmed before a
  result is shown.
- Protocol-specific HJH preparations are configured for the infusion pages,
  while Bara ICU regimens without a recorded standard preparation require the
  user to enter the concentration actually prepared.

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

## Current limitations

- The supplied hospital JSON corpus is complete in the repository, but remains
  an unvalidated transcription rather than an approved digital edition.
- The CHBAH ICU dosing card and RMMCH paediatric protocols have been
  transcribed and imported, but neither source PDF has an independently
  confirmed SHA-256 fingerprint yet (see `clinical-sources/source-manifest.json`).
  CHBAH ICU entries also have no real per-entry page citation (the source
  document isn't held in the repo), so they carry `pdfPages: []`.
- Some legacy entries still await exact page-level provenance.
- Corrected sodium is shown as separate page 92 and page 97 variants pending
  review.
- Propofol retains the printed preparation and concentration wording and
  requires confirmation of the actual prepared concentration.
- The application is not currently a Progressive Web App and makes no offline
  freshness guarantee.

## Repository structure

```text
clinical-sources/         Source manifest, page mapping, errata, and the
                          vendored transcription corpora (raw/), including the
                          exact all-hospitals archive extraction
scripts/                  Clinical-data validation and the one-time
                          data.json -> entries/ migration script
src/clinical/             Types, source registry, normalization, calculations
                          and the all-hospitals runtime loader
src/clinical/entries/     One JSON file per clinical entry (protocol/drug/
                          procedure/score), the source of truth for all
                          legacy category, score, and calculation views
src/App.tsx               Current interface pending further component extraction
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
