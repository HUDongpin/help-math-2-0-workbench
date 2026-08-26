#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  validateG5L5M1StaticReconciliationReceipt,
} from "./adopt-g5-l5-m1-static-specification.mjs";
import {
  validateScenarioInventory,
} from "./build-course-scenario-inventories.mjs";
import {
  validateG5L5StaticStrictReadiness,
} from "./build-g5-l5-static-strict-readiness.mjs";
import {
  validateG5L5PostM1AnimateAuthoringReport,
  validateG5L5PostM1AnimateAuthoringSuccessor,
} from "./materialize-g5-l5-post-m1-animate-authoring-successors.mjs";
import {
  validateG5L5PostM1RuntimeAcquisitionReport,
  validateG5L5PostM1RuntimeAcquisitionSuccessor,
} from "./materialize-g5-l5-post-m1-runtime-acquisition-successors.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
export const REPORT_PREFIX =
  "reports/g5-l5-post-m1-per-session-authorization-preparation";

const GENERATOR_RELATIVE =
  "scripts/build-g5-l5-post-m1-per-session-authorization-preparation.mjs";
const RELEASE_RELATIVE = "catalog/lesson-releases.json";
const RUNTIME_AGGREGATE_RELATIVE =
  "reports/g5-l5-post-m1-runtime-acquisition-readiness.json";
const ANIMATE_AGGREGATE_RELATIVE =
  "reports/g5-l5-post-m1-animate-authoring-readiness.json";
const M1_RECEIPT_RELATIVE =
  "audit/machine/g5-l5-m1-static-reconciliation-receipt.json";
const RUNTIME_SUCCESSOR_RELATIVE =
  "audit/machine/g5-l5-post-m1-runtime-acquisition-successor.json";
const ANIMATE_SUCCESSOR_RELATIVE =
  "audit/machine/g5-l5-post-m1-animate-authoring-successor.json";
const COVERAGE_RELATIVE = "evidence/full-frame-coverage.json";
const SCENARIO_RELATIVE = "audit/scenario-inventory.json";
const STRICT_RELATIVE = "audit/strict-readiness.json";

const EXPECTED_MEMBER_COUNT = 57;
const EXPECTED_PAGE_COUNT = 56;
const EXPECTED_SHELL_COUNT = 1;
const EXPECTED_FLA_COUNT = 49;
const EXPECTED_SWF_ONLY_COUNT = 8;
const EXPECTED_RUNTIME_TEMPLATE_COUNT = 114;
const EXPECTED_TEMPLATE_COUNT = 163;
const EXPECTED_COVERAGE_FRAME_COUNT = 1220;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

const CONTROL_REQUIREMENTS = Object.freeze([
  Object.freeze({
    controlId: "CR-01",
    requirement:
      "Disable outbound networking at the host or disposable-session boundary and prove the deny state before launching the player.",
  }),
  Object.freeze({
    controlId: "CR-02",
    requirement:
      "Materialize one read-only, hash-allowlisted local lesson tree for the selected SWF and every permitted local dependency.",
  }),
  Object.freeze({
    controlId: "CR-03",
    requirement:
      "Use an isolated disposable runtime profile with an empty Flash SharedObject store and discard it after the one-item session.",
  }),
  Object.freeze({
    controlId: "CR-04",
    requirement:
      "Run one SWF in one fresh player process; abort on any unexpected dialog, browser navigation, host command, or unallowlisted resource request.",
  }),
  Object.freeze({
    controlId: "CR-05",
    requirement:
      "Record a connection/request audit proving that no legacy request reached a server and inventory every attempted local or blocked resource load.",
  }),
  Object.freeze({
    controlId: "CR-06",
    requirement:
      "Keep telemetry POSTs, javascript URLs, external browser opens, fscommand host effects, and persistent bookmark writes disabled.",
  }),
  Object.freeze({
    controlId: "CR-07",
    requirement:
      "Run a fresh storage-capacity preflight immediately before every bounded capture session.",
  }),
  Object.freeze({
    controlId: "CR-08",
    requirement:
      "Bind explicit owner approval, a named original-runtime operator, the exact host, launch path, and stop conditions before execution.",
  }),
]);

const ACCEPTANCE = Object.freeze({
  authoringAccepted: false,
  authoritativeOriginalRuntime: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  independentReviewAccepted: false,
  ownerFidelityAccepted: false,
  strictComplete: false,
  published: false,
});

const AUTHORITY_BOUNDARY = Object.freeze({
  namesAssigned: false,
  rolesAssigned: false,
  authorizersAssigned: false,
  signaturesPresent: false,
  budgetsApproved: false,
  procurementApproved: false,
  sessionIdsIssued: false,
  commandsProvided: false,
  runnableSessionsCreated: false,
  guiExecutionAuthorized: false,
  originalRuntimeExecutionAuthorized: false,
  animateExecutionAuthorized: false,
  runtimeEvidenceCreated: false,
  authoringEvidenceCreated: false,
  implementationAuthorized: false,
  acceptanceGranted: false,
  strictCompletionGranted: false,
  publicationAuthorized: false,
});

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

function withFingerprint(document) {
  return {
    ...document,
    reportFingerprintSha256: sha256(Buffer.from(stableJson(document))),
  };
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\") &&
      path.posix.normalize(relativePath) === relativePath,
    `${label}: path must be normalized, portable, and project-relative`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(isWithin(projectRoot, absolutePath), `${label}: path escapes root`);
  invariant(
    portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path normalization changed`,
  );
  return absolutePath;
}

function statIdentity(stat) {
  return {
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    nlink: stat.nlink,
    size: stat.size,
    mtimeNs: stat.mtimeNs,
    ctimeNs: stat.ctimeNs,
  };
}

function sameStatIdentity(left, right) {
  return left.dev === right.dev &&
    left.ino === right.ino &&
    left.mode === right.mode &&
    left.nlink === right.nlink &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs;
}

function permissionMode(stat) {
  return Number(stat.mode & 0o777n);
}

function modeString(stat) {
  return permissionMode(stat).toString(8).padStart(4, "0");
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function assertOrdinaryAncestorTree(projectRoot, absoluteTarget, label) {
  const rootReal = await realpath(projectRoot);
  const relativeParent = path.relative(projectRoot, path.dirname(absoluteTarget));
  const segments = relativeParent === "" ? [] : relativeParent.split(path.sep);
  let cursor = projectRoot;
  for (const segment of segments) {
    cursor = path.join(cursor, segment);
    const information = await lstat(cursor, {bigint: true}).catch((error) => {
      throw new Error(`${label}: ancestor unavailable (${error.message})`);
    });
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label}: ancestor must be an ordinary directory`,
    );
    invariant(
      isWithin(rootReal, await realpath(cursor)),
      `${label}: ancestor resolves outside root`,
    );
  }
}

