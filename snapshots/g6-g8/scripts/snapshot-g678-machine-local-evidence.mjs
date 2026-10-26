#!/usr/bin/env node
/** Builds the Life snapshot of machine-local historical evidence from exact pins.
 *
 * Default is a read-only dry run that reports, for every planned pin, whether a byte-identical
 * source is readable on this machine. --write copies each verified source to
 * <snapshotRoot><recorded path> with exclusive create, re-verifies it, makes it read-only and
 * finally writes MANIFEST.json. It never overwrites, deletes, follows a symlink or rewrites a
 * recorded pin. Standalone on purpose: run it on the Codex Mac before the snapshot binding in
 * lib/g678-life-root-binding-v1.mjs is applied.
 *
 * Usage: node scripts/snapshot-g678-machine-local-evidence.mjs <plan.json> [--write]
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [planFile, ...flags] = process.argv.slice(2);
const write = flags.includes('--write');
assert(planFile, 'usage: snapshot-g678-machine-local-evidence.mjs <plan.json> [--write]');
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
assert.equal(plan.kind, 'g678-machine-local-evidence-snapshot-plan-v1', 'snapshot plan kind');
const {snapshotRoot, boundRoots, entries} = plan;
assert(path.isAbsolute(snapshotRoot) && path.normalize(snapshotRoot) === snapshotRoot, 'canonical snapshot root');
const within = (file, root) => file === root || file.startsWith(root + path.sep);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const STABLE = ['dev', 'ino', 'size', 'mtimeMs', 'ctimeMs', 'mode', 'nlink'];

/** Bytes of an ordinary, canonical file whose length and SHA-256 equal the pin, else null. */
function readExact(file, pin) {
  let before;
  try { before = fs.lstatSync(file); } catch { return null; }
  if (!before.isFile() || before.isSymbolicLink() || fs.realpathSync(file) !== file) return null;
  const bytes = fs.readFileSync(file), after = fs.lstatSync(file);
  assert(STABLE.every(k => before[k] === after[k]), `unstable read: ${file}`);
  return bytes.length === pin.bytes && sha256(bytes) === pin.sha256 ? bytes : null;
}

const seen = new Map(), report = [];
for (const entry of entries) {
  const {recorded, bytes, sha256: digest} = entry;
  assert(path.isAbsolute(recorded) && path.normalize(recorded) === recorded, `canonical recorded path: ${recorded}`);
  assert(boundRoots.some(root => within(recorded, root)), `recorded path outside the bound roots: ${recorded}`);
  assert(Number.isSafeInteger(bytes) && bytes >= 0 && /^[a-f0-9]{64}$/.test(digest), `exact pin: ${recorded}`);
  assert(!seen.has(recorded) || seen.get(recorded) === digest, `conflicting pins for one recorded path: ${recorded}`);
  seen.set(recorded, digest);
  const target = snapshotRoot + recorded, pin = {bytes, sha256: digest};
  if (fs.existsSync(target)) {
    report.push({recorded, status: readExact(target, pin) ? 'present' : 'conflict', target});
    continue;
  }
  const sources = [recorded, ...(entry.seedFrom ?? [])];
  const source = sources.find(file => readExact(file, pin));
  if (!source) { report.push({recorded, status: 'unavailable', tried: sources}); continue; }
  if (!write) { report.push({recorded, status: 'available', source}); continue; }
  fs.mkdirSync(path.dirname(target), {recursive: true, mode: 0o755});
  const fd = fs.openSync(target, 'wx', 0o644);
  try { fs.writeSync(fd, readExact(source, pin)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.chmodSync(target, 0o444);
  assert(readExact(target, pin), `written snapshot differs: ${target}`);
  report.push({recorded, status: 'written', source, target});
}
const counts = report.reduce((acc, r) => ({...acc, [r.status]: (acc[r.status] ?? 0) + 1}), {});
const complete = report.every(r => ['present', 'written', ...(write ? [] : ['available'])].includes(r.status));
if (write && complete) {
  const manifest = {kind: 'g678-machine-local-evidence-snapshot-v1', snapshotRoot, boundRoots, createdAt: new Date().toISOString(),
    plan: {path: path.resolve(planFile), sha256: sha256(fs.readFileSync(planFile))},
    files: entries.map(({recorded, bytes, sha256: digest}) => ({recorded, bytes, sha256: digest}))};
  fs.writeFileSync(path.join(snapshotRoot, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n', {flag: 'wx', mode: 0o444});
}
console.log(JSON.stringify({mode: write ? 'write' : 'dry-run', snapshotRoot, entries: entries.length, counts, complete, report}, null, 1));
process.exit(complete ? 0 : 1);
