'use client';

import React, { type CSSProperties } from 'react';
import {
  P061_DISPLAY_META,
  P061_SOURCE_TEXT,
  p061SourceSnapshot,
  type P061DomainId,
  type P061SourceObject,
} from './generated/nms-l02-p061-display-list-v1';

export type P061BoxView = { spriteId: 111 | 118; localFrame: number };
export type P061FeedbackView = {
  spriteId: 134 | 146 | 174 | 284 | 226 | 205 | 252;
  localFrame: number;
};
export type P061VisualProps = {
  mainFrame: number;
  box?: P061BoxView | null;
  feedback?: P061FeedbackView | null;
  popupOpen?: boolean;
  answerControls?: React.ReactNode;
  uiLanguage: 'en' | 'es';
};

const card: CSSProperties = {
  minWidth: 0,
  padding: 'clamp(0.7rem,2vw,1.1rem)',
  background: '#fff',
  border: '1px solid #bdcbd4',
  borderRadius: 12,
};
const sourceText = (id: number) => P061_SOURCE_TEXT[id]
  ?.replaceAll('\n--- RECORDSEPARATOR ---\n', ' ')
  .replace(/\s+/gu, ' ').trim() ?? '';
const alpha = (item: P061SourceObject) => Math.max(0, Math.min(1, item.color[3] / 256));
const visibleItem = (items: readonly P061SourceObject[], id: number) =>
  items.find((item) => item.characterId === id && alpha(item) > 0);
const visible = (items: readonly P061SourceObject[], id: number) => Boolean(visibleItem(items, id));

function Fraction({ numerator, denominator }: {
  numerator: string; denominator: string;
}) {
  return <span data-source-derived="percent-definition" aria-label={`${numerator} over ${denominator}`}
    style={{ display: 'inline-flex', verticalAlign: 'middle', flexDirection: 'column', alignItems: 'center',
      lineHeight: 1, margin: '0 0.1em', fontVariantNumeric: 'tabular-nums' }}>
    <span>{numerator}</span><span aria-hidden="true" style={{ width: '100%', borderTop: '1.5px solid currentColor', margin: '0.1em 0' }} />
    <span>{denominator}</span>
  </span>;
}

function SourceLine({ items, id, as = 'p' }: {
  items: readonly P061SourceObject[];
  id: number;
  as?: 'p' | 'h2' | 'h3';
}) {
  const item = visibleItem(items, id);
  if (!item) return null;
  const Tag = as;
  return <Tag data-source-text-id={id} style={{ margin: '0.2rem 0', opacity: alpha(item) }}>
    {sourceText(id)}
  </Tag>;
}

function Question({ main }: { main: readonly P061SourceObject[] }) {
  if (![38, 41, 43, 47].some((id) => visible(main, id))) return null;
  return <section aria-label="Taylor gas cost question" data-p061-panel="question" style={card}>
    <SourceLine items={main} id={38} as="h2" />
    <SourceLine items={main} id={41} />
    <SourceLine items={main} id={43} />
    <SourceLine items={main} id={47} />
  </section>;
}

const answers = [
  { ordinal: 1, letter: 'A', value: '$250', letterId: 24, valueId: 22, hitId: 121 },
  { ordinal: 2, letter: 'B', value: '$750', letterId: 33, valueId: 31, hitId: 122 },
  { ordinal: 3, letter: 'C', value: '$1,025', letterId: 27, valueId: 25, hitId: 121 },
  { ordinal: 4, letter: 'D', value: '$1,250', letterId: 30, valueId: 28, hitId: 120 },
] as const;

function Answers({ main, mainFrame, controls }: {
  main: readonly P061SourceObject[];
  mainFrame: number;
  controls?: React.ReactNode;
}) {
  const shown = answers.filter((answer) => visible(main, answer.valueId));
  if (!shown.length) return null;
  const atQuiz = mainFrame === 860;
  return <section aria-label="Four source answer choices" data-p061-panel="answers"
    data-source-interactive={atQuiz ? 'true' : 'false'} style={card}>
    {atQuiz && controls !== undefined ? controls : <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
      {shown.map((answer) => <li key={answer.ordinal}
        data-source-text-id={`${answer.letterId} ${answer.valueId}`}
        data-source-answer={answer.ordinal}
        data-source-hit-object-id={atQuiz ? answer.hitId : undefined}
        style={{ padding: '0.35rem 0.6rem', border: '1px solid #becbd3', borderRadius: 8 }}>
        <strong>{answer.letter}.</strong> {answer.value}
      </li>)}
    </ol>}
  </section>;
}

