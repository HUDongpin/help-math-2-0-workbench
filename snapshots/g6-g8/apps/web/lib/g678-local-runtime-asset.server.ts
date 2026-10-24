import 'server-only';

import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

import {getWorkspaceRoot} from './catalog';
import {readG678CourseRuntimeBindings} from '../../../scripts/lib/g678-course-runtime-bindings-v1.mjs';
import {readRegistryTransaction, readPin} from '../../../lib/g678-admission-proof.mjs';
import type {G678LocalRuntimeAssetBinding} from './g678-calibration-product-bridge.server';
import {
  isG678LocalPreviewEnabled,
  type G678PreviewEnvironment,
} from './g678-preview-policy';

export interface G678ResolvedLocalRuntimeAsset {
  readonly bytes: Buffer;
  readonly sha256: string;
}

const digest = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');
const G678_LOCAL_RUNTIME_ROOT = 'work/g678-shared-page-factory';
const G678_LOCAL_ANIMATION_ID =
  /^shared-(nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/u;

async function pathHasOnlyRealDirectories(
  workspaceRoot: string,
  directory: string,
) {
  const relative = path.relative(workspaceRoot, directory);
  if (relative === '..' || relative.startsWith(`..${path.sep}`)) return false;
  let current = workspaceRoot;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const metadata = await lstat(current);
    if (metadata.isSymbolicLink() || !metadata.isDirectory()) return false;
  }
  return true;
}

export async function readBoundG678LocalRuntimeAsset({
  binding,
  workspaceRoot,
}: {
  readonly binding: G678LocalRuntimeAssetBinding;
  readonly workspaceRoot: string;
}): Promise<G678ResolvedLocalRuntimeAsset | undefined> {
  const allowedRoot = path.resolve(workspaceRoot, G678_LOCAL_RUNTIME_ROOT);
  const target = path.resolve(workspaceRoot, binding.path);
  if (
    !binding.path.startsWith(`${G678_LOCAL_RUNTIME_ROOT}/`) ||
    target === allowedRoot ||
    !target.startsWith(`${allowedRoot}${path.sep}`)
  ) return undefined;
  try {
    if (!await pathHasOnlyRealDirectories(workspaceRoot, path.dirname(target))) {
      return undefined;
    }
    const [workspaceRealPath, allowedRootRealPath, targetMetadata] = await Promise.all([
      realpath(workspaceRoot),
      realpath(allowedRoot),
      lstat(target),
    ]);
    if (
      workspaceRealPath !== path.resolve(workspaceRoot) ||
      allowedRootRealPath !== allowedRoot ||
      targetMetadata.isSymbolicLink() ||
      !targetMetadata.isFile() ||
      targetMetadata.nlink !== 1
    ) {
      return undefined;
    }
    const targetRealPath = await realpath(target);
    if (
      targetRealPath === allowedRootRealPath ||
      !targetRealPath.startsWith(`${allowedRootRealPath}${path.sep}`)
    ) return undefined;
    const bytes = await readFile(targetRealPath);
    const afterReadMetadata = await lstat(target);
    if (
      !await pathHasOnlyRealDirectories(workspaceRoot, path.dirname(target)) ||
      afterReadMetadata.isSymbolicLink() ||
      !afterReadMetadata.isFile() ||
      afterReadMetadata.nlink !== 1 ||
      afterReadMetadata.dev !== targetMetadata.dev ||
      afterReadMetadata.ino !== targetMetadata.ino ||
      afterReadMetadata.size !== targetMetadata.size ||
      afterReadMetadata.mtimeMs !== targetMetadata.mtimeMs
    ) return undefined;
    const [allowedRootRealPathAfterRead, targetRealPathAfterRead] =
      await Promise.all([realpath(allowedRoot), realpath(target)]);
    if (
      allowedRootRealPathAfterRead !== allowedRootRealPath ||
      targetRealPathAfterRead !== targetRealPath
    ) return undefined;
    const sha256 = digest(bytes);
    if (bytes.length !== binding.bytes || sha256 !== binding.sha256) {
      return undefined;
    }
    return Object.freeze({bytes, sha256});
  } catch {
    return undefined;
  }
}

export async function resolveG678LocalCanvasRuntime(
  animationId: string,
  env: G678PreviewEnvironment = process.env,
): Promise<G678ResolvedLocalRuntimeAsset | undefined> {
  if (!isG678LocalPreviewEnabled(env) ||
      !G678_LOCAL_ANIMATION_ID.test(animationId)) return undefined;
  const {g678PartialCalibrationSnapshot} =
    await import('./g678-calibration-product-bridge.server');
  const snapshot = g678PartialCalibrationSnapshot();
  if (snapshot.status !== 'ready') return undefined;
  const matches = snapshot.runtimeAssets.filter(
    (binding) => binding.animationId === animationId,
  );
  if (matches.length !== 1) return undefined;
  return readBoundG678LocalRuntimeAsset({
    binding: matches[0]!,
    workspaceRoot: getWorkspaceRoot(),
  });
}

/** Current selected-page asset read. Historical compiler/build inputs keep
 * their old verdict; this verifies current registry/source/artifact identity. */
export async function resolveG678CurrentCanvasRuntime(
  animationId: string,
  env: G678PreviewEnvironment = process.env,
  workspaceRoot = getWorkspaceRoot(),
): Promise<G678ResolvedLocalRuntimeAsset | undefined> {
  if (!isG678LocalPreviewEnabled(env) || !G678_LOCAL_ANIMATION_ID.test(animationId)) return undefined;
  const bindings = readG678CourseRuntimeBindings(workspaceRoot, [animationId]);
  const selected = bindings.rows[0];
  if (selected?.status !== 'ready') return undefined;
  const transaction = readRegistryTransaction(workspaceRoot);
  if (transaction.sha256 !== bindings.registry.pin?.sha256) return undefined;
  const matches = transaction.registry.calibrations.flatMap(calibration => calibration.entries)
    .filter(entry => entry.key === animationId);
  if (matches.length !== 1 || !matches[0].artifacts.runtime) return undefined;
  const pin = matches[0].artifacts.runtime;
  if (!selected.inputPins.some(input => input.path === pin.path && input.bytes === pin.bytes && input.sha256 === pin.sha256)) return undefined;
  const result = await readBoundG678LocalRuntimeAsset({binding: {
    ...pin, animationId, url: `/flash-assets/g678-local/${animationId}/canvas-renderer.js`,
  }, workspaceRoot});
  // Catch a registry/selected input change across the async filesystem read.
  for (const input of selected.inputPins) readPin(workspaceRoot, input);
  for (const source of selected.sourcePins) readPin(path.dirname(source.path), {...source, path: path.basename(source.path)});
  return result;
}
