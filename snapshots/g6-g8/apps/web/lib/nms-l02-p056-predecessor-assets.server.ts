import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, realpathSync} from 'node:fs';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import {p055PilotResources} from './nms-l02-ts-pilot-assets.server';
import {P052_SOURCE_ROOT, readP052CandidateAudio} from './nms-l02-p052-source-bytes';
import {P052_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p052-runtime-audio-v1';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const P055_ASSETS = Object.freeze({
  'p055-typography.js': 'typography.js',
  'p055-main.mp3': 'main.mp3',
} as const);
const P052_DOMAINS = Object.freeze([
  'sprite-8', 'sprite-318', 'sprite-327', 'sprite-347', 'sprite-349', 'sprite-350',
] as const);
type P052Domain = typeof P052_DOMAINS[number];
export type P056PredecessorAssetName = keyof typeof P055_ASSETS | `p052-${P052Domain}.mp3`;
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

export function isP056PredecessorAssetName(name: string): name is P056PredecessorAssetName {
  return Object.prototype.hasOwnProperty.call(P055_ASSETS, name) ||
    P052_DOMAINS.some(domain => name === `p052-${domain}.mp3`);
}

function physicalScope() {
  if (!isG678LocalPreviewEnabled() || process.env.HELP_MATH_G678_SOURCE_ROOT !== SOURCE_ROOT ||
      P052_SOURCE_ROOT !== SOURCE_ROOT || realpathSync(SOURCE_ROOT) !== SOURCE_ROOT)
    throw Error('P056_PREDECESSOR_SOURCE_SCOPE');
  const source = lstatSync(SOURCE_ROOT);
  if (!source.isDirectory() || source.isSymbolicLink()) throw Error('P056_PREDECESSOR_SOURCE_ROOT');
  const root = getWorkspaceRoot();
  if (realpathSync(root) !== root) throw Error('P056_PREDECESSOR_WORKTREE_PATH');
  const worktree = lstatSync(root);
  if (!worktree.isDirectory() || worktree.isSymbolicLink())
    throw Error('P056_PREDECESSOR_WORKTREE_ROOT');
  return root;
}

/** Only the eight pinned P055/P052 predecessor resources. No SA substitution. */
export function p056PredecessorAsset(name: P056PredecessorAssetName) {
  const root = physicalScope();
  if (!isP056PredecessorAssetName(name)) throw Error('P056_PREDECESSOR_NAME');
  if (Object.prototype.hasOwnProperty.call(P055_ASSETS, name)) {
    const originalName = P055_ASSETS[name as keyof typeof P055_ASSETS];
    const resource = p055PilotResources().find(item => item.name === originalName);
    if (!resource) throw Error('P056_PREDECESSOR_P055_MISSING');
    return {name, bytes: resource.bytes, sha256: resource.sha256,
      contentType: resource.contentType, role: originalName === 'typography.js' ?
        'p055-source-drawing' as const : 'p055-source-audio' as const};
  }
  const domain = name.slice('p052-'.length, -'.mp3'.length) as P052Domain;
  if (!P052_DOMAINS.includes(domain)) throw Error('P056_PREDECESSOR_DOMAIN');
  const plan = P052_AUDIO_PLANS[domain];
  const bytes = readP052CandidateAudio(root, SOURCE_ROOT, domain);
  if (bytes.length !== plan.inputBytes || sha256(bytes) !== plan.inputSha256)
    throw Error('P056_PREDECESSOR_P052_HASH');
  return {name, bytes, sha256: plan.inputSha256, contentType: 'audio/mpeg' as const,
    role: 'p052-source-audio-domain' as const};
}

export function p056PredecessorAssetManifest() {
  const names: P056PredecessorAssetName[] = [
    'p055-typography.js', 'p055-main.mp3',
    ...P052_DOMAINS.map(domain => `p052-${domain}.mp3` as const),
  ];
  return names.map(name => {
    const resource = p056PredecessorAsset(name);
    return {name, bytes: resource.bytes.length, sha256: resource.sha256,
      contentType: resource.contentType, role: resource.role,
      url: `/migration-assets/nms-l02-p056-predecessors/${name}?sha256=${resource.sha256}`};
  });
}
