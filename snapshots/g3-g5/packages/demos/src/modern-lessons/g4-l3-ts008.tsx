'use client';

import {G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES} from '../g4-l3-main-timeline-audio.generated';

import React, {useEffect, useLayoutEffect, useRef} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextActivitySnapshot, LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {CourseG04L03Ts008Renderer, getCourseG04L03Ts008FrameState, normalizeCourseG04L03Ts008Frame,
  type CourseG04L03Ts008ModernSurfaceProps} from '../modules/course-g04-l03-ts-008';
import {COURSE_G04_L03_TS_008_SOURCE} from '../timelines/course-g04-l03-ts-008';
import {COURSE_G04_L03_TS_008_CHOICES as CHOICES, COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS as STEPS,
  COURSE_G04_L03_TS_008_NEED_MORE_HELP as HELP,
  createCourseG04L03Ts008InteractionState, reduceCourseG04L03Ts008Interaction, type CourseG04L03Ts008InteractionAction, type CourseG04L03Ts008InteractionState} from '../timelines/course-g04-l03-ts-008-practice-question-interaction';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4_L3_TS008_SOURCE_CLOCK_DATA as SOURCE_CLOCK} from './g4-l3-ts008.source-clock-data';

const ID = 'course-g04-l03-ts-008';
const DOMAIN = 'sprite-350';
const VERSION = 'g04-l03-placement-036-modern-text-source-clock-v2';
export const G4_L3_TS008_FRAME_TRANSITIONS=SOURCE_CLOCK.transitions;
export const G4_L3_TS008_ACTIVITY_TIMELINES=Object.freeze(SOURCE_CLOCK.feedback.map(branch=>({id:branch.id,sourceInstanceId:branch.sourceInstanceId,parentLifetime:branch.parentLifetime,frameDomain:`sprite-${branch.sprite}`,startFrame:2,endFrame:branch.endFrame,fps:12,parentFrames:[770],audio:branch.audio})));
export function getG4L3Ts008FeedbackActivity(interaction:CourseG04L03Ts008InteractionState,activity?:LessonTextActivitySnapshot,revisionFloor=-1){
 const branch=SOURCE_CLOCK.feedback.find(branch=>branch.kind===interaction.feedback?.kind&&branch.branch===interaction.feedback?.branch);
 const bound=Boolean(branch&&activity&&activity.id===branch.id&&activity.frameDomain===`sprite-${branch.sprite}`&&activity.sourceInstanceId===branch.sourceInstanceId&&activity.revision>revisionFloor&&activity.frame>=2&&activity.frame<=branch.endFrame);
 return{branch,bound,visible:bound&&branch!.visibleFrames.some(([first,last])=>activity!.frame>=first&&activity!.frame<=last),complete:bound&&activity!.status==='completed'&&activity!.frame===branch!.endFrame};
}
export const G4_L3_TS008_KEY_TERMS = Object.freeze([
  {term:'Positive number',text:'positive numbers',entryId:'en-0499-e54dca5d8b22',characterId:166},
  {term:'Owe',text:'Owing',entryId:'en-0451-a7f0d0283926',characterId:167},
  {term:'Negative number',text:'negative numbers',entryId:'en-0411-1954bd66c84d',characterId:168},
]);
export const G4_L3_TS008_KEY_TERMS_CAPABILITY = Object.freeze({indexLanguage:'en' as const,sourceAssetId:'ELKTEG4.xml' as const,
  sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:Object.freeze(G4_L3_TS008_KEY_TERMS.map(term=>term.entryId))});
const textIds = (character: number, count = 1) => Array.from({length: count}, (_, run) => `character-${character}/run-${run}`);
const signed = (value: number) => value < 0 ? `−${-value}` : String(value);
const ticks = Array.from({length: 25}, (_, index) => index - 12);
const tickCharacter = (value: number) => value < 0 ? 128 + value : 103 + value;
const people = [CHOICES[2], CHOICES[1], CHOICES[0], CHOICES[3]];

/** Whole-word endpoints computed from font-3 glyph outlines and masks 39/46.
 * The source holds between phrases are preserved by the existing host frame. */
export const G4_L3_TS008_WORD_REVEALS = Object.freeze([
  {text: 'Toni', frame: 12}, {text: 'has', frame: 16}, {text: '$7.', frame: 19},
  {text: 'Elvin', frame: 37}, {text: 'has', frame: 41}, {text: '$3.', frame: 44},
  {text: 'Susan', frame: 63}, {text: 'owes', frame: 68}, {text: '$10.', frame: 87},
  {text: 'Ricky', frame: 90}, {text: 'owes', frame: 96}, {text: '$2.', frame: 99},
  {text: 'Who', frame: 114}, {text: 'has', frame: 117}, {text: 'the', frame: 119},
  {text: 'most', frame: 120}, {text: 'money?', frame: 123},
]);

