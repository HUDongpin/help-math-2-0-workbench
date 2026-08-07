import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {copyFile, mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  CANONICAL_PROJECTION_ENCODING,
  TECHNICAL_MANIFEST_PROJECTION,
} from "./evidence-projections.mjs";
import {
  VB004_SOURCE_BRANCH_CONTRACT,
  buildActionScriptExcerpt,
  buildVb004SourceBranchCandidates,
  generateVb004SourceBranchCandidates,
  normalizeActionScript,
  parseArguments,
} from "./build-vb004-source-branch-candidates.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatorPath = path.join(projectRoot, "scripts", "build-vb004-source-branch-candidates.mjs");
const artifactPath = path.join(projectRoot, VB004_SOURCE_BRANCH_CONTRACT.outputPath);

const protectedRelativePaths = [
  "migrations/course-g03-l01-vb-004/audit/trace-specs/req-sprite-231-linear-to-quiz-stop-en.json",
  "migrations/course-g03-l01-vb-004/audit/trace-specs/req-sprite-231-linear-to-quiz-stop-es.json",
  "migrations/course-g03-l01-vb-004/evidence/full-frame-coverage.json",
  "migrations/course-g03-l01-vb-004/audit/scenario-inventory.json",
  "migrations/course-g03-l01-vb-004/audit/animate-createjs-adapter-spec.json",
  "migrations/course-g03-l01-vb-004/migration.json",
  "reports/current-javascript-output-human-approval.json",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(filePath) {
  return sha256(await readFile(filePath));
}

function cloneContract() {
  return structuredClone(VB004_SOURCE_BRANCH_CONTRACT);
}

function injectedHostActionScript(artifact) {
  return {
    toolchain: structuredClone(artifact.generatedBy.toolchain.ffdec),
    fullExportFileCount: artifact.hostActionScriptEvidence.fullExportFileCount,
    fullExportIndexHashMode: artifact.hostActionScriptEvidence.fullExportIndexHashMode,
    fullExportIndexSha256: artifact.hostActionScriptEvidence.fullExportIndexSha256,
    excerpts: structuredClone(artifact.hostActionScriptEvidence.excerpts),
  };
}

async function readCheckedInArtifact() {
  return JSON.parse(await readFile(artifactPath, "utf8"));
}

async function copyContractProject(contract = VB004_SOURCE_BRANCH_CONTRACT) {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-vb004-source-branches-"));
  for (const input of contract.inputs) {
    const target = path.join(root, input.path);
    await mkdir(path.dirname(target), {recursive: true});
    await copyFile(path.join(projectRoot, input.path), target);
  }
  return root;
}

test("checked-in artifact reconstructs exactly and inventories every required source branch without granting acceptance", async () => {
  const artifact = await readCheckedInArtifact();
  const rebuilt = await buildVb004SourceBranchCandidates({
    root: projectRoot,
    generatorPath,
    hostActionScript: injectedHostActionScript(artifact),
  });
  assert.deepEqual(rebuilt, artifact);

  assert.equal(artifact.animationId, "course-g03-l01-vb-004");
  assert.equal(artifact.artifactStatus, "static-source-candidates-runtime-unverified");
  assert.deepEqual(artifact.writeBoundary, {
    onlyOutput: VB004_SOURCE_BRANCH_CONTRACT.outputPath,
    modifiesAdapterOrSemanticPin: false,
    modifiesCoverage: false,
    modifiesHumanOrOwnerApproval: false,
    modifiesMigrationStatus: false,
    modifiesScenarioInventory: false,
    modifiesSourceAssets: false,
    modifiesTraceSpecs: false,
  });
  assert.deepEqual(artifact.authorityBoundary, {
    audioListeningOrSynchronizationAccepted: false,
    authoritativeBaseline: false,
    completionClaimAllowed: false,
    humanReviewRecorded: false,
    originalRuntimeExecutionLog: false,
    ownerAcceptanceRecorded: false,
    readySchedule: false,
    replayOrTerminalAccepted: false,
    rmseOrVisualFidelityProven: false,
    runtimeReachabilityProven: false,
    strictAcceptanceEffect: "none",
  });

  const branches = artifact.branchCandidates;
  assert.deepEqual(branches.naturalToFirstQuizStop.sourceStructuredFrameRange, {firstFrame: 1, lastFrame: 56});
  assert.deepEqual(branches.naturalToFirstQuizStop.firstStopCheckpointCandidate, {
    localFrame: 56,
    playback: "stopped",
    quizSection: true,
    quizTryCount: 0,
  });
  assert.deepEqual(branches.naturalToFirstQuizStop.postStopRange, {
    firstFrame: 57,
    lastFrame: 222,
    sourceEvidencedActionRequired: true,
  });
  assert.equal(branches.naturalToFirstQuizStop.readySchedule, false);

  assert.deepEqual(branches.correctFeedback.map(({candidateId}) => candidateId), [
    "correct-feedback-1",
    "correct-feedback-2",
    "correct-feedback-3",
    "correct-feedback-4",
  ]);
  assert.deepEqual(branches.correctFeedback.map(({sourcePlacement}) => sourcePlacement.objectId), [213, 188, 229, 121]);
  assert.ok(branches.correctFeedback.every(({readySchedule}) => readySchedule === false));
  assert.deepEqual(branches.wrongFeedback.map(({candidateId}) => candidateId), [
    "wrong-feedback-1",
    "wrong-feedback-2",
    "wrong-feedback-3",
  ]);
  assert.deepEqual(branches.wrongFeedback.map(({sourcePlacement}) => sourcePlacement.objectId), [97, 109, 85]);
  assert.ok(branches.wrongFeedback.every(({readySchedule}) => readySchedule === false));
  assert.deepEqual(branches.glossaryHyperlink.map(({sourceTarget}) => sourceTarget.keyAttribute), [
    "Digit",
    "Tens place",
    "Value",
    "Place value chart",
  ]);
  assert.equal(branches.attemptCounterAudit.incrementObserved, false);
  assert.equal(branches.attemptCounterAudit.forcedContinuationReachabilityProven, false);

  assert.deepEqual(
    {
      candidateId: branches.spanishAudio.candidateId,
      playButtonDefinition: branches.spanishAudio.playButtonDefinition,
      stopButtonDefinition: branches.spanishAudio.stopButtonDefinition,
      sha256: branches.spanishAudio.externalTrack.sha256,
      durationMs: branches.spanishAudio.externalTrack.durationMs,
      startSemantics: branches.spanishAudio.externalTrack.startSemantics,
      readySchedule: branches.spanishAudio.readySchedule,
      listeningAccepted: branches.spanishAudio.listeningAccepted,
      synchronizationAccepted: branches.spanishAudio.synchronizationAccepted,
    },
    {
      candidateId: "spanish-audio-user-activated-host-path",
      playButtonDefinition: 221,
      stopButtonDefinition: 215,
      sha256: "b594513fbc63da6f76cef1cfe55ed7e76dc5bb257a7007d4dda1d5295f6cf4f4",
      durationMs: 5640,
      startSemantics: "host-user-activated",
      readySchedule: false,
      listeningAccepted: false,
      synchronizationAccepted: false,
    },
  );
  assert.deepEqual(branches.replayAndTerminal.replayCandidates.map(({candidateId}) => candidateId), [
    "shell-reload-current-page",
    "shell-rewind-to-frame-one",
  ]);
  assert.equal(branches.replayAndTerminal.terminalCandidate.childStopActionAtFrame222Observed, false);
  assert.equal(branches.replayAndTerminal.terminalCandidate.fullShellMonitorMayStopAtTotalFrame, true);
  assert.equal(branches.replayAndTerminal.terminalCandidate.authorizedEventOrderingProven, false);

  assert.equal(artifact.blockers.upstreamScenarioInventoryUnknowns.length, 10);
  assert.equal(artifact.blockers.strictGateBlockers.length, 4);
  assert.equal(artifact.blockers.branchCaptureMissing.length, 5);
  assert.equal(artifact.blockers.derived.length, 9);
  assert.deepEqual(artifact.blockers.derived.map(({id}) => id), [
    "coverage-range-requires-post-stop-actions",
    "feedback-random-unbound-to-trace-seed",
    "wrong-attempt-counter-has-no-observed-increment",
    "glossary-return-path-unresolved",
    "spanish-trigger-and-synchronization-unresolved",
    "replay-full-reset-unresolved",
    "terminal-shell-event-ordering",
    "adapter-scenario-pin-stale",
    "authoritative-captures-rmse-and-review-missing",
  ]);
  assert.deepEqual(artifact.coverageQualification.currentRequirements.map((requirement) => ({
    language: requirement.language,
    lastFrame: requirement.requiredRange.lastFrame,
    capturedFrameCount: requirement.capturedFrameCount,
    captureManifestSha256: requirement.captureManifestSha256,
    baselineAuthority: requirement.baselineAuthority,
    baselineCaptureManifestSha256: requirement.baselineCaptureManifestSha256,
    metricsSha256: requirement.metricsSha256,
  })), [
    {
      language: "en",
      lastFrame: 222,
      capturedFrameCount: 222,
      captureManifestSha256: "c5c0adafa4d5633201ef88437ea6f39fdb1086ca4cd3439728c7a1d1cff54349",
      baselineAuthority: "unresolved",
      baselineCaptureManifestSha256: "",
      metricsSha256: "",
    },
    {
      language: "es",
      lastFrame: 222,
      capturedFrameCount: 222,
      captureManifestSha256: "66d9df7fe2575e18b531c93e2f61d4aaedc0614751743a96c84384c19ef7583e",
      baselineAuthority: "unresolved",
      baselineCaptureManifestSha256: "",
      metricsSha256: "",
    },
  ]);
  assert.equal(artifact.coverageQualification.modifiesCurrentRequirements, false);

  assert.equal(artifact.hostActionScriptEvidence.fullExportFileCount, 547);
  assert.equal(artifact.hostActionScriptEvidence.fullExportIndexSha256, "d028db1e5af6808bc422f971efe06cfb10a8dd987c72d1b22eacdbdbf2b9ef27");
  assert.deepEqual(artifact.generatedBy.toolchain.ffdec, {
    jarSha256: "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f",
    version: "JPEXS Free Flash Decompiler v.26.2.1",
  });
  assert.equal(artifact.finalQualification.migrationStatusAtGeneration, "preserved");
  assert.equal(artifact.finalQualification.approvalChanged, false);
  assert.match(artifact.finalQualification.statement, /not a ready event schedule/);
  assert.match(artifact.finalQualification.statement, /owner acceptance/);
  assert.match(artifact.finalQualification.statement, /completion record/);
});

test("generation is deterministic, --check detects drift, and protected evidence remains byte-identical", async (context) => {
  const artifact = await readCheckedInArtifact();
  const hostActionScript = injectedHostActionScript(artifact);
  const root = await copyContractProject();
  context.after(() => rm(root, {recursive: true, force: true}));

  const protectedProjectPaths = protectedRelativePaths.map((relativePath) => path.join(projectRoot, relativePath));
  const protectedBefore = await Promise.all(protectedProjectPaths.map(sha256File));
  const tempInputPaths = VB004_SOURCE_BRANCH_CONTRACT.inputs.map(({path: relativePath}) => path.join(root, relativePath));
  const tempInputsBefore = await Promise.all(tempInputPaths.map(sha256File));

  const generated = await generateVb004SourceBranchCandidates({root, generatorPath, hostActionScript});
  assert.equal(generated.check, false);
  assert.match(generated.sha256, /^[a-f0-9]{64}$/);
  const outputPath = path.join(root, VB004_SOURCE_BRANCH_CONTRACT.outputPath);
  const firstBytes = await readFile(outputPath);
  assert.equal(sha256(firstBytes), generated.sha256);

  const checked = await generateVb004SourceBranchCandidates({root, generatorPath, hostActionScript, check: true});
  assert.deepEqual(checked, {...generated, check: true});
  assert.deepEqual(await Promise.all(tempInputPaths.map(sha256File)), tempInputsBefore);
  assert.deepEqual(await Promise.all(protectedProjectPaths.map(sha256File)), protectedBefore);

  await writeFile(outputPath, Buffer.concat([firstBytes, Buffer.from("manual drift\n")]));
  await assert.rejects(
    generateVb004SourceBranchCandidates({root, generatorPath, hostActionScript, check: true}),
    /source-branch-candidates\.json: stale/,
  );
  assert.deepEqual(await Promise.all(tempInputPaths.map(sha256File)), tempInputsBefore);
  assert.deepEqual(await Promise.all(protectedProjectPaths.map(sha256File)), protectedBefore);
});

test("migration binding ignores approval metadata but rejects technical implementation drift", async (context) => {
  const artifact = await readCheckedInArtifact();
  const root = await copyContractProject();
  context.after(() => rm(root, {recursive: true, force: true}));
  const manifestPath = path.join(root, "migrations/course-g03-l01-vb-004/migration.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.acceptance = {
    ...manifest.acceptance,
    currentJavaScriptOutputApproval: {
      decision: "accepted",
      reviewer: "Approval metadata must not change technical identity",
      reviewedAt: "2026-07-23T11:05:10+08:00",
    },
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const rebuilt = await buildVb004SourceBranchCandidates({
    root,
    generatorPath,
    hostActionScript: injectedHostActionScript(artifact),
  });
  const manifestEvidence = rebuilt.evidenceIndex.find(({evidenceId}) => evidenceId === "migration-manifest");
  assert.deepEqual(manifestEvidence, {
    evidenceId: "migration-manifest",
    path: "migrations/course-g03-l01-vb-004/migration.json",
    sha256: VB004_SOURCE_BRANCH_CONTRACT.inputs.find(({evidenceId}) => evidenceId === "migration-manifest").sha256,
    hashMode: CANONICAL_PROJECTION_ENCODING,
    projection: TECHNICAL_MANIFEST_PROJECTION.id,
  });

  manifest.implementation.route = "/animations/technical-drift-must-fail";
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(
    buildVb004SourceBranchCandidates({
      root,
      generatorPath,
      hostActionScript: injectedHostActionScript(artifact),
    }),
    /migration-manifest: SHA-256 mismatch/,
  );
});

test("fails closed when a bound input hash or injected host excerpt changes", async () => {
  const artifact = await readCheckedInArtifact();
  const badContract = cloneContract();
  badContract.inputs.find(({evidenceId}) => evidenceId === "scenario-inventory").sha256 = "a".repeat(64);
  await assert.rejects(
    buildVb004SourceBranchCandidates({
      root: projectRoot,
      generatorPath,
      contract: badContract,
      hostActionScript: injectedHostActionScript(artifact),
    }),
    /scenario-inventory: SHA-256 mismatch/,
  );

  const badHostActionScript = injectedHostActionScript(artifact);
  badHostActionScript.excerpts[0].text += "// tampered\n";
  await assert.rejects(
    buildVb004SourceBranchCandidates({root: projectRoot, generatorPath, hostActionScript: badHostActionScript}),
    /injected text does not match its normalized hash/,
  );
});

test("rejects promotion of current-JavaScript coverage into authoritative acceptance", async (context) => {
  const artifact = await readCheckedInArtifact();
  const contract = cloneContract();
  const root = await copyContractProject(contract);
  context.after(() => rm(root, {recursive: true, force: true}));

  const coverageInput = contract.inputs.find(({evidenceId}) => evidenceId === "full-frame-coverage");
  const coveragePath = path.join(root, coverageInput.path);
  const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
  const requirement = coverage.requirements.find(
    ({requirementId}) => requirementId === "req:sprite-231:linear-to-quiz-stop:en",
  );
  requirement.baselineAuthority = "original-runtime-natural-trace";
  const coverageText = `${JSON.stringify(coverage, null, 2)}\n`;
  await writeFile(coveragePath, coverageText);
  coverageInput.sha256 = sha256(coverageText);

  await assert.rejects(
    buildVb004SourceBranchCandidates({
      root,
      generatorPath,
      contract,
      hostActionScript: injectedHostActionScript(artifact),
    }),
    /current-JavaScript capture was promoted beyond its acceptance-neutral boundary/,
  );
});

test("ActionScript normalization and excerpt hashing are exact and token-bound", () => {
  const raw = Buffer.from("one\r\ntwo needle\r\nthree\r\n", "utf8");
  assert.equal(normalizeActionScript(raw), "one\ntwo needle\nthree\n");
  const definition = {
    role: "fixture-excerpt",
    relativePath: "fixture.as",
    lineStart: 2,
    lineEnd: 2,
    rawSha256: sha256(raw),
    normalizedSha256: sha256("two needle\n"),
    mustContain: ["needle"],
  };
  const excerpt = buildActionScriptExcerpt({raw}, definition);
  assert.equal(excerpt.text, "two needle\n");
  assert.equal(excerpt.exact, true);
  assert.deepEqual(excerpt.missingTokens, []);

  assert.throws(
    () => buildActionScriptExcerpt({raw}, {...definition, mustContain: ["missing-token"]}),
    /missing required tokens: missing-token/,
  );
});

test("argument parser exposes generation/check controls and no acceptance mutation option", () => {
  const rootFixture = "/tmp/help-math-vb004-source-branch-parser";
  assert.deepEqual(parseArguments([], {projectRoot: rootFixture}), {
    check: false,
    ffdec: "ffdec",
    root: rootFixture,
  });
  const explicit = parseArguments(["--check", "--ffdec", "/opt/ffdec", "--root", "/tmp/project"], {projectRoot: rootFixture});
  assert.deepEqual(explicit, {
    check: true,
    ffdec: "/opt/ffdec",
    root: "/tmp/project",
  });
  assert.equal(parseArguments(["--help"], {projectRoot: rootFixture}).help, true);
  assert.throws(() => parseArguments(["--approve"], {projectRoot: rootFixture}), /Unknown option: --approve/);
  assert.throws(() => parseArguments(["--owner-acceptance", "yes"], {projectRoot: rootFixture}), /Unknown option: --owner-acceptance/);
  assert.throws(() => parseArguments(["--ffdec"], {projectRoot: rootFixture}), /--ffdec requires a value/);
  assert.throws(() => parseArguments(["--root"], {projectRoot: rootFixture}), /--root requires a value/);
});
