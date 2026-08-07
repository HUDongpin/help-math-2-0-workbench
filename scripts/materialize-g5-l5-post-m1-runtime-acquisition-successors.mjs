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
  createG5L5StaticCompositeProofResolver,
  validateG5L5ProofBoundFrameDomainDisposition,
} from "./g5-l5-proof-bound-frame-domain-disposition.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const G5_L5_POST_M1_RUNTIME_RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const G5_L5_POST_M1_RUNTIME_RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
export const G5_L5_POST_M1_RUNTIME_OUTPUT_NAME =
  "g5-l5-post-m1-runtime-acquisition-successor.json";
export const G5_L5_POST_M1_RUNTIME_REPORT_PREFIX =
  "reports/g5-l5-post-m1-runtime-acquisition-readiness";

const GENERATOR_RELATIVE =
  "scripts/materialize-g5-l5-post-m1-runtime-acquisition-successors.mjs";
const RELEASE_RELATIVE = "catalog/lesson-releases.json";
const HISTORICAL_PLAN_RELATIVE =
  "audit/machine/release-runtime-acquisition-plan.json";
const MANIFEST_RELATIVE = "migration.json";
const M1_RECEIPT_RELATIVE =
  "audit/machine/g5-l5-m1-static-reconciliation-receipt.json";
const SCENARIO_RELATIVE = "audit/scenario-inventory.json";
const FRAME_DOMAIN_RELATIVE = "audit/frame-domain-disposition.json";
const COVERAGE_RELATIVE = "evidence/full-frame-coverage.json";
const STRICT_READINESS_RELATIVE = "audit/strict-readiness.json";
const EXPECTED_MEMBER_COUNT = 57;
const EXPECTED_PAGE_COUNT = 56;
const EXPECTED_SHELL_COUNT = 1;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  currentJavaScriptCandidate: false,
  implementationAuthorized: false,
  fidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  publicationAuthorized: false,
  published: false,
});

const EMPTY_WORKSHEET = Object.freeze({
  state: "empty-non-runnable-planning-only",
  actionSchedules: Object.freeze([]),
  audioListeningRecords: Object.freeze([]),
  authorizedRuntimeContexts: Object.freeze([]),
  baselineManifests: Object.freeze([]),
  deterministicSeedSchedules: Object.freeze([]),
  namedOperators: Object.freeze([]),
  naturalEntryActions: Object.freeze([]),
  ownerSignatures: Object.freeze([]),
  pngFiles: Object.freeze([]),
  reviewerSignatures: Object.freeze([]),
  runtimeReceipts: Object.freeze([]),
  traceSchedules: Object.freeze([]),
});

const EXECUTION_GATE = Object.freeze({
  state: "closed-post-m1-static-planning-only",
  runnable: false,
  launchesAnimate: false,
  launchesBrowser: false,
  launchesGui: false,
  launchesOriginalRuntime: false,
  launchesRuffle: false,
  executesLegacyEndpoints: false,
  createsRuntimeEvidence: false,
  createsBaselineEvidence: false,
  authorizesDirectSeek: false,
  runtimeSessionCount: 0,
  namedOperatorCount: 0,
  sessionOperatorAttestationCount: 0,
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

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function portable(value) {
  return value.split(path.sep).join("/");
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
  invariant(isWithin(projectRoot, absolutePath), `${label}: path escapes project root`);
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
  invariant(isWithin(projectRoot, absoluteTarget), `${label}: target escapes project root`);
  const relativeParent = path.relative(projectRoot, path.dirname(absoluteTarget));
  const segments = relativeParent === "" ? [] : relativeParent.split(path.sep);
  let cursor = projectRoot;
  for (const segment of segments) {
    cursor = path.join(cursor, segment);
    const information = await lstat(cursor, {bigint: true}).catch((error) => {
      throw new Error(`${label}: output/input ancestor is unavailable: ${portable(path.relative(projectRoot, cursor))} (${error.message})`);
    });
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label}: ancestor must be an ordinary directory: ${portable(path.relative(projectRoot, cursor))}`,
    );
    const cursorReal = await realpath(cursor);
    invariant(
      isWithin(rootReal, cursorReal),
      `${label}: ancestor resolves outside project root: ${portable(path.relative(projectRoot, cursor))}`,
    );
  }
}

function descriptor(record) {
  return {
    path: record.path,
    bytes: Number(record.stat.size),
    sha256: record.sha256,
  };
}

async function readFileRecord(projectRoot, relativePath, {
  json = false,
  label = relativePath,
} = {}) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  await assertOrdinaryAncestorTree(projectRoot, absolutePath, label);
  const before = await lstat(absolutePath, {bigint: true}).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label}: expected one ordinary non-linked file`,
  );
  const [contents, rootReal, fileReal] = await Promise.all([
    readFile(absolutePath),
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(rootReal, fileReal), `${label}: resolves outside project root`);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    sameStatIdentity(statIdentity(before), statIdentity(after)),
    `${label}: changed while being read`,
  );
  const record = {
    absolutePath,
    path: relativePath,
    contents,
    sha256: sha256(contents),
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

function fingerprintDocument(document, key) {
  const projected = structuredClone(document);
  delete projected[key];
  return sha256(Buffer.from(stableJson(projected)));
}

function withFingerprint(document, key) {
  return {
    ...document,
    [key]: sha256(Buffer.from(stableJson(document))),
  };
}

function assertAllFalse(value, label) {
  invariant(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === Object.keys(ACCEPTANCE_EFFECTS).length &&
      Object.keys(ACCEPTANCE_EFFECTS).every(
        (key) => value[key] === false,
      ) &&
      Object.values(value).every((entry) => entry === false),
    `${label}: acceptance effects must be the exact all-false contract`,
  );
}

function assertEmptyWorksheet(worksheet, label) {
  invariant(
    worksheet?.state === "empty-non-runnable-planning-only",
    `${label}: worksheet state is not empty/non-runnable`,
  );
  for (const key of Object.keys(EMPTY_WORKSHEET).filter((key) => key !== "state")) {
    invariant(
      Array.isArray(worksheet[key]) && worksheet[key].length === 0,
      `${label}: worksheet ${key} must remain empty`,
    );
  }
  invariant(
    Object.keys(worksheet).length === Object.keys(EMPTY_WORKSHEET).length,
    `${label}: worksheet contains undeclared fields`,
  );
}

function assertClosedExecutionGate(gate, label) {
  invariant(
    gate?.state === "closed-post-m1-static-planning-only" &&
      Object.keys(EXECUTION_GATE).length === Object.keys(gate).length,
    `${label}: execution gate identity drifted`,
  );
  for (const [key, expected] of Object.entries(EXECUTION_GATE)) {
    invariant(gate[key] === expected, `${label}: execution gate ${key} drifted`);
  }
}

function validateHistoricalPlan(plan, member) {
  invariant(
    plan?.schemaVersion === 2 &&
      plan.artifactType === "release-runtime-acquisition-plan" &&
      plan.identity?.releaseId === G5_L5_POST_M1_RUNTIME_RELEASE_ID &&
      plan.identity.animationId === member.animationId &&
      plan.identity.assetId === member.assetId &&
      plan.identity.ordinal === member.ordinal,
    `${member.animationId}: historical runtime plan identity drifted`,
  );
  const historicalWorksheet = plan.emptyRuntimeAcquisitionWorksheet;
  invariant(
    historicalWorksheet?.namedOperatorFieldMeaning ===
      "per-session operator attestation only; release-level role assignment is separate",
    `${member.animationId}: historical runtime plan operator-field meaning drifted`,
  );
  const projectedWorksheet = structuredClone(historicalWorksheet);
  delete projectedWorksheet.namedOperatorFieldMeaning;
  assertEmptyWorksheet(
    projectedWorksheet,
    `${member.animationId}: historical runtime plan`,
  );
  invariant(
    plan.executionGate?.state === "closed" &&
      plan.executionGate.runnable === false &&
      plan.executionGate.launchesAnimate === false &&
      plan.executionGate.launchesBrowser === false &&
      plan.executionGate.launchesOriginalRuntime === false &&
      plan.executionGate.launchesRuffle === false &&
      plan.executionGate.executesLegacyEndpoints === false &&
      plan.executionGate.createsRuntimeEvidence === false &&
      plan.executionGate.createsBaselineEvidence === false,
    `${member.animationId}: historical runtime plan was promoted`,
  );
  invariant(
    plan.acceptanceEffects?.acceptanceNeutral === true &&
      Object.entries(plan.acceptanceEffects)
        .filter(([key]) => key !== "acceptanceNeutral")
        .every(([, value]) => value === false),
    `${member.animationId}: historical runtime plan changed acceptance`,
  );
  const projected = structuredClone(plan);
  delete projected.artifactFingerprintSha256;
  invariant(
    SHA256_PATTERN.test(plan.artifactFingerprintSha256 || "") &&
      plan.artifactFingerprintSha256 === sha256(Buffer.from(stableJson(projected))),
    `${member.animationId}: historical runtime plan fingerprint drifted`,
  );
}

function selectRelease(document, {
  expectedMemberCount = EXPECTED_MEMBER_COUNT,
  expectedPageCount = EXPECTED_PAGE_COUNT,
  expectedShellCount = EXPECTED_SHELL_COUNT,
  expectedReleaseFingerprint =
    G5_L5_POST_M1_RUNTIME_RELEASE_FINGERPRINT_SHA256,
} = {}) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson release catalog is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === G5_L5_POST_M1_RUNTIME_RELEASE_ID,
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
        typeof member.assetId === "string" &&
        member.assetId === `swf-${member.source?.sha256}` &&
        ["active-xml-referenced-page", "course-shell"].includes(
          member.releaseRole,
        ),
      `G5 L5 release member ${index + 1} identity drifted`,
    );
  }
  return {release, releaseFingerprint: expectedReleaseFingerprint};
}

