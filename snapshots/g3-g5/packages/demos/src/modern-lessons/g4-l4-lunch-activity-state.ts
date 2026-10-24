import type {AudioCue, RuntimeContext} from '../contract';
import type {LessonTextBinding, LessonTextInstance, LessonTextKeyTermsCapability, TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';

export interface LunchActivityConfig {
  readonly animationId: string; readonly placementId: string; readonly sourceSwfSha256: string;
  readonly frameDomain: string; readonly rootFrame: number; readonly frameCount: number; readonly fps: number;
  readonly title: Readonly<{id: string; text: string}>; readonly menuTitle: Readonly<{id: string; text: string}>;
  readonly menu: readonly Readonly<{id: string; foodId: string; priceId: string; food: string; price: string; foodCharacterId: number; priceCharacterId: number}>[];
  readonly words: readonly Readonly<{id: string; text: string; visibleFrom: number; sourceStart: number; sourceEnd: number}>[];
  readonly money: Readonly<{id: string; sourceBitmapId: number; text: string; firstFrame: number; lastFrameExclusive: number}>;
  readonly questionPanel: Readonly<{firstFrame: number; sourceShapeIds: readonly number[]}>;
  readonly terms: readonly Readonly<{sourceButtonId: number; sourceKey: string; title: string; entryId: string; wordIndexes: readonly number[]; visibleFrom: number}>[];
  readonly exclusions: readonly (LessonTextInstance & Readonly<{firstFrame: number; lastFrameExclusive: number}>)[];
  readonly adapter: Readonly<{url: string; sha256: string; variantId: string}>;
  readonly sourceAudio: readonly (AudioCue & Readonly<{sha256: string}>)[];
  readonly keyTerms: LessonTextKeyTermsCapability; readonly binding: LessonTextBinding;
  readonly sourceRisksGloballyResolved: false;
}
export type LunchActivityFrameReader = (frame: number, context: RuntimeContext) => SourceStaticCanvasFrameState;

export function getLunchActivitySnapshot(config: LunchActivityConfig, readFrame: LunchActivityFrameReader,
  state: SourceStaticCanvasFrameState, context: RuntimeContext): TextPresentationSnapshot {
  const expected = readFrame(context.frame, context);
  const valid = Boolean(state && state.status === 'ready' && expected.status === 'ready' &&
    state.animationId === config.animationId && state.sourceSwfSha256 === config.sourceSwfSha256 &&
    state.frame === expected.frame && state.frameDomain === config.frameDomain &&
    (context.frameDomain ?? config.frameDomain) === config.frameDomain &&
    state.rootFrame === config.rootFrame && (context.rootFrame ?? config.rootFrame) === config.rootFrame &&
    state.scenario === 'source-static-frame' && context.scenario === state.scenario &&
    state.language === 'en' && context.lang === 'en' && state.seed === expected.seed);
  const frame = expected.frame;
  const content: Record<string, {text: string; visible: boolean}> = {
    [config.title.id]: {text: config.title.text, visible: true},
    [config.menuTitle.id]: {text: config.menuTitle.text, visible: true},
    [config.money.id]: {text: config.money.text, visible: frame >= config.money.firstFrame && frame < config.money.lastFrameExclusive},
  };
  for (const row of config.menu) {
    content[row.foodId] = {text: row.food, visible: true}; content[row.priceId] = {text: row.price, visible: true};
  }
  for (const word of config.words) content[word.id] = {text: word.text, visible: frame >= word.visibleFrom};
  const snapshot = buildLessonTextSnapshot(config.binding, {...context, frame, frameDomain: config.frameDomain,
    rootFrame: config.rootFrame, seed: expected.seed}, content);
  if (!valid || snapshot.status !== 'ready') return Object.freeze({...snapshot, status: 'blocked', blocks: Object.freeze([]), suppressedInstances: Object.freeze([]),
    blockers: Object.freeze(snapshot.blockers.length ? snapshot.blockers : [state?.blocker ?? expected.blocker ?? 'source-frame-identity-mismatch'])});
  return Object.freeze({...snapshot, suppressedInstances: Object.freeze(config.exclusions
    .filter(e => frame >= e.firstFrame && frame < e.lastFrameExclusive).map(({id, path}) => ({id, path})))});
}
