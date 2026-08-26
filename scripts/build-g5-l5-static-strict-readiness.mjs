#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {constants as fsConstants} from "node:fs";
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
  G5_L5_M1_STATIC_RECONCILIATION_RECEIPT_NAME,
  readG5L5M1StaticReconciliationReceipt,
  validateG5L5M1StaticReconciliationReceipt,
} from "./adopt-g5-l5-m1-static-specification.mjs";
import {
  G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH,
  readG5L5OwnerGovernanceDirectiveIntake,
  validateG5L5OwnerGovernanceDirectiveIntake,
} from "./build-g5-l5-owner-governance-directive-intake.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), "..");

export const G5_L5_STATIC_STRICT_READINESS_RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const G5_L5_STATIC_STRICT_READINESS_STATE =
  "m1-static-reconciled-runtime-human-blocked";
export const G5_L5_STATIC_STRICT_READINESS_OUTPUT_NAME =
  "strict-readiness.json";

const GENERATOR_RELATIVE =
  "scripts/build-g5-l5-static-strict-readiness.mjs";
const GENERATOR_VERSION = 1;
const EXPECTED_MEMBER_COUNT = 57;
const EXPECTED_PAGE_COUNT = 56;
const EXPECTED_SHELL_COUNT = 1;
const RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
const RELEASE_RELATIVE = "catalog/lesson-releases.json";
const SOURCE_SCOPE_RELATIVE = "reports/g5-l5-source-scope-freeze.json";
const AUDIO_OWNERSHIP_RELATIVE =
  "reports/g5-l5-audio-ownership-readiness.json";
const SOURCE_ARCHIVE_PREFIX =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const SOURCE_SCOPE_BINDING_RELATIVE =
  "audit/machine/g5-l5-source-scope-binding.json";
const MANIFEST_RELATIVE = "migration.json";
const MACHINE_AUDIT_RELATIVE = "audit/machine/report.json";
const AUDIO_EVIDENCE_RELATIVE = "audit/audio-runtime-evidence.json";
const COVERAGE_RELATIVE = "evidence/full-frame-coverage.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
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
const STATIC_OUTPUT_PATHS = Object.freeze({
  migrationManifest: MANIFEST_RELATIVE,
  migrationBrief: "MIGRATION_BRIEF.md",
  scriptInventory: "audit/script-inventory.json",
  dependencyInventory: "audit/dependency-inventory.json",
});
const ACCEPTANCE_FALSE_KEYS = Object.freeze([
  "audioAccepted",
  "authoritativeOriginalRuntime",
  "currentJavaScriptCandidate",
  "fidelityAccepted",
  "humanVisualAccepted",
  "implementationAuthorized",
  "ownerAccepted",
  "published",
  "strictComplete",
]);
const IMPLEMENTATION_FALSE_KEYS = Object.freeze([
  "behaviorImplementationComplete",
  "currentJavaScriptCandidate",
  "deterministicImplementationCaptureAccepted",
  "fullFrameComparisonAccepted",
  "implementationAuthorized",
  "implementationStarted",
  "rendererSelected",
  "routeDeclared",
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

async function assertOrdinaryAncestorTree(
  projectRoot,
  absolutePath,
  label,
) {
  const relativeParent = path.relative(
    projectRoot,
    path.dirname(absolutePath),
  );
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
        throw new Error(
          `${label}: ancestor is unavailable (${error.message})`,
        );
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
  return JSON.stringify(left) === JSON.stringify(right);
}

async function lstatOrNull(candidate) {
  try {
    return await lstat(candidate, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function readOpenHandle(handle, {retainContents}) {
  const hash = createHash("sha256");
  const chunks = retainContents ? [] : null;
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let position = 0;
  while (true) {
    const {bytesRead} = await handle.read(
      buffer,
      0,
      buffer.length,
      position,
    );
    if (bytesRead === 0) break;
    const chunk = buffer.subarray(0, bytesRead);
    hash.update(chunk);
    if (chunks) chunks.push(Buffer.from(chunk));
    position += bytesRead;
  }
  return {
    bytes: position,
    sha256: hash.digest("hex"),
    contents: chunks ? Buffer.concat(chunks) : null,
  };
}

async function readFileRecord(
  projectRoot,
  relativePath,
  {
    json = false,
    retainContents = json,
    label = relativePath,
  } = {},
) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, label);
  await assertOrdinaryAncestorTree(projectRoot, absolutePath, label);
  const before = await lstat(absolutePath, {bigint: true}).catch((error) => {
    if (error?.code === "ENOENT") {
      throw new Error(`${label}: required file is missing (${relativePath})`);
    }
    throw error;
  });
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${label}: expected one ordinary non-linked file`,
  );
  const [realRoot, realFile] = await Promise.all([
    realpath(projectRoot),
    realpath(absolutePath),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside project root`);
  const handle = await open(
    absolutePath,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0),
  );
  let observed;
  let descriptorBefore;
  let descriptorAfter;
  try {
    descriptorBefore = await handle.stat({bigint: true});
    invariant(
      descriptorBefore.isFile() &&
        descriptorBefore.nlink === 1n &&
        sameStatIdentity(
          statIdentity(before),
          statIdentity(descriptorBefore),
        ),
      `${label}: changed before stable read`,
    );
    observed = await readOpenHandle(handle, {
      retainContents: retainContents || json,
    });
    descriptorAfter = await handle.stat({bigint: true});
    invariant(
      sameStatIdentity(
        statIdentity(descriptorBefore),
        statIdentity(descriptorAfter),
      ),
      `${label}: changed during stable read`,
    );
  } finally {
    await handle.close();
  }
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    sameStatIdentity(statIdentity(descriptorAfter), statIdentity(after)) &&
      observed.bytes === Number(after.size),
    `${label}: changed after stable read`,
  );
  let document = null;
  if (json) {
    try {
      document = JSON.parse(observed.contents.toString("utf8"));
    } catch (error) {
      throw new Error(`${label}: invalid JSON (${error.message})`);
    }
  }
  return {
    path: relativePath,
    absolutePath,
    bytes: observed.bytes,
    sha256: observed.sha256,
    contents: retainContents ? observed.contents : null,
    document,
    stat: statIdentity(after),
  };
}

function descriptor(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
  };
}

function allFalse(document, keys, label) {
  for (const key of keys) {
    invariant(document?.[key] === false, `${label}: ${key} must remain false`);
  }
}

function selectRelease(document, expectedFingerprint) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "G5 L5 release catalog is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) =>
      releaseId === G5_L5_STATIC_STRICT_READINESS_RELEASE_ID,
  );
  invariant(matches.length === 1, "G5 L5 release must be unique");
  const release = matches[0];
  invariant(
    release.titleDisplay === "Add & Subtract Negative Numbers" &&
      release.grade === 5 &&
      release.lesson === 5 &&
      release.releaseType === "complete-lesson" &&
      release.publicationMode === "atomic" &&
      release.expectedCounts?.activeXmlReferencedPages ===
        EXPECTED_PAGE_COUNT &&
      release.expectedCounts?.courseShells === EXPECTED_SHELL_COUNT &&
      release.expectedCounts?.members === EXPECTED_MEMBER_COUNT &&
      Array.isArray(release.members) &&
      release.members.length === EXPECTED_MEMBER_COUNT,
    "G5 L5 release scope drifted",
  );
  invariant(
    release.members.every(
      (member, index) =>
        member.ordinal === index + 1 &&
        SAFE_ID.test(member.animationId || "") &&
        member.assetId === `swf-${member.source?.sha256}`,
    ) &&
      new Set(release.members.map(({animationId}) => animationId)).size ===
        EXPECTED_MEMBER_COUNT &&
      new Set(release.members.map(({assetId}) => assetId)).size ===
        EXPECTED_MEMBER_COUNT,
    "G5 L5 ordered member identity drifted",
  );
  const fingerprint = sha256(Buffer.from(stableJson(release)));
  invariant(
    fingerprint === expectedFingerprint,
    "G5 L5 release fingerprint drifted",
  );
  return {release, fingerprint};
}

