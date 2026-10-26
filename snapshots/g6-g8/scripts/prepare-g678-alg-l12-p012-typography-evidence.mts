#!/usr/bin/env -S tsx
/** Local preparation only. Neither this producer nor a source catalog awards
 * technical typography passes; independent observations remain mandatory. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {collectP005TypographyImportClosure} from './prepare-g678-alg-l12-p005-typography-binding.mts';
import {lessonTextInstanceId} from '../packages/demos/src/lesson-text-snapshot';
import {P012_TEXT_BINDING} from '../packages/demos/src/alg-l12-p012-text-binding';
import {P012_TEXT_DATA} from '../packages/demos/src/generated/alg-l12-p012-text-data';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ID = 'shared-alg001-l12-p012';
export const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const SOURCE_PATH = 'G6-G8-shared/ALG001/L12/VB/L12VB07.swf';
export const SOURCE_SHA = 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa';
export const CATALOG_SHA = 'd06bf3fc4bf99fcc498973f325efe2fb33a4e00c169f7cb612e115c10219e052';
export const OUTPUT = 'output/p012-typography-admission-20260927';
export const CANDIDATE_BINDING = `${OUTPUT}/candidate-binding.json`;
export const CANDIDATE_CHECK = `${OUTPUT}/candidate-check.json`;
export const CHECKS = Object.freeze(['sourceBinding', 'semanticText', 'mathSemantics',
  'timingAndReplay', 'teachingTextDisposition', 'hostIntegration',
  'responsiveTypography', 'accessibility', 'bilingualPolicy', 'performance',
  'lifecycle', 'resourceStability']);
export const RISKS = Object.freeze(['shape-text-unclassified', 'bitmap-text-unclassified',
  'button-runtime-state-and-actions-not-interpreted', 'dynamic-text-runtime-value-unresolved',
  'actionscript-visibility-and-values-not-interpreted', 'mask-filter-blend-semantics-unresolved']);
const SHA = /^[a-f0-9]{64}$/u;
const hash = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
const json = (value: unknown) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const sort = <T extends {path: string}>(items: readonly T[]) => [...items].sort((a, b) => a.path.localeCompare(b.path));
export type Pin = {path: string; bytes: number; sha256: string};

function relative(value: string) {
  assert(typeof value === 'string' && value && !path.isAbsolute(value) && !value.includes('\\') &&
    !value.split('/').some(segment => !segment || segment === '.' || segment === '..'),
  `Unsafe P012 evidence path: ${value}`);
}
function directory(value: string) {
  assert(path.isAbsolute(value) && fs.lstatSync(value).isDirectory() &&
    !fs.lstatSync(value).isSymbolicLink() && fs.realpathSync(value) === value,
  `Physical P012 directory required: ${value}`);
}
function stable(root: string, relativePath: string) {
  relative(relativePath);
  const file = path.join(root, relativePath), before = fs.lstatSync(file, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n &&
    fs.realpathSync(file) === file, `Ordinary single-link P012 file required: ${relativePath}`);
  const bytes = fs.readFileSync(file), after = fs.lstatSync(file, {bigint: true});
  for (const field of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
    assert.equal(after[field], before[field], `P012 file changed while reading: ${relativePath}`);
  return {bytes, pin: {path: relativePath, bytes: bytes.length, sha256: hash(bytes)},
    modifiedAt: Number(after.mtimeNs) / 1_000_000};
}

/** Verify the current maintained text binding against the physical SWF, not
 * merely against its own generated TypeScript data. Exported for mutation tests. */