export const G4_L3_TS008_TEXT_BINDING = Object.freeze({
  schemaVersion: 1, version: VERSION, placementId: 'g04-l03-placement-036', animationId: ID,
  sourceSwfSha256: COURSE_G04_L03_TS_008_SOURCE.swfSha256, template: 'exercise',
  blocks: [
    {id: 'question', sourceTextIds: [...textIds(41, 3), ...textIds(47)], role: 'question' as const, readingOrder: 0},
    ...[20, 16, 17, 18].map((character, index) => ({id: `step-${index + 1}`, sourceTextIds: [...textIds(character), ...(index === 0 ? textIds(19) : [])], role: 'heading' as const, readingOrder: [10,20,30,150][index]})),
    {id: 'step-1-question', sourceTextIds: textIds(51, 2), role: 'body' as const, readingOrder: 11},
    {id: 'given', sourceTextIds: textIds(92), role: 'body' as const, readingOrder: 21},
    ...[94, 95, 96, 97].map((character, index) => ({id: `given-${index}`, sourceTextIds: textIds(character), role: 'body' as const, readingOrder: 22 + index})),
    {id: 'needed', sourceTextIds: textIds(93, 2), role: 'body' as const, readingOrder: 26},
    {id: 'draw-strategy', sourceTextIds: textIds(99), role: 'body' as const, readingOrder: 31},
    {id: 'draw-instruction', sourceTextIds: textIds(100, 2), role: 'body' as const, readingOrder: 32},
    ...ticks.map((value, index) => ({id: `tick-${value}`, sourceTextIds: textIds(tickCharacter(value)), ...(value < 0 ? {sourceShapeIds: [128]} : {}), role: 'label' as const, readingOrder: 100 + index})),
    ...people.map((person, index) => ({id: `person-${person.id}`, sourceTextIds: [...textIds([132,131,130,129][index]), ...textIds(tickCharacter(person.signedValue))], ...(person.signedValue < 0 ? {sourceShapeIds: [128]} : {}), role: 'label' as const, readingOrder: 130 + index})),
    {id: 'draw-result', sourceTextIds: textIds(101), role: 'body' as const, readingOrder: 140},
    {id: 'draw-answer', sourceTextIds: textIds(133), role: 'body' as const, readingOrder: 141},
    {id: 'logic-strategy', sourceTextIds: textIds(144), role: 'body' as const, readingOrder: 151},
    {id: 'logic-definition', sourceTextIds: textIds(145, 2), role: 'body' as const, readingOrder: 152},
    ...[146,148,151,149].map((character, index) => ({id: `logic-${index}`, sourceTextIds: textIds(character), ...(index >= 2 ? {sourceShapeIds: [150]} : {}), role: 'body' as const, readingOrder: 153 + index})),
    {id: 'logic-result', sourceTextIds: textIds(147), role: 'body' as const, readingOrder: 157},
    {id: 'logic-answer', sourceTextIds: textIds(152), role: 'body' as const, readingOrder: 158},
    ...CHOICES.map((choice, index) => ({id: `choice-${choice.id}`, sourceTextIds: [...textIds([34,31,28,37][index]), ...textIds([35,32,29,38][index])], role: 'answer' as const, readingOrder: 200 + index})),
    {id: 'need-more-help', sourceTextIds: [...textIds(4), ...textIds(5)], role: 'answer' as const, readingOrder: 205},
    {id: 'feedback', sourceShapeIds: [180,181,188], sourceTextIds: [175,225,226,204,277,278,295,296,318,319,306,307].flatMap(character => textIds(character)), role: 'feedback' as const, readingOrder: 210},
    {id: 'terminal', sourceTextIds: [...textIds(101),...textIds(133)], role: 'feedback' as const, readingOrder: 211},
    {id: 'help-negative', sourceTextIds: textIds(164, 3), role: 'body' as const, readingOrder: 220},
    {id: 'help-positive', sourceTextIds: textIds(165, 2), role: 'body' as const, readingOrder: 221},
    ...ticks.filter(value => Math.abs(value) <= 10).map((value, index) => ({id: `help-tick-${value}`, sourceTextIds: textIds(tickCharacter(value)), ...(value < 0 ? {sourceShapeIds: [163]} : {}), role: 'label' as const, readingOrder: 230 + index})),
    {id: 'close', sourceTextIds: textIds(135), role: 'answer' as const, readingOrder: 260},
  ].map(block => ({...block, language: 'en', valueSource: 'maintained-page-state'})),
} satisfies LessonTextBinding);

export function getG4L3Ts008TeachingState(requestedFrame: number) {
  const frame = normalizeCourseG04L03Ts008Frame(requestedFrame, DOMAIN);
  return {frame, question: G4_L3_TS008_WORD_REVEALS.filter(word => frame >= word.frame).map(word => word.text).join(' '),
    stepsVisible: frame >= 2, choicesVisible: frame >= 9};
}

