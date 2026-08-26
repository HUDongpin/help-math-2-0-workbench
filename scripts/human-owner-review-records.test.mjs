import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {PNG} from "pngjs";

import {
  HUMAN_VISUAL_REVIEW_ATTESTATION,
  HUMAN_VISUAL_REVIEW_SCOPE,
  OWNER_REVIEW_ATTESTATION,
  OWNER_REVIEW_SCOPE,
  buildHumanVisualReviewInput,
  buildHumanVisualReviewRecord,
  buildOwnerReviewRecord,
  deriveHumanReviewExpectations,
  deriveOwnerReviewEvidence,
  projectKnownExceptions,
  stableReviewJson,
  validateHumanVisualReviewInput,
  validateHumanVisualReviewRecord,
  validateOwnerReviewRecord,
  writeImmutableReviewArtifact,
} from "./human-owner-review-records.mjs";
import {testCaptureGeneratorProvenance} from "./test-fixtures/implementation-capture.mjs";
import {collectImplementationArtifactClosure} from "./implementation-artifact-closure.mjs";
import {selectionSha256} from "./lib/trace-frame-selection.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function directoryDigest(frames) {
  return digest(frames.map(({frame, sha256}) => `${frame}\0${sha256}\n`).join(""));
}

function pngBytes(width, height, [red, green, blue, alpha] = [255, 255, 255, 255]) {
  const image = new PNG({width, height});
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = red;
    image.data[index + 1] = green;
    image.data[index + 2] = blue;
    image.data[index + 3] = alpha;
  }
  return PNG.sync.write(image);
}

async function write(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), {recursive: true});
  await writeFile(filePath, contents);
  return filePath;
}

async function fileDescriptor(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: digest(bytes)};
}

function humanReviewer(overrides = {}) {
  return {
    kind: "human",
    fullName: "Dr. Human Reviewer",
    role: "Visual evidence reviewer",
    organizationOrOwnerId: "HELP-MATH-QA-01",
    contact: "human.reviewer@example.test",
    ...overrides,
  };
}

