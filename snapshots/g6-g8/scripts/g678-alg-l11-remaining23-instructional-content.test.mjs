import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile, lstat} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {ADMITTED_CONTENT_BINDINGS, ASSESSED_SOURCE_PATHS,
  CONTENT_ASSESSMENT, CONTENT_IDS, CONTENT_REQUIREMENTS, assertRemaining23InstructionalContentAdmission,
  assertProjectionReproduction, assertVisibleInstructionalRecord, buildRemaining23ContentAssessment, buildRemaining23ContentRequirements,
  requireRemaining23InstructionalContentAdmission,
  requiredInstructionalComponents} from
  './g678-alg-l11-remaining23-instructional-content.mjs';
import {assertSpecial3SourceFacts, loadSpecial3RequirementSources} from
  './g678-alg-l11-a-special-instructional-requirements.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execFileAsync = promisify(execFile);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('requirements cover exact23 and every p044 source question, not one random sample', () => {
  assert.equal(CONTENT_IDS.length, 23);
  assert.equal(new Set(CONTENT_IDS).size, 23);
  assert.deepEqual(requiredInstructionalComponents('shared-alg001-l11-p006'),
    ['question', 'answer-option-depth-6', 'answer-option-depth-24', 'answer-option-depth-26',
      'wrong-feedback', 'wrong-feedback-close', 'right-feedback', 'glossary-greater-than',
      'glossary-inequality', 'glossary-less-than', 'glossary-sentence', 'glossary-symbol']);
  const assessment = requiredInstructionalComponents('shared-alg001-l11-p044');
  for (let question = 1; question <= 24; question += 1) {
    assert.ok(assessment.includes(`Q${question}-question`));
    assert.ok(assessment.includes(`Q${question}-four-options`));
  }
  assert.equal(assessment.length, 50);
  assert.equal(requiredInstructionalComponents('shared-alg001-l11-p042')
    .filter((requirement) => requirement.startsWith('guided-instruction-'))
    .length, 4);
  assert.throws(() => requiredInstructionalComponents('shared-alg001-l11-p007'),
    /unexpected placement/u);
});

test('dated private V2 assessment and its original assessor witness remain unchanged', async () => {
  await buildRemaining23ContentAssessment({check: true});
  const file = path.join(ROOT, CONTENT_ASSESSMENT);
  const artifact = JSON.parse(await readFile(file));
  assert.equal(hash(await readFile(file)), '9307d0d575b9092a5afbc410050ff4c217bea7b676a1ab084e155a171a0520f8');
  await assert.rejects(buildRemaining23ContentAssessment(), /dated assessment is immutable/u);
  assert.equal(artifact.artifactType,
    'g678-alg-l11-remaining23-instructional-content-assessment-v2');
  const prior = await readFile(path.join(ROOT, artifact.predecessorAssessment.path));
  assert.equal(prior.length, 22158);
  assert.equal(hash(prior),
    'd1b83602dbc9590599738021540327b47aae61c902ede017c899af9db11d8b66');
  assert.equal((await lstat(file)).mode & 0o222, 0);
  assert.deepEqual(artifact.pages.map((page) => page.animationId), CONTENT_IDS);
  assert.equal(artifact.blockedPlacementCount, 23);
  assert.equal(artifact.confirmedIncompletePlacementCount, 20);
  assert.equal(artifact.unverifiedPlacementCount, 3);
  assert.equal(artifact.humanReviewCreated, false);
  assert.ok(Object.values(artifact.acceptanceEffects).every((value) => value === false));
  assert.deepEqual(artifact.inputs.maintainedSources.map((source) => source.path),
    ASSESSED_SOURCE_PATHS);
  for (const source of artifact.inputs.maintainedSources) {
    const bytes = await readFile(path.join(ROOT, source.path));
    assert.equal(bytes.length, source.bytes);
    assert.equal(hash(bytes), source.sha256);
  }
  for (const evidence of artifact.evidence) {
    const bytes = await readFile(path.join(ROOT, evidence.source));
    assert.ok(bytes.toString('utf8').includes(evidence.excerpt));
    assert.equal(hash(Buffer.from(evidence.excerpt)), evidence.excerptSha256);
  }
  for (const number of [8, 25]) assert.match(artifact.pages.find((page) =>
    page.animationId.endsWith(`p${String(number).padStart(3, '0')}`))
    .observedGaps.join(' '), /no question graph/u);
});

