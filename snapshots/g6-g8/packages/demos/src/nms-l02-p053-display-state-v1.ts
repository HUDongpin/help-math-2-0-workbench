/** Structural P053 display-list projection. The caller supplies the pinned
 * visual-scene JSON; this browser-safe module never imports or fetches it.
 * Frames, placement and masks are source facts, not executed AVM1 visibility. */

export type P053Matrix = readonly [number, number, number, number, number, number];
export type P053Color = Readonly<{
  multiply: readonly [number, number, number, number];
  add: readonly [number, number, number, number];
  divisor: 256;
}>;
export type P053Name = Readonly<{text: string | null; decodeStatus: string;
  rawSha256: string; rawHex: string | null}>;
export type P053Place = Readonly<{
  kind: 'place'; eventId: string; frame: number; depth: number;
  instanceId: string; sourceTagSha256: string; move: boolean;
  characterId?: number; matrix?: P053Matrix; colorTransform?: P053Color;
  clipDepth?: number; ratio?: number; name?: P053Name;
  clipActions?: Readonly<{bytes: number; sha256: string; execution: string}>;
  // These require separate renderer/behavior review if encountered.
  visible?: boolean; blendMode?: number; filters?: unknown;
  cacheAsBitmap?: unknown; backgroundColorRgba?: unknown;
}>;
export type P053Remove = Readonly<{
  kind: 'remove'; eventId: string; frame: number; depth: number;
  instanceId: string; sourceTagSha256: string;
}>;
export type P053ActionOrLabel = Readonly<{
  kind: 'action-bytes' | 'frame-label'; eventId: string; frame: number;
  sourceTagSha256: string;
}>;
export type P053Event = P053Place | P053Remove | P053ActionOrLabel;
export type P053InstanceRecord = Readonly<{
  instanceId: string; timelineId: string; depth: number; generation: number;
  characterId: number; firstFrame: number; lastFrameExclusive: number;
  createdByEventId: string; updates: readonly string[];
}>;
export type P053MaskRecord = Readonly<{
  instanceId: string; characterId: number; depth: number; clipDepth: number;
  firstFrame: number; lastFrameExclusive: number; sourceTagSha256: string;
}>;
export type P053Domain = Readonly<{
  id: string; declaredFrameCount: number; observedFrameCount: number;
  events: readonly P053Event[]; instances: readonly P053InstanceRecord[];
  masks: readonly P053MaskRecord[];
}>;
export type P053VisualScene = Readonly<{
  schemaVersion: 1; kind: 'nms-l02-p053-visual-scene-source-v1';
  animationId: 'shared-nms002-l02-p053';
  source: Readonly<{sha256: string; rootFrames: number}>;
  rootPlacement: Readonly<{rootFrame: number; depth: number;
    characterId: number; instanceId: string}>;
  mainFrameDomain: Readonly<{id: 'sprite-187'; declaredFrames: 694;
    heldFrame: 693; heldActionTagSha256: string; nextDeclaredFrame: 694;
    nextFrameAutoReachedEstablished: false}>;
  definitions: Readonly<{
    shapes: readonly Readonly<{characterId: number}>[];
    bitmaps: readonly Readonly<{characterId: number}>[];
    texts: readonly Readonly<{characterId: number}>[];
    sprites: readonly Readonly<{characterId: number; domainId: string}>[];
    buttons: readonly Readonly<{characterId: number}>[];
  }>;
  domains: readonly P053Domain[];
}>;
/** Compact generator output may carry additional source text/metadata fields. */
export type P053DisplayScene = P053VisualScene;
export type P053DefinitionKind = 'shape' | 'bitmap' | 'text' | 'sprite' | 'button';
export type P053DisplayInstance = Readonly<{
  instanceId: string; generation: number; depth: number; characterId: number;
  definitionKind: P053DefinitionKind; childDomain: string | null;
  matrix: P053Matrix; colorTransform: P053Color; clipDepth: number | null;
  sourceMaskInstanceIds: readonly string[];
  name: P053Name | null; ratio: number | null;
  clipActionsSha256: string | null;
}>;
export type P053DomainSnapshot = Readonly<{
  domainId: string; requestedFrame: number; frame: number;
  mode: 'playback' | 'structural'; sourceStaticOnly: true;
  instances: readonly P053DisplayInstance[];
}>;
export type P053NestedInstance = Readonly<P053DisplayInstance & {
  instancePath: string; worldMatrix: P053Matrix; worldColorTransform: P053Color;
  sourceMaskPaths: readonly string[];
  child: P053NestedSnapshot | null;
}>;
export type P053NestedSnapshot = Readonly<{
  domainId: string; requestedFrame: number; frame: number;
  mode: 'playback' | 'structural'; sourceStaticOnly: true;
  instances: readonly P053NestedInstance[];
}>;

