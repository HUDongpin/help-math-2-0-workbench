// Source-retained Canvas pages can use the same glossary release transaction
// without acquiring a native text presentation. Only the exact reviewed source
// configurations below may enter it; hit testing still belongs to the renderer.
import {ButtonObj, MovieClip, type DisplayObject, type Runtime, type Matrix} from './display';
import type {HfrPageMeta, HfrSourceGlossaryTerm} from './types';
import {NMS_L07_CANVAS_GLOSSARY_ENTRIES, NMS_L07_CANVAS_GLOSSARY_SOURCE_BINDINGS, NMS_L07_CANVAS_GLOSSARY_METADATA} from './nms-l07-canvas-glossary-source-binding';

import {DAT_L03_CANVAS_GLOSSARY_ENTRIES, DAT_L03_CANVAS_GLOSSARY_SOURCE_BINDINGS, DAT_L03_CANVAS_GLOSSARY_METADATA} from './dat-l03-canvas-glossary-source-binding';

export interface HfrCanvasGlossaryPlacementState {
  readonly firstFrame: number; readonly lastFrameExclusive: number;
  readonly matrix: readonly number[]; readonly ratio: number;
  readonly cx: readonly number[]; readonly name?: string;
}
export interface HfrCanvasGlossaryPlacement {
  readonly depth: number; readonly firstFrame: number; readonly lastFrameExclusive: number;
  readonly matrix: readonly number[]; readonly ratio: number;
  /** Exact source popup _visible writes also set the runtime scriptMoved flag. */
  readonly sourceVisibilityControlled?: true;
  readonly placementId?: string; readonly states?: readonly HfrCanvasGlossaryPlacementState[];
}
export interface HfrCanvasGlossarySourceBinding {
  readonly animationId: string; readonly sourceSwfSha256: string; readonly dataSha256: string;
  readonly rootFrame: number; readonly rootFrameCount: number; readonly characterId: number; readonly depth: number;
  readonly frames: number; readonly primaryMatrix: readonly number[];
  readonly sourceGlossary: Readonly<{pageKey: string; sourceSha256: string; terms: readonly HfrSourceGlossaryTerm[]}>;
  readonly controls: readonly (HfrSourceGlossaryTerm & HfrCanvasGlossaryPlacement & Readonly<{
    handler: string; hitCharacterId: number; hitBounds: Readonly<{xmin: number; xmax: number; ymin: number; ymax: number}>;
    hitRecord: Readonly<{states: number; charId: number; depth: number; m: readonly number[]; cx: readonly number[]}>;
    ancestors?: readonly (HfrCanvasGlossaryPlacement & Readonly<{characterId: number; frames: number}>)[];
  }>)[];
}
export interface HfrCanvasGlossaryControl extends HfrSourceGlossaryTerm {
  readonly liveButton: ButtonObj;
  /** The authored release stops this primary clip, even from a nested popup. */
  readonly sourceTimeline: MovieClip;
}
const SOURCE_BINDINGS: Readonly<Record<string, HfrCanvasGlossarySourceBinding>> = {
  ...NMS_L07_CANVAS_GLOSSARY_SOURCE_BINDINGS, ...DAT_L03_CANVAS_GLOSSARY_SOURCE_BINDINGS,
};
const SOURCE_METADATA = {...NMS_L07_CANVAS_GLOSSARY_METADATA, ...DAT_L03_CANVAS_GLOSSARY_METADATA};
const SOURCE_ENTRIES = {...NMS_L07_CANVAS_GLOSSARY_ENTRIES, ...DAT_L03_CANVAS_GLOSSARY_ENTRIES};
export function hfrCanvasGlossaryEntries(key: string) {
  return Object.hasOwn(SOURCE_ENTRIES, key) ? SOURCE_ENTRIES[key as keyof typeof SOURCE_ENTRIES] : undefined;
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
  const key=meta.key, binding=key ? SOURCE_BINDINGS[key] : undefined;
  if (!binding) return undefined;
  const expected=SOURCE_METADATA[key!];
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
  const binding = SOURCE_BINDINGS[meta.key], glossary = meta.sourceGlossary;
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
  const main = runtime.page_.children.get(binding.depth);
  if (!(main instanceof MovieClip) || main.rt !== runtime || main.removed || main.scriptMoved || main.clipDepth !== 0 ||
      main.parentClip !== runtime.page_ || main.charId !== binding.characterId || main.def !== runtime.page.dictionary[binding.characterId] ||
      main.depth !== binding.depth || main.name !== 'animation' || main.ratio !== 5 || main.totalFrames !== binding.frames ||
      !sameMatrix(main.m, binding.primaryMatrix) || !sameNumbers(main.cx, [256, 256, 256, 256, 0, 0, 0, 0]) ||
      runtime.page_.def !== runtime.page.root || runtime.page.root.frameCount !== binding.rootFrameCount ||
      runtime.page.root.labels.begin !== binding.rootFrame || runtime.page_.frame !== binding.rootFrame || runtime.page_.playing) return null;
  for (const control of binding.controls) {
    if (control.sourceButtonCharacterId !== button.charId) continue;
    let parent: MovieClip = main, matched = true;
    for (const ancestor of control.ancestors ?? []) {
      const child = parent.children.get(ancestor.depth);
      if (!(child instanceof MovieClip) || child.charId !== ancestor.characterId || child.totalFrames !== ancestor.frames ||
          !matchesPlacement(runtime, child, parent, ancestor)) {matched = false; break;}
      parent = child;
    }
    if (!matched || !matchesPlacement(runtime, button, parent, control)) continue;
    const conditions = button.def.conds, records = button.def.records, expected = control.hitRecord;
    if (!Array.isArray(conditions) || conditions.length !== 1 || conditions[0].b0 !== 8 || conditions[0].b1 !== 0 ||
        conditions[0].script !== control.handler || !Array.isArray(records) || records.length !== 1 ||
        records[0].states !== expected.states || records[0].charId !== expected.charId || records[0].depth !== expected.depth ||
        !sameNumbers(records[0].m, expected.m) || !sameNumbers(records[0].cx, expected.cx)) continue;
    const hit = runtime.page.dictionary[control.hitCharacterId];
    if (hit?.kind !== 'shape' || !hit.bounds ||
        !(['xmin', 'xmax', 'ymin', 'ymax'] as const).every(key => hit.bounds[key] === control.hitBounds[key]) ||
        runtime.topClickableAt(...point) !== button) continue;
    return {...control, liveButton: button, sourceTimeline: main};
  }
  return null;
}

function matchesPlacement(runtime: Runtime, object: DisplayObject, parent: MovieClip, binding: HfrCanvasGlossaryPlacement): boolean {
  if (object.rt !== runtime || object.removed || object.scriptMoved !== Boolean(binding.sourceVisibilityControlled) || object.clipDepth !== 0 ||
      object.parentClip !== parent || parent.children.get(binding.depth) !== object || object.depth !== binding.depth ||
      object.def !== runtime.page.dictionary[object.charId] ||
      parent.frame < binding.firstFrame || parent.frame >= binding.lastFrameExclusive) return false;
  const state = binding.states?.find(value => parent.frame >= value.firstFrame && parent.frame < value.lastFrameExclusive);
  if (binding.states && !state) return false;
  return object.ratio === (state?.ratio ?? binding.ratio) && sameMatrix(object.m, state?.matrix ?? binding.matrix) &&
    sameNumbers(object.cx, state?.cx ?? [256, 256, 256, 256, 0, 0, 0, 0]) &&
    (state?.name === undefined || object.name === state.name);
}
