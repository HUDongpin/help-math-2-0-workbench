#!/usr/bin/env node

import {constants} from "node:fs";
import {createHash, randomBytes} from "node:crypto";
import {
  link,
  lstat,
  open,
  readFile,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  validateG5L5M1StaticReconciliationReceipt,
} from "./adopt-g5-l5-m1-static-specification.mjs";
import {validateScenarioInventory} from "./build-course-scenario-inventories.mjs";
import {
  G5_L5_STATIC_STRICT_READINESS_STATE,
  validateG5L5StaticStrictReadiness,
} from "./build-g5-l5-static-strict-readiness.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
export const MEMBER_OUTPUT_NAME =
  "g5-l5-coverage-trace-obligation-plan.json";
export const REPORT_JSON_PATH =
  "reports/g5-l5-coverage-trace-obligation-matrix.json";
export const REPORT_MARKDOWN_PATH =
  "reports/g5-l5-coverage-trace-obligation-matrix.md";

const RELEASE_PATH = "catalog/lesson-releases.json";
const GENERATOR_PATH =
  "scripts/build-g5-l5-coverage-trace-obligation-matrix.mjs";
const EXPECTED_MEMBER_COUNT = 57;
const EXPECTED_PAGE_COUNT = 56;
const EXPECTED_SHELL_COUNT = 1;
const EXPECTED_ROOT_REQUIREMENT_COUNT = 114;
const EXPECTED_ROOT_MISSING_FRAME_COUNT = 1220;
const EXPECTED_DECLARED_ROOT_COUNT = 57;
const EXPECTED_NESTED_DEFINITION_COUNT = 1232;
const EXPECTED_UNRESOLVED_CHILD_COUNT = 351;
const EXPECTED_EVIDENCE_BOUND_COMPOSITE_CHILD_COUNT = 696;
const EXPECTED_EXCLUDED_NOT_PROVEN_COUNT = 185;
const EXPECTED_LONGER_THAN_ROOT_COUNT = 258;
const EXPECTED_HIGH_RISK_COUNT = 93;
const MANAGED_OUTPUT_MODE = 0o644;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,127}$/;

const MEMBER_INPUTS = Object.freeze({
  migrationManifest: "migration.json",
  m1StaticReconciliationReceipt:
    "audit/machine/g5-l5-m1-static-reconciliation-receipt.json",
  scenarioInventory: "audit/scenario-inventory.json",
  frameDomainDisposition: "audit/frame-domain-disposition.json",
  coverageV2: "evidence/full-frame-coverage.json",
  strictReadiness: "audit/strict-readiness.json",
});
const STATIC_DISPOSITION_EVIDENCE_PATH =
  "audit/static-frame-domain-disposition-evidence.json";

const ACCEPTANCE_EFFECTS = Object.freeze({
  authoringAccepted: false,
  audioAccepted: false,
  authoritativeOriginalRuntimeAccepted: false,
  currentJavaScriptCandidate: false,
  fidelityAccepted: false,
  fullFrameComparisonAccepted: false,
  humanVisualAccepted: false,
  implementationAuthorized: false,
  independentEngineeringAccepted: false,
  ownerAccepted: false,
  published: false,
  rmseAccepted: false,
  runtimeReachabilityEstablished: false,
  strictComplete: false,
});

const PROTECTED_MUTATIONS = Object.freeze({
  canonicalCoverageWritten: false,
  canonicalKeyframesWritten: false,
  traceSpecCreated: false,
  rendererSelected: false,
  implementationStarted: false,
  guiLaunched: false,
  browserLaunched: false,
  ruffleLaunched: false,
  originalRuntimeLaunched: false,
  reviewRecorded: false,
  acceptanceAdvanced: false,
  completionLedgerChanged: false,
  publicationChanged: false,
});

const ROUTE_POLICIES = Object.freeze({
  "child-domain-authority-entry-state-trace-v1": {
    staticAuthority:
      "structural candidate only; the disposition is not runtime reachability evidence",
    futureAuthority:
      "authorized original-runtime natural host entry, or exact authoring/source evidence reviewed under the project evidence order",
    entryStateResolution:
      "prove the complete parent placement chain, parent frame, local entry frame, language, host state, and entry-state hash before assigning an independent or composite domain",
    traceResolution:
      "create a trace obligation only after reachability, disposition, and exact entry state are evidenced; preserve every local frame when independent-required",
    namedHumanRequired:
      "yes for original-runtime operation, observation, and session attestation",
  },
  "button-authority-entry-state-trace-v1": {
    staticAuthority:
      "button definition, encoded event, hit-record, and placement candidate only",
    futureAuthority:
      "authorized original-runtime natural interaction with source-evidenced placement and event identity",
    entryStateResolution:
      "resolve the containing frame domain, exact placement, language, host state, and stage-space target before interaction",
    traceResolution:
      "record ordered pointer/keyboard events and up, over, down, hit, result, terminal, and reset states for every reachable placement",
    namedHumanRequired:
      "yes for authoritative original-runtime interaction and attestation",
  },
  "drag-authority-entry-state-trace-v1": {
    staticAuthority:
      "exported drag handler and static bound expression candidate only",
    futureAuthority:
      "authorized original-runtime natural drag observation with exact coordinates and source identity",
    entryStateResolution:
      "resolve containing domain, placement, start position, bounds, host variables, language, and entry-state hash",
    traceResolution:
      "record press/start, ordered coordinate samples, minimum/intermediate/maximum positions, release, releaseOutside where encoded, result, and Replay/reset",
    namedHumanRequired:
      "yes for authoritative original-runtime drag operation and attestation",
  },
  "branch-authority-entry-state-trace-v1": {
    staticAuthority:
      "exported conditional expression candidate only; reachability and feasibility are unresolved",
    futureAuthority:
      "source-evidenced fixtures plus authorized original-runtime execution of every reachable outcome",
    entryStateResolution:
      "resolve all prerequisite values, containing domain, language, host state, and entry-state hash without guessing defaults",
    traceResolution:
      "record one ordered natural trace per reachable outcome; document an evidence-backed exception for an infeasible outcome",
    namedHumanRequired:
      "yes for authoritative original-runtime execution and attestation",
  },
  "random-authority-entry-state-trace-v1": {
    staticAuthority:
      "exported random expression and outcome-shape candidate only",
    futureAuthority:
      "source-proven random domain and authorized original-runtime observation; deterministic seeds only when evidenced",
    entryStateResolution:
      "resolve containing domain, prerequisite array/range values, language, host state, and entry-state hash",
    traceResolution:
      "record the injected or observed outcome, seed/fixture authority, ordered events, resulting states, terminal behavior, and reset for every required outcome",
    namedHumanRequired:
      "yes for authoritative original-runtime observation and attestation",
  },
  "interaction-authority-entry-state-trace-v1": {
    staticAuthority:
      "static scenario obligation only",
    futureAuthority:
      "source evidence plus authorized original-runtime natural reachability",
    entryStateResolution:
      "resolve containing domain, exact prerequisite state, language, host state, and entry-state hash",
    traceResolution:
      "record the complete ordered natural trace, terminal state, and Replay/reset semantics",
    namedHumanRequired:
      "yes whenever original-runtime operation, listening, visual judgment, or attestation is required",
  },
});

const ADDITIONAL_CATEGORIES = Object.freeze([
  "timelineStateCoverage",
  "handlerBehaviorGroups",
  "inputObligations",
  "correctWrongObligations",
  "labeledStateObligations",
  "glossaryAndHyperlinkObligations",
  "sectionMenuObligations",
  "courseRouteObligations",
  "sideEffectObligations",
  "dependencyFixtureObligations",
  "replayCandidates",
  "terminalCandidates",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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

function fingerprint(value) {
  return sha256(stableJson(value));
}

function withFingerprint(value) {
  return {
    ...value,
    artifactFingerprintSha256: fingerprint(value),
  };
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${label}: path must be project-relative and portable`,
  );
  const absolutePath = path.resolve(projectRoot, relativePath);
  invariant(
    isWithin(projectRoot, absolutePath) &&
      portable(path.relative(projectRoot, absolutePath)) === relativePath,
    `${label}: path escapes the project root or is not normalized`,
  );
  return absolutePath;
}

async function assertOrdinaryAncestorTree(projectRoot, absolutePath, label) {
  const relativeParent = path.relative(projectRoot, path.dirname(absolutePath));
  invariant(
    relativeParent !== ".." &&
      !relativeParent.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativeParent),
    `${label}: parent escapes project root`,
  );
  const parts = relativeParent.split(path.sep).filter(Boolean);
  const ancestors = [
    projectRoot,
    ...parts.map((_, index) =>
      path.join(projectRoot, ...parts.slice(0, index + 1))),
  ];
  for (const ancestor of ancestors) {
    const information = await lstat(ancestor, {bigint: true}).catch(
      (error) => {
        throw new Error(`${label}: ancestor is unavailable (${error.message})`);
      },
    );
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label}: ancestor must be a real directory`,
    );
  }
  const [realRoot, realParent] = await Promise.all([
    realpath(projectRoot),
    realpath(path.dirname(absolutePath)),
  ]);
  invariant(
    isWithin(realRoot, realParent),
    `${label}: real parent escapes project root`,
  );
  const parentInformation = await lstat(
    path.dirname(absolutePath),
    {bigint: true},
  );
  return {
    parentPath: path.dirname(absolutePath),
    parentIdentity: {
      dev: String(parentInformation.dev),
      ino: String(parentInformation.ino),
      mode: String(parentInformation.mode),
    },
  };
}

function statIdentity(information) {
  return {
    dev: String(information.dev),
    ino: String(information.ino),
    mode: String(information.mode),
    size: String(information.size),
    mtimeNs: String(information.mtimeNs),
    ctimeNs: String(information.ctimeNs),
    nlink: String(information.nlink),
  };
}

function permissionMode(information) {
  return Number(information.mode & 0o777n);
}

