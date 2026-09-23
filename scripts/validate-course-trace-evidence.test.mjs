import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {canonicalJson, sha256Text} from "./build-course-trace-specs.mjs";
import {
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  projectionDescriptor,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {
  inspectCourseTraceEvidence,
  inspectTraceRequirement,
  parseArguments,
  verifyNaturalTraceEvidenceSemantics,
  verifyExecutionReportArtifacts,
} from "./validate-course-trace-evidence.mjs";
import {selectionSha256} from "./lib/trace-frame-selection.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function portable(value) {
  return value.split(path.sep).join("/");
}

function resultHash(record) {
  const payload = {...record};
  delete payload.resultSha256;
  return sha256Text(canonicalJson(payload));
}

async function writeArtifact(root, relative, content) {
  const candidate = path.join(root, relative);
  await mkdir(path.dirname(candidate), {recursive: true});
  await writeFile(candidate, content);
  return {file: portable(relative), sha256: sha256Text(content)};
}

async function createDirectRequirementFixture({coverageStatus = "complete", includeReport = true} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-trace-evidence-"));
  const id = "course-g03-l01-ts-008";
  const requirementId = "req:root:root-standalone:en";
  const workspace = path.join(root, "migrations", id);
  const image = await writeArtifact(root, `migrations/${id}/baseline/frames/frame-001.png`, Buffer.from("original runtime frame one"));
  const sourceSwfSha256 = "a".repeat(64);
  const entryStateSha256 = "b".repeat(64);
  const baseline = {
    schemaVersion: 2,
    evidenceType: "original-runtime-frame-domain-baseline",
    status: "complete",
    animationId: id,
    requirementId,
    frameDomainId: "root",
    traceId: "trace:root:root-standalone:en:seed-0",
    entryStateSha256,
    scenario: "root-standalone",
    language: "en",
    seed: "0",
    baselineAuthority: "original-runtime-frame-step",
    source: {swf: "source.swf", swfSha256: sourceSwfSha256},
    runtime: {stage: {width: 1, height: 1}, fps: 12, frameCount: 1, frameNumbering: "one-indexed"},
    frames: [{
      animationId: id,
      requirementId,
      frameDomainId: "root",
      traceId: "trace:root:root-standalone:en:seed-0",
      entryStateSha256,
      frame: 1,
      file: image.file,
      sha256: image.sha256,
      width: 1,
      height: 1,
    }],
  };
  const baselineText = `${JSON.stringify(baseline, null, 2)}\n`;
  const baselineDescriptor = await writeArtifact(root, `migrations/${id}/baseline/original-runtime-root-en.json`, baselineText);
  const requirement = {
    requirementId,
    status: coverageStatus,
    frameDomainId: "root",
    traceId: "trace:root:root-standalone:en:seed-0",
    entryStateSha256,
    scenario: "root-standalone",
    language: "en",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 1},
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: coverageStatus === "complete" ? "original-runtime-frame-step" : "unresolved",
    baselineCaptureManifest: coverageStatus === "complete" ? baselineDescriptor.file : "",
    baselineCaptureManifestSha256: coverageStatus === "complete" ? baselineDescriptor.sha256 : "",
  };
  const boundDocuments = {
    manifest: {
      schemaVersion: 2,
      id,
      animationId: id,
      assetId: `swf-${sourceSwfSha256}`,
      status: "validating",
      source: {swf: "source.swf", swfSha256: sourceSwfSha256, placementPath: "fixture/source.swf", pairedFlaStatus: "missing"},
      runtime: {stage: {width: 1, height: 1}, fps: 12, frameCount: 1, rootTimelineId: "root", timelineDefinitions: [], instances: []},
      localization: {languages: ["en"]},
      scenarios: [{id: "root-standalone", kind: "linear", reachable: true}],
      audio: {cues: []},
      implementation: {rendering: "svg", component: "FixtureRenderer", defaultFrameDomainId: "root", frameDomains: [{id: "root", kind: "root", frameCount: 1}]},
      acceptance: {ownerReview: {decision: "pending"}},
    },
    coverage: {schemaVersion: 2, animationId: id, requirements: [structuredClone(requirement)]},
    inventory: {
      schemaVersion: 1,
      animationId: id,
      migrationStatusAtGeneration: "validating",
      migrationStatusChanged: false,
      evidenceIndex: [{artifactId: "migration-manifest", path: "migration.json", sha256: "9".repeat(64)}],
      timelineInventory: [{timelineId: "root", frameCount: 1}],
    },
  };
  const hashes = {
    sourceSwfSha256,
    manifestTechnicalSha256: technicalManifestSha256(boundDocuments.manifest),
    coverageTechnicalSha256: traceCoverageSha256(boundDocuments.coverage),
    inventoryTechnicalSha256: scenarioInventorySha256(boundDocuments.inventory),
  };
  const spec = {
    schemaVersion: 1,
    artifactType: "course-pilot-original-runtime-trace-specification",
    animationId: id,
    requirementId,
    traceSpecStatus: "source-frame-accurate-root-ready-for-authoritative-capture",
    identity: {
      frameDomainId: requirement.frameDomainId,
      traceId: requirement.traceId,
      entryStateSha256: requirement.entryStateSha256,
      scenario: requirement.scenario,
      language: requirement.language,
      seed: requirement.seed,
      requiredRange: requirement.requiredRange,
      baselineAuthorityRequirement: requirement.baselineAuthorityRequirement,
    },
    traceModel: {kind: "frame-accurate-root-exhaustive"},
    sourceBindings: {
      sourceSwf: {path: "source.swf", sha256: hashes.sourceSwfSha256},
      migrationManifest: {path: "migration.json", ...projectionDescriptor({projection: TECHNICAL_MANIFEST_PROJECTION.id, sha256: hashes.manifestTechnicalSha256, excludedPaths: TECHNICAL_MANIFEST_PROJECTION.excludedPaths})},
      fullFrameCoverage: {path: "evidence/full-frame-coverage.json", ...projectionDescriptor({projection: TRACE_COVERAGE_PROJECTION.id, sha256: hashes.coverageTechnicalSha256, includedPaths: TRACE_COVERAGE_PROJECTION.includedRequirementPaths, excludedPaths: TRACE_COVERAGE_PROJECTION.excludedRequirementPaths})},
      scenarioInventory: {path: "audit/scenario-inventory.json", ...projectionDescriptor({projection: SCENARIO_INVENTORY_PROJECTION.id, sha256: hashes.inventoryTechnicalSha256, excludedPaths: SCENARIO_INVENTORY_PROJECTION.excludedPaths})},
    },
    frameDomain: {id: "root", kind: "root", nativeStage: {width: 1, height: 1}, frameCount: 1},
    schedule: {
      status: "not-required-frame-accurate-root",
      orderedSteps: [],
      stateCheckpoints: [],
      noActionsRequired: false,
      terminalSemantics: {status: "separate-natural-playback-behavior-gate-not-required-for-frame-accurate-root-baseline"},
    },
    executionEvidence: {
      expectedExecutionReportPath: `baseline/trace-executions/req-root-root-standalone-en.json`,
    },
  };
  const specFile = `migrations/${id}/audit/trace-specs/req-root-root-standalone-en.json`;
  const specText = `${JSON.stringify(spec, null, 2)}\n`;
  const specDescriptor = await writeArtifact(root, specFile, specText);
  const executionReportFile = `migrations/${id}/baseline/trace-executions/req-root-root-standalone-en.json`;
  const specIndex = {
    requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: requirement.seed,
    traceModel: spec.traceModel.kind,
    status: spec.traceSpecStatus,
    file: specFile,
    sha256: specDescriptor.sha256,
    expectedExecutionReport: executionReportFile,
  };

  let report = null;
  if (includeReport) {
    const rawLog = await writeArtifact(root, `migrations/${id}/baseline/trace-executions/root-en-events.log`, "rewind frame=1\n");
    const targetLog = await writeArtifact(root, `migrations/${id}/baseline/trace-executions/root-en-targets.json`, "{}\n");
    const stateArchive = await writeArtifact(root, `migrations/${id}/baseline/trace-executions/root-en-states.json`, "{}\n");
    const frameResult = {
      frame: 1,
      positioningOperation: "rewind",
      operationCountSincePrevious: 1,
      requestSequence: 1,
      captureLogLocator: {requestSequence: 1, byteOffset: 0},
      observedRootFrame: 1,
      observedDisplayListStateSha256: "f".repeat(64),
      screenshotFile: image.file,
      screenshotSha256: image.sha256,
      width: 1,
      height: 1,
      previousResultSha256: null,
      result: "pass",
    };
    frameResult.resultSha256 = resultHash(frameResult);
    report = {
      schemaVersion: 1,
      status: "complete-pass",
      proofMode: "sequential-step-root-exhaustive",
      animationId: id,
      requirementId,
      identity: {
        frameDomainId: requirement.frameDomainId,
        traceId: requirement.traceId,
        entryStateSha256: requirement.entryStateSha256,
        scenario: requirement.scenario,
        language: requirement.language,
        seed: requirement.seed,
      },
      traceSpecBinding: {file: specFile, sha256: specDescriptor.sha256},
      authorizedRuntime: {
        name: "Adobe Flash Player Projector",
        version: "32",
        build: "32.0.0.465",
        launchProtocol: "Rewind then Step Forward",
        authority: "original-runtime-frame-accurate",
        framePositioningAuthority: "original-runtime-frame-step",
        sourceSwfSha256,
      },
      rawEventLog: {...rawLog, eventCount: 1, dispatchedActionCount: 0},
      sourceTargetResolutionLog: targetLog,
      stateSnapshotArchive: stateArchive,
      originalRuntimeCaptureManifest: baselineDescriptor,
      frameResults: [frameResult],
      orderedStepResults: [],
      stateCheckpointResults: [],
      terminalResult: null,
      zeroActionObservation: null,
      unexpectedEvents: [],
      sequenceChainSha256: frameResult.resultSha256,
    };
    await writeArtifact(root, executionReportFile, `${JSON.stringify(report, null, 2)}\n`);
  }
  return {
    root,
    workspace,
    id,
    requirement,
    hashes,
    boundDocuments,
    spec,
    specIndex,
    report,
    image,
    baselineDescriptor,
    executionReportFile,
  };
}

