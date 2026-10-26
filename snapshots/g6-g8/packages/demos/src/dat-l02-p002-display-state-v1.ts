import SOURCE from './generated/dat001-l02-p002-display-ir-v1.json';
import type {RuntimeContext} from './contract';

type Attributes = Readonly<Record<string, string>>;
type Event = Readonly<{
  frame: number;
  op: 'place' | 'remove';
  attributes: Attributes;
  transform: Attributes | null;
  colorTransform: Attributes | null;
}>;
type AudioBlock = Readonly<{
  frame: number;
  sampleCount: number;
  seekSamples: number;
  payloadSha256: string;
}>;
type Action = Readonly<{frame: number; xmlSha256: string; stopsPlayhead: boolean}>;
type Domain = Readonly<{
  frames: number;
  displayEvents: readonly Event[];
  soundBlocks: readonly AudioBlock[];
  actions: readonly Action[];
}>;
type NestedInstance = Readonly<{
  characterId: number;
  depth: number;
  firstParentFrame: number;
  lastParentFrame: number;
  sourceChildFrameCount: number;
  presentAtParentStop: boolean;
}>;
const IR = SOURCE as unknown as Readonly<{
  animationId: 'shared-dat001-l02-p002';
  sourceSwfSha256: string;
  sourceXmlSha256: string;
  nestedInstancesSha256: string;
  definitions: Readonly<Record<string, string>>;
  domains: Readonly<Record<string, Domain>>;
  nestedInstances: readonly NestedInstance[];
}>;

export type DatL02P002FrameDomain = 'root' | 'sprite-113' | 'sprite-41' |
  'sprite-49' | 'sprite-53' | 'sprite-116';

export interface DatL02P002DisplayObject {
  readonly depth: number;
  readonly characterId: number;
  readonly sourceDefinitionTag: string;
  readonly name: string | null;
  readonly clipDepth: number | null;
  readonly morphRatio: number | null;
  readonly transform: Attributes;
  readonly colorTransform: Attributes;
}

export interface DatL02P002ChildProjection {
  readonly characterId: 41 | 49 | 53;
  readonly depth: number;
  readonly frameDomain: 'sprite-41' | 'sprite-49' | 'sprite-53';
  readonly sourceEntryParentFrame: number;
  readonly synchronousChildFrame: number;
  readonly presentAtParentStop: boolean;
}

export interface DatL02P002SourceState {
  readonly animationId: 'shared-dat001-l02-p002';
  readonly frameDomain: DatL02P002FrameDomain;
  readonly frame: number;
  readonly language: 'en' | 'es';
  readonly seed: number;
  readonly replay: number;
  readonly objects: readonly DatL02P002DisplayObject[];
  readonly sourceTextIds: readonly number[];
  readonly childProjections: readonly DatL02P002ChildProjection[];
  readonly audioBlock: AudioBlock | null;
  readonly sourceDeclaredSamplesThroughFrame: number;
  readonly sourceActionStopsPlayhead: boolean;
  readonly originalHostTraceEstablished: false;
}

export const DAT_L02_P002_SOURCE = Object.freeze({
  animationId: IR.animationId,
  sourceSwfSha256: IR.sourceSwfSha256,
  sourceXmlSha256: IR.sourceXmlSha256,
  nestedInstancesSha256: IR.nestedInstancesSha256,
  rootFrameCount: IR.domains.root.frames,
  mainFrameCount: IR.domains['sprite-113'].frames,
  originalHostTraceEstablished: false,
  audioSynchronizationAccepted: false,
  currentJsRegistered: false,
} as const);

