import {
  SOURCE_TITLE_FRAMES,
  SOURCE_TITLE_ROOT_ENTRY,
  SOURCE_TITLE_TEXT,
  type TitleLayerTuple,
} from './alg-l06-p001-title-data-v1';

export const ALG_L06_P001_SOURCE = Object.freeze({
  animationId: 'shared-alg001-l06-p001',
  swfSha256: '9daa5ffe3a1ea275d9467eadafc7addbbb26d14ad1c289e84b3f66f6b0ab9d35',
  frameDomainId: 'sprite-142',
  frameCount: 134,
  fps: 12,
  rootEntryFrame: SOURCE_TITLE_ROOT_ENTRY.frame,
  stage: Object.freeze({width: 800, height: 600}),
  title: SOURCE_TITLE_TEXT,
  sourceFont: 'Bauhaus Md BT',
});

export interface SourceTitleLayerState {
  readonly depth: 1 | 2;
  readonly characterId: 140 | 141;
  readonly color: '#ffffff' | '#103c9c';
  readonly scaleX: number;
  readonly scaleY: number;
  readonly xTwips: number;
  readonly yTwips: number;
  readonly alpha256: number;
}

export interface SourceTitleFrameState {
  readonly frame: number;
  readonly frameDomainId: 'sprite-142';
  readonly title: string;
  readonly rootXTwips: number;
  readonly rootYTwips: number;
  readonly layers: readonly [SourceTitleLayerState, SourceTitleLayerState];
  readonly fullyVisible: boolean;
}

function titleLayer(
  source: TitleLayerTuple,
  depth: 1 | 2,
  characterId: 140 | 141,
  color: '#ffffff' | '#103c9c',
): SourceTitleLayerState {
  return {
    depth,
    characterId,
    color,
    scaleX: source[0],
    scaleY: source[1],
    xTwips: source[2],
    yTwips: source[3],
    alpha256: source[4],
  };
}

/** Source-static visual state only; no host clock, audible sync, or acceptance. */
export function sourceTitleState(frame: number): SourceTitleFrameState {
  if (!Number.isInteger(frame) || frame < 1 || frame > ALG_L06_P001_SOURCE.frameCount) {
    throw new RangeError('P001 title frame must be an integer from 1 through 134');
  }
  const [white, blue] = SOURCE_TITLE_FRAMES[frame - 1];
  return {
    frame,
    frameDomainId: 'sprite-142',
    title: SOURCE_TITLE_TEXT,
    rootXTwips: SOURCE_TITLE_ROOT_ENTRY.xTwips,
    rootYTwips: SOURCE_TITLE_ROOT_ENTRY.yTwips,
    layers: [
      titleLayer(white, 1, 140, '#ffffff'),
      titleLayer(blue, 2, 141, '#103c9c'),
    ],
    fullyVisible: frame >= 133,
  };
}
