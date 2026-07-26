# Clinical traceability status

The build-time validator currently inventories 150 normalized clinical entries:

- 45 protocols or procedures
- 32 entries with an initial HJH page mapping
- 118 entries still marked unreviewed with unresolved or incomplete provenance

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

## Approval rule

Clinical values may be promoted from `unreviewed` only after:

1. Exact source page comparison.
2. Resolution of any applicable erratum.
3. Golden test approval.
4. Named clinical review.
5. Recorded content version and review date.
