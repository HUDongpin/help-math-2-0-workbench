import LAYOUT_SOURCE from './generated/dat001-l02-p002-visual-layout-v1.json';
import type {RuntimeContext} from './contract';
import {
  DAT_L02_P002_SOURCE, datL02P002SourceState,
  type DatL02P002FrameDomain,
} from './dat-l02-p002-display-state-v1';

type Matrix = readonly [number, number, number, number, number, number];
type SourceSymbol = Readonly<{
  characterId: number;
  kind: 'shape' | 'text' | 'morph';
  boundsPixels: readonly [number, number, number, number];
  path?: string;
  sha256?: string;
  states?: readonly Readonly<{ratio: number; path: string; sha256: string}>[];
}>;
const LAYOUT = LAYOUT_SOURCE as unknown as Readonly<{
  animationId: string;
  sourceSwfSha256: string;
  stage: Readonly<{width: number; height: number; fps: number}>;
  counts: Readonly<{visualSymbols: number; sourceMorphStates: number}>;
  symbols: readonly SourceSymbol[];
}>;
const SYMBOLS = new Map(LAYOUT.symbols.map(symbol => [symbol.characterId, symbol]));
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

export interface DatL02P002VisualLayer {
  readonly instancePath: string;
  readonly frameDomain: DatL02P002FrameDomain;
  readonly sourceFrame: number;
  readonly depth: number;
  readonly characterId: number;
  readonly kind: SourceSymbol['kind'];
  readonly renderMode: 'mask' | 'content';
  readonly clipDepth: number | null;
  readonly maskPaths: readonly string[];
  readonly morphRatio: number | null;
  readonly boundsPixels: SourceSymbol['boundsPixels'];
  /** Audit asset, not a public or accepted product URL. */
  readonly sourceSvgPath: string;
  readonly sourceSvgSha256: string;
  readonly stageMatrix: Matrix;
  readonly opacity: number;
}

function localMatrix(transform: Readonly<Record<string, string>>): Matrix {
  const number = (key: string, fallback: number) => {
    const value = Number(transform[key] ?? fallback);
    if (!Number.isFinite(value)) throw Error('DAT_L02_P002_TRANSFORM_DRIFT');
    return value;
  };
  return [number('scaleX', 1), number('skewY', 0), number('skewX', 0),
    number('scaleY', 1), number('transX', 0) / 20, number('transY', 0) / 20];
}

function multiply(parent: Matrix, child: Matrix): Matrix {
  const [a, b, c, d, tx, ty] = parent;
  const [e, f, g, h, ux, uy] = child;
  return [a * e + c * f, b * e + d * f, a * g + c * h, b * g + d * h,
    a * ux + c * uy + tx, b * ux + d * uy + ty];
}

function sourceOpacity(color: Readonly<Record<string, string>>): number {
  for (const channel of ['factorRed', 'factorGreen', 'factorBlue']) {
    if (color[channel] !== undefined && color[channel] !== '256') {
      throw Error('DAT_L02_P002_UNSUPPORTED_COLOR_TRANSFORM');
    }
  }
  const alpha = Number(color.factorAlpha ?? 256);
  if (!Number.isInteger(alpha) || alpha < 0 || alpha > 256) {
    throw Error('DAT_L02_P002_ALPHA_DRIFT');
  }
  return alpha / 256;
}

