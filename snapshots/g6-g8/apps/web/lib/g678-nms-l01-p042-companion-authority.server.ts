import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {resolveG678HistoricalEvidencePath} from '../../../lib/g678-life-root-binding-v1.mjs';

// One reviewed page only, pinned to the independent candidate and the exact
// reproducible source packet. No page family or scale-out authority is implied.
export const G678_P042_ID = 'shared-nms002-l01-p042';
export const G678_P042_FAMILY = 'nms-l01-p042-readable-companion-maintained-dom';
export const G678_P042_SUFFIX = 'nms-l01-p042-readable-companion';
export const G678_P042_AUTHORITY_TYPE = 'g678-nms-l01-p042-readable-companion-current-js-fragment-v1';
export const G678_P042_AUTHORITY = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p042-readable-companion-current-js-v1.fragment.json',
  bytes: 4942, sha256: '90f82d1efa3de8d5658135a1d7a4b9c6ace6abc4beb8bba9e644d63331fd4921',
});
export const G678_P042_BASE = Object.freeze({path: 'catalog/g678-nms-l01-p042-candidate-v1.json',
  bytes: 73582, sha256: '4923ae74bfecc6659d338ff805f9891e956ac6736c91f612628da74a8bd493f5'});
export const G678_P042_READABLE = Object.freeze({path: 'catalog/g678-nms-l01-p042-readable-companion-candidate-v1.json',
  bytes: 44671, sha256: 'fbc18882c13414365ad5e6f05a89fa0acc7cfeeab8ac9a06c4982a20eded997f'});
export const G678_P042_PREDECESSOR = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.json',
  bytes: 2408370, sha256: '4633c4a3853e44ff1cd58184cf154acc6edc7e2e96ed936c72ce2decc006d358',
});
export const G678_P042_RUN_PATH = 'work/g678-shared-page-factory/g678-nms-l01-p042-readable-current-js-v1/run-manifest.json';
const MODULE = 'packages/demos/src/modules/g678-nms-l01-readable-current-js-p042.tsx';
const TIMELINE = 'packages/demos/src/timelines/g678-nms-l01-readable-current-js-p042.ts';
const MEMBER = G678_P042_RUN_PATH.replace('/run-manifest.json', `/members/${G678_P042_ID}/member-manifest.json`);
const SOURCE = Object.freeze({path: 'G6-G8-shared/NMS002/L1/TS/L1TS06.swf', bytes: 55501,
  sha256: 'c81f09a098702054a62ac8a7307aca1ac80d305ebe2cf432cfab05a2a7f74f82'});
export const G678_P042_RUNTIME = Object.freeze({stage: {width: 800, height: 600}, rootFrameCount: 10,
  rootBeginFrame: 6, frameDomain: 'sprite-23', frameCount: 125, fps: 12, livePlaybackEndFrame: 125,
  scenario: 'nms-l01-p042-source-static-frame', language: 'fixed-en', seed: '0',
  interactiveStops: [], authoredTimelineControls: [], reducedMotionFrame: 125, lessonHostCapabilities: []});
export type G678P042Pin = Readonly<{path: string; bytes: number; sha256: string}>;
export type G678P042FileBinding = G678P042Pin & Readonly<{value: unknown}>;
type Json = Record<string, unknown>;
const record = (value: unknown): Json => value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {};
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const exact = isDeepStrictEqual;
function required(value: unknown, reason: string): asserts value {
  if (!value) throw new Error(`G678_P042_COMPANION_AUTHORITY_INVALID: ${reason}`);
}
function pin(value: unknown): G678P042Pin {
  const item = record(value);
  required(typeof item.path === 'string' && item.path.length > 0 && Number.isSafeInteger(item.bytes) &&
    Number(item.bytes) >= 0 && typeof item.sha256 === 'string' && /^[a-f0-9]{64}$/u.test(item.sha256), 'invalid file pin');
  return {path: item.path, bytes: Number(item.bytes), sha256: item.sha256};
}
function canonical(binding: G678P042FileBinding | undefined, expected: G678P042Pin, label: string) {
  required(binding && exact(Object.keys(binding).sort(), ['bytes', 'path', 'sha256', 'value']) &&
    binding.path === expected.path && binding.bytes === expected.bytes && binding.sha256 === expected.sha256,
  `${label} binding`);
  const bytes = Buffer.from(JSON.stringify(binding.value, null, 2) + '\n');
  required(expected.bytes > 0 && bytes.length === expected.bytes && hash(bytes) === expected.sha256,
    `${label} exact canonical bytes`);
  return record(binding.value);
}
function falseGates(value: unknown, label: string) {
  const values = Object.values(record(value));
  required(values.length > 0 && values.every(item => item === false), `${label} independent gates`);
}

