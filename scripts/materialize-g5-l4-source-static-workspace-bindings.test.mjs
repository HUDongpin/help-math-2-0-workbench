import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  applyBindingTransaction,
  assertCandidateLineage,
  assertBoundManifestPreimage,
  assertInitialCoveragePreimage,
  assertInitialManifestPreimage,
  buildBoundCoverage,
  buildBoundManifest,
  G5_L4_SOURCE_STATIC_BINDING_IDS,
  initialCoverage,
  parseArguments,
  readTransactionSnapshot,
} from "./materialize-g5-l4-source-static-workspace-bindings.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalForTest = (value) => JSON.stringify(value);

function sha256Artifact(pathname, value, sha256 = "a".repeat(64)) {
  return {
    path: pathname,
    sha256,
    text: `${JSON.stringify(value)}\n`,
    value,
  };
}

async function jsonArtifact(filePath) {
  const snapshot = await readTransactionSnapshot(filePath);
  return {...snapshot, value: JSON.parse(snapshot.text)};
}

async function buildLineageFixture(animationId = "course-g05-l04-vb-002") {
  const workspace = path.join(ROOT, "migrations", animationId);
  const paths = {
    spec:
      `migrations/${animationId}/audit/source-static-current-js-candidate-spec.json`,
    report:
      `migrations/${animationId}/evidence/source-static-current-js-candidate.json`,
    assetManifest:
      `public/flash-assets/courses/${animationId}/manifest.json`,
    runtime:
      `public/flash-assets/courses/${animationId}/canvas-renderer.js`,
  };
  const specArtifact = await jsonArtifact(path.join(ROOT, paths.spec));
  const [
    reportArtifact,
    assetManifestArtifact,
    runtimeArtifact,
    sourceSwfArtifact,
    sourceFlaArtifact,
    associatedAudioArtifact,
    antecedentScenarioArtifact,
    antecedentDispositionArtifact,
    audioAuditArtifact,
    generatorArtifact,
    safeAdapterArtifact,
  ] = await Promise.all([
    jsonArtifact(path.join(ROOT, paths.report)),
    jsonArtifact(path.join(ROOT, paths.assetManifest)),
    readTransactionSnapshot(path.join(ROOT, paths.runtime)),
    readTransactionSnapshot(path.join(ROOT, specArtifact.value.source.swf)),
    readTransactionSnapshot(path.join(ROOT, specArtifact.value.source.fla)),
    readTransactionSnapshot(
      path.join(ROOT, specArtifact.value.source.associatedAudio),
    ),
    jsonArtifact(path.join(
      ROOT,
      specArtifact.value.evidence.prebindingScenarioInventory,
    )),
    jsonArtifact(path.join(
      ROOT,
      specArtifact.value.evidence.prebindingFrameDomainDisposition,
    )),
    jsonArtifact(path.join(ROOT, specArtifact.value.evidence.audioAudit)),
    readTransactionSnapshot(path.join(
      ROOT,
      "scripts/build-g5-l4-source-static-candidates.mjs",
    )),
    readTransactionSnapshot(path.join(
      ROOT,
      "scripts/build-safe-ffdec-canvas-adapter.mjs",
    )),
  ]);
  return {
    animationId,
    paths,
    specArtifact,
    reportArtifact,
    assetManifestArtifact,
    runtimeArtifact,
    sourceSwfArtifact,
    sourceFlaArtifact,
    associatedAudioArtifact,
    antecedentScenarioArtifact,
    antecedentDispositionArtifact,
    audioAuditArtifact,
    generatorArtifact,
    safeAdapterArtifact,
    workspace,
  };
}