function ownerReviewer(overrides = {}) {
  return {
    kind: "human",
    fullName: "Dr. Owner Reviewer",
    role: "Evidence acceptance reviewer",
    organizationOrOwnerId: "HELP-MATH-OWNER-01",
    contact: "owner.reviewer@example.test",
    authority: "owner",
    ...overrides,
  };
}

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-review-records-"));
  t.after(() => rm(root, {recursive: true, force: true}));
  const animationId = "fixture-review-animation";
  const workspace = path.join(root, "migrations", animationId);
  const componentPath = `packages/demos/src/modules/${animationId}.tsx`;
  const timelinePath = `packages/demos/src/timelines/${animationId}.ts`;
  const routePath = "apps/web/app/fixture/page.tsx";
  const componentV1 = "export default function FixtureRenderer(){ return null; }\n";
  await write(root, componentPath, componentV1);
  await write(root, timelinePath, "export const fixtureFrame = 1;\n");
  await write(root, routePath, "export default function FixturePage(){ return null; }\n");

  const manifest = {
    schemaVersion: 2,
    id: animationId,
    animationId,
    assetId: `swf-${"a".repeat(64)}`,
    status: "validating",
    source: {
      placementPath: "sources/fixture.swf",
      swf: "sources/fixture.swf",
      swfSha256: "a".repeat(64),
      pairedFlaStatus: "missing",
    },
    runtime: {
      swfSignature: "FWS",
      swfVersion: 8,
      stage: {width: 2, height: 2},
      fps: 12,
      frameCount: 1,
      durationMs: 83,
      backgroundColor: "#ffffff",
      actionScriptVersion: "AS2",
    },
    localization: {bilingualRequired: true, languages: ["en", "es"]},
    scenarios: [{id: "default", kind: "linear", reachable: true, description: "Fixture"}],
    audio: {
      required: false,
      reasonNotRequired: "source-bound negative proof",
      languages: [],
      cues: [],
      inventoryFile: "audio-inventory.csv",
    },
    implementation: {
      rendering: "react-svg",
      route: `/animations/${animationId}`,
      routeFile: routePath,
      component: componentPath,
      timelineModule: timelinePath,
      registryModule: `./modules/${animationId}`,
      captureContract: {frameParameter: "frame"},
      defaultFrameDomainId: "root",
      frameDomains: [{
        id: "root",
        kind: "root",
        frameCount: 1,
        scenarioIds: ["default"],
      }],
    },
    acceptance: {
      humanVisualReview: {decision: "pending"},
      ownerReview: {decision: "pending"},
      knownExceptions: [{
        id: "fixture-exception",
        reason: "Fixture exception with exact evidence.",
        evidenceIds: ["evidence/fixture.json"],
        ownerDecision: "accepted",
      }],
    },
    evidence: {
      audioInventory: "audio-inventory.csv",
      fullFrameCoverageFile: "evidence/full-frame-coverage.json",
    },
  };
  await write(root, `migrations/${animationId}/migration.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  await write(
    root,
    `migrations/${animationId}/audio-inventory.csv`,
    "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms\n",
  );
  await write(
    root,
    `migrations/${animationId}/audit/audio-runtime-evidence.json`,
    `${JSON.stringify({schemaVersion: 2, animationId, acceptance: {strictAudioAcceptance: "accepted-not-required"}}, null, 2)}\n`,
  );

  const implementationFramePath = "output/review-capture/frame-0001.png";
  const baselineFramePath = "artifacts/review-baseline/frame-0001.png";
  const diffFramePath = "artifacts/review-diffs/frame-0001.png";
  const contactPagePath = `migrations/${animationId}/evidence/contact-sheets/req-a/page-01.png`;
  const baselineManifestPath = "artifacts/review-baseline/capture-manifest.json";
  const captureManifestPath = "output/review-capture/capture-manifest.json";
  const metricsPath = `migrations/${animationId}/evidence/full-frame-comparison-req-a.json`;
  const contactManifestPath = `migrations/${animationId}/evidence/contact-sheets/req-a/manifest.json`;
  const implementationFrameBytes = pngBytes(2, 2, [20, 40, 60, 255]);
  const baselineFrameBytes = pngBytes(2, 2, [20, 40, 60, 255]);
  const diffFrameBytes = pngBytes(2, 2, [0, 0, 0, 255]);
  const contactPageBytes = pngBytes(10, 10, [240, 240, 240, 255]);
  await write(root, implementationFramePath, implementationFrameBytes);
  await write(root, baselineFramePath, baselineFrameBytes);
  await write(root, diffFramePath, diffFrameBytes);
  await write(root, contactPagePath, contactPageBytes);
  await write(root, baselineManifestPath, `${JSON.stringify({
    schemaVersion: 1,
    evidenceType: "fixture-original-runtime-capture",
    animationId,
  }, null, 2)}\n`);

  const closure = await collectImplementationArtifactClosure({projectRoot: root, workspace, manifest});
  const entryState = {kind: "initial-load"};
  const identity = {
    requirementId: "req-a",
    frameDomainId: "root",
    traceId: "trace-root-default-en",
    entryStateSha256: digest(JSON.stringify(entryState)),
    scenario: "default",
    language: "en",
    seed: "0",
  };
  const capture = {
    schemaVersion: 4,
    status: "complete",
    animationId,
    ...identity,
    generatorProvenance: testCaptureGeneratorProvenance(),
    implementationArtifactClosure: closure,
    consoleErrors: [],
    failedRequests: [],
    httpErrors: [],
    unexpectedRequests: [],
    captured: [{
      frame: 1,
      file: "frame-0001.png",
      sha256: digest(implementationFrameBytes),
      width: 2,
      height: 2,
    }],
  };
  await write(root, captureManifestPath, `${JSON.stringify(capture, null, 2)}\n`);
  const captureDescriptor = await fileDescriptor(root, captureManifestPath);
  const baselineManifestDescriptor = await fileDescriptor(root, baselineManifestPath);
  const baselineFrameHash = digest(baselineFrameBytes);
  const implementationFrameHash = digest(implementationFrameBytes);
  const diffFrameHash = digest(diffFrameBytes);
  const metrics = {
    schemaVersion: 2,
    status: "complete",
    evidenceType: "full-frame-directory-comparison",
    animationId,
    ...identity,
    baselineCaptureManifest: baselineManifestPath,
    baselineCaptureManifestSha256: baselineManifestDescriptor.sha256,
    implementationCaptureManifest: captureManifestPath,
    implementationCaptureManifestSha256: captureDescriptor.sha256,
    contract: {
      requiredRange: {firstFrame: 1, lastFrame: 1},
      stage: {width: 2, height: 2},
    },
    inputs: {
      baseline: {directorySha256: directoryDigest([{frame: 1, sha256: baselineFrameHash}])},
      implementation: {directorySha256: directoryDigest([{frame: 1, sha256: implementationFrameHash}])},
    },
    diffArchive: {directorySha256: directoryDigest([{frame: 1, sha256: diffFrameHash}])},
    summary: {frameCount: 1},
    frames: [{
      frame: 1,
      ...identity,
      baselineFile: baselineFramePath,
      baselineSha256: baselineFrameHash,
      implementationFile: implementationFramePath,
      implementationSha256: implementationFrameHash,
      diffFile: diffFramePath,
      diffSha256: diffFrameHash,
      width: 2,
      height: 2,
    }],
  };
  await write(root, metricsPath, `${JSON.stringify(metrics, null, 2)}\n`);
  const metricsDescriptor = await fileDescriptor(root, metricsPath);
  const contact = {
    schemaVersion: 1,
    evidenceType: "full-frame-contact-sheet",
    animationId,
    contract: {frameCount: 1, stage: {width: 2, height: 2}},
    sourceEvidence: {
      comparison: {file: metricsPath, sha256: metricsDescriptor.sha256},
      implementationCaptureManifest: {file: captureManifestPath, sha256: captureDescriptor.sha256},
    },
    verification: {
      comparisonSummaryRecomputed: true,
      completeSequentialFrameCoverage: true,
      everyFrameRepresentedExactlyOnce: true,
      implementationCaptureHashesMatchActualPngs: true,
      diffHashesMatchActualPngs: true,
      nativeStageDimensionsMatch: true,
      captureStatusComplete: true,
    },
    pages: [{
      page: 1,
      file: contactPagePath,
      sha256: digest(contactPageBytes),
      width: 10,
      height: 10,
      frames: [1],
    }],
  };
  await write(root, contactManifestPath, `${JSON.stringify(contact, null, 2)}\n`);
  const coveragePath = `migrations/${animationId}/evidence/full-frame-coverage.json`;
  await write(root, coveragePath, `${JSON.stringify({
    schemaVersion: 2,
    animationId,
    requirements: [{
      requirementId: identity.requirementId,
      frameDomainId: identity.frameDomainId,
      traceId: identity.traceId,
      entryState,
      entryStateSha256: identity.entryStateSha256,
      scenario: identity.scenario,
      language: identity.language,
      seed: identity.seed,
      requiredRange: {firstFrame: 1, lastFrame: 1},
      status: "complete",
      captureManifest: captureManifestPath,
      captureManifestSha256: captureDescriptor.sha256,
      metricsFile: metricsPath,
      metricsSha256: metricsDescriptor.sha256,
      contactSheetManifest: contactManifestPath,
    }],
  }, null, 2)}\n`);

  const requirements = [{
    requirementId: "req-a",
    captureManifest: captureManifestPath,
    metricsFile: metricsPath,
    contactSheetManifest: contactManifestPath,
  }];
  const expectedRequirementIds = ["req-a"];
  const reviewInput = await buildHumanVisualReviewInput({
    projectRoot: root,
    workspace,
    manifest,
    requirements,
    expectedRequirementIds,
  });
  const reviewInputDescriptor = await writeImmutableReviewArtifact({
    projectRoot: root,
    workspace,
    kind: "input",
    value: reviewInput,
  });
  const humanRecord = buildHumanVisualReviewRecord({
    animationId,
    decision: "accepted",
    reviewer: humanReviewer(),
    reviewedAt: "2026-07-23T09:00:00+08:00",
    reviewInput: reviewInputDescriptor,
    requirementIds: reviewInput.requirementIds,
    notes: "All bound visual evidence was personally reviewed.",
  });
  const humanDescriptor = await writeImmutableReviewArtifact({
    projectRoot: root,
    workspace,
    kind: "human",
    value: humanRecord,
  });

  const audioPath = `migrations/${animationId}/evidence/audio-acceptance.json`;
  const behaviorPath = `migrations/${animationId}/evidence/behavior-qa.json`;
  const productPath = `migrations/${animationId}/evidence/product-qa.json`;
  await write(root, audioPath, '{"status":"accepted-not-required"}\n');
  await write(root, behaviorPath, '{"status":"pass"}\n');
  await write(root, productPath, '{"status":"pass"}\n');
  const audioDescriptor = await fileDescriptor(root, audioPath);
  const behaviorDescriptor = await fileDescriptor(root, behaviorPath);
  const productDescriptor = await fileDescriptor(root, productPath);
  const ownerRecord = buildOwnerReviewRecord({
    animationId,
    decision: "accepted",
    reviewer: ownerReviewer(),
    reviewedAt: "2026-07-23T10:00:00+08:00",
    reason: "I accept the exact evidence scope and the explicitly listed exception.",
    humanVisualReview: humanDescriptor,
    audioEvidence: [audioDescriptor],
    behaviorEvidence: [behaviorDescriptor],
    productEvidence: [productDescriptor],
    knownExceptions: projectKnownExceptions(manifest),
    notes: "Owner evidence review completed for the fixture.",
  });
  const ownerDescriptor = await writeImmutableReviewArtifact({
    projectRoot: root,
    workspace,
    kind: "owner",
    value: ownerRecord,
  });

  return {
    root,
    workspace,
    animationId,
    manifest,
    componentPath,
    componentV1,
    implementationFramePath,
    implementationFrameBytes,
    diffFramePath,
    diffFrameBytes,
    contactPagePath,
    contactPageBytes,
    metricsPath,
    coveragePath,
    contactManifestPath,
    requirements,
    expectedRequirementIds,
    reviewInput,
    reviewInputDescriptor,
    humanRecord,
    humanDescriptor,
    ownerRecord,
    ownerDescriptor,
    audioPath,
    audioDescriptor,
    behaviorDescriptor,
    productDescriptor,
  };
}

function expectedOwnerEvidence(value) {
  return {
    audioEvidence: [value.audioDescriptor],
    behaviorEvidence: [value.behaviorDescriptor],
    productEvidence: [value.productDescriptor],
  };
}

test("human/owner review expectations exclude supplemental partial paths from the signed requirement set", async (t) => {
  const value = await fixture(t);
  const manifest = structuredClone(value.manifest);
  manifest.implementation.frameDomains.push({
    id: "supplemental",
    kind: "nested",
    frameCount: 2,
    scenarioIds: ["default"],
  });
  const coverage = JSON.parse(await readFile(path.join(value.root, value.coveragePath), "utf8"));
  const partialSelection = {
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: "supplemental-paths",
    requiredFrameSet: {frames: [1]},
  };
  coverage.requirements.push({
    requirementId: "req-supplemental-partial",
    frameDomainId: "supplemental",
    traceId: "trace-supplemental-partial",
    entryState: {kind: "supplemental-path"},
    entryStateSha256: digest(JSON.stringify({kind: "supplemental-path"})),
    scenario: "default",
    language: "en",
    seed: "0",
    ...partialSelection,
    selectionSha256: selectionSha256(partialSelection, 2),
    status: "blocked",
    baselineAuthority: "unresolved",
    capturedFrameCount: 0,
    missingFrames: [1],
    strictAcceptanceEffect: "none",
  });
  await write(value.root, value.coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);

  const expectations = await deriveHumanReviewExpectations({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest,
  });
  assert.deepEqual(expectations.expectedRequirementIds, ["req-a"]);
});

test("human/owner review rejects malformed supplemental partial rows instead of silently excluding them", async (t) => {
  const cases = [
    ["duplicate requirementId", {requirementId: "req-a"}, /duplicate requirementId/i],
    ["wrong scenario", {scenario: "undeclared"}, /scenario is not declared/i],
    ["wrong language", {language: "fr"}, /language is not declared/i],
    ["wrong coverage group", {coverageGroupId: ""}, /coverageGroupId.*(?:stable identifier|non-empty string)/i],
    ["strict acceptance effect", {strictAcceptanceEffect: "promote"}, /strictAcceptanceEffect must be exactly none/i],
  ];
  for (const [name, overrides, expected] of cases) {
    await t.test(name, async (t) => {
      const value = await fixture(t);
      const manifest = structuredClone(value.manifest);
      manifest.implementation.frameDomains.push({
        id: "supplemental",
        kind: "nested",
        frameCount: 2,
        scenarioIds: ["default"],
      });
      const coverage = JSON.parse(await readFile(path.join(value.root, value.coveragePath), "utf8"));
      const selection = {
        requirementSchemaVersion: 2,
        coverageRole: "partial-path",
        coverageGroupId: "supplemental-paths",
        requiredFrameSet: {frames: [1]},
      };
      const entryState = {kind: "supplemental-path"};
      coverage.requirements.push({
        requirementId: "req-supplemental-partial",
        frameDomainId: "supplemental",
        traceId: "trace-supplemental-partial",
        entryState,
        entryStateSha256: digest(JSON.stringify(entryState)),
        scenario: "default",
        language: "en",
        seed: "0",
        ...selection,
        selectionSha256: selectionSha256(selection, 2),
        status: "blocked",
        baselineAuthority: "unresolved",
        capturedFrameCount: 0,
        missingFrames: [1],
        strictAcceptanceEffect: "none",
        ...overrides,
      });
      await write(value.root, value.coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
      await assert.rejects(
        deriveHumanReviewExpectations({
          projectRoot: value.root,
          workspace: value.workspace,
          manifest,
        }),
        expected,
      );
    });
  }
});

test("derives the exact current review requirement and owner evidence envelopes", async (t) => {
  const value = await fixture(t);
  const expectations = await deriveHumanReviewExpectations({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest: value.manifest,
  });
  assert.deepEqual(expectations, {
    expectedRequirementIds: value.expectedRequirementIds,
    expectedRequirements: value.requirements,
  });

  const ownerEvidence = await deriveOwnerReviewEvidence({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest: value.manifest,
  });
  assert.deepEqual(
    ownerEvidence.audioEvidence.map(({path: artifactPath}) => artifactPath),
    [
      `migrations/${value.animationId}/audio-inventory.csv`,
      `migrations/${value.animationId}/audit/audio-runtime-evidence.json`,
    ],
  );
  assert.deepEqual(ownerEvidence.behaviorEvidence.map(({path: artifactPath}) => artifactPath), [
    `migrations/${value.animationId}/evidence/behavior-qa.json`,
  ]);
  assert.deepEqual(ownerEvidence.productEvidence.map(({path: artifactPath}) => artifactPath), [
    `migrations/${value.animationId}/evidence/product-qa.json`,
  ]);

  const descriptorBound = await validateHumanVisualReviewRecord({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest: value.manifest,
    recordPath: path.join(value.root, value.humanDescriptor.path),
    expectedRecordDescriptor: value.humanDescriptor,
    ...expectations,
    now: Date.parse("2026-07-23T12:00:00+08:00"),
  });
  assert.equal(descriptorBound.descriptor.sha256, value.humanDescriptor.sha256);
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      recordPath: path.join(value.root, value.humanDescriptor.path),
      expectedRecordDescriptor: {...value.humanDescriptor, bytes: value.humanDescriptor.bytes + 1},
      ...expectations,
      now: Date.parse("2026-07-23T12:00:00+08:00"),
    }),
    /record descriptor bytes are stale/,
  );

  const duplicateContactPath = `migrations/${value.animationId}/evidence/contact-sheets/duplicate/manifest.json`;
  await write(value.root, duplicateContactPath, await readFile(path.join(value.root, value.contactManifestPath)));
  const ambiguousCoverage = JSON.parse(await readFile(path.join(value.root, value.coveragePath), "utf8"));
  delete ambiguousCoverage.requirements[0].contactSheetManifest;
  await write(value.root, value.coveragePath, `${JSON.stringify(ambiguousCoverage, null, 2)}\n`);
  await assert.rejects(
    deriveHumanReviewExpectations({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
    }),
    /expected exactly one contact-sheet manifest.*found 2/,
  );
});

test("builds a schema-v4/hash-bound input that stays current across status and acceptance mirrors", async (t) => {
  const value = await fixture(t);
  const checked = await validateHumanVisualReviewInput({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest: value.manifest,
    expectedRequirementIds: value.expectedRequirementIds,
    expectedRequirements: value.requirements,
    inputPath: path.join(value.root, value.reviewInputDescriptor.path),
  });
  assert.equal(checked.value.animationId, value.animationId);
  assert.deepEqual(checked.value.requirementIds, ["req-a"]);
  assert.equal(checked.value.requirements[0].implementationCapture.path, "output/review-capture/capture-manifest.json");
  assert.equal(checked.value.requirements[0].implementationCapture.sha256, value.reviewInput.requirements[0].implementationCapture.sha256);
  assert.ok(checked.value.artifactSet.artifacts.some(({path: artifactPath}) => artifactPath === value.diffFramePath));
  assert.ok(checked.value.artifactSet.artifacts.some(({path: artifactPath}) => artifactPath === value.contactPagePath));

  const receiptOnly = structuredClone(value.manifest);
  receiptOnly.status = "complete";
  receiptOnly.acceptance.humanVisualReview = {
    decision: "accepted",
    reviewer: "A named person",
    reviewedAt: "2026-07-23T09:00:00+08:00",
  };
  receiptOnly.acceptance.ownerReview = {
    decision: "accepted",
    reviewer: "A named owner",
    reviewedAt: "2026-07-23T10:00:00+08:00",
  };
  await write(
    value.root,
    `migrations/${value.animationId}/migration.json`,
    `${JSON.stringify(receiptOnly, null, 2)}\n`,
  );
  const receiptCheck = await validateHumanVisualReviewInput({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest: receiptOnly,
    expectedRequirementIds: value.expectedRequirementIds,
    expectedRequirements: value.requirements,
    inputPath: path.join(value.root, value.reviewInputDescriptor.path),
  });
  assert.equal(receiptCheck.descriptor.sha256, value.reviewInputDescriptor.sha256);

  await assert.rejects(
    validateHumanVisualReviewInput({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: receiptOnly,
      expectedRequirementIds: ["req-a", "req-omitted"],
      expectedRequirements: value.requirements,
      inputPath: path.join(value.root, value.reviewInputDescriptor.path),
    }),
    /do(?:es)? not exactly match expectedRequirementIds/,
  );
});

test("review input binds the real migration.json technical projection and full current frame-domain range", async (t) => {
  const value = await fixture(t);
  const staleCallerManifest = structuredClone(value.manifest);
  staleCallerManifest.runtime.fps = 24;
  await assert.rejects(
    buildHumanVisualReviewInput({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: staleCallerManifest,
      requirements: value.requirements,
      expectedRequirementIds: value.expectedRequirementIds,
    }),
    /technical projection differs from current migration\.json/,
  );

  const expandedDomain = structuredClone(value.manifest);
  expandedDomain.runtime.frameCount = 2;
  expandedDomain.runtime.durationMs = 167;
  expandedDomain.implementation.frameDomains[0].frameCount = 2;
  await write(
    value.root,
    `migrations/${value.animationId}/migration.json`,
    `${JSON.stringify(expandedDomain, null, 2)}\n`,
  );
  await assert.rejects(
    buildHumanVisualReviewInput({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: expandedDomain,
      requirements: value.requirements,
      expectedRequirementIds: value.expectedRequirementIds,
    }),
    /invalid canonical frame selection|requiredRange does not cover the complete current frame domain|schema v1 only supports the full 1\.\.frameCount range/,
  );
});

test("review input fails closed on JavaScript, capture PNG, diff, metrics, and contact-sheet page drift", async (t) => {
  const value = await fixture(t);
  const validate = () => validateHumanVisualReviewInput({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest: value.manifest,
    expectedRequirementIds: value.expectedRequirementIds,
    expectedRequirements: value.requirements,
    inputPath: path.join(value.root, value.reviewInputDescriptor.path),
  });

  await write(value.root, value.componentPath, "export default function FixtureRenderer(){ return 'changed'; }\n");
  await assert.rejects(validate(), /artifact closure is stale|stale or non-canonical/);
  await write(value.root, value.componentPath, value.componentV1);

  await write(value.root, value.implementationFramePath, "changed implementation png\n");
  await assert.rejects(validate(), /not a decodable PNG|PNG hash is stale|bytes are stale/);
  await write(value.root, value.implementationFramePath, value.implementationFrameBytes);

  await write(value.root, value.implementationFramePath, pngBytes(3, 2, [20, 40, 60, 255]));
  await assert.rejects(validate(), /is 3x2; expected 2x2/);
  await write(value.root, value.implementationFramePath, value.implementationFrameBytes);

  await write(value.root, value.diffFramePath, "changed diff png\n");
  await assert.rejects(validate(), /not a decodable PNG|diff bytes are stale/);
  await write(value.root, value.diffFramePath, value.diffFrameBytes);

  const originalMetrics = await readFile(path.join(value.root, value.metricsPath));
  await write(value.root, value.metricsPath, Buffer.concat([originalMetrics, Buffer.from(" ")]));
  await assert.rejects(validate(), /comparison binding differs|stale or non-canonical/);
  await write(value.root, value.metricsPath, originalMetrics);

  await write(value.root, value.contactPagePath, "changed contact page\n");
  await assert.rejects(validate(), /not a decodable PNG|Contact-sheet page 1 bytes are stale/);
  await write(value.root, value.contactPagePath, value.contactPageBytes);
  await validate();
});

test("human records require a current exact input, named human, timezone, nonfuture time, and append-only chain", async (t) => {
  const value = await fixture(t);
  const now = Date.parse("2026-07-23T12:00:00+08:00");
  const valid = await validateHumanVisualReviewRecord({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest: value.manifest,
    expectedRequirementIds: value.expectedRequirementIds,
    expectedRequirements: value.requirements,
    recordPath: path.join(value.root, value.humanDescriptor.path),
    now,
  });
  assert.equal(valid.value.scope, HUMAN_VISUAL_REVIEW_SCOPE);
  assert.equal(valid.value.attestation, HUMAN_VISUAL_REVIEW_ATTESTATION);

  await assert.rejects(
    writeImmutableReviewArtifact({
      projectRoot: value.root,
      workspace: value.workspace,
      kind: "human",
      value: value.humanRecord,
    }),
    /EEXIST/,
  );

  const secondRecord = buildHumanVisualReviewRecord({
    ...value.humanRecord,
    reviewedAt: "2026-07-23T09:30:00+08:00",
    notes: "A later review preserves the prior immutable record.",
    previousRecord: value.humanDescriptor,
  });
  const secondDescriptor = await writeImmutableReviewArtifact({
    projectRoot: value.root,
    workspace: value.workspace,
    kind: "human",
    value: secondRecord,
  });
  const second = await validateHumanVisualReviewRecord({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest: value.manifest,
    expectedRequirementIds: value.expectedRequirementIds,
    expectedRequirements: value.requirements,
    recordPath: path.join(value.root, secondDescriptor.path),
    now,
  });
  assert.equal(second.previous.descriptor.sha256, value.humanDescriptor.sha256);

  const automation = buildHumanVisualReviewRecord({
    ...value.humanRecord,
    reviewer: humanReviewer({fullName: "Codex automation"}),
    reviewedAt: "2026-07-23T09:40:00+08:00",
  });
  const automationDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "human", value: automation});
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, automationDescriptor.path),
      now,
    }),
    /must not identify automation/,
  );

  const automationContact = buildHumanVisualReviewRecord({
    ...value.humanRecord,
    reviewer: humanReviewer({contact: "llm-review-service@example.test"}),
    reviewedAt: "2026-07-23T09:41:00+08:00",
  });
  const automationContactDescriptor = await writeImmutableReviewArtifact({
    projectRoot: value.root,
    workspace: value.workspace,
    kind: "human",
    value: automationContact,
  });
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, automationContactDescriptor.path),
      now,
    }),
    /must not identify automation/,
  );

  const noTimezone = buildHumanVisualReviewRecord({...value.humanRecord, reviewedAt: "2026-07-23T09:40:00"});
  const noTimezoneDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "human", value: noTimezone});
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, noTimezoneDescriptor.path),
      now,
    }),
    /explicit timezone/,
  );

  const invalidDate = buildHumanVisualReviewRecord({...value.humanRecord, reviewedAt: "2026-02-30T09:40:00+08:00"});
  const invalidDateDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "human", value: invalidDate});
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, invalidDateDescriptor.path),
      now,
    }),
    /invalid calendar date/,
  );

  const oneSecondFuture = buildHumanVisualReviewRecord({...value.humanRecord, reviewedAt: "2026-07-23T12:00:01+08:00"});
  const oneSecondFutureDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "human", value: oneSecondFuture});
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, oneSecondFutureDescriptor.path),
      now,
    }),
    /must not be in the future/,
  );

  const future = buildHumanVisualReviewRecord({...value.humanRecord, reviewedAt: "2026-07-24T09:40:00+08:00"});
  const futureDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "human", value: future});
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, futureDescriptor.path),
      now,
    }),
    /must not be in the future/,
  );

  const wrongRequirements = buildHumanVisualReviewRecord({...value.humanRecord, requirementIds: ["req-other"], reviewedAt: "2026-07-23T09:45:00+08:00"});
  const wrongRequirementsDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "human", value: wrongRequirements});
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, wrongRequirementsDescriptor.path),
      now,
    }),
    /exact review-input requirement set/,
  );
});

test("human chain rejects stale input bytes, path escape, symlink, and previous-record cycles", async (t) => {
  const value = await fixture(t);
  const now = Date.parse("2026-07-23T12:00:00+08:00");
  const inputPath = path.join(value.root, value.reviewInputDescriptor.path);
  const originalInput = await readFile(inputPath);
  await chmod(inputPath, 0o644);
  await writeFile(inputPath, Buffer.concat([originalInput, Buffer.from(" ")]));
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, value.humanDescriptor.path),
      now,
    }),
    /input descriptor bytes are stale/,
  );
  await writeFile(inputPath, originalInput);
  await chmod(inputPath, 0o444);

  const escaped = buildHumanVisualReviewRecord({
    ...value.humanRecord,
    reviewedAt: "2026-07-23T09:20:00+08:00",
    reviewInput: {path: "../outside.json", bytes: 1, sha256: "a".repeat(64)},
  });
  const escapedDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "human", value: escaped});
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, escapedDescriptor.path),
      now,
    }),
    /canonical project-relative path|escapes the project root/,
  );

  const symlinkPath = path.join(value.workspace, "evidence", "review-inputs", "linked-input.json");
  await symlink(inputPath, symlinkPath);
  const linked = buildHumanVisualReviewRecord({
    ...value.humanRecord,
    reviewedAt: "2026-07-23T09:25:00+08:00",
    reviewInput: {...value.reviewInputDescriptor, path: path.relative(value.root, symlinkPath)},
  });
  const linkedDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "human", value: linked});
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, linkedDescriptor.path),
      now,
    }),
    /symbolic link/,
  );

  const malformedHistoricalInput = structuredClone(value.reviewInput);
  delete malformedHistoricalInput.technicalManifest.sha256;
  const malformedHistoricalInputDescriptor = await writeImmutableReviewArtifact({
    projectRoot: value.root,
    workspace: value.workspace,
    kind: "input",
    value: malformedHistoricalInput,
  });
  const malformedHistoricalRecord = buildHumanVisualReviewRecord({
    ...value.humanRecord,
    reviewedAt: "2026-07-23T08:00:00+08:00",
    reviewInput: malformedHistoricalInputDescriptor,
    notes: "Historical fixture with a deliberately malformed deep input.",
  });
  const malformedHistoricalRecordDescriptor = await writeImmutableReviewArtifact({
    projectRoot: value.root,
    workspace: value.workspace,
    kind: "human",
    value: malformedHistoricalRecord,
  });
  const currentWithMalformedHistory = buildHumanVisualReviewRecord({
    ...value.humanRecord,
    reviewedAt: "2026-07-23T09:55:00+08:00",
    previousRecord: malformedHistoricalRecordDescriptor,
    notes: "Current review must reject malformed historical input structure.",
  });
  const currentWithMalformedHistoryDescriptor = await writeImmutableReviewArtifact({
    projectRoot: value.root,
    workspace: value.workspace,
    kind: "human",
    value: currentWithMalformedHistory,
  });
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, currentWithMalformedHistoryDescriptor.path),
      now,
    }),
    /technicalManifest keys differ/,
  );

  const cycleRelative = `migrations/${value.animationId}/evidence/reviews/human/self-cycle.json`;
  const cycle = buildHumanVisualReviewRecord({
    ...value.humanRecord,
    reviewedAt: "2026-07-23T09:50:00+08:00",
    previousRecord: {path: cycleRelative, bytes: 1, sha256: "c".repeat(64)},
  });
  await write(value.root, cycleRelative, stableReviewJson(cycle));
  await assert.rejects(
    validateHumanVisualReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      recordPath: path.join(value.root, cycleRelative),
      now,
    }),
    /previous-record cycle detected/,
  );
});

test("owner records bind accepted human review plus audio, behavior, product, exceptions, role, reason, and history", async (t) => {
  const value = await fixture(t);
  const now = Date.parse("2026-07-23T12:00:00+08:00");
  const valid = await validateOwnerReviewRecord({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest: value.manifest,
    expectedRequirementIds: value.expectedRequirementIds,
    expectedRequirements: value.requirements,
    expectedOwnerEvidence: expectedOwnerEvidence(value),
    recordPath: path.join(value.root, value.ownerDescriptor.path),
    now,
  });
  assert.equal(valid.value.scope, OWNER_REVIEW_SCOPE);
  assert.equal(valid.value.attestation, OWNER_REVIEW_ATTESTATION);
  assert.equal(valid.human.value.decision, "accepted");

  const representative = buildOwnerReviewRecord({
    ...value.ownerRecord,
    reviewer: ownerReviewer({
      fullName: "Dr. Authorized Representative",
      authority: "authorized-owner-representative",
    }),
    reviewedAt: "2026-07-23T10:30:00+08:00",
    previousRecord: value.ownerDescriptor,
  });
  const representativeDescriptor = await writeImmutableReviewArtifact({
    projectRoot: value.root,
    workspace: value.workspace,
    kind: "owner",
    value: representative,
  });
  const representativeResult = await validateOwnerReviewRecord({
    projectRoot: value.root,
    workspace: value.workspace,
    manifest: value.manifest,
    expectedRequirementIds: value.expectedRequirementIds,
    expectedRequirements: value.requirements,
    expectedOwnerEvidence: expectedOwnerEvidence(value),
    recordPath: path.join(value.root, representativeDescriptor.path),
    now,
  });
  assert.equal(representativeResult.value.reviewer.authority, "authorized-owner-representative");
  assert.equal(representativeResult.previous.descriptor.sha256, value.ownerDescriptor.sha256);

  const noReason = buildOwnerReviewRecord({...value.ownerRecord, reason: "too short", reviewedAt: "2026-07-23T10:35:00+08:00"});
  const noReasonDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "owner", value: noReason});
  await assert.rejects(
    validateOwnerReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      expectedOwnerEvidence: expectedOwnerEvidence(value),
      recordPath: path.join(value.root, noReasonDescriptor.path),
      now,
    }),
    /reason must explicitly describe/,
  );

  const automationOwner = buildOwnerReviewRecord({
    ...value.ownerRecord,
    reviewer: ownerReviewer({fullName: "CI Bot"}),
    reviewedAt: "2026-07-23T10:40:00+08:00",
  });
  const automationOwnerDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "owner", value: automationOwner});
  await assert.rejects(
    validateOwnerReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      expectedOwnerEvidence: expectedOwnerEvidence(value),
      recordPath: path.join(value.root, automationOwnerDescriptor.path),
      now,
    }),
    /must not identify automation/,
  );

  const arbitraryPath = `migrations/${value.animationId}/evidence/arbitrary.json`;
  await write(value.root, arbitraryPath, '{"status":"untyped-arbitrary-file"}\n');
  const arbitraryDescriptor = await fileDescriptor(value.root, arbitraryPath);
  const arbitraryEvidenceOwner = buildOwnerReviewRecord({
    ...value.ownerRecord,
    reviewedAt: "2026-07-23T10:42:00+08:00",
    audioEvidence: [arbitraryDescriptor],
  });
  const arbitraryEvidenceOwnerDescriptor = await writeImmutableReviewArtifact({
    projectRoot: value.root,
    workspace: value.workspace,
    kind: "owner",
    value: arbitraryEvidenceOwner,
  });
  await assert.rejects(
    validateOwnerReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      expectedOwnerEvidence: expectedOwnerEvidence(value),
      recordPath: path.join(value.root, arbitraryEvidenceOwnerDescriptor.path),
      now,
    }),
    /audioEvidence differs from expected current validated evidence/,
  );

  const ownerBeforeHuman = buildOwnerReviewRecord({
    ...value.ownerRecord,
    reviewedAt: "2026-07-23T08:30:00+08:00",
  });
  const ownerBeforeHumanDescriptor = await writeImmutableReviewArtifact({
    projectRoot: value.root,
    workspace: value.workspace,
    kind: "owner",
    value: ownerBeforeHuman,
  });
  await assert.rejects(
    validateOwnerReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      expectedOwnerEvidence: expectedOwnerEvidence(value),
      recordPath: path.join(value.root, ownerBeforeHumanDescriptor.path),
      now,
    }),
    /cannot predate its bound human visual review/,
  );

  const changedExceptions = structuredClone(value.manifest);
  changedExceptions.acceptance.knownExceptions[0].reason = "Changed after owner review.";
  await assert.rejects(
    validateOwnerReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: changedExceptions,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      expectedOwnerEvidence: expectedOwnerEvidence(value),
      recordPath: path.join(value.root, value.ownerDescriptor.path),
      now,
    }),
    /knownExceptions differ/,
  );

  await write(value.root, value.audioPath, '{"status":"changed"}\n');
  await assert.rejects(
    validateOwnerReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      expectedOwnerEvidence: expectedOwnerEvidence(value),
      recordPath: path.join(value.root, value.ownerDescriptor.path),
      now,
    }),
    /audioEvidence\[0\] bytes are stale/,
  );
});

test("owner records reject evidence symlinks and previous-record cycles", async (t) => {
  const value = await fixture(t);
  const now = Date.parse("2026-07-23T12:00:00+08:00");
  const linkedAudioPath = `migrations/${value.animationId}/evidence/linked-audio.json`;
  await symlink(path.join(value.root, value.audioPath), path.join(value.root, linkedAudioPath));
  const linkedAudio = buildOwnerReviewRecord({
    ...value.ownerRecord,
    reviewedAt: "2026-07-23T10:20:00+08:00",
    audioEvidence: [{...value.audioDescriptor, path: linkedAudioPath}],
  });
  const linkedAudioDescriptor = await writeImmutableReviewArtifact({projectRoot: value.root, workspace: value.workspace, kind: "owner", value: linkedAudio});
  await assert.rejects(
    validateOwnerReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      expectedOwnerEvidence: {
        ...expectedOwnerEvidence(value),
        audioEvidence: [{...value.audioDescriptor, path: linkedAudioPath}],
      },
      recordPath: path.join(value.root, linkedAudioDescriptor.path),
      now,
    }),
    /symbolic link/,
  );

  const cycleRelative = `migrations/${value.animationId}/evidence/reviews/owner/self-cycle.json`;
  const cycle = buildOwnerReviewRecord({
    ...value.ownerRecord,
    reviewedAt: "2026-07-23T10:50:00+08:00",
    previousRecord: {path: cycleRelative, bytes: 1, sha256: "d".repeat(64)},
  });
  await write(value.root, cycleRelative, stableReviewJson(cycle));
  await assert.rejects(
    validateOwnerReviewRecord({
      projectRoot: value.root,
      workspace: value.workspace,
      manifest: value.manifest,
      expectedRequirementIds: value.expectedRequirementIds,
      expectedRequirements: value.requirements,
      expectedOwnerEvidence: expectedOwnerEvidence(value),
      recordPath: path.join(value.root, cycleRelative),
      now,
    }),
    /previous-record cycle detected/,
  );
});
