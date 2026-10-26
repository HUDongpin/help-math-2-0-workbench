import SOURCE_IR from './generated/geo001-l06-p002-display-ir-v1.json';
import type {RuntimeContext} from './contract';

type Attributes = Readonly<Record<string, string>>;
type SourceEvent = Readonly<{
  frame: number;
  op: 'place' | 'remove';
  attributes: Attributes;
  transform?: Attributes | null;
  colorTransform?: Attributes | null;
}>;
type SourceBlock = Readonly<{frame: number; sampleCount: number; seekSamples: number; payloadSha256: string}>;
const IR = SOURCE_IR as unknown as Readonly<{
  animationId: string;
  sourceSwfSha256: string;
  swfmillXmlSha256: string;
  rootFrameCount: number;
  rootEntry: Readonly<{frame: number; depth: string; objectID: string; name: string}>;
  mainFrameCount: number;
  displayEvents: readonly SourceEvent[];
  soundBlocks: readonly SourceBlock[];
}>;
const TEXT_IDS = new Set([8, 11, 24, 25, 28, 30, 33, 209, 215, 219, 221, 222, 226, 227, 228, 229]);
const GLOSSARY_IDS = new Set([211, 212, 213, 214]);
/** First source frame with the teaching sentence and four glossary controls. */
export const GEO_L06_P002_REDUCED_MOTION_FRAME = 987;

export interface GeoL06P002DisplayObject {
  readonly depth: number;
  readonly characterId: number;
  readonly name: string | null;
  readonly clipDepth: number | null;
  readonly transform: Attributes;
  readonly colorTransform: Attributes;
}

export interface GeoL06P002MainState {
  readonly animationId: 'shared-geo001-l06-p002';
  readonly frameDomain: 'sprite-230';
  readonly frame: number;
  readonly scenario: 'default';
  readonly language: 'en' | 'es';
  readonly seed: number;
  readonly replay: number;
  readonly objects: readonly GeoL06P002DisplayObject[];
  readonly sourceTextIds: readonly number[];
  readonly sourceGlossaryButtonIds: readonly number[];
  readonly audioBlock: SourceBlock | null;
  readonly sourceDeclaredSamplesThroughFrame: number;
}

/** The root timeline is a separate domain from the independently advancing
 * sprite-230 timeline. No root frame determines a child frame without a host trace. */
export interface GeoL06P002RootState {
  readonly animationId: 'shared-geo001-l06-p002';
  readonly frameDomain: 'root';
  readonly frame: number;
  readonly scenario: 'default';
  readonly language: 'en' | 'es';
  readonly seed: number;
  readonly replay: number;
  readonly sourceAction: 'external-preloader-jump-check-and-stop' | 'begin-stop' | null;
  readonly mainSprite: Readonly<{
    characterId: 230;
    depth: 4;
    name: 'animation';
    translateX: 412.4;
    translateY: 303.3;
  }> | null;
  readonly mainSpriteFrame: null;
  readonly originalHostTraceEstablished: false;
}

export const GEO_L06_P002_SOURCE = Object.freeze({
  animationId: 'shared-geo001-l06-p002',
  sourceSwfSha256: IR.sourceSwfSha256,
  swfmillXmlSha256: IR.swfmillXmlSha256,
  rootFrameCount: IR.rootFrameCount,
  rootEntryFrame: IR.rootEntry.frame,
  mainFrameDomain: 'sprite-230',
  mainFrameCount: IR.mainFrameCount,
  originalHostTraceEstablished: false,
  audioSynchronizationAccepted: false,
  currentJsRegistered: false,
} as const);

/** Source-structural root direct seek, not a claim that frames 2-10 are
 * naturally reached. Frame 1 stops for an external preloader; frame 6 stops
 * at `begin` while placing sprite-230. Its child clock is not inferred. */
