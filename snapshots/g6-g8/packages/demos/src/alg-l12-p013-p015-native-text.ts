import type {RuntimeContext} from './contract';
import type {LessonTextBinding, LessonTextInstance, TextPresentationSnapshot} from './lesson-text-contract';
import {buildLessonTextSnapshot, lessonTextInstanceId} from './lesson-text-snapshot';
import {PAIR_NATIVE_TEXT_DATA} from './generated/alg-l12-p013-p015-native-text-data';

export type PairAnimationId = 'shared-alg001-l12-p013' | 'shared-alg001-l12-p015';
type Matrix = readonly [number, number, number, number, number, number];
type Rect = readonly [number, number, number, number];
type SourceRun = Readonly<{sourceTextId: string; text: string; sourceGlossaryEntryId: string | null;
  baselineTwips: readonly [number, number]; glyphs: readonly Readonly<{unicode: string; advanceTwips: number}>[]}>;
type Definition = Readonly<{characterId: number; role: string; matrix: Matrix;
  runs: readonly SourceRun[]}>;
type Pose = Readonly<{matrix: Matrix; colorTransform: Readonly<{multiply: readonly number[];
  add: readonly number[]; divisor: number}>; visible: boolean}>;
type Instance = Readonly<{instanceId: string; depth: number; generation: number; characterId: number;
  firstFrame: number; lastFrameExclusive: number; poseSegments: readonly Readonly<{
    firstFrame: number; lastFrameExclusive: number; pose: Pose}>[]}>;
type Mask = Readonly<{textInstanceId: string; maskInstanceId: string; localBoundsTwips: Rect; poseSegments: readonly Readonly<{
  firstFrame: number; lastFrameExclusive: number; pose: Pose}>[]}>;
type Page = Readonly<{animationId: PairAnimationId; source: Readonly<{swfSha256: string}>;
  frameDomain: string; frameCount: number; rootFrame: number;
  rootPlacement: Readonly<{matrix: Matrix; instanceId: string}>;
  title: Readonly<{text: string; characterId: number; instanceId: string;
    depth: number; generation: number}>;
  definitions: readonly Definition[]; instances: readonly Instance[]; masks: readonly Mask[];
  roles: Readonly<{nativeProseCharacterIds: readonly number[]; canvasRetainedTextInstanceIds: readonly string[]}>}>;

const PAGES = PAIR_NATIVE_TEXT_DATA as unknown as Readonly<Record<'p013' | 'p015', Page>>;
const pageFor = (animationId: PairAnimationId): Page => {
  if (animationId === 'shared-alg001-l12-p013') return PAGES.p013;
  if (animationId === 'shared-alg001-l12-p015') return PAGES.p015;
  throw new RangeError(`Unsupported ALG L12 text page: ${animationId}`);
};
const poseAt = (segments: readonly Readonly<{firstFrame: number; lastFrameExclusive: number; pose: Pose}>[], frame: number) =>
  segments.find(item => item.firstFrame <= frame && frame < item.lastFrameExclusive)?.pose ?? null;
const point = (matrix: Matrix, x: number, y: number): readonly [number, number] =>
  [matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5]];
const box = (matrix: Matrix, source: Rect): Rect => {
  const corners = [[source[0], source[1]], [source[0], source[3]],
    [source[2], source[1]], [source[2], source[3]]]
    .map(([x, y]) => point(matrix, x, y));
  return [Math.min(...corners.map(value => value[0])), Math.min(...corners.map(value => value[1])),
    Math.max(...corners.map(value => value[0])), Math.max(...corners.map(value => value[1]))];
};
const opacity = (pose: Pose) => Math.max(0, Math.min(1,
  pose.colorTransform.multiply[3] / pose.colorTransform.divisor + pose.colorTransform.add[3] / 255));
const definitionFor = (page: Page, characterId: number): Definition => {
  const result = page.definitions.find(item => item.characterId === characterId);
  if (!result) throw new Error(`Missing source text character ${characterId}`);
  return result;
};
const pathFor = (page: Page, item: Instance): LessonTextInstance => {
  const root = {timelineId: 'root', depth: 1, generation: 1,
    characterId: Number(page.frameDomain.slice('sprite-'.length))};
  const leaf = {timelineId: page.frameDomain, depth: item.depth,
    generation: item.generation, characterId: item.characterId};
  const path = [root, leaf];
  return {id: lessonTextInstanceId(path), path};
};

