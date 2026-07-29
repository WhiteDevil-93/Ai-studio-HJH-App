# Clinical traceability status

The build-time validator currently inventories 368 normalized clinical
entries (one JSON file per entry, under `src/clinical/entries/`; see
`clinical-sources/entry-census.json` for the committed baseline the
validator diffs against):

- 108 protocols or procedures
- 250 entries with a resolved source-page mapping, across HJH, CMJAH,
  RMMCH, and EDL/PHC (see `bySourceGroup` in `entry-census.json` for
  the per-source breakdown)
- 118 entries still marked unreviewed with unresolved or incomplete
  provenance (mostly pre-existing Bara ICU dosing content with no
  formal per-entry citation yet)

An entry with unresolved provenance may remain visible in this validation
prototype, but it cannot be promoted to `approved`.

## Release-blocking mappings

| Application feature | Controlled source | PDF page(s) | Status |
|---|---|---:|---|
| Modified Brooke formula | HJH ED 2026 v1 | 51 | Implemented, clinical approval pending |
| Canadian C-Spine / NEXUS | HJH ED 2026 v1 | 54 | Workflow corrected, clinical approval pending |
| CURB-65 | HJH ED 2026 v1 | 58 | Completion gate implemented |
| Wells DVT | HJH ED 2026 v1 | 63 | Completion gate implemented |
| HJH anion gap | HJH ED 2026 v1 | 92 | Potassium-inclusive variant implemented |
| Free-water deficit | HJH ED 2026 v1 | 96 | Implemented, clinical approval pending |
| Corrected sodium | HJH ED 2026 v1 | 92, 97 | Both printed variants shown separately; review pending |
| Adrenaline infusion | HJH ED 2026 v1 | 109 | Typed calculation implemented |
| Dobutamine infusion | HJH ED 2026 v1 | 110 | Typed calculation implemented |
| Phenylephrine infusion | HJH ED 2026 v1 | 111 | Typed definition tested; not currently exposed in the UI |
| Propofol infusion | HJH ED 2026 v1 | 117 | Printed preparation/label shown; actual concentration must be entered |
| Wells PE / PERC | HJH ED 2026 v1 | 159, 160 | Local thresholds and completion gate implemented |
| Burch-Wartofsky | HJH ED 2026 v1 | 189, 190 | Missing components restored; errata disclosed |

## Errata and transcription issues

`clinical-sources/errata.json` now holds one register per source
(`registers: [...]`) rather than a single HJH-only list, so newly
transcribed sources can carry their own disclosed discrepancies without
conflating them with HJH's. It currently covers the 6 HJH items above
plus 2 CMJAH items (both printed-unit mismatches - a fluid bolus given
as "mg/kg" where "ml/kg" is clearly intended).

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