function validateManifest(manifest, member) {
  invariant(
    manifest?.schemaVersion >= 1 &&
      manifest.animationId === member.animationId &&
      manifest.assetId === member.assetId &&
      manifest.source?.swfSha256 === member.source.sha256 &&
      manifest.source?.swf?.endsWith(member.source.path) &&
      manifest.runtime?.stage?.width === 800 &&
      manifest.runtime?.stage?.height === 600 &&
      manifest.runtime?.fps === 12 &&
      Number.isSafeInteger(manifest.runtime?.frameCount) &&
      manifest.runtime.frameCount > 0 &&
      manifest.implementation?.rendering === "undecided" &&
      manifest.implementation?.route === "" &&
      manifest.implementation?.component === "" &&
      manifest.implementation?.timelineModule === "",
    `${member.animationId}: current migration manifest crossed the static planning boundary`,
  );
}

function validateCoverage(coverage, member, manifest) {
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === member.animationId &&
      Array.isArray(coverage.requirements) &&
      coverage.requirements.length === 2,
    `${member.animationId}: coverage-v2 must retain two provisional root requirements`,
  );
  const expectedLanguages = ["en", "es"];
  const observedLanguages = [];
  for (const requirement of coverage.requirements) {
    observedLanguages.push(requirement.language);
    invariant(
      requirement.frameDomainId === "root" &&
        requirement.scenario === "default" &&
        requirement.status === "pending" &&
        requirement.baselineAuthority === "unresolved" &&
        requirement.requiredRange?.firstFrame === 1 &&
        requirement.requiredRange?.lastFrame === manifest.runtime.frameCount &&
        requirement.capturedFrameCount === 0 &&
        Array.isArray(requirement.missingFrames) &&
        requirement.missingFrames.length === manifest.runtime.frameCount &&
        requirement.baselineCaptureManifest === "" &&
        requirement.captureManifest === "" &&
        requirement.metricsFile === "",
      `${member.animationId}/${requirement.requirementId}: coverage was promoted or drifted`,
    );
  }
  invariant(
    JSON.stringify(observedLanguages.sort()) ===
      JSON.stringify(expectedLanguages),
    `${member.animationId}: coverage languages drifted`,
  );
}

function coverageFrameCount(coverage) {
  return coverage.requirements.reduce(
    (sum, requirement) =>
      sum +
      requirement.requiredRange.lastFrame -
      requirement.requiredRange.firstFrame +
      1,
    0,
  );
}

function outputRelative(animationId) {
  invariant(SAFE_ID.test(animationId || ""), "invalid animation ID");
  return `migrations/${animationId}/audit/machine/${G5_L5_POST_M1_RUNTIME_OUTPUT_NAME}`;
}

