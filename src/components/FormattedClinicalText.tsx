import React from 'react';
import {parseProtocolBlocks, type ProtocolBlock} from '../clinical/protocolBlocks';
import {HighlightedText} from './HighlightedText';

const ProtocolBlockView: React.FC<{block: ProtocolBlock; highlight?: string}> = ({
  block,
  highlight,
}) => {
  const indentClass = block.level > 0 ? 'ml-6' : '';
  const body = <HighlightedText text={block.text} highlight={highlight} />;

  if (block.kind === 'item' || block.marker) {
    return (
      <div
        data-protocol-block={block.kind}
        data-protocol-level={block.level}
        className={`flex items-start gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300 ${indentClass}`}
      >
        {block.marker ? (
          <span
            data-protocol-marker={block.marker}
            className="mt-0.5 min-w-[1.4rem] shrink-0 text-xs font-black tabular-nums text-slate-500 dark:text-slate-400"
          >
            {block.marker}
          </span>
        ) : null}
        <span className="flex-1">{body}</span>
      </div>
    );
  }

  return (
    <p
      data-protocol-block={block.kind}
      data-protocol-level={block.level}
      className={`text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${indentClass}`}
    >
      {body}
    </p>
  );
};

export const FormattedClinicalText: React.FC<{text: string; highlight?: string}> = ({
  text,
  highlight,
}) => {
  const blocks = parseProtocolBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <ProtocolBlockView key={index} block={block} highlight={highlight} />
      ))}
    </div>
  );
};