async function convertFixtureToNaturalTrace(fixture) {
  const baselinePath = path.join(fixture.root, fixture.baselineDescriptor.file);
  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  baseline.baselineAuthority = "original-runtime-natural-trace";
  const baselineDescriptor = await writeArtifact(
    fixture.root,
    fixture.baselineDescriptor.file,
    `${JSON.stringify(baseline, null, 2)}\n`,
  );
  fixture.baselineDescriptor = baselineDescriptor;
  fixture.requirement.baselineAuthorityRequirement = "original-runtime-natural-trace";
  fixture.requirement.baselineAuthority = "original-runtime-natural-trace";
  fixture.requirement.baselineCaptureManifestSha256 = baselineDescriptor.sha256;
  const action = {event: "release", pointer: {x: 10, y: 10}};
  const sourceTarget = {timelineId: "root", objectId: "9", depth: "2"};
  const preCheckpointState = {rootFrame: 1, menu: "closed"};
  const expectedCheckpointState = {rootFrame: 1, menu: "open"};
  const terminalSemantics = {
    status: "source-evidenced",
    expectedState: {rootFrame: 1, menu: "open", playState: "stopped"},
    evidence: [{artifactId: "swfmill-xml"}],
  };
  fixture.spec.traceSpecStatus = "source-schedule-ready-for-authoritative-execution";
  fixture.spec.identity.baselineAuthorityRequirement = "original-runtime-natural-trace";
  fixture.spec.traceModel = {kind: "stateful-natural-trace"};
  fixture.spec.schedule = {
    status: "source-evidenced-executable",
    noActionsRequired: false,
    orderedSteps: [{
      order: 1,
      action,
      sourceTarget,
      preStateCheckpoint: {id: "menu-closed", expectedState: preCheckpointState},
      postStateCheckpoint: {id: "menu-open", expectedState: expectedCheckpointState},
      evidence: [{artifactId: "swfmill-xml"}],
    }],
    stateCheckpoints: [{id: "menu-open", expectedState: expectedCheckpointState, evidence: [{artifactId: "swfmill-xml"}]}],
    terminalSemantics,
  };
  const specText = `${JSON.stringify(fixture.spec, null, 2)}\n`;
  const specDescriptor = await writeArtifact(fixture.root, fixture.specIndex.file, specText);
  fixture.specIndex.sha256 = specDescriptor.sha256;
  fixture.specIndex.status = fixture.spec.traceSpecStatus;
  fixture.specIndex.traceModel = fixture.spec.traceModel.kind;

  const imageSha256 = fixture.image.sha256;
  const observation = (state, eventLogOffset) => ({
    observedState: state,
    observedStateSha256: sha256Text(canonicalJson(state)),
    rootFrame: 1,
    frameDomainId: "root",
    localFrame: 1,
    screenshotSha256: imageSha256,
    eventLogOffset,
  });
  const scheduledStep = fixture.spec.schedule.orderedSteps[0];
  const stepResult = {
    order: 1,
    scheduledStepSha256: sha256Text(canonicalJson(scheduledStep)),
    eventSequence: 1,
    rawEventLogLocator: {eventSequence: 1, byteOffset: 0},
    dispatchedAction: action,
    resolvedSourceTarget: sourceTarget,
    preState: observation(preCheckpointState, 0),
    postState: observation(expectedCheckpointState, 100),
    frameEvidence: [{frame: 1, file: fixture.image.file, sha256: imageSha256}],
    previousResultSha256: null,
    result: "pass",
  };
  stepResult.resultSha256 = resultHash(stepResult);
  const targetLog = fixture.report.sourceTargetResolutionLog;
  const stateArchive = fixture.report.stateSnapshotArchive;
  const rawEventLog = fixture.report.rawEventLog;
  const report = {
    schemaVersion: 1,
    status: "complete-pass",
    proofMode: "natural-trace-ordered-events",
    animationId: fixture.id,
    requirementId: fixture.requirement.requirementId,
    identity: {
      frameDomainId: fixture.requirement.frameDomainId,
      traceId: fixture.requirement.traceId,
      entryStateSha256: fixture.requirement.entryStateSha256,
      scenario: fixture.requirement.scenario,
      language: fixture.requirement.language,
      seed: fixture.requirement.seed,
    },
    traceSpecBinding: {file: fixture.specIndex.file, sha256: specDescriptor.sha256},
    authorizedRuntime: {
      name: "Adobe Flash Player Projector",
      version: "32",
      build: "32.0.0.465",
      launchProtocol: "source-evidenced ordered event controller",
      authority: "original-runtime-natural-trace",
      sourceSwfSha256: fixture.hashes.sourceSwfSha256,
    },
    rawEventLog: {...rawEventLog, eventCount: 1, dispatchedActionCount: 1},
    sourceTargetResolutionLog: targetLog,
    stateSnapshotArchive: stateArchive,
    originalRuntimeCaptureManifest: baselineDescriptor,
    frameResults: [],
    orderedStepResults: [stepResult],
    stateCheckpointResults: [{
      checkpointId: "menu-open",
      expectedStateSha256: sha256Text(canonicalJson(expectedCheckpointState)),
      observation: observation(expectedCheckpointState, 100),
      frameEvidence: [{frame: 1, file: fixture.image.file, sha256: imageSha256}],
      result: "pass",
    }],
    terminalResult: {
      expectedSemanticsSha256: sha256Text(canonicalJson(terminalSemantics)),
      observation: observation(terminalSemantics.expectedState, 200),
      frameEvidence: [{frame: 1, file: fixture.image.file, sha256: imageSha256}],
      rawEventLogSha256: rawEventLog.sha256,
      result: "pass",
    },
    zeroActionObservation: null,
    unexpectedEvents: [],
    sequenceChainSha256: stepResult.resultSha256,
  };
  await writeArtifact(fixture.root, fixture.executionReportFile, `${JSON.stringify(report, null, 2)}\n`);
  fixture.report = report;
  return fixture;
}

