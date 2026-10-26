#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {PNG} from 'pngjs';
import {loadSpecial3RequirementSources, special3RequiredInstructionalComponents} from
  './g678-alg-l11-a-special-instructional-requirements.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT), '..');
export const CONTENT_BLOCKER = 'BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED';
export const CONTENT_ASSESSMENT = 'work/g678-shared-page-factory/' +
  'g678-alg-l11-remaining23-instructional-content-assessment-v2.json';
const DATED_ASSESSMENT = Object.freeze({path: CONTENT_ASSESSMENT, bytes: 22488,
  sha256: '9307d0d575b9092a5afbc410050ff4c217bea7b676a1ab084e155a171a0520f8'});
const DATED_ASSESSOR_WITNESS = Object.freeze({
  path: 'work/g678-shared-page-factory/g678-alg-l11-content-assessor-v2-source-witness.mjs',
  bytes: 22955, sha256: '8ec608e13a4356c71a0c041fefa9da952e7028e2bafeaeffa962f84ebf2cc7d0'});
export const CONTENT_REQUIREMENTS = 'work/g678-shared-page-factory/' +
  'g678-alg-l11-remaining23-instructional-requirements-v1.json';
const PRIOR_ASSESSMENT = Object.freeze({
  path: 'work/g678-shared-page-factory/g678-alg-l11-remaining23-instructional-content-assessment-v1.json',
  bytes: 22158,
  sha256: 'd1b83602dbc9590599738021540327b47aae61c902ede017c899af9db11d8b66',
});
const FREEZE = 'catalog/product-bridge-calibrations/' +
  'g678-current-js-377-page-registration-v1.json';
export const CONTENT_IDS = Object.freeze([
  6, 8, 9, 10, 11, 14, 19, 20, 21, 25,
  26, 27, 28, 29, 30, 31, 32, 40, 41, 42, 33, 34, 44,
].map((number) => `shared-alg001-l11-p${String(number).padStart(3, '0')}`));
const PREFIX = 'packages/demos/src/g678-alg-l11-';
export const ASSESSED_SOURCE_PATHS = Object.freeze([
  'interactive10-tranche-c-core.ts', 'interactive10-tranche-c-state.ts',
  'interactive10-tranche-c-wrappers.tsx', 'interactive10-tranche-c-candidates.tsx',
  'behavior10-tranche-b-state.ts', 'behavior10-tranche-b-candidate-core.tsx',
  'behavior10-tranche-b-tutorial-candidate.tsx',
  'behavior10-tranche-b-guided-candidate.tsx',
  'behavior10-tranche-b-candidates.tsx', 'advanced3-tranche-d-state.ts',
  'advanced3-tranche-d-candidates.tsx',
].map((name) => `${PREFIX}${name}`));

// Admit only a reviewed, byte-bound successor pair. No current behavior receipt
// establishes instructional completeness, and no caller can supply these pins.
export const ADMITTED_CONTENT_BINDINGS = Object.freeze({
  contract: null,
  browser: null,
});
const verifiedAdmissions = new WeakSet();
const FALSE_EFFECTS = Object.freeze({
  productHostCalibrationPassed: false, wholeLessonEngineeringPreviewReady: false,
  authoritativeOriginalRuntime: false, behaviorParityAccepted: false,
  visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictComplete: false,
  releaseEligible: false, published: false,
});