async function readInput(projectRoot, relativePath, {
  json = false,
  expectedMode = 0o644,
  label = relativePath,
} = {}) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  await assertOrdinaryAncestorTree(projectRoot, absolutePath, label);
  const before = await lstat(absolutePath, {bigint: true}).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
      before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1n &&
      permissionMode(before) === expectedMode,
    `${label}: expected one ordinary mode ${expectedMode
      .toString(8)
      .padStart(4, "0")} non-linked file`,
  );
  const [contents, rootReal, fileReal] = await Promise.all([
    readFile(absolutePath),
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(rootReal, fileReal), `${label}: resolves outside root`);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    sameStatIdentity(statIdentity(before), statIdentity(after)),
    `${label}: changed while being read`,
  );
  let document;
  if (json) {
    try {
      document = JSON.parse(contents.toString("utf8"));
    } catch (error) {
      throw new Error(`${label}: invalid JSON (${error.message})`);
    }
  }
  return {
    absolutePath,
    path: relativePath,
    contents,
    document,
    sha256: sha256(contents),
    stat: statIdentity(after),
  };
}

function descriptor(record, extra = {}) {
  return {
    path: record.path,
    bytes: Number(record.stat.size),
    sha256: record.sha256,
    mode: modeString(record.stat),
    ...extra,
  };
}

function assertDescriptor(actual, expected, label) {
  invariant(
    actual?.path === expected.path &&
      actual.bytes === Number(expected.stat.size) &&
      actual.sha256 === expected.sha256 &&
      actual.mode === modeString(expected.stat),
    `${label}: descriptor drifted`,
  );
}

function assertBoundDescriptor(actual, record, label) {
  invariant(
    actual?.path === record.path &&
      actual.bytes === Number(record.stat.size) &&
      actual.sha256 === record.sha256,
    `${label}: bound descriptor does not match current bytes`,
  );
}

function selectRelease(document, {
  expectedMemberCount,
  expectedPageCount,
  expectedShellCount,
  expectedReleaseFingerprint,
}) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson release catalog is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 release must be unique");
  const release = matches[0];
  invariant(
    release.titleDisplay === "Add & Subtract Negative Numbers" &&
      release.grade === 5 &&
      release.lesson === 5 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === expectedPageCount &&
      release.expectedCounts?.courseShells === expectedShellCount &&
      release.expectedCounts?.members === expectedMemberCount &&
      Array.isArray(release.members) &&
      release.members.length === expectedMemberCount,
    "G5 L5 release identity or cardinality drifted",
  );
  invariant(
    sha256(Buffer.from(stableJson(release))) === expectedReleaseFingerprint,
    "G5 L5 release fingerprint drifted",
  );
  invariant(
    new Set(release.members.map(({animationId}) => animationId)).size ===
      expectedMemberCount,
    "G5 L5 release contains duplicate animation IDs",
  );
  for (const [index, member] of release.members.entries()) {
    invariant(
      member.ordinal === index + 1 &&
        SAFE_ID.test(member.animationId || "") &&
        member.assetId === `swf-${member.source?.sha256}` &&
        ["active-xml-referenced-page", "course-shell"].includes(
          member.releaseRole,
        ),
      `G5 L5 release member ${index + 1} identity drifted`,
    );
  }
  return release;
}

function memberPath(member, relativePath) {
  return `migrations/${member.animationId}/${relativePath}`;
}

function validateCoverage(document, member, runtimeSuccessor) {
  invariant(
    document?.schemaVersion === 2 &&
      document.animationId === member.animationId &&
      Array.isArray(document.requirements) &&
      document.requirements.length === 2,
    `${member.animationId}: coverage-v2 identity drifted`,
  );
  const requirements = new Map(
    document.requirements.map((requirement) => [
      requirement.language,
      requirement,
    ]),
  );
  invariant(
    requirements.size === 2 &&
      requirements.has("en") &&
      requirements.has("es"),
    `${member.animationId}: coverage must contain exactly EN and ES`,
  );
  let frameCount = 0;
  for (const language of ["en", "es"]) {
    const requirement = requirements.get(language);
    const first = requirement.requiredRange?.firstFrame;
    const last = requirement.requiredRange?.lastFrame;
    const expectedMissing = Array.from(
      {length: last - first + 1},
      (_, index) => first + index,
    );
    invariant(
      requirement.requirementId === `req-default-root-${language}` &&
        requirement.scenario === "default" &&
        requirement.frameDomainId === "root" &&
        requirement.traceId === `default-root-${language}` &&
        requirement.language === language &&
        requirement.seed === "0" &&
        Number.isSafeInteger(first) &&
        first === 1 &&
        Number.isSafeInteger(last) &&
        last >= first &&
        requirement.entryState?.kind === "initial-load" &&
        requirement.entryState.language === language &&
        SHA256_PATTERN.test(requirement.entryStateSha256 || "") &&
        requirement.baselineAuthorityRequirement ===
          "original-runtime-frame-accurate" &&
        requirement.baselineAuthority === "unresolved" &&
        requirement.status === "pending" &&
        requirement.capturedFrameCount === 0 &&
        JSON.stringify(requirement.missingFrames) ===
          JSON.stringify(expectedMissing) &&
        requirement.baselineCaptureManifest === "" &&
        requirement.baselineCaptureManifestSha256 === "" &&
        requirement.captureManifest === "" &&
        requirement.captureManifestSha256 === "" &&
        requirement.metricsFile === "" &&
        requirement.metricsSha256 === "",
      `${member.animationId}/${language}: coverage obligation was promoted or drifted`,
    );
    frameCount += last - first + 1;
  }
  invariant(
    runtimeSuccessor.currentStaticPlanningFacts?.rootFrameCount ===
        requirements.get("en").requiredRange.lastFrame &&
      runtimeSuccessor.currentStaticPlanningFacts
        .canonicalCoverageRequirementCount === 2 &&
      runtimeSuccessor.currentStaticPlanningFacts
        .canonicalCoverageFrameCount === frameCount,
    `${member.animationId}: runtime successor and coverage counts disagree`,
  );
  return {requirements, frameCount};
}

function validateCurrentBindings({
  member,
  m1,
  runtime,
  animate,
  coverage,
  scenario,
  strict,
}) {
  validateG5L5M1StaticReconciliationReceipt(m1.document, member);
  validateG5L5PostM1RuntimeAcquisitionSuccessor(runtime.document, member);
  validateG5L5PostM1AnimateAuthoringSuccessor(animate.document, member);
  validateScenarioInventory(scenario.document);
  validateG5L5StaticStrictReadiness(strict.document, member);

  assertBoundDescriptor(
    runtime.document.currentBindings?.m1StaticReconciliationReceipt,
    m1,
    `${member.animationId}: runtime successor M1`,
  );
  assertBoundDescriptor(
    runtime.document.currentBindings?.coverageV2,
    coverage,
    `${member.animationId}: runtime successor coverage`,
  );
  assertBoundDescriptor(
    runtime.document.currentBindings?.scenarioInventory,
    scenario,
    `${member.animationId}: runtime successor scenario`,
  );
  assertBoundDescriptor(
    runtime.document.currentBindings?.strictReadiness,
    strict,
    `${member.animationId}: runtime successor strict readiness`,
  );
  assertBoundDescriptor(
    animate.document.currentBindings?.m1StaticReconciliationReceipt,
    m1,
    `${member.animationId}: Animate successor M1`,
  );
  invariant(
    animate.document.currentBindings?.migrationManifest?.path ===
        runtime.document.currentBindings?.migrationManifest?.path &&
      animate.document.currentBindings?.migrationManifest?.bytes ===
        runtime.document.currentBindings?.migrationManifest?.bytes &&
      animate.document.currentBindings?.migrationManifest?.sha256 ===
        runtime.document.currentBindings?.migrationManifest?.sha256 &&
      m1.document.outputs?.migrationManifest?.after?.path ===
        runtime.document.currentBindings?.migrationManifest?.path &&
      m1.document.outputs?.migrationManifest?.after?.bytes ===
        runtime.document.currentBindings?.migrationManifest?.bytes &&
      m1.document.outputs?.migrationManifest?.after?.sha256 ===
        runtime.document.currentBindings?.migrationManifest?.sha256,
    `${member.animationId}: current post-M1 manifest lineage drifted`,
  );
  return validateCoverage(coverage.document, member, runtime.document);
}

