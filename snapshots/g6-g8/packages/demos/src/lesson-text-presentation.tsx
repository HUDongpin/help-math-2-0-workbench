import React, {type CSSProperties, type ReactNode} from 'react';

import type {
  LessonTextAnchor,
  LessonTextPresentationBlock,
  LessonTextTemplate,
  TextPresentationSnapshot,
} from './lesson-text-contract';

export interface LessonTextPresentationProps {
  readonly snapshot: TextPresentationSnapshot;
  readonly template: LessonTextTemplate;
  readonly figure?: ReactNode;
  readonly figureLabel?: string;
  /** Required for a figure without labels; anchored labels otherwise own its order. */
  readonly figureReadingOrder?: number;
  readonly controls?: ReactNode;
  readonly controlsReadingOrder?: number;
  /** Complex figures may keep local horizontal scrolling instead of shrinking labels. */
  readonly figureMinWidthRem?: number;
  readonly className?: string;
}

export type LessonTextLayoutItem =
  | Readonly<{kind: 'block'; key: string; readingOrder: number; block: LessonTextPresentationBlock}>
  | Readonly<{kind: 'figure'; key: 'figure'; readingOrder: number; labels: readonly LessonTextPresentationBlock[]}>
  | Readonly<{kind: 'controls'; key: 'controls'; readingOrder: number}>;

/** Coordinates move with the figure; CSS text size never inherits a viewBox scale.
 * Off-stage coordinates are kept intact. A page must bind visibility from its
 * teaching state instead of clamping a hidden source object onto the stage.
 */
export function lessonTextAnchorPercent(anchor: LessonTextAnchor) {
  const {x, y, stageWidth, stageHeight} = anchor;
  if (![x, y, stageWidth, stageHeight].every(Number.isFinite)
    || stageWidth <= 0 || stageHeight <= 0) {
    throw new Error('Lesson text anchors require finite coordinates and positive stage dimensions.');
  }
  return {
    x: `${x / stageWidth * 100}%`,
    y: `${y / stageHeight * 100}%`,
    textAnchor: anchor.align === 'start' ? 'start' : anchor.align === 'end' ? 'end' : 'middle',
  } as const;
}

/** Only the supplied state decides visibility. This component owns no clock,
 * answer policy, translation fallback, source extraction, or replay state.
 */
export function visibleLessonTextBlocks(snapshot: TextPresentationSnapshot) {
  if (snapshot.status !== 'ready') return [];
  const ids = new Set<string>();
  for (const block of snapshot.blocks) {
    if (!block.id || ids.has(block.id)) {
      throw new Error('Lesson text blocks require unique stable instance IDs.');
    }
    ids.add(block.id);
    if (!Number.isFinite(block.readingOrder)) {
      throw new Error('Lesson text reading order must be finite.');
    }
    if (block.anchor && block.role !== 'label') {
      throw new Error('Only figure labels can use anchors in the shared lesson text template.');
    }
  }
  return snapshot.blocks.filter((block) => block.visible === true)
    .sort((left, right) => left.readingOrder - right.readingOrder);
}

/** Keep DOM, reading, and visual order the same. Labels constitute one figure
 * group. Interleaved prose or special masks require a maintained page renderer;
 * silently regrouping them here would change the instructional reading order.
 */
export function buildLessonTextLayout({
  snapshot,
  hasFigure,
  figureReadingOrder,
  hasControls = false,
  controlsReadingOrder,
}: {
  readonly snapshot: TextPresentationSnapshot;
  readonly hasFigure: boolean;
  readonly figureReadingOrder?: number;
  readonly hasControls?: boolean;
  readonly controlsReadingOrder?: number;
}): readonly LessonTextLayoutItem[] {
  if (snapshot.status !== 'ready') return [];
  const blocks = visibleLessonTextBlocks(snapshot);
  const labels = blocks.filter((block) => block.anchor);
  if (labels.length && !hasFigure) {
    throw new Error('Anchored lesson text requires the matching figure.');
  }
  const firstLabel = blocks.findIndex((block) => Boolean(block.anchor));
  const lastLabel = blocks.map((block) => Boolean(block.anchor)).lastIndexOf(true);
  if (firstLabel >= 0 && blocks.slice(firstLabel, lastLabel + 1).some((block) => !block.anchor)) {
    throw new Error('Figure labels must be a consecutive reading group; use a dedicated page layout for interleaved content.');
  }
  if (figureReadingOrder !== undefined && !Number.isFinite(figureReadingOrder)) {
    throw new Error('The figure reading order must be finite.');
  }
  if (controlsReadingOrder !== undefined && !Number.isFinite(controlsReadingOrder)) {
    throw new Error('The controls reading order must be finite.');
  }
  if (hasFigure && !labels.length && figureReadingOrder === undefined) {
    throw new Error('A figure without visible labels requires an explicit reading order.');
  }
  const items: LessonTextLayoutItem[] = blocks.filter((block) => !block.anchor).map((block) => ({
    kind: 'block', key: `block:${block.id}`, readingOrder: block.readingOrder, block,
  }));
  if (hasFigure) {
    // Labels own the reading position. Callers cannot move them around the prose.
    const readingOrder = labels[0]?.readingOrder ?? figureReadingOrder!;
    items.push({kind: 'figure', key: 'figure', readingOrder, labels});
  }
  if (hasControls) {
    const readingOrder = controlsReadingOrder ?? Math.max(0, ...blocks.map((block) => block.readingOrder), figureReadingOrder ?? 0) + 1;
    if (labels.length > 1 && readingOrder > labels[0].readingOrder
      && readingOrder < labels[labels.length - 1].readingOrder) {
      throw new Error('Controls cannot interrupt the figure label reading group.');
    }
    items.push({kind: 'controls', key: 'controls', readingOrder});
  }
  const sourceIndex = (item: LessonTextLayoutItem) => item.kind === 'block'
    ? blocks.findIndex((block) => block.id === item.block.id)
    : item.kind === 'figure' && firstLabel >= 0 ? firstLabel : blocks.length;
  return items.sort((left, right) => left.readingOrder - right.readingOrder || sourceIndex(left) - sourceIndex(right));
}