function invariant(value, message) {
  if (!value) throw new Error(`${CONTENT_BLOCKER}: ${message}`);
}
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const descriptor = ({path: file, bytes, sha256}) => ({path: file, bytes, sha256});
function hasDescriptor(value) {
  return value && typeof value.path === 'string' &&
    Number.isSafeInteger(value.bytes) && value.bytes > 0 &&
    /^[a-f0-9]{64}$/u.test(value.sha256);
}
async function boundFile(relative, expected = undefined) {
  invariant(typeof relative === 'string' && !path.isAbsolute(relative),
    'artifact path must be project relative');
  const target = path.resolve(ROOT, relative);
  invariant(target.startsWith(`${ROOT}${path.sep}`), 'artifact escapes project');
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() && before.nlink === 1n &&
    !before.isSymbolicLink(), `${relative}: canonical regular file required`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relative}: changed during read`);
  const value = {path: relative, bytes: buffer.length, sha256: digest(buffer)};
  invariant(!expected || exact(value, expected), `${relative}: bytes drifted`);
  return {...value, buffer};
}

export function requiredInstructionalComponents(animationId) {
  invariant(CONTENT_IDS.includes(animationId), 'unexpected placement');
  const number = Number(animationId.slice(-3));
  const special = special3RequiredInstructionalComponents(animationId);
  if (special) return special;
  if (number === 33) return ['initial-controller-instruction',
    'terminal-controller-instruction'];
  if (number === 34) return ['level-1-twelve-cards',
    'level-2-twelve-cards', 'matching-feedback'];
  if (number === 44) return [...Array.from({length: 24}, (_, index) =>
    [`Q${index + 1}-question`, `Q${index + 1}-four-options`]).flat(),
  'results', 'review'];
  const result = ['question', 'answer-options', 'first-wrong-feedback',
    'second-wrong-feedback', 'right-feedback'];
  if (number === 11 || number >= 26) result.push('help');
  const guided = {40: [338, 497, 629, 753], 41: [415, 573, 705, 829],
    42: [499, 660, 793, 917]}[number] ?? [];
  return [...guided.map((frame) => `guided-instruction-${frame}`), ...result];
}

// V2 remains dated evidence of the old behavior candidates. Its original
// assessor bytes are retained separately; new source facts never rewrite it.
export async function buildRemaining23ContentAssessment({check = false} = {}) {
  invariant(check, 'dated assessment is immutable; use --requirements for the source-supported successor');
  await boundFile(PRIOR_ASSESSMENT.path, PRIOR_ASSESSMENT);
  const current = await boundFile(CONTENT_ASSESSMENT, DATED_ASSESSMENT);
  const artifact = JSON.parse(current.buffer);
  await boundFile(DATED_ASSESSOR_WITNESS.path, DATED_ASSESSOR_WITNESS);
  invariant(artifact.inputs.assessor.bytes === DATED_ASSESSOR_WITNESS.bytes &&
    artifact.inputs.assessor.sha256 === DATED_ASSESSOR_WITNESS.sha256, 'dated assessor witness mismatch');
  await boundFile(artifact.inputs.registrationFreeze.path, artifact.inputs.registrationFreeze);
  for (const file of artifact.inputs.maintainedSources) await boundFile(file.path, file);
  return {...DATED_ASSESSMENT, blockedPlacementCount: 23,
    scope: 'dated-original-behavior-candidates-only'};
}

export async function buildRemaining23ContentRequirements({check = false} = {}) {
  await buildRemaining23ContentAssessment({check: true});
  const source = await loadSpecial3RequirementSources(boundFile);
  const artifact = {schemaVersion: 1,
    artifactType: 'g678-alg-l11-remaining23-instructional-requirements-v1',
    scope: 'private-local-exact23-source-requirements-only',
    predecessorAssessment: DATED_ASSESSMENT, preservedAssessorWitness: DATED_ASSESSOR_WITNESS,
    requirementDeriver: descriptor(await boundFile('scripts/g678-alg-l11-a-special-instructional-requirements.mjs')),
    ...source, pages: CONTENT_IDS.map((animationId) => ({animationId,
      requiredInstructionalComponents: requiredInstructionalComponents(animationId)})),
    changedPlacementIds: source.corrections.map((page) => page.animationId),
    unchangedOtherPlacementCount: 20, instructionalContentAdmission: false,
    humanReviewCreated: false, acceptanceEffects: FALSE_EFFECTS,
    limitation: 'Only p006/p009/p010 requirements are corrected from pinned extracted source XML/scripts/configuration. Source SWF identities are inherited from that extraction, not a new original-runtime capture. Dormant audio/feedback custody is retained; external-host reachability, audio, fidelity, human/Owner acceptance, registration, release and publication are not established. Future admission still requires reproducible instructional projections and actual product-host visible content.'};
  const bytes = jsonBytes(artifact);
  if (check) {
    const current = await boundFile(CONTENT_REQUIREMENTS);
    invariant(current.buffer.equals(bytes), 'requirements changed; preserve and create a successor');
  } else await writeFile(path.join(ROOT, CONTENT_REQUIREMENTS), bytes,
    {flag: 'wx', mode: 0o444});
  return {path: CONTENT_REQUIREMENTS, bytes: bytes.length, sha256: digest(bytes)};
}

// Requirements may use unchanged source assets OR a declared reproducible
// projection. Inline SVG is inspected from the captured browser subtree;
// neither an HTTP request nor raw-source/output equality is universal.
export function assertVisibleInstructionalRecord(requirement, observed) {
  invariant(observed?.requirementId === requirement.id &&
    hasDescriptor(requirement.sourceArtifact) &&
    hasDescriptor(requirement.productArtifact) &&
    exact(observed.visibleTexts, requirement.visibleTexts) &&
    Array.isArray(requirement.visibleTexts) &&
    requirement.visibleTexts.every((text) => typeof text === 'string' && text.trim()),
  `${requirement?.id ?? 'unknown'}: source/product/visible content mismatch`);
  if (observed.presentation === 'inline-svg') {
    invariant(requirement.projection && hasDescriptor(observed.inlineSvgSubtree) &&
      exact(observed.projectedArtifact, requirement.productArtifact),
    `${requirement.id}: declared inline projection or actual subtree missing`);
  } else invariant((observed.presentation === undefined ||
    observed.presentation === 'asset-response') &&
    exact(observed.loadedArtifact, requirement.productArtifact) &&
    observed.responseBodySha256 === requirement.productArtifact.sha256 &&
    observed.responseBodyBytes === requirement.productArtifact.bytes &&
    observed.httpStatus === 200, `${requirement.id}: observed asset body mismatch`);
  const box = observed.contentBox;
  const viewport = observed.viewport;
  invariant(box && viewport && [box.x, box.y, box.width, box.height,
    viewport.width, viewport.height].every(Number.isFinite) &&
    box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height &&
    hasDescriptor(observed.screenshot), `${requirement.id}: content not visibly captured`);
  return true;
}

export function assertProjectionReproduction(mapping, reproduced, productBytes) {
  invariant(Buffer.isBuffer(reproduced?.outputBytes) &&
    reproduced.outputBytes.equals(productBytes) &&
    Array.isArray(mapping.sourcePrimitives) && mapping.sourcePrimitives.length > 0 &&
    Array.isArray(mapping.projectedPrimitives) && mapping.projectedPrimitives.length > 0 &&
    Array.isArray(mapping.primitiveMap) && mapping.primitiveMap.length > 0 &&
    exact(reproduced.sourcePrimitives, mapping.sourcePrimitives) &&
    exact(reproduced.projectedPrimitives, mapping.projectedPrimitives) &&
    exact(reproduced.primitiveMap, mapping.primitiveMap) &&
    reproduced.svgSubtree?.tag === 'svg' &&
    Array.isArray(reproduced.svgSubtree.children) && reproduced.svgSubtree.children.length > 0,
  'source primitives, mapping, or regenerated projection bytes differ');
  const sourceIds = mapping.sourcePrimitives.map((item) => item.id);
  const projectedIds = mapping.projectedPrimitives.map((item) => item.id);
  const mappedSourceIds = mapping.primitiveMap?.flatMap((item) => item.sourceIds);
  const mappedProjectedIds = mapping.primitiveMap?.flatMap((item) => item.projectedIds);
  const sameSet = (left, right) => Array.isArray(left) &&
    exact([...new Set(left)].sort(), [...new Set(right)].sort());
  invariant(new Set(sourceIds).size === sourceIds.length &&
    new Set(projectedIds).size === projectedIds.length &&
    mapping.sourcePrimitives.every((item) => item.id && item.kind && item.value != null) &&
    mapping.projectedPrimitives.every((item) => item.id && item.kind && item.value != null) &&
    sameSet(mappedSourceIds, sourceIds) && sameSet(mappedProjectedIds, projectedIds) &&
    mapping.primitiveMap.every((item) => item.sourceIds.length > 0 &&
      item.projectedIds.length > 0 && typeof item.operation === 'string' && item.operation.length > 0),
  'projection mapping omits or substitutes source-defined primitives');
  return true;
}

async function checkProjection(requirement, source, product, observed) {
  const projection = requirement.projection;
  invariant(hasDescriptor(projection.generator) && hasDescriptor(projection.mapping) &&
    Array.isArray(projection.toolchain) && projection.toolchain.length > 0,
  `${requirement.id}: pinned generator/toolchain/mapping required`);
  const generator = await boundFile(projection.generator.path, projection.generator);
  for (const tool of projection.toolchain) await boundFile(tool.path, tool);
  const mappingFile = await boundFile(projection.mapping.path, projection.mapping);
  const mapping = JSON.parse(mappingFile.buffer);
  const sources = [source];
  for (const file of projection.sourceDependencies ?? []) {
    sources.push(await boundFile(file.path, file));
  }
  invariant(exact(mapping.sources, sources.map(descriptor)) &&
    exact(mapping.generator, projection.generator) &&
    exact(mapping.toolchain, projection.toolchain) &&
    exact(mapping.output, descriptor(product)), `${requirement.id}: projection lineage mismatch`);
  // The admitted contract pins this existing family-specific compiler. Its
  // read-only exports must regenerate bytes and recover source/DOM primitives;
  // no generic SVG rewrite or boolean check receipt is used here.
  const compiler = await import(pathToFileURL(path.join(ROOT, generator.path)).href);
  invariant(typeof compiler.reproduceInstructionalProjection === 'function' &&
    typeof compiler.inspectRenderedSvgSubtree === 'function',
  `${requirement.id}: reproducible projection inspector unavailable`);
  const reproduced = await compiler.reproduceInstructionalProjection({
    sources, parameters: mapping.parameters});
  assertProjectionReproduction(mapping, reproduced, product.buffer);
  if (observed.presentation === 'inline-svg') {
    const actual = await boundFile(observed.inlineSvgSubtree.path, observed.inlineSvgSubtree);
    const inspected = await compiler.inspectRenderedSvgSubtree(actual.buffer.toString('utf8'));
    invariant(exact(inspected.projectedPrimitives, reproduced.projectedPrimitives) &&
      exact(inspected.svgSubtree, reproduced.svgSubtree),
    `${requirement.id}: actual inline SVG content or placement differs from projection`);
  }
}

async function checkInstructionalAsset(requirement, observed) {
  const [source, product] = await Promise.all([
    boundFile(requirement.sourceArtifact.path, requirement.sourceArtifact),
    boundFile(requirement.productArtifact.path, requirement.productArtifact),
  ]);
  if (requirement.projection) await checkProjection(requirement, source, product, observed);
  else invariant(source.buffer.equals(product.buffer),
    `${requirement.id}: changed source content requires a declared reproducible projection`);
  const text = product.buffer.toString('utf8');
  invariant(!/Source visual distractor|Source vector option|source alternate number-line graph|frozen SVG hash|not presented by this unregistered/iu.test(text),
    `${requirement.id}: diagnostic placeholder retained`);
  if (requirement.projection && observed.presentation === 'inline-svg') {
    // A reproducible JS/JSON vector bundle may own the actual SVG projection.
    // The generator's regenerated bytes and inspected DOM tree were checked.
    invariant(['image/svg+xml', 'application/json', 'text/javascript',
      'application/x-typescript'].includes(requirement.mediaType),
    `${requirement.id}: unsupported inline projection artifact type`);
  } else if (requirement.mediaType === 'image/svg+xml') {
    invariant(/<svg\b/u.test(text) &&
      /<(?:path|text|line|polyline|polygon|circle|ellipse|rect)\b/u.test(text) &&
      !/<script\b|<foreignObject\b|\bon[a-z]+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/)/iu.test(text),
    `${requirement.id}: non-instructional or externally dependent SVG`);
  } else invariant(requirement.mediaType === 'text/plain' &&
    requirement.visibleTexts.length > 0 &&
    exact(text.trim(), requirement.visibleTexts.join('\n').trim()),
  `${requirement.id}: exact instructional text missing`);
}

async function checkScreenshot(observed) {
  const screenshot = await boundFile(observed.screenshot.path, observed.screenshot);
  const decoded = PNG.sync.read(screenshot.buffer, {checkCRC: true});
  invariant(decoded.width >= observed.viewport.width &&
    decoded.height >= observed.viewport.height &&
    decoded.data.length === decoded.width * decoded.height * 4,
  'visible-content screenshot is not a matching PNG capture');
}

export async function requireRemaining23InstructionalContentAdmission() {
  invariant(hasDescriptor(ADMITTED_CONTENT_BINDINGS.contract) &&
    hasDescriptor(ADMITTED_CONTENT_BINDINGS.browser),
  `exact23 question/options/diagrams/help content has no admitted source-and-browser evidence; assessment: ${CONTENT_ASSESSMENT}`);
  const [contractFile, browserFile, freezeFile] = await Promise.all([
    boundFile(ADMITTED_CONTENT_BINDINGS.contract.path, ADMITTED_CONTENT_BINDINGS.contract),
    boundFile(ADMITTED_CONTENT_BINDINGS.browser.path, ADMITTED_CONTENT_BINDINGS.browser),
    boundFile(FREEZE),
  ]);
  const contract = JSON.parse(contractFile.buffer);
  const browser = JSON.parse(browserFile.buffer);
  const freeze = JSON.parse(freezeFile.buffer);
  const sourceRequirements = await buildRemaining23ContentRequirements({check: true});
  invariant(contract.artifactType === 'g678-alg-l11-remaining23-instructional-content-contract-v1' &&
    browser.artifactType === 'g678-alg-l11-remaining23-visible-instructional-content-v1' &&
    exact(contract.registrationFreeze, descriptor(freezeFile)) &&
    exact(contract.sourceRequirements, sourceRequirements) &&
    exact(browser.contentContract, descriptor(contractFile)) &&
    exact(contract.pages?.map((page) => page.animationId), CONTENT_IDS) &&
    exact(browser.pages?.map((page) => page.animationId), CONTENT_IDS) &&
    exact(browser.maintainedSources, contract.maintainedSources) &&
    Array.isArray(contract.maintainedSources) &&
    contract.maintainedSources.length >= ASSESSED_SOURCE_PATHS.length &&
    new Set(contract.maintainedSources.map((file) => file.path)).size === contract.maintainedSources.length &&
    ASSESSED_SOURCE_PATHS.every((file) => contract.maintainedSources.some((item) => item.path === file)) &&
    exact(browser.errors, []) && exact(contract.acceptanceEffects, FALSE_EFFECTS) &&
    exact(browser.acceptanceEffects, FALSE_EFFECTS), 'content evidence identity or coverage drifted');
  for (const file of contract.maintainedSources) await boundFile(file.path, file);
  for (const page of contract.pages) {
    const placement = freeze.selectedPages.find((item) => item.animationId === page.animationId);
    const observedPage = browser.pages.find((item) => item.animationId === page.animationId);
    const required = requiredInstructionalComponents(page.animationId);
    invariant(page.sourceSha256 === placement?.sourceSha256 &&
      page.assetId === placement.assetId &&
      exact(page.requirements?.map((item) => item.id), required) &&
      exact(observedPage.observations?.map((item) => item.requirementId), required),
    `${page.animationId}: incomplete instructional component coverage`);
    for (const requirement of page.requirements) {
      const observed = observedPage.observations.find((item) => item.requirementId === requirement.id);
      invariant(observed.route === `http://127.0.0.1:3324/en/migration-status/g678-calibration/${page.animationId}`,
        `${page.animationId}: visible content was not exercised in its product route`);
      assertVisibleInstructionalRecord(requirement, observed);
      await checkInstructionalAsset(requirement, observed);
      await checkScreenshot(observed);
    }
  }
  const admission = Object.freeze({contentContract: descriptor(contractFile),
    browserVisibleContent: descriptor(browserFile), placementIds: CONTENT_IDS});
  verifiedAdmissions.add(admission);
  return admission;
}

export function assertRemaining23InstructionalContentAdmission(admission) {
  invariant(admission && verifiedAdmissions.has(admission),
    'family/final registration requires verified instructional content, not behavior-pass flags');
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT) {
  const args = process.argv.slice(2);
  invariant(args.length === 1 && ['--assess', '--check-assessment', '--check-admission', '--requirements', '--check-requirements'].includes(args[0]),
    'usage: g678-alg-l11-remaining23-instructional-content.mjs --check-assessment|--check-admission|--requirements|--check-requirements');
  const action = args[0] === '--check-admission'
    ? requireRemaining23InstructionalContentAdmission()
    : args[0].includes('requirements') ? buildRemaining23ContentRequirements({check: args[0] === '--check-requirements'})
    : buildRemaining23ContentAssessment({check: args[0] === '--check-assessment'});
  action.then((value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`))
    .catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
