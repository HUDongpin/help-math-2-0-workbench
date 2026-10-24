import {initializeP027ReducedMotion,P027_REDUCED} from './nms-l11-p027-reduced-motion';
import {initializeP026ReducedMotion,P026_REDUCED} from './nms-l11-p026-reduced-motion';
import {initializeP022ReducedMotion,P022_REDUCED} from './nms-l11-p022-reduced-motion';
import {initializeP020ReducedMotion,P020_REDUCED} from './nms-l11-p020-reduced-motion';
import {initializeP019ReducedMotion,P019_REDUCED} from './nms-l11-p019-reduced-motion';
import {initializeP014ReducedMotion,P014_REDUCED} from './nms-l11-p014-reduced-motion';
import {initializeP010ReducedMotion} from './nms-l11-p010-reduced-motion';
import {initializeP009ReducedMotion} from './nms-l11-p009-reduced-motion';
import {P010_NATIVE} from './nms-l11-p010-native-binding';
import {P009_NATIVE} from './nms-l11-p009-native-binding';
import {ButtonObj, MovieClip, type Runtime, type DisplayObject} from './display';
import type {HfrJoinedQuestionDecision, HfrStyledSentenceDecision, HfrVocabularyDecision} from './hfr-native-text';
import {HFR_VOCABULARY_SOURCE_BINDINGS} from './vocabulary-source-bindings';
import {GEO_L03_P007_LOOP_SENTENCE} from './geo-l03-p007-loop-source-binding';
import {ALG_L02_P007_STYLED_SENTENCE} from './alg-l02-p007-styled-sentence-source-binding';
import {L8_P006_STYLED_SENTENCE} from './p006-styled-sentence-source-binding';
import {NMS_L06_P005_JOINED_QUESTION} from './nms-l06-p005-joined-source-binding';
import {NMS_L11_P005_JOINED_QUESTION} from './nms-l11-p005-joined-source-binding';

interface HfrReducedMotionBinding {
  readonly kind: 'source-readable-static-state-v1';
  readonly sourceSha256: string;
  readonly frameDomain: string;
  readonly frame: number;
  readonly rootFrame: number;
  readonly maximumInitializationTicks: number;
}
export type HfrReducedMotionState = HfrReducedMotionBinding & (
  | Readonly<{sourceBehavior:'audited-source-drag-practice';animationId:string;dataSha256:string}>
  | Readonly<{sourceBehavior: 'audited-source-practice-question'; animationId:string; dataSha256:string}>
  | Readonly<{sourceBehavior: 'audited-noninteractive-introduction'}>
  | Readonly<{sourceBehavior: 'audited-source-statement-glossary'; animationId: string; dataSha256: string}>
  | Readonly<{sourceBehavior: 'audited-looping-source-vocabulary'; animationId: string; dataSha256: string}>
  | Readonly<{sourceBehavior: 'audited-stopped-source-vocabulary'; animationId: string; dataSha256: string; terminalActionSha256: string}>
  | Readonly<{sourceBehavior: 'audited-looping-source-statement-glossary'; animationId: string; dataSha256: string}>
);

type HfrPracticeReducedMotion = (rt: Runtime, state: unknown, validatedDataSha256?: string) => void;
/** Each practice page validates its own exact state; this only routes to the page that owns it. */
const HFR_PRACTICE_REDUCED_MOTION: readonly (readonly [Readonly<{sourceBehavior: string; animationId: string}>, HfrPracticeReducedMotion])[] = [
  [P027_REDUCED, initializeP027ReducedMotion],
  [P026_REDUCED, initializeP026ReducedMotion],
  [P014_REDUCED, initializeP014ReducedMotion], [P022_REDUCED, initializeP022ReducedMotion],
  [P009_NATIVE.reducedMotion, initializeP009ReducedMotion], [P010_NATIVE.reducedMotion, initializeP010ReducedMotion],
  [P019_REDUCED, initializeP019ReducedMotion], [P020_REDUCED, initializeP020ReducedMotion],
];

/** The source facts one readable state is checked against, read from the page's
 * own reviewed binding: its primary clip, readable frame and glossary controls. */