const SOURCE_SHA = 'f42f6a4759759561035a7c97e7392241513d0410d69214af422425ef37523fdf';
const HELD_ACTION_SHA = 'd12396116fd8ca67d73447927819dc614493bdad77cf78531ba3fdb7484bdbd1';
const IDENTITY_MATRIX: P053Matrix = [1, 0, 0, 1, 0, 0];
const IDENTITY_COLOR: P053Color = {multiply: [256, 256, 256, 256],
  add: [0, 0, 0, 0], divisor: 256};
function requireSource(scene: P053VisualScene): void {
  if (scene?.schemaVersion !== 1 || scene.kind !== 'nms-l02-p053-visual-scene-source-v1' ||
      scene.animationId !== 'shared-nms002-l02-p053' || scene.source?.sha256 !== SOURCE_SHA ||
      scene.source.rootFrames !== 10 || scene.rootPlacement?.rootFrame !== 6 ||
      scene.rootPlacement.depth !== 3 || scene.rootPlacement.characterId !== 187 ||
      scene.rootPlacement.instanceId !== 'root/depth-3/generation-1' ||
      scene.mainFrameDomain?.id !== 'sprite-187' || scene.mainFrameDomain.declaredFrames !== 694 ||
      scene.mainFrameDomain.heldFrame !== 693 ||
      scene.mainFrameDomain.heldActionTagSha256 !== HELD_ACTION_SHA ||
      scene.mainFrameDomain.nextDeclaredFrame !== 694 ||
      scene.mainFrameDomain.nextFrameAutoReachedEstablished !== false) {
    throw Error('P053_SOURCE_SCENE_IDENTITY');
  }
}
function definitions(scene: P053VisualScene): Map<number, {kind: P053DefinitionKind; child: string | null}> {
  const result = new Map<number, {kind: P053DefinitionKind; child: string | null}>();
  for (const kind of ['shapes', 'bitmaps', 'texts', 'sprites', 'buttons'] as const) {
    for (const item of scene.definitions[kind]) {
      if (!Number.isSafeInteger(item.characterId) || result.has(item.characterId))
        throw Error('P053_SOURCE_DEFINITION_DRIFT');
      result.set(item.characterId, {kind: kind.slice(0, -1) as P053DefinitionKind,
        child: kind === 'sprites' ? (item as {domainId: string}).domainId : null});
    }
  }
  return result;
}
function validMatrix(value: P053Matrix): boolean {
  return Array.isArray(value) && value.length === 6 && value.every(Number.isFinite);
}
function validColor(value: P053Color): boolean {
  return value?.divisor === 256 && value.multiply?.length === 4 &&
    value.add?.length === 4 && [...value.multiply, ...value.add].every(Number.isFinite);
}
function composeMatrix(parent: P053Matrix, child: P053Matrix): P053Matrix {
  const [a,b,c,d,tx,ty] = parent, [e,f,g,h,x,y] = child;
  return [a*e+c*f,b*e+d*f,a*g+c*h,b*g+d*h,a*x+c*y+tx,b*x+d*y+ty];
}
function composeColor(parent: P053Color, child: P053Color): P053Color {
  const multiply = [0,1,2,3].map(i => parent.multiply[i]! * child.multiply[i]! / 256) as
    unknown as P053Color['multiply'];
  const add = [0,1,2,3].map(i => parent.multiply[i]! * child.add[i]! / 256 + parent.add[i]!) as
    unknown as P053Color['add'];
  return {multiply, add, divisor: 256};
}
function domainFor(scene: P053VisualScene, id: string): P053Domain {
  const matches = scene.domains.filter(item => item.id === id);
  if (matches.length !== 1) throw Error(`P053_UNKNOWN_FRAME_DOMAIN:${id}`);
  return matches[0]!;
}
function frameFor(scene: P053VisualScene, domain: P053Domain, frame: number,
  mode: 'playback' | 'structural'): number {
  if (mode !== 'playback' && mode !== 'structural') throw Error('P053_FRAME_MODE');
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > domain.declaredFrameCount)
    throw Error(`P053_FRAME_OUT_OF_DOMAIN:${domain.id}`);
  return domain.id === 'sprite-187' && mode === 'playback' ? Math.min(frame, 693) : frame;
}

