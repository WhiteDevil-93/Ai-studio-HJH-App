import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const rawDirectory = path.join(root, 'clinical-sources/raw/all_hospitals_protocols/HJH');
const correctionDirectory = path.join(root, 'clinical-sources/corrections/HJH');

const PDF_PAGES = {
  back_pain: [48], burns: [51, 52, 53], compartment_syndrome: [59], crush_injury: [62], c_spine_imaging: [54], head_injury: [87, 88, 89, 90], trauma_basics: [193],
  acs_workup_algorithm: [9], actilyse_protocol: [15], acute_coronary_syndrome_acs_algorithm: [9], acute_heart_failure_ahf: [16], atrial_fibrillation_af: [46, 47], hypertension_flowchart: [98], hypertensive_emergencies: [99], intermediate_low_risk_chest_pain: [14], nstemi_management: [13], stemi_equivalents_sgarbossa_criteria: [11, 12], stemi_management: [10], syncope: [180], syncope_ecg: [181, 182, 183, 184, 185, 186, 187], vascular_emergencies_aaa_dissection_limb_ischaemia: [200],
  acute_ischaemic_stroke: [17, 18], dizziness_vertigo_hints_exam: [67], first_onset_seizures: [75], headache_red_flags_primary_syndromes: [86], raised_icp: [165, 166], status_epilepticus: [178], status_epilepticus_algorithm: [177], subarachnoid_haemorrhage: [179],
  asthma_exacerbation: [43, 44], asthma_pefr: [45], community_acquired_pneumonia: [58], copd_exacerbation: [56, 57], dvt: [63], pe_algorithm: [160], pulmonary_embolism: [159],
  airway_management_checklist_rsi: [22, 23], difficult_airway: [64, 65, 66], non_invasive_ventilation: [132], ventilator_guidelines: [202, 203], ent_emergencies: [68, 69, 70, 71, 72, 73, 74],
  sexual_assault: [173, 174, 175], vaginal_bleeding_ed_management: [199], gastroenteritis_paediatrics: [76], haematological_emergencies: [78, 79, 80, 81, 82, 83, 84, 85], hyperthermia: [100], hypothermia: [101, 102, 103], liver_failure: [121, 122, 123, 124, 125], oncological_emergencies: [133, 134, 135, 136, 137], ophthalmology_emergencies: [138, 139, 140], renal_colic: [167],
  acetylcholinesterase_inhibitor_overdose: [6], anaphylaxis: [41], angioedema: [42], ccb_bb_overdose: [55], general_toxicology: [77], isoniazid_overdose: [118], paracetamol_nomogram: [144], paracetamol_overdose: [143], salicylate_overdose: [168], scorpion_envenomation: [169], snakebite: [176], tca_overdose: [196], toxic_alcohol: [191], toxidromes: [192], warfarin_toxicity: [201],
  malaria_uncomplicated_complicated: [126, 127], meningococcal_prophylaxis: [130, 131], post_exposure_prophylaxis: [145, 146, 147, 148, 149, 150, 151], rabies_animal_bites: [161, 162, 163, 164], tetanus: [188],
  diabetic_ketoacidosis_dka: [92], hyperglycaemia_flowchart: [91], hyperkalaemia: [94], hypernatraemia: [96], hypoglycaemia: [93], hypokalaemia: [95], hyponatraemia: [97], indications_dialysis: [104], thyroid_emergencies: [189, 190],
  agitation_aggression: [19, 20, 21], mental_health_psychosis: [128, 129], acute_appendicitis: [7], acute_cholecystitis: [8], jaundice_flowchart: [119, 120], upper_gastrointestinal_bleed_ugib: [198], femoral_nerve_block: [197], infusions: [105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117], pain_management: [141, 142], procedural_sedation: [158], medicolegal_recordkeeping: [152, 153, 154, 155, 156, 157], triage_tews: [194, 195], aha_resuscitation_algorithms: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40], blood_products: [49], brainstem_death: [50], critical_care_principles: [60, 61], sepsis_septic_shock: [170, 171, 172],
};

const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const sourceTextOf = value => {
  const protocol = isRecord(value?.protocol) ? value.protocol : value;
  return typeof protocol?.source_text === 'string' ? protocol.source_text.trim() : '';
};

await mkdir(correctionDirectory, {recursive: true});
const rawNames = (await readdir(rawDirectory)).filter(name => name.endsWith('.json')).sort();
const rawSlugs = rawNames.map(name => name.replace(/\.json$/, ''));
const mappedSlugs = Object.keys(PDF_PAGES).sort();
if (rawNames.length !== 97 || JSON.stringify(rawSlugs) !== JSON.stringify(mappedSlugs)) {
  const missing = rawSlugs.filter(slug => !mappedSlugs.includes(slug));
  const extra = mappedSlugs.filter(slug => !rawSlugs.includes(slug));
  throw new Error(`HJH source map mismatch. raw=${rawNames.length}, mapped=${mappedSlugs.length}, missing=${missing.join(', ') || 'none'}, extra=${extra.join(', ') || 'none'}`);
}

const existingCorrections = new Map();
for (const name of (await readdir(correctionDirectory)).filter(name => name.endsWith('.json'))) {
  const value = JSON.parse(await readFile(path.join(correctionDirectory, name), 'utf8'));
  if (sourceTextOf(value)) existingCorrections.set(name, value);
}

for (const name of rawNames) {
  const slug = name.replace(/\.json$/, '');
  const raw = JSON.parse(await readFile(path.join(rawDirectory, name), 'utf8'));
  const preferred = existingCorrections.get(name) || raw;
  let sourceText = sourceTextOf(preferred);
  if (!sourceText) throw new Error(`HJH protocol has no PDF transcription: ${slug}`);

  if (slug === 'acute_appendicitis') {
    sourceText = sourceText.split(/\n\s*Contents\s*\n[\s\S]*?ACUTE CHOLECYSTITIS/i)[0].trim();
  }

  const rawMeta = isRecord(raw._meta) ? raw._meta : {};
  const rawProtocol = isRecord(raw.protocol) ? raw.protocol : raw;
  const correction = {
    _meta: {...rawMeta, id: slug, source_doc: 'HJH ED 2026', review_state: 'source_verified'},
    protocol: {
      item: rawProtocol.item || rawMeta.title || slug.replaceAll('_', ' '),
      protocol_type: rawProtocol.protocol_type || 'ed_protocol',
      sourceDoc: 'HJH ED 2026',
      source_fidelity: 'Official HJH Emergency Department Clinical Guidelines 2026 transcription',
      pdfPages: PDF_PAGES[slug],
      source_text: sourceText,
    },
  };
  await writeFile(path.join(correctionDirectory, name), `${JSON.stringify(correction, null, 2)}\n`, 'utf8');
}

console.log(`Generated ${rawNames.length} HJH runtime corrections anchored to the official PDF.`);