function GivenNeeded({ main }: { main: readonly P061SourceObject[] }) {
  if (![88, 89, 90].some((id) => visible(main, id))) return null;
  return <section aria-label="Given and needed information" data-p061-panel="given-needed" style={{
    ...card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,14rem),1fr))', gap: '0.7rem',
  }}>
    <div><SourceLine items={main} id={88} as="h3" /><SourceLine items={main} id={90} /></div>
    <div><SourceLine items={main} id={89} as="h3" /></div>
  </section>;
}

function CostBar() {
  return <figure aria-label="One thousand dollars divided into a 250 dollar decrease and 750 dollar new cost"
    data-p061-modern-cost-diagram="source-derived" style={{ margin: '0.75rem 0' }}>
    <div style={{ display: 'flex', height: '2.1rem', color: '#102942', fontWeight: 700, textAlign: 'center' }}>
      <span style={{ width: '25%', background: '#f6bf8e', border: '1px solid #6e5e4f' }}>$250</span>
      <span style={{ width: '75%', background: '#b2d9c4', border: '1px solid #537363' }}>$750</span>
    </div>
    <figcaption style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>$1,000 = $250 decrease + $750 new cost</figcaption>
  </figure>;
}

function Strategy({ main, box }: { main: readonly P061SourceObject[]; box: P061BoxView | null }) {
  const active = box ? p061SourceSnapshot(String(box.spriteId) as P061DomainId, box.localFrame) : main;
  const equation = [93, 94, 97, 98].some((id) => visible(active, id));
  const subtract = [113, 114, 115, 116].some((id) => visible(active, id));
  if (!equation && !subtract) return null;
  return <section aria-label="Source calculation strategy" data-p061-panel="strategy"
    data-source-box-sprite={box?.spriteId} data-source-box-local-frame={box?.localFrame} style={card}>
    {equation && <div data-p061-strategy="equivalent-decimal">
      <SourceLine items={active} id={93} as="h3" />
      {visible(active, 98) && visible(active, 95) && <p data-source-text-id="98" data-source-shape-id="95"
        data-source-reconstruction="text-and-separate-minus-shape" style={{ margin: '0.2rem 0' }}>
        25% decrease in gas cost means that Taylor will pay 100% − 25% of gas cost for the new car, which equals 75%.
      </p>}
      <SourceLine items={active} id={94} />
      {visible(active, 98) && visible(active, 94) && <p data-source-derived-formula="percent-definition"
        data-source-trigger-text-ids="98 94" style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.45rem 0' }}>
        100% − 25% = 75% = <Fraction numerator="75" denominator="100" /> = 0.75
      </p>}
      {visible(active, 97) && visible(active, 100) && <div data-source-text-id="97 100"
        data-source-reconstruction="text-and-separate-multiplication-glyphs"
        style={{ fontSize: '1.15rem', fontWeight: 700 }}>
        New Gas Cost = Last Cost × 0.75<br />$1,000 × 0.75 = $750
        <CostBar />
      </div>}
    </div>}
    {subtract && <div data-p061-strategy="subtract-decrease">
      <SourceLine items={active} id={113} as="h3" />
      <SourceLine items={active} id={114} />
      <SourceLine items={active} id={115} />
      <SourceLine items={active} id={116} />
      {visible(active, 116) && <CostBar />}
    </div>}
  </section>;
}

const feedbackText: Record<P061FeedbackView['spriteId'], readonly number[]> = {
  134: [127, 128], 146: [140], 174: [152],
  284: [281, 282], 226: [224, 225], 205: [200, 201], 252: [241, 242],
};
const feedbackLast: Record<P061FeedbackView['spriteId'], number> = {
  134: 29, 146: 28, 174: 28, 284: 25, 226: 33, 205: 28, 252: 31,
};
function Feedback({ feedback }: { feedback: P061FeedbackView | null }) {
  if (!feedback) return null;
  const items = p061SourceSnapshot(String(feedback.spriteId) as P061DomainId, feedback.localFrame);
  const ids = feedbackText[feedback.spriteId].filter((id) => visible(items, id));
  return <aside aria-live="polite" data-p061-feedback-sprite={feedback.spriteId}
    data-source-feedback-frame={feedback.localFrame} style={{ ...card, marginTop: '0.65rem', background: '#f6f3ff' }}>
    {ids.length ? ids.map((id) => <SourceLine key={id} items={items} id={id} />) : <span aria-hidden="true">&nbsp;</span>}
  </aside>;
}

