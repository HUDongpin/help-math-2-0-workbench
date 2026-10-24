'use client';

import React, {useState, type CSSProperties} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextPresentationCapability, LessonTextKeyTermsCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {LessonTextPresentation} from '../lesson-text-presentation';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import {isCompleteTraceCaptureIdentity, type SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import sourceModule from '../modules/course-g04-l05-in-012';
import {COURSE_G04_L05_IN_012_SOURCE} from '../timelines/course-g04-l05-in-012';
import {ASSIGNED_SOURCE_MAIN_AUDIO} from './generated/assigned-main-audio-v1';

const ID = 'course-g04-l05-in-012';
const DOMAIN = 'sprite-110';
export const IN012_SOURCE_KEY_TERMS = Object.freeze([
  {sourceButtonId: 8, sourceKey: 'Product', entryId: 'en-0515-f550a5d025a5'},
  {sourceButtonId: 9, sourceKey: 'Number', entryId: 'en-0423-3bcf1a5c2467'},
  {sourceButtonId: 10, sourceKey: 'Multiplication', entryId: 'en-0398-9e9e50574551'},
  {sourceButtonId: 11, sourceKey: 'Problem', entryId: 'en-0513-fdeed4fcabb5'},
] as const);
export const IN012_KEY_TERMS = Object.freeze({indexLanguage: 'en', sourceAssetId: 'ELKTEG4.xml',
  sourceSha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  entryIds: Object.freeze(IN012_SOURCE_KEY_TERMS.map(target => target.entryId)),
} satisfies LessonTextKeyTermsCapability);
export const IN012_INTERACTION_FRAME = 269;
// Complete words pulse together in sprite110; no instruction letter is removed.
export const IN012_SOURCE_EMPHASIS = Object.freeze([
  {sourceKey: 'Product', frames: Object.freeze([96, 98, 100])},
  {sourceKey: 'Number', frames: Object.freeze([111, 113, 115])},
  {sourceKey: 'Multiplication', frames: Object.freeze([123, 125, 127, 129, 131, 133, 135])},
  {sourceKey: 'Problem', frames: Object.freeze([123, 125, 127, 129, 131, 133, 135])},
] as const);
export type In012CaseId = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5';
export const IN012_CASES = Object.freeze([
  {id: 'Q1', a: 15, b: 11, result: 165, frame: 269, sprite: 64, equation: 40, expanded: 41, distributed: 42, answer: 43},
  {id: 'Q2', a: 13, b: 21, result: 273, frame: 270, sprite: 82, equation: 69, expanded: 70, distributed: 71, answer: 72},
  {id: 'Q3', a: 7, b: 19, result: 133, frame: 271, sprite: 93, equation: 84, expanded: 85, distributed: 86, answer: 87},
  {id: 'Q4', a: 25, b: 17, result: 425, frame: 272, sprite: 102, equation: 99, expanded: 100, distributed: 101, answer: 95},
  {id: 'Q5', a: 10, b: 20, result: 200, frame: 273, sprite: 109, equation: 106, expanded: 107, distributed: 108, answer: 104},
] as const);
const EMPTY_CASE = Object.freeze({id: 'intro-zero', a: 0, b: 0, result: 0, frame: 1,
  sprite: null, equation: 14, expanded: 15, distributed: 16, answer: 17} as const);
type In012Case = typeof IN012_CASES[number] | typeof EMPTY_CASE;
const ALL_CASES = Object.freeze([EMPTY_CASE, ...IN012_CASES]);
const CASE_IDS = Object.freeze(IN012_CASES.map(example => example.id));
const text = (id: number) => `character-${id}`;
const DIGIT_SOURCE_IDS = Object.freeze([17, 19, 20, 21, 22, 23, 45, 46, 47, 48, 49,
  50, 51, 52, 53, 74, 75, 76, 77, 78, 79, 80, 81, 89, 90, 91, 92, 97, 98].map(text));
const LATTICE_LABEL_IDS = Object.freeze(['factor-b-tens', 'factor-b-units', 'factor-a-tens', 'factor-a-units',
  'result-hundreds', 'result-tens', 'result-units',
  ...Array.from({length: 4}, (_, cell) => [`cell-${cell}-tens`, `cell-${cell}-units`]).flat()]);

export const binding: LessonTextBinding = Object.freeze({schemaVersion: 1,
  version: 'g04-l05-placement-029-modern-text-v2', placementId: 'g04-l05-placement-029',
  animationId: ID, sourceSwfSha256: COURSE_G04_L05_IN_012_SOURCE.swfSha256, template: 'complex-figure',
  blocks: Object.freeze([
    {id: 'root-title', sourceTextIds: [text(2)], role: 'title', language: 'en', readingOrder: 0, valueSource: 'source-static'},
    {id: 'instruction', sourceTextIds: [6, 32, 33, 34, 35, 36, 37, 38, 54, 55, 56, 57, 58, 59, 60, 61, 62].map(text),
      role: 'question', language: 'en', readingOrder: 1, valueSource: 'source-static'},
    {id: 'problem', sourceTextIds: ALL_CASES.map(example => text(example.equation)), role: 'question', language: 'en', readingOrder: 10, valueSource: 'maintained-page-state'},
    {id: 'expanded', sourceTextIds: ALL_CASES.map(example => text(example.expanded)), role: 'body', language: 'en', readingOrder: 11, valueSource: 'maintained-page-state'},
    {id: 'partial-products', sourceTextIds: ALL_CASES.map(example => text(example.distributed)), role: 'body', language: 'en', readingOrder: 12, valueSource: 'maintained-page-state'},
    {id: 'product', sourceTextIds: ALL_CASES.map(example => text(example.answer)), role: 'answer', language: 'en', readingOrder: 13, valueSource: 'maintained-page-state'},
    ...LATTICE_LABEL_IDS.map((id, index) => ({id, sourceTextIds: DIGIT_SOURCE_IDS,
      role: 'label' as const, language: 'en' as const, readingOrder: 20 + index, valueSource: 'maintained-page-state' as const})),
    {id: 'new-product', sourceTextIds: [text(25)], role: 'label', language: 'en', readingOrder: 50, valueSource: 'source-static'},
  ] as const),
});

export const IN012_SOURCE_EVIDENCE = Object.freeze({
  sourceSwfSha256: COURSE_G04_L05_IN_012_SOURCE.swfSha256,
  sourceCatalogContentSha256: 'a07bf7caeb30626639d7fb5db5012776c7814e8cddf8707615b486685f00e149',
  sourceTitle: 'Multiplication: Learn It',
  titleWrapping: 'Shared title size is retained; one optional soft hyphen at Multipli|cation is display-only, with the exact source title as its accessible name.',
  sourceTitlePlacement: 'root frame6 Mc_Page_Title(sprite3) / sprite3 frame1 character2',
  sourceInstructionFirstVisibleFrame: 2,
  sourceExampleFirstFrame: 97,
  sourceInteractionFrame: 269,
  sourceInstruction: 'Click New Product to change the numbers in the multiplication problem.',
  frame269Action: 'DefineSprite_110/frame_269/DoAction.as: stop, five-case pool, random index, gotoAndStop(Question), splice drawn case, show selected movie clip',
  newProductAction: 'DefineButton2_67: on(release) calls doGetRndQuestion()',
  sampling: 'Source five-case no-replacement pool with refill; deterministic Current-JS Mulberry32, not a claim of Flash random-sequence parity',
  typography: 'Exact first visibility and mathematical state are retained. The instruction remains full-size and full-contrast; source whole-word pulse frames use native emphasis without duplicate letter layers.',
  graphicalInterpretation: 'The source 30x30 area grid and 2x2 lattice are maintained vector geometry. Colors map tens×tens, units×tens, tens×units and units×units; no mathematical example or answer is added.',
  sourceHostTerms: Object.freeze(['Product', 'Number', 'Multiplication', 'Problem']),
  hostTermsDisposition: 'Native typed keyterm requests retain the source stop-until-explicit-resume intent; exact My Lesson bridge regression is separate.',
  sourceReportingFlagDisposition: 'The source boolSendPageHLAClickRecord assignment is preserved as evidence only; no legacy reporting or persistence operation is executed.',
  originalRuntimeAccepted: false, humanReviewAccepted: false, sourceRandomParityEstablished: false,
});

export interface In012InteractionState {
  readonly seed: number;
  readonly replay: number;
  readonly rngState: number;
  readonly currentCaseId: In012CaseId;
  readonly remaining: readonly In012CaseId[];
  readonly drawCount: number;
  readonly cycle: number;
}
const normalizeSeed = (seed: number) => Number.isSafeInteger(seed) ? seed >>> 0 : 0;

/** Same seeded Current-JS generator strategy as the existing source-bound FQ002. */
export function nextIn012Product(state: In012InteractionState): In012InteractionState {
  const pool = state.remaining.length ? [...state.remaining] : [...CASE_IDS];
  const rngState = (state.rngState + 0x6d2b79f5) >>> 0;
  let random = rngState;
  random = Math.imul(random ^ (random >>> 15), random | 1);
  random ^= random + Math.imul(random ^ (random >>> 7), random | 61);
  const index = Math.floor(((random ^ (random >>> 14)) >>> 0) / 4_294_967_296 * pool.length);
  const currentCaseId = pool.splice(index, 1)[0]!;
  return Object.freeze({...state, rngState, currentCaseId, remaining: Object.freeze(pool),
    drawCount: state.drawCount + 1, cycle: state.cycle + (state.remaining.length === 0 ? 1 : 0)});
}

export function createIn012Interaction(seed: number, replay = 0): In012InteractionState {
  const normalized = normalizeSeed(seed);
  return nextIn012Product({seed: normalized, replay, rngState: normalized,
    currentCaseId: 'Q1', remaining: [], drawCount: 0, cycle: 0});
}

export function resolveIn012Example(state: SourceStaticCanvasFrameState, context: RuntimeContext,
  interaction: In012InteractionState = createIn012Interaction(state.seed, context.replay ?? 0)): In012Case {
  if (state.frame < 97) return EMPTY_CASE;
  if (state.frame < 269) return IN012_CASES[0];
  if (isCompleteTraceCaptureIdentity(context)) return IN012_CASES[state.frame - 269]!;
  return IN012_CASES.find(example => example.id === interaction.currentCaseId)!;
}

function arithmetic(example: In012Case) {
  const aTens = Math.floor(example.a / 10), aUnits = example.a % 10;
  const bTens = Math.floor(example.b / 10), bUnits = example.b % 10;
  return {aTens, aUnits, bTens, bUnits,
    terms: [[aTens * 10, bTens * 10], [aUnits, bTens * 10], [aTens * 10, bUnits], [aUnits, bUnits]],
    cells: [aTens * bTens, aTens * bUnits, aUnits * bTens, aUnits * bUnits]};
}

export function getSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext,
  interaction: In012InteractionState = createIn012Interaction(context.seed, context.replay ?? 0)): TextPresentationSnapshot {
  const expected = sourceModule.getFrameState(context.frame, context);
  const valid = Boolean(state && typeof state === 'object' && state.status === 'ready' && expected.status === 'ready' &&
    state.animationId === ID && state.sourceSwfSha256 === binding.sourceSwfSha256 &&
    state.frame === expected.frame && state.frameDomain === DOMAIN && (context.frameDomain ?? DOMAIN) === DOMAIN &&
    state.rootFrame === 6 && (context.rootFrame === undefined || context.rootFrame === 6) &&
    state.scenario === 'source-static-frame' && context.scenario === state.scenario &&
    state.language === 'en' && context.lang === 'en' && state.seed === expected.seed &&
    interaction.seed === expected.seed && interaction.replay === (context.replay ?? 0));
  const example = resolveIn012Example(expected, context, interaction);
  const values = arithmetic(example);
  const content: Record<string, {text: string; visible: boolean}> = {
    'root-title': {text: IN012_SOURCE_EVIDENCE.sourceTitle, visible: true},
    instruction: {text: IN012_SOURCE_EVIDENCE.sourceInstruction, visible: expected.frame >= 2},
    problem: {text: `${example.a} × ${example.b} =`, visible: true},
    expanded: {text: `(${values.aTens * 10} + ${values.aUnits}) × (${values.bTens * 10} + ${values.bUnits}) =`, visible: true},
    'partial-products': {text: `${values.terms.map(([left, right]) => `${left} × ${right}`).join(' + ')} =`, visible: true},
    product: {text: String(example.result), visible: true},
    'factor-b-tens': {text: String(values.bTens), visible: true},
    'factor-b-units': {text: String(values.bUnits), visible: true},
    'factor-a-tens': {text: String(values.aTens), visible: true},
    'factor-a-units': {text: String(values.aUnits), visible: true},
    'result-hundreds': {text: String(Math.floor(example.result / 100)), visible: true},
    'result-tens': {text: String(Math.floor(example.result / 10) % 10), visible: true},
    'result-units': {text: String(example.result % 10), visible: true},
    'new-product': {text: 'New Product', visible: true},
  };
  values.cells.forEach((cell, index) => {
    content[`cell-${index}-tens`] = {text: String(Math.floor(cell / 10)), visible: cell >= 10};
    content[`cell-${index}-units`] = {text: String(cell % 10), visible: true};
  });
  const snapshot = buildLessonTextSnapshot(binding, {...context, frame: expected.frame, frameDomain: DOMAIN, rootFrame: 6, seed: expected.seed}, content);
  return valid ? snapshot : Object.freeze({...snapshot, status: 'blocked', blocks: Object.freeze([]),
    suppressedInstances: Object.freeze([]), blockers: Object.freeze([state?.blocker ?? expected.blocker ?? 'source-or-interaction-identity-mismatch'])});
}