function blankControls() {
  return CONTROL_REQUIREMENTS.map((control) => ({
    ...control,
    selectedMechanism: null,
    approvalReceiptSha256: null,
    verificationReceiptSha256: null,
    approved: false,
    verified: false,
  }));
}

function blankRoleAssignment() {
  return {
    roleId: null,
    assigneeFullName: null,
    backupAssigneeFullName: null,
    assignedByFullName: null,
    assignmentReceiptSha256: null,
  };
}

function blankAuthorization() {
  return {
    authorizationId: null,
    sessionId: null,
    nonce: null,
    authorizerFullName: null,
    authorizedAt: null,
    notBefore: null,
    notAfter: null,
    ttlSeconds: null,
    signatureEnvelope: null,
    oneTimeUseRequired: true,
    state: "unsigned-empty-non-runnable",
  };
}

function blankBudget() {
  return {
    amount: null,
    currency: null,
    budgetId: null,
    approvedByFullName: null,
    approvedAt: null,
  };
}

function blankProcurement() {
  return {
    procurementId: null,
    purchaseOrderId: null,
    vendor: null,
    approvedByFullName: null,
    approvedAt: null,
  };
}

function blankSchedule() {
  return {
    plannedStart: null,
    plannedEnd: null,
    actualStart: null,
    actualEnd: null,
  };
}

function blankOperator() {
  return {
    fullName: null,
    externalSubjectId: null,
    attestedAt: null,
    allowedActionIds: [],
    attestationSha256: null,
    signatureEnvelope: null,
    present: false,
  };
}

function blankEnvironment() {
  return {
    host: {
      exactHostIdentifier: null,
      hostIdSha256: null,
      approved: false,
    },
    profile: {
      path: null,
      manifestSha256: null,
      disposable: null,
      emptySharedObjectStoreVerified: false,
    },
    hostTree: {
      path: null,
      manifestSha256: null,
      readOnly: null,
      complete: false,
      missingDeclaredDependencies: [],
    },
    tool: {
      executablePath: null,
      executableSha256: null,
      version: null,
      verified: false,
    },
  };
}

function blankContainment() {
  return {
    controls: blankControls(),
    approvalManifestSha256: null,
    liveNoEgressPreflightSha256: null,
    liveCapacityPreflightSha256: null,
    approved: false,
    verified: false,
  };
}

function blankExecution() {
  return {
    runnable: false,
    launchAuthorized: false,
    sessionExecuted: false,
    guiExecuted: false,
    processClaimSha256: null,
    completionReceiptSha256: null,
    abortReceiptSha256: null,
    outputManifestSha256: null,
  };
}

function bindingSet(records) {
  return {
    m1StaticReconciliationReceipt: descriptor(records.m1, {
      receiptFingerprintSha256:
        records.m1.document.receiptFingerprintSha256,
    }),
    postM1RuntimeAcquisitionSuccessor: descriptor(records.runtime, {
      artifactFingerprintSha256:
        records.runtime.document.artifactFingerprintSha256,
    }),
    postM1AnimateAuthoringSuccessor: descriptor(records.animate, {
      artifactFingerprintSha256:
        records.animate.document.artifactFingerprintSha256,
    }),
    currentCoverageV2: descriptor(records.coverage),
    currentScenarioInventory: descriptor(records.scenario),
    currentStrictReadiness: descriptor(records.strict),
  };
}

function commonTemplate({
  templateType,
  templateId,
  member,
  language,
  records,
  traceIdentity,
}) {
  return {
    schemaVersion: 1,
    templateType,
    templateId,
    identity: {
      releaseId: RELEASE_ID,
      releaseOrdinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      language,
    },
    preparationState:
      "blank-static-template-only-unsigned-empty-non-runnable",
    preparationBindings: bindingSet(records),
    roleAssignment: blankRoleAssignment(),
    sessionAuthorization: blankAuthorization(),
    budget: blankBudget(),
    procurement: blankProcurement(),
    schedule: blankSchedule(),
    operator: blankOperator(),
    environment: blankEnvironment(),
    containment: blankContainment(),
    commands: [],
    stopConditions: [],
    traceIdentity,
    actualOutputs: [],
    execution: blankExecution(),
    acceptance: structuredClone(ACCEPTANCE),
  };
}

function animateTemplate(member, records) {
  const facts = records.runtime.document.currentStaticPlanningFacts;
  return commonTemplate({
    templateType:
      "g5-l5-post-m1-animate-authoring-audit-session-unsigned-template",
    templateId:
      `animate-${String(member.ordinal).padStart(2, "0")}-${member.animationId}`,
    member,
    language: null,
    records,
    traceIdentity: {
      animationId: member.animationId,
      requirementId: null,
      frameDomain: null,
      trace: null,
      entryStateSha256: null,
      scenario: null,
      language: null,
      seed: null,
      nativeStage: structuredClone(facts.nativeStage),
      fps: facts.fps,
      exactFrameRange: {
        start: null,
        end: null,
      },
      obligationState:
        "authoring-audit-session-unconfigured-no-runtime-trace-claim",
      naturalRuntimeTraceReceiptSha256: null,
    },
  });
}

function runtimeTemplate(member, records, requirement) {
  const facts = records.runtime.document.currentStaticPlanningFacts;
  const language = requirement.language;
  return commonTemplate({
    templateType:
      "g5-l5-post-m1-original-runtime-natural-trace-session-unsigned-template",
    templateId:
      `runtime-${String(member.ordinal).padStart(2, "0")}-${language}-${member.animationId}`,
    member,
    language,
    records,
    traceIdentity: {
      animationId: member.animationId,
      requirementId: requirement.requirementId,
      frameDomain: requirement.frameDomainId,
      trace: requirement.traceId,
      entryStateSha256: requirement.entryStateSha256,
      scenario: requirement.scenario,
      language,
      seed: requirement.seed,
      nativeStage: structuredClone(facts.nativeStage),
      fps: facts.fps,
      exactFrameRange: {
        start: requirement.requiredRange.firstFrame,
        end: requirement.requiredRange.lastFrame,
      },
      obligationState:
        "pending-static-coverage-obligation-not-observed-runtime",
      naturalRuntimeTraceReceiptSha256: null,
    },
  });
}

function allNull(object, keys, label) {
  for (const key of keys) {
    invariant(object?.[key] === null, `${label}: ${key} must remain null`);
  }
}

function allFalse(object, keys, label) {
  for (const key of keys) {
    invariant(object?.[key] === false, `${label}: ${key} must remain false`);
  }
}