/** Replay one local source frame only. No parent clock, ActionScript, hit testing,
 * child playhead, runtime visibility, or mask pixels are inferred. Matrices use
 * source twips for translation and unitless scale/skew; convert at render edge. */
export function p053DomainSnapshot(scene: P053VisualScene, domainId: string, frame: number,
  options: Readonly<{mode?: 'playback' | 'structural'}> = {}): P053DomainSnapshot {
  requireSource(scene);
  const domain = domainFor(scene, domainId), mode = options.mode ?? 'playback';
  const effective = frameFor(scene, domain, frame, mode);
  const defs = definitions(scene);
  const records = new Map(domain.instances.map(item => [item.instanceId, item]));
  if (records.size !== domain.instances.length) throw Error('P053_INSTANCE_DUPLICATE');
  const active = new Map<number, P053DisplayInstance>();
  let lastFrame = 0;
  for (const event of domain.events) {
    if (!Number.isSafeInteger(event.frame) || event.frame < lastFrame ||
        event.frame < 1 || event.frame > domain.declaredFrameCount)
      throw Error('P053_EVENT_ORDER_OR_FRAME');
    lastFrame = event.frame;
    if (event.kind === 'action-bytes' || event.kind === 'frame-label') continue;
    if (event.kind !== 'place' && event.kind !== 'remove') throw Error('P053_EVENT_UNSUPPORTED');
    if (!Number.isSafeInteger(event.depth) || event.depth < 1 ||
        typeof event.instanceId !== 'string') throw Error('P053_EVENT_DEPTH_OR_ID');
    if (event.frame > effective) continue;
    const prior = active.get(event.depth);
    if (event.kind === 'remove') {
      if (!prior || prior.instanceId !== event.instanceId) throw Error('P053_REMOVE_GENERATION');
      active.delete(event.depth);
      continue;
    }
    if (event.visible !== undefined || event.blendMode !== undefined ||
        event.filters !== undefined || event.cacheAsBitmap !== undefined ||
        event.backgroundColorRgba !== undefined) throw Error('P053_UNSUPPORTED_DISPLAY_EFFECT');
    const record = records.get(event.instanceId);
    if (!record || record.depth !== event.depth || record.timelineId !== domainId ||
        record.firstFrame > event.frame || record.lastFrameExclusive <= event.frame ||
        !record.updates.includes(event.eventId)) throw Error('P053_INSTANCE_EVENT_DRIFT');
    if (event.move && !prior) throw Error('P053_MOVE_WITHOUT_INSTANCE');
    const sameGeneration = prior?.instanceId === event.instanceId;
    if ((sameGeneration && record.createdByEventId === event.eventId) ||
        (!sameGeneration && record.createdByEventId !== event.eventId))
      throw Error('P053_INSTANCE_CREATION_DRIFT');
    if (sameGeneration && (!event.move || event.characterId !== undefined))
      throw Error('P053_GENERATION_UPDATE_DRIFT');
    if (!sameGeneration && event.characterId === undefined)
      throw Error('P053_PLACEMENT_CHARACTER_MISSING');
    const inherited = event.move ? prior : undefined;
    const characterId = event.characterId ?? inherited?.characterId;
    if (characterId !== record.characterId) throw Error('P053_CHARACTER_GENERATION_DRIFT');
    const definition = defs.get(characterId!);
    if (!definition) throw Error('P053_UNKNOWN_CHARACTER');
    const matrix = event.matrix ?? inherited?.matrix ?? IDENTITY_MATRIX;
    const colorTransform = event.colorTransform ?? inherited?.colorTransform ?? IDENTITY_COLOR;
    if (!validMatrix(matrix) || !validColor(colorTransform)) throw Error('P053_TRANSFORM_DRIFT');
    const clipDepth = event.clipDepth ?? inherited?.clipDepth ?? null;
    if (clipDepth !== null && (!Number.isSafeInteger(clipDepth) || clipDepth <= event.depth))
      throw Error('P053_CLIP_DEPTH_DRIFT');
    active.set(event.depth, {instanceId: event.instanceId, generation: record.generation,
      depth: event.depth, characterId: characterId!, definitionKind: definition.kind,
      childDomain: definition.child, matrix, colorTransform, clipDepth,
      sourceMaskInstanceIds: [], name: event.name ?? inherited?.name ?? null,
      ratio: event.ratio ?? inherited?.ratio ?? null,
      clipActionsSha256: event.clipActions?.sha256 ?? inherited?.clipActionsSha256 ?? null});
  }
  const expected = domain.instances.filter(item => item.firstFrame <= effective &&
    effective < item.lastFrameExclusive).map(item => item.instanceId).sort();
  const observed = [...active.values()].map(item => item.instanceId).sort();
  if (JSON.stringify(observed) !== JSON.stringify(expected)) throw Error('P053_ACTIVE_GENERATION_DRIFT');
  const items = [...active.values()].sort((a,b) => a.depth-b.depth);
  const masks = items.filter(item => item.clipDepth !== null);
  for (const mask of masks) {
    const record = domain.masks.find(item => item.instanceId === mask.instanceId);
    const origin = domain.events.find(item => item.kind === 'place' &&
      item.instanceId === mask.instanceId && item.clipDepth === mask.clipDepth);
    if (!record || record.depth !== mask.depth || record.clipDepth !== mask.clipDepth ||
        record.sourceTagSha256 !== origin?.sourceTagSha256 ||
        !(record.firstFrame <= effective && effective < record.lastFrameExclusive))
      throw Error('P053_MASK_SOURCE_DRIFT');
  }
  const instances = items.map(item => ({...item,
    sourceMaskInstanceIds: masks.filter(mask => mask.depth < item.depth &&
      item.depth <= mask.clipDepth!).map(mask => mask.instanceId)}));
  return {domainId, requestedFrame: frame, frame: effective, mode,
    sourceStaticOnly: true, instances};
}

