import IR_SOURCE from './generated/geo001-l07-p003-display-ir-v2.json';
import type {RuntimeContext} from './contract';

type Attributes = Readonly<Record<string, string>>;
type DisplayEvent = Readonly<{
  frame: number;
  op: 'place' | 'remove';
  attributes: Attributes;
  transform: Attributes | null;
  colorTransform: Attributes | null;
}>;
type SoundBlock = Readonly<{
  frame: number;
  sampleCount: number;
  seekSamples: number;
  payloadSha256: string;
}>;
const IR = IR_SOURCE as unknown as Readonly<{
  animationId: string;
  sourceSwfSha256: string;
  swfmillXmlSha256: string;
  rootFrameCount: number;
  rootEntry: Readonly<{frame: number; depth: string; objectID: string; name: string}>;
  mainFrameCount: number;
  displayEvents: readonly DisplayEvent[];
  soundBlocks: readonly SoundBlock[];
  glossaryButtons: readonly Readonly<{characterId: number; sourceKeyAttribute: string}>[];
}>;

// All 41 DefineText characters in the pinned L7RW03.swf source XML.
const TEXT_IDS = new Set([13, 14, 42, 44, 49, 51, 64, 66, 68, 70, 72,
  74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104,
  106, 108, 110, 112, 114, 116, 119, 124, 127, 130, 132, 137, 138, 139]);
const BUTTON_IDS = new Set(IR.glossaryButtons.map(button => button.characterId));

export interface GeoL07P003DisplayObject {
  readonly depth: number;
  readonly characterId: number;
  readonly name: string | null;
  readonly clipDepth: number | null;
  readonly transform: Attributes;
  readonly colorTransform: Attributes;
}

export interface GeoL07P003MainState {
  readonly animationId: 'shared-geo001-l07-p003';
  readonly frameDomain: 'sprite-140';
  readonly frame: number;
  readonly scenario: 'default';
  readonly language: 'en' | 'es';
  readonly seed: number;
  readonly replay: number;
  readonly objects: readonly GeoL07P003DisplayObject[];
  readonly sourceTextIds: readonly number[];
  /** Depth residency is not visibility, hit-test reachability, or a glossary adapter. */
  readonly depthResidentGlossaryButtonIds: readonly number[];
  readonly audioBlock: SoundBlock | null;
  readonly sourceDeclaredSamplesThroughFrame: number;
}

export const GEO_L07_P003_SOURCE = Object.freeze({
  animationId: 'shared-geo001-l07-p003',
  sourceSwfSha256: IR.sourceSwfSha256,
  swfmillXmlSha256: IR.swfmillXmlSha256,
  rootFrameCount: IR.rootFrameCount,
  rootEntryFrame: IR.rootEntry.frame,
  mainFrameDomain: 'sprite-140',
  mainFrameCount: IR.mainFrameCount,
  originalHostTraceEstablished: false,
  glossaryHostResolved: false,
  audioSynchronizationAccepted: false,
  currentJsRegistered: false,
} as const);

function validate(frame: number, max: number, domain: string, context: RuntimeContext): void {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > max ||
      context.frameDomain !== domain || context.scenario !== 'default' ||
      (context.lang !== 'en' && context.lang !== 'es') ||
      !Number.isSafeInteger(context.seed) || context.seed < 0 || context.seed > 0xffffffff ||
      !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0) {
    throw Error('GEO_L07_P003_INVALID_FRAME_IDENTITY');
  }
}

/** Root direct seek only. The original preloader and child clock are not inferred. */
export function geoL07P003RootState(frame: number, context: RuntimeContext) {
  validate(frame, IR.rootFrameCount, 'root', context);
  if (IR.rootFrameCount !== 10 || IR.rootEntry.frame !== 6 ||
      IR.rootEntry.depth !== '4' || IR.rootEntry.objectID !== '140' ||
      IR.rootEntry.name !== 'animation') throw Error('GEO_L07_P003_ROOT_SOURCE_DRIFT');
  return Object.freeze({
    animationId: 'shared-geo001-l07-p003' as const,
    frameDomain: 'root' as const, frame, scenario: 'default' as const,
    language: context.lang, seed: context.seed, replay: context.replay ?? 0,
    sourceAction: frame === 1 ? 'external-preloader-jump-check-and-stop' as const
      : frame === 6 ? 'begin-stop' as const : null,
    mainSprite: frame < 6 ? null : Object.freeze({
      characterId: 140 as const, depth: 4 as const, name: 'animation' as const,
      translateX: 412.4, translateY: 303.3,
    }),
    mainSpriteFrame: null,
    originalHostTraceEstablished: false as const,
  });
}

/** Pure source-event direct seek; no assertion of original-runtime reachability. */
export function geoL07P003MainState(frame: number, context: RuntimeContext): GeoL07P003MainState {
  validate(frame, IR.mainFrameCount, 'sprite-140', context);
  const display = new Map<number, GeoL07P003DisplayObject>();
  for (const event of IR.displayEvents) {
    if (event.frame > frame) break;
    const depth = Number(event.attributes.depth);
    if (!Number.isSafeInteger(depth) || depth < 1) throw Error('GEO_L07_P003_DEPTH_DRIFT');
    if (event.op === 'remove') {
      if (!display.delete(depth)) throw Error('GEO_L07_P003_REMOVE_DRIFT');
      continue;
    }
    const previous = display.get(depth);
    if (event.attributes.objectID === undefined && !previous) {
      throw Error('GEO_L07_P003_UPDATE_DRIFT');
    }
    const characterId = event.attributes.objectID === undefined
      ? previous!.characterId : Number(event.attributes.objectID);
    if (!Number.isSafeInteger(characterId) || characterId < 1) {
      throw Error('GEO_L07_P003_CHARACTER_DRIFT');
    }
    const replace = event.attributes.replace === '1';
    display.set(depth, Object.freeze({
      depth, characterId,
      name: event.attributes.name ?? (replace ? previous?.name ?? null : null),
      clipDepth: event.attributes.clipDepth === undefined
        ? replace ? previous?.clipDepth ?? null : null : Number(event.attributes.clipDepth),
      transform: Object.freeze({...(event.transform ?? (replace ? previous?.transform ?? {} : {}))}),
      colorTransform: Object.freeze({...(event.colorTransform ?? (replace ? previous?.colorTransform ?? {} : {}))}),
    }));
  }
  const objects = Object.freeze([...display.values()].sort((a, b) => a.depth - b.depth));
  let audioBlock: SoundBlock | null = null;
  let sourceDeclaredSamplesThroughFrame = 0;
  for (const block of IR.soundBlocks) {
    if (block.frame > frame) break;
    sourceDeclaredSamplesThroughFrame += block.sampleCount;
    if (block.frame === frame) audioBlock = block;
  }
  return Object.freeze({
    animationId: 'shared-geo001-l07-p003', frameDomain: 'sprite-140', frame,
    scenario: 'default', language: context.lang, seed: context.seed,
    replay: context.replay ?? 0, objects,
    sourceTextIds: Object.freeze(objects.map(object => object.characterId).filter(id => TEXT_IDS.has(id))),
    depthResidentGlossaryButtonIds: Object.freeze(objects.map(object => object.characterId)
      .filter(id => BUTTON_IDS.has(id))),
    audioBlock, sourceDeclaredSamplesThroughFrame,
  });
}
