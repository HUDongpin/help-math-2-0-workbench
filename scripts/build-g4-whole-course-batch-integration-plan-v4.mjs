#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  runCli as runV3Check,
  serializePlan as serializeV3Plan,
  validatePlan as validateV3Plan,
} from "./build-g4-whole-course-batch-integration-plan-v3.mjs";
import {
  renderMarkdown as renderV6Markdown,
  runCli as runV6Check,
  validateContract as validateV6Contract,
} from "./build-g4-l10-complete-migration-template-contract-v6.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const OUTPUT_PATH =
  "catalog/batches/g4-whole-course-batch-integration-plan-v4.json";

const EXACT_INPUTS = Object.freeze({
  predecessorV3Json: Object.freeze({
    path: "catalog/batches/g4-whole-course-batch-integration-plan-v3.json",
    bytes: 46_763,
    sha256: "c57656ec8de2e86014a2f74f8ed0549b4f532db850de1e0d696850d1d09748e2",
    mode: "0644",
  }),
  l10V6Generator: Object.freeze({
    path: "scripts/build-g4-l10-complete-migration-template-contract-v6.mjs",
    bytes: 23_726,
    sha256: "f5684dab144cdba3bc755f2ce24c36c17bba5818965e2f7d014543a2832450dc",
    mode: "0644",
  }),
  l10V6Tests: Object.freeze({
    path: "scripts/build-g4-l10-complete-migration-template-contract-v6.test.mjs",
    bytes: 5_409,
    sha256: "59196d0712e5fb0ea40791c7cd6277a6a957db08120079e98f2356d419f6d224",
    mode: "0644",
  }),
  l10V6Json: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v6-2026-08-06.json",
    bytes: 237_667,
    sha256: "4bc3884451303da1342763ec65095bb13b3d67f2ba28bfbfda739c58485f9e51",
    mode: "0644",
  }),
  l10V6Markdown: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v6-2026-08-06.md",
    bytes: 1_869,
    sha256: "d71bb8488bc48b72c8afd8a66ef8a2e9b516a62059bc1d6c60170204254c61d6",
    mode: "0644",
  }),
});

