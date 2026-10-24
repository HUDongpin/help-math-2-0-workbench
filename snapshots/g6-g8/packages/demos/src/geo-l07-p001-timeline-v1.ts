import IR from './generated/geo001-l07-p001-source-ir-v1.json';
import type {RuntimeContext} from './contract';

export interface GeoL07P001FrameState {
  readonly animationId: 'shared-geo001-l07-p001';
  readonly frame: number;
  readonly frameDomain: 'root' | 'sprite-142';
  readonly rootFrame: number;
  readonly mainFrame: number | null;
  readonly scenario: 'source-introduction';
  readonly language: 'en' | 'es';
  readonly seed: number;
  readonly replay: number;
  readonly title: string;
  readonly alpha: number;
  readonly scale: number;
  readonly sourceTextIds: readonly number[];
}

export const GEO_L07_P001_SOURCE = Object.freeze({
  animationId: IR.animationId,
  sourceRelativePath: IR.sourceRelativePath,
  sourceSwfSha256: IR.sourceSwfSha256,
  swfmillXmlSha256: IR.swfmillXmlSha256,
  rootFrameCount: IR.rootFrameCount,
  rootEntryFrame: IR.rootEntryFrame,
  mainFrameCount: IR.mainFrameCount,
  mainFrameDomain: IR.mainFrameDomain,
  title: IR.title,
  sourceTextIds: Object.freeze(IR.sourceTextIds),
  hostPreloader: 'unresolved',
  randomAudio: 'catalog-yes-trigger-unresolved',
  originalRuntimeAccepted: false,
  strictAcceptanceEffect: 'none',
} as const);

/** The original root stops at frame 6; the child has its own 130-frame clock. */
export function geoL07P001Frame(frame: number, context: RuntimeContext): GeoL07P001FrameState {
  const domain = context.frameDomain ?? 'sprite-142';
  const max = domain === 'root' ? 10 : domain === 'sprite-142' ? 130 : 0;
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > max ||
      context.scenario !== 'source-introduction' ||
      (context.lang !== 'en' && context.lang !== 'es') ||
      !Number.isSafeInteger(context.seed) || context.seed < 0 || context.seed > 0xffffffff ||
      !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0) {
    throw Error('GEO_L07_P001_INVALID_FRAME_IDENTITY');
  }
  const mainFrame = domain === 'root' ? frame >= 6 ? frame - 5 : null : frame;
  const titleLayer = mainFrame === null ? null : IR.frames[mainFrame - 1]?.layers[1];
  if (mainFrame !== null && (!titleLayer || titleLayer.characterId !== 141)) {
    throw Error('GEO_L07_P001_SOURCE_IR_DRIFT');
  }
  return Object.freeze({
    animationId: 'shared-geo001-l07-p001', frame,
    frameDomain: domain as GeoL07P001FrameState['frameDomain'],
    rootFrame: domain === 'root' ? frame : 6, mainFrame,
    scenario: 'source-introduction', language: context.lang,
    seed: context.seed, replay: context.replay ?? 0, title: IR.title,
    alpha: titleLayer ? titleLayer.alpha256 / 256 : 0,
    scale: titleLayer?.scaleX ?? 0.5,
    sourceTextIds: Object.freeze(titleLayer && titleLayer.alpha256 > 0 ? [140, 141] : []),
  });
}

/** Modern once playback holds the final title; original-host looping is unverified. */
export function geoL07P001FrameAtMilliseconds(milliseconds: number): number {
  if (!Number.isFinite(milliseconds) || milliseconds < 0 ||
      milliseconds > Number.MAX_SAFE_INTEGER / 12) {
    throw Error('GEO_L07_P001_INVALID_TIME');
  }
  return Math.min(Math.floor(milliseconds * 12 / 1000) + 1, 130);
}