/** A synchronous source projection, not a natural original-host trace. */
export function datL02P002VisualPlan(frame: number, context: RuntimeContext) {
  if (context.frameDomain !== 'sprite-113' || context.frame !== frame ||
      LAYOUT.animationId !== DAT_L02_P002_SOURCE.animationId ||
      LAYOUT.sourceSwfSha256 !== DAT_L02_P002_SOURCE.sourceSwfSha256 ||
      LAYOUT.stage.width !== 800 || LAYOUT.stage.height !== 600 ||
      LAYOUT.stage.fps !== 12 || LAYOUT.counts.visualSymbols !== 107 ||
      LAYOUT.counts.sourceMorphStates !== 66 || SYMBOLS.size !== 107) {
    throw Error('DAT_L02_P002_VISUAL_LAYOUT_DRIFT');
  }
  const layers: DatL02P002VisualLayer[] = [];
  let projectedChildCount = 0;
  const visit = (domain: DatL02P002FrameDomain, sourceFrame: number,
    path: string, parentMatrix: Matrix, parentOpacity: number,
    inheritedMasks: readonly string[]) => {
    const state = datL02P002SourceState(domain, sourceFrame, {
      ...context, frame: sourceFrame, frameDomain: domain,
    });
    const masks = state.objects.filter(object => object.clipDepth !== null);
    for (const object of state.objects) {
      const instancePath = `${path}/${object.depth}`;
      const stageMatrix = multiply(parentMatrix, localMatrix(object.transform));
      const opacity = parentOpacity * sourceOpacity(object.colorTransform);
      const maskPaths = Object.freeze([...inheritedMasks,
        ...masks.filter(mask => mask.depth < object.depth && object.depth <= mask.clipDepth!)
          .map(mask => `${path}/${mask.depth}`)]);
      if (object.sourceDefinitionTag === 'DefineSprite') {
        let childDomain: DatL02P002FrameDomain;
        let childFrame: number;
        if (domain === 'root' && object.characterId === 113) {
          childDomain = 'sprite-113'; childFrame = frame;
        } else if (domain === 'root' && object.characterId === 116) {
          childDomain = 'sprite-116'; childFrame = 1;
        } else if (domain === 'sprite-113' && [41, 49, 53].includes(object.characterId)) {
          const projection = state.childProjections.find(child =>
            child.depth === object.depth && child.characterId === object.characterId);
          if (!projection) throw Error('DAT_L02_P002_CHILD_PROJECTION_DRIFT');
          childDomain = projection.frameDomain;
          childFrame = projection.synchronousChildFrame;
          projectedChildCount++;
        } else {
          throw Error('DAT_L02_P002_UNSUPPORTED_SPRITE');
        }
        visit(childDomain, childFrame, instancePath, stageMatrix, opacity, maskPaths);
        continue;
      }
      const symbol = SYMBOLS.get(object.characterId);
      if (!symbol || (symbol.kind === 'text' && object.sourceDefinitionTag !== 'DefineText') ||
          (symbol.kind === 'morph' && object.sourceDefinitionTag !== 'DefineMorphShape') ||
          (symbol.kind === 'shape' && !object.sourceDefinitionTag.startsWith('DefineShape'))) {
        throw Error('DAT_L02_P002_MISSING_VISUAL_SYMBOL');
      }
      // A newly placed morph with no ratio tag starts at the zero-ratio endpoint.
      const asset = symbol.kind === 'morph'
        ? symbol.states?.find(candidate => candidate.ratio === (object.morphRatio ?? 0)) : symbol;
      if (!asset?.path || !asset.sha256 ||
          (symbol.kind !== 'morph' && object.morphRatio !== null)) {
        throw Error('DAT_L02_P002_MISSING_SOURCE_SVG');
      }
      layers.push(Object.freeze({
        instancePath, frameDomain: domain, sourceFrame,
        depth: object.depth, characterId: object.characterId, kind: symbol.kind,
        renderMode: object.clipDepth === null ? 'content' as const : 'mask' as const,
        clipDepth: object.clipDepth, maskPaths, morphRatio: object.morphRatio,
        boundsPixels: symbol.boundsPixels,
        sourceSvgPath: asset.path, sourceSvgSha256: asset.sha256,
        stageMatrix, opacity,
      }));
    }
  };
  visit('root', 6, 'root', IDENTITY, 1, []);
  return Object.freeze({
    animationId: DAT_L02_P002_SOURCE.animationId,
    frameDomain: 'sprite-113' as const, frame,
    language: context.lang, seed: context.seed, replay: context.replay ?? 0,
    stageWidth: 800 as const, stageHeight: 600 as const, fps: 12 as const,
    layers: Object.freeze(layers), projectedChildCount,
    sourceDeclaredSamplesThroughFrame: datL02P002SourceState('sprite-113', frame, context)
      .sourceDeclaredSamplesThroughFrame,
    originalHostTraceEstablished: false as const,
    originalRuntimeVisualVerified: false as const,
    audioSynchronizationAccepted: false as const,
    currentJsRegistered: false as const,
  });
}
