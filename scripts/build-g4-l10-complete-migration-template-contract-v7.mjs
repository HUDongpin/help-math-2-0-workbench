#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  assertSnapshotUnchanged as assertV6SnapshotUnchanged,
  deriveContract as deriveV6Contract,
  readSnapshot as readV6Snapshot,
  renderMarkdown as renderV6Markdown,
  validateContract as validateV6Contract,
} from "./build-g4-l10-complete-migration-template-contract-v6.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v7-2026-08-07.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v7-2026-08-07.md";
export const TEST_RELATIVE =
  "scripts/build-g4-l10-complete-migration-template-contract-v7.test.mjs";

const EXACT_INPUTS = Object.freeze({
  predecessorV6Json: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v6-2026-08-06.json",
    bytes: 237667,
    sha256: "4bc3884451303da1342763ec65095bb13b3d67f2ba28bfbfda739c58485f9e51",
    mode: "0644",
  }),
  predecessorV6Markdown: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v6-2026-08-06.md",
    bytes: 1869,
    sha256: "d71bb8488bc48b72c8afd8a66ef8a2e9b516a62059bc1d6c60170204254c61d6",
    mode: "0644",
  }),
  latestSecurityBatchFailure: Object.freeze({
    path: "reports/g4-l10-native-helper-v2-14-independent-review-batch-4d05187e-failed-v1.json",
    bytes: 9999,
    sha256: "de1bfbf4323a44360932851772bf35db09f8bc3e4310f65eac28b976aa002ea2",
    mode: "0444",
  }),
  vb003GraphReviewInputJson: Object.freeze({
    path: "reports/g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1-review-input.json",
    bytes: 58689,
    sha256: "05526e6100a731cf0ceaf03703da6a813202809e4219dc85f3d01bc34b116189",
    mode: "0444",
  }),
  vb003GraphReviewInputMarkdown: Object.freeze({
    path: "reports/g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1-review-input.md",
    bytes: 4920,
    sha256: "a2272a32f3dd600f1b834319978e40164dc0167335ce1a7478da034b67757657",
    mode: "0444",
  }),
});

