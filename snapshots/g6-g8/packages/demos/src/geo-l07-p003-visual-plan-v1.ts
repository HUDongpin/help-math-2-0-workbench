import LAYOUT_SOURCE from './generated/geo001-l07-p003-visual-layout-v1.json';
import IR_SOURCE from './generated/geo001-l07-p003-display-ir-v2.json';
import type {RuntimeContext} from './contract';
import {GEO_L07_P003_SOURCE, geoL07P003MainState} from './geo-l07-p003-display-state-v1';

type SourceSymbol = Readonly<{
  characterId: number;
  kind: 'shape' | 'text' | 'button';
  boundsPixels: readonly [number, number, number, number];
  path?: string;
  sha256?: string;
  states?: Readonly<Record<'up' | 'over' | 'down' | 'hittest',
    Readonly<{path: string; sha256: string}>>>;
}>;
const LAYOUT = LAYOUT_SOURCE as unknown as Readonly<{
  animationId: string;
  sourceSwfSha256: string;
  mainSprite: Readonly<{characterId: number; translateX: number; translateY: number;
    frameCount: number}>;
  symbols: readonly SourceSymbol[];
}>;
const SYMBOLS = new Map(LAYOUT.symbols.map(symbol => [symbol.characterId, symbol]));

const GLOSSARY_KEYS = new Map<number, string>(IR_SOURCE.glossaryButtons.map(button =>
  [button.characterId, button.sourceKeyAttribute]));

export interface GeoL07P003VisualLayer {
  readonly depth: number;
  readonly characterId: number;
  readonly kind: 'shape' | 'text' | 'button';
  readonly renderMode: 'mask' | 'content';
  readonly boundsPixels: readonly [number, number, number, number];
  /** SVG asset is an audit path, not a product URL or an approved bundled asset. */
  readonly sourceSvgPath: string;
  readonly sourceSvgSha256: string;
  /** SVG affine matrix [a,b,c,d,tx,ty] in the 800 × 600 native stage. */
  readonly stageMatrix: readonly [number, number, number, number, number, number];
  readonly opacity: number;
  readonly maskDepths: readonly number[];
  readonly clipDepth: number | null;
  readonly glossaryKey: string | null;
  /** Depth presence does not establish hit testing or original-host glossary behavior. */
  readonly interactive: false;
}

function matrix(transform: Readonly<Record<string, string>>): GeoL07P003VisualLayer['stageMatrix'] {
  const n = (key: string, fallback: number) => {
    const value = Number(transform[key] ?? fallback);
    if (!Number.isFinite(value)) throw Error('GEO_L07_P003_TRANSFORM_DRIFT');
    return value;
  };
  return [n('scaleX', 1), n('skewY', 0), n('skewX', 0), n('scaleY', 1),
    n('transX', 0) / 20 + LAYOUT.mainSprite.translateX,
    n('transY', 0) / 20 + LAYOUT.mainSprite.translateY];
}

function opacity(color: Readonly<Record<string, string>>): number {
  for (const channel of ['factorRed', 'factorGreen', 'factorBlue']) {
    if (color[channel] !== undefined && color[channel] !== '256') {
      throw Error('GEO_L07_P003_UNSUPPORTED_COLOR_TRANSFORM');
    }
  }
  const alpha = Number(color.factorAlpha ?? 256);
  if (!Number.isInteger(alpha) || alpha < 0 || alpha > 256) {
    throw Error('GEO_L07_P003_ALPHA_DRIFT');
  }
  return alpha / 256;
}

/** A source-geometry composition plan, not a callable or registered renderer. */
export function geoL07P003VisualPlan(frame: number, context: RuntimeContext) {
  const state = geoL07P003MainState(frame, context);
  if (LAYOUT.animationId !== state.animationId ||
      LAYOUT.sourceSwfSha256 !== GEO_L07_P003_SOURCE.sourceSwfSha256 ||
      LAYOUT.mainSprite.characterId !== 140 ||
      LAYOUT.mainSprite.frameCount !== 1274 || SYMBOLS.size !== 135) {
    throw Error('GEO_L07_P003_VISUAL_LAYOUT_DRIFT');
  }
  const masks = state.objects.filter(object => object.clipDepth !== null);
  const layers: GeoL07P003VisualLayer[] = state.objects.map(object => {
    const symbol = SYMBOLS.get(object.characterId);
    if (!symbol) throw Error('GEO_L07_P003_MISSING_VISUAL_SYMBOL');
    const svg = symbol.kind === 'button' ? symbol.states?.up : symbol;
    if (!svg?.path || !svg.sha256) throw Error('GEO_L07_P003_MISSING_SOURCE_SVG');
    return Object.freeze({
      depth: object.depth, characterId: object.characterId, kind: symbol.kind,
      renderMode: object.clipDepth === null ? 'content' as const : 'mask' as const,
      boundsPixels: symbol.boundsPixels,
      sourceSvgPath: svg.path, sourceSvgSha256: svg.sha256,
      stageMatrix: matrix(object.transform), opacity: opacity(object.colorTransform),
      maskDepths: Object.freeze(masks.filter(mask => mask.depth < object.depth &&
        object.depth <= mask.clipDepth!).map(mask => mask.depth)),
      clipDepth: object.clipDepth,
      glossaryKey: GLOSSARY_KEYS.get(object.characterId) ?? null,
      interactive: false as const,
    });
  });
  return Object.freeze({
    animationId: state.animationId, frameDomain: state.frameDomain,
    frame: state.frame, language: state.language, seed: state.seed, replay: state.replay,
    stageWidth: 800 as const, stageHeight: 600 as const,
    layers: Object.freeze(layers),
    sourceTextIds: state.sourceTextIds,
    sourceDeclaredSamplesThroughFrame: state.sourceDeclaredSamplesThroughFrame,
    glossaryHostResolved: false as const,
    originalRuntimeVisualVerified: false as const,
    currentJsRegistered: false as const,
  });
}