test("parses the read-only evidence inspector CLI", () => {
  const options = parseArguments(["--check", "--json", "--migrations", "migrations"]);
  assert.equal(options.check, true);
  assert.equal(options.json, true);
  assert.equal(options.migrationsRoot, path.resolve("migrations"));
  assert.throws(() => parseArguments(["--migrations"]), /requires a value/);
  assert.throws(() => parseArguments(["--write"]), /Unknown option/);
});

test("the checked-in canonical pilot index is structurally inspectable and currently reports evidence truth without mutating it", async () => {
  const result = await inspectCourseTraceEvidence({projectRoot: repositoryRoot});
  assert.equal(result.pilotCount, 11);
  assert.equal(result.requirementCount, 90);
  const requirementLevelCount = result.completeCount
    + result.blockedEvidenceCount
    + result.unresolvedCount
    + result.failures.filter((item) => item.requirementId).length;
  const pilotLevelFailures = result.failures.filter((item) => item.requirementId === null);
  if (pilotLevelFailures.length) {
    assert.ok(pilotLevelFailures.every(({message}) => /trace index|projection|current document/.test(message)));
  } else {
    assert.equal(requirementLevelCount, 90);
  }
  assert.equal(result.ok, result.status === "complete");
});

test("verifies a complete frame-step report, fixed paths, current spec identity, baseline binding, and every referenced byte hash", async () => {
  const fixture = await createDirectRequirementFixture();
  const result = await inspectTraceRequirement(fixture);
  assert.equal(result.disposition, "complete-evidence-verified");
  assert.equal(result.evidence.baselineFrameCount, 1);
  assert.equal(result.evidence.reportScreenshotReferenceCount, 1);
  assert.equal(result.executionReport, fixture.executionReportFile);

  await writeFile(path.join(fixture.root, fixture.image.file), "tampered bitmap");
  await assert.rejects(inspectTraceRequirement(fixture), /baseline frame 1 SHA-256 mismatch/);
});

