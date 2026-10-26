import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {DAT_L02_P002_SYMBOL_PREFIX} from './dat-l02-p002-symbol-access';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_RELATIVE = 'G6-G8-shared/DAT001/L2/RW/L2RW02.swf';
const SOURCE_SHA = 'b4a8311aff5e33cc623d6035b4a00647bac6ab9dbe0fd61394e6a6207e652a16';
const WORK = 'migrations/shared-dat001-l02-p002';
const LAYOUT = `${WORK}/audit/source-visual-layout-v1.json`;
const PRODUCT_LAYOUT = 'packages/demos/src/generated/dat001-l02-p002-visual-layout-v1.json';
const LAYOUT_SHA = 'bfdc2f54900629ad6bec77da79e00a602fb69ee8f2c69e9cf6a73ff12ba60a0e';
const SOURCE_AUDIO = `${WORK}/audit/source-stream-decoded-v1.wav`;
const SOURCE_AUDIO_SHA = 'dc8fc07f7066b76e781bab37cb09f5232bb3f3ac98c8690104d8acf1dcee9f8c';
const SOURCE_TEXT = [
  {id: 105, sha256: '0d21edf7203b3b83d7fd62395e52e698ae71a0fe79b6d4095b90e3654d457d30'},
  {id: 108, sha256: '3c1e92ea1391298ce8224dfd31d7a08294fa1c97a01a29c1da0ac013db58cd41'},
  {id: 110, sha256: 'd899a460713c32544f09d4493a0b0fad529961491fc83f3bb85ef13d944ff11a'},
  {id: 112, sha256: '56496c6dbba8c592fd5785eef15c1c4c971b870e2eccaa7943bbb0d4384605f1'},
  {id: 114, sha256: '84d459c667b6ed031e8ccbab88d6d545607ea0df913712e32f224a8d9e51cb8c'},
] as const;
const MASK_IDS = new Set([1, 103, 106, 107, 109, 111]);

type Asset = Readonly<{path: string; sha256: string}>;
type Symbol = Readonly<{characterId: number; kind: 'shape' | 'text' | 'morph';
  path?: string; sha256?: string; states?: readonly Readonly<{ratio: number; path: string; sha256: string}>[]}>;
type Layout = Readonly<{animationId: string; sourceSwfSha256: string;
  counts: Readonly<{visualSymbols: number; sourceMorphStates: number}>;
  symbols: readonly Symbol[]}>;

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`DAT_L02_P002_CANDIDATE_DENIED: ${reason}`);
}

function readBound(root: string, relative: string, expectedSha: string): Buffer {
  demand(!path.isAbsolute(relative) && relative.split('/').every(part =>
    part && part !== '.' && part !== '..'), 'bounded path');
  const file = path.join(root, relative);
  const before = lstatSync(file, {bigint: true});
  demand(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n &&
    realpathSync(file) === file, 'physical file');
  const data = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  demand(after.isFile() && !after.isSymbolicLink() && after.nlink === 1n &&
    before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    createHash('sha256').update(data).digest('hex') === expectedSha, 'source hash');
  return data;
}

function verifyPhysicalSource() {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT &&
    realpathSync(SOURCE_ROOT) === SOURCE_ROOT &&
    !lstatSync(SOURCE_ROOT).isSymbolicLink(), 'exact physical source root');
  readBound(SOURCE_ROOT, SOURCE_RELATIVE, SOURCE_SHA);
}

/** Exact decoded source audio for the loopback-only candidate; not listening acceptance. */
export function readDatL02P002SourceAudio(root = getWorkspaceRoot()) {
  verifyPhysicalSource();
  return readBound(root, SOURCE_AUDIO, SOURCE_AUDIO_SHA);
}

function maskGeometry(svg: string) {
  const filled = [...svg.matchAll(/<path\b[^>]*>/g)].filter(match => {
    const fill = match[0].match(/\bfill="([^"]+)"/)?.[1];
    return fill !== undefined && fill !== 'none';
  });
  demand(filled.length === 1, 'single mask silhouette');
  const tag = filled[0]![0];
  const d = tag.match(/\bd="([^"]+)"/)?.[1];
  const clipRule = tag.match(/\bfill-rule="([^"]+)"/)?.[1] ?? 'nonzero';
  demand(d && (clipRule === 'evenodd' || clipRule === 'nonzero'), 'mask path');
  return Object.freeze({d, clipRule});
}