export function verifySource(source: any, data: any, binding: any, meta: any, specs: any) {
  assert.equal(hash(JSON.stringify(source)), CATALOG_SHA, 'P012 source catalog drift');
  assert.equal(source.unparsedTags?.length, 0, 'P012 unparsed SWF tags');
  assert.deepEqual(source.risks.map((risk: any) => risk.kind).sort(), [...RISKS].sort(), 'P012 source risk drift');
  assert.equal(source.textDefinitions.length, 37); assert.equal(source.shapeDefinitions.length, 30);
  assert.equal(source.bitmapDefinitions.length, 1);
  assert.equal(binding.schemaVersion, 1); assert.equal(binding.version, 'p012-source-native-text-v1');
  assert.equal(binding.placementId, ID); assert.equal(binding.animationId, ID);
  assert.equal(binding.sourceSwfSha256, SOURCE_SHA); assert.equal(data.source.swfSha256, SOURCE_SHA);
  assert.equal(meta.sourceSha256, SOURCE_SHA); assert.equal(specs.sourceSha256, SOURCE_SHA);
  assert.equal(data.definitions.length, 37); assert.equal(data.instances.length, 57);
  assert.equal(binding.blocks.length, 58); assert.equal(specs.specs.length, 60);
  const sourceTexts = new Map(source.textDefinitions.map((item: any) => [item.characterId, item]));
  for (const item of data.definitions) {
    const original: any = sourceTexts.get(item.characterId);
    assert(original && original.sourceTagSha256 === item.sourceTagSha256,
      `P012 source text definition changed: ${item.characterId}`);
    assert.deepEqual((item.runs ?? []).map((run: any) => [run.sourceTextId, run.text]),
      (original.runs ?? []).map((run: any) => [run.sourceTextId, run.text]),
      `P012 source text runs changed: ${item.characterId}`);
  }
  const sourceInstances = new Map(source.timelines.flatMap((timeline: any) =>
    timeline.instances.map((item: any) => [item.instanceId, item])));
  const sourceShapes = new Map(source.shapeDefinitions.map((shape: any) =>
    [shape.characterId, shape.sourceTagSha256]));
  for (const placement of data.parentPlacements) {
    const original: any = sourceInstances.get(placement.instanceId);
    assert(original && original.characterId === Number(placement.childTimelineId.slice(7)) &&
      original.firstFrame === placement.firstFrame &&
      original.lastFrameExclusive === placement.lastFrameExclusive,
    `P012 parent placement changed: ${placement.instanceId}`);
  }
  const mainPlacement = data.parentPlacements.find((item: any) => item.childTimelineId === 'sprite-86');
  assert.equal(mainPlacement?.instanceId, 'root/depth-2/generation-1');
  const segment = (placement: any) => {
    const match = /^(root|sprite-\d+)\/depth-(\d+)\/generation-(\d+)$/u.exec(placement.instanceId);
    assert(match && match[1] === placement.parentTimelineId, 'P012 invalid parent placement identity');
    return {timelineId: match[1], depth: Number(match[2]), generation: Number(match[3]),
      characterId: Number(placement.childTimelineId.slice(7))};
  };
  for (const item of data.instances) {
    const original: any = sourceInstances.get(item.instanceId);
    assert(original && original.characterId === item.characterId &&
      original.firstFrame === item.firstFrame && original.lastFrameExclusive === item.lastFrameExclusive,
    `P012 source text placement changed: ${item.instanceId}`);
  }
  const ids = new Set<string>(), orders = new Set<string>();
  assert.deepEqual(new Set(binding.blocks.map((block: any) => block.id)),
    new Set(['title', 'button-71/record-4',
      ...data.instances.filter((item: any) => item.characterId !== 75).map((item: any) => item.instanceId)]),
  'P012 teaching placement set changed');
  for (const block of binding.blocks) {
    assert(!ids.has(block.id) && block.language === 'en' &&
      Number.isSafeInteger(block.readingOrder) && block.readingOrder >= 0,
    `P012 duplicate/invalid text block: ${block.id}`);
    ids.add(block.id);
    const order = `${block.language}:${block.readingOrder}`;
    assert(!orders.has(order), `P012 duplicate reading order: ${order}`); orders.add(order);
    assert(block.sourceTextIds.length || block.sourceShapeIds?.length, `P012 source-empty block: ${block.id}`);
    const definition = data.instances.find((item: any) => item.instanceId === block.id);
    if (definition) {
      const sourceDefinition = data.definitions.find((item: any) => item.characterId === definition.characterId);
      assert.deepEqual(block.sourceTextIds, sourceDefinition.runs?.map((run: any) => run.sourceTextId)
        ?? [sourceDefinition.sourceTextId], `P012 run omission or invention: ${block.id}`);
      assert.equal(block.instance?.id, lessonTextInstanceId(block.instance.path));
      const leaf = block.instance.path.at(-1);
      assert.equal(leaf.timelineId, definition.timelineId);
      assert.equal(leaf.depth, definition.depth); assert.equal(leaf.generation, definition.generation);
      assert.equal(leaf.characterId, definition.characterId);
      const childPlacement = definition.timelineId === 'sprite-86' ? null :
        data.parentPlacements.find((item: any) => item.childTimelineId === definition.timelineId);
      const expectedPath = [segment(mainPlacement),
        ...(childPlacement ? [segment(childPlacement)] : []),
        {timelineId: definition.timelineId, depth: definition.depth,
          generation: definition.generation, characterId: definition.characterId}];
      assert.deepEqual(block.instance.path, expectedPath, `P012 wrong source ancestry: ${block.id}`);
    } else assert(['title', 'button-71/record-4'].includes(block.id), `P012 unknown block: ${block.id}`);
    for (const sourceTextId of block.sourceTextIds)
      assert(source.textDefinitions.some((item: any) => item.sourceTextId === sourceTextId ||
        item.runs?.some((run: any) => run.sourceTextId === sourceTextId)),
      `P012 unknown source text ID: ${sourceTextId}`);
    for (const shapeId of block.sourceShapeIds ?? [])
      assert(sourceShapes.has(shapeId), `P012 unknown source shape: ${shapeId}`);
  }
  assert.deepEqual(binding.blocks.find((block: any) => block.id === 'title')?.sourceShapeIds, [1]);
  assert.deepEqual(binding.blocks.find((block: any) => block.id === 'title')?.instance?.path,
    [{timelineId: 'root', depth: 1, generation: 1, characterId: 1}]);
  assert.deepEqual(binding.blocks.find((block: any) => block.id === 'button-71/record-4')?.sourceTextIds,
    ['character-66/run-0']);
  assert.equal(binding.blocks.find((block: any) => block.id === 'button-71/record-4')?.instance, undefined);
  assert.equal(sourceShapes.get(1), 'ad0e1a655a85561ac898a7493a28f360ba4ce67e6b721df63d514b78558d46a8');
  assert.equal(sourceShapes.get(50), 'd7fc3cb7940bbde14e8b2de3c9d083c18dbb89ea4ff26f4a0a0e74e607b5457f');
  const expectedSuppression = new Set([...data.instances.map((item: any) => item.instanceId),
    'button-71/record-4', 'root/depth-1/generation-1', 'sprite-86/depth-2/generation-1']);
  assert.deepEqual(new Set(specs.specs.map((item: any) => item.instanceId)), expectedSuppression,
    'P012 exact suppression scope changed');
  assert.deepEqual(new Set(meta.suppressedSourceInstanceIds), expectedSuppression,
    'P012 metadata suppression scope changed');
  assert.equal(meta.renderScale, 2); assert.equal(meta.animationId, ID);
  return {textDefinitions: 37, textPlacements: 57, teachingBlocks: 58,
    exactSuppressionInstances: 60, titleShapeTagSha256: sourceShapes.get(1),
    underlineShapeTagSha256: sourceShapes.get(50),
    bitmap47TagSha256: source.bitmapDefinitions[0].sourceTagSha256};
}