async function loadMember(
  projectRoot,
  member,
  resolveStaticCompositeProof,
) {
  const workspace = `migrations/${member.animationId}`;
  const paths = {
    manifest: `${workspace}/${MANIFEST_RELATIVE}`,
    m1Receipt: `${workspace}/${M1_RECEIPT_RELATIVE}`,
    scenario: `${workspace}/${SCENARIO_RELATIVE}`,
    frameDomain: `${workspace}/${FRAME_DOMAIN_RELATIVE}`,
    coverage: `${workspace}/${COVERAGE_RELATIVE}`,
    strictReadiness: `${workspace}/${STRICT_READINESS_RELATIVE}`,
    historicalPlan: `${workspace}/${HISTORICAL_PLAN_RELATIVE}`,
  };
  const records = {};
  for (const [key, relativePath] of Object.entries(paths)) {
    records[key] = await readFileRecord(projectRoot, relativePath, {
      json: true,
      label: `${member.animationId}: ${key}`,
    });
  }

  validateManifest(records.manifest.document, member);
  validateG5L5M1StaticReconciliationReceipt(
    records.m1Receipt.document,
    member,
  );
  validateScenarioInventory(records.scenario.document);
  invariant(
    records.scenario.document.animationId === member.animationId &&
      records.scenario.document.inventoryStatus ===
        "static-exhaustive-runtime-unverified" &&
      records.scenario.document.migrationStatusChanged === false,
    `${member.animationId}: scenario inventory identity or authority drifted`,
  );
  const frameDomainFacts =
    await validateG5L5ProofBoundFrameDomainDisposition({
      disposition: records.frameDomain.document,
      member,
      scenarioSha256: records.scenario.sha256,
      resolveStaticCompositeProof,
    });
  if (frameDomainFacts.staticEvidenceBinding) {
    records.staticEvidence = await readFileRecord(
      projectRoot,
      frameDomainFacts.staticEvidenceBinding.path,
      {
        json: true,
        label: `${member.animationId}: trusted static composite evidence`,
      },
    );
    invariant(
      records.staticEvidence.stat.size ===
          BigInt(frameDomainFacts.staticEvidenceBinding.bytes) &&
        records.staticEvidence.sha256 ===
          frameDomainFacts.staticEvidenceBinding.sha256,
      `${member.animationId}: trusted static composite evidence changed after proof verification`,
    );
  }
  validateCoverage(
    records.coverage.document,
    member,
    records.manifest.document,
  );
  validateG5L5StaticStrictReadiness(
    records.strictReadiness.document,
    member,
  );
  validateHistoricalPlan(records.historicalPlan.document, member);

  const receiptOutputs = records.m1Receipt.document.outputs;
  const postimageRecords = {};
  for (const [name, postimage] of Object.entries(receiptOutputs)) {
    invariant(
      postimage?.after?.exists === true &&
        typeof postimage.after.path === "string" &&
        SHA256_PATTERN.test(postimage.after.sha256 || ""),
      `${member.animationId}: M1 receipt ${name} postimage is invalid`,
    );
    const existingRecord = Object.values(records).find(
      ({path: candidate}) => candidate === postimage.after.path,
    );
    const current = existingRecord ??
      await readFileRecord(projectRoot, postimage.after.path, {
        label: `${member.animationId}: M1 ${name} current postimage`,
      });
    invariant(
      Number(current.stat.size) === postimage.after.bytes &&
        current.sha256 === postimage.after.sha256,
      `${member.animationId}: M1 ${name} postimage is no longer current`,
    );
    postimageRecords[name] = current;
  }
  invariant(
    receiptOutputs.migrationManifest?.after?.path === paths.manifest &&
      receiptOutputs.migrationManifest.after.sha256 === records.manifest.sha256,
    `${member.animationId}: M1 receipt does not bind the current manifest`,
  );

  const strictEvidence = new Map(
    records.strictReadiness.document.evidence.map((entry) => [entry.id, entry]),
  );
  for (const [evidenceId, record] of [
    ["migration-manifest", records.manifest],
    ["coverage-v2", records.coverage],
    ["m1-static-reconciliation-receipt", records.m1Receipt],
  ]) {
    const bound = strictEvidence.get(evidenceId);
    invariant(
      bound?.path === record.path &&
        bound.bytes === Number(record.stat.size) &&
        bound.sha256 === record.sha256,
      `${member.animationId}: strict-readiness ${evidenceId} binding is stale`,
    );
  }
  const inputRecords = [
    ...Object.values(records),
    ...Object.values(postimageRecords),
  ];
  return {
    member,
    workspace,
    records,
    frameDomainFacts,
    inputRecords: [
      ...new Map(inputRecords.map((record) => [record.absolutePath, record]))
        .values(),
    ],
  };
}

function buildMemberDocument({
  member,
  releaseFingerprint,
  generator,
  records,
  frameDomainFacts,
}) {
  const manifest = records.manifest.document;
  const coverage = records.coverage.document;
  const disposition = records.frameDomain.document;
  const document = {
    schemaVersion: 1,
    artifactType: "g5-l5-post-m1-runtime-acquisition-successor",
    evidenceState:
      "post-m1-current-static-bindings-empty-non-runnable-planning-only",
    generatedBy: {
      script: GENERATOR_RELATIVE,
      sha256: generator.sha256,
      deterministic: true,
    },
    releaseId: G5_L5_POST_M1_RUNTIME_RELEASE_ID,
    animationId: member.animationId,
    releaseMembership: {
      ordinal: member.ordinal,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
      releaseFingerprintSha256: releaseFingerprint,
    },
    lineage: {
      historicalPlan: descriptor(records.historicalPlan),
      historicalArtifactModified: false,
      historicalPlanState:
        "preserved-and-superseded-for-current-post-m1-planning-only",
      supersessionScope:
        "Planning currency only. The historical pre-M1 artifact remains immutable evidence and is neither rewritten nor promoted.",
    },
    currentBindings: {
      migrationManifest: descriptor(records.manifest),
      m1StaticReconciliationReceipt: descriptor(records.m1Receipt),
      scenarioInventory: descriptor(records.scenario),
      frameDomainDisposition: descriptor(records.frameDomain),
      staticDispositionEvidence: records.staticEvidence
        ? descriptor(records.staticEvidence)
        : null,
      coverageV2: descriptor(records.coverage),
      strictReadiness: descriptor(records.strictReadiness),
    },
    currentStaticPlanningFacts: {
      nativeStage: manifest.runtime.stage,
      fps: manifest.runtime.fps,
      rootFrameCount: manifest.runtime.frameCount,
      canonicalCoverageRequirementCount: coverage.requirements.length,
      canonicalCoverageFrameCount: coverageFrameCount(coverage),
      canonicalCoverageState: "pending-root-only-no-authority",
      structurallyReachableChildTimelineCount:
        frameDomainFacts.reachableChildTimelineCount,
      evidenceBoundCompositeChildDispositionCount:
        frameDomainFacts.evidenceBoundCompositeChildCount,
      unresolvedChildDispositionCount:
        frameDomainFacts.unresolvedChildCount,
      excludedNotProvenTimelineCount:
        frameDomainFacts.excludedNotProvenTimelineCount,
      highRiskIndependentCandidateCount:
        disposition.summary.highRiskIndependentCandidateCount,
      completeRootReachableDomainInventory: false,
      naturalTraceSchedulesComplete: false,
      totalCoverageFrameCountKnown: false,
    },
    namedOperatorRoleAssignment: null,
    emptyRuntimeAcquisitionWorksheet: structuredClone(EMPTY_WORKSHEET),
    executionGate: structuredClone(EXECUTION_GATE),
    unresolvedBlockers: {
      missingNamedOriginalRuntimeOperator: true,
      missingBackupOriginalRuntimeOperator: true,
      missingPortableOperatorIdentityVerification: true,
      missingOperatorWeeklyCapacityCommitment: true,
      missingImmutablePerSessionOperatorAttestation: true,
      missingPerSessionExecutionAuthorization: true,
      missingAuthorizedOriginalRuntimeContext: true,
      missingNaturalHostEntry: true,
      missingCompleteTraceSchedules: true,
      missingBilingualRuntimeTraversal: true,
      missingInteractionBranchRandomReplayTraversal: true,
      missingAudioCueAndListeningDisposition: true,
      missingAuthoritativeBaselines: true,
      unresolvedRootReachableChildDomains:
        disposition.summary.dispositionCounts.unresolved,
    },
    acceptanceNeutral: true,
    acceptanceEffects: structuredClone(ACCEPTANCE_EFFECTS),
    strictAcceptanceEffect:
      "none; current post-M1 machine planning successor only; no runtime, implementation, review, strict, or publication authority",
  };
  return withFingerprint(document, "artifactFingerprintSha256");
}

