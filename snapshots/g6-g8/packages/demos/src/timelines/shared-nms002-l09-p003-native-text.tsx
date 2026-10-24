import React from 'react';
import type {TextPresentationSnapshot} from '../lesson-text-contract';

const ROW_IDS = ['tank-one', 'addend-one', 'addend-two', 'addend-three',
  'total'] as const;

/** One semantic copy per instructional row. Transient source text/outline
 * instances are drawing layers, not extra items in the reading order. */
export function NmsL09P003NativeText({snapshot, emphasisRow}: {
  readonly snapshot: TextPresentationSnapshot;
  readonly emphasisRow: 'tank-one' | 'addend-one' | null;
}) {
  if (snapshot.status !== 'ready') return null;
  const block = (id: string) => {
    const match = snapshot.blocks.find(item => item.id === id);
    if (!match) throw new Error(`P003 semantic block missing: ${id}`);
    return match;
  };
  const title = block('page-title');
  const heading = block('schedule-heading');
  const expression = block('expression');
  if (!title.visible || !heading.visible ||
      block('schedule-heading-second-layer').visible ||
      snapshot.blocks.some(item => item.id.includes('emphasis-copy-') &&
        item.visible)) {
    throw new Error('P003 source-visible semantic state mismatch');
  }
  return <>
    <h2 className="nms-l09-p003__title" lang="en"
      data-lesson-text-block={title.id}>{title.text}</h2>
    <section className="nms-l09-p003__schedule" lang="en">
      <h3 className="nms-l09-p003__schedule-heading"
        data-lesson-text-block={heading.id}>{heading.text}</h3>
      <div className="nms-l09-p003__rows">
        {ROW_IDS.map(id => {
          const row = block(id);
          if (!row.visible) throw new Error(`P003 source row hidden: ${id}`);
          return <p key={id} className="nms-l09-p003__row"
            data-lesson-text-block={id}
            data-emphasis={emphasisRow === id ? 'true' : undefined}
          >{row.text}</p>;
        })}
      </div>
      {expression.visible && <p className="nms-l09-p003__expression"
        data-lesson-text-block={expression.id}>{expression.text}</p>}
    </section>
  </>;
}
