import React from 'react';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const HighlightedText: React.FC<{text: string; highlight?: string}> = ({text, highlight}) => {
  const query = highlight?.trim();
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  if (parts.length <= 1) return <>{text}</>;

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark
            key={index}
            data-search-match=""
            className="rounded bg-amber-300/80 px-0.5 text-slate-900 dark:bg-amber-400/90 dark:text-slate-950"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};
