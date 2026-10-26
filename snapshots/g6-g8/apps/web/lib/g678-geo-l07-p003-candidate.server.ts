import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_RELATIVE = 'G6-G8-shared/GEO001/L7/RW/L7RW03.swf';
const SOURCE_SHA = 'd0e3c429a5cf15de8f89c0e627a51d990b2bfed8d532af3a84f559531b9a4deb';
const WORK = 'migrations/shared-geo001-l07-p003';
const MANIFEST = `${WORK}/audit/source-visual-assets-v1.json`;
const MANIFEST_SHA = '36c9a39468f5aae0f6767c80999a5c420c085b268e3ee5f5f659e9d0c0af5ce1';

interface AssetEntry {
  kind: 'shape' | 'text' | 'button';
  characterId: number;
  buttonState: string | null;
  path: string;
  bytes: number;
  sha256: string;
}

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`GEO_L07_P003_CANDIDATE_DENIED: ${reason}`);
}

function readBound(root: string, relative: string, expectedSha: string, expectedBytes?: number) {
  demand(!path.isAbsolute(relative) && relative.split('/').every(part => part && part !== '.' && part !== '..'),
    'bounded path');
  const file = path.join(root, relative);
  const before = lstatSync(file, {bigint: true});
  demand(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n &&
    realpathSync(file) === file, 'physical file');
  const data = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  demand(after.isFile() && !after.isSymbolicLink() && after.nlink === 1n &&
    before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    (expectedBytes === undefined || data.length === expectedBytes) &&
    createHash('sha256').update(data).digest('hex') === expectedSha, 'source hash');
  return data;
}

/** Local-only asset map for an explicitly unregistered visual candidate. */
export function loadGeoL07P003CandidateAssets(root = getWorkspaceRoot()) {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT &&
    realpathSync(SOURCE_ROOT) === SOURCE_ROOT, 'exact physical source root');
  readBound(SOURCE_ROOT, SOURCE_RELATIVE, SOURCE_SHA);
  const manifest = JSON.parse(readBound(root, MANIFEST, MANIFEST_SHA).toString()) as {
    animationId?: string; sourceSwfSha256?: string; assets?: AssetEntry[];
  };
  demand(manifest.animationId === 'shared-geo001-l07-p003' &&
    manifest.sourceSwfSha256 === SOURCE_SHA && manifest.assets?.length === 156,
  'source asset inventory');
  const assetHrefs: Record<string, string> = {};
  for (const asset of manifest.assets) {
    if (asset.kind === 'button' && asset.buttonState !== 'up') continue;
    demand(asset.path.startsWith('audit/ffdec-26.2.1/') &&
      Number.isSafeInteger(asset.characterId) && asset.characterId > 0 &&
      !Object.hasOwn(assetHrefs, asset.path), 'asset identity');
    const data = readBound(root, `${WORK}/${asset.path}`, asset.sha256, asset.bytes);
    assetHrefs[asset.path] = `data:image/svg+xml;base64,${data.toString('base64')}`;
  }
  demand(Object.keys(assetHrefs).length === 135, 'candidate asset closure');
  return Object.freeze(assetHrefs);
}
