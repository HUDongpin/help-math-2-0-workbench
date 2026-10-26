import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import {p054RevealShapeId} from '../../../packages/demos/src/nms-l02-p054-reveal-v1';

const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const swfRelative = 'G6-G8-shared/NMS002/L2/GS/L2GS03.swf';
const swfSha256 = '06bde171fe294f555f983c15b50afbb53344851cdc2f76e31e5eb5a4719cabb8';
const artRoot = '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-art-assets-oM5UHV';
const auditRelative = 'migrations/shared-nms002-l02-p054/audit/';
const artManifestSha256 = 'b715b175badc1edfcdf5df81ef7c388ea7e0b2eaac99656c28c74d1762e91974';
const displayListSha256 = '8887c62a93824e851b2b6bba3779742ba43143b5c8e38b47c49b81c04fa6c40c';
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

function boundJson(file: string, expectedSha256: string): unknown {
  const bytes = readFileSync(file);
  if (hash(bytes) !== expectedSha256) throw new Error('P054 audit changed');
  return JSON.parse(bytes.toString('utf8')) as unknown;
}

type ArtManifest = {source: {sha256: string}; export: {root: string;
  items: Array<{file: string; bytes: number; sha256: string}>}};
type DisplayList = {controllerSpriteId: number; frames: Array<{frame: number;
  layers: Array<{sourceCharacterId: number; sourceInstanceName: string}>}>};

/** Only hash-bound FFDec image tiles from the exact SWF; never arbitrary paths. */
export function readP054RevealTile(level: 1 | 2, order: number): Buffer {
  const shapeId = p054RevealShapeId(level, order);
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV ||
      process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot ||
      !lstatSync(sourceRoot).isDirectory() || lstatSync(sourceRoot).isSymbolicLink() ||
      !lstatSync(artRoot).isDirectory() || lstatSync(artRoot).isSymbolicLink() ||
      hash(readFileSync(path.join(sourceRoot, swfRelative))) !== swfSha256) {
    throw new Error('P054 source boundary unavailable');
  }
  const auditRoot = path.join(getWorkspaceRoot(), auditRelative);
  const art = boundJson(path.join(auditRoot, 'art-export-v1.json'), artManifestSha256) as ArtManifest;
  const game = boundJson(path.join(auditRoot, 'game-display-list-v1.json'), displayListSha256) as DisplayList;
  const imageLayers = game.frames.find(frame => frame.frame === level * 2)?.layers.filter(layer =>
    /^Mc[1-6]_Img[12]$/u.test(layer.sourceInstanceName)) ?? [];
  const image = imageLayers[order - 1];
  const file = `shapes/${shapeId}.svg`;
  const item = art.export.items.find(entry => entry.file === file);
  if (art.source.sha256 !== swfSha256 || art.export.root !== artRoot ||
      game.controllerSpriteId !== 731 || imageLayers.length !== 12 ||
      image?.sourceCharacterId !== shapeId + 1 || !item) {
    throw new Error('P054 reveal placement mismatch');
  }
  const tilePath = path.join(artRoot, file);
  if (!lstatSync(tilePath).isFile() || lstatSync(tilePath).isSymbolicLink()) {
    throw new Error('P054 reveal tile unavailable');
  }
  const bytes = readFileSync(tilePath);
  if (bytes.length !== item.bytes || hash(bytes) !== item.sha256) {
    throw new Error('P054 reveal tile changed');
  }
  return bytes;
}