export interface HfrReducedMotionSource {
  readonly animationId: string; readonly sourceSwfSha256: string; readonly candidateJsonSha256: string;
  readonly timeline: number; readonly rootFrame: number; readonly primaryDepth: number; readonly frames: number;
  readonly readableFrame: number; readonly firstButtonFrame: number;
  readonly controls: readonly {readonly characterId: number; readonly hitCharacterId: number; readonly depths: readonly number[]}[];
}
const spriteId = (domain: string): number => Number(/^sprite-(\d+)$/u.exec(domain)?.[1] ?? NaN);
/** Depth of the instance `…/sprite-<timeline>:<depth>:<generation>:<character>`. */
const placedDepth = (instanceId: string, timeline: number, character: number): number => {
  const m = /(?:^|\/)sprite-(\d+):(\d+):\d+:(\d+)$/u.exec(instanceId);
  return m && Number(m[1]) === timeline && Number(m[3]) === character ? Number(m[2]) : NaN;
};
/** Depth of the primary placement `root:<depth>:<generation>:<timeline>/…`. */
const rootDepth = (instanceId: string, timeline: number): number => {
  const m = /^root:(\d+):\d+:(\d+)\//u.exec(instanceId);
  return m && Number(m[2]) === timeline ? Number(m[1]) : NaN;
};
function vocabularySource(b: HfrVocabularyDecision): HfrReducedMotionSource {
  const timeline = spriteId(b.frameDomain);
  return {animationId: b.animationId, sourceSwfSha256: b.sourceSwfSha256, candidateJsonSha256: b.candidateJsonSha256, timeline, rootFrame: b.rootFrame,
    primaryDepth: b.primaryDepth, frames: b.mainFrames, readableFrame: b.readableFrame, firstButtonFrame: b.firstButtonFrame,
    controls: b.controls.map(c => ({characterId: c.sourceButtonCharacterId, hitCharacterId: c.hitCharacterId, depths: [placedDepth(c.instanceId, timeline, c.sourceButtonCharacterId)]}))};
}
/** A joined question names no first-button frame; the authored placement check still applies. */
function joinedSource(b: HfrJoinedQuestionDecision, looping: boolean): HfrReducedMotionSource {
  const timeline = spriteId(b.frameDomain);
  return {animationId: b.animationId, sourceSwfSha256: b.sourceSwfSha256, candidateJsonSha256: b.candidateJsonSha256, timeline, rootFrame: b.rootFrame,
    primaryDepth: b.primaryDepth, frames: b.mainFrames, readableFrame: looping ? b.firstCompleteFrame : b.lastCompleteFrame, firstButtonFrame: 1,
    controls: b.controls.map(c => ({characterId: c.sourceButtonCharacterId, hitCharacterId: c.hitCharacterId,
      depths: (c.sourceInstanceIds ?? [c.instanceId]).map(id => placedDepth(id, timeline, c.sourceButtonCharacterId))}))};
}
function styledSource(b: HfrStyledSentenceDecision, looping: boolean): HfrReducedMotionSource | null {
  const timeline = spriteId(b.sourceFrameDomain), interaction = b.sourceInteraction;
  return interaction ? {animationId: b.animationId, sourceSwfSha256: b.sourceSwfSha256, candidateJsonSha256: b.candidateJsonSha256, timeline, rootFrame: b.rootFrame,
    primaryDepth: rootDepth(b.sourceTextInstanceId, timeline), frames: b.lastCompleteFrame, readableFrame: looping ? b.firstCompleteFrame : b.lastCompleteFrame,
    firstButtonFrame: interaction.firstFrame, controls: b.controls.map(c => ({characterId: c.sourceButtonCharacterId, hitCharacterId: interaction.hitCharacterId,
      depths: (interaction.controlInstanceIds[c.sourceButtonCharacterId] ?? []).map(id => placedDepth(id, timeline, c.sourceButtonCharacterId))}))} : null;
}
const HFR_STYLED_SENTENCE_BINDINGS: readonly HfrStyledSentenceDecision[] = [GEO_L03_P007_LOOP_SENTENCE, ALG_L02_P007_STYLED_SENTENCE, L8_P006_STYLED_SENTENCE];
const HFR_JOINED_QUESTION_BINDINGS: readonly HfrJoinedQuestionDecision[] = [NMS_L06_P005_JOINED_QUESTION, NMS_L11_P005_JOINED_QUESTION];
/** Registered before this rule. L7 P005's styled-sentence binding lives inside
 * hfr-native-text.ts and carries no sourceInteraction, so its reviewed values are
 * kept here unchanged. A new page's binding carries them; do not add pages. */