function validateSourceScope(sourceScope, release) {
  invariant(
    sourceScope?.schemaVersion === 1 &&
      sourceScope.reportType === "g5-l5-source-scope-freeze" &&
      sourceScope.releaseId === G5_L5_STATIC_STRICT_READINESS_RELEASE_ID &&
      sourceScope.summary?.pageCount === EXPECTED_PAGE_COUNT &&
      sourceScope.summary?.shellCount === EXPECTED_SHELL_COUNT &&
      sourceScope.summary?.memberCount === EXPECTED_MEMBER_COUNT &&
      sourceScope.summary?.strictCompleteCount === 0 &&
      sourceScope.summary?.publishedCount === 0 &&
      Array.isArray(sourceScope.members) &&
      sourceScope.members.length === EXPECTED_MEMBER_COUNT,
    "G5 L5 source-scope report drifted or crossed a release boundary",
  );
  allFalse(
    sourceScope.acceptanceEffects,
    Object.keys(sourceScope.acceptanceEffects || {}),
    "G5 L5 source scope",
  );
  for (let index = 0; index < release.members.length; index += 1) {
    const member = release.members[index];
    const scoped = sourceScope.members[index];
    invariant(
      scoped?.ordinal === member.ordinal &&
        scoped.animationId === member.animationId &&
        scoped.assetId === member.assetId &&
        scoped.source?.swf?.path === member.source.path &&
        scoped.source?.swf?.sha256 === member.source.sha256 &&
        scoped.strictComplete === false,
      `${member.animationId}: source-scope membership drifted`,
    );
  }
}

function validateAudioOwnership(audioOwnership, release) {
  invariant(
    audioOwnership?.schemaVersion === 1 &&
      audioOwnership.reportType ===
        "lesson-audio-ownership-machine-readiness" &&
      audioOwnership.releaseId ===
        G5_L5_STATIC_STRICT_READINESS_RELEASE_ID &&
      audioOwnership.summary?.memberCount === EXPECTED_MEMBER_COUNT &&
      audioOwnership.summary?.authorizedOriginalRuntimeListeningSessionCount ===
        0 &&
      audioOwnership.summary?.audioAcceptedFileCount === 0 &&
      audioOwnership.summary?.audioAcceptedMemberCount === 0 &&
      audioOwnership.summary?.strictCompleteMemberCount === 0 &&
      audioOwnership.summary?.publishedMemberCount === 0 &&
      Array.isArray(audioOwnership.memberPlans) &&
      audioOwnership.memberPlans.length === EXPECTED_MEMBER_COUNT,
    "G5 L5 audio-ownership report drifted or crossed listening acceptance",
  );
  for (let index = 0; index < release.members.length; index += 1) {
    const member = release.members[index];
    const plan = audioOwnership.memberPlans[index];
    invariant(
      plan?.ordinal === member.ordinal &&
        plan.animationId === member.animationId &&
        plan.assetId === member.assetId &&
        plan.source?.sha256 === member.source.sha256 &&
        plan.acceptance?.audioAccepted === false &&
        plan.acceptance.humanReviewAccepted === false &&
        plan.acceptance.ownerAccepted === false &&
        plan.acceptance.strictComplete === false &&
        plan.acceptance.published === false,
      `${member.animationId}: audio-ownership membership drifted`,
    );
  }
}