const ACCEPTANCE_KEYS = Object.freeze([
  "sourcePromotion",
  "authoritativeOriginalRuntimeEvidence",
  "ruffleBaselineAuthority",
  "currentJavascriptBaselineAuthority",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "wholeLessonIntegration",
  "atomicLessonPublication",
  "wholeCourseIntegration",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function reportFingerprint(report) {
  const copy = structuredClone(report);
  delete copy.reportFingerprintSha256;
  return sha256(Buffer.from(canonicalJson(copy)));
}

function statIdentity(info) {
  return [
    info.dev,
    info.ino,
    info.mode,
    info.nlink,
    info.uid,
    info.gid,
    info.size,
    info.mtimeNs,
    info.ctimeNs,
  ].map(String).join(":");
}

function modeOf(info) {
  return Number(info.mode & 0o777n).toString(8).padStart(4, "0");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function readStable(root, key, relativePath, expected = null) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${relativePath} must be an ordinary file`);
  assert.equal(before.nlink, 1n, `${relativePath} link count changed`);
  assert.equal(await realpath(absolute), absolute,
    `${relativePath} resolves through a symlink`);
  const contents = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${relativePath} changed while read`);
  const record = {
    key,
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    mode: modeOf(after),
    statIdentity: statIdentity(after),
  };
  if (expected) {
    assert.equal(record.bytes, expected.bytes, `${relativePath} bytes changed`);
    assert.equal(record.sha256, expected.sha256,
      `${relativePath} SHA-256 changed`);
    assert.equal(record.mode, expected.mode, `${relativePath} mode changed`);
  }
  return {contents, record};
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

async function readSelfIdentity(root) {
  const scriptRelative = path.relative(root, SCRIPT_PATH).split(path.sep).join("/");
  const [script, test] = await Promise.all([
    readStable(root, "v7Builder", scriptRelative),
    readStable(root, "v7BuilderTest", TEST_RELATIVE),
  ]);
  return {script, test};
}

function validateLatestSecurityFailure(receipt) {
  assert.equal(receipt.status,
    "FAILED_TWO_TASK_SYSTEM_INCOMPLETE_ONE_P1_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY");
  assert.equal(receipt.batch.hmg4rb4,
    "4d05187e1306c9d1da49fd5ba9a0501f2fce4a8bd165e4cb4953ec5273c1efc4");
  assert.deepEqual(receipt.tasks.map((task) => task.taskId), [
    "019fd9a0-2bc0-72f1-a10c-d2af19e3f5ef",
    "019fd9a0-2e7c-7bc3-ac4a-e3de4293eae1",
    "019fd9a0-316e-7180-b20d-b9f30204b289",
  ]);
  assert.deepEqual(receipt.tasks.map((task) => [task.scope, task.P0, task.P1,
    task.P2]), [
    ["schema", "UNEVALUATED_NOT_ZERO", "UNEVALUATED_NOT_ZERO",
      "UNEVALUATED_NOT_ZERO"],
    ["adversarial", "UNEVALUATED_NOT_ZERO", "UNEVALUATED_NOT_ZERO",
      "UNEVALUATED_NOT_ZERO"],
    ["whole", 0, 1, 0],
  ]);
  assert.equal(receipt.batchResult.allThreeQualifyingIndependentReviews, false);
  assert.equal(receipt.batchResult.allThreeP0P1P2Zero, false);
  assert.equal(receipt.batchResult.specReviewQualified, false);
  assert.equal(receipt.batchResult.productionHelperImplementationEligible, false);
  assert.equal(receipt.batchResult.reusable, false);
  assert.ok(Object.values(receipt.authorityEffects).every((value) =>
    value === false));
}

function validateGraphReviewInput(reviewInput) {
  assert.equal(reviewInput.status,
    "REVIEW_INPUT_FROZEN_NO_REVIEW_TASK_NO_VERDICT_NO_RUNTIME_AUTHORITY");
  assert.equal(reviewInput.decision,
    "DO_NOT_TREAT_GRAPH_AS_INDEPENDENTLY_REVIEWED_DO_NOT_FORMALIZE_DO_NOT_LAUNCH");
  assert.equal(reviewInput.reviewUniverse.fileCount, 8);
  assert.equal(reviewInput.reviewUniverse.totalBytes, 322169);
  assert.equal(reviewInput.reviewUniverse.setSha256,
    "59fbb1441f3072641d09c92aa8d823b2294280ac3fc54217ab6b5d26dadefe76");
  assert.equal(reviewInput.chunkTransport.chunkCount, 111);
  assert.equal(reviewInput.chunkTransport.maximumObservedChunkBytes, 3072);
  assert.equal(reviewInput.chunkTransport.chunkSetSha256,
    "6d2b571b663b75ba6ad1cccdd7b4bac7b27a40d8565bb7893c1059a111b03882");
  assert.equal(reviewInput.reviewInputFingerprintSha256,
    "b02ae9700ad97ed96b69d9805347374be10cdf29c2ebb239549d0fac36430de5");
  assert.equal(reviewInput.reviewTasks.authorized, false);
  assert.equal(reviewInput.reviewTasks.created, false);
  assert.deepEqual(reviewInput.reviewTasks.taskIds, []);
  assert.equal(reviewInput.reviewTasks.verdictPresent, false);
  assert.equal(reviewInput.formalizationBoundary.traceSpecsCreated, 0);
  assert.equal(reviewInput.formalizationBoundary.captureKitsCreated, 0);
  assert.equal(reviewInput.formalizationBoundary.originalRuntimeSessionsCreated,
    0);
  assert.ok(Object.values(reviewInput.authorityEffects).every((value) =>
    value === false));
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const [v6Snapshot, exactRows, self] = await Promise.all([
    readV6Snapshot(root),
    Promise.all(Object.entries(EXACT_INPUTS).map(([key, expected]) =>
      readStable(root, key, expected.path, expected))),
    readSelfIdentity(root),
  ]);
  const records = Object.fromEntries(exactRows.map(({record}) =>
    [record.key, record]));
  const contents = Object.fromEntries(exactRows.map(({record, contents: bytes}) =>
    [record.key, bytes]));
  const v6Report = deriveV6Contract(v6Snapshot);
  validateV6Contract(v6Report);
  assert.equal(contents.predecessorV6Json.toString("utf8"),
    `${JSON.stringify(v6Report, null, 2)}\n`,
  "Checked-in v6 JSON differs from authoritative recomputation");
  assert.equal(contents.predecessorV6Markdown.toString("utf8"),
    renderV6Markdown(v6Report),
  "Checked-in v6 Markdown differs from authoritative recomputation");
  const latestSecurityFailure = JSON.parse(
    contents.latestSecurityBatchFailure.toString("utf8"));
  const graphReviewInput = JSON.parse(
    contents.vb003GraphReviewInputJson.toString("utf8"));
  validateLatestSecurityFailure(latestSecurityFailure);
  validateGraphReviewInput(graphReviewInput);
  return {
    projectRoot: root,
    v6Snapshot,
    v6Report,
    latestSecurityFailure,
    graphReviewInput,
    records,
    self,
  };
}

export async function assertBoundRecordsUnchanged(snapshot) {
  const records = [...Object.values(snapshot.records), snapshot.self.script.record,
    snapshot.self.test.record];
  for (const record of records) {
    const current = await readStable(snapshot.projectRoot, record.key, record.path,
      record);
    assert.equal(current.record.statIdentity, record.statIdentity,
      `${record.path} stat identity changed`);
  }
}

export async function assertSnapshotUnchanged(snapshot) {
  await assertV6SnapshotUnchanged(snapshot.v6Snapshot);
  await assertBoundRecordsUnchanged(snapshot);
}

export function deriveContract(snapshot) {
  validateV6Contract(snapshot.v6Report);
  validateLatestSecurityFailure(snapshot.latestSecurityFailure);
  validateGraphReviewInput(snapshot.graphReviewInput);
  const report = structuredClone(snapshot.v6Report);
  report.schemaVersion = 7;
  report.evidenceDate = "2026-08-07";
  report.status = "fail-closed-template-not-stable";
  report.templateStable = false;
  report.successorOf = binding(snapshot.records.predecessorV6Json);
  report.builder = {
    generator: binding(snapshot.self.script.record),
    test: binding(snapshot.self.test.record),
  };
  report.predecessorDisposition = {
    v6: {
      status:
        "preserved-authoritatively-recomputed-security-epoch-superseded-by-failed-4d05187e-batch",
      preserved: true,
      authoritativeRecomputationMatched: true,
      artifacts: {
        json: binding(snapshot.records.predecessorV6Json),
        markdown: binding(snapshot.records.predecessorV6Markdown),
      },
      finding:
        "V6 remains byte-current for its evidence epoch, but its next action predates the completed failed 4d05187e v2.14 review batch and the frozen VB003 graph review input.",
      acceptanceEffect: "none",
    },
    ...report.predecessorDisposition,
  };
  report.evidenceEpochClosure.rule =
    "V7 authoritatively recomputes and byte-matches v6, then binds the exact failed nonreusable 4d05187e v2.14 review batch and the exact no-verdict VB003 source-static graph review input. It creates no security qualification, formal trace, runtime, specification adoption, renderer, acceptance, integration, release, or publication evidence.";
  report.latestSecurityReviewBoundary = {
    receipt: binding(snapshot.records.latestSecurityBatchFailure),
    hmg4rb4: snapshot.latestSecurityFailure.batch.hmg4rb4,
    status: snapshot.latestSecurityFailure.status,
    taskIds: snapshot.latestSecurityFailure.tasks.map((task) => task.taskId),
    scopeOrder: snapshot.latestSecurityFailure.batch.scopeOrder,
    allThreeQualifyingIndependentReviews: false,
    allThreeP0P1P2Zero: false,
    specReviewQualified: false,
    productionHelperImplementationEligible: false,
    reusable: false,
    wholeP0P1P2: [0, 1, 0],
    wholeFindingIds: snapshot.latestSecurityFailure.tasks[2].findings.map(
      (finding) => finding.id),
    disposition:
      "failed-final-nonreusable-no-production-helper-or-original-runtime-authority",
  };
  report.vb003SourceStaticGraphReviewBoundary = {
    json: binding(snapshot.records.vb003GraphReviewInputJson),
    markdown: binding(snapshot.records.vb003GraphReviewInputMarkdown),
    status: snapshot.graphReviewInput.status,
    decision: snapshot.graphReviewInput.decision,
    reviewInputFingerprintSha256:
      snapshot.graphReviewInput.reviewInputFingerprintSha256,
    reviewUniverse: {
      fileCount: snapshot.graphReviewInput.reviewUniverse.fileCount,
      totalBytes: snapshot.graphReviewInput.reviewUniverse.totalBytes,
      setSha256: snapshot.graphReviewInput.reviewUniverse.setSha256,
    },
    chunkTransport: {
      chunkCount: snapshot.graphReviewInput.chunkTransport.chunkCount,
      maximumObservedChunkBytes:
        snapshot.graphReviewInput.chunkTransport.maximumObservedChunkBytes,
      chunkSetSha256: snapshot.graphReviewInput.chunkTransport.chunkSetSha256,
    },
    exactGraphSets: structuredClone(snapshot.graphReviewInput.graphBinding.exactSets),
    reviewTaskAuthorized: false,
    reviewTaskCreated: false,
    reviewVerdictPresent: false,
    graphIsFormalTraceSpecification: false,
    sourceStaticEdgesEstablishRuntimeCausality: false,
    formalTraceSpecsCreated: 0,
    captureKitsCreated: 0,
    originalRuntimeSessionsCreated: 0,
    authorityEffect: "none",
  };
  const runtimeGate = report.gates.find(({id}) =>
    id === "original-runtime-baseline");
  assert.ok(runtimeGate, "V6 original-runtime gate is missing");
  runtimeGate.status = "BLOCKED-LATEST-V214-REVIEW-BATCH-FAILED";
  runtimeGate.satisfied = false;
  runtimeGate.current = {
    ...runtimeGate.current,
    latestReviewBatchHmg4rb4:
      snapshot.latestSecurityFailure.batch.hmg4rb4,
    latestReviewBatchStatus: snapshot.latestSecurityFailure.status,
    latestReviewBatchReusable: false,
    validV214ReviewBatch: false,
    allThreeP0P1P2Zero: false,
    graphReviewVerdictPresent: false,
    productionHelperIndependentlyApproved: false,
    freshCheckedLaunchReceiptForCurrentStart: false,
  };
  runtimeGate.blocker =
    "The fresh v2.14 batch completed as failed and nonreusable: schema and adversarial have no qualifying final outputs, while whole reports P0/P1/P2 0/1/0. The VB003 source-static graph is only a frozen review input with no reviewer task or verdict. Production helper, operator activation, disposable-offline start, per-start launch receipt, and original-runtime authority remain closed.";
  report.nextNamedHumanAction = {
    role: "Project owner / Peter Hu",
    conditionallyDesignated: true,
    currentlyAuthorized: false,
    operatorActivated: false,
    failedBatchReusable: false,
    graphReviewTaskAuthorized: false,
    requiresFreshCheckedLaunchReceiptForEveryStart: true,
    action:
      "Do not reuse the 4d05187e tasks or HMG4RB4. The next security-contract repair requires a separately authorized no-clobber successor that resolves the recorded P1, followed by a new independently qualifying review path and any required post-review authorization. The VB003 graph review input likewise requires separate explicit task authorization before review; neither path currently permits a runtime start.",
    reason:
      "A failed security review and an unreviewed source-static graph cannot create helper, formal trace, runtime, baseline, audio, or acceptance authority.",
    cannotBeAutomated: true,
  };
  const design = report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign;
  design.status =
    "exact-v2.14-contract-reviewed-batch-failed-nonreusable-no-implementation-or-runtime-authority";
  design.freshUserOwnedReviewBatchAuthorized = true;
  design.latestBatchAttempted = true;
  design.latestBatchHmg4rb4 = snapshot.latestSecurityFailure.batch.hmg4rb4;
  design.latestBatchReusable = false;
  design.specReviewQualified = false;
  design.productionHelperImplementationEligible = false;
  design.authenticatedPostReviewAuthorizationPresent = false;
  design.implementationSourceBound = false;
  design.helperBinaryBound = false;
  design.protectedInstallReceiptBound = false;
  design.originalRuntimeAuthority = false;
  design.rule =
    "The exact v2.14 review attempt is preserved as failed and nonreusable. It cannot be repaired in place, substituted by the whole-only output, or used to authorize a production helper or runtime. A separately authorized successor and fresh qualifying reviews are required.";
  report.automationBoundary.status =
    "HALT-BEFORE-SECURITY-SUCCESSOR-REVIEW-GRAPH-REVIEW-ORIGINAL-RUNTIME-AND-TRANSACTION";
  report.automationBoundary.templateBatchAdmissionAllowed = false;
  report.automationBoundary.remainingGrade4LessonBatchStartAllowed = false;
  report.automationBoundary.wholeCourseIntegrationAllowed = false;
  report.automationBoundary.safeReadOnlyActions = [
    ...new Set([
      ...report.automationBoundary.safeReadOnlyActions,
      "re-run the v6 authoritative recomputation and this v7 successor with --check",
      "continue acceptance-neutral L10 source-static audit work outside the prohibited transaction",
      "preserve the VB003 graph review input without creating reviewer tasks",
    ]),
  ];
  report.automationBoundary.prohibitedActions = [
    ...new Set([
      ...report.automationBoundary.prohibitedActions,
      "reuse any 4d05187e task ID or HMG4RB4",
      "treat the whole-only P0/P1/P2 0/1/0 output as a qualifying three-scope review",
      "implement or test a production helper from the failed v2.14 batch",
      "treat the VB003 graph review input as a review verdict or formal natural trace",
    ]),
  ];
  report.acceptanceEffects = Object.fromEntries(ACCEPTANCE_KEYS.map((key) =>
    [key, false]));
  report.inputBindings = {
    ...report.inputBindings,
    latestSecurityBatchFailure:
      binding(snapshot.records.latestSecurityBatchFailure),
    predecessorV6Json: binding(snapshot.records.predecessorV6Json),
    predecessorV6Markdown: binding(snapshot.records.predecessorV6Markdown),
    vb003GraphReviewInputJson:
      binding(snapshot.records.vb003GraphReviewInputJson),
    vb003GraphReviewInputMarkdown:
      binding(snapshot.records.vb003GraphReviewInputMarkdown),
  };
  report.inputBindings = Object.fromEntries(Object.entries(report.inputBindings)
    .sort(([left], [right]) => left.localeCompare(right)));
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 7);
  assert.equal(report.evidenceDate, "2026-08-07");
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.successorOf.sha256,
    EXACT_INPUTS.predecessorV6Json.sha256);
  assert.equal(report.predecessorDisposition.v6.preserved, true);
  assert.equal(report.predecessorDisposition.v6.authoritativeRecomputationMatched,
    true);
  assert.equal(report.scope.memberCount, 47);
  assert.equal(report.scope.activePageCount, 46);
  assert.equal(report.scope.shellCount, 1);
  assert.equal(report.currentFormalState.sourceCustody.present, 47);
  assert.equal(report.currentFormalState.requirements.total, 520);
  assert.equal(report.currentFormalState.requirements.rootReady, 94);
  assert.equal(report.currentFormalState.requirements.unresolvedNested, 426);
  assert.equal(report.currentFormalState.requirements.naturalScheduleReady, 0);
  assert.equal(report.currentFormalState.requirements.unresolvedFrameDomainDispositions,
    74);
  assert.equal(report.currentFormalState.originalRuntime.runtimeSessions, 0);
  assert.equal(report.currentFormalState.frameObligations.authoritativeCaptured, 0);
  assert.equal(report.currentFormalState.javascript.registeredFormalRendererCount,
    0);
  assert.equal(report.currentFormalState.reviewAndRelease.strictCompleteMembers, 0);
  assert.equal(report.currentFormalState.reviewAndRelease.published, false);
  assert.equal(report.latestSecurityReviewBoundary.receipt.sha256,
    EXACT_INPUTS.latestSecurityBatchFailure.sha256);
  assert.equal(report.latestSecurityReviewBoundary.hmg4rb4,
    "4d05187e1306c9d1da49fd5ba9a0501f2fce4a8bd165e4cb4953ec5273c1efc4");
  assert.equal(report.latestSecurityReviewBoundary.specReviewQualified, false);
  assert.equal(
    report.latestSecurityReviewBoundary.productionHelperImplementationEligible,
    false);
  assert.equal(report.latestSecurityReviewBoundary.reusable, false);
  assert.deepEqual(report.latestSecurityReviewBoundary.wholeP0P1P2, [0, 1, 0]);
  assert.deepEqual(report.latestSecurityReviewBoundary.wholeFindingIds, [
    "V214-V212-SECTION6-REINTRODUCTION-AND-GATE-SUBSTITUTION-UNDEFINED",
  ]);
  assert.equal(report.vb003SourceStaticGraphReviewBoundary.json.sha256,
    EXACT_INPUTS.vb003GraphReviewInputJson.sha256);
  assert.equal(report.vb003SourceStaticGraphReviewBoundary.markdown.sha256,
    EXACT_INPUTS.vb003GraphReviewInputMarkdown.sha256);
  assert.equal(report.vb003SourceStaticGraphReviewBoundary.reviewTaskAuthorized,
    false);
  assert.equal(report.vb003SourceStaticGraphReviewBoundary.reviewTaskCreated,
    false);
  assert.equal(report.vb003SourceStaticGraphReviewBoundary.reviewVerdictPresent,
    false);
  assert.equal(
    report.vb003SourceStaticGraphReviewBoundary.graphIsFormalTraceSpecification,
    false);
  assert.equal(report.vb003SourceStaticGraphReviewBoundary.formalTraceSpecsCreated,
    0);
  assert.equal(report.vb003SourceStaticGraphReviewBoundary.captureKitsCreated, 0);
  const runtimeGate = report.gates.find(({id}) =>
    id === "original-runtime-baseline");
  assert.equal(runtimeGate.status, "BLOCKED-LATEST-V214-REVIEW-BATCH-FAILED");
  assert.equal(runtimeGate.satisfied, false);
  assert.equal(runtimeGate.current.validV214ReviewBatch, false);
  assert.equal(runtimeGate.current.latestReviewBatchReusable, false);
  assert.equal(runtimeGate.current.graphReviewVerdictPresent, false);
  assert.equal(report.gates.filter(({satisfied}) => satisfied).length, 1);
  assert.ok(report.gates.every(({acceptanceEffect}) =>
    acceptanceEffect === "none"));
  assert.equal(report.nextNamedHumanAction.currentlyAuthorized, false);
  assert.equal(report.nextNamedHumanAction.operatorActivated, false);
  assert.equal(report.nextNamedHumanAction.failedBatchReusable, false);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
  assert.equal(
    report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.specReviewQualified,
    false);
  assert.equal(
    report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.productionHelperImplementationEligible,
    false);
  assert.equal(
    report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.originalRuntimeAuthority,
    false);
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(report.automationBoundary.remainingGrade4LessonBatchStartAllowed,
    false);
  assert.equal(report.automationBoundary.wholeCourseIntegrationAllowed, false);
  assert.deepEqual(Object.keys(report.acceptanceEffects), ACCEPTANCE_KEYS);
  assert.ok(Object.values(report.acceptanceEffects).every((value) =>
    value === false));
  assert.equal(Object.keys(report.inputBindings).length, 391);
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return true;
}