export const HFR_REDUCED_MOTION_REGISTERED_SOURCES: Readonly<Record<string, HfrReducedMotionSource>> = {
  'shared-nms002-l07-p005': {animationId: 'shared-nms002-l07-p005', sourceSwfSha256: '52e001516750770e9e3f406d2f49bc1deecee438e4c37c1efae1080058c3fba4',
    candidateJsonSha256: '4b8a4a279f94efd0d56fcec3c831f61f705a1e2aab5abaeed629f7353cc6ebee', timeline: 40, rootFrame: 6, primaryDepth: 1, frames: 157,
    readableFrame: 157, firstButtonFrame: 93, controls: [{characterId: 38, hitCharacterId: 37, depths: [88]}, {characterId: 39, hitCharacterId: 37, depths: [90]}]},
};
function hfrReducedMotionSource(state: HfrReducedMotionState, looping: boolean): HfrReducedMotionSource | null {
  if (state.sourceBehavior === 'audited-looping-source-vocabulary' || state.sourceBehavior === 'audited-stopped-source-vocabulary') {
    const vocabulary = Object.hasOwn(HFR_VOCABULARY_SOURCE_BINDINGS, state.animationId) ? HFR_VOCABULARY_SOURCE_BINDINGS[state.animationId] : undefined;
    return vocabulary && vocabulary.animationId === state.animationId ? vocabularySource(vocabulary) : null;
  }
  if (state.sourceBehavior !== 'audited-source-statement-glossary' && state.sourceBehavior !== 'audited-looping-source-statement-glossary') return null;
  const styled = HFR_STYLED_SENTENCE_BINDINGS.find(b => b.animationId === state.animationId);
  const joined = HFR_JOINED_QUESTION_BINDINGS.find(b => b.animationId === state.animationId);
  return styled ? styledSource(styled, looping) : joined ? joinedSource(joined, looping) :
    Object.hasOwn(HFR_REDUCED_MOTION_REGISTERED_SOURCES, state.animationId) ? HFR_REDUCED_MOTION_REGISTERED_SOURCES[state.animationId] : null;
}
/** sha256 of the DoAction body `stop()` (ActionStop 0x07, ActionEndFlag 0x00); a property of the bytecode, not of a page. */
const SOURCE_STOP_ACTION_SHA256 = '0a6361b3a802f55cd5ae06101c88a1e216320fe11cc0cfe1d791eed08a1200fd';
type AuthoredTag = {readonly op: string; readonly depth?: number; readonly charId?: number; readonly script?: string};


