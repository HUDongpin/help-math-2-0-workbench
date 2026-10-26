import 'server-only';

import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

import {G678_LIFE_SOURCE_ROOT, resolveG678PhysicalPath} from '../../../lib/g678-life-root-binding-v1.mjs';
import {getWorkspaceRoot} from './catalog';
import {readBoundG678LocalRuntimeAsset} from './g678-local-runtime-asset.server';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_RELATIVE = 'G6-G8-shared/NMS002/L9/RW/L9RW03.swf';
const SOURCE_SHA256 = 'd6841b40ee8da4857ba9075944c2393ee214e056373fe10abd2f0c2b2a375ebd';

export const NMS_L09_P003_CANDIDATE_RUNTIME = Object.freeze({
  animationId: 'shared-nms002-l09-p003',
  path: 'work/g678-shared-page-factory/g678-nms-l09-p003-native-candidate-v1/canvas-renderer.js',
  bytes: 8910358,
  sha256: 'c03538f5fc07a5697a549f911b15c0aac1c7e4c8da62819188141bba001bad27',
  url: '/flash-assets/g678-local/shared-nms002-l09-p003/canvas-renderer.js',
});

export const NMS_L09_P003_CANDIDATE_AUDIO = Object.freeze({
  animationId: 'shared-nms002-l09-p003',
  path: 'work/g678-shared-page-factory/g678-nms-l09-p003-source-audio-v1/source-stream.mp3',
  bytes: 263120,
  sha256: 'a8ca1683d3f7848f16f9be96e3472c41594485a853778defc96cebfe6243307f',
  url: '/flash-assets/g678-local/shared-nms002-l09-p003/embedded-stream.mp3',
});

/** An unregistered, local-only runtime. This is not a My Lesson binding. */
function boundSourceRoot(): string | undefined {
  const envRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  if (envRoot === SOURCE_ROOT) return SOURCE_ROOT;
  if (envRoot !== G678_LIFE_SOURCE_ROOT) return undefined;
  return resolveG678PhysicalPath(SOURCE_ROOT);
}

export async function resolveNmsL09P003CandidateRuntime() {
  const sourceRoot = boundSourceRoot();
  if (!isG678LocalPreviewEnabled() || !sourceRoot ||
      process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot) return undefined;
  try {
    if (await realpath(sourceRoot) !== sourceRoot) return undefined;
    const sourcePath = path.join(sourceRoot, SOURCE_RELATIVE);
    const sourceMetadata = await lstat(sourcePath);
    if (!sourceMetadata.isFile() || sourceMetadata.isSymbolicLink() ||
        sourceMetadata.nlink !== 1 || await realpath(sourcePath) !== sourcePath) {
      return undefined;
    }
    const source = await readFile(sourcePath);
    if (createHash('sha256').update(source).digest('hex') !== SOURCE_SHA256) {
      return undefined;
    }
    return await readBoundG678LocalRuntimeAsset({
      binding: NMS_L09_P003_CANDIDATE_RUNTIME,
      workspaceRoot: getWorkspaceRoot(),
    });
  } catch {
    return undefined;
  }
}

export async function resolveNmsL09P003CandidateAudio() {
  // Reuse the exact SWF and local renderer admission gate before audio I/O.
  if (!await resolveNmsL09P003CandidateRuntime()) return undefined;
  return readBoundG678LocalRuntimeAsset({
    binding: NMS_L09_P003_CANDIDATE_AUDIO,
    workspaceRoot: getWorkspaceRoot(),
  });
}
