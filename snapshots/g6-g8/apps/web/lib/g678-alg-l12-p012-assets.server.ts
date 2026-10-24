import {resolveG678PhysicalPath} from '../../../lib/g678-life-root-binding-v1.mjs';
import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB07.swf`;
const SOURCE_SHA = 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa';
const SOURCE_BYTES = 81069;
const ANIMATION_ID = 'shared-alg001-l12-p012';

const GRAPHICS_MANIFEST = {
  path: 'migrations/shared-alg001-l12-p012/graphics-source-v1/manifest.json',
  bytes: 332659,
  sha256: '4d8de6041039bf5486adbefacb3e71d515d085cc89071951455b7e52b42ae1d4',
} as const;
const AUDIO_INDEX = {
  path: 'migrations/shared-alg001-l12-p012/audio-source-v1/raw-index.json',
  bytes: 127722,
  sha256: '7c9d9e1b355ca6347ba7eac5081fb8476b18cfb4721aba0d1263e54d33a0cf3c',
} as const;
const TYPOGRAPHY_META = {
  path: 'migrations/shared-alg001-l12-p012/typography-v1/runtime-meta.json',
  bytes: 3648,
  sha256: '4a782fda378251825149f30323e51e0adf379eb74f845de47630f14d69d3a17a',
} as const;

export const P012_ASSET_PINS = Object.freeze({
  'graphics.js': Object.freeze({
    path: 'migrations/shared-alg001-l12-p012/graphics-source-v1/source-drawings.js',
    bytes: 1236501, sha256: 'ae25f758635bd24bc2c8c4ae877a57da2be5671d04c02d102491bf56a6d346e9',
    contentType: 'text/javascript; charset=utf-8', kind: 'graphics',
  }),
  'main.mp3': Object.freeze({
    path: 'migrations/shared-alg001-l12-p012/audio-source-v1/main-sprite-86.mp3',
    bytes: 37180, sha256: '6aaddb1bfc319127e85b94dcfce407765eeb3f0275f42830bdeaff4aaa4cb21a',
    contentType: 'audio/mpeg', kind: 'audio-main',
  }),
  'coach.mp3': Object.freeze({
    path: 'migrations/shared-alg001-l12-p012/audio-source-v1/coach-sprite-76.mp3',
    bytes: 21840, sha256: 'e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf',
    contentType: 'audio/mpeg', kind: 'audio-coach',
  }),
  'typography.js': Object.freeze({
    path: 'migrations/shared-alg001-l12-p012/typography-v1/renderer.js',
    bytes: 1253326, sha256: 'eee27611df58685bad502c7ceb54eb745a0407cd7fbb93cadd93e326e95491f1',
    contentType: 'text/javascript; charset=utf-8', kind: 'typography',
  }),
} as const);

export type P012AssetName = keyof typeof P012_ASSET_PINS;
export interface P012AssetResult {
  readonly bytes: Buffer;
  readonly sha256: string;
  readonly contentType: string;
}
export interface P012AssetManifestEntry {
  readonly name: P012AssetName;
  readonly sha256: string;
  readonly bytes: number;
  readonly contentType: string;
}

export function isP012AssetName(name: string): name is P012AssetName {
  return Object.prototype.hasOwnProperty.call(P012_ASSET_PINS, name);
}

function readPinned(file: string, expectedBytes: number, sha256: string): Buffer {
  if (realpathSync(file) !== file) throw Error('P012 physical path required');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.nlink !== 1n || before.size !== BigInt(expectedBytes))
    throw Error('P012 ordinary bounded file required');
  const bytes = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
      before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs ||
      before.mode !== after.mode || before.nlink !== after.nlink ||
      bytes.length !== expectedBytes || createHash('sha256').update(bytes).digest('hex') !== sha256)
    throw Error('P012 pinned bytes changed');
  return bytes;
}

function boundRoot(): string {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT
    ? SOURCE_ROOT : resolveG678PhysicalPath(SOURCE_ROOT);
  if (!isG678LocalPreviewEnabled() || process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot ||
      realpathSync(sourceRoot) !== sourceRoot || !lstatSync(sourceRoot).isDirectory())
    throw Error('P012 local source root required');
  readPinned(sourceRoot === SOURCE_ROOT ? SOURCE : resolveG678PhysicalPath(SOURCE), SOURCE_BYTES, SOURCE_SHA);
  const root = getWorkspaceRoot();
  if (realpathSync(root) !== root || !lstatSync(root).isDirectory())
    throw Error('P012 physical worktree required');
  return root;
}

function metadata(root: string, pin: typeof GRAPHICS_MANIFEST | typeof AUDIO_INDEX | typeof TYPOGRAPHY_META): Record<string, unknown> {
  return JSON.parse(readPinned(path.join(root, pin.path), pin.bytes, pin.sha256).toString()) as Record<string, unknown>;
}

function checkTypography(root: string): void {
  const meta = metadata(root, TYPOGRAPHY_META);
  const graphicsSource = meta.graphicsSource as Record<string, unknown> | undefined;
  if (meta.kind !== 'p012-typography-runtime-v1' || meta.animationId !== ANIMATION_ID ||
      meta.sourceSha256 !== SOURCE_SHA || meta.renderScale !== 2 ||
      meta.runtimeBytes !== P012_ASSET_PINS['typography.js'].bytes ||
      meta.runtimeSha256 !== P012_ASSET_PINS['typography.js'].sha256 ||
      graphicsSource?.path !== P012_ASSET_PINS['graphics.js'].path ||
      graphicsSource.sha256 !== P012_ASSET_PINS['graphics.js'].sha256)
    throw Error('P012 typography candidate identity drift');
}

function sourceBinding(record: Record<string, unknown>): void {
  const source = record.source as Record<string, unknown> | undefined;
  if (source?.path !== SOURCE || source.bytes !== SOURCE_BYTES || source.sha256 !== SOURCE_SHA)
    throw Error('P012 metadata source drift');
}

function checkGraphics(root: string): void {
  const manifest = metadata(root, GRAPHICS_MANIFEST);
  const composition = manifest.composition as Record<string, unknown> | undefined;
  if (composition?.animationId !== ANIMATION_ID || composition.kind !== 'p012-source-graphics-composition-v1')
    throw Error('P012 graphics candidate identity drift');
  sourceBinding(composition);
  const generated = manifest.generatedOutputs as Array<Record<string, unknown>> | undefined;
  const graphics = generated?.find(item => item.path === P012_ASSET_PINS['graphics.js'].path);
  if (graphics?.bytes !== P012_ASSET_PINS['graphics.js'].bytes ||
      graphics.sha256 !== P012_ASSET_PINS['graphics.js'].sha256)
    throw Error('P012 graphics output drift');
}

function checkAudio(root: string, name: 'main.mp3' | 'coach.mp3'): void {
  const index = metadata(root, AUDIO_INDEX);
  if (index.kind !== 'p012-two-domain-raw-swf-audio-index-v1')
    throw Error('P012 audio index kind drift');
  sourceBinding(index);
  const streams = index.streams as Record<string, Record<string, unknown>> | undefined;
  const stream = streams?.[name === 'main.mp3' ? 'main' : 'coach'];
  const output = stream?.mp3 as Record<string, unknown> | undefined;
  const pin = P012_ASSET_PINS[name];
  if (output?.file !== path.basename(pin.path) || output.bytes !== pin.bytes ||
      output.sha256 !== pin.sha256 ||
      stream?.domain !== (name === 'main.mp3' ? 'sprite-86' : 'sprite-76'))
    throw Error('P012 audio output drift');
}

/** A local, registry-neutral candidate resource. Returned bytes are fresh and
 * detached from the physical file; callers cannot mutate a retained cache. */
export function p012Asset(name: P012AssetName): P012AssetResult {
  if (!isP012AssetName(name)) throw Error('P012 resource name denied');
  const root = boundRoot();
  if (name === 'graphics.js') checkGraphics(root);
  else if (name === 'typography.js') checkTypography(root);
  else checkAudio(root, name);
  const pin = P012_ASSET_PINS[name];
  return {bytes: readPinned(path.join(root, pin.path), pin.bytes, pin.sha256),
    sha256: pin.sha256, contentType: pin.contentType};
}

/** Validates every current resource before exposing candidate URL parameters. */
export function p012AssetManifest(): readonly P012AssetManifestEntry[] {
  return (Object.keys(P012_ASSET_PINS) as P012AssetName[]).map(name => {
    const asset = p012Asset(name);
    return Object.freeze({name, sha256: asset.sha256, bytes: asset.bytes.length,
      contentType: asset.contentType});
  });
}