export function getG4L3Ts008TextSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext,
  interaction: CourseG04L03Ts008InteractionState = createCourseG04L03Ts008InteractionState(context.seed),activity?:LessonTextActivitySnapshot,revisionFloor=-1): TextPresentationSnapshot {
  const blockers: string[] = [];
  if (state.animationId !== ID || state.sourceSwfSha256 !== G4_L3_TS008_TEXT_BINDING.sourceSwfSha256) blockers.push('source-identity-mismatch');
  if (state.status !== 'ready') blockers.push(state.blocker ?? 'source-state-not-ready');
  if (state.frameDomain !== DOMAIN || (context.frameDomain ?? DOMAIN) !== DOMAIN) blockers.push('unsupported-frame-domain');
  if (state.scenario !== 'source-static-frame' || context.scenario !== state.scenario) blockers.push('unsupported-scenario');
  if (state.language !== 'en' || context.lang !== 'en') blockers.push('spanish-text-not-source-verified');
  if (state.frame !== normalizeCourseG04L03Ts008Frame(context.frame, DOMAIN) || state.rootFrame !== 6
    || (context.rootFrame !== undefined && context.rootFrame !== 6) || state.seed !== (context.seed >>> 0)) blockers.push('teaching-state-identity-mismatch');
  if (context.entryStateSha256) blockers.push('interactive-state-required-use-original-evidence-view');
  if(!Number.isInteger(context.frame)||context.frame<1||context.frame>789)blockers.push('source-frame-out-of-range');
  const teaching = getG4L3Ts008TeachingState(state.frame);
  const interactive = state.frame >= 328;
  const help = interactive && interaction.phase === 'need-more-help';
  const gate = interactive ? interaction.walkthroughGate : 0;
  const step1 = !help && state.frame >= 329;
  const step2 = !help && state.frame >= 466;
  const draw = !help && (state.frame >= 593 || (state.frame === 592 && gate === 2 && interaction.walkthroughBoxRevealed));
  const logic = !help && (state.frame >= 713 || (state.frame === 712 && gate === 3 && interaction.walkthroughBoxRevealed));
  const values: Record<string, {text: string; visible: boolean}> = {};
  const put = (id: string, text: string, visible: boolean) => {values[id] = {text, visible};};
  put('question', teaching.question, !!teaching.question && !help);
  for (let index = 0; index < 4; index++) put(`step-${index + 1}`, `${index + 1}.`, teaching.stepsVisible && !help);
  put('step-1-question', STEPS[0].visibleText[0], step1);
  put('given', STEPS[1].visibleText[0], step2);
  for (let index = 0; index < 4; index++) put(`given-${index}`, STEPS[1].visibleText[index + 1], step2);
  put('needed', STEPS[1].visibleText[5], step2);
  put('draw-strategy', STEPS[2].visibleText[0], draw);
  put('draw-instruction', STEPS[2].visibleText[1], draw);
  for (const value of ticks) put(`tick-${value}`, signed(value), draw);
  for (const person of people) put(`person-${person.id}`, `${person.person} ${signed(person.signedValue)}`, draw);
  put('draw-result', STEPS[2].visibleText[3], draw);
  put('draw-answer', STEPS[2].visibleText[4], draw);
  put('logic-strategy', STEPS[3].visibleText[0], logic);
  put('logic-definition', STEPS[3].visibleText[1], logic);
  for (let index = 0; index < 4; index++) put(`logic-${index}`, STEPS[3].visibleText[index + 2], logic);
  put('logic-result', STEPS[3].visibleText[6], logic);
  put('logic-answer', STEPS[3].visibleText[7], logic);
  for (const choice of CHOICES) put(`choice-${choice.id}`, `${choice.id}. ${choice.person}`, teaching.choicesVisible && !help && (state.frame < 785 || choice.id === 'D'));
  put('need-more-help', 'Need More Help', interactive && (interaction.phase === 'quiz' ||
    (interaction.phase === 'walkthrough' && gate !== null && gate >= 0 && gate < STEPS.length && interaction.walkthroughBoxRevealed)));
  put('feedback', interaction.feedback?.copy ?? '', state.frame === 770 && interaction.phase === 'feedback' && getG4L3Ts008FeedbackActivity(interaction,activity,revisionFloor).visible);
  put('terminal', `${STEPS[2].visibleText[3]} ${STEPS[2].visibleText[4]}`, state.frame === 789 && interaction.phase === 'terminal');
  put('help-negative', HELP.text[0], help);
  put('help-positive', HELP.text[1], help);
  for (const value of ticks.filter(value => Math.abs(value) <= 10)) put(`help-tick-${value}`, signed(value), help);
  put('close', 'Close', help || (state.frame === 592 && gate === 2 && interaction.walkthroughBoxRevealed) || (state.frame === 712 && gate === 3 && interaction.walkthroughBoxRevealed));
  return {schemaVersion: 1, animationId: ID, bindingVersion: VERSION, sourceSwfSha256: G4_L3_TS008_TEXT_BINDING.sourceSwfSha256,
    status: blockers.length ? 'blocked' : 'ready', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame, scenario: state.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
    suppressedInstances: [], blocks: blockers.length ? [] : G4_L3_TS008_TEXT_BINDING.blocks.map(binding => ({id: binding.id, ...values[binding.id], role: binding.role, language: binding.language, readingOrder: binding.readingOrder})),
  };
}

