import React from 'react';
import {DrugCard, type ClinicalCardSharedProps} from './DrugCard';
import {EDProcedureCard} from './EDProcedureCard';

export interface ClinicalEntryCardProps extends ClinicalCardSharedProps {
  entry: any;
  category: string;
  isExpanded: boolean;
  onToggleExpanded: (key: string) => void;
  checklistStatus: Record<string, boolean>;
  onToggleChecklistItem: (itemKey: string) => void;
  onOpenMindMap: (mindMapId: string) => void;
}

export const ClinicalEntryCard: React.FC<ClinicalEntryCardProps> = ({
  entry,
  category,
  isExpanded,
  onToggleExpanded,
  checklistStatus,
  onToggleChecklistItem,
  onOpenMindMap,
  ...rest
}) => {
  const type = entry?._meta?.type;
  if (type === 'protocol' || type === 'procedure' || entry?.protocol_type === 'ed_protocol') {
    return (
      <EDProcedureCard
        item={entry}
        category={category}
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
        checklistStatus={checklistStatus}
        onToggleChecklistItem={onToggleChecklistItem}
        onOpenMindMap={onOpenMindMap}
        {...rest}
      />
    );
  }
  return <DrugCard item={entry} category={category} {...rest} />;
};
