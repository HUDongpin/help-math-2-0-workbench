'use client';

import React, {useEffect, useLayoutEffect, useRef, useReducer, useState} from 'react';
import {LessonSourceButton} from '../lesson-source-button';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {CourseG04L03In004Renderer, getCourseG04L03In004FrameState, normalizeCourseG04L03In004Frame,
  type CourseG04L03In004ModernSurfaceProps} from '../modules/course-g04-l03-in-004';
import {COURSE_G04_L03_IN_004_SOURCE} from '../timelines/course-g04-l03-in-004';
import {COURSE_G04_L03_IN_004_NUMBER_CARDS as CARDS,
  COURSE_G04_L03_IN_004_WRONG_FEEDBACK, COURSE_G04_L03_IN_004_COMPLETION_FEEDBACK,
  createCourseG04L03In004NumberLineDragState, reduceCourseG04L03In004NumberLineDrag, type CourseG04L03In004NumberLineDragState,
  type CourseG04L03In004CardId, type CourseG04L03In004NumberLineDragAction} from '../timelines/course-g04-l03-in-004-number-line-drag-interaction';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4_L3_IN004_TEACHING_SOURCE as SOURCE} from './generated/g4-l3-in004-teaching-v1';

const ID = 'course-g04-l03-in-004';
const DOMAIN = 'sprite-160';
const VERSION = 'g04-l03-placement-015-modern-text-v2';
const GRAPH = Object.freeze({width: 1120, height: 270, zeroX: 560, step: 48, axisY: 120});
const tickValues = Object.freeze(Array.from({length: 21}, (_, index) => index - 10));
const positiveCharacters = [10, 11, 15, 17, 19, 21, 23, 25, 28, 29];
const negativeCharacters = [12, 14, 16, 18, 20, 22, 24, 26, 27, 30];
const textId = (id: number) => `character-${id}/run-0`;
const format = (value: number, positiveSign = false) => value < 0 ? `−${-value}` : value > 0 && positiveSign ? `+${value}` : String(value);
const xFor = (value: number) => GRAPH.zeroX + value * GRAPH.step;
const rem = (value: number) => `${value / 16}rem`;
export const G4_L3_IN004_KEY_TERMS = Object.freeze({indexLanguage:'en' as const,sourceAssetId:'ELKTEG4.xml',
  sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  entryIds:['en-0495-b62037868041','en-0424-79116d5cfb19']});
const glossaryTargets = {position:{entryId:G4_L3_IN004_KEY_TERMS.entryIds[0],sourceButtonId:44},
  'number line':{entryId:G4_L3_IN004_KEY_TERMS.entryIds[1],sourceButtonId:45}} as const;

export const G4_L3_IN004_TEXT_BINDING = Object.freeze({
  schemaVersion: 1, version: VERSION, placementId: 'g04-l03-placement-015', animationId: ID,
  sourceSwfSha256: COURSE_G04_L03_IN_004_SOURCE.swfSha256, template: 'exercise',
  blocks: [
    {id: 'instruction', sourceTextIds: Array.from({length: 5}, (_, run) => `character-43/run-${run}`), role: 'question', language: 'en', readingOrder: 0, valueSource: 'maintained-page-state'},
    ...tickValues.map((value, index) => ({id: `tick-${value}`, sourceTextIds: value === 0 ? [textId(8)] : value > 0 ? [textId(positiveCharacters[value - 1]), textId(32)] : [textId(negativeCharacters[-value - 1])], ...(value < 0 ? {sourceShapeIds: [value === -1 ? 13 : 33]} : {}), role: 'label' as const, language: 'en' as const, readingOrder: 10 + index, valueSource: 'maintained-page-state' as const})),
    {id: 'example', sourceTextIds: [textId(35)], sourceShapeIds: [36], role: 'label', language: 'en', readingOrder: 40, valueSource: 'maintained-page-state'},
    ...CARDS.map((card, index) => ({id: `card-${card.id}`, sourceTextIds: [textId([37, 38, 37, 39, 40][index])], ...(card.numericValue < 0 ? {sourceShapeIds: [36]} : {}), role: 'answer' as const, language: 'en' as const, readingOrder: 50 + index, valueSource: 'maintained-page-state' as const})),
    {id: 'wrong', sourceTextIds: [textId(154)], role: 'feedback', language: 'en', readingOrder: 60, valueSource: 'maintained-page-state'},
    {id: 'complete', sourceTextIds: [textId(158)], role: 'feedback', language: 'en', readingOrder: 62, valueSource: 'maintained-page-state'},
    {id: 'close', sourceTextIds: [textId(145)], role: 'answer', language: 'en', readingOrder: 63, valueSource: 'maintained-page-state'},
  ],
} satisfies LessonTextBinding);

