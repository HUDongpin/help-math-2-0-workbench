#!/usr/bin/env node

import {constants as fsConstants} from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import {createHash, randomBytes} from "node:crypto";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {generateCompletionLedger} from "./build-completion-ledger.mjs";
import {
  renderG5L5StaticFrameDomainDispositionCandidatesMarkdown,
  validateG5L5StaticFrameDomainDispositionCandidateShape,
} from "./build-g5-l5-static-frame-domain-disposition-candidates.mjs";
import {
  validateG5L5PendingPlanningRegistryShape,
  validateG5L5StaticSelectionReceiptShape,
} from "./build-g5-l5-static-frame-domain-disposition-selection.mjs";
import {
  validateG5L5CoverageTraceObligationPlan,
  validateG5L5CoverageTraceObligationReport,
} from "./build-g5-l5-coverage-trace-obligation-matrix.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L5_POST_M1_HANDOFF_RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const G5_L5_POST_M1_HANDOFF_RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
export const G5_L5_POST_M1_HANDOFF_STATE =
  "post-m1-machine-static-handoff-current-zero-execution-zero-acceptance";
export const G5_L5_POST_M1_HANDOFF_GENERATOR =
  "scripts/build-g5-l5-post-m1-machine-handoff.mjs";
export const G5_L5_POST_M1_HANDOFF_JSON =
  "reports/g5-l5-post-m1-machine-handoff.json";
export const G5_L5_POST_M1_HANDOFF_MARKDOWN =
  "reports/g5-l5-post-m1-machine-handoff.md";

const RELEASE_CATALOG = "catalog/lesson-releases.json";
const M1_REPORT = "reports/g5-l5-m1-machine-foundation-readiness.json";
const COMPLETION_LEDGER = "catalog/completion-ledger.json";
const SHA256 = /^[a-f0-9]{64}$/;
const GENERATED_MARKER = /^sha256:[a-f0-9]{64}$/;
const G5_L5_ORDERED_MEMBER_IDENTITY_SHA256 =
  "c3961a2b552a825ba4fce167a502f20e5bcb9ae73a4938c57f4fea6f6e947ccd";

const G5_L5_B_STAGE = Object.freeze({
  candidate: Object.freeze({
    generatorPath:
      "scripts/build-g5-l5-static-frame-domain-disposition-candidates.mjs",
    outputPaths: Object.freeze([
      "reports/g5-l5-static-frame-domain-disposition-candidates.json",
      "reports/g5-l5-static-frame-domain-disposition-candidates.md",
    ]),
    checkCommand:
      "npm run report:g5:l5:static-frame-domain-candidates:check",
  }),
  selection: Object.freeze({
    generatorPath:
      "scripts/build-g5-l5-static-frame-domain-disposition-selection.mjs",
    outputPaths: Object.freeze([
      "reports/g5-l5-static-frame-domain-disposition-selection-receipt.json",
      "reports/g5-l5-runtime-unverified-frame-domain-planning-registry.json",
    ]),
    checkCommand:
      "npm run report:g5:l5:static-frame-domain-selection:check",
  }),
  evidence: Object.freeze({
    generatorPath:
      "scripts/build-g5-l5-static-frame-domain-disposition-evidence.mjs",
    checkCommand:
      "npm run audit:g5:l5:static-frame-domain-evidence:check",
  }),
  disposition: Object.freeze({
    generatorPath:
      "scripts/materialize-g5-l5-static-frame-domain-dispositions.mjs",
    checkCommand:
      "npm run audit:g5:l5:frame-domain-dispositions:check",
  }),
  coverage: Object.freeze({
    generatorPath:
      "scripts/build-g5-l5-coverage-trace-obligation-matrix.mjs",
    reportPaths: Object.freeze([
      "reports/g5-l5-coverage-trace-obligation-matrix.json",
      "reports/g5-l5-coverage-trace-obligation-matrix.md",
    ]),
    checkCommand:
      "npm run audit:g5:l5:coverage-trace-obligations:check",
  }),
});
const G5_L5_B_STAGE_ORDER = Object.freeze(Object.keys(G5_L5_B_STAGE));
const G5_L5_B_STAGE_REQUIRED_CHECK =
  "npm run verify:g5:l5:static-frame-domain-b-stage";
const G5_L5_B_STAGE_COUNTS = Object.freeze({
  reachableChildTimelineCount: 1047,
  evidenceBoundCompositeChildCount: 696,
  unresolvedReachableChildCount: 351,
  excludedNotProvenCount: 185,
  nestedDefinitionCount: 1232,
});

export const G5_L5_POST_M1_HANDOFF_INPUTS = Object.freeze([
  Object.freeze({
    key: "workStudyPreparation",
    reportPath: "reports/g5-l5-work-study-preparation-readiness.json",
    reportType: "g5-l5-work-study-preparation-readiness",
    reportFingerprintSha256:
      "c4c24f8d3e0af7eb7644a337576e94ecf5dfa1001af9d8ac5f9570dc06ff822c",
    generatorPath: "scripts/prepare-g5-l5-work-study-package.mjs",
    checkCommand: "npm run prepare:g5:l5:work-study:check",
  }),
  Object.freeze({
    key: "postM1RuntimeAcquisition",
    reportPath: "reports/g5-l5-post-m1-runtime-acquisition-readiness.json",
    reportType: "g5-l5-post-m1-runtime-acquisition-readiness",
    reportFingerprintSha256:
      "006f93b34a0817af26ec3aab819cbe4e75cd97a929b9520b3b82138df03e2d94",
    generatorPath:
      "scripts/materialize-g5-l5-post-m1-runtime-acquisition-successors.mjs",
    checkCommand: "npm run sync:g5:l5:post-m1-runtime-acquisition:check",
  }),
  Object.freeze({
    key: "postM1AnimateAuthoring",
    reportPath: "reports/g5-l5-post-m1-animate-authoring-readiness.json",
    reportType: "g5-l5-post-m1-animate-authoring-readiness",
    reportFingerprintSha256:
      "6c9e27e58f5117ba305c51067bfa6a5794def8226e16cf66dfbc7fee47438704",
    generatorPath:
      "scripts/materialize-g5-l5-post-m1-animate-authoring-successors.mjs",
    checkCommand: "npm run sync:g5:l5:post-m1-animate-authoring:check",
  }),
  Object.freeze({
    key: "coverageTraceObligations",
    reportPath: "reports/g5-l5-coverage-trace-obligation-matrix.json",
    reportType: "g5-l5-static-coverage-trace-obligation-matrix",
    reportFingerprintSha256:
      "35e4e2fb10bb967d77ac52b80271c2661e5e70b62457a9a6d43055f9f134067b",
    generatorPath:
      "scripts/build-g5-l5-coverage-trace-obligation-matrix.mjs",
    checkCommand: "npm run audit:g5:l5:coverage-trace-obligations:check",
  }),
  Object.freeze({
    key: "postM1RiskCalibration",
    reportPath: "reports/g5-l5-post-m1-risk-calibration-readiness.json",
    reportType: "g5-l5-post-m1-risk-calibration-readiness",
    reportFingerprintSha256:
      "423551851018c43b4fa9e9d2874b7023bfeccca318a29b8b9ebb060a851aa006",
    generatorPath:
      "scripts/build-g5-l5-post-m1-risk-calibration-successor.mjs",
    checkCommand: "npm run report:g5:l5:post-m1-risk-calibration:check",
  }),
  Object.freeze({
    key: "rendererNeutralWorkQueue",
    reportPath: "reports/g5-l5-renderer-neutral-work-queue.json",
    reportType: "g5-l5-renderer-neutral-source-static-work-queue",
    reportFingerprintSha256:
      "99b029612b3df1d5a19eb904e32189ec08df52cea7097bd427f2ad2a1f21be01",
    generatorPath: "scripts/build-g5-l5-renderer-neutral-work-queue.mjs",
    checkCommand: "npm run report:g5:l5:renderer-neutral-work-queue:check",
  }),
  Object.freeze({
    key: "perSessionAuthorizationPreparation",
    reportPath:
      "reports/g5-l5-post-m1-per-session-authorization-preparation.json",
    reportType:
      "g5-l5-post-m1-per-session-authorization-preparation",
    reportFingerprintSha256:
      "05f0991dcff448873e6c490dc05068da4dd02d64e2be51c1215ea391d6b4c37e",
    generatorPath:
      "scripts/build-g5-l5-post-m1-per-session-authorization-preparation.mjs",
    checkCommand:
      "npm run report:g5:l5:post-m1-per-session-authorization-preparation:check",
  }),
  Object.freeze({
    key: "reviewWorkflowPreparation",
    reportPath: "reports/g5-l5-review-workflow-preparation.json",
    reportType: "g5-l5-review-workflow-preparation",
    reportFingerprintSha256:
      "606d10449bed769de3018e46575f55958321cf8c87ddfbba6a185b8adc9984c8",
    generatorPath: "scripts/build-g5-l5-review-workflow-preparation.mjs",
    checkCommand: "npm run report:g5:l5:review-workflow-preparation:check",
  }),
]);

const HISTORICAL_NON_AUTHORITY_PATHS = Object.freeze([
  "reports/g5-l5-risk-calibration.json",
  "reports/g5-l5-risk-calibration.md",
  "reports/g5-l5-animate-authoring-operator-readiness.json",
  "reports/g5-l5-animate-authoring-operator-readiness.md",
]);

const M1_REPORT_FINGERPRINT_SHA256 =
  "4a11fe588ec8e7ae2b2f5771d16ea57f9674f512ad283fbc8379373577aa8665";
const ACTIVE_SHARED_LEDGER_CHANGED_SET_SHA256 =
  "ca239e50e513e368f707f6a8af8563b31728d1aebd28c980372ea3b9266f4e08";
const EMPTY_CHANGED_SET_SHA256 =
  "37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570";
const EXPECTED_SCENARIO_OBLIGATIONS = Object.freeze({
  buttonTargetObligations: 578,
  conditionalBranchObligations: 745,
  correctWrongObligations: 275,
  courseRouteObligations: 112,
  dependencyFixtureObligations: 1130,
  dragObligations: 231,
  glossaryAndHyperlinkObligations: 300,
  handlerBehaviorGroups: 607,
  inputObligations: 6,
  labeledStateObligations: 107,
  randomObligations: 28,
  replayCandidates: 94,
  sectionMenuObligations: 8,
  sideEffectObligations: 42,
  terminalCandidates: 1315,
  timelineStateCoverage: 1289,
});

const REQUIRED_TARGETED_CHECKS = Object.freeze([
  "npm run verify:sources",
  "npm run report:g5:l5:m1-machine-foundation:check",
  "npm run sync:g5:l5:m1-static-specification:check",
  ...G5_L5_POST_M1_HANDOFF_INPUTS.map(({checkCommand}) => checkCommand),
  G5_L5_B_STAGE_REQUIRED_CHECK,
  "npm run test:g5:l5:m1-static-foundation",
]);

const M1_BOUNDARY =
  "M1 authorizes only the bounded machine-side static foundation and static reconciliation. It does not authorize implementation, renderer selection, original-runtime or Animate execution, evidence promotion, human review, Owner acceptance, strict completion, or publication.";
const HISTORICAL_BOUNDARY =
  "Historical G5 L5 readiness and risk reports are immutable context only. The current post-M1 successors and current hash-bound reports control this handoff; no historical report can override a current successor, authorize execution, or promote acceptance.";
const STRICT_ACCEPTANCE_EFFECT =
  "none; machine-side aggregation does not implement, execute, review, accept, strictly complete, or publish any release member";

const HANDOFF_OUTPUT_PATHS = Object.freeze([
  G5_L5_POST_M1_HANDOFF_JSON,
  G5_L5_POST_M1_HANDOFF_MARKDOWN,
]);

const EXECUTION_AND_ACCEPTANCE_KEYS = Object.freeze([
  "implementationAuthorizedCount",
  "implementationStartedCount",
  "runtimeSessionCount",
  "guiExecutionCount",
  "reviewAcceptedCount",
  "ownerAcceptanceCount",
  "strictCompleteCount",
  "publishedCount",
  "runnableMemberCount",
  "commandCount",
]);

const ACCEPTANCE_EFFECT_KEYS = Object.freeze([
  "animateAuditAccepted",
  "audioAccepted",
  "authoritativeOriginalRuntime",
  "behaviorAccepted",
  "currentJavaScriptCandidate",
  "fidelityAccepted",
  "fullFrameComparisonAccepted",
  "humanReviewAccepted",
  "implementationAuthorized",
  "implementationStarted",
  "independentEngineeringAccepted",
  "ownerAccepted",
  "publicationAuthorized",
  "published",
  "rendererSelected",
  "rmseAccepted",
  "runtimeExecutionAuthorized",
  "strictComplete",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be a portable project-relative path`,
  );
  const resolved = path.resolve(root, relativePath);
  invariant(isWithin(root, resolved), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(root, resolved)) === relativePath,
    `${label}: path is not normalized`,
  );
  return resolved;
}

async function lstatOrNull(candidate, options) {
  try {
    return await lstat(candidate, options);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function statIdentity(stat) {
  return {
    dev: stat.dev,
    ino: stat.ino,
    mtimeNs: stat.mtimeNs,
    size: stat.size,
  };
}

function sameIdentity(left, right) {
  return left.dev === right.dev &&
    left.ino === right.ino &&
    left.mtimeNs === right.mtimeNs &&
    left.size === right.size;
}

async function assertRealAncestors(root, candidate, label) {
  const relative = path.relative(root, path.dirname(candidate));
  let cursor = root;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, component);
    const information = await lstatOrNull(cursor);
    if (!information) return;
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label}: ancestor must be a real directory`,
    );
  }
}

async function assertRealProjectRoot(root, label = "project root") {
  const [information] = await Promise.all([
    lstat(root, {bigint: true}).catch((error) => {
      throw new Error(`${label}: unavailable (${error.message})`);
    }),
    realpath(root).catch((error) => {
      throw new Error(`${label}: cannot resolve (${error.message})`);
    }),
  ]);
  invariant(
    information.isDirectory() &&
      !information.isSymbolicLink() &&
      path.resolve(root) === root,
    `${label}: must be one real project directory`,
  );
}