function validateBlankTemplate(template, {
  member,
  language,
  expectedType,
  records,
}) {
  const label = template?.templateId || member.animationId;
  invariant(
    template?.schemaVersion === 1 &&
      template.templateType === expectedType &&
      typeof template.templateId === "string" &&
      template.identity?.releaseId === RELEASE_ID &&
      template.identity.releaseOrdinal === member.ordinal &&
      template.identity.animationId === member.animationId &&
      template.identity.assetId === member.assetId &&
      template.identity.language === language &&
      template.preparationState ===
        "blank-static-template-only-unsigned-empty-non-runnable",
    `${label}: template identity drifted`,
  );
  const bindings = template.preparationBindings;
  assertDescriptor(
    bindings?.m1StaticReconciliationReceipt,
    records.m1,
    `${label}: M1`,
  );
  assertDescriptor(
    bindings?.postM1RuntimeAcquisitionSuccessor,
    records.runtime,
    `${label}: runtime successor`,
  );
  assertDescriptor(
    bindings?.postM1AnimateAuthoringSuccessor,
    records.animate,
    `${label}: Animate successor`,
  );
  assertDescriptor(
    bindings?.currentCoverageV2,
    records.coverage,
    `${label}: coverage`,
  );
  assertDescriptor(
    bindings?.currentScenarioInventory,
    records.scenario,
    `${label}: scenario`,
  );
  assertDescriptor(
    bindings?.currentStrictReadiness,
    records.strict,
    `${label}: strict readiness`,
  );
  invariant(
    bindings.m1StaticReconciliationReceipt.receiptFingerprintSha256 ===
        records.m1.document.receiptFingerprintSha256 &&
      bindings.postM1RuntimeAcquisitionSuccessor
        .artifactFingerprintSha256 ===
        records.runtime.document.artifactFingerprintSha256 &&
      bindings.postM1AnimateAuthoringSuccessor
        .artifactFingerprintSha256 ===
        records.animate.document.artifactFingerprintSha256,
    `${label}: internal artifact fingerprint binding drifted`,
  );
  allNull(
    template.roleAssignment,
    [
      "roleId",
      "assigneeFullName",
      "backupAssigneeFullName",
      "assignedByFullName",
      "assignmentReceiptSha256",
    ],
    `${label}: role assignment`,
  );
  allNull(
    template.sessionAuthorization,
    [
      "authorizationId",
      "sessionId",
      "nonce",
      "authorizerFullName",
      "authorizedAt",
      "notBefore",
      "notAfter",
      "ttlSeconds",
      "signatureEnvelope",
    ],
    `${label}: session authorization`,
  );
  invariant(
    template.sessionAuthorization?.oneTimeUseRequired === true &&
      template.sessionAuthorization.state ===
        "unsigned-empty-non-runnable",
    `${label}: session authorization state drifted`,
  );
  allNull(
    template.budget,
    ["amount", "currency", "budgetId", "approvedByFullName", "approvedAt"],
    `${label}: budget`,
  );
  allNull(
    template.procurement,
    [
      "procurementId",
      "purchaseOrderId",
      "vendor",
      "approvedByFullName",
      "approvedAt",
    ],
    `${label}: procurement`,
  );
  allNull(
    template.schedule,
    ["plannedStart", "plannedEnd", "actualStart", "actualEnd"],
    `${label}: schedule`,
  );
  allNull(
    template.operator,
    [
      "fullName",
      "externalSubjectId",
      "attestedAt",
      "attestationSha256",
      "signatureEnvelope",
    ],
    `${label}: operator`,
  );
  invariant(
    template.operator?.present === false &&
      Array.isArray(template.operator.allowedActionIds) &&
      template.operator.allowedActionIds.length === 0,
    `${label}: operator declaration must remain empty`,
  );
  allNull(
    template.environment?.host,
    ["exactHostIdentifier", "hostIdSha256"],
    `${label}: host`,
  );
  invariant(template.environment?.host?.approved === false, `${label}: host approved`);
  allNull(
    template.environment?.profile,
    ["path", "manifestSha256", "disposable"],
    `${label}: profile`,
  );
  invariant(
    template.environment?.profile?.emptySharedObjectStoreVerified === false,
    `${label}: profile verified`,
  );
  allNull(
    template.environment?.hostTree,
    ["path", "manifestSha256", "readOnly"],
    `${label}: host tree`,
  );
  invariant(
    template.environment?.hostTree?.complete === false &&
      Array.isArray(template.environment.hostTree.missingDeclaredDependencies) &&
      template.environment.hostTree.missingDeclaredDependencies.length === 0,
    `${label}: host tree must remain unconfigured`,
  );
  allNull(
    template.environment?.tool,
    ["executablePath", "executableSha256", "version"],
    `${label}: tool`,
  );
  invariant(template.environment?.tool?.verified === false, `${label}: tool verified`);
  invariant(
    Array.isArray(template.containment?.controls) &&
      template.containment.controls.length === CONTROL_REQUIREMENTS.length,
    `${label}: containment control count drifted`,
  );
  for (const [index, control] of template.containment.controls.entries()) {
    const expected = CONTROL_REQUIREMENTS[index];
    invariant(
      control.controlId === expected.controlId &&
        control.requirement === expected.requirement &&
        control.selectedMechanism === null &&
        control.approvalReceiptSha256 === null &&
        control.verificationReceiptSha256 === null &&
        control.approved === false &&
        control.verified === false,
      `${label}: ${expected.controlId} was selected, approved, or verified`,
    );
  }
  allNull(
    template.containment,
    [
      "approvalManifestSha256",
      "liveNoEgressPreflightSha256",
      "liveCapacityPreflightSha256",
    ],
    `${label}: containment`,
  );
  allFalse(template.containment, ["approved", "verified"], `${label}: containment`);
  invariant(
    Array.isArray(template.commands) &&
      template.commands.length === 0 &&
      Array.isArray(template.stopConditions) &&
      template.stopConditions.length === 0 &&
      Array.isArray(template.actualOutputs) &&
      template.actualOutputs.length === 0,
    `${label}: commands, stop conditions, and actual outputs must remain empty`,
  );
  allFalse(
    template.execution,
    ["runnable", "launchAuthorized", "sessionExecuted", "guiExecuted"],
    `${label}: execution`,
  );
  allNull(
    template.execution,
    [
      "processClaimSha256",
      "completionReceiptSha256",
      "abortReceiptSha256",
      "outputManifestSha256",
    ],
    `${label}: execution`,
  );
  invariant(
    Object.keys(template.acceptance || {}).length ===
        Object.keys(ACCEPTANCE).length &&
      Object.entries(ACCEPTANCE).every(
        ([key, value]) => template.acceptance[key] === value,
      ),
    `${label}: acceptance boundary drifted`,
  );
}