export function getG4L3In004TeachingState(requestedFrame: number) {
  const frame = normalizeCourseG04L03In004Frame(requestedFrame, DOMAIN);
  const demo = SOURCE.demoMoves.filter(move => move.frame <= frame).at(-1);
  return Object.freeze({frame,
    instruction: SOURCE.wordReveals.filter(word => frame >= word.frame).map(word => word.text).join(' '),
    graphVisible: frame >= 2, cardsVisible: frame >= 2 && frame < 126,
    demoVisible: frame >= 2, demoPlaced: frame >= 111,
    demoX: 272 + (xFor(-1) - 272) * (demo?.xProgress ?? 0),
    demoY: 226 + (66 - 226) * (demo?.yProgress ?? 0),
  });
}

/** Product accessibility status follows placement state; it is not source teaching copy. */
export function getG4L3In004PlacementStatus(interaction: CourseG04L03In004NumberLineDragState): string {
  if (interaction.mode !== 'correct-feedback' || !interaction.lastPlacedCardId
    || !interaction.placedCardIds.includes(interaction.lastPlacedCardId)) return '';
  const card = CARDS.find(card => card.id === interaction.lastPlacedCardId);
  return card ? `${card.accessibleLabel} placed` : '';
}

export function getG4L3In004TextSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext,
  interaction: CourseG04L03In004NumberLineDragState = createCourseG04L03In004NumberLineDragState()): TextPresentationSnapshot {
  const blockers: string[] = [];
  if (state.animationId !== ID || state.sourceSwfSha256 !== SOURCE.sourceSwfSha256) blockers.push('source-identity-mismatch');
  if (state.status !== 'ready') blockers.push(state.blocker ?? 'source-state-not-ready');
  if (state.frameDomain !== DOMAIN || (context.frameDomain ?? DOMAIN) !== DOMAIN) blockers.push('unsupported-frame-domain');
  if (state.scenario !== 'source-static-frame' || context.scenario !== state.scenario) blockers.push('unsupported-scenario');
  if (state.language !== 'en' || context.lang !== 'en') blockers.push('spanish-text-not-source-verified');
  if (state.frame !== normalizeCourseG04L03In004Frame(context.frame, DOMAIN)
    || state.rootFrame !== 6 || (context.rootFrame !== undefined && context.rootFrame !== 6)
    || state.seed !== (context.seed >>> 0)) blockers.push('teaching-state-identity-mismatch');
  const teaching = getG4L3In004TeachingState(state.frame);
  const interactive = state.frame === 126 && !/^[a-f0-9]{64}$/.test(context.entryStateSha256 ?? '');
  const values: Record<string, {text: string; visible: boolean}> = {
    instruction: {text: teaching.instruction, visible: Boolean(teaching.instruction)},
    example: {text: '−1', visible: teaching.demoVisible},
    wrong: {text: COURSE_G04_L03_IN_004_WRONG_FEEDBACK, visible: interactive && interaction.mode === 'wrong-feedback'},
    complete: {text: COURSE_G04_L03_IN_004_COMPLETION_FEEDBACK, visible: interactive && interaction.mode === 'completed'},
    close: {text: 'Close', visible: interactive && interaction.mode === 'wrong-feedback'},
  };
  for (const value of tickValues) values[`tick-${value}`] = {text: format(value, true), visible: teaching.graphVisible};
  for (const card of CARDS) values[`card-${card.id}`] = {text: card.label, visible: teaching.cardsVisible || interactive || (state.frame>=127 && interaction.placedCardIds.includes(card.id))};
  return {schemaVersion: 1, animationId: ID, bindingVersion: VERSION, sourceSwfSha256: SOURCE.sourceSwfSha256,
    status: blockers.length ? 'blocked' : 'ready', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame, scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
    suppressedInstances: [],
    blocks: blockers.length ? [] : G4_L3_IN004_TEXT_BINDING.blocks.map(binding => ({id: binding.id, ...values[binding.id], role: binding.role, language: binding.language, readingOrder: binding.readingOrder})),
  };
}

