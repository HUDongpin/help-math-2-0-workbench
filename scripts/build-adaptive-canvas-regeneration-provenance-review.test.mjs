import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildRegenerationProvenanceReview,
  canonicalDocumentBytes,
  canonicalJson,
  runCli,
  sha256,
  SOURCE_FIRST_INVENTORY_RECEIPT_TYPE,
} from './build-adaptive-canvas-regeneration-provenance-review.mjs';

const RELEASES = [
  ['lesson-g03-l02-addition-subtraction-page-only-current-js', 'g03', 'l02', 70],
  ['lesson-g04-l03-negative-numbers', 'g04', 'l03', 39],
  ['lesson-g05-l03-exponents-prime-factorizations-page-only', 'g05', 'l03', 65],
  ['lesson-g05-l04-number-lines', 'g05', 'l04', 54],
  ['lesson-g05-l05-add-subtract-negative-numbers', 'g05', 'l05', 56],
];

function canonicalPretty(value) {
  return Buffer.from(`${JSON.stringify(JSON.parse(canonicalJson(value)), null, 2)}\n`);
}

function receipt(receiptType, payload, {pretty = false} = {}) {
  const document = {
    schemaVersion: 1,
    receiptType,
    payloadSha256: sha256(Buffer.from(canonicalJson(payload))),
    payload,
  };
  return {document, bytes: pretty ? canonicalPretty(document) :
    canonicalDocumentBytes(document)};
}

async function put(root, relativePath, bytes) {
  const absolute = path.join(root, relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, bytes, {mode: 0o644});
  return {
    path: relativePath,
    bytes: Buffer.byteLength(bytes),
    sha256: sha256(Buffer.from(bytes)),
    mode: '644',
  };
}

function checksum(records, includeGitStatus = false) {
  const rows = [...records].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
    .map((record) => includeGitStatus ?
    `${record.sha256} ${record.bytes} ${record.mode} ${record.gitStatus} ${record.path}` :
    `${record.sha256} ${record.bytes} ${record.mode} ${record.path}`);
  return sha256(Buffer.from(rows.join('\n')));
}

function makeRuntime(animationId, index, extra = {}) {
  const inputBytes = Buffer.from(`input-${animationId}-${index}`);
  const outputBytes = Buffer.from(`output-${animationId}-${index}`);
  return {
    animationId,
    metadataAnimationId: animationId,
    pageRenderer: true,
    assetPath: `courses/${animationId}/canvas-renderer.js`,
    lane: 'fixture-source-first-lane-v1',
    input: {bytes: inputBytes.length, sha256: sha256(inputBytes)},
    output: {bytes: outputBytes.length, sha256: sha256(outputBytes)},
    ...extra,
  };
}