export type Observation = {schemaVersion: 1; kind: 'p012-typography-observation-v1';
  animationId: string; sourceSwfSha256: string; sourceCatalogContentSha256: string;
  bindingVersion: string; checkedAt: string; artifacts: Pin[]; checkedImplementationFiles: Pin[];
  checks: Record<string, {result: 'passed'; detail: string; artifactPaths: string[]}>;
  sourceRiskResolutions: {kind: string; disposition: string; artifactPaths: string[]}[]};

/** A receipt may contribute only checks actually supported by pinned, separate
 * observations. Missing checks and source risks remain pending. */
export function validateObservation(observationPath: string, implementationFiles: Pin[],
  root = ROOT, now = Date.now()) {
  directory(root); relative(observationPath);
  assert(observationPath !== CANDIDATE_BINDING && observationPath !== CANDIDATE_CHECK,
    'P012 candidate output cannot be its own observation');
  const current = stable(root, observationPath), observation = JSON.parse(current.bytes.toString()) as Observation;
  assert.equal(observation.schemaVersion, 1); assert.equal(observation.kind, 'p012-typography-observation-v1');
  assert.equal(observation.animationId, ID); assert.equal(observation.sourceSwfSha256, SOURCE_SHA);
  assert.equal(observation.sourceCatalogContentSha256, CATALOG_SHA);
  assert.equal(observation.bindingVersion, 'p012-source-native-text-v1');
  const checkedAt = Date.parse(observation.checkedAt);
  assert(Number.isFinite(checkedAt) && checkedAt <= now + 1000, 'P012 real nonfuture checkedAt required');
  assert.deepEqual(sort(observation.checkedImplementationFiles), sort(implementationFiles),
    'P012 observation must bind entire current implementation closure');
  for (const pin of implementationFiles) {
    const file = stable(root, pin.path);
    assert.deepEqual(file.pin, pin, `P012 implementation changed: ${pin.path}`);
    assert(file.modifiedAt <= checkedAt + 1000, `P012 observation predates implementation: ${pin.path}`);
  }
  assert(Array.isArray(observation.artifacts) && observation.artifacts.length,
    'P012 independently saved observation artifact required');
  const implementationPaths = new Set(implementationFiles.map(pin => pin.path));
  const seen = new Set<string>();
  for (const artifact of observation.artifacts) {
    relative(artifact.path);
    assert(!seen.has(artifact.path) && artifact.path !== observationPath &&
      artifact.path !== CANDIDATE_BINDING && artifact.path !== CANDIDATE_CHECK &&
      !implementationPaths.has(artifact.path), 'P012 circular, duplicate, or implementation observation');
    seen.add(artifact.path);
    const file = stable(root, artifact.path);
    assert.deepEqual(file.pin, artifact, `P012 stale observation artifact: ${artifact.path}`);
    assert(file.modifiedAt <= checkedAt + 1000, `P012 observation predates artifact: ${artifact.path}`);
  }
  assert(observation.checks && typeof observation.checks === 'object');
  const checkNames = Object.keys(observation.checks);
  assert(checkNames.every(name => CHECKS.includes(name)), 'P012 unknown technical check');
  const riskResolutions = observation.sourceRiskResolutions ?? [];
  assert(Array.isArray(riskResolutions));
  assert(checkNames.length + riskResolutions.length > 0, 'P012 empty observation receipt');
  assert.equal(new Set(riskResolutions.map(item => item.kind)).size, riskResolutions.length);
  const reference = (item: {detail?: string; disposition?: string; artifactPaths: string[]}) => {
    assert(typeof (item.detail ?? item.disposition) === 'string' &&
      (item.detail ?? item.disposition)!.trim().length >= 20,
    'P012 concrete observation or risk disposition required');
    assert(Array.isArray(item.artifactPaths) && item.artifactPaths.length > 0 &&
      new Set(item.artifactPaths).size === item.artifactPaths.length &&
      item.artifactPaths.every(itemPath => seen.has(itemPath)),
    'P012 observation must cite independent checked artifacts');
  };
  for (const name of checkNames) {
    assert.equal(observation.checks[name].result, 'passed'); reference(observation.checks[name]);
  }
  for (const risk of riskResolutions) {
    assert(RISKS.includes(risk.kind), `P012 unknown source risk: ${risk.kind}`);
    reference(risk);
  }
  return {observation, pin: current.pin};
}