test("trace evidence refuses partial-path requirements even when their union could cover the domain", async () => {
  const fixture = await createDirectRequirementFixture();
  const partial = {
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: "union-does-not-grant-authority",
    requiredFrameSet: {frames: [1]},
  };
  fixture.requirement = {
    ...fixture.requirement,
    ...partial,
    selectionSha256: selectionSha256(partial, 2),
  };
  delete fixture.requirement.requiredRange;
  fixture.spec.frameDomain.frameCount = 2;
  const rewrittenSpec = await writeArtifact(
    fixture.root,
    fixture.specIndex.file,
    `${JSON.stringify(fixture.spec, null, 2)}\n`,
  );
  fixture.specIndex.sha256 = rewrittenSpec.sha256;
  await assert.rejects(
    inspectTraceRequirement(fixture),
    /partial-path requirements cannot enter strict acceptance, human\/owner review, trace indexes, or original-runtime evidence/,
  );
});

test("rejects a stale indexed trace spec even when the index hash is updated to echo the stale bytes", async () => {
  const fixture = await createDirectRequirementFixture();
  fixture.spec.sourceBindings.fullFrameCoverage.sha256 = "0".repeat(64);
  const descriptor = await writeArtifact(
    fixture.root,
    fixture.specIndex.file,
    `${JSON.stringify(fixture.spec, null, 2)}\n`,
  );
  fixture.specIndex.sha256 = descriptor.sha256;
  await assert.rejects(
    inspectTraceRequirement(fixture),
    /trace spec source\/current-document hash binding mismatch/,
  );
});

