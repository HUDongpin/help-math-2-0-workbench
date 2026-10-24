/** Physical read bindings after the verified 2026-10-14 migration. Recorded
 * roots, source hashes and historical proof dates are never rewritten here. */
import assert from 'node:assert/strict';
import {realpathSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const G678_LIFE_EXECUTION_ROOT = '/Volumes/Life /HELP MATH 2.0-g678-implementation';
export const G678_LIFE_SOURCE_ROOT = '/Volumes/Life /HELP MATH Related Files/AWS Grade-Classified Courseware';
// Copy-plan SHA-256: 12bc943c99521fd98180a5925fe428c9f0fc74036c3209d7ca51718566b128fa.
// Only the three roots needed by this HFR reader are selected from that plan.
export const G678_LIFE_ROOT_BINDINGS = Object.freeze([
  ['/Volumes/WestWorld/HELP MATH 2.0-g678-implementation', G678_LIFE_EXECUTION_ROOT],
  ['/Volumes/WestWorld/HELP MATH 2.0/node_modules', '/Volumes/Life /HELP MATH 2.0/node_modules'],
  ['/Volumes/WestWorld/HELP MATH Related Files', '/Volumes/Life /HELP MATH Related Files'],
].map(([recorded, physical]) => Object.freeze({recorded, physical})));
// Historical evidence recorded under the Codex Mac account home. Only content-named package
// caches are listed; documents, working folders and tool installs are not. On the Codex Mac the
// binding is the identity. It applies to historical evidence reads only, never to fresh
// execution addresses, and every read through it keeps the caller's byte/SHA-256 check.
export const G678_RECORDED_HOME = '/Users/peter';
export const G678_RECORDED_HOME_CACHE_SUBROOTS = Object.freeze([
  '.npm/_npx/31e32ef8478fbf80', // npx cache keyed by package spec: @playwright/cli + playwright-core
]);
// Machine-local historical evidence (tool installs and generated build output recorded on the
// Codex Mac) is read from a byte-identical snapshot on Life at <snapshot root><recorded path>,
// on every Mac including the Codex Mac, so a toolchain upgrade no longer breaks admitted proofs.
// scripts/snapshot-g678-machine-local-evidence.mjs makes it once from exact pins. A missing
// snapshot file fails closed; it never falls back to the recorded machine path.
export const G678_EVIDENCE_SNAPSHOT_ROOT = '/Volumes/Life /HELP MATH 2.0-g678-evidence-snapshots/machine-local-v1';
export const G678_SNAPSHOT_BOUND_ROOTS = Object.freeze([
  '/opt/homebrew/Cellar/ffmpeg/8.1.2_1',
  '/opt/homebrew/Cellar/python@3.14/3.14.7',
  '/opt/homebrew/Cellar/swfmill/0.3.6_1',
  '/Users/peter/Applications/FFDec.app',
  '/Users/peter/Library/Application Support/HELP Math Flash Workbench/temurin-jre-21.0.11+10',
  '/Users/peter/.local/share/node-v24.18.0-darwin-arm64',
  '/Users/peter/Documents/Codex/2026-10-07/g678-generated-builds/l8p30-registered-production-20261007-v1',
]);
const within = (file, root) => file === root || file.startsWith(root + path.sep);
function snapshotBinding(recorded) {
  const root = G678_SNAPSHOT_BOUND_ROOTS.find(item => within(recorded, item));
  return root ? {recorded: root, physical: G678_EVIDENCE_SNAPSHOT_ROOT + root} : null;
}
/** True for a recorded address whose physical custody is the Life evidence snapshot. */
export const isG678SnapshotBoundPath = recorded => snapshotBinding(recorded) !== null;
function historicalHomeBinding(recorded) {
  const home = os.homedir();
  assert(path.isAbsolute(home) && path.normalize(home) === home, 'G678 home binding requires a canonical home');
  if (home === G678_RECORDED_HOME) return null;
  const subroot = G678_RECORDED_HOME_CACHE_SUBROOTS.find(item => within(recorded, `${G678_RECORDED_HOME}/${item}`));
  return subroot ? {recorded: `${G678_RECORDED_HOME}/${subroot}`, physical: path.join(home, subroot)} : null;
}
const modulePath = typeof import.meta.url === 'string' ? fileURLToPath(import.meta.url) : '';

/** Includes Next's apps/web working directory and bundled server modules. */
export function isG678LifeExecution(workspaceRoot = process.cwd()) {
  return [workspaceRoot, process.cwd(), modulePath].some(value => within(value, G678_LIFE_EXECUTION_ROOT));
}

function resolvePhysical(recorded, workspaceRoot, historicalEvidence) {
  assert(typeof recorded === 'string' && path.isAbsolute(recorded) && path.normalize(recorded) === recorded,
    'G678 physical binding requires an absolute canonical path');
  if (!isG678LifeExecution(workspaceRoot)) return recorded;
  assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, G678_LIFE_SOURCE_ROOT,
    'Fresh Life execution requires the exact Life G678 source root');
  const binding = G678_LIFE_ROOT_BINDINGS.find(item => within(recorded, item.recorded)) ??
    (historicalEvidence ? snapshotBinding(recorded) ?? historicalHomeBinding(recorded) : null);
  const physical = binding ? binding.physical + recorded.slice(binding.recorded.length) : recorded;
  assert(historicalEvidence || !['/Volumes/WestWorld', '/Volumes/American Dream'].some(root => within(physical, root)),
    'Unmapped preserved-disk evidence root: ' + recorded);
  assert.equal(realpathSync(physical), physical, 'G678 relocated physical path must not follow a symlink: ' + recorded);
  return physical;
}

/** Fresh source/project/tool addresses must be on the verified Life roots.
 * A missing Life target never falls back to an original disk. */
export function resolveG678PhysicalPath(recorded, workspaceRoot = process.cwd()) {
  return resolvePhysical(recorded, workspaceRoot, false);
}

/** Read-only historical evidence may retain an unmapped original address.
 * This is not an import/execution path or a write destination. Callers retain
 * their existing ordinary-file, stability, byte-length and SHA-256 checks. */
export function resolveG678HistoricalEvidencePath(recorded, workspaceRoot = process.cwd()) {
  return resolvePhysical(recorded, workspaceRoot, true);
}
