import os
import json

hjh_dir = r"clinical-sources\raw\all_hospitals_protocols\HJH"

CATEGORY_FIXES = {
    # 02 Trauma & Ortho
    'back_pain.json': '02_ed_trauma_ortho',
    'compartment_syndrome.json': '02_ed_trauma_ortho',
    'crush_injury.json': '02_ed_trauma_ortho',
    'c_spine_imaging.json': '02_ed_trauma_ortho',
    'trauma_basics.json': '02_ed_trauma_ortho',

    # 03 Cardiovascular
    'acs_workup_algorithm.json': '03_ed_cardiovascular',
    'actilyse_protocol.json': '03_ed_cardiovascular',
    'acute_coronary_syndrome_acs_algorithm.json': '03_ed_cardiovascular',
    'acute_heart_failure_ahf.json': '03_ed_cardiovascular',
    'atrial_fibrillation_af.json': '03_ed_cardiovascular',
    'hypertension_flowchart.json': '03_ed_cardiovascular',
    'hypertensive_emergencies.json': '03_ed_cardiovascular',
    'intermediate_low_risk_chest_pain.json': '03_ed_cardiovascular',
    'nstemi_management.json': '03_ed_cardiovascular',
    'stemi_equivalents_sgarbossa_criteria.json': '03_ed_cardiovascular',
    'stemi_management.json': '03_ed_cardiovascular',
    'syncope.json': '03_ed_cardiovascular',
    'syncope_ecg.json': '03_ed_cardiovascular',
    'vascular_emergencies_aaa_dissection_limb_ischaemia.json': '03_ed_cardiovascular',

    # 04 Neurology
    'acute_ischaemic_stroke.json': '04_ed_neurology',
    'dizziness_vertigo_hints_exam.json': '04_ed_neurology',
    'first_onset_seizures.json': '04_ed_neurology',
    'headache_red_flags_primary_syndromes.json': '04_ed_neurology',
    'raised_icp.json': '04_ed_neurology',
    'status_epilepticus.json': '04_ed_neurology',
    'status_epilepticus_algorithm.json': '04_ed_neurology',
    'subarachnoid_haemorrhage.json': '04_ed_neurology',

    # 05 Pulmonology
    'asthma_exacerbation.json': '05_ed_pulmonary',
    'asthma_pefr.json': '05_ed_pulmonary',
    'community_acquired_pneumonia.json': '05_ed_pulmonary',
    'copd_exacerbation.json': '05_ed_pulmonary',
    'dvt.json': '05_ed_pulmonary',
    'pe_algorithm.json': '05_ed_pulmonary',
    'pulmonary_embolism.json': '05_ed_pulmonary',

    # 06 Airway
    'airway_management_checklist_rsi.json': '06_ed_airway',
    'difficult_airway.json': '06_ed_airway',
    'non_invasive_ventilation.json': '06_ed_airway',
    'procedural_sedation.json': '06_ed_airway',
    'ventilator_guidelines.json': '06_ed_airway',

    # 07 ENT
    'ent_emergencies.json': '07_ed_ent',

    # 08 ObGyn
    'sexual_assault.json': '08_ed_obstetrics_gynaecology',
    'vaginal_bleeding_ed_management.json': '08_ed_obstetrics_gynaecology',

    # 11 Medical Emergencies
    'gastroenteritis_paediatrics.json': '11_ed_medical_emergencies',
    'haematological_emergencies.json': '11_ed_medical_emergencies',
    'hyperthermia.json': '11_ed_medical_emergencies',
    'hypothermia.json': '11_ed_medical_emergencies',
    'liver_failure.json': '11_ed_medical_emergencies',
    'oncological_emergencies.json': '11_ed_medical_emergencies',
    'ophthalmology_emergencies.json': '11_ed_medical_emergencies',
    'renal_colic.json': '11_ed_medical_emergencies',

    # 12 Toxicology
    'acetylcholinesterase_inhibitor_overdose.json': '12_ed_toxicology',
    'anaphylaxis.json': '12_ed_toxicology',
    'angioedema.json': '12_ed_toxicology',
    'ccb_bb_overdose.json': '12_ed_toxicology',
    'general_toxicology.json': '12_ed_toxicology',
    'isoniazid_overdose.json': '12_ed_toxicology',
    'paracetamol_nomogram.json': '12_ed_toxicology',
    'paracetamol_overdose.json': '12_ed_toxicology',
    'salicylate_overdose.json': '12_ed_toxicology',
    'scorpion_envenomation.json': '12_ed_toxicology',
    'snakebite.json': '12_ed_toxicology',
    'tca_overdose.json': '12_ed_toxicology',
    'toxic_alcohol.json': '12_ed_toxicology',
    'toxidromes.json': '12_ed_toxicology',
    'warfarin_toxicity.json': '12_ed_toxicology',

    # 13 Infectious Diseases
    'malaria_uncomplicated_complicated.json': '13_ed_infectious_diseases',
    'meningococcal_prophylaxis.json': '13_ed_infectious_diseases',
    'post_exposure_prophylaxis.json': '13_ed_infectious_diseases',
    'rabies_animal_bites.json': '13_ed_infectious_diseases',
    'tetanus.json': '13_ed_infectious_diseases',

    # 13 Trauma & Surgical
    'burns.json': '13_ed_trauma_surgical',
    'head_injury.json': '13_ed_trauma_surgical',

    # 14 Metabolic
    'diabetic_ketoacidosis_dka.json': '14_ed_metabolic',
    'hyperglycaemia_flowchart.json': '14_ed_metabolic',
    'hyperkalaemia.json': '14_ed_metabolic',
    'hypernatraemia.json': '14_ed_metabolic',
    'hypoglycaemia.json': '14_ed_metabolic',
    'hypokalaemia.json': '14_ed_metabolic',
    'hyponatraemia.json': '14_ed_metabolic',
    'indications_dialysis.json': '14_ed_metabolic',
    'thyroid_emergencies.json': '14_ed_metabolic',

    # 14 Psychiatry
    'agitation_aggression.json': '14_ed_psychiatry',
    'mental_health_psychosis.json': '14_ed_psychiatry',

    # 15 General Surgery
    'acute_appendicitis.json': '15_ed_general_surgery',
    'acute_cholecystitis.json': '15_ed_general_surgery',
    'jaundice_flowchart.json': '15_ed_general_surgery',
    'upper_gastrointestinal_bleed_ugib.json': '15_ed_general_surgery',

    # 15 Procedures
    'femoral_nerve_block.json': '15_ed_procedures',
    'infusions.json': '15_ed_procedures',
    'pain_management.json': '15_ed_procedures',

    # 16 Administration
    'medicolegal_recordkeeping.json': '16_ed_administration',
    'triage_tews.json': '16_ed_administration',

    # 17 Critical Care
    'aha_resuscitation_algorithms.json': '17_ed_critical_care',
    'blood_products.json': '17_ed_critical_care',
    'brainstem_death.json': '17_ed_critical_care',
    'critical_care_principles.json': '17_ed_critical_care',
    'sepsis_septic_shock.json': '17_ed_critical_care',
}

updated_count = 0
for filename, new_cat in CATEGORY_FIXES.items():
    filepath = os.path.join(hjh_dir, filename)
    if not os.path.exists(filepath):
        print(f"Skipping missing file: {filename}")
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if '_meta' not in data:
        data['_meta'] = {}
    
    old_cat = data['_meta'].get('category')
    if old_cat != new_cat:
        data['_meta']['category'] = new_cat
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        updated_count += 1

print(f"Successfully updated category metadata for {updated_count} files.")