test("keeps an execution report valid after legitimate status, human/owner, QA, and coverage-result adoption edits", async () => {
  const fixture = await createDirectRequirementFixture();
  const updated = structuredClone(fixture.boundDocuments);
  updated.manifest.status = "complete";
  updated.manifest.acceptance = {
    humanVisualReview: {decision: "accepted", reviewer: "Human", reviewedAt: "2026-07-22"},
    ownerReview: {decision: "accepted", reviewer: "Owner", reviewedAt: "2026-07-22"},
  };
  updated.manifest.accessibility = {keyboardReplay: true, reducedMotionReviewed: true};
  updated.manifest.baseline = {authority: "original-runtime-frame-step"};
  Object.assign(updated.coverage.requirements[0], {
    status: "complete",
    baselineAuthority: "original-runtime-frame-step",
    captureManifest: "evidence/capture.json",
    captureManifestSha256: "a".repeat(64),
    metricsFile: "evidence/metrics.json",
    metricsSha256: "b".repeat(64),
    capturedFrameCount: 1,
    missingFrames: [],
  });
  const updatedHashes = {
    sourceSwfSha256: fixture.hashes.sourceSwfSha256,
    manifestTechnicalSha256: technicalManifestSha256(updated.manifest),
    coverageTechnicalSha256: traceCoverageSha256(updated.coverage),
    inventoryTechnicalSha256: scenarioInventorySha256(updated.inventory),
  };
  assert.deepEqual(updatedHashes, fixture.hashes);
  const result = await inspectTraceRequirement({...fixture, hashes: updatedHashes});
  assert.equal(result.disposition, "complete-evidence-verified");
});

