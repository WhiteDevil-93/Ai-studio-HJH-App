import React from 'react';
import {
  GLOBAL_REFERENCE_DOCUMENTS,
  OFFICIAL_EDITION_CHECKS,
  PARSED_GLOBAL_REFERENCE_DOCUMENTS,
  SUPPLIED_GUIDELINE_LINK_AUDIT,
  getClinicalReferenceCorrection,
  getGuidelineId,
  type GlobalReferenceDocumentId,
} from '../clinical/globalReferenceDocuments';

interface GlobalReferenceDocumentPageProps {
  documentId: GlobalReferenceDocumentId;
  searchQuery: string;
}

const cleanClinicalMarkdown = (value: string) => value
  .replace(/\t+/g, ' ')
  .replace(/\$+/g, '')
  .replace(/\\text\{([^}]+)\}/g, '$1')
  .replace(/\\ge/g, '≥')
  .replace(/\\le/g, '≤')
  .replace(/\\times/g, '×')
  .replace(/\\%/g, '%')
  .replace(/\\textdegree/g, '°')
  .replace(/\s+/g, ' ')
  .trim();

const InlineReferenceText = ({text}: {text: string}) => {
  const cleaned = cleanClinicalMarkdown(text);
  const chunks = cleaned.split(
    /(\*\*[^*]+\*\*|\[[^\]]+\]\((?:https?:\/\/)(?:[^()\s]+|\([^)]*\))+\)|\[[0-9,\s]+\])/g,
  ).filter(Boolean);

  return (
    <>
      {chunks.map((chunk, index) => {
        const suppliedLink = chunk.match(
          /^\[([^\]]+)\]\(((?:https?:\/\/)(?:[^()\s]+|\([^)]*\))+)\)$/,
        );
        if (suppliedLink) {
          return (
            <a
              key={index}
              href={suppliedLink[2]}
              target="_blank"
              rel="noreferrer"
              title="Open supplied source link (not independently verified)"
              className="break-all font-semibold text-sky-300 underline decoration-sky-700 underline-offset-2 hover:text-sky-200"
            >
              {suppliedLink[1]}
            </a>
          );
        }
        if (/^\*\*[^*]+\*\*$/.test(chunk)) {
          return <strong key={index}>{chunk.slice(2, -2)}</strong>;
        }
        if (/^\[[0-9,\s]+\]$/.test(chunk)) {
          return (
            <span
              key={index}
              title="Citation number retained from the supplied document"
              className="mx-0.5 rounded bg-amber-950/40 px-1 text-[10px] font-bold text-amber-300"
            >
              {chunk}
            </span>
          );
        }
        return <React.Fragment key={index}>{chunk.replace(/\*/g, '')}</React.Fragment>;
      })}
    </>
  );
};

const ReferenceBody = ({body}: {body: string}) => (
  <div className="space-y-1.5">
    {body.split('\n').map((rawLine, index) => {
      if (!rawLine.trim()) return null;
      const bullet = rawLine.match(/^(\s*)[*+-]\s+(.*)$/);
      const numbered = rawLine.match(/^(\s*)\d+\.\s+(.*)$/);
      const indent = Math.min(
        5,
        Math.floor(((bullet?.[1] ?? numbered?.[1] ?? '').length) / 4),
      );
      const content = bullet?.[2] ?? numbered?.[2] ?? rawLine;

      return (
        <div
          key={index}
          className="flex items-start gap-2 text-xs leading-relaxed text-slate-300"
          style={{paddingLeft: `${indent * 0.85}rem`}}
        >
          {(bullet || numbered) && (
            <span className="mt-0.5 flex-shrink-0 font-black text-purple-400">
              {numbered ? '•' : '•'}
            </span>
          )}
          <span><InlineReferenceText text={content} /></span>
        </div>
      );
    })}
  </div>
);

