import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

hjh_dir = r"clinical-sources\raw\all_hospitals_protocols\HJH"
json_files = sorted([f for f in os.listdir(hjh_dir) if f.endswith('.json')])

# Official TOC Map from Pages 3-5 of HJH ED Protocol book 2026 v1
TOC_MAPPING = {
    'acetylcholinesterase_inhibitor_overdose.json': ('12_ed_toxicology', 'Toxicology & Poisoning'),
    'acute_appendicitis.json': ('15_ed_general_surgery', 'General Surgery'),
    'acute_cholecystitis.json': ('15_ed_general_surgery', 'General Surgery'),
    'acute_coronary_syndrome_acs_algorithm.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'acs_workup_algorithm.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'actilyse_protocol.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'acute_heart_failure_ahf.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'acute_ischaemic_stroke.json': ('04_ed_neurology', 'Neurology'),
    'agitation_aggression.json': ('14_ed_psychiatry', 'Psychiatry & Mental Health'),
    'airway_management_checklist_rsi.json': ('06_ed_airway', 'Airway & Ventilation'),
    'aha_resuscitation_algorithms.json': ('17_ed_critical_care', 'Resuscitation & Critical Care'),
    'anaphylaxis.json': ('12_ed_toxicology', 'Toxicology & Allergy'),
    'angioedema.json': ('12_ed_toxicology', 'Toxicology & Allergy'),
    'asthma_exacerbation.json': ('05_ed_pulmonary', 'Pulmonology & Respiratory'),
    'asthma_pefr.json': ('05_ed_pulmonary', 'Pulmonology & Respiratory'),
    'atrial_fibrillation_af.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'back_pain.json': ('02_ed_trauma_ortho', 'Trauma & Orthopaedics'),
    'blood_products.json': ('17_ed_critical_care', 'Resuscitation & Blood Products'),
    'brainstem_death.json': ('17_ed_critical_care', 'Critical Care'),
    'burns.json': ('13_ed_trauma_surgical', 'Trauma & Surgery'),
    'c_spine_imaging.json': ('02_ed_trauma_ortho', 'Trauma & Orthopaedics'),
    'ccb_bb_overdose.json': ('12_ed_toxicology', 'Toxicology & Poisoning'),
    'community_acquired_pneumonia.json': ('05_ed_pulmonary', 'Pulmonology & Respiratory'),
    'compartment_syndrome.json': ('02_ed_trauma_ortho', 'Trauma & Orthopaedics'),
    'copd_exacerbation.json': ('05_ed_pulmonary', 'Pulmonology & Respiratory'),
    'critical_care_principles.json': ('17_ed_critical_care', 'Critical Care'),
    'crush_injury.json': ('02_ed_trauma_ortho', 'Trauma & Orthopaedics'),
    'diabetic_ketoacidosis_dka.json': ('14_ed_metabolic', 'Metabolic & Endocrine'),
    'difficult_airway.json': ('06_ed_airway', 'Airway & Ventilation'),
    'dizziness_vertigo_hints_exam.json': ('04_ed_neurology', 'Neurology'),
    'dvt.json': ('05_ed_pulmonary', 'Vascular & Pulmonology'),
    'ent_emergencies.json': ('07_ed_ent', 'ENT (Ear, Nose & Throat)'),
    'femoral_nerve_block.json': ('15_ed_procedures', 'Procedures & Pain'),
    'first_onset_seizures.json': ('04_ed_neurology', 'Neurology'),
    'gastroenteritis_paediatrics.json': ('11_ed_medical_emergencies', 'Paediatric & Medical Emergencies'),
    'general_toxicology.json': ('12_ed_toxicology', 'Toxicology & Poisoning'),
    'haematological_emergencies.json': ('11_ed_medical_emergencies', 'Haematology & Medical Emergencies'),
    'head_injury.json': ('13_ed_trauma_surgical', 'Trauma & Neurosurgery'),
    'headache_red_flags_primary_syndromes.json': ('04_ed_neurology', 'Neurology'),
    'hyperglycaemia_flowchart.json': ('14_ed_metabolic', 'Metabolic & Endocrine'),
    'hyperkalaemia.json': ('14_ed_metabolic', 'Metabolic & Electrolytes'),
    'hypernatraemia.json': ('14_ed_metabolic', 'Metabolic & Electrolytes'),
    'hypertension_flowchart.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'hypertensive_emergencies.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'hyperthermia.json': ('11_ed_medical_emergencies', 'Medical Emergencies'),
    'hypoglycaemia.json': ('14_ed_metabolic', 'Metabolic & Endocrine'),
    'hypokalaemia.json': ('14_ed_metabolic', 'Metabolic & Electrolytes'),
    'hyponatraemia.json': ('14_ed_metabolic', 'Metabolic & Electrolytes'),
    'hypothermia.json': ('11_ed_medical_emergencies', 'Medical Emergencies'),
    'indications_dialysis.json': ('14_ed_metabolic', 'Renal & Metabolic'),
    'infusions.json': ('15_ed_procedures', 'Procedures & Infusions'),
    'intermediate_low_risk_chest_pain.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'isoniazid_overdose.json': ('12_ed_toxicology', 'Toxicology & Poisoning'),
    'jaundice_flowchart.json': ('15_ed_general_surgery', 'General Surgery & Hepatic'),
    'liver_failure.json': ('11_ed_medical_emergencies', 'Gastroenterology & Hepatic'),
    'malaria_uncomplicated_complicated.json': ('13_ed_infectious_diseases', 'Infectious Diseases'),
    'medicolegal_recordkeeping.json': ('16_ed_administration', 'Administration & Medicolegal'),
    'meningococcal_prophylaxis.json': ('13_ed_infectious_diseases', 'Infectious Diseases'),
    'mental_health_psychosis.json': ('14_ed_psychiatry', 'Psychiatry & Mental Health'),
    'non_invasive_ventilation.json': ('06_ed_airway', 'Airway & Ventilation'),
    'nstemi_management.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'oncological_emergencies.json': ('11_ed_medical_emergencies', 'Oncology & Medical Emergencies'),
    'ophthalmology_emergencies.json': ('11_ed_medical_emergencies', 'Ophthalmology'),
    'pain_management.json': ('15_ed_procedures', 'Procedures & Pain'),
    'paracetamol_nomogram.json': ('12_ed_toxicology', 'Toxicology & Poisoning'),
    'paracetamol_overdose.json': ('12_ed_toxicology', 'Toxicology & Poisoning'),
    'pe_algorithm.json': ('05_ed_pulmonary', 'Pulmonology & Respiratory'),
    'post_exposure_prophylaxis.json': ('13_ed_infectious_diseases', 'Infectious Diseases'),
    'procedural_sedation.json': ('06_ed_airway', 'Airway & Procedures'),
    'pulmonary_embolism.json': ('05_ed_pulmonary', 'Pulmonology & Respiratory'),
    'rabies_animal_bites.json': ('13_ed_infectious_diseases', 'Infectious Diseases'),
    'raised_icp.json': ('04_ed_neurology', 'Neurology'),
    'renal_colic.json': ('11_ed_medical_emergencies', 'Urology & Medical Emergencies'),
    'salicylate_overdose.json': ('12_ed_toxicology', 'Toxicology & Poisoning'),
    'scorpion_envenomation.json': ('12_ed_toxicology', 'Toxicology & Envenomation'),
    'sepsis_septic_shock.json': ('17_ed_critical_care', 'Resuscitation & Critical Care'),
    'sexual_assault.json': ('08_ed_obstetrics_gynaecology', 'Obstetrics & Gynaecology'),
    'snakebite.json': ('12_ed_toxicology', 'Toxicology & Envenomation'),
    'status_epilepticus.json': ('04_ed_neurology', 'Neurology'),
    'status_epilepticus_algorithm.json': ('04_ed_neurology', 'Neurology'),
    'stemi_equivalents_sgarbossa_criteria.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'stemi_management.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'subarachnoid_haemorrhage.json': ('04_ed_neurology', 'Neurology'),
    'syncope.json': ('03_ed_cardiovascular', 'Cardiovascular & Neurology'),
    'syncope_ecg.json': ('03_ed_cardiovascular', 'Cardiovascular'),
    'tca_overdose.json': ('12_ed_toxicology', 'Toxicology & Poisoning'),
    'tetanus.json': ('13_ed_infectious_diseases', 'Infectious Diseases'),
    'thyroid_emergencies.json': ('14_ed_metabolic', 'Endocrine & Metabolic'),
    'toxic_alcohol.json': ('12_ed_toxicology', 'Toxicology & Poisoning'),
    'toxidromes.json': ('12_ed_toxicology', 'Toxicology & Poisoning'),
    'trauma_basics.json': ('02_ed_trauma_ortho', 'Trauma & Orthopaedics'),
    'triage_tews.json': ('16_ed_administration', 'Triage & Administration'),
    'upper_gastrointestinal_bleed_ugib.json': ('15_ed_general_surgery', 'General Surgery & GI'),
    'vaginal_bleeding_ed_management.json': ('08_ed_obstetrics_gynaecology', 'Obstetrics & Gynaecology'),
    'vascular_emergencies_aaa_dissection_limb_ischaemia.json': ('03_ed_cardiovascular', 'Vascular & Cardiovascular'),
    'ventilator_guidelines.json': ('06_ed_airway', 'Airway & Ventilation'),
    'warfarin_toxicity.json': ('12_ed_toxicology', 'Toxicology & Anticoagulation'),
}

