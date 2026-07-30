import pocketReferenceMarkdown from '../../clinical-sources/raw/pocket-reference-guide-v3.md?raw';
import clinicalGuidelinesMarkdown from '../../clinical-sources/raw/clinical-guidelines-reference-v3.md?raw';

export type GlobalReferenceDocumentId = 'pocket' | 'guidelines';

export interface ParsedReferenceEntry {
  title: string;
  section: string;
  body: string;
}

export interface ParsedReferenceDocument {
  title: string;
  introduction: string;
  entries: ParsedReferenceEntry[];
  supplementarySections: ParsedReferenceEntry[];
}

interface ReferenceDocumentDefinition {
  id: GlobalReferenceDocumentId;
  label: string;
  filename: string;
  markdown: string;
  sourceSha256: string;
  citationMarkerCount: number;
  uniqueCitationMarkerCount: number;
  imperativeTermCount: number;
  auditNotes: string[];
}

export interface ClinicalReferenceCorrection {
  titleMatch: string;
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const GLOBAL_REFERENCE_DOCUMENTS: Record<
  GlobalReferenceDocumentId,
  ReferenceDocumentDefinition
> = {
  pocket: {
    id: 'pocket',
    label: 'Pocket Reference Guide',
    filename: 'pocket-reference-guide-v3.md',
    markdown: pocketReferenceMarkdown,
    sourceSha256: '6d2dddee49e5b1af5a7dd98ab3b7bf0decf744b9a9742ec53d19b455a328a892',
    citationMarkerCount: 13,
    uniqueCitationMarkerCount: 10,
    imperativeTermCount: 22,
    auditNotes: [
      'The pocket reference includes a bibliography and direct links; confirm clinical claims against the current primary publication.',
      'Its Surviving Sepsis summary still overstates the 2026 guideline: the adult fluid recommendation is conditional, uses the first 3 hours, and explicitly requires individualization and frequent reassessment.',
      'Its FEAST mechanism statement over-attributes mortality to fluid overload and pulmonary oedema; the primary trial observed few such events and did not establish that mechanism.',
      'Its GASTROSAM card cites the 2021 trial protocol as if it were completed evidence and incorrectly claims a significant survival improvement. The completed 2025 trial found no evidence of a mortality difference between oral and intravenous strategies.',
    ],
  },
  guidelines: {
    id: 'guidelines',
    label: 'Clinical Guidelines Directory',
    filename: 'clinical-guidelines-reference-v3.md',
    markdown: clinicalGuidelinesMarkdown,
    sourceSha256: 'e8a00c677607cb8afa77b2277c1e75c819a0eb1ed87f7476490000c8e78114f2',
    citationMarkerCount: 20,
    uniqueCitationMarkerCount: 19,
    imperativeTermCount: 43,
    auditNotes: [
      'The guideline directory includes a bibliography and one URL per card; some links are local studies or protocols rather than the named organization’s current publication.',
      'Eleven direct URLs are duplicated across unrelated organizations, affecting 27 of the 43 records. Those links cannot verify the named guideline cards.',
      'The file still blends international guidance, local practice, preprints, audits, and trial evidence without claim-level provenance.',
      'KDIGO 2026 AKI/AKD is currently a public-review draft, not a final published clinical-practice guideline.',
      'Dose-level and imperative bedside statements must be checked against the active facility protocol before use.',
    ],
  },
};

export const SUPPLIED_GUIDELINE_LINK_AUDIT = {
  guidelineCount: 43,
  duplicateUrlGroupCount: 11,
  recordsWithDuplicatedUrlCount: 27,
  affectedGuidelineIds: [
    4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 20, 22, 24, 25, 26, 27, 28, 31,
    32, 33, 34, 36, 37, 38, 39, 41, 42,
  ],
} as const;

export const CLINICAL_REFERENCE_CORRECTIONS: Record<
  GlobalReferenceDocumentId,
  ClinicalReferenceCorrection[]
> = {
  pocket: [
    {
      titleMatch: 'FEAST Trial',
      summary: 'FEAST found higher 48-hour mortality with bolus treatment, but it did not establish the supplied cardiac-reserve/mechanical-ventilation mechanism.',
      sourceLabel: 'FEAST primary publication',
      sourceUrl: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1101549',
    },
    {
      titleMatch: 'GASTROSAM Trial',
      summary: 'The supplied 2021 citation is the study protocol. The completed trial was published in 2025 and found no evidence of a mortality difference between oral and intravenous rehydration.',
      sourceLabel: 'Completed GASTROSAM trial',
      sourceUrl: 'https://www.nejm.org/doi/10.1056/NEJMoa2505752',
    },
    {
      titleMatch: 'Sepsis & Fluid Resuscitation',
      summary: 'The 2026 Surviving Sepsis Campaign does not impose the rigid one-hour fluid rule described here. It conditionally suggests at least 30 mL/kg in the first 3 hours, individualized with frequent reassessment.',
      sourceLabel: 'Official SSC 2026 guideline',
      sourceUrl: 'https://www.sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines',
    },
    {
      titleMatch: 'Pediatric Severe Acute Malnutrition',
      summary: 'The completed GASTROSAM trial did not show a significant survival advantage for intravenous rehydration; the supplied card must not be used to claim one.',
      sourceLabel: 'Completed GASTROSAM trial',
      sourceUrl: 'https://www.nejm.org/doi/10.1056/NEJMoa2505752',
    },
  ],
  guidelines: [
    {
      titleMatch: 'Guideline 10:',
      summary: 'The 2026 Surviving Sepsis Campaign recommendation is conditional and calls for individualized fluid resuscitation with frequent reassessment, not the rigid one-hour rule stated in this supplied card.',
      sourceLabel: 'Official SSC 2026 guideline',
      sourceUrl: 'https://www.sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines',
    },
    {
      titleMatch: 'Guideline 35:',
      summary: 'The 2021 GASTROSAM item cited here is a protocol, not completed outcome evidence. The 2025 trial found no evidence that intravenous rehydration reduced mortality.',
      sourceLabel: 'Completed GASTROSAM trial',
      sourceUrl: 'https://www.nejm.org/doi/10.1056/NEJMoa2505752',
    },
  ],
};

export const getClinicalReferenceCorrection = (
  documentId: GlobalReferenceDocumentId,
  title: string,
) => CLINICAL_REFERENCE_CORRECTIONS[documentId].find(
  correction => title.includes(correction.titleMatch),
);

export const getGuidelineId = (title: string) => {
  const match = title.match(/Guideline\s+(\d+):/);
  return match ? Number(match[1]) : null;
};

export const OFFICIAL_EDITION_CHECKS = [
  {
    label: 'AHA CPR & ECC 2025',
    status: 'Published',
    url: 'https://professional.heart.org/en/science-news/2025-aha-guidelines-for-cpr-and-ecc',
  },
  {
    label: 'ERC Resuscitation 2025',
    status: 'Published',
    url: 'https://www.erc.edu/science-research/guidelines/guidelines-2025/',
  },
  {
    label: 'GINA 2026',
    status: 'Published',
    url: 'https://ginasthma.org/reports/',
  },
  {
    label: 'GOLD 2026',
    status: 'Published',
    url: 'https://goldcopd.org/2026-gold-report-and-pocket-guide/',
  },
  {
    label: 'Surviving Sepsis Campaign 2026',
    status: 'Published',
    url: 'https://www.sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines',
  },
  {
    label: 'KDIGO AKI/AKD 2026',
    status: 'Public-review draft',
    url: 'https://kdigo.org/guidelines/acute-kidney-injury/',
  },
] as const;

export const parseReferenceDocument = (
  markdown: string,
): ParsedReferenceDocument => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let title = '';
  let section = '';
  let introduction = '';
  let looseSectionBody = '';
  let current: ParsedReferenceEntry | null = null;
  const entries: ParsedReferenceEntry[] = [];
  const supplementarySections: ParsedReferenceEntry[] = [];