export function renderMarkdown(report) {
  const security = report.latestSecurityReviewBoundary;
  const graph = report.vb003SourceStaticGraphReviewBoundary;
  const state = report.currentFormalState;
  return `# Grade 4 Lesson 10 complete-migration template contract v7\n\n` +
    `Evidence date: **${report.evidenceDate}**  \n` +
    `Status: **${report.status}**  \n` +
    `Template stable: **${report.templateStable}**  \n` +
    `Fingerprint: \`${report.reportFingerprintSha256}\`\n\n` +
    `## Outcome\n\n` +
    `V7 authoritatively recomputes and byte-matches v6, then advances the evidence epoch through two exact append-only bindings. The latest v2.14 security batch is failed and nonreusable, and the VB003 source-static graph remains an unreviewed input. The decision is **DO NOT IMPLEMENT / DO NOT FORMALIZE / DO NOT LAUNCH / DO NOT APPLY**.\n\n` +
    `## Latest security boundary\n\n` +
    `- HMG4RB4: \`${security.hmg4rb4}\`.\n` +
    `- Status: \`${security.status}\`.\n` +
    `- Whole P0/P1/P2: **${security.wholeP0P1P2.join("/")}**.\n` +
    `- All three qualifying reviews: **${security.allThreeQualifyingIndependentReviews}**.\n` +
    `- Specification-review qualified: **${security.specReviewQualified}**.\n` +
    `- Production-helper implementation eligible: **${security.productionHelperImplementationEligible}**.\n` +
    `- Reusable: **${security.reusable}**.\n\n` +
    `## VB003 graph-review boundary\n\n` +
    `- Review-input fingerprint: \`${graph.reviewInputFingerprintSha256}\`.\n` +
    `- Exact inputs: **${graph.reviewUniverse.fileCount} files / ${graph.reviewUniverse.totalBytes} bytes**.\n` +
    `- Chunks: **${graph.chunkTransport.chunkCount}**, maximum **${graph.chunkTransport.maximumObservedChunkBytes} bytes**.\n` +
    `- Reviewer task authorized: **${graph.reviewTaskAuthorized}**.\n` +
    `- Review verdict present: **${graph.reviewVerdictPresent}**.\n` +
    `- Formal trace specs created: **${graph.formalTraceSpecsCreated}**.\n` +
    `- Original-runtime sessions created: **${graph.originalRuntimeSessionsCreated}**.\n\n` +
    `## Retained whole-lesson denominator\n\n` +
    `- Members: **${report.scope.memberCount}** (${report.scope.activePageCount} pages plus ${report.scope.shellCount} shell).\n` +
    `- Root-ready requirements: **${state.requirements.rootReady} / ${state.requirements.total}**.\n` +
    `- Unresolved nested requirements: **${state.requirements.unresolvedNested}**.\n` +
    `- Unresolved frame-domain dispositions: **${state.requirements.unresolvedFrameDomainDispositions}**.\n` +
    `- Authoritative original-runtime frames: **${state.frameObligations.authoritativeCaptured} / ${state.frameObligations.total}**.\n` +
    `- Registered formal renderers: **${state.javascript.registeredFormalRendererCount} / 47**.\n` +
    `- Strict-complete members: **${state.reviewAndRelease.strictCompleteMembers} / 47**.\n` +
    `- Published: **${state.reviewAndRelease.published}**.\n\n` +
    `Every helper, runtime, specification, renderer, audio, human, owner, strict-completion, integration, release, and publication effect remains false.\n`;
}