async function transactionFixture(t, {noOp = false, outputCount = 2} = {}) {
  const root = await mkdtemp(
    path.join(tmpdir(), "g5-l4-workspace-binding-test-"),
  );
  t.after(() => rm(root, {recursive: true, force: true}));
  const ledgerPath = path.join(root, "ledger.json");
  await writeFile(ledgerPath, "ledger-v1\n");
  const ledgerSnapshot = await readTransactionSnapshot(ledgerPath);
  const outputs = [];
  for (let index = 0; index < outputCount; index += 1) {
    const target = path.join(root, `target-${index}.json`);
    await writeFile(target, `before-${index}\n`);
    const before = await readTransactionSnapshot(target);
    outputs.push({
      path: target,
      before,
      rendered: noOp ? before.text : `after-${index}\n`,
    });
  }
  return {
    root,
    lockPath: path.join(root, "transaction.lock"),
    ledgerPath,
    prepared: [{animationId: "fixture-animation", outputs}],
    readSet: [{
      label: "fixture ledger",
      path: ledgerPath,
      snapshot: ledgerSnapshot,
    }],
    outputs,
  };
}

test("workspace-binding CLI is bounded, dry-run by default, and explicit to write", () => {
  assert.deepEqual(G5_L4_SOURCE_STATIC_BINDING_IDS, [
    "course-g05-l04-vb-002",
    "course-g05-l04-vb-005",
    "course-g05-l04-vb-006",
    "course-g05-l04-in-009",
    "course-g05-l04-in-015",
    "course-g05-l04-ts-006",
    "course-g05-l04-ts-003",
    "course-g05-l04-ts-002",
    "course-g05-l04-ts-005",
    "course-g05-l04-ts-004",
    "course-g05-l04-vb-008",
    "course-g05-l04-vb-009",
    "course-g05-l04-in-020",
    "course-g05-l04-in-012",
    "course-g05-l04-rw-003",
    "course-g05-l04-rw-004",
    "course-g05-l04-in-002",
    "course-g05-l04-in-007",
    "course-g05-l04-rw-002",
    "course-g05-l04-in-004",
    "course-g05-l04-in-018",
    "course-g05-l04-in-017",
    "course-g05-l04-in-016",
    "course-g05-l04-in-014",
    "course-g05-l04-in-013",
    "course-g05-l04-in-010",
    "course-g05-l04-in-005",
    "course-g05-l04-in-003",
    "course-g05-l04-vb-007",
    "course-g05-l04-vb-010",
    "course-g05-l04-vb-011",
    "course-g05-l04-ts-008",
    "course-g05-l04-ts-007",
    "course-g05-l04-vb-003",
    "course-g05-l04-vb-004",
    "course-g05-l04-in-006",
    "course-g05-l04-in-008",
    "course-g05-l04-in-011",
    "course-g05-l04-in-019",
    "course-g05-l04-in-021",
    "course-g05-l04-in-022",
    "course-g05-l04-ti-002",
    "course-g05-l04-ti-003",
    "course-g05-l04-ti-004",
    "course-g05-l04-ti-005",
    "course-g05-l04-ti-006",
    "course-g05-l04-ti-007",
    "course-g05-l04-ti-008",
    "course-g05-l04-ti-009",
    "course-g05-l04-gs-002",
    "course-g05-l04-ir-001-a662633d",
  ]);
  assert.deepEqual(parseArguments([]), {
    mode: "dry-run",
    ids: [...G5_L4_SOURCE_STATIC_BINDING_IDS],
  });
  assert.deepEqual(parseArguments([
    "--apply",
    "--id", "course-g05-l04-vb-002",
    "--id", "course-g05-l04-in-015",
  ]), {
    mode: "apply",
    ids: ["course-g05-l04-vb-002", "course-g05-l04-in-015"],
  });
  assert.throws(
    () => parseArguments(["--id", "course-g05-l04-vb-999"]),
    /unsupported animation ID/,
  );
  assert.throws(
    () => parseArguments(["--apply", "--check"]),
    /cannot be combined/,
  );
  assert.throws(
    () => parseArguments([
      ...G5_L4_SOURCE_STATIC_BINDING_IDS.flatMap((id) => ["--id", id]),
      "--id", G5_L4_SOURCE_STATIC_BINDING_IDS[0],
    ]),
    /duplicate --id/,
  );
});

