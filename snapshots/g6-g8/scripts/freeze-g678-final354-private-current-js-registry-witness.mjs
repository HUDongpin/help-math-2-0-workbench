#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {chmod, copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
export const LIVE_REGISTRY = 'packages/demos/private-current-js-registry.json';
export const OUTPUT =
  'catalog/product-bridge-calibrations/g678-final354-private-current-js-registry-witness-v1.json';
export const EXPECTED_FINAL354_REGISTRY = Object.freeze({
  path: LIVE_REGISTRY,
  bytes: 397841,
  sha256: '2c734cdba9d19efaea00812bffdae5fa2de747972b447b8f86f6f2a0d037d239',
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function absolute(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}
async function ordinary(relativePath, {frozen = false} = {}) {
  const target = absolute(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!frozen || (before.mode & 0o777n) === 0o444n),
  `${relativePath} must be one canonical ${frozen ? '0444 ' : ''}ordinary file`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: buffer.length,
    sha256: sha256(buffer), buffer});
}

export function validateFinal354RegistrySnapshotBytes(bytes) {
  invariant(Buffer.isBuffer(bytes) &&
    bytes.length === EXPECTED_FINAL354_REGISTRY.bytes &&
    sha256(bytes) === EXPECTED_FINAL354_REGISTRY.sha256,
  'final354 registry witness bytes drifted');
  const value = JSON.parse(bytes.toString('utf8'));
  const calibrations = value?.calibrations?.filter((candidate) =>
    candidate.calibrationId === 'g678-16-page-product-calibration-v1');
  invariant(value.schemaVersion === 2 &&
    value.registryScope === 'private-engineering' &&
    calibrations?.length === 1 &&
    calibrations[0].deploymentScope === 'local-only' &&
    calibrations[0].entries.length === 354 &&
    calibrations[0].freezeManifest ===
      'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json' &&
    calibrations[0].freezeManifestBytes === 2190557 &&
    calibrations[0].freezeManifestSha256 ===
      'e10f263fe19a9db3141c23ba2611730eed2e3cf7c495b27aef6e862a8936e850',
  'final354 registry witness semantic boundary drifted');
  return true;
}

async function writeExclusive(relativePath, bytes) {
  const target = absolute(relativePath);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx', mode: 0o444});
  try {
    await chmod(temporary, 0o444);
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
    await chmod(target, 0o444);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function freezeG678Final354PrivateCurrentJsRegistryWitness(
  {check = false} = {},
) {
  if (!check) {
    const live = await ordinary(LIVE_REGISTRY);
    validateFinal354RegistrySnapshotBytes(live.buffer);
    await writeExclusive(OUTPUT, live.buffer);
  }
  const witness = await ordinary(OUTPUT, {frozen: true});
  validateFinal354RegistrySnapshotBytes(witness.buffer);
  return Object.freeze({check, output: {path: OUTPUT, bytes: witness.bytes,
    sha256: witness.sha256}, exactFinal354RegistrationCount: 354,
  liveRegistryRequiredDuringCheck: false});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: freeze-g678-final354-private-current-js-registry-witness.mjs [--check]');
  freezeG678Final354PrivateCurrentJsRegistryWitness({
    check: args.includes('--check'),
  }).then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
