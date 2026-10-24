import {createHash} from 'node:crypto';
import {G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT,
  validateG678InstructionalBehaviorDelta} from './g678-instructional-behavior-delta-authority.server';

// Exact V4 admission only; V2/V3 do not use this successor authority.
export const G678_MATH_COMPANION_AUTHORITY = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l11-two-page-companion-successor-v1.fragment.json',
  bytes: 90872, sha256: '85bee4ae75e8e316d774e2c8097bf346633932be8916f28691c6bd011b66843a',
});
export const G678_MATH_COMPANION_AUTHORITY_TYPE = 'g678-alg-l11-two-page-companion-successor-fragment-v1';
export const G678_MATH_COMPANION_SUFFIXES = Object.freeze({
  'shared-alg001-l11-p034': 'alg-l11-p034-math-companion',
  'shared-alg001-l11-p044': 'alg-l11-p044-math-companion',
});
const RUN = Object.freeze({
  path: 'work/g678-shared-page-factory/g678-alg-l11-two-page-companion-successor-v1/run-manifest.json',
  bytes: 50224, sha256: 'c10c543e107f6b8688cb250f131f332f4cbcbc7110bc4f9581f1aa0b77bc75e8',
});
const MANIFESTS = [
  {path: 'catalog/g678-alg-l11-p034-companion-candidate-v1.json', bytes: 20381,
    sha256: '870b69564a97ec18cd4d1e20e214336d7cb40e2fbef1f96c2d3c59c3ff7d720a'},
  {path: 'catalog/g678-alg-l11-p044-companion-candidate-v1.json', bytes: 39347,
    sha256: '6ed521391b2a770dcb010383162811485e840fdb58e902ea973b977f221f7fb8'},
];
type Json = Record<string, unknown>;
type FileBinding = Readonly<{path: string; bytes: number; sha256: string; value: unknown}>;
const exact = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const bindingMatches = (actual: FileBinding, expected: Omit<FileBinding, 'value'>) =>
  exact(Object.keys(actual).sort(), ['bytes', 'path', 'sha256', 'value']) &&
  actual.path === expected.path && actual.bytes === expected.bytes && actual.sha256 === expected.sha256;
const record = (v: unknown): Json => v && typeof v === 'object' && !Array.isArray(v) ? v as Json : {};
const omit = (v: Json, keys: string[]) => Object.fromEntries(Object.entries(v).filter(([key]) => !keys.includes(key)));
function required(value: unknown, reason: string): asserts value {
  if (!value) throw new Error(`G678_MATH_COMPANION_AUTHORITY_INVALID: ${reason}`);
}

/** Exact canonical authority + both predecessor bindings are required. This
 * yields proposed slots; it does not activate a descriptor or register pages. */
export function validateG678MathCompanionAuthority(authority: FileBinding,
  dualPredecessor: FileBinding | undefined, originalPredecessor: FileBinding | undefined) {
  required(bindingMatches(authority, G678_MATH_COMPANION_AUTHORITY), 'authority file binding');
  const bytes = Buffer.from(JSON.stringify(authority.value, null, 2) + '\n');
  required(bytes.length === authority.bytes && createHash('sha256').update(bytes).digest('hex') === authority.sha256,
    'authority differs from exact canonical bytes');
  required(dualPredecessor && bindingMatches(dualPredecessor, G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT),
    'exact dual predecessor binding');
  const sourceRuns = validateG678InstructionalBehaviorDelta(dualPredecessor.value, originalPredecessor);
  const root = record(authority.value), prior = record(dualPredecessor.value);
  required(root.artifactType === G678_MATH_COMPANION_AUTHORITY_TYPE &&
    exact(root.dualPredecessorFragment, G678_INSTRUCTIONAL_BEHAVIOR_DELTA_FRAGMENT) &&
    exact(root.companionCompilerRun, RUN) && exact(root.sourceCompanionManifests, MANIFESTS), 'source lineage');
  required(root.changedPlacementCount === 2 && root.inheritedPlacementCount === 21 &&
    root.registryEntriesWritten === 0 && root.candidateRegistrationQaPassed === false &&
    root.productCalibrationPassed === false && root.scaleOutAuthorized === false &&
    root.acceptancePassed === false && root.releaseAuthorized === false && root.published === false,
    'scope and independent gates');
  const entries = root.entries, priorEntries = prior.entries;
  required(Array.isArray(entries) && entries.length === 23 && Array.isArray(priorEntries) && priorEntries.length === 23,
    'exact23 membership');
  const proposedPresentations = new Map<string, Readonly<{pageInteractionCompanionTargetIdSuffix: string}>>();
  for (let index = 0; index < entries.length; index++) {
    const entry = record(entries[index]), old = record(priorEntries[index]);
    required(typeof entry.key === 'string' && entry.key === old.key, 'same source order');
    const suffix = Object.hasOwn(G678_MATH_COMPANION_SUFFIXES, entry.key)
      ? G678_MATH_COMPANION_SUFFIXES[entry.key as keyof typeof G678_MATH_COMPANION_SUFFIXES] : undefined;
    if (!suffix) {required(exact(entry, old), `${entry.key}: inherited member drift`); continue;}
    const allowed = ['module', 'moduleFile', 'timeline', 'memberManifest', 'proposedPresentation'];
    required(exact(omit(entry, allowed), omit(old, allowed)), `${entry.key}: behavior/source/capability drift`);
    required(exact(entry.proposedPresentation, {pageInteractionCompanionTargetIdSuffix: suffix, descriptorActivated: false}),
      `${entry.key}: exact proposed slot`);
    required(record(entry.memberManifest).path === RUN.path.replace('/run-manifest.json', `/members/${entry.key}/member-manifest.json`),
      `${entry.key}: member/run crossing`);
    proposedPresentations.set(entry.key, Object.freeze({pageInteractionCompanionTargetIdSuffix: suffix}));
    sourceRuns.set(entry.key, RUN);
  }
  required(proposedPresentations.size === 2 && sourceRuns.size === 23 &&
    exact(root.proposedCompanionDescriptors, [...proposedPresentations].map(([animationId, presentation]) =>
      ({animationId, ...presentation, activated: false}))), 'exact two proposed descriptors');
  return {sourceRuns, proposedPresentations};
}