export function validateG5L5PostM1PerSessionPreparation(
  report,
  {
    release,
    memberRecords,
    releaseRecord,
    generatorRecord,
    runtimeAggregateRecord,
    animateAggregateRecord,
    expectedMemberCount = EXPECTED_MEMBER_COUNT,
    expectedPageCount = EXPECTED_PAGE_COUNT,
    expectedShellCount = EXPECTED_SHELL_COUNT,
    expectedFlaCount = EXPECTED_FLA_COUNT,
    expectedSwfOnlyCount = EXPECTED_SWF_ONLY_COUNT,
    expectedRuntimeTemplateCount = EXPECTED_RUNTIME_TEMPLATE_COUNT,
    expectedTemplateCount = EXPECTED_TEMPLATE_COUNT,
    expectedCoverageFrameCount = EXPECTED_COVERAGE_FRAME_COUNT,
    expectedReleaseFingerprint = RELEASE_FINGERPRINT_SHA256,
  },
) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g5-l5-post-m1-per-session-authorization-preparation" &&
      report.evidenceState ===
        "unsigned-empty-non-runnable-static-session-preparation-only",
    "per-session preparation report identity drifted",
  );
  invariant(
    report.release?.releaseId === RELEASE_ID &&
      report.release.titleDisplay === release.titleDisplay &&
      report.release.publicationMode === "atomic" &&
      report.release.releaseFingerprintSha256 === expectedReleaseFingerprint &&
      report.release.memberCount === expectedMemberCount &&
      report.release.activePageCount === expectedPageCount &&
      report.release.shellCount === expectedShellCount,
    "per-session preparation release scope drifted",
  );
  assertDescriptor(
    report.sourceBindings?.releaseCatalog,
    releaseRecord,
    "release catalog",
  );
  assertDescriptor(
    report.sourceBindings?.generator,
    generatorRecord,
    "generator",
  );
  assertDescriptor(
    report.sourceBindings?.postM1RuntimeAggregate,
    runtimeAggregateRecord,
    "runtime aggregate",
  );
  assertDescriptor(
    report.sourceBindings?.postM1AnimateAggregate,
    animateAggregateRecord,
    "Animate aggregate",
  );
  const animateTemplates = report.animateSessionTemplates;
  const runtimeTemplates = report.originalRuntimeSessionTemplates;
  invariant(
    Array.isArray(animateTemplates) &&
      animateTemplates.length === expectedFlaCount &&
      Array.isArray(runtimeTemplates) &&
      runtimeTemplates.length === expectedRuntimeTemplateCount &&
      animateTemplates.length + runtimeTemplates.length ===
        expectedTemplateCount,
    "per-session template cardinality drifted",
  );
  const templateIds = [
    ...animateTemplates.map(({templateId}) => templateId),
    ...runtimeTemplates.map(({templateId}) => templateId),
  ];
  invariant(
    new Set(templateIds).size === expectedTemplateCount,
    "per-session template IDs must be unique",
  );
  const memberMap = new Map(release.members.map((member) => [
    member.animationId,
    member,
  ]));
  for (const template of animateTemplates) {
    const member = memberMap.get(template.identity?.animationId);
    const records = memberRecords.get(member?.animationId);
    invariant(member && records, `${template.templateId}: unknown member`);
    invariant(
      records.animate.document.sourceDisposition?.sourceKind === "fla+swf",
      `${template.templateId}: Animate template requires FLA-backed source`,
    );
    validateBlankTemplate(template, {
      member,
      language: null,
      expectedType:
        "g5-l5-post-m1-animate-authoring-audit-session-unsigned-template",
      records,
    });
    const trace = template.traceIdentity;
    allNull(
      trace,
      [
        "requirementId",
        "frameDomain",
        "trace",
        "entryStateSha256",
        "scenario",
        "language",
        "seed",
        "naturalRuntimeTraceReceiptSha256",
      ],
      `${template.templateId}: Animate trace`,
    );
    allNull(
      trace.exactFrameRange,
      ["start", "end"],
      `${template.templateId}: Animate frame range`,
    );
    invariant(
      trace.animationId === member.animationId &&
        trace.obligationState ===
          "authoring-audit-session-unconfigured-no-runtime-trace-claim",
      `${template.templateId}: Animate trace boundary drifted`,
    );
  }
  let coverageFrameCount = 0;
  for (const template of runtimeTemplates) {
    const member = memberMap.get(template.identity?.animationId);
    const records = memberRecords.get(member?.animationId);
    invariant(member && records, `${template.templateId}: unknown member`);
    const language = template.identity.language;
    invariant(["en", "es"].includes(language), `${template.templateId}: language`);
    validateBlankTemplate(template, {
      member,
      language,
      expectedType:
        "g5-l5-post-m1-original-runtime-natural-trace-session-unsigned-template",
      records,
    });
    const requirement = records.coverage.document.requirements.find(
      (candidate) => candidate.language === language,
    );
    const trace = template.traceIdentity;
    invariant(
      trace.animationId === member.animationId &&
        trace.requirementId === requirement.requirementId &&
        trace.frameDomain === requirement.frameDomainId &&
        trace.trace === requirement.traceId &&
        trace.entryStateSha256 === requirement.entryStateSha256 &&
        trace.scenario === requirement.scenario &&
        trace.language === language &&
        trace.seed === requirement.seed &&
        trace.exactFrameRange?.start ===
          requirement.requiredRange.firstFrame &&
        trace.exactFrameRange?.end ===
          requirement.requiredRange.lastFrame &&
        trace.obligationState ===
          "pending-static-coverage-obligation-not-observed-runtime" &&
        trace.naturalRuntimeTraceReceiptSha256 === null,
      `${template.templateId}: runtime obligation binding drifted`,
    );
    coverageFrameCount +=
      trace.exactFrameRange.end - trace.exactFrameRange.start + 1;
  }
  const runtimeByMember = new Map();
  for (const template of runtimeTemplates) {
    const list = runtimeByMember.get(template.identity.animationId) || [];
    list.push(template.identity.language);
    runtimeByMember.set(template.identity.animationId, list);
  }
  invariant(
    runtimeByMember.size === expectedMemberCount &&
      [...runtimeByMember.values()].every(
        (languages) =>
          languages.length === 2 &&
          languages.includes("en") &&
          languages.includes("es"),
      ) &&
      coverageFrameCount === expectedCoverageFrameCount,
    "runtime template EN/ES coverage cardinality drifted",
  );
  const summary = report.summary;
  const expectedCounts = {
    releaseMemberCount: expectedMemberCount,
    activePageCount: expectedPageCount,
    shellCount: expectedShellCount,
    currentM1ReceiptCount: expectedMemberCount,
    postM1RuntimeSuccessorCount: expectedMemberCount,
    postM1AnimateSuccessorCount: expectedMemberCount,
    currentCoverageV2Count: expectedMemberCount,
    currentScenarioInventoryCount: expectedMemberCount,
    currentStrictReadinessCount: expectedMemberCount,
    flaBackedMemberCount: expectedFlaCount,
    swfOnlyMemberCount: expectedSwfOnlyCount,
    animateSessionTemplateCount: expectedFlaCount,
    originalRuntimeSessionTemplateCount: expectedRuntimeTemplateCount,
    englishRuntimeSessionTemplateCount: expectedMemberCount,
    spanishRuntimeSessionTemplateCount: expectedMemberCount,
    totalSessionTemplateCount: expectedTemplateCount,
    boundPendingCoverageFrameCount: expectedCoverageFrameCount,
  };
  for (const [key, expected] of Object.entries(expectedCounts)) {
    invariant(summary?.[key] === expected, `summary ${key} drifted`);
  }
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
    invariant(summary?.[key] === 0, `summary ${key} must remain zero`);
  }
  invariant(
    Object.keys(report.authorityBoundary || {}).length ===
        Object.keys(AUTHORITY_BOUNDARY).length &&
      Object.entries(AUTHORITY_BOUNDARY).every(
        ([key, value]) => report.authorityBoundary[key] === value,
      ),
    "report authority boundary drifted",
  );
  const projected = structuredClone(report);
  delete projected.reportFingerprintSha256;
  invariant(
    SHA256_PATTERN.test(report.reportFingerprintSha256 || "") &&
      report.reportFingerprintSha256 ===
        sha256(Buffer.from(stableJson(projected))),
    "report fingerprint drifted",
  );
  return true;
}