test("initial preimage guards reject implementation, capture, and review overlays", async () => {
  const fixture = await buildLineageFixture();
  const currentManifest = JSON.parse(await readFile(
    path.join(fixture.workspace, "migration.json"),
    "utf8",
  ));
  const spec = fixture.specArtifact.value;
  const initialManifest = {
    scenarios: [{
      id: "default",
      kind: "linear",
      description: "",
      reachable: true,
    }],
    implementation: {
      rendering: "undecided",
      route: "",
      routeFile: "",
      component: "",
      registryModule: "",
      timelineModule: "",
      testFile: "",
      standalonePackage: "",
      defaultFrameDomainId: "root",
      frameDomains: [{
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        parentFrameDomainId: null,
        frameCount: spec.timeline.root.frameCount,
        scenarioIds: ["default"],
      }],
      captureContract: currentManifest.implementation.captureContract,
    },
    evidence: {
      assetInventory: "asset-inventory.csv",
      audioInventory: "audio-inventory.csv",
      keyframeCsv: "keyframes.csv",
      fullFrameCoverageFile: "evidence/full-frame-coverage.json",
      differenceDirectory: "evidence/diffs",
      archiveDirectory: "",
    },
    acceptance: currentManifest.acceptance,
  };
  assert.doesNotThrow(
    () => assertInitialManifestPreimage(initialManifest, spec),
  );
  assert.throws(
    () => assertInitialManifestPreimage({
      ...initialManifest,
      implementation: {
        ...initialManifest.implementation,
        candidateState: {status: "future-overlay"},
      },
    }, spec),
    /non-initial implementation overlay/,
  );
  assert.throws(
    () => assertInitialManifestPreimage({
      ...initialManifest,
      evidence: {
        ...initialManifest.evidence,
        baselineCaptureManifest: "future.json",
      },
    }, spec),
    /non-initial evidence bindings/,
  );
  assert.throws(
    () => assertInitialManifestPreimage({
      ...initialManifest,
      acceptance: {
        ...initialManifest.acceptance,
        engineeringReview: {
          ...initialManifest.acceptance.engineeringReview,
          reviewer: "future reviewer",
        },
      },
    }, spec),
    /review overlays/,
  );

  const coverage = initialCoverage(
    fixture.animationId,
    spec.timeline.root.frameCount,
  );
  assert.doesNotThrow(() => assertInitialCoveragePreimage(coverage, spec));
  const promotedCoverage = structuredClone(coverage);
  promotedCoverage.requirements[0].captureManifest = "future-capture.json";
  assert.throws(
    () => assertInitialCoveragePreimage(promotedCoverage, spec),
    /capture or review coverage overlays/,
  );
});

