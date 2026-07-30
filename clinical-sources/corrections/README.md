# Hospital protocol corrections

The files in `raw/all_hospitals_protocols` are an immutable, byte-for-byte
extraction of the supplied `all_hospitals_protocols.zip` archive.

Runtime corrections belong in this directory under the same facility and
filename as the raw record they replace. The application overlays a matching
correction at load time while retaining the original source bytes for checksum
validation and provenance.

Current HJH corrections address confirmed cross-protocol extraction and
categorisation errors in:

- `ent_emergencies.json`
- `mental_health_psychosis.json`
- `non_invasive_ventilation.json`
- `ventilator_guidelines.json`

Do not copy corrections back into the raw archive mirror.
