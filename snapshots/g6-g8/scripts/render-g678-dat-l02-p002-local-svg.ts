import {createHash} from 'node:crypto';
import {readFileSync, mkdirSync, openSync, writeFileSync, closeSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {datL02P002VisualPlan, type DatL02P002VisualLayer} from
  '../packages/demos/src/dat-l02-p002-visual-plan-v1';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUT = resolve(ROOT, 'migrations/shared-dat001-l02-p002/audit/local-visual-projection-v1');
const cache = new Map<string, string>();

function xml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function sourceSvg(layer: DatL02P002VisualLayer): string {
  const key = `${layer.sourceSvgPath}:${layer.sourceSvgSha256}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const path = resolve(ROOT, layer.sourceSvgPath);
  if (!path.startsWith(resolve(ROOT, 'migrations/shared-dat001-l02-p002/audit/') + '/')) {
    throw Error('DAT_L02_P002_ASSET_SCOPE_DRIFT');
  }
  const content = readFileSync(path);
  if (createHash('sha256').update(content).digest('hex') !== layer.sourceSvgSha256) {
    throw Error('DAT_L02_P002_ASSET_HASH_DRIFT');
  }
  const value = content.toString('utf8');
  cache.set(key, value);
  return value;
}

function matrix(layer: DatL02P002VisualLayer): string {
  return `matrix(${layer.stageMatrix.join(' ')})`;
}

/** Diagnostic SVG only: static source-frame projection, not a browser renderer or fidelity evidence. */
export function renderDatL02P002LocalSvg(frame: number): string {
  const plan = datL02P002VisualPlan(frame, {
    frame, frameDomain: 'sprite-113', scenario: 'default', lang: 'en', seed: 0, replay: 0,
  });
  const masks = new Map(plan.layers.filter(layer => layer.renderMode === 'mask')
    .map(layer => [layer.instancePath, layer]));
  const ids = new Map([...masks.keys()].map((path, index) => [path, `clip-${index}`]));
  const definitions = [...masks.entries()].map(([path, layer]) => {
    // These four morph masks and the two static masks each have one filled
    // silhouette path. Stroke/alpha do not control SWF clipDepth geometry.
    const svg = sourceSvg(layer);
    const match = svg.match(/<path\s+d="([^"]+)"\s+fill="(?!none)[^"]+"/);
    if (!match) throw Error(`DAT_L02_P002_MASK_GEOMETRY_DRIFT:${path}`);
    return `<clipPath id="${ids.get(path)}" clipPathUnits="userSpaceOnUse"><path d="${xml(match[1])}" transform="${matrix(layer)}"/></clipPath>`;
  });
  const content = plan.layers.filter(layer => layer.renderMode === 'content').map(layer => {
    const [left, top, right, bottom] = layer.boundsPixels;
    const svg = sourceSvg(layer);
    const href = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    let element = `<image x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" href="${href}" transform="${matrix(layer)}" opacity="${layer.opacity}"/>`;
    for (const maskPath of layer.maskPaths) {
      const id = ids.get(maskPath);
      if (!id) throw Error(`DAT_L02_P002_MISSING_MASK:${maskPath}`);
      element = `<g clip-path="url(#${id})">${element}</g>`;
    }
    return element;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" data-diagnostic-only="true" data-source-frame="${frame}"><defs>${definitions.join('')}</defs><rect width="800" height="600" fill="#b8d8f7"/>${content.join('')}</svg>\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const frame = Number(process.argv[2]);
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 276 || process.argv.length !== 3) {
    throw Error('Usage: tsx scripts/render-g678-dat-l02-p002-local-svg.ts <1..276>');
  }
  const content = renderDatL02P002LocalSvg(frame);
  mkdirSync(OUT, {recursive: true});
  const output = resolve(OUT, `frame-${String(frame).padStart(4, '0')}.svg`);
  const fd = openSync(output, 'wx');
  try { writeFileSync(fd, content); } finally { closeSync(fd); }
  process.stdout.write(`${output}\n`);
}