const COLORS = Object.freeze(['#244db2', '#b42318', '#22663d', '#826000']);
const FILLS = Object.freeze(['#748cf1', '#f2675c', '#6ead7c', '#f3d658']);
const PANEL: CSSProperties = {minWidth: 0, background: '#fff', border: '1px solid #cbd7e5',
  borderRadius: '0.875rem', padding: '1rem', boxSizing: 'border-box'};
const SVG_LABEL: CSSProperties = {fontFamily: 'var(--lesson-text-font-body)', fontSize: '1.125rem', fontWeight: 600};

function AreaGrid({example}: {readonly example: In012Case}) {
  const {aTens, aUnits, bTens, bUnits} = arithmetic(example);
  const regions = [
    {x: 0, y: 300 - aTens * 100, width: bTens * 100, height: aTens * 100},
    {x: 0, y: 300 - example.a * 10, width: bTens * 100, height: aUnits * 10},
    {x: bTens * 100, y: 300 - aTens * 100, width: bUnits * 10, height: aTens * 100},
    {x: bTens * 100, y: 300 - example.a * 10, width: bUnits * 10, height: aUnits * 10},
  ];
  return <svg viewBox="0 0 300 300" width="100%" aria-label={`${example.a} × ${example.b}`} role="img"
    data-in012-area-grid="true" style={{display: 'block', width: '100%', maxWidth: '30rem', marginInline: 'auto'}}>
    <rect width="300" height="300" fill="#ffffff"/>
    {regions.map((region, index) => <rect {...region} key={index} fill={FILLS[index]}
      data-partial-product={arithmetic(example).terms[index]!.reduce((left, right) => left! * right!, 1)}/>) }
    {Array.from({length: 31}, (_, index) => <g key={index} stroke={index % 10 === 0 ? '#394d68' : '#d9e1eb'} strokeWidth={index % 10 === 0 ? 1.4 : 0.45}>
      <line x1={index * 10} y1={0} x2={index * 10} y2={300}/>
      <line x1={0} y1={index * 10} x2={300} y2={index * 10}/>
    </g>)}
  </svg>;
}

