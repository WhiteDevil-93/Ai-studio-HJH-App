# Clinical traceability status

The build-time validator currently inventories **588 normalized clinical
entries** (one JSON file per entry, under `src/clinical/entries/`; see
`clinical-sources/entry-census.json` for the committed baseline the
validator diffs against):

- **328 protocols or procedures**
- **485 entries with a resolved source-page mapping**, across HJH, CMJAH,
  RMMCH, CHBAH, and EDL/PHC (see `bySourceGroup` in `entry-census.json` for
  the per-source breakdown)
- **103 entries still marked unreviewed with unresolved or incomplete
  provenance** (global scores, reference drugs, and a small number of
  hospital-specific topics that are image-only or cross-sourced)

Protocols are intentionally **isolated per source**. A topic that appears in
more than one hospital PDF exists as a separate canonical entry for each
source, with a source-specific slug suffix. They do not share content or
interact with one another.

An entry with unresolved provenance may remain visible in this validation
prototype, but it cannot be promoted to `approved`.

## HJH ED 2026 v1 incorporation (completed)

All 97 protocols supplied in the HJH archive
(`clinical-sources/raw/all_hospitals_protocols/HJH`) are now represented as
isolated HJH entries in `src/clinical/entries/`:

- Every archive protocol was imported with an `-hjh` slug suffix, regardless
  of whether another source already has the same topic.
- Page citations were assigned from `pdf_page_index.txt` where available;
  image-only or cross-sourced topics keep empty `pdfPages` and `verification:
  manual`.
- **14 score calculators** with HJH page evidence (CURB-65, Wells DVT/PE, GCS,
  Canadian C-Spine/NEXUS, anion gap, corrected sodium, free-water deficit,
  Burch-Wartofsky, Parkland, Alvarado) cite `hjh-ed-2026-v1`.
- Supplementary `embedded_drugs` arrays from the Gemini transcription corpus
  were merged into the matching HJH protocol entries.
- Flowchart / mind-map aliases were added in `src/clinical/flowcharts.ts` and
  `src/App.tsx` so the interactive visual pathways attach to HJH sub-flowchart
  entries (hypertension, hyperglycaemia/DKA, jaundice, PE, status epilepticus,
  ACS workup, anaphylaxis, psychosis).

## RMMCH EM Clinical Protocols V5 (March 2024) incorporation (completed)

All 18 content-bearing protocols supplied in the RMMCH archive
(`clinical-sources/raw/all_hospitals_protocols/RMMCH`) are represented as
isolated RMMCH entries in `src/clinical/entries/`:

- Every content-bearing archive protocol was imported with an `-rmmch` slug
  suffix, independent of any HJH/CMJAH equivalent.
- `pdfPages` from the archive extraction were used to set `verification:
  page-index`.
- The `qSOFA` score calculator is mapped to RMMCH sepsis pages 46–47.
- A dedicated `clinical-sources/source-map-rmmch.json` was added, and
  `src/clinical/sourceRegistry.ts` consults HJH, RMMCH, and CMJAH maps.
- RMMCH title variants were added to `PROTOCOL_MINDMAP_LINKS` in `src/App.tsx`
  (anaphylaxis, status epilepticus, croup/asthma).

## CMJAH ED Protocols December 2020 v2 incorporation (completed)

The CMJAH corpus (`clinical-sources/raw/all_hospitals_protocols/CMJAH`) contains
74 supplied archive files; 13 are content-bearing protocols and the remainder
are empty schema shells. All 13 content-bearing protocols are now represented as
isolated CMJAH entries with a `-cmjah` slug suffix, separate from any HJH/RMMCH
version:

- Page citations were taken from the archive extraction, then corrected against
  `cmjah_page_index.txt` where the extraction was wrong:
  - The Agitated Patient: 124 → 131
  - Snakebite Pathway: 115–116 → 117–118
  - Toxic Alcohol Ingestion: 126 → 135
  - Tricyclic Antidepressant (TCA) Overdose: 133 → 143
- **2 score calculators** (`CHA2DS2-VASc`, `HAS-BLED`) cite CMJAH page 38 with
  `page-index` verification.
