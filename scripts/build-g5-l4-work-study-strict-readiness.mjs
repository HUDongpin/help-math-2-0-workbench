#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {constants as fsConstants, createReadStream} from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
  rmdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");
const RELEASE_ID = "lesson-g05-l04-number-lines";
const CALIBRATION_RELATIVE = "catalog/lesson-release-calibration-sets.json";
const M1_AUTHORIZATION_RELATIVE = "catalog/owner-authorizations/g5-l4-m1-owner-authorization-2026-07-28.json";
const OPERATOR_ASSIGNMENT_RELATIVE =
  "catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json";
const OWNER_M1_STATEMENT_TEXT = "Owner是Dr. Peter Hu\n\n明确授权 M1";
const OWNER_M1_STATEMENT_SHA256 = "b5e3782e82d4d806304f221141579b1fe2fac72eff1f9f583b544f64ce6fa8cb";
const OPERATOR_STATEMENT_TEXT =
  "原始运行时／Animate 的具名人工操作员是Dr. Peter Hu";
const OPERATOR_STATEMENT_SHA256 =
  "d367883132acc9e01e75c4e912f7ae33178e97fd69f1bf42da4833c926381b75";
const G5_L4_INTAKE_RELEASE_MANIFEST_SHA256 =
  "ab0ad5dac373f7bf192b603c4c2b0bc4dae9f73fe770eba3be7507d458bfc375";
const G5_L4_RELEASE_FINGERPRINT_SHA256 =
  "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc";
const SOURCE_ARCHIVE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const GENERATOR_VERSION = 2;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const CAPTURE_IDENTITY_FIELDS = Object.freeze([
  "frameDomain",
  "requirementId",
  "trace",
  "entryStateSha256",
  "frame",
  "scenario",
  "lang",
  "seed",
]);

export const G5_L4_WORK_STUDY_READINESS_IDS = Object.freeze([
  "shell-course-g05-l04-index-local",
  "course-g05-l04-rw-002",
  "course-g05-l04-in-019",
  "course-g05-l04-fq-002",
]);
const RW002_SOURCE_STATIC_CANDIDATE = Object.freeze({
  animationId: "course-g05-l04-rw-002",
  frameDomainId: "sprite-341",
  frameCount: 419,
  renderedFrameCount: 419,
  sourceInstanceId: "Animation",
});
const IN019_SOURCE_STATIC_CANDIDATE = Object.freeze({
  animationId: "course-g05-l04-in-019",
  frameDomainId: "sprite-265",
  frameCount: 274,
  renderedFrameCount: 220,
  sourceInstanceId: "animation",
});
const SOURCE_STATIC_CANDIDATE_PROFILES = Object.freeze([
  RW002_SOURCE_STATIC_CANDIDATE,
  IN019_SOURCE_STATIC_CANDIDATE,
]);

