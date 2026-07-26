export type ClinicalEntryType =
  | 'drug'
  | 'protocol'
  | 'procedure'
  | 'score'
  | 'formula'
  | 'reference';

export type ReviewState =
  | 'unreviewed'
  | 'clinical-review'
  | 'approved'
  | 'retired';

export interface SourceReference {
  sourceId: string;
  pdfPages: number[];
  sectionTitle: string;
  transformation: 'exact' | 'condensed' | 'derived' | 'combined' | 'externally-sourced';
}

export interface ClinicalWarning {
  id: string;
  severity: 'information' | 'caution' | 'critical';
  text: string;
}

export interface ReviewStatus {
  state: ReviewState;
  contentVersion: string;
  reviewedAt?: string;
  reviewedBy?: string[];
}

export interface ClinicalEntry {
  id: string;
  type: ClinicalEntryType;
  categoryId: string;
  subcategoryId: string;
  title: string;
  aliases: string[];
  sourceRefs: SourceReference[];
  review: ReviewStatus;
  warnings: ClinicalWarning[];
  legacy: Record<string, unknown>;
}

export type CriterionAnswer = 'unanswered' | 'yes' | 'no';