async function buildFixture() {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'gate0a-review-project-'));
  const sourceRoot = await mkdtemp(path.join(os.tmpdir(), 'gate0a-review-source-'));
  const releases = [];
  const pageRuntimes = [];
  const sourceDescriptors = new Map();
  let runtimeIndex = 0;
  for (const [releaseId, grade, lesson, count] of RELEASES) {
    const members = [];
    for (let ordinal = 1; ordinal <= count; ordinal += 1) {
      let sequence = ordinal;
      if (releaseId.includes('g05-l03') && ordinal === 46) sequence = 45;
      let animationId = `course-${grade}-${lesson}-aa-${String(sequence).padStart(3, '0')}`;
      if (releaseId.includes('g04-l03') && ordinal === 1) {
        animationId = 'course-g04-l03-ir-001-341242cc';
      }
      if (!sourceDescriptors.has(animationId)) {
        const sourcePath = `${grade}/${lesson}/${animationId}.swf`;
        const bytes = Buffer.from(`swf-${animationId}`);
        await put(sourceRoot, sourcePath, bytes);
        sourceDescriptors.set(animationId, {
          path: sourcePath,
          bytes: bytes.length,
          sha256: sha256(bytes),
        });
        pageRuntimes.push(makeRuntime(animationId, runtimeIndex += 1));
      }
      const source = sourceDescriptors.get(animationId);
      members.push({
        ordinal,
        xmlOccurrence: ordinal,
        placementId: `${releaseId}-placement-${String(ordinal).padStart(3, '0')}`,
        animationId,
        releaseRole: 'active-xml-referenced-page',
        source: {path: source.path, sha256: source.sha256},
      });
    }
    releases.push({
      releaseId,
      grade: Number(grade.slice(1)),
      lesson: Number(lesson.slice(1)),
      expectedCounts: {activeXmlReferencedPages: count},
      members,
    });
  }
  assert.equal(pageRuntimes.length, 283);
  const hostInput = Buffer.from('loaded-host-input');
  const hostOutput = Buffer.from('loaded-host-output');
  const host = {
    animationId: 'course-g04-l03-ir-001-341242cc-loaded-swf-host',
    metadataAnimationId: 'course-g04-l03-ir-001-341242cc',
    pageRenderer: false,
    assetPath: 'courses/shell-course-g04-l03-index-local/host-composite-assets/' +
      'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
    lane: 'fixture-loaded-host-v1',
    input: {bytes: hostInput.length, sha256: sha256(hostInput)},
    output: {bytes: hostOutput.length, sha256: sha256(hostOutput)},
  };
  const runtimes = [...pageRuntimes, host];
  const catalogs = [
    {releases: releases.filter((_, index) => index === 1 || index >= 3)},
    {releases: releases.filter((_, index) => index === 0 || index === 2)},
  ];
  await put(projectRoot, 'catalog/lesson-releases.json',
    `${JSON.stringify(catalogs[0], null, 2)}\n`);
  await put(projectRoot, 'catalog/page-only-current-js-product-releases.json',
    `${JSON.stringify(catalogs[1], null, 2)}\n`);
  const planPayload = {
    status: 'pass',
    operation: 'plan',
    boundary: {
      pageRendererCount: 283,
      loadedHostRuntimeCount: 1,
      totalAdaptiveRuntimeCount: 284,
      placementCount: 284,
      courseShellCount: 0,
      profileEntryCount: 1114,
      approvedReleaseIds: RELEASES.map(([releaseId]) => releaseId),
      forbiddenG4LessonsExcluded: ['g04-l05', 'g04-l10', 'g04-l11'],
    },
    runtimes,
  };
  const plan = receipt('adaptive-canvas-production-five-batch-plan', planPayload,
    {pretty: true});
  const planFile = await put(projectRoot,
    'work/adaptive-canvas-production-five.plan.v9.json', plan.bytes);

  const candidates = [];
  for (let index = 0; index < 56; index += 1) {
    const filePath = index === 0 ? 'scripts/generate-adaptive-canvas-batch.mjs' :
      index === 1 ? 'scripts/generate-adaptive-canvas-batch.test.mjs' :
        `scripts/fixture-candidate-${String(index).padStart(2, '0')}.mjs`;
    const item = await put(projectRoot, filePath, `export const value = ${index};\n`);
    candidates.push({
      ...item,
      category: index === 1 ? 'candidate-test' : 'candidate-code',
      gitStatus: '??',
    });
  }
  const evidence = [
    planFile,
    await descriptor(projectRoot, 'catalog/lesson-releases.json'),
    await descriptor(projectRoot, 'catalog/page-only-current-js-product-releases.json'),
  ];
  for (let index = 0; index < 4; index += 1) {
    evidence.push(await put(projectRoot, `catalog/frozen-${index}.json`, '{}\n'));
  }
  const all = [...candidates, ...evidence];
  const freezePayload = {
    status: 'frozen-for-independent-regeneration-provenance-review',
    baseCommit: '0'.repeat(40),
    branch: 'fixture',
    plan: {
      ...planFile,
      schemaVersion: 1,
      receiptType: plan.document.receiptType,
      payloadSha256: plan.document.payloadSha256,
    },
    generator: candidates[0],
    batchTest: candidates[1],
    candidateFileSet: {
      fileCount: candidates.length,
      totalBytes: candidates.reduce((sum, item) => sum + item.bytes, 0),
      checksumRowFormat: '<sha256> <bytes> <mode-octal> <git-status-2> <path>',
      checksumSetSha256: checksum(candidates, true),
      selectionPolicy: 'fixture',
      files: candidates,
    },
    evidenceInputSet: {
      fileCount: evidence.length,
      totalBytes: evidence.reduce((sum, item) => sum + item.bytes, 0),
      checksumRowFormat: '<sha256> <bytes> <mode-octal> <path>',
      checksumSetSha256: checksum(evidence),
      selectionPolicy: 'fixture',
      files: evidence,
    },
    fullFreezeSet: {
      fileCount: all.length,
      totalBytes: all.reduce((sum, item) => sum + item.bytes, 0),
      checksumRowFormat: '<sha256> <bytes> <mode-octal> <path>',
      checksumSetSha256: checksum(all),
    },
    hashRules: {},
    prohibitedActions: {},
  };
  const freeze = receipt(
    'adaptive-canvas-production-five-gate0a-freeze-v1',
    freezePayload,
    {pretty: true},
  );
  await put(projectRoot,
    'work/adaptive-canvas-production-five.gate0a-freeze.v1.json', freeze.bytes);
  return {projectRoot, sourceRoot, runtimes, sourceDescriptors};
}

