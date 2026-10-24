'use client';

import React, { type CSSProperties } from 'react';
import {
  P062_DISPLAY_META,
  P062_SOURCE_TEXT,
  P062_SOURCE_TEXT_BOUNDS,
  P062_SOURCE_TEXT_STYLES,
  p062SourceSnapshot,
  type P062DomainId,
  type P062SourceObject,
} from './generated/nms-l02-p062-display-list-v1';

export type P062BoxView = { spriteId: 106 | 122; localFrame: number };
export type P062FeedbackView = {
  spriteId: 138 | 150 | 178 | 288 | 230 | 209 | 256;
  localFrame: number;
};
export type P062VisualProps = {
  mainFrame: number;
  box?: P062BoxView | null;
  feedback?: P062FeedbackView | null;
  popupOpen?: boolean;
  answerControls?: React.ReactNode;
  uiLanguage: 'en' | 'es';
};

const card: CSSProperties = {
  minWidth: 0,
  padding: 'clamp(0.8rem,2vw,1.15rem)',
  background: '#fff',
  border: '1px solid #bbccd8',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(25,49,70,0.05)',
};
const sourceText = (id: number) => P062_SOURCE_TEXT[id]
  ?.replaceAll('\n--- RECORDSEPARATOR ---\n', ' ')
  .replace(/\s+/gu, ' ').trim() ?? '';
const alpha = (item: P062SourceObject) => Math.max(0, Math.min(1, item.color[3] / 256));
const visibleItem = (items: readonly P062SourceObject[], id: number) =>
  items.find((item) => item.characterId === id && alpha(item) > 0);
const visible = (items: readonly P062SourceObject[], id: number) => Boolean(visibleItem(items, id));

function SourceLine({ items, id, as = 'p', children, correction }: {
  items: readonly P062SourceObject[];
  id: number;
  as?: 'p' | 'h2' | 'h3';
  children?: React.ReactNode;
  correction?: 'tax-base' | 'example-rate';
}) {
  const item = visibleItem(items, id);
  if (!item) return null;
  const Tag = as;
  const first = P062_SOURCE_TEXT_STYLES[id]?.find((run) => run.fontHeightTwips !== null);
  const box = P062_SOURCE_TEXT_BOUNDS[id];
  const fontHeight = first?.fontHeightTwips ?? null;
  return <Tag data-source-text-id={id} data-editorial-correction={correction}
    data-source-font-id={first?.fontId ?? undefined}
    data-source-font-height-twips={fontHeight ?? undefined}
    data-source-bounds-twips={box?.twips.join(',')}
    style={{ margin: '0.35rem 0', opacity: alpha(item),
      fontSize: fontHeight ? `max(1rem, ${Math.min(fontHeight / 320, 1.4).toFixed(3)}rem)` : undefined }}>
    {children ?? sourceText(id)}
  </Tag>;
}

function BooksTaxDiagram() {
  return <figure data-p062-modern-diagram="source-derived-books-and-tax"
    aria-label="Two books cost twenty dollars before tax; calculate the total including eight percent tax"
    style={{ ...card, margin: '0.6rem 0', background: '#f8fbfd' }}>
    <svg role="img" aria-label="Two books, before-tax price twenty dollars, tax rate eight percent, total cost unknown"
      viewBox="0 0 560 110" width="100%" style={{ maxWidth: 560, height: 'auto' }}>
      <rect x="6" y="15" width="100" height="70" rx="5" fill="#cde2f0" stroke="#427596" strokeWidth="2" />
      <rect x="19" y="9" width="100" height="70" rx="5" fill="#e4eff6" stroke="#427596" strokeWidth="2" />
      <text x="147" y="55" fontSize="22" fontWeight="700" fill="#17354e">$20.00</text>
      <text x="238" y="55" fontSize="21" fill="#466277">+ 8% tax</text>
      <text x="365" y="55" fontSize="22" fontWeight="700" fill="#17354e">= ?</text>
    </svg>
    <figcaption style={{ fontSize: '0.92rem' }}>Before-tax cost + sales tax = total cost</figcaption>
  </figure>;
}

