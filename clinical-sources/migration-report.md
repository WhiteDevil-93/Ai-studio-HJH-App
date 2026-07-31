# Migration report

## legacy-only mode
Wrote 172 entry files from data.json.
Singleton subcategories normalized to arrays: 1_resuscitation_fluids_and_inotropes.targets

# Migration report

- Skipped near-duplicate corpus entry (legacy version kept): "Scorpion envenomation guideline (CMJAH)"
- Skipped near-duplicate corpus entry (legacy version kept): "Sepsis and Septic Shock in the ED (CMJAH)"
## import-corpus mode
Wrote 216 entry files from the corpus (2 near-duplicates skipped).

### Unmapped files (0)

### CMJAH page-citation corrections/flags (7)
- corrected pdfPages for "Snakebite Pathway (CMJAH)": corpus said [115,116], verified pages are [117,118]
- corrected pdfPages for "Status Epilepticus (CMJAH)": corpus said [117,118], verified pages are [119,120]
- corrected pdfPages for "Subarachnoid Haemorrhage (CMJAH)": corpus said [119], verified pages are [121]
- corrected pdfPages for "The Agitated Patient (CMJAH)": corpus said [124], verified pages are [131]
- corrected pdfPages for "Thyroid Emergencies (CMJAH)": corpus said [125], verified pages are [133,134]
- corrected pdfPages for "Toxic Alcohol Ingestion (CMJAH)": corpus said [126], verified pages are [135]
- corrected pdfPages for "Tricyclic Antidepressant (TCA) Overdose (CMJAH)": corpus said [133], verified pages are [143]

# Migration report

- Skipped cross-category duplicate: "Anaphylaxis (CMJAH)" already exists under 12_ed_toxicology, corpus mapped it to 11_ed_medical_emergencies - kept the existing entry, no new one written
- Skipped near-duplicate corpus entry (legacy version kept): "Scorpion envenomation guideline (CMJAH)"
- Skipped near-duplicate corpus entry (legacy version kept): "Sepsis and Septic Shock in the ED (CMJAH)"
## import-corpus mode
Wrote 215 entry files from the corpus (3 near-duplicates skipped).

### Unmapped files (0)

### CMJAH page-citation corrections/flags (7)
- corrected pdfPages for "Snakebite Pathway (CMJAH)": corpus said [115,116], verified pages are [117,118]
- corrected pdfPages for "Status Epilepticus (CMJAH)": corpus said [117,118], verified pages are [119,120]
- corrected pdfPages for "Subarachnoid Haemorrhage (CMJAH)": corpus said [119], verified pages are [121]
- corrected pdfPages for "The Agitated Patient (CMJAH)": corpus said [124], verified pages are [131]
- corrected pdfPages for "Thyroid Emergencies (CMJAH)": corpus said [125], verified pages are [133,134]
- corrected pdfPages for "Toxic Alcohol Ingestion (CMJAH)": corpus said [126], verified pages are [135]
- corrected pdfPages for "Tricyclic Antidepressant (TCA) Overdose (CMJAH)": corpus said [133], verified pages are [143]

# Migration report

## Isolated per-source import pass

User requirement: each protocol must be isolated; repeated topics across HJH,
RMMCH, and CMJAH are allowed to exist as independent entries.

Using the supplied `all_hospitals_protocols` archive corpus:

- **HJH:** imported all 97 archive protocols as isolated `-hjh` entries, with
  sourceId `hjh-ed-2026-v1` and `verification: page-index` where pages were
  available from `pdf_page_index.txt`.
- **RMMCH:** imported all 18 content-bearing archive protocols as isolated
  `-rmmch` entries, with sourceId `rmmch-paediatric-protocols` and
  `verification: page-index`.
- **CMJAH:** imported all 13 content-bearing archive protocols as isolated
  `-cmjah` entries, with sourceId `cmjah-ed-protocols-2020-v2`. Four archive
  page numbers were corrected against `cmjah_page_index.txt`:
  - The Agitated Patient: 124 → 131
  - Snakebite Pathway: 115–116 → 117–118
  - Toxic Alcohol Ingestion: 126 → 135
  - Tricyclic Antidepressant (TCA) Overdose: 133 → 143

- Added `clinical-sources/source-map-rmmch.json` and
  `clinical-sources/source-map-cmjah.json`; updated
  `src/clinical/sourceRegistry.ts` to consult HJH, RMMCH, and CMJAH maps.
- Added hospital-specific title variants to `PROTOCOL_MINDMAP_LINKS` in
  `src/App.tsx` so isolated entries attach to existing interactive pathways.
- Corrected dose-field transcription artefacts in two HJH isolated duplicates
  (`renal-colic-kidney-stones-hjh-2` fentanyl `1mcg/kg`;
  `hyponatraemia-hjh-2` hypertonic saline `2 ml/kg`) so the `weightDose`
  coverage test continues to pass.

Updated baseline: 588 clinical entries, 328 protocols/procedures, 485
source-mapped, 103 awaiting provenance.