export async function readHandoffInput(
  root,
  relativePath,
  {
    json = false,
    label = relativePath,
    requiredMode = null,
    testHooks = {},
  } = {},
) {
  await assertRealProjectRoot(root);
  const absolutePath = resolveProjectPath(root, relativePath, label);
  await assertRealAncestors(root, absolutePath, label);
  await testHooks.afterAncestorPreflight?.({absolutePath});
  let handle;
  try {
    handle = await open(
      absolutePath,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
    );
  } catch (error) {
    throw new Error(`${label}: unavailable without following links (${error.message})`);
  }
  let contents;
  let after;
  try {
    const before = await handle.stat({bigint: true});
    invariant(
      before.isFile() && before.nlink === 1n,
      `${label}: expected one ordinary non-linked file`,
    );
    if (requiredMode !== null) {
      invariant(
        Number(before.mode & 0o777n) === requiredMode,
        `${label}: mode must remain ${requiredMode.toString(8).padStart(4, "0")}`,
      );
    }
    await testHooks.afterOpen?.({absolutePath});
    contents = await handle.readFile();
    after = await handle.stat({bigint: true});
    invariant(
      after.isFile() &&
        after.nlink === 1n &&
        sameIdentity(statIdentity(before), statIdentity(after)) &&
        BigInt(contents.length) === after.size,
      `${label}: changed during descriptor read`,
    );
  } finally {
    await handle.close();
  }
  const [pathInformation, realRoot, realFile] = await Promise.all([
    lstat(absolutePath, {bigint: true}).catch((error) => {
      throw new Error(`${label}: path changed during read (${error.message})`);
    }),
    realpath(root),
    realpath(absolutePath),
  ]);
  invariant(
    pathInformation.isFile() &&
      !pathInformation.isSymbolicLink() &&
      pathInformation.nlink === 1n &&
      sameIdentity(statIdentity(after), statIdentity(pathInformation)),
    `${label}: path identity changed during descriptor read`,
  );
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside project root`);
  const record = {
    path: relativePath,
    absolutePath,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
    stat: statIdentity(after),
  };
  if (json) {
    try {
      record.document = JSON.parse(contents.toString("utf8"));
    } catch (error) {
      throw new Error(`${label}: invalid JSON (${error.message})`);
    }
  }
  return record;
}

function descriptor(record, extra = {}) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    ...extra,
  };
}

function evidenceOutputPath(animationId) {
  return `migrations/${animationId}/audit/static-frame-domain-disposition-evidence.json`;
}

function dispositionOutputPath(animationId) {
  return `migrations/${animationId}/audit/frame-domain-disposition.json`;
}

function coveragePlanOutputPath(animationId) {
  return `migrations/${animationId}/audit/machine/g5-l5-coverage-trace-obligation-plan.json`;
}

function exactDescriptorProjection(records) {
  return records.map((record) => descriptor(record));
}

function bStageBinding(key, generatorRecord, outputRecords, facts) {
  const outputs = exactDescriptorProjection(outputRecords);
  return {
    checkCommand: G5_L5_B_STAGE[key].checkCommand,
    generator: descriptor(generatorRecord),
    outputCount: outputs.length,
    outputs,
    outputSetSha256: sha256(Buffer.from(stableJson(outputs))),
    facts,
  };
}

function allFalse(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => entry === false);
}

async function readBStageRecords(root, paths, label) {
  return Promise.all(paths.map((relativePath) =>
    readHandoffInput(root, relativePath, {
      json: relativePath.endsWith(".json"),
      label: `${label} ${relativePath}`,
      requiredMode: 0o644,
    })));
}

async function buildBStageSourceBindings({
  root,
  release,
  releaseRecord,
  upstreamInputRecords,
  upstreamGeneratorRecords,
}) {
  const generatorRecords = {};
  for (const key of G5_L5_B_STAGE_ORDER) {
    generatorRecords[key] =
      key === "coverage"
        ? upstreamGeneratorRecords.coverageTraceObligations
        : await readHandoffInput(
          root,
          G5_L5_B_STAGE[key].generatorPath,
          {label: `B-stage ${key} generator`},
        );
  }

  const [candidateRecords, selectionRecords] = await Promise.all([
    readBStageRecords(
      root,
      G5_L5_B_STAGE.candidate.outputPaths,
      "B-stage candidate output",
    ),
    readBStageRecords(
      root,
      G5_L5_B_STAGE.selection.outputPaths,
      "B-stage selection output",
    ),
  ]);
  const candidateReport = candidateRecords[0].document;
  const selectionReceipt = selectionRecords[0].document;
  const planningRegistry = selectionRecords[1].document;
  validateG5L5StaticFrameDomainDispositionCandidateShape(candidateReport);
  validateG5L5StaticSelectionReceiptShape(selectionReceipt);
  validateG5L5PendingPlanningRegistryShape(planningRegistry);
  invariant(
    candidateReport.generatedBy?.sha256 ===
        generatorRecords.candidate.sha256 &&
      candidateReport.release?.catalog?.sha256 === releaseRecord.sha256 &&
      candidateRecords[1].contents.equals(Buffer.from(
        renderG5L5StaticFrameDomainDispositionCandidatesMarkdown(
          candidateReport,
        ),
      )),
    "B-stage candidate outputs are not bound to the current generator, release, and rendered report",
  );
  invariant(
    selectionReceipt.generatedBy?.sha256 ===
        generatorRecords.selection.sha256 &&
      selectionReceipt.inputs?.candidateReport?.sha256 ===
        candidateRecords[0].sha256 &&
      selectionReceipt.inputs.candidateReport.reportFingerprintSha256 ===
        candidateReport.reportFingerprintSha256 &&
      selectionReceipt.inputs?.candidateGenerator?.sha256 ===
        generatorRecords.candidate.sha256 &&
      selectionReceipt.materializers?.selection?.sha256 ===
        generatorRecords.selection.sha256 &&
      selectionReceipt.materializers?.evidence?.sha256 ===
        generatorRecords.evidence.sha256 &&
      selectionReceipt.release?.catalog?.sha256 === releaseRecord.sha256 &&
      planningRegistry.generatedFrom?.candidateReport?.sha256 ===
        candidateRecords[0].sha256 &&
      planningRegistry.generatedFrom.candidateReport
        .reportFingerprintSha256 ===
          candidateReport.reportFingerprintSha256 &&
      planningRegistry.generatedFrom?.selectionReceipt?.sha256 ===
        selectionRecords[0].sha256 &&
      planningRegistry.generatedFrom.selectionReceipt
        .artifactFingerprintSha256 ===
          selectionReceipt.artifactFingerprintSha256,
    "B-stage selection outputs are not bound to the current candidate, generators, release, and receipt",
  );

  const selectedMembers = selectionReceipt.acceptedSet.members;
  invariant(
    selectedMembers.length === 28 &&
      new Set(selectedMembers.map(({animationId}) => animationId)).size ===
        28 &&
      selectedMembers.every(({animationId, releaseOrdinal}) =>
        release.members[releaseOrdinal - 1]?.animationId === animationId),
    "B-stage evidence member selection drifted",
  );
  const evidenceRecords = await readBStageRecords(
    root,
    selectedMembers.map(({animationId}) =>
      evidenceOutputPath(animationId)),
    "B-stage static evidence output",
  );
  let evidenceClaimCount = 0;
  for (const [index, record] of evidenceRecords.entries()) {
    const selected = selectedMembers[index];
    const document = record.document;
    invariant(
      document?.schemaVersion === 2 &&
        document.evidenceType ===
          "static-frame-domain-disposition-evidence" &&
        document.animationId === selected.animationId &&
        document.status === "verified-static-composite-claims" &&
        document.migrationStatusChanged === false &&
        Array.isArray(document.claims) &&
        document.claims.length === selected.expectedTimelineCount &&
        allFalse(document.acceptanceEffects) &&
        String(document.strictAcceptanceEffect || "").startsWith("none;") &&
        document.generatedFrom?.reviewedSingleFrameSelection?.selection
          ?.sha256 === selectionRecords[0].sha256 &&
        document.generatedFrom.reviewedSingleFrameSelection.selection
          .artifactFingerprintSha256 ===
            selectionReceipt.artifactFingerprintSha256 &&
        document.generatedFrom.reviewedSingleFrameSelection.candidateReport
          ?.sha256 === candidateRecords[0].sha256 &&
        document.generatedFrom.reviewedSingleFrameSelection.candidateReport
          .reportFingerprintSha256 ===
            candidateReport.reportFingerprintSha256 &&
        document.generatedFrom.reviewedSingleFrameSelection.materializer
          ?.sha256 === generatorRecords.evidence.sha256,
      `${selected.animationId}: B-stage static evidence binding or authority drifted`,
    );
    evidenceClaimCount += document.claims.length;
  }
  invariant(
    evidenceClaimCount === 696,
    "B-stage evidence claim total drifted",
  );

  const dispositionRecords = await readBStageRecords(
    root,
    release.members.map(({animationId}) =>
      dispositionOutputPath(animationId)),
    "B-stage disposition output",
  );
  const evidenceByAnimationId = new Map(
    selectedMembers.map(({animationId}, index) => [
      animationId,
      evidenceRecords[index],
    ]),
  );
  const dispositionFacts = {
    memberCount: dispositionRecords.length,
    declaredRootCount: 0,
    evidenceBoundCompositeChildCount: 0,
    unresolvedReachableChildCount: 0,
    excludedNotProvenCount: 0,
  };
  for (const [index, record] of dispositionRecords.entries()) {
    const member = release.members[index];
    const document = record.document;
    const counts = document?.summary?.dispositionCounts;
    const expectedEvidence = evidenceByAnimationId.get(member.animationId);
    const evidenceBinding =
      document?.generatedFrom?.staticDispositionEvidence;
    invariant(
      document?.schemaVersion === 1 &&
        document.animationId === member.animationId &&
        document.status ===
          "structurally-enumerated-dispositions-unresolved" &&
        document.migrationStatusChanged === false &&
        String(document.strictAcceptanceEffect || "").startsWith("none;") &&
        document.generatedFrom?.lessonReleaseCatalog?.releaseId ===
          G5_L5_POST_M1_HANDOFF_RELEASE_ID &&
        document.generatedFrom.lessonReleaseCatalog
          .releaseFingerprintSha256 ===
            G5_L5_POST_M1_HANDOFF_RELEASE_FINGERPRINT_SHA256 &&
        document.generatedFrom.lessonReleaseCatalog
          .orderedMemberIdentitySha256 ===
            G5_L5_ORDERED_MEMBER_IDENTITY_SHA256 &&
        (
          expectedEvidence
            ? evidenceBinding?.path ===
                "audit/static-frame-domain-disposition-evidence.json" &&
              evidenceBinding.sha256 === expectedEvidence.sha256
            : evidenceBinding === null ||
              evidenceBinding === undefined
        ) &&
        Number.isSafeInteger(counts?.["declared-frame-domain"]) &&
        Number.isSafeInteger(counts?.["composite-child-with-parent"]) &&
        Number.isSafeInteger(counts?.unresolved) &&
        Number.isSafeInteger(
          document.summary.excludedNotProvenTimelineCount,
        ),
      `${member.animationId}: B-stage disposition binding or authority drifted`,
    );
    dispositionFacts.declaredRootCount += counts["declared-frame-domain"];
    dispositionFacts.evidenceBoundCompositeChildCount +=
      counts["composite-child-with-parent"];
    dispositionFacts.unresolvedReachableChildCount += counts.unresolved;
    dispositionFacts.excludedNotProvenCount +=
      document.summary.excludedNotProvenTimelineCount;
  }

  const coveragePlanRecords = await readBStageRecords(
    root,
    release.members.map(({animationId}) =>
      coveragePlanOutputPath(animationId)),
    "B-stage coverage plan output",
  );
  const [coverageReportRecord, coverageMarkdownRecord] =
    await readBStageRecords(
      root,
      G5_L5_B_STAGE.coverage.reportPaths,
      "B-stage coverage aggregate output",
    );
  const coverageReport = coverageReportRecord.document;
  validateG5L5CoverageTraceObligationReport(coverageReport);
  invariant(
    coverageReportRecord.bytes ===
        upstreamInputRecords.coverageTraceObligations.bytes &&
      coverageReportRecord.sha256 ===
        upstreamInputRecords.coverageTraceObligations.sha256 &&
    coverageReport.generatedBy?.sha256 === generatorRecords.coverage.sha256 &&
      coverageReport.release?.catalog?.sha256 === releaseRecord.sha256,
    "B-stage coverage report generator or release binding drifted",
  );
  for (const [index, record] of coveragePlanRecords.entries()) {
    const member = release.members[index];
    const document = record.document;
    validateG5L5CoverageTraceObligationPlan(document, member);
    const aggregate = coverageReport.members[index];
    const dispositionRecord = dispositionRecords[index];
    const evidenceRecord = evidenceByAnimationId.get(member.animationId);
    invariant(
      aggregate?.ordinal === member.ordinal &&
        aggregate.animationId === member.animationId &&
        aggregate.output?.path === record.path &&
        aggregate.output.bytes === record.bytes &&
        aggregate.output.sha256 === record.sha256 &&
        aggregate.output.artifactFingerprintSha256 ===
          document.artifactFingerprintSha256 &&
        document.bindings?.frameDomainDisposition?.sha256 ===
          dispositionRecord.sha256 &&
        (
          evidenceRecord
            ? document.bindings?.staticDispositionEvidence?.sha256 ===
              evidenceRecord.sha256
            : document.bindings?.staticDispositionEvidence === undefined
        ),
      `${member.animationId}: B-stage coverage output binding drifted`,
    );
  }

  const candidateFacts = {
    reachableChildTimelineCount:
      candidateReport.summary.reachableChildren,
    evidenceBoundCompositeChildCount:
      candidateReport.summary.oneFrameEligible,
    unresolvedReachableChildCount:
      candidateReport.summary.oneFrameExcluded +
        candidateReport.summary.multiFrameExcluded,
    excludedNotProvenCount:
      candidateReport.summary.nonReachableDefinitions,
  };
  const selectionFacts = {
    selectedMemberCount: selectionReceipt.acceptedSet.memberCount,
    evidenceBoundCompositeChildCount:
      selectionReceipt.acceptedSet.candidateCount,
    pendingMemberCount: planningRegistry.summary.pendingMemberCount,
    unresolvedReachableChildCount:
      planningRegistry.summary.pendingTimelineCount,
    pendingFrameCount: planningRegistry.summary.pendingFrameCount,
    excludedNotProvenCount:
      selectionReceipt.successorContract.expectedDispositionCounts
        .excludedNotProven,
  };
  const evidenceFacts = {
    selectedMemberCount: evidenceRecords.length,
    evidenceBoundCompositeChildCount: evidenceClaimCount,
  };
  const coverageFacts = {
    memberPlanCount: coveragePlanRecords.length,
    nestedDefinitionCount:
      coverageReport.frameDomainDisposition.nestedDefinitionCount,
    evidenceBoundCompositeChildCount:
      coverageReport.frameDomainDisposition
        .evidenceBoundCompositeChildCount,
    unresolvedReachableChildCount:
      coverageReport.frameDomainDisposition.unresolvedChildCount,
    excludedNotProvenCount:
      coverageReport.frameDomainDisposition.excludedNotProvenCount,
  };
  invariant(
    JSON.stringify(candidateFacts) === JSON.stringify({
      reachableChildTimelineCount: 1047,
      evidenceBoundCompositeChildCount: 696,
      unresolvedReachableChildCount: 351,
      excludedNotProvenCount: 185,
    }) &&
      JSON.stringify(selectionFacts) === JSON.stringify({
        selectedMemberCount: 28,
        evidenceBoundCompositeChildCount: 696,
        pendingMemberCount: 57,
        unresolvedReachableChildCount: 351,
        pendingFrameCount: 34159,
        excludedNotProvenCount: 185,
      }) &&
      JSON.stringify(evidenceFacts) === JSON.stringify({
        selectedMemberCount: 28,
        evidenceBoundCompositeChildCount: 696,
      }) &&
      JSON.stringify(dispositionFacts) === JSON.stringify({
        memberCount: 57,
        declaredRootCount: 57,
        evidenceBoundCompositeChildCount: 696,
        unresolvedReachableChildCount: 351,
        excludedNotProvenCount: 185,
      }) &&
      JSON.stringify(coverageFacts) === JSON.stringify({
        memberPlanCount: 57,
        nestedDefinitionCount: 1232,
        evidenceBoundCompositeChildCount: 696,
        unresolvedReachableChildCount: 351,
        excludedNotProvenCount: 185,
      }),
    "B-stage exact 1047 / 696 / 351 / 185 partition drifted",
  );

  const stages = {
    candidate: bStageBinding(
      "candidate",
      generatorRecords.candidate,
      candidateRecords,
      candidateFacts,
    ),
    selection: bStageBinding(
      "selection",
      generatorRecords.selection,
      selectionRecords,
      selectionFacts,
    ),
    evidence: bStageBinding(
      "evidence",
      generatorRecords.evidence,
      evidenceRecords,
      evidenceFacts,
    ),
    disposition: bStageBinding(
      "disposition",
      generatorRecords.disposition,
      dispositionRecords,
      dispositionFacts,
    ),
    coverage: bStageBinding(
      "coverage",
      generatorRecords.coverage,
      [
        ...coveragePlanRecords,
        coverageReportRecord,
        coverageMarkdownRecord,
      ],
      coverageFacts,
    ),
  };
  const binding = {
    requiredStageCount: 5,
    currentStageCount: 5,
    allStagesCurrent: true,
    releaseFingerprintSha256:
      G5_L5_POST_M1_HANDOFF_RELEASE_FINGERPRINT_SHA256,
    orderedMemberIdentitySha256:
      G5_L5_ORDERED_MEMBER_IDENTITY_SHA256,
    partition: structuredClone(G5_L5_B_STAGE_COUNTS),
    stages,
    sourceSetSha256: sha256(Buffer.from(stableJson(
      G5_L5_B_STAGE_ORDER.map((key) => ({key, stage: stages[key]})),
    ))),
    strictAcceptanceEffect:
      "none; B-stage source-static bindings do not establish runtime reachability, visual or audio fidelity, implementation completion, human or Owner acceptance, strict completion, or publication",
  };
  return {
    binding,
    records: [
      ...Object.values(generatorRecords),
      ...candidateRecords,
      ...selectionRecords,
      ...evidenceRecords,
      ...dispositionRecords,
      ...coveragePlanRecords,
      coverageReportRecord,
      coverageMarkdownRecord,
    ],
  };
}

function assertExactKeys(value, expected, label) {
  invariant(
    value && typeof value === "object" && !Array.isArray(value),
    `${label}: expected an object`,
  );
  invariant(
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...expected].sort()),
    `${label}: keys drifted`,
  );
}

function assertExactArray(value, expected, label) {
  invariant(
    Array.isArray(value) &&
      JSON.stringify(value) === JSON.stringify(expected),
    `${label}: ordered values drifted`,
  );
}

function assertDescriptor(
  actual,
  expected,
  label,
  {path: expectedPath, extraKeys = []} = {},
) {
  assertExactKeys(actual, ["path", "bytes", "sha256", ...extraKeys], label);
  invariant(
    actual.path === expectedPath &&
      Number.isSafeInteger(actual.bytes) &&
      actual.bytes > 0 &&
      SHA256.test(actual.sha256 || ""),
    `${label}: descriptor identity drifted`,
  );
  invariant(
    expected &&
      actual.path === expected.path &&
      actual.bytes === expected.bytes &&
      actual.sha256 === expected.sha256,
    `${label}: descriptor is not bound to the trusted current input`,
  );
}

function assertTrustedBindings(expectedBindings) {
  assertExactKeys(
    expectedBindings,
    [
      "generator",
      "releaseCatalog",
      "m1Report",
      "completionLedger",
      "reports",
      "generators",
      "releaseIdentity",
      "m1Identity",
      "ledgerException",
      "bStage",
    ],
    "trusted handoff bindings",
  );
  assertDescriptor(
    expectedBindings.generator,
    expectedBindings.generator,
    "trusted handoff generator",
    {path: G5_L5_POST_M1_HANDOFF_GENERATOR},
  );
  assertDescriptor(
    expectedBindings.releaseCatalog,
    expectedBindings.releaseCatalog,
    "trusted release catalog",
    {path: RELEASE_CATALOG},
  );
  assertDescriptor(
    expectedBindings.m1Report,
    expectedBindings.m1Report,
    "trusted M1 report",
    {path: M1_REPORT},
  );
  assertDescriptor(
    expectedBindings.completionLedger,
    expectedBindings.completionLedger,
    "trusted completion ledger",
    {path: COMPLETION_LEDGER},
  );
  assertExactKeys(
    expectedBindings.reports,
    G5_L5_POST_M1_HANDOFF_INPUTS.map(({key}) => key),
    "trusted upstream report bindings",
  );
  assertExactKeys(
    expectedBindings.generators,
    G5_L5_POST_M1_HANDOFF_INPUTS.map(({key}) => key),
    "trusted upstream generator bindings",
  );
  for (const input of G5_L5_POST_M1_HANDOFF_INPUTS) {
    assertDescriptor(
      expectedBindings.reports[input.key],
      expectedBindings.reports[input.key],
      `trusted ${input.key} report`,
      {path: input.reportPath},
    );
    assertDescriptor(
      expectedBindings.generators[input.key],
      expectedBindings.generators[input.key],
      `trusted ${input.key} generator`,
      {path: input.generatorPath},
    );
  }
  assertExactKeys(
    expectedBindings.releaseIdentity,
    [
      "releaseId",
      "fingerprintSha256",
      "titleDisplay",
      "memberCount",
      "pageCount",
      "shellCount",
      "publicationMode",
    ],
    "trusted release identity",
  );
  invariant(
    expectedBindings.releaseIdentity.releaseId ===
      G5_L5_POST_M1_HANDOFF_RELEASE_ID &&
      expectedBindings.releaseIdentity.fingerprintSha256 ===
        G5_L5_POST_M1_HANDOFF_RELEASE_FINGERPRINT_SHA256 &&
      expectedBindings.releaseIdentity.titleDisplay ===
        "Add & Subtract Negative Numbers" &&
      expectedBindings.releaseIdentity.memberCount === 57 &&
      expectedBindings.releaseIdentity.pageCount === 56 &&
      expectedBindings.releaseIdentity.shellCount === 1 &&
      expectedBindings.releaseIdentity.publicationMode === "atomic",
    "trusted release identity drifted",
  );
  assertExactKeys(
    expectedBindings.m1Identity,
    ["releaseId", "reportType", "reportFingerprintSha256"],
    "trusted M1 identity",
  );
  invariant(
    expectedBindings.m1Identity.releaseId ===
      G5_L5_POST_M1_HANDOFF_RELEASE_ID &&
      expectedBindings.m1Identity.reportType ===
        "g5-l5-m1-machine-foundation-readiness" &&
      expectedBindings.m1Identity.reportFingerprintSha256 ===
        M1_REPORT_FINGERPRINT_SHA256,
    "trusted M1 identity drifted",
  );
  invariant(
    expectedBindings.ledgerException &&
      typeof expectedBindings.ledgerException === "object" &&
      !Array.isArray(expectedBindings.ledgerException),
    "trusted ledger exception is missing",
  );
  invariant(
    expectedBindings.bStage &&
      typeof expectedBindings.bStage === "object" &&
      !Array.isArray(expectedBindings.bStage),
    "trusted B-stage bindings are missing",
  );
}

function assertBStageSourceBindings(binding, expected) {
  assertExactKeys(
    binding,
    [
      "requiredStageCount",
      "currentStageCount",
      "allStagesCurrent",
      "releaseFingerprintSha256",
      "orderedMemberIdentitySha256",
      "partition",
      "stages",
      "sourceSetSha256",
      "strictAcceptanceEffect",
    ],
    "post-M1 B-stage source bindings",
  );
  invariant(
    binding.requiredStageCount === 5 &&
      binding.currentStageCount === 5 &&
      binding.allStagesCurrent === true &&
      binding.releaseFingerprintSha256 ===
        G5_L5_POST_M1_HANDOFF_RELEASE_FINGERPRINT_SHA256 &&
      binding.orderedMemberIdentitySha256 ===
        G5_L5_ORDERED_MEMBER_IDENTITY_SHA256,
    "post-M1 B-stage source currency or release identity drifted",
  );
  assertExactKeys(
    binding.partition,
    Object.keys(G5_L5_B_STAGE_COUNTS),
    "post-M1 B-stage partition",
  );
  invariant(
    Object.entries(G5_L5_B_STAGE_COUNTS).every(
      ([key, value]) => binding.partition[key] === value,
    ) &&
      binding.partition.nestedDefinitionCount ===
        binding.partition.evidenceBoundCompositeChildCount +
          binding.partition.unresolvedReachableChildCount +
          binding.partition.excludedNotProvenCount &&
      binding.partition.reachableChildTimelineCount ===
        binding.partition.evidenceBoundCompositeChildCount +
          binding.partition.unresolvedReachableChildCount,
    "post-M1 B-stage exact 1232 / 1047 / 696 / 351 / 185 partition drifted",
  );
  assertExactKeys(
    binding.stages,
    G5_L5_B_STAGE_ORDER,
    "post-M1 B-stage stages",
  );
  const expectedOutputCounts = {
    candidate: 2,
    selection: 2,
    evidence: 28,
    disposition: 57,
    coverage: 59,
  };
  const expectedFacts = {
    candidate: {
      reachableChildTimelineCount: 1047,
      evidenceBoundCompositeChildCount: 696,
      unresolvedReachableChildCount: 351,
      excludedNotProvenCount: 185,
    },
    selection: {
      selectedMemberCount: 28,
      evidenceBoundCompositeChildCount: 696,
      pendingMemberCount: 57,
      unresolvedReachableChildCount: 351,
      pendingFrameCount: 34159,
      excludedNotProvenCount: 185,
    },
    evidence: {
      selectedMemberCount: 28,
      evidenceBoundCompositeChildCount: 696,
    },
    disposition: {
      memberCount: 57,
      declaredRootCount: 57,
      evidenceBoundCompositeChildCount: 696,
      unresolvedReachableChildCount: 351,
      excludedNotProvenCount: 185,
    },
    coverage: {
      memberPlanCount: 57,
      nestedDefinitionCount: 1232,
      evidenceBoundCompositeChildCount: 696,
      unresolvedReachableChildCount: 351,
      excludedNotProvenCount: 185,
    },
  };
  for (const key of G5_L5_B_STAGE_ORDER) {
    const stage = binding.stages[key];
    const trustedStage = expected?.stages?.[key];
    assertExactKeys(
      stage,
      [
        "checkCommand",
        "generator",
        "outputCount",
        "outputs",
        "outputSetSha256",
        "facts",
      ],
      `post-M1 B-stage ${key}`,
    );
    invariant(
      stage.checkCommand === G5_L5_B_STAGE[key].checkCommand &&
        stage.outputCount === expectedOutputCounts[key] &&
        Array.isArray(stage.outputs) &&
        stage.outputs.length === expectedOutputCounts[key] &&
        JSON.stringify(stage.facts) === JSON.stringify(expectedFacts[key]),
      `post-M1 B-stage ${key} contract drifted`,
    );
    assertDescriptor(
      stage.generator,
      trustedStage?.generator,
      `post-M1 B-stage ${key} generator`,
      {path: G5_L5_B_STAGE[key].generatorPath},
    );
    stage.outputs.forEach((output, index) => {
      assertDescriptor(
        output,
        trustedStage?.outputs?.[index],
        `post-M1 B-stage ${key} output ${index + 1}`,
        {path: trustedStage?.outputs?.[index]?.path},
      );
    });
    invariant(
      stage.outputSetSha256 ===
        sha256(Buffer.from(stableJson(stage.outputs))),
      `post-M1 B-stage ${key} output-set fingerprint drifted`,
    );
  }
  const projection = G5_L5_B_STAGE_ORDER.map((key) => ({
    key,
    stage: binding.stages[key],
  }));
  invariant(
    binding.sourceSetSha256 ===
      sha256(Buffer.from(stableJson(projection))),
    "post-M1 B-stage source-set fingerprint drifted",
  );
  invariant(
    binding.strictAcceptanceEffect ===
      "none; B-stage source-static bindings do not establish runtime reachability, visual or audio fidelity, implementation completion, human or Owner acceptance, strict completion, or publication",
    "post-M1 B-stage acceptance boundary drifted",
  );
  invariant(
    JSON.stringify(binding) === JSON.stringify(expected),
    "post-M1 B-stage bindings are not the trusted current physical source set",
  );
}

function assertAllFalseExcept(value, allowedTrue, label) {
  invariant(value && typeof value === "object", `${label}: missing`);
  for (const [key, state] of Object.entries(value)) {
    if (allowedTrue.has(key)) {
      invariant(state === true, `${label}: ${key} must remain true`);
    } else {
      invariant(state === false, `${label}: ${key} must remain false`);
    }
  }
}

function assertNulls(value, keys, label) {
  for (const key of keys) {
    invariant(value?.[key] === null, `${label}: ${key} must remain null`);
  }
}

function assertReportFingerprint(report, label) {
  const field = Object.hasOwn(report, "reportFingerprintSha256")
    ? "reportFingerprintSha256"
    : "artifactFingerprintSha256";
  const actual = report[field];
  invariant(SHA256.test(actual || ""), `${label}: fingerprint is missing`);
  const copy = structuredClone(report);
  delete copy[field];
  invariant(
    actual === sha256(Buffer.from(stableJson(copy))),
    `${label}: fingerprint drifted`,
  );
}

function releaseCounts(report) {
  const release = report.release || {};
  return {
    memberCount:
      release.memberCount ??
      release.members ??
      release.expectedMemberCount ??
      report.summary?.releaseMemberCount ??
      report.summary?.exactReleaseMemberCount,
    pageCount:
      release.pageCount ??
      release.activePageCount ??
      release.activeXmlReferencedPages,
    shellCount:
      release.shellCount ??
      release.courseShells,
    publicationMode: release.publicationMode,
    fingerprint:
      release.releaseFingerprintSha256 ??
      release.fingerprintSha256,
  };
}

function assertRelease57(report, label, {fingerprintRequired = true} = {}) {
  const counts = releaseCounts(report);
  invariant(counts.memberCount === 57, `${label}: release member count drifted`);
  invariant(counts.pageCount === 56, `${label}: page count drifted`);
  invariant(counts.shellCount === 1, `${label}: shell count drifted`);
  invariant(
    counts.publicationMode === "atomic",
    `${label}: publication mode drifted`,
  );
  if (fingerprintRequired) {
    invariant(
      counts.fingerprint === G5_L5_POST_M1_HANDOFF_RELEASE_FINGERPRINT_SHA256,
      `${label}: release fingerprint drifted`,
    );
  }
}

function orderedReleaseMembers(releaseCatalog) {
  invariant(
    releaseCatalog?.schemaVersion === 1 &&
      Array.isArray(releaseCatalog.releases),
    "release catalog identity drifted",
  );
  const release = releaseCatalog.releases.find(
    ({releaseId}) => releaseId === G5_L5_POST_M1_HANDOFF_RELEASE_ID,
  );
  invariant(release, "G5 L5 release is missing");
  invariant(
    release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === 56 &&
      release.expectedCounts?.courseShells === 1 &&
      release.expectedCounts?.members === 57 &&
      Array.isArray(release.members) &&
      release.members.length === 57,
    "G5 L5 release shape drifted",
  );
  invariant(
    sha256(Buffer.from(stableJson(release))) ===
      G5_L5_POST_M1_HANDOFF_RELEASE_FINGERPRINT_SHA256,
    "G5 L5 release fingerprint drifted",
  );
  release.members.forEach((member, index) => {
    invariant(
      member.ordinal === index + 1 &&
        typeof member.animationId === "string" &&
        member.animationId.length > 0,
      "G5 L5 release member order drifted",
    );
  });
  return release;
}

function assertOrderedMemberProjection(items, release, label) {
  invariant(Array.isArray(items) && items.length === 57, `${label}: member list drifted`);
  items.forEach((item, index) => {
    invariant(
      item.ordinal === release.members[index].ordinal &&
        item.animationId === release.members[index].animationId,
      `${label}: ordered member identity drifted at ${index + 1}`,
    );
  });
}

function generatorDeclaration(report) {
  if (report.generatedBy) {
    return {
      path: report.generatedBy.path ?? report.generatedBy.script,
      sha256: report.generatedBy.sha256,
    };
  }
  if (report.sourceBindings?.generator) {
    return {
      path: report.sourceBindings.generator.path,
      sha256: report.sourceBindings.generator.sha256,
    };
  }
  return {
    path: report.generator?.path,
    sha256: report.generator?.sha256,
  };
}

function validateM1(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l5-m1-machine-foundation-readiness" &&
      report.releaseId === G5_L5_POST_M1_HANDOFF_RELEASE_ID &&
      report.evidenceState ===
        "m1-machine-foundation-packet-current-machine-only-static-start-and-execution-authorized",
    "M1 machine foundation identity drifted",
  );
  assertRelease57(report, "M1 machine foundation", {fingerprintRequired: false});
  assertReportFingerprint(report, "M1 machine foundation");
  invariant(
    report.reportFingerprintSha256 === M1_REPORT_FINGERPRINT_SHA256,
    "M1 machine foundation current fingerprint drifted",
  );
  const summary = report.summary;
  invariant(
    summary?.authorizationReceiptCount === 1 &&
      summary.authorizedStaticReconciliationCount === 57 &&
      summary.exactReleaseMemberCount === 57 &&
      summary.emptyRuntimeWorksheetCount === 57 &&
      summary.machineAuditCount === 57 &&
      summary.strictReadinessArtifactCount === 57 &&
      summary.m1MachineOnlyStaticExecutionAuthorized === true &&
      summary.m1MachineOnlyStaticExecutionReady === true &&
      summary.m1MachineOnlyStaticStartAuthorized === true &&
      summary.m1MachineFoundationExecutionAuthorized === false &&
      summary.m1StartAuthorized === false &&
      summary.m0ExitEffective === false &&
      summary.m0ExitReady === false &&
      summary.namedPersonCount === 0 &&
      summary.committedHourCommitmentCount === 0 &&
      summary.committedHoursPerWeekTotal === 0 &&
      summary.inheritedHourCommitmentCount === 0 &&
      summary.budgetGateApprovedCount === 0 &&
      summary.externalSpendAuthorized === false &&
      summary.procurementOrPaymentAuthorized === false &&
      summary.strictCompleteCount === 0 &&
      summary.published === false,
    "M1 authority, staffing, budget, or acceptance boundary drifted",
  );
  assertAllFalseExcept(
    report.acceptanceEffects,
    new Set([
      "m1MachineOnlyStaticExecutionAuthorized",
      "m1MachineOnlyStaticStartAuthorized",
    ]),
    "M1 acceptance effects",
  );
}

function validateWorkStudy(report, release) {
  const summary = report.summary;
  invariant(
    report.state ===
      "machine-only-work-study-runtime-trace-preparation-non-runnable" &&
      summary?.selectedMemberCount === 4 &&
      summary.preparationArtifactCount === 4 &&
      summary.requiredPhaseCount === 16 &&
      summary.actualMinuteValueCount === 0 &&
      summary.actualMinutesTotal === null &&
      summary.assignedPersonCount === 0 &&
      summary.runnableMemberCount === 0 &&
      summary.runtimeSessionCount === 0 &&
      summary.traceCaptureCount === 0 &&
      summary.authoritativeRuntimeEvidenceCount === 0 &&
      summary.completedPhaseCount === 0 &&
      summary.implementationStartedCount === 0 &&
      summary.strictCompleteCount === 0 &&
      summary.publishedCount === 0,
    "work-study counts or zero-execution boundary drifted",
  );
  invariant(
    Array.isArray(report.members) &&
      report.members.length === 4 &&
      report.members.every((member) =>
        release.members.some(({animationId}) =>
          animationId === member.animationId)),
    "work-study selected members drifted",
  );
  assertNulls(report.staffing, ["primaryPerson", "backupPerson"], "work-study staffing");
  assertNulls(report.sessions, ["operator", "sessionId"], "work-study session");
  assertNulls(
    report.budgetAndProcurement,
    [
      "personnelRateCeilingUsdPerHour",
      "procurementPaymentCycle",
      "totalBudgetEnvelopeUsd",
    ],
    "work-study budget",
  );
  invariant(
    report.executionGate?.runnable === false &&
      Array.isArray(report.executionGate.commands) &&
      report.executionGate.commands.length === 0,
    "work-study execution gate drifted",
  );
  assertAllFalseExcept(
    report.acceptanceEffects,
    new Set(["acceptanceNeutral"]),
    "work-study acceptance effects",
  );
}

function validateRuntime(report, release) {
  const summary = report.summary;
  invariant(
    report.evidenceState ===
      "57-member-post-m1-current-static-successor-empty-non-runnable" &&
      summary?.releaseMemberCount === 57 &&
      summary.successorArtifactCount === 57 &&
      summary.emptyWorksheetCount === 57 &&
      summary.nonRunnableCount === 57 &&
      summary.currentMigrationManifestCount === 57 &&
      summary.m1StaticReconciliationReceiptCount === 57 &&
      summary.currentScenarioInventoryCount === 57 &&
      summary.currentFrameDomainDispositionCount === 57 &&
      summary.currentCoverageV2Count === 57 &&
      summary.currentStrictReadinessCount === 57 &&
      summary.canonicalRootOnlyRequirementCount === 114 &&
      summary.canonicalRootOnlyFrameCount === 1220 &&
      summary.structurallyReachableChildTimelineCount === 1047 &&
      summary.evidenceBoundCompositeChildDispositionCount === 696 &&
      summary.unresolvedChildDispositionCount === 351 &&
      summary.excludedNotProvenTimelineCount === 185 &&
      summary.highRiskIndependentCandidateCount === 93,
    "runtime successor static counts drifted",
  );
  invariant(
    summary.structurallyReachableChildTimelineCount ===
      summary.evidenceBoundCompositeChildDispositionCount +
        summary.unresolvedChildDispositionCount,
    "runtime successor reachable child partition drifted",
  );
  for (const key of [
    "acceptedReviewCount",
    "authoritativeBaselineCount",
    "guiExecutionCount",
    "implementationAuthorizedCount",
    "namedOperatorCount",
    "publishedCount",
    "runtimeSessionCount",
    "strictCompleteCount",
  ]) {
    invariant(summary[key] === 0, `runtime successor promoted ${key}`);
  }
  assertOrderedMemberProjection(report.items, release, "runtime successor");
  invariant(
    report.items.every((item) =>
      item.namedOperatorCount === 0 &&
      item.runnable === false &&
      item.runtimeSessionCount === 0 &&
      item.worksheetState === "empty-non-runnable-planning-only"),
    "runtime successor member execution boundary drifted",
  );
  assertAllFalseExcept(
    report.acceptanceEffects,
    new Set(),
    "runtime successor acceptance effects",
  );
}

function validateAnimate(report, release) {
  const summary = report.summary;
  invariant(
    report.evidenceState ===
      "post-m1-metadata-only-no-animate-no-operator-no-authority" &&
      summary?.releaseMemberCount === 57 &&
      summary.successorArtifactCount === 57 &&
      summary.emptyWorksheetCount === 57 &&
      summary.nonRunnableCount === 57 &&
      summary.currentMigrationManifestCount === 57 &&
      summary.currentM1ReceiptCount === 57 &&
      summary.physicalSwfSourceCount === 57 &&
      summary.physicalFlaSourceCount === 49 &&
      summary.verifiedReadOnlyStagedFlaCount === 49 &&
      summary.flaBackedMemberCount === 49 &&
      summary.swfOnlySourceGapCount === 8 &&
      summary.authoringSourceGapCount === 8 &&
      summary.authoringAuditPendingCount === 49,
    "Animate successor static/source counts drifted",
  );
  for (const key of [
    "acceptedReviewCount",
    "authoringAuditCompleteCount",
    "authoringAuditReceiptCount",
    "conversionWarningAcknowledgementCount",
    "guiExecutionCount",
    "implementationAuthorizedCount",
    "namedOperatorCount",
    "ownerAcceptedCount",
    "publishedCount",
    "sessionCount",
    "strictCompleteCount",
  ]) {
    invariant(summary[key] === 0, `Animate successor promoted ${key}`);
  }
  invariant(
    report.sourceBindings?.currentAuthoringResultIndex?.status === "absent",
    "Animate successor current authoring result must remain absent",
  );
  assertOrderedMemberProjection(report.items, release, "Animate successor");
  invariant(
    report.items.every((item) =>
      item.authoringAuditComplete === false &&
      item.guiExecutionCount === 0 &&
      item.namedOperatorCount === 0 &&
      item.runnable === false &&
      item.sessionCount === 0),
    "Animate successor member execution boundary drifted",
  );
  assertAllFalseExcept(
    report.acceptanceEffects,
    new Set(),
    "Animate successor acceptance effects",
  );
}

function validateCoverage(report, release) {
  const coverage = report.currentCanonicalCoverage;
  const domains = report.frameDomainDisposition;
  const obligations = report.scenarioStaticObligations;
  invariant(
    report.state === "57-members-static-routed-runtime-authority-pending" &&
      coverage?.requirementCount === 114 &&
      coverage.pendingRequirementCount === 114 &&
      coverage.missingFrameCount === 1220 &&
      coverage.authoritativeBaselineCount === 0 &&
      coverage.fullFrameComparisonCount === 0 &&
      coverage.implementationCaptureCount === 0 &&
      coverage.traceSpecCount === 0 &&
      domains?.declaredRootCount === 57 &&
      domains.nestedDefinitionCount === 1232 &&
      domains.longerThanRootCount === 258 &&
      domains.excludedNotProvenCount === 185 &&
      domains.evidenceBoundCompositeChildCount === 696 &&
      domains.unresolvedChildCount === 351 &&
      domains.resolvedChildCount === 696 &&
      domains.highRiskIndependentCandidateCount === 93,
    "coverage/frame-domain counts drifted",
  );
  invariant(
    domains.nestedDefinitionCount ===
      domains.evidenceBoundCompositeChildCount +
        domains.unresolvedChildCount +
        domains.excludedNotProvenCount,
    "coverage nested definition partition drifted",
  );
  assertExactKeys(
    obligations,
    [
      "buttonTargetObligations",
      "conditionalBranchObligations",
      "correctWrongObligations",
      "courseRouteObligations",
      "dependencyFixtureObligations",
      "dragObligations",
      "glossaryAndHyperlinkObligations",
      "handlerBehaviorGroups",
      "inputObligations",
      "labeledStateObligations",
      "randomObligations",
      "replayCandidates",
      "sectionMenuObligations",
      "sideEffectObligations",
      "terminalCandidates",
      "timelineStateCoverage",
    ],
    "coverage obligations",
  );
  invariant(
    Object.entries(EXPECTED_SCENARIO_OBLIGATIONS)
      .every(([key, value]) => obligations[key] === value),
    "coverage obligation totals drifted",
  );
  assertOrderedMemberProjection(report.members, release, "coverage");
  invariant(
    report.members.every(({acceptanceAdvanced}) => acceptanceAdvanced === false) &&
      Object.values(report.protectedMutations || {}).every((value) => value === false) &&
      Object.values(report.execution || {}).every((value) => value === 0),
    "coverage execution or protected mutation advanced",
  );
  assertAllFalseExcept(
    report.acceptanceEffects,
    new Set(),
    "coverage acceptance effects",
  );
}

function validateRisk(report, release) {
  const summary = report.summary;
  invariant(
    report.state === "post-m1-static-risk-calibration-successor-non-runnable" &&
      summary?.selectedMemberCount === 8 &&
      summary.workStudyTargetCount === 4 &&
      summary.workStudyPreparationBoundCount === 4 &&
      summary.actualTimeValueCount === 0 &&
      summary.actualMinutesTotal === null &&
      summary.assignedPersonCount === 0 &&
      summary.commandCount === 0 &&
      summary.runnableMemberCount === 0 &&
      summary.runtimeSessionCount === 0,
    "risk successor selection, timing, or execution counts drifted",
  );
  for (const key of [
    "acceptanceCompleteCount",
    "completeMemberCount",
    "implementationCompleteCount",
    "publishedCount",
    "rendererSelectedCount",
    "runtimeCompleteCount",
    "strictCompleteCount",
  ]) {
    invariant(summary[key] === 0, `risk successor promoted ${key}`);
  }
  invariant(
    Array.isArray(report.members) &&
      report.members.length === 8 &&
      report.members.every((member) =>
        release.members.some(({animationId}) =>
          animationId === member.animationId)),
    "risk successor selected members drifted",
  );
  assertNulls(
    report.staffingAndSession,
    ["assignmentReceipt", "backupPerson", "operator", "primaryPerson", "sessionId"],
    "risk successor staffing/session",
  );
  assertNulls(
    report.budgetAndProcurement,
    [
      "personnelRateCeilingUsdPerHour",
      "procurementPaymentCycle",
      "totalBudgetEnvelopeUsd",
    ],
    "risk successor budget",
  );
  invariant(
    report.executionGate?.runnable === false &&
      Array.isArray(report.executionGate.commands) &&
      report.executionGate.commands.length === 0 &&
      report.historicalRiskCalibration?.bindingMode ===
        "immutable-historical-read-only" &&
      report.historicalRiskCalibration.historicalFilesModified === false &&
      report.historicalRiskCalibration.successorOnly === true,
    "risk successor execution or historical override boundary drifted",
  );
  assertAllFalseExcept(
    report.acceptanceEffects,
    new Set(["acceptanceNeutral"]),
    "risk successor acceptance effects",
  );
}

function validateRenderer(report, release) {
  const summary = report.summary;
  invariant(
    report.state === "renderer-neutral-source-static-implementation-planning-only" &&
      summary?.releaseMemberCount === 57 &&
      summary.pageCount === 56 &&
      summary.shellCount === 1 &&
      summary.memberWorkPackageCount === 399 &&
      summary.definitionCandidateCount === 9767 &&
      summary.canonicalStaticScriptCandidateCount === 2456 &&
      summary.dependencyCandidateCount === 6 &&
      summary.dependencyOccurrenceCount === 17 &&
      summary.routedDefinitionCandidateCount === 9767 &&
      summary.routedScriptCandidateCount === 2456 &&
      summary.routedDependencyCandidateCount === 6 &&
      summary.routedDependencyOccurrenceCount === 17 &&
      summary.rendererUndecidedCount === 57,
    "renderer-neutral candidate counts drifted",
  );
  for (const key of [
    "acceptanceCompleteCount",
    "canonicalAssetInventoryWriteCount",
    "canonicalCoverageWriteCount",
    "canonicalKeyframeWriteCount",
    "guiLaunchCount",
    "implementationAuthorizedCount",
    "implementationStartedCount",
    "publishedCount",
    "runtimeSessionCount",
    "strictCompleteCount",
  ]) {
    invariant(summary[key] === 0, `renderer-neutral queue promoted ${key}`);
  }
  assertOrderedMemberProjection(report.members, release, "renderer-neutral queue");
  invariant(
    report.members.every((member) =>
      member.renderer === "undecided" &&
      member.implementationAuthorized === false &&
      member.implementationStarted === false &&
      member.published === false &&
      member.strictComplete === false),
    "renderer-neutral member boundary drifted",
  );
  invariant(
    report.execution?.runnable === false &&
      Array.isArray(report.execution.commands) &&
      report.execution.commands.length === 0 &&
      Object.entries(report.execution)
        .filter(([key]) => !["runnable", "commands"].includes(key))
        .every(([, value]) => value === 0),
    "renderer-neutral execution boundary drifted",
  );
  invariant(
    report.exactReuseAnalysis?.reuseAuthorizedCount === 0,
    "renderer-neutral exact reuse was authorized",
  );
  assertAllFalseExcept(
    report.acceptanceEffects,
    new Set(),
    "renderer-neutral acceptance effects",
  );
}

function nullLeafPaths(value, prefix = "", output = []) {
  if (value === null) {
    output.push(prefix);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      nullLeafPaths(item, `${prefix}[${index}]`, output));
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      nullLeafPaths(item, prefix ? `${prefix}.${key}` : key, output);
    }
  }
  return output;
}

function validatePerSession(report, release) {
  const summary = report.summary;
  invariant(
    report.evidenceState ===
      "unsigned-empty-non-runnable-static-session-preparation-only" &&
      summary?.releaseMemberCount === 57 &&
      summary.activePageCount === 56 &&
      summary.shellCount === 1 &&
      summary.currentM1ReceiptCount === 57 &&
      summary.postM1RuntimeSuccessorCount === 57 &&
      summary.postM1AnimateSuccessorCount === 57 &&
      summary.currentCoverageV2Count === 57 &&
      summary.currentScenarioInventoryCount === 57 &&
      summary.currentStrictReadinessCount === 57 &&
      summary.flaBackedMemberCount === 49 &&
      summary.swfOnlyMemberCount === 8 &&
      summary.animateSessionTemplateCount === 49 &&
      summary.originalRuntimeSessionTemplateCount === 114 &&
      summary.englishRuntimeSessionTemplateCount === 57 &&
      summary.spanishRuntimeSessionTemplateCount === 57 &&
      summary.totalSessionTemplateCount === 163 &&
      summary.boundPendingCoverageFrameCount === 1220,
    "per-session preparation static/template counts drifted",
  );
  for (const key of [
    "namedHumanCount",
    "roleAssignmentCount",
    "authorizerCount",
    "signatureCount",
    "budgetApprovalCount",
    "procurementApprovalCount",
    "issuedSessionIdCount",
    "commandCount",
    "runnableSessionCount",
    "executedSessionCount",
    "guiExecutionCount",
    "actualOutputCount",
    "authoringAuditCompleteCount",
    "naturalRuntimeTraceCount",
    "authoritativeBaselineCount",
    "implementationAuthorizedCount",
    "acceptedReviewCount",
    "strictCompleteCount",
    "publishedCount",
  ]) {
    invariant(summary[key] === 0, `per-session preparation promoted ${key}`);
  }
  invariant(
    Array.isArray(report.originalRuntimeSessionTemplates) &&
      report.originalRuntimeSessionTemplates.length === 114 &&
      Array.isArray(report.animateSessionTemplates) &&
      report.animateSessionTemplates.length === 49,
    "per-session template inventory drifted",
  );
  const memberIds = new Set(release.members.map(({animationId}) => animationId));
  const templateText = JSON.stringify(report.originalRuntimeSessionTemplates);
  invariant(
    [...memberIds].every((animationId) => templateText.includes(animationId)),
    "per-session templates do not cover all release members",
  );
  invariant(
    nullLeafPaths(report.originalRuntimeSessionTemplates).length > 0,
    "per-session templates are not blank",
  );
  const allTemplates = [
    ...report.animateSessionTemplates,
    ...report.originalRuntimeSessionTemplates,
  ];
  invariant(
    allTemplates.every((template) =>
      template.preparationState ===
        "blank-static-template-only-unsigned-empty-non-runnable" &&
      template.roleAssignment?.roleId === null &&
      template.roleAssignment.assigneeFullName === null &&
      template.roleAssignment.backupAssigneeFullName === null &&
      template.roleAssignment.assignedByFullName === null &&
      template.roleAssignment.assignmentReceiptSha256 === null &&
      template.sessionAuthorization?.authorizationId === null &&
      template.sessionAuthorization.sessionId === null &&
      template.sessionAuthorization.nonce === null &&
      template.sessionAuthorization.authorizerFullName === null &&
      template.sessionAuthorization.authorizedAt === null &&
      template.sessionAuthorization.notBefore === null &&
      template.sessionAuthorization.notAfter === null &&
      template.sessionAuthorization.ttlSeconds === null &&
      template.sessionAuthorization.signatureEnvelope === null &&
      template.sessionAuthorization.state === "unsigned-empty-non-runnable" &&
      template.budget?.amount === null &&
      template.budget.currency === null &&
      template.budget.budgetId === null &&
      template.budget.approvedByFullName === null &&
      template.budget.approvedAt === null &&
      template.procurement?.procurementId === null &&
      template.procurement.purchaseOrderId === null &&
      template.procurement.vendor === null &&
      template.procurement.approvedByFullName === null &&
      template.procurement.approvedAt === null &&
      template.operator?.present === false &&
      template.operator.fullName === null &&
      template.operator.externalSubjectId === null &&
      template.operator.attestedAt === null &&
      template.operator.attestationSha256 === null &&
      template.operator.signatureEnvelope === null &&
      template.execution?.runnable === false &&
      template.execution.launchAuthorized === false &&
      template.execution.sessionExecuted === false &&
      template.execution.guiExecuted === false &&
      Array.isArray(template.commands) &&
      template.commands.length === 0 &&
      Array.isArray(template.stopConditions) &&
      template.stopConditions.length === 0 &&
      Array.isArray(template.actualOutputs) &&
      template.actualOutputs.length === 0 &&
      Object.values(template.acceptance || {}).every((value) => value === false)),
    "per-session person, budget, session, execution, or acceptance fields were filled",
  );
  invariant(
    nullLeafPaths(report.animateSessionTemplates).length === 4214 &&
      nullLeafPaths(report.originalRuntimeSessionTemplates).length === 8664,
    "per-session exact null-field inventory drifted",
  );
  invariant(
    Object.values(report.authorityBoundary || {}).every(
      (value) => value === false,
    ),
    "per-session authority boundary was promoted",
  );
}

function validateReview(report, release) {
  const summary = report.summary;
  invariant(
    summary?.releaseMemberCount === 57 &&
      summary.reviewKindsPerMember === 4 &&
      summary.memberReviewTemplateCount === 228 &&
      summary.releaseApprovalTemplateCount === 3 &&
      summary.totalUnsignedTemplateCount === 231,
    "review workflow template counts drifted",
  );
  for (const key of [
    "acceptedReviewCount",
    "assignedReviewerCount",
    "ownerFidelityAcceptanceCount",
    "publicationApprovalCount",
    "publishedCount",
    "signedReviewCount",
    "strictCompleteCount",
    "strictValidationApprovalCount",
  ]) {
    invariant(summary[key] === 0, `review workflow promoted ${key}`);
  }
  invariant(
    report.evidenceState ===
      "post-m1-unsigned-unassigned-non-runnable-review-preparation-only" &&
      Array.isArray(report.memberReviewBundles) &&
      report.memberReviewBundles.length === 57 &&
      report.memberReviewBundles.every((bundle, index) =>
        bundle.releaseOrdinal === release.members[index].ordinal &&
        bundle.animationId === release.members[index].animationId &&
        Array.isArray(bundle.reviews) &&
        bundle.reviews.length === 4) &&
      Array.isArray(report.releaseApprovalTemplates) &&
      report.releaseApprovalTemplates.length === 3,
    "review workflow template inventory drifted",
  );
  const memberIds = new Set(release.members.map(({animationId}) => animationId));
  invariant(
    report.memberReviewBundles.every((bundle) =>
      memberIds.has(bundle.animationId) &&
      bundle.reviews.every((template) =>
        template.animationId === bundle.animationId &&
        template.accepted === false &&
        template.automationMayComplete === false &&
        template.decision === null &&
        template.evidenceManifest === null &&
        template.evidenceManifestSha256 === null &&
        template.evidencePrerequisitesCurrent === false &&
        Array.isArray(template.findings) &&
        template.findings.length === 0 &&
        template.notes === null &&
        template.readyForHumanReview === false &&
        template.reviewedAt === null &&
        template.reviewerFullName === null &&
        template.reviewerSubjectId === null &&
        template.signatureEnvelope === null)),
    "review workflow contains a non-release member",
  );
  invariant(
    report.releaseApprovalTemplates.every((template) =>
      template.approved === false &&
      template.approvedAt === null &&
      template.approverFullName === null &&
      template.approverSubjectId === null &&
      template.automationMayComplete === false &&
      Array.isArray(template.conditions) &&
      template.conditions.length === 0 &&
      template.decision === null &&
      template.evidenceManifest === null &&
      template.evidenceManifestSha256 === null &&
      template.notes === null &&
      template.preconditionsSatisfied === false &&
      template.readyForDecision === false &&
      template.signatureEnvelope === null) &&
      nullLeafPaths(report.memberReviewBundles).length === 1824 &&
      nullLeafPaths(report.releaseApprovalTemplates).length === 24,
    "review workflow templates or exact null-field inventory drifted",
  );
  invariant(
    report.execution?.runnable === false &&
      Array.isArray(report.execution.commands) &&
      report.execution.commands.length === 0 &&
      Object.entries(report.execution)
        .filter(([key]) => !["runnable", "commands"].includes(key))
        .every(([, value]) => value === 0) &&
      Object.values(report.protectedMutationCounts || {})
        .every((value) => value === 0),
    "review workflow execution or protected mutation advanced",
  );
  assertAllFalseExcept(
    report.acceptanceEffects,
    new Set(),
    "review workflow acceptance effects",
  );
}

function validateUpstreamReport(report, input, release) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === input.reportType &&
      (report.releaseId === undefined ||
        report.releaseId === G5_L5_POST_M1_HANDOFF_RELEASE_ID),
    `${input.key}: report identity drifted`,
  );
  assertRelease57(report, input.key);
  assertReportFingerprint(report, input.key);
  invariant(
    (report.reportFingerprintSha256 ?? report.artifactFingerprintSha256) ===
      input.reportFingerprintSha256,
    `${input.key}: current report fingerprint drifted`,
  );
  switch (input.key) {
    case "workStudyPreparation":
      validateWorkStudy(report, release);
      break;
    case "postM1RuntimeAcquisition":
      validateRuntime(report, release);
      break;
    case "postM1AnimateAuthoring":
      validateAnimate(report, release);
      break;
    case "coverageTraceObligations":
      validateCoverage(report, release);
      break;
    case "postM1RiskCalibration":
      validateRisk(report, release);
      break;
    case "rendererNeutralWorkQueue":
      validateRenderer(report, release);
      break;
    case "perSessionAuthorizationPreparation":
      validatePerSession(report, release);
      break;
    case "reviewWorkflowPreparation":
      validateReview(report, release);
      break;
    default:
      throw new Error(`${input.key}: unsupported input`);
  }
}

function diagnosticMap(ledger) {
  return new Map(
    (ledger.diagnostics || []).map((diagnostic) => [
      diagnostic.animationId,
      diagnostic,
    ]),
  );
}

function sharedLedgerException(current, fresh, currentRecord) {
  const currentDiagnostics = diagnosticMap(current);
  const freshDiagnostics = diagnosticMap(fresh);
  const changedAnimationIds = [
    ...new Set([
      ...currentDiagnostics.keys(),
      ...freshDiagnostics.keys(),
    ]),
  ].filter((animationId) =>
    JSON.stringify(currentDiagnostics.get(animationId)) !==
      JSON.stringify(freshDiagnostics.get(animationId)))
    .sort();
  const g5L4 = changedAnimationIds.filter((animationId) =>
    animationId.includes("g05-l04"));
  const g5L5 = changedAnimationIds.filter((animationId) =>
    animationId.includes("g05-l05"));
  const other = changedAnimationIds.filter((animationId) =>
    !animationId.includes("g05-l04") &&
      !animationId.includes("g05-l05"));
  invariant(
    JSON.stringify(current.summary) === JSON.stringify(fresh.summary),
    "completion-ledger summary drifted beyond the recorded exception",
  );
  invariant(
    g5L5.length === 0 && other.length === 0 &&
      (changedAnimationIds.length === 0 ||
        (changedAnimationIds.length === 55 && g5L4.length === 55)),
    "completion-ledger drift is not the bounded shared G5 L4 exception",
  );
  const active = changedAnimationIds.length === 55;
  return {
    status: active
      ? "external-shared-worktree-validation-blocker"
      : "resolved-current",
    repositoryWideValidationBlocked: active,
    blockedCommand: active
      ? "npm run verify:g5:l5:m1-static-foundation"
      : null,
    blockedAt: active ? "npm run verify:workbench" : null,
    cause:
      active
        ? "checked-in completion ledger is stale only for 55 concurrently changed G5 L4 validator diagnostics"
        : null,
    currentLedger: descriptor(currentRecord),
    freshGeneratedMarker: fresh.generatedMarker,
    freshValidator: fresh.validator,
    changedDiagnosticCount: changedAnimationIds.length,
    changedG5L4DiagnosticCount: g5L4.length,
    changedG5L5DiagnosticCount: g5L5.length,
    changedOtherDiagnosticCount: other.length,
    changedAnimationIdSetSha256:
      sha256(Buffer.from(stableJson(changedAnimationIds))),
    firstChangedAnimationId: changedAnimationIds[0] ?? null,
    lastChangedAnimationId: changedAnimationIds.at(-1) ?? null,
    summaryUnchanged: true,
    g5L5TargetedChecksStillRequired: true,
    g5L5FailureInferred: false,
    ledgerRewriteAuthorized: false,
    ledgerWrittenByThisGenerator: false,
  };
}

function buildAggregateReport({
  generatorRecord,
  releaseRecord,
  m1Record,
  inputRecords,
  generatorRecords,
  release,
  m1,
  reports,
  ledgerException,
  bStageSourceBindings,
}) {
  const reportBindings = {};
  const generatorBindings = {};
  for (const input of G5_L5_POST_M1_HANDOFF_INPUTS) {
    reportBindings[input.key] = descriptor(inputRecords[input.key], {
      reportType: input.reportType,
      reportFingerprintSha256:
        reports[input.key].reportFingerprintSha256 ??
        reports[input.key].artifactFingerprintSha256,
    });
    generatorBindings[input.key] = descriptor(generatorRecords[input.key]);
  }
  const inputProjection = G5_L5_POST_M1_HANDOFF_INPUTS.map(({key}) => ({
    key,
    report: reportBindings[key],
    generator: generatorBindings[key],
  }));
  const workStudy = reports.workStudyPreparation;
  const runtime = reports.postM1RuntimeAcquisition;
  const animate = reports.postM1AnimateAuthoring;
  const coverage = reports.coverageTraceObligations;
  const risk = reports.postM1RiskCalibration;
  const renderer = reports.rendererNeutralWorkQueue;
  const sessions = reports.perSessionAuthorizationPreparation;
  const review = reports.reviewWorkflowPreparation;
  const perSessionNullCount =
    nullLeafPaths(sessions.originalRuntimeSessionTemplates).length +
    nullLeafPaths(sessions.animateSessionTemplates || []).length;
  const reviewNullCount =
    nullLeafPaths(review.memberReviewBundles).length +
    nullLeafPaths(review.releaseApprovalTemplates).length;
  const report = {
    schemaVersion: 1,
    reportType: "g5-l5-post-m1-machine-handoff",
    releaseId: G5_L5_POST_M1_HANDOFF_RELEASE_ID,
    title:
      "G5 L5 Add & Subtract Negative Numbers — Post-M1 Machine Handoff",
    state: G5_L5_POST_M1_HANDOFF_STATE,
    generatedBy: descriptor(generatorRecord, {
      deterministic: true,
      version: 1,
    }),
    release: {
      catalog: descriptor(releaseRecord),
      fingerprintSha256: G5_L5_POST_M1_HANDOFF_RELEASE_FINGERPRINT_SHA256,
      memberCount: 57,
      pageCount: 56,
      shellCount: 1,
      publicationMode: "atomic",
      titleDisplay: release.titleDisplay,
    },
    m1Foundation: {
      report: descriptor(m1Record, {
        reportType: m1.reportType,
        reportFingerprintSha256: m1.reportFingerprintSha256,
      }),
      boundary: M1_BOUNDARY,
      machineOnlyStaticStartAuthorized: true,
      machineOnlyStaticExecutionAuthorized: true,
      generalM1Authorized: false,
      implementationAuthorized: false,
      runtimeExecutionAuthorized: false,
      guiExecutionAuthorized: false,
      reviewAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      publicationAuthorized: false,
    },
    inputBindings: {
      requiredGroupCount: 8,
      currentGroupCount: 8,
      allGroupsCurrent: true,
      reports: reportBindings,
      generators: generatorBindings,
      inputSetSha256: sha256(Buffer.from(stableJson(inputProjection))),
      crossReportReleaseIdentityVerified: true,
      upstreamReportFingerprintsVerified: true,
      upstreamGeneratorHashesVerified: true,
      requiredTargetedCheckCommands: [...REQUIRED_TARGETED_CHECKS],
    },
    staticFrameDomainBStageBindings:
      structuredClone(bStageSourceBindings),
    historicalAuthorityBoundary: {
      boundary: HISTORICAL_BOUNDARY,
      historicalPaths: [...HISTORICAL_NON_AUTHORITY_PATHS],
      directAuthoritativeInputCount: 0,
      overrideAuthorized: false,
      currentSuccessorsControl: true,
      historicalFilesModifiedByThisGenerator: false,
    },
    staticFoundation: {
      definitionCandidateCount:
        renderer.summary.definitionCandidateCount,
      scriptCandidateCount:
        renderer.summary.canonicalStaticScriptCandidateCount,
      dependencyCandidateCount:
        renderer.summary.dependencyCandidateCount,
      dependencyOccurrenceCount:
        renderer.summary.dependencyOccurrenceCount,
      rendererNeutralMemberWorkPackageCount:
        renderer.summary.memberWorkPackageCount,
      rendererUndecidedCount: renderer.summary.rendererUndecidedCount,
      canonicalRootOnlyRequirementCount:
        runtime.summary.canonicalRootOnlyRequirementCount,
      canonicalRootOnlyFrameCount:
        runtime.summary.canonicalRootOnlyFrameCount,
      structurallyReachableChildTimelineCount:
        runtime.summary.structurallyReachableChildTimelineCount,
      evidenceBoundCompositeChildDispositionCount:
        runtime.summary.evidenceBoundCompositeChildDispositionCount,
      unresolvedChildDispositionCount:
        runtime.summary.unresolvedChildDispositionCount,
      excludedNotProvenTimelineCount:
        runtime.summary.excludedNotProvenTimelineCount,
      highRiskIndependentCandidateCount:
        runtime.summary.highRiskIndependentCandidateCount,
      scenarioStaticObligations: structuredClone(
        coverage.scenarioStaticObligations,
      ),
      workStudySelectedMemberCount:
        workStudy.summary.selectedMemberCount,
      riskCalibrationSelectedMemberCount:
        risk.summary.selectedMemberCount,
      physicalFlaSourceCount:
        animate.summary.physicalFlaSourceCount,
      swfOnlySourceGapCount:
        animate.summary.swfOnlySourceGapCount,
    },
    blankHumanBudgetAndSessionState: {
      m1NamedPersonCount: m1.summary.namedPersonCount,
      workStudyAssignedPersonCount:
        workStudy.summary.assignedPersonCount,
      riskAssignedPersonCount: risk.summary.assignedPersonCount,
      assignedReviewerCount:
        review.summary.assignedReviewerCount,
      runtimeNamedOperatorCount:
        runtime.summary.namedOperatorCount,
      animateNamedOperatorCount:
        animate.summary.namedOperatorCount,
      filledSessionIdCount:
        sessions.summary.issuedSessionIdCount,
      filledNonceCount: 0,
      filledTtlCount: 0,
      signatureEnvelopeCount:
        sessions.summary.signatureCount,
      runtimeSessionCount:
        runtime.summary.runtimeSessionCount,
      animateSessionCount: animate.summary.sessionCount,
      perSessionNullLeafCount: perSessionNullCount,
      reviewNullLeafCount: reviewNullCount,
      budgetApprovedCount: 0,
      budgetEnvelopeValueCount: 0,
      personnelRateValueCount: 0,
      procurementPaymentCycleValueCount: 0,
      actualTimeValueCount:
        workStudy.summary.actualMinuteValueCount +
        risk.summary.actualTimeValueCount,
      actualMinutesTotal: null,
      allRequiredPeopleBlank: true,
      allRequiredBudgetValuesBlank: true,
      allSessionAuthorizationValuesBlank: true,
    },
    executionAndAcceptance: {
      implementationAuthorizedCount: 0,
      implementationStartedCount: 0,
      runtimeSessionCount: 0,
      guiExecutionCount: 0,
      reviewAcceptedCount: 0,
      ownerAcceptanceCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
      runnableMemberCount: 0,
      commandCount: 0,
    },
    reviewAndAuthorizationPreparation: {
      perSessionTemplateCount:
        sessions.summary.totalSessionTemplateCount,
      memberReviewTemplateCount:
        review.summary.memberReviewTemplateCount,
      releaseApprovalTemplateCount:
        review.summary.releaseApprovalTemplateCount,
      totalUnsignedReviewAndApprovalTemplateCount:
        review.summary.totalUnsignedTemplateCount,
      signedSessionAuthorizationCount:
        sessions.summary.signatureCount,
      assignedReviewerCount:
        review.summary.assignedReviewerCount,
      signedReviewCount: review.summary.signedReviewCount,
      acceptedReviewCount: review.summary.acceptedReviewCount,
    },
    sharedWorktreeValidationException: ledgerException,
    targetedValidationPolicy: {
      repositoryWideValidationExceptionDoesNotWaiveG5L5Checks: true,
      allG5L5TargetedChecksRequired: true,
      ledgerRewriteAuthorized: false,
      runtimeOrGuiAllowed: false,
      actualMigrationAllowed: false,
    },
    acceptanceEffects: {
      animateAuditAccepted: false,
      audioAccepted: false,
      authoritativeOriginalRuntime: false,
      behaviorAccepted: false,
      currentJavaScriptCandidate: false,
      fidelityAccepted: false,
      fullFrameComparisonAccepted: false,
      humanReviewAccepted: false,
      implementationAuthorized: false,
      implementationStarted: false,
      independentEngineeringAccepted: false,
      ownerAccepted: false,
      publicationAuthorized: false,
      published: false,
      rendererSelected: false,
      rmseAccepted: false,
      runtimeExecutionAuthorized: false,
      strictComplete: false,
    },
    strictAcceptanceEffect: STRICT_ACCEPTANCE_EFFECT,
  };
  report.reportFingerprintSha256 = sha256(
    Buffer.from(stableJson(report)),
  );
  return report;
}

export function validateG5L5PostM1MachineHandoff(
  report,
  {expectedBindings = null} = {},
) {
  invariant(
    expectedBindings !== null,
    "trusted current input bindings are required to validate a handoff",
  );
  assertTrustedBindings(expectedBindings);
  assertExactKeys(
    report,
    [
      "schemaVersion",
      "reportType",
      "releaseId",
      "title",
      "state",
      "generatedBy",
      "release",
      "m1Foundation",
      "inputBindings",
      "staticFrameDomainBStageBindings",
      "historicalAuthorityBoundary",
      "staticFoundation",
      "blankHumanBudgetAndSessionState",
      "executionAndAcceptance",
      "reviewAndAuthorizationPreparation",
      "sharedWorktreeValidationException",
      "targetedValidationPolicy",
      "acceptanceEffects",
      "strictAcceptanceEffect",
      "reportFingerprintSha256",
    ],
    "post-M1 handoff",
  );
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l5-post-m1-machine-handoff" &&
      report.releaseId === G5_L5_POST_M1_HANDOFF_RELEASE_ID &&
      report.title ===
        "G5 L5 Add & Subtract Negative Numbers — Post-M1 Machine Handoff" &&
      report.state === G5_L5_POST_M1_HANDOFF_STATE,
    "post-M1 handoff identity drifted",
  );
  assertDescriptor(
    report.generatedBy,
    expectedBindings.generator,
    "post-M1 handoff generator",
    {
      path: G5_L5_POST_M1_HANDOFF_GENERATOR,
      extraKeys: ["deterministic", "version"],
    },
  );
  invariant(
    report.generatedBy.deterministic === true &&
      report.generatedBy.version === 1 &&
      report.generatedBy.path === expectedBindings.generator.path &&
      report.generatedBy.bytes === expectedBindings.generator.bytes &&
      report.generatedBy.sha256 === expectedBindings.generator.sha256,
    "post-M1 handoff generator binding drifted",
  );
  assertExactKeys(
    report.release,
    [
      "catalog",
      "fingerprintSha256",
      "memberCount",
      "pageCount",
      "shellCount",
      "publicationMode",
      "titleDisplay",
    ],
    "post-M1 handoff release",
  );
  assertDescriptor(
    report.release.catalog,
    expectedBindings.releaseCatalog,
    "post-M1 handoff release catalog",
    {path: RELEASE_CATALOG},
  );
  invariant(
    report.release?.memberCount === 57 &&
      report.release.pageCount === 56 &&
      report.release.shellCount === 1 &&
      report.release.publicationMode === "atomic" &&
      report.release.fingerprintSha256 ===
        G5_L5_POST_M1_HANDOFF_RELEASE_FINGERPRINT_SHA256 &&
      report.release.titleDisplay ===
        expectedBindings.releaseIdentity.titleDisplay,
    "post-M1 handoff release boundary drifted",
  );
  const m1 = report.m1Foundation;
  assertExactKeys(
    m1,
    [
      "report",
      "boundary",
      "machineOnlyStaticStartAuthorized",
      "machineOnlyStaticExecutionAuthorized",
      "generalM1Authorized",
      "implementationAuthorized",
      "runtimeExecutionAuthorized",
      "guiExecutionAuthorized",
      "reviewAccepted",
      "ownerAccepted",
      "strictComplete",
      "publicationAuthorized",
    ],
    "post-M1 handoff M1 foundation",
  );
  assertDescriptor(
    m1.report,
    expectedBindings.m1Report,
    "post-M1 handoff M1 report",
    {
      path: M1_REPORT,
      extraKeys: ["reportType", "reportFingerprintSha256"],
    },
  );
  invariant(
    m1?.boundary === M1_BOUNDARY &&
      m1.report.reportType === expectedBindings.m1Identity.reportType &&
      m1.report.reportFingerprintSha256 ===
        expectedBindings.m1Identity.reportFingerprintSha256 &&
      m1.machineOnlyStaticStartAuthorized === true &&
      m1.machineOnlyStaticExecutionAuthorized === true &&
      m1.generalM1Authorized === false &&
      m1.implementationAuthorized === false &&
      m1.runtimeExecutionAuthorized === false &&
      m1.guiExecutionAuthorized === false &&
      m1.reviewAccepted === false &&
      m1.ownerAccepted === false &&
      m1.strictComplete === false &&
      m1.publicationAuthorized === false,
    "post-M1 handoff widened M1 authority",
  );
  const bindings = report.inputBindings;
  assertExactKeys(
    bindings,
    [
      "requiredGroupCount",
      "currentGroupCount",
      "allGroupsCurrent",
      "reports",
      "generators",
      "inputSetSha256",
      "crossReportReleaseIdentityVerified",
      "upstreamReportFingerprintsVerified",
      "upstreamGeneratorHashesVerified",
      "requiredTargetedCheckCommands",
    ],
    "post-M1 handoff input bindings",
  );
  invariant(
    bindings?.requiredGroupCount === 8 &&
      bindings.currentGroupCount === 8 &&
      bindings.allGroupsCurrent === true &&
      bindings.crossReportReleaseIdentityVerified === true &&
      bindings.upstreamReportFingerprintsVerified === true &&
      bindings.upstreamGeneratorHashesVerified === true,
    "post-M1 handoff input currency drifted",
  );
  assertExactArray(
    bindings.requiredTargetedCheckCommands,
    REQUIRED_TARGETED_CHECKS,
    "post-M1 handoff targeted checks",
  );
  assertExactKeys(
    bindings.reports,
    G5_L5_POST_M1_HANDOFF_INPUTS.map(({key}) => key),
    "handoff report bindings",
  );
  assertExactKeys(
    bindings.generators,
    G5_L5_POST_M1_HANDOFF_INPUTS.map(({key}) => key),
    "handoff generator bindings",
  );
  const projection = G5_L5_POST_M1_HANDOFF_INPUTS.map(({key}) => ({
    key,
    report: bindings.reports[key],
    generator: bindings.generators[key],
  }));
  invariant(
    bindings.inputSetSha256 ===
      sha256(Buffer.from(stableJson(projection))),
    "post-M1 handoff input-set fingerprint drifted",
  );
  for (const input of G5_L5_POST_M1_HANDOFF_INPUTS) {
    const reportBinding = bindings.reports[input.key];
    const generatorBinding = bindings.generators[input.key];
    assertDescriptor(
      reportBinding,
      expectedBindings.reports[input.key],
      `${input.key}: aggregate report binding`,
      {
        path: input.reportPath,
        extraKeys: ["reportType", "reportFingerprintSha256"],
      },
    );
    assertDescriptor(
      generatorBinding,
      expectedBindings.generators[input.key],
      `${input.key}: aggregate generator binding`,
      {path: input.generatorPath},
    );
    invariant(
      reportBinding.reportType === input.reportType &&
        reportBinding.reportFingerprintSha256 ===
          input.reportFingerprintSha256,
      `${input.key}: aggregate source binding drifted`,
    );
  }
  assertBStageSourceBindings(
    report.staticFrameDomainBStageBindings,
    expectedBindings.bStage,
  );
  const coverageBStageReport =
    report.staticFrameDomainBStageBindings.stages.coverage.outputs.find(
      ({path: outputPath}) =>
        outputPath ===
          "reports/g5-l5-coverage-trace-obligation-matrix.json",
    );
  invariant(
    coverageBStageReport &&
      coverageBStageReport.path ===
        bindings.reports.coverageTraceObligations.path &&
      coverageBStageReport.bytes ===
        bindings.reports.coverageTraceObligations.bytes &&
      coverageBStageReport.sha256 ===
        bindings.reports.coverageTraceObligations.sha256 &&
      JSON.stringify(
        report.staticFrameDomainBStageBindings.stages.coverage.generator,
      ) === JSON.stringify(
        bindings.generators.coverageTraceObligations,
      ),
    "post-M1 B-stage coverage binding differs from the pinned current upstream group",
  );
  const historical = report.historicalAuthorityBoundary;
  assertExactKeys(
    historical,
    [
      "boundary",
      "historicalPaths",
      "directAuthoritativeInputCount",
      "overrideAuthorized",
      "currentSuccessorsControl",
      "historicalFilesModifiedByThisGenerator",
    ],
    "historical report authority boundary",
  );
  invariant(
    historical?.boundary === HISTORICAL_BOUNDARY &&
      JSON.stringify(historical.historicalPaths) ===
        JSON.stringify(HISTORICAL_NON_AUTHORITY_PATHS) &&
      historical.directAuthoritativeInputCount === 0 &&
      historical.overrideAuthorized === false &&
      historical.currentSuccessorsControl === true &&
      historical.historicalFilesModifiedByThisGenerator === false,
    "historical report authority was promoted",
  );
  const foundation = report.staticFoundation;
  assertExactKeys(
    foundation,
    [
      "definitionCandidateCount",
      "scriptCandidateCount",
      "dependencyCandidateCount",
      "dependencyOccurrenceCount",
      "rendererNeutralMemberWorkPackageCount",
      "rendererUndecidedCount",
      "canonicalRootOnlyRequirementCount",
      "canonicalRootOnlyFrameCount",
      "structurallyReachableChildTimelineCount",
      "evidenceBoundCompositeChildDispositionCount",
      "unresolvedChildDispositionCount",
      "excludedNotProvenTimelineCount",
      "highRiskIndependentCandidateCount",
      "scenarioStaticObligations",
      "workStudySelectedMemberCount",
      "riskCalibrationSelectedMemberCount",
      "physicalFlaSourceCount",
      "swfOnlySourceGapCount",
    ],
    "post-M1 static foundation",
  );
  invariant(
    foundation?.definitionCandidateCount === 9767 &&
      foundation.scriptCandidateCount === 2456 &&
      foundation.dependencyCandidateCount === 6 &&
      foundation.dependencyOccurrenceCount === 17 &&
      foundation.rendererNeutralMemberWorkPackageCount === 399 &&
      foundation.rendererUndecidedCount === 57 &&
      foundation.canonicalRootOnlyRequirementCount === 114 &&
      foundation.canonicalRootOnlyFrameCount === 1220 &&
      foundation.structurallyReachableChildTimelineCount === 1047 &&
      foundation.evidenceBoundCompositeChildDispositionCount === 696 &&
      foundation.unresolvedChildDispositionCount === 351 &&
      foundation.excludedNotProvenTimelineCount === 185 &&
      foundation.highRiskIndependentCandidateCount === 93 &&
      foundation.workStudySelectedMemberCount === 4 &&
      foundation.riskCalibrationSelectedMemberCount === 8 &&
      foundation.physicalFlaSourceCount === 49 &&
      foundation.swfOnlySourceGapCount === 8,
    "post-M1 static candidate totals drifted",
  );
  invariant(
    foundation.structurallyReachableChildTimelineCount ===
      foundation.evidenceBoundCompositeChildDispositionCount +
        foundation.unresolvedChildDispositionCount,
    "post-M1 static reachable child partition drifted",
  );
  assertExactKeys(
    foundation.scenarioStaticObligations,
    Object.keys(EXPECTED_SCENARIO_OBLIGATIONS),
    "post-M1 scenario static obligations",
  );
  invariant(
    Object.entries(EXPECTED_SCENARIO_OBLIGATIONS)
      .every(([key, value]) =>
        foundation.scenarioStaticObligations[key] === value),
    "post-M1 scenario obligation totals drifted",
  );
  const blank = report.blankHumanBudgetAndSessionState;
  assertExactKeys(
    blank,
    [
      "m1NamedPersonCount",
      "workStudyAssignedPersonCount",
      "riskAssignedPersonCount",
      "assignedReviewerCount",
      "runtimeNamedOperatorCount",
      "animateNamedOperatorCount",
      "filledSessionIdCount",
      "filledNonceCount",
      "filledTtlCount",
      "signatureEnvelopeCount",
      "runtimeSessionCount",
      "animateSessionCount",
      "perSessionNullLeafCount",
      "reviewNullLeafCount",
      "budgetApprovedCount",
      "budgetEnvelopeValueCount",
      "personnelRateValueCount",
      "procurementPaymentCycleValueCount",
      "actualTimeValueCount",
      "actualMinutesTotal",
      "allRequiredPeopleBlank",
      "allRequiredBudgetValuesBlank",
      "allSessionAuthorizationValuesBlank",
    ],
    "post-M1 blank human budget and session state",
  );
  for (const key of [
    "m1NamedPersonCount",
    "workStudyAssignedPersonCount",
    "riskAssignedPersonCount",
    "assignedReviewerCount",
    "runtimeNamedOperatorCount",
    "animateNamedOperatorCount",
    "filledSessionIdCount",
    "filledNonceCount",
    "filledTtlCount",
    "signatureEnvelopeCount",
    "runtimeSessionCount",
    "animateSessionCount",
    "budgetApprovedCount",
    "budgetEnvelopeValueCount",
    "personnelRateValueCount",
    "procurementPaymentCycleValueCount",
    "actualTimeValueCount",
  ]) {
    invariant(blank?.[key] === 0, `post-M1 handoff promoted ${key}`);
  }
  invariant(
    Number.isSafeInteger(blank.perSessionNullLeafCount) &&
      blank.perSessionNullLeafCount === 12878 &&
      Number.isSafeInteger(blank.reviewNullLeafCount) &&
      blank.reviewNullLeafCount === 1848 &&
      blank.actualMinutesTotal === null &&
      blank.allRequiredPeopleBlank === true &&
      blank.allRequiredBudgetValuesBlank === true &&
      blank.allSessionAuthorizationValuesBlank === true,
    "post-M1 blank human/budget/session state drifted",
  );
  assertExactKeys(
    report.executionAndAcceptance,
    EXECUTION_AND_ACCEPTANCE_KEYS,
    "post-M1 execution and acceptance",
  );
  invariant(
    EXECUTION_AND_ACCEPTANCE_KEYS.every(
      (key) => report.executionAndAcceptance[key] === 0,
    ),
    "post-M1 execution or acceptance count advanced",
  );
  const prepared = report.reviewAndAuthorizationPreparation;
  assertExactKeys(
    prepared,
    [
      "perSessionTemplateCount",
      "memberReviewTemplateCount",
      "releaseApprovalTemplateCount",
      "totalUnsignedReviewAndApprovalTemplateCount",
      "signedSessionAuthorizationCount",
      "assignedReviewerCount",
      "signedReviewCount",
      "acceptedReviewCount",
    ],
    "post-M1 review and authorization preparation",
  );
  invariant(
    prepared?.perSessionTemplateCount === 163 &&
      prepared.memberReviewTemplateCount === 228 &&
      prepared.releaseApprovalTemplateCount === 3 &&
      prepared.totalUnsignedReviewAndApprovalTemplateCount === 231 &&
      prepared.signedSessionAuthorizationCount === 0 &&
      prepared.assignedReviewerCount === 0 &&
      prepared.signedReviewCount === 0 &&
      prepared.acceptedReviewCount === 0,
    "post-M1 unsigned template or review boundary drifted",
  );
  const exception = report.sharedWorktreeValidationException;
  assertExactKeys(
    exception,
    [
      "status",
      "repositoryWideValidationBlocked",
      "blockedCommand",
      "blockedAt",
      "cause",
      "currentLedger",
      "freshGeneratedMarker",
      "freshValidator",
      "changedDiagnosticCount",
      "changedG5L4DiagnosticCount",
      "changedG5L5DiagnosticCount",
      "changedOtherDiagnosticCount",
      "changedAnimationIdSetSha256",
      "firstChangedAnimationId",
      "lastChangedAnimationId",
      "summaryUnchanged",
      "g5L5TargetedChecksStillRequired",
      "g5L5FailureInferred",
      "ledgerRewriteAuthorized",
      "ledgerWrittenByThisGenerator",
    ],
    "shared-worktree ledger exception",
  );
  assertDescriptor(
    exception.currentLedger,
    expectedBindings.completionLedger,
    "shared-worktree current completion ledger",
    {path: COMPLETION_LEDGER},
  );
  assertExactKeys(
    exception.freshValidator,
    ["path", "sha256", "version"],
    "fresh completion-ledger validator",
  );
  invariant(
    ["external-shared-worktree-validation-blocker", "resolved-current"]
      .includes(exception?.status) &&
      GENERATED_MARKER.test(exception.freshGeneratedMarker || "") &&
      exception.freshValidator.path ===
        "skills/flash-to-js/scripts/validate_migration.mjs" &&
      exception.freshValidator.version === "3.1.0" &&
      SHA256.test(exception.freshValidator.sha256 || "") &&
      exception.changedG5L5DiagnosticCount === 0 &&
      exception.changedOtherDiagnosticCount === 0 &&
      exception.summaryUnchanged === true &&
      exception.g5L5TargetedChecksStillRequired === true &&
      exception.g5L5FailureInferred === false &&
      exception.ledgerRewriteAuthorized === false &&
      exception.ledgerWrittenByThisGenerator === false &&
      SHA256.test(exception.changedAnimationIdSetSha256 || ""),
    "shared-worktree ledger exception drifted",
  );
  invariant(
    JSON.stringify(exception) ===
      JSON.stringify(expectedBindings.ledgerException),
    "shared-worktree ledger exception is not the trusted current projection",
  );
  if (exception.status === "external-shared-worktree-validation-blocker") {
    invariant(
      exception.repositoryWideValidationBlocked === true &&
        exception.changedDiagnosticCount === 55 &&
        exception.changedG5L4DiagnosticCount === 55 &&
        exception.changedAnimationIdSetSha256 ===
          ACTIVE_SHARED_LEDGER_CHANGED_SET_SHA256 &&
        exception.blockedCommand ===
          "npm run verify:g5:l5:m1-static-foundation" &&
        exception.blockedAt === "npm run verify:workbench",
      "shared G5 L4 ledger exception scope drifted",
    );
  } else {
    invariant(
      exception.repositoryWideValidationBlocked === false &&
        exception.changedDiagnosticCount === 0 &&
        exception.changedG5L4DiagnosticCount === 0 &&
        exception.changedAnimationIdSetSha256 === EMPTY_CHANGED_SET_SHA256 &&
        exception.blockedCommand === null &&
        exception.blockedAt === null,
      "resolved shared-ledger state drifted",
    );
  }
  assertExactKeys(
    report.targetedValidationPolicy,
    [
      "repositoryWideValidationExceptionDoesNotWaiveG5L5Checks",
      "allG5L5TargetedChecksRequired",
      "ledgerRewriteAuthorized",
      "runtimeOrGuiAllowed",
      "actualMigrationAllowed",
    ],
    "targeted validation policy",
  );
  invariant(
    report.targetedValidationPolicy
      ?.repositoryWideValidationExceptionDoesNotWaiveG5L5Checks === true &&
      report.targetedValidationPolicy.allG5L5TargetedChecksRequired === true &&
      report.targetedValidationPolicy.ledgerRewriteAuthorized === false &&
      report.targetedValidationPolicy.runtimeOrGuiAllowed === false &&
      report.targetedValidationPolicy.actualMigrationAllowed === false,
    "targeted validation policy drifted",
  );
  assertExactKeys(
    report.acceptanceEffects,
    ACCEPTANCE_EFFECT_KEYS,
    "post-M1 handoff acceptance effects",
  );
  assertAllFalseExcept(
    report.acceptanceEffects,
    new Set(),
    "post-M1 handoff acceptance effects",
  );
  invariant(
    report.strictAcceptanceEffect === STRICT_ACCEPTANCE_EFFECT,
    "post-M1 strict-acceptance effect drifted",
  );
  assertReportFingerprint(report, "post-M1 handoff");
  return true;
}

async function loadAndValidate(root) {
  const [
    generatorRecord,
    releaseRecord,
    m1Record,
    ledgerRecord,
  ] = await Promise.all([
    readHandoffInput(root, G5_L5_POST_M1_HANDOFF_GENERATOR, {
      label: "post-M1 handoff generator",
    }),
    readHandoffInput(root, RELEASE_CATALOG, {
      json: true,
      label: "release catalog",
    }),
    readHandoffInput(root, M1_REPORT, {
      json: true,
      label: "M1 machine foundation report",
    }),
    readHandoffInput(root, COMPLETION_LEDGER, {
      json: true,
      label: "completion ledger",
    }),
  ]);
  const release = orderedReleaseMembers(releaseRecord.document);
  const m1 = m1Record.document;
  validateM1(m1);
  const inputRecords = {};
  for (const input of G5_L5_POST_M1_HANDOFF_INPUTS) {
    inputRecords[input.key] = await readHandoffInput(
      root,
      input.reportPath,
      {json: true, label: `${input.key} report`},
    );
  }
  const generatorRecords = {};
  for (const input of G5_L5_POST_M1_HANDOFF_INPUTS) {
    generatorRecords[input.key] = await readHandoffInput(
      root,
      input.generatorPath,
      {label: `${input.key} generator`},
    );
  }
  const reports = Object.fromEntries(
    G5_L5_POST_M1_HANDOFF_INPUTS.map(({key}) => [
      key,
      inputRecords[key].document,
    ]),
  );
  for (const input of G5_L5_POST_M1_HANDOFF_INPUTS) {
    validateUpstreamReport(reports[input.key], input, release);
    const declared = generatorDeclaration(reports[input.key]);
    invariant(
      declared.path === input.generatorPath &&
        declared.sha256 === generatorRecords[input.key].sha256,
      `${input.key}: report is stale relative to its generator`,
    );
  }
  const {
    binding: bStageSourceBindings,
    records: bStageRecords,
  } = await buildBStageSourceBindings({
    root,
    release,
    releaseRecord,
    upstreamInputRecords: inputRecords,
    upstreamGeneratorRecords: generatorRecords,
  });
  const freshLedger = await generateCompletionLedger({
    migrationsRoot: path.join(root, "migrations"),
  });
  const ledgerException = sharedLedgerException(
    ledgerRecord.document,
    freshLedger,
    ledgerRecord,
  );
  const report = buildAggregateReport({
    generatorRecord,
    releaseRecord,
    m1Record,
    inputRecords,
    generatorRecords,
    release,
    m1,
    reports,
    ledgerException,
    bStageSourceBindings,
  });
  const expectedBindings = {
    generator: descriptor(generatorRecord),
    releaseCatalog: descriptor(releaseRecord),
    m1Report: descriptor(m1Record),
    completionLedger: descriptor(ledgerRecord),
    reports: Object.fromEntries(
      G5_L5_POST_M1_HANDOFF_INPUTS.map(({key}) => [
        key,
        descriptor(inputRecords[key]),
      ]),
    ),
    generators: Object.fromEntries(
      G5_L5_POST_M1_HANDOFF_INPUTS.map(({key}) => [
        key,
        descriptor(generatorRecords[key]),
      ]),
    ),
    releaseIdentity: {
      releaseId: release.releaseId,
      fingerprintSha256:
        G5_L5_POST_M1_HANDOFF_RELEASE_FINGERPRINT_SHA256,
      titleDisplay: release.titleDisplay,
      memberCount: release.expectedCounts.members,
      pageCount: release.expectedCounts.activeXmlReferencedPages,
      shellCount: release.expectedCounts.courseShells,
      publicationMode: release.publicationMode,
    },
    m1Identity: {
      releaseId: m1.releaseId,
      reportType: m1.reportType,
      reportFingerprintSha256: m1.reportFingerprintSha256,
    },
    ledgerException: structuredClone(ledgerException),
    bStage: structuredClone(bStageSourceBindings),
  };
  validateG5L5PostM1MachineHandoff(report, {expectedBindings});
  const allInputRecords = [
    generatorRecord,
    releaseRecord,
    m1Record,
    ledgerRecord,
    ...Object.values(inputRecords),
    ...Object.values(generatorRecords),
    ...bStageRecords,
  ];
  return {
    report,
    expectedBindings,
    inputRecords: [...new Map(
      allInputRecords.map((record) => [record.path, record]),
    ).values()],
  };
}

export function renderG5L5PostM1MachineHandoffMarkdown(
  report,
  {expectedBindings = null} = {},
) {
  validateG5L5PostM1MachineHandoff(report, {expectedBindings});
  const inputs = G5_L5_POST_M1_HANDOFF_INPUTS.map(({key, checkCommand}) => {
    const binding = report.inputBindings.reports[key];
    return `| \`${key}\` | \`${binding.path}\` | \`${binding.sha256}\` | \`${checkCommand}\` |`;
  }).join("\n");
  const obligations = Object.entries(
    report.staticFoundation.scenarioStaticObligations,
  ).map(([key, value]) => `| \`${key}\` | ${value} |`).join("\n");
  const bStageRows = G5_L5_B_STAGE_ORDER.map((key) => {
    const stage = report.staticFrameDomainBStageBindings.stages[key];
    return `| \`${key}\` | ${stage.outputCount} | \`${stage.outputSetSha256}\` | \`${stage.checkCommand}\` |`;
  }).join("\n");
  const exception = report.sharedWorktreeValidationException;
  return `<!-- generated-by: ${G5_L5_POST_M1_HANDOFF_GENERATOR} -->
# G5 L5 Post-M1 Machine Handoff

Release: \`${G5_L5_POST_M1_HANDOFF_RELEASE_ID}\` — **Add & Subtract Negative Numbers**

## Outcome

- Exact release scope: **57 = 56 pages + 1 Shell**; atomic publication.
- Current bound machine groups: **8/8**.
- Static definition / script candidates: **9,767 / 2,456**.
- Dependency candidates / occurrences: **6 / 17**.
- Root-only requirements / frames still requiring authoritative evidence: **114 / 1,220**.
- Structurally reachable child timelines: **1,047 = 696 exact proof-bound one-frame composites + 351 runtime-unresolved reachable children**.
- Nested definitions: **1,232 = 696 exact proof-bound one-frame composites + 351 runtime-unresolved reachable children + 185 not-proven/excluded definitions**.
- Renderer undecided: **57/57**.
- Implementation authorized / started: **0 / 0**.
- Runtime sessions / GUI executions: **0 / 0**.
- Accepted reviews / Owner acceptance: **0 / 0**.
- Strict complete / published: **0/57 / 0/57**.

> ${M1_BOUNDARY}

> ${HISTORICAL_BOUNDARY}

## Current machine input bindings

| Group | Current report | SHA-256 | Required targeted check |
| --- | --- | --- | --- |
${inputs}

Input-set SHA-256: \`${report.inputBindings.inputSetSha256}\`.

## B-stage source-static bindings

| Stage | Bound outputs | Output-set SHA-256 | Required package check |
| --- | ---: | --- | --- |
${bStageRows}

B-stage source-set SHA-256:
\`${report.staticFrameDomainBStageBindings.sourceSetSha256}\`.

The **696** entries are exact source-static, proof-bound one-frame composites
whose local playhead is classified with its parent. The **351** reachable
children remain unresolved until separately authorized original-runtime
evidence establishes their natural entry and behavior. The **185** remaining
definitions are recorded as not-proven/excluded from reachable routing.
Together these are the exact static partition
**1,232 = 696 + 351 + 185**; the reachable subset is
**1,047 = 696 + 351**.

This partition is not runtime execution evidence, a visual or audio fidelity
finding, an implementation-completeness claim, a human review, an Owner
acceptance, strict completion, or publication authority.

## Static coverage and trace obligations

| Obligation | Count |
| --- | ---: |
${obligations}

These counts are static candidates and obligations. They do not establish
natural runtime reachability, instructional equivalence, implementation
completeness, visual fidelity, audio fidelity, or behavioral fidelity.

## Blank people, budget, and session state

- Named/assigned operators, people, and reviewers: **0**.
- Filled session IDs, nonces, TTLs, and signature envelopes: **0**.
- Budget envelope, personnel-rate, and payment-cycle values: **0**.
- Actual timing values: **0**; actual minutes total: **null**.
- Unsigned review worksheets: **${report.reviewAndAuthorizationPreparation.memberReviewTemplateCount} member reviews + ${report.reviewAndAuthorizationPreparation.releaseApprovalTemplateCount} release approvals**.

## Shared-worktree repository validation exception

- Status: **${exception.status}**.
- Changed validator diagnostics: **${exception.changedDiagnosticCount}**.
- G5 L4 / G5 L5 / other: **${exception.changedG5L4DiagnosticCount} / ${exception.changedG5L5DiagnosticCount} / ${exception.changedOtherDiagnosticCount}**.
- Ledger rewritten: **false**.

${exception.repositoryWideValidationBlocked
  ? "The repository-wide M1 verification is currently blocked at `verify:workbench` by the read-only completion-ledger mismatch. The fresh in-memory comparison is confined to 55 concurrently changed G5 L4 diagnostics and contains 0 G5 L5 diagnostics. This is an external/shared-worktree blocker, not a G5 L5 pass or failure, and it waives no G5 L5 targeted check."
  : "The previously bounded shared-worktree completion-ledger exception is currently resolved. All G5 L5 targeted checks remain mandatory."}

## Acceptance boundary

Every implementation, runtime, GUI, review, Owner, strict-completion, and
publication effect remains **false/zero**. Strict acceptance effect: **none**.
No GUI, original runtime, Animate operation, or actual migration is authorized
or performed by this report.
`;
}