function boundLayout(root: string): Layout {
  const audit = readBound(root, LAYOUT, LAYOUT_SHA);
  const product = readBound(root, PRODUCT_LAYOUT, LAYOUT_SHA);
  demand(audit.equals(product), 'audit/product layout copy');
  const layout = JSON.parse(audit.toString('utf8')) as Layout;
  demand(layout.animationId === 'shared-dat001-l02-p002' &&
    layout.sourceSwfSha256 === SOURCE_SHA &&
    layout.counts.visualSymbols === 107 && layout.counts.sourceMorphStates === 66 &&
    layout.symbols.length === 107, 'layout identity');
  return layout;
}

function boundAssetIndex(layout: Layout) {
  const assets = new Map<string, Asset>();
  const maskAssetPaths = new Set<string>();
  const seenIds = new Set<number>();
  for (const symbol of layout.symbols) {
    demand(Number.isSafeInteger(symbol.characterId) && symbol.characterId > 0 &&
      !seenIds.has(symbol.characterId), 'symbol identity');
    seenIds.add(symbol.characterId);
    const entries = symbol.kind === 'morph' ? symbol.states : [{path: symbol.path, sha256: symbol.sha256}];
    demand(entries && entries.length > 0 &&
      (symbol.kind !== 'morph' || symbol.states?.every(state =>
        Number.isSafeInteger(state.ratio) && state.ratio >= 0 && state.ratio <= 65535)),
    'symbol states');
    for (const entry of entries) {
      demand(entry.path && entry.sha256 &&
        entry.path.startsWith(`${WORK}/audit/`) && entry.path.endsWith('.svg') &&
        /^[a-f0-9]{64}$/.test(entry.sha256) && !assets.has(entry.path), 'asset identity');
      assets.set(entry.path, {path: entry.path, sha256: entry.sha256});
      if (MASK_IDS.has(symbol.characterId)) maskAssetPaths.add(entry.path);
    }
  }
  demand(assets.size === 169 && maskAssetPaths.size === 68, 'candidate asset closure');
  return {assets, maskAssetPaths};
}

function boundSourceTranscript(root: string) {
  const text = new Map<number, string>(SOURCE_TEXT.map(({id, sha256}) => [id,
    readBound(root, `${WORK}/audit/ffdec-26.2.1-source-text-v1/${id}.txt`, sha256)
      .toString('utf8')]));
  const title = text.get(114);
  const assignment = text.get(105);
  const steps = [108, 110, 112].map(id => text.get(id));
  demand(title && assignment && steps.every(step => step?.startsWith('•')),
    'source text roles');
  return Object.freeze({title, assignment: assignment.trimEnd(),
    steps: Object.freeze(steps.map(step => step!.slice(1)))});
}

/** Read one byte-bound source SVG without embedding it in page HTML. */
export function readDatL02P002Symbol(sha: string, root = getWorkspaceRoot()) {
  demand(/^[a-f0-9]{64}$/u.test(sha), 'symbol hash');
  verifyPhysicalSource();
  const {assets} = boundAssetIndex(boundLayout(root));
  const asset = [...assets.values()].find(candidate => candidate.sha256 === sha);
  demand(asset, 'symbol membership');
  return readBound(root, asset.path, sha);
}

/** Local-only, byte-bound assets for an explicitly unregistered visual candidate. */
export function loadDatL02P002CandidateAssets(root = getWorkspaceRoot()) {
  verifyPhysicalSource();
  const {assets, maskAssetPaths} = boundAssetIndex(boundLayout(root));
  const assetHrefs: Record<string, string> = {};
  const maskPaths: Record<string, ReturnType<typeof maskGeometry>> = {};
  let totalBytes = 0;
  for (const asset of assets.values()) {
    const data = readBound(root, asset.path, asset.sha256);
    totalBytes += data.length;
    demand(totalBytes <= 6_000_000, 'candidate asset size');
    assetHrefs[asset.path] = `${DAT_L02_P002_SYMBOL_PREFIX}${asset.sha256}`;
    if (maskAssetPaths.has(asset.path)) {
      maskPaths[asset.path] = maskGeometry(data.toString('utf8'));
    }
  }
  return Object.freeze({assetHrefs: Object.freeze(assetHrefs),
    maskPaths: Object.freeze(maskPaths), transcript: boundSourceTranscript(root), totalBytes});
}