/** Run original initialization silently to one audited readable state. Never seek an interactive answer. */
export function initializeHfrReducedMotion(rt: Runtime, state: HfrReducedMotionState, validatedDataSha256?: string): void {
  if (state.sourceBehavior === 'audited-source-drag-practice' || state.sourceBehavior === 'audited-source-practice-question') {
    const route = HFR_PRACTICE_REDUCED_MOTION.find(([owned]) => owned.sourceBehavior === state.sourceBehavior && owned.animationId === state.animationId);
    if (!route) throw new Error('HFR_REDUCED_MOTION_PRACTICE_BINDING_INVALID');
    route[1](rt, state, validatedDataSha256);
    return;
  }
  const statement = state.sourceBehavior !== 'audited-noninteractive-introduction';
  const looping = state.sourceBehavior === 'audited-looping-source-vocabulary' || state.sourceBehavior === 'audited-looping-source-statement-glossary';
  // Each source is one exact audited source state; this is not a general page seek.
  const source = statement ? hfrReducedMotionSource(state, looping) : null;
  const primary = source ? rt.page.dictionary[source.timeline] : undefined;
  const authoredFrames: readonly (readonly AuthoredTag[])[] | null =
    source && primary?.kind === 'sprite' && Array.isArray(primary.frames) && primary.frames.length === source.frames ? primary.frames : null;
  // A looping state's primary clip has no authored frame action, so it can only wrap. A stopped
  // state's only authored frame action is on that clip's final frame, which is the readable frame.
  const actions = authoredFrames?.flatMap((tags, index) => tags.filter(tag => tag.op === 'action').map(tag => ({frame: index + 1, script: tag.script}))) ?? null;
  const authoredEnd = source !== null && actions !== null && (looping ? actions.length === 0 : actions.length === 1 &&
    actions[0].frame === source.frames && source.readableFrame === source.frames && actions[0].script === `sprite${source.timeline}_frame${source.frames}`);
  if (state.sourceBehavior === 'audited-stopped-source-vocabulary' && (state.terminalActionSha256 !== SOURCE_STOP_ACTION_SHA256 || !authoredEnd)) {
    throw new Error('HFR_REDUCED_MOTION_STOP_BINDING_INVALID');
  }
  if (state.sourceBehavior !== 'audited-noninteractive-introduction' && (!source || !authoredEnd || state.animationId !== source.animationId ||
      rt.page.placement.animationId !== state.animationId || state.sourceSha256 !== source.sourceSwfSha256 || state.dataSha256 !== source.candidateJsonSha256 ||
      validatedDataSha256 !== state.dataSha256 || state.frameDomain !== `sprite-${source.timeline}` || state.frame !== source.readableFrame ||
      state.rootFrame !== source.rootFrame || state.maximumInitializationTicks !== source.readableFrame ||
      rt.page.root.frameCount !== 10 || rt.page.root.labels.begin !== source.rootFrame || rt.page.stage.fps !== 12 || primary.frameCount !== source.frames)) {
    throw new Error('HFR_REDUCED_MOTION_STATEMENT_BINDING_INVALID');
  }
  const authored = new Map<number, ReadonlyMap<number, number>>();
  /** The character the validated source timeline of the primary clip places at each depth on `frame`. */
  const authoredAt = (frame: number): ReadonlyMap<number, number> => {
    let placed = authored.get(frame);
    if (!placed) {
      const next = new Map<number, number>();
      for (const tags of authoredFrames!.slice(0, frame)) for (const tag of tags) {
        if (tag.op === 'remove') next.delete(tag.depth!); else if (tag.op === 'place' && tag.charId !== undefined) next.set(tag.depth!, tag.charId);
      }
      authored.set(frame, placed = next);
    }
    return placed;
  };
  const ownGlossaryButton = (object: DisplayObject): boolean => {
    const control = source?.controls.find(c => c.characterId === object.charId), parent = object.parentClip;
    if (!source || !control || !(object instanceof ButtonObj) || object.def !== rt.page.dictionary[object.charId] ||
        !(parent instanceof MovieClip) || parent.charId !== source.timeline || parent.parentClip !== rt.page_ || parent.depth !== source.primaryDepth ||
        parent.children.get(object.depth) !== object || parent.frame < source.firstButtonFrame) return false;
    // Each control sits where the source timeline places it on this frame, at one of its reviewed
    // instances. L8's source replaces all three controls at frame155: depths71/73/75 become65/67/69.
    if (!control.depths.includes(object.depth) || authoredAt(parent.frame).get(object.depth) !== object.charId) return false;
    const definition = object.def, conditions = definition.conds;
    return definition.kind === 'button' && conditions?.length === 1 && conditions[0].b0 === 8 && conditions[0].b1 === 0 &&
      conditions[0].script === `button${object.charId}_release` && definition.records?.length === 1 &&
      definition.records[0].states === 8 && definition.records[0].charId === control.hitCharacterId && definition.records[0].depth === 1;
  };
  if (state.kind !== 'source-readable-static-state-v1' ||
      state.sourceSha256 !== rt.page.source.sha256 || !Number.isSafeInteger(state.frame) || state.frame < 1 ||
      !Number.isSafeInteger(state.rootFrame) || state.rootFrame < 1 || state.rootFrame > rt.page.root.frameCount ||
      !Number.isSafeInteger(state.maximumInitializationTicks) || state.maximumInitializationTicks < 1 || state.maximumInitializationTicks > 10000 ||
      !/^(root|sprite-[1-9]\d*)$/u.test(state.frameDomain)) throw new Error('HFR_REDUCED_MOTION_BINDING_INVALID');
  const timeline = state.frameDomain === 'root' ? 0 : Number(state.frameDomain.slice('sprite-'.length));
  const frameCount = timeline === 0 ? rt.page.root.frameCount : rt.page.dictionary[timeline]?.kind === 'sprite' ? rt.page.dictionary[timeline].frameCount : 0;
  if (state.frame > frameCount) throw new Error('HFR_REDUCED_MOTION_DOMAIN_INVALID');
  if (rt.audio) throw new Error('HFR_REDUCED_MOTION_REQUIRES_SILENT_RUNTIME');
  for (let step = 0; step <= state.maximumInitializationTicks; step++) {
    if (rt.errors.length || rt.keyListeners.length || rt.mouseListeners.length || rt.allObjects().some((object) => rt.isClickable(object) && (!statement || !ownGlossaryButton(object)))) {
      throw new Error('HFR_REDUCED_MOTION_INTERACTION_OR_RUNTIME_ERROR');
    }
    const clips = timeline === 0 ? [rt.page_] : rt.allObjects().filter((object): object is MovieClip => object instanceof MovieClip && object.charId === timeline && !object.removed);
    if (clips.length > 1) throw new Error('HFR_REDUCED_MOTION_DOMAIN_AMBIGUOUS');
    if (clips[0]?.frame === state.frame && rt.page_.frame === state.rootFrame) {
      if (statement && ((looping ? !clips[0].playing : clips[0].playing) || rt.page_.playing || rt.clickables().length !== source!.controls.length)) {
        throw new Error(looping ? 'HFR_REDUCED_MOTION_LOOPING_STATE_INVALID' : 'HFR_REDUCED_MOTION_STATEMENT_TERMINAL_INVALID');
      }
      // Looping states retain their loop flag; stopped states retain their authored terminal stop. The player holds static clock/audio.
      return;
    }
    if (step < state.maximumInitializationTicks) rt.tick();
  }
  throw new Error('HFR_REDUCED_MOTION_STATE_UNREACHABLE');
}
