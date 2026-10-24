#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT = fileURLToPath(import.meta.url);
const WEB_ROOT = path.resolve(path.dirname(SCRIPT), '..');
const PROJECT_ROOT = path.resolve(WEB_ROOT, '../..');
const PRIVATE_ROOTS = Object.freeze([
  path.join(PROJECT_ROOT, 'work/g4-l12-vb036-behavior-canvas-v1'),
  path.join(PROJECT_ROOT, 'work/g4-l12-vb036-behavior-canvas-v2'),
  path.join(PROJECT_ROOT, 'work/g4-l12-vb036-behavior-canvas-v3'),
  '/Volumes/American Dream/g4-l12-vb035-pcm-calibration-20260905.GzebTj',
  '/Volumes/American Dream/g4-l12-vb036-pcm-calibration-20260905.a1ZKIn',
  '/Volumes/American Dream/current-js-audio-calibration-v1.C6g6ei',
]);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const within = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
};

/** Read-only audit of actual NFT entries, not code literals or route admission. */
export async function verifyPrivateCalibrationTraces({distRoot = path.join(WEB_ROOT, '.next')} = {}) {
  const root = path.resolve(distRoot), traces = [];
  const walk = async (directory) => {
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Trace directory must be real');
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.nft.json')) {
        if (!entry.isFile() || entry.isSymbolicLink()) throw new Error('NFT must be an ordinary file');
        traces.push(full);
      }
    }
  };
  await walk(root);
  if (traces.length === 0) throw new Error('No NFT files found; a completed build is required');
  traces.sort();
  const descriptors = [], references = new Map();
  let entryCount = 0;
  for (const trace of traces) {
    const bytes = await readFile(trace), parsed = JSON.parse(bytes);
    if (parsed.version !== 1 || !Array.isArray(parsed.files) ||
      parsed.files.some((file) => typeof file !== 'string' || file.length === 0)) throw new Error(`Invalid NFT: ${path.relative(root, trace)}`);
    descriptors.push({path: path.relative(root, trace), bytes: bytes.length, sha256: sha256(bytes)});
    for (const file of parsed.files) {
      entryCount++;
      const absolute = path.resolve(path.dirname(trace), file);
      if (!references.has(absolute)) references.set(absolute, []);
      references.get(absolute).push(path.relative(root, trace));
    }
  }
  const privateEntries = [], missingEntries = [];
  for (const [absolute, referencingTraces] of references) {
    let canonical = null;
    try { canonical = await realpath(absolute); }
    catch (error) { if (error.code === 'ENOENT') missingEntries.push(absolute); else throw error; }
    const privateRoot = PRIVATE_ROOTS.find((candidate) => within(candidate, absolute) || (canonical && within(candidate, canonical)));
    if (privateRoot) privateEntries.push({path: absolute, resolvedPath: canonical, privateRoot, referencingTraces});
  }
  return Object.freeze({
    valid: privateEntries.length === 0 && missingEntries.length === 0,
    distRoot: root,
    traceFileCount: traces.length,
    totalTraceEntries: entryCount,
    uniqueTracedFileCount: references.size,
    traceDescriptorChecksumSha256: sha256(Buffer.from(JSON.stringify(descriptors))),
    privateEntries,
    missingEntries,
    boundary: 'Actual named private calibration files must be absent from deployment traces; runtime 404 is a separate gate',
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 0) throw new Error('Usage: node scripts/verify-private-calibration-traces.mjs (audits the current apps/web/.next only)');
    const report = await verifyPrivateCalibrationTraces();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!report.valid) process.exitCode = 1;
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