export const GlobalReferenceDocumentPage = ({
  documentId,
  searchQuery,
}: GlobalReferenceDocumentPageProps) => {
  const definition = GLOBAL_REFERENCE_DOCUMENTS[documentId];
  const document = PARSED_GLOBAL_REFERENCE_DOCUMENTS[documentId];
  const q = searchQuery.trim().toLowerCase();
  const entries = document.entries.filter(entry => (
    !q ||
    entry.title.toLowerCase().includes(q) ||
    entry.section.toLowerCase().includes(q) ||
    entry.body.toLowerCase().includes(q)
  ));

  const grouped = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    const key = entry.section || 'Reference entries';
    (acc[key] ??= []).push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-4" data-reference-document={documentId}>
      <div className="rounded-xl border border-purple-900/50 bg-[#1a0f26] p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
          Supplied global reference document
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black text-white">{document.title}</h2>
          <span className="rounded border border-purple-800/40 bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-300">
            {entries.length} of {document.entries.length} entries
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          This is a searchable rendering of {definition.filename}. It is global reference material,
          not a hospital-approved protocol. V3 bibliography and source links are retained and
          clickable, but they are shown as supplied and are not proof that each clinical claim or
          named guideline has been verified.
        </p>
        {document.introduction && (
          <div className="mt-3 border-t border-purple-900/40 pt-3">
            <ReferenceBody body={document.introduction} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
        <div className="text-xs font-black uppercase tracking-wider text-red-300">
          Audit required — do not use as stand-alone bedside instruction
        </div>
        <div className="mt-2 space-y-1.5">
          {definition.auditNotes.map(note => (
            <div key={note} className="flex gap-2 text-xs leading-relaxed text-red-100">
              <span className="font-black text-red-400">!</span>
              <span>{note}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-red-200/80">
          {definition.citationMarkerCount} citation markers · {definition.uniqueCitationMarkerCount} unique markers · {definition.imperativeTermCount} imperative/high-risk terms
        </div>
      </div>

      <div className="rounded-xl border border-sky-900/50 bg-sky-950/20 p-4">
        <div className="text-xs font-black uppercase tracking-wider text-sky-300">
          Official edition checks
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {OFFICIAL_EDITION_CHECKS.map(check => (
            <a
              key={check.label}
              href={check.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-sky-800/50 bg-sky-950/40 px-2.5 py-1.5 text-[10px] font-bold text-sky-200 hover:bg-sky-900/50"
            >
              {check.label} · {check.status}
            </a>
          ))}
        </div>
      </div>

      {entries.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-500">
          No entries in this document match your search.
        </div>
      )}

      {Object.entries(grouped).map(([section, sectionEntries]) => (
        <section key={section} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-300">
              {section}
            </h3>
            <span className="rounded bg-purple-950 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
              {sectionEntries.length}
            </span>
          </div>

          {sectionEntries.map(entry => {
            const correction = getClinicalReferenceCorrection(documentId, entry.title);
            const guidelineId = documentId === 'guidelines'
              ? getGuidelineId(entry.title)
              : null;
            const hasDuplicatedSuppliedUrl = guidelineId !== null &&
              SUPPLIED_GUIDELINE_LINK_AUDIT.affectedGuidelineIds.includes(
                guidelineId as typeof SUPPLIED_GUIDELINE_LINK_AUDIT.affectedGuidelineIds[number],
              );

            return (
              <details
                key={entry.title}
                className="group rounded-xl border border-slate-800 bg-[#081212] open:border-purple-800/60"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-bold text-slate-100">
                  <span>{entry.title}</span>
                  <span className="text-lg text-purple-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="space-y-3 border-t border-slate-800 px-4 py-3">
                  {hasDuplicatedSuppliedUrl && (
                    <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-[11px] leading-relaxed text-amber-100">
                      <strong>Link audit:</strong> this card’s direct URL is duplicated across
                      unrelated guideline organizations and does not verify the named guideline.
                    </div>
                  )}
                  {correction && (
                    <div className="rounded-lg border border-red-700/70 bg-red-950/40 px-3 py-2 text-[11px] leading-relaxed text-red-100">
                      <div className="font-black uppercase tracking-wide text-red-300">
                        Primary-source correction
                      </div>
                      <div className="mt-1">{correction.summary}</div>
                      <a
                        href={correction.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-block font-bold text-sky-300 underline decoration-sky-700 underline-offset-2"
                      >
                        {correction.sourceLabel}
                      </a>
                    </div>
                  )}
                  <ReferenceBody body={entry.body} />
                </div>
              </details>
            );
          })}
        </section>
      ))}

      {document.supplementarySections.map(section => (
        <section key={`supplement-${section.title}`} className="space-y-2">
          <div className="px-1 text-xs font-black uppercase tracking-wider text-sky-300">
            Supporting material
          </div>
          <details className="group rounded-xl border border-sky-900/60 bg-sky-950/20 open:border-sky-700/70">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-bold text-sky-100">
              <span>{section.title}</span>
              <span className="text-lg text-sky-400 transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="border-t border-sky-900/60 px-4 py-3">
              <ReferenceBody body={section.body} />
            </div>
          </details>
        </section>
      ))}
    </div>
  );
};
