import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {resolveG678HistoricalEvidencePath} from '../../../lib/g678-life-root-binding-v1.mjs';
import {isDeepStrictEqual as exact} from 'node:util';

type Json = Record<string, unknown>;
export type FrozenGlossaryPin = Readonly<{path: string; bytes: number; sha256: string}>;
export type FrozenGlossaryBinding = FrozenGlossaryPin & Readonly<{value: unknown}>;
export const FROZEN_GLOSSARY_IDS = Object.freeze(['shared-alg001-l05-p030', 'shared-alg001-l08-p025',
  'shared-dat001-l03-p030', 'shared-dat001-l07-p025', 'shared-geo001-l02-p020', 'shared-geo001-l07-p040',
  'shared-geo001-l11-p030', 'shared-nms002-l05-p040']);
export const FROZEN_GLOSSARY_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v4.json', bytes: 2492014,
  sha256: 'd255d5b96f8442c3ab096a0c92c3b52676d68030ca43be267f273f398373ce07'});
export const FROZEN_GLOSSARY_REGISTRY_WITNESS = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-current-js-379-v2-frozen-glossary-registry-witness.json',
  bytes: 433976, sha256: '8a9d076d3b8c781e3255163216666e644488f159bbb2eaff41b479a8802b9c0e'});
const PREDECESSOR = Object.freeze({path: 'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.json',
  bytes: 2428383, sha256: '949572a4abc466d30d6bb7ffd52ab3b61f57f7f7dd7497ed5c224b931a88af4d'});
const CANDIDATE = Object.freeze({path: 'work/g678-shared-page-factory/frozen16-glossary-candidates-v2/manifest.json',
  bytes: 84804, sha256: '6990f5819ff85183d0518183e1358d7c8b835716561ba9cbd46837ae65869768'});
const AUDIT = Object.freeze({path: 'work/g678-shared-page-factory/frozen16-glossary-audit-v1/audit.json',
  bytes: 145006, sha256: 'c69e03b127cd853f154c6da02321da1201da8243786038ba6fe01e68b9ff1c46'});
const record = (value: unknown): Json => value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {};
function requireThat(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`G678_FROZEN_GLOSSARY_AUTHORITY_INVALID: ${message}`);
}
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function canonical(binding: FrozenGlossaryBinding, expected: FrozenGlossaryPin): Json {
  requireThat(binding.path === expected.path && binding.bytes === expected.bytes && binding.sha256 === expected.sha256, 'pin mismatch');
  const bytes = Buffer.from(JSON.stringify(binding.value, null, 2) + '\n');
  requireThat(bytes.length === expected.bytes && sha(bytes) === expected.sha256, 'JSON bytes mismatch');
  return record(binding.value);
}
function pin(value: unknown): FrozenGlossaryPin {
  const p = record(value);
  requireThat(typeof p.path === 'string' && Number.isSafeInteger(p.bytes) && Number(p.bytes) > 0 &&
    typeof p.sha256 === 'string' && /^[a-f0-9]{64}$/u.test(p.sha256), 'invalid physical pin');
  return {path: p.path, bytes: Number(p.bytes), sha256: p.sha256};
}

export function validateFrozenGlossaryReplacement(input: {
  predecessor: FrozenGlossaryBinding; freeze: FrozenGlossaryBinding; candidate: FrozenGlossaryBinding;
}) {
  const prior = canonical(input.predecessor, PREDECESSOR), current = canonical(input.freeze, FROZEN_GLOSSARY_FREEZE);
  const candidate = canonical(input.candidate, CANDIDATE);
  requireThat(Array.isArray(prior.selectedPages) && Array.isArray(current.selectedPages) &&
    prior.selectedPages.length === 379 && current.selectedPages.length === 379, 'same 379 placement count');
  requireThat(Array.isArray(candidate.entries) && exact(candidate.entries.map(e => record(e).key), FROZEN_GLOSSARY_IDS), 'exact eight frozen pages');
  requireThat(exact(current.selectedPages.filter(p => !FROZEN_GLOSSARY_IDS.includes(String(record(p).animationId))),
    prior.selectedPages.filter(p => !FROZEN_GLOSSARY_IDS.includes(String(record(p).animationId)))), '371 other page objects changed');
  for (const entry of candidate.entries.map(record)) {
    const before = record(prior.selectedPages.find(p => record(p).animationId === entry.key));
    const after = record(current.selectedPages.find(p => record(p).animationId === entry.key));
    requireThat(exact(before.runtime, after.runtime) && exact(after.runtime, entry.runtime), 'source runtime changed');
    requireThat(before.sourceSha256 === record(entry.source).sha256 && after.sourceSha256 === before.sourceSha256, 'source identity changed');
    requireThat(exact(after.presentation, entry.presentation) && exact(after.glossaryEntries, entry.glossaryEntries) &&
      exact(record(after.frozenGlossarySuccessor).controls, entry.controls), 'unbound controls or definitions');
    requireThat(after.productCalibrationPassed === false && after.engineeringPreviewReady === false, 'page acceptance changed');
  }
  requireThat(current.productCalibrationPassed === false && current.scaleOutAuthorized === false &&
    Object.values(record(current.acceptanceEffects)).every(v => v === false), 'global acceptance changed');
  return {predecessor: input.predecessor, entries: candidate.entries.map(record)};
}