test("binding preserves status and reviews while declaring only root plus one nested candidate", async () => {
  const animationId = "course-g05-l04-vb-002";
  const workspace = path.join(ROOT, "migrations", animationId);
  const [manifest, spec, report, assetManifest] = await Promise.all([
    readFile(path.join(workspace, "migration.json"), "utf8").then(JSON.parse),
    readFile(path.join(workspace, "audit",
      "source-static-current-js-candidate-spec.json"), "utf8").then(JSON.parse),
    readFile(path.join(workspace, "evidence",
      "source-static-current-js-candidate.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "public", "flash-assets", "courses", animationId,
      "manifest.json"), "utf8").then(JSON.parse),
  ]);
  const manifestWithReview = structuredClone(manifest);
  manifestWithReview.acceptance.engineeringReview = {
    decision: "accepted",
    reviewer: "future independent reviewer",
    reviewedAt: "2030-01-01T00:00:00.000Z",
  };
  const bound = buildBoundManifest({
    manifest: manifestWithReview,
    spec,
    specArtifact: sha256Artifact("spec", spec),
    report,
    reportArtifact: sha256Artifact("report", report, "b".repeat(64)),
    assetManifest,
    assetManifestArtifact: sha256Artifact("asset-manifest", assetManifest,
      report.renderer.runtimeManifest.sha256),
    runtimeArtifact: sha256Artifact("runtime", null,
      report.renderer.runtimeScript.sha256),
    releaseSequence: 5,
    unresolvedTimelineCandidateIds: ["sprite-3"],
  });

  assert.equal(bound.status, "preserved");
  assert.deepEqual(bound.acceptance, manifestWithReview.acceptance);
  assert.deepEqual(bound.scenarios.map(({id}) => id), [
    "root-unavailable",
    "source-static-frame",
  ]);
  assert.equal(bound.implementation.defaultFrameDomainId, "sprite-49");
  assert.deepEqual(
    bound.implementation.frameDomains.map(({id, frameCount, scenarioIds}) => ({
      id,
      frameCount,
      scenarioIds,
    })),
    [
      {id: "root", frameCount: 10, scenarioIds: ["root-unavailable"]},
      {
        id: "sprite-49",
        frameCount: 186,
        scenarioIds: ["source-static-frame"],
      },
    ],
  );
  assert.equal(bound.implementation.candidateState.rootEnabled, false);
  assert.equal(bound.implementation.candidateState.spanishEnabled, false);
  assert.equal(bound.implementation.candidateState.audioEnabled, false);
  assert.equal(bound.implementation.candidateState.strictAcceptanceEffect, "none");
  assert.equal(
    bound.implementation.capturePlanning.nestedFrameDomainDispositionEstablished,
    true,
  );
  assert.equal(
    bound.implementation.capturePlanning
      .authoritativeRuntimeFrameDomainDispositionEstablished,
    false,
  );
  assert.deepEqual(
    bound.implementation.capturePlanning.unresolvedTimelineCandidateIds,
    ["sprite-3"],
  );

  const coverage = buildBoundCoverage({
    manifest: bound,
    releaseSequence: 5,
    unresolvedTimelineCandidateIds: ["sprite-3"],
  });
  assert.equal(coverage.requirements.length, 4);
  assert.deepEqual(
    coverage.requirements.map(
      ({frameDomainId, scenario, language, baselineAuthority, status}) => ({
        frameDomainId,
        scenario,
        language,
        baselineAuthority,
        status,
      }),
    ),
    [
      {
        frameDomainId: "root",
        scenario: "root-unavailable",
        language: "en",
        baselineAuthority: "unresolved",
        status: "pending",
      },
      {
        frameDomainId: "root",
        scenario: "root-unavailable",
        language: "es",
        baselineAuthority: "unresolved",
        status: "pending",
      },
      {
        frameDomainId: "sprite-49",
        scenario: "source-static-frame",
        language: "en",
        baselineAuthority: "unresolved",
        status: "pending",
      },
      {
        frameDomainId: "sprite-49",
        scenario: "source-static-frame",
        language: "es",
        baselineAuthority: "unresolved",
        status: "pending",
      },
    ],
  );
  assert.ok(coverage.requirements.every(
    ({entryStateSha256}) => /^[a-f0-9]{64}$/.test(entryStateSha256),
  ));
});

test("partial bindings expose only the safe prefix while retaining full evidence obligations", async () => {
  const animationId = "course-g05-l04-in-004";
  const workspace = path.join(ROOT, "migrations", animationId);
  const [manifest, coverage] = await Promise.all([
    readFile(path.join(workspace, "migration.json"), "utf8").then(JSON.parse),
    readFile(
      path.join(workspace, "evidence", "full-frame-coverage.json"),
      "utf8",
    ).then(JSON.parse),
  ]);
  assert.deepEqual(
    manifest.implementation.candidateState.sourceStaticFrames,
    {firstFrame: 1, lastFrame: 320},
  );
  assert.deepEqual(
    manifest.implementation.candidateState.sourceStaticRenderableFrames,
    {firstFrame: 1, lastFrame: 307, frameCount: 307},
  );
  assert.deepEqual(
    manifest.implementation.candidateState.blockedLocalFrameRanges,
    [{
      firstFrame: 308,
      lastFrame: 320,
      reason:
        "Frames 308..320 place source right/wrong feedback clips whose visibility and progression depend on unresolved host and ActionScript state.",
    }],
  );
  assert.equal(
    manifest.implementation.candidateState.renderedFrameCount,
    307,
  );
  const nestedRequirements = coverage.requirements.filter(
    ({frameDomainId}) => frameDomainId === "sprite-436",
  );
  assert.equal(nestedRequirements.length, 2);
  assert.ok(nestedRequirements.every(
    ({requiredRange, capturedFrameCount, missingFrames}) =>
      canonicalForTest(requiredRange) ===
        canonicalForTest({firstFrame: 1, lastFrame: 320}) &&
      capturedFrameCount === 0 &&
      missingFrames.length === 320,
  ));
  assert.ok(coverage.limitations.some(
    (limitation) =>
      limitation.includes("renders only frames 1..307") &&
      limitation.includes("308..320 fail closed"),
  ));
  assert.equal(manifest.acceptance.ownerReview.decision, "pending");
});

