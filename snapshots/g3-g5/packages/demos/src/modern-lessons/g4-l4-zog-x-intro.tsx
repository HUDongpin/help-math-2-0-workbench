'use client';
import React, {useLayoutEffect, useRef, useState} from 'react';
import {G4_L4_ZOG_X_INTRO as SOURCE} from './generated/g4-l4-zog-x-intro-config';

type Curve<T> = readonly (readonly [number, T])[];
type Token = Readonly<{text: string; sourceTextIds: readonly string[]; alpha: Curve<number>}>;
type Instance = Readonly<{id: string; firstFrame: number; lastFrameExclusive: number}>;
type TextRow = Readonly<{characterId: number; text: string; sourceTextIds: readonly string[];
  sourceInstances: readonly Instance[]; tokens: readonly Token[]}>;
export type ZogXKeyTerm = typeof SOURCE.terms[number];
type OpenTerm = (term: ZogXKeyTerm, trigger: HTMLButtonElement) => void;
type PointerState = Readonly<{matrix: readonly number[]; alpha: number}> | null;
const rows: readonly TextRow[] = SOURCE.textRows;

export function zogXIntroAt<T>(curve: Curve<T>, frame: number): T | undefined {
  let value: T | undefined;
  for (const [at, next] of curve) {if (at > frame) break; value = next;}
  return value;
}
const active = (instance: Instance, frame: number) => instance.firstFrame <= frame && frame < instance.lastFrameExclusive;
const inRanges = (ranges: readonly (readonly [number, number])[], frame: number) => ranges.some(([from, to]) => from <= frame && frame < to);

/** Source-frame projection only. The owning lesson supplies the clock, pause,
 * glossary lifecycle, scene composition and audio. No local timers are used. */
export function getZogXIntroState(frame: number, reducedMotion = false) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > SOURCE.frames) throw Error('GS002 intro frame outside source domain');
  const visibleRows = rows.map(row => ({...row, instance: row.sourceInstances.find(i => active(i, frame)),
    visibleText: row.tokens.filter(t => (zogXIntroAt(t.alpha, frame) ?? 0) > 0).map(t => t.text).join('')}));
  const emphasis = (key: 'start' | 'repeat') => {
    const ranges = SOURCE.controls[key].emphasisFrames;
    return reducedMotion ? frame >= ranges[0][0] && frame < ranges[ranges.length - 1][1] : inRanges(ranges, frame);
  };
  return {frame, body: visibleRows.filter(row => (SOURCE.bodyCharacters as readonly number[]).includes(row.characterId)),
    demonstration: visibleRows.filter(row => (SOURCE.demonstration.textCharacters as readonly number[]).includes(row.characterId)),
    demonstrationVisible: SOURCE.demonstration.firstFrame <= frame && frame < SOURCE.demonstration.lastFrameExclusive,
    demonstrationPointer: zogXIntroAt<PointerState>(SOURCE.demonstration.pointer.states, frame),
    startEmphasis: emphasis('start'), repeatEmphasis: emphasis('repeat'),
    skipEnabled: SOURCE.controls.skip.sourceInstances.some(i => active(i, frame)), ready: frame === 591};
}

function Word({token, alpha, term, enabled, onOpenKeyTerm}: {token: Token; alpha: number; term?: ZogXKeyTerm;
  enabled: boolean; onOpenKeyTerm?: OpenTerm}) {
  const visible = alpha > 0;
  const style = {opacity: alpha, visibility: visible ? 'visible' as const : 'hidden' as const};
  if (!term) return <span data-source-text-ids={token.sourceTextIds.join(' ')} aria-hidden={!visible} style={style}>{token.text}</span>;
  const word = token.text.trimEnd(), trailing = token.text.slice(word.length);
  return <><button type="button" className="zog-x-copy__term" data-source-keyterm={term.keyAttribute}
    data-source-button-id={term.sourceButtonId} data-keyterm-entry-id={term.entryId}
    data-source-text-ids={token.sourceTextIds.join(' ')} aria-hidden={!visible}
    disabled={!visible || !enabled || !onOpenKeyTerm} style={style}
    onClick={event => onOpenKeyTerm?.(term, event.currentTarget)}>{word}</button>
    <span aria-hidden={!visible} style={style}>{trailing}</span></>;
}

/** The intro copy is native document flow. Invisible words reserve their space
 * and leave the accessibility tree until the source mask discloses them. */