const STYLES = `
/* Apply the existing modern host heading scale from this page's first paint,
   including the interval before the shared typography stylesheet settles. */
.lesson-shell2[data-host-presentation='modern-wide']:has(.in004-modern) .lesson-shell2__page-heading h1{font-family:var(--lesson-font-display);font-size:clamp(1.75rem,2.3vw,2.25rem);line-height:1.25;text-wrap:balance;overflow-wrap:anywhere}
/* Let long host navigation labels wrap below their icon in narrow spines. */
.lesson-shell2[data-host-presentation='modern-wide']:has(.in004-modern) .lesson-shell2__spine-home .lesson-shell2__learning-home-link{flex-wrap:wrap;border-radius:1rem}
.lesson-shell2[data-host-presentation='modern-wide']:has(.in004-modern) .lesson-shell2__spine-home .lesson-shell2__learning-home-link>span:last-child{min-inline-size:0;max-inline-size:100%;overflow-wrap:anywhere}
.in004-modern{font-family:var(--lesson-font-body,system-ui,sans-serif);color:#14213d;display:grid;gap:1.25rem;min-inline-size:0;max-inline-size:70rem;margin-inline:auto;container-type:inline-size}
.in004-modern p{font-size:var(--lesson-text-body-size,1.25rem);line-height:1.6;margin:0;max-inline-size:70ch}
.in004-modern__instruction{min-block-size:3.2em}
.in004-modern__viewport{overflow:auto;max-inline-size:100%;border:1px solid #7a879c;border-radius:1rem;overscroll-behavior-inline:contain;scroll-padding-inline:2rem}
.in004-modern__graph{position:relative;inline-size:70rem;block-size:16.875rem;background:#fffdf7}
.in004-modern__graph svg{position:absolute;inset:0;inline-size:100%;block-size:100%}
.in004-modern__tick{position:absolute;inset-block-start:8.75rem;translate:-50% 0;font-size:1.125rem;line-height:1.5;font-weight:700;white-space:nowrap;background:#fffdf7}
.in004-modern__card,.in004-modern__target,.in004-modern button{box-sizing:border-box;min-inline-size:44px;min-block-size:44px;border:2px solid #365071;border-radius:.5rem;background:#fff;color:#14213d;font:700 1.125rem/1.4 var(--lesson-font-body,system-ui,sans-serif);padding:.45rem .65rem}
.in004-modern__target,.in004-modern__example{position:absolute;translate:-50% -50%;inset-block-start:4.125rem}
.in004-modern .in004-modern__target{border-style:dashed;padding:.25rem}
.in004-modern .in004-modern__target[data-placed=true]{border-style:solid;background:#e7f3eb}
.in004-modern__example{display:grid;place-items:center;min-inline-size:44px;min-block-size:44px;border:2px solid #365071;border-radius:.5rem;background:white;font-size:1.125rem;font-weight:700}
.in004-modern__cards{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center}
.in004-modern button{cursor:pointer;touch-action:manipulation}
.in004-modern .in004-modern__term{display:inline;border:0;border-radius:0;background:transparent;color:#164eaa;font:inherit;text-decoration:underline;text-underline-offset:.15em;padding:.15rem .1rem;min-block-size:44px;vertical-align:baseline}
.in004-modern button:disabled{cursor:default}
.in004-modern button[aria-pressed=true]{outline:3px solid #155ac1;outline-offset:3px;background:#edf4ff}
.in004-modern button:focus,.in004-modern__viewport:focus-visible{outline:3px solid #155ac1;outline-offset:3px}
.in004-modern__feedback{border:2px solid #48647c;border-radius:.75rem;padding:1rem;display:grid;gap:.75rem;background:#f4f8fd}
.in004-modern__feedback--wrong{border-color:#a52c43;background:#fff2f3}
.in004-modern__feedback--correct{border-color:#22663d;background:#eef8f1}
.in004-modern fieldset{border:0;padding:0;margin:0;min-inline-size:0}
.in004-modern legend{font-size:1.125rem;font-weight:700;line-height:1.5;margin-block-end:.75rem}
.in004-modern__sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
/* Text enlargement must not itself switch to the smaller prose size. */
@container (max-width:640px){.in004-modern p{font-size:1.125rem}}
`;

