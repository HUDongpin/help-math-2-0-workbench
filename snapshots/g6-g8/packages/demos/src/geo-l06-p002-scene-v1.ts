import type {GeoL06P002MainState} from './geo-l06-p002-display-state-v1';

const NATIVE_TEXT_AND_CONTROLS = new Set([
  209, 211, 212, 213, 214, 215, 219, 221, 222, 226, 227, 228, 229,
]);

export interface GeoL06P002SceneObject {
  readonly characterId: number;
  readonly depth: number;
  readonly matrix: string;
  readonly opacity: number;
}

export interface GeoL06P002Scene {
  readonly frame: number;
  readonly maskMode: 'binary-fill';
  readonly clipped: readonly GeoL06P002SceneObject[];
  readonly foreground: readonly GeoL06P002SceneObject[];
}

/** Source placement projection for the maintained SVG candidate. The fixed
 * mask rectangle comes from source shape 4. Its 0.6 fill opacity is ignored
 * by the SWF clipDepth mask; FFDec's Canvas destination-in export is not
 * original-runtime mask authority. Source text/buttons are native UI.
 * This is not a color/fidelity or original-host acceptance claim. */
export function geoL06P002Scene(state: GeoL06P002MainState): GeoL06P002Scene {
  const mask = state.objects.find(object => object.depth === 1);
  if (state.animationId !== 'shared-geo001-l06-p002' ||
      state.frameDomain !== 'sprite-230' ||
      mask?.characterId !== 4 || mask.clipDepth !== 668 ||
      mask.transform.transX !== '0' || mask.transform.transY !== '0' ||
      Object.keys(mask.colorTransform).length !== 0) {
    throw Error('GEO_L06_P002_MASK_DRIFT');
  }
  const clipped: GeoL06P002SceneObject[] = [];
  const foreground: GeoL06P002SceneObject[] = [];
  for (const object of state.objects) {
    if (object === mask || NATIVE_TEXT_AND_CONTROLS.has(object.characterId)) continue;
    if (object.clipDepth !== null) throw Error('GEO_L06_P002_UNSUPPORTED_MASK');
    const color = object.colorTransform;
    if (color.addAlpha !== undefined ||
        ['factorRed', 'factorGreen', 'factorBlue'].some(key =>
          color[key] !== undefined && Number(color[key]) !== 256)) {
      throw Error(`GEO_L06_P002_UNSUPPORTED_COLOR_${object.characterId}`);
    }
    const opacity = color.factorAlpha === undefined ? 1 : Number(color.factorAlpha) / 256;
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
      throw Error('GEO_L06_P002_ALPHA_DRIFT');
    }
    const transform = object.transform;
    const matrix = [transform.scaleX ?? '1', transform.skewY ?? '0',
      transform.skewX ?? '0', transform.scaleY ?? '1',
      String(Number(transform.transX ?? 0) / 20),
      String(Number(transform.transY ?? 0) / 20)];
    if (!matrix.every(value => Number.isFinite(Number(value)))) {
      throw Error('GEO_L06_P002_MATRIX_DRIFT');
    }
    (object.depth <= 668 ? clipped : foreground).push(Object.freeze({
      characterId: object.characterId, depth: object.depth,
      matrix: `matrix(${matrix.join(' ')})`, opacity,
    }));
  }
  return Object.freeze({frame: state.frame, maskMode: 'binary-fill' as const,
    clipped: Object.freeze(clipped),
    foreground: Object.freeze(foreground)});
}