export function ZogXTeachingCopy({frame, onOpenKeyTerm}: {frame: number; onOpenKeyTerm?: OpenTerm}) {
  getZogXIntroState(frame);
  return <section className="zog-x-copy" lang="en" data-zog-x-copy={frame}>
    <style>{CSS}</style>
    <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="title" data-source-text-ids={SOURCE.title.sourceTextIds.join(' ')}
      data-source-instance={SOURCE.title.sourceInstance}>{SOURCE.title.text}</h2>
    {frame >= 194 && frame < 592 && <div className="zog-x-copy__instructions">
      {SOURCE.paragraphs.map((characters, index) => <p key={index} data-lesson-text-block={`instruction-${index}`}>
        {characters.map((cid, lineIndex) => {
          const row = rows.find(r => r.characterId === cid)!;
          const instance = row.sourceInstances.find(i => active(i, frame));
          return <React.Fragment key={cid}>
            {lineIndex > 0 && !rows.find(r => r.characterId === characters[lineIndex - 1])!.text.endsWith(' ') ? ' ' : null}
            <span data-zog-x-copy-character={cid} data-source-instance={instance?.id}
              data-source-instance-ids={row.sourceInstances.map(i => i.id).join(' ')}>
              {row.tokens.map((token, i) => {
                const term = SOURCE.terms.find(t => t.keyAttribute.toLowerCase() === token.text.trim().toLowerCase());
                return <Word key={i} token={token} alpha={zogXIntroAt(token.alpha, frame) ?? 0} term={term}
                  enabled={!!term?.sourceInstances.some(i => active(i, frame))} onOpenKeyTerm={onOpenKeyTerm} />;
              })}
            </span>
          </React.Fragment>;
        })}
      </p>)}
    </div>}
  </section>;
}

/** Repeat-directions copy has its own source runs; it must not borrow the
 * timed introduction IDs. The owner mounts this inside its managed dialog. */
export function ZogXRepeatDirectionsCopy({onOpenKeyTerm}: {onOpenKeyTerm?: OpenTerm}) {
  return <div className="zog-x-copy" lang="en" data-zog-x-repeat-copy="true"><style>{CSS}</style>
    {SOURCE.repeatDirections.map(row => <p key={row.characterId} data-lesson-text-block={`directions-${row.characterId}`}
      data-source-text-ids={row.sourceTextIds.join(' ')}>{row.text.split(/(Addition|subtraction)/).map((part, i) => {
        const term = SOURCE.terms.find(t => t.keyAttribute.toLowerCase() === part.toLowerCase());
        return term ? <button key={i} type="button" className="zog-x-copy__term" disabled={!onOpenKeyTerm}
          data-source-keyterm={term.keyAttribute} data-source-button-id={term.sourceButtonId}
          data-keyterm-entry-id={term.entryId} data-source-instance={term.popupInstance}
          onClick={event => onOpenKeyTerm?.(term, event.currentTarget)}>{part}</button> : <React.Fragment key={i}>{part}</React.Fragment>;
      })}</p>)}
  </div>;
}

type Point = Readonly<{x: number; y: number}>;
type PointerRoute = Readonly<{start: string; end: string; progress: number}> | null;
/** Demonstration only: the source number field is empty and its answers are
 * not interactive. Source pointer contacts follow the actual native cells
 * after wrapping/font changes, preserving its A/B/C/D order and frame holds. */