/** Pure admission yields exact source packet pins and one proposed slot; it
 * neither reads files nor substitutes projected metadata for physical checks. */
export function validateG678P042CompanionAuthority(input: {
  authority: G678P042FileBinding;
  baseCandidate: G678P042FileBinding | undefined;
  readableCandidate: G678P042FileBinding | undefined;
  predecessorFreeze: G678P042FileBinding | undefined;
  freeze: unknown;
}) {
  const authority = canonical(input.authority, G678_P042_AUTHORITY, 'authority');
  const base = canonical(input.baseCandidate, G678_P042_BASE, 'base candidate');
  const readable = canonical(input.readableCandidate, G678_P042_READABLE, 'readable candidate');
  const prior = canonical(input.predecessorFreeze, G678_P042_PREDECESSOR, 'V4 predecessor');
  const freeze = record(input.freeze), inputs = record(freeze.inputs);
  required(exact(authority.baseCandidateManifest, G678_P042_BASE) &&
    exact(authority.readableCandidateManifest, G678_P042_READABLE) &&
    exact(readable.baseCandidateManifest, G678_P042_BASE), 'candidate lineage');
  required(authority.schemaVersion === 1 && authority.artifactType === G678_P042_AUTHORITY_TYPE &&
    authority.deploymentScope === 'local-only' && authority.exactPlacementCount === 1 &&
    authority.generatedPlacementCount === 1 && authority.registrationCandidatePlacementCount === 0 &&
    authority.currentJavaScriptRegisteredCount === 0 && authority.wholeLessonEngineeringPreviewCount === 0,
  'single local unregistered candidate');
  for (const key of ['productCalibrationPassed', 'browserProductCalibrationPassed', 'scaleOutAuthorized',
    'acceptancePassed', 'releaseAuthorized', 'published']) required(authority[key] === false, key);
  falseGates(authority.acceptanceEffects, 'authority');
  falseGates(base.gates, 'base'); falseGates(readable.gates, 'readable');
  required(base.animationId === G678_P042_ID && readable.animationId === G678_P042_ID &&
    exact(base.source, SOURCE) && exact(readable.source, SOURCE), 'exact source');
  const actual = record(readable.actualModule), config = record(actual.config);
  required(exact(actual.metadata, record(base.actualModule).metadata) && actual.baseIdentityExceptRenderer === true &&
    config.pageInteractionCompanionTargetIdSuffix === G678_P042_SUFFIX && config.sourceSwfSha256 === SOURCE.sha256,
  'inherited source runtime and exact companion');
  const entries = authority.entries;
  required(Array.isArray(entries) && entries.length === 1, 'exact one entry');
  const entry = record(entries[0]), compilerRun = pin(authority.compilerRun);
  required(entry.key === G678_P042_ID && entry.adapterFamily === G678_P042_FAMILY &&
    entry.module === './modules/g678-nms-l01-readable-current-js-p042' &&
    pin(entry.moduleFile).path === MODULE && pin(entry.timeline).path === TIMELINE &&
    pin(entry.memberManifest).path === MEMBER && compilerRun.path === G678_P042_RUN_PATH,
  'exact wrapper timeline member and run paths');
  required(entry.maturity === 'private-current-js' && entry.deploymentScope === 'local-only', 'entry scope');
  for (const key of ['registrationCandidate', 'currentJavaScriptRegistered', 'productCalibrationPassed',
    'browserProductCalibrationPassed', 'wholeLessonEngineeringPreviewReady']) required(entry[key] === false, `entry ${key}`);
  falseGates(entry.acceptanceEffects, 'entry');
  required(exact(entry.source, SOURCE) && exact(entry.mainTimeline,
    {objectId: 23, frameDomain: 'sprite-23', frameCount: 125, depth: 3}) &&
    exact(entry.runtimeContract, G678_P042_RUNTIME), 'source clock, no borrowed calibration');
  required(exact(entry.proposedPresentation,
    {pageInteractionCompanionTargetIdSuffix: G678_P042_SUFFIX, descriptorActivated: false}), 'proposed presentation');
  required(exact(inputs.p042PredecessorFreeze, G678_P042_PREDECESSOR), 'freeze predecessor binding');
  const declarations = inputs.selectionAuthorities;
  required(Array.isArray(declarations) &&
    exact(declarations.filter(item => record(item).path !== G678_P042_AUTHORITY.path),
      record(prior.inputs).selectionAuthorities), 'all prior selection authorities preserved');
  const selected = freeze.selectedPages, oldSelected = prior.selectedPages;
  required(Array.isArray(selected) && selected.length === 378 && Array.isArray(oldSelected) && oldSelected.length === 377 &&
    selected.filter(item => record(item).animationId === G678_P042_ID).length === 1 &&
    exact(selected.filter(item => record(item).animationId !== G678_P042_ID), oldSelected), 'all377 prior selected objects and order');
  required(freeze.registrationCandidatePlacementCount === 378 && freeze.sharedAdapterPlacementCount === 365 &&
    freeze.advancedManualPlacementCount === 13 && exact(freeze.pendingAdvancedManualPlacements, []), 'exact378 historical classification');
  const added = record(selected.find(item => record(item).animationId === G678_P042_ID));
  const implementation = record(added.implementation);
  required(added.complexityLane === 'behavior-heavy' && added.productCalibrationPassed === false &&
    added.engineeringPreviewReady === false && implementation.kind === 'maintained-dom-current-js-candidate' &&
    implementation.deploymentScope === 'local-only' && implementation.productCalibrationPassed === false &&
    implementation.familyVisualPlaybackCalibrationPassed === false && implementation.registeredCompanionProductQaPassed === false &&
    freeze.productCalibrationPassed === false && freeze.engineeringPreviewReady === false,
  'new selected page remains product-calibration pending');
  return {entry, compilerRun, proposedPresentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: G678_P042_SUFFIX}),
    physicalPins: collectG678P042Pins([G678_P042_AUTHORITY, G678_P042_BASE, G678_P042_READABLE, G678_P042_PREDECESSOR,
      authority, base, readable])};
}