async function outputSnapshot(root, relativePath) {
  const absolutePath = resolveProjectPath(root, relativePath, "handoff output");
  await assertRealAncestors(root, absolutePath, `output ${relativePath}`);
  const information = await lstatOrNull(absolutePath, {bigint: true});
  if (!information) {
    return {
      path: relativePath,
      absolutePath,
      parent: path.dirname(absolutePath),
      exists: false,
      contents: null,
      bytes: 0,
      sha256: "",
      stat: null,
    };
  }
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n &&
      Number(information.mode & 0o777n) === 0o644,
    `${relativePath}: output must be one ordinary non-linked 0644 file`,
  );
  const record = await readHandoffInput(root, relativePath, {
    label: `output ${relativePath}`,
    requiredMode: 0o644,
  });
  return {
    ...record,
    parent: path.dirname(absolutePath),
    exists: true,
  };
}

function snapshotsEqual(left, right) {
  return left.exists === right.exists &&
    (!left.exists ||
      (left.bytes === right.bytes &&
        left.sha256 === right.sha256 &&
        sameIdentity(left.stat, right.stat)));
}

function assertOwnedOutput(snapshot) {
  if (!snapshot.exists) return;
  const text = snapshot.contents.toString("utf8");
  if (snapshot.path.endsWith(".md")) {
    invariant(
      text.startsWith(
        `<!-- generated-by: ${G5_L5_POST_M1_HANDOFF_GENERATOR} -->\n`,
      ),
      `refusing foreign Markdown output: ${snapshot.path}`,
    );
    return;
  }
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    throw new Error(`refusing invalid JSON output: ${snapshot.path}`);
  }
  invariant(
    document.generatedBy?.path === G5_L5_POST_M1_HANDOFF_GENERATOR,
    `refusing JSON output owned by another generator: ${snapshot.path}`,
  );
}