function Lattice({snapshot}: {readonly snapshot: TextPresentationSnapshot}) {
  const blocks = Object.fromEntries(snapshot.blocks.map(block => [block.id, block]));
  const label = (id: string, x: number, y: number, fill = '#14213d') => blocks[id]?.visible && <text
    key={id} data-lesson-text-block={id} x={`${x}%`} y={`${y}%`} textAnchor="middle" dominantBaseline="central"
    lang="en" fill={fill} style={SVG_LABEL}>{blocks[id].text}</text>;
  return <svg data-in012-lattice="true" width="100%" height="272" aria-label={blocks.problem.text}
    style={{display: 'block', blockSize: '17rem', width: '100%'}}>
    <g aria-hidden="true" fill="none" stroke="#394d68" strokeWidth="2">
      <rect x="20%" y="24%" width="60%" height="48%"/>
      <line x1="50%" y1="24%" x2="50%" y2="72%"/>
      <line x1="20%" y1="48%" x2="80%" y2="48%"/>
      {Array.from({length: 4}, (_, index) => <line key={index}
        x1={`${20 + index % 2 * 30}%`} y1={`${48 + Math.floor(index / 2) * 24}%`}
        x2={`${50 + index % 2 * 30}%`} y2={`${24 + Math.floor(index / 2) * 24}%`}/>) }
    </g>
    {label('factor-b-tens', 35, 12)}{label('factor-b-units', 65, 12)}
    {label('factor-a-tens', 89, 36)}{label('factor-a-units', 89, 60)}
    {label('result-hundreds', 11, 60)}{label('result-tens', 35, 84)}{label('result-units', 65, 84)}
    {[0, 1, 2, 3].map(index => <React.Fragment key={index}>
      {label(`cell-${index}-tens`, 30 + index % 2 * 30, 32 + Math.floor(index / 2) * 24, COLORS[[0, 2, 1, 3][index]!]!)}
      {label(`cell-${index}-units`, 40 + index % 2 * 30, 40 + Math.floor(index / 2) * 24, COLORS[[0, 2, 1, 3][index]!]!)}
    </React.Fragment>)}
  </svg>;
}