export function validateG5L5PostM1RuntimeAcquisitionSuccessor(
  document,
  member,
  {
    expectedReleaseFingerprint =
      G5_L5_POST_M1_RUNTIME_RELEASE_FINGERPRINT_SHA256,
    allowLegacyAllUnresolved = false,
  } = {},
) {
  const id = member.animationId;
  invariant(
    document?.schemaVersion === 1 &&
      document.artifactType ===
        "g5-l5-post-m1-runtime-acquisition-successor" &&
      document.evidenceState ===
        "post-m1-current-static-bindings-empty-non-runnable-planning-only" &&
      document.releaseId === G5_L5_POST_M1_RUNTIME_RELEASE_ID &&
      document.animationId === id,
    `${id}: successor identity drifted`,
  );
  invariant(
    document.generatedBy?.script === GENERATOR_RELATIVE &&
      SHA256_PATTERN.test(document.generatedBy.sha256 || "") &&
      document.generatedBy.deterministic === true,
    `${id}: successor generator binding drifted`,
  );
  invariant(
    document.releaseMembership?.ordinal === member.ordinal &&
      document.releaseMembership.assetId === member.assetId &&
      document.releaseMembership.releaseRole === member.releaseRole &&
      document.releaseMembership.batchId === member.batchId &&
      document.releaseMembership.shardId === member.shardId &&
      document.releaseMembership.releaseFingerprintSha256 ===
        expectedReleaseFingerprint,
    `${id}: successor release membership drifted`,
  );
  invariant(
    document.lineage?.historicalArtifactModified === false &&
      document.lineage.historicalPlan?.path ===
        `migrations/${id}/${HISTORICAL_PLAN_RELATIVE}` &&
      Number.isSafeInteger(document.lineage.historicalPlan.bytes) &&
      document.lineage.historicalPlan.bytes > 0 &&
      SHA256_PATTERN.test(document.lineage.historicalPlan.sha256 || "") &&
      document.lineage.historicalPlanState ===
        "preserved-and-superseded-for-current-post-m1-planning-only",
    `${id}: successor historical lineage drifted`,
  );
  const legacyAllUnresolved =
    allowLegacyAllUnresolved &&
    document.currentStaticPlanningFacts
      ?.evidenceBoundCompositeChildDispositionCount === undefined &&
    document.currentBindings?.staticDispositionEvidence === undefined &&
    document.currentStaticPlanningFacts?.unresolvedChildDispositionCount ===
      document.currentStaticPlanningFacts
        ?.structurallyReachableChildTimelineCount;
  const expectedPaths = {
    migrationManifest: `migrations/${id}/${MANIFEST_RELATIVE}`,
    m1StaticReconciliationReceipt: `migrations/${id}/${M1_RECEIPT_RELATIVE}`,
    scenarioInventory: `migrations/${id}/${SCENARIO_RELATIVE}`,
    frameDomainDisposition: `migrations/${id}/${FRAME_DOMAIN_RELATIVE}`,
    ...(legacyAllUnresolved
      ? {}
      : {
        staticDispositionEvidence:
          document.currentStaticPlanningFacts
              ?.evidenceBoundCompositeChildDispositionCount > 0
            ? `migrations/${id}/audit/static-frame-domain-disposition-evidence.json`
            : null,
      }),
    coverageV2: `migrations/${id}/${COVERAGE_RELATIVE}`,
    strictReadiness: `migrations/${id}/${STRICT_READINESS_RELATIVE}`,
  };
  invariant(
    Object.keys(document.currentBindings || {}).length ===
      Object.keys(expectedPaths).length,
    `${id}: successor current binding set drifted`,
  );
  for (const [key, expectedPath] of Object.entries(expectedPaths)) {
    const binding = document.currentBindings[key];
    if (expectedPath === null) {
      invariant(
        binding === null,
        `${id}: successor ${key} must be null when no composite proof is required`,
      );
      continue;
    }
    invariant(
      binding?.path === expectedPath &&
        Number.isSafeInteger(binding.bytes) &&
        binding.bytes > 0 &&
        SHA256_PATTERN.test(binding.sha256 || ""),
      `${id}: successor ${key} binding drifted`,
    );
  }
  invariant(
    document.currentStaticPlanningFacts?.nativeStage?.width === 800 &&
      document.currentStaticPlanningFacts.nativeStage.height === 600 &&
      document.currentStaticPlanningFacts.fps === 12 &&
      Number.isSafeInteger(
        document.currentStaticPlanningFacts.rootFrameCount,
      ) &&
      document.currentStaticPlanningFacts.rootFrameCount > 0 &&
      document.currentStaticPlanningFacts
        .canonicalCoverageRequirementCount === 2 &&
      document.currentStaticPlanningFacts.canonicalCoverageState ===
        "pending-root-only-no-authority" &&
      Number.isSafeInteger(
        document.currentStaticPlanningFacts
          .structurallyReachableChildTimelineCount,
      ) &&
      Number.isSafeInteger(
        document.currentStaticPlanningFacts
          .unresolvedChildDispositionCount,
      ) &&
      document.currentStaticPlanningFacts.unresolvedChildDispositionCount >
        0 &&
      (legacyAllUnresolved ||
        (
          Number.isSafeInteger(
            document.currentStaticPlanningFacts
              .evidenceBoundCompositeChildDispositionCount,
          ) &&
          document.currentStaticPlanningFacts
              .evidenceBoundCompositeChildDispositionCount +
              document.currentStaticPlanningFacts
                .unresolvedChildDispositionCount ===
            document.currentStaticPlanningFacts
              .structurallyReachableChildTimelineCount &&
          (document.currentStaticPlanningFacts
              .evidenceBoundCompositeChildDispositionCount > 0) ===
            Boolean(document.currentBindings.staticDispositionEvidence)
        )) &&
      document.currentStaticPlanningFacts
        .completeRootReachableDomainInventory === false &&
      document.currentStaticPlanningFacts.naturalTraceSchedulesComplete ===
        false &&
      document.currentStaticPlanningFacts.totalCoverageFrameCountKnown ===
        false,
    `${id}: successor static planning facts were promoted`,
  );
  invariant(
    document.namedOperatorRoleAssignment === null,
    `${id}: successor fabricated an operator assignment`,
  );
  assertEmptyWorksheet(
    document.emptyRuntimeAcquisitionWorksheet,
    `${id}: successor`,
  );
  assertClosedExecutionGate(document.executionGate, `${id}: successor`);
  invariant(
    Object.values(document.unresolvedBlockers || {}).every(
      (value) =>
        value === true ||
        (Number.isSafeInteger(value) && value >= 0),
    ) &&
      document.acceptanceNeutral === true,
    `${id}: successor blockers or neutral state drifted`,
  );
  assertAllFalse(document.acceptanceEffects, `${id}: successor`);
  invariant(
    document.strictAcceptanceEffect ===
      "none; current post-M1 machine planning successor only; no runtime, implementation, review, strict, or publication authority",
    `${id}: successor strict effect drifted`,
  );
  invariant(
    SHA256_PATTERN.test(document.artifactFingerprintSha256 || "") &&
      document.artifactFingerprintSha256 ===
        fingerprintDocument(document, "artifactFingerprintSha256"),
    `${id}: successor fingerprint drifted`,
  );
  return true;
}

