'use client';

import {G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES} from '../g4-l3-main-timeline-audio.generated';

import React, {useId, useLayoutEffect, useRef} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {
  getCourseG04L03In002FrameState,
  normalizeCourseG04L03In002Frame,
} from '../modules/course-g04-l03-in-002';
import {COURSE_G04_L03_IN_002_SOURCE} from '../timelines/course-g04-l03-in-002';

const ANIMATION_ID = 'course-g04-l03-in-002';
const DOMAIN = 'sprite-88';
const SCENARIO = 'source-static-frame';
const BINDING_VERSION = 'g04-l03-placement-013-modern-text-v1';
const GRAPH = Object.freeze({width: 840, height: 200, originX: 420, step: 36, axisY: 110, labelY: 146});
const POSITIVE_INK = '#164eaa';
const NEGATIVE_INK = '#a82c45';
const NEUTRAL_INK = '#14213d';
export const G4_L3_IN002_KEY_TERMS = Object.freeze([
  {text: 'number line', keyAttribute: 'Number line', entryId: 'en-0424-79116d5cfb19', characterId: 10, firstVisibleFrame: 13},
  {text: 'line', keyAttribute: 'Line', entryId: 'en-0348-26540cbc2a59', characterId: 11, firstVisibleFrame: 25},
  {text: 'ordering', keyAttribute: 'Order', entryId: 'en-0438-85eefb739783', characterId: 12, firstVisibleFrame: 40},
  {text: 'value', keyAttribute: 'Value', entryId: 'en-0737-920ae135dd07', characterId: 13, firstVisibleFrame: 56},
  {text: 'Positive numbers', keyAttribute: 'Positive number', entryId: 'en-0499-e54dca5d8b22', characterId: 76, firstVisibleFrame: 232},
  {text: 'Negative numbers', keyAttribute: 'Negative number', entryId: 'en-0411-1954bd66c84d', characterId: 80, firstVisibleFrame: 310},
]);
export const G4_L3_IN002_KEY_TERMS_CAPABILITY = Object.freeze({indexLanguage: 'en' as const, sourceAssetId: 'ELKTEG4.xml' as const,
  sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749', entryIds: Object.freeze(G4_L3_IN002_KEY_TERMS.map(term => term.entryId))});

/** Complete words enter only after their final source glyph clears shape-6's
 * mask. These thresholds use the actual text-8 glyph advances, font-1 outline
 * bounds, and placement matrices, including the source holds at 13–19 / 25–31.
 * The modern word reveal intentionally replaces partial, clipped glyphs.
 */
export const G4_L3_IN002_WORD_REVEALS = Object.freeze([
  {text: 'A', frame: 5}, {text: 'number', frame: 11}, {text: 'line', frame: 13},
  {text: 'is', frame: 21}, {text: 'a', frame: 22}, {text: 'line', frame: 25},
  {text: 'for', frame: 33}, {text: 'ordering', frame: 40}, {text: 'numbers', frame: 46},
  {text: 'by', frame: 48}, {text: 'their', frame: 52}, {text: 'value.', frame: 56},
]);

export const G4_L3_IN002_TICK_REVEALS = Object.freeze([72, 74, 76, 78, 80, 82, 84, 86, 87, 89]);
const POSITIVE_TEXT_CHARACTERS = Object.freeze([21, 26, 31, 36, 41, 46, 51, 56, 62, 66]);
const NEGATIVE_TEXT_CHARACTERS = Object.freeze([22, 27, 32, 37, 42, 47, 52, 57, 61, 67]);

/** Minus signs are shapes in the SWF, not missing digits or guessed prefixes.
 * 23→68 holds the growing groups of minus signs; 77/78 outline the signed
 * number groups; 87 is the late minus-sign emphasis. Character 83 is literal +.
 */
export const G4_L3_IN002_SIGN_SOURCE = Object.freeze({
  negativeSignCharacters: Object.freeze([23, 28, 33, 38, 43, 48, 53, 58, 63, 68]),
  positiveOutlineCharacter: 77,
  negativeOutlineCharacter: 78,
  negativeEmphasisCharacter: 87,
  positiveSignCharacter: 83,
});

export const G4_L3_IN002_BEATS = Object.freeze({
  panel: 70,
  origin: 71,
  completeAxis: 90,
  arrowheads: 91,
  positiveOutline: Object.freeze({firstFrame: 123, lastFrameExclusive: 149}),
  negativeOutline: Object.freeze({firstFrame: 155, lastFrameExclusive: 173}),
  positiveName: Object.freeze({firstVisibleFrame: 232, fullyVisibleFrame: 235}),
  negativeName: Object.freeze({firstVisibleFrame: 310, fullyVisibleFrame: 313}),
  positiveFocus: Object.freeze({firstFrame: 352, lastFrameExclusive: 422}),
  positiveSigns: Object.freeze({firstFrame: 360, interval: 3, lastVisibleFrameExclusive: 417}),
  negativeFocus: Object.freeze({firstFrame: 435, lastFrameExclusive: 490}),
  negativeSignEmphasis: Object.freeze({firstFrame: 442, lastVisibleFrameExclusive: 482}),
});

// Exact PlaceObject ratios for source morphs 17/18 at frames 71–89.
// A rounded linear formula differs by one 16-bit unit on nine source frames.
export const G4_L3_IN002_AXIS_RATIOS = Object.freeze([
  0, 3449, 6899, 10348, 13797, 17246, 20696, 24145, 27594, 31043,
  34493, 37942, 41391, 44840, 48290, 51739, 55188, 58637, 62087,
]);

function textId(character: number) {return `character-${character}/run-0`;}
function tickId(value: number) {return value === 0 ? 'tick-zero' : `tick-${value < 0 ? 'negative' : 'positive'}-${Math.abs(value)}`;}
function inRange(frame: number, first: number, end: number) {return frame >= first && frame < end;}
function anchor(value: number) {
  return {x: GRAPH.originX + value * GRAPH.step, y: GRAPH.labelY, stageWidth: GRAPH.width, stageHeight: GRAPH.height};
}

export const G4_L3_IN002_TEXT_BINDING = Object.freeze({
  schemaVersion: 1,
  version: BINDING_VERSION,
  placementId: 'g04-l03-placement-013',
  animationId: ANIMATION_ID,
  sourceSwfSha256: COURSE_G04_L03_IN_002_SOURCE.swfSha256,
  template: 'complex-figure',
  blocks: [
    {id: 'definition', sourceTextIds: Array.from({length: 9}, (_, index) => `character-8/run-${index}`), role: 'body', language: 'en', readingOrder: 0, valueSource: 'maintained-page-state'},
    {id: 'negative-name', sourceTextIds: [textId(79)], role: 'label', language: 'en', readingOrder: 10, valueSource: 'maintained-page-state', anchor: {...anchor(-5), y: 54}},
    {id: 'positive-name', sourceTextIds: [textId(75)], role: 'label', language: 'en', readingOrder: 111, valueSource: 'maintained-page-state', anchor: {...anchor(5), y: 54}},
    ...Array.from({length: 21}, (_, index) => {
      const value = index - 10;
      return {
        id: tickId(value),
        sourceTextIds: value === 0 ? [textId(16)] : value < 0
          ? [textId(NEGATIVE_TEXT_CHARACTERS[-value - 1])]
          : [textId(POSITIVE_TEXT_CHARACTERS[value - 1]), textId(G4_L3_IN002_SIGN_SOURCE.positiveSignCharacter)],
        ...(value < 0 ? {sourceShapeIds: G4_L3_IN002_SIGN_SOURCE.negativeSignCharacters.slice(-value - 1)} : {}),
        role: 'label' as const, language: 'en' as const, readingOrder: 100 + index + (value > 0 ? 1 : 0),
        valueSource: 'maintained-page-state' as const, anchor: anchor(value),
      };
    }),
  ],
} satisfies LessonTextBinding);

export function getG4L3In002TeachingState(requestedFrame: number) {
  const frame = normalizeCourseG04L03In002Frame(requestedFrame, DOMAIN);
  const maximumTick = G4_L3_IN002_TICK_REVEALS.filter((first) => frame >= first).length;
  const positiveOutline = inRange(frame, 123, 149);
  const negativeOutline = inRange(frame, 155, 173);
  const positiveFocus = inRange(frame, 352, 422);
  const negativeFocus = inRange(frame, 435, 490);
  const positiveSignCount = inRange(frame, 360, 417) ? Math.min(10, 1 + Math.floor((frame - 360) / 3)) : 0;
  const focus = positiveOutline || positiveFocus ? 'positive' : negativeOutline || negativeFocus ? 'negative' : 'center';
  return Object.freeze({
    frame,
    definition: G4_L3_IN002_WORD_REVEALS.filter((word) => frame >= word.frame).map((word) => word.text).join(' '),
    panelVisible: frame >= 70,
    originVisible: frame >= 71,
    // Retain the authored ratio samples before the completed axis at frame 90.
    axisExtent: frame < 71 ? 0 : frame >= 90 ? 10.8 : (G4_L3_IN002_AXIS_RATIOS[frame - 71] / 65535) * 10.8,
    arrowsVisible: frame >= 91,
    maximumTick,
    tickValues: Object.freeze(frame < 71 ? [] : Array.from({length: maximumTick * 2 + 1}, (_, index) => index - maximumTick)),
    positiveNameVisible: frame >= 232,
    negativeNameVisible: frame >= 310,
    positiveOutline,
    negativeOutline,
    positiveFocus,
    negativeFocus,
    positiveSignCount,
    negativeSignEmphasis: inRange(frame, 442, 482),
    focus,
  });
}

export function getG4L3In002TextSnapshot(
  state: SourceStaticCanvasFrameState,
  context: RuntimeContext,
): TextPresentationSnapshot {
  const blockers: string[] = [];
  if (state.animationId !== ANIMATION_ID || state.sourceSwfSha256 !== COURSE_G04_L03_IN_002_SOURCE.swfSha256) blockers.push('source-identity-mismatch');
  if (state.status !== 'ready') blockers.push(state.blocker ?? 'source-state-not-ready');
  if (state.frameDomain !== DOMAIN || (context.frameDomain ?? DOMAIN) !== DOMAIN) blockers.push('unsupported-frame-domain');
  if (state.scenario !== SCENARIO || context.scenario !== SCENARIO) blockers.push('unsupported-scenario');
  if (state.language !== 'en' || context.lang !== 'en') blockers.push('spanish-text-not-source-verified');
  if (state.frame !== normalizeCourseG04L03In002Frame(context.frame, DOMAIN)
    || state.rootFrame !== 6 || (context.rootFrame !== undefined && context.rootFrame !== 6)
    || state.seed !== (Number.isSafeInteger(context.seed) ? context.seed >>> 0 : 0)) blockers.push('teaching-state-identity-mismatch');
  const teaching = getG4L3In002TeachingState(state.frame);
  return {
    schemaVersion: 1, animationId: ANIMATION_ID, bindingVersion: BINDING_VERSION,
    sourceSwfSha256: COURSE_G04_L03_IN_002_SOURCE.swfSha256,
    status: blockers.length ? 'blocked' : 'ready', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame, scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
    // The maintained renderer replaces the whole old plane. No instance-level
    // suppression operation is performed or claimed by this page.
    suppressedInstances: [],
    blocks: blockers.length ? [] : G4_L3_IN002_TEXT_BINDING.blocks.map((binding) => {
      let text = '', visible = false;
      if (binding.id === 'definition') {text = teaching.definition; visible = Boolean(text);}
      else if (binding.id === 'negative-name') {text = 'Negative numbers'; visible = teaching.negativeNameVisible;}
      else if (binding.id === 'positive-name') {text = 'Positive numbers'; visible = teaching.positiveNameVisible;}
      else {
        const value = binding.id === 'tick-zero' ? 0 : Number(binding.id.split('-').at(-1)) * (binding.id.includes('negative') ? -1 : 1);
        visible = teaching.tickValues.includes(value);
        text = value < 0 ? `−${-value}` : value > 0 && value <= teaching.positiveSignCount ? `+${value}` : String(value);
      }
      return {id: binding.id, text, visible, role: binding.role, language: binding.language, readingOrder: binding.readingOrder, ...('anchor' in binding ? {anchor: binding.anchor} : {})};
    }),
  };
}

function NumberLine({teaching}: {readonly teaching: ReturnType<typeof getG4L3In002TeachingState>}) {
  const {originX, axisY, step} = GRAPH;
  const extent = teaching.axisExtent * step;
  return <svg viewBox={`0 0 ${GRAPH.width} ${GRAPH.height}`} aria-hidden="true" focusable="false" style={{display: 'block', width: '100%', height: 'auto'}}>
    <rect width={GRAPH.width} height={GRAPH.height} fill="#fffdf7"/>
    {(teaching.positiveOutline || teaching.positiveFocus) && <rect x={originX + 10} y={80} width={380} height={90} rx={12} fill="#eaf1fe" stroke={POSITIVE_INK} strokeWidth={2}/>}
    {(teaching.negativeOutline || teaching.negativeFocus) && <rect x={30} y={80} width={380} height={90} rx={12} fill="#fcecef" stroke={NEGATIVE_INK} strokeWidth={2}/>}
    {teaching.originVisible && <>
      <line x1={originX - extent} y1={axisY} x2={originX} y2={axisY} stroke={NEGATIVE_INK} strokeWidth={3}/>
      <line x1={originX} y1={axisY} x2={originX + extent} y2={axisY} stroke={POSITIVE_INK} strokeWidth={3}/>
      {teaching.tickValues.map((value) => <line key={value} data-in002-tick={value}
        x1={originX + value * step} x2={originX + value * step} y1={axisY - 9} y2={axisY + 9}
        stroke={value < 0 ? NEGATIVE_INK : value > 0 ? POSITIVE_INK : NEUTRAL_INK} strokeWidth={value === 0 ? 4 : 2}/>)}
    </>}
    {teaching.arrowsVisible && <>
      <path d={`M ${originX - extent + 11} ${axisY - 7} L ${originX - extent} ${axisY} L ${originX - extent + 11} ${axisY + 7}`} fill="none" stroke={NEGATIVE_INK} strokeWidth={3} strokeLinejoin="round"/>
      <path d={`M ${originX + extent - 11} ${axisY - 7} L ${originX + extent} ${axisY} L ${originX + extent - 11} ${axisY + 7}`} fill="none" stroke={POSITIVE_INK} strokeWidth={3} strokeLinejoin="round"/>
    </>}
    {teaching.negativeSignEmphasis && teaching.tickValues.filter((value) => value < 0).map((value) => <line key={`emphasis-${value}`}
      x1={originX + value * step - 12} x2={originX + value * step + 12} y1={166} y2={166}
      stroke={NEGATIVE_INK} strokeWidth={3} strokeLinecap="round"/>)}
  </svg>;
}

const PRESENTATION_STYLES = `
.in002-modern .lesson-figure-text-layer__label[data-lesson-text-block^="tick-negative"]{fill:${NEGATIVE_INK}}
.in002-modern .lesson-figure-text-layer__label[data-lesson-text-block^="tick-positive"]{fill:${POSITIVE_INK}}
.in002-modern .lesson-figure-text-layer__label[data-lesson-text-block^="tick-negative"]{color:${NEGATIVE_INK}}
.in002-modern .lesson-figure-text-layer__label[data-lesson-text-block^="tick-positive"]{color:${POSITIVE_INK}}
.in002-modern .in002-native-labels{position:absolute;inset:0;list-style:none;padding:0;margin:0;pointer-events:none}
/* Include full native font metrics in the painted label box across engines. */
.in002-modern .in002-native-labels>li{background:#fffdf7;position:absolute;translate:-50% -50%;margin:0;padding:0;white-space:nowrap;font-size:1.125rem;line-height:1.5}
/* Opaque text backing follows the same positive/negative teaching region. */
.in002-modern[data-in002-focus="positive"] .in002-native-labels>li:has([data-lesson-text-block^="tick-positive"]){background:#eaf1fe}
.in002-modern[data-in002-focus="negative"] .in002-native-labels>li:has([data-lesson-text-block^="tick-negative"]){background:#fcecef}
/* Keep wrapped glossary buttons inside one complete opaque label box. */
.in002-modern .in002-native-labels>li>.lesson-figure-text-layer__label{display:block}
.in002-modern .in002-native-labels button{pointer-events:auto}
.in002-modern .in002-keyterm{min-inline-size:44px;min-block-size:44px;max-inline-size:max(44px,calc(100cqi - 12px));white-space:normal;overflow-wrap:anywhere;scroll-margin:6px;padding:.15rem .1rem;border:0;border-radius:.25rem;background:transparent;color:#164eaa;font:inherit;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.15em;cursor:pointer}
.in002-modern .in002-keyterm:disabled{cursor:default}
.in002-modern .in002-keyterm:focus-visible{outline:3px solid #155ac1;outline-offset:2px}
.in002-modern[data-in002-focus="positive"] .lesson-figure-text-layer__label[data-lesson-text-block^="tick-positive"],
.in002-modern[data-in002-focus="negative"] .lesson-figure-text-layer__label[data-lesson-text-block^="tick-negative"]{font-weight:800}
.in002-modern .lesson-figure-text-layer__label[data-lesson-text-block$="-name"]{font-weight:700}
.in002-modern .lesson-text-presentation__block--body{min-block-size:3.2em}
.in002-modern .lesson-text-presentation__label-list{list-style:none;padding:0;gap:.5rem 1rem}
.in002-modern .lesson-text-presentation__label-list > li{min-inline-size:2rem;text-align:center}
.in002-modern .lesson-text-presentation__label-list > li[data-lesson-readable-block$="-name"]{flex-basis:100%;font-weight:700;text-align:start;margin-block-start:.5rem}
.in002-modern .lesson-text-presentation__label-list > li[data-lesson-readable-block="tick-zero"]{flex-basis:100%;font-weight:700;margin-block:.25rem}
/* The native axis list is the single accessible reading path, including
   source term controls. The narrow visual summary is aria-hidden so repeated
   signed labels do not become repeated screen-reader content. */
@container lesson-text (min-width:52rem){
 .in002-modern .lesson-text-presentation__label-list{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;padding:0;margin:0;gap:0}
}
`;

function revealFocusedGlossaryControl(viewport: HTMLElement, target: EventTarget | null) {
  if (!(target instanceof HTMLElement) || !target.matches('button[data-source-keyterm]') || !viewport.contains(target)) return;
  const control = target.getBoundingClientRect();
  const visible = viewport.getBoundingClientRect();
  const left = visible.left + 6;
  const right = visible.right - 6;
  // Local horizontal scrolling preserves the document position and leaves
  // room for the focus outline around a wrapped source control.
  if (control.left < left) viewport.scrollLeft += control.left - left;
  else if (control.right > right) viewport.scrollLeft += control.right - right;
}

export function G4L3In002ModernRenderer(props: AnimationRendererProps) {
  const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? DOMAIN};
  const sourceState = props.state && typeof props.state === 'object' && 'animationId' in props.state
    ? props.state as SourceStaticCanvasFrameState
    : getCourseG04L03In002FrameState(props.frame, context);
  const snapshot = getG4L3In002TextSnapshot(sourceState, context);
  const teaching = getG4L3In002TeachingState(sourceState.frame);
  const host = useRef<HTMLDivElement>(null);
  const scrollHelpId = useId();
  const uiLanguage = props.uiLanguage ?? props.lang;
  const follow = useRef({phase: '', replay: -1, manual: false});
  const ready = snapshot.status === 'ready';
  useLayoutEffect(() => {
    if (!ready || !teaching.panelVisible) return;
    const viewport = host.current?.querySelector<HTMLElement>('.lesson-text-presentation__figure-viewport');
    if (!viewport) return;
    const changedPhase = follow.current.phase !== teaching.focus || follow.current.replay !== (props.replay ?? 0);
    if (changedPhase) follow.current = {phase: teaching.focus, replay: props.replay ?? 0, manual: false};
    let active = true;
    const apply = (recenter: boolean) => {
      if (!active) return;
      if (follow.current.manual) {
        if (recenter) revealFocusedGlossaryControl(viewport, document.activeElement);
        return;
      }
      if (recenter) {
        const center = teaching.focus === 'positive' ? .75 : teaching.focus === 'negative' ? .25 : .5;
        viewport.scrollLeft = Math.max(0, Math.min(viewport.scrollWidth - viewport.clientWidth, viewport.scrollWidth * center - viewport.clientWidth / 2));
      }
      if (teaching.positiveSignCount === 0) return;
      const label = viewport.querySelector<HTMLElement>(`[data-lesson-text-block="tick-positive-${teaching.positiveSignCount}"]`);
      if (!label) return;
      const viewBox = viewport.getBoundingClientRect(), labelBox = label.getBoundingClientRect();
      if (labelBox.left < viewBox.left + 8) viewport.scrollLeft -= viewBox.left + 8 - labelBox.left;
      else if (labelBox.right > viewBox.right - 8) viewport.scrollLeft += labelBox.right - viewBox.right + 8;
    };
    apply(changedPhase);
    const focusedControl = () => {
      const target = document.activeElement;
      return target instanceof HTMLElement && target.matches('button[data-source-keyterm]') && viewport.contains(target) ? target : null;
    };
    const dimensions = () => {
      const control = focusedControl();
      const box = control?.getBoundingClientRect();
      return `${viewport.clientWidth}:${viewport.scrollWidth}:${control?.dataset.sourceKeyterm ?? ''}:${box?.width ?? 0}:${box?.height ?? 0}`;
    };
    let previousDimensions = dimensions();
    const resize = () => {
      const next = dimensions();
      if (next !== previousDimensions) {previousDimensions = next; apply(true);}
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(viewport);
    const plane = viewport.querySelector('.lesson-text-presentation__figure-plane');
    if (plane) observer?.observe(plane);
    // Container-relative control widths can settle after the plane has resized.
    // Observe the focused control as well so its final size is revealed.
    const observeFocusedControl = () => {const control = focusedControl(); if (control) observer?.observe(control);};
    observeFocusedControl();
    viewport.addEventListener('focusin', observeFocusedControl);
    if (!observer) window.addEventListener('resize', resize);
    const fonts = () => apply(true);
    document.fonts?.addEventListener('loadingdone', fonts);
    void document.fonts?.ready.then(() => {if (active) fonts();});
    // Geometry changes follow the current teaching phase, without advancing its
    // clock. Preserve a focused glossary control on reflow; other user scrolling
    // remains authoritative until a new phase or Replay.
    return () => {
      active = false;
      observer?.disconnect();
      viewport.removeEventListener('focusin', observeFocusedControl);
      if (!observer) window.removeEventListener('resize', resize);
      document.fonts?.removeEventListener('loadingdone', fonts);
    };
  }, [ready, teaching.panelVisible, teaching.focus, teaching.positiveSignCount, props.replay]);
  const retainUserViewport = (event: React.SyntheticEvent) => {
    if (host.current?.querySelector('.lesson-text-presentation__figure-viewport')?.contains(event.target as Node)) follow.current.manual = true;
  };
  if (!ready) return null;
  const visibleLabels = snapshot.blocks.filter((block) => block.visible && block.anchor).sort((a, b) => a.readingOrder - b.readingOrder);
  const openTerm = (term: typeof G4_L3_IN002_KEY_TERMS[number], trigger: HTMLButtonElement) => {
    if (sourceState.frame < term.firstVisibleFrame) return;
    props.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:ANIMATION_ID,
      playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'}, {trigger,keyTermIndexLanguage:'en'});
  };
  const termButton = (term: typeof G4_L3_IN002_KEY_TERMS[number], key: string) => <button key={key} type="button" className="in002-keyterm"
    disabled={!props.onLessonHostRequest} data-source-keyterm={term.keyAttribute} data-source-button={term.characterId}
    onClick={event => openTerm(term,event.currentTarget)}>{term.text}</button>;
  const definitionParts = teaching.definition.split(/(number line|line|ordering|value)/g).map((part,index) => {
    const term = G4_L3_IN002_KEY_TERMS.slice(0,4).find(term => term.text === part && sourceState.frame >= term.firstVisibleFrame);
    return term ? termButton(term,`definition-${index}`) : part;
  });
  return <div ref={host} className="in002-modern" data-modern-lesson="g4-l3-in002"
    data-in002-focus={teaching.focus} data-in002-plus-sign-count={teaching.positiveSignCount}
    data-flash-frame={sourceState.frame} data-flash-frame-domain={sourceState.frameDomain} data-flash-root-frame={sourceState.rootFrame}
    data-runtime-scenario={sourceState.scenario} data-runtime-seed={sourceState.seed} data-runtime-replay={props.replay ?? 0}
    onPointerDownCapture={retainUserViewport} onWheelCapture={retainUserViewport}
    onFocusCapture={event => {
      // Keyboard entry into a source glossary control is intentional viewing,
      // just like pointer interaction. Do not recenter it behind a closing tool.
      const viewport = host.current?.querySelector<HTMLElement>('.lesson-text-presentation__figure-viewport');
      if (viewport && event.target.matches('button[data-source-keyterm]') && viewport.contains(event.target)) {
        follow.current.manual = true;
        revealFocusedGlossaryControl(viewport, event.target);
      }
    }}
    onKeyDownCapture={(event) => {if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) retainUserViewport(event);}}
    style={{minWidth: 0, width: '100%', padding: '1rem', background: '#fffdf7'}}>
    <style>{PRESENTATION_STYLES}</style>
    <div className="lesson-text-presentation lesson-text-presentation--complex-figure" lang="en"><div className="lesson-text-presentation__layout">
      {teaching.definition && <p className="lesson-text-presentation__block lesson-text-presentation__block--body" data-lesson-text-block="definition">{definitionParts}</p>}
      {teaching.panelVisible && <figure className="lesson-text-presentation__figure" aria-label="Number line">
        <p id={scrollHelpId} className="in002-scroll-help" lang={uiLanguage}>
          {uiLanguage === 'es' ? 'Con la recta numérica enfocada, usa las flechas izquierda y derecha para desplazarte; Inicio y Fin te llevan a los extremos.' : 'With the number line focused, use the left and right arrow keys to scroll; Home and End move to its ends.'}
        </p>
        <div className="lesson-text-presentation__figure-viewport" role="group" tabIndex={0} aria-label="Number line" aria-describedby={scrollHelpId}
          onKeyDown={event => {
            if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
                !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            const viewport = event.currentTarget;
            const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
            if (maximum === 0) return;
            event.preventDefault();
            // WebKit does not provide native horizontal arrow scrolling for this group.
            const step = Math.max(40, viewport.clientWidth / 5);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? maximum :
              viewport.scrollLeft + (event.key === 'ArrowRight' ? step : -step);
            viewport.scrollLeft = Math.max(0, Math.min(maximum, next));
          }}>
          <div className="lesson-text-presentation__figure-plane" style={{'--lesson-figure-min-inline-size':'52rem'} as React.CSSProperties}>
            <div style={{position:'relative'}}><NumberLine teaching={teaching}/>
              <ul className="in002-native-labels" role="list" aria-label="Number line labels">
                {visibleLabels.map(block => {const term=G4_L3_IN002_KEY_TERMS.find(term=>term.text===block.text);return <li key={block.id} lang={block.language}
                  style={{left:`${block.anchor!.x/block.anchor!.stageWidth*100}%`,top:`${block.anchor!.y/block.anchor!.stageHeight*100}%`}}>
                  {term ? <span className="lesson-figure-text-layer__label" data-lesson-text-block={block.id}>{termButton(term,block.id)}</span>
                    : <span className="lesson-figure-text-layer__label" data-lesson-text-block={block.id}>{block.text}</span>}
                </li>;})}
              </ul>
            </div>
          </div>
        </div>
      </figure>}
      {visibleLabels.length > 0 && <div className="lesson-text-presentation__controls"><ul className="lesson-text-presentation__label-list" role="list" aria-label="Figure labels" aria-hidden="true">
        {visibleLabels.map(block=><li key={block.id} data-lesson-readable-block={block.id} lang={block.language}>{block.text}</li>)}
      </ul></div>}
    </div></div>
  </div>;
}

export const G4_L3_IN002_SOURCE_AUDIO_CUES=Object.freeze(G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES['course-g04-l03-in-002'].audioCues.map(cue=>{
  if(!cue.sha256)throw new Error('Source main audio cue lacks its original hash');
  return Object.freeze({...cue,sha256:cue.sha256});
}));

export const G4_L3_IN002_TEXT_PRESENTATION = Object.freeze({
  schemaVersion: 1,
  binding: G4_L3_IN002_TEXT_BINDING,
  Renderer: G4L3In002ModernRenderer,
  getSnapshot: getG4L3In002TextSnapshot,
  sourceTimelineAudioCues:G4_L3_IN002_SOURCE_AUDIO_CUES,
  reducedMotionFrameByDomain:{'sprite-88':492},
  keyTerms: G4_L3_IN002_KEY_TERMS_CAPABILITY,
} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>);