async function assertInputsUnchanged(root, records) {
  for (const record of records) {
    const current = await readHandoffInput(root, record.path, {
      label: `transaction input ${record.path}`,
    });
    invariant(
      current.bytes === record.bytes &&
        current.sha256 === record.sha256 &&
        sameIdentity(record.stat, current.stat),
      `${record.path}: input changed after preflight`,
    );
  }
}

function assertHandoffOutputSet(outputs) {
  invariant(Array.isArray(outputs), "handoff outputs must be an array");
  invariant(
    outputs.length === HANDOFF_OUTPUT_PATHS.length,
    "handoff transaction requires exactly two outputs",
  );
  assertExactArray(
    outputs.map((output) => output?.path),
    HANDOFF_OUTPUT_PATHS,
    "handoff transaction output allowlist",
  );
  outputs.forEach((output, index) => {
    assertExactKeys(
      output,
      ["path", "contents"],
      `handoff transaction output ${index + 1}`,
    );
    invariant(
      typeof output.contents === "string",
      `${output.path}: desired contents must be text`,
    );
    if (output.path === G5_L5_POST_M1_HANDOFF_JSON) {
      let document;
      try {
        document = JSON.parse(output.contents);
      } catch (error) {
        throw new Error(
          `${output.path}: desired JSON is invalid (${error.message})`,
        );
      }
      invariant(
        document.generatedBy?.path === G5_L5_POST_M1_HANDOFF_GENERATOR,
        `${output.path}: desired JSON is not owned by this generator`,
      );
    } else {
      invariant(
        output.contents.startsWith(
          `<!-- generated-by: ${G5_L5_POST_M1_HANDOFF_GENERATOR} -->\n`,
        ),
        `${output.path}: desired Markdown is not owned by this generator`,
      );
    }
  });
}

