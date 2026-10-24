import {createHash} from 'node:crypto';

export const G678_BEHAVIOR_DELTA_AUTHORITY_TYPE =
  'g678-alg-l11-instructional-feedback-host-score-successor-fragment-v1';
export const G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l11-instructional-feedback-host-score-successor-v1.fragment.json',
  bytes: 89320, sha256: '99fba166192b39cc423513b510c882737331717ed78dc53c26ae007d05770482',
});
export const G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l11-instructional-successor-current-js-v1.fragment.json',
  bytes: 87592, sha256: '902f5337f635367cac29558fce035bcf054a9782bfb57adbe08ab4bade663ce2',
});
const SOURCE_RUNS = Object.freeze({
  base: {path: 'work/g678-shared-page-factory/g678-alg-l11-instructional-successor-current-js-v1/run-manifest.json',
    bytes: 10115, sha256: '4c290bd797a366d31c940db9612053317822f6ece1bc18686e6b614091bef1ae'},
  p034: {path: 'work/g678-shared-page-factory/g678-alg-l11-p034-feedback-successor-v1/run-manifest.json',
    bytes: 11926, sha256: '7741f0d3e0cd228011d2333c06e914a39d56dc2b983124cbbdffd99534ada859'},
  p044: {path: 'work/g678-shared-page-factory/g678-alg-l11-instructional-host-score-successor-v1/run-manifest.json',
    bytes: 9186, sha256: '53d7faa0797b506553773cda8b439b9706d303175e3bb979e3468f4d90d0fb20'},
});
type Json = Record<string, unknown>;
function record(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {};
}
function requireFact(value: unknown, reason: string): asserts value {
  if (!value) throw new Error(`G678_INSTRUCTIONAL_BEHAVIOR_DELTA_INVALID: ${reason}`);
}
const exact = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const omit = (object: Json, keys: string[]) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));

/** Only this source-pinned two-page delta may override the shared source run.
 * All inherited members retain their exact original member/run relationship. */
export function validateG678InstructionalBehaviorDelta(authorityValue: unknown,
  predecessor: {path: string; bytes: number; sha256: string; value: unknown} | undefined) {
  const authority = record(authorityValue);
  requireFact(authority.artifactType === G678_BEHAVIOR_DELTA_AUTHORITY_TYPE, 'artifact type');
  const authorityBytes = Buffer.from(JSON.stringify(authorityValue, null, 2) + '\n');
  requireFact(authorityBytes.length === G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.bytes &&
    createHash('sha256').update(authorityBytes).digest('hex') === G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT.sha256,
    'dual authority value differs from its exact canonical bytes');
  requireFact(predecessor && exact({path: predecessor.path, bytes: predecessor.bytes, sha256: predecessor.sha256},
    G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT), 'predecessor binding');
  const predecessorBytes = Buffer.from(JSON.stringify(predecessor.value, null, 2) + '\n');
  requireFact(predecessorBytes.length === predecessor.bytes && createHash('sha256').update(predecessorBytes).digest('hex') === predecessor.sha256,
    'predecessor value differs from its canonical bytes');
  requireFact(exact(authority.predecessorFragment, G678_INSTRUCTIONAL_PREDECESSOR_FRAGMENT), 'declared predecessor');
  requireFact(exact(authority.compilerRun, SOURCE_RUNS.base) && exact(authority.p034CompilerRun, SOURCE_RUNS.p034) &&
    exact(authority.p044CompilerRun, SOURCE_RUNS.p044), 'only the exact source runs are admitted');
  requireFact(authority.changedPlacementCount === 2 && authority.inheritedPlacementCount === 21 &&
    authority.productCalibrationPassed === false && authority.releaseAuthorized === false && authority.published === false,
    'scope and acceptance');
  const oldEntries = record(predecessor.value).entries;
  const entries = authority.entries;
  requireFact(Array.isArray(oldEntries) && oldEntries.length === 23 && Array.isArray(entries) && entries.length === 23, 'exact23 membership');
  const byId = new Map<string, Json>();
  for (let index = 0; index < entries.length; index += 1) {
    const entry = record(entries[index]), prior = record(oldEntries[index]);
    requireFact(entry.key === prior.key && typeof entry.key === 'string', 'source order');
    const changed = entry.key === 'shared-alg001-l11-p034' || entry.key === 'shared-alg001-l11-p044';
    if (!changed) {
      requireFact(exact(entry, prior), `${entry.key}: inherited entry changed`);
      byId.set(entry.key, SOURCE_RUNS.base);
      continue;
    }
    requireFact(exact(omit(entry, ['module', 'moduleFile', 'timeline', 'memberManifest', 'runtimeContract']),
      omit(prior, ['module', 'moduleFile', 'timeline', 'memberManifest', 'runtimeContract'])), `${entry.key}: unrelated fields changed`);
    const runtime = record(entry.runtimeContract), priorRuntime = record(prior.runtimeContract);
    requireFact(exact(omit(runtime, ['lessonHostCapabilities']), omit(priorRuntime, ['lessonHostCapabilities'])),
      `${entry.key}: source runtime changed`);
    requireFact(exact(runtime.lessonHostCapabilities, entry.key.endsWith('p034') ? ['practice-feedback'] : ['fq-scoring']),
      `${entry.key}: host capability scope`);
    const sourceRun = entry.key.endsWith('p034') ? SOURCE_RUNS.p034 : SOURCE_RUNS.p044;
    requireFact(record(entry.memberManifest).path ===
      sourceRun.path.replace('/run-manifest.json', `/members/${entry.key}/member-manifest.json`), `${entry.key}: member/run crossed`);
    byId.set(entry.key, sourceRun);
  }
  requireFact(byId.size === 23, 'duplicate source placement');
  return byId;
}
