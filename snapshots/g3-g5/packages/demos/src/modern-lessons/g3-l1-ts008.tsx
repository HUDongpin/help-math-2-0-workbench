'use client';

import React, {useEffect, useId, useRef, useState} from 'react';
import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {LessonTextActivitySnapshot, LessonTextBinding, LessonTextPresentationCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {
  COURSE_G03_L01_TS_008_SOURCE,
  getCourseG03L01Ts008FrameState,
  normalizeCourseG03L01Ts008Frame,
  normalizeCourseG03L01Ts008RootFrame,
  type CourseG03L01Ts008FrameState,
} from '../timelines/course-g03-l01-ts-008';

const ANIMATION_ID = 'course-g03-l01-ts-008';
const DOMAIN = 'sprite-348';
const SOURCE_SHA = COURSE_G03_L01_TS_008_SOURCE.swfSha256;
const textIds = (character: number, count = 1) => Array.from({length: count}, (_, index) => `character-${character}/run-${index}`);

export const G3_L1_TS008_BEATS = Object.freeze({
  firstQuestionAndChoices: 9,
  step1: 296,
  step2: 435,
  step3: 551,
  step4: 660,
  quiz: 728,
  complete: 747,
  // Source DoAction hides the named popups at550/659/728. The two case-colliding
  // names at728 do not establish which child Help activates or advances.
  // Native place-value Help and its optional angle reference are explicit
  // modern presentation choices, not proof of that legacy activation path.
  pictureHelp: 550,
  reasoningHelp: 659,
});

export const G3_L1_TS008_FRAME_TRANSITIONS = Object.freeze([
  {fromFrame: 295, toFrame: 296, stopFrame: 434},
  {fromFrame: 434, toFrame: 435, stopFrame: 550},
  {fromFrame: 550, toFrame: 551, stopFrame: 659},
  {fromFrame: 659, toFrame: 660, stopFrame: 728},
  {fromFrame: 728, toFrame: 729, stopFrame: 747},
] as const);
export type G3L1Ts008FrameRequest = {readonly fromFrame: number; readonly toFrame: number; readonly stopFrame: number};
export type G3L1Ts008Help = 'picture' | 'reasoning' | 'place-value';
export type G3L1Ts008Choice = 3 | 6 | 8 | 9;

export const G3_L1_TS008_CHOICES = Object.freeze([
  {letter: 'A', value: 3, letterCharacter: 36, digitCharacter: 37, buttonCharacter: 146},
  {letter: 'B', value: 6, letterCharacter: 28, digitCharacter: 29, buttonCharacter: 145},
  {letter: 'C', value: 8, letterCharacter: 31, digitCharacter: 32, buttonCharacter: 147},
  {letter: 'D', value: 9, letterCharacter: 34, digitCharacter: 35, buttonCharacter: 148},
] as const);
export const G3_L1_TS008_PLACES = Object.freeze([
  {key: 'ten-thousands', label: 'Ten Thousands', digit: 9, exampleDigit: 1, labelCharacter: 114, digitCharacter: 119, exampleCharacter: 122},
  {key: 'thousands', label: 'Thousands', digit: 3, exampleDigit: 7, labelCharacter: 115, digitCharacter: 120, exampleCharacter: 153},
  {key: 'hundreds', label: 'Hundreds', digit: 8, exampleDigit: 5, labelCharacter: 116, digitCharacter: 121, exampleCharacter: 154},
  {key: 'tens', label: 'Tens', digit: 1, exampleDigit: 8, labelCharacter: 117, digitCharacter: 122, exampleCharacter: 121},
  {key: 'ones', label: 'Ones', digit: 6, exampleDigit: 9, labelCharacter: 118, digitCharacter: 123, exampleCharacter: 119},
] as const);
export const G3_L1_TS008_KEY_TERMS = Object.freeze({
  Digit: {entryId:'en-0156-78eead3d9112',buttonCharacters:[41,163]},
  'Thousands place': {entryId:'en-0697-2e58143f048e',buttonCharacters:[42]},
  'Place value chart': {entryId:'en-0486-5776991a6c68',buttonCharacters:[108]},
  'Place (Noun)': {entryId:'en-0482-61a5797fce79',buttonCharacters:[110]},
  'Ones place': {entryId:'en-0433-461a483ac27d',buttonCharacters:[111]},
  'Standard form': {entryId:'en-0656-64b7053406f0',buttonCharacters:[162]},
  Location: {entryId:'en-0361-f4d0f4db43e6',buttonCharacters:[164]},
  'Place value': {entryId:'en-0485-3a689feb3f51',buttonCharacters:[165]},
  Number: {entryId:'en-0423-3bcf1a5c2467',buttonCharacters:[166]},
  'Acute angle': {entryId:'en-0003-56acfcece7cc',buttonCharacters:[336]},
  Degree: {entryId:'en-0143-e5e220db207d',buttonCharacters:[338]},
  Greater: {entryId:'en-0257-b1ee1aaa1118',buttonCharacters:[345]},
  Line: {entryId:'en-0348-26540cbc2a59',buttonCharacters:[343]},
  Measure: {entryId:'en-0372-3dc76de7a102',buttonCharacters:[339]},
  'Obtuse angle': {entryId:'en-0428-223eb9b68932',buttonCharacters:[341]},
  'Right angle': {entryId:'en-0580-2f53a69d6cc6',buttonCharacters:[340,344]},
  'Square corner': {entryId:'en-0650-ebf52ae920ce',buttonCharacters:[337]},
  'Straight angle': {entryId:'en-0662-0a69d129a3e1',buttonCharacters:[342]},
});

const angleTerm = (label: string, name: keyof typeof G3_L1_TS008_KEY_TERMS, depth: number, buttonCharacter: number) =>
  Object.freeze({label, name, sourceInstanceId: `sprite-346/depth-${depth}/generation-1`, buttonCharacter});

// Exact text326 run groups and hit occurrences. The modern reference entry is
// separate from the source's unqualified stopped sprite346 activation.
export const G3_L1_TS008_ANGLE_PARAGRAPHS = Object.freeze([
  {id: 'angle-right', firstRun: 0, lastRun: 7, segments: [
    angleTerm('Right angles','Right angle',21,340), ' have ', angleTerm('square corners','Square corner',13,337),
    ' and ', angleTerm('measure','Measure',17,339), ' 90 ', angleTerm('degrees','Degree',15,338), '.',
  ]},
  {id: 'angle-acute', firstRun: 8, lastRun: 16, segments: [
    angleTerm('Acute angles','Acute angle',11,336), ' ', angleTerm('measure','Measure',41,339), ' less than ',
    angleTerm('right angles','Right angle',19,340), '.  Acute angles ', angleTerm('measure','Measure',23,339),
    ' between 0 and 90 ', angleTerm('degrees','Degree',25,338), '.',
  ]},
  {id: 'angle-obtuse', firstRun: 17, lastRun: 24, segments: [
    angleTerm('Obtuse angles','Obtuse angle',27,341), ' ', angleTerm('measure','Measure',43,339), ' ',
    angleTerm('greater','Greater',45,345), ' than ', angleTerm('right angles','Right angle',39,344),
    '. Obtuse angles ', angleTerm('measure','Measure',31,339), ' between 90 and 180 ', angleTerm('degrees','Degree',29,338), '.',
  ]},
  {id: 'angle-straight', firstRun: 25, lastRun: 30, segments: [
    angleTerm('Straight angles','Straight angle',33,342), ' ', angleTerm('measure','Measure',47,339),
    ' 180 ', angleTerm('degrees','Degree',35,338), ' and are the same as straight ', angleTerm('lines','Line',37,343), '.',
  ]},
].map(paragraph => Object.freeze({...paragraph, segments: Object.freeze(paragraph.segments)})));
export const G3_L1_TS008_FEEDBACK = Object.freeze({
  wrong: Object.freeze([
    {variant: 1, sprite: 195, text: "That's incorrect!", characters: [173], firstVisibleFrame: 4, hiddenFrame: 27, endFrame: 28},
    {variant: 2, sprite: 230, text: 'Incorrect!', characters: [223, 224], firstVisibleFrame: 3, hiddenFrame: 30, endFrame: 31},
    {variant: 3, sprite: 206, text: 'Try Again!', characters: [202], firstVisibleFrame: 7, hiddenFrame: 26, endFrame: 28},
  ]),
  correct: Object.freeze([
    {variant: 1, sprite: 294, text: 'YOU GOT IT!', characters: [287, 288], firstVisibleFrame: 13, hiddenFrame: 27, endFrame: 27},
    {variant: 2, sprite: 310, text: 'Correct!', characters: [305, 306], firstVisibleFrame: 12, hiddenFrame: 26, endFrame: 28},
    {variant: 3, sprite: 242, text: 'Excellent!', characters: [239, 240], firstVisibleFrame: 5, hiddenFrame: 26, endFrame: 27},
    {variant: 4, sprite: 322, text: 'Great Job!', characters: [316, 317], firstVisibleFrame: 3, hiddenFrame: 25, endFrame: 25},
  ]),
});

const FEEDBACK_AUDIO = Object.freeze({
  'wrong-1': {sha256:'f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1',firstFrame:2,lastFrame:28},
  'wrong-2': {sha256:'c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1',firstFrame:2,lastFrame:31},
  'wrong-3': {sha256:'d7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0',firstFrame:2,lastFrame:28},
  'correct-1': {sha256:'1b7f35c62c832068bd2e0e54246c591df18f08e9ff8c77527e6f3ba03650246f',firstFrame:3,lastFrame:27},
  'correct-2': {sha256:'3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7',firstFrame:2,lastFrame:28},
  'correct-3': {sha256:'18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec',firstFrame:2,lastFrame:27},
  'correct-4': {sha256:'f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8',firstFrame:1,lastFrame:13},
});

export const G3_L1_TS008_ACTIVITY_TIMELINES = Object.freeze((['wrong', 'correct'] as const).flatMap(kind =>
  G3_L1_TS008_FEEDBACK[kind].map(feedback => Object.freeze({id: `${kind}-${feedback.variant}`,
    frameDomain: `sprite-${feedback.sprite}`, startFrame: 2, endFrame: feedback.endFrame, fps: 12,
    parentFrames: Object.freeze([728]), audio: Object.freeze({
      ...FEEDBACK_AUDIO[`${kind}-${feedback.variant}` as keyof typeof FEEDBACK_AUDIO], language: 'shared' as const, spokenLanguage: 'undetermined' as const,
      source: `/lesson-typography-v1/audio/course-g03-l01-ts-008/${kind}-${feedback.variant}.${kind === 'correct' && feedback.variant === 4 ? 'wav' : 'mp3'}`,
    })}))));

export interface G3L1Ts008Interaction {
  readonly seed: number;
  readonly replay: number;
  readonly quizTryCount: number;
  readonly help: G3L1Ts008Help | null;
  readonly helpView: 'primary' | 'angles';
  readonly feedback: Readonly<{kind: 'wrong' | 'correct'; variant: number; text: string; selectedValue: G3L1Ts008Choice; activityRevisionFloor: number}> | null;
  readonly pendingFromFrame: number | null;
  readonly terminalOutcome: 'correct' | 'two-wrong-continuation' | null;
}
export type G3L1Ts008Action =
  | Readonly<{type: 'continue' | 'open-help' | 'close-help' | 'open-angle-reference' | 'back-to-place-value' | 'feedback-complete'}>
  | Readonly<{type: 'answer'; value: G3L1Ts008Choice; activityRevisionFloor?: number}>;

export function createG3L1Ts008Interaction(seed = 0, replay = 0): G3L1Ts008Interaction {
  return Object.freeze({seed: Number.isSafeInteger(seed) ? seed >>> 0 : 0,
    replay: Number.isSafeInteger(replay) ? replay : 0, quizTryCount: 0,
    help: null, helpView: 'primary', feedback: null, pendingFromFrame: null, terminalOutcome: null});
}

export function synchronizeG3L1Ts008Interaction(state: G3L1Ts008Interaction, context: RuntimeContext) {
  const identity = createG3L1Ts008Interaction(context.seed, context.replay ?? 0);
  if (state.seed !== identity.seed || state.replay !== identity.replay) return identity;
  if (state.helpView === 'angles' && context.frame !== 728) return Object.freeze({...state, help: null, helpView: 'primary' as const});
  return state.pendingFromFrame !== null && state.pendingFromFrame !== context.frame
    ? Object.freeze({...state, pendingFromFrame: null}) : state;
}

/** Produces one intent for the existing host clock. It never owns a timer or
 * alters the old module's frame/scenario interfaces. The caller must commit
 * nextState only after a frameRequest was accepted by that host.
 */
export function reduceG3L1Ts008Interaction(state: G3L1Ts008Interaction, frame: number, action: G3L1Ts008Action) {
  const rejected = (reason: string) => ({allowed: false as const, reason, nextState: state, frameRequest: null});
  const accepted = (nextState: G3L1Ts008Interaction, frameRequest: G3L1Ts008FrameRequest | null = null) =>
    ({allowed: true as const, reason: null, nextState: Object.freeze(nextState), frameRequest});
  const transition = G3_L1_TS008_FRAME_TRANSITIONS.find(edge => edge.fromFrame === frame);
  if (state.pendingFromFrame === frame) return rejected('frame-transition-pending');
  if (action.type === 'continue') {
    if (!transition || frame === 728 || state.help || state.feedback) return rejected('continue-not-available');
    return accepted({...state, pendingFromFrame: frame}, transition);
  }
  if (action.type === 'open-help') {
    if (state.help || state.feedback) return rejected('help-not-available');
    const help = frame === 550 ? 'picture' : frame === 659 ? 'reasoning' : frame === 728 ? 'place-value' : null;
    return help ? accepted({...state, help, helpView: 'primary'}) : rejected('help-not-available');
  }
  if (action.type === 'open-angle-reference' || action.type === 'back-to-place-value') {
    const expectedView = action.type === 'open-angle-reference' ? 'primary' : 'angles';
    if (frame !== 728 || state.help !== 'place-value' || state.feedback || state.helpView !== expectedView) return rejected('reference-not-available');
    return accepted({...state, helpView: action.type === 'open-angle-reference' ? 'angles' : 'primary'});
  }
  if (action.type === 'close-help') {
    if (!state.help) return rejected('help-is-not-open');
    if (state.help === 'place-value' && frame === 728) return accepted({...state, help: null, helpView: 'primary'});
    if ((state.help === 'picture' && frame === 550) || (state.help === 'reasoning' && frame === 659)) {
      return accepted({...state, help: null, helpView: 'primary', pendingFromFrame: frame}, transition!);
    }
    return rejected('help-frame-mismatch');
  }
  if (action.type === 'answer') {
    if (frame !== 728 || state.help || state.feedback ||
      !G3_L1_TS008_CHOICES.some(choice => choice.value === action.value)) return rejected('answer-not-available');
    const kind = action.value === 3 ? 'correct' : 'wrong';
    const variants = G3_L1_TS008_FEEDBACK[kind];
    // Source proves the 3/4 variant sets, not Flash's random sequence. This is
    // a declared deterministic Current-JS selection, separate from RNG parity.
    const selected = variants[(state.seed + state.quizTryCount) % variants.length]!;
    return accepted({...state, feedback: {kind, variant: selected.variant, text: selected.text, selectedValue: action.value,
      activityRevisionFloor: action.activityRevisionFloor ?? -1}});
  }
  if (action.type === 'feedback-complete') {
    if (frame !== 728 || !state.feedback || state.help) return rejected('feedback-not-available');
    if (state.feedback.kind === 'wrong' && state.quizTryCount === 0) {
      return accepted({...state, feedback: null, quizTryCount: 1});
    }
    const correct = state.feedback.kind === 'correct';
    return accepted({...state, feedback: null, quizTryCount: correct ? state.quizTryCount : 0,
      terminalOutcome: correct ? 'correct' : 'two-wrong-continuation', pendingFromFrame: 728}, transition!);
  }
  return rejected('unknown-action');
}

export function getG3L1Ts008FeedbackActivity(state: G3L1Ts008Interaction, activity?: LessonTextActivitySnapshot) {
  const feedback = state.feedback;
  const definition = feedback ? G3_L1_TS008_FEEDBACK[feedback.kind].find(item => item.variant === feedback.variant) : undefined;
  const matched = Boolean(feedback && definition && activity && activity.id === `${feedback.kind}-${feedback.variant}` &&
    activity.frameDomain === `sprite-${definition.sprite}` && activity.revision > feedback.activityRevisionFloor);
  return {matched, visible: Boolean(matched && activity && definition && activity.frame >= definition.firstVisibleFrame && activity.frame < definition.hiddenFrame),
    complete: Boolean(matched && activity && definition && activity.status === 'completed' && activity.frame === definition.endFrame)};
}

const bindings = [
  {id: 'root-title', sourceTextIds: textIds(351), role: 'title', readingOrder: 0},
  {id: 'question', sourceTextIds: textIds(39, 5), role: 'question', readingOrder: 1},
  ...G3_L1_TS008_CHOICES.map((choice, index) => ({id: `choice-${choice.letter}`, sourceTextIds: [...textIds(choice.letterCharacter), ...textIds(choice.digitCharacter)], role: 'answer', readingOrder: 10 + index})),
  {id: 'step1-heading', sourceTextIds: [...textIds(20), ...textIds(19)], role: 'heading', readingOrder: 20},
  {id: 'step1-instruction', sourceTextIds: textIds(61, 2), role: 'body', readingOrder: 21},
  {id: 'step1-number', sourceTextIds: ['character-61/run-2'], role: 'body', readingOrder: 22},
  {id: 'step2-heading', sourceTextIds: textIds(16), role: 'heading', readingOrder: 30},
  {id: 'given', sourceTextIds: textIds(102, 2), role: 'body', readingOrder: 31},
  {id: 'needed', sourceTextIds: textIds(103, 4), role: 'body', readingOrder: 32},
  {id: 'step3-heading', sourceTextIds: [...textIds(17), ...textIds(106)], role: 'heading', readingOrder: 40},
  {id: 'draw-chart', sourceTextIds: textIds(107, 3), role: 'body', readingOrder: 41},
  ...G3_L1_TS008_PLACES.flatMap((place, index) => [
    {id: `chart-label-${place.key}`, sourceTextIds: textIds(place.labelCharacter), role: 'label', readingOrder: 42 + index * 2},
    {id: `chart-digit-${place.key}`, sourceTextIds: textIds(place.digitCharacter), role: 'label', readingOrder: 43 + index * 2},
  ]),
  {id: 'write-digits', sourceTextIds: textIds(109, 7), role: 'body', readingOrder: 54},
  {id: 'chart-answer', sourceTextIds: textIds(112), role: 'answer', readingOrder: 55},
  {id: 'step4-heading', sourceTextIds: [...textIds(18), ...textIds(136)], role: 'heading', readingOrder: 60},
  {id: 'reasoning-number', sourceTextIds: textIds(137), role: 'body', readingOrder: 61},
  ...[138, 139, 140].map((character, index) => ({id: `reasoning-${index + 1}`, sourceTextIds: textIds(character), role: 'body', readingOrder: 62 + index})),
  {id: 'reasoning-answer', sourceTextIds: textIds(141), role: 'answer', readingOrder: 65},
  {id: 'help-standard', sourceTextIds: textIds(151, 5), role: 'body', readingOrder: 101},
  {id: 'help-value', sourceTextIds: textIds(152, 9), role: 'body', readingOrder: 102},
  {id: 'help-example', sourceTextIds: textIds(160), role: 'heading', readingOrder: 103},
  ...G3_L1_TS008_PLACES.flatMap((place, index) => [
    {id: `help-label-${place.key}`, sourceTextIds: textIds(place.labelCharacter), role: 'label', readingOrder: 104 + index * 2},
    {id: `help-digit-${place.key}`, sourceTextIds: textIds(place.exampleCharacter), role: 'label', readingOrder: 105 + index * 2},
  ]),
  ...[155, 156, 157, 158, 159].map((character, index) => ({id: `help-explanation-${index}`, sourceTextIds: textIds(character, 2), role: 'body', readingOrder: 120 + index})),
  ...G3_L1_TS008_ANGLE_PARAGRAPHS.map((paragraph, index) => ({id: paragraph.id,
    sourceTextIds: textIds(326,31).slice(paragraph.firstRun,paragraph.lastRun+1), role: 'body', readingOrder: 130 + index})),
  {id: 'angle-close', sourceTextIds: textIds(331), role: 'label', readingOrder: 134},
  ...(['wrong', 'correct'] as const).flatMap(kind => G3_L1_TS008_FEEDBACK[kind].map((feedback,index) => ({
    id: `feedback-${kind}-${feedback.variant}`, sourceTextIds: feedback.characters.flatMap(character => textIds(character)), role: 'feedback', readingOrder: (kind === 'wrong' ? 200 : 203) + index,
    // Reflected outlines repeat text173; retain their provenance without duplicate readable text.
    ...(kind === 'wrong' && feedback.variant === 1 ? {sourceShapeIds: [178, 179, 186]} : {}),
  }))),
];

export const G3_L1_TS008_TEXT_BINDING: LessonTextBinding = Object.freeze({
  schemaVersion: 1, version: 'g03-l01-placement-071-modern-text-v2',
  placementId: 'g03-l01-placement-071', animationId: ANIMATION_ID, sourceSwfSha256: SOURCE_SHA,
  template: 'exercise', blocks: bindings.map(block => ({...block,
    role: block.role as LessonTextBinding['blocks'][number]['role'], language: 'en' as const,
    valueSource: 'maintained-page-state' as const})),
});

const COPY: Readonly<Record<string, string>> = Object.freeze({
  'root-title': 'Place Value: Practice Test',
  question: 'Which digit in 93,816 is in the thousands place?',
  ...Object.fromEntries(G3_L1_TS008_CHOICES.map(choice => [`choice-${choice.letter}`, `${choice.letter}. ${choice.value}`])),
  'step1-heading': '1.', 'step1-instruction': 'Name the digit in the thousands place.', 'step1-number': '93,816',
  'step2-heading': '2.', given: 'Information given: 93,816', needed: 'Information needed: name of digit in the thousands place',
  'step3-heading': '3. Use strategy: Draw a picture', 'draw-chart': 'Draw a place value chart.',
  'write-digits': 'Then write the digits in each place starting with the Ones place.',
  'chart-answer': 'The correct answer choice is A.',
  'step4-heading': '4. Use strategy: Use Logical Reasoning', 'reasoning-number': '93,816',
  'reasoning-1': '1. The 93 is in the thousands group.', 'reasoning-2': '2. The 816 is in the ones group.',
  'reasoning-3': '3. The 3 is in the thousands place.', 'reasoning-answer': 'The correct answer choice is A.',
  'help-standard': 'A number written in standard form uses digits only.',
  'help-value': 'The place value of a digit depends on its location in a number.', 'help-example': 'Example: 17,589',
  ...Object.fromEntries(G3_L1_TS008_ANGLE_PARAGRAPHS.map(paragraph => [paragraph.id,
    paragraph.segments.map(segment => typeof segment === 'string' ? segment : segment.label).join('')])),
  'angle-close': 'Close',
  ...Object.fromEntries(G3_L1_TS008_PLACES.flatMap((place, index) => [
    [`chart-label-${place.key}`, place.label], [`chart-digit-${place.key}`, String(place.digit)],
    [`help-label-${place.key}`, place.label], [`help-digit-${place.key}`, String(place.exampleDigit)],
    [`help-explanation-${index}`, `${place.exampleDigit} is in the ${place.label.toLowerCase()} place`],
  ])),
  ...Object.fromEntries((['wrong', 'correct'] as const).flatMap(kind => G3_L1_TS008_FEEDBACK[kind].map(feedback => [`feedback-${kind}-${feedback.variant}`, feedback.text]))),
});

export function getG3L1Ts008TeachingState(frame: number, frameDomain = DOMAIN) {
  const root = frameDomain === 'root';
  const normalized = root ? normalizeCourseG03L01Ts008RootFrame(frame) : normalizeCourseG03L01Ts008Frame(frame);
  return Object.freeze({frame: normalized, root, rootTitle: root ? normalized >= 6 : frameDomain === DOMAIN,
    question: root ? normalized >= 7 : normalized >= 9,
    step1: !root && normalized >= 296, step2: !root && normalized >= 435,
    step3: !root && normalized >= 551, step4: !root && normalized >= 660,
    digitEmphasis: !root && normalized >= 20 && normalized <= 24,
    thousandsEmphasis: !root && normalized >= 68 && normalized <= 74,
    quiz: !root && normalized === 728,
  });
}

export function getG3L1Ts008TextSnapshot(state: CourseG03L01Ts008FrameState, context: RuntimeContext,
  interaction = createG3L1Ts008Interaction(context.seed, context.replay ?? 0), activity?: LessonTextActivitySnapshot): TextPresentationSnapshot {
  const requestedDomain = context.frameDomain ?? DOMAIN;
  const expected = getCourseG03L01Ts008FrameState(context.frame, {...context, frameDomain: requestedDomain});
  const permittedScenario = requestedDomain === 'root' ? context.scenario === 'root-standalone'
    : context.scenario === 'source-drawing-default' || context.scenario === 'source-static-frame';
  const blockers: string[] = [];
  if (state.sourceSwfSha256 !== SOURCE_SHA) blockers.push('source-identity-mismatch');
  if (state.status !== 'ready') blockers.push(state.blocker ?? 'source-state-not-ready');
  if (!['root', DOMAIN].includes(requestedDomain) || state.frameDomain !== expected.frameDomain) blockers.push('unsupported-frame-domain');
  if (!permittedScenario || !['root-standalone', 'source-drawing-default', 'source-static-frame'].includes(state.scenario)) blockers.push('unsupported-scenario');
  if (state.frame !== expected.frame || state.rootFrame !== expected.rootFrame || state.language !== expected.language || state.seed !== expected.seed ||
    (context.rootFrame !== undefined && context.rootFrame !== expected.rootFrame)) blockers.push('teaching-state-identity-mismatch');
  const teaching = getG3L1Ts008TeachingState(state.frame, state.frameDomain);
  const session = synchronizeG3L1Ts008Interaction(interaction, context);
  const pictureHelp = session.help === 'picture' && state.frame === 550;
  const reasoningHelp = session.help === 'reasoning' && state.frame === 659;
  const placeHelp = session.help === 'place-value' && teaching.quiz;
  const angleReference = placeHelp && session.helpView === 'angles';
  const visible = (id: string) => {
    if (id === 'root-title') return teaching.rootTitle;
    if (id === 'question' || id.startsWith('choice-')) return teaching.question;
    if (id.startsWith('step1-')) return teaching.step1;
    if (id === 'step2-heading' || id === 'given' || id === 'needed') return teaching.step2;
    if (id === 'step3-heading' || id === 'draw-chart' || id.startsWith('chart-') || id === 'write-digits') return teaching.step3 || pictureHelp;
    if (id === 'step4-heading' || id.startsWith('reasoning-')) return teaching.step4 || reasoningHelp;
    if (id.startsWith('help-')) return placeHelp && !angleReference;
    if (id.startsWith('angle-')) return angleReference;
    if (id.startsWith('feedback-')) return teaching.quiz && getG3L1Ts008FeedbackActivity(session, activity).visible && session.feedback !== null &&
      id === `feedback-${session.feedback.kind}-${session.feedback.variant}`;
    return false;
  };
  return {schemaVersion: 1, animationId: ANIMATION_ID, bindingVersion: G3_L1_TS008_TEXT_BINDING.version,
    sourceSwfSha256: SOURCE_SHA, status: blockers.length ? 'blocked' : 'ready', blockers,
    identity: {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame,
      scenario: context.scenario, language: state.language, seed: state.seed, replay: context.replay ?? 0},
    suppressedInstances: [],
    blocks: blockers.length ? [] : G3_L1_TS008_TEXT_BINDING.blocks.map(block => ({...block,
      text: COPY[block.id]!, visible: visible(block.id)})),
  };
}

const STYLES = `
.g3-ts008{box-sizing:border-box;container:g3-ts008 / inline-size;inline-size:100%;padding:clamp(8px,2vw,16px);color:#17273c;background:#fffdf8;font-family:var(--lesson-text-font-body,"Nunito Sans",system-ui,sans-serif);font-size:1.25rem;line-height:1.6}
.g3-ts008 *{box-sizing:border-box}.g3-ts008 p{margin:.6em 0;overflow-wrap:anywhere}.g3-ts008 h2,.g3-ts008 h3{margin:0 0 .7rem;overflow-wrap:anywhere}
.g3-ts008__question{padding:clamp(10px,3cqi,20px);background:#f0f6ff;border-radius:1rem;border:1px solid #c8daf2}.g3-ts008__keyword{color:#174ea6}.g3-ts008__keyword[data-emphasis="true"]{background:#dce9ff;box-shadow:0 .14em 0 #174ea6}
.g3-ts008__choices{list-style:none;padding:0;margin:1rem 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr));gap:.75rem}.g3-ts008__choice{display:flex;align-items:center;gap:.7rem;min-inline-size:0;background:#fff;border:1px solid #9bb5d4;border-radius:.7rem;padding:.7rem 1rem;font:inherit;text-align:start;color:inherit;inline-size:100%;min-block-size:2.75rem}.g3-ts008__choice strong{display:inline-grid;place-items:center;min-inline-size:1.8em;min-block-size:1.8em;border-radius:50%;background:#e5edfa}.g3-ts008__choice span{font-size:1.5rem;font-weight:700}.g3-ts008 button.g3-ts008__choice{cursor:pointer}.g3-ts008 button:disabled{opacity:.6;cursor:default}.g3-ts008 button:focus-visible{outline:3px solid #174ea6;outline-offset:3px}
.g3-ts008__steps{display:grid;gap:1rem;margin-block-start:1rem}.g3-ts008__step{border:1px solid #d4dfed;border-radius:1rem;background:#fff;padding:clamp(10px,3cqi,20px);min-inline-size:0}.g3-ts008__math{font-size:1.7rem;font-weight:700;letter-spacing:.04em}.g3-ts008__answer{padding:.6rem .8rem;background:#edf7f0;border-inline-start:4px solid #227448;border-radius:.2rem;font-weight:700}
.g3-ts008__chart{container:ts008-chart / inline-size;margin-block:1rem}.g3-ts008__places{display:grid;grid-template-columns:1fr;gap:2px;margin:0}.g3-ts008__place{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:.5rem;padding:.65rem .85rem;background:#fff6d5}.g3-ts008__place[data-group="thousands"]{background:#e4f2fb}.g3-ts008__place[data-focus="true"]{box-shadow:inset 0 0 0 3px #174ea6}.g3-ts008__place dt{font-size:1.125rem;font-weight:600;overflow-wrap:anywhere;line-height:1.4}.g3-ts008__place dd{font-size:1.8rem;line-height:1.2;margin:0;font-weight:700;font-variant-numeric:tabular-nums}
.g3-ts008__controls{display:flex;flex-wrap:wrap;gap:.75rem;margin-block:1rem}.g3-ts008__controls button,.g3-ts008__dialog button{min-block-size:2.75rem;padding:.65rem 1.1rem;border:1px solid #174ea6;border-radius:.7rem;font:inherit;line-height:1.4;color:#fff;background:#174ea6;cursor:pointer}.g3-ts008__controls button[data-secondary]{color:#174ea6;background:#fff}.g3-ts008__feedback{padding:1rem;border:2px solid #c14e37;border-radius:.8rem;margin-block:1rem;background:#fff8f5}.g3-ts008__feedback[data-outcome="correct"]{background:#eff8f2;border-color:#227448}
.g3-ts008__dialog{position:relative;inset:auto;inline-size:100%;max-inline-size:100%;max-block-size:none;margin:1rem 0;padding:clamp(10px,3cqi,22px);border:1px solid #9bb5d4;border-radius:1rem;color:#17273c;background:#fffdf8;font:inherit;overflow:visible}.g3-ts008__dialog-actions{display:flex;justify-content:flex-end;margin-block-end:.75rem}
.g3-ts008 button.g3-ts008__term{font:inherit;line-height:inherit;min-block-size:44px;min-inline-size:44px;max-inline-size:100%;border:0;padding:0 .05em;background:transparent;color:#174ea6;text-align:inherit;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;overflow-wrap:anywhere;cursor:pointer}.g3-ts008 button.g3-ts008__term[data-emphasis=true]{background:#dce9ff;box-shadow:0 .14em 0 #174ea6}
@container g3-ts008 (min-width:48rem){.g3-ts008 .lesson-text-presentation__block--question{--lesson-text-body-size:1.25rem}}
@container g3-ts008 (min-width:44rem){.g3-ts008__choices{grid-template-columns:repeat(4,minmax(0,1fr))}.g3-ts008__steps{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container ts008-chart (max-width:20rem){.g3-ts008__place{grid-template-columns:1fr;text-align:center;padding:.5rem clamp(8px,2cqi,14px)}}
@container ts008-chart (min-width:32rem){.g3-ts008__places{grid-template-columns:repeat(5,minmax(0,1fr))}.g3-ts008__place{display:flex;flex-direction:column;text-align:center;justify-content:space-between;padding:.8rem .5rem}.g3-ts008__place dt{min-block-size:2.8em}}
`;

type ModernProps = AnimationRendererProps & {readonly onLessonFrameRequest?: (request: G3L1Ts008FrameRequest) => boolean};
export function G3L1Ts008ModernRenderer(props: ModernProps) {
  const context: RuntimeContext = {...props, frameDomain: props.frameDomain ?? DOMAIN};
  const state = props.state && typeof props.state === 'object' && 'sourceSwfSha256' in props.state
    ? props.state as CourseG03L01Ts008FrameState : getCourseG03L01Ts008FrameState(props.frame, context);
  const [stored, setStored] = useState(() => createG3L1Ts008Interaction(props.seed, props.replay ?? 0));
  const interaction = synchronizeG3L1Ts008Interaction(stored, context);
  const snapshot = getG3L1Ts008TextSnapshot(state, context, interaction, props.lessonActivity);
  const teaching = getG3L1Ts008TeachingState(state.frame, state.frameDomain);
  const dialog = useRef<HTMLDialogElement>(null);
  const helpHeadingId = useId();
  const helpTrigger = useRef<HTMLButtonElement>(null);
  const angleReferenceTrigger = useRef<HTMLButtonElement>(null);
  const angleReferenceHeading = useRef<HTMLHeadingElement>(null);
  const previousHelpView = useRef(interaction.helpView);
  const feedbackStatus = useRef<HTMLDivElement>(null);
  const consumedActivity = useRef<string | null>(null);
  const choiceButtons = useRef<Record<number, HTMLButtonElement | null>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const pending = interaction.pendingFromFrame === state.frame;
  const controllerReady = state.frameDomain === DOMAIN && snapshot.status === 'ready' &&
    !/^[a-f0-9]{64}$/.test(props.entryStateSha256 ?? '');
  const canAnswer = controllerReady && teaching.quiz && !interaction.feedback && !interaction.help && !pending && Boolean(props.onLessonActivityRequest);
  const canContinue = controllerReady && [295,434,550,659].includes(state.frame) && !interaction.help && !interaction.feedback && !pending;
  const canHelp = controllerReady && [550,659,728].includes(state.frame) && !interaction.feedback && !interaction.help && !pending &&
    (state.frame === 728 || Boolean(props.onLessonFrameRequest));
  const text = (id: string) => snapshot.blocks.find(block => block.id === id && block.visible)?.text ?? '';
  function dispatch(action: G3L1Ts008Action) {
    if (!controllerReady) return false;
    const result = reduceG3L1Ts008Interaction(interaction, state.frame, action.type === 'answer'
      ? {...action, activityRevisionFloor: props.lessonActivity?.revision ?? -1} : action);
    if (!result.allowed) return false;
    if (result.frameRequest && props.onLessonFrameRequest?.(result.frameRequest) !== true) return false;
    if (action.type === 'answer' && result.nextState.feedback && props.onLessonActivityRequest?.({
      id: `${result.nextState.feedback.kind}-${result.nextState.feedback.variant}`, parentFrame: state.frame}) !== true) return false;
    setStored(result.nextState);
    return true;
  }
  useEffect(() => {
    if (interaction.help && dialog.current && !dialog.current.open) dialog.current.show();
    return () => {
      if (interaction.help) {
        if (helpTrigger.current?.isConnected) helpTrigger.current.focus();
        else heading.current?.focus();
      }
    };
  }, [interaction.help]);
  useEffect(() => {
    const previous = previousHelpView.current;
    previousHelpView.current = interaction.helpView;
    if (interaction.help !== 'place-value') return;
    if (interaction.helpView === 'angles') angleReferenceHeading.current?.focus();
    else if (previous === 'angles') angleReferenceTrigger.current?.focus();
  }, [interaction.help, interaction.helpView]);
  useEffect(() => {
    if (!interaction.feedback) return;
    feedbackStatus.current?.focus();
    const selected = interaction.feedback.selectedValue;
    return () => {
      if (choiceButtons.current[selected]?.isConnected && !choiceButtons.current[selected]?.disabled) choiceButtons.current[selected]?.focus();
      else heading.current?.focus();
    };
  }, [interaction.feedback]);
  useEffect(() => {
    if (!controllerReady || !getG3L1Ts008FeedbackActivity(interaction, props.lessonActivity).complete) return;
    const token = `${interaction.seed}:${interaction.replay}:${props.lessonActivity!.id}:${props.lessonActivity!.revision}`;
    if (consumedActivity.current === token) return;
    if (dispatch({type: 'feedback-complete'})) consumedActivity.current = token;
  }, [controllerReady, interaction, props.lessonActivity]);
  if (snapshot.status !== 'ready') return null;

  const term = (name: keyof typeof G3_L1_TS008_KEY_TERMS, label: string, emphasis = false, sourceInstanceId?: string) => {
    const entry = G3_L1_TS008_KEY_TERMS[name];
    return <button type="button" className="g3-ts008__term" data-keyterm-entry-id={entry.entryId} data-source-term-instance={sourceInstanceId}
      data-emphasis={emphasis} disabled={!controllerReady || !props.onLessonHostRequest}
      onClick={event => {
        const decision=props.onLessonHostRequest?.({type:'open-keyterm',entryId:entry.entryId,
          sourceAnimationId:ANIMATION_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},
          {trigger:event.currentTarget});
        event.currentTarget.dataset.lessonHostResult=decision?.status??'unhandled';
        if(decision?.status==='blocked')event.currentTarget.dataset.lessonHostReason=decision.reason;
      }}>{label}</button>;
  };
  const linkedCopy: Record<string,React.ReactNode> = {
    'draw-chart': <>Draw a {term('Place value chart','place value chart')}.</>,
    'write-digits': <>Then write the {term('Digit','digits')} in each {term('Place (Noun)','place')} starting with the {term('Ones place','Ones place')}.</>,
    'help-standard': <>A number written in {term('Standard form','standard form')} uses {term('Digit','digits')} only.</>,
    'help-value': <>The {term('Place value','place value')} of a {term('Digit','digit')} depends on its {term('Location','location')} in a {term('Number','number')}.</>,
    ...Object.fromEntries(G3_L1_TS008_ANGLE_PARAGRAPHS.map(paragraph => [paragraph.id, paragraph.segments.map((segment,index) =>
      <React.Fragment key={index}>{typeof segment === 'string' ? segment : term(segment.name,segment.label,false,segment.sourceInstanceId)}</React.Fragment>)])),
  };
  const paragraph = (id: string, className?: string) => text(id) ? <p key={id} data-lesson-text-block={id} className={className}>{linkedCopy[id] ?? text(id)}</p> : null;
  const chart = (example = false) => <div className="g3-ts008__chart"><dl className="g3-ts008__places" aria-label={example ? 'Place value chart for 17,589' : 'Place value chart for 93,816'}>
    {G3_L1_TS008_PLACES.map((place, index) => <div key={place.key} className="g3-ts008__place" data-group={index < 2 ? 'thousands' : 'ones'} data-focus={!example && place.key === 'thousands'}>
      <dt data-lesson-text-block={`${example ? 'help' : 'chart'}-label-${place.key}`}>{place.label}</dt>
      <dd data-lesson-text-block={`${example ? 'help' : 'chart'}-digit-${place.key}`}>{example ? place.exampleDigit : place.digit}</dd>
    </div>)}
  </dl></div>;
  const picture = (headingId?: string) => <>
    <h3 id={headingId} className="lesson-text-presentation__block lesson-text-presentation__block--heading" data-lesson-text-block="step3-heading">{text('step3-heading')}</h3>
    {paragraph('draw-chart')}{chart()}{paragraph('write-digits')}{paragraph('chart-answer','g3-ts008__answer')}
  </>;
  const reasoning = (headingId?: string) => <>
    <h3 id={headingId} className="lesson-text-presentation__block lesson-text-presentation__block--heading" data-lesson-text-block="step4-heading">{text('step4-heading')}</h3>
    {paragraph('reasoning-number','g3-ts008__math')}
    {[1,2,3].map(index => paragraph(`reasoning-${index}`))}
    {paragraph('reasoning-answer','g3-ts008__answer')}
  </>;
  return <section className="lesson-text-presentation g3-ts008" data-modern-lesson="g3-l1-ts008" lang="en"
    data-source-language-disposition="source-shared-untranslated-visual"
    data-flash-frame={state.frame} data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}
    data-runtime-scenario={context.scenario} data-runtime-seed={state.seed} data-runtime-replay={props.replay ?? 0}
    data-quiz-try-count={interaction.quizTryCount} data-help-state={interaction.help ?? 'closed'} data-help-view={interaction.helpView}
    data-feedback-activity-frame={props.lessonActivity?.frame ?? ''} data-feedback-activity-id={props.lessonActivity?.id ?? ''}
    data-feedback-state={interaction.feedback?.kind ?? 'none'} data-terminal-outcome={interaction.terminalOutcome ?? 'none'}>
    <style>{STYLES}</style>
    {teaching.rootTitle && <h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="root-title">{text('root-title')}</h2>}
    {teaching.question && <div className="g3-ts008__question">
      <h2 ref={heading} tabIndex={-1} className="lesson-text-presentation__block lesson-text-presentation__block--question" data-lesson-text-block="question">Which {term('Digit','digit',teaching.digitEmphasis)} in 93,816 is in the {term('Thousands place','thousands place',teaching.thousandsEmphasis)}?</h2>
      <ol className="g3-ts008__choices" role="list" aria-label="Answer choices">
        {G3_L1_TS008_CHOICES.map(choice => <li key={choice.letter} data-lesson-text-block={`choice-${choice.letter}`}>
          {teaching.quiz ? <button type="button" ref={node => {choiceButtons.current[choice.value] = node;}} className="g3-ts008__choice" disabled={!canAnswer}
            aria-label={`${choice.letter}. ${choice.value}`} onClick={() => dispatch({type:'answer',value:choice.value})}>
            <strong aria-hidden="true">{choice.letter}</strong><span aria-hidden="true">{choice.value}</span>
          </button> : <div className="g3-ts008__choice"><strong>{choice.letter}</strong><span>{choice.value}</span></div>}
        </li>)}
      </ol>
    </div>}
    {interaction.feedback && teaching.quiz && <div ref={feedbackStatus} tabIndex={-1} className="g3-ts008__feedback" data-outcome={interaction.feedback.kind} role="status" aria-live="polite">
      {text(`feedback-${interaction.feedback.kind}-${interaction.feedback.variant}`) && <strong data-lesson-text-block={`feedback-${interaction.feedback.kind}-${interaction.feedback.variant}`}>{interaction.feedback.text}</strong>}
    </div>}
    <div className="g3-ts008__steps">
      {teaching.step1 && <section className="g3-ts008__step" aria-labelledby="ts008-step1"><h3 id="ts008-step1" className="lesson-text-presentation__block lesson-text-presentation__block--heading" data-lesson-text-block="step1-heading">{text('step1-heading')}</h3>{paragraph('step1-instruction')}{paragraph('step1-number','g3-ts008__math')}</section>}
      {teaching.step2 && <section className="g3-ts008__step" aria-labelledby="ts008-step2"><h3 id="ts008-step2" className="lesson-text-presentation__block lesson-text-presentation__block--heading" data-lesson-text-block="step2-heading">{text('step2-heading')}</h3>{paragraph('given')}{paragraph('needed')}</section>}
      {teaching.step3 && <section className="g3-ts008__step" aria-label="Step 3">{picture()}</section>}
      {teaching.step4 && <section className="g3-ts008__step" aria-label="Step 4">{reasoning()}</section>}
    </div>
    {(canContinue || canHelp) && <div className="g3-ts008__controls">
      {canContinue && <button type="button" disabled={!props.onLessonFrameRequest} onClick={() => dispatch({type:'continue'})}>Continue</button>}
      {canHelp && <button ref={helpTrigger} data-secondary type="button" onClick={() => dispatch({type:'open-help'})}>Help</button>}
    </div>}
    {controllerReady && interaction.help && <dialog ref={dialog} className="g3-ts008__dialog" aria-labelledby={helpHeadingId}
      onKeyDown={event => {if(event.key==='Escape'){event.preventDefault();dispatch({type:'close-help'});}}}
      onCancel={event => {event.preventDefault();dispatch({type:'close-help'});}}>
      <div className="g3-ts008__dialog-actions"><button type="button" autoFocus data-lesson-text-block={interaction.helpView === 'angles' ? 'angle-close' : undefined} onClick={() => dispatch({type:'close-help'})}>Close</button></div>
      {interaction.help === 'picture' ? picture(helpHeadingId) : interaction.help === 'reasoning' ? reasoning(helpHeadingId) : interaction.helpView === 'angles' ? <>
        <h3 id={helpHeadingId} ref={angleReferenceHeading} tabIndex={-1} className="lesson-text-presentation__block lesson-text-presentation__block--heading">Angle reference</h3>
        {G3_L1_TS008_ANGLE_PARAGRAPHS.map(item => paragraph(item.id))}
        <button type="button" onClick={() => dispatch({type:'back-to-place-value'})}>Back to place value</button>
      </> : <>
        {paragraph('help-standard')}{paragraph('help-value')}<h3 id={helpHeadingId} className="lesson-text-presentation__block lesson-text-presentation__block--heading" data-lesson-text-block="help-example">{text('help-example')}</h3>
        {chart(true)}{G3_L1_TS008_PLACES.map((_,index) => paragraph(`help-explanation-${index}`))}
        <button ref={angleReferenceTrigger} type="button" onClick={() => dispatch({type:'open-angle-reference'})}>Angle reference</button>
      </>}
    </dialog>}
  </section>;
}

