// Source-retained Canvas pages can use the same glossary release transaction
// without acquiring a native text presentation. Only the exact reviewed source
// configurations below may enter it; hit testing still belongs to the renderer.
import {ButtonObj, MovieClip, type DisplayObject, type Runtime, type Matrix} from './display';
import type {HfrPageMeta, HfrSourceGlossaryTerm} from './types';
import {NMS_L07_CANVAS_GLOSSARY_SOURCE_BINDINGS, NMS_L07_CANVAS_GLOSSARY_METADATA} from './nms-l07-canvas-glossary-source-binding';

export interface HfrCanvasGlossaryControl extends HfrSourceGlossaryTerm {
  readonly liveButton: ButtonObj;
}

const sameNumbers = (actual: readonly number[] | undefined, expected: readonly number[]): boolean =>
  Array.isArray(actual) && actual.length === expected.length && actual.every((value, i) => value === expected[i]);
const sameMatrix = (actual: Matrix, expected: readonly number[]): boolean =>
  sameNumbers([actual.a, actual.b, actual.c, actual.d, actual.tx, actual.ty], expected);
const sameTerm = (actual: HfrSourceGlossaryTerm, expected: HfrSourceGlossaryTerm): boolean =>
  actual.sourceButtonCharacterId === expected.sourceButtonCharacterId && actual.sourceButtonTagSha256 === expected.sourceButtonTagSha256 &&
  actual.sourceActionSha256 === expected.sourceActionSha256 && actual.sourceKeyAttribute === expected.sourceKeyAttribute &&
  actual.dictionaryEntryId === expected.dictionaryEntryId;

/** Bind only the calibrated retained source; never mutate a generated module's metadata. */
export function hfrCanvasGlossaryBinding(meta: Readonly<Partial<HfrPageMeta>>) {
  const key=meta.key, binding=key ? NMS_L07_CANVAS_GLOSSARY_SOURCE_BINDINGS[key] : undefined;
  if (!binding) return undefined;
  const expected=NMS_L07_CANVAS_GLOSSARY_METADATA[key!];
  for (const field of ['key','lessonKey','sourceSha256','compiler','sourceRootFrameCount','progressTimeline','progressFrameCount','completionMode','hasSpanishNarration'] as const) {
    if (meta[field]!==expected[field]) throw new Error('HFR_CANVAS_GLOSSARY_METADATA_MISMATCH:'+field);
  }
  if (!meta.stage || !expected.stage || !(['width','height','fps'] as const).every(field=>meta.stage![field]===expected.stage![field]))
    throw new Error('HFR_CANVAS_GLOSSARY_STAGE_MISMATCH');
  const own=meta.sourceGlossary;
  if (own && (own.pageKey!==binding.animationId || own.sourceSha256!==binding.sourceSwfSha256 ||
      own.terms.length!==binding.sourceGlossary.terms.length || !own.terms.every((term,i)=>sameTerm(term,binding.sourceGlossary.terms[i]))))
    throw new Error('HFR_CANVAS_GLOSSARY_CONFLICT');
  return binding;
}

export function withHfrCanvasGlossary(meta: HfrPageMeta): HfrPageMeta {
  const binding=hfrCanvasGlossaryBinding(meta);
  return binding ? {...meta,sourceGlossary:binding.sourceGlossary} : meta;
}

/** The caller owns the current renderer/session/visibility check. A non-null
 * result describes the present source button only; it does not execute source
 * actions, advance clocks, synthesize a keyboard event, or open the host. */
export function resolveHfrCanvasGlossaryControl(
  meta: HfrPageMeta, runtime: Runtime, button: DisplayObject,
  point: readonly [number, number] | null, validatedDataSha256: string | null,
): HfrCanvasGlossaryControl | null {
  const binding = NMS_L07_CANVAS_GLOSSARY_SOURCE_BINDINGS[meta.key], glossary = meta.sourceGlossary;
  if (!binding || !glossary || validatedDataSha256 !== binding.dataSha256 ||
      meta.key !== binding.animationId || meta.sourceSha256 !== binding.sourceSwfSha256 ||
      runtime.page.placement.animationId !== binding.animationId || runtime.page.source.sha256 !== binding.sourceSwfSha256 ||
      meta.progressTimeline !== binding.characterId || meta.progressFrameCount !== binding.frames ||
      meta.sourceRootFrameCount !== binding.rootFrameCount || runtime.page.stage.fps !== 12 ||
      glossary.pageKey !== binding.animationId || glossary.sourceSha256 !== binding.sourceSwfSha256 ||
      glossary.terms.length !== binding.sourceGlossary.terms.length ||
      !glossary.terms.every((term, i) => sameTerm(term, binding.sourceGlossary.terms[i])) ||
      point === null || point.length !== 2 || !point.every(Number.isFinite) ||
      point[0] < 0 || point[1] < 0 || point[0] > runtime.page.stage.width || point[1] > runtime.page.stage.height ||
      !(button instanceof ButtonObj) || button.rt !== runtime || button.removed || button.scriptMoved || button.clipDepth !== 0 ||
      !runtime.allObjects().includes(button) || !runtime.isClickable(button)) return null;
  const control = binding.controls.find(term => term.sourceButtonCharacterId === button.charId), clip = button.parentClip;
  if (!control || !(clip instanceof MovieClip) || clip.rt !== runtime || clip.removed || clip.scriptMoved ||
      clip !== runtime.page_.children.get(binding.depth) || clip.parentClip !== runtime.page_ ||
      clip.charId !== binding.characterId || clip.def !== runtime.page.dictionary[binding.characterId] ||
      clip.depth !== binding.depth || clip.name !== 'animation' || clip.ratio !== 5 ||
      clip.totalFrames !== binding.frames || clip.frame < control.firstFrame || clip.frame >= control.lastFrameExclusive ||
      !sameMatrix(clip.m, binding.primaryMatrix) ||
      runtime.page_.def !== runtime.page.root || runtime.page.root.frameCount !== binding.rootFrameCount ||
      runtime.page.root.labels.begin !== binding.rootFrame || runtime.page_.frame !== binding.rootFrame || runtime.page_.playing ||
      button !== clip.children.get(control.depth) || button.def !== runtime.page.dictionary[button.charId] ||
      button.depth !== control.depth || button.ratio !== control.ratio || !sameMatrix(button.m, control.matrix) ||
      !sameNumbers(button.cx, [256, 256, 256, 256, 0, 0, 0, 0])) return null;
  const conditions = button.def.conds, records = button.def.records, expected = control.hitRecord;
  if (!Array.isArray(conditions) || conditions.length !== 1 || conditions[0].b0 !== 8 || conditions[0].b1 !== 0 ||
      conditions[0].script !== control.handler || !Array.isArray(records) || records.length !== 1 ||
      records[0].states !== expected.states || records[0].charId !== expected.charId || records[0].depth !== expected.depth ||
      !sameNumbers(records[0].m, expected.m) || !sameNumbers(records[0].cx, expected.cx)) return null;
  const hit = runtime.page.dictionary[control.hitCharacterId];
  if (hit?.kind !== 'shape' || !hit.bounds ||
      !(['xmin', 'xmax', 'ymin', 'ymax'] as const).every(key => hit.bounds[key] === control.hitBounds[key]) ||
      runtime.topClickableAt(...point) !== button) return null;
  return {...control, liveButton: button};
}