/** Recursive composition requires a separately supplied clock for every
 * active child sprite instance. Keys are full instance paths, such as
 * `root/depth-3/generation-1>sprite-187/depth-1/generation-1`.
 * Source clipping is associated by mask identity; rendering its pixels is not
 * claimed. Buttons remain leaves because their live state is unresolved. */
export function p053NestedSnapshot(scene: P053VisualScene, domainId: string, frame: number,
  childFrames: Readonly<Record<string, number>>,
  options: Readonly<{mode?: 'playback' | 'structural'}> = {}): P053NestedSnapshot {
  const defs = definitions(scene);
  const visitedFrames = new Set<string>();
  const visit = (id: string, localFrame: number, parentPath: string,
    parentMatrix: P053Matrix, parentColor: P053Color, inheritedMasks: readonly string[],
    stack: readonly string[]): P053NestedSnapshot => {
    if (stack.includes(id)) throw Error(`P053_NESTED_DOMAIN_LOOP:${id}`);
    const snapshot = p053DomainSnapshot(scene,id,localFrame,options);
    const instances = snapshot.instances.map(item => {
      const instancePath = parentPath ? `${parentPath}>${item.instanceId}` : item.instanceId;
      const worldMatrix = composeMatrix(parentMatrix,item.matrix);
      const worldColorTransform = composeColor(parentColor,item.colorTransform);
      const sourceMaskPaths = [...inheritedMasks,...item.sourceMaskInstanceIds.map(mask =>
        parentPath ? `${parentPath}>${mask}` : mask)];
      let child: P053NestedSnapshot | null = null;
      if (item.childDomain !== null) {
        if (!defs.has(item.characterId) || !Object.hasOwn(childFrames,instancePath))
          throw Error(`P053_CHILD_CLOCK_REQUIRED:${instancePath}`);
        const childFrame = childFrames[instancePath];
        if (!Number.isSafeInteger(childFrame)) throw Error(`P053_CHILD_CLOCK_INVALID:${instancePath}`);
        visitedFrames.add(instancePath);
        child = visit(item.childDomain,childFrame!,instancePath,worldMatrix,
          worldColorTransform,sourceMaskPaths,[...stack,id]);
      }
      return {...item,instancePath,worldMatrix,worldColorTransform,sourceMaskPaths,child};
    });
    return {...snapshot,instances};
  };
  const result = visit(domainId,frame,'',IDENTITY_MATRIX,IDENTITY_COLOR,[],[]);
  if (Object.keys(childFrames).some(key => !visitedFrames.has(key)))
    throw Error('P053_UNKNOWN_CHILD_CLOCK');
  return result;
}
