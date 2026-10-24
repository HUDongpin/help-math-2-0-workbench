import {P056_CHARACTER_SYMBOL_IDS, P056_SYMBOL_DEFS_SVG, P056_SYMBOL_SOURCE} from '../generated/nms-l02-p056-symbol-art-v1';
import {P056_DISPLAY_SOURCE} from '../generated/nms-l02-p056-display-list-v1';
import {p056SourceSpriteFrame} from './shared-nms002-l02-p056-display-list';

export type P056SvgViewport = 'native-stage' | 'forensic-crop';

/** Queryable source-static teaching sprite; not the root preloader or a host interaction trace. */
export function p056SourceSpriteSvg(
  frame: number,
  instanceId: string,
  viewport: P056SvgViewport = 'native-stage',
): string {
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/u.test(instanceId)) {
    throw new RangeError('P056 SVG instance ID must be an XML-safe identifier');
  }
  const layers = p056SourceSpriteFrame(frame);
  const crop = P056_SYMBOL_SOURCE.crop;
  const nativeStage = viewport === 'native-stage';
  if (!nativeStage && viewport !== 'forensic-crop') throw new RangeError('Unknown P056 SVG viewport');
  const width = nativeStage ? 800 : crop.width;
  const height = nativeStage ? 600 : crop.height;
  const x = nativeStage ? P056_DISPLAY_SOURCE.rootPlacement.transX / 20 : crop.x;
  const y = nativeStage ? P056_DISPLAY_SOURCE.rootPlacement.transY / 20 : crop.y;
  const defs = P056_SYMBOL_DEFS_SVG
    .replace(/\sid="([^"]+)"/gu, (_, id: string) => ` id="${instanceId}-${id}"`)
    .replace(/xlink:href="#([^"]+)"/gu, (_, id: string) => `xlink:href="#${instanceId}-${id}"`)
    .replace(/url\(#([^\)]+)\)/gu, (_, id: string) => `url(#${instanceId}-${id})`);
  const uses = layers.map(layer => {
    const id = P056_CHARACTER_SYMBOL_IDS[String(layer.characterId) as keyof typeof P056_CHARACTER_SYMBOL_IDS];
    if (id === null && layer.characterId === 11) return '';
    if (!id) throw new Error(`P056 character ${layer.characterId} has no source SVG symbol`);
    const {scaleX, scaleY, transX, transY} = layer.transform;
    const transform = `matrix(${scaleX} 0 0 ${scaleY} ${transX / 20} ${transY / 20})`;
    return `<use xlink:href="#${instanceId}-${id}" transform="${transform}" opacity="${layer.alpha256 / 256}" data-source-depth="${layer.depth}" data-source-character="${layer.characterId}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ffdec="https://www.free-decompiler.com/flash" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-animation-id="shared-nms002-l02-p056" data-flash-frame-domain="sprite-24" data-flash-frame="${frame}">` +
    (nativeStage ? '<rect width="800" height="600" fill="#b8d8f7"/>' : '') +
    defs + `<g transform="translate(${x} ${y})">${uses}</g></svg>`;
}