export function geoL06P002RootState(frame: number, context: RuntimeContext): GeoL06P002RootState {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > IR.rootFrameCount ||
      context.frameDomain !== 'root' || context.scenario !== 'default' ||
      (context.lang !== 'en' && context.lang !== 'es') ||
      !Number.isSafeInteger(context.seed) || context.seed < 0 || context.seed > 0xffffffff ||
      !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0) {
    throw Error('GEO_L06_P002_INVALID_FRAME_IDENTITY');
  }
  if (IR.rootFrameCount !== 10 || IR.rootEntry.frame !== 6 || IR.rootEntry.depth !== '4' ||
      IR.rootEntry.objectID !== '230' || IR.rootEntry.name !== 'animation') {
    throw Error('GEO_L06_P002_ROOT_SOURCE_DRIFT');
  }
  const mainSprite = frame >= IR.rootEntry.frame ? Object.freeze({
    characterId: 230, depth: 4, name: 'animation', translateX: 412.4, translateY: 303.3,
  } as const) : null;
  return Object.freeze({
    animationId: 'shared-geo001-l06-p002', frameDomain: 'root', frame,
    scenario: 'default', language: context.lang, seed: context.seed, replay: context.replay ?? 0,
    sourceAction: frame === 1 ? 'external-preloader-jump-check-and-stop'
      : frame === 6 ? 'begin-stop' : null,
    mainSprite, mainSpriteFrame: null, originalHostTraceEstablished: false,
  });
}

/** Source-event direct seek. This does not reconstruct the original host's
 * preloader, glossary modal, audio playback, or natural ActionScript trace. */
export function geoL06P002MainState(frame: number, context: RuntimeContext): GeoL06P002MainState {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > IR.mainFrameCount ||
      (context.frameDomain ?? 'sprite-230') !== 'sprite-230' ||
      context.scenario !== 'default' ||
      (context.lang !== 'en' && context.lang !== 'es') ||
      !Number.isSafeInteger(context.seed) || context.seed < 0 || context.seed > 0xffffffff ||
      !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0) {
    throw Error('GEO_L06_P002_INVALID_FRAME_IDENTITY');
  }
  const display = new Map<number, GeoL06P002DisplayObject>();
  for (const event of IR.displayEvents) {
    if (event.frame > frame) break;
    const depth = Number(event.attributes.depth);
    if (!Number.isSafeInteger(depth) || depth < 1) throw Error('GEO_L06_P002_SOURCE_DEPTH_DRIFT');
    if (event.op === 'remove') {
      if (!display.delete(depth)) throw Error('GEO_L06_P002_SOURCE_REMOVE_DRIFT');
      continue;
    }
    const previous = display.get(depth);
    const characterId = event.attributes.objectID === undefined
      ? previous?.characterId : Number(event.attributes.objectID);
    if (characterId === undefined || !Number.isSafeInteger(characterId)) {
      throw Error('GEO_L06_P002_SOURCE_CHARACTER_DRIFT');
    }
    if (event.attributes.objectID === undefined && !previous) {
      throw Error('GEO_L06_P002_SOURCE_UPDATE_DRIFT');
    }
    const replacement = event.attributes.replace === '1';
    display.set(depth, Object.freeze({
      depth, characterId,
      name: event.attributes.name ?? (replacement ? previous?.name ?? null : null),
      clipDepth: event.attributes.clipDepth === undefined
        ? (replacement ? previous?.clipDepth ?? null : null) : Number(event.attributes.clipDepth),
      transform: Object.freeze({...(event.transform ?? (replacement ? previous?.transform ?? {} : {}))}),
      colorTransform: Object.freeze({...(event.colorTransform ?? (replacement ? previous?.colorTransform ?? {} : {}))}),
    }));
  }
  const objects = Object.freeze([...display.values()].sort((left, right) => left.depth - right.depth));
  const sourceTextIds = Object.freeze(objects.map(object => object.characterId).filter(id => TEXT_IDS.has(id)));
  const sourceGlossaryButtonIds = Object.freeze(objects.map(object => object.characterId).filter(id => GLOSSARY_IDS.has(id)));
  let audioBlock: SourceBlock | null = null;
  let sourceDeclaredSamplesThroughFrame = 0;
  for (const block of IR.soundBlocks) {
    if (block.frame > frame) break;
    sourceDeclaredSamplesThroughFrame += block.sampleCount;
    if (block.frame === frame) audioBlock = block;
  }
  return Object.freeze({animationId: 'shared-geo001-l06-p002', frameDomain: 'sprite-230',
    frame, scenario: 'default', language: context.lang, seed: context.seed,
    replay: context.replay ?? 0, objects, sourceTextIds, sourceGlossaryButtonIds,
    audioBlock, sourceDeclaredSamplesThroughFrame});
}