function sourceStaticCandidateProfile(animationId) {
  return SOURCE_STATIC_CANDIDATE_PROFILES.find(
    (profile) => profile.animationId === animationId,
  ) || null;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(candidate);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

export function runtimePlanFingerprint(document) {
  const {artifactFingerprintSha256: _fingerprint, ...body} = document;
  return sha256Bytes(Buffer.from(stableJson(body)));
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveProjectPath(projectRoot, candidate, label) {
  invariant(typeof candidate === "string" && candidate.length > 0, `${label}: path is empty`);
  invariant(!path.isAbsolute(candidate), `${label}: absolute paths are not allowed`);
  const resolved = path.resolve(projectRoot, candidate);
  invariant(isWithin(projectRoot, resolved), `${label}: path escapes the project root`);
  return resolved;
}

function resolveWorkspacePath(workspace, candidate, label) {
  invariant(typeof candidate === "string" && candidate.length > 0, `${label}: path is empty`);
  invariant(!path.isAbsolute(candidate), `${label}: absolute paths are not allowed`);
  const resolved = path.resolve(workspace, candidate);
  invariant(isWithin(workspace, resolved), `${label}: path escapes the migration workspace`);
  return resolved;
}

async function assertRegularUnlinkedFile(candidate, label) {
  const details = await lstat(candidate).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(
    details.isFile() && !details.isSymbolicLink() && details.nlink === 1,
    `${label}: expected one regular non-linked file`,
  );
  return details;
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

function sameStatIdentity(left, right) {
  return JSON.stringify(statIdentity(left)) === JSON.stringify(statIdentity(right));
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function assertLinkSafeOutputAncestors(projectRoot, outputPath, id, {
  managedName = true,
} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedOutput = path.resolve(outputPath);
  invariant(isWithin(resolvedRoot, resolvedOutput), `${id}: readiness output escapes project root`);
  if (managedName) {
    invariant(path.basename(resolvedOutput) === "strict-readiness.json", `${id}: readiness output name is not managed`);
  }
  const outputParent = path.dirname(resolvedOutput);
  const relativeParent = path.relative(resolvedRoot, outputParent);
  const ancestors = [
    resolvedRoot,
    ...relativeParent.split(path.sep).filter(Boolean).map((_, index, parts) =>
      path.join(resolvedRoot, ...parts.slice(0, index + 1))),
  ];
  for (const ancestor of ancestors) {
    const information = await lstat(ancestor, {bigint: true}).catch((error) => {
      throw new Error(`${id}: readiness output ancestor is unavailable (${portable(path.relative(resolvedRoot, ancestor) || ".")}: ${error.message})`);
    });
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${id}: readiness output ancestor must be a real non-symlink directory (${portable(path.relative(resolvedRoot, ancestor) || ".")})`,
    );
  }
  const [realRoot, realParent] = await Promise.all([
    realpath(resolvedRoot),
    realpath(outputParent),
  ]);
  invariant(isWithin(realRoot, realParent), `${id}: readiness output ancestor resolves outside project root`);
  return {outputPath: resolvedOutput, outputParent, realRoot};
}

async function readStableOutputFile(outputPath, projectRoot, id, {
  managedName = true,
  requireSingleLink = true,
} = {}) {
  const output = await assertLinkSafeOutputAncestors(projectRoot, outputPath, id, {managedName});
  const before = await lstatOrNull(output.outputPath);
  if (!before) {
    return {
      ...output,
      exists: false,
      contents: null,
      bytes: 0,
      sha256: "",
      stat: null,
      realPath: "",
    };
  }
  invariant(
    before.isFile() && !before.isSymbolicLink(),
    `${id}: readiness output must be one regular non-symlink file`,
  );
  if (requireSingleLink) {
    invariant(before.nlink === 1n, `${id}: readiness output must have exactly one hard link`);
  }
  const beforeRealPath = await realpath(output.outputPath);
  invariant(isWithin(output.realRoot, beforeRealPath), `${id}: readiness output resolves outside project root`);
  const handle = await open(
    output.outputPath,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0),
  );
  let contents;
  let descriptorBefore;
  let descriptorAfter;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    invariant(
      descriptorBefore.isFile() && (!requireSingleLink || descriptorBefore.nlink === 1n),
      `${id}: readiness output changed before stable read`,
    );
    invariant(sameStatIdentity(before, descriptorBefore), `${id}: readiness output changed before stable read`);
    contents = await handle.readFile();
    descriptorAfter = await handle.stat({bigint: true});
    invariant(sameStatIdentity(descriptorBefore, descriptorAfter), `${id}: readiness output changed during stable read`);
  } finally {
    await handle.close();
  }
  const after = await lstat(output.outputPath, {bigint: true});
  const afterRealPath = await realpath(output.outputPath);
  invariant(
    sameStatIdentity(descriptorAfter, after) && beforeRealPath === afterRealPath,
    `${id}: readiness output changed during stable read`,
  );
  invariant(isWithin(output.realRoot, afterRealPath), `${id}: readiness output resolves outside project root`);
  return {
    ...output,
    exists: true,
    contents,
    bytes: contents.length,
    sha256: sha256Bytes(contents),
    stat: statIdentity(after),
    realPath: afterRealPath,
  };
}

function outputSnapshotMatches(expected, observed) {
  return expected.exists === observed.exists
    && (!expected.exists || (
      expected.realPath === observed.realPath
      && expected.bytes === observed.bytes
      && expected.sha256 === observed.sha256
      && JSON.stringify(expected.stat) === JSON.stringify(observed.stat)
    ));
}

async function readFileRecord(projectRoot, relativePath, label = relativePath) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  const details = await assertRegularUnlinkedFile(absolutePath, label);
  const [bytes, realProjectRoot, realFile] = await Promise.all([
    readFile(absolutePath),
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(realProjectRoot, realFile), `${label}: resolves outside the project root`);
  invariant(details.size === bytes.length, `${label}: byte count changed during read`);
  return {
    path: portable(relativePath),
    absolutePath,
    bytes: bytes.length,
    sha256: sha256Bytes(bytes),
    contents: bytes,
  };
}

async function readJsonRecord(projectRoot, relativePath, label = relativePath) {
  const record = await readFileRecord(projectRoot, relativePath, label);
  try {
    return {...record, document: JSON.parse(record.contents.toString("utf8"))};
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
}

async function verifyProjectDescriptor(projectRoot, descriptor, label, {json = false} = {}) {
  invariant(descriptor && typeof descriptor.path === "string", `${label}: missing path`);
  invariant(SHA256_PATTERN.test(descriptor.sha256 || ""), `${label}: invalid SHA-256`);
  const record = json
    ? await readJsonRecord(projectRoot, descriptor.path, label)
    : await readFileRecord(projectRoot, descriptor.path, label);
  if (descriptor.bytes !== undefined) {
    invariant(Number.isInteger(descriptor.bytes) && descriptor.bytes === record.bytes, `${label}: byte count mismatch`);
  }
  invariant(record.sha256 === descriptor.sha256, `${label}: hash mismatch`);
  if (json && descriptor.schemaVersion !== undefined) {
    invariant(record.document.schemaVersion === descriptor.schemaVersion, `${label}: schemaVersion mismatch`);
  }
  return record;
}

async function verifyWorkspaceOutput(workspace, output, label) {
  invariant(output && typeof output.path === "string", `${label}: missing path`);
  invariant(output.path.startsWith("audit/machine/"), `${label}: output is outside audit/machine`);
  invariant(SHA256_PATTERN.test(output.sha256 || ""), `${label}: invalid SHA-256`);
  const absolutePath = resolveWorkspacePath(workspace, output.path, label);
  const details = await assertRegularUnlinkedFile(absolutePath, label);
  invariant(output.bytes === details.size, `${label}: byte count mismatch`);
  invariant(await sha256File(absolutePath) === output.sha256, `${label}: hash mismatch`);
  return {
    path: portable(path.relative(path.resolve(workspace, "..", ".."), absolutePath)),
    bytes: details.size,
    sha256: output.sha256,
  };
}

function allFalse(document, keys, label) {
  for (const key of keys) invariant(document?.[key] === false, `${label}: ${key} must remain false`);
}

function validateOperatorAssignmentReceipt(record, id) {
  const receipt = record.document;
  invariant(
    record.path === OPERATOR_ASSIGNMENT_RELATIVE &&
      receipt?.schemaVersion === 1 &&
      receipt.evidenceType === "g5-l4-user-stated-original-runtime-animate-operator-assignment-intake" &&
      receipt.releaseId === RELEASE_ID &&
      receipt.channel === "current-codex-task",
    `${id}: operator-assignment receipt identity drifted`,
  );
  const statementBytes = Buffer.from(receipt.ownerStatement?.exactUtf8 || "", "utf8");
  invariant(
    receipt.ownerStatement?.exactUtf8 === OPERATOR_STATEMENT_TEXT &&
      receipt.ownerStatement?.byteLength === statementBytes.length &&
      receipt.ownerStatement?.sha256 === OPERATOR_STATEMENT_SHA256 &&
      sha256Bytes(statementBytes) === receipt.ownerStatement.sha256,
    `${id}: exact operator statement drifted`,
  );
  invariant(
    receipt.assigningAuthority?.ownerFullName === "Dr. Peter Hu" &&
      receipt.assigningAuthority?.ownerRole === "Owner" &&
      receipt.assigningAuthority?.externalSubjectId === null &&
      receipt.assignment?.roleId === "authorized-original-runtime-operator" &&
      receipt.assignment?.slot === "primary" &&
      receipt.assignment?.assigneeFullName === "Dr. Peter Hu" &&
      receipt.assignment?.samePersonAsOwner === true &&
      receipt.assignment?.explicit === true,
    `${id}: operator-assignment role or identity drifted`,
  );
  invariant(
    JSON.stringify(receipt.assignment.duties) === JSON.stringify([
      "authorized-original-runtime-human-operator",
      "adobe-animate-human-dialog-operator",
    ]) &&
      receipt.capacity?.minimumRequiredHoursPerWeek === 20 &&
      receipt.capacity?.committedHoursPerWeek === null &&
      receipt.capacity?.status === "not-stated" &&
      receipt.externalSignatureEnvelope === null,
    `${id}: operator duties, capacity, or signature boundary drifted`,
  );
  invariant(
    receipt.authorityBoundary?.assignmentUserAttested === true &&
      receipt.authorityBoundary?.namedHumanRoleAssignmentEstablished === true &&
      receipt.authorityBoundary?.namedRoleSlotCountEffect === 1 &&
      receipt.authorityBoundary?.strictAcceptanceEffect === "named-primary-operator-role-only",
    `${id}: operator-assignment role effect drifted`,
  );
  allFalse(receipt.authorityBoundary, [
    "assigneeIdentityCryptographicallyVerified",
    "weeklyCapacityCommitmentEstablished",
    "backupAssignmentEstablished",
    "runtimeHostApproved",
    "containmentApproved",
    "immutableSessionAuthorizationEstablished",
    "animateGuiExecutionAuthorizedByThisReceiptAlone",
    "originalRuntimeExecutionAuthorizedByThisReceiptAlone",
    "actualAnimateExecutionEstablished",
    "actualOriginalRuntimeSessionEstablished",
    "humanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ], `${id}: operator-assignment authority boundary`);
  return receipt;
}

function reviewRecord(role) {
  return {
    role,
    decision: "pending",
    reviewer: null,
    reviewedAt: null,
    signatureEnvelope: null,
  };
}

function expectedRisk(machineAudit) {
  return machineAudit.randomOpcodeCount > 0 ||
    machineAudit.externalApiCandidateCount > 0 ||
    machineAudit.exportedScriptFileCount >= 100
    ? "critical"
    : "high";
}

function expectedScenarioInventory({plan, selection}) {
  const root = plan.structuralDomainPlanning.root;
  const nestedCount = plan.structuralDomainPlanning.nestedDefinitionCandidates.length;
  return [
    `EN natural host-entry traversal for root frame domain 1..${root.frameCount} using a fresh isolated original-runtime profile`,
    `ES natural host-entry traversal for root frame domain 1..${root.frameCount} using a separate fresh isolated original-runtime profile`,
    `complete disposition of ${nestedCount} structural nested definition candidate(s) without treating definition presence as runtime reachability`,
    "exact ordered interaction, branch, feedback, scoring, navigation, terminal, and complete Replay reset traces for every reachable state",
    "source-bound random-operation census plus deterministic seed schedules only where the original runtime exposes or proves them",
    "original audio cue, language, timing, synchronization, controls, and named-human listening evidence for every required cue",
    "native-stage baseline PNG coverage bound to frameDomain, requirementId, trace, entryStateSha256, frame, scenario, lang, and seed",
    "identity-matched JavaScript implementation captures with per-frame diffs and normalized RMSE; no source or baseline substitution",
    "desktop, mobile, keyboard, reduced-motion, text-overflow, console, asset, and network product validation",
    `named-human timed work study across ${selection.requiredPhases.length} configured phase(s); automation may not infer identities, timestamps, or labor`,
    "independent engineering review, independent human visual review, Owner fidelity acceptance, strict validation, and atomic publication remain separate gates",
  ];
}

function validateSourceStaticCandidateManifest(manifest, profile) {
  const implementation = manifest.implementation;
  const nested = implementation?.frameDomains?.find(
    ({kind}) => kind === "nested",
  );
  invariant(
    implementation?.rendering ===
      "source-static Canvas engineering candidate; root host entry, Spanish visuals, audio, source controls, Replay, natural runtime reachability, original-runtime parity, and strict fidelity fail closed" &&
      implementation.route === `/animations/${profile.animationId}` &&
      implementation.component ===
        `packages/demos/src/modules/${profile.animationId}.tsx` &&
      implementation.timelineModule ===
        `packages/demos/src/timelines/${profile.animationId}.ts` &&
      implementation.defaultFrameDomainId === profile.frameDomainId &&
      implementation.frameDomains?.length === 2 &&
      nested?.id === profile.frameDomainId &&
      nested.sourceTimelineId === profile.frameDomainId &&
      nested.sourceInstanceId === profile.sourceInstanceId &&
      nested.frameCount === profile.frameCount &&
      implementation.candidateState?.status ===
        "current-javascript-engineering-candidate-only" &&
      implementation.candidateState.sourceStaticFrameDomain ===
        profile.frameDomainId &&
      implementation.candidateState.sourceStaticFrames?.firstFrame === 1 &&
      implementation.candidateState.sourceStaticFrames.lastFrame ===
        profile.frameCount &&
      implementation.candidateState.renderedFrameCount ===
        profile.renderedFrameCount &&
      (profile.renderedFrameCount === profile.frameCount
        ? implementation.candidateState.sourceStaticRenderableFrames ===
            undefined &&
          implementation.candidateState.blockedLocalFrameRanges === undefined
        : implementation.candidateState.sourceStaticRenderableFrames
            ?.firstFrame === 1 &&
          implementation.candidateState.sourceStaticRenderableFrames
            .lastFrame === profile.renderedFrameCount &&
          implementation.candidateState.sourceStaticRenderableFrames
            .frameCount === profile.renderedFrameCount &&
          implementation.candidateState.blockedLocalFrameRanges?.length === 1 &&
          implementation.candidateState.blockedLocalFrameRanges[0]
            .firstFrame === profile.renderedFrameCount + 1 &&
          implementation.candidateState.blockedLocalFrameRanges[0]
            .lastFrame === profile.frameCount) &&
      implementation.candidateState.rootEnabled === false &&
      implementation.candidateState.spanishEnabled === false &&
      implementation.candidateState.audioEnabled === false &&
      implementation.candidateState.sourceControlsEnabled === false &&
      implementation.candidateState.replayParityEstablished === false &&
      implementation.candidateState.originalRuntimeBaselineUsed === false &&
      implementation.candidateState.rmseComputed === false &&
      implementation.candidateState.humanVisualReviewPerformed === false &&
      implementation.candidateState.ownerReviewPerformed === false &&
      implementation.candidateState.strictAcceptanceEffect === "none",
    `${profile.animationId}: bounded source-static candidate manifest drifted`,
  );
}

function validateEmptyRuntimePlan(plan, id, {
  sourceStaticProfile = null,
} = {}) {
  const sourceStaticCandidate = sourceStaticProfile !== null;
  invariant(plan.schemaVersion === 2 && plan.artifactType === "release-runtime-acquisition-plan", `${id}: runtime plan schema is invalid`);
  invariant(plan.identity?.releaseId === RELEASE_ID && plan.identity?.animationId === id, `${id}: runtime acquisition plan identity mismatch`);
  invariant(plan.artifactFingerprintSha256 === runtimePlanFingerprint(plan), `${id}: runtime acquisition plan fingerprint mismatch`);

  invariant(plan.ownership?.owner === "machine-generated-acceptance-neutral-planning", `${id}: runtime plan ownership drifted`);
  invariant(plan.ownership?.canonicalCoverage === false, `${id}: runtime plan claimed canonical coverage`);
  invariant(plan.ownership?.canonicalAcceptanceEvidence === false, `${id}: runtime plan claimed acceptance evidence`);
  invariant(plan.ownership?.migrationManifestBindingCreated === false, `${id}: runtime plan changed migration bindings`);
  const operator = plan.namedOperatorRoleAssignment || {};
  invariant(
    operator.roleId === "authorized-original-runtime-operator" &&
      operator.slot === "primary" &&
      operator.assigneeFullName === "Dr. Peter Hu" &&
      operator.identityBasis === "user-attested-current-codex-task" &&
      operator.requiredHoursPerWeek === 20 &&
      operator.committedHoursPerWeek === null &&
      operator.strictAcceptanceEffect === "named-primary-operator-role-only",
    `${id}: named operator role assignment drifted`,
  );
  allFalse(operator, [
    "cryptographicallyVerified",
    "weeklyCapacityEstablished",
    "backupAssignmentEstablished",
    "runtimeHostApproved",
    "containmentApproved",
    "immutableSessionAuthorizationEstablished",
    "originalRuntimeExecutionAuthorized",
    "animateGuiExecutionAuthorized",
    "actualSessionOperatorAttestationPresent",
  ], `${id}: named operator role boundary`);

  const execution = plan.executionGate || {};
  invariant(execution.state === "closed" && execution.runnable === false, `${id}: runtime execution gate is open`);
  allFalse(execution, [
    "authorizesDirectSeek",
    "createsBaselineEvidence",
    "createsRuntimeEvidence",
    "executesLegacyEndpoints",
    "launchesAnimate",
    "launchesBrowser",
    "launchesOriginalRuntime",
    "launchesRuffle",
  ], `${id}: runtime execution gate`);

  const worksheet = plan.emptyRuntimeAcquisitionWorksheet || {};
  invariant(worksheet.state === "empty-non-runnable-planning-only", `${id}: runtime worksheet state drifted`);
  invariant(
    worksheet.namedOperatorFieldMeaning ===
      "per-session operator attestation only; release-level role assignment is separate",
    `${id}: runtime worksheet operator meaning drifted`,
  );
  for (const key of [
    "actionSchedules",
    "audioListeningRecords",
    "authorizedRuntimeContexts",
    "baselineManifests",
    "deterministicSeedSchedules",
    "namedOperators",
    "naturalEntryActions",
    "ownerSignatures",
    "pngFiles",
    "reviewerSignatures",
    "runtimeReceipts",
    "traceSchedules",
  ]) invariant(Array.isArray(worksheet[key]) && worksheet[key].length === 0, `${id}: runtime worksheet ${key} is not empty`);

  const coverage = plan.coverageV2Planning || {};
  invariant(coverage.canonicalFileBoundReadOnly === true && coverage.canonicalFileModified === false, `${id}: canonical coverage boundary drifted`);
  invariant(coverage.canonicalRootOnlyRequirementCount === 2, `${id}: root-only planning requirement count drifted`);
  invariant(
    coverage.canonicalRequirementCount ===
      (sourceStaticCandidate ? 4 : 2),
    `${id}: canonical planning requirement count drifted`,
  );
  invariant(JSON.stringify(coverage.canonicalLanguages) === JSON.stringify(["en", "es"]), `${id}: canonical language planning drifted`);
  invariant(
    coverage.nestedRequirementsMaterialized ===
      (sourceStaticCandidate ? 2 : 0),
    `${id}: bounded nested runtime requirement count drifted`,
  );
  invariant(coverage.completeRequirementInventoryEstablished === false, `${id}: complete runtime inventory was claimed`);
  invariant(coverage.authoritativeBaselineCount === 0 && coverage.candidateCaptureCount === 0 && coverage.comparisonMetricsCount === 0, `${id}: runtime evidence counts are not zero`);
  if (sourceStaticCandidate) {
    invariant(
      plan.currentJavascriptEngineeringCandidate?.status ===
        "current-javascript-engineering-candidate-only" &&
        plan.currentJavascriptEngineeringCandidate.candidateKind ===
          (sourceStaticProfile.renderedFrameCount ===
          sourceStaticProfile.frameCount
            ? "single-sprite-full"
            : "single-sprite-safe-prefix") &&
        plan.currentJavascriptEngineeringCandidate.bindingAuthority ===
          "manifest-bound-single-sprite-candidate" &&
        plan.currentJavascriptEngineeringCandidate.frameDomainId ===
          sourceStaticProfile.frameDomainId &&
        plan.currentJavascriptEngineeringCandidate.canonicalFrameCount ===
          sourceStaticProfile.frameCount &&
        plan.currentJavascriptEngineeringCandidate.openFrameCount ===
          sourceStaticProfile.renderedFrameCount &&
        plan.currentJavascriptEngineeringCandidate.blockedTailFrameCount ===
          sourceStaticProfile.frameCount -
            sourceStaticProfile.renderedFrameCount &&
        plan.currentJavascriptEngineeringCandidate
          .canonicalNestedCoverageDeclared === true &&
        plan.currentJavascriptEngineeringCandidate
          .implementationAuthorized === false &&
        plan.currentJavascriptEngineeringCandidate.strictAcceptanceEffect ===
          "none",
      `${id}: runtime plan lost the bounded source-static engineering candidate`,
    );
  } else {
    invariant(
      plan.currentJavascriptEngineeringCandidate === null,
      `${id}: runtime plan invented an engineering candidate`,
    );
  }

  const blockers = plan.unresolvedBlockers || {};
  for (const key of [
    "missingAudioCueAndListeningDisposition",
    "missingAuthoritativeBaselines",
    "missingAuthorizedOriginalRuntimeContext",
    "missingBilingualRuntimeTraversal",
    "missingCompleteTraceSchedules",
    "missingInteractionBranchRandomReplayTraversal",
    "missingNaturalHostEntry",
    "missingPortableOperatorIdentityVerification",
    "missingOperatorWeeklyCapacityCommitment",
    "missingBackupOriginalRuntimeOperator",
    "missingImmutablePerSessionOperatorAttestation",
    "missingPerSessionExecutionAuthorization",
  ]) invariant(blockers[key] === true, `${id}: unresolved blocker ${key} was cleared`);
  invariant(blockers.missingNamedOriginalRuntimeOperator === false,
    `${id}: the validated named operator role was not bound`);
  invariant(blockers.unresolvedPlacementEntryStates > 0, `${id}: unresolved placement entries were cleared`);
  invariant(blockers.unresolvedRootReachableNestedDomains > 0, `${id}: unresolved nested reachability was cleared`);

  invariant(plan.acceptanceEffects?.acceptanceNeutral === true, `${id}: runtime plan must remain acceptance-neutral`);
  allFalse(plan.acceptanceEffects, [
    "audioAccepted",
    "authoritativeOriginalRuntime",
    "currentJavaScriptCandidate",
    "fullFrameComparison",
    "humanVisualAccepted",
    "ownerAccepted",
    "published",
    "strictComplete",
  ], `${id}: runtime plan acceptance`);
}

function validatePendingCoverage(coverage, id, rootFrameCount, {
  sourceStaticProfile = null,
} = {}) {
  const sourceStaticCandidate = sourceStaticProfile !== null;
  invariant(coverage.schemaVersion === 2 && coverage.animationId === id, `${id}: coverage-v2 identity mismatch`);
  invariant(
    Array.isArray(coverage.requirements) &&
      coverage.requirements.length === (sourceStaticCandidate ? 4 : 2),
    `${id}: coverage-v2 pending requirement count drifted`,
  );
  const domainLanguagePairs = coverage.requirements
    .map(({frameDomainId, language}) => `${frameDomainId}:${language}`)
    .sort();
  invariant(
    JSON.stringify(domainLanguagePairs) === JSON.stringify(
      sourceStaticCandidate
        ? [
            "root:en",
            "root:es",
            `${sourceStaticProfile.frameDomainId}:en`,
            `${sourceStaticProfile.frameDomainId}:es`,
          ].sort()
        : ["root:en", "root:es"],
    ),
    `${id}: coverage-v2 domain/language rows drifted`,
  );
  for (const requirement of coverage.requirements) {
    const expectedFrameCount =
      requirement.frameDomainId === "root"
        ? rootFrameCount
        : sourceStaticProfile.frameCount;
    invariant(
      requirement.frameDomainId === "root" ||
        (sourceStaticCandidate &&
          requirement.frameDomainId ===
            sourceStaticProfile.frameDomainId),
      `${id}/${requirement.requirementId}: unexpected frame domain`,
    );
    invariant(requirement.status === "pending" && requirement.baselineAuthority === "unresolved", `${id}/${requirement.requirementId}: coverage status was promoted`);
    invariant(requirement.capturedFrameCount === 0, `${id}/${requirement.requirementId}: captured frames were claimed`);
    invariant(requirement.requiredRange?.firstFrame === 1 && requirement.requiredRange?.lastFrame === expectedFrameCount, `${id}/${requirement.requirementId}: required range drifted`);
    invariant(Array.isArray(requirement.missingFrames) && requirement.missingFrames.length === expectedFrameCount, `${id}/${requirement.requirementId}: pending frame inventory is incomplete`);
    invariant(requirement.missingFrames.every((frame, index) => frame === index + 1), `${id}/${requirement.requirementId}: pending frame inventory is not exact`);
    for (const key of [
      "baselineCaptureManifest",
      "baselineCaptureManifestSha256",
      "captureManifest",
      "captureManifestSha256",
      "metricsFile",
      "metricsSha256",
    ]) invariant(requirement[key] === "", `${id}/${requirement.requirementId}: ${key} must remain empty`);
  }
}

export function validateG5L4WorkStudyStrictReadiness(document) {
  const id = document?.animationId || "unknown";
  const sourceStaticProfile = sourceStaticCandidateProfile(id);
  const sourceStaticCandidate = sourceStaticProfile !== null;
  invariant(document.schemaVersion === 3, `${id}: schemaVersion must be 3`);
  invariant(document.evidenceKind === "course-shell-strict-readiness", `${id}: evidenceKind is invalid`);
  invariant(G5_L4_WORK_STUDY_READINESS_IDS.includes(id), `${id}: not a G5 L4 work-study readiness target`);
  invariant(document.releaseId === RELEASE_ID, `${id}: release identity drifted`);
  invariant(document.migrationStatusChanged === false, `${id}: migration status may not change`);
  invariant(document.generatedBy?.script === "scripts/build-g5-l4-work-study-strict-readiness.mjs", `${id}: generator ownership is invalid`);
  invariant(document.generatedBy?.version === GENERATOR_VERSION && document.generatedBy?.deterministic === true, `${id}: generator metadata is invalid`);
  invariant(SHA256_PATTERN.test(document.generatedBy?.sha256 || ""), `${id}: generator SHA-256 is invalid`);

  invariant(document.workStudySelection?.status === "selected-pending-human-timed-study", `${id}: work-study state drifted`);
  invariant(JSON.stringify(document.workStudySelection?.selectedTargetIds) === JSON.stringify(G5_L4_WORK_STUDY_READINESS_IDS), `${id}: work-study target set drifted`);
  invariant(document.workStudySelection?.selectedTargetCount === 4, `${id}: work-study target count drifted`);
  invariant(document.workStudySelection?.completedPhaseCount === 0, `${id}: automation may not complete work-study phases`);
  invariant(document.workStudySelection?.actualTotalMinutes === null && document.workStudySelection?.measuredBy === null, `${id}: automation may not infer labor or identity`);
  invariant(document.workStudySelection?.phases?.every((phase) =>
    phase.status === "pending-human-measurement" &&
    phase.startedAt === null &&
    phase.finishedAt === null &&
    phase.actualMinutes === null &&
    phase.measuredBy === null), `${id}: work-study phase contains fabricated human evidence`);

  invariant(document.m1Authorization?.status === "machine-only-m1-fidelity-tranche-authorized", `${id}: M1 authorization state drifted`);
  invariant(document.m1Authorization?.phase === "M1" && document.m1Authorization?.releaseId === RELEASE_ID, `${id}: M1 authorization identity drifted`);
  invariant(document.m1Authorization?.ownerIdentityUserAttested === true, `${id}: Owner identity attestation is missing`);
  invariant(document.m1Authorization?.ownerIdentityCryptographicallyVerified === false, `${id}: cryptographic Owner identity was invented`);
  invariant(document.m1Authorization?.machineOnlyM1FidelityTrancheAuthorized === true, `${id}: machine-only M1 authorization is missing`);
  allFalse(document.m1Authorization, [
    "animateGuiExecutionAuthorized",
    "externalSignatureEnvelopePresent",
    "humanReviewAccepted",
    "originalRuntimeExecutionAuthorized",
    "ownerFidelityAcceptanceEstablished",
    "portableExternalIdentityVerificationReady",
    "publicationAuthorized",
    "rendererImplementationAuthorized",
    "strictCompletionEstablished",
  ], `${id}: M1 authorization boundary`);

  invariant(["shipped-swf-only", "paired-fla-and-shipped-swf"].includes(document.source?.sourceModel), `${id}: source model is invalid`);
  invariant(document.source?.sourceHashesVerified === true, `${id}: source hashes are not verified`);
  invariant(SHA256_PATTERN.test(document.source?.swfSha256 || ""), `${id}: SWF SHA-256 is invalid`);
  invariant(document.source?.technicalManifestProjection === TECHNICAL_MANIFEST_PROJECTION.id, `${id}: technical manifest projection drifted`);
  if (document.source.sourceModel === "shipped-swf-only") {
    invariant(document.source.fla === null && document.source.flaSha256 === null, `${id}: SWF-only source may not invent an FLA`);
    invariant(document.source.authoringPath?.status === "blocked-missing-fla", `${id}: SWF-only authoring gap was weakened`);
  } else {
    invariant(typeof document.source.fla === "string" && SHA256_PATTERN.test(document.source.flaSha256 || ""), `${id}: paired FLA binding is missing`);
    invariant(document.source.authoringPath?.status === "paired-source-present-authoring-audit-pending", `${id}: paired authoring path was promoted`);
  }
  invariant(document.source.authoringPath?.authoringAuditEstablished === false, `${id}: authoring audit must remain unestablished`);
  invariant(document.source.authoringPath?.authoringAccepted === false, `${id}: authoring acceptance must remain false`);

  invariant(document.sourceScope?.memberCount === 55 && document.sourceScope?.pairedFlaAndSwfCount === 44 && document.sourceScope?.swfOnlyCount === 11, `${id}: source scope totals drifted`);
  invariant(document.sourceScope?.strictCompleteCount === 0 && document.sourceScope?.publishedCount === 0, `${id}: source scope was promoted`);
  allFalse(document.sourceScope?.acceptanceEffects, [
    "audioAccepted",
    "authoringAuditComplete",
    "authoritativeOriginalRuntime",
    "currentJavaScriptCandidate",
    "fullFrameComparison",
    "humanVisualAccepted",
    "ownerAccepted",
    "published",
    "reachableFrameDomainsComplete",
    "strictComplete",
  ], `${id}: source scope acceptance`);

  invariant(document.machineAudit?.auditStatus === "partial", `${id}: machine audit must remain partial`);
  invariant(document.machineAudit?.allCommandsPassed === true && document.machineAudit?.allOutputPinsVerified === true, `${id}: machine audit inputs are incomplete`);
  invariant(document.machineAudit?.rootFrameCount > 0 && document.machineAudit?.nestedDefinitionCount > 0, `${id}: machine timeline facts are incomplete`);
  invariant(document.machineAudit?.rootReachableDomainInventoryComplete === false, `${id}: static nested definitions were promoted to runtime reachability`);
  invariant(document.machineAudit?.authoringAuditEstablished === false, `${id}: machine evidence cannot establish authoring audit`);
  invariant(
    Array.isArray(document.machineAudit?.observedBehaviorFromExtractedScripts) &&
    document.machineAudit.observedBehaviorFromExtractedScripts.length >= 4,
    `${id}: machine static observations are incomplete`,
  );

  invariant(document.branchCaptureReadiness?.status === "partial-reference-only", `${id}: branch-capture readiness state drifted`);
  invariant(document.branchCaptureReadiness?.authoritativeScheduleEstablished === false, `${id}: authoritative branch schedule was invented`);
  invariant(document.branchCaptureReadiness?.runtimeSessionsExecuted === 0, `${id}: branch-capture runtime session count must remain zero`);
  invariant(document.branchCaptureReadiness?.requiredScenarioInventory?.length >= 10, `${id}: branch scenario obligations are too narrow`);
  invariant(document.branchCaptureReadiness?.missing?.length >= 8, `${id}: branch missing-evidence list is too narrow`);
  invariant(
    JSON.stringify(document.branchCaptureReadiness.requiredScenarioInventory) ===
    JSON.stringify(document.runtimeAcquisitionReadiness?.requiredScenarioInventory),
    `${id}: branch and runtime scenario obligations conflict`,
  );
  invariant(
    JSON.stringify(document.branchCaptureReadiness?.captureIdentity?.requiredFields) === JSON.stringify(CAPTURE_IDENTITY_FIELDS),
    `${id}: branch capture identity contract drifted`,
  );
  invariant(document.branchCaptureReadiness?.directSeekAuthority.startsWith("not-permitted"), `${id}: branch direct-seek authority drifted`);

  invariant(document.runtimeAcquisitionReadiness?.status === "empty-non-runnable-planning-only", `${id}: runtime planning state drifted`);
  invariant(document.runtimeAcquisitionReadiness?.runtimeSessionsExecuted === 0, `${id}: runtime session count must remain zero`);
  invariant(document.runtimeAcquisitionReadiness?.namedOperatorRoleAssignmentCount === 1,
    `${id}: named operator role assignment is missing or duplicated`);
  invariant(document.runtimeAcquisitionReadiness?.sessionOperatorAttestationCount === 0,
    `${id}: a per-session operator attestation was fabricated`);
  const operator = document.runtimeAcquisitionReadiness?.namedOperatorRoleAssignment || {};
  invariant(
    operator.roleId === "authorized-original-runtime-operator" &&
      operator.slot === "primary" &&
      operator.assigneeFullName === "Dr. Peter Hu" &&
      operator.identityBasis === "user-attested-current-codex-task" &&
      operator.requiredHoursPerWeek === 20 &&
      operator.committedHoursPerWeek === null &&
      operator.strictAcceptanceEffect === "named-primary-operator-role-only" &&
      operator.receipt?.path === OPERATOR_ASSIGNMENT_RELATIVE &&
      Number.isInteger(operator.receipt?.bytes) &&
      SHA256_PATTERN.test(operator.receipt?.sha256 || ""),
    `${id}: named operator role assignment drifted`,
  );
  allFalse(operator, [
    "cryptographicallyVerified",
    "weeklyCapacityEstablished",
    "backupAssignmentEstablished",
    "runtimeHostApproved",
    "containmentApproved",
    "immutableSessionAuthorizationEstablished",
    "originalRuntimeExecutionAuthorized",
    "animateGuiExecutionAuthorized",
    "actualSessionOperatorAttestationPresent",
  ], `${id}: named operator role authority`);
  invariant(document.runtimeAcquisitionReadiness?.authoritativeBaselineCount === 0, `${id}: authoritative baseline was fabricated`);
  invariant(document.runtimeAcquisitionReadiness?.candidateCaptureCount === 0, `${id}: capture candidate was fabricated`);
  invariant(document.runtimeAcquisitionReadiness?.comparisonMetricsCount === 0, `${id}: comparison metrics were fabricated`);
  invariant(document.runtimeAcquisitionReadiness?.rootReachableDomainInventoryComplete === false, `${id}: runtime domain inventory was promoted`);
  invariant(document.runtimeAcquisitionReadiness?.requiredScenarioInventory?.length >= 10, `${id}: scenario obligations are too narrow`);
  invariant(JSON.stringify(document.runtimeAcquisitionReadiness?.captureIdentity?.requiredFields) === JSON.stringify(CAPTURE_IDENTITY_FIELDS), `${id}: capture identity contract drifted`);
  invariant(document.runtimeAcquisitionReadiness?.directSeekAuthority.startsWith("not-permitted"), `${id}: direct-seek authority drifted`);

  allFalse(document.implementationReadiness, [
    "behaviorImplementationComplete",
    "deterministicImplementationCaptureAccepted",
    "fullFrameComparisonAccepted",
    "implementationAuthorized",
  ], `${id}: implementation readiness`);
  invariant(
    document.implementationReadiness?.rendererSelected ===
      sourceStaticCandidate &&
      document.implementationReadiness?.routeDeclared ===
        sourceStaticCandidate &&
      document.implementationReadiness?.currentJavaScriptCandidate ===
        sourceStaticCandidate,
    `${id}: bounded current-JavaScript candidate readiness drifted`,
  );
  if (sourceStaticCandidate) {
    const candidate = document.implementationReadiness.engineeringCandidate;
    invariant(
      candidate?.status ===
        "current-javascript-engineering-candidate-only" &&
        candidate.candidateKind ===
          (sourceStaticProfile.renderedFrameCount ===
          sourceStaticProfile.frameCount
            ? "single-sprite-full"
            : "single-sprite-safe-prefix") &&
        candidate.bindingAuthority ===
          "manifest-bound-single-sprite-candidate" &&
        candidate.route === `/animations/${id}` &&
        candidate.frameDomainId ===
          sourceStaticProfile.frameDomainId &&
        candidate.canonicalFrameCount ===
          sourceStaticProfile.frameCount &&
        candidate.openFrameCount ===
          sourceStaticProfile.renderedFrameCount &&
        candidate.blockedTailFrameCount ===
          sourceStaticProfile.frameCount -
            sourceStaticProfile.renderedFrameCount &&
        candidate.canonicalNestedCoverageDeclared === true &&
        candidate.implementationAuthorized === false &&
        candidate.strictAcceptanceEffect === "none",
      `${id}: bounded engineering-candidate disposition drifted`,
    );
  } else {
    invariant(
      document.implementationReadiness?.engineeringCandidate === null,
      `${id}: engineering candidate was invented`,
    );
  }

  invariant(document.acceptance?.acceptanceNeutral === true, `${id}: readiness artifact must remain acceptance-neutral`);
  allFalse(document.acceptance, [
    "audioAccepted",
    "authoritativeOriginalRuntimeAccepted",
    "humanVisualAccepted",
    "independentEngineeringAccepted",
    "ownerAccepted",
    "published",
    "rmseAccepted",
    "runtimeReachabilityEstablished",
    "strictMigrationComplete",
  ], `${id}: acceptance`);

  for (const key of [
    "strictAcceptanceReady",
    "completionClaimAllowed",
    "localAuthoritativeBaselineCompletable",
    "localExhaustiveBranchCaptureCompletable",
  ]) invariant(document.conclusion?.[key] === false, `${id}: ${key} must remain false`);
  invariant(document.conclusion?.risk === expectedRisk(document.machineAudit), `${id}: risk classification drifted`);
  invariant(typeof document.conclusion?.reason === "string" && document.conclusion.reason.length > 120, `${id}: fail-closed conclusion is incomplete`);

  for (const role of ["independentEngineeringReview", "humanVisualReview", "ownerReview"]) {
    const review = document.review?.[role];
    invariant(review?.decision === "pending", `${id}: ${role} must remain pending`);
    invariant(review.reviewer === null && review.reviewedAt === null && review.signatureEnvelope === null, `${id}: ${role} contains a fabricated identity or signature`);
  }

  invariant(Array.isArray(document.evidence) && document.evidence.length >= 15, `${id}: evidence index is incomplete`);
  invariant(document.evidence.every((entry) =>
    typeof entry.id === "string" && entry.id.length > 0 &&
    typeof entry.path === "string" && entry.path.length > 0 &&
    Number.isInteger(entry.bytes) && entry.bytes >= 0 &&
    SHA256_PATTERN.test(entry.sha256 || "")), `${id}: evidence entry is malformed`);
  invariant(new Set(document.evidence.map((entry) => entry.id)).size === document.evidence.length, `${id}: evidence IDs must be unique`);
  invariant(new Set(document.evidence.map((entry) => entry.path)).size === document.evidence.length, `${id}: evidence paths must be unique`);
  invariant(
    document.strictAcceptanceEffect ===
      (sourceStaticCandidate
        ? "none; bounded current-JavaScript engineering candidate plus source-bound M1 readiness planning only"
        : "none; source-bound M1 readiness planning only"),
    `${id}: strict acceptance effect drifted`,
  );
  return true;
}

async function loadSelection(projectRoot) {
  const calibration = await readJsonRecord(projectRoot, CALIBRATION_RELATIVE, "G5 L4 calibration-set catalog");
  invariant(calibration.document.schemaVersion === 1 && Array.isArray(calibration.document.calibrationSets), "G5 L4 calibration-set catalog schema drifted");
  const matches = calibration.document.calibrationSets.filter((entry) => entry?.releaseId === RELEASE_ID);
  invariant(matches.length === 1, `Expected exactly one ${RELEASE_ID} calibration set`);
  const selected = matches[0];
  const targetIds = selected.humanWorkStudy?.memberAnimationIds;
  invariant(JSON.stringify(targetIds) === JSON.stringify(G5_L4_WORK_STUDY_READINESS_IDS), "G5 L4 work-study target selection drifted");
  invariant(Array.isArray(selected.humanWorkStudy.requiredPhases) && selected.humanWorkStudy.requiredPhases.length === 4, "G5 L4 work-study phases drifted");
  invariant(new Set(selected.humanWorkStudy.requiredPhases).size === 4, "G5 L4 work-study phases contain duplicates");
  invariant(typeof selected.humanWorkStudy.measurementRule === "string" && selected.humanWorkStudy.measurementRule.includes("Do not infer"), "G5 L4 work-study measurement boundary drifted");
  const calibrationMembers = new Map(selected.members.map((member) => [member.animationId, member]));
  invariant(calibrationMembers.size === selected.members.length, "G5 L4 calibration members contain duplicates");
  for (const id of G5_L4_WORK_STUDY_READINESS_IDS) {
    invariant(calibrationMembers.has(id), `${id}: work-study target is not a calibration member`);
  }
  return {record: calibration, selected, calibrationMembers};
}

async function preflightWorkspace(projectRoot, id) {
  invariant(G5_L4_WORK_STUDY_READINESS_IDS.includes(id), `${id}: unknown G5 L4 work-study readiness target`);
  const workspace = path.join(projectRoot, "migrations", id);
  const migrationsRoot = path.join(projectRoot, "migrations");
  const [realProjectRoot, realMigrationsRoot, realWorkspace] = await Promise.all([
    realpath(projectRoot),
    realpath(migrationsRoot),
    realpath(workspace),
  ]);
  invariant(isWithin(realProjectRoot, realMigrationsRoot), `${id}: migrations root escapes project root`);
  invariant(isWithin(realMigrationsRoot, realWorkspace), `${id}: workspace escapes migrations root`);
  return {workspace};
}

function evidenceEntry(id, record) {
  return {id, path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function assertUniqueEvidence(entries, id) {
  const seenIds = new Set();
  const seenPaths = new Map();
  for (const entry of entries) {
    invariant(!seenIds.has(entry.id), `${id}: duplicate evidence id ${entry.id}`);
    seenIds.add(entry.id);
    const previous = seenPaths.get(entry.path);
    invariant(!previous, `${id}: duplicate evidence path ${entry.path} (${previous} and ${entry.id})`);
    seenPaths.set(entry.path, entry.id);
  }
  return entries;
}

export async function buildOneG5L4WorkStudyStrictReadiness(id, options = {}) {
  const projectRoot = path.resolve(options.projectRoot || defaultProjectRoot);
  const {workspace} = await preflightWorkspace(projectRoot, id);
  const selection = options.selection || await loadSelection(projectRoot);
  const workspaceRelative = `migrations/${id}`;
  const manifestRelative = `${workspaceRelative}/migration.json`;
  const machineRelative = `${workspaceRelative}/audit/machine/report.json`;
  const sourceBindingRelative = `${workspaceRelative}/audit/machine/g5-l4-source-scope-binding.json`;
  const domainsRelative = `${workspaceRelative}/audit/machine/swf-frame-domain-candidates.json`;
  const coverageRelative = `${workspaceRelative}/evidence/full-frame-coverage.json`;
  const planRelative = `${workspaceRelative}/audit/machine/release-runtime-acquisition-plan.json`;
  const outputRelative = `${workspaceRelative}/audit/strict-readiness.json`;
  const outputPath = path.join(projectRoot, outputRelative);

  const [
    manifestRecord,
    machineRecord,
    sourceBindingRecord,
    domainsRecord,
    coverageRecord,
    planRecord,
    authorizationRecord,
    generatorRecord,
  ] = await Promise.all([
    readJsonRecord(projectRoot, manifestRelative, `${id}: migration manifest`),
    readJsonRecord(projectRoot, machineRelative, `${id}: machine report`),
    readJsonRecord(projectRoot, sourceBindingRelative, `${id}: source-scope binding`),
    readJsonRecord(projectRoot, domainsRelative, `${id}: frame-domain candidates`),
    readJsonRecord(projectRoot, coverageRelative, `${id}: coverage-v2`),
    readJsonRecord(projectRoot, planRelative, `${id}: runtime acquisition plan`),
    readJsonRecord(projectRoot, M1_AUTHORIZATION_RELATIVE, "G5 L4 M1 Owner authorization intake"),
    readFileRecord(projectRoot, "scripts/build-g5-l4-work-study-strict-readiness.mjs", "G5 L4 work-study readiness generator"),
  ]);
  const manifest = manifestRecord.document;
  const machine = machineRecord.document;
  const sourceBinding = sourceBindingRecord.document;
  const domains = domainsRecord.document;
  const coverage = coverageRecord.document;
  const plan = planRecord.document;
  const authorization = authorizationRecord.document;
  const sourceStaticProfile = sourceStaticCandidateProfile(id);
  const sourceStaticCandidate = sourceStaticProfile !== null;

  invariant(manifest.schemaVersion === 2 && manifest.animationId === id && manifest.id === id, `${id}: migration manifest identity mismatch`);
  invariant(manifest.status === "preserved", `${id}: migration status must remain preserved`);
  invariant(manifest.review == null, `${id}: migration manifest unexpectedly contains review evidence`);
  if (sourceStaticCandidate) {
    validateSourceStaticCandidateManifest(manifest, sourceStaticProfile);
  } else {
    invariant(manifest.implementation?.rendering === "undecided", `${id}: renderer was selected before this readiness boundary`);
    for (const key of ["route", "routeFile", "component", "registryModule", "timelineModule", "testFile", "standalonePackage"]) {
      invariant(manifest.implementation?.[key] === "", `${id}: implementation field ${key} is no longer empty`);
    }
  }

  invariant(machine.schemaVersion === 1 && machine.animationId === id && machine.auditStatus === "partial", `${id}: machine report identity/status mismatch`);
  invariant(machine.migrationStatusUnchanged === true, `${id}: machine report changed migration status`);
  invariant(machine.source?.path === manifest.source.swf && machine.source?.expectedSha256 === manifest.source.swfSha256, `${id}: machine SWF binding mismatch`);
  invariant(machine.source?.observedSha256Before === manifest.source.swfSha256 && machine.source?.observedSha256After === manifest.source.swfSha256 && machine.source?.hashMatches === true, `${id}: machine report did not preserve the SWF`);
  invariant(machine.findings?.runtimeCrossCheck?.allMatch === true, `${id}: machine runtime cross-check failed`);
  invariant(Object.values(machine.commands || {}).length >= 6 && Object.values(machine.commands).every((command) => command.status === "success"), `${id}: machine extraction command failed or is missing`);
  invariant(Array.isArray(machine.outputs) && machine.outputs.length >= 7, `${id}: machine outputs are incomplete`);
  const machineOutputs = await Promise.all(machine.outputs.map(async (output, index) => {
    const verified = await verifyWorkspaceOutput(workspace, output, `${id}: machine output ${index + 1}`);
    return {
      path: `${workspaceRelative}/${output.path}`,
      bytes: verified.bytes,
      sha256: verified.sha256,
    };
  }));

  invariant(sourceBinding.schemaVersion === 1 && sourceBinding.artifactType === "g5-l4-source-scope-binding", `${id}: source-scope binding schema mismatch`);
  invariant(sourceBinding.releaseId === RELEASE_ID && sourceBinding.member?.animationId === id, `${id}: source-scope member identity mismatch`);
  const sourceFreezeRecord = await verifyProjectDescriptor(projectRoot, sourceBinding.scope, `${id}: source-scope freeze`, {json: true});
  const sourceFreeze = sourceFreezeRecord.document;
  invariant(sourceFreeze.schemaVersion === 1 && sourceFreeze.reportType === "g5-l4-source-scope-freeze" && sourceFreeze.releaseId === RELEASE_ID, `${id}: source-scope freeze identity mismatch`);
  invariant(sourceFreeze.summary?.memberCount === 55 && sourceFreeze.summary?.pageCount === 54 && sourceFreeze.summary?.shellCount === 1, `${id}: source-scope cardinality drifted`);
  invariant(sourceFreeze.summary?.pairedFlaSwfCount === 44 && sourceFreeze.summary?.swfOnlyCount === 11, `${id}: source-model totals drifted`);
  invariant(sourceFreeze.summary?.strictCompleteCount === 0 && sourceFreeze.summary?.publishedCount === 0, `${id}: source-scope freeze was promoted`);
  const frozenMembers = sourceFreeze.members.filter((member) => member.animationId === id);
  invariant(frozenMembers.length === 1, `${id}: source-scope member is missing or duplicated`);
  const frozenMemberProjection = {
    ordinal: frozenMembers[0].ordinal,
    animationId: frozenMembers[0].animationId,
    assetId: frozenMembers[0].assetId,
    role: frozenMembers[0].role,
    shardId: frozenMembers[0].shardId,
    section: frozenMembers[0].section,
    sectionPageOrdinal: frozenMembers[0].sectionPageOrdinal,
    source: frozenMembers[0].source,
  };
  invariant(JSON.stringify(frozenMemberProjection) === JSON.stringify(sourceBinding.member), `${id}: source-scope member binding drifted`);
  allFalse(sourceBinding.acceptanceEffects, [
    "audioAccepted",
    "authoritativeOriginalRuntime",
    "currentJavaScriptCandidate",
    "fullFrameComparison",
    "humanVisualAccepted",
    "ownerAccepted",
    "published",
    "strictComplete",
  ], `${id}: source-scope binding acceptance`);
  allFalse(sourceFreeze.acceptanceEffects, [
    "audioAccepted",
    "authoringAuditComplete",
    "authoritativeOriginalRuntime",
    "currentJavaScriptCandidate",
    "fullFrameComparison",
    "humanVisualAccepted",
    "ownerAccepted",
    "published",
    "reachableFrameDomainsComplete",
    "strictComplete",
  ], `${id}: source-scope freeze acceptance`);

  invariant(
    authorization.schemaVersion === 1 &&
    authorization.evidenceType === "g5-l4-user-stated-owner-m1-authorization-intake" &&
    authorization.releaseId === RELEASE_ID,
    `${id}: M1 Owner authorization intake identity mismatch`,
  );
  invariant(authorization.receivedOn === "2026-07-28" && authorization.channel === "current-codex-task", `${id}: M1 authorization provenance drifted`);
  invariant(authorization.ownerStatement?.exactUtf8 === OWNER_M1_STATEMENT_TEXT, `${id}: M1 Owner statement text drifted`);
  invariant(authorization.ownerStatement?.byteLength === Buffer.byteLength(OWNER_M1_STATEMENT_TEXT), `${id}: M1 Owner statement byte length drifted`);
  invariant(
    authorization.ownerStatement?.sha256 === OWNER_M1_STATEMENT_SHA256 &&
    authorization.ownerStatement.sha256 === sha256Bytes(Buffer.from(authorization.ownerStatement.exactUtf8)),
    `${id}: M1 Owner statement digest drifted`,
  );
  invariant(authorization.identity?.ownerFullName === "Dr. Peter Hu" && authorization.identity?.ownerRole === "Owner", `${id}: M1 Owner identity claim drifted`);
  invariant(authorization.identity?.externalSubjectId === null && authorization.externalSignatureEnvelope === null, `${id}: M1 authorization invented external identity or signature evidence`);
  invariant(authorization.authorization?.phase === "M1" && authorization.authorization?.explicit === true, `${id}: M1 phase authorization is missing`);
  invariant(authorization.authorization?.track === "G5 L4 fidelity track", `${id}: M1 authorization track drifted`);
  const authorizationBoundary = authorization.authorityBoundary || {};
  invariant(authorizationBoundary.ownerIdentityUserAttested === true, `${id}: Owner identity user attestation is missing`);
  invariant(authorizationBoundary.ownerIdentityCryptographicallyVerified === false, `${id}: cryptographic Owner verification was invented`);
  invariant(authorizationBoundary.ownerM1IntentRecorded === true && authorizationBoundary.machineOnlyM1FidelityTrancheAuthorized === true, `${id}: machine-only M1 authorization is missing`);
  invariant(authorizationBoundary.requiredOwnerDecisionsSatisfied === 0 && authorizationBoundary.namedHumanRoleAssignmentsEstablished === 0 && authorizationBoundary.budgetGatesApproved === 0, `${id}: M1 intake improperly closed governance decisions`);
  allFalse(authorizationBoundary, [
    "animateGuiExecutionAuthorizedByThisIntakeAlone",
    "formalRoadmapSignoffEstablished",
    "humanReviewAccepted",
    "m0ExitEstablished",
    "originalRuntimeExecutionAuthorizedByThisIntakeAlone",
    "ownerFidelityAcceptanceEstablished",
    "publicationAuthorized",
    "rendererImplementationAuthorizedByThisIntakeAlone",
    "strictCompletionEstablished",
  ], `${id}: M1 intake authority`);
  invariant(authorizationBoundary.strictAcceptanceEffect === "m1-start-only", `${id}: M1 intake strict-acceptance boundary drifted`);
  invariant(
    authorization.sourceBindingsAtIntake?.sourceScopeFreeze?.path === sourceFreezeRecord.path &&
    authorization.sourceBindingsAtIntake.sourceScopeFreeze.sha256 === sourceFreezeRecord.sha256,
    `${id}: M1 authorization/source-scope binding mismatch`,
  );

  const scopeSource = sourceBinding.member.source;
  invariant(manifest.source.swf === `${SOURCE_ARCHIVE_PREFIX}${scopeSource.swf.path}`, `${id}: manifest/source-scope SWF path mismatch`);
  invariant(manifest.source.swfSha256 === scopeSource.swf.sha256, `${id}: manifest/source-scope SWF hash mismatch`);
  const sourceRecords = [];
  const swfRecord = await verifyProjectDescriptor(projectRoot, {
    path: manifest.source.swf,
    bytes: scopeSource.swf.bytes,
    sha256: manifest.source.swfSha256,
  }, `${id}: physical source SWF`);
  sourceRecords.push(evidenceEntry("source-swf", swfRecord));

  const paired = Boolean(manifest.source.fla);
  if (paired) {
    invariant(manifest.source.pairedFlaStatus === "present" && scopeSource.sourceModel === "paired-fla-and-shipped-swf", `${id}: paired source model drifted`);
    invariant(scopeSource.fla && manifest.source.fla === `${SOURCE_ARCHIVE_PREFIX}${scopeSource.fla.path}`, `${id}: manifest/source-scope FLA path mismatch`);
    invariant(manifest.source.flaSha256 === scopeSource.fla.sha256, `${id}: manifest/source-scope FLA hash mismatch`);
    invariant(machine.authoringSource?.path === manifest.source.fla && machine.authoringSource?.expectedSha256 === manifest.source.flaSha256, `${id}: machine FLA binding mismatch`);
    invariant(machine.authoringSource?.hashMatches === true && machine.authoringSource?.inspectionStatus === "not-performed-by-this-script", `${id}: machine FLA boundary drifted`);
    const flaRecord = await verifyProjectDescriptor(projectRoot, {
      path: manifest.source.fla,
      bytes: scopeSource.fla.bytes,
      sha256: manifest.source.flaSha256,
    }, `${id}: physical source FLA`);
    sourceRecords.push(evidenceEntry("source-fla", flaRecord));
  } else {
    invariant(manifest.source.pairedFlaStatus === "missing" && scopeSource.sourceModel === "shipped-swf-only" && scopeSource.fla === null, `${id}: SWF-only source model drifted`);
    invariant(machine.authoringSource?.pairedFlaStatus === "missing" && machine.authoringSource?.inspectionStatus === "missing-source", `${id}: SWF-only machine authoring boundary drifted`);
  }

  invariant(domains.schemaVersion === 1 && domains.artifactType === "swf-frame-domain-candidates" && domains.animationId === id, `${id}: frame-domain candidate identity mismatch`);
  invariant(domains.source?.path === manifest.source.swf && domains.source?.sha256 === manifest.source.swfSha256, `${id}: frame-domain source binding mismatch`);
  invariant(domains.root?.frameCount === manifest.runtime.frameCount && domains.root?.sourceTimelineId === "root", `${id}: root frame-domain facts conflict`);
  invariant(domains.summary?.nestedDefinitionCount === domains.nestedDefinitions.length, `${id}: nested definition count mismatch`);
  invariant(domains.summary?.completeRootReachableDomainInventory === false, `${id}: static domains were promoted to runtime reachability`);
  invariant(domains.summary?.unresolvedReachabilityCount === domains.nestedDefinitions.length, `${id}: unresolved reachability count drifted`);
  invariant(domains.nestedDefinitions.every((entry) =>
    entry.rootReachability === "unresolved" &&
    entry.placementEntryState === "unresolved" &&
    entry.acceptanceDisposition === "structural-candidate-only"), `${id}: nested definition was promoted`);
  allFalse(domains.acceptanceEffects, [
    "audioAccepted",
    "authoritativeOriginalRuntime",
    "completeFrameDomainDisposition",
    "humanVisualAccepted",
    "ownerAccepted",
    "published",
    "strictComplete",
  ], `${id}: frame-domain acceptance`);

  validatePendingCoverage(coverage, id, manifest.runtime.frameCount, {
    sourceStaticProfile,
  });
  validateEmptyRuntimePlan(plan, id, {sourceStaticProfile});
  invariant(plan.source?.sourceModel === scopeSource.sourceModel, `${id}: runtime plan source model mismatch`);
  invariant(
    plan.source.swf?.path === manifest.source.swf &&
    plan.source.swf?.bytes === scopeSource.swf.bytes &&
    plan.source.swf?.sha256 === manifest.source.swfSha256,
    `${id}: runtime plan SWF binding mismatch`,
  );
  if (paired) {
    invariant(
      plan.source.fla?.path === manifest.source.fla &&
      plan.source.fla?.bytes === scopeSource.fla.bytes &&
      plan.source.fla?.sha256 === manifest.source.flaSha256,
      `${id}: runtime plan FLA binding mismatch`,
    );
  } else {
    invariant(plan.source.fla === null, `${id}: SWF-only runtime plan invented an FLA`);
  }
  const native = plan.nativeRootTimelineFacts;
  invariant(native.stage?.width === machine.findings.ffdecHeader.widthPx && native.stage?.height === machine.findings.ffdecHeader.heightPx, `${id}: runtime-plan stage facts conflict`);
  invariant(native.fps === machine.findings.ffdecHeader.frameRate && native.rootFrameCount === machine.findings.ffdecHeader.frameCount, `${id}: runtime-plan root timeline facts conflict`);
  invariant(plan.structuralDomainPlanning?.nestedDefinitionCandidates?.length === domains.nestedDefinitions.length, `${id}: runtime-plan nested domain count conflict`);
  invariant(plan.unresolvedBlockers.unresolvedPlacementEntryStates === domains.nestedDefinitions.length, `${id}: runtime-plan unresolved placement count conflict`);
  invariant(plan.unresolvedBlockers.unresolvedRootReachableNestedDomains === domains.nestedDefinitions.length, `${id}: runtime-plan unresolved reachability count conflict`);

  const provenance = plan.provenance || {};
  invariant(
    provenance.migrationManifest?.path === manifestRecord.path &&
    provenance.migrationManifest?.bytes === manifestRecord.bytes &&
    provenance.migrationManifest?.sha256 === manifestRecord.sha256,
    `${id}: runtime-plan manifest provenance mismatch`,
  );
  invariant(
    provenance.sourceScopeBinding?.path === sourceBindingRecord.path &&
    provenance.sourceScopeBinding?.bytes === sourceBindingRecord.bytes &&
    provenance.sourceScopeBinding?.sha256 === sourceBindingRecord.sha256,
    `${id}: runtime-plan source-scope provenance mismatch`,
  );
  invariant(
    provenance.structuralFrameDomainCandidates?.path === domainsRecord.path &&
    provenance.structuralFrameDomainCandidates?.bytes === domainsRecord.bytes &&
    provenance.structuralFrameDomainCandidates?.sha256 === domainsRecord.sha256,
    `${id}: runtime-plan frame-domain provenance mismatch`,
  );
  invariant(
    provenance.canonicalCoverageV2?.path === coverageRecord.path &&
    provenance.canonicalCoverageV2?.bytes === coverageRecord.bytes &&
    provenance.canonicalCoverageV2?.sha256 === coverageRecord.sha256,
    `${id}: runtime-plan coverage provenance mismatch`,
  );
  const [
    releaseCatalogRecord,
    assetCatalogRecord,
    runtimeMaterializerRecord,
    operatorAssignmentRecord,
    roadmapRecord,
  ] = await Promise.all([
    verifyProjectDescriptor(projectRoot, provenance.lessonReleaseCatalog, `${id}: lesson-release catalog`, {json: true}),
    verifyProjectDescriptor(projectRoot, provenance.assetCatalog, `${id}: asset catalog`, {json: true}),
    verifyProjectDescriptor(projectRoot, provenance.materializer, `${id}: runtime-plan materializer`),
    verifyProjectDescriptor(
      projectRoot,
      provenance.namedOperatorAssignmentReceipt,
      `${id}: named operator-assignment receipt`,
      {json: true},
    ),
    verifyProjectDescriptor(projectRoot, authorization.sourceBindingsAtIntake?.roadmap, `${id}: M1 authorization roadmap binding`),
  ]);
  const operatorAssignmentReceipt = validateOperatorAssignmentReceipt(operatorAssignmentRecord, id);
  invariant(
    plan.namedOperatorRoleAssignment.assigneeFullName ===
      operatorAssignmentReceipt.assignment.assigneeFullName &&
      plan.namedOperatorRoleAssignment.roleId ===
        operatorAssignmentReceipt.assignment.roleId &&
      plan.namedOperatorRoleAssignment.slot === operatorAssignmentReceipt.assignment.slot,
    `${id}: runtime-plan operator role does not match its receipt`,
  );
  invariant(releaseCatalogRecord.document.releases?.filter((release) => release.releaseId === RELEASE_ID).length === 1, `${id}: lesson-release catalog identity drifted`);
  invariant(
    provenance.lessonReleaseCatalog.releaseFingerprintSha256 ===
      G5_L4_RELEASE_FINGERPRINT_SHA256,
    `${id}: current G5 L4 release fingerprint drifted`,
  );
  invariant(assetCatalogRecord.document.schemaVersion === 1 && Array.isArray(assetCatalogRecord.document.assets), `${id}: asset catalog schema drifted`);
  invariant(
    authorization.sourceBindingsAtIntake?.releaseManifest?.path === releaseCatalogRecord.path &&
    authorization.sourceBindingsAtIntake.releaseManifest.sha256 ===
      G5_L4_INTAKE_RELEASE_MANIFEST_SHA256,
    `${id}: M1 authorization historical release-manifest intake binding mismatch`,
  );
  const candidateRecords = sourceStaticCandidate
    ? await Promise.all([
      readJsonRecord(
        projectRoot,
        `${workspaceRelative}/audit/source-static-current-js-candidate-spec.json`,
        `${id}: source-static candidate specification`,
      ),
      readJsonRecord(
        projectRoot,
        `${workspaceRelative}/evidence/source-static-current-js-candidate.json`,
        `${id}: source-static candidate report`,
      ),
      readJsonRecord(
        projectRoot,
        manifest.implementation.candidateState.assetManifest,
        `${id}: source-static runtime manifest`,
      ),
      readFileRecord(
        projectRoot,
        manifest.implementation.candidateState.runtimeScript,
        `${id}: source-static runtime script`,
      ),
    ])
    : [];
  if (sourceStaticCandidate) {
    const [specificationRecord, candidateReportRecord, runtimeManifestRecord, runtimeScriptRecord] =
      candidateRecords;
    const specification = specificationRecord.document;
    const candidateReport = candidateReportRecord.document;
    invariant(
      specification.animationId === id &&
        specification.classification ===
          "source-static-current-javascript-engineering-candidate-only" &&
        specification.timeline?.local?.timelineId ===
          sourceStaticProfile.frameDomainId &&
        specification.timeline.local.frameCount ===
          sourceStaticProfile.frameCount &&
        specification.output?.report === candidateReportRecord.path &&
        specification.output?.manifest === runtimeManifestRecord.path &&
        specification.output?.script === runtimeScriptRecord.path &&
        specification.strictAcceptanceEffect === "none",
      `${id}: source-static candidate specification drifted`,
    );
    invariant(
      candidateReport.animationId === id &&
        candidateReport.status ===
          "current-javascript-engineering-candidate-only" &&
        candidateReport.specification?.path === specificationRecord.path &&
        candidateReport.specification.bytes === specificationRecord.bytes &&
        candidateReport.specification.sha256 === specificationRecord.sha256 &&
        candidateReport.renderer?.frameDomain ===
          sourceStaticProfile.frameDomainId &&
        candidateReport.renderer.firstFrame === 1 &&
        candidateReport.renderer.lastFrame ===
          sourceStaticProfile.frameCount &&
        candidateReport.renderer.renderableFrameCount ===
          sourceStaticProfile.renderedFrameCount &&
        candidateReport.renderer.runtimeManifest?.path ===
          runtimeManifestRecord.path &&
        candidateReport.renderer.runtimeManifest.sha256 ===
          runtimeManifestRecord.sha256 &&
        candidateReport.renderer.runtimeScript?.script ===
          runtimeScriptRecord.path &&
        candidateReport.renderer.runtimeScript.bytes ===
          runtimeScriptRecord.bytes &&
        candidateReport.renderer.runtimeScript.sha256 ===
          runtimeScriptRecord.sha256 &&
        candidateReport.browserQa?.renderedFrameCount ===
          sourceStaticProfile.renderedFrameCount &&
        candidateReport.browserQa.consoleErrorCount === 0 &&
        candidateReport.browserQa.pageErrorCount === 0 &&
        candidateReport.browserQa.unexpectedNetworkRequestCount === 0 &&
        candidateReport.acceptanceEffects?.implementationAuthorized === false &&
        candidateReport.acceptanceEffects.strictMigrationComplete === false &&
        candidateReport.acceptanceEffects.published === false &&
        candidateReport.strictAcceptanceEffect === "none",
      `${id}: source-static candidate report drifted`,
    );
  }

  const tagCounts = machine.findings.swfmill?.tagCounts || {};
  const observedStaticFacts = [
    `FFDec and swfmill agree on an ${native.stage.width}x${native.stage.height} stage, ${native.fps} FPS, and ${native.rootFrameCount} one-indexed root frame(s).`,
    `The machine report exported ${machine.findings.exportedScriptFileCount} ActionScript file(s), ${tagCounts.DefineButton2 || 0} button definition(s), and ${(tagCounts.BranchAlways || 0) + (tagCounts.BranchIfTrue || 0)} branch opcode candidate(s).`,
    `The SWF contains ${domains.nestedDefinitions.length} nested definition candidate(s), including ${domains.nestedDefinitions.filter((entry) => entry.frameCount > manifest.runtime.frameCount).length} longer than the root; definition presence is not runtime reachability.`,
    `Static extraction records ${tagCounts.Random || 0} random opcode(s), ${machine.findings.externalCallCandidates?.length || 0} external API class(es), ${tagCounts.DefineSound || 0} DefineSound tag(s), and ${tagCounts.SoundStreamBlock || 0} stream block(s).`,
    paired
      ? "A physical paired FLA is hash-bound, but this artifact does not claim a completed recursive read-only authoring audit or authoring acceptance."
      : "No paired FLA exists in the frozen release source model; authoring structure remains unavailable and may not be inferred from SWF symbols.",
  ];
  const machineAudit = {
    auditStatus: "partial",
    stage: {
      width: machine.findings.ffdecHeader.widthPx,
      height: machine.findings.ffdecHeader.heightPx,
    },
    fps: machine.findings.ffdecHeader.frameRate,
    rootFrameCount: machine.findings.ffdecHeader.frameCount,
    actionScriptVersion: machine.findings.actionScriptVersion,
    exportedScriptFileCount: machine.findings.exportedScriptFileCount,
    scriptTagCount: (tagCounts.DoAction || 0) + (tagCounts.DoInitAction || 0),
    buttonDefinitionCount: tagCounts.DefineButton2 || 0,
    branchOpcodeCount: (tagCounts.BranchAlways || 0) + (tagCounts.BranchIfTrue || 0),
    randomOpcodeCount: tagCounts.Random || 0,
    externalApiCandidateCount: machine.findings.externalCallCandidates?.reduce((sum, entry) => sum + entry.occurrences, 0) || 0,
    embeddedSoundDefinitionCount: tagCounts.DefineSound || 0,
    soundStreamBlockCount: tagCounts.SoundStreamBlock || 0,
    nestedDefinitionCount: domains.nestedDefinitions.length,
    nestedLongerThanRootCount: domains.nestedDefinitions.filter((entry) => entry.frameCount > manifest.runtime.frameCount).length,
    maxNestedFrameCount: Math.max(...domains.nestedDefinitions.map((entry) => entry.frameCount)),
    unresolvedReachabilityCount: domains.nestedDefinitions.length,
    rootReachableDomainInventoryComplete: false,
    authoringAuditEstablished: false,
    allCommandsPassed: true,
    allOutputPinsVerified: true,
    report: {path: machineRecord.path, bytes: machineRecord.bytes, sha256: machineRecord.sha256},
    observedStaticFacts,
    observedBehaviorFromExtractedScripts: [...observedStaticFacts],
  };

  const calibrationMember = selection.calibrationMembers.get(id);
  const phases = selection.selected.humanWorkStudy.requiredPhases.map((phaseId) => ({
    phaseId,
    status: "pending-human-measurement",
    startedAt: null,
    finishedAt: null,
    actualMinutes: null,
    measuredBy: null,
  }));
  const workStudySelection = {
    status: "selected-pending-human-timed-study",
    selectedTargetIds: [...G5_L4_WORK_STUDY_READINESS_IDS],
    selectedTargetCount: G5_L4_WORK_STUDY_READINESS_IDS.length,
    selectedTargetOrdinal: G5_L4_WORK_STUDY_READINESS_IDS.indexOf(id) + 1,
    intendedAxes: [...calibrationMember.intendedAxes],
    measurementRule: selection.selected.humanWorkStudy.measurementRule,
    phases,
    completedPhaseCount: 0,
    actualTotalMinutes: null,
    measuredBy: null,
  };

  const evidence = assertUniqueEvidence([
    ...sourceRecords,
    evidenceEntry("migration-technical-contract", manifestRecord),
    evidenceEntry("standard-machine-report", machineRecord),
    ...machineOutputs.map((record, index) => ({
      id: `standard-machine-output-${String(index + 1).padStart(2, "0")}`,
      ...record,
    })),
    evidenceEntry("g5-l4-source-scope-binding", sourceBindingRecord),
    evidenceEntry("g5-l4-source-scope-freeze", sourceFreezeRecord),
    evidenceEntry("canonical-coverage-v2", coverageRecord),
    evidenceEntry("runtime-acquisition-plan", planRecord),
    evidenceEntry("original-runtime-operator-assignment", operatorAssignmentRecord),
    evidenceEntry("lesson-release-catalog", releaseCatalogRecord),
    evidenceEntry("asset-catalog", assetCatalogRecord),
    evidenceEntry("runtime-plan-materializer", runtimeMaterializerRecord),
    evidenceEntry("work-study-selection", selection.record),
    evidenceEntry("m1-owner-authorization-intake", authorizationRecord),
    evidenceEntry("m1-roadmap-binding", roadmapRecord),
    ...candidateRecords.map((record, index) =>
      evidenceEntry([
        "source-static-candidate-specification",
        "source-static-candidate-report",
        "source-static-runtime-manifest",
        "source-static-runtime-script",
      ][index], record)),
  ], id);

  const sourceModel = paired ? "paired-fla-and-shipped-swf" : "shipped-swf-only";
  const requiredScenarioInventory = expectedScenarioInventory({
    plan,
    selection: selection.selected.humanWorkStudy,
  });
  const branchMissingEvidence = [
    "source-hash-bound authorized original-runtime natural-entry capture",
    "approved containment controls plus an authorized per-item original-runtime execution decision",
    "immutable per-session operator attestation plus runtime, host-tree, language, and isolated-profile identity for the already named primary operator",
    "natural runtime reachability and final disposition for every structural nested timeline candidate",
    "exact ordered event, frame, operation, state-hash, and deterministic-seed schedule for every reachable branch",
    "complete independent English and Spanish frame, navigation, terminal, and Replay evidence",
    "original audio bytes plus cue, language, timing, synchronization, controls, and complete named-human listening review",
    "identity-matched JavaScript implementation capture, per-frame diff, and normalized RMSE for every requirement",
    "independent engineering and human visual review bound to the immutable evidence manifest",
    "Owner fidelity acceptance, strict validation, and release-custodian atomic publication authorization",
  ];
  const document = {
    schemaVersion: 3,
    evidenceKind: "course-shell-strict-readiness",
    generatedBy: {
      script: "scripts/build-g5-l4-work-study-strict-readiness.mjs",
      version: GENERATOR_VERSION,
      sha256: generatorRecord.sha256,
      deterministic: true,
    },
    releaseId: RELEASE_ID,
    animationId: id,
    assessedOn: "2026-07-28",
    migrationStatusChanged: false,
    workStudySelection,
    m1Authorization: {
      status: "machine-only-m1-fidelity-tranche-authorized",
      receipt: {
        path: authorizationRecord.path,
        bytes: authorizationRecord.bytes,
        sha256: authorizationRecord.sha256,
      },
      releaseId: authorization.releaseId,
      phase: authorization.authorization.phase,
      ownerFullName: authorization.identity.ownerFullName,
      ownerIdentityUserAttested: true,
      ownerIdentityCryptographicallyVerified: false,
      externalSignatureEnvelopePresent: false,
      portableExternalIdentityVerificationReady: false,
      portabilityBoundary: "current-task user attestation only; not a portable external signature or clean-clone identity proof",
      machineOnlyM1FidelityTrancheAuthorized: true,
      animateGuiExecutionAuthorized: false,
      originalRuntimeExecutionAuthorized: false,
      rendererImplementationAuthorized: false,
      humanReviewAccepted: false,
      ownerFidelityAcceptanceEstablished: false,
      strictCompletionEstablished: false,
      publicationAuthorized: false,
    },
    conclusion: {
      strictAcceptanceReady: false,
      completionClaimAllowed: false,
      localAuthoritativeBaselineCompletable: false,
      localExhaustiveBranchCaptureCompletable: false,
      risk: expectedRisk(machineAudit),
      reason: sourceStaticCandidate
        ? `The selected M1 work-study member has a bounded, source-static current-JavaScript engineering candidate exposing ${sourceStaticProfile.renderedFrameCount} of ${sourceStaticProfile.frameCount} frame(s) in ${sourceStaticProfile.frameDomainId}, plus current hash-bound source, machine extraction, source-scope, coverage-v2, structural-domain, one user-attested release-level primary operator role, and an empty per-session runtime-acquisition worksheet. The candidate and planning inputs establish neither implementation authorization, portable identity, weekly capacity, host/containment/session execution authority, original-runtime reachability, natural traces, bilingual/audio behavior, implementation fidelity, full-frame comparison, human review, Owner fidelity acceptance, strict completion, nor publication.`
        : "The selected M1 work-study member has current hash-bound source, machine extraction, source-scope, coverage-v2, structural-domain, one user-attested release-level primary operator role, and an empty per-session runtime-acquisition worksheet. Those inputs are static and non-runnable: the role assignment establishes neither portable identity, weekly capacity, host/containment/session execution authority, FLA authoring acceptance, original-runtime reachability, natural traces, bilingual/audio behavior, implementation fidelity, full-frame comparison, human review, Owner fidelity acceptance, strict completion, nor publication.",
    },
    source: {
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      fla: paired ? manifest.source.fla : null,
      flaSha256: paired ? manifest.source.flaSha256 : null,
      sourceModel,
      pairedFlaStatus: manifest.source.pairedFlaStatus,
      sourceHashesVerified: true,
      technicalManifestProjection: TECHNICAL_MANIFEST_PROJECTION.id,
      technicalManifestProjectionSha256: technicalManifestSha256(manifest),
      technicalManifestExcludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      authoringPath: paired
        ? {
          status: "paired-source-present-authoring-audit-pending",
          authoringAuditEstablished: false,
          authoringAccepted: false,
          boundary: "FLA byte identity does not establish library/timeline/script/font inspection or shipped-runtime fidelity.",
        }
        : {
          status: "blocked-missing-fla",
          authoringAuditEstablished: false,
          authoringAccepted: false,
          boundary: "SWF-only evidence must not invent FLA authoring structure; use SWF static forensics plus authorized original-runtime evidence.",
        },
    },
    sourceScope: {
      binding: {path: sourceBindingRecord.path, bytes: sourceBindingRecord.bytes, sha256: sourceBindingRecord.sha256},
      freeze: {path: sourceFreezeRecord.path, bytes: sourceFreezeRecord.bytes, sha256: sourceFreezeRecord.sha256},
      memberOrdinal: sourceBinding.member.ordinal,
      releaseRole: sourceBinding.member.role,
      shardId: sourceBinding.member.shardId,
      memberCount: sourceFreeze.summary.memberCount,
      pairedFlaAndSwfCount: sourceFreeze.summary.pairedFlaSwfCount,
      swfOnlyCount: sourceFreeze.summary.swfOnlyCount,
      strictCompleteCount: sourceFreeze.summary.strictCompleteCount,
      publishedCount: sourceFreeze.summary.publishedCount,
      acceptanceEffects: {...sourceFreeze.acceptanceEffects},
    },
    machineAudit,
    branchCaptureReadiness: {
      status: "partial-reference-only",
      authoritativeScheduleEstablished: false,
      runtimeSessionsExecuted: 0,
      requiredScenarioInventory: [...requiredScenarioInventory],
      missing: [...branchMissingEvidence],
      captureIdentity: {
        requiredFields: [...CAPTURE_IDENTITY_FIELDS],
        sourceSwfSha256: manifest.source.swfSha256,
        sourceFlaSha256: paired ? manifest.source.flaSha256 : null,
        orderedEventAndStateHashChainRequired: true,
        nativeStagePngRequired: true,
      },
      directSeekAuthority: "not-permitted-for-primary-evidence; supplemental diagnosis only after a complete source-evidenced natural trace",
    },
    runtimeAcquisitionReadiness: {
      status: plan.emptyRuntimeAcquisitionWorksheet.state,
      plan: {
        path: planRecord.path,
        bytes: planRecord.bytes,
        sha256: planRecord.sha256,
        artifactFingerprintSha256: plan.artifactFingerprintSha256,
      },
      runtimeSessionsExecuted: 0,
      namedOperatorRoleAssignmentCount: 1,
      namedOperatorRoleAssignment: {
        ...plan.namedOperatorRoleAssignment,
        receipt: {
          path: operatorAssignmentRecord.path,
          bytes: operatorAssignmentRecord.bytes,
          sha256: operatorAssignmentRecord.sha256,
        },
      },
      sessionOperatorAttestationCount: 0,
      authoritativeBaselineCount: 0,
      candidateCaptureCount: 0,
      comparisonMetricsCount: 0,
      rootFrameDomain: {
        frameDomainId: plan.structuralDomainPlanning.root.frameDomainId,
        sourceTimelineId: plan.structuralDomainPlanning.root.sourceTimelineId,
        frameCount: plan.structuralDomainPlanning.root.frameCount,
        completeCoverageEstablished: false,
      },
      structuralNestedDefinitionCandidateCount: plan.structuralDomainPlanning.nestedDefinitionCandidates.length,
      unresolvedPlacementEntryStateCount: plan.unresolvedBlockers.unresolvedPlacementEntryStates,
      unresolvedRootReachableNestedDomainCount: plan.unresolvedBlockers.unresolvedRootReachableNestedDomains,
      rootReachableDomainInventoryComplete: false,
      requiredScenarioInventory: [...requiredScenarioInventory],
      captureIdentity: {
        requiredFields: [...CAPTURE_IDENTITY_FIELDS],
        sourceSwfSha256: manifest.source.swfSha256,
        sourceFlaSha256: paired ? manifest.source.flaSha256 : null,
        orderedEventAndStateHashChainRequired: true,
        nativeStagePngRequired: true,
      },
      directSeekAuthority: "not-permitted-for-primary-evidence; supplemental diagnosis only after a complete source-evidenced natural trace",
      executionGate: {...plan.executionGate},
      unresolvedBlockers: {...plan.unresolvedBlockers},
    },
    implementationReadiness: {
      implementationAuthorized: false,
      rendererSelected: sourceStaticCandidate,
      routeDeclared: sourceStaticCandidate,
      currentJavaScriptCandidate: sourceStaticCandidate,
      engineeringCandidate: sourceStaticCandidate
        ? {...plan.currentJavascriptEngineeringCandidate}
        : null,
      behaviorImplementationComplete: false,
      deterministicImplementationCaptureAccepted: false,
      fullFrameComparisonAccepted: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntimeAccepted: false,
      runtimeReachabilityEstablished: false,
      audioAccepted: false,
      rmseAccepted: false,
      humanVisualAccepted: false,
      independentEngineeringAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      published: false,
    },
    review: {
      independentEngineeringReview: reviewRecord("independent-engineering-reviewer"),
      humanVisualReview: reviewRecord("independent-human-visual-reviewer"),
      ownerReview: reviewRecord("owner-or-authorized-representative"),
    },
    strictGateBlockers: [
      paired
        ? "Paired FLA bytes are present, but a current recursive read-only authoring audit and authoring acceptance are not established."
        : "The release member is SWF-only; missing FLA authoring structure must not be inferred or substituted.",
      "The structural nested-definition inventory is not a root-reachable frame-domain disposition.",
      "No authorized original-runtime context, immutable per-session operator attestation, natural host entry, trace schedule, runtime receipt, or runtime session exists; the release-level primary operator role alone does not satisfy these gates.",
      "English and Spanish runtime traversal, interaction/branch/random/scoring/navigation/terminal/Replay causality, and exact state chains are unresolved.",
      "Audio cue, language, timing, synchronization, control, and named-human listening acceptance are unresolved.",
      sourceStaticCandidate
        ? `A bounded source-static current-JavaScript engineering candidate exposes ${sourceStaticProfile.frameDomainId} frames 1..${sourceStaticProfile.renderedFrameCount} of ${sourceStaticProfile.frameCount}, but implementation authorization, original-runtime parity, deterministic acceptance capture, full-frame comparison, and RMSE acceptance do not.`
        : "No renderer is selected or authorized; no current JavaScript candidate, deterministic implementation capture, full-frame comparison, or RMSE acceptance exists.",
      "Independent engineering review, independent human visual review, Owner fidelity acceptance, strict validation, and atomic publication are pending.",
    ],
    evidence,
    limitations: [
      "This materializer reads and hashes existing evidence only; it launches no Adobe Animate, browser, Ruffle, Projector, or original Flash runtime.",
      "Machine reports, source-scope bindings, coverage templates, and runtime plans are static planning inputs, not execution proof or fidelity evidence.",
      "The Owner's M1 phase authorization does not by itself authorize implementation, original-runtime execution, fidelity acceptance, human review, strict completion, or publication.",
      "Work-study phase identities, timestamps, and labor remain null until entered through an actual named-human timed study.",
    ],
    strictAcceptanceEffect: sourceStaticCandidate
      ? "none; bounded current-JavaScript engineering candidate plus source-bound M1 readiness planning only"
      : "none; source-bound M1 readiness planning only",
  };
  validateG5L4WorkStudyStrictReadiness(document);
  const rendered = `${JSON.stringify(document, null, 2)}\n`;

  const outputSnapshot = await readStableOutputFile(outputPath, projectRoot, id);
  if (outputSnapshot.exists) {
    let current;
    try {
      current = JSON.parse(outputSnapshot.contents.toString("utf8"));
    } catch (error) {
      throw new Error(`${id}: existing readiness output is invalid JSON (${error.message})`);
    }
    invariant(current.generatedBy?.script === document.generatedBy.script, `${id}: refusing to overwrite a readiness artifact owned by another generator`);
  }

  if (options.check) {
    invariant(outputSnapshot.exists, `${id}: audit/strict-readiness.json is missing`);
    invariant(outputSnapshot.contents.toString("utf8") === rendered, `${id}: work-study strict-readiness artifact is stale`);
    return {id, action: "verified", output: outputRelative, document};
  }
  return {
    id,
    action: "prepared",
    output: outputRelative,
    outputPath,
    outputSnapshot,
    rendered,
    document,
  };
}

async function exclusiveWrite(candidate, contents, mode = 0o644) {
  const handle = await open(
    candidate,
    fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
    mode,
  );
  try {
    await handle.writeFile(contents);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function unlinkIfPresent(candidate) {
  try {
    await unlink(candidate);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function rmdirIfPresent(candidate) {
  try {
    await rmdir(candidate);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function writeTransactionJournal(transaction, phase) {
  transaction.phase = phase;
  await writeFile(
    transaction.journalPath,
    `${JSON.stringify({
      schemaVersion: 1,
      transactionId: transaction.transactionId,
      animationId: transaction.id,
      output: transaction.output,
      original: {
        existed: transaction.outputSnapshot.exists,
        bytes: transaction.outputSnapshot.bytes,
        sha256: transaction.outputSnapshot.sha256,
      },
      replacement: {
        bytes: transaction.renderedBytes.length,
        sha256: transaction.renderedSha256,
      },
      phase,
    }, null, 2)}\n`,
    {
      encoding: "utf8",
      flag: transaction.journalCreated ? "w" : "wx",
      mode: 0o600,
    },
  );
  transaction.journalCreated = true;
}

async function cleanupTransaction(transaction, {keepJournal = false} = {}) {
  await unlinkIfPresent(transaction.stagePath);
  await unlinkIfPresent(transaction.backupPath);
  if (!keepJournal) {
    await unlinkIfPresent(transaction.journalPath);
    await rmdirIfPresent(transaction.transactionDirectory);
  }
}

async function prepareStrictReadinessTransaction(item, projectRoot, batchId) {
  const current = await readStableOutputFile(item.outputPath, projectRoot, item.id);
  invariant(
    outputSnapshotMatches(item.outputSnapshot, current),
    `${item.id}: readiness output changed after preflight`,
  );
  const nonce = randomBytes(16).toString("hex");
  const transactionId = `${batchId}-${nonce}`;
  const baseName = path.basename(item.outputPath);
  const stagePath = path.join(
    item.outputSnapshot.outputParent,
    `.${baseName}.${transactionId}.stage`,
  );
  const transactionDirectory = path.join(
    item.outputSnapshot.outputParent,
    `.${baseName}.${transactionId}.transaction`,
  );
  await mkdir(transactionDirectory, {mode: 0o700});
  const transaction = {
    ...item,
    transactionId,
    renderedBytes: Buffer.from(item.rendered, "utf8"),
    renderedSha256: sha256Bytes(Buffer.from(item.rendered, "utf8")),
    stagePath,
    transactionDirectory,
    backupPath: path.join(transactionDirectory, "original"),
    journalPath: path.join(transactionDirectory, "journal.json"),
    journalCreated: false,
    phase: "preparing",
  };
  try {
    await exclusiveWrite(stagePath, transaction.renderedBytes);
    const stage = await readStableOutputFile(stagePath, projectRoot, item.id, {
      managedName: false,
    });
    invariant(
      stage.exists
      && stage.bytes === transaction.renderedBytes.length
      && stage.sha256 === transaction.renderedSha256,
      `${item.id}: staged readiness output failed byte identity`,
    );
    await writeTransactionJournal(transaction, "staged");
    return transaction;
  } catch (error) {
    await cleanupTransaction(transaction).catch(() => {});
    throw error;
  }
}

async function assertReadinessOutputUnchanged(transaction, projectRoot) {
  const current = await readStableOutputFile(transaction.outputPath, projectRoot, transaction.id);
  invariant(
    outputSnapshotMatches(transaction.outputSnapshot, current),
    `${transaction.id}: readiness output changed after preflight`,
  );
}

async function verifyCommittedReadiness(transaction, projectRoot) {
  const current = await readStableOutputFile(transaction.outputPath, projectRoot, transaction.id);
  invariant(
    current.exists
    && current.bytes === transaction.renderedBytes.length
    && current.sha256 === transaction.renderedSha256,
    `${transaction.id}: committed readiness output failed byte identity`,
  );
}

async function rollbackStrictReadinessTransaction(transaction, projectRoot) {
  if (transaction.outputSnapshot.exists) {
    if (transaction.phase === "original-moved" || transaction.phase === "committed") {
      const backup = await readStableOutputFile(
        transaction.backupPath,
        transaction.transactionDirectory,
        transaction.id,
        {managedName: false},
      );
      invariant(
        backup.exists
        && backup.bytes === transaction.outputSnapshot.bytes
        && backup.sha256 === transaction.outputSnapshot.sha256,
        `${transaction.id}: rollback original no longer matches preflight`,
      );
      const current = await lstatOrNull(transaction.outputPath);
      if (transaction.phase === "committed") {
        invariant(current, `${transaction.id}: committed readiness output disappeared before rollback`);
        await verifyCommittedReadiness(transaction, projectRoot);
      } else {
        invariant(!current, `${transaction.id}: readiness output reappeared before rollback`);
      }
      await rename(transaction.backupPath, transaction.outputPath);
    }
  } else if (transaction.phase === "target-linked" || transaction.phase === "committed") {
    if (transaction.phase === "target-linked") {
      const [target, stage] = await Promise.all([
        readStableOutputFile(transaction.outputPath, projectRoot, transaction.id, {
          requireSingleLink: false,
        }),
        readStableOutputFile(transaction.stagePath, projectRoot, transaction.id, {
          managedName: false,
          requireSingleLink: false,
        }),
      ]);
      invariant(
        target.stat.dev === stage.stat.dev
        && target.stat.ino === stage.stat.ino
        && target.sha256 === transaction.renderedSha256
        && stage.sha256 === transaction.renderedSha256,
        `${transaction.id}: linked rollback target no longer matches staged readiness`,
      );
    } else {
      await verifyCommittedReadiness(transaction, projectRoot);
    }
    await unlink(transaction.outputPath);
  }
  await writeTransactionJournal(transaction, "rolled-back");
}

async function rollbackStrictReadinessBatch(transactions, projectRoot, originalError) {
  const rollbackErrors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      await rollbackStrictReadinessTransaction(transaction, projectRoot);
      await cleanupTransaction(transaction);
    } catch (error) {
      rollbackErrors.push(error);
      await writeTransactionJournal(transaction, "rollback-failed").catch(() => {});
    }
  }
  if (rollbackErrors.length) {
    throw new AggregateError(
      [originalError, ...rollbackErrors],
      `Strict-readiness batch failed and ${rollbackErrors.length} rollback(s) also failed`,
    );
  }
  throw originalError;
}

async function commitStrictReadinessBatch(prepared, projectRoot, hooks = {}) {
  const batchId = `${process.pid}-${Date.now()}-${randomBytes(8).toString("hex")}`;
  const transactions = [];
  try {
    for (const item of prepared) {
      transactions.push(await prepareStrictReadinessTransaction(item, projectRoot, batchId));
    }
    for (const transaction of transactions) {
      await assertReadinessOutputUnchanged(transaction, projectRoot);
    }
    for (const [index, transaction] of transactions.entries()) {
      await assertReadinessOutputUnchanged(transaction, projectRoot);
      await hooks.beforeCommit?.({
        index,
        id: transaction.id,
        outputPath: transaction.outputPath,
      });
      await assertReadinessOutputUnchanged(transaction, projectRoot);
      await writeTransactionJournal(transaction, "commit-started");
      if (transaction.outputSnapshot.exists) {
        await rename(transaction.outputPath, transaction.backupPath);
        await writeTransactionJournal(transaction, "original-moved");
        await rename(transaction.stagePath, transaction.outputPath);
      } else {
        await link(transaction.stagePath, transaction.outputPath);
        transaction.phase = "target-linked";
        await unlink(transaction.stagePath);
      }
      await writeTransactionJournal(transaction, "committed");
      await verifyCommittedReadiness(transaction, projectRoot);
      await hooks.afterCommit?.({
        index,
        id: transaction.id,
        outputPath: transaction.outputPath,
      });
    }
  } catch (error) {
    await rollbackStrictReadinessBatch(transactions, projectRoot, error);
  }
  const cleanupErrors = [];
  for (const transaction of transactions) {
    try {
      await cleanupTransaction(transaction);
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      `Strict-readiness batch committed, but ${cleanupErrors.length} transaction cleanup(s) failed`,
    );
  }
}

export async function buildG5L4WorkStudyStrictReadiness(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || defaultProjectRoot);
  const ids = options.ids?.length ? [...options.ids] : [...G5_L4_WORK_STUDY_READINESS_IDS];
  invariant(new Set(ids).size === ids.length, "duplicate G5 L4 work-study readiness target");
  for (const id of ids) {
    invariant(G5_L4_WORK_STUDY_READINESS_IDS.includes(id), `${id}: unknown G5 L4 work-study readiness target`);
  }
  const selection = await loadSelection(projectRoot);
  const prepared = [];
  for (const id of ids) {
    prepared.push(await buildOneG5L4WorkStudyStrictReadiness(id, {...options, projectRoot, selection}));
  }
  if (options.check) return prepared;
  await commitStrictReadinessBatch(prepared, projectRoot, options.transactionHooks || {});
  for (const item of prepared) {
    item.action = "written";
    delete item.outputPath;
    delete item.outputSnapshot;
    delete item.rendered;
  }
  return prepared;
}

export function parseArguments(argv) {
  const options = {check: false, ids: []};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--id") {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), "--id requires an animation ID");
      options.ids.push(value);
      index += 1;
    } else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (!options.ids.length) delete options.ids;
  return options;
}

function usage() {
  return `Usage: node scripts/build-g5-l4-work-study-strict-readiness.mjs [options]

Options:
  --id <animation-id>  Build one of the four configured G5 L4 work-study readiness records; repeatable
  --check              Verify checked-in outputs without writing
  --help               Show this help

The command writes only migrations/<selected-id>/audit/strict-readiness.json.
It launches no tool or runtime and grants no implementation, review, acceptance,
strict-completion, or publication authority.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const results = await buildG5L4WorkStudyStrictReadiness(options);
    process.stdout.write(`${JSON.stringify({
      action: options.check ? "verified" : "written",
      releaseId: RELEASE_ID,
      members: results.length,
      outputs: results.map(({id, output}) => ({id, output})),
      implementationAuthorized: false,
      originalRuntimeLaunched: false,
      acceptanceEffect: "none",
    }, null, 2)}\n`);
  }
}