function ModernSurface({runtime, interaction, interactionEnabled, controlsReady, dispatch, onCloseWrong, wrongCloseRef}: CourseG04L03In004ModernSurfaceProps) {
  const state = (runtime.state ?? getCourseG04L03In004FrameState(runtime.frame, runtime)) as SourceStaticCanvasFrameState;
  const snapshot = getG4L3In004TextSnapshot(state, {...runtime, frameDomain: runtime.frameDomain ?? DOMAIN}, interaction);
  const teaching = getG4L3In004TeachingState(state.frame);
  const viewportRef = useRef<HTMLDivElement>(null);
  const blocks = Object.fromEntries(snapshot.blocks.map(block => [block.id, block]));
  const locked = !controlsReady || interaction.mode !== 'ready';
  const instruction = (blocks.instruction?.text??'').split(/(position|number line)/g).map((part,index)=>{
    const target=glossaryTargets[part as keyof typeof glossaryTargets];
    return target && runtime.onLessonHostRequest ? <button key={index} className="in004-modern__term" type="button"
      data-keyterm-entry-id={target.entryId} data-source-button-id={target.sourceButtonId}
      onClick={event=>runtime.onLessonHostRequest?.({type:'open-keyterm',entryId:target.entryId,sourceAnimationId:ID,
        playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget})}>{part}</button> : part;
  });
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const graph = viewport.querySelector<HTMLElement>('.in004-modern__graph');
    let active = true, center = .5, appliedScroll: number | null = null;
    let width = viewport.clientWidth, total = viewport.scrollWidth;
    const apply = () => {
      if (!active) return;
      width = viewport.clientWidth; total = viewport.scrollWidth;
      viewport.scrollLeft = Math.max(0, Math.min(total - width, center * total - width / 2));
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && viewport.contains(focused) && focused.matches('button')) {
        const box = focused.getBoundingClientRect(), view = viewport.getBoundingClientRect();
        if (box.left < view.left + 8) viewport.scrollLeft -= view.left + 8 - box.left;
        else if (box.right > view.right - 8) viewport.scrollLeft += box.right - view.right + 8;
      }
      appliedScroll = viewport.scrollLeft;
    };
    // Keep the viewed mathematical coordinate through rem/viewport changes.
    // User scrolling updates the anchor; resizing itself must not overwrite it
    // using the old pixel offset and the new diagram width. Its queued scroll
    // event must not remember an intermediate clamp during a layout transition.
    const remember = () => {
      if (viewport.clientWidth === width && viewport.scrollWidth === total && total > 0 && viewport.scrollLeft !== appliedScroll) {
        center = (viewport.scrollLeft + width / 2) / total;
        appliedScroll = null;
      }
    };
    apply();
    viewport.addEventListener('scroll', remember, {passive:true});
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(apply);
    observer?.observe(viewport); if (graph) observer?.observe(graph);
    if (!observer) window.addEventListener('resize', apply);
    document.fonts?.addEventListener('loadingdone', apply);
    void document.fonts?.ready.then(() => {if (active) apply();});
    return () => {
      active = false; observer?.disconnect(); viewport.removeEventListener('scroll', remember);
      window.removeEventListener('resize', apply); document.fonts?.removeEventListener('loadingdone', apply);
    };
  }, [runtime.replay, teaching.graphVisible]);
  if (snapshot.status !== 'ready') return <p role="status">This lesson view is unavailable in the selected context.</p>;
  const drop = (event: React.DragEvent, targetId: CourseG04L03In004CardId) => {
    event.preventDefault();
    if (locked) return;
    const value = event.dataTransfer.getData('text/plain');
    const card = CARDS.find(card => card.id === value);
    if (card) dispatch({type: 'place-card', cardId: card.id, targetId});
  };
  return <section className="in004-modern" lang="en" data-modern-text-page={ID} data-lesson-text-status={snapshot.status}
    data-lesson-frame={state.frame} data-lesson-seed={state.seed} data-lesson-replay={runtime.replay ?? 0}>
    <style>{STYLES}</style>
    <p className="in004-modern__instruction" data-lesson-text-block="instruction">{instruction}</p>
    {(teaching.cardsVisible || interactionEnabled) && <fieldset disabled={locked}>
      {interactionEnabled && <legend>Number cards</legend>}
      <div className="in004-modern__cards">{CARDS.map(card => {
        const placed = interaction.placedCardIds.includes(card.id);
        return interactionEnabled ? <button key={card.id} type="button" data-in004-focus-control={`card-${card.id}`} data-lesson-text-block={`card-${card.id}`}
          disabled={locked || placed} aria-label={`Select ${card.accessibleLabel}${placed ? ', placed' : ''}`} aria-pressed={interaction.selectedCardId === card.id}
          draggable={!locked && !placed} onDragStart={event => {
            if (locked) {event.preventDefault(); return;}
            event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', card.id); dispatch({type: 'select-card', cardId: card.id});
          }} onClick={event => {event.currentTarget.focus(); dispatch({type: 'select-card', cardId: card.id});}}>{card.label}{placed ? ' ✓' : ''}</button>
          : <span className="in004-modern__card" key={card.id} data-lesson-text-block={`card-${card.id}`}>{card.label}</span>;
      })}</div>
    </fieldset>}
    {teaching.graphVisible && <div className="in004-modern__viewport" ref={viewportRef} role="region" aria-label="Number line, negative 10 to positive 10. Scroll to explore." tabIndex={0}
      aria-keyshortcuts="ArrowLeft ArrowRight Home End"
      onKeyDown={event => {
        if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
            !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const viewport = event.currentTarget;
        const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        if (maximum === 0) return;
        event.preventDefault();
        // WebKit does not scroll this focused region with native arrow keys.
        const step = Math.max(40, viewport.clientWidth / 5);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? maximum :
          viewport.scrollLeft + (event.key === 'ArrowRight' ? step : -step);
        viewport.scrollLeft = Math.max(0, Math.min(maximum, next));
      }}>
      <div className="in004-modern__graph">
        <svg viewBox="0 0 1120 270" aria-hidden="true" focusable="false">
          <line x1={55} y1={120} x2={1065} y2={120} stroke="#14213d" strokeWidth={3}/>
          <path d="M 65 113 L 55 120 L 65 127 M 1055 113 L 1065 120 L 1055 127" fill="none" stroke="#14213d" strokeWidth={3}/>
          {tickValues.map(value => <line key={value} x1={xFor(value)} x2={xFor(value)} y1={107} y2={133} stroke={value < 0 ? '#a52c43' : value > 0 ? '#164eaa' : '#14213d'} strokeWidth={value === 0 ? 3 : 2}/>)}
        </svg>
        {tickValues.map(value => <span key={value} className="in004-modern__tick" data-lesson-text-block={`tick-${value}`} style={{left: rem(xFor(value)), color: value < 0 ? '#a52c43' : value > 0 ? '#164eaa' : '#14213d'}}>{blocks[`tick-${value}`]?.text}</span>)}
        {teaching.demoVisible && <span className="in004-modern__example" data-lesson-text-block="example" data-example-placed={teaching.demoPlaced} style={{left: rem(teaching.demoX), top: rem(teaching.demoY)}}>−1</span>}
        {(interactionEnabled || (state.frame>=127 && interaction.placedCardIds.length>0)) && CARDS.map(card => {
          const placed = interaction.placedCardIds.includes(card.id);
          if (!interactionEnabled) return placed ? <span key={card.id} className="in004-modern__example" data-lesson-text-block={`card-${card.id}`} data-placed-source-target={card.id} style={{left:rem(xFor(card.numericValue))}}>{card.label}</span> : null;
          return <button key={card.id} className="in004-modern__target" type="button" style={{left: rem(xFor(card.numericValue))}}
            data-in004-focus-control={`target-${card.id}`} data-placed={placed}
            aria-label={placed ? `${card.accessibleLabel} placed` : `Position ${card.accessibleLabel} on the number line`}
            disabled={locked || interaction.selectedCardId === null || placed}
            onDragOver={event => {if (!locked) event.preventDefault();}} onDrop={event => drop(event, card.id)}
            onClick={() => dispatch({type: 'place-card', targetId: card.id})}>{placed ? <>{card.label}<span className="in004-modern__sr"> placed</span></> : <span aria-hidden="true"> </span>}</button>;
        })}
      </div>
    </div>}
    {blocks.wrong?.visible && <div className="in004-modern__feedback in004-modern__feedback--wrong" role="alertdialog" aria-label="Try again">
      <p data-lesson-text-block="wrong">{blocks.wrong.text}</p>
      <LessonSourceButton runtime={runtime} activityId="in004-close-down" disabled={!controlsReady} ref={wrongCloseRef} type="button" data-in004-focus-control="close-wrong" data-lesson-text-block="close" onClick={onCloseWrong}
        onKeyDown={event => {if (event.key === 'Escape') onCloseWrong();}}>Close</LessonSourceButton>
    </div>}
    <p className="in004-modern__sr" role="status" aria-atomic="true" data-in004-placement-status="true">{interactionEnabled ? getG4L3In004PlacementStatus(interaction) : ''}</p>
    {blocks.complete?.visible && <div className="in004-modern__feedback in004-modern__feedback--correct" role="status"><p data-lesson-text-block="complete">{blocks.complete.text}</p><p>Use Replay to practice again.</p></div>}
  </section>;
}