function sameIdentity(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameInodeIdentity(left, right) {
  return left?.dev === right?.dev && left?.ino === right?.ino;
}

function sameDisplacedIdentity(left, right) {
  return [
    "dev",
    "ino",
    "mode",
    "size",
    "mtimeNs",
    "nlink",
  ].every((key) => left?.[key] === right?.[key]);
}

async function lstatOrNull(absolutePath) {
  try {
    return await lstat(absolutePath, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function readStableAbsoluteFile(
  projectRoot,
  absolutePath,
  label,
) {
  await assertOrdinaryAncestorTree(projectRoot, absolutePath, label);
  const before = await lstatOrNull(absolutePath);
  invariant(before, `${label}: required file is missing`);
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink === 1n,
    `${label}: expected one ordinary non-linked file`,
  );
  const handle = await open(
    absolutePath,
    constants.O_RDONLY | (constants.O_NOFOLLOW || 0),
  );
  let bytes;
  let descriptorBefore;
  let descriptorAfter;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    invariant(
      descriptorBefore.isFile() &&
        descriptorBefore.nlink === 1n &&
        sameIdentity(
          statIdentity(before),
          statIdentity(descriptorBefore),
        ),
      `${label}: changed before read`,
    );
    bytes = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
    invariant(
      sameIdentity(
        statIdentity(descriptorBefore),
        statIdentity(descriptorAfter),
      ),
      `${label}: changed during read`,
    );
  } finally {
    await handle.close();
  }
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    after.isFile() &&
      !after.isSymbolicLink() &&
      after.nlink === 1n &&
      sameIdentity(
        statIdentity(descriptorAfter),
        statIdentity(after),
      ) &&
      BigInt(bytes.length) === after.size,
    `${label}: changed after read`,
  );
  const [realRoot, realFile] = await Promise.all([
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(
    isWithin(realRoot, realFile),
    `${label}: resolves outside project root`,
  );
  return {
    bytes,
    byteCount: bytes.length,
    sha256: sha256(bytes),
    identity: statIdentity(after),
  };
}

async function readOrdinaryFile(projectRoot, relativePath, {
  json = false,
  label = relativePath,
} = {}) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  const stable = await readStableAbsoluteFile(
    projectRoot,
    absolutePath,
    label,
  );
  let document = null;
  if (json) {
    try {
      document = JSON.parse(stable.bytes.toString("utf8"));
    } catch (error) {
      throw new Error(`${label}: invalid JSON (${error.message})`);
    }
  }
  return {
    path: relativePath,
    absolutePath,
    ...stable,
    document,
  };
}

function descriptor(binding) {
  return {
    path: binding.path,
    bytes: binding.byteCount,
    sha256: binding.sha256,
  };
}

async function snapshotOutput(projectRoot, relativePath, label) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  const ancestor = await assertOrdinaryAncestorTree(
    projectRoot,
    absolutePath,
    label,
  );
  const information = await lstatOrNull(absolutePath);
  if (!information) {
    return {
      path: relativePath,
      absolutePath,
      exists: false,
      identity: null,
      bytes: null,
      sha256: null,
      ...ancestor,
    };
  }
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${label}: expected one ordinary non-linked file`,
  );
  const binding = await readOrdinaryFile(projectRoot, relativePath, {label});
  return {
    path: relativePath,
    absolutePath,
    exists: true,
    identity: binding.identity,
    bytes: binding.bytes,
    sha256: binding.sha256,
    ...ancestor,
  };
}

async function assertSnapshotUnchanged(projectRoot, snapshot, label) {
  const ancestor = await assertOrdinaryAncestorTree(
    projectRoot,
    snapshot.absolutePath,
    label,
  );
  invariant(
    ancestor.parentPath === snapshot.parentPath &&
      JSON.stringify(ancestor.parentIdentity) ===
        JSON.stringify(snapshot.parentIdentity),
    `${label}: output parent changed during commit CAS`,
  );
  const current = await lstatOrNull(snapshot.absolutePath);
  if (!snapshot.exists) {
    invariant(!current, `${label}: changed during commit CAS`);
    return;
  }
  invariant(
    current &&
      current.isFile() &&
      !current.isSymbolicLink() &&
      current.nlink === 1n &&
      sameIdentity(snapshot.identity, statIdentity(current)),
    `${label}: changed during commit CAS`,
  );
}

async function assertInputsUnchanged(projectRoot, inputs) {
  for (const input of inputs) {
    const current = await readStableAbsoluteFile(
      projectRoot,
      input.absolutePath,
      `${input.path}: bound input`,
    );
    invariant(
      current.sha256 === input.sha256 &&
        current.byteCount === input.byteCount &&
        sameIdentity(input.identity, current.identity),
      `${input.path}: input changed after preflight`,
    );
  }
}

function releaseFingerprint(release) {
  return sha256(Buffer.from(stableJson(release)));
}

function assertAllFalse(object, label) {
  invariant(object && typeof object === "object", `${label}: object is required`);
  for (const [key, value] of Object.entries(object)) {
    invariant(value === false, `${label}.${key} must be false`);
  }
}

function validateRelease(catalog, expectedFingerprint) {
  invariant(
    catalog?.schemaVersion === 1 && Array.isArray(catalog.releases),
    "lesson release catalog schema is invalid",
  );
  const release = catalog.releases.find(({releaseId}) => releaseId === RELEASE_ID);
  invariant(release, `missing release ${RELEASE_ID}`);
  invariant(
    release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages === EXPECTED_PAGE_COUNT &&
      release.expectedCounts?.courseShells === EXPECTED_SHELL_COUNT &&
      release.expectedCounts?.members === EXPECTED_MEMBER_COUNT &&
      release.members?.length === EXPECTED_MEMBER_COUNT,
    "G5 L5 release shape drifted",
  );
  invariant(
    releaseFingerprint(release) === expectedFingerprint,
    "G5 L5 release fingerprint drifted",
  );
  const ids = new Set();
  let pages = 0;
  let shells = 0;
  release.members.forEach((member, index) => {
    invariant(
      member.ordinal === index + 1 &&
        SAFE_ID.test(member.animationId || "") &&
        !ids.has(member.animationId) &&
        member.assetId === `swf-${member.source?.sha256}` &&
        SHA256_PATTERN.test(member.source?.sha256 || ""),
      `G5 L5 release member ${index + 1} identity drifted`,
    );
    ids.add(member.animationId);
    if (member.releaseRole === "active-xml-referenced-page") pages += 1;
    else if (member.releaseRole === "course-shell") shells += 1;
    else throw new Error(`${member.animationId}: unsupported release role`);
  });
  invariant(
    pages === EXPECTED_PAGE_COUNT && shells === EXPECTED_SHELL_COUNT,
    "G5 L5 page/shell member counts drifted",
  );
  return release;
}

function validateManifest(manifest, member) {
  invariant(
    manifest?.schemaVersion === 2 &&
      manifest.id === member.animationId &&
      manifest.status === "preserved",
    `${member.animationId}: current manifest identity/status drifted`,
  );
  invariant(
    manifest.source?.swfSha256 === member.source.sha256 &&
      manifest.source?.swf?.endsWith(member.source.path),
    `${member.animationId}: manifest source binding drifted`,
  );
  invariant(
    Number.isSafeInteger(manifest.runtime?.frameCount) &&
      manifest.runtime.frameCount > 0 &&
      Number.isFinite(manifest.runtime?.fps) &&
      manifest.runtime.fps > 0,
    `${member.animationId}: manifest root timeline facts are invalid`,
  );
  const domains = manifest.implementation?.frameDomains;
  invariant(
    Array.isArray(domains) &&
      domains.length === 1 &&
      domains[0].id === "root" &&
      domains[0].kind === "root" &&
      domains[0].sourceTimelineId === "root" &&
      domains[0].frameCount === manifest.runtime.frameCount,
    `${member.animationId}: current manifest is not the expected root-only static declaration`,
  );
  invariant(
    manifest.implementation?.rendering === "undecided" &&
      manifest.implementation?.route === "" &&
      manifest.implementation?.routeFile === "" &&
      manifest.implementation?.component === "" &&
      manifest.implementation?.registryModule === "" &&
      manifest.implementation?.timelineModule === "" &&
      manifest.implementation?.testFile === "" &&
      manifest.implementation?.standalonePackage === "",
    `${member.animationId}: renderer or implementation artifact was selected`,
  );
}

function validateCoverage(coverage, member, manifest) {
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === member.animationId &&
      Array.isArray(coverage.requirements) &&
      coverage.requirements.length === 2,
    `${member.animationId}: coverage-v2 must contain exactly two root requirements`,
  );
  const languages = new Set();
  let missingFrameCount = 0;
  for (const requirement of coverage.requirements) {
    invariant(
      requirement.frameDomainId === "root" &&
        requirement.scenario === "default" &&
        ["en", "es"].includes(requirement.language) &&
        !languages.has(requirement.language) &&
        requirement.status === "pending" &&
        requirement.baselineAuthority === "unresolved" &&
        requirement.capturedFrameCount === 0 &&
        requirement.requiredRange?.firstFrame === 1 &&
        requirement.requiredRange?.lastFrame === manifest.runtime.frameCount &&
        Array.isArray(requirement.missingFrames) &&
        requirement.missingFrames.length === manifest.runtime.frameCount &&
        requirement.missingFrames.every((frame, index) => frame === index + 1) &&
        requirement.baselineCaptureManifest === "" &&
        requirement.captureManifest === "" &&
        requirement.metricsFile === "",
      `${member.animationId}: coverage-v2 crossed the root-only pending boundary`,
    );
    languages.add(requirement.language);
    missingFrameCount += requirement.missingFrames.length;
  }
  invariant(
    languages.size === 2,
    `${member.animationId}: coverage-v2 must preserve separate EN and ES requirements`,
  );
  return {
    requirementCount: 2,
    pendingRequirementCount: 2,
    missingFrameCount,
  };
}

function validateFrameDomainDisposition(document, member, bindings, manifest) {
  invariant(
    document?.schemaVersion === 1 &&
      document.animationId === member.animationId &&
      document.migrationStatusChanged === false &&
      String(document.strictAcceptanceEffect || "").startsWith("none;"),
    `${member.animationId}: frame-domain disposition identity/status drifted`,
  );
  const generated = document.generatedFrom || {};
  invariant(
    generated.lessonReleaseCatalog?.releaseId === RELEASE_ID &&
      generated.lessonReleaseCatalog?.member?.animationId ===
        member.animationId &&
      generated.lessonReleaseCatalog?.member?.ordinal === member.ordinal &&
      generated.lessonReleaseCatalog?.member?.assetId === member.assetId &&
      generated.lessonReleaseCatalog?.member?.sourceSha256 ===
        member.source.sha256 &&
      generated.scenarioInventory?.path === "audit/scenario-inventory.json" &&
      generated.scenarioInventory?.sha256 === bindings.scenarioInventory.sha256 &&
      generated.sourceSwf?.sha256 === member.source.sha256,
    `${member.animationId}: frame-domain generatedFrom bindings drifted`,
  );
  const timelines = document.timelines;
  invariant(
    Array.isArray(timelines) &&
      timelines.length >= 1 &&
      new Set(timelines.map(({timelineId}) => timelineId)).size === timelines.length,
    `${member.animationId}: frame-domain timeline set is invalid`,
  );
  const root = timelines.find(({timelineId}) => timelineId === "root");
  invariant(
    root?.disposition === "declared-frame-domain" &&
      root.frameCount === manifest.runtime.frameCount,
    `${member.animationId}: declared root frame domain drifted`,
  );
  const children = timelines.filter(({timelineId}) => timelineId !== "root");
  invariant(
    children.every(
      (timeline) =>
        ["unresolved", "composite-child-with-parent"].includes(
          timeline.disposition,
        ) &&
        timeline.declaredFrameDomains?.length === 0 &&
        Number.isSafeInteger(timeline.frameCount) &&
        timeline.frameCount > 0,
    ),
    `${member.animationId}: a child frame-domain disposition is unsupported`,
  );
  const unresolvedChildren = children.filter(
    ({disposition}) => disposition === "unresolved",
  );
  const compositeChildren = children.filter(
    ({disposition}) => disposition === "composite-child-with-parent",
  );
  const staticEvidence = generated.staticDispositionEvidence;
  if (compositeChildren.length > 0) {
    const physicalStaticEvidence = bindings.staticDispositionEvidence;
    const evidenceGenerated =
      physicalStaticEvidence?.document?.generatedFrom || {};
    const evidenceContract =
      physicalStaticEvidence?.document?.claimSetContracts?.[0];
    const sortedCompositeIds = compositeChildren
      .map(({timelineId}) => timelineId)
      .sort();
    invariant(
      staticEvidence?.path ===
          STATIC_DISPOSITION_EVIDENCE_PATH &&
        SHA256_PATTERN.test(staticEvidence.sha256 || "") &&
        staticEvidence.schemaVersion === 2 &&
        staticEvidence.status === "verified-static-composite-claims" &&
        staticEvidence.bindingStatus === "verified-and-rebuilt" &&
        Number.isSafeInteger(staticEvidence.claimCount) &&
        staticEvidence.claimCount === compositeChildren.length &&
        physicalStaticEvidence?.sha256 === staticEvidence.sha256 &&
        physicalStaticEvidence.document?.schemaVersion ===
          staticEvidence.schemaVersion &&
        physicalStaticEvidence.document?.evidenceType ===
          "static-frame-domain-disposition-evidence" &&
        physicalStaticEvidence.document?.animationId === member.animationId &&
        physicalStaticEvidence.document?.status === staticEvidence.status &&
        physicalStaticEvidence.document?.migrationStatusChanged === false &&
        Array.isArray(physicalStaticEvidence.document?.claims) &&
        physicalStaticEvidence.document.claims.length ===
          staticEvidence.claimCount &&
        physicalStaticEvidence.document.claimSetContracts?.length === 1 &&
        evidenceContract?.proofType ===
          "single-frame-scriptless-structural-child" &&
        evidenceContract.exactMatch === true &&
        evidenceContract.expectedTimelineCount === compositeChildren.length &&
        evidenceContract.verifiedTimelineCount === compositeChildren.length &&
        JSON.stringify(
          [...(evidenceContract.expectedTimelineIds || [])].sort(),
        ) === JSON.stringify(sortedCompositeIds) &&
        JSON.stringify(
          [...(evidenceContract.verifiedTimelineIds || [])].sort(),
        ) === JSON.stringify(sortedCompositeIds),
      `${member.animationId}: composite dispositions lack one exact evidence-file binding`,
    );
    invariant(
      evidenceGenerated.sourceSwf?.path === generated.sourceSwf?.path &&
        evidenceGenerated.sourceSwf?.sha256 === member.source.sha256 &&
        evidenceGenerated.scenarioInventory?.path ===
          "audit/scenario-inventory.json" &&
        evidenceGenerated.scenarioInventory?.sha256 ===
          bindings.scenarioInventory.sha256 &&
        evidenceGenerated.swfmillStructure?.path ===
          generated.swfmillStructure?.path &&
        evidenceGenerated.swfmillStructure?.sha256 ===
          generated.swfmillStructure?.sha256 &&
        evidenceGenerated.ffdecScripts?.path ===
          bindings.scenarioInventory.document.evidenceIndex.find(
            ({artifactId}) => artifactId === "ffdec-scripts",
          )?.path &&
        evidenceGenerated.ffdecScripts?.sha256 ===
          bindings.scenarioInventory.document.evidenceIndex.find(
            ({artifactId}) => artifactId === "ffdec-scripts",
          )?.sha256 &&
        evidenceGenerated.migrationManifest?.sha256 ===
          generated.migrationManifest?.technicalProjectionSha256 &&
        evidenceGenerated
          ?.reviewedSingleFrameSelection?.selection?.humanReviewer === false &&
        evidenceGenerated
          ?.reviewedSingleFrameSelection?.selection?.ownerAcceptance ===
          false &&
        String(
          physicalStaticEvidence.document.strictAcceptanceEffect || "",
        ).startsWith("none;"),
      `${member.animationId}: physical static evidence authority/bindings drifted`,
    );
    assertAllFalse(
      physicalStaticEvidence.document.acceptanceEffects,
      `${member.animationId}: physical static evidence acceptanceEffects`,
    );
    const claimIndexes = [];
    for (const timeline of compositeChildren) {
      const evidence = timeline.staticCompositeEvidence;
      const physicalClaim =
        physicalStaticEvidence.document.claims[evidence?.claimIndex];
      invariant(
        evidence?.evidencePath === staticEvidence.path &&
          evidence.evidenceSha256 === staticEvidence.sha256 &&
          Number.isSafeInteger(evidence.claimIndex) &&
          evidence.claimIndex >= 0 &&
          evidence.claimIndex < staticEvidence.claimCount &&
          evidence.role === "single-frame-scriptless-structural-child" &&
          evidence.claimScope === "independent-local-playhead-only" &&
          evidence.clipActionCount === 0 &&
          Array.isArray(evidence.parentTimelineIds) &&
          evidence.parentTimelineIds.length > 0 &&
          timeline.frameCount === 1 &&
          physicalClaim?.timelineId === timeline.timelineId &&
          physicalClaim?.sourceObjectId === timeline.sourceObjectId &&
          physicalClaim?.frameCount === timeline.frameCount &&
          physicalClaim?.disposition === timeline.disposition &&
          physicalClaim?.role === evidence.role &&
          timeline.sourceEvidence?.scenarioInventorySha256 ===
            bindings.scenarioInventory.sha256 &&
          [
            "buttonObligation",
            "interactionObligation",
            "behaviorObligation",
            "fullFrameObligation",
            "audioObligation",
          ].every(
            (key) =>
              evidence[key]?.required === true &&
              evidence[key]?.satisfiedByDisposition === false,
          ),
        `${member.animationId}/${timeline.timelineId}: composite disposition is not bound to the exact static proof`,
      );
      claimIndexes.push(evidence.claimIndex);
    }
    invariant(
      new Set(claimIndexes).size === claimIndexes.length &&
        claimIndexes
          .sort((left, right) => left - right)
          .every((claimIndex, index) => claimIndex === index),
      `${member.animationId}: composite dispositions do not consume the exact evidence claim set`,
    );
  } else {
    invariant(
      staticEvidence === undefined &&
        bindings.staticDispositionEvidence === undefined,
      `${member.animationId}: unused static disposition evidence binding is forbidden`,
    );
  }
  invariant(
    document.status === (
      unresolvedChildren.length > 0
        ? "structurally-enumerated-dispositions-unresolved"
        : "structurally-enumerated"
    ),
    `${member.animationId}: frame-domain disposition status/counts disagree`,
  );
  invariant(
    document.summary?.enumeratedTimelineCount === timelines.length &&
      document.summary?.dispositionCounts?.["declared-frame-domain"] === 1 &&
      document.summary?.dispositionCounts?.["composite-child-with-parent"] ===
        compositeChildren.length &&
      document.summary?.dispositionCounts?.["independent-required"] === 0 &&
      document.summary?.dispositionCounts?.nonvisual === 0 &&
      document.summary?.dispositionCounts?.unresolved ===
        unresolvedChildren.length &&
      Object.values(document.summary.dispositionCounts).reduce(
        (total, count) => total + count,
        0,
      ) === timelines.length,
    `${member.animationId}: frame-domain disposition summary drifted`,
  );
  invariant(
    Number.isSafeInteger(document.summary?.excludedNotProvenTimelineCount) &&
      document.summary.excludedNotProvenTimelineCount >= 0 &&
      Number.isSafeInteger(
        document.summary?.highRiskIndependentCandidateCount,
      ) &&
      document.summary.highRiskIndependentCandidateCount >= 0 &&
      document.summary.highRiskIndependentCandidateCount ===
        (document.summary.highRiskIndependentCandidates || []).length,
    `${member.animationId}: frame-domain risk/exclusion summary drifted`,
  );
  return {
    unresolvedChildren,
    compositeChildren,
    excludedNotProvenTimelineCount:
      document.summary.excludedNotProvenTimelineCount,
    highRiskIndependentCandidateCount:
      document.summary.highRiskIndependentCandidateCount,
  };
}

function scenarioCount(coverage, category) {
  if (category === "replayCandidates" || category === "terminalCandidates") {
    return coverage.replayAndTerminalObligations?.[category]?.length || 0;
  }
  return coverage[category]?.length || 0;
}

function validateScenario(document, member) {
  validateScenarioInventory(document);
  invariant(
    document.animationId === member.animationId &&
      document.source?.swfSha256 === member.source.sha256 &&
      document.inventoryStatus === "static-exhaustive-runtime-unverified" &&
      document.migrationStatusChanged === false &&
      String(document.strictAcceptanceEffect || "").startsWith("none;") &&
      Array.isArray(document.coverage?.authoritativeRuntimeCoverage) &&
      document.coverage.authoritativeRuntimeCoverage.length === 0,
    `${member.animationId}: scenario inventory crossed the static-only boundary`,
  );
  const membership = document.evidenceIndex.find(
    ({artifactId}) => artifactId === "lesson-release-membership",
  );
  invariant(
    membership?.releaseId === RELEASE_ID &&
      membership.animationId === member.animationId &&
      membership.ordinal === member.ordinal &&
      membership.assetId === member.assetId &&
      membership.sourceSha256 === member.source.sha256,
    `${member.animationId}: scenario inventory release binding drifted`,
  );
}

function buildStructuralDefinitionSummary({
  scenario,
  manifest,
  dispositionSummary,
}) {
  const root = scenario.timelineInventory.find(
    ({timelineId}) => timelineId === "root",
  );
  invariant(
    root?.frameCount === manifest.runtime.frameCount,
    `${scenario.animationId}: scenario root frame count drifted`,
  );
  const nested = scenario.timelineInventory.filter(
    ({timelineId}) => timelineId !== "root",
  );
  invariant(
    new Set(nested.map(({timelineId}) => timelineId)).size === nested.length,
    `${scenario.animationId}: scenario nested timeline IDs are duplicated`,
  );
  const longerThanRootCount = nested.filter(
    ({frameCount}) => frameCount > root.frameCount,
  ).length;
  invariant(
    nested.length ===
      dispositionSummary.unresolvedChildren.length +
        dispositionSummary.compositeChildren.length +
        dispositionSummary.excludedNotProvenTimelineCount,
    `${scenario.animationId}: nested definitions do not reconcile to routed plus excluded dispositions`,
  );
  return {
    nestedDefinitionCount: nested.length,
    structurallyReachableUnresolvedChildCount:
      dispositionSummary.unresolvedChildren.length,
    evidenceBoundCompositeChildCount:
      dispositionSummary.compositeChildren.length,
    structurallyReachableChildCount:
      dispositionSummary.unresolvedChildren.length +
      dispositionSummary.compositeChildren.length,
    excludedNotProvenTimelineCount:
      dispositionSummary.excludedNotProvenTimelineCount,
    longerThanRootCount,
    highRiskIndependentCandidateCount:
      dispositionSummary.highRiskIndependentCandidateCount,
    excludedNotProven: {
      count: dispositionSummary.excludedNotProvenTimelineCount,
      status:
        "static-definition-retained-root-reachability-not-proven",
      runnableRouteCreated: false,
      futureResolution:
        "retain in the definition census and prove root reachability before creating any entry-state or trace route; do not classify as dead code from absence alone",
    },
  };
}

function validateStrictReadiness(document, member, coverageBinding) {
  validateG5L5StaticStrictReadiness(document, member);
  invariant(
    document.state === G5_L5_STATIC_STRICT_READINESS_STATE &&
      document.coverageReadiness?.evidence?.path ===
        `migrations/${member.animationId}/evidence/full-frame-coverage.json` &&
      document.coverageReadiness?.evidence?.bytes === coverageBinding.byteCount &&
      document.coverageReadiness?.evidence?.sha256 === coverageBinding.sha256 &&
      document.coverageReadiness?.requirementCount === 2 &&
      document.coverageReadiness?.pendingRequirementCount === 2 &&
      document.coverageReadiness?.pendingFrameCount > 0,
    `${member.animationId}: strict-readiness coverage binding drifted`,
  );
  assertAllFalse(
    Object.fromEntries(
      Object.entries(document.acceptance).filter(([key]) => key !== "acceptanceNeutral"),
    ),
    `${member.animationId}: strict-readiness acceptance`,
  );
}

function projectedEvidence(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value.map(projectedEvidence);
  if (typeof value !== "object") return value;
  const allowed = [
    "artifactId",
    "script",
    "line",
    "lineStart",
    "lineEnd",
    "timelineId",
    "objectId",
    "frame",
  ];
  return Object.fromEntries(
    allowed.filter((key) => key in value).map((key) => [key, value[key]]),
  );
}

function staticProjection(item, extra = {}) {
  return {
    ...extra,
    staticFingerprintSha256: fingerprint(item),
    evidence: projectedEvidence(item.evidence),
  };
}

function buildObligationRoutes(children, scenarioCoverage) {
  const childDomains = children.map((timeline) => ({
    obligationId: `child-domain-${timeline.timelineId}`,
    status: "pending-authoritative-reachability-disposition-entry-state-trace",
    routePolicyId: "child-domain-authority-entry-state-trace-v1",
    sourceTimelineId: timeline.sourceTimelineId,
    sourceObjectId: timeline.sourceObjectId,
    frameCount: timeline.frameCount,
    structuralReachability: timeline.structuralReachability,
    currentDisposition: timeline.disposition,
    rootPlacementStatus: timeline.rootPlacement?.status || "unresolved",
    riskLevel: timeline.riskAssessment?.level || "unresolved",
    riskSignals: timeline.riskAssessment?.signals || [],
    staticFingerprintSha256: fingerprint(timeline),
    sourceEvidence: {
      scenarioInventoryPath:
        timeline.sourceEvidence?.scenarioInventoryPath || null,
      scenarioInventorySha256:
        timeline.sourceEvidence?.scenarioInventorySha256 || null,
      swfmillPath: timeline.sourceEvidence?.swfmillPath || null,
      swfmillSha256: timeline.sourceEvidence?.swfmillSha256 || null,
    },
  }));
  const buttons = (scenarioCoverage.buttonTargetObligations || []).map(
    (item, index) =>
      staticProjection(item, {
        obligationId:
          `button-target-${String(item.buttonObjectId || index + 1)}-${index + 1}`,
        status: "pending-authoritative-reachability-entry-state-trace",
        routePolicyId: "button-authority-entry-state-trace-v1",
        buttonObjectId: item.buttonObjectId || null,
        encodedEventConditionCount:
          item.eventsEncodedByConditions?.length || 0,
        hitRecordCount: item.hitRecords?.length || 0,
        placementCount: item.placements?.length || 0,
      }),
  );
  const drags = (scenarioCoverage.dragObligations || []).map(
    (item, index) =>
      staticProjection(item, {
        obligationId: `drag-${item.scriptId || index + 1}-${index + 1}`,
        status: "pending-authoritative-entry-state-coordinate-trace",
        routePolicyId: "drag-authority-entry-state-trace-v1",
        scriptId: item.scriptId || null,
        script: item.script || null,
        events: item.events || [],
        requiredStates: item.requiredStates || [],
        boundEvidenceCount: item.boundEvidence?.length || 0,
      }),
  );
  const conditionalBranches = (
    scenarioCoverage.conditionalBranchObligations || []
  ).map((item, index) =>
    staticProjection(item, {
      obligationId: item.obligationId || `condition-${index + 1}`,
      status: "pending-authoritative-reachability-entry-state-outcome-traces",
      routePolicyId: "branch-authority-entry-state-trace-v1",
      condition: item.condition || null,
      requiredOutcomes: item.requiredOutcomes || [],
      feasibility: item.feasibility || "unresolved",
    }),
  );
  const random = (scenarioCoverage.randomObligations || []).map(
    (item, index) =>
      staticProjection(item, {
        obligationId: item.obligationId || `random-${index + 1}`,
        status: "pending-source-authority-entry-state-outcome-traces",
        routePolicyId: "random-authority-entry-state-trace-v1",
        expression: item.expression || null,
        requiredOutcomes: item.requiredOutcomes ?? null,
        deterministicHarness:
          item.deterministicHarness || "unresolved",
      }),
  );
  const additional = ADDITIONAL_CATEGORIES.map((category) => ({
    category,
    obligationCount: scenarioCount(scenarioCoverage, category),
    status:
      scenarioCount(scenarioCoverage, category) > 0
        ? "pending-authority-entry-state-trace-resolution"
        : "no-static-candidate-in-current-inventory",
    routePolicyId: "interaction-authority-entry-state-trace-v1",
  }));
  return {
    childDomains,
    buttons,
    drags,
    conditionalBranches,
    random,
    additional,
  };
}

function memberOutputPath(animationId) {
  invariant(SAFE_ID.test(animationId || ""), "invalid animation ID");
  return `migrations/${animationId}/audit/machine/${MEMBER_OUTPUT_NAME}`;
}

export function g5L5CoverageTraceObligationPlanPath(animationId) {
  return memberOutputPath(animationId);
}

function buildMemberPlan({
  member,
  releaseBinding,
  releaseFingerprintSha256,
  generatorBinding,
  bindings,
  unresolvedChildren,
  structuralDefinitionSummary,
  coverageSummary,
}) {
  const routes = buildObligationRoutes(
    unresolvedChildren,
    bindings.scenarioInventory.document.coverage,
  );
  const currentRequirements =
    bindings.coverageV2.document.requirements.map((requirement) => ({
      requirementId: requirement.requirementId,
      frameDomainId: requirement.frameDomainId,
      scenario: requirement.scenario,
      traceId: requirement.traceId,
      language: requirement.language,
      seed: requirement.seed,
      requiredRange: requirement.requiredRange,
      entryState: requirement.entryState,
      entryStateSha256: requirement.entryStateSha256,
      baselineAuthorityRequirement:
        requirement.baselineAuthorityRequirement,
      baselineAuthority: requirement.baselineAuthority,
      status: requirement.status,
      capturedFrameCount: requirement.capturedFrameCount,
      missingFrameCount: requirement.missingFrames.length,
    }));
  const scenarioCoverage = bindings.scenarioInventory.document.coverage;
  const obligationCounts = {
    childDomainCandidates: routes.childDomains.length,
    buttonTargetObligations: routes.buttons.length,
    dragObligations: routes.drags.length,
    conditionalBranchObligations: routes.conditionalBranches.length,
    randomObligations: routes.random.length,
    ...Object.fromEntries(
      ADDITIONAL_CATEGORIES.map((category) => [
        category,
        scenarioCount(scenarioCoverage, category),
      ]),
    ),
  };
  return withFingerprint({
    schemaVersion: 1,
    artifactType: "g5-l5-static-coverage-trace-obligation-plan",
    releaseId: RELEASE_ID,
    animationId: member.animationId,
    state: "static-obligations-routed-runtime-authority-pending",
    authorityStatement: [
      "This plan binds current machine-only M1 static artifacts and routes unresolved coverage/trace obligations to future authority, entry-state, and trace resolution.",
      "It is not a trace specification, capture package, renderer decision, runtime observation, review, acceptance, strict-completion, or publication record.",
      "Only a named human may operate and attest an authoritative original-runtime session; machine checks may validate later evidence but may not invent or sign it.",
    ],
    generatedBy: {
      path: GENERATOR_PATH,
      bytes: generatorBinding.byteCount,
      sha256: generatorBinding.sha256,
      deterministic: true,
    },
    managedOutputContract: {
      ordinaryFile: true,
      symbolicLink: false,
      hardLink: false,
      linkCount: 1,
      mode: "0644",
    },
    releaseMembership: {
      ordinal: member.ordinal,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
      sourcePath: member.source.path,
      sourceSha256: member.source.sha256,
      releaseFingerprintSha256,
    },
    bindings: {
      lessonReleaseCatalog: descriptor(releaseBinding),
      migrationManifest: descriptor(bindings.migrationManifest),
      m1StaticReconciliationReceipt:
        descriptor(bindings.m1StaticReconciliationReceipt),
      scenarioInventory: descriptor(bindings.scenarioInventory),
      frameDomainDisposition: descriptor(bindings.frameDomainDisposition),
      coverageV2: descriptor(bindings.coverageV2),
      strictReadiness: descriptor(bindings.strictReadiness),
      ...(bindings.staticDispositionEvidence ? {
        staticDispositionEvidence:
          descriptor(bindings.staticDispositionEvidence),
      } : {}),
    },
    currentCanonicalCoverage: {
      scope: "root-only-provisional-bilingual",
      requirementCount: coverageSummary.requirementCount,
      pendingRequirementCount: coverageSummary.pendingRequirementCount,
      missingFrameCount: coverageSummary.missingFrameCount,
      authoritativeBaselineCount: 0,
      traceSpecCount: 0,
      requirements: currentRequirements,
      boundary:
        "The current two root requirements remain canonical pending obligations only; this plan neither expands nor edits coverage-v2.",
    },
    structuralDefinitionInventory: structuralDefinitionSummary,
    obligationCounts,
    routePolicies: ROUTE_POLICIES,
    obligationRoutes: routes,
    futureResolutionSequence: [
      "obtain separate immutable runtime authorization and named operator/session attestation",
      "execute natural host entry in the authorized original runtime and establish reachability",
      "resolve every child disposition and exact entry-state identity without guessing",
      "resolve source-evidenced button, drag, branch, random, terminal, Replay, language, audio, and host-state schedules",
      "only then create separately reviewed trace specifications and capture packages",
      "capture authoritative original-runtime evidence before implementation comparison or acceptance",
    ],
    execution: {
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      browsersLaunched: 0,
      legacyEndpointsExecuted: 0,
      namedHumanAttestationsRecorded: 0,
    },
    protectedMutations: PROTECTED_MUTATIONS,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
}

function validateFingerprint(document, label) {
  const projected = structuredClone(document);
  delete projected.artifactFingerprintSha256;
  invariant(
    SHA256_PATTERN.test(document.artifactFingerprintSha256 || "") &&
      document.artifactFingerprintSha256 === fingerprint(projected),
    `${label}: artifact fingerprint is invalid`,
  );
}

export function validateG5L5CoverageTraceObligationPlan(document, member) {
  const label = member?.animationId || document?.animationId || "unknown";
  invariant(
    document?.schemaVersion === 1 &&
      document.artifactType ===
        "g5-l5-static-coverage-trace-obligation-plan" &&
      document.releaseId === RELEASE_ID &&
      document.animationId === member.animationId &&
      document.state ===
        "static-obligations-routed-runtime-authority-pending",
    `${label}: plan identity/status drifted`,
  );
  invariant(
    document.releaseMembership?.ordinal === member.ordinal &&
      document.releaseMembership?.assetId === member.assetId &&
      document.releaseMembership?.releaseRole === member.releaseRole &&
      document.releaseMembership?.shardId === member.shardId &&
      document.releaseMembership?.releaseFingerprintSha256 ===
        RELEASE_FINGERPRINT_SHA256,
    `${label}: plan release membership drifted`,
  );
  invariant(
    document.managedOutputContract?.ordinaryFile === true &&
      document.managedOutputContract?.symbolicLink === false &&
      document.managedOutputContract?.hardLink === false &&
      document.managedOutputContract?.linkCount === 1 &&
      document.managedOutputContract?.mode === "0644",
    `${label}: managed output contract drifted`,
  );
  invariant(
    document.currentCanonicalCoverage?.scope ===
      "root-only-provisional-bilingual" &&
      document.currentCanonicalCoverage?.requirementCount === 2 &&
      document.currentCanonicalCoverage?.pendingRequirementCount === 2 &&
      document.currentCanonicalCoverage?.authoritativeBaselineCount === 0 &&
      document.currentCanonicalCoverage?.traceSpecCount === 0,
    `${label}: plan coverage boundary drifted`,
  );
  invariant(
    document.obligationCounts?.childDomainCandidates ===
        document.obligationRoutes?.childDomains?.length &&
      document.obligationCounts?.buttonTargetObligations ===
        document.obligationRoutes?.buttons?.length &&
      document.obligationCounts?.dragObligations ===
        document.obligationRoutes?.drags?.length &&
      document.obligationCounts?.conditionalBranchObligations ===
        document.obligationRoutes?.conditionalBranches?.length &&
      document.obligationCounts?.randomObligations ===
        document.obligationRoutes?.random?.length,
    `${label}: plan obligation counts drifted`,
  );
  invariant(
    document.structuralDefinitionInventory?.nestedDefinitionCount ===
        document.structuralDefinitionInventory
          ?.structurallyReachableUnresolvedChildCount +
          document.structuralDefinitionInventory
            ?.evidenceBoundCompositeChildCount +
          document.structuralDefinitionInventory
            ?.excludedNotProvenTimelineCount &&
      document.structuralDefinitionInventory
        ?.structurallyReachableUnresolvedChildCount ===
        document.obligationCounts.childDomainCandidates &&
      (
        document.structuralDefinitionInventory
          ?.evidenceBoundCompositeChildCount === 0
          ? document.bindings?.staticDispositionEvidence === undefined
          : (
            document.bindings?.staticDispositionEvidence?.path ===
              `migrations/${label}/${STATIC_DISPOSITION_EVIDENCE_PATH}` &&
            SHA256_PATTERN.test(
              document.bindings.staticDispositionEvidence.sha256 || "",
            )
          )
      ) &&
      document.structuralDefinitionInventory?.excludedNotProven
        ?.runnableRouteCreated === false,
    `${label}: nested definition routing/exclusion accounting drifted`,
  );
  assertAllFalse(document.protectedMutations, `${label}: protectedMutations`);
  assertAllFalse(document.acceptanceEffects, `${label}: acceptanceEffects`);
  invariant(
    document.execution?.runtimeSessionsExecuted === 0 &&
      document.execution?.guiApplicationsLaunched === 0 &&
      document.execution?.browsersLaunched === 0 &&
      document.execution?.legacyEndpointsExecuted === 0 &&
      document.execution?.namedHumanAttestationsRecorded === 0,
    `${label}: plan records forbidden execution`,
  );
  validateFingerprint(document, label);
  return true;
}

function sumMemberCounts(plans, key) {
  return plans.reduce(
    (total, {document}) => total + document.obligationCounts[key],
    0,
  );
}

function buildAggregateReport({
  release,
  releaseBinding,
  releaseFingerprintSha256,
  generatorBinding,
  plans,
}) {
  const memberRows = plans.map(({member, document, outputPath, bytes}) => ({
    ordinal: member.ordinal,
    animationId: member.animationId,
    releaseRole: member.releaseRole,
    shardId: member.shardId,
    output: {
      path: outputPath,
      bytes: bytes.length,
      sha256: sha256(bytes),
      mode: "0644",
      artifactFingerprintSha256: document.artifactFingerprintSha256,
    },
    rootCoverage: {
      requirementCount: document.currentCanonicalCoverage.requirementCount,
      pendingRequirementCount:
        document.currentCanonicalCoverage.pendingRequirementCount,
      missingFrameCount:
        document.currentCanonicalCoverage.missingFrameCount,
    },
    structuralDefinitions: {
      nestedDefinitionCount:
        document.structuralDefinitionInventory.nestedDefinitionCount,
      structurallyReachableUnresolvedChildCount:
        document.structuralDefinitionInventory
          .structurallyReachableUnresolvedChildCount,
      evidenceBoundCompositeChildCount:
        document.structuralDefinitionInventory
          .evidenceBoundCompositeChildCount,
      excludedNotProvenTimelineCount:
        document.structuralDefinitionInventory
          .excludedNotProvenTimelineCount,
      longerThanRootCount:
        document.structuralDefinitionInventory.longerThanRootCount,
      highRiskIndependentCandidateCount:
        document.structuralDefinitionInventory
          .highRiskIndependentCandidateCount,
      excludedRunnableRouteCreated: false,
    },
    obligations: {
      childDomainCandidates:
        document.obligationCounts.childDomainCandidates,
      buttonTargetObligations:
        document.obligationCounts.buttonTargetObligations,
      dragObligations: document.obligationCounts.dragObligations,
      conditionalBranchObligations:
        document.obligationCounts.conditionalBranchObligations,
      randomObligations: document.obligationCounts.randomObligations,
    },
    acceptanceAdvanced: false,
  }));
  const requirementCount = memberRows.reduce(
    (total, row) => total + row.rootCoverage.requirementCount,
    0,
  );
  const pendingRequirementCount = memberRows.reduce(
    (total, row) => total + row.rootCoverage.pendingRequirementCount,
    0,
  );
  const missingFrameCount = memberRows.reduce(
    (total, row) => total + row.rootCoverage.missingFrameCount,
    0,
  );
  const childDomainCandidates = sumMemberCounts(
    plans,
    "childDomainCandidates",
  );
  const scenarioCategoryTotals = Object.fromEntries([
    "buttonTargetObligations",
    "dragObligations",
    "conditionalBranchObligations",
    "randomObligations",
    ...ADDITIONAL_CATEGORIES,
  ].map((key) => [key, sumMemberCounts(plans, key)]));
  return withFingerprint({
    schemaVersion: 1,
    reportType: "g5-l5-static-coverage-trace-obligation-matrix",
    releaseId: RELEASE_ID,
    title:
      "G5 L5 Add & Subtract Negative Numbers — Static Coverage/Trace Obligation Matrix",
    state: "57-members-static-routed-runtime-authority-pending",
    generatedBy: {
      path: GENERATOR_PATH,
      bytes: generatorBinding.byteCount,
      sha256: generatorBinding.sha256,
      deterministic: true,
    },
    managedOutputContract: {
      ordinaryFile: true,
      symbolicLink: false,
      hardLink: false,
      linkCount: 1,
      mode: "0644",
    },
    release: {
      titleDisplay: release.titleDisplay,
      publicationMode: release.publicationMode,
      memberCount: release.members.length,
      pageCount: release.expectedCounts.activeXmlReferencedPages,
      shellCount: release.expectedCounts.courseShells,
      fingerprintSha256: releaseFingerprintSha256,
      catalog: descriptor(releaseBinding),
    },
    currentCanonicalCoverage: {
      scope: "root-only-provisional-bilingual",
      requirementCount,
      pendingRequirementCount,
      missingFrameCount,
      authoritativeBaselineCount: 0,
      implementationCaptureCount: 0,
      fullFrameComparisonCount: 0,
      traceSpecCount: 0,
    },
    frameDomainDisposition: {
      declaredRootCount: EXPECTED_DECLARED_ROOT_COUNT,
      nestedDefinitionCount: plans.reduce(
        (total, {document}) =>
          total +
          document.structuralDefinitionInventory.nestedDefinitionCount,
        0,
      ),
      unresolvedChildCount: childDomainCandidates,
      evidenceBoundCompositeChildCount: plans.reduce(
        (total, {document}) =>
          total +
          document.structuralDefinitionInventory
            .evidenceBoundCompositeChildCount,
        0,
      ),
      excludedNotProvenCount: plans.reduce(
        (total, {document}) =>
          total +
          document.structuralDefinitionInventory
            .excludedNotProvenTimelineCount,
        0,
      ),
      longerThanRootCount: plans.reduce(
        (total, {document}) =>
          total +
          document.structuralDefinitionInventory.longerThanRootCount,
        0,
      ),
      highRiskIndependentCandidateCount: plans.reduce(
        (total, {document}) =>
          total +
          document.structuralDefinitionInventory
            .highRiskIndependentCandidateCount,
        0,
      ),
      resolvedChildCount: plans.reduce(
        (total, {document}) =>
          total +
          document.structuralDefinitionInventory
            .evidenceBoundCompositeChildCount,
        0,
      ),
    },
    scenarioStaticObligations: scenarioCategoryTotals,
    routePolicyIds: Object.keys(ROUTE_POLICIES),
    members: memberRows,
    authorityBoundary: [
      "This report is an acceptance-neutral machine-only M1 planning matrix.",
      "It writes no canonical coverage/keyframes, creates no trace specification, selects no renderer, and launches no GUI or runtime.",
      "Original-runtime operation/attestation, actual listening/visual review, engineering review, Owner acceptance, strict completion, and publication remain separate future gates.",
    ],
    execution: {
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      browsersLaunched: 0,
      legacyEndpointsExecuted: 0,
      namedHumanAttestationsRecorded: 0,
    },
    protectedMutations: PROTECTED_MUTATIONS,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  });
}

export function validateG5L5CoverageTraceObligationReport(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document.reportType ===
        "g5-l5-static-coverage-trace-obligation-matrix" &&
      document.releaseId === RELEASE_ID &&
      document.state ===
        "57-members-static-routed-runtime-authority-pending" &&
      document.release?.memberCount === EXPECTED_MEMBER_COUNT &&
      document.release?.fingerprintSha256 === RELEASE_FINGERPRINT_SHA256,
    "aggregate obligation report identity/release drifted",
  );
  invariant(
    document.managedOutputContract?.ordinaryFile === true &&
      document.managedOutputContract?.symbolicLink === false &&
      document.managedOutputContract?.hardLink === false &&
      document.managedOutputContract?.linkCount === 1 &&
      document.managedOutputContract?.mode === "0644",
    "aggregate report managed output contract drifted",
  );
  invariant(
    document.currentCanonicalCoverage?.requirementCount ===
        EXPECTED_ROOT_REQUIREMENT_COUNT &&
      document.currentCanonicalCoverage?.pendingRequirementCount ===
        EXPECTED_ROOT_REQUIREMENT_COUNT &&
      document.currentCanonicalCoverage?.missingFrameCount ===
        EXPECTED_ROOT_MISSING_FRAME_COUNT &&
      document.currentCanonicalCoverage?.authoritativeBaselineCount === 0 &&
      document.currentCanonicalCoverage?.implementationCaptureCount === 0 &&
      document.currentCanonicalCoverage?.fullFrameComparisonCount === 0 &&
      document.currentCanonicalCoverage?.traceSpecCount === 0,
    "aggregate root-only coverage counts drifted",
  );
  invariant(
    document.frameDomainDisposition?.declaredRootCount ===
        EXPECTED_DECLARED_ROOT_COUNT &&
      document.frameDomainDisposition?.nestedDefinitionCount ===
        EXPECTED_NESTED_DEFINITION_COUNT &&
      document.frameDomainDisposition?.unresolvedChildCount ===
        EXPECTED_UNRESOLVED_CHILD_COUNT &&
      document.frameDomainDisposition?.evidenceBoundCompositeChildCount ===
        EXPECTED_EVIDENCE_BOUND_COMPOSITE_CHILD_COUNT &&
      document.frameDomainDisposition?.excludedNotProvenCount ===
        EXPECTED_EXCLUDED_NOT_PROVEN_COUNT &&
      document.frameDomainDisposition?.longerThanRootCount ===
        EXPECTED_LONGER_THAN_ROOT_COUNT &&
      document.frameDomainDisposition?.highRiskIndependentCandidateCount ===
        EXPECTED_HIGH_RISK_COUNT &&
      document.frameDomainDisposition?.resolvedChildCount ===
        EXPECTED_EVIDENCE_BOUND_COMPOSITE_CHILD_COUNT,
    "aggregate frame-domain disposition counts drifted",
  );
  invariant(
    Array.isArray(document.members) &&
      document.members.length === EXPECTED_MEMBER_COUNT &&
      new Set(document.members.map(({animationId}) => animationId)).size ===
        EXPECTED_MEMBER_COUNT &&
      document.members.every(({acceptanceAdvanced}) =>
        acceptanceAdvanced === false),
    "aggregate member matrix drifted",
  );
  assertAllFalse(document.protectedMutations, "report protectedMutations");
  assertAllFalse(document.acceptanceEffects, "report acceptanceEffects");
  invariant(
    document.execution?.runtimeSessionsExecuted === 0 &&
      document.execution?.guiApplicationsLaunched === 0 &&
      document.execution?.browsersLaunched === 0 &&
      document.execution?.legacyEndpointsExecuted === 0 &&
      document.execution?.namedHumanAttestationsRecorded === 0,
    "aggregate report records forbidden execution",
  );
  validateFingerprint(document, "aggregate report");
  return true;
}

function renderMarkdown(report, jsonSha256) {
  const lines = [
    "# G5 L5 Static Coverage/Trace Obligation Matrix",
    "",
    `Release: \`${report.releaseId}\`  `,
    `Atomic members: **${report.release.memberCount}** (${report.release.pageCount} pages + ${report.release.shellCount} shell)  `,
    `Release fingerprint: \`${report.release.fingerprintSha256}\`  `,
    `JSON report SHA-256: \`${jsonSha256}\``,
    "",
    "## Current fail-closed baseline",
    "",
    `- Canonical coverage-v2 is root-only: **${report.currentCanonicalCoverage.requirementCount}** requirements (57 EN + 57 ES).`,
    `- All **${report.currentCanonicalCoverage.pendingRequirementCount}** requirements remain pending; **${report.currentCanonicalCoverage.missingFrameCount}** root frames are missing.`,
    `- Frame-domain disposition retains **${report.frameDomainDisposition.declaredRootCount}** declared roots, **${report.frameDomainDisposition.evidenceBoundCompositeChildCount}** exact evidence-bound one-frame composite children, and **${report.frameDomainDisposition.unresolvedChildCount}** unresolved child candidates.`,
    `- Static inventory retains **${report.frameDomainDisposition.nestedDefinitionCount}** nested definitions total: ${report.frameDomainDisposition.evidenceBoundCompositeChildCount} exact evidence-bound composites are not routed as independent local-playhead obligations, ${report.frameDomainDisposition.unresolvedChildCount} structurally reachable unresolved candidates are routed, and ${report.frameDomainDisposition.excludedNotProvenCount} not-proven/excluded definitions remain recorded without runnable routes.`,
    `- Of the nested definitions, **${report.frameDomainDisposition.longerThanRootCount}** are longer than their member root timeline and **${report.frameDomainDisposition.highRiskIndependentCandidateCount}** are current high-risk independent-domain candidates.`,
    "- Authoritative baselines, implementation captures, comparisons, trace specifications, runtime sessions, reviews, strict completions, and publications remain zero.",
    "",
    "## Static obligation totals",
    "",
    "| Category | Count |",
    "|---|---:|",
    `| Child-domain candidates | ${report.frameDomainDisposition.unresolvedChildCount} |`,
    `| Button targets | ${report.scenarioStaticObligations.buttonTargetObligations} |`,
    `| Drag obligations | ${report.scenarioStaticObligations.dragObligations} |`,
    `| Conditional branches | ${report.scenarioStaticObligations.conditionalBranchObligations} |`,
    `| Random obligations | ${report.scenarioStaticObligations.randomObligations} |`,
    "",
    "Every item is routed to future authority, exact entry-state identity, and ordered trace resolution. Static extraction is not runtime reachability evidence.",
    "",
    "## Per-member matrix",
    "",
    "| # | Member | Role | Root pending | Missing | Nested | Composite | Routed child | Excluded | Longer | High risk | Button | Drag | Branch | Random |",
    "|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...report.members.map((row) =>
      `| ${row.ordinal} | \`${row.animationId}\` | ${row.releaseRole} | ${row.rootCoverage.pendingRequirementCount} | ${row.rootCoverage.missingFrameCount} | ${row.structuralDefinitions.nestedDefinitionCount} | ${row.structuralDefinitions.evidenceBoundCompositeChildCount} | ${row.obligations.childDomainCandidates} | ${row.structuralDefinitions.excludedNotProvenTimelineCount} | ${row.structuralDefinitions.longerThanRootCount} | ${row.structuralDefinitions.highRiskIndependentCandidateCount} | ${row.obligations.buttonTargetObligations} | ${row.obligations.dragObligations} | ${row.obligations.conditionalBranchObligations} | ${row.obligations.randomObligations} |`),
    "",
    "## Authority boundary",
    "",
    "- This matrix does not edit canonical coverage or keyframes and does not create trace specifications.",
    "- It does not select a renderer, start implementation, launch a browser/GUI/runtime, record review, advance acceptance, modify the completion ledger, or publish.",
    "- A separately authorized named human must perform and attest original-runtime operation. Audio listening, visual review, engineering review, Owner acceptance, strict validation, and atomic publication remain independent gates.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

async function loadMember(projectRoot, member, releaseBinding) {
  const workspace = `migrations/${member.animationId}`;
  const entries = await Promise.all(
    Object.entries(MEMBER_INPUTS).map(async ([key, suffix]) => {
      const binding = await readOrdinaryFile(
        projectRoot,
        `${workspace}/${suffix}`,
        {json: true, label: `${member.animationId}: ${key}`},
      );
      return [key, binding];
    }),
  );
  const bindings = Object.fromEntries(entries);
  const staticEvidenceDeclaration =
    bindings.frameDomainDisposition.document.generatedFrom
      ?.staticDispositionEvidence;
  if (staticEvidenceDeclaration) {
    bindings.staticDispositionEvidence = await readOrdinaryFile(
      projectRoot,
      `${workspace}/${STATIC_DISPOSITION_EVIDENCE_PATH}`,
      {
        json: true,
        label: `${member.animationId}: staticDispositionEvidence`,
      },
    );
  }
  validateManifest(bindings.migrationManifest.document, member);
  validateG5L5M1StaticReconciliationReceipt(
    bindings.m1StaticReconciliationReceipt.document,
    member,
  );
  const receiptManifest =
    bindings.m1StaticReconciliationReceipt.document.outputs
      ?.migrationManifest?.after;
  invariant(
    receiptManifest?.path === bindings.migrationManifest.path &&
      receiptManifest.bytes === bindings.migrationManifest.byteCount &&
      receiptManifest.sha256 === bindings.migrationManifest.sha256,
    `${member.animationId}: current manifest no longer matches the M1 receipt`,
  );
  validateScenario(bindings.scenarioInventory.document, member);
  const dispositionSummary = validateFrameDomainDisposition(
    bindings.frameDomainDisposition.document,
    member,
    bindings,
    bindings.migrationManifest.document,
  );
  const structuralDefinitionSummary = buildStructuralDefinitionSummary({
    scenario: bindings.scenarioInventory.document,
    manifest: bindings.migrationManifest.document,
    dispositionSummary,
  });
  const coverageSummary = validateCoverage(
    bindings.coverageV2.document,
    member,
    bindings.migrationManifest.document,
  );
  validateStrictReadiness(
    bindings.strictReadiness.document,
    member,
    bindings.coverageV2,
  );
  const strictReleaseEvidence =
    bindings.strictReadiness.document.evidence.find(
      ({id}) => id === "lesson-release-catalog",
    );
  invariant(
    strictReleaseEvidence?.path === RELEASE_PATH &&
      strictReleaseEvidence?.bytes === releaseBinding.byteCount &&
      strictReleaseEvidence?.sha256 === releaseBinding.sha256,
    `${member.animationId}: strict-readiness release catalog binding drifted`,
  );
  return {
    bindings,
    unresolvedChildren: dispositionSummary.unresolvedChildren,
    structuralDefinitionSummary,
    coverageSummary,
  };
}

async function stageTransaction(projectRoot, transaction) {
  await assertSnapshotUnchanged(
    projectRoot,
    transaction.snapshot,
    `${transaction.relativePath}: stage preflight`,
  );
  const suffix = randomBytes(12).toString("hex");
  transaction.stagePath =
    `${transaction.snapshot.absolutePath}.stage-${process.pid}-${suffix}`;
  const handle = await open(transaction.stagePath, "wx", 0o600);
  try {
    transaction.stageOwnerIdentity = statIdentity(
      await handle.stat({bigint: true}),
    );
    await handle.writeFile(transaction.desiredBytes);
    await handle.chmod(MANAGED_OUTPUT_MODE);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const staged = await readManagedPath(
    projectRoot,
    transaction.stagePath,
    `${transaction.relativePath}: staged output`,
  );
  invariant(
    staged?.sha256 === transaction.desiredSha256,
    `${transaction.relativePath}: staged output bytes drifted`,
  );
  transaction.stageIdentity = staged.identity;
}

async function cleanupPath(candidate) {
  if (!candidate) return;
  await unlink(candidate).catch((error) => {
    if (error?.code !== "ENOENT") throw error;
  });
}

async function readManagedPath(projectRoot, absolutePath, label) {
  await assertOrdinaryAncestorTree(projectRoot, absolutePath, label);
  if (!(await lstatOrNull(absolutePath))) return null;
  return readStableAbsoluteFile(
    projectRoot,
    absolutePath,
    label,
  );
}

async function removeManagedPath(
  projectRoot,
  absolutePath,
  expectedSha256,
  expectedIdentity,
  label,
) {
  const current = await readManagedPath(projectRoot, absolutePath, label);
  if (!current) return;
  invariant(
    current.sha256 === expectedSha256 &&
      (!expectedIdentity ||
        sameIdentity(current.identity, expectedIdentity)),
    `${label}: refusing to remove a foreign file`,
  );
  await unlink(absolutePath);
}

async function removeOwnedManagedPath(
  projectRoot,
  absolutePath,
  expectedIdentity,
  label,
) {
  await assertOrdinaryAncestorTree(projectRoot, absolutePath, label);
  const information = await lstatOrNull(absolutePath);
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      sameInodeIdentity(statIdentity(information), expectedIdentity),
    `${label}: refusing to remove a foreign file`,
  );
  await unlink(absolutePath);
}

async function assertTransactionParentUnchanged(projectRoot, transaction) {
  const ancestor = await assertOrdinaryAncestorTree(
    projectRoot,
    transaction.snapshot.absolutePath,
    transaction.relativePath,
  );
  invariant(
    ancestor.parentPath === transaction.snapshot.parentPath &&
      JSON.stringify(ancestor.parentIdentity) ===
        JSON.stringify(transaction.snapshot.parentIdentity),
    `${transaction.relativePath}: output parent changed after preflight`,
  );
}

async function rollbackTransactions(
  projectRoot,
  transactions,
  originalError,
) {
  const rollbackErrors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      await assertTransactionParentUnchanged(projectRoot, transaction);
      if (transaction.installed) {
        if (transaction.installedIdentity) {
          await removeManagedPath(
            projectRoot,
            transaction.snapshot.absolutePath,
            transaction.desiredSha256,
            transaction.installedIdentity,
            `${transaction.relativePath}: rollback replacement`,
          );
        } else {
          await removeOwnedManagedPath(
            projectRoot,
            transaction.snapshot.absolutePath,
            transaction.installedOwnerIdentity,
            `${transaction.relativePath}: rollback linked replacement`,
          );
        }
        transaction.installed = false;
      }
    } catch (error) {
      rollbackErrors.push(error);
    }
    try {
      await assertTransactionParentUnchanged(projectRoot, transaction);
      if (transaction.displaced) {
        const backup = await readManagedPath(
          projectRoot,
          transaction.backupPath,
          `${transaction.relativePath}: rollback backup`,
        );
        invariant(
          backup?.sha256 === transaction.snapshot.sha256 &&
            sameIdentity(
              backup.identity,
              transaction.backupIdentity,
            ),
          `${transaction.relativePath}: refusing to restore a foreign backup`,
        );
        invariant(
          !(await lstatOrNull(transaction.snapshot.absolutePath)),
          `${transaction.relativePath}: refusing to overwrite a target occupied during rollback`,
        );
        await link(
          transaction.backupPath,
          transaction.snapshot.absolutePath,
        );
        await unlink(transaction.backupPath);
        transaction.backupPath = null;
        transaction.displaced = false;
      }
    } catch (error) {
      rollbackErrors.push(error);
    }
    try {
      if (transaction.stagePath) {
        await removeOwnedManagedPath(
          projectRoot,
          transaction.stagePath,
          transaction.stageIdentity ||
            transaction.stageOwnerIdentity,
          `${transaction.relativePath}: rollback stage`,
        );
        transaction.stagePath = null;
      }
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  if (rollbackErrors.length) {
    throw new AggregateError(
      [originalError, ...rollbackErrors],
      "obligation matrix commit failed and rollback was incomplete",
    );
  }
  throw originalError;
}

async function commitTransactions(
  projectRoot,
  inputs,
  transactions,
  hooks = {},
) {
  try {
    for (const [index, transaction] of transactions.entries()) {
      transaction.desiredSha256 = sha256(transaction.desiredBytes);
      transaction.displaced = false;
      transaction.installed = false;
      transaction.installedIdentity = null;
      transaction.installedOwnerIdentity = null;
      transaction.backupIdentity = null;
      transaction.stagePath = null;
      transaction.stageIdentity = null;
      transaction.stageOwnerIdentity = null;
      await stageTransaction(projectRoot, transaction);
      await hooks.afterStage?.({
        index,
        outputPath: transaction.snapshot.absolutePath,
        relativePath: transaction.relativePath,
        stagePath: transaction.stagePath,
      });
    }
    await assertInputsUnchanged(projectRoot, inputs);
    for (const [index, transaction] of transactions.entries()) {
      await hooks.beforeCommit?.({
        index,
        outputPath: transaction.snapshot.absolutePath,
        relativePath: transaction.relativePath,
      });
      await assertInputsUnchanged(projectRoot, inputs);
      await assertSnapshotUnchanged(
        projectRoot,
        transaction.snapshot,
        transaction.relativePath,
      );
      if (transaction.snapshot.exists) {
        transaction.backupPath =
          `${transaction.snapshot.absolutePath}.backup-${process.pid}-${randomBytes(12).toString("hex")}`;
        await rename(
          transaction.snapshot.absolutePath,
          transaction.backupPath,
        );
        transaction.displaced = true;
        const displaced = await readManagedPath(
          projectRoot,
          transaction.backupPath,
          `${transaction.relativePath}: displaced output`,
        );
        invariant(
          displaced?.sha256 === transaction.snapshot.sha256 &&
            sameDisplacedIdentity(
              displaced.identity,
              transaction.snapshot.identity,
            ),
          `${transaction.relativePath}: displaced output failed CAS verification`,
        );
        transaction.backupIdentity = displaced.identity;
      }
      await hooks.beforeInstall?.({
        index,
        outputPath: transaction.snapshot.absolutePath,
        relativePath: transaction.relativePath,
      });
      await assertTransactionParentUnchanged(projectRoot, transaction);
      const stage = await readManagedPath(
        projectRoot,
        transaction.stagePath,
        `${transaction.relativePath}: pre-link staged output`,
      );
      invariant(
        stage?.sha256 === transaction.desiredSha256 &&
          sameIdentity(
            stage.identity,
            transaction.stageIdentity,
          ),
        `${transaction.relativePath}: staged output changed before install`,
      );
      await link(
        transaction.stagePath,
        transaction.snapshot.absolutePath,
      );
      transaction.installed = true;
      transaction.installedOwnerIdentity = statIdentity(
        await lstat(
          transaction.snapshot.absolutePath,
          {bigint: true},
        ),
      );
      await unlink(transaction.stagePath);
      transaction.stagePath = null;
      const committed = await readManagedPath(
        projectRoot,
        transaction.snapshot.absolutePath,
        `${transaction.relativePath}: committed output`,
      );
      invariant(
        committed?.sha256 === transaction.desiredSha256 &&
          permissionMode(
            await lstat(transaction.snapshot.absolutePath, {bigint: true}),
          ) === MANAGED_OUTPUT_MODE,
        `${transaction.relativePath}: committed bytes or 0644 mode changed`,
      );
      transaction.installedIdentity = committed.identity;
      await hooks.afterCommit?.({
        index,
        outputPath: transaction.snapshot.absolutePath,
        relativePath: transaction.relativePath,
      });
    }
    await assertInputsUnchanged(projectRoot, inputs);
    for (const transaction of transactions) {
      await assertTransactionParentUnchanged(projectRoot, transaction);
      const installed = await readManagedPath(
        projectRoot,
        transaction.snapshot.absolutePath,
        `${transaction.relativePath}: final installed output`,
      );
      invariant(
        installed?.sha256 === transaction.desiredSha256 &&
          sameIdentity(
            installed.identity,
            transaction.installedIdentity,
          ) &&
          permissionMode(
            await lstat(
              transaction.snapshot.absolutePath,
              {bigint: true},
            ),
          ) === MANAGED_OUTPUT_MODE,
        `${transaction.relativePath}: installed output changed before commit`,
      );
    }
  } catch (error) {
    await rollbackTransactions(projectRoot, transactions, error);
  }
  const cleanupErrors = [];
  try {
    await hooks.beforeCleanup?.({transactions});
  } catch (error) {
    cleanupErrors.push(error);
  }
  for (const transaction of transactions) {
    try {
      await assertTransactionParentUnchanged(projectRoot, transaction);
      if (transaction.displaced) {
        await removeManagedPath(
          projectRoot,
          transaction.backupPath,
          transaction.snapshot.sha256,
          transaction.backupIdentity,
          `${transaction.relativePath}: committed backup`,
        );
        transaction.backupPath = null;
        transaction.displaced = false;
      }
      if (transaction.stagePath) {
        await removeOwnedManagedPath(
          projectRoot,
          transaction.stagePath,
          transaction.stageIdentity ||
            transaction.stageOwnerIdentity,
          `${transaction.relativePath}: committed stage`,
        );
        transaction.stagePath = null;
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      "obligation matrix committed, but transaction cleanup was incomplete",
    );
  }
}

export async function buildG5L5CoverageTraceObligationMatrix(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || defaultProjectRoot);
  const mode = options.mode || "dry-run";
  invariant(
    ["dry-run", "apply", "check"].includes(mode),
    "mode must be dry-run, apply, or check",
  );
  const expectedReleaseFingerprint =
    options.expectedReleaseFingerprint || RELEASE_FINGERPRINT_SHA256;
  invariant(
    SHA256_PATTERN.test(expectedReleaseFingerprint),
    "expected release fingerprint is invalid",
  );
  const [releaseBinding, generatorBinding] = await Promise.all([
    readOrdinaryFile(projectRoot, RELEASE_PATH, {
      json: true,
      label: "lesson release catalog",
    }),
    readOrdinaryFile(projectRoot, GENERATOR_PATH, {
      label: "obligation matrix generator",
    }),
  ]);
  const release = validateRelease(
    releaseBinding.document,
    expectedReleaseFingerprint,
  );
  const loaded = [];
  for (const member of release.members) {
    loaded.push({
      member,
      ...(await loadMember(projectRoot, member, releaseBinding)),
    });
  }
  const inputSnapshots = [
    releaseBinding,
    generatorBinding,
    ...loaded.flatMap(({bindings}) => Object.values(bindings)),
  ];
  const plans = loaded.map(
    ({
      member,
      bindings,
      unresolvedChildren,
      structuralDefinitionSummary,
      coverageSummary,
    }) => {
      const document = buildMemberPlan({
        member,
        releaseBinding,
        releaseFingerprintSha256: expectedReleaseFingerprint,
        generatorBinding,
        bindings,
        unresolvedChildren,
        structuralDefinitionSummary,
        coverageSummary,
      });
      validateG5L5CoverageTraceObligationPlan(document, member);
      const bytes = Buffer.from(stableJson(document));
      return {
        member,
        document,
        bytes,
        outputPath: memberOutputPath(member.animationId),
      };
    },
  );
  const report = buildAggregateReport({
    release,
    releaseBinding,
    releaseFingerprintSha256: expectedReleaseFingerprint,
    generatorBinding,
    plans,
  });
  validateG5L5CoverageTraceObligationReport(report);
  const reportJsonBytes = Buffer.from(stableJson(report));
  const reportMarkdownBytes = Buffer.from(
    renderMarkdown(report, sha256(reportJsonBytes)),
  );
  const desired = [
    ...plans.map(({outputPath, bytes}) => ({
      relativePath: outputPath,
      desiredBytes: bytes,
    })),
    {
      relativePath: REPORT_JSON_PATH,
      desiredBytes: reportJsonBytes,
    },
    {
      relativePath: REPORT_MARKDOWN_PATH,
      desiredBytes: reportMarkdownBytes,
    },
  ];
  const transactions = [];
  for (const item of desired) {
    transactions.push({
      ...item,
      snapshot: await snapshotOutput(
        projectRoot,
        item.relativePath,
        `managed output ${item.relativePath}`,
      ),
      stagePath: null,
      backupPath: null,
      committed: false,
    });
  }
  if (mode === "check") {
    for (const transaction of transactions) {
      invariant(
        transaction.snapshot.exists &&
          transaction.snapshot.bytes.equals(transaction.desiredBytes) &&
          permissionMode(
            await lstat(transaction.snapshot.absolutePath, {bigint: true}),
          ) === MANAGED_OUTPUT_MODE,
        `${transaction.relativePath}: managed output is missing, stale, or not mode 0644`,
      );
    }
  } else if (mode === "apply") {
    await commitTransactions(
      projectRoot,
      inputSnapshots,
      transactions,
      options.transactionHooks || {},
    );
  }
  return {
    action:
      mode === "apply" ? "written" :
        mode === "check" ? "verified" :
          "planned",
    releaseId: RELEASE_ID,
    releaseFingerprintSha256: expectedReleaseFingerprint,
    memberCount: plans.length,
    outputCount: desired.length,
    rootOnlyRequirementCount:
      report.currentCanonicalCoverage.requirementCount,
    pendingRequirementCount:
      report.currentCanonicalCoverage.pendingRequirementCount,
    missingFrameCount:
      report.currentCanonicalCoverage.missingFrameCount,
    unresolvedChildDomainCount:
      report.frameDomainDisposition.unresolvedChildCount,
    evidenceBoundCompositeChildCount:
      report.frameDomainDisposition.evidenceBoundCompositeChildCount,
    nestedDefinitionCount:
      report.frameDomainDisposition.nestedDefinitionCount,
    excludedNotProvenDefinitionCount:
      report.frameDomainDisposition.excludedNotProvenCount,
    longerThanRootDefinitionCount:
      report.frameDomainDisposition.longerThanRootCount,
    highRiskIndependentCandidateCount:
      report.frameDomainDisposition.highRiskIndependentCandidateCount,
    buttonObligationCount:
      report.scenarioStaticObligations.buttonTargetObligations,
    dragObligationCount:
      report.scenarioStaticObligations.dragObligations,
    branchObligationCount:
      report.scenarioStaticObligations.conditionalBranchObligations,
    randomObligationCount:
      report.scenarioStaticObligations.randomObligations,
    canonicalCoverageWritten: false,
    canonicalKeyframesWritten: false,
    traceSpecsCreated: 0,
    rendererSelected: false,
    guiApplicationsLaunched: 0,
    originalRuntimeSessionsExecuted: 0,
    acceptanceAdvanced: false,
    outputs: desired.map(({relativePath, desiredBytes}) => ({
      path: relativePath,
      bytes: desiredBytes.length,
      sha256: sha256(desiredBytes),
      mode: "0644",
    })),
  };
}

export function parseArguments(argv) {
  const options = {help: false};
  for (const argument of argv) {
    if (argument === "--dry-run") {
      invariant(
        !options.mode,
        "choose exactly one of --dry-run, --apply, or --check",
      );
      options.mode = "dry-run";
    } else if (argument === "--apply") {
      invariant(
        !options.mode,
        "choose exactly one of --dry-run, --apply, or --check",
      );
      options.mode = "apply";
    } else if (argument === "--check") {
      invariant(
        !options.mode,
        "choose exactly one of --dry-run, --apply, or --check",
      );
      options.mode = "check";
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(
      options.mode,
      "explicitly choose one of --dry-run, --apply, or --check",
    );
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-g5-l5-coverage-trace-obligation-matrix.mjs --dry-run
  node scripts/build-g5-l5-coverage-trace-obligation-matrix.mjs --apply
  node scripts/build-g5-l5-coverage-trace-obligation-matrix.mjs --check

Preflights all 57 exact G5 L5 release members. --apply writes only the
per-member ${MEMBER_OUTPUT_NAME} files plus the aggregate JSON/Markdown
reports as one compare-and-swap transaction. It never edits canonical
coverage/keyframes, creates trace specs, selects a renderer, launches a GUI or
runtime, records a review, or advances acceptance/publication.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const result = await buildG5L5CoverageTraceObligationMatrix(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