function memberRenderedRecord(member, document) {
  const rendered = stableJson(document);
  const bytes = Buffer.from(rendered);
  return {
    member,
    document,
    relativePath: outputRelative(member.animationId),
    rendered,
    bytes,
    sha256: sha256(bytes),
  };
}

function buildAggregateReport({
  release,
  releaseFingerprint,
  releaseRecord,
  generator,
  memberOutputs,
}) {
  const summaries = memberOutputs.map(({document}) =>
    document.currentStaticPlanningFacts);
  const report = {
    schemaVersion: 1,
    reportType: "g5-l5-post-m1-runtime-acquisition-readiness",
    evidenceState:
      `${memberOutputs.length}-member-post-m1-current-static-successor-empty-non-runnable`,
    generatedBy: {
      script: GENERATOR_RELATIVE,
      sha256: generator.sha256,
      deterministic: true,
    },
    releaseId: G5_L5_POST_M1_RUNTIME_RELEASE_ID,
    release: {
      titleDisplay: release.titleDisplay,
      publicationMode: release.publicationMode,
      memberCount: release.members.length,
      activePageCount: release.expectedCounts.activeXmlReferencedPages,
      shellCount: release.expectedCounts.courseShells,
      releaseFingerprintSha256: releaseFingerprint,
    },
    sourceBindings: {
      releaseManifest: descriptor(releaseRecord),
      generator: descriptor(generator),
      memberCurrentInputSetSha256: sha256(Buffer.from(stableJson(
        memberOutputs.map(({document}) => ({
          animationId: document.animationId,
          currentBindings: document.currentBindings,
          historicalPlan: document.lineage.historicalPlan,
        })),
      ))),
    },
    lineage: {
      historicalPlanCount: memberOutputs.length,
      historicalPlansModified: 0,
      successorPlanCount: memberOutputs.length,
      policy:
        "The v1 release-runtime-acquisition-plan.json files remain immutable historical inputs. These new files supersede them only for current post-M1 planning.",
    },
    summary: {
      releaseMemberCount: memberOutputs.length,
      currentMigrationManifestCount: memberOutputs.length,
      m1StaticReconciliationReceiptCount: memberOutputs.length,
      currentScenarioInventoryCount: memberOutputs.length,
      currentFrameDomainDispositionCount: memberOutputs.length,
      currentCoverageV2Count: memberOutputs.length,
      currentStrictReadinessCount: memberOutputs.length,
      successorArtifactCount: memberOutputs.length,
      emptyWorksheetCount: memberOutputs.length,
      nonRunnableCount: memberOutputs.length,
      namedOperatorCount: 0,
      runtimeSessionCount: 0,
      guiExecutionCount: 0,
      authoritativeBaselineCount: 0,
      implementationAuthorizedCount: 0,
      acceptedReviewCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
      canonicalRootOnlyRequirementCount: summaries.reduce(
        (sum, value) => sum + value.canonicalCoverageRequirementCount,
        0,
      ),
      canonicalRootOnlyFrameCount: summaries.reduce(
        (sum, value) => sum + value.canonicalCoverageFrameCount,
        0,
      ),
      structurallyReachableChildTimelineCount: summaries.reduce(
        (sum, value) =>
          sum + value.structurallyReachableChildTimelineCount,
        0,
      ),
      unresolvedChildDispositionCount: summaries.reduce(
        (sum, value) => sum + value.unresolvedChildDispositionCount,
        0,
      ),
      evidenceBoundCompositeChildDispositionCount: summaries.reduce(
        (sum, value) =>
          sum + value.evidenceBoundCompositeChildDispositionCount,
        0,
      ),
      excludedNotProvenTimelineCount: summaries.reduce(
        (sum, value) => sum + value.excludedNotProvenTimelineCount,
        0,
      ),
      highRiskIndependentCandidateCount: summaries.reduce(
        (sum, value) => sum + value.highRiskIndependentCandidateCount,
        0,
      ),
    },
    items: memberOutputs.map(({member, document, relativePath, bytes, sha256: digest}) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      shardId: member.shardId,
      successorArtifact: {
        path: relativePath,
        bytes: bytes.length,
        sha256: digest,
        artifactFingerprintSha256: document.artifactFingerprintSha256,
      },
      worksheetState:
        document.emptyRuntimeAcquisitionWorksheet.state,
      runnable: false,
      namedOperatorCount: 0,
      runtimeSessionCount: 0,
    })),
    acceptanceNeutral: true,
    acceptanceEffects: structuredClone(ACCEPTANCE_EFFECTS),
    strictAcceptanceEffect:
      "none; post-M1 runtime-acquisition planning successor only",
  };
  return withFingerprint(report, "reportFingerprintSha256");
}