/** Direct source-frame query; it does not assert natural host reachability. */
export function datL02P002SourceState(
  frameDomain: DatL02P002FrameDomain, frame: number, context: RuntimeContext,
): DatL02P002SourceState {
  const domain = IR.domains[frameDomain];
  if (!domain || context.frameDomain !== frameDomain ||
      !Number.isSafeInteger(frame) || frame < 1 || frame > domain.frames ||
      context.scenario !== 'default' ||
      (context.lang !== 'en' && context.lang !== 'es') ||
      !Number.isSafeInteger(context.seed) || context.seed < 0 || context.seed > 0xffffffff ||
      !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0) {
    throw Error('DAT_L02_P002_INVALID_FRAME_IDENTITY');
  }
  const display = new Map<number, DatL02P002DisplayObject>();
  for (const event of domain.displayEvents) {
    if (event.frame > frame) break;
    const depth = Number(event.attributes.depth);
    if (!Number.isSafeInteger(depth) || depth < 1) throw Error('DAT_L02_P002_DEPTH_DRIFT');
    if (event.op === 'remove') {
      if (!display.delete(depth)) throw Error('DAT_L02_P002_REMOVE_DRIFT');
      continue;
    }
    const previous = display.get(depth);
    if (event.attributes.objectID === undefined && !previous) {
      throw Error('DAT_L02_P002_UPDATE_DRIFT');
    }
    const characterId = event.attributes.objectID === undefined
      ? previous!.characterId : Number(event.attributes.objectID);
    const sourceDefinitionTag = IR.definitions[String(characterId)];
    if (!Number.isSafeInteger(characterId) || !sourceDefinitionTag) {
      throw Error('DAT_L02_P002_CHARACTER_DRIFT');
    }
    const replace = event.attributes.replace === '1';
    const clipDepth = event.attributes.clipDepth === undefined
      ? replace ? previous?.clipDepth ?? null : null : Number(event.attributes.clipDepth);
    const morphRatio = event.attributes.morph === undefined
      ? replace ? previous?.morphRatio ?? null : null : Number(event.attributes.morph);
    if ((clipDepth !== null && (!Number.isSafeInteger(clipDepth) || clipDepth <= depth)) ||
        (morphRatio !== null && (!Number.isSafeInteger(morphRatio) || morphRatio < 0 || morphRatio > 65535))) {
      throw Error('DAT_L02_P002_EFFECT_DRIFT');
    }
    display.set(depth, Object.freeze({
      depth, characterId, sourceDefinitionTag,
      name: event.attributes.name ?? (replace ? previous?.name ?? null : null),
      clipDepth, morphRatio,
      transform: Object.freeze({...((event.transform ?? (replace ? previous?.transform : null)) ?? {})}),
      colorTransform: Object.freeze({...((event.colorTransform ?? (replace ? previous?.colorTransform : null)) ?? {})}),
    }));
  }
  const objects = Object.freeze([...display.values()].sort((a, b) => a.depth - b.depth));
  const childProjections = frameDomain === 'sprite-113'
    ? Object.freeze(IR.nestedInstances.filter(instance =>
        instance.firstParentFrame <= frame && frame <= instance.lastParentFrame).map(instance => {
        const object = display.get(instance.depth);
        if (!object || object.characterId !== instance.characterId ||
            ![41, 49, 53].includes(instance.characterId)) {
          throw Error('DAT_L02_P002_CHILD_INSTANCE_DRIFT');
        }
        return Object.freeze({
          characterId: instance.characterId as 41 | 49 | 53,
          depth: instance.depth,
          frameDomain: `sprite-${instance.characterId}` as DatL02P002ChildProjection['frameDomain'],
          sourceEntryParentFrame: instance.firstParentFrame,
          synchronousChildFrame:
            (frame - instance.firstParentFrame) % instance.sourceChildFrameCount + 1,
          presentAtParentStop: instance.presentAtParentStop,
        });
      }))
    : Object.freeze([]);
  let audioBlock: AudioBlock | null = null;
  let sourceDeclaredSamplesThroughFrame = 0;
  for (const block of domain.soundBlocks) {
    if (block.frame > frame) break;
    sourceDeclaredSamplesThroughFrame += block.sampleCount;
    if (block.frame === frame) audioBlock = block;
  }
  return Object.freeze({
    animationId: IR.animationId, frameDomain, frame,
    language: context.lang, seed: context.seed, replay: context.replay ?? 0,
    objects,
    sourceTextIds: Object.freeze(objects.filter(object => object.sourceDefinitionTag === 'DefineText')
      .map(object => object.characterId)),
    childProjections, audioBlock, sourceDeclaredSamplesThroughFrame,
    sourceActionStopsPlayhead: domain.actions.some(action => action.frame === frame && action.stopsPlayhead),
    originalHostTraceEstablished: false,
  });
}