const CSS = `
.lesson-shell2:has(.ts008-modern) .lesson-shell2__side-panel--tool:has([data-lesson-key-terms-presentation='source-lesson']) > header{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:.25rem;padding:.25rem}
.lesson-shell2:has(.ts008-modern) .lesson-shell2__side-panel--tool:has([data-lesson-key-terms-presentation='source-lesson']) > header > div{min-inline-size:0}
.lesson-shell2:has(.ts008-modern) .lesson-shell2__side-panel--tool:has([data-lesson-key-terms-presentation='source-lesson']) > header h2{font-size:1rem;line-height:1.25;overflow-wrap:anywhere}
.lesson-shell2:has(.ts008-modern) .lesson-shell2__side-panel--tool:has([data-lesson-key-terms-presentation='source-lesson']) > header button{flex-shrink:0}
.lesson-shell2:has(.ts008-modern) .lesson-shell2__side-panel--tool:has([data-lesson-key-terms-presentation='source-lesson']) .lesson-shell2__tool-content{padding:.25rem}
.lesson-shell2:has(.ts008-modern) .lesson-shell2__side-panel--tool:has([data-lesson-key-terms-presentation='source-lesson']) [data-lesson-key-terms-presentation='source-lesson']{min-inline-size:0;grid-template-columns:minmax(0,1fr);padding:.25rem}
.lesson-shell2:has(.ts008-modern) .lesson-shell2__side-panel--tool:has([data-lesson-key-terms-presentation='source-lesson']) .lesson-shell2__key-term-definition{min-inline-size:0;grid-template-columns:minmax(0,1fr)}
.lesson-shell2:has(.ts008-modern) .lesson-shell2__side-panel--tool:has([data-lesson-key-terms-presentation='source-lesson']) .lesson-shell2__key-term-bilingual section{padding:.25rem}
.lesson-shell2:has(.ts008-modern) .lesson-shell2__side-panel--tool:has([data-lesson-key-terms-presentation='source-lesson']) .lesson-shell2__key-term-definition-actions{flex-wrap:wrap;gap:.25rem}
.lesson-shell2:has(.ts008-modern) .lesson-shell2__side-panel--tool:has([data-lesson-key-terms-presentation='source-lesson']) .lesson-shell2__key-term-definition-actions button{flex:0 0 auto;white-space:nowrap}
@media (max-width:760px){.lesson-shell2:has(.ts008-modern) .lesson-shell2__learning-nav[data-lesson-platform-header='true']{background:var(--lesson-platform-bg)}}
.ts008-modern{font-family:var(--lesson-font-body,system-ui,sans-serif);color:#14213d;min-inline-size:0;max-inline-size:70rem;margin-inline:auto;container-type:inline-size}
.ts008-modern__content,.ts008-modern__step,.ts008-modern__feedback,.ts008-modern__dialog{display:grid;gap:1rem;min-inline-size:0}
.ts008-modern p,.ts008-modern li{font-size:1.25rem;line-height:1.6;margin:0;max-inline-size:70ch;overflow-wrap:break-word}
.ts008-modern ul{margin:0;padding-inline-start:1.5rem;display:grid;gap:.4rem}
.ts008-modern h3{font-family:var(--lesson-font-display,var(--lesson-font-body,system-ui));font-size:1.5rem;line-height:1.4;margin:0}
.ts008-modern__content[hidden]{display:none}
.ts008-modern__question{min-block-size:3.2em}
.ts008-modern__steps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
.ts008-modern__step{align-content:start;border:1px solid #8793a5;border-radius:.85rem;padding:1rem;background:#fffdf7}
.ts008-modern__step[data-current=true]{border:2px solid #155ac1;background:#f4f8ff}
.ts008-modern__step[data-expanded=true]{grid-column:1 / -1}
.ts008-modern__actions,.ts008-modern__choices{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center}
.ts008-modern button{box-sizing:border-box;min-inline-size:44px;min-block-size:44px;border:2px solid #365071;border-radius:.55rem;background:white;color:#14213d;font:700 1.125rem/1.4 var(--lesson-font-body,system-ui);padding:.6rem .9rem;cursor:pointer;touch-action:manipulation}
.ts008-modern button:disabled{cursor:default}
.ts008-modern .ts008-keyterm{font:inherit;padding:.15rem .05rem;border:0;background:transparent;color:#164eaa;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.15em}
.ts008-modern button:focus-visible,.ts008-modern [tabindex]:focus-visible{outline:3px solid #155ac1;outline-offset:3px}
.ts008-modern__choices button{flex:1 1 9rem;text-align:start}
.ts008-modern__feedback,.ts008-modern__dialog{border:2px solid #365071;border-radius:1rem;padding:1.25rem;background:#f4f8ff}
.ts008-modern__dialog{grid-template-columns:minmax(0,1fr);padding:clamp(.5rem,3cqi,1.25rem);scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + env(safe-area-inset-top) + 1rem)}
.ts008-modern__actions>button{max-inline-size:100%;overflow-wrap:anywhere}
.ts008-modern__feedback[data-kind=wrong]{border-color:#9e3044;background:#fff3f5}
.ts008-modern__feedback[data-kind=right]{border-color:#286044;background:#eef8f1}
.ts008-modern__number-viewport{overflow:auto;max-inline-size:100%;border:1px solid #8793a5;border-radius:.75rem;overscroll-behavior-inline:contain}
.ts008-modern__number-line{position:relative;inline-size:78rem;block-size:11rem;background:#fffdf7}
.ts008-modern__number-line svg{position:absolute;inset:0;inline-size:100%;block-size:100%}
.ts008-modern__tick,.ts008-modern__person{position:absolute;translate:-50% 0;font-size:1.125rem;line-height:1.4;font-weight:700;white-space:nowrap}
.ts008-modern__tick{inset-block-start:7rem}.ts008-modern__person{inset-block-start:2rem}
.ts008-modern .ts008-modern__people{display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;list-style:none;padding:0!important}
.ts008-modern__sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@container (max-width:40rem){.ts008-modern__steps{grid-template-columns:minmax(0,1fr)}.ts008-modern p,.ts008-modern li{font-size:1.125rem}.ts008-modern__step{padding:.85rem}}
`;

