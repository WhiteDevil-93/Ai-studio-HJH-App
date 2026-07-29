import {loadEntryTree} from './entryLoader';
import {legacyTitle, type LegacyCategory, type LegacyClinicalRecord} from './entryNormalize';

export type {LegacyClinicalRecord} from './entryNormalize';
export {legacyTitle};

export const clinicalData = loadEntryTree();

// Comprehensive Bidirectional Disease <-> Drug / Infusion Mappings
export const DISEASE_DRUG_PAIRINGS: Record<string, string[]> = {
  'Acute Coronary Syndrome (ACS) Algorithm': [
    'Adrenalin', 'Amiodarone', 'Aspirin', 'Clopidogrel', 'Nitroglycerin', 'Isosorbide Dinitrate',
    'Morphine', 'Fentanyl', 'Clexane', 'Heparin', 'Simvastatin', 'Atenolol', 'Alteplase', 'Tenectaplase'
  ],
  'STEMI Equivalents & Sgarbossa Criteria': [
    'Aspirin', 'Clopidogrel', 'Nitroglycerin', 'Clexane', 'Heparin', 'Alteplase', 'Tenectaplase'
  ],
  'Acute Ischaemic Stroke': [
    'Alteplase', 'Labetalol', 'Esmolol', 'Nitroglycerin', 'Tranexamic Acid'
  ],
  'Acute Heart Failure (AHF)': [
    'Furosemide', 'Nitroglycerin', 'Isosorbide Dinitrate', 'Morphine', 'Dobutamine',
    'Noradrenaline', 'Captopril', 'Perindopril', 'Enalapril', 'Digoxin'
  ],
  'Atrial Fibrillation (AF)': [
    'Amiodarone', 'Esmolol', 'Labetalol', 'Digoxin', 'Propanolol', 'Atenolol'
  ],
  'Asthma Exacerbation': [
    'Salbutamol', 'Atrovent', 'Hydrocortisone', 'Methylprednisolone', 'Prednisone',
    'Magnesium', 'Aminophylline', 'Ketamine', 'Adrenalin'
  ],
  'COPD Exacerbation': [
    'Salbutamol', 'Atrovent', 'Prednisone', 'Hydrocortisone', 'Amoxicillin', 'Augmentin', 'Azithromycin'
  ],
  'Sepsis & Septic Shock': [
    'Noradrenaline', 'Adrenalin', 'Hydrocortisone', 'Augmentin', 'Ceftriaxone',
    'Tazocin', 'Meropenem', 'Amikacin', 'Vancomycin', 'Colistin'
  ],
  'Upper Gastrointestinal Bleed (UGIB)': [
    'Pantoprazole', 'Octreotide', 'Ceftriaxone', 'Tranexamic Acid', 'Packed cells', 'FFP', 'Platelets'
  ],
  'Vaginal Bleeding (ED Management)': [
    'Tranexamic Acid', 'Oxytocin', 'Misoprostol', 'Packed cells'
  ],
  'Vascular Emergencies (AAA, Dissection, Limb Ischaemia)': [
    'Labetalol', 'Esmolol', 'Fentanyl', 'Morphine', 'Heparin', 'Clexane'
  ],
  'Malaria (Uncomplicated & Complicated)': [
    'Artesunate', 'Quinine', 'Doxycycline', 'Paracetamol'
  ],
  'Headache (Red Flags & Primary Syndromes)': [
    'Paracetamol', 'Diclofenac', 'Prochloperazine', 'Promethazine', 'Morphine'
  ],
  'Dizziness & Vertigo (HINTS Exam)': [
    'Prochloperazine', 'Promethazine', 'Diazepam'
  ],
  'Status Epilepticus': [
    'Lorazepam', 'Diazepam', 'Midazolam', 'Clonazepam', 'Phenytoin', 'Valproate',
    'Phenobarbitone', 'Thiopentone', 'Propofol', 'Ketamine', 'Paraldehyde'
  ],
  'Hyperkalaemia': [
    '10% Calcium Chloride', '10% Calcium Gluconate', 'Actrapid', 'Salbutamol',
    'NaHCO3 8.5%', 'Furosemide', 'Kayexalate'
  ],
  'Organophosphates': [
    'Atropine', 'Diazepam', 'Midazolam'
  ],
  'Paracetamol': [
    'Acetylcysteine'
  ],
};

// Reverse mapping: Drug -> list of associated Emergency Issues
export function getAssociatedDiseasesForDrug(drugName: string): string[] {
  const norm = drugName.toLowerCase().trim();
  const matched: string[] = [];

  for (const [disease, drugs] of Object.entries(DISEASE_DRUG_PAIRINGS)) {
    if (drugs.some(d => d.toLowerCase().includes(norm) || norm.includes(d.toLowerCase()))) {
      matched.push(disease);
    }
  }

  return matched;
}

// Find paired drug records for a given disease title
export function getPairedDrugsForDisease(diseaseTitle: string): LegacyClinicalRecord[] {
  const pairedNames = DISEASE_DRUG_PAIRINGS[diseaseTitle] || [];
  if (pairedNames.length === 0) return [];

  const found: LegacyClinicalRecord[] = [];
  const added = new Set<string>();

  for (const [catKey, category] of Object.entries(clinicalData)) {
    if (catKey === '16_score_calculators') continue;
    for (const subCat of Object.values(category as LegacyCategory)) {
      const records = Array.isArray(subCat) ? subCat : [subCat];
      for (const rec of records) {
        const title = legacyTitle(rec);
        if (!title || added.has(title)) continue;

        const isMatch = pairedNames.some(pName =>
          title.toLowerCase().includes(pName.toLowerCase()) ||
          pName.toLowerCase().includes(title.toLowerCase())
        );

        if (isMatch) {
          found.push(rec);
          added.add(title);
        }
      }
    }
  }

  return found;
}