export const G4_L3_IN004_ACTIVITIES = [
  {id:'in004-close-down',sourceInstanceId:'root/animation_mc/animation/Pop1_mc/BtnClose/button-152/record-10',frameDomain:'sprite-151',startFrame:1,endFrame:5,fps:12,parentFrames:[126],parentLifetime:{firstFrame:126,lastFrameExclusive:127},buttonPress:{sourceButtonId:152},
    audio:{source:'/lesson-typography-v1/audio/course-g04-l03-in-004/close-down.mp3',sha256:'ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38',language:'shared' as const,spokenLanguage:'undetermined' as const,firstFrame:1,lastFrame:5,offsetSeconds:1673/22050}},
  {id:'in004-wrong-popup',sourceInstanceId:'root/animation_mc/animation/Pop1_mc',frameDomain:'sprite-155',startFrame:2,endFrame:15,fps:12,parentFrames:[126],parentLifetime:{firstFrame:126,lastFrameExclusive:127},
    audio:{source:'/lesson-typography-v1/audio/course-g04-l03-in-004/wrong-popup.mp3',sha256:'a3634114101cc46babbe7470bea683f3484c5bf31ce2813d7ca8d197ba9cbe04',language:'shared' as const,spokenLanguage:'undetermined' as const,firstFrame:1,lastFrame:15}},
  {id:'in004-correct-coach',sourceInstanceId:'root/animation_mc/animation/Coach_audio_2a',frameDomain:'sprite-55',startFrame:2,endFrame:20,fps:12,parentFrames:[126],parentLifetime:{firstFrame:126,lastFrameExclusive:127},
    audio:{source:'/lesson-typography-v1/audio/course-g04-l03-in-004/correct-coach.mp3',sha256:'8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7',language:'shared' as const,spokenLanguage:'undetermined' as const,firstFrame:2,lastFrame:20}},
  {id:'in004-complete-feedback',sourceInstanceId:'root/animation_mc/animation/Right_Feed',frameDomain:'sprite-159',startFrame:2,endFrame:25,fps:12,parentFrames:[126],parentLifetime:{firstFrame:126,lastFrameExclusive:127},
    audio:{source:'/lesson-typography-v1/audio/course-g04-l03-in-004/complete-feedback.mp3',sha256:'b2c63dbaf7304c2c1042dda5e0ee305284f5136c275d6bc8e3e1fcdb552c99a5',language:'shared' as const,spokenLanguage:'undetermined' as const,firstFrame:2,lastFrame:25}},
];