test("accepts the alternate direct-seek root proof with the same exhaustive artifact re-hashing", async () => {
  const fixture = await createDirectRequirementFixture();
  const baseline = JSON.parse(await readFile(path.join(fixture.root, fixture.baselineDescriptor.file), "utf8"));
  baseline.baselineAuthority = "original-runtime-direct-seek";
  fixture.baselineDescriptor = await writeArtifact(
    fixture.root,
    fixture.baselineDescriptor.file,
    `${JSON.stringify(baseline, null, 2)}\n`,
  );
  fixture.requirement.baselineAuthority = "original-runtime-direct-seek";
  fixture.requirement.baselineCaptureManifestSha256 = fixture.baselineDescriptor.sha256;
  fixture.report.proofMode = "direct-seek-root-exhaustive";
  fixture.report.authorizedRuntime.framePositioningAuthority = "original-runtime-direct-seek";
  fixture.report.originalRuntimeCaptureManifest = fixture.baselineDescriptor;
  fixture.report.frameResults[0].positioningOperation = "direct-seek";
  fixture.report.frameResults[0].resultSha256 = resultHash(fixture.report.frameResults[0]);
  fixture.report.sequenceChainSha256 = fixture.report.frameResults[0].resultSha256;
  await writeArtifact(fixture.root, fixture.executionReportFile, `${JSON.stringify(fixture.report, null, 2)}\n`);
  const result = await inspectTraceRequirement(fixture);
  assert.equal(result.disposition, "complete-evidence-verified");
});

test("accepts a source-evidenced natural trace only with ordered dispatch, target, checkpoint, terminal, baseline, and screenshot evidence", async () => {
  const fixture = await convertFixtureToNaturalTrace(await createDirectRequirementFixture());
  const result = await inspectTraceRequirement(fixture);
  assert.equal(result.disposition, "complete-evidence-verified");
  assert.equal(result.evidence.reportScreenshotReferenceCount, 3);
  assert.equal(result.evidence.naturalTraceFrameEvidenceCount, 1);

  fixture.report.orderedStepResults[0].dispatchedAction = {event: "hash-echo-without-real-dispatch"};
  await writeArtifact(fixture.root, fixture.executionReportFile, `${JSON.stringify(fixture.report, null, 2)}\n`);
  await assert.rejects(inspectTraceRequirement(fixture), /dispatchedAction differs from the schedule/);
});