export function validateG5L5PostM1RuntimeAcquisitionReport(
  report,
  release,
  {
    expectedMemberCount = EXPECTED_MEMBER_COUNT,
    expectedPageCount = EXPECTED_PAGE_COUNT,
    expectedShellCount = EXPECTED_SHELL_COUNT,
    expectedReleaseFingerprint =
      G5_L5_POST_M1_RUNTIME_RELEASE_FINGERPRINT_SHA256,
    allowLegacyAllUnresolved = false,
  } = {},
) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g5-l5-post-m1-runtime-acquisition-readiness" &&
      report.evidenceState ===
        `${expectedMemberCount}-member-post-m1-current-static-successor-empty-non-runnable` &&
      report.releaseId === G5_L5_POST_M1_RUNTIME_RELEASE_ID,
    "post-M1 runtime-acquisition report identity drifted",
  );
  invariant(
    report.release?.titleDisplay === release.titleDisplay &&
      report.release.publicationMode === "atomic" &&
      report.release.memberCount === expectedMemberCount &&
      report.release.activePageCount === expectedPageCount &&
      report.release.shellCount === expectedShellCount &&
      report.release.releaseFingerprintSha256 ===
        expectedReleaseFingerprint,
    "post-M1 runtime-acquisition report release scope drifted",
  );
  invariant(
    report.lineage?.historicalPlanCount === expectedMemberCount &&
      report.lineage.historicalPlansModified === 0 &&
      report.lineage.successorPlanCount === expectedMemberCount,
    "post-M1 runtime-acquisition report lineage drifted",
  );
  const summary = report.summary;
  for (const key of [
    "releaseMemberCount",
    "currentMigrationManifestCount",
    "m1StaticReconciliationReceiptCount",
    "currentScenarioInventoryCount",
    "currentFrameDomainDispositionCount",
    "currentCoverageV2Count",
    "currentStrictReadinessCount",
    "successorArtifactCount",
    "emptyWorksheetCount",
    "nonRunnableCount",
  ]) {
    invariant(
      summary?.[key] === expectedMemberCount,
      `post-M1 runtime-acquisition report ${key} drifted`,
    );
  }
  for (const key of [
    "namedOperatorCount",
    "runtimeSessionCount",
    "guiExecutionCount",
    "authoritativeBaselineCount",
    "implementationAuthorizedCount",
    "acceptedReviewCount",
    "strictCompleteCount",
    "publishedCount",
  ]) {
    invariant(
      summary?.[key] === 0,
      `post-M1 runtime-acquisition report ${key} must remain zero`,
    );
  }
  const legacyAllUnresolved =
    allowLegacyAllUnresolved &&
    summary.evidenceBoundCompositeChildDispositionCount === undefined &&
    summary.unresolvedChildDispositionCount ===
      summary.structurallyReachableChildTimelineCount;
  invariant(
    summary.canonicalRootOnlyRequirementCount ===
      expectedMemberCount * 2 &&
      (legacyAllUnresolved ||
        summary.structurallyReachableChildTimelineCount ===
          summary.evidenceBoundCompositeChildDispositionCount +
            summary.unresolvedChildDispositionCount) &&
      (legacyAllUnresolved ||
        expectedMemberCount !== EXPECTED_MEMBER_COUNT ||
        (
          summary.canonicalRootOnlyFrameCount === 1220 &&
          summary.structurallyReachableChildTimelineCount === 1047 &&
          summary.evidenceBoundCompositeChildDispositionCount === 696 &&
          summary.unresolvedChildDispositionCount === 351 &&
          summary.excludedNotProvenTimelineCount === 185
        )) &&
      Array.isArray(report.items) &&
      report.items.length === expectedMemberCount &&
      new Set(report.items.map(({animationId}) => animationId)).size ===
        expectedMemberCount,
    "post-M1 runtime-acquisition report item or coverage count drifted",
  );
  for (const [index, item] of report.items.entries()) {
    const member = release.members[index];
    invariant(
      item.ordinal === member.ordinal &&
        item.animationId === member.animationId &&
        item.assetId === member.assetId &&
        item.successorArtifact?.path === outputRelative(member.animationId) &&
        Number.isSafeInteger(item.successorArtifact.bytes) &&
        item.successorArtifact.bytes > 0 &&
        SHA256_PATTERN.test(item.successorArtifact.sha256 || "") &&
        SHA256_PATTERN.test(
          item.successorArtifact.artifactFingerprintSha256 || "",
        ) &&
        item.worksheetState === "empty-non-runnable-planning-only" &&
        item.runnable === false &&
        item.namedOperatorCount === 0 &&
        item.runtimeSessionCount === 0,
      `${member.animationId}: aggregate successor item drifted`,
    );
  }
  invariant(report.acceptanceNeutral === true, "aggregate report is not neutral");
  assertAllFalse(report.acceptanceEffects, "aggregate report");
  invariant(
    report.strictAcceptanceEffect ===
      "none; post-M1 runtime-acquisition planning successor only",
    "aggregate strict effect drifted",
  );
  invariant(
    SHA256_PATTERN.test(report.reportFingerprintSha256 || "") &&
      report.reportFingerprintSha256 ===
        fingerprintDocument(report, "reportFingerprintSha256"),
    "aggregate report fingerprint drifted",
  );
  return true;
}

function renderMarkdown(report) {
  validateG5L5PostM1RuntimeAcquisitionReport(
    report,
    {
      titleDisplay: report.release.titleDisplay,
      members: report.items,
    },
    {
      expectedMemberCount: report.release.memberCount,
      expectedPageCount: report.release.activePageCount,
      expectedShellCount: report.release.shellCount,
      expectedReleaseFingerprint:
        report.release.releaseFingerprintSha256,
    },
  );
  const rows = report.items.map((item) =>
    `| ${item.ordinal} | \`${item.animationId}\` | \`${item.successorArtifact.path}\` | empty / non-runnable |`).join("\n");
  return `# G5 L5 post-M1 runtime-acquisition planning readiness

State: **current post-M1 static successor; empty and non-runnable**

This report binds all **${report.summary.releaseMemberCount}/${report.release.memberCount}** release members to their current migration manifests, M1 reconciliation receipts, scenario inventories, frame-domain dispositions, coverage-v2 documents, and strict-readiness records. The earlier \`release-runtime-acquisition-plan.json\` files remain untouched historical inputs and are superseded only for current planning.

## Current counts

| Measure | Count |
|---|---:|
| Successor artifacts | ${report.summary.successorArtifactCount} |
| Empty worksheets | ${report.summary.emptyWorksheetCount} |
| Runnable artifacts | 0 |
| Named operators / runtime sessions / GUI executions | 0 / 0 / 0 |
| Canonical pending root requirements / frames | ${report.summary.canonicalRootOnlyRequirementCount} / ${report.summary.canonicalRootOnlyFrameCount} |
| Structurally reachable child timelines | ${report.summary.structurallyReachableChildTimelineCount} |
| Exact proof-bound one-frame composite children | ${report.summary.evidenceBoundCompositeChildDispositionCount} |
| Structurally reachable unresolved child timelines | ${report.summary.unresolvedChildDispositionCount} |
| Excluded/not-proven child timelines | ${report.summary.excludedNotProvenTimelineCount} |
| High-risk independent candidates | ${report.summary.highRiskIndependentCandidateCount} |
| Strict complete / published | 0/${report.summary.releaseMemberCount} / 0 |

## Member successor set

| # | Animation | Successor | Worksheet |
|---:|---|---|---|
${rows}

No original runtime, GUI, legacy endpoint, implementation, review, acceptance, strict-completion, or publication authority is created. Report fingerprint: \`${report.reportFingerprintSha256}\`.
`;
}

async function outputSnapshot(projectRoot, relativePath, label) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  await assertOrdinaryAncestorTree(projectRoot, absolutePath, label);
  const information = await lstatOrNull(absolutePath);
  if (!information) {
    return {
      path: relativePath,
      absolutePath,
      parent: path.dirname(absolutePath),
      exists: false,
      contents: null,
      sha256: "",
      stat: null,
    };
  }
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n &&
      permissionMode(information) === 0o644,
    `${label}: output must be one ordinary non-linked mode-0644 file`,
  );
  const record = await readFileRecord(projectRoot, relativePath, {label});
  return {
    path: relativePath,
    absolutePath,
    parent: path.dirname(absolutePath),
    exists: true,
    contents: record.contents,
    sha256: record.sha256,
    stat: record.stat,
  };
}

function sameOutputSnapshot(left, right) {
  return left.exists === right.exists &&
    (!left.exists ||
      (left.sha256 === right.sha256 &&
        left.contents.equals(right.contents) &&
        sameStatIdentity(left.stat, right.stat)));
}

async function assertInputsUnchanged(records) {
  for (const record of records) {
    const current = await lstat(record.absolutePath, {bigint: true}).catch(
      (error) => {
        throw new Error(
          `${record.path}: input disappeared after preflight (${error.message})`,
        );
      },
    );
    invariant(
      current.isFile() &&
        !current.isSymbolicLink() &&
        current.nlink === 1n &&
        sameStatIdentity(record.stat, statIdentity(current)),
      `${record.path}: input changed after preflight`,
    );
  }
}