export function G4L3In004ModernRenderer(props: AnimationRendererProps) {
  const state = (props.state ?? getCourseG04L03In004FrameState(props.frame, props)) as SourceStaticCanvasFrameState;
  const [interaction,dispatch]=useReducer(reduceCourseG04L03In004NumberLineDrag,undefined,createCourseG04L03In004NumberLineDragState);
  const identity=`${props.replay??0}:${props.seed}:${props.lang}:${props.scenario}:${props.frameDomain}`;
  const root=useRef<HTMLDivElement>(null),wrongCloseRef=useRef<HTMLButtonElement>(null);
  const activeCoachRevision=useRef<number|null>(null),completedCoachRevision=useRef<number|null>(null);
  const attempted=useRef<CourseG04L03In004CardId|null>(null);
  const [focus,setFocus]=useState<string|null>(null);
  const snapshot=getG4L3In004TextSnapshot(state,{...props,frameDomain:props.frameDomain??DOMAIN},interaction);
  const interactionEnabled=props.frame===126&&!/^[a-f0-9]{64}$/.test(props.entryStateSha256??'')&&snapshot.status==='ready';
  const activities=props.lessonActivities??(props.lessonActivity?[props.lessonActivity]:[]);
  const coach=activities.find(activity=>activity.id==='in004-correct-coach');
  const final=activities.find(activity=>activity.id==='in004-complete-feedback');
  useEffect(()=>{dispatch({type:'replay'});activeCoachRevision.current=null;completedCoachRevision.current=null;attempted.current=null;setFocus(null);},[identity]);
  useLayoutEffect(()=>{if(!focus)return;const element=root.current?.querySelector<HTMLButtonElement>(`[data-in004-focus-control="${focus}"]`);if(element&&!element.disabled){element.focus();setFocus(null);}},[focus,interaction.mode]);
  useEffect(()=>{
    if(interaction.mode!=='correct-feedback'||!coach)return;
    if(activeCoachRevision.current===null)activeCoachRevision.current=coach.revision;
    if(coach.revision!==activeCoachRevision.current||coach.status!=='completed'||completedCoachRevision.current===coach.revision)return;
    const all=interaction.placedCardIds.length===5;
    if(all&&!props.onLessonActivityRequest?.({id:'in004-complete-feedback',parentFrame:126}))return;
    completedCoachRevision.current=coach.revision;dispatch({type:'feedback-complete'});
    const next=CARDS.find(card=>!interaction.placedCardIds.includes(card.id));if(next)setFocus(`card-${next.id}`);
  },[coach?.revision,coach?.status,interaction.mode,interaction.placedCardIds,props.onLessonActivityRequest]);
  useEffect(()=>{
    if(interaction.mode==='completed'&&final?.status==='completed'&&props.frame===126)
      props.onLessonFrameRequest?.({fromFrame:126,toFrame:127,stopFrame:169});
  },[interaction.mode,final?.status,props.frame,props.onLessonFrameRequest]);
  const dispatchInteraction=(action:CourseG04L03In004NumberLineDragAction)=>{
    if(!interactionEnabled||props.paused)return;
    const next=reduceCourseG04L03In004NumberLineDrag(interaction,action);
    if(next===interaction)return;
    if(action.type==='place-card'){
      const id=next.mode==='wrong-feedback'?'in004-wrong-popup':'in004-correct-coach';
      if(!props.onLessonActivityRequest?.({id,parentFrame:126}))return;
      attempted.current=action.cardId??interaction.selectedCardId;
      if(next.mode==='correct-feedback')activeCoachRevision.current=null;
      if(next.mode==='wrong-feedback')setFocus('close-wrong');
    }
    dispatch(action);
  };
  const close=()=>{if(props.paused)return;dispatch({type:'close-wrong-feedback'});if(attempted.current)setFocus(`card-${attempted.current}`);};
  return <div ref={root} data-in004-controller="shared-original-reducer" data-interaction-outcome={interaction.mode}
    data-in004-source-activities={JSON.stringify(activities)} data-current-js-controls-ready={interactionEnabled&&!props.paused?'true':'false'}>
    <ModernSurface runtime={props} interaction={interaction} interactionEnabled={interactionEnabled}
      controlsReady={interactionEnabled&&!props.paused} canvasStatus={snapshot.status==='ready'?'ready':'blocked'}
      dispatch={dispatchInteraction} onCloseWrong={close} wrongCloseRef={wrongCloseRef}/>
  </div>;
}

export const G4_L3_IN004_TEXT_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = Object.freeze({
  schemaVersion: 1, binding: G4_L3_IN004_TEXT_BINDING, Renderer: G4L3In004ModernRenderer, getSnapshot: getG4L3In004TextSnapshot,
  frameControl:{frameDomain:DOMAIN,completionFrame:169,transitions:[{fromFrame:126,toFrame:127,stopFrame:169}]},
  playbackEndFrameByDomain:{[DOMAIN]:126},
  activityTimelines:G4_L3_IN004_ACTIVITIES,
  reducedMotionFrameByDomain:{[DOMAIN]:126},
  keyTerms:G4_L3_IN004_KEY_TERMS,
  sourceTimelineAudioCues:[{id:'course-g04-l03-in-004-source-main',sourceCueId:'embedded-stream-0001',frame:7,endFrame:170,
    frameDomain:DOMAIN,language:'en' as const,scenario:'source-static-frame',source:'/flash-assets/courses/course-g04-l03-in-004/audio/embedded-stream-0001.mp3',
    sha256:'835575079de10f11e8a81293e09a3fc2f7a909ea83d6edd903e666d6e1eb92b2',spokenLanguage:'undetermined' as const}],
});