function markdownFor(report) {
  const rows = [
    ...report.animateSessionTemplates,
    ...report.originalRuntimeSessionTemplates,
  ].map((template) => [
    template.templateId,
    template.templateType.includes("animate") ? "Animate" : "Original runtime",
    String(template.identity.releaseOrdinal),
    template.identity.animationId,
    template.identity.language ?? "—",
    template.traceIdentity.requirementId ?? "—",
    "unsigned / empty / non-runnable",
  ]);
  return [
    "# G5 L5 post-M1 per-session authorization preparation",
    "",
    `- Release: \`${report.release.releaseId}\``,
    `- Release fingerprint: \`${report.release.releaseFingerprintSha256}\``,
    `- Report fingerprint: \`${report.reportFingerprintSha256}\``,
    `- Members: **${report.summary.releaseMemberCount}** (56 pages + shell)`,
    `- FLA-backed Animate templates: **${report.summary.animateSessionTemplateCount}**`,
    `- Original-runtime natural-trace templates: **${report.summary.originalRuntimeSessionTemplateCount}** (EN 57 + ES 57)`,
    `- Total templates: **${report.summary.totalSessionTemplateCount}**`,
    `- Bound pending root-frame obligations: **${report.summary.boundPendingCoverageFrameCount}** frames`,
    "",
    "## Fail-closed boundary",
    "",
    "Every template is a static preparation record only. Human names, role assignments, authorizers, signatures, dates/times, budget and procurement approvals, session IDs, commands, stop conditions, environment selections, containment approvals, actual outputs, execution receipts, acceptance, strict completion, and publication authority remain empty or false.",
    "",
    "The EN/ES requirement, trace, entry-state, scenario, seed, frame-domain, and frame-range values below are existing pending coverage obligations. They are not observed natural-runtime traces and do not establish authoritative baselines.",
    "",
    "| Template | Kind | Ordinal | Animation | Language | Pending requirement | State |",
    "| --- | --- | ---: | --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## Counts that remain zero",
    "",
    "- Named humans, assigned roles, authorizers, signatures, budget approvals, procurement approvals, issued session IDs, and commands: **0**.",
    "- Runnable or executed sessions, GUI executions, actual outputs, completed authoring audits, and observed natural-runtime traces: **0**.",
    "- Authoritative baselines, implementation authorizations, accepted reviews, strict-complete members, and published members: **0**.",
    "",
    "No Adobe Animate, Flash Projector, Ruffle, browser, GUI, or legacy endpoint was launched by this generator. It writes only this aggregate JSON and Markdown preparation report.",
    "",
  ].join("\n");
}

async function readMemberRecords(projectRoot, member) {
  const [m1, runtime, animate, coverage, scenario, strict] = await Promise.all([
    readInput(projectRoot, memberPath(member, M1_RECEIPT_RELATIVE), {
      json: true,
      label: `${member.animationId}: current M1 receipt`,
    }),
    readInput(projectRoot, memberPath(member, RUNTIME_SUCCESSOR_RELATIVE), {
      json: true,
      label: `${member.animationId}: post-M1 runtime successor`,
    }),
    readInput(projectRoot, memberPath(member, ANIMATE_SUCCESSOR_RELATIVE), {
      json: true,
      label: `${member.animationId}: post-M1 Animate successor`,
    }),
    readInput(projectRoot, memberPath(member, COVERAGE_RELATIVE), {
      json: true,
      label: `${member.animationId}: current coverage-v2`,
    }),
    readInput(projectRoot, memberPath(member, SCENARIO_RELATIVE), {
      json: true,
      expectedMode: 0o600,
      label: `${member.animationId}: current scenario inventory`,
    }),
    readInput(projectRoot, memberPath(member, STRICT_RELATIVE), {
      json: true,
      label: `${member.animationId}: current strict readiness`,
    }),
  ]);
  return {m1, runtime, animate, coverage, scenario, strict};
}

async function outputSnapshot(projectRoot, relativePath) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, relativePath);
  await assertOrdinaryAncestorTree(projectRoot, absolutePath, relativePath);
  const stat = await lstatOrNull(absolutePath);
  if (!stat) {
    return {exists: false, absolutePath, path: relativePath};
  }
  invariant(
    stat.isFile() &&
      !stat.isSymbolicLink() &&
      stat.nlink === 1n &&
      permissionMode(stat) === 0o644,
    `${relativePath}: managed output must be one ordinary mode 0644 file`,
  );
  const contents = await readFile(absolutePath);
  return {
    exists: true,
    absolutePath,
    path: relativePath,
    contents,
    sha256: sha256(contents),
    stat: statIdentity(await lstat(absolutePath, {bigint: true})),
  };
}

function sameOutputSnapshot(left, right) {
  if (left.exists !== right.exists) return false;
  if (!left.exists) return true;
  return left.sha256 === right.sha256 &&
    sameStatIdentity(left.stat, right.stat);
}

async function assertInputsUnchanged(inputs) {
  for (const input of inputs) {
    const stat = await lstat(input.absolutePath, {bigint: true});
    invariant(
      stat.isFile() &&
        !stat.isSymbolicLink() &&
        stat.nlink === 1n &&
        permissionMode(stat) === permissionMode(input.stat) &&
        sameStatIdentity(input.stat, statIdentity(stat)) &&
        sha256(await readFile(input.absolutePath)) === input.sha256,
      `${input.path}: input changed before commit`,
    );
  }
}

async function removeOwned(candidate, expectedSha256) {
  if (!candidate) return;
  const stat = await lstatOrNull(candidate);
  if (!stat) return;
  invariant(
    stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1n,
    `${candidate}: transaction file is not ordinary`,
  );
  invariant(
    sha256(await readFile(candidate)) === expectedSha256,
    `${candidate}: refusing to remove changed transaction bytes`,
  );
  await unlink(candidate);
}

async function prepareTransaction(output, batchId) {
  const snapshot = output.snapshot;
  const suffix = randomBytes(12).toString("hex");
  const stagePath = `${snapshot.absolutePath}.${batchId}.${suffix}.stage`;
  const backupPath = `${snapshot.absolutePath}.${batchId}.${suffix}.backup`;
  await writeFile(stagePath, output.bytes, {flag: "wx", mode: 0o600});
  await chmod(stagePath, 0o644);
  const stageStat = await lstat(stagePath, {bigint: true});
  invariant(
    stageStat.isFile() &&
      !stageStat.isSymbolicLink() &&
      stageStat.nlink === 1n &&
      permissionMode(stageStat) === 0o644 &&
      sha256(await readFile(stagePath)) === output.sha256,
    `${output.relativePath}: staged bytes or mode drifted`,
  );
  return {
    ...output,
    stagePath,
    backupPath,
    committed: false,
    backedUp: false,
  };
}

