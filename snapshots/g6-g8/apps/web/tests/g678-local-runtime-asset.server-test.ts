import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
  link,
  mkdir,
  mkdtemp,
  realpath,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  readBoundG678LocalRuntimeAsset,
  resolveG678LocalCanvasRuntime,
} from '../lib/g678-local-runtime-asset.server';

const animationId = 'shared-nms002-l01-p001';
const relativePath =
  `work/g678-shared-page-factory/product-v1/${animationId}/canvas-renderer.js`;
const runtimeBytes = Buffer.from('window.G678_LOCAL_FIXTURE = true;\n');
const sha256 = (bytes: Buffer) =>
  createHash('sha256').update(bytes).digest('hex');

async function fixture() {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'help-g678-asset-'));
  const root = await realpath(temporary);
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, runtimeBytes);
  return {
    root,
    target,
    binding: {
      animationId,
      bytes: runtimeBytes.length,
      path: relativePath,
      sha256: sha256(runtimeBytes),
      url: `/flash-assets/g678-local/${animationId}/canvas-renderer.js`,
    },
  };
}

test('local runtime serving rehashes the exact ordinary single-link file', async (t) => {
  const value = await fixture();
  t.after(() => rm(value.root, {recursive: true, force: true}));
  const resolved = await readBoundG678LocalRuntimeAsset({
    binding: value.binding,
    workspaceRoot: value.root,
  });
  assert.deepEqual(resolved?.bytes, runtimeBytes);
  assert.equal(resolved?.sha256, value.binding.sha256);

  assert.equal(await readBoundG678LocalRuntimeAsset({
    binding: {...value.binding, sha256: 'f'.repeat(64)},
    workspaceRoot: value.root,
  }), undefined);
});

test('local runtime serving rejects hard links and symbolic links', async (t) => {
  const value = await fixture();
  t.after(() => rm(value.root, {recursive: true, force: true}));
  const hardLink = `${value.target}.hardlink`;
  await link(value.target, hardLink);
  assert.equal(await readBoundG678LocalRuntimeAsset({
    binding: value.binding,
    workspaceRoot: value.root,
  }), undefined);
  await unlink(hardLink);

  const realTarget = `${value.target}.real`;
  await rename(value.target, realTarget);
  await symlink(realTarget, value.target);
  assert.equal(await readBoundG678LocalRuntimeAsset({
    binding: value.binding,
    workspaceRoot: value.root,
  }), undefined);
});

test('local runtime serving rejects a symlinked allowed-root ancestor', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'help-g678-root-'));
  const root = await realpath(temporary);
  t.after(() => rm(root, {recursive: true, force: true}));
  const realFactory = path.join(root, 'real-factory');
  const relativeBelowFactory = relativePath.replace(
    'work/g678-shared-page-factory/',
    '',
  );
  const realTarget = path.join(realFactory, relativeBelowFactory);
  await mkdir(path.dirname(realTarget), {recursive: true});
  await writeFile(realTarget, runtimeBytes);
  await mkdir(path.join(root, 'work'), {recursive: true});
  await symlink(realFactory, path.join(root, 'work/g678-shared-page-factory'));
  assert.equal(await readBoundG678LocalRuntimeAsset({
    binding: {
      animationId,
      bytes: runtimeBytes.length,
      path: relativePath,
      sha256: sha256(runtimeBytes),
      url: `/flash-assets/g678-local/${animationId}/canvas-renderer.js`,
    },
    workspaceRoot: root,
  }), undefined);
});

test('local runtime serving rejects a symlinked target-directory ancestor', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'help-g678-target-root-'));
  const root = await realpath(temporary);
  t.after(() => rm(root, {recursive: true, force: true}));
  const allowedRoot = path.join(root, 'work/g678-shared-page-factory');
  const realProduct = path.join(allowedRoot, 'real-product');
  const target = path.join(realProduct, animationId, 'canvas-renderer.js');
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, runtimeBytes);
  await symlink(realProduct, path.join(allowedRoot, 'product-v1'));
  assert.equal(await readBoundG678LocalRuntimeAsset({
    binding: {
      animationId,
      bytes: runtimeBytes.length,
      path: relativePath,
      sha256: sha256(runtimeBytes),
      url: `/flash-assets/g678-local/${animationId}/canvas-renderer.js`,
    },
    workspaceRoot: root,
  }), undefined);
});

test('production and flag-off requests close before reading any calibration asset', async () => {
  assert.equal(await resolveG678LocalCanvasRuntime(animationId, {
    NODE_ENV: 'production',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  }), undefined);
  assert.equal(await resolveG678LocalCanvasRuntime(animationId, {
    NODE_ENV: 'development',
    HELP_MATH_G678_LOCAL_PREVIEW: 'false',
  }), undefined);
  assert.equal(await resolveG678LocalCanvasRuntime('../../source', {
    NODE_ENV: 'development',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
  }), undefined);
});