  const flush = () => {
    if (!current) return;
    current.body = current.body.trim();
    entries.push(current);
    current = null;
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      title = h1[1].trim();
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flush();
      if (looseSectionBody.trim()) {
        if (entries.length > 0 && section) {
          supplementarySections.push({
            title: section,
            section,
            body: looseSectionBody.trim(),
          });
        } else {
          introduction += `${looseSectionBody.trim()}\n`;
        }
        looseSectionBody = '';
      }
      section = h2[1].trim();
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flush();
      if (looseSectionBody.trim()) {
        introduction += `${looseSectionBody.trim()}\n`;
        looseSectionBody = '';
      }
      current = {
        title: h3[1].trim(),
        section,
        body: '',
      };
      continue;
    }

    if (line.trim() === '---') continue;

    if (current) {
      current.body += `${line}\n`;
    } else if (line.trim()) {
      looseSectionBody += `${line}\n`;
    }
  }

  flush();
  if (looseSectionBody.trim()) {
    if (entries.length > 0 && section) {
      supplementarySections.push({
        title: section,
        section,
        body: looseSectionBody.trim(),
      });
    } else {
      introduction += `${looseSectionBody.trim()}\n`;
    }
  }

  return {
    title,
    introduction: introduction.trim(),
    entries,
    supplementarySections,
  };
};

export const PARSED_GLOBAL_REFERENCE_DOCUMENTS = {
  pocket: parseReferenceDocument(GLOBAL_REFERENCE_DOCUMENTS.pocket.markdown),
  guidelines: parseReferenceDocument(GLOBAL_REFERENCE_DOCUMENTS.guidelines.markdown),
} satisfies Record<GlobalReferenceDocumentId, ParsedReferenceDocument>;