function makeBinding(page: Page): LessonTextBinding {
  const prose = page.instances.filter(item => page.roles.nativeProseCharacterIds.includes(item.characterId));
  const titlePath = [{timelineId: 'root', depth: page.title.depth,
    generation: page.title.generation, characterId: page.title.characterId}];
  return {schemaVersion: 1, version: 'alg-l12-glossary-pair-source-native-text-v1',
    placementId: page.animationId, animationId: page.animationId,
    sourceSwfSha256: page.source.swfSha256, template: 'complex-figure',
    blocks: [{id: 'title', sourceTextIds: [], sourceShapeIds: [page.title.characterId],
      role: 'title', language: 'en', readingOrder: 0, valueSource: 'source-static',
      instance: {id: lessonTextInstanceId(titlePath), path: titlePath}},
    ...prose.map((item, readingOrder) => ({id: item.instanceId,
      sourceTextIds: definitionFor(page, item.characterId).runs.map(run => run.sourceTextId),
      role: 'body' as const, language: 'en' as const, readingOrder: readingOrder + 1,
      valueSource: 'source-static' as const,
      instance: pathFor(page, item)}))]};
}
const BINDINGS = Object.freeze({p013: makeBinding(PAGES.p013), p015: makeBinding(PAGES.p015)});

export function pairTextBinding(animationId: PairAnimationId): LessonTextBinding {
  return animationId === 'shared-alg001-l12-p013' ? BINDINGS.p013 :
    animationId === 'shared-alg001-l12-p015' ? BINDINGS.p015 :
      (() => {throw new RangeError(`Unsupported ALG L12 text page: ${animationId}`);})();
}

export interface PairSourceRunView {
  readonly sourceTextId: string;
  readonly text: string;
  readonly fullText: string;
  readonly sourceGlossaryEntryId: string | null;
}
export interface PairProseView {
  readonly instanceId: string;
  readonly characterId: number;
  readonly role: 'body';
  readonly text: string;
  readonly runs: readonly PairSourceRunView[];
  readonly visible: boolean;
  readonly maskInstanceId: string;
  /** This uses source advance rectangles; font-ink edge parity remains unreviewed. */
  readonly revealModel: 'source-mask-advance-rectangle';
}
export interface PairFigureLabelView {
  readonly instanceId: string;
  readonly sourceTextId: string;
  readonly characterId: number;
  readonly role: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly alpha: number;
  readonly rendering: 'source-canvas-retained';
}
export interface PairTextSnapshot extends TextPresentationSnapshot {
  readonly title: Readonly<{text: string; instanceId: string; sourceShapeId: number}>;
  /** Exact source display-list IDs for the native Canvas suppression API. */
  readonly sourceSuppressionInstanceIds: readonly string[];
  readonly prose: readonly PairProseView[];
  readonly figureLabels: readonly PairFigureLabelView[];
  readonly sourceLanguage: 'en';
  readonly rootCompanionShapeStatus: 'native-replaced';
}

function revealRuns(source: Definition, textPose: Pose, mask: Mask, frame: number): readonly PairSourceRunView[] {
  const maskPose = poseAt(mask.poseSegments, frame);
  const bounds = maskPose ? box(maskPose.matrix, mask.localBoundsTwips) : null;
  let blocked = false;
  return source.runs.map(run => {
    let x = run.baselineTwips[0];
    let revealed = '';
    for (const glyph of run.glyphs) {
      const start = point(textPose.matrix, ...point(source.matrix, x, run.baselineTwips[1]))[0];
      const end = point(textPose.matrix, ...point(source.matrix, x + glyph.advanceTwips, run.baselineTwips[1]))[0];
      const middle = (start + end) / 2;
      if (!blocked && bounds && middle >= bounds[0] - 1 && middle <= bounds[2] + 1)
        revealed += glyph.unicode;
      else blocked = true;
      x += glyph.advanceTwips;
    }
    return {sourceTextId: run.sourceTextId, text: revealed, fullText: run.text,
      sourceGlossaryEntryId: run.sourceGlossaryEntryId};
  });
}