function NumberLine({help = false}: {readonly help?: boolean}) {
  const viewport = useRef<HTMLDivElement>(null);
  const values = help ? ticks.filter(value => Math.abs(value) <= 10) : ticks;
  const x = (value: number) => 624 + value * 48;
  useLayoutEffect(() => {
    const element = viewport.current;
    if (element) element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
  }, [help]);
  return <>
    <div ref={viewport} className="ts008-modern__number-viewport" role="region" tabIndex={0} aria-label={`Number line from negative ${help ? 10 : 12} to positive ${help ? 10 : 12}. Scroll to explore.`}
      aria-keyshortcuts="ArrowLeft ArrowRight Home End"
      onKeyDown={event => {
        if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
            !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const element = event.currentTarget;
        const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
        if (maximum === 0) return;
        event.preventDefault();
        const step = Math.max(40, element.clientWidth / 5);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? maximum :
          element.scrollLeft + (event.key === 'ArrowRight' ? step : -step);
        element.scrollLeft = Math.max(0, Math.min(maximum, next));
      }}>
      <div className="ts008-modern__number-line" aria-hidden="true">
        <svg viewBox="0 0 1248 176" focusable="false">
          <path d={`M ${x(values[0]) - 24} 96 H ${x(values.at(-1)!) + 24}`} stroke="#14213d" strokeWidth="3"/>
          <path d={`M ${x(values[0]) - 14} 89 L ${x(values[0]) - 24} 96 L ${x(values[0]) - 14} 103 M ${x(values.at(-1)!) + 14} 89 L ${x(values.at(-1)!) + 24} 96 L ${x(values.at(-1)!) + 14} 103`} fill="none" stroke="#14213d" strokeWidth="3"/>
          {values.map(value => <line key={value} x1={x(value)} x2={x(value)} y1={86} y2={106} stroke="#14213d" strokeWidth={value === 0 ? 3 : 2}/>)}
          {!help && people.map(person => <g key={person.id}><line x1={x(person.signedValue)} x2={x(person.signedValue)} y1={61} y2={92} stroke="#365071" strokeWidth="2"/><circle cx={x(person.signedValue)} cy={96} r={5} fill="#155ac1"/></g>)}
        </svg>
        {values.map(value => <span key={value} className="ts008-modern__tick" data-lesson-text-block={`${help ? 'help-' : ''}tick-${value}`} style={{left: `${x(value) / 16}rem`}}>{signed(value)}</span>)}
        {!help && people.map(person => <span key={person.id} className="ts008-modern__person" style={{left: `${x(person.signedValue) / 16}rem`}}>{person.person}</span>)}
      </div>
    </div>
    <p className="ts008-modern__sr">{values.map(signed).join(', ')}.</p>
    {!help && <ul className="ts008-modern__people" aria-label="Each person's position on the number line">{people.map(person => <li key={person.id} data-lesson-text-block={`person-${person.id}`}>{person.person} {signed(person.signedValue)}</li>)}</ul>}
  </>;
}