test("a prior bounded candidate permits only an acceptance-neutral hash refresh", async () => {
  const fixture = await buildLineageFixture();
  const manifest = JSON.parse(await readFile(
    path.join(fixture.workspace, "migration.json"),
    "utf8",
  ));
  const expected = buildBoundManifest({
    selectedAnimationId: fixture.animationId,
    manifest,
    spec: fixture.specArtifact.value,
    specArtifact: fixture.specArtifact,
    report: fixture.reportArtifact.value,
    reportArtifact: fixture.reportArtifact,
    assetManifest: fixture.assetManifestArtifact.value,
    assetManifestArtifact: fixture.assetManifestArtifact,
    runtimeArtifact: fixture.runtimeArtifact,
    releaseSequence: 5,
    unresolvedTimelineCandidateIds: [],
  });
  assert.doesNotThrow(
    () => assertBoundManifestPreimage(manifest, expected),
  );

  const promoted = structuredClone(manifest);
  promoted.implementation.candidateState.spanishEnabled = true;
  assert.throws(
    () => assertBoundManifestPreimage(promoted, expected),
    /structurally drifted candidate binding/,
  );

  const captured = structuredClone(manifest);
  captured.evidence.baselineCaptureManifest = "future-capture.json";
  assert.throws(
    () => assertBoundManifestPreimage(captured, expected),
    /non-candidate evidence overlays/,
  );

  const reviewed = structuredClone(manifest);
  reviewed.acceptance.ownerReview.decision = "accepted";
  assert.throws(
    () => assertBoundManifestPreimage(reviewed, expected),
    /review overlays/,
  );

  const authoritative = structuredClone(manifest);
  authoritative.baseline.authority = "original-runtime-natural-trace";
  assert.throws(
    () => assertBoundManifestPreimage(authoritative, expected),
    /fidelity-evidence boundary/,
  );
});

test("binding refuses any candidate artifact that promotes an acceptance gate", async () => {
  const animationId = "course-g05-l04-vb-002";
  const workspace = path.join(ROOT, "migrations", animationId);
  const [manifest, spec, report, assetManifest] = await Promise.all([
    readFile(path.join(workspace, "migration.json"), "utf8").then(JSON.parse),
    readFile(path.join(workspace, "audit",
      "source-static-current-js-candidate-spec.json"), "utf8").then(JSON.parse),
    readFile(path.join(workspace, "evidence",
      "source-static-current-js-candidate.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "public", "flash-assets", "courses", animationId,
      "manifest.json"), "utf8").then(JSON.parse),
  ]);
  const promotedReport = {
    ...report,
    acceptanceEffects: {
      ...report.acceptanceEffects,
      strictMigrationComplete: true,
    },
  };

  assert.throws(
    () => buildBoundManifest({
      manifest,
      spec,
      specArtifact: sha256Artifact("spec", spec),
      report: promotedReport,
      reportArtifact: sha256Artifact("report", promotedReport),
      assetManifest,
      assetManifestArtifact: sha256Artifact("asset-manifest", assetManifest,
        report.renderer.runtimeManifest.sha256),
      runtimeArtifact: sha256Artifact("runtime", null,
        report.renderer.runtimeScript.sha256),
      releaseSequence: 5,
      unresolvedTimelineCandidateIds: ["sprite-3"],
    }),
    /cannot satisfy strictMigrationComplete/,
  );
});