function validateAuthorizationBoundary(receipt) {
  validateG5L5OwnerGovernanceDirectiveIntake(receipt);
  invariant(
    receipt.authorization?.m1MachineFoundationStartAuthorized === true &&
      receipt.authorization?.continueMachineOnlyStaticWork === true &&
      receipt.authorityBoundary?.m1MachineOnlyEffective === true,
    "G5 L5 M1 machine-only authorization is missing",
  );
  allFalse(receipt.authorityBoundary, [
    "m0ExitEffective",
    "externalSpendAuthorized",
    "procurementOrPaymentAuthorized",
    "runtimeHostOrContainmentAuthorized",
    "originalRuntimeExecutionAuthorized",
    "animateGuiExecutionAuthorized",
    "rendererImplementationAuthorized",
    "evidencePromotionAuthorized",
    "humanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ], "G5 L5 Owner directive boundary");
}

function validateManifest(manifest, member) {
  invariant(
    manifest?.schemaVersion === 2 &&
      manifest.id === member.animationId &&
      manifest.animationId === member.animationId &&
      manifest.assetId === member.assetId &&
      manifest.status === "preserved" &&
      manifest.source?.swfSha256 === member.source.sha256 &&
      manifest.source?.swf === `${SOURCE_ARCHIVE_PREFIX}${member.source.path}` &&
      manifest.implementation?.rendering === "undecided" &&
      manifest.implementation?.route === "",
    `${member.animationId}: migration manifest identity or implementation boundary drifted`,
  );
}

function validateMachineAudit(machineAudit, member, manifest) {
  invariant(
    machineAudit?.schemaVersion === 1 &&
      machineAudit.animationId === member.animationId &&
      machineAudit.auditStatus === "partial" &&
      machineAudit.source?.expectedSha256 === member.source.sha256 &&
      machineAudit.source?.hashMatches === true &&
      machineAudit.migrationStatusUnchanged === true &&
      machineAudit.findings?.runtimeCrossCheck?.allMatch === true &&
      machineAudit.findings?.ffdecHeader?.widthPx ===
        manifest.runtime.stage.width &&
      machineAudit.findings.ffdecHeader.heightPx ===
        manifest.runtime.stage.height &&
      machineAudit.findings.ffdecHeader.frameRate === manifest.runtime.fps &&
      machineAudit.findings.ffdecHeader.frameCount ===
        manifest.runtime.frameCount &&
      Number.isSafeInteger(machineAudit.findings.exportedScriptFileCount) &&
      Array.isArray(machineAudit.findings.externalCallCandidates),
    `${member.animationId}: machine audit drifted or claims more than partial static evidence`,
  );
}

function validateSourceScopeBinding(binding, member, sourceScopeRecord) {
  invariant(
    binding?.schemaVersion === 1 &&
      binding.artifactType === "g5-l5-source-scope-binding" &&
      binding.releaseId === G5_L5_STATIC_STRICT_READINESS_RELEASE_ID &&
      binding.scope?.path === sourceScopeRecord.path &&
      binding.scope.bytes === sourceScopeRecord.bytes &&
      binding.scope.sha256 === sourceScopeRecord.sha256 &&
      binding.member?.ordinal === member.ordinal &&
      binding.member.animationId === member.animationId &&
      binding.member.assetId === member.assetId &&
      binding.member.source?.swf?.path === member.source.path &&
      binding.member.source?.swf?.sha256 === member.source.sha256,
    `${member.animationId}: source-scope binding drifted`,
  );
  allFalse(binding.acceptanceEffects, [
    "authoritativeOriginalRuntime",
    "currentJavaScriptCandidate",
    "fullFrameComparison",
    "audioAccepted",
    "humanVisualAccepted",
    "ownerAccepted",
    "strictComplete",
    "published",
  ], `${member.animationId}: source-scope acceptance`);
}

function validateAudioEvidence(audio, member, audioPlan) {
  invariant(
    audio?.schemaVersion === 2 &&
      audio.animationId === member.animationId &&
      audio.source?.expectedSha256 === member.source.sha256 &&
      audio.source?.hashMatches === true &&
      audio.acceptance?.structurallyAudited === true &&
      audio.acceptance.authoritativeListeningComplete === false &&
      audio.acceptance.hostStateTraversalComplete === false &&
      audio.acceptance.synchronizationComplete === false &&
      audio.acceptance.strictAudioAcceptance === "pending" &&
      audio.acceptance.releaseBoundary
        ?.authoritativeOriginalRuntimeListeningComplete === false &&
      audio.acceptance.releaseBoundary
        .authoritativeOriginalRuntimeTraversalComplete === false &&
      audio.acceptance.releaseBoundary.spokenLanguageContentVerified ===
        false &&
      audio.acceptance.releaseBoundary.humanAudioReviewComplete === false &&
      audio.acceptance.releaseBoundary.ownerAcceptanceComplete === false &&
      audio.acceptance.releaseBoundary.strictMigrationComplete === false &&
      audio.acceptance.releaseBoundary.publicationAuthorized === false,
    `${member.animationId}: audio evidence drifted or crossed listening acceptance`,
  );
  const bound = audioPlan.workspace?.dedicatedMachineAudioAudit;
  invariant(
    bound?.path ===
      `migrations/${member.animationId}/${AUDIO_EVIDENCE_RELATIVE}` &&
      bound.bytes > 0 &&
      SHA256_PATTERN.test(bound.sha256 || ""),
    `${member.animationId}: audio ownership does not bind its dedicated evidence`,
  );
}

function validateCoverage(coverage, member, rootFrameCount) {
  invariant(
    coverage?.schemaVersion === 2 &&
      coverage.animationId === member.animationId &&
      Array.isArray(coverage.requirements) &&
      coverage.requirements.length === 2,
    `${member.animationId}: coverage-v2 must retain two provisional root requirements`,
  );
  invariant(
    JSON.stringify(
      coverage.requirements.map(({language}) => language).sort(),
    ) === JSON.stringify(["en", "es"]),
    `${member.animationId}: provisional coverage languages drifted`,
  );
  for (const requirement of coverage.requirements) {
    invariant(
      requirement.frameDomainId === "root" &&
        requirement.requiredRange?.firstFrame === 1 &&
        requirement.requiredRange?.lastFrame === rootFrameCount &&
        requirement.baselineAuthority === "unresolved" &&
        requirement.status === "pending" &&
        requirement.capturedFrameCount === 0 &&
        Array.isArray(requirement.missingFrames) &&
        requirement.missingFrames.length === rootFrameCount &&
        requirement.missingFrames.every(
          (frame, index) => frame === index + 1,
        ),
      `${member.animationId}/${requirement.requirementId}: coverage was promoted or narrowed`,
    );
    for (const key of [
      "baselineCaptureManifest",
      "baselineCaptureManifestSha256",
      "captureManifest",
      "captureManifestSha256",
      "metricsFile",
      "metricsSha256",
    ]) {
      invariant(
        requirement[key] === "",
        `${member.animationId}/${requirement.requirementId}: ${key} must remain empty`,
      );
    }
  }
}

function outputAfterDescriptor(output) {
  if (!output || typeof output !== "object") return null;
  if (output.current && typeof output.current === "object") {
    return {
      path: output.current.path ?? output.path,
      bytes: output.current.bytes,
      sha256: output.current.sha256,
    };
  }
  if (output.after && typeof output.after === "object") {
    return {
      path: output.after.path ?? output.path,
      bytes: output.after.bytes,
      sha256: output.after.sha256,
    };
  }
  return {
    path: output.path,
    bytes: output.bytes,
    sha256: output.sha256,
  };
}

async function validateStaticReceiptAndOutputs(
  projectRoot,
  receipt,
  member,
) {
  validateG5L5M1StaticReconciliationReceipt(receipt, member);
  invariant(
    receipt.reconciliation?.applied === true &&
      receipt.reconciliation.machineOnlyStatic === true &&
      receipt.reconciliation.canonicalOutputCount === 4,
    `${member.animationId}: M1 static reconciliation is not applied`,
  );
  invariant(
    receipt.summary?.complexityResolved === false &&
      receipt.summary.rendererSelected === false &&
      receipt.summary.runtimeReachabilityResolved === false,
    `${member.animationId}: M1 static receipt promoted runtime or renderer decisions`,
  );
  invariant(
    receipt.execution?.guiApplicationsLaunched === 0 &&
      receipt.execution.runtimeSessionsExecuted === 0 &&
      receipt.execution.legacyEndpointsExecuted === 0,
    `${member.animationId}: M1 static receipt contains execution`,
  );
  allFalse(
    receipt.acceptanceEffects,
    ACCEPTANCE_FALSE_KEYS,
    `${member.animationId}: M1 static receipt acceptance`,
  );
  const outputRecords = {};
  for (const [key, workspaceRelative] of Object.entries(STATIC_OUTPUT_PATHS)) {
    const expectedPath = `migrations/${member.animationId}/${workspaceRelative}`;
    const expected = outputAfterDescriptor(receipt.outputs?.[key]);
    invariant(
      expected?.path === expectedPath &&
        Number.isSafeInteger(expected.bytes) &&
        expected.bytes > 0 &&
        SHA256_PATTERN.test(expected.sha256 || ""),
      `${member.animationId}: static receipt output binding drifted for ${key}`,
    );
    const record = await readFileRecord(projectRoot, expectedPath, {
      json: expectedPath.endsWith(".json"),
      retainContents: false,
      label: `${member.animationId} reconciled ${key}`,
    });
    invariant(
      record.bytes === expected.bytes && record.sha256 === expected.sha256,
      `${member.animationId}: reconciled ${key} bytes changed after receipt`,
    );
    outputRecords[key] = record;
  }
  return outputRecords;
}

function observedStaticFacts(machineAudit, manifest) {
  const tagCounts = machineAudit.findings.swfmill?.tagCounts || {};
  const nested =
    machineAudit.findings.frameDomainCandidates?.summary
      ?.nestedDefinitionCount ?? 0;
  return [
    `FFDec and swfmill statically agree on an ${manifest.runtime.stage.width}x${manifest.runtime.stage.height} stage, ${manifest.runtime.fps} FPS, and ${manifest.runtime.frameCount} one-indexed root frame(s).`,
    `The machine bundle contains ${machineAudit.findings.exportedScriptFileCount} extracted ActionScript file(s), ${tagCounts.DefineButton2 || 0} DefineButton2 definition(s), and ${(tagCounts.BranchAlways || 0) + (tagCounts.BranchIfTrue || 0)} structural branch opcode candidate(s).`,
    `Static extraction records ${nested} nested definition candidate(s); definition presence does not establish root reachability, placement entry state, or runtime behavior.`,
    `Static extraction records ${tagCounts.Random || 0} random opcode(s), ${machineAudit.findings.externalCallCandidates.length} external API candidate class(es), ${tagCounts.DefineSound || 0} DefineSound tag(s), and ${tagCounts.SoundStreamBlock || 0} SoundStreamBlock tag(s).`,
  ];
}

function requiredScenarioInventory(member, manifest, machineAudit) {
  const nested =
    machineAudit.findings.frameDomainCandidates?.summary
      ?.nestedDefinitionCount ?? 0;
  return [
    `EN natural host-entry traversal for root frame domain 1..${manifest.runtime.frameCount} in an authorized original runtime`,
    `ES natural host-entry traversal for root frame domain 1..${manifest.runtime.frameCount} in a separate authorized original-runtime session`,
    `complete runtime disposition of ${nested} structural nested definition candidate(s), including exact placement and entry-state identity for every reachable domain`,
    "exact ordered interaction, branch, random, feedback, scoring, navigation, terminal, and complete Replay-reset traces for every reachable state",
    "source-evidenced event schedules and deterministic seeds only where the original runtime or source proves them",
    "original audio cue reachability, spoken language/content, timing, synchronization, controls, reset semantics, and named-human listening evidence",
    "native-stage authoritative baseline PNG coverage bound to frameDomain, requirementId, trace, entryStateSha256, frame, scenario, lang, and seed",
    "identity-matched JavaScript implementation captures, complete per-frame diffs, normalized RMSE, and wrong-content inspection",
    "desktop, mobile, keyboard, reduced-motion, localization, text-overflow, console, asset, and network product validation",
    `${member.releaseRole === "course-shell" ? "complete shell routing, child loading, section return, quit, language, and Replay behavior" : "complete lesson-page host entry, interaction, terminal, return, language, and Replay behavior"}`,
    "independent engineering review, independent human visual review, Owner fidelity acceptance, strict validation, and atomic publication as separate immutable gates",
  ];
}

function missingRuntimeHumanEvidence() {
  return [
    "approved runtime host, containment controls, immutable per-session authorization, and exact named-session operator attestation",
    "authorized original-runtime natural host entry and execution receipts",
    "complete root-reachable frame-domain disposition with placement and entry-state evidence",
    "natural traces for every reachable branch, interaction, random, scoring, navigation, terminal, and Replay state",
    "authoritative English and Spanish baseline manifests and native-stage PNGs",
    "original-runtime audio listening, language/content, synchronization, controls, and reset acceptance",
    "authorized renderer decision and current JavaScript implementation",
    "identity-matched implementation captures, complete full-frame metrics, diff inspection, and RMSE acceptance",
    "product, accessibility, and localization validation",
    "independent engineering review, independent human visual review, and Owner fidelity acceptance",
    "strict validator admission, completion-ledger admission, release-custodian promotion, and atomic publication authorization",
  ];
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

function evidenceEntry(id, record) {
  return {
    id,
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
  };
}

function assertUniqueEvidence(entries, id) {
  invariant(
    new Set(entries.map(({id: entryId}) => entryId)).size === entries.length,
    `${id}: evidence IDs must be unique`,
  );
  invariant(
    new Set(entries.map(({path: entryPath}) => entryPath)).size ===
      entries.length,
    `${id}: evidence paths must be unique`,
  );
}

export function validateG5L5StaticStrictReadiness(document, member) {
  const id = document?.animationId || "unknown";
  invariant(document?.schemaVersion === 3, `${id}: schemaVersion must be 3`);
  invariant(
    document.evidenceKind === "course-shell-strict-readiness",
    `${id}: evidenceKind is invalid`,
  );
  invariant(
    document.releaseId === G5_L5_STATIC_STRICT_READINESS_RELEASE_ID &&
      document.animationId === member.animationId &&
      document.state === G5_L5_STATIC_STRICT_READINESS_STATE &&
      document.migrationStatusChanged === false,
    `${id}: release, member, state, or migration boundary drifted`,
  );
  invariant(
    document.generatedBy?.script === GENERATOR_RELATIVE &&
      document.generatedBy.version === GENERATOR_VERSION &&
      document.generatedBy.deterministic === true &&
      SHA256_PATTERN.test(document.generatedBy.sha256 || ""),
    `${id}: generator identity drifted`,
  );
  invariant(
    document.releaseMembership?.ordinal === member.ordinal &&
      document.releaseMembership.assetId === member.assetId &&
      document.releaseMembership.releaseRole === member.releaseRole &&
      document.releaseMembership.shardId === member.shardId &&
      SHA256_PATTERN.test(
        document.releaseMembership.releaseFingerprintSha256 || "",
      ),
    `${id}: release membership drifted`,
  );
  invariant(
    document.m1Authorization?.status ===
      "owner-directed-machine-only-m1-effective" &&
      document.m1Authorization.machineOnlyStaticWorkAuthorized === true,
    `${id}: M1 machine-only authorization is missing`,
  );
  allFalse(document.m1Authorization, [
    "runtimeAuthorized",
    "guiAuthorized",
    "implementationAuthorized",
    "reviewAccepted",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ], `${id}: M1 authorization`);
  invariant(
    document.m1StaticReconciliation?.status ===
      "applied-hash-bound-machine-only-static" &&
      document.m1StaticReconciliation.canonicalOutputCount === 4 &&
      document.m1StaticReconciliation.complexityResolved === false &&
      document.m1StaticReconciliation.rendererSelected === false &&
      document.m1StaticReconciliation.runtimeReachabilityResolved === false,
    `${id}: static reconciliation state drifted`,
  );
  invariant(
    document.source?.sourceHashesVerified === true &&
      document.source.authoringAuditEstablished === false &&
      document.source.authoringAccepted === false &&
      document.sourceScope?.memberCount === EXPECTED_MEMBER_COUNT &&
      document.sourceScope.strictCompleteCount === 0 &&
      document.sourceScope.publishedCount === 0,
    `${id}: source or source-scope boundary drifted`,
  );
  invariant(
    document.machineAudit?.auditStatus === "partial" &&
      document.machineAudit.staticFactsReconciled === true &&
      document.machineAudit.runtimeBehaviorObserved === false &&
      Array.isArray(
        document.machineAudit.observedBehaviorFromExtractedScripts,
      ) &&
      document.machineAudit.observedBehaviorFromExtractedScripts.length >= 4,
    `${id}: machine static facts are incomplete or promoted`,
  );
  invariant(
    document.audioReadiness?.structurallyAudited === true &&
      document.audioReadiness.authoritativeListeningComplete === false &&
      document.audioReadiness.hostStateTraversalComplete === false &&
      document.audioReadiness.synchronizationComplete === false &&
      document.audioReadiness.spokenLanguageContentVerified === false &&
      document.audioReadiness.humanAudioReviewComplete === false &&
      document.audioReadiness.audioAccepted === false,
    `${id}: audio readiness crossed listening acceptance`,
  );
  invariant(
    document.coverageReadiness?.requirementCount === 2 &&
      document.coverageReadiness.pendingRequirementCount === 2 &&
      document.coverageReadiness.authoritativeBaselineCount === 0 &&
      document.coverageReadiness.capturedFrameCount === 0 &&
      document.coverageReadiness.implementationCaptureCount === 0 &&
      document.coverageReadiness.fullFrameComparisonCount === 0 &&
      document.coverageReadiness.rmseAccepted === false,
    `${id}: coverage readiness was promoted`,
  );
  invariant(
    document.branchCaptureReadiness?.status ===
      G5_L5_STATIC_STRICT_READINESS_STATE &&
      document.branchCaptureReadiness.authoritativeScheduleEstablished ===
        false &&
      document.branchCaptureReadiness.runtimeSessionsExecuted === 0 &&
      document.branchCaptureReadiness.requiredScenarioInventory?.length >=
        10 &&
      document.branchCaptureReadiness.missing?.length >= 10 &&
      JSON.stringify(
        document.branchCaptureReadiness.captureIdentity?.requiredFields,
      ) === JSON.stringify(CAPTURE_IDENTITY_FIELDS),
    `${id}: branch-capture boundary drifted`,
  );
  allFalse(
    document.implementationReadiness,
    IMPLEMENTATION_FALSE_KEYS,
    `${id}: implementation readiness`,
  );
  invariant(
    document.acceptance?.acceptanceNeutral === true,
    `${id}: strict readiness must remain acceptance-neutral`,
  );
  allFalse(document.acceptance, [
    "authoringAccepted",
    "audioAccepted",
    "authoritativeOriginalRuntimeAccepted",
    "fidelityAccepted",
    "fullFrameComparisonAccepted",
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
  ]) {
    invariant(
      document.conclusion?.[key] === false,
      `${id}: ${key} must remain false`,
    );
  }
  for (const reviewKey of [
    "independentEngineeringReview",
    "humanVisualReview",
    "ownerReview",
  ]) {
    const review = document.review?.[reviewKey];
    invariant(
      review?.decision === "pending" &&
        review.reviewer === null &&
        review.reviewedAt === null &&
        review.signatureEnvelope === null,
      `${id}: ${reviewKey} contains fabricated review evidence`,
    );
  }
  invariant(
    Array.isArray(document.evidence) &&
      document.evidence.length >= 12 &&
      document.evidence.every(
        (entry) =>
          typeof entry.id === "string" &&
          typeof entry.path === "string" &&
          Number.isSafeInteger(entry.bytes) &&
          entry.bytes > 0 &&
          SHA256_PATTERN.test(entry.sha256 || ""),
      ),
    `${id}: evidence index is incomplete`,
  );
  assertUniqueEvidence(document.evidence, id);
  invariant(
    document.strictAcceptanceEffect ===
      "none; M1 static reconciliation only; runtime, implementation, human, strict, and publication gates remain blocked",
    `${id}: strict acceptance effect drifted`,
  );
  return true;
}

export function g5L5StaticStrictReadinessPath(animationId) {
  invariant(SAFE_ID.test(animationId || ""), "invalid animation ID");
  return `migrations/${animationId}/audit/${G5_L5_STATIC_STRICT_READINESS_OUTPUT_NAME}`;
}

async function assertOrdinaryOutputAncestors(projectRoot, relativePath, id) {
  const absolutePath = resolveProjectPath(projectRoot, relativePath, `${id} output`);
  invariant(
    path.basename(absolutePath) ===
      G5_L5_STATIC_STRICT_READINESS_OUTPUT_NAME,
    `${id}: unmanaged strict-readiness output name`,
  );
  await assertOrdinaryAncestorTree(
    projectRoot,
    absolutePath,
    `${id}: output`,
  );
  return {absolutePath, parent: path.dirname(absolutePath)};
}

async function readOutputSnapshot(projectRoot, relativePath, id) {
  const output = await assertOrdinaryOutputAncestors(
    projectRoot,
    relativePath,
    id,
  );
  const information = await lstatOrNull(output.absolutePath);
  if (!information) {
    return {
      ...output,
      exists: false,
      bytes: 0,
      sha256: "",
      contents: null,
      stat: null,
    };
  }
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${id}: strict-readiness output must be one ordinary non-linked file`,
  );
  const record = await readFileRecord(projectRoot, relativePath, {
    retainContents: true,
    label: `${id} existing strict-readiness output`,
  });
  return {
    ...output,
    exists: true,
    bytes: record.bytes,
    sha256: record.sha256,
    contents: record.contents,
    stat: record.stat,
  };
}

function outputSnapshotMatches(left, right) {
  return left.exists === right.exists &&
    (!left.exists ||
      (left.bytes === right.bytes &&
        left.sha256 === right.sha256 &&
        sameStatIdentity(left.stat, right.stat)));
}

async function assertInputSetUnchanged(inputRecords) {
  for (const record of inputRecords) {
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

function memberDocument({
  member,
  releaseFingerprint,
  manifest,
  machineAudit,
  records,
  authorization,
  staticReceipt,
}) {
  const requiredScenarios = requiredScenarioInventory(
    member,
    manifest,
    machineAudit,
  );
  const missing = missingRuntimeHumanEvidence();
  const nested =
    machineAudit.findings.frameDomainCandidates?.summary
      ?.nestedDefinitionCount ?? 0;
  const evidence = [
    evidenceEntry("lesson-release-catalog", records.release),
    evidenceEntry("source-scope-freeze", records.sourceScope),
    evidenceEntry("audio-ownership-readiness", records.audioOwnership),
    evidenceEntry("owner-m1-machine-only-directive", records.authorization),
    evidenceEntry("migration-manifest", records.manifest),
    evidenceEntry("machine-audit", records.machineAudit),
    evidenceEntry("source-scope-binding", records.sourceScopeBinding),
    evidenceEntry("audio-runtime-evidence", records.audioEvidence),
    evidenceEntry("coverage-v2", records.coverage),
    evidenceEntry("m1-static-reconciliation-receipt", records.staticReceipt),
    evidenceEntry("reconciled-migration-brief", records.staticOutputs.migrationBrief),
    evidenceEntry("reconciled-script-inventory", records.staticOutputs.scriptInventory),
    evidenceEntry("reconciled-dependency-inventory", records.staticOutputs.dependencyInventory),
  ];
  assertUniqueEvidence(evidence, member.animationId);
  const tagCounts = machineAudit.findings.swfmill?.tagCounts || {};
  const coverageFrames = records.coverage.document.requirements.reduce(
    (sum, requirement) => sum + requirement.missingFrames.length,
    0,
  );
  const document = {
    schemaVersion: 3,
    evidenceKind: "course-shell-strict-readiness",
    generatedBy: {
      script: GENERATOR_RELATIVE,
      version: GENERATOR_VERSION,
      sha256: records.generator.sha256,
      deterministic: true,
    },
    releaseId: G5_L5_STATIC_STRICT_READINESS_RELEASE_ID,
    animationId: member.animationId,
    state: G5_L5_STATIC_STRICT_READINESS_STATE,
    assessedOn: "2026-07-29",
    migrationStatusChanged: false,
    releaseMembership: {
      ordinal: member.ordinal,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      shardId: member.shardId,
      releaseFingerprintSha256: releaseFingerprint,
    },
    m1Authorization: {
      status: "owner-directed-machine-only-m1-effective",
      receipt: descriptor(records.authorization),
      statementDigestSha256: authorization.statementDigest.sha256,
      machineOnlyStaticWorkAuthorized: true,
      runtimeAuthorized: false,
      guiAuthorized: false,
      implementationAuthorized: false,
      reviewAccepted: false,
      strictCompletionEstablished: false,
      publicationAuthorized: false,
    },
    m1StaticReconciliation: {
      status: "applied-hash-bound-machine-only-static",
      receipt: descriptor(records.staticReceipt),
      canonicalOutputCount: staticReceipt.reconciliation.canonicalOutputCount,
      scriptCount: staticReceipt.summary.scriptCount,
      dependencyApiCandidateCount:
        staticReceipt.summary.dependencyApiCandidateCount,
      complexityResolved: false,
      rendererSelected: false,
      runtimeReachabilityResolved: false,
    },
    conclusion: {
      strictAcceptanceReady: false,
      completionClaimAllowed: false,
      localAuthoritativeBaselineCompletable: false,
      localExhaustiveBranchCaptureCompletable: false,
      risk:
        tagCounts.Random > 0 ||
        machineAudit.findings.externalCallCandidates.length > 0 ||
        machineAudit.findings.exportedScriptFileCount >= 100
          ? "critical"
          : "high",
      reason:
        "The exact release member has current hash-bound source, manifest, partial machine extraction, source-scope, structural audio, provisional bilingual coverage, Owner-authorized machine-only M1 scope, and an applied static reconciliation receipt. These inputs reconcile static canonical facts only. They establish no original-runtime reachability, host entry, natural trace, audio listening, renderer implementation, full-frame comparison, independent review, Owner fidelity acceptance, strict completion, or publication authority.",
    },
    source: {
      sourceModel: manifest.source.flaSha256
        ? "paired-fla-and-shipped-swf"
        : "shipped-swf-only",
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      fla: manifest.source.fla || null,
      flaSha256: manifest.source.flaSha256 || null,
      sourceHashesVerified: true,
      stage: manifest.runtime.stage,
      fps: manifest.runtime.fps,
      rootFrameCount: manifest.runtime.frameCount,
      authoringAuditEstablished: false,
      authoringAccepted: false,
    },
    sourceScope: {
      freeze: descriptor(records.sourceScope),
      binding: descriptor(records.sourceScopeBinding),
      memberCount: EXPECTED_MEMBER_COUNT,
      memberOrdinal: member.ordinal,
      releaseRole: member.releaseRole,
      shardId: member.shardId,
      strictCompleteCount: 0,
      publishedCount: 0,
    },
    machineAudit: {
      auditStatus: "partial",
      staticFactsReconciled: true,
      runtimeBehaviorObserved: false,
      sourceHashVerified: true,
      rootFrameCount: manifest.runtime.frameCount,
      nestedDefinitionCount: nested,
      rootReachableDomainInventoryComplete: false,
      exportedScriptFileCount:
        machineAudit.findings.exportedScriptFileCount,
      externalApiCandidateCount:
        machineAudit.findings.externalCallCandidates.length,
      observedBehaviorFromExtractedScripts:
        observedStaticFacts(machineAudit, manifest),
    },
    audioReadiness: {
      evidence: descriptor(records.audioEvidence),
      structurallyAudited: true,
      authoritativeListeningComplete: false,
      hostStateTraversalComplete: false,
      synchronizationComplete: false,
      spokenLanguageContentVerified: false,
      humanAudioReviewComplete: false,
      audioAccepted: false,
    },
    coverageReadiness: {
      evidence: descriptor(records.coverage),
      requirementCount: 2,
      pendingRequirementCount: 2,
      pendingFrameCount: coverageFrames,
      authoritativeBaselineCount: 0,
      capturedFrameCount: 0,
      implementationCaptureCount: 0,
      fullFrameComparisonCount: 0,
      rmseAccepted: false,
    },
    branchCaptureReadiness: {
      status: G5_L5_STATIC_STRICT_READINESS_STATE,
      authoritativeScheduleEstablished: false,
      runtimeSessionsExecuted: 0,
      requiredScenarioInventory: requiredScenarios,
      missing,
      captureIdentity: {
        requiredFields: [...CAPTURE_IDENTITY_FIELDS],
        sourceSwfSha256: member.source.sha256,
        sourceFlaSha256: manifest.source.flaSha256 || null,
        orderedEventAndStateHashChainRequired: true,
        nativeStagePngRequired: true,
      },
      directSeekAuthority:
        "not-permitted-for-primary evidence; supplemental diagnosis only after a source-evidenced natural trace",
    },
    implementationReadiness: {
      implementationAuthorized: false,
      implementationStarted: false,
      rendererSelected: false,
      routeDeclared: false,
      currentJavaScriptCandidate: false,
      behaviorImplementationComplete: false,
      deterministicImplementationCaptureAccepted: false,
      fullFrameComparisonAccepted: false,
    },
    acceptance: {
      acceptanceNeutral: true,
      authoringAccepted: false,
      authoritativeOriginalRuntimeAccepted: false,
      runtimeReachabilityEstablished: false,
      audioAccepted: false,
      fidelityAccepted: false,
      rmseAccepted: false,
      fullFrameComparisonAccepted: false,
      independentEngineeringAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      published: false,
    },
    review: {
      independentEngineeringReview:
        reviewRecord("independent-engineering-reviewer"),
      humanVisualReview:
        reviewRecord("independent-human-visual-reviewer"),
      ownerReview:
        reviewRecord("owner-or-authorized-representative"),
    },
    strictGateBlockers: missing,
    evidence,
    limitations: [
      "This generator reads and hashes existing files only. Dry-run and check modes write nothing; apply writes only the 57 managed strict-readiness files.",
      "No Adobe Animate, browser, Ruffle, Projector, original Flash runtime, legacy endpoint, or external network service is launched or executed.",
      "Static reconciliation does not prove natural runtime reachability, audio behavior, renderer fidelity, review, strict completion, or publication.",
    ],
    strictAcceptanceEffect:
      "none; M1 static reconciliation only; runtime, implementation, human, strict, and publication gates remain blocked",
  };
  validateG5L5StaticStrictReadiness(document, member);
  return document;
}

async function buildOneMember({
  projectRoot,
  member,
  globals,
  staticReceiptReader,
}) {
  const workspacePrefix = `migrations/${member.animationId}`;
  const [
    manifestRecord,
    machineAuditRecord,
    sourceScopeBindingRecord,
    audioEvidenceRecord,
    coverageRecord,
  ] = await Promise.all([
    readFileRecord(projectRoot, `${workspacePrefix}/${MANIFEST_RELATIVE}`, {
      json: true,
      label: `${member.animationId} migration manifest`,
    }),
    readFileRecord(projectRoot, `${workspacePrefix}/${MACHINE_AUDIT_RELATIVE}`, {
      json: true,
      label: `${member.animationId} machine audit`,
    }),
    readFileRecord(
      projectRoot,
      `${workspacePrefix}/${SOURCE_SCOPE_BINDING_RELATIVE}`,
      {
        json: true,
        label: `${member.animationId} source-scope binding`,
      },
    ),
    readFileRecord(projectRoot, `${workspacePrefix}/${AUDIO_EVIDENCE_RELATIVE}`, {
      json: true,
      label: `${member.animationId} audio evidence`,
    }),
    readFileRecord(projectRoot, `${workspacePrefix}/${COVERAGE_RELATIVE}`, {
      json: true,
      label: `${member.animationId} coverage-v2`,
    }),
  ]);
  validateManifest(manifestRecord.document, member);
  validateMachineAudit(
    machineAuditRecord.document,
    member,
    manifestRecord.document,
  );
  validateSourceScopeBinding(
    sourceScopeBindingRecord.document,
    member,
    globals.sourceScope,
  );
  const audioPlan = globals.audioOwnership.document.memberPlans[
    member.ordinal - 1
  ];
  validateAudioEvidence(audioEvidenceRecord.document, member, audioPlan);
  invariant(
    audioPlan.workspace.dedicatedMachineAudioAudit.bytes ===
      audioEvidenceRecord.bytes &&
      audioPlan.workspace.dedicatedMachineAudioAudit.sha256 ===
        audioEvidenceRecord.sha256,
    `${member.animationId}: dedicated audio evidence hash drifted`,
  );
  validateCoverage(
    coverageRecord.document,
    member,
    manifestRecord.document.runtime.frameCount,
  );

  const physicalSourceRecord = await readFileRecord(
    projectRoot,
    `${SOURCE_ARCHIVE_PREFIX}${member.source.path}`,
    {
      retainContents: false,
      label: `${member.animationId} preserved SWF`,
    },
  );
  invariant(
    physicalSourceRecord.sha256 === member.source.sha256,
    `${member.animationId}: preserved SWF hash differs from release membership`,
  );

  let staticReceiptResult;
  try {
    staticReceiptResult = await staticReceiptReader({
      root: projectRoot,
      animationId: member.animationId,
      member,
    });
  } catch (error) {
    if (error?.code === "ENOENT" || /missing|ENOENT/i.test(error.message)) {
      throw new Error(
        `${member.animationId}: required M1 static reconciliation receipt is missing (${G5_L5_M1_STATIC_RECONCILIATION_RECEIPT_NAME})`,
        {cause: error},
      );
    }
    throw error;
  }
  const staticReceipt =
    staticReceiptResult.receipt ?? staticReceiptResult.document ??
    staticReceiptResult;
  const staticReceiptPath =
    staticReceiptResult.binding?.path ??
    `migrations/${member.animationId}/audit/machine/${G5_L5_M1_STATIC_RECONCILIATION_RECEIPT_NAME}`;
  const staticReceiptRecord = await readFileRecord(
    projectRoot,
    staticReceiptPath,
    {
      json: true,
      label: `${member.animationId} M1 static reconciliation receipt`,
    },
  );
  invariant(
    staticReceiptRecord.contents.toString("utf8") ===
      stableJson(staticReceipt) &&
      stableJson(staticReceiptRecord.document) === stableJson(staticReceipt),
    `${member.animationId}: static receipt is non-canonical or the reader returned different bytes`,
  );
  const staticOutputs = await validateStaticReceiptAndOutputs(
    projectRoot,
    staticReceipt,
    member,
  );

  const records = {
    generator: globals.generator,
    release: globals.release,
    sourceScope: globals.sourceScope,
    audioOwnership: globals.audioOwnership,
    authorization: globals.authorization,
    manifest: manifestRecord,
    machineAudit: machineAuditRecord,
    sourceScopeBinding: sourceScopeBindingRecord,
    audioEvidence: audioEvidenceRecord,
    coverage: coverageRecord,
    staticReceipt: staticReceiptRecord,
    staticOutputs,
    physicalSource: physicalSourceRecord,
  };
  const document = memberDocument({
    member,
    releaseFingerprint: globals.releaseFingerprint,
    manifest: manifestRecord.document,
    machineAudit: machineAuditRecord.document,
    records,
    authorization: globals.authorizationReceipt,
    staticReceipt,
  });
  const output = g5L5StaticStrictReadinessPath(member.animationId);
  const outputSnapshot = await readOutputSnapshot(
    projectRoot,
    output,
    member.animationId,
  );
  if (outputSnapshot.exists) {
    let current;
    try {
      current = JSON.parse(outputSnapshot.contents.toString("utf8"));
    } catch (error) {
      throw new Error(
        `${member.animationId}: existing strict-readiness output is invalid JSON (${error.message})`,
      );
    }
    invariant(
      current.generatedBy?.script === GENERATOR_RELATIVE,
      `${member.animationId}: refusing to overwrite strict-readiness owned by another generator`,
    );
  }
  const inputRecords = [
    globals.generator,
    globals.release,
    globals.sourceScope,
    globals.audioOwnership,
    globals.authorization,
    manifestRecord,
    machineAuditRecord,
    sourceScopeBindingRecord,
    audioEvidenceRecord,
    coverageRecord,
    staticReceiptRecord,
    physicalSourceRecord,
    ...Object.values(staticOutputs),
  ];
  return {
    id: member.animationId,
    member,
    output,
    outputPath: outputSnapshot.absolutePath,
    outputSnapshot,
    inputRecords,
    document,
    rendered: stableJson(document),
  };
}

async function loadGlobals(
  projectRoot,
  {
    expectedReleaseFingerprint,
    authorizationReader,
  },
) {
  const [
    generator,
    release,
    sourceScope,
    audioOwnership,
    authorizationResult,
  ] = await Promise.all([
    readFileRecord(projectRoot, GENERATOR_RELATIVE, {
      label: "G5 L5 static strict-readiness generator",
    }),
    readFileRecord(projectRoot, RELEASE_RELATIVE, {
      json: true,
      label: "G5 L5 lesson release",
    }),
    readFileRecord(projectRoot, SOURCE_SCOPE_RELATIVE, {
      json: true,
      label: "G5 L5 source scope",
    }),
    readFileRecord(projectRoot, AUDIO_OWNERSHIP_RELATIVE, {
      json: true,
      label: "G5 L5 audio ownership",
    }),
    authorizationReader({root: projectRoot}),
  ]);
  const selected = selectRelease(
    release.document,
    expectedReleaseFingerprint,
  );
  validateSourceScope(sourceScope.document, selected.release);
  validateAudioOwnership(audioOwnership.document, selected.release);
  const authorizationReceipt =
    authorizationResult.receipt ?? authorizationResult.document ??
    authorizationResult;
  validateAuthorizationBoundary(authorizationReceipt);
  const authorizationPath =
    authorizationResult.binding?.path ??
    G5_L5_OWNER_DIRECTIVE_RECEIPT_PATH;
  const authorization = await readFileRecord(
    projectRoot,
    authorizationPath,
    {
      json: true,
      label: "G5 L5 Owner M1 machine-only directive",
    },
  );
  invariant(
    authorization.contents.toString("utf8") ===
      stableJson(authorizationReceipt) &&
      stableJson(authorization.document) === stableJson(authorizationReceipt),
    "Owner M1 directive is non-canonical or the reader returned different bytes",
  );
  return {
    generator,
    release,
    releaseDocument: selected.release,
    releaseFingerprint: selected.fingerprint,
    sourceScope,
    audioOwnership,
    authorization,
    authorizationReceipt,
  };
}

async function writeExclusive(candidate, contents, mode = 0o644) {
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

async function removeOwnedFile(candidate, expectedSha256) {
  const information = await lstatOrNull(candidate);
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${candidate}: transaction file is no longer ordinary`,
  );
  const bytes = await readFile(candidate);
  invariant(
    sha256(bytes) === expectedSha256,
    `${candidate}: refusing to remove changed transaction bytes`,
  );
  await unlink(candidate);
}

async function prepareTransaction(item, batchId) {
  const nonce = randomBytes(12).toString("hex");
  const prefix = `.${G5_L5_STATIC_STRICT_READINESS_OUTPUT_NAME}.${batchId}.${nonce}`;
  const stagePath = path.join(item.outputSnapshot.parent, `${prefix}.stage`);
  const backupPath = path.join(item.outputSnapshot.parent, `${prefix}.backup`);
  const renderedBytes = Buffer.from(item.rendered, "utf8");
  const renderedSha256 = sha256(renderedBytes);
  await writeExclusive(stagePath, renderedBytes);
  const stageBytes = await readFile(stagePath);
  invariant(
    sha256(stageBytes) === renderedSha256,
    `${item.id}: staged strict-readiness bytes changed`,
  );
  if (item.outputSnapshot.exists) {
    await writeExclusive(
      backupPath,
      item.outputSnapshot.contents,
      Number.parseInt(item.outputSnapshot.stat.mode, 10) & 0o777,
    );
  }
  return {
    ...item,
    stagePath,
    backupPath,
    renderedBytes,
    renderedSha256,
    committed: false,
  };
}

async function cleanupTransaction(transaction) {
  await removeOwnedFile(
    transaction.stagePath,
    transaction.renderedSha256,
  ).catch((error) => {
    if (error?.code !== "ENOENT") throw error;
  });
  if (transaction.outputSnapshot.exists) {
    await removeOwnedFile(
      transaction.backupPath,
      transaction.outputSnapshot.sha256,
    ).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
}

async function rollbackTransactions(transactions, originalError) {
  const rollbackErrors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      if (transaction.committed) {
        const current = await readFile(transaction.outputPath);
        invariant(
          sha256(current) === transaction.renderedSha256,
          `${transaction.id}: committed output changed before rollback`,
        );
        if (transaction.outputSnapshot.exists) {
          await rename(transaction.backupPath, transaction.outputPath);
        } else {
          await unlink(transaction.outputPath);
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
      `G5 L5 strict-readiness transaction failed with ${rollbackErrors.length} rollback error(s)`,
    );
  }
  throw originalError;
}

async function commitBatch(projectRoot, prepared, transactionHooks = {}) {
  const batchId = `${process.pid}-${Date.now()}-${randomBytes(8).toString("hex")}`;
  const transactions = [];
  try {
    for (const item of prepared) {
      const current = await readOutputSnapshot(
        projectRoot,
        item.output,
        item.id,
      );
      invariant(
        outputSnapshotMatches(item.outputSnapshot, current),
        `${item.id}: strict-readiness output changed after preflight`,
      );
      transactions.push(await prepareTransaction(item, batchId));
    }
    const allInputs = [
      ...new Map(
        prepared
          .flatMap(({inputRecords}) => inputRecords)
          .map((record) => [record.absolutePath, record]),
      ).values(),
    ];
    await assertInputSetUnchanged(allInputs);
    for (const [index, transaction] of transactions.entries()) {
      let current = await readOutputSnapshot(
        projectRoot,
        transaction.output,
        transaction.id,
      );
      invariant(
        outputSnapshotMatches(transaction.outputSnapshot, current),
        `${transaction.id}: strict-readiness output changed before commit`,
      );
      await assertInputSetUnchanged(allInputs);
      await transactionHooks.beforeCommit?.({
        index,
        id: transaction.id,
        outputPath: transaction.outputPath,
      });
      current = await readOutputSnapshot(
        projectRoot,
        transaction.output,
        transaction.id,
      );
      invariant(
        outputSnapshotMatches(transaction.outputSnapshot, current),
        `${transaction.id}: strict-readiness output changed during commit CAS`,
      );
      await assertInputSetUnchanged(allInputs);
      if (transaction.outputSnapshot.exists) {
        await rename(transaction.stagePath, transaction.outputPath);
      } else {
        await link(transaction.stagePath, transaction.outputPath);
        await unlink(transaction.stagePath);
      }
      transaction.committed = true;
      const committed = await readFile(transaction.outputPath);
      invariant(
        sha256(committed) === transaction.renderedSha256,
        `${transaction.id}: committed strict-readiness bytes changed`,
      );
      await transactionHooks.afterCommit?.({
        index,
        id: transaction.id,
        outputPath: transaction.outputPath,
      });
    }
  } catch (error) {
    await rollbackTransactions(transactions, error);
  }
  for (const transaction of transactions) await cleanupTransaction(transaction);
}

export async function readG5L5StaticStrictReadiness({
  root = defaultProjectRoot,
  animationId,
  member,
} = {}) {
  invariant(member?.animationId === animationId, "strict-readiness member identity is required");
  const record = await readFileRecord(
    path.resolve(root),
    g5L5StaticStrictReadinessPath(animationId),
    {
      json: true,
      label: `${animationId} strict-readiness`,
    },
  );
  validateG5L5StaticStrictReadiness(record.document, member);
  invariant(
    record.contents.toString("utf8") === stableJson(record.document),
    `${animationId}: strict-readiness is not canonical JSON`,
  );
  return {document: record.document, binding: descriptor(record)};
}

export async function buildG5L5StaticStrictReadiness(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || defaultProjectRoot);
  const mode = options.mode || "dry-run";
  invariant(
    ["dry-run", "check", "apply"].includes(mode),
    "mode must be dry-run, check, or apply",
  );
  const expectedReleaseFingerprint =
    options.expectedReleaseFingerprint ?? RELEASE_FINGERPRINT_SHA256;
  invariant(
    SHA256_PATTERN.test(expectedReleaseFingerprint),
    "expected release fingerprint is invalid",
  );
  const authorizationReader =
    options.authorizationReader ??
    readG5L5OwnerGovernanceDirectiveIntake;
  const staticReceiptReader =
    options.staticReceiptReader ??
    readG5L5M1StaticReconciliationReceipt;
  const globals = await loadGlobals(projectRoot, {
    expectedReleaseFingerprint,
    authorizationReader,
  });
  const prepared = [];
  // Deliberately sequential: every member is fully released before the next
  // potentially large preserved SWF is streamed and hashed.
  for (const member of globals.releaseDocument.members) {
    prepared.push(
      await buildOneMember({
        projectRoot,
        member,
        globals,
        staticReceiptReader,
      }),
    );
  }
  invariant(
    prepared.length === EXPECTED_MEMBER_COUNT &&
      new Set(prepared.map(({id}) => id)).size === EXPECTED_MEMBER_COUNT,
    "G5 L5 strict-readiness preflight did not cover all 57 exact members",
  );
  if (mode === "check") {
    for (const item of prepared) {
      invariant(
        item.outputSnapshot.exists,
        `${item.id}: strict-readiness output is missing`,
      );
      invariant(
        item.outputSnapshot.contents.toString("utf8") === item.rendered,
        `${item.id}: strict-readiness output is stale`,
      );
    }
  } else if (mode === "apply") {
    await commitBatch(
      projectRoot,
      prepared,
      options.transactionHooks || {},
    );
  }
  return {
    action:
      mode === "apply" ? "written" :
        mode === "check" ? "verified" :
          "planned",
    releaseId: G5_L5_STATIC_STRICT_READINESS_RELEASE_ID,
    releaseFingerprintSha256: globals.releaseFingerprint,
    state: G5_L5_STATIC_STRICT_READINESS_STATE,
    memberCount: prepared.length,
    outputs: prepared.map(({id, output, document}) => ({
      animationId: id,
      path: output,
      state: document.state,
      strictAcceptanceReady: false,
      published: false,
      sha256: sha256(Buffer.from(stableJson(document))),
    })),
    implementationAuthorized: false,
    originalRuntimeLaunched: false,
    audioAccepted: false,
    strictCompleteCount: 0,
    publishedCount: 0,
  };
}

export function parseArguments(argv) {
  const options = {help: false};
  for (const argument of argv) {
    if (argument === "--dry-run") {
      invariant(!options.mode, "choose exactly one of --dry-run, --check, or --apply");
      options.mode = "dry-run";
    } else if (argument === "--check") {
      invariant(!options.mode, "choose exactly one of --dry-run, --check, or --apply");
      options.mode = "check";
    } else if (argument === "--apply") {
      invariant(!options.mode, "choose exactly one of --dry-run, --check, or --apply");
      options.mode = "apply";
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(
      options.mode,
      "explicitly choose one of --dry-run, --check, or --apply",
    );
  }
  return options;
}

function usage() {
  return `Usage:
  node scripts/build-g5-l5-static-strict-readiness.mjs --dry-run
  node scripts/build-g5-l5-static-strict-readiness.mjs --check
  node scripts/build-g5-l5-static-strict-readiness.mjs --apply

Preflights all 57 exact G5 L5 release members before any write.
--apply writes only migrations/<id>/audit/strict-readiness.json as one
compare-and-swap batch. It launches no GUI, browser, Ruffle, Animate, or
original runtime and grants no implementation, review, strict, or publication
authority.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const result = await buildG5L5StaticStrictReadiness(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