- A dedicated `clinical-sources/source-map-cmjah.json` was added.
- CMJAH title variants were added to `PROTOCOL_MINDMAP_LINKS` in `src/App.tsx`
  (anaphylaxis, status epilepticus, DKA/HHS, hypertension, PE, snakebite,
  agitation/psychosis).

The source-manifest status for CMJAH is now
`source-received-page-index-verified`.


## Release-blocking mappings

| Application feature | Controlled source | PDF page(s) | Status |
|---|---|---:|---|
| Modified Brooke formula | HJH ED 2026 v1 | 51 | Implemented, clinical approval pending |
| Canadian C-Spine / NEXUS | HJH ED 2026 v1 | 54 | Implemented, HJH page citation applied |
| CURB-65 | HJH ED 2026 v1 | 58 | Implemented, HJH page citation applied |
| Wells DVT | HJH ED 2026 v1 | 63 | Implemented, HJH page citation applied |
| HJH anion gap | HJH ED 2026 v1 | 92 | Potassium-inclusive variant implemented |
| Free-water deficit | HJH ED 2026 v1 | 96 | Implemented, HJH page citation applied |
| Corrected sodium | HJH ED 2026 v1 | 92, 97 | Both printed variants shown separately; review pending |
| Adrenaline infusion | HJH ED 2026 v1 | 109 | Typed calculation implemented |
| Dobutamine infusion | HJH ED 2026 v1 | 110 | Typed calculation implemented |
| Phenylephrine infusion | HJH ED 2026 v1 | 111 | Typed definition tested; not currently exposed in the UI |
| Propofol infusion | HJH ED 2026 v1 | 117 | Printed preparation/label shown; actual concentration must be entered |
| Wells PE / PERC | HJH ED 2026 v1 | 159, 160 | Implemented, HJH page citation applied |
| Burch-Wartofsky | HJH ED 2026 v1 | 189, 190 | Implemented, HJH page citation applied |
| AHA resuscitation algorithms | HJH ED 2026 v1 | 26–39 | Imported as HJH protocol entry; image-only algorithm pages retained in PDF |
| Status epilepticus algorithm | HJH ED 2026 v1 | 177, 178 | Imported and linked to interactive flowchart |
| PE algorithm | HJH ED 2026 v1 | 159, 160 | Imported and linked to interactive flowchart |
| Hypertension flowchart | HJH ED 2026 v1 | 98, 99 | Imported and linked to interactive flowchart |
| Hyperglycaemia / DKA-HHS flowchart | HJH ED 2026 v1 | 91, 92 | Imported and linked to interactive flowchart |
| Jaundice flowchart | HJH ED 2026 v1 | 119, 120 | Imported and linked to interactive flowchart |

## Image-only pages

The HJH source PDF contains pages that are diagrams, forms, maps, or
administrative SOPs with no extractable text (e.g. pages 24, 25, 40, 66, 153,
156, 205, 208–210, 230–243). These are recorded as `IMAGE-ONLY / NO TEXT` in
`pdf_page_index.txt`. Where an image page corresponds to a clinical protocol,
an interactive flowchart or the imported archive transcription is used as the
machine-readable surrogate; the original page number is still captured in the
entry's `pdfPages` for traceability.

## Errata and transcription issues

`clinical-sources/errata.json` now holds one register per source
(`registers: [...]`) rather than a single HJH-only list, so newly
transcribed sources can carry their own disclosed discrepancies without
conflating them with HJH's. It currently covers the HJH items above plus
2 CMJAH items (both printed-unit mismatches - a fluid bolus given as "mg/kg"
where "ml/kg" is clearly intended).

`clinical-sources/transcription-issues.json` is a separate register for
defects introduced by *our own* transcription (not the source document) -
currently 7 CMJAH page citations that were corrected against
`cmjah_page_index.txt` before being committed. Keeping these separate
from `errata.json` matters: misfiling a transcription mistake there
would misattribute it to the source document.

## Approval rule

Clinical values may be promoted from `unreviewed` only after:

1. Exact source page comparison.
2. Resolution of any applicable erratum.
3. Golden test approval.
4. Named clinical review.
5. Recorded content version and review date.
