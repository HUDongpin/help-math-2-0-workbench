#!/usr/bin/env node
/** Re-pin one unregistered HFR candidate after a reviewed shared-runtime change.
 * The predecessor factory run is copied byte-for-byte into a new run; only the
 * declared runtime files are re-pinned in the closure and packet. Nothing is
 * overwritten: the predecessor packet and run stay intact as evidence. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateHfrCurrentProducer} from './lib/hfr-artifact-binding-v1.mjs';

const RUNTIME_ROOT = 'packages/demos/src/hfr/';
const RUN = /^work\/g678-shared-page-factory\/(hfr-ts-[a-z0-9][a-z0-9-]*)\/members\/[^/]+\/artifact-closure\.json$/u;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function pinOf(root, file) {
  const bytes = fs.readFileSync(path.join(root, file));
  return {path: file, bytes: bytes.length, sha256: sha256(bytes)};
}
const samePin = (a, b) => a.path === b.path && a.bytes === b.bytes && a.sha256 === b.sha256;

/** Pure projection: rewrite run paths and the declared runtime pins only. */
export function projectPacket(packet, {fromRun, toRun, calibrationId, changed, closurePin}) {
  const text = JSON.stringify(packet);
  assert(text.includes(fromRun) && !text.includes(toRun), 'predecessor run appears; successor run is new');
  const moved = JSON.parse(text.split(`/${fromRun}/`).join(`/${toRun}/`));
  const replace = pin => {
    const current = changed.find(c => c.path === pin.path);
    if (current) return current;
    if (pin.path === closurePin.path) return closurePin;
    return pin;
  };
  const visit = value => {
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === 'object') {
      if (typeof value.path === 'string' && typeof value.sha256 === 'string' && Object.keys(value).length === 3) return replace(value);
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, visit(v)]));
    }
    return value;
  };
  return {...visit(moved), calibrationId};
}

export function repinHfrCandidate(root, {packetPath, toRun, changedFiles}) {
  assert(/^hfr-ts-[a-z0-9][a-z0-9-]*$/u.test(toRun), 'successor run name');
  assert(changedFiles.length > 0 && changedFiles.every(f => f.startsWith(RUNTIME_ROOT)), 'shared runtime files only');
  const packet = JSON.parse(fs.readFileSync(path.join(root, packetPath), 'utf8'));
  const closurePath = packet.entry.artifacts.closure.path, match = RUN.exec(closurePath);
  assert(match, 'HFR closure path'); const fromRun = match[1];
  const fromDir = `work/g678-shared-page-factory/${fromRun}`, toDir = `work/g678-shared-page-factory/${toRun}`;
  assert(!fs.existsSync(path.join(root, toDir)), 'fresh successor run');
  const closure = JSON.parse(fs.readFileSync(path.join(root, closurePath), 'utf8'));
  const changed = changedFiles.map(f => pinOf(root, f));
  for (const pin of changed) {
    const old = closure.runtime.find(p => p.path === pin.path);
    assert(old, `closure pins ${pin.path}`); assert(!samePin(old, pin), `${pin.path} actually changed`);
  }
  fs.cpSync(path.join(root, fromDir), path.join(root, toDir), {recursive: true, errorOnExist: true, force: false, preserveTimestamps: true});
  const movedClosure = JSON.parse(JSON.stringify(closure).split(`/${fromRun}/`).join(`/${toRun}/`));
  const nextClosure = {...movedClosure, runtime: movedClosure.runtime.map(p => changed.find(c => c.path === p.path) ?? p)};
  const nextClosurePath = closurePath.replace(`/${fromRun}/`, `/${toRun}/`);
  fs.writeFileSync(path.join(root, nextClosurePath), JSON.stringify(nextClosure, null, 2) + '\n');
  const closurePin = pinOf(root, nextClosurePath);
  const calibrationId = packet.calibrationId.replace(fromRun.replace(/^hfr-ts-/u, ''), toRun.replace(/^hfr-ts-/u, ''));
  assert(calibrationId !== packet.calibrationId, 'successor calibration identity');
  const next = projectPacket(packet, {fromRun, toRun, calibrationId, changed, closurePin});
  for (const pin of next.integrity.files) assert(samePin(pin, pinOf(root, pin.path)), `exact successor input ${pin.path}`);
  const nextPacketPath = path.posix.join(path.posix.dirname(packetPath), `${calibrationId}.json`);
  fs.writeFileSync(path.join(root, nextPacketPath), JSON.stringify(next, null, 2) + '\n', {flag: 'wx'});
  validateHfrCurrentProducer(root, next, next.entry, next);
  return {packet: pinOf(root, nextPacketPath), closure: closurePin, predecessor: pinOf(root, packetPath), changed, fromRun, toRun};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [packetPath, toRun, ...changedFiles] = process.argv.slice(2);
  assert(packetPath && toRun && changedFiles.length, 'usage: repin-hfr-candidate-packet.mjs <packet.json> <hfr-ts-run> <runtime-file>...');
  console.log(JSON.stringify(repinHfrCandidate(process.cwd(), {packetPath, toRun, changedFiles}), null, 2));
}