test("binding requires the exact acceptance and evidence-boundary field sets", async () => {
  const fixture = await buildLineageFixture();
  const {
    animationId,
    specArtifact,
    reportArtifact,
    assetManifestArtifact,
  } = fixture;
  const base = {
    selectedAnimationId: animationId,
    manifest: JSON.parse(await readFile(
      path.join(fixture.workspace, "migration.json"),
      "utf8",
    )),
    spec: specArtifact.value,
    specArtifact,
    report: reportArtifact.value,
    reportArtifact,
    assetManifest: assetManifestArtifact.value,
    assetManifestArtifact,
    runtimeArtifact: fixture.runtimeArtifact,
    releaseSequence: 5,
    unresolvedTimelineCandidateIds: [],
  };
  assert.throws(
    () => buildBoundManifest({
      ...base,
      report: {...base.report, acceptanceEffects: {}},
    }),
    /acceptance effects field set changed/,
  );
  assert.throws(
    () => buildBoundManifest({
      ...base,
      report: {
        ...base.report,
        evidenceBoundary: {
          ...base.report.evidenceBoundary,
          originalRuntimeBaselineUsed: true,
        },
      },
    }),
    /cannot satisfy originalRuntimeBaselineUsed/,
  );
});

test("candidate lineage closes selected ID, spec, sources, runtime, and antecedents", async () => {
  const fixture = await buildLineageFixture();
  const currentManifest = JSON.parse(await readFile(
    path.join(fixture.workspace, "migration.json"),
    "utf8",
  ));
  assert.doesNotThrow(() => assertCandidateLineage(fixture));

  assert.throws(
    () => assertCandidateLineage({
      ...fixture,
      reportArtifact: {
        ...fixture.reportArtifact,
        value: {
          ...fixture.reportArtifact.value,
          specification: {
            ...fixture.reportArtifact.value.specification,
            sha256: "0".repeat(64),
          },
        },
      },
    }),
    /report specification SHA-256 mismatch/,
  );
  assert.throws(
    () => assertCandidateLineage({
      ...fixture,
      assetManifestArtifact: {
        ...fixture.assetManifestArtifact,
        value: {
          ...fixture.assetManifestArtifact.value,
          output: {
            ...fixture.assetManifestArtifact.value.output,
            sha256: "1".repeat(64),
          },
        },
      },
    }),
    /asset-manifest runtime output SHA-256 mismatch/,
  );
  assert.throws(
    () => assertCandidateLineage({
      ...fixture,
      assetManifestArtifact: {
        ...fixture.assetManifestArtifact,
        value: {
          ...fixture.assetManifestArtifact.value,
          inputs: {
            ...fixture.assetManifestArtifact.value.inputs,
            freshFfdecExport: {
              ...fixture.assetManifestArtifact.value.inputs.freshFfdecExport,
              framesHtmlSha256: "2".repeat(64),
            },
          },
        },
      },
    }),
    /FFDec export lineage mismatch/,
  );
  assert.throws(
    () => buildBoundManifest({
      selectedAnimationId: "course-g05-l04-vb-005",
      manifest: currentManifest,
      spec: fixture.specArtifact.value,
      specArtifact: fixture.specArtifact,
      report: fixture.reportArtifact.value,
      reportArtifact: fixture.reportArtifact,
      assetManifest: fixture.assetManifestArtifact.value,
      assetManifestArtifact: fixture.assetManifestArtifact,
      runtimeArtifact: fixture.runtimeArtifact,
      releaseSequence: 5,
      unresolvedTimelineCandidateIds: [],
    }),
    /selected-workspace identity mismatch/,
  );

  const swfOnlySpec = structuredClone(fixture.specArtifact.value);
  swfOnlySpec.source = {
    ...swfOnlySpec.source,
    pairedFlaStatus: "missing",
    fla: null,
    flaBytes: null,
    flaSha256: null,
  };
  const missingFlaBinding = {
    pairedFlaStatus: "missing",
    path: null,
    bytes: null,
    sha256: null,
    authoringAuditEstablished: false,
  };
  const swfOnlyFixture = {
    ...fixture,
    specArtifact: {
      ...fixture.specArtifact,
      value: swfOnlySpec,
    },
    reportArtifact: {
      ...fixture.reportArtifact,
      value: {
        ...fixture.reportArtifact.value,
        source: {
          ...fixture.reportArtifact.value.source,
          fla: missingFlaBinding,
        },
      },
    },
    assetManifestArtifact: {
      ...fixture.assetManifestArtifact,
      value: {
        ...fixture.assetManifestArtifact.value,
        inputs: {
          ...fixture.assetManifestArtifact.value.inputs,
          sourceFla: missingFlaBinding,
        },
      },
    },
    sourceFlaArtifact: null,
  };
  assert.doesNotThrow(() => assertCandidateLineage(swfOnlyFixture));
  const ambiguousMissingFla = structuredClone(swfOnlyFixture);
  ambiguousMissingFla.specArtifact.value.source.flaBytes = 0;
  assert.throws(
    () => assertCandidateLineage(ambiguousMissingFla),
    /missing FLA must use an exact null source tuple/,
  );
  const forgedMissingFla = structuredClone(swfOnlyFixture);
  forgedMissingFla.reportArtifact.value.source.fla.path =
    "source-assets/flash/forged.fla";
  assert.throws(
    () => assertCandidateLineage(forgedMissingFla),
    /FLA source lineage mismatch/,
  );
});