export function LessonTextBlock({block}: {readonly block: LessonTextPresentationBlock}) {
  if (!block.visible) return null;
  const Tag = block.role === 'title' ? 'h2' : block.role === 'heading' ? 'h3' : 'p';
  return <Tag
    className={`lesson-text-presentation__block lesson-text-presentation__block--${block.role}`}
    data-lesson-text-block={block.id}
    lang={block.language}
  >{block.text}</Tag>;
}

/** An unscaled SVG viewport is deliberate: percentage positions follow the
 * authored geometry, while rem fonts remain readable at narrow CSS widths.
 * No role=img: assistive technology can still read the actual SVG text nodes.
 */
export function LessonFigureTextLayer({
  snapshot,
  ariaHidden = false,
}: {
  readonly snapshot: TextPresentationSnapshot;
  readonly ariaHidden?: boolean;
}) {
  const labels = visibleLessonTextBlocks(snapshot).filter((block) => block.anchor);
  if (!labels.length) return null;
  return <svg
    className="lesson-figure-text-layer"
    width="100%"
    height="100%"
    aria-hidden={ariaHidden || undefined}
    focusable="false"
  >
    {labels.map((block) => <text
      className="lesson-figure-text-layer__label"
      data-lesson-text-block={block.id}
      key={block.id}
      lang={block.language}
      {...lessonTextAnchorPercent(block.anchor!)}
      dominantBaseline="central"
    >{block.text}</text>)}
  </svg>;
}

export function LessonTextPresentation({
  snapshot,
  template,
  figure,
  figureLabel,
  figureReadingOrder,
  controls,
  controlsReadingOrder,
  figureMinWidthRem,
  className,
}: LessonTextPresentationProps) {
  // Host retains the complete original drawing for a blocked replacement.
  // Never show modern words whose matching suppression could not be verified.
  if (snapshot.status !== 'ready') return null;
  if (figureMinWidthRem !== undefined
    && (!Number.isFinite(figureMinWidthRem) || figureMinWidthRem <= 0 || template !== 'complex-figure')) {
    throw new Error('A positive minimum figure width is supported only by the complex-figure template.');
  }
  const hasFigure = figure !== undefined && figure !== null && figure !== false;
  const hasControls = controls !== undefined && controls !== null && controls !== false;
  const items = buildLessonTextLayout({snapshot, hasFigure, figureReadingOrder, hasControls, controlsReadingOrder});
  const showLabelList = template === 'complex-figure';
  const language = snapshot.identity.language;
  const labelListName = language === 'es' ? 'Etiquetas de la figura' : 'Figure labels';
  return <div
    className={`lesson-text-presentation lesson-text-presentation--${template}${className ? ` ${className}` : ''}`}
    lang={language}
  >
    <div className="lesson-text-presentation__layout">
      {items.map((item) => {
        if (item.kind === 'block') return <LessonTextBlock key={item.key} block={item.block}/>;
        if (item.kind === 'controls') return <div className="lesson-text-presentation__controls" key={item.key}>{controls}</div>;
        return <figure className="lesson-text-presentation__figure" key={item.key} aria-label={figureLabel}>
          <div
            className="lesson-text-presentation__figure-viewport"
            // Scrollable mathematical figures need keyboard access. The
            // natural DOM order is preserved without positive tabindex values.
            tabIndex={template === 'complex-figure' && figureMinWidthRem !== undefined ? 0 : undefined}
            role={template === 'complex-figure' && figureMinWidthRem !== undefined ? 'group' : undefined}
            aria-label={template === 'complex-figure' && figureMinWidthRem !== undefined ? figureLabel ?? labelListName : undefined}
          >
            <div className="lesson-text-presentation__figure-plane" style={figureMinWidthRem === undefined ? undefined : {
              '--lesson-figure-min-inline-size': `${figureMinWidthRem}rem`,
            } as CSSProperties}>
              {figure}
              <LessonFigureTextLayer snapshot={snapshot} ariaHidden={showLabelList}/>
            </div>
          </div>
          {showLabelList && item.labels.length > 0 && <figcaption>
            <ul className="lesson-text-presentation__label-list" aria-label={labelListName}>
              {item.labels.map((block) => <li key={block.id} lang={block.language}>{block.text}</li>)}
            </ul>
          </figcaption>}
        </figure>;
      })}
    </div>
  </div>;
}