export function prepare({root = ROOT, sourceRoot = SOURCE_ROOT,
  observationPath}: {root?: string; sourceRoot?: string; observationPath?: string} = {}) {
  assert(process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV,
    'P012 evidence preparation is local engineering only');
  directory(root); assert.equal(sourceRoot, SOURCE_ROOT, 'Exact physical P012 source root required');
  directory(sourceRoot);
  const raw = stable(sourceRoot, SOURCE_PATH);
  assert.equal(raw.pin.bytes, 81069); assert.equal(raw.pin.sha256, SOURCE_SHA);
  const source = collectSwfTextSourceCatalog(raw.bytes);
  const metaPath = `migrations/${ID}/typography-v1/runtime-meta.json`;
  const specPath = `migrations/${ID}/typography-v1/suppression-specs.json`;
  const meta = JSON.parse(stable(root, metaPath).bytes.toString());
  const specs = JSON.parse(stable(root, specPath).bytes.toString());
  const runtime = stable(root, `migrations/${ID}/typography-v1/renderer.js`);
  assert.equal(runtime.pin.sha256, meta.runtimeSha256);
  assert.equal(runtime.pin.bytes, meta.runtimeBytes);
  const triageText = stable(root, 'output/p011-source-triage-20260927-v1/source-text-catalog.json');
  const triageStructure = stable(root, 'output/p011-source-triage-20260927-v1/source-structure.json');
  assert.equal(triageText.pin.sha256, P012_TEXT_DATA.source.sourceTextCatalogSha256);
  assert.equal(triageStructure.pin.sha256, P012_TEXT_DATA.source.sourceStructureSha256);
  const structural = verifySource(source, P012_TEXT_DATA, P012_TEXT_BINDING, meta, specs);
  const integration = JSON.parse(stable(root, 'catalog/typography-v1/g678-integration.json').bytes.toString());
  assert.equal(integration.kind, 'g678-lesson-typography-integration-v1');
  const seeds = [
    'packages/demos/src/modules/shared-alg001-l12-p012.tsx',
    'apps/web/components/g678-alg-l12-p012-host-lesson.tsx',
    'apps/web/lib/g678-alg-l12-p012-assets.server.ts',
    `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
    `apps/web/app/flash-assets/g678-local/${ID}/[asset]/route.ts`,
    'packages/demos/src/alg-l12-p012-typography.css',
    'packages/demos/src/alg-l12-p012.css',
    'packages/demos/tests/alg-l12-p012-text-binding.test.ts',
    'scripts/build-g678-alg-l12-p012-typography.mjs',
    'scripts/build-g678-alg-l12-p012-typography.test.mjs',
    'scripts/prepare-g678-alg-l12-p012-typography-evidence.mts',
    'scripts/prepare-g678-alg-l12-p012-typography-evidence.test.mts',
    'scripts/prepare-g678-alg-l12-p005-typography-binding.mts',
    metaPath, specPath, runtime.pin.path,
    'packages/demos/src/generated/alg-l12-p012-text-data.ts',
    'package.json', 'package-lock.json', 'apps/web/package.json', 'packages/demos/package.json',
    ...integration.sharedFiles.map((file: Pin) => file.path),
  ];
  const collected = collectP005TypographyImportClosure(root, [...new Set(seeds)]);
  // The reused P005 producer has one dynamic import in its unrelated P005
  // preparation entry point. This P012 producer calls only its static closure
  // helper, which does not execute that import.
  assert(collected.closure.nonliteralDynamicImports.every(item =>
    item.path === 'scripts/prepare-g678-alg-l12-p005-typography-binding.mts' && item.line === 273),
  'P012 nonliteral local import needs explicit closure review');
  const implementationFiles = sort([...collected.files.values()].map(file => file.pin));
  for (const shared of integration.sharedFiles) {
    const actual = implementationFiles.find(item => item.path === shared.path);
    assert.deepEqual(actual, shared, `P012 shared typography dependency changed: ${shared.path}`);
  }
  const observation = observationPath ? validateObservation(observationPath, implementationFiles, root) : null;
  const checkedNames = Object.keys(observation?.observation.checks ?? {});
  const resolvedRisks = observation?.observation.sourceRiskResolutions.map(item => item.kind) ?? [];
  const pendingChecks = CHECKS.filter(name => !checkedNames.includes(name));
  const pendingRisks = RISKS.filter(kind => !resolvedRisks.includes(kind));
  const shapes = source.shapeDefinitions.map((shape: any) => ({
    kind: shape.characterId === 1 ? 'outlined-text' : shape.characterId === 50
      ? 'reviewed-instruction-underline' : 'unclassified-preserved',
    role: shape.characterId === 1 ? 'title' : shape.characterId === 50 ? 'decoration' : 'unresolved',
    ...(shape.characterId === 1 ? {semanticValue: 'Graphing in the Coordinate Plane: Vocabulary'} : {}),
    sourceShapeHashes: [{characterId: shape.characterId, sourceTagSha256: shape.sourceTagSha256}],
    disposition: shape.characterId === 1 || shape.characterId === 50
      ? 'exact-native-replacement-reviewed' : 'preserve-pending-source-role-review',
  }));
  const binding = {...P012_TEXT_BINDING, sourceRelativePath: SOURCE_PATH,
    sourceCatalogContentSha256: CATALOG_SHA, sourceRoleDecisions: shapes,
    bitmapRoleDecisions: [{characterId: 47,
      sourceTagSha256: structural.bitmap47TagSha256, disposition: 'preserve-pending-role-review'}],
    sourceEvidence: [triageText.pin, triageStructure.pin,
      stable(root, 'output/p011-source-triage-20260927-v1/TRIAGE_INVENTORY.json').pin],
    sourceRiskEvidence: {parserRisks: [...RISKS],
      resolvedSourceRisks: resolvedRisks, pendingSourceRisks: pendingRisks,
      ...(observation ? {observation: observation.pin} : {})},
    implementation: {status: 'candidate', files: implementationFiles,
      closure: {...collected.closure, scope: 'P012 module, native typography, local host and shared inputs',
        qualification: 'Registry-generated state is an explicit boundary; external packages are pinned by lock/config.'}},
    languagePolicy: {en: 'source', es: 'source-fallback'},
    unresolved: [...pendingChecks.map(name => `technical-check-pending:${name}`),
      ...pendingRisks.map(kind => `source-risk-pending:${kind}`), 'formal-catalog-finalization-pending'],
    preparationOnly: true,
    independentAcceptance: {originalRuntimeAccepted: false, flashFidelityAccepted: false,
      audioAccepted: false, humanReviewed: false, ownerAccepted: false,
      strictComplete: false, published: false},
  };
  const bindingBytes = json(binding);
  const check = {schemaVersion: 1, kind: 'p012-typography-preparation-check-v1',
    animationId: ID, placementId: ID, sourceSwfSha256: SOURCE_SHA,
    sourceCatalogContentSha256: CATALOG_SHA, bindingSha256: hash(bindingBytes),
    structuralVerification: {status: 'verified-source-and-code-only', ...structural,
      physicalSource: raw.pin},
    checks: Object.fromEntries(CHECKS.map(name => [name,
      checkedNames.includes(name) ? 'passed' : 'pending'])),
    checkEvidence: observation?.observation.checks ?? {},
    resolvedSourceRisks: resolvedRisks, pendingSourceRisks: pendingRisks,
    sourceRiskResolutions: observation?.observation.sourceRiskResolutions ?? [],
    languagePolicy: {en: 'source', es: 'source-fallback'},
    checkedImplementationFiles: implementationFiles,
    ...(observation ? {observation: observation.pin} : {}),
    formalCheckerAdmitted: false, technicalScope: 'Local preparation only; no formal typography admission or acceptance effect.'};
  for (const pin of implementationFiles)
    assert.deepEqual(stable(root, pin.path).pin, pin, `P012 implementation changed during preparation: ${pin.path}`);
  assert.equal(stable(sourceRoot, SOURCE_PATH).pin.sha256, SOURCE_SHA,
    'P012 physical source changed during preparation');
  return {binding, check, bindingBytes, checkBytes: json(check)};
}

export function main(args = process.argv.slice(2)) {
  const mode = args[0] ?? '--dry-run';
  assert(['--dry-run', '--write', '--check'].includes(mode) &&
    (args.length === 1 || args.length === 3 && args[1] === '--evidence'),
  'Usage: tsx scripts/prepare-g678-alg-l12-p012-typography-evidence.mts --dry-run|--write|--check [--evidence <relative-path>]');
  const result = prepare({observationPath: args[2]});
  if (mode === '--write') {
    fs.mkdirSync(path.join(ROOT, OUTPUT), {recursive: true});
    fs.writeFileSync(path.join(ROOT, CANDIDATE_BINDING), result.bindingBytes);
    fs.writeFileSync(path.join(ROOT, CANDIDATE_CHECK), result.checkBytes);
  } else if (mode === '--check') {
    assert(fs.readFileSync(path.join(ROOT, CANDIDATE_BINDING)).equals(result.bindingBytes),
      'P012 prepared binding drift');
    assert(fs.readFileSync(path.join(ROOT, CANDIDATE_CHECK)).equals(result.checkBytes),
      'P012 prepared check drift');
  }
  process.stdout.write(`${JSON.stringify({mode, bindingPath: CANDIDATE_BINDING,
    checkPath: CANDIDATE_CHECK, bindingSha256: hash(result.bindingBytes),
    implementationFiles: result.binding.implementation.files.length,
    checks: result.check.checks, pendingSourceRisks: result.check.pendingSourceRisks,
    formalCheckerAdmitted: false})}\n`);
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