/** Walk only canonical, already hash-validated p042 documents. Conflicting
 * bindings fail closed; the predecessor freeze is bound but never recursed. */
export function collectG678P042Pins(values: readonly unknown[]): readonly G678P042Pin[] {
  const byPath = new Map<string, G678P042Pin>();
  function visit(value: unknown) {
    if (Array.isArray(value)) {value.forEach(visit); return;}
    const item = record(value);
    if (typeof item.path === 'string' && Object.hasOwn(item, 'bytes') && Object.hasOwn(item, 'sha256')) {
      const next = pin(item), previous = byPath.get(next.path);
      required(!previous || exact(previous, next), `conflicting pin ${next.path}`);
      byPath.set(next.path, next);
    }
    Object.values(item).forEach(child => {if (child && typeof child === 'object') visit(child);});
  }
  values.forEach(visit);
  return Object.freeze([...byPath.values()].sort((a, b) => a.path.localeCompare(b.path)));
}

export function resolveG678P042PhysicalPath(root: string, relative: string) {
  if (relative.startsWith('G6-G8-shared/')) {
    required(relative === SOURCE.path && process.env.HELP_MATH_G678_SOURCE_ROOT, 'exact source root required');
    return path.resolve(process.env.HELP_MATH_G678_SOURCE_ROOT, relative);
  }
  required(!relative.includes('\\'), 'noncanonical path separator');
  if (relative.startsWith('../')) {
    // Actual esbuild evidence names installed dependencies relative to this
    // worktree. Only that canonical installed vendor tree may cross root.
    const absolute = path.resolve(root, relative), vendorRoot = realpathSync(path.join(root, 'node_modules'));
    required(absolute.startsWith(`${vendorRoot}${path.sep}`) && realpathSync(absolute) === absolute,
      'relative path escapes installed vendor tree');
    return absolute;
  }
  required(path.isAbsolute(relative) ? path.normalize(relative) === relative
    : relative.split('/').every(part => part !== '' && part !== '.' && part !== '..'), 'aliased physical path');
  // A recorded absolute root keeps its pin; only physical custody follows the reviewed Life
  // root binding. The ordinary-file, single-link, stability, byte and SHA-256 checks still apply.
  return path.isAbsolute(relative) ? resolveG678HistoricalEvidencePath(relative, root) : path.resolve(root, relative);
}