function ModernSurface({runtime, interaction, interactionEnabled, controlsReady, dispatch: originalDispatch, paused, reducedMotion,
  feedbackRemainingMs, onCloseNeedMoreHelp, onFinishFeedback, onReplay, onFocusControl}: CourseG04L03Ts008ModernSurfaceProps) {
  const state = (runtime.state ?? getCourseG04L03Ts008FrameState(runtime.frame, runtime)) as SourceStaticCanvasFrameState;
  const activity=(runtime.lessonActivities??(runtime.lessonActivity?[runtime.lessonActivity]:[])).find(activity=>activity.id===`${interaction.feedback?.kind}-${interaction.feedback?.branch}`);
  const admission=useRef<{id:string;revisionFloor:number}|null>(null),consumed=useRef<string|null>(null),surface=useRef<HTMLElement>(null);
  const feedback=getG4L3Ts008FeedbackActivity(interaction,activity,admission.current?.revisionFloor??-1);
  const snapshot = getG4L3Ts008TextSnapshot(state, {...runtime, frameDomain: runtime.frameDomain ?? DOMAIN}, interaction,activity,admission.current?.revisionFloor??-1);
  const blocks = Object.fromEntries(snapshot.blocks.map(block => [block.id, block]));
  const sourceHeld = [328,465,592,712,770,789].includes(state.frame) && state.frame === interaction.frame;
  const locked = !controlsReady || paused || !sourceHeld;
  useLayoutEffect(() => {
    if (!sourceHeld || paused) return;
    const helpDialog = interaction.focusTarget === 'need-more-help-close'
      ? surface.current?.querySelector<HTMLElement>('.ts008-modern__dialog') : null;
    const target = helpDialog ?? surface.current?.querySelector<HTMLElement>(`[data-ts008-focus-control="${interaction.focusTarget}"]`);
    target?.focus({preventScroll: Boolean(helpDialog)});
    helpDialog?.scrollIntoView({block: 'start', behavior: 'instant'});
  }, [sourceHeld, paused, interaction.focusTarget]);
  useLayoutEffect(() => {
    if (!sourceHeld || interaction.focusTarget !== 'need-more-help-close') return;
    const root = surface.current;
    const dialog = root?.querySelector<HTMLElement>('.ts008-modern__dialog');
    if (!root || !dialog) return;
    let frame = 0;
    const keepFocusedDialogVisible = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (document.activeElement !== dialog) return;
        const header = root.closest('.lesson-shell2')?.querySelector<HTMLElement>(
          '.lesson-shell2__learning-nav',
        );
        const top = dialog.getBoundingClientRect().top;
        if (top < (header?.getBoundingClientRect().bottom ?? 0) ||
            top > window.innerHeight - 80) {
          dialog.scrollIntoView({block: 'start', behavior: 'instant'});
        }
      });
    };
    const observer = new ResizeObserver(keepFocusedDialogVisible);
    observer.observe(root);
    observer.observe(dialog);
    window.addEventListener('resize', keepFocusedDialogVisible);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', keepFocusedDialogVisible);
      cancelAnimationFrame(frame);
    };
  }, [sourceHeld, interaction.focusTarget]);
  const dispatch=(action:CourseG04L03Ts008InteractionAction)=>{
    if(locked)return false;
    const next=reduceCourseG04L03Ts008Interaction(interaction,action);if(next===interaction)return false;
    if(action.type==='continue-walkthrough'||action.type==='close-walkthrough-box'){const edge=G4_L3_TS008_FRAME_TRANSITIONS.find(edge=>edge.fromFrame===state.frame);if(!edge||runtime.onLessonFrameRequest?.(edge)!==true)return false;}
    if(action.type==='choose'&&next.feedback){const branch=SOURCE_CLOCK.feedback.find(branch=>branch.kind===next.feedback!.kind&&branch.branch===next.feedback!.branch)!;const current=(runtime.lessonActivities??(runtime.lessonActivity?[runtime.lessonActivity]:[])).find(activity=>activity.sourceInstanceId===branch.sourceInstanceId);if(runtime.onLessonActivityRequest?.({id:branch.id,parentFrame:state.frame})!==true)return false;admission.current={id:branch.id,revisionFloor:current?.revision??-1};}
    originalDispatch(action);return true;
  };
  useEffect(()=>{
    if(paused||!feedback.complete||!activity||!interaction.feedback||state.frame!==770)return;
    const token=`${runtime.seed}:${runtime.replay??0}:${activity.id}:${activity.revision}`;if(consumed.current===token)return;
    const next=reduceCourseG04L03Ts008Interaction(interaction,{type:'feedback-complete'});
    if(next.phase==='terminal'&&runtime.onLessonFrameRequest?.(G4_L3_TS008_FRAME_TRANSITIONS[4])!==true)return;
    originalDispatch({type:'feedback-complete'});consumed.current=token;
  },[paused,feedback.complete,activity,interaction,state.frame,runtime.seed,runtime.replay,runtime.onLessonFrameRequest,originalDispatch]);
  const help = interactionEnabled && interaction.phase === 'need-more-help';
  const current = interactionEnabled && interaction.phase === 'walkthrough' ? interaction.walkthroughGate : null;
  useEffect(() => {
    if (interactionEnabled && interaction.phase === 'terminal' && state.frame === 789) runtime.onLessonCompletionRequest?.({
      id:'g4-l3-ts008-terminal',frameDomain:DOMAIN,frame:state.frame,seed:state.seed,replay:runtime.replay??0,
    });
  }, [interactionEnabled, interaction.phase, runtime.onLessonCompletionRequest, runtime.replay, state.frame, state.seed]);
  const keyTerm = (term: typeof G4_L3_TS008_KEY_TERMS[number]) => <button type="button" className="ts008-keyterm" disabled={!runtime.onLessonHostRequest}
    data-source-keyterm={term.term} data-source-button={term.characterId} data-ts008-focus-control={`keyterm-${term.term.toLowerCase().replaceAll(' ','-')}`}
    onClick={event=>runtime.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:ID,
      playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'})}>{term.text}</button>;
  const paragraph = (id: string) => blocks[id]?.visible ? <p key={id} data-lesson-text-block={id}>
    {id==='help-negative'?<>{keyTerm(G4_L3_TS008_KEY_TERMS[1])} money means {keyTerm(G4_L3_TS008_KEY_TERMS[2])}</>
      :id==='help-positive'?<>Having money means {keyTerm(G4_L3_TS008_KEY_TERMS[0])}</>:blocks[id].text}
  </p> : null;
  if (snapshot.status !== 'ready') return <p role="status">This lesson view is unavailable in the selected context.</p>;
  const helpButton = <button type="button" disabled={locked} data-ts008-focus-control="need-more-help" data-lesson-text-block="need-more-help" onClick={() => dispatch({type: 'open-need-more-help'})}>{blocks['need-more-help'].text}</button>;
  return <section ref={surface} className="ts008-modern" lang="en" data-modern-text-page={ID} data-lesson-text-status={snapshot.status}
    data-lesson-frame={state.frame} data-lesson-seed={state.seed} data-lesson-replay={runtime.replay ?? 0}
    data-feedback-remaining-ms={feedbackRemainingMs ?? ''} data-source-clock='main-and-placed-feedback' data-source-held={sourceHeld?'true':'false'} data-feedback-activity-id={activity?.id??''} data-feedback-activity-frame={activity?.frame??''}
    onFocusCapture={event => onFocusControl((event.target as HTMLElement).dataset.ts008FocusControl ?? null)}>
    <style>{CSS}</style>
    <div className="ts008-modern__content" hidden={help}>
      <div className="ts008-modern__question">{paragraph('question')}</div>
      {blocks['step-1']?.visible && <div className="ts008-modern__steps">
        {STEPS.map((step, index) => <article key={step.id} className="ts008-modern__step" aria-label={`Step ${step.id}`} data-current={current === index} data-expanded={current === index && interaction.walkthroughBoxRevealed}>
          <h3 data-lesson-text-block={`step-${step.id}`} aria-label={`Step ${step.id}`}>{step.id}.</h3>
          {index === 0 && paragraph('step-1-question')}
          {index === 1 && <>{paragraph('given')}{blocks['given-0']?.visible && <ul>{[0,1,2,3].map(n => <li key={n} data-lesson-text-block={`given-${n}`}>{blocks[`given-${n}`].text}</li>)}</ul>}{paragraph('needed')}</>}
          {index === 2 && <>{paragraph('draw-strategy')}{paragraph('draw-instruction')}{blocks['tick-0']?.visible && <NumberLine/>}{paragraph('draw-result')}{paragraph('draw-answer')}</>}
          {index === 3 && <>{paragraph('logic-strategy')}{paragraph('logic-definition')}{blocks['logic-0']?.visible && <ul>{[0,1,2,3].map(n => <li key={n} data-lesson-text-block={`logic-${n}`}>{blocks[`logic-${n}`].text}</li>)}</ul>}{paragraph('logic-result')}{paragraph('logic-answer')}</>}
          {current === index && <div className="ts008-modern__actions">{interaction.walkthroughBoxRevealed ? <>
            <button type="button" disabled={locked} data-ts008-focus-control={`walkthrough-box-${step.id}-close`} data-lesson-text-block="close" onClick={() => dispatch({type: 'close-walkthrough-box'})}>Close</button>{helpButton}
          </> : <button type="button" disabled={locked} data-ts008-focus-control={`walkthrough-step-${step.id}`}
            onClick={() => dispatch({type: step.revealThenClose ? 'reveal-walkthrough-box' : 'continue-walkthrough'})}>Reveal step {step.id}</button>}</div>}
        </article>)}
      </div>}
      {blocks['choice-D']?.visible && <div className="ts008-modern__choices" role="group" aria-label="Answer choices">{CHOICES.filter(choice => blocks[`choice-${choice.id}`]?.visible).map(choice =>
        <button key={choice.id} type="button" disabled={locked || interaction.phase !== 'quiz'} data-ts008-focus-control={`choice-${choice.id}`}
          data-lesson-text-block={`choice-${choice.id}`} onClick={() => dispatch({type: 'choose', choiceId: choice.id})}>{blocks[`choice-${choice.id}`].text}</button>)}</div>}
      {interactionEnabled && interaction.phase === 'quiz' && <div className="ts008-modern__actions">{helpButton}</div>}
      {interaction.phase==='feedback' && state.frame===770 && <div className="ts008-modern__feedback" data-kind={interaction.feedback?.kind}
        data-feedback-branch={`${interaction.feedback?.kind}${interaction.feedback?.branch}`} role="status" aria-live="assertive" aria-atomic="true" tabIndex={-1} data-ts008-focus-control="feedback-status">
        {paragraph('feedback')}{paused && <p>Paused</p>}

      </div>}
      {blocks.terminal?.visible && <div className="ts008-modern__feedback" data-kind="complete" role="status" aria-live="polite" tabIndex={-1} data-ts008-focus-control="terminal">
        {paragraph('terminal')}<button type="button" disabled={locked} onClick={onReplay}>Replay</button>
      </div>}
    </div>
    {help && <div className="ts008-modern__dialog" role="dialog" tabIndex={-1} aria-label="Need More Help" aria-modal="true" onKeyDown={event => {
      if (event.key === 'Escape' && !locked) {event.preventDefault();dispatch({type:'close-need-more-help'});}
      if (event.key === 'Tab') {
        const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')).filter(element => element.offsetParent !== null);
        const index = elements.indexOf(document.activeElement as HTMLElement);
        if (!elements.length) {event.preventDefault(); return;}
        if ((event.shiftKey && index <= 0) || (!event.shiftKey && index === elements.length - 1)) {event.preventDefault(); elements[event.shiftKey ? elements.length - 1 : 0].focus();}
      }
    }}>
      <h3>Need More Help</h3>{paragraph('help-negative')}{paragraph('help-positive')}<NumberLine help/>
      <button type="button" disabled={locked} data-ts008-focus-control="need-more-help-close" data-lesson-text-block="close" onClick={()=>dispatch({type:'close-need-more-help'})}>Close</button>
    </div>}
  </section>;
}

