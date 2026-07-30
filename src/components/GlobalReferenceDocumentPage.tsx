import React from 'react';
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Globe2,
} from 'lucide-react';
import {
  OFFICIAL_EDITION_CHECKS,
  PARSED_GLOBAL_REFERENCE_DOCUMENTS,
  getClinicalReferenceCorrection,
  type GlobalReferenceDocumentId,
} from '../clinical/globalReferenceDocuments';

interface GlobalReferenceDocumentPageProps {
  documentId: GlobalReferenceDocumentId;
  searchQuery: string;
}

const REFERENCE_DISPLAY_TITLES: Record<GlobalReferenceDocumentId, string> = {
  guidelines: 'International Clinical Guidelines',
  pocket: 'Emergency Medicine Pocket Guides',
};

const REFERENCE_DESCRIPTIONS: Record<GlobalReferenceDocumentId, string> = {
  guidelines:
    'A searchable directory of international clinical organizations, current guidance, and practical context for emergency care.',
  pocket:
    'Concise evidence and protocol summaries for rapid reference in African emergency and resuscitation practice.',
};

const cleanClinicalMarkdown = (value: string) => value
  .replace(/\t+/g, ' ')
  .replace(/\$+/g, '')
  .replace(/\\text\{([^}]+)\}/g, '$1')
  .replace(/\\ge/g, '≥')
  .replace(/\\le/g, '≤')
  .replace(/\\times/g, '×')
  .replace(/\\%/g, '%')
  .replace(/\\textdegree/g, '°')
  .replace(/The Hook:/gi, 'Clinical question:')
  .replace(/If the Consultant asks:/gi, 'Clinical relevance:')
  .replace(/The Killer Stat:/gi, 'Key result:')
  .replace(/On-Shift Action:/gi, 'Practice application:')
  .replace(/30-Second Rounding Pitch/gi, 'Clinical interpretation')
  .replace(/Global Standard/gi, 'International guidance')
  .replace(/The African Reality\s*\/\s*Physiological Conflict/gi, 'Resource context')
  .replace(/The Local Adaptation\s*\("What to say on rounds"\)/gi, 'Local practice context')
  .replace(/Landmark Supporting Evidence/gi, 'Supporting evidence')
  .replace(/Active Bibliography\s*&\s*URL/gi, 'Primary source')
  .replace(/Active Bibliography/gi, 'Bibliography')
  .replace(/Direct Source URL/gi, 'Primary source')
  .replace(/Standard consensus/gi, 'International guidance')
  .replace(/The African Reality/gi, 'Regional resource context')
  .replace(/Local Adaptation/gi, 'Resource-adapted practice')
  .replace(/Attending Pitch/gi, 'Clinical summary')
  .replace(/\s+/g, ' ')
  .trim();

const getSectionTitle = (section: string) => {
  if (/LANDMARK TRIALS/i.test(section)) return 'Landmark trial summaries';
  if (/CORE ADAPTED PROTOCOLS/i.test(section)) return 'Adapted clinical protocols';
  if (/FULL EXHAUSTIVE CLINICAL BIBLIOGRAPHY/i.test(section)) return 'Clinical bibliography';
  if (/Core Clinical Guidelines/i.test(section)) return 'Guideline organizations';

  return section
    .replace(/^\d+\.\s*/, '')
    .replace(/\s+\([^)]*\)\s*$/, '')
    .trim();
};

interface EntryTitleParts {
  indexLabel?: string;
  title: string;
  description?: string;
}