function Session({state, context, props}: {readonly state: SourceStaticCanvasFrameState; readonly context: RuntimeContext; readonly props: AnimationRendererProps}) {
  const [interaction, setInteraction] = useState(() => createIn012Interaction(state.seed, context.replay ?? 0));
  const snapshot = getSnapshot(state, context, interaction);
  if (snapshot.status !== 'ready') return <section data-modern-lesson="g4-l5-in012" data-presentation-status="blocked"/>;
  const example = resolveIn012Example(state, context, interaction);
  const blocks = Object.fromEntries(snapshot.blocks.map(block => [block.id, block]));
  const capture = isCompleteTraceCaptureIdentity(context);
  const interactive = state.frame >= IN012_INTERACTION_FRAME && !capture;
  const term = (index: number, value: string) => {
    const target = IN012_SOURCE_KEY_TERMS[index]!;
    const emphasized = IN012_SOURCE_EMPHASIS[index]!.frames.some(frame => frame === state.frame);
    const word = <span data-in012-word={target.sourceKey} data-in012-emphasized={emphasized}
      style={{fontWeight: emphasized ? 800 : 'inherit', backgroundColor: emphasized ? '#fff0a6' : 'transparent',
        borderRadius: '.15rem', boxShadow: emphasized ? 'inset 0 -0.1em 0 #826000' : 'none'}}>{value}</span>;
    if (!props.onLessonHostRequest || capture) return word;
    return <button type="button" data-keyterm-entry-id={target.entryId} data-source-button-id={target.sourceButtonId}
      onClick={event => props.onLessonHostRequest?.({type: 'open-keyterm', entryId: target.entryId, sourceAnimationId: ID,
        playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'}, {trigger: event.currentTarget})}
      style={{font: 'inherit', color: '#174fa5', background: 'transparent', border: 0, borderRadius: '.25rem', padding: '0 .1rem',
        minWidth: 44, minHeight: 44, textDecoration: 'underline', textUnderlineOffset: '.15em', cursor: 'pointer'}}>{word}</button>;
  };
  const terms = arithmetic(example).terms;
  return <section className="lesson-text-presentation" lang="en" data-modern-lesson="g4-l5-in012"
    data-presentation-status="candidate" data-source-swf-sha256={binding.sourceSwfSha256}
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-flash-seed={state.seed} data-flash-lang={state.language} data-flash-scenario={state.scenario}
    data-replay={context.replay ?? 0} data-current-case={example.id} data-interaction-enabled={interactive}
    data-draw-count={interaction.drawCount} data-cycle={interaction.cycle}
    data-remaining-case-count={interaction.remaining.length}
    data-source-question-frame={example.frame} data-source-question-sprite={example.sprite ?? undefined}
    data-language-policy={props.uiLanguage === 'es' ? 'source-fallback' : 'source'} data-spanish-translation="false"
    data-original-runtime-accepted="false" data-owner-accepted="false" data-strict-migration-complete="false"
    style={{display: 'grid', gap: '1.25rem', maxWidth: '68rem', marginInline: 'auto'}}>
    {/* The optional hyphen preserves the shared title size without arbitrary letter wrapping. */}
    <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title"
      data-lesson-text-block="root-title" lang="en" aria-label={blocks['root-title'].text}
      style={{overflowWrap: 'normal', hyphens: 'manual'}}>{blocks['root-title'].text.replace('Multiplication', 'Multipli\u00adcation')}</h2>
    {blocks.instruction.visible &&
      <p className="lesson-text-presentation__block lesson-text-presentation__block--question" data-lesson-text-block="instruction">
          Click New {term(0, 'Product')} to change the {term(1, 'numbers')} in the {term(2, 'multiplication')} {term(3, 'problem')}.
      </p>}
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 23rem), 1fr))', gap: '1.25rem', alignItems: 'start'}}>
      <figure style={{...PANEL, margin: 0}} aria-label={blocks.expanded.text}><AreaGrid example={example}/></figure>
      <div style={{...PANEL, display: 'grid', gap: '0.75rem'}}>
        <div aria-live={interactive ? 'polite' : undefined} aria-atomic="true" style={{display: 'grid', gap: '0.75rem'}}>
          <p className="lesson-text-presentation__block lesson-text-presentation__block--question" data-lesson-text-block="problem">{blocks.problem.text}</p>
          <p className="lesson-text-presentation__block" data-lesson-text-block="expanded">{blocks.expanded.text}</p>
          <p className="lesson-text-presentation__block" data-lesson-text-block="partial-products">
            {terms.map(([left, right], index) => <React.Fragment key={index}>
              {index > 0 ? ' + ' : null}<span style={{whiteSpace: 'nowrap', color: COLORS[index]}}>{left} × {right}</span>
            </React.Fragment>)}{' ='}
          </p>
          <p className="lesson-text-presentation__block lesson-text-presentation__block--answer" data-lesson-text-block="product">{blocks.product.text}</p>
        </div>
        <LessonTextPresentation snapshot={{...snapshot, blocks: []}} template="complex-figure"
          figureMinWidthRem={24} figureReadingOrder={20} figureLabel={blocks.problem.text}
          figure={<Lattice snapshot={snapshot}/>}/>
        <div className="lesson-text-presentation__controls">
          <button type="button" data-lesson-text-block="new-product" disabled={!interactive}
            onClick={() => {if (interactive) setInteraction(current => nextIn012Product(current));}}
            style={{border: '2px solid #244db2', borderRadius: '0.75rem', padding: '0.55rem 1rem',
              color: interactive ? '#fff' : '#52647a', background: interactive ? '#244db2' : '#e5eaf2',
              cursor: interactive ? 'pointer' : 'default', opacity: 1}}>{blocks['new-product'].text}</button>
        </div>
      </div>
    </div>
  </section>;
}

export function ModernRenderer(props: AnimationRendererProps) {
  const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? DOMAIN, rootFrame: props.rootFrame ?? 6};
  const state = (props.state === undefined ? sourceModule.getFrameState(props.frame, context) : props.state) as SourceStaticCanvasFrameState;
  if (!state || typeof state !== 'object') return <section data-modern-lesson="g4-l5-in012" data-presentation-status="blocked"/>;
  return <Session key={`${state.seed}:${context.replay ?? 0}`} state={state} context={context} props={props}/>;
}

export const G4_L5_IN012_TEXT_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = Object.freeze({
  schemaVersion: 1, binding, Renderer: ModernRenderer, getSnapshot,
  keyTerms: IN012_KEY_TERMS,
  sourceTimelineAudioCues: Object.freeze([ASSIGNED_SOURCE_MAIN_AUDIO[ID]]),
  playbackEndFrameByDomain: Object.freeze({[DOMAIN]: IN012_INTERACTION_FRAME}),
  reducedMotionFrameByDomain: Object.freeze({[DOMAIN]: IN012_INTERACTION_FRAME}),
});