function assertOwnedExistingOutput(output, context) {
  if (!output.snapshot.exists) return;
  if (output.kind === "member-json") {
    let document;
    try {
      document = JSON.parse(output.snapshot.contents.toString("utf8"));
    } catch {
      throw new Error(`${output.relativePath}: refusing to overwrite non-JSON output`);
    }
    validateG5L5PostM1RuntimeAcquisitionSuccessor(
      document,
      output.member,
      {
        expectedReleaseFingerprint: context.releaseFingerprint,
        allowLegacyAllUnresolved: true,
      },
    );
  } else if (output.kind === "report-json") {
    let report;
    try {
      report = JSON.parse(output.snapshot.contents.toString("utf8"));
    } catch {
      throw new Error(`${output.relativePath}: refusing to overwrite non-JSON report`);
    }
    validateG5L5PostM1RuntimeAcquisitionReport(
      report,
      context.release,
      {
        ...context.validationOptions,
        allowLegacyAllUnresolved: true,
      },
    );
  } else {
    invariant(
      output.snapshot.contents.toString("utf8").startsWith(
        "# G5 L5 post-M1 runtime-acquisition planning readiness\n",
      ),
      `${output.relativePath}: refusing to overwrite an unmanaged Markdown file`,
    );
  }
}

async function writeExclusive(candidate, bytes) {
  await writeFile(candidate, bytes, {flag: "wx", mode: 0o644});
  await chmod(candidate, 0o644);
  const information = await lstat(candidate, {bigint: true});
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n &&
      permissionMode(information) === 0o644,
    `${candidate}: staged transaction file is not ordinary mode 0644`,
  );
  invariant(
    sha256(await readFile(candidate)) === sha256(bytes),
    `${candidate}: staged transaction bytes changed`,
  );
}