async function descriptor(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes), mode: '644'};
}

function rooted(root, item, role) {
  return {root, path: item.path, bytes: item.bytes, sha256: item.sha256, role};
}

async function linkedReceipt(root, relativePath, digests) {
  const payload = {links: digests};
  const built = receipt('fixture-linked-evidence-v1', payload);
  return put(root, relativePath, built.bytes);
}

async function sourceInventory(fixture, {selfProof = false} = {}) {
  const first = fixture.runtimes[0];
  const source = fixture.sourceDescriptors.get(first.animationId);
  const generator = selfProof ? await put(
    fixture.projectRoot,
    `apps/web/public/flash-assets/courses/${first.animationId}/canvas-renderer.js`,
    'runtime-self-proof\n',
  ) : await put(fixture.projectRoot, 'scripts/source-first-fixture-generator.mjs',
    'export const sourceFirst = true;\n');
  const run = await linkedReceipt(fixture.projectRoot, 'work/source-first-run.json', [
    source.sha256,
    first.input.sha256,
    generator.sha256,
  ]);
  const member = await linkedReceipt(
    fixture.projectRoot,
    'work/source-first-member.json',
    [source.sha256, first.input.sha256],
  );
  const records = fixture.runtimes.map((runtime, index) => {
    const sourceItem = fixture.sourceDescriptors.get(
      runtime.pageRenderer ? runtime.animationId :
        'course-g04-l03-ir-001-341242cc',
    );
    const base = {
      identity: {
        animationId: runtime.animationId,
        metadataAnimationId: runtime.metadataAnimationId,
        pageRenderer: runtime.pageRenderer,
        assetPath: runtime.assetPath,
        releaseId: 'fixture',
        family: 'fixture',
        lane: runtime.lane,
      },
      v9: {input: runtime.input, output: runtime.output},
      method: null,
      canonicalSources: [],
      generatorEvidence: [],
      runEvidence: [],
      memberEvidence: [],
      outputEvidence: {},
      verdict: 'no-go',
      reasons: ['FIXTURE_NO_EVIDENCE'],
      blockers: [],
    };
    if (index !== 0) return base;
    return {
      ...base,
      method: 'fresh-source-generator-check',
      canonicalSources: [rooted(fixture.sourceRoot, sourceItem, 'canonical-swf')],
      generatorEvidence: [rooted(
        fixture.projectRoot,
        generator,
        'source-generator',
      )],
      runEvidence: [{
        method: 'fresh-source-generator-check',
        command: 'node fixture-generator.mjs --check',
        mode: 'check',
        browserLaunched: false,
        applyRun: false,
        exitCode: 0,
        observedSummary: {matchedV9Input: true},
        descriptor: rooted(fixture.projectRoot, run, 'regeneration-run-receipt'),
      }],
      memberEvidence: [rooted(
        fixture.projectRoot,
        member,
        'regeneration-member-receipt',
      )],
      outputEvidence: {
        v9InputMaterialization: {
          ...first.input,
          matchesV9Input: true,
        },
      },
      verdict: 'pass',
      reasons: [],
    };
  });
  const payload = {status: 'no-go', records};
  const built = receipt(SOURCE_FIRST_INVENTORY_RECEIPT_TYPE, payload);
  const filePath = selfProof ? 'work/source-first-self-proof.json' :
    'work/source-first-valid.json';
  const insertionPrettyBytes = Buffer.from(
    `${JSON.stringify(built.document, null, 2)}\n`,
  );
  await put(fixture.projectRoot, filePath, insertionPrettyBytes);
  return filePath;
}