const getEntryTitleParts = (
  documentId: GlobalReferenceDocumentId,
  rawTitle: string,
): EntryTitleParts => {
  if (documentId === 'guidelines') {
    const match = rawTitle.match(
      /^[^\p{L}\p{N}]*Guideline\s+(\d+):\s*(.*?)(?:\s+—\s+(.+))?$/u,
    );
    if (match) {
      return {
        indexLabel: match[1].padStart(2, '0'),
        title: match[2].trim(),
        description: match[3]?.trim(),
      };
    }
  }

  return {
    title: rawTitle.replace(/^[^\p{L}\p{N}]+/u, '').trim(),
  };
};

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
              title="Open source reference"
              className="break-all font-medium text-indigo-300 underline decoration-indigo-700 underline-offset-2 hover:text-indigo-200"
            >
              {suppliedLink[1]}
            </a>
          );
        }
        if (/^\*\*[^*]+\*\*$/.test(chunk)) {
          return <strong key={index} className="font-semibold text-slate-200">{chunk.slice(2, -2)}</strong>;
        }
        if (/^\[[0-9,\s]+\]$/.test(chunk)) {
          return (
            <span
              key={index}
              title="Citation number retained from the supplied document"
              className="mx-0.5 rounded bg-slate-800 px-1 text-[10px] font-semibold text-slate-400"
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
  <div className="space-y-2">
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
          className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-300"
          style={{paddingLeft: `${indent * 0.85}rem`}}
        >
          {(bullet || numbered) && (
            <span className="mt-[0.42rem] h-1 w-1 flex-shrink-0 rounded-full bg-indigo-400" />
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

  const LibraryIcon = documentId === 'guidelines' ? Globe2 : BookOpen;

  return (
    <div className="space-y-6" data-reference-document={documentId}>
      <header className="rounded-2xl border border-slate-700/70 bg-slate-900/75 p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-300">
              <LibraryIcon className="h-4 w-4" />
              Global clinical reference
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              {REFERENCE_DISPLAY_TITLES[documentId]}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              {REFERENCE_DESCRIPTIONS[documentId]}
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-slate-300">
            {entries.length} of {document.entries.length} entries
          </span>
        </div>
      </header>

      {documentId === 'guidelines' && (
        <details className="group rounded-xl border border-slate-800 bg-slate-900/45">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-slate-300">
            <span>Verified edition and organization links</span>
            <span className="flex items-center gap-2 text-slate-500">
              {OFFICIAL_EDITION_CHECKS.length} sources
              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
            </span>
          </summary>
          <div className="grid gap-2 border-t border-slate-800 p-3 sm:grid-cols-2">
            {OFFICIAL_EDITION_CHECKS.map(check => (
              <a
                key={check.label}
                href={check.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5 text-xs text-slate-300 transition-colors hover:border-indigo-700 hover:text-white"
              >
                <span>
                  <span className="block font-semibold">{check.label}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">{check.status}</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
              </a>
            ))}
          </div>
        </details>
      )}

      {entries.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 py-16 text-center text-sm text-slate-500">
          No entries match “{searchQuery}”.
        </div>
      )}

      {Object.entries(grouped).map(([section, sectionEntries]) => (
        <section key={section} className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <h3 className="text-sm font-semibold text-slate-200">
              {getSectionTitle(section)}
            </h3>
            <span className="rounded-md border border-slate-800 bg-slate-900/70 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              {sectionEntries.length}
            </span>
          </div>

          <div className="space-y-2">
            {sectionEntries.map(entry => {
              const correction = getClinicalReferenceCorrection(documentId, entry.title);
              const title = getEntryTitleParts(documentId, entry.title);

              return (
                <details
                  key={entry.title}
                  className="group rounded-xl border border-slate-800 bg-slate-900/40 transition-colors open:border-indigo-700/60 open:bg-slate-900/65"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
                    {title.indexLabel && (
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-950/70 text-[10px] font-semibold text-slate-400">
                        {title.indexLabel}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug text-slate-100">
                        {title.title}
                      </span>
                      {title.description && (
                        <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                          {title.description}
                        </span>
                      )}
                    </span>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="space-y-4 border-t border-slate-800 px-4 py-4 sm:px-5">
                    {correction && (
                      <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/20 px-3 py-2.5 text-[11px] leading-relaxed text-slate-300">
                        <div className="font-semibold text-indigo-300">Current source note</div>
                        <div className="mt-1">{correction.summary}</div>
                        <a
                          href={correction.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 font-semibold text-indigo-300 underline decoration-indigo-700 underline-offset-2"
                        >
                          {correction.sourceLabel}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    <ReferenceBody body={entry.body} />
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ))}

      {document.supplementarySections.map(section => (
        <section key={`supplement-${section.title}`} className="space-y-3">
          <div className="px-1 text-sm font-semibold text-slate-200">
            Supporting material
          </div>
          <details className="group rounded-xl border border-slate-800 bg-slate-900/40 open:border-indigo-700/60">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-slate-100">
              <span>{getSectionTitle(section.title)}</span>
              <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-90" />
            </summary>
            <div className="border-t border-slate-800 px-4 py-4 sm:px-5">
              <ReferenceBody body={section.body} />
            </div>
          </details>
        </section>
      ))}
    </div>
  );
};