async function outputState(outputRoot, relativePath) {
  const absolute = resolveInside(outputRoot, relativePath);
  await assertOrdinaryAncestors(outputRoot, path.dirname(absolute));
  try {
    return {absolute, info: await lstat(absolute)};
  } catch (error) {
    if (error?.code === "ENOENT") return {absolute, info: null};
    throw error;
  }
}

export async function buildBundle(projectRoot = PROJECT_ROOT) {
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveContract(snapshot);
  return {
    snapshot,
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

export async function checkContract(bundle, outputRoot = bundle.snapshot.projectRoot,
  options = {}) {
  const root = await canonicalRoot(outputRoot);
  for (const [relativePath, expected] of [
    [REPORT_JSON, bundle.json],
    [REPORT_MARKDOWN, bundle.markdown],
  ]) {
    await readStable(root, "generated-v7-contract", relativePath, {
      bytes: Buffer.byteLength(expected),
      sha256: sha256(Buffer.from(expected)),
      mode: "0444",
    });
  }
  if (options.skipInputCheck !== true) {
    await assertSnapshotUnchanged(bundle.snapshot);
  }
  return {
    disposition: "checked",
    status: bundle.report.status,
    templateStable: false,
    json: REPORT_JSON,
    markdown: REPORT_MARKDOWN,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    specReviewQualified: false,
    graphReviewVerdictPresent: false,
    productionHelperImplementationEligible: false,
    originalRuntimeAuthorized: false,
    acceptanceEffect: false,
  };
}

export async function publishNoClobber(bundle, options = {}) {
  const outputRoot = await canonicalRoot(
    options.outputRoot ?? bundle.snapshot.projectRoot);
  const jsonState = await outputState(outputRoot, REPORT_JSON);
  const markdownState = await outputState(outputRoot, REPORT_MARKDOWN);
  assert.equal(jsonState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_JSON}`);
  assert.equal(markdownState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_MARKDOWN}`);
  await assertBoundRecordsUnchanged(bundle.snapshot);
  await writeFile(jsonState.absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(jsonState.absolute, 0o444);
  await (options.beforeMarkdown ?? (async () => {}))();
  await assertBoundRecordsUnchanged(bundle.snapshot);
  await writeFile(markdownState.absolute, bundle.markdown,
    {flag: "wx", mode: 0o600});
  await chmod(markdownState.absolute, 0o444);
  await assertSnapshotUnchanged(bundle.snapshot);
  return checkContract(bundle, outputRoot, {skipInputCheck: true});
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(args[0]),
    "Expected --dry-run, --write-no-clobber, or --check");
  return args[0];
}

export async function runCli(args = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const bundle = await buildBundle(projectRoot);
  if (mode === "--write-no-clobber") return publishNoClobber(bundle);
  if (mode === "--check") return checkContract(bundle);
  return {
    disposition: "dry-run",
    status: bundle.report.status,
    templateStable: false,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    specReviewQualified: false,
    graphReviewVerdictPresent: false,
    productionHelperImplementationEligible: false,
    originalRuntimeAuthorized: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