test("IR001 lineage requires the source SWF as its exact embedded-audio container", async () => {
  const fixture = await buildLineageFixture(
    "course-g05-l04-ir-001-a662633d",
  );
  assert.doesNotThrow(() => assertCandidateLineage(fixture));
  assert.equal(
    fixture.specArtifact.value.source.associatedAudioKind,
    "embedded-swf-stream-container",
  );
  assert.equal(
    fixture.specArtifact.value.source.associatedAudio,
    fixture.specArtifact.value.source.swf,
  );
  assert.equal(
    fixture.reportArtifact.value.source.associatedAudio.kind,
    "embedded-swf-stream-container",
  );
  assert.equal(
    fixture.assetManifestArtifact.value.inputs.associatedAudio.kind,
    "embedded-swf-stream-container",
  );

  assert.throws(
    () => assertCandidateLineage({
      ...fixture,
      reportArtifact: {
        ...fixture.reportArtifact,
        value: {
          ...fixture.reportArtifact.value,
          source: {
            ...fixture.reportArtifact.value.source,
            associatedAudio: {
              ...fixture.reportArtifact.value.source.associatedAudio,
              kind: "external-file",
            },
          },
        },
      },
    }),
    /associated audio kind mismatch/,
  );

  assert.throws(
    () => assertCandidateLineage({
      ...fixture,
      associatedAudioArtifact: {
        ...fixture.associatedAudioArtifact,
        path: `${fixture.associatedAudioArtifact.path}.forged`,
      },
    }),
    /embedded audio container must be the exact source SWF/,
  );
});

test("byte-identical apply is a lock-protected no-op that preserves inode", async (t) => {
  const fixture = await transactionFixture(t, {noOp: true});
  const before = await Promise.all(
    fixture.outputs.map(({path: target}) => stat(target)),
  );
  const result = await applyBindingTransaction(fixture);
  const after = await Promise.all(
    fixture.outputs.map(({path: target}) => stat(target)),
  );
  assert.equal(result.changedOutputCount, 0);
  assert.equal(result.noOpOutputCount, 2);
  assert.deepEqual(
    after.map(({ino}) => ino),
    before.map(({ino}) => ino),
  );
  await assert.rejects(stat(fixture.lockPath), {code: "ENOENT"});
});

