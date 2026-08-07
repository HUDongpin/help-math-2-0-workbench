#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  assertSnapshotUnchanged as assertV5SnapshotUnchanged,
  deriveContract as deriveV5Contract,
  readSnapshot as readV5Snapshot,
  renderMarkdown as renderV5Markdown,
  validateContract as validateV5Contract,
  writeNoClobber,
} from "./build-g4-l10-complete-migration-template-contract-v5.mjs";
import {
  buildReport as buildOperatorGate,
  renderJson as renderOperatorGateJson,
  validateReport as validateOperatorGate,
} from "./build-g4-l10-vb003-conditional-operator-gate-v1.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const REPORT_JSON =
  "reports/g4-l10-complete-migration-template-contract-v6-2026-08-06.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-complete-migration-template-contract-v6-2026-08-06.md";

const EXACT_INPUTS = Object.freeze({
  predecessorV5Json: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v5-2026-08-04.json",
    bytes: 228_467,
    sha256: "b4777628d6433241c247c1e3c4236becadd3b4b66e03585f51a81babd5fbeef9",
    mode: "0644",
  }),
  predecessorV5Markdown: Object.freeze({
    path: "reports/g4-l10-complete-migration-template-contract-v5-2026-08-04.md",
    bytes: 63_074,
    sha256: "4acf3e17800365cbae4dbc2aca69f24a0baeb28fdb3fb9ffa552b8a6e51bf142",
    mode: "0644",
  }),
  conditionalOperatorGateV1: Object.freeze({
    path: "reports/g4-l10-vb003-conditional-operator-gate-v1.json",
    bytes: 7_079,
    sha256: "6024df8cec7ed47e9d200cd5b31cd3182408d01451292fc767b5f2b27f3b26f5",
    mode: "0600",
  }),
  securityContractV214: Object.freeze({
    path: "docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md",
    bytes: 50_310,
    sha256: "a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510",
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

function statIdentity(stat) {
  return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs, stat.nlink]
    .map(String).join(":");
}

function modeOf(stat) {
  return (stat.mode & 0o777n).toString(8).padStart(4, "0");
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

async function assertRecordUnchanged(projectRoot, record) {
  const reread = await readExact(projectRoot, record.key, record);
  assert.equal(reread.record.statIdentity, record.statIdentity,
    `${record.path} stat identity changed`);
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = path.resolve(projectRoot);
  const [v5Snapshot, exactRecords, operatorGate] = await Promise.all([
    readV5Snapshot(root),
    Promise.all(Object.entries(EXACT_INPUTS).map(([key, expected]) =>
      readExact(root, key, expected))),
    buildOperatorGate({projectRoot: root}),
  ]);
  const records = Object.fromEntries(exactRecords.map(({record}) => [record.key, record]));
  const v5Report = deriveV5Contract(v5Snapshot);
  validateV5Contract(v5Report);
  assert.equal(
    records.predecessorV5Json.contents,
    undefined,
    "Internal record unexpectedly retained contents",
  );
  const v5JsonContents = exactRecords.find(({record}) =>
    record.key === "predecessorV5Json").contents.toString("utf8");
  const v5MarkdownContents = exactRecords.find(({record}) =>
    record.key === "predecessorV5Markdown").contents.toString("utf8");
  assert.equal(v5JsonContents, `${JSON.stringify(v5Report, null, 2)}\n`,
    "Checked-in v5 JSON differs from authoritative recomputation");
  assert.equal(v5MarkdownContents, renderV5Markdown(v5Report),
    "Checked-in v5 Markdown differs from authoritative recomputation");
  validateOperatorGate(operatorGate);
  const operatorGateContents = exactRecords.find(({record}) =>
    record.key === "conditionalOperatorGateV1").contents.toString("utf8");
  assert.equal(operatorGateContents, renderOperatorGateJson(operatorGate),
    "Checked-in conditional-operator gate differs from authoritative recomputation");
  return {
    projectRoot: root,
    v5Snapshot,
    v5Report,
    operatorGate,
    records,
  };
}

export async function assertSnapshotUnchanged(snapshot) {
  await assertV5SnapshotUnchanged(snapshot.v5Snapshot);
  await Promise.all(Object.values(snapshot.records).map((record) =>
    assertRecordUnchanged(snapshot.projectRoot, record)));
  const operatorGate = await buildOperatorGate({projectRoot: snapshot.projectRoot});
  assert.deepEqual(operatorGate, snapshot.operatorGate,
    "Conditional-operator gate recomputation changed after snapshot");
}

export function deriveContract(snapshot) {
  validateV5Contract(snapshot.v5Report);
  validateOperatorGate(snapshot.operatorGate);
  const report = structuredClone(snapshot.v5Report);
  report.schemaVersion = 6;
  report.evidenceDate = "2026-08-06";
  report.status = "fail-closed-template-not-stable";
  report.templateStable = false;
  report.successorOf = binding(snapshot.records.predecessorV5Json);
  report.predecessorDisposition = {
    v5: {
      status: "preserved-current-authoritative-ledger-proven-but-operator-semantics-superseded",
      preserved: true,
      finding:
        "V5 correctly kept original runtime closed but described the named operator as absent. The user later conditionally designated Peter Hu for exact VB003 EN/ES kits; that designation is recorded without activation or launch authority.",
      authoritativeRecomputationMatched: true,
      artifacts: {
        json: binding(snapshot.records.predecessorV5Json),
        markdown: binding(snapshot.records.predecessorV5Markdown),
      },
      acceptanceEffect: "none",
    },
    ...report.predecessorDisposition,
  };
  report.evidenceEpochClosure.rule =
    "V6 authoritatively recomputes and byte-matches v5, recomputes the exact conditional-operator gate, and changes only operator designation semantics. It creates no runtime, baseline, renderer, acceptance, integration, release, or publication evidence.";
  report.currentFormalState.originalRuntime = {
    ...report.currentFormalState.originalRuntime,
    conditionallyDesignatedOperator: "Peter Hu",
    operatorDesignationRecorded: true,
    operatorActivated: false,
    operatorReady: false,
    exactAuthorizedMemberCountNow: 0,
  };
  const runtimeGate = report.gates.find(({id}) => id === "original-runtime-baseline");
  assert.ok(runtimeGate, "V5 original-runtime gate is missing");
  runtimeGate.status = "BLOCKED-CONDITIONAL-OPERATOR-NOT-ACTIVATED";
  runtimeGate.satisfied = false;
  runtimeGate.current = {
    ...runtimeGate.current,
    conditionallyDesignatedOperator: "Peter Hu",
    operatorActivated: false,
    operatorReady: false,
    validV214ReviewBatch: false,
    productionHelperIndependentlyApproved: false,
    disposableOfflineEnvironmentApproved: false,
    freshCheckedLaunchReceiptForCurrentStart: false,
  };
  runtimeGate.blocker =
    "Peter Hu is conditionally designated only for the exact VB003 EN/ES kits, but the v2.14 review/post-review authorization, V28, clean-room, helper implementation/review, disposable-offline environment, and fresh per-start checked launch receipt gates are all unsatisfied. Unsigned kits and Ruffle remain non-evidence.";
  report.operatorGateSuccessor = {
    status: snapshot.operatorGate.status,
    decision: snapshot.operatorGate.decision,
    report: binding(snapshot.records.conditionalOperatorGateV1),
    securityContractV214: binding(snapshot.records.securityContractV214),
    authoritativeRecomputationMatched: true,
    operator: structuredClone(snapshot.operatorGate.operator),
    exactScope: structuredClone(snapshot.operatorGate.scope),
    exactCaptureKits: structuredClone(snapshot.operatorGate.captureKits),
    currentSecurityGates: structuredClone(snapshot.operatorGate.gates.current),
    launchReceipt: structuredClone(snapshot.operatorGate.launchReceipt),
    acceptanceEffects: structuredClone(snapshot.operatorGate.acceptanceEffects),
    activationEligible: false,
    runtimeAuthority: false,
  };
  report.nextNamedHumanAction = {
    role: "Peter Hu, conditionally designated VB003 EN/ES original-runtime operator",
    conditionallyDesignated: true,
    currentlyAuthorized: false,
    operatorActivated: false,
    blockedByLegacyDownstreamTransactionP0: true,
    blockedByV214ReviewAndImplementationGates: true,
    requiresFreshCheckedLaunchReceiptForEveryStart: true,
    action:
      "First obtain a fresh authenticated user instruction for the exact v2.14 schema/adversarial/whole user-owned review tasks. Only after every v2.14, V28, clean-room, helper implementation/review, disposable-offline environment, and per-start launch-receipt gate is independently satisfied may Peter Hu execute the exact VB003 EN/ES kits.",
    reason:
      "A conditional named role resolves operator identity only; it does not create runtime authority, baseline evidence, listening evidence, or acceptance.",
    cannotBeAutomated: true,
  };
  report.downstreamTransactionBoundary.decision = "DO_NOT_APPLY";
  report.downstreamTransactionBoundary.applyAuthorized = false;
  report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign = {
    candidatePath: snapshot.records.securityContractV214.path,
    status: "exact-v2.14-contract-bound-unreviewed-no-implementation-or-runtime-authority",
    exactContractBound: true,
    exactContractSha256: snapshot.records.securityContractV214.sha256,
    freshUserOwnedReviewBatchAuthorized: false,
    specReviewQualified: false,
    authenticatedPostReviewAuthorizationPresent: false,
    implementationSourceBound: false,
    helperBinaryBound: false,
    protectedInstallReceiptBound: false,
    p0ClosureEffect: false,
    originalRuntimeAuthority: false,
    acceptanceEffect: "none",
    rule:
      "Binding exact v2.14 bytes records the current security contract only. It does not substitute for its three user-owned reviews, later authenticated authorization, V28, clean-room, implementation, independent implementation review, protected-install exclusions, or launch receipt.",
  };
  report.automationBoundary.status = "HALT-BEFORE-ORIGINAL-RUNTIME-AND-TRANSACTION";
  report.automationBoundary.templateBatchAdmissionAllowed = false;
  report.automationBoundary.remainingGrade4LessonBatchStartAllowed = false;
  report.automationBoundary.wholeCourseIntegrationAllowed = false;
  report.automationBoundary.safeReadOnlyActions = [
    ...new Set([
      ...report.automationBoundary.safeReadOnlyActions,
      "re-run the conditional-operator gate and this v6 successor with --check",
      "after a new authenticated exact-v2.14 instruction, create only the three user-owned schema/adversarial/whole review tasks",
    ]),
  ];
  report.automationBoundary.prohibitedActions = [
    ...new Set([
      ...report.automationBoundary.prohibitedActions,
      "treat Peter Hu's conditional designation as operator activation or launch authority",
      "reuse a launch receipt or create it after runtime start",
    ]),
  ];
  report.acceptanceEffects = Object.fromEntries(ACCEPTANCE_KEYS.map((key) => [key, false]));
  report.inputBindings = {
    ...report.inputBindings,
    conditionalOperatorGateV1: binding(snapshot.records.conditionalOperatorGateV1),
    predecessorV5Json: binding(snapshot.records.predecessorV5Json),
    predecessorV5Markdown: binding(snapshot.records.predecessorV5Markdown),
    securityContractV214: binding(snapshot.records.securityContractV214),
  };
  report.inputBindings = Object.fromEntries(Object.entries(report.inputBindings)
    .sort(([left], [right]) => left.localeCompare(right)));
  delete report.reportFingerprintSha256;
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateContract(report);
  return report;
}

export function validateContract(report) {
  assert.equal(report.schemaVersion, 6);
  assert.equal(report.status, "fail-closed-template-not-stable");
  assert.equal(report.templateStable, false);
  assert.equal(report.successorOf.sha256, EXACT_INPUTS.predecessorV5Json.sha256);
  assert.equal(report.predecessorDisposition.v5.preserved, true);
  assert.equal(report.predecessorDisposition.v5.authoritativeRecomputationMatched, true);
  assert.equal(report.operatorGateSuccessor.report.sha256,
    EXACT_INPUTS.conditionalOperatorGateV1.sha256);
  assert.equal(report.operatorGateSuccessor.securityContractV214.sha256,
    EXACT_INPUTS.securityContractV214.sha256);
  assert.equal(report.operatorGateSuccessor.authoritativeRecomputationMatched, true);
  assert.equal(report.operatorGateSuccessor.operator.name, "Peter Hu");
  assert.equal(report.operatorGateSuccessor.operator.designationRecorded, true);
  assert.equal(report.operatorGateSuccessor.operator.activated, false);
  assert.equal(report.operatorGateSuccessor.operator.operatorReady, false);
  assert.equal(report.operatorGateSuccessor.activationEligible, false);
  assert.equal(report.operatorGateSuccessor.runtimeAuthority, false);
  assert.deepEqual(report.operatorGateSuccessor.exactScope.languages, ["en", "es"]);
  assert.equal(report.operatorGateSuccessor.exactScope.animationId,
    "course-g04-l10-vb-003");
  assert.equal(report.operatorGateSuccessor.exactCaptureKits.length, 2);
  assert.ok(Object.values(report.operatorGateSuccessor.currentSecurityGates)
    .every((value) => value === false));
  assert.ok(Object.values(report.operatorGateSuccessor.acceptanceEffects)
    .every((value) => value === false));
  assert.equal(report.operatorGateSuccessor.launchReceipt.launchAuthorizedNow, false);
  assert.equal(report.operatorGateSuccessor.launchReceipt.freshReceiptRequiredForEveryStart,
    true);
  assert.equal(report.currentFormalState.originalRuntime.acceptedMembers, 0);
  assert.equal(report.currentFormalState.originalRuntime.runtimeSessions, 0);
  assert.equal(report.currentFormalState.originalRuntime.capturePngs, 0);
  assert.equal(report.currentFormalState.originalRuntime.conditionallyDesignatedOperator,
    "Peter Hu");
  assert.equal(report.currentFormalState.originalRuntime.operatorDesignationRecorded, true);
  assert.equal(report.currentFormalState.originalRuntime.operatorActivated, false);
  assert.equal(report.currentFormalState.originalRuntime.operatorReady, false);
  const runtimeGate = report.gates.find(({id}) => id === "original-runtime-baseline");
  assert.equal(runtimeGate.status, "BLOCKED-CONDITIONAL-OPERATOR-NOT-ACTIVATED");
  assert.equal(runtimeGate.satisfied, false);
  assert.equal(runtimeGate.current.conditionallyDesignatedOperator, "Peter Hu");
  assert.equal(runtimeGate.current.operatorActivated, false);
  assert.equal(runtimeGate.current.freshCheckedLaunchReceiptForCurrentStart, false);
  assert.equal(report.gates.filter(({satisfied}) => satisfied).length, 1);
  assert.ok(report.gates.every(({acceptanceEffect}) => acceptanceEffect === "none"));
  assert.equal(report.nextNamedHumanAction.conditionallyDesignated, true);
  assert.equal(report.nextNamedHumanAction.currentlyAuthorized, false);
  assert.equal(report.nextNamedHumanAction.operatorActivated, false);
  assert.equal(report.downstreamTransactionBoundary.decision, "DO_NOT_APPLY");
  assert.equal(report.downstreamTransactionBoundary.applyAuthorized, false);
  assert.equal(report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.exactContractBound,
    true);
  assert.equal(report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.specReviewQualified,
    false);
  assert.equal(report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.implementationSourceBound,
    false);
  assert.equal(report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.helperBinaryBound,
    false);
  assert.equal(report.downstreamTransactionBoundary.nativeHelperV2SecurityDesign.originalRuntimeAuthority,
    false);
  assert.equal(report.automationBoundary.templateBatchAdmissionAllowed, false);
  assert.equal(report.automationBoundary.remainingGrade4LessonBatchStartAllowed, false);
  assert.equal(report.automationBoundary.wholeCourseIntegrationAllowed, false);
  assert.deepEqual(Object.keys(report.acceptanceEffects), ACCEPTANCE_KEYS);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(Object.keys(report.inputBindings).length, 386);
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  return true;
}

export function renderMarkdown(report) {
  const runtime = report.currentFormalState.originalRuntime;
  const gate = report.operatorGateSuccessor;
  return `# Grade 4 Lesson 10 complete-migration template contract v6\n\nEvidence date: **${report.evidenceDate}**  \nStatus: **${report.status}**  \nTemplate stable: **${report.templateStable}**  \nFingerprint: \`${report.reportFingerprintSha256}\`\n\n## Outcome\n\nV6 preserves and authoritatively recomputes v5, then binds one append-only conditional-operator successor. Peter Hu is recorded as the named operator only for the exact VB003 EN/ES root kits. He is **not activated**, the kits are **not runtime evidence**, and the decision remains **DO_NOT_LAUNCH / DO_NOT_APPLY**.\n\n## Exact successor bindings\n\n| Artifact | Bytes | SHA-256 | Mode |\n|---|---:|---|---:|\n| V5 JSON | ${report.successorOf.bytes} | \`${report.successorOf.sha256}\` | \`${report.successorOf.mode}\` |\n| Conditional-operator gate | ${gate.report.bytes} | \`${gate.report.sha256}\` | \`${gate.report.mode}\` |\n| Security contract v2.14 | ${gate.securityContractV214.bytes} | \`${gate.securityContractV214.sha256}\` | \`${gate.securityContractV214.mode}\` |\n\n## Original-runtime state\n\n- Conditionally designated operator: **${runtime.conditionallyDesignatedOperator}**.\n- Designation recorded: **${runtime.operatorDesignationRecorded}**.\n- Operator activated: **${runtime.operatorActivated}**.\n- Operator ready: **${runtime.operatorReady}**.\n- Runtime sessions: **${runtime.runtimeSessions}**.\n- Capture PNGs: **${runtime.capturePngs}**.\n- Exact bound kits: **${gate.exactCaptureKits.length}** (EN and ES for \`${gate.exactScope.animationId}\` only).\n- Fresh checked launch receipt required for every start: **${gate.launchReceipt.freshReceiptRequiredForEveryStart}**.\n- Launch authorized now: **${gate.launchReceipt.launchAuthorizedNow}**.\n\n## Retained boundaries\n\n- V2.14 review batch authorized: **${gate.currentSecurityGates.freshV214SchemaAdversarialWholeReviewBatchValid}**.\n- Production helper independently approved: **${gate.currentSecurityGates.productionHelperIndependentReviewP0P1P2Zero}**.\n- Disposable offline environment approved: **${gate.currentSecurityGates.disposableOfflineEnvironmentApprovedAndPreflighted}**.\n- Authoritative runtime frames: **${report.currentFormalState.frameObligations.authoritativeCaptured} / ${report.currentFormalState.frameObligations.total}**.\n- Strict-complete members: **${report.currentFormalState.reviewAndRelease.strictCompleteMembers} / 47**.\n- Published: **${report.currentFormalState.reviewAndRelease.published}**.\n\nEvery acceptance, integration, release, and publication effect remains false. A local report cannot substitute for the three fresh user-owned reviews or later authenticated authorization.\n`;
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1,
    "Usage: ... --write-no-clobber | --check");
  assert.ok(["--write-no-clobber", "--check"].includes(args[0]),
    "Expected --write-no-clobber or --check");
  return args[0];
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveContract(snapshot);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);
  await assertSnapshotUnchanged(snapshot);
  const jsonPath = path.join(snapshot.projectRoot, REPORT_JSON);
  const markdownPath = path.join(snapshot.projectRoot, REPORT_MARKDOWN);
  if (mode === "--write-no-clobber") {
    const dispositions = [
      await writeNoClobber(jsonPath, json),
      await writeNoClobber(markdownPath, markdown),
    ];
    await assertSnapshotUnchanged(snapshot);
    return {mode, report, dispositions};
  }
  assert.equal(await readFile(jsonPath, "utf8"), json, `${REPORT_JSON} is stale`);
  assert.equal(await readFile(markdownPath, "utf8"), markdown,
    `${REPORT_MARKDOWN} is stale`);
  await assertSnapshotUnchanged(snapshot);
  return {mode, report, dispositions: ["checked", "checked"]};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify({
      action: result.mode === "--check" ? "checked" : "written-no-clobber",
      json: REPORT_JSON,
      markdown: REPORT_MARKDOWN,
      status: result.report.status,
      templateStable: result.report.templateStable,
      operator: result.report.currentFormalState.originalRuntime.conditionallyDesignatedOperator,
      operatorActivated: result.report.currentFormalState.originalRuntime.operatorActivated,
      operatorReady: result.report.currentFormalState.originalRuntime.operatorReady,
      runtimeSessions: result.report.currentFormalState.originalRuntime.runtimeSessions,
      decision: result.report.operatorGateSuccessor.decision,
      acceptanceEffect: false,
      dispositions: result.dispositions,
    }, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
