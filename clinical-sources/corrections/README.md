# Hospital protocol corrections

The files in `raw/all_hospitals_protocols` are an immutable, byte-for-byte
extraction of the supplied `all_hospitals_protocols.zip` archive.

Runtime corrections belong in this directory under the same facility and
filename as the raw record they replace. The application overlays a matching
correction at load time while retaining the original source bytes for checksum
validation and provenance.

Current HJH corrections address confirmed cross-protocol extraction,
image-only-page transcription, and categorisation errors. The primary source
used for page-level transcription is:

- `HJH ED Protocol book 2026 v1.pdf`
- SHA-256: `2845afd7491ff8937c2eac22bc99eb25e94531bbb0774fc3a66c51ca5ba805f8`

The July 30, 2026 integrity audit found that the supplied ZIP had copied long
clinical fields between unrelated HJH records. Reviewed PDF-page transcriptions
now replace the affected runtime records for back pain, blood products,
C-spine imaging, community-acquired pneumonia, critical-care principles,
hypokalaemia, hypernatraemia, hypertension, dialysis indications, oncological
emergencies, pain management, pulmonary embolism, raised intracranial
pressure, thyroid emergencies, triage, and procedural sedation. The
procedural-sedation checklist was transcribed from the image embedded on PDF
page 158.

The previously reviewed HJH corrections for ENT emergencies, mental-health
care, non-invasive ventilation, and ventilator guidelines remain in place.

The same collision audit identified CMJAH records populated with table-of-
contents text or another protocol page. Reviewed overlays use the CMJAH
December 2020 PDF (`SHA-256:
70187c9d418f08dc36faf6637c85a50a4aed4229371f5b73004c14fa152502b9`).
Image-only facility pages for the asthma PEFR reference and paracetamol
nomogram are retained as tap-to-open source images in `public/clinical-sources`.

Do not copy corrections back into the raw archive mirror.