function absolute(root: string, supplied: string): string {
  const file = path.isAbsolute(supplied) ? supplied : path.join(root, supplied);
  const allowed = [root, '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware',
    '/Volumes/WestWorld/HELP MATH Related Files/Private Recovery Containers/2026-08-25-BOULDER-LEARNING-AWS-S3-EMERGENCY-V1',
    '/Volumes/American Dream/hudongpin/helpmath-execution-20260906-01a0747f'];
  requireThat(path.resolve(file) === file, 'physical path must be canonical');
  const physical = resolveG678HistoricalEvidencePath(file, root);
  requireThat(allowed.some(r => physical.startsWith(resolveG678HistoricalEvidencePath(r, root) + path.sep)),
    'physical path outside exact roots');
  requireThat(realpathSync(physical) === physical, 'physical path follows a symlink');
  return physical;
}
function physical(root: string, p: FrozenGlossaryPin): Buffer {
  const file = absolute(root, p.path), before = lstatSync(file, {bigint: true});
  requireThat(before.isFile() && before.nlink === 1n, 'ordinary single-link file required');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  requireThat(before.ino === after.ino && before.dev === after.dev && before.mtimeNs === after.mtimeNs && before.size === after.size &&
    bytes.length === p.bytes && sha(bytes) === p.sha256, `physical bytes changed: ${p.path}`);
  return bytes;
}
export function readFrozenGlossaryPackage(root: string, freeze?: FrozenGlossaryBinding) {
  const bound = (p: FrozenGlossaryPin): FrozenGlossaryBinding => ({...p, value: JSON.parse(physical(root, p).toString())});
  const input = {predecessor: bound(PREDECESSOR), freeze: freeze ?? bound(FROZEN_GLOSSARY_FREEZE), candidate: bound(CANDIDATE)};
  const validated = validateFrozenGlossaryReplacement(input);
  const audit = record(bound(AUDIT).value), candidate = record(input.candidate.value);
  requireThat(exact(record(audit.summary), {pages: 8, buttonDefinitions: 41, distinctTerms: 33}), 'source audit scope changed');
  requireThat(Array.isArray(audit.inputBindings) && Array.isArray(candidate.inputs) && Array.isArray(candidate.outputs), 'missing physical closure');
  const pins = [PREDECESSOR, FROZEN_GLOSSARY_FREEZE, CANDIDATE, AUDIT, FROZEN_GLOSSARY_REGISTRY_WITNESS,
    ...audit.inputBindings.map(pin), ...candidate.inputs.map(pin), ...candidate.outputs.map(pin),
    ...validated.entries.flatMap(e => [pin(e.predecessorTimeline), pin(record(e.artifacts).runtime)])];
  const unique = new Map<string, FrozenGlossaryPin>();
  for (const p of pins) {
    const key = absolute(root, p.path), prior = unique.get(key);
    requireThat(!prior || prior.sha256 === p.sha256 && prior.bytes === p.bytes, 'conflicting physical binding');
    unique.set(key, p);
  }
  for (const p of unique.values()) physical(root, p);
  return {...validated, candidate: input.candidate, physicalPaths: [...unique.keys()]};
}