async function rollback(transactions, originalError) {
  const rollbackErrors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      if (transaction.committed) {
        invariant(
          sha256(await readFile(transaction.snapshot.absolutePath)) ===
            transaction.sha256,
          `${transaction.relativePath}: committed output changed before rollback`,
        );
        if (transaction.snapshot.exists) {
          await rename(
            transaction.backupPath,
            transaction.snapshot.absolutePath,
          );
          transaction.backedUp = false;
        } else {
          await unlink(transaction.snapshot.absolutePath);
        }
      } else if (transaction.backedUp) {
        await rename(
          transaction.backupPath,
          transaction.snapshot.absolutePath,
        );
        transaction.backedUp = false;
      }
      await removeOwned(transaction.stagePath, transaction.sha256);
      if (transaction.snapshot.exists && transaction.backedUp) {
        await removeOwned(
          transaction.backupPath,
          transaction.snapshot.sha256,
        );
      }
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  if (rollbackErrors.length) {
    throw new AggregateError(
      [originalError, ...rollbackErrors],
      "per-session preparation transaction and rollback failed",
    );
  }
  throw originalError;
}

async function commitOutputs(
  projectRoot,
  inputs,
  outputs,
  transactionHooks = {},
) {
  const batchId = `g5l5-session-prep-${process.pid}`;
  const transactions = [];
  try {
    for (const output of outputs) {
      transactions.push(await prepareTransaction(output, batchId));
    }
    await transactionHooks.afterStage?.({transactions});
    await assertInputsUnchanged(inputs);
    for (const [index, transaction] of transactions.entries()) {
      const current = await outputSnapshot(
        projectRoot,
        transaction.relativePath,
      );
      invariant(
        sameOutputSnapshot(transaction.snapshot, current),
        `${transaction.relativePath}: output changed before commit`,
      );
      await transactionHooks.beforeCommit?.({
        index,
        relativePath: transaction.relativePath,
      });
      await assertInputsUnchanged(inputs);
      if (transaction.snapshot.exists) {
        await rename(
          transaction.snapshot.absolutePath,
          transaction.backupPath,
        );
        transaction.backedUp = true;
        await rename(
          transaction.stagePath,
          transaction.snapshot.absolutePath,
        );
      } else {
        await link(
          transaction.stagePath,
          transaction.snapshot.absolutePath,
        );
        await unlink(transaction.stagePath);
      }
      transaction.stagePath = null;
      transaction.committed = true;
      const committed = await lstat(
        transaction.snapshot.absolutePath,
        {bigint: true},
      );
      invariant(
        committed.isFile() &&
          !committed.isSymbolicLink() &&
          committed.nlink === 1n &&
          permissionMode(committed) === 0o644 &&
          sha256(await readFile(transaction.snapshot.absolutePath)) ===
            transaction.sha256,
        `${transaction.relativePath}: committed bytes or mode drifted`,
      );
      await transactionHooks.afterCommit?.({
        index,
        relativePath: transaction.relativePath,
      });
    }
  } catch (error) {
    await rollback(transactions, error);
  }
  for (const transaction of transactions) {
    if (transaction.snapshot.exists && transaction.backedUp) {
      await removeOwned(
        transaction.backupPath,
        transaction.snapshot.sha256,
      );
    }
    await removeOwned(transaction.stagePath, transaction.sha256);
  }
}