test("natural trace observations must semantically satisfy step, checkpoint, and terminal expected states", async (t) => {
  const fixture = await convertFixtureToNaturalTrace(await createDirectRequirementFixture());
  assert.deepEqual(verifyNaturalTraceEvidenceSemantics(fixture.spec, fixture.report), {frameCount: 1});

  const cases = [
    {
      name: "step pre-state",
      mutate(report) {
        report.orderedStepResults[0].preState.observedState.menu = "unexpected";
      },
      pattern: /orderedStepResults\[0\]\.preState\.observedState does not semantically satisfy/,
    },
    {
      name: "step post-state",
      mutate(report) {
        report.orderedStepResults[0].postState.observedState.menu = "unexpected";
      },
      pattern: /orderedStepResults\[0\]\.postState\.observedState does not semantically satisfy/,
    },
    {
      name: "declared checkpoint",
      mutate(report) {
        report.stateCheckpointResults[0].observation.observedState = {
          ...report.stateCheckpointResults[0].observation.observedState,
          menu: "unexpected",
        };
      },
      pattern: /stateCheckpointResults\[0\]\.observation\.observedState does not semantically satisfy/,
    },
    {
      name: "terminal semantics",
      mutate(report) {
        report.terminalResult.observation.observedState.playState = "playing";
      },
      pattern: /terminalResult\.observation\.observedState does not semantically satisfy/,
    },
  ];
  for (const item of cases) {
    await t.test(item.name, () => {
      const report = structuredClone(fixture.report);
      item.mutate(report);
      assert.throws(() => verifyNaturalTraceEvidenceSemantics(fixture.spec, report), item.pattern);
    });
  }
});

test("natural trace frame evidence exhausts the one-indexed range and rejects gaps, duplicates, and disorder", async (t) => {
  const fixture = await convertFixtureToNaturalTrace(await createDirectRequirementFixture());
  const spec = structuredClone(fixture.spec);
  spec.identity.requiredRange = {firstFrame: 1, lastFrame: 3};
  const baseFrame = fixture.report.orderedStepResults[0].frameEvidence[0];

  await t.test("accepts exhaustive ordered evidence", () => {
    const report = structuredClone(fixture.report);
    report.orderedStepResults[0].frameEvidence = [1, 2, 3].map((frame) => ({...baseFrame, frame}));
    assert.deepEqual(verifyNaturalTraceEvidenceSemantics(spec, report), {frameCount: 3});
  });

  await t.test("rejects a missing frame", () => {
    const report = structuredClone(fixture.report);
    report.orderedStepResults[0].frameEvidence = [1, 3].map((frame) => ({...baseFrame, frame}));
    assert.throws(
      () => verifyNaturalTraceEvidenceSemantics(spec, report),
      /natural trace frame evidence covers 2\/3 required frames; missing 2/,
    );
  });

  await t.test("rejects a duplicate frame in one evidence sequence", () => {
    const report = structuredClone(fixture.report);
    report.orderedStepResults[0].frameEvidence = [1, 1, 2, 3].map((frame) => ({...baseFrame, frame}));
    assert.throws(
      () => verifyNaturalTraceEvidenceSemantics(spec, report),
      /frames must be strictly increasing without duplicates/,
    );
  });

  await t.test("rejects an out-of-order frame sequence", () => {
    const report = structuredClone(fixture.report);
    report.orderedStepResults[0].frameEvidence = [1, 3, 2].map((frame) => ({...baseFrame, frame}));
    assert.throws(
      () => verifyNaturalTraceEvidenceSemantics(spec, report),
      /frames must be strictly increasing without duplicates/,
    );
  });
});

test("complete requirements fail when execution evidence is absent; blocked requirements remain unresolved but unaccepted", async () => {
  const complete = await createDirectRequirementFixture({includeReport: false});
  await assert.rejects(inspectTraceRequirement(complete), /complete coverage requirement is missing its execution report/);

  const blocked = await createDirectRequirementFixture({coverageStatus: "blocked", includeReport: false});
  const result = await inspectTraceRequirement(blocked);
  assert.equal(result.disposition, "unresolved-execution-report-absent");
  assert.equal(result.executionReportSha256, null);
});

test("artifact inspector rejects a report whose baseline manifest path/hash differs from coverage", async () => {
  const fixture = await createDirectRequirementFixture();
  const report = structuredClone(fixture.report);
  report.originalRuntimeCaptureManifest.file = `migrations/${fixture.id}/baseline/other.json`;
  await assert.rejects(
    verifyExecutionReportArtifacts({root: fixture.root, spec: fixture.spec, requirement: fixture.requirement, report}),
    /must exactly match coverage path\/hash/,
  );
});