export function G4L3Ts008ModernRenderer(props: AnimationRendererProps) {
  const state = (props.state ?? getCourseG04L03Ts008FrameState(props.frame, props)) as SourceStaticCanvasFrameState;
  const snapshot = getG4L3Ts008TextSnapshot(state, {...props, frameDomain: props.frameDomain ?? DOMAIN});
  return <CourseG04L03Ts008Renderer {...props} state={state} modernSurface={ModernSurface} modernSourceReady={snapshot.status === 'ready'}/>;
}

export const G4_L3_TS008_SOURCE_AUDIO_CUES=Object.freeze(G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES['course-g04-l03-ts-008'].audioCues.map(cue=>{
  if(!cue.sha256)throw new Error('Source main audio cue lacks its original hash');
  return Object.freeze({...cue,sha256:cue.sha256});
}));

export const G4_L3_TS008_TEXT_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = Object.freeze({
  schemaVersion: 1, binding: G4_L3_TS008_TEXT_BINDING, Renderer: G4L3Ts008ModernRenderer, getSnapshot: getG4L3Ts008TextSnapshot,
  playbackEndFrameByDomain: Object.freeze({'sprite-350': 328}),
  sourceTimelineAudioCues:G4_L3_TS008_SOURCE_AUDIO_CUES,
  reducedMotionFrameByDomain:{'sprite-350':328},
  keyTerms:G4_L3_TS008_KEY_TERMS_CAPABILITY,
  completion:{id:'g4-l3-ts008-terminal',frameDomain:DOMAIN,frames:[789]},
  frameControl:{frameDomain:DOMAIN,completionFrame:789,transitions:G4_L3_TS008_FRAME_TRANSITIONS},
  activityTimelines:G4_L3_TS008_ACTIVITY_TIMELINES,
});