export async function buildG5L5PostM1PerSessionPreparation({
  projectRoot = DEFAULT_PROJECT_ROOT,
  mode = "dry-run",
  expectedMemberCount = EXPECTED_MEMBER_COUNT,
  expectedPageCount = EXPECTED_PAGE_COUNT,
  expectedShellCount = EXPECTED_SHELL_COUNT,
  expectedFlaCount = EXPECTED_FLA_COUNT,
  expectedSwfOnlyCount = EXPECTED_SWF_ONLY_COUNT,
  expectedRuntimeTemplateCount = EXPECTED_RUNTIME_TEMPLATE_COUNT,
  expectedTemplateCount = EXPECTED_TEMPLATE_COUNT,
  expectedCoverageFrameCount = EXPECTED_COVERAGE_FRAME_COUNT,
  expectedReleaseFingerprint = RELEASE_FINGERPRINT_SHA256,
  transactionHooks = {},
} = {}) {
  invariant(["dry-run", "apply", "check"].includes(mode), "invalid mode");
  invariant(
    expectedPageCount + expectedShellCount === expectedMemberCount &&
      expectedFlaCount + expectedSwfOnlyCount === expectedMemberCount &&
      expectedRuntimeTemplateCount === expectedMemberCount * 2 &&
      expectedTemplateCount ===
        expectedFlaCount + expectedRuntimeTemplateCount &&
      SHA256_PATTERN.test(expectedReleaseFingerprint || ""),
    "expected counts or release fingerprint are inconsistent",
  );
  const root = await realpath(path.resolve(projectRoot));
  const [
    releaseRecord,
    generatorRecord,
    runtimeAggregateRecord,
    animateAggregateRecord,
  ] = await Promise.all([
    readInput(root, RELEASE_RELATIVE, {
      json: true,
      label: "G5 L5 release catalog",
    }),
    readInput(root, GENERATOR_RELATIVE, {
      label: "per-session preparation generator",
    }),
    readInput(root, RUNTIME_AGGREGATE_RELATIVE, {
      json: true,
      label: "post-M1 runtime aggregate",
    }),
    readInput(root, ANIMATE_AGGREGATE_RELATIVE, {
      json: true,
      label: "post-M1 Animate aggregate",
    }),
  ]);
  const release = selectRelease(releaseRecord.document, {
    expectedMemberCount,
    expectedPageCount,
    expectedShellCount,
    expectedReleaseFingerprint,
  });
  validateG5L5PostM1RuntimeAcquisitionReport(
    runtimeAggregateRecord.document,
    release,
  );
  validateG5L5PostM1AnimateAuthoringReport(
    animateAggregateRecord.document,
    release,
  );

  const memberRecords = new Map();
  const inputs = [
    releaseRecord,
    generatorRecord,
    runtimeAggregateRecord,
    animateAggregateRecord,
  ];
  let coverageFrameCount = 0;
  let flaCount = 0;
  for (const member of release.members) {
    const records = await readMemberRecords(root, member);
    const coverageFacts = validateCurrentBindings({member, ...records});
    memberRecords.set(member.animationId, records);
    inputs.push(...Object.values(records));
    coverageFrameCount += coverageFacts.frameCount;
    if (
      records.animate.document.sourceDisposition.sourceKind === "fla+swf"
    ) {
      flaCount += 1;
    }
  }
  invariant(
    flaCount === expectedFlaCount &&
      expectedMemberCount - flaCount === expectedSwfOnlyCount &&
      coverageFrameCount === expectedCoverageFrameCount,
    "current FLA or coverage cardinality drifted",
  );

  const animateSessionTemplates = [];
  const originalRuntimeSessionTemplates = [];
  for (const member of release.members) {
    const records = memberRecords.get(member.animationId);
    if (
      records.animate.document.sourceDisposition.sourceKind === "fla+swf"
    ) {
      animateSessionTemplates.push(animateTemplate(member, records));
    }
    for (const language of ["en", "es"]) {
      const requirement = records.coverage.document.requirements.find(
        (candidate) => candidate.language === language,
      );
      originalRuntimeSessionTemplates.push(
        runtimeTemplate(member, records, requirement),
      );
    }
  }

  const report = withFingerprint({
    schemaVersion: 1,
    reportType:
      "g5-l5-post-m1-per-session-authorization-preparation",
    evidenceState:
      "unsigned-empty-non-runnable-static-session-preparation-only",
    release: {
      releaseId: RELEASE_ID,
      titleDisplay: release.titleDisplay,
      publicationMode: release.publicationMode,
      releaseFingerprintSha256: expectedReleaseFingerprint,
      memberCount: expectedMemberCount,
      activePageCount: expectedPageCount,
      shellCount: expectedShellCount,
    },
    sourceBindings: {
      releaseCatalog: descriptor(releaseRecord),
      generator: descriptor(generatorRecord),
      postM1RuntimeAggregate: descriptor(runtimeAggregateRecord, {
        reportFingerprintSha256:
          runtimeAggregateRecord.document.reportFingerprintSha256,
      }),
      postM1AnimateAggregate: descriptor(animateAggregateRecord, {
        reportFingerprintSha256:
          animateAggregateRecord.document.reportFingerprintSha256,
      }),
    },
    controls: CONTROL_REQUIREMENTS.map((control) => ({...control})),
    animateSessionTemplates,
    originalRuntimeSessionTemplates,
    summary: {
      releaseMemberCount: expectedMemberCount,
      activePageCount: expectedPageCount,
      shellCount: expectedShellCount,
      currentM1ReceiptCount: expectedMemberCount,
      postM1RuntimeSuccessorCount: expectedMemberCount,
      postM1AnimateSuccessorCount: expectedMemberCount,
      currentCoverageV2Count: expectedMemberCount,
      currentScenarioInventoryCount: expectedMemberCount,
      currentStrictReadinessCount: expectedMemberCount,
      flaBackedMemberCount: expectedFlaCount,
      swfOnlyMemberCount: expectedSwfOnlyCount,
      animateSessionTemplateCount: expectedFlaCount,
      originalRuntimeSessionTemplateCount: expectedRuntimeTemplateCount,
      englishRuntimeSessionTemplateCount: expectedMemberCount,
      spanishRuntimeSessionTemplateCount: expectedMemberCount,
      totalSessionTemplateCount: expectedTemplateCount,
      boundPendingCoverageFrameCount: expectedCoverageFrameCount,
      namedHumanCount: 0,
      roleAssignmentCount: 0,
      authorizerCount: 0,
      signatureCount: 0,
      budgetApprovalCount: 0,
      procurementApprovalCount: 0,
      issuedSessionIdCount: 0,
      commandCount: 0,
      runnableSessionCount: 0,
      executedSessionCount: 0,
      guiExecutionCount: 0,
      actualOutputCount: 0,
      authoringAuditCompleteCount: 0,
      naturalRuntimeTraceCount: 0,
      authoritativeBaselineCount: 0,
      implementationAuthorizedCount: 0,
      acceptedReviewCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
    },
    authorityBoundary: structuredClone(AUTHORITY_BOUNDARY),
    limitations: [
      "This artifact is static preparation only; it is not an immutable session authorization and cannot be executed.",
      "Existing EN/ES coverage identities are pending obligations, not observed natural-runtime traces or authoritative baseline evidence.",
      "No named human, role assignment, authorizer, signature, date/time, budget, procurement approval, session ID, command, stop condition, environment, containment approval, or actual output is supplied.",
      "No Adobe Animate, Flash Projector, Ruffle, browser, GUI, legacy endpoint, evidence capture, implementation, review, strict completion, or publication action is performed or authorized.",
    ],
  });

  const validationContext = {
    release,
    memberRecords,
    releaseRecord,
    generatorRecord,
    runtimeAggregateRecord,
    animateAggregateRecord,
    expectedMemberCount,
    expectedPageCount,
    expectedShellCount,
    expectedFlaCount,
    expectedSwfOnlyCount,
    expectedRuntimeTemplateCount,
    expectedTemplateCount,
    expectedCoverageFrameCount,
    expectedReleaseFingerprint,
  };
  validateG5L5PostM1PerSessionPreparation(report, validationContext);

  const renderedJson = Buffer.from(stableJson(report));
  const renderedMarkdown = Buffer.from(markdownFor(report));
  const outputSpecs = [
    {
      relativePath: `${REPORT_PREFIX}.json`,
      bytes: renderedJson,
      sha256: sha256(renderedJson),
    },
    {
      relativePath: `${REPORT_PREFIX}.md`,
      bytes: renderedMarkdown,
      sha256: sha256(renderedMarkdown),
    },
  ];
  const outputs = [];
  for (const spec of outputSpecs) {
    outputs.push({
      ...spec,
      snapshot: await outputSnapshot(root, spec.relativePath),
    });
  }

  if (mode === "check") {
    for (const output of outputs) {
      invariant(
        output.snapshot.exists &&
          output.snapshot.contents.equals(output.bytes),
        `${output.relativePath}: managed output is missing or stale`,
      );
    }
  } else if (mode === "apply") {
    await commitOutputs(root, inputs, outputs, transactionHooks);
  }

  return {
    mode,
    report,
    markdown: renderedMarkdown.toString("utf8"),
    validationContext,
    outputChanges: outputs.map((output) => ({
      path: output.relativePath,
      change: !output.snapshot.exists
        ? "create"
        : output.snapshot.contents.equals(output.bytes)
          ? "unchanged"
          : "update",
      bytes: output.bytes.length,
      sha256: output.sha256,
    })),
  };
}

export function parseArguments(argv) {
  let mode = "dry-run";
  for (const argument of argv) {
    if (argument === "--dry-run") mode = "dry-run";
    else if (argument === "--apply") mode = "apply";
    else if (argument === "--check") mode = "check";
    else if (argument === "--help") {
      return {help: true, mode};
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return {help: false, mode};
}

async function main() {
  const {help, mode} = parseArguments(process.argv.slice(2));
  if (help) {
    process.stdout.write(
      "Usage: node scripts/build-g5-l5-post-m1-per-session-authorization-preparation.mjs [--dry-run|--apply|--check]\n",
    );
    return;
  }
  const result = await buildG5L5PostM1PerSessionPreparation({mode});
  process.stdout.write(`${stableJson({
    mode: result.mode,
    releaseId: result.report.release.releaseId,
    releaseMemberCount: result.report.summary.releaseMemberCount,
    animateSessionTemplateCount:
      result.report.summary.animateSessionTemplateCount,
    originalRuntimeSessionTemplateCount:
      result.report.summary.originalRuntimeSessionTemplateCount,
    totalSessionTemplateCount:
      result.report.summary.totalSessionTemplateCount,
    namedHumanCount: result.report.summary.namedHumanCount,
    commandCount: result.report.summary.commandCount,
    runnableSessionCount: result.report.summary.runnableSessionCount,
    actualOutputCount: result.report.summary.actualOutputCount,
    reportFingerprintSha256: result.report.reportFingerprintSha256,
    outputChanges: result.outputChanges,
  })}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