export function ZogXIntroDemonstration({frame, reducedMotion = false}: {frame: number; reducedMotion?: boolean}) {
  const state = getZogXIntroState(frame), demo = SOURCE.demonstration, host = useRef<HTMLDivElement>(null);
  const [anchors, setAnchors] = useState<Record<string, Point> | null>(null);
  useLayoutEffect(() => {
    const container = host.current;
    if (!container) return;
    const measure = () => {
      const bounds = container.getBoundingClientRect();
      const em = parseFloat(getComputedStyle(container).fontSize);
      const points: Record<string, Point> = {entry: {x: bounds.width - 2 * em, y: bounds.height - 2 * em}};
      for (const answer of demo.answers) {
        const element = container.querySelector<HTMLElement>(`[data-zog-x-demo-value="${answer.letter.text}"]`)!;
        const range = document.createRange();
        range.selectNodeContents(element);
        const box = range.getBoundingClientRect();
        points[answer.letter.text] = {x: box.left-bounds.left+box.width*answer.pointerTextContact[0],
          y: box.top-bounds.top+box.height*answer.pointerTextContact[1]};
      }
      setAnchors(points);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    container.querySelectorAll('[data-zog-x-demo-value]').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [state.demonstrationVisible]);
  if (!state.demonstrationVisible) return null;
  const route = zogXIntroAt<PointerRoute>(demo.pointer.route, frame);
  const from = route && anchors?.[route.start], to = route && anchors?.[route.end];
  const progress = route?.progress ?? 0;
  const point = from && to ? {x: from.x+(to.x-from.x)*progress, y: from.y+(to.y-from.y)*progress} : null;
  // Reduced motion retains each stationary contact without animating transit.
  const showPointer = point && (!reducedMotion || route?.start === route?.end);
  const bounds = demo.pointer.bounds, tip = demo.pointer.tip;
  return <div ref={host} className="zog-x-demo" lang="en" data-zog-x-demo={frame}>
    <style>{DEMO_CSS}</style>
    <div className="zog-x-demo__panel" style={{opacity: zogXIntroAt<number>(demo.alpha, frame)}}>
      <p data-lesson-text-block="demonstration-prompt" data-source-text-ids={demo.prompt.sourceTextIds.join(' ')}>{demo.prompt.text}</p>
      <div className="zog-x-demo__answers" role="list">
        {demo.answers.map(answer => <div className="zog-x-demo__answer" role="listitem" key={answer.letter.text}>
          <span data-lesson-text-block={`demonstration-${answer.letter.text}-letter`}
            data-source-text-ids={answer.letter.sourceTextIds.join(' ')}>{answer.letter.text}</span>
          <span data-zog-x-demo-value={answer.letter.text} data-source-surface={answer.sourceSurface}
            data-lesson-text-block={`demonstration-${answer.letter.text}-value`}
            data-source-text-ids={answer.value.sourceTextIds.join(' ')}>{answer.value.text}</span>
        </div>)}
      </div>
    </div>
    {showPointer && <svg aria-hidden="true" focusable="false" className="zog-x-demo__pointer" data-source-shape-id={demo.pointer.characterId}
      data-source-instance={demo.pointer.sourceInstances[0].id} data-pointer-start={route!.start} data-pointer-end={route!.end}
      viewBox={`${bounds.left} ${bounds.top} ${bounds.right-bounds.left} ${bounds.bottom-bounds.top}`}
      style={{left: point.x, top: point.y, transform: `translate(${-100*(tip[0]-bounds.left)/(bounds.right-bounds.left)}%,${-100*(tip[1]-bounds.top)/(bounds.bottom-bounds.top)}%)`}}>
      {demo.pointer.paths.map((path, i) => <path key={i} d={path.d} fill={path.fill} stroke={path.stroke} strokeWidth={path.width}/>)}
    </svg>}
  </div>;
}

const DEMO_CSS = `.zog-x-demo{position:relative;min-inline-size:0;max-inline-size:100%;padding-block-end:4em;color:#172c43;font:var(--lesson-text-body-size,1.125rem)/var(--lesson-text-line-height,1.6) var(--lesson-text-font-body,system-ui,sans-serif);font-variant-numeric:tabular-nums}.zog-x-demo *{box-sizing:border-box}.zog-x-demo__panel{padding:1rem;border:1px solid #b4c8dc;border-radius:.8rem;background:white}.zog-x-demo p{margin:0 0 1em;font-size:1em;font-weight:600}.zog-x-demo__answers{font:var(--lesson-text-label-size,1.125rem)/var(--lesson-text-line-height,1.6) var(--lesson-text-font-body,system-ui,sans-serif);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,12em),1fr));gap:.75em}.zog-x-demo__answer{display:flex;align-items:center;gap:.65em;min-inline-size:0;padding:.4em;border:1px solid #b4c8dc;border-radius:.5em;background:#f2f7fd}.zog-x-demo__answer>span:first-child{font-weight:650;color:#285c8e}.zog-x-demo__answer>span:last-child{flex:1;padding:.3em .4em;white-space:nowrap}.zog-x-demo__pointer{position:absolute;inline-size:.8em;block-size:1.390291262em;pointer-events:none}`;

const CSS = `.zog-x-copy{min-inline-size:0;max-inline-size:100%;color:#172c43;font:var(--lesson-text-body-size,1.125rem)/var(--lesson-text-line-height,1.6) var(--lesson-text-font-body,system-ui,sans-serif);overflow-wrap:normal;word-break:normal;hyphens:none}.zog-x-copy *{box-sizing:border-box}.zog-x-copy h2{margin:0 0 .8rem}.zog-x-copy p{margin:0 0 .8em;max-inline-size:70ch}.zog-x-copy__instructions{padding:1rem;border:1px solid #c3d4e5;border-radius:.8rem;background:#fff}.zog-x-copy__term{display:inline;padding:0;border:0;border-radius:0;background:transparent;color:#174e92;font:inherit;text-align:inherit;text-decoration:underline;text-underline-offset:.15em;cursor:pointer;touch-action:manipulation}.zog-x-copy__term:disabled{color:#174e92;cursor:default}.zog-x-copy__term:focus-visible{outline:3px solid #a64100;outline-offset:3px}@container lesson-text (max-width:10rem){.zog-x-copy h2{font-variation-settings:"wdth" 75}}`;