function Question({ main }: { main: readonly P062SourceObject[] }) {
  if (!visible(main, 38)) return null;
  const second = visible(main, 41);
  return <section data-p062-panel="question" aria-label="Salvatore books and tax question" style={card}>
    <h2 style={{ margin: '0 0 0.55rem', fontSize: '1.25rem' }}>Question 3 · Books and sales tax</h2>
    {second ? <p data-source-text-id="38 41" data-editorial-correction="tax-base"
      style={{ margin: '0.4rem 0' }}>
      Salvatore bought 2 books for a total of $20.00 before tax. Tax on his purchase was 8% of the $20.00 price before tax. What is the total cost of Salvatore’s books including tax?
    </p> : <SourceLine items={main} id={38} />}
    {second && <p data-editorial-note="tax-base" style={{ fontSize: '0.85rem', color: '#42576a' }}>
      Sales tax is calculated on the $20.00 before-tax price.
    </p>}
  </section>;
}

function Rephrase({ main }: { main: readonly P062SourceObject[] }) {
  if (!visible(main, 45)) return null;
  return <section data-p062-panel="rephrase" style={card}>
    <SourceLine items={main} id={45} as="h3" />
  </section>;
}

function GivenNeeded({ main }: { main: readonly P062SourceObject[] }) {
  if (!visible(main, 86) && !visible(main, 88)) return null;
  return <section data-p062-panel="given-needed" style={card}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,13rem),1fr))', gap: '0.75rem' }}>
      <div><SourceLine items={main} id={86} as="h3" /><SourceLine items={main} id={88} /></div>
      <div><SourceLine items={main} id={87} as="h3" /></div>
    </div>
    <BooksTaxDiagram />
  </section>;
}