test("changed outputs commit under one lock with current read-set postconditions", async (t) => {
  const fixture = await transactionFixture(t);
  const result = await applyBindingTransaction(fixture);
  assert.equal(result.changedOutputCount, 2);
  assert.equal(result.noOpOutputCount, 0);
  assert.equal(await readFile(fixture.outputs[0].path, "utf8"), "after-0\n");
  assert.equal(await readFile(fixture.outputs[1].path, "utf8"), "after-1\n");
  assert.equal(await readFile(fixture.ledgerPath, "utf8"), "ledger-v1\n");
  await assert.rejects(stat(fixture.lockPath), {code: "ENOENT"});
});

test("byte-identical apply still CAS-checks every no-op output", async (t) => {
  const fixture = await transactionFixture(t, {noOp: true, outputCount: 1});
  await assert.rejects(
    applyBindingTransaction({
      ...fixture,
      hooks: {
        afterLock: async () => {
          await writeFile(fixture.outputs[0].path, "foreign-no-op\n");
        },
      },
    }),
    /no-op binding postcondition changed after preflight/,
  );
  assert.equal(
    await readFile(fixture.outputs[0].path, "utf8"),
    "foreign-no-op\n",
  );
});

test("read-set drift after one install rolls back the installed output", async (t) => {
  const fixture = await transactionFixture(t);
  await assert.rejects(
    applyBindingTransaction({
      ...fixture,
      hooks: {
        afterInstall: async ({index}) => {
          if (index === 0) {
            await writeFile(fixture.ledgerPath, "ledger-v2\n");
          }
        },
      },
    }),
    /fixture ledger changed after preflight/,
  );
  assert.equal(await readFile(fixture.outputs[0].path, "utf8"), "before-0\n");
  assert.equal(await readFile(fixture.outputs[1].path, "utf8"), "before-1\n");
  assert.equal(await readFile(fixture.ledgerPath, "utf8"), "ledger-v2\n");
  await assert.rejects(stat(fixture.lockPath), {code: "ENOENT"});
});

test("target CAS drift preserves the foreign target and rolls back earlier output", async (t) => {
  const fixture = await transactionFixture(t);
  await assert.rejects(
    applyBindingTransaction({
      ...fixture,
      hooks: {
        beforeInstall: async ({index}) => {
          if (index === 1) {
            await writeFile(fixture.outputs[1].path, "foreign-target\n");
          }
        },
      },
    }),
    /binding target before commit changed after preflight/,
  );
  assert.equal(await readFile(fixture.outputs[0].path, "utf8"), "before-0\n");
  assert.equal(
    await readFile(fixture.outputs[1].path, "utf8"),
    "foreign-target\n",
  );
});

test("ledger postcondition failure safely rolls back every installed output", async (t) => {
  const fixture = await transactionFixture(t, {outputCount: 1});
  await assert.rejects(
    applyBindingTransaction({
      ...fixture,
      hooks: {
        beforePostcondition: async () => {
          await writeFile(fixture.ledgerPath, "ledger-postcondition-drift\n");
        },
      },
    }),
    /fixture ledger changed after preflight/,
  );
  assert.equal(await readFile(fixture.outputs[0].path, "utf8"), "before-0\n");
});

test("rollback refuses to overwrite a post-install foreign replacement", async (t) => {
  const fixture = await transactionFixture(t, {outputCount: 1});
  await assert.rejects(
    applyBindingTransaction({
      ...fixture,
      hooks: {
        beforePostcondition: async () => {
          throw new Error("synthetic postcondition failure");
        },
        beforeRollback: async ({output}) => {
          await writeFile(output.path, "foreign-after-install\n");
        },
      },
    }),
    /rollback was incomplete/,
  );
  assert.equal(
    await readFile(fixture.outputs[0].path, "utf8"),
    "foreign-after-install\n",
  );
});

test("an active or residual transaction lock blocks every write", async (t) => {
  const fixture = await transactionFixture(t, {outputCount: 1});
  await writeFile(fixture.lockPath, "foreign lock\n");
  await assert.rejects(
    applyBindingTransaction(fixture),
    /transaction lock is active or residual/,
  );
  assert.equal(await readFile(fixture.outputs[0].path, "utf8"), "before-0\n");
  assert.equal(await readFile(fixture.lockPath, "utf8"), "foreign lock\n");
});