const ACCEPTANCE_KEYS = Object.freeze([
  "waveAdmission",
  "batchExecution",
  "sourcePromotion",
  "runtimeDependencyClosure",
  "rendererAcceptance",
  "originalRuntimeAcceptance",
  "behaviorAcceptance",
  "accessibilityAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "localizationAcceptance",
  "keyTermAcceptance",
  "quizAcceptance",
  "humanAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "atomicLessonPublication",
  "wholeCourseIntegration",
  "wholeCoursePublication",
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

function planFingerprint(plan) {
  const copy = structuredClone(plan);
  delete copy.planFingerprintSha256;
  return sha256(Buffer.from(canonicalJson(copy)));
}

function modeOf(stat) {
  return (stat.mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(stat) {
  return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs, stat.nlink]
    .map(String).join(":");
}

async function readExact(projectRoot, key, expected) {
  const absolute = path.join(projectRoot, expected.path);
  const before = await lstat(absolute, {bigint: true});
  assert.equal(before.isFile() && !before.isSymbolicLink(), true,
    `${expected.path} is not an ordinary file`);
  assert.equal(before.nlink, 1n, `${expected.path} link count changed`);
  const contents = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${expected.path} changed while read`);
  const record = {
    key,
    path: expected.path,
    bytes: contents.length,
    sha256: sha256(contents),
    mode: modeOf(after),
    statIdentity: statIdentity(after),
  };
  assert.equal(record.bytes, expected.bytes, `${expected.path} bytes changed`);
  assert.equal(record.sha256, expected.sha256, `${expected.path} SHA-256 changed`);
  assert.equal(record.mode, expected.mode, `${expected.path} mode changed`);
  return {record, contents};
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

async function assertRecordUnchanged(projectRoot, record) {
  const current = await readExact(projectRoot, record.key, record);
  assert.equal(current.record.statIdentity, record.statIdentity,
    `${record.path} stat identity changed`);
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = path.resolve(projectRoot);
  const [v3Result, v6Result, exactItems] = await Promise.all([
    runV3Check(["--check"], root),
    runV6Check(["--check"], root),
    Promise.all(Object.entries(EXACT_INPUTS).map(([key, expected]) =>
      readExact(root, key, expected))),
  ]);
  validateV3Plan(v3Result.plan);
  validateV6Contract(v6Result.report);
  const records = Object.fromEntries(exactItems.map(({record}) => [record.key, record]));
  const v3Contents = exactItems.find(({record}) =>
    record.key === "predecessorV3Json").contents.toString("utf8");
  assert.equal(v3Contents, serializeV3Plan(v3Result.plan),
    "Checked-in whole-course v3 differs from authoritative recomputation");
  const v6JsonContents = exactItems.find(({record}) =>
    record.key === "l10V6Json").contents.toString("utf8");
  const v6MarkdownContents = exactItems.find(({record}) =>
    record.key === "l10V6Markdown").contents.toString("utf8");
  assert.equal(v6JsonContents, `${JSON.stringify(v6Result.report, null, 2)}\n`,
    "Checked-in L10 v6 JSON differs from authoritative recomputation");
  assert.equal(v6MarkdownContents, renderV6Markdown(v6Result.report),
    "Checked-in L10 v6 Markdown differs from authoritative recomputation");
  return {
    projectRoot: root,
    v3Plan: v3Result.plan,
    v6Report: v6Result.report,
    records,
  };
}

export async function assertSnapshotUnchanged(snapshot) {
  await Promise.all(Object.values(snapshot.records).map((record) =>
    assertRecordUnchanged(snapshot.projectRoot, record)));
}

export function derivePlan(snapshot) {
  validateV3Plan(snapshot.v3Plan);
  validateV6Contract(snapshot.v6Report);
  const plan = structuredClone(snapshot.v3Plan);
  plan.schemaVersion = 4;
  plan.planDate = "2026-08-06";
  plan.status = "planned-not-admitted-not-executable";
  plan.planOnly = true;
  plan.executable = false;
  plan.executorPresent = false;
  plan.waveAdmissionCount = 0;
  plan.successorOf = binding(snapshot.records.predecessorV3Json);
  plan.predecessorDisposition = {
    v3: {
      status: "preserved-current-but-l10-operator-semantics-superseded-by-v6",
      preserved: true,
      authoritativeRecomputationMatched: true,
      finding:
        "V3 remains byte-current for its exact v5 closure, but v5 described the named original-runtime operator as absent. L10 v6 preserves every closed gate while recording Peter Hu as conditionally designated and not activated.",
      artifact: binding(snapshot.records.predecessorV3Json),
      acceptanceEffect: "none",
    },
    ...plan.predecessorDisposition,
  };
  plan.template = {
    ...plan.template,
    contractVersion: 6,
    contract: binding(snapshot.records.l10V6Json),
    artifacts: {
      generator: binding(snapshot.records.l10V6Generator),
      tests: binding(snapshot.records.l10V6Tests),
      json: binding(snapshot.records.l10V6Json),
      markdown: binding(snapshot.records.l10V6Markdown),
    },
    templateStable: false,
    strictCompleteMembers: 0,
    requiredMembers: 47,
    published: false,
    batchAdmissionAllowed: false,
    downstreamTransactionDecision: "DO_NOT_APPLY",
    conditionallyDesignatedOperator: "Peter Hu",
    operatorDesignationRecorded: true,
    operatorActivated: false,
    operatorReady: false,
    exactOperatorScope: structuredClone(
      snapshot.v6Report.operatorGateSuccessor.exactScope),
    exactOperatorCaptureKitCount:
      snapshot.v6Report.operatorGateSuccessor.exactCaptureKits.length,
    authoritativeRuntimeSessions:
      snapshot.v6Report.currentFormalState.originalRuntime.runtimeSessions,
    authoritativeCapturedFrames:
      snapshot.v6Report.currentFormalState.frameObligations.authoritativeCaptured,
    rule:
      "L10 remains inside the 657-member denominator and outside all four waves. Exact v6 is current, Peter Hu is conditionally designated only for VB003 EN/ES and not activated, templateStable is false, strict completion is 0/47, publication is false, and downstream remains DO_NOT_APPLY.",
  };
  plan.optionalEvolvingHelperDesign = {
    candidatePath:
      snapshot.v6Report.operatorGateSuccessor.securityContractV214.path,
    candidateSha256:
      snapshot.v6Report.operatorGateSuccessor.securityContractV214.sha256,
    status: "exact-v2.14-bound-via-current-l10-v6-unreviewed-no-implementation-or-execution-authority",
    exactContractBound: true,
    freshUserOwnedReviewBatchAuthorized: false,
    designApproved: false,
    implementationSourceBound: false,
    helperBinaryBound: false,
    protectedInstallReceiptBound: false,
    executionAuthority: false,
    p0ClosureEffect: false,
    acceptanceEffect: "none",
  };
  plan.admissionDecision = {
    ...plan.admissionDecision,
    outcome: "ZERO-WAVES-ADMITTED",
    reasons: [
      "L10 v6 is authoritative-current but templateStable remains false, Peter Hu is conditionally designated but not activated, original-runtime sessions remain zero, L10 remains 0/47, and downstream remains DO_NOT_APPLY",
      "the exact missing-MP3 resolution plan retains 16 unknown expected SHA-256 identities, selects zero candidates, and leaves source dependency closure false",
      "Key Term review holds and Polynomial.swf remain unresolved",
      "10 Grade 4 lesson release definitions are absent",
      "strict completion is 0 and the whole-course trust adapter does not exist",
      "current publisher retains individual eligibility outside controlled scopes; the 0-or-12 future risk remains unclosed",
      "exact v2.14 is bound through L10 v6 but no fresh user-owned review batch, approval, implementation, helper binary, protected-install receipt, or execution authority exists",
    ],
    mayStartRendererBatch: false,
    mayIntegrateCourse: false,
    mayPublishAnyLessonFromWave: false,
  };
  plan.authorityBoundary = {
    ...plan.authorityBoundary,
    L10V6CurrentIsTemplateStable: false,
    conditionalOperatorDesignationIsActivation: false,
    helperContractExactBound: true,
    helperDesignApproved: false,
    planMayStartBatch: false,
    planMayMutateRegistryOrLedger: false,
    planMayExecuteOriginalRuntime: false,
    planMayIntegrateOrPublish: false,
  };
  delete plan.authorityBoundary.helperDesignIsBoundOrApproved;
  plan.atomicWholeCourseIntegration.integrationAllowed = false;
  plan.atomicWholeCourseIntegration.publicationAllowed = false;
  plan.atomicWholeCourseIntegration.currentPlatformEnforcesWholeCourseZeroOrTwelve =
    false;
  plan.atomicWholeCourseIntegration.currentPlatformRisk.futureRiskClosed = false;
  plan.acceptanceEffects = Object.fromEntries(
    ACCEPTANCE_KEYS.map((key) => [key, false]));
  plan.inputBindings = {
    ...plan.inputBindings,
    predecessorV3Json: binding(snapshot.records.predecessorV3Json),
    l10V6Generator: binding(snapshot.records.l10V6Generator),
    l10V6Tests: binding(snapshot.records.l10V6Tests),
    l10V6Json: binding(snapshot.records.l10V6Json),
    l10V6Markdown: binding(snapshot.records.l10V6Markdown),
  };
  plan.inputBindings = Object.fromEntries(Object.entries(plan.inputBindings)
    .sort(([left], [right]) => left.localeCompare(right)));
  delete plan.planFingerprintSha256;
  plan.planFingerprintSha256 = planFingerprint(plan);
  validatePlan(plan);
  return plan;
}

export function validatePlan(plan) {
  assert.equal(plan.schemaVersion, 4);
  assert.equal(plan.artifactType,
    "g4-whole-course-batch-and-atomic-integration-plan");
  assert.equal(plan.status, "planned-not-admitted-not-executable");
  assert.equal(plan.planOnly, true);
  assert.equal(plan.executable, false);
  assert.equal(plan.executorPresent, false);
  assert.equal(plan.waveAdmissionCount, 0);
  assert.equal(plan.successorOf.sha256, EXACT_INPUTS.predecessorV3Json.sha256);
  assert.equal(plan.predecessorDisposition.v3.preserved, true);
  assert.equal(plan.predecessorDisposition.v3.authoritativeRecomputationMatched,
    true);
  assert.equal(plan.template.contractVersion, 6);
  assert.equal(plan.template.contract.sha256, EXACT_INPUTS.l10V6Json.sha256);
  assert.equal(plan.template.artifacts.generator.sha256,
    EXACT_INPUTS.l10V6Generator.sha256);
  assert.equal(plan.template.artifacts.tests.sha256,
    EXACT_INPUTS.l10V6Tests.sha256);
  assert.equal(plan.template.artifacts.json.sha256,
    EXACT_INPUTS.l10V6Json.sha256);
  assert.equal(plan.template.artifacts.markdown.sha256,
    EXACT_INPUTS.l10V6Markdown.sha256);
  assert.equal(plan.template.templateStable, false);
  assert.equal(plan.template.strictCompleteMembers, 0);
  assert.equal(plan.template.requiredMembers, 47);
  assert.equal(plan.template.published, false);
  assert.equal(plan.template.batchAdmissionAllowed, false);
  assert.equal(plan.template.downstreamTransactionDecision, "DO_NOT_APPLY");
  assert.equal(plan.template.conditionallyDesignatedOperator, "Peter Hu");
  assert.equal(plan.template.operatorDesignationRecorded, true);
  assert.equal(plan.template.operatorActivated, false);
  assert.equal(plan.template.operatorReady, false);
  assert.equal(plan.template.exactOperatorScope.animationId,
    "course-g04-l10-vb-003");
  assert.deepEqual(plan.template.exactOperatorScope.languages, ["en", "es"]);
  assert.equal(plan.template.exactOperatorCaptureKitCount, 2);
  assert.equal(plan.template.authoritativeRuntimeSessions, 0);
  assert.equal(plan.template.authoritativeCapturedFrames, 0);
  assert.equal(plan.admissionDecision.outcome, "ZERO-WAVES-ADMITTED");
  assert.equal(plan.admissionDecision.mayStartRendererBatch, false);
  assert.equal(plan.admissionDecision.mayIntegrateCourse, false);
  assert.equal(plan.admissionDecision.mayPublishAnyLessonFromWave, false);
  assert.equal(plan.waveMembership.uniqueLessonCount, 11);
  assert.equal(plan.waveMembership.subtotal.members, 610);
  assert.equal(plan.waves.length, 4);
  assert.ok(plan.waves.every((wave) =>
    wave.admittedLessonCount === 0
      && wave.executable === false
      && wave.executorPresent === false
      && wave.acceptanceEffect === "none"));
  assert.equal(plan.blockers.audio.missing, 16);
  assert.equal(plan.blockers.audio.expectedSha256KnownForAllMissing, false);
  assert.equal(plan.blockers.audio.dependencyClosureComplete, false);
  assert.equal(plan.blockers.audio.resolutionPlan.expectedSha256KnownCount, 0);
  assert.equal(plan.blockers.audio.resolutionPlan.selectedCandidateCount, 0);
  assert.equal(plan.blockers.audio.resolutionPlan.promotionRecordCount, 0);
  assert.equal(plan.blockers.keyTerms.canonicalMissing, 317);
  assert.equal(plan.blockers.keyTerms.totalReviewHolds, 316);
  assert.equal(plan.blockers.keyTerms.residualUnresolvedRuntimePath,
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Polynomial.swf");
  assert.equal(plan.blockers.releaseDefinitions.missingCount, 10);
  assert.equal(plan.courseBaseline.strictCompleteMembers, 0);
  assert.equal(plan.courseBaseline.publishedLessonCount, 0);
  assert.equal(plan.atomicWholeCourseIntegration
    .currentPlatformEnforcesWholeCourseZeroOrTwelve, false);
  assert.equal(plan.atomicWholeCourseIntegration
    .wholeCourseTrustAdapterPresent, false);
  assert.equal(plan.atomicWholeCourseIntegration.currentPlatformRisk.futureRiskClosed,
    false);
  assert.equal(plan.atomicWholeCourseIntegration.integrationAllowed, false);
  assert.equal(plan.atomicWholeCourseIntegration.publicationAllowed, false);
  assert.equal(plan.optionalEvolvingHelperDesign.exactContractBound, true);
  assert.equal(plan.optionalEvolvingHelperDesign.freshUserOwnedReviewBatchAuthorized,
    false);
  assert.equal(plan.optionalEvolvingHelperDesign.designApproved, false);
  assert.equal(plan.optionalEvolvingHelperDesign.implementationSourceBound, false);
  assert.equal(plan.optionalEvolvingHelperDesign.helperBinaryBound, false);
  assert.equal(plan.optionalEvolvingHelperDesign.executionAuthority, false);
  assert.equal(plan.authorityBoundary.L10V6CurrentIsTemplateStable, false);
  assert.equal(plan.authorityBoundary.conditionalOperatorDesignationIsActivation,
    false);
  assert.equal(plan.authorityBoundary.helperContractExactBound, true);
  assert.equal(plan.authorityBoundary.helperDesignApproved, false);
  assert.equal(plan.authorityBoundary.planMayStartBatch, false);
  assert.equal(plan.authorityBoundary.planMayMutateRegistryOrLedger, false);
  assert.equal(plan.authorityBoundary.planMayExecuteOriginalRuntime, false);
  assert.equal(plan.authorityBoundary.planMayIntegrateOrPublish, false);
  assert.deepEqual(Object.keys(plan.acceptanceEffects), ACCEPTANCE_KEYS);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  assert.equal(Object.keys(plan.inputBindings).length, 36);
  assert.equal(plan.planFingerprintSha256, planFingerprint(plan));
  return true;
}

export function serializePlan(plan) {
  validatePlan(plan);
  return `${JSON.stringify(plan, null, 2)}\n`;
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1,
    "Usage: ... --write-no-clobber | --check");
  assert.ok(["--write-no-clobber", "--check"].includes(args[0]),
    "Expected --write-no-clobber or --check");
  return args[0];
}

async function readExisting(projectRoot) {
  try {
    return await readFile(path.join(projectRoot, OUTPUT_PATH), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function writeOrCheck({plan, projectRoot = PROJECT_ROOT, mode}) {
  const expected = serializePlan(plan);
  const current = await readExisting(projectRoot);
  if (mode === "--check") {
    assert.notEqual(current, null, `${OUTPUT_PATH} is missing`);
    assert.equal(current, expected,
      `${OUTPUT_PATH} is stale; preserve it and create a successor`);
    return "checked";
  }
  assert.equal(current, null,
    `${OUTPUT_PATH} exists; write-no-clobber refuses overwrite`);
  await writeFile(path.join(projectRoot, OUTPUT_PATH), expected,
    {flag: "wx", mode: 0o644});
  return "created";
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const snapshot = await readSnapshot(projectRoot);
  const plan = derivePlan(snapshot);
  await assertSnapshotUnchanged(snapshot);
  const disposition = await writeOrCheck({plan, projectRoot: snapshot.projectRoot, mode});
  await assertSnapshotUnchanged(snapshot);
  return {mode, disposition, plan};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then(({mode, disposition, plan}) => {
    process.stdout.write(`${JSON.stringify({
      action: mode === "--check" ? "checked" : "written-no-clobber",
      disposition,
      output: OUTPUT_PATH,
      status: plan.status,
      templateVersion: plan.template.contractVersion,
      templateStable: plan.template.templateStable,
      conditionallyDesignatedOperator: plan.template.conditionallyDesignatedOperator,
      operatorActivated: plan.template.operatorActivated,
      operatorReady: plan.template.operatorReady,
      runtimeSessions: plan.template.authoritativeRuntimeSessions,
      waveAdmissionCount: plan.waveAdmissionCount,
      executable: plan.executable,
      executorPresent: plan.executorPresent,
      wholeCourseIntegrationAllowed:
        plan.atomicWholeCourseIntegration.integrationAllowed,
      publicationAllowed:
        plan.atomicWholeCourseIntegration.publicationAllowed,
      acceptanceEffect: false,
    }, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