/** Pure source-frame projection. Only prose is replaced; graph labels stay in
 * the exact Canvas display list and are listed here for semantic review. */
export function pairTextSnapshot(animationId: PairAnimationId, context: RuntimeContext): PairTextSnapshot {
  const page = pageFor(animationId), frame = context.frame;
  const valid = Number.isSafeInteger(frame) && frame >= 1 && frame <= page.frameCount &&
    context.frameDomain === page.frameDomain && context.rootFrame === page.rootFrame &&
    context.scenario === 'source-static-frame' && context.lang === 'en' &&
    context.seed === 0 && Number.isSafeInteger(context.replay ?? 0) && (context.replay ?? 0) >= 0;
  const values: Record<string, {text: string; visible: boolean}> = {
    title: {text: page.title.text, visible: valid},
  };
  const prose: PairProseView[] = [];
  const active = new Set<string>();
  const sourceSuppressionInstanceIds = [page.title.instanceId];
  for (const item of page.instances.filter(value => page.roles.nativeProseCharacterIds.includes(value.characterId))) {
    const source = definitionFor(page, item.characterId);
    const pose = valid ? poseAt(item.poseSegments, frame) : null;
    const mask = page.masks.find(value => value.textInstanceId === item.instanceId);
    if (!mask) throw new Error(`Missing source mask for ${item.instanceId}`);
    const runs = pose && pose.visible && opacity(pose) > 0 ? revealRuns(source, pose, mask, frame) :
      source.runs.map(run => ({sourceTextId: run.sourceTextId, text: '', fullText: run.text,
        sourceGlossaryEntryId: run.sourceGlossaryEntryId}));
    const text = runs.map(run => run.text).join('');
    const onStage = Boolean(pose) && item.firstFrame <= frame && frame < item.lastFrameExclusive;
    values[item.instanceId] = {text, visible: onStage && Boolean(text.trim())};
    prose.push({instanceId: item.instanceId, characterId: item.characterId, role: 'body',
      text, runs, visible: values[item.instanceId].visible, maskInstanceId: mask.maskInstanceId,
      revealModel: 'source-mask-advance-rectangle'});
    if (onStage) {active.add(pathFor(page, item).id); sourceSuppressionInstanceIds.push(item.instanceId);}
  }
  const binding = pairTextBinding(animationId);
  if (valid) active.add(binding.blocks[0].instance!.id);
  const base = buildLessonTextSnapshot(binding, context, values);
  if (!valid || base.status !== 'ready') return {...base, status: 'blocked', blocks: [],
    suppressedInstances: [], blockers: [...base.blockers, ...(!valid ? ['unsupported-pair-source-context'] : [])],
    title: {text: page.title.text, instanceId: page.title.instanceId,
    sourceShapeId: page.title.characterId}, sourceSuppressionInstanceIds: [],
    prose: [], figureLabels: [], sourceLanguage: 'en',
      rootCompanionShapeStatus: 'native-replaced'};
  const figureLabels: PairFigureLabelView[] = page.instances
    .filter(item => !page.roles.nativeProseCharacterIds.includes(item.characterId))
    .flatMap(item => {
      const pose = poseAt(item.poseSegments, frame);
      if (!pose || !pose.visible || opacity(pose) <= 0) return [];
      const source = definitionFor(page, item.characterId);
      return source.runs.map(run => {
        const local = point(source.matrix, ...run.baselineTwips);
        const sprite = point(pose.matrix, ...local);
        const stage = point(page.rootPlacement.matrix, ...sprite);
        return {instanceId: item.instanceId, sourceTextId: run.sourceTextId,
          characterId: item.characterId, role: source.role, text: run.text,
          x: stage[0] / 20, y: stage[1] / 20, alpha: opacity(pose),
          rendering: 'source-canvas-retained' as const};
      });
    });
  return {...base, suppressedInstances: base.suppressedInstances.filter(item => active.has(item.id)),
    title: {text: page.title.text, instanceId: page.title.instanceId,
      sourceShapeId: page.title.characterId},
    sourceSuppressionInstanceIds, prose, figureLabels, sourceLanguage: 'en',
    rootCompanionShapeStatus: 'native-replaced'};
}