test('source requirements successor changes only three misclassified active domains without admitting content', async () => {
  const binding = await buildRemaining23ContentRequirements({check: true});
  const bytes = await readFile(path.join(ROOT, CONTENT_REQUIREMENTS));
  assert.equal(bytes.length, binding.bytes);
  assert.equal(hash(bytes), binding.sha256);
  const requirements = JSON.parse(bytes);
  const old = JSON.parse(await readFile(path.join(ROOT, CONTENT_ASSESSMENT)));
  assert.deepEqual(requirements.changedPlacementIds,
    ['shared-alg001-l11-p006', 'shared-alg001-l11-p009', 'shared-alg001-l11-p010']);
  assert.equal(requirements.instructionalContentAdmission, false);
  assert.equal(requirements.humanReviewCreated, false);
  assert.ok(Object.values(requirements.acceptanceEffects).every((value) => value === false));
  for (const page of requirements.pages) {
    assert.deepEqual(page.requiredInstructionalComponents, requiredInstructionalComponents(page.animationId));
    if (!requirements.changedPlacementIds.includes(page.animationId)) {
      assert.deepEqual(page.requiredInstructionalComponents,
        old.pages.find((prior) => prior.animationId === page.animationId).requiredInstructionalComponents);
    }
  }
  for (const number of [9, 10]) {
    const ids = requiredInstructionalComponents(`shared-alg001-l11-p${String(number).padStart(3, '0')}`);
    assert.ok(ids.includes(`linear-teaching-sequence-1-${number === 9 ? 431 : 394}`));
    assert.ok(ids.every((id) => !/question|answer|feedback|help/u.test(id)));
  }
  assert.ok(requiredInstructionalComponents('shared-alg001-l11-p006').every((id) => !/^S[1-4]-/u.test(id)));
  assert.deepEqual(ADMITTED_CONTENT_BINDINGS, {contract: null, browser: null});
});

test('real extracted config/script evidence rejects changed inequality, local entry and fabricated teaching quiz', async () => {
  const readBound = async (file, expected) => {
    const buffer = await readFile(path.join(ROOT, file));
    assert.deepEqual({path: file, bytes: buffer.length, sha256: hash(buffer)}, expected);
    return {buffer};
  };
  const source = await loadSpecial3RequirementSources(readBound);
  assert.equal(source.corrections.length, 3);
  for (const correction of source.corrections) {
    const config = JSON.parse((await readBound(correction.sourceConfig.path, correction.sourceConfig)).buffer);
    const scripts = await Promise.all(config.sourceScripts.map(async (file) => ({path: file.path,
      text: (await readBound(file.path, file)).buffer.toString('utf8')})));
    assert.equal(assertSpecial3SourceFacts(config, scripts), true);
    assert.throws(() => assertSpecial3SourceFacts(config, scripts.slice(1)), /complete script inventory/u);
    const changed = structuredClone(config);
    if (config.answers) {
      changed.answers[0].label = 'x > 5';
      assert.throws(() => assertSpecial3SourceFacts(changed, scripts), /exact three source choices/u);
      changed.answers[0].label = 'x ≥ 5';
      changed.sourceSemanticCorrection.equalityUnderlineShapeId = 21;
      assert.throws(() => assertSpecial3SourceFacts(changed, scripts), /equality underline/u);
    } else {
      changed.answers = [{label: 'Option A', correct: true}];
      assert.throws(() => assertSpecial3SourceFacts(changed, scripts), /no source-local quiz entry/u);
    }
    const changedScripts = scripts.map((file, index) => index ? file : {...file,
      text: `${file.text}\n${config.answers ? 'Coach_audio_1' : 'Mc_Wrong_Feed3'}.gotoAndPlay(2);`});
    assert.throws(() => assertSpecial3SourceFacts(config, changedScripts), /local entry|source-local quiz entry/u);
  }
});

test('behavior booleans and copied descriptors cannot forge content admission', async () => {
  assert.deepEqual(ADMITTED_CONTENT_BINDINGS, {contract: null, browser: null});
  await assert.rejects(requireRemaining23InstructionalContentAdmission(),
    /BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED.*question\/options\/diagrams\/help/u);
  for (const value of [undefined, true, {passed: true},
    {placementIds: CONTENT_IDS, instructionalPresentationPassed: true},
    {contentContract: {sha256: 'a'.repeat(64)},
      browserVisibleContent: {sha256: 'b'.repeat(64)}, placementIds: CONTENT_IDS}]) {
    assert.throws(() => assertRemaining23InstructionalContentAdmission(value),
      /BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED/u);
  }
});

test('visible-content comparison rejects substituted bytes, missing text and hidden content', async () => {
  // Use real maintained-source bytes for mutation checks. This is deliberately
  // not an SVG/content contract and cannot mint a product admission.
  const sourcePath = ASSESSED_SOURCE_PATHS[2];
  const bytes = await readFile(path.join(ROOT, sourcePath));
  const actual = {path: sourcePath, bytes: bytes.length, sha256: hash(bytes)};
  const requirement = {id: 'question', sourceArtifact: actual,
    productArtifact: actual, visibleTexts: ['Choose the inequality.']};
  const observation = {requirementId: 'question', loadedArtifact: actual,
    responseBodySha256: actual.sha256, responseBodyBytes: actual.bytes,
    httpStatus: 200, visibleTexts: ['Choose the inequality.'],
    contentBox: {x: 20, y: 20, width: 400, height: 200},
    viewport: {width: 1280, height: 900},
    screenshot: {path: 'not-a-real-capture.png', bytes: 100, sha256: 'a'.repeat(64)}};
  for (const changes of [{responseBodySha256: '0'.repeat(64)},
    {responseBodyBytes: actual.bytes - 1}, {httpStatus: 404},
    {visibleTexts: []}, {visibleTexts: ['Source visual distractor']},
    {loadedArtifact: {...actual, sha256: 'f'.repeat(64)}},
    {contentBox: {x: 20, y: 20, width: 0, height: 200}},
    {contentBox: {x: 1200, y: 20, width: 400, height: 200}},
    {screenshot: {passed: true}}]) {
    assert.throws(() => assertVisibleInstructionalRecord(requirement,
      {...observation, ...changes}), /BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED/u);
  }
  assert.throws(() => assertVisibleInstructionalRecord(
    {id: 'question', passed: true}, {requirementId: 'question', visible: true}),
  /BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED/u);
});