report = []

for filename in json_files:
    filepath = os.path.join(hjh_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    meta = data.get('_meta', {})
    proto = data.get('protocol', data)
    title = meta.get('title') or proto.get('item') or filename
    current_cat = meta.get('category', 'NONE')
    
    expected_cat, category_name = TOC_MAPPING.get(filename, ('NONE', 'Unknown'))
    
    cat_mismatch = current_cat != expected_cat
    
    text_blob = json.dumps(proto, ensure_ascii=False)
    corruptions = []
    
    if 'complainant' in text_blob.lower() or 'belt-like object' in text_blob.lower():
        corruptions.append('Mismatched text: Contains J88 / sexual assault court testimony snippet')
    if 'acknowledgement \ncompiled by dr r kularatne' in text_blob.lower() and 'mental' not in filename and 'meningitis' not in filename:
        corruptions.append('Mismatched text: Contains Dr Kularatne antimicrobial disclaimer snippet')
    if 'management office.' in text_blob.lower() and len(text_blob) < 400:
        corruptions.append('Truncated management steps')
        
    if cat_mismatch or corruptions:
        report.append({
            'file': filename,
            'title': title,
            'current_cat': current_cat,
            'expected_cat': expected_cat,
            'category_name': category_name,
            'cat_mismatch': cat_mismatch,
            'corruptions': corruptions
        })

out_file = "audit_report.json"
with open(out_file, 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)

print(f"Audit complete. Audited {len(json_files)} files. Found {len(report)} issues. Written to {out_file}")