/** Actual filesystem path only: no injected reader and no synthetic metadata.
 * Every file is ordinary, canonical, single-linked, stable across its read. */
export function readG678P042PhysicalPin(root: string, expected: G678P042Pin) {
  const absolute = resolveG678P042PhysicalPath(root, expected.path);
  const before = lstatSync(absolute);
  required(before.isFile() && !before.isSymbolicLink() && before.nlink === 1 && realpathSync(absolute) === absolute,
    `noncanonical physical input ${expected.path}`);
  const bytes = readFileSync(absolute), after = lstatSync(absolute);
  required(before.dev === after.dev && before.ino === after.ino && before.size === after.size &&
    before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs && after.nlink === 1 &&
    realpathSync(absolute) === absolute && bytes.length === expected.bytes && hash(bytes) === expected.sha256,
  `physical input changed ${expected.path}`);
  return bytes;
}

export function validateG678P042PhysicalClosure(root: string,
  authority: ReturnType<typeof validateG678P042CompanionAuthority>) {
  const pins = g678P042PhysicalClosurePins(root, authority);
  const resolved = new Set<string>();
  for (const binding of pins) {
    const absolute = resolveG678P042PhysicalPath(root, binding.path);
    // The same source may be named by a source-relative and absolute pinned
    // binding. Both must agree by bytes; neither permits a symlink alias.
    readG678P042PhysicalPin(root, binding); resolved.add(absolute);
  }
  return Object.freeze([...resolved].sort());
}

export function g678P042PhysicalClosurePins(root: string,
  authority: ReturnType<typeof validateG678P042CompanionAuthority>) {
  const runBytes = readG678P042PhysicalPin(root, authority.compilerRun);
  const run = record(JSON.parse(runBytes.toString('utf8')));
  required(Buffer.from(JSON.stringify(run, null, 2) + '\n').equals(runBytes), 'compiler run canonical bytes');
  required(record(run.bundledMetadataAudit).path === 'in-memory-p042-readable-metadata.cjs',
    'exact logical metadata audit');
  const inventoryBytes = readG678P042PhysicalPin(root, pin(run.outputInventory));
  const inventory = record(JSON.parse(inventoryBytes.toString('utf8')));
  required(Buffer.from(JSON.stringify(inventory, null, 2) + '\n').equals(inventoryBytes), 'output inventory canonical bytes');
  required(inventory.fileCount === 3 && Array.isArray(inventory.files) &&
    exact(inventory.files.map(pin).sort((a, b) => a.path.localeCompare(b.path)),
      [authority.entry.moduleFile, authority.entry.timeline, authority.entry.memberManifest].map(pin)
        .sort((a, b) => a.path.localeCompare(b.path))), 'exact three output files');
  // This one hash is the deterministic in-memory esbuild/VM result, not a file
  // output. All actual source, installed dependencies and inventory files stay
  // in the physical closure. The compiler --check independently rebuilds it.
  const {bundledMetadataAudit: _logicalAudit, ...physicalRun} = run;
  return collectG678P042Pins([...authority.physicalPins, physicalRun, inventory]);
}

export function readG678P042FileBinding(root: string, expected: G678P042Pin): G678P042FileBinding {
  const bytes = readG678P042PhysicalPin(root, expected);
  // Match the maintained snapshot loader's field order, which is not itself
  // an authority. The pure validator compares fields, not insertion order.
  return Object.freeze({bytes: bytes.length, path: expected.path, sha256: hash(bytes),
    value: JSON.parse(bytes.toString('utf8')) as unknown});
}