test('material projection mapping permits normalized inline SVG and rejects changed or unmapped primitives', () => {
  const original = '<svg><path id="shape" d="M0 0L10 10"/></svg>';
  const projected = original.replace('id="shape"', 'id="p026-shape"');
  assert.notEqual(hash(Buffer.from(original)), hash(Buffer.from(projected)));
  const sourcePrimitives = [{id: 'shape', kind: 'path', value: {d: 'M0 0L10 10'}}];
  const projectedPrimitives = [{id: 'p026-shape', kind: 'path', value: {d: 'M0 0L10 10'}}];
  const primitiveMap = [{sourceIds: ['shape'], projectedIds: ['p026-shape'],
    operation: 'id-namespacing'}];
  const mapping = {sourcePrimitives, projectedPrimitives, primitiveMap};
  const reproduced = {...mapping, outputBytes: Buffer.from(projected),
    svgSubtree: {tag: 'svg', children: [{tag: 'path',
      attributes: {id: 'p026-shape', d: 'M0 0L10 10'}, children: []}]}};
  assert.equal(assertProjectionReproduction(mapping, reproduced,
    Buffer.from(projected)), true);
  assert.throws(() => assertProjectionReproduction(mapping, reproduced,
    Buffer.from(original)), /regenerated projection bytes differ/u);
  assert.throws(() => assertProjectionReproduction(mapping,
    {...reproduced, projectedPrimitives: [{...projectedPrimitives[0],
      value: {d: 'M0 0L1 1'}}]}, Buffer.from(projected)), /primitives/u);
  const missing = {...mapping, primitiveMap: [{...primitiveMap[0],
    sourceIds: ['unrelated']}]};
  assert.throws(() => assertProjectionReproduction(missing,
    {...reproduced, primitiveMap: missing.primitiveMap}, Buffer.from(projected)),
  /omits or substitutes/u);
  assert.throws(() => assertProjectionReproduction({passed: true},
    {passed: true}, Buffer.from(projected)), /primitives/u);
  const productArtifact = {path: 'projection.svg', bytes: Buffer.byteLength(projected),
    sha256: hash(Buffer.from(projected))};
  const sourceArtifact = {path: 'source.svg', bytes: Buffer.byteLength(original),
    sha256: hash(Buffer.from(original))};
  const requirement = {id: 'question', sourceArtifact, productArtifact,
    projection: {generator: 'verified-in-full-admission'}, visibleTexts: []};
  const observed = {requirementId: 'question', presentation: 'inline-svg',
    projectedArtifact: productArtifact, inlineSvgSubtree: {...productArtifact,
      path: 'observed-subtree.svg'}, visibleTexts: [],
    contentBox: {x: 0, y: 0, width: 300, height: 200},
    viewport: {width: 1280, height: 900},
    screenshot: {path: 'unit-only.png', bytes: 100, sha256: 'c'.repeat(64)}};
  // This structural comparison does not mint an admission token or assert a
  // browser run; it proves that HTTP transport/raw-byte equality is not forced.
  assert.equal(assertVisibleInstructionalRecord(requirement, observed), true);
  assert.throws(() => assertVisibleInstructionalRecord(requirement,
    {...observed, inlineSvgSubtree: undefined}), /actual subtree missing/u);
});

test('family and final377 CLI block on content before browser checks and never write outputs', async () => {
  const outputs = [
    'catalog/product-bridge-calibrations/g678-alg-l11-remaining23-family-calibration-v1.json',
    'catalog/product-bridge-calibrations/g678-current-js-377-page-product-calibrated-registration-v1.json',
    'catalog/product-bridge-calibrations/g678-current-js-377-page-product-calibrated-registration-v1.fragment.json',
  ];
  const snapshot = () => Promise.all(outputs.map((file) =>
    readFile(path.join(ROOT, file)).catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    })));
  const before = await snapshot();
  for (const file of ['build-g678-alg-l11-remaining23-family-calibration.mjs',
    'finalize-g678-alg-l11-remaining23-family-registration.mjs']) {
    for (const args of [[], ['--check']]) {
      await assert.rejects(execFileAsync(process.execPath,
        [path.join(ROOT, 'scripts', file), ...args], {cwd: ROOT}), (error) =>
        error.code === 1 && /BLOCKED_INSTRUCTIONAL_CONTENT_NOT_ADMITTED/u
          .test(error.stderr));
    }
  }
  assert.deepEqual(await snapshot(), before);
});