test('Gate0A review is exact, non-authorizing, fail-closed, and create-exclusive',
  async (t) => {
    const fixture = await buildFixture();
    t.after(async () => {
      await rm(fixture.projectRoot, {recursive: true, force: true});
      await rm(fixture.sourceRoot, {recursive: true, force: true});
    });

    const absent = await buildRegenerationProvenanceReview({
      projectRoot: fixture.projectRoot,
      canonicalSourceRoot: fixture.sourceRoot,
      sourceFirstInventoryPath: 'work/absent-source-first.json',
    });
    assert.equal(absent.document.payload.status, 'no-go');
    assert.equal(absent.document.payload.applyAuthorization, false);
    assert.equal(absent.document.payload.records.length, 284);
    assert.equal(absent.document.payload.summary.passCount, 0);
    assert.equal(absent.document.payload.summary.noGoCount, 284);
    assert.equal(absent.document.payload.summary.canonicalSourceVerifiedCount, 284);
    assert.deepEqual(
      absent.document.payload.records.map((record) => ({
        animationId: record.animationId,
        pageRenderer: record.pageRenderer,
        assetPath: record.assetPath,
        lane: record.lane,
        input: record.input,
        output: record.output,
      })),
      fixture.runtimes.map(({animationId, pageRenderer, assetPath, lane, input, output}) =>
        ({animationId, pageRenderer, assetPath, lane, input, output})),
    );
    assert.deepEqual(
      absent.document.payload.placementSet.duplicatePlacementAnimationIds,
      ['course-g05-l03-aa-045'],
    );

    const validInventory = await sourceInventory(fixture);
    const onePass = await buildRegenerationProvenanceReview({
      projectRoot: fixture.projectRoot,
      canonicalSourceRoot: fixture.sourceRoot,
      sourceFirstInventoryPath: validInventory,
    });
    assert.equal(onePass.document.payload.summary.passCount, 1);
    assert.equal(onePass.document.payload.records[0].provenanceClass,
      'source-first-regeneration');
    assert.equal(onePass.document.payload.summary.candidateInventoryClaimedPassCount,
      1);

    const validDocument = JSON.parse(await readFile(path.join(
      fixture.projectRoot,
      validInventory,
    ), 'utf8'));
    const wrongOrderPath = 'work/source-first-wrong-envelope-order.json';
    await put(fixture.projectRoot, wrongOrderPath, `${JSON.stringify({
      receiptType: validDocument.receiptType,
      schemaVersion: validDocument.schemaVersion,
      payloadSha256: validDocument.payloadSha256,
      payload: validDocument.payload,
    }, null, 2)}\n`);
    await assert.rejects(buildRegenerationProvenanceReview({
      projectRoot: fixture.projectRoot,
      canonicalSourceRoot: fixture.sourceRoot,
      sourceFirstInventoryPath: wrongOrderPath,
    }), /bytes are not deterministic canonical JSON/u);
    const wrongWhitespacePath = 'work/source-first-wrong-whitespace.json';
    await put(fixture.projectRoot, wrongWhitespacePath,
      `${JSON.stringify(validDocument, null, 4)}\n`);
    await assert.rejects(buildRegenerationProvenanceReview({
      projectRoot: fixture.projectRoot,
      canonicalSourceRoot: fixture.sourceRoot,
      sourceFirstInventoryPath: wrongWhitespacePath,
    }), /bytes are not deterministic canonical JSON/u);

    const selfProofInventory = await sourceInventory(fixture, {selfProof: true});
    const selfProof = await buildRegenerationProvenanceReview({
      projectRoot: fixture.projectRoot,
      canonicalSourceRoot: fixture.sourceRoot,
      sourceFirstInventoryPath: selfProofInventory,
    });
    assert.equal(selfProof.document.payload.summary.passCount, 0);
    assert(selfProof.document.payload.records[0].noGoReasons.some((reason) =>
      reason.startsWith('SOURCE_FIRST_GENERATOR_INVALID:')));

    await runCli([
      '--project-root', fixture.projectRoot,
      '--canonical-source-root', fixture.sourceRoot,
      '--source-first-inventory', 'work/absent-source-first.json',
    ]);
    await assert.rejects(runCli([
      '--project-root', fixture.projectRoot,
      '--canonical-source-root', fixture.sourceRoot,
      '--source-first-inventory', 'work/absent-source-first.json',
    ]), /EEXIST/u);
    await runCli([
      '--project-root', fixture.projectRoot,
      '--canonical-source-root', fixture.sourceRoot,
      '--source-first-inventory', 'work/absent-source-first.json',
      '--check',
    ]);
    await assert.rejects(runCli(['--apply']), /no --apply mode/u);
    assert.rejects(readFile(path.join(
      fixture.projectRoot,
      'work/adaptive-canvas-production-five.regeneration-provenance.v1.json',
    )), /ENOENT/u);
  });