async function removeOwned(candidate, expectedSha256) {
  const information = await lstatOrNull(candidate);
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${candidate}: refusing to remove a changed transaction file`,
  );
  invariant(
    sha256(await readFile(candidate)) === expectedSha256,
    `${candidate}: refusing to remove changed transaction bytes`,
  );
  await unlink(candidate);
}

async function prepareTransaction(output, batchId) {
  const nonce = randomBytes(12).toString("hex");
  const basename = path.basename(output.relativePath);
  const stagePath = path.join(
    output.snapshot.parent,
    `.${basename}.${batchId}.${nonce}.stage`,
  );
  const backupPath = path.join(
    output.snapshot.parent,
    `.${basename}.${batchId}.${nonce}.backup`,
  );
  await writeExclusive(stagePath, output.desiredBytes);
  if (output.snapshot.exists) {
    await writeExclusive(backupPath, output.snapshot.contents);
  }
  return {
    ...output,
    stagePath,
    backupPath,
    desiredSha256: sha256(output.desiredBytes),
    committed: false,
  };
}

async function cleanupTransaction(transaction) {
  await removeOwned(transaction.stagePath, transaction.desiredSha256);
  if (transaction.snapshot.exists) {
    await removeOwned(transaction.backupPath, transaction.snapshot.sha256);
  }
}

async function rollbackTransactions(transactions, originalError) {
  const rollbackErrors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      if (transaction.committed) {
        const current = await readFile(transaction.snapshot.absolutePath);
        invariant(
          sha256(current) === transaction.desiredSha256,
          `${transaction.relativePath}: committed output changed before rollback`,
        );
        if (transaction.snapshot.exists) {
          await rename(
            transaction.backupPath,
            transaction.snapshot.absolutePath,
          );
        } else {
          await unlink(transaction.snapshot.absolutePath);
        }
      }
      await cleanupTransaction(transaction);
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  if (rollbackErrors.length) {
    throw new AggregateError(
      [originalError, ...rollbackErrors],
      `post-M1 runtime successor transaction failed with ${rollbackErrors.length} rollback failure(s)`,
    );
  }
  throw originalError;
}

async function commitOutputs(
  projectRoot,
  outputs,
  inputRecords,
  transactionHooks = {},
) {
  const batchId =
    `${process.pid}-${Date.now()}-${randomBytes(8).toString("hex")}`;
  const transactions = [];
  try {
    for (const output of outputs) {
      const current = await outputSnapshot(
        projectRoot,
        output.relativePath,
        `${output.relativePath}: pre-stage CAS`,
      );
      invariant(
        sameOutputSnapshot(output.snapshot, current),
        `${output.relativePath}: output changed after preflight`,
      );
      transactions.push(await prepareTransaction(output, batchId));
    }
    await assertInputsUnchanged(inputRecords);
    for (const [index, transaction] of transactions.entries()) {
      let current = await outputSnapshot(
        projectRoot,
        transaction.relativePath,
        `${transaction.relativePath}: pre-commit CAS`,
      );
      invariant(
        sameOutputSnapshot(transaction.snapshot, current),
        `${transaction.relativePath}: output changed before commit`,
      );
      await assertInputsUnchanged(inputRecords);
      await transactionHooks.beforeCommit?.({
        index,
        relativePath: transaction.relativePath,
      });
      current = await outputSnapshot(
        projectRoot,
        transaction.relativePath,
        `${transaction.relativePath}: commit CAS`,
      );
      invariant(
        sameOutputSnapshot(transaction.snapshot, current),
        `${transaction.relativePath}: output changed during commit CAS`,
      );
      await assertInputsUnchanged(inputRecords);
      if (transaction.snapshot.exists) {
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
      transaction.committed = true;
      invariant(
        sha256(await readFile(transaction.snapshot.absolutePath)) ===
          transaction.desiredSha256,
        `${transaction.relativePath}: committed bytes drifted`,
      );
      await transactionHooks.afterCommit?.({
        index,
        relativePath: transaction.relativePath,
      });
    }
  } catch (error) {
    await rollbackTransactions(transactions, error);
  }
  for (const transaction of transactions) {
    await cleanupTransaction(transaction);
  }
}

export async function materializeG5L5PostM1RuntimeAcquisitionSuccessors({
  projectRoot = DEFAULT_PROJECT_ROOT,
  mode = "dry-run",
  expectedMemberCount = EXPECTED_MEMBER_COUNT,
  expectedPageCount = EXPECTED_PAGE_COUNT,
  expectedShellCount = EXPECTED_SHELL_COUNT,
  expectedReleaseFingerprint =
    G5_L5_POST_M1_RUNTIME_RELEASE_FINGERPRINT_SHA256,
  staticCompositeProofResolver = null,
  staticCompositeEvidenceBuilder = undefined,
  transactionHooks = {},
} = {}) {
  const root = await realpath(path.resolve(projectRoot));
  invariant(
    ["dry-run", "apply", "check"].includes(mode),
    "mode must be dry-run, apply, or check",
  );
  invariant(
    Number.isSafeInteger(expectedMemberCount) && expectedMemberCount > 0,
    "expected member count must be positive",
  );
  invariant(
    expectedPageCount + expectedShellCount === expectedMemberCount,
    "expected page/shell/member counts are inconsistent",
  );
  invariant(
    SHA256_PATTERN.test(expectedReleaseFingerprint || ""),
    "expected release fingerprint is invalid",
  );

  const [releaseRecord, generator] = await Promise.all([
    readFileRecord(root, RELEASE_RELATIVE, {
      json: true,
      label: "G5 L5 release manifest",
    }),
    readFileRecord(root, GENERATOR_RELATIVE, {
      label: "post-M1 runtime successor generator",
    }),
  ]);
  const validationOptions = {
    expectedMemberCount,
    expectedPageCount,
    expectedShellCount,
    expectedReleaseFingerprint,
  };
  const {release, releaseFingerprint} = selectRelease(
    releaseRecord.document,
    validationOptions,
  );
  const resolveStaticCompositeProof =
    staticCompositeProofResolver ??
    createG5L5StaticCompositeProofResolver({
      projectRoot: root,
      evidenceBuilder: staticCompositeEvidenceBuilder,
    });
  const loadedMembers = [];
  for (const member of release.members) {
    loadedMembers.push(
      await loadMember(root, member, resolveStaticCompositeProof),
    );
  }
  const memberOutputs = loadedMembers.map(
    ({member, records, frameDomainFacts}) => {
      const document = buildMemberDocument({
        member,
        releaseFingerprint,
        generator,
        records,
        frameDomainFacts,
      });
      validateG5L5PostM1RuntimeAcquisitionSuccessor(document, member, {
        expectedReleaseFingerprint,
      });
      return memberRenderedRecord(member, document);
    },
  );
  const report = buildAggregateReport({
    release,
    releaseFingerprint,
    releaseRecord,
    generator,
    memberOutputs,
  });
  validateG5L5PostM1RuntimeAcquisitionReport(
    report,
    release,
    validationOptions,
  );
  const markdown = renderMarkdown(report);
  const reportJsonRelative =
    `${G5_L5_POST_M1_RUNTIME_REPORT_PREFIX}.json`;
  const reportMarkdownRelative =
    `${G5_L5_POST_M1_RUNTIME_REPORT_PREFIX}.md`;
  const desired = [
    ...memberOutputs.map((output) => ({
      kind: "member-json",
      member: output.member,
      relativePath: output.relativePath,
      desiredBytes: output.bytes,
    })),
    {
      kind: "report-json",
      relativePath: reportJsonRelative,
      desiredBytes: Buffer.from(stableJson(report)),
    },
    {
      kind: "report-markdown",
      relativePath: reportMarkdownRelative,
      desiredBytes: Buffer.from(markdown),
    },
  ];
  invariant(
    desired.length === expectedMemberCount + 2 &&
      new Set(desired.map(({relativePath}) => relativePath)).size ===
        desired.length,
    "post-M1 runtime successor output set is incomplete or duplicated",
  );

  const context = {
    release,
    releaseFingerprint,
    validationOptions,
  };
  const outputs = [];
  for (const output of desired) {
    const snapshot = await outputSnapshot(
      root,
      output.relativePath,
      output.relativePath,
    );
    const prepared = {...output, snapshot};
    assertOwnedExistingOutput(prepared, context);
    outputs.push(prepared);
  }
  const stale = outputs.filter(
    ({snapshot, desiredBytes}) =>
      !snapshot.exists || !snapshot.contents.equals(desiredBytes),
  );
  const inputRecords = [
    releaseRecord,
    generator,
    ...loadedMembers.flatMap(({inputRecords: records}) => records),
  ];
  const uniqueInputs = [
    ...new Map(inputRecords.map((record) => [record.absolutePath, record]))
      .values(),
  ];
  await assertInputsUnchanged(uniqueInputs);

  if (mode === "check") {
    invariant(
      stale.length === 0,
      `post-M1 runtime successor outputs are missing or stale (${stale.length} file(s))`,
    );
  } else if (mode === "apply" && stale.length > 0) {
    await commitOutputs(root, outputs, uniqueInputs, transactionHooks);
    for (const output of outputs) {
      const current = await outputSnapshot(
        root,
        output.relativePath,
        `${output.relativePath}: post-commit`,
      );
      invariant(
        current.exists && current.contents.equals(output.desiredBytes),
        `${output.relativePath}: post-commit verification failed`,
      );
    }
    await assertInputsUnchanged(uniqueInputs);
  }

  return {
    action:
      mode === "check"
        ? "verified"
        : mode === "apply"
          ? stale.length
            ? "applied"
            : "already-current"
          : "dry-run",
    releaseId: G5_L5_POST_M1_RUNTIME_RELEASE_ID,
    releaseFingerprintSha256: releaseFingerprint,
    memberCount: expectedMemberCount,
    outputCount: outputs.length,
    staleOutputCount: stale.length,
    historicalPlanCount: expectedMemberCount,
    historicalPlansModified: 0,
    emptyWorksheetCount: expectedMemberCount,
    runnableCount: 0,
    namedOperatorCount: 0,
    runtimeSessionCount: 0,
    guiExecutionCount: 0,
    structurallyReachableChildTimelineCount:
      report.summary.structurallyReachableChildTimelineCount,
    evidenceBoundCompositeChildDispositionCount:
      report.summary.evidenceBoundCompositeChildDispositionCount,
    unresolvedChildDispositionCount:
      report.summary.unresolvedChildDispositionCount,
    excludedNotProvenTimelineCount:
      report.summary.excludedNotProvenTimelineCount,
    strictCompleteCount: 0,
    published: false,
    reportFingerprintSha256: report.reportFingerprintSha256,
    outputs: outputs.map(({relativePath, desiredBytes}) => ({
      path: relativePath,
      bytes: desiredBytes.length,
      sha256: sha256(desiredBytes),
    })),
  };
}

export function parseArguments(argv) {
  let mode = "dry-run";
  let modeSeen = false;
  let help = false;
  for (const argument of argv) {
    if (argument === "--dry-run") {
      invariant(!modeSeen, "choose exactly one of --dry-run, --apply, or --check");
      mode = "dry-run";
      modeSeen = true;
    } else if (argument === "--apply") {
      invariant(!modeSeen, "choose exactly one of --dry-run, --apply, or --check");
      mode = "apply";
      modeSeen = true;
    } else if (argument === "--check") {
      invariant(!modeSeen, "choose exactly one of --dry-run, --apply, or --check");
      mode = "check";
      modeSeen = true;
    } else if (argument === "--help" || argument === "-h") {
      help = true;
    } else {
      throw new Error(`unknown option: ${argument}`);
    }
  }
  return {mode, help};
}

function usage() {
  return `Usage: node ${GENERATOR_RELATIVE} [--dry-run | --apply | --check]

Creates only:
  migrations/<57 exact G5 L5 members>/audit/machine/${G5_L5_POST_M1_RUNTIME_OUTPUT_NAME}
  ${G5_L5_POST_M1_RUNTIME_REPORT_PREFIX}.json
  ${G5_L5_POST_M1_RUNTIME_REPORT_PREFIX}.md

The prior release-runtime-acquisition-plan.json files are read-only historical inputs.
No GUI/runtime/endpoint is launched; no operator, session, review, acceptance, strict
completion, publication, budget, or procurement authority is created.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result =
    await materializeG5L5PostM1RuntimeAcquisitionSuccessors(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