export function P061HintContent() {
  const items = p061SourceSnapshot('314', 1);
  return <section data-source-popup-sprite="314" style={{ ...card, border: '2px solid #526e8d' }}>
    <SourceLine items={items} id={302} />
    <SourceLine items={items} id={308} />
    <div aria-label="Ten percent as a decimal and a fraction" data-source-derived-formula="percent-definition"
      data-source-trigger-text-ids="302 309"
      style={{ fontWeight: 700, fontSize: '1.15rem', margin: '0.45rem 0' }}>
      <Fraction numerator="10" denominator="100" /> = 10% = 0.10
    </div>
    <SourceLine items={items} id={311} />
    <SourceLine items={items} id={312} />
    <SourceLine items={items} id={313} />
  </section>;
}

/** Source-timed text projection. The state and audio controllers are separate. */
export function NmsL02P061ProductRendererV1(props: P061VisualProps) {
  const { mainFrame, uiLanguage } = props;
  const box = props.box ?? null;
  const feedback = props.feedback ?? null;
  const popupOpen = props.popupOpen ?? false;
  const invalid = !Number.isInteger(mainFrame) || mainFrame < 1 || mainFrame > 879 ||
    (uiLanguage !== 'en' && uiLanguage !== 'es') ||
    (box !== null && ((box.spriteId !== 111 && box.spriteId !== 118) ||
      mainFrame !== (box.spriteId === 111 ? 700 : 817) ||
      !Number.isInteger(box.localFrame) || box.localFrame < 1 || box.localFrame > (box.spriteId === 111 ? 21 : 27))) ||
    (feedback !== null && (mainFrame !== 860 || !Number.isInteger(feedback.localFrame) ||
      !([134, 146, 174, 284, 226, 205, 252] as number[]).includes(feedback.spriteId) ||
      feedback.localFrame < 1 || feedback.localFrame > feedbackLast[feedback.spriteId])) ||
    (popupOpen && mainFrame !== 860) || (props.answerControls !== undefined && mainFrame !== 860);
  if (invalid) return <article role="alert" data-p061-status="invalid-source-state">The P061 source visual state is unavailable.</article>;
  const main = p061SourceSnapshot('315', mainFrame);
  return <article lang="en" data-p061-product="shared-nms002-l02-p061" data-p061-main-frame={mainFrame}
    data-source-swf-sha256={P061_DISPLAY_META.sourceSwfSha256} data-source-frame-domain="sprite-315"
    data-language-policy={uiLanguage === 'es' ? 'english-source-fallback' : 'english-source'}
    style={{ boxSizing: 'border-box', color: '#172940', fontFamily: 'var(--lesson-text-font-body,sans-serif)',
      fontSize: '1rem', lineHeight: 1.45, maxWidth: '68rem', margin: '0 auto',
      padding: 'clamp(0.7rem,2vw,1.4rem)', background: '#eef4f6' }}>
    {uiLanguage === 'es' && <p lang="es" data-spanish-translation="missing" style={{ ...card, margin: '0 0 0.65rem' }}>
      Texto original en inglés. No hay una traducción al español verificada.
    </p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,20rem),1fr))', gap: '0.65rem' }}>
      <Question main={main} />
      <Answers main={main} mainFrame={mainFrame} controls={props.answerControls} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,20rem),1fr))', gap: '0.65rem', marginTop: '0.65rem' }}>
      <GivenNeeded main={main} />
      <Strategy main={main} box={box} />
    </div>
    {[435, 573, 700, 817].includes(mainFrame) && <span data-source-stop-frame={mainFrame} aria-hidden="true" hidden />}
    {mainFrame === 860 && <span data-source-control-id="13" data-source-control-label="Need More Help" aria-hidden="true" hidden />}
    {popupOpen && <aside role="dialog" aria-modal="true" aria-label="Percent and decimal hint"><P061HintContent /></aside>}
    <Feedback feedback={feedback} />
    {mainFrame === 879 && <span data-source-terminal-frame="879" aria-hidden="true" hidden />}
  </article>;
}