export const G3_L1_TS008_TEXT_PRESENTATION = Object.freeze({
  schemaVersion: 1,
  binding: G3_L1_TS008_TEXT_BINDING,
  Renderer: G3L1Ts008ModernRenderer,
  getSnapshot: getG3L1Ts008TextSnapshot,
  playbackEndFrameByDomain: Object.freeze({'sprite-348': 295}),
  reducedMotionFrameByDomain: Object.freeze({'sprite-348': 295}),
  frameControl: Object.freeze({frameDomain: DOMAIN, completionFrame: 747, transitions: G3_L1_TS008_FRAME_TRANSITIONS}),
  activityTimelines: G3_L1_TS008_ACTIVITY_TIMELINES,
  sourceTimelineAudioCues: [{id:'source-main',frame:14,endFrame:741,frameDomain:DOMAIN,
    language:'shared',spokenLanguage:'undetermined',
    source:'/lesson-typography-v1/audio/course-g03-l01-ts-008/main.mp3',
    sha256:'78fcfffd24e08884b6655a0f9222c53870626f0cf2971959428111b4ba0bb713'}],
  keyTerms: Object.freeze({indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',
    sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
    entryIds:Object.values(G3_L1_TS008_KEY_TERMS).map(term=>term.entryId)}),
} satisfies LessonTextPresentationCapability<CourseG03L01Ts008FrameState>);