async function writeExclusive(candidate, contents) {
  const handle = await open(
    candidate,
    fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
    0o644,
  );
  try {
    await handle.writeFile(contents);
    await handle.chmod(0o644);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function removeOwned(candidate, expectedSha256) {
  const information = await lstatOrNull(candidate, {bigint: true});
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${candidate}: transaction file is not ordinary`,
  );
  invariant(
    sha256(await readFile(candidate)) === expectedSha256,
    `${candidate}: transaction bytes changed`,
  );
  await unlink(candidate);
}

async function rollback(root, transactions, originalError) {
  const errors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      if (transaction.committed) {
        const installed = await outputSnapshot(root, transaction.path);
        invariant(
          installed.exists &&
            installed.sha256 === transaction.desiredSha256 &&
            installed.bytes === transaction.desired.length,
          `${transaction.path}: committed output changed before rollback`,
        );
        await unlink(transaction.snapshot.absolutePath);
        transaction.committed = false;
      }
      if (transaction.displaced) {
        const occupied = await lstatOrNull(
          transaction.snapshot.absolutePath,
          {bigint: true},
        );
        invariant(
          occupied === null,
          `${transaction.path}: refusing to overwrite a path occupied during rollback`,
        );
        await rename(
          transaction.backupPath,
          transaction.snapshot.absolutePath,
        );
        transaction.displaced = false;
        const restored = await outputSnapshot(root, transaction.path);
        invariant(
          snapshotsEqual(transaction.snapshot, restored),
          `${transaction.path}: rollback restoration changed bytes or identity`,
        );
      }
      await removeOwned(transaction.stagePath, transaction.desiredSha256);
      if (transaction.snapshot.exists && !transaction.displaced) {
        await removeOwned(
          transaction.backupPath,
          transaction.snapshot.sha256,
        );
      }
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) {
    throw new AggregateError(
      [originalError, ...errors],
      `post-M1 handoff transaction failed with ${errors.length} rollback error(s)`,
    );
  }
  throw originalError;
}

export async function commitG5L5PostM1HandoffBatch({
  root,
  outputs,
  inputRecords = [],
  hooks = {},
}) {
  await assertRealProjectRoot(root);
  assertHandoffOutputSet(outputs);
  const transactionId =
    `${process.pid}-${Date.now()}-${randomBytes(8).toString("hex")}`;
  const transactions = [];
  try {
    for (const [index, output] of outputs.entries()) {
      const snapshot = await outputSnapshot(root, output.path);
      assertOwnedOutput(snapshot);
      const desired = Buffer.from(output.contents);
      const desiredSha256 = sha256(desired);
      const prefix =
        `.${path.basename(snapshot.absolutePath)}.${transactionId}.${index}`;
      const stagePath = path.join(snapshot.parent, `${prefix}.stage`);
      const backupPath = path.join(snapshot.parent, `${prefix}.backup`);
      await writeExclusive(stagePath, desired);
      transactions.push({
        ...output,
        snapshot,
        desired,
        desiredSha256,
        stagePath,
        backupPath,
        displaced: false,
        committed: false,
      });
    }
    await hooks.afterStage?.({outputs: transactions});
    await assertInputsUnchanged(root, inputRecords);
    for (const [index, transaction] of transactions.entries()) {
      const current = await outputSnapshot(root, transaction.path);
      invariant(
        snapshotsEqual(transaction.snapshot, current),
        `${transaction.path}: output changed after preflight`,
      );
      await assertInputsUnchanged(root, inputRecords);
      await hooks.beforeCommit?.({index, path: transaction.path});
      const afterHook = await outputSnapshot(root, transaction.path);
      invariant(
        snapshotsEqual(transaction.snapshot, afterHook),
        `${transaction.path}: output changed during commit CAS`,
      );
      if (transaction.snapshot.exists) {
        await rename(
          transaction.snapshot.absolutePath,
          transaction.backupPath,
        );
        transaction.displaced = true;
        const backupRelative = portable(
          path.relative(root, transaction.backupPath),
        );
        const displaced = await readHandoffInput(root, backupRelative, {
          label: `displaced output ${transaction.path}`,
          requiredMode: 0o644,
        });
        invariant(
          displaced.bytes === transaction.snapshot.bytes &&
            displaced.sha256 === transaction.snapshot.sha256 &&
            sameIdentity(displaced.stat, transaction.snapshot.stat),
          `${transaction.path}: displaced output failed compare-and-swap`,
        );
      }
      await hooks.beforeInstall?.({index, path: transaction.path});
      await link(
        transaction.stagePath,
        transaction.snapshot.absolutePath,
      );
      await unlink(transaction.stagePath);
      transaction.committed = true;
      const installed = await outputSnapshot(root, transaction.path);
      invariant(
        installed.exists &&
          installed.sha256 === transaction.desiredSha256 &&
          installed.bytes === transaction.desired.length,
        `${transaction.path}: committed output verification failed`,
      );
      await hooks.afterCommit?.({index, path: transaction.path});
    }
    await assertInputsUnchanged(root, inputRecords);
  } catch (error) {
    await rollback(root, transactions, error);
  }
  for (const transaction of transactions) {
    await removeOwned(transaction.stagePath, transaction.desiredSha256);
    if (transaction.snapshot.exists && transaction.displaced) {
      await removeOwned(
        transaction.backupPath,
        transaction.snapshot.sha256,
      );
      transaction.displaced = false;
    }
  }
}

async function ensureOutputDirectory(root) {
  const reports = resolveProjectPath(root, "reports", "reports directory");
  const current = await lstatOrNull(reports);
  if (!current) await mkdir(reports);
  const information = await lstat(reports);
  invariant(
    information.isDirectory() && !information.isSymbolicLink(),
    "reports output ancestor must be a real directory",
  );
}

export async function buildG5L5PostM1MachineHandoff(options = {}) {
  const root = path.resolve(options.projectRoot || defaultProjectRoot);
  const mode = options.mode;
  invariant(
    ["dry-run", "apply", "check"].includes(mode),
    "mode must be exactly one of dry-run, apply, or check",
  );
  const prepared = await loadAndValidate(root);
  const outputs = [
    {
      path: G5_L5_POST_M1_HANDOFF_JSON,
      contents: stableJson(prepared.report),
    },
    {
      path: G5_L5_POST_M1_HANDOFF_MARKDOWN,
      contents: renderG5L5PostM1MachineHandoffMarkdown(prepared.report, {
        expectedBindings: prepared.expectedBindings,
      }),
    },
  ];
  if (mode === "dry-run") {
    return {
      action: "planned",
      mode,
      report: prepared.report,
      expectedBindings: prepared.expectedBindings,
      outputs: outputs.map((output) => ({
        path: output.path,
        bytes: Buffer.byteLength(output.contents),
        sha256: sha256(Buffer.from(output.contents)),
      })),
    };
  }
  if (mode === "check") {
    for (const output of outputs) {
      const current = await outputSnapshot(root, output.path);
      const expected = Buffer.from(output.contents);
      invariant(
        current.exists &&
          current.bytes === expected.length &&
          current.sha256 === sha256(expected) &&
          current.contents.equals(expected),
        `${output.path}: checked output is stale`,
      );
    }
    return {
      action: "verified",
      mode,
      report: prepared.report,
      expectedBindings: prepared.expectedBindings,
      outputs: outputs.map((output) => ({
        path: output.path,
        bytes: Buffer.byteLength(output.contents),
        sha256: sha256(Buffer.from(output.contents)),
      })),
    };
  }
  await ensureOutputDirectory(root);
  await commitG5L5PostM1HandoffBatch({
    root,
    outputs,
    inputRecords: prepared.inputRecords,
    hooks: options.transactionHooks || {},
  });
  return {
    action: "applied",
    mode,
    report: prepared.report,
    expectedBindings: prepared.expectedBindings,
    outputs: outputs.map((output) => ({
      path: output.path,
      bytes: Buffer.byteLength(output.contents),
      sha256: sha256(Buffer.from(output.contents)),
    })),
  };
}

export function parseArguments(argv) {
  const modes = argv.filter((argument) =>
    ["--dry-run", "--apply", "--check"].includes(argument));
  invariant(
    argv.length === 1 && modes.length === 1,
    "usage: node scripts/build-g5-l5-post-m1-machine-handoff.mjs --dry-run|--apply|--check",
  );
  return {mode: modes[0].slice(2)};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await buildG5L5PostM1MachineHandoff(options);
  console.log(JSON.stringify({
    action: result.action,
    mode: result.mode,
    releaseId: result.report.releaseId,
    memberCount: result.report.release.memberCount,
    pageCount: result.report.release.pageCount,
    shellCount: result.report.release.shellCount,
    inputGroupCount: result.report.inputBindings.currentGroupCount,
    definitionCandidateCount:
      result.report.staticFoundation.definitionCandidateCount,
    scriptCandidateCount:
      result.report.staticFoundation.scriptCandidateCount,
    implementationStartedCount:
      result.report.executionAndAcceptance.implementationStartedCount,
    runtimeSessionCount:
      result.report.executionAndAcceptance.runtimeSessionCount,
    guiExecutionCount:
      result.report.executionAndAcceptance.guiExecutionCount,
    acceptedReviewCount:
      result.report.executionAndAcceptance.reviewAcceptedCount,
    strictCompleteCount:
      result.report.executionAndAcceptance.strictCompleteCount,
    publishedCount:
      result.report.executionAndAcceptance.publishedCount,
    sharedWorktreeValidationStatus:
      result.report.sharedWorktreeValidationException.status,
    outputs: result.outputs,
  }, null, 2));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === scriptPath
) {
  await main();
}