function EquationStrategy({ items, box }: { items: readonly P062SourceObject[]; box: P062BoxView | null }) {
  if (!visible(items, 90) && !visible(items, 91)) return null;
  return <section data-p062-panel="equation-strategy" data-source-box-sprite={box?.spriteId}
    data-source-box-local-frame={box?.localFrame} style={card}>
    <SourceLine items={items} id={90} as="h3" />
    <SourceLine items={items} id={91} />
    {visible(items, 92) && <p data-source-text-id="92" data-source-reconstruction="text-and-separate-multiplication-glyph"
      style={{ margin: '0.45rem 0', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      Taxes = 8% × $20.00 = 0.08 × $20.00 = $1.60
    </p>}
    <SourceLine items={items} id={95} />
  </section>;
}

function BackwardStrategy({ items, box }: { items: readonly P062SourceObject[]; box: P062BoxView | null }) {
  if (!visible(items, 109) && !visible(items, 110)) return null;
  return <section data-p062-panel="backward-strategy" data-source-box-sprite={box?.spriteId}
    data-source-box-local-frame={box?.localFrame} style={card}>
    <SourceLine items={items} id={109} as="h3" />
    <SourceLine items={items} id={110} />
    <SourceLine items={items} id={111} />
    <SourceLine items={items} id={112} />
    {visible(items, 113) && visible(items, 120) && <p data-source-trigger-text-ids="113 120"
      data-source-derived-equation="subtract-before-tax-price" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      Taxes = $21.60 − $20.00 = $1.60
    </p>}
    {visible(items, 114) && <p data-source-trigger-text-ids="114 116 117 118"
      data-source-derived-equation="eight-percent-of-twenty" style={{ fontVariantNumeric: 'tabular-nums' }}>
      8% = 8/100 = 0.08; 0.08 × $20.00 = $1.60.
    </p>}
  </section>;
}

const answerRows = [
  { ordinal: 1, letter: 'A', value: '$20.08', letterId: 24, valueId: 22, buttonId: 125 },
  { ordinal: 2, letter: 'B', value: '$20.80', letterId: 27, valueId: 25, buttonId: 125 },
  { ordinal: 3, letter: 'C', value: '$21.60', letterId: 33, valueId: 31, buttonId: 126 },
  { ordinal: 4, letter: 'D', value: '$21.80', letterId: 30, valueId: 28, buttonId: 124 },
] as const;
function Answers({ mainFrame, controls }: { mainFrame: number; controls?: React.ReactNode }) {
  if (mainFrame !== 815) return null;
  return <section data-p062-panel="answers" aria-label="Four source answer choices" style={card}>
    <h3 style={{ marginTop: 0 }}>Choose the total cost</h3>
    {controls !== undefined ? controls : <ol style={{ listStyle: 'none', padding: 0, margin: 0,
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,11rem),1fr))', gap: '0.55rem' }}>
      {answerRows.map((answer) => <li key={answer.ordinal} data-source-answer={answer.ordinal}
        data-source-text-id={`${answer.letterId} ${answer.valueId}`} data-source-button-id={answer.buttonId}
        style={{ border: '1px solid #aebfcb', borderRadius: 8, padding: '0.6rem', minHeight: 44 }}>
        <strong>{answer.letter}.</strong> {answer.value}
      </li>)}
    </ol>}
  </section>;
}

const feedbackText: Record<P062FeedbackView['spriteId'], readonly number[]> = {
  138: [131, 132], 150: [144], 178: [156],
  288: [285, 286], 230: [228, 229], 209: [204, 205], 256: [245, 246],
};
const feedbackEnd: Record<P062FeedbackView['spriteId'], number> = {
  138: 29, 150: 28, 178: 28, 288: 25, 230: 33, 209: 28, 256: 31,
};
function Feedback({ feedback }: { feedback: P062FeedbackView | null }) {
  if (!feedback) return null;
  const items = p062SourceSnapshot(String(feedback.spriteId) as P062DomainId, feedback.localFrame);
  const ids = feedbackText[feedback.spriteId].filter((id) => visible(items, id));
  return <aside aria-live="polite" data-p062-feedback-sprite={feedback.spriteId}
    data-source-feedback-frame={feedback.localFrame} style={{ ...card, marginTop: '0.7rem', background: '#f6f2ff' }}>
    {ids.length ? ids.map((id) => <SourceLine key={id} items={items} id={id} />) : <span aria-hidden="true">&nbsp;</span>}
  </aside>;
}

/** Native content for the host's accessible dialog; correction is an editorial deviation. */
export function P062HintContent() {
  const items = p062SourceSnapshot('314', 1);
  return <section data-source-popup-sprite="314" style={{ ...card, border: '2px solid #607996' }}>
    <SourceLine items={items} id={305} as="h3" />
    <SourceLine items={items} id={306} />
    <SourceLine items={items} id={307} as="h3" />
    <SourceLine items={items} id={308} />
    {visible(items, 309) && <p data-source-text-id="309" data-editorial-correction="example-rate"
      style={{ fontWeight: 700 }}>
      Taxes = 7.5% of Original Cost
    </p>}
    {visible(items, 313) && <p data-source-text-id="313" data-source-reconstruction="text-and-separate-multiplication-glyph"
      style={{ fontVariantNumeric: 'tabular-nums' }}>Taxes = 7.5% of $50.00 = 0.075 × $50.00 = $3.75</p>}
    <SourceLine items={items} id={310} />
    <p data-editorial-note="example-rate" style={{ fontSize: '0.85rem', color: '#42576a' }}>
      $50.00 + $3.75 = $53.75 at a 7.5% tax rate.
    </p>
  </section>;
}

/** Pure source-timed teaching view. Playback, answers and modal focus live in the host. */
export function NmsL02P062ProductRendererV1(props: P062VisualProps) {
  const { mainFrame, uiLanguage } = props;
  const box = props.box ?? null, feedback = props.feedback ?? null;
  const popupOpen = props.popupOpen ?? false;
  const invalid = !Number.isInteger(mainFrame) || mainFrame < 1 || mainFrame > 834 ||
    (uiLanguage !== 'en' && uiLanguage !== 'es') ||
    (box !== null && ((box.spriteId !== 106 && box.spriteId !== 122) ||
      mainFrame !== (box.spriteId === 106 ? 650 : 766) ||
      !Number.isInteger(box.localFrame) || box.localFrame < 1 ||
      box.localFrame > (box.spriteId === 106 ? 21 : 27))) ||
    (feedback !== null && (mainFrame !== 815 ||
      !([138, 150, 178, 288, 230, 209, 256] as number[]).includes(feedback.spriteId) ||
      !Number.isInteger(feedback.localFrame) || feedback.localFrame < 2 ||
      feedback.localFrame > feedbackEnd[feedback.spriteId])) ||
    (popupOpen && mainFrame !== 815) || (props.answerControls !== undefined && mainFrame !== 815) ||
    (box !== null && (feedback !== null || popupOpen)) || (feedback !== null && popupOpen);
  if (invalid) return <article role="alert" data-p062-status="invalid-source-state">The P062 source visual state is unavailable.</article>;
  const main = p062SourceSnapshot('315', mainFrame);
  const boxItems = box ? p062SourceSnapshot(String(box.spriteId) as P062DomainId, box.localFrame) : null;
  return <article lang="en" data-p062-product="shared-nms002-l02-p062" data-p062-main-frame={mainFrame}
    data-source-swf-sha256={P062_DISPLAY_META.sourceSwfSha256} data-source-frame-domain="sprite-315"
    data-language-policy={uiLanguage === 'es' ? 'english-source-fallback' : 'english-source'}
    style={{ boxSizing: 'border-box', color: '#183146', fontFamily: 'var(--lesson-text-font-body,sans-serif)',
      fontSize: '1rem', lineHeight: 1.5, maxWidth: '68rem', margin: '0 auto',
      padding: 'clamp(0.7rem,2vw,1.4rem)', background: '#eef5f8' }}>
    {uiLanguage === 'es' && <p lang="es" data-spanish-translation="missing" style={{ ...card, margin: '0 0 0.7rem' }}>
      Texto original en inglés. No hay una traducción al español verificada.
    </p>}
    {mainFrame < 10 && <section data-p062-panel="intro" style={card}><h2 style={{ margin: 0 }}>Question 3</h2></section>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,20rem),1fr))', gap: '0.7rem' }}>
      <Question main={main} />
      <Rephrase main={main} />
      <GivenNeeded main={main} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,20rem),1fr))', gap: '0.7rem', marginTop: '0.7rem' }}>
      <EquationStrategy items={box?.spriteId === 106 && boxItems ? boxItems : main} box={box?.spriteId === 106 ? box : null} />
      <BackwardStrategy items={box?.spriteId === 122 && boxItems ? boxItems : main} box={box?.spriteId === 122 ? box : null} />
    </div>
    <div style={{ marginTop: '0.7rem' }}>
      <Answers mainFrame={mainFrame} controls={feedback || popupOpen ? undefined : props.answerControls} />
    </div>
    {popupOpen && <aside role="dialog" aria-modal="true" aria-label="Tax example hint" style={{ marginTop: '0.7rem' }}>
      <P062HintContent />
    </aside>}
    <Feedback feedback={feedback} />
    {[384, 523, 650, 766].includes(mainFrame) && <span data-source-stop-frame={mainFrame} aria-hidden="true" hidden />}
    {mainFrame === 815 && <span data-source-stop-frame="815" data-source-control-id="13"
      data-source-control-label="Need More Help" aria-hidden="true" hidden />}
    {mainFrame === 834 && <span data-source-terminal-frame="834" aria-hidden="true" hidden />}
  </article>;
}
