#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  RELEASE_ID,
  REPORT_JSON as PREPARATION_REPORT_PATH,
  RW002_ANIMATION_ID,
  SHELL_ANIMATION_ID,
  SOURCE_PINS,
  buildRuntimePreparation,
  validateRuntimePreparationReport,
} from "./build-g5-l4-shell-rw002-runtime-preparation.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const LANGUAGES = Object.freeze(["en", "es"]);
const CONTROL_IDS = Object.freeze([
  "CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07", "CR-08",
]);
const TEMPLATE_NAMES = Object.freeze([
  "AUTHORIZATION.template.json",
  "PREFLIGHT.template.json",
  "LAUNCH_RECEIPT.template.json",
  "RUNTIME_OBSERVATION.template.json",
  "SESSION_ATTESTATION.template.json",
  "OPERATOR_CARD.md",
]);
const KIT_FILE_NAMES = Object.freeze(["kit-manifest.json", ...TEMPLATE_NAMES]);
const HASH = /^[a-f0-9]{64}$/u;

export const SESSION_KIT_ROOT =
  "work/g5-l4-shell-rw002-original-runtime-session-kits";
export const READINESS_JSON =
  "reports/g5-l4-shell-rw002-original-runtime-session-kit-readiness.json";
export const READINESS_MARKDOWN =
  "reports/g5-l4-shell-rw002-original-runtime-session-kit-readiness.md";
const PREIMAGE_ROOT =
  "work/g5-l4-shell-rw002-original-runtime-session-kit-preimages";

const AUTHORITY =
  "These immutable empty kits are unsigned, non-runnable preparation artifacts. They do not authorize or execute Flash, approve containment, establish a host or operator, record runtime observations, change canonical coverage, or create fidelity, review, strict-completion, or publication evidence.";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
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
  return sha256(Buffer.from(stableJson(value)));
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label}: expected object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(
    actual.length === wanted.length &&
      actual.every((key, index) => key === wanted[index]),
    `${label}: unexpected or missing field`,
  );
}

function contained(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function projectPath(root, relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    `${relativePath}: path must be portable and project-relative`,
  );
  const absolute = path.resolve(root, relativePath);
  invariant(contained(root, absolute), `${relativePath}: path escapes project root`);
  invariant(
    path.relative(root, absolute).split(path.sep).join("/") === relativePath,
    `${relativePath}: path is not normalized`,
  );
  return absolute;
}

async function assertNoSymlinkComponents(
  root,
  relativePath,
  {finalType = null} = {},
) {
  const absolute = projectPath(root, relativePath);
  let current = root;
  const parts = relativePath.split("/");
  for (let index = 0; index < parts.length; index += 1) {
    current = path.join(current, parts[index]);
    const metadata = await lstat(current);
    invariant(
      !metadata.isSymbolicLink(),
      `${relativePath}: symbolic-link component is forbidden`,
    );
    if (index < parts.length - 1) {
      invariant(
        metadata.isDirectory(),
        `${relativePath}: parent component is not a directory`,
      );
    } else if (finalType === "file") {
      invariant(
        metadata.isFile() && metadata.nlink === 1,
        `${relativePath}: expected one ordinary file`,
      );
    } else if (finalType === "directory") {
      invariant(
        metadata.isDirectory(),
        `${relativePath}: expected ordinary directory`,
      );
    }
  }
  const rootReal = await realpath(root);
  invariant(
    contained(rootReal, await realpath(absolute)),
    `${relativePath}: resolves outside project root`,
  );
  return absolute;
}

async function fileObjectBinding(
  root,
  relativePath,
  {requireSingleLink = true} = {},
) {
  const absolute = await assertNoSymlinkComponents(
    root,
    relativePath,
  );
  const before = await lstat(absolute);
  invariant(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.nlink >= 1 &&
      (!requireSingleLink || before.nlink === 1),
    requireSingleLink
      ? `${relativePath}: expected one ordinary file`
      : `${relativePath}: expected an ordinary file`,
  );
  const bytes = await readFile(absolute);
  const after = await lstat(absolute);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.size === after.size &&
      after.size === bytes.length &&
      after.isFile() &&
      !after.isSymbolicLink() &&
      after.nlink >= 1 &&
      (!requireSingleLink || after.nlink === 1),
    `${relativePath}: changed while reading`,
  );
  return {
    descriptor: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)},
    bytes,
    identity: {
      dev: after.dev,
      ino: after.ino,
      size: after.size,
    },
  };
}

async function ordinaryFileBinding(root, relativePath) {
  return fileObjectBinding(root, relativePath, {requireSingleLink: true});
}

async function ownedFileBinding(root, relativePath) {
  return fileObjectBinding(root, relativePath, {requireSingleLink: false});
}

async function optionalOrdinaryFileBinding(root, relativePath) {
  const absolute = projectPath(root, relativePath);
  const metadata = await lstat(absolute).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error));
  if (metadata === null) return null;
  return ordinaryFileBinding(root, relativePath);
}

function sameFileBinding(left, right) {
  if (left === null || right === null) return left === right;
  return left.descriptor.path === right.descriptor.path &&
    sameFileObjectBinding(left, right);
}

function sameFileObjectBinding(left, right) {
  return left !== null &&
    right !== null &&
    left.descriptor.bytes === right.descriptor.bytes &&
    left.descriptor.sha256 === right.descriptor.sha256 &&
    left.identity.dev === right.identity.dev &&
    left.identity.ino === right.identity.ino &&
    left.identity.size === right.identity.size;
}

async function assertFileBinding(root, relativePath, expected, label) {
  const current = await optionalOrdinaryFileBinding(root, relativePath);
  invariant(sameFileBinding(current, expected), `${label}: file changed`);
  return current;
}

async function unlinkOwnedFile(root, relativePath, expected, label) {
  const absolute = projectPath(root, relativePath);
  const metadata = await lstat(absolute).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error));
  if (metadata === null) return;
  const current = await ownedFileBinding(root, relativePath);
  invariant(
    sameFileObjectBinding(current, expected),
    `${label}: refusing to unlink unowned bytes`,
  );
  await unlink(projectPath(root, relativePath));
}

async function safeDirectory(root, relativePath) {
  const absolute = await assertNoSymlinkComponents(
    root,
    relativePath,
    {finalType: "directory"},
  );
  const metadata = await lstat(absolute);
  return {absolute, metadata};
}

async function renameModeLockedDirectory(source, destination) {
  const metadata = await lstat(source);
  invariant(
    metadata.isDirectory() && !metadata.isSymbolicLink(),
    `${source}: expected ordinary directory before rename`,
  );
  const originalMode = metadata.mode & 0o777;
  const unlockedMode = originalMode | 0o200;
  if (unlockedMode !== originalMode) await chmod(source, unlockedMode);
  try {
    await rename(source, destination);
  } catch (error) {
    if (unlockedMode !== originalMode) {
      await chmod(source, originalMode).catch(() => {});
    }
    throw error;
  }
  if (unlockedMode !== originalMode) await chmod(destination, originalMode);
}

function validateDescriptor(value, {path: expectedPath, name: expectedName}, label) {
  const key = expectedPath === undefined ? "name" : "path";
  exactKeys(value, ["bytes", key, "sha256"], label);
  invariant(
    value[key] === (expectedPath ?? expectedName) &&
      Number.isSafeInteger(value.bytes) &&
      value.bytes > 0 &&
      HASH.test(value.sha256),
    `${label}: descriptor drifted`,
  );
}

function descriptorForText(name, text) {
  const bytes = Buffer.from(text);
  return {name, bytes: bytes.length, sha256: sha256(bytes), mode: "0444"};
}

function traceCandidate(report, language) {
  const matches = report.traceCandidates.filter((item) => item.language === language);
  invariant(matches.length === 1, `${language}: trace candidate is not unique`);
  return matches[0];
}

function blankPerson(role) {
  return {
    role,
    externalSubjectId: null,
    fullName: null,
    decidedAt: null,
    signatureEnvelope: null,
  };
}

function buildAuthorization(
  language,
  candidate,
  preparationSha256,
  containmentMechanismCandidates,
) {
  return {
    schemaVersion: 1,
    templateType: "g5-l4-shell-rw002-original-runtime-session-authorization",
    status: "blank-copy-out-and-sign-externally",
    releaseId: RELEASE_ID,
    shellAnimationId: SHELL_ANIMATION_ID,
    targetAnimationId: RW002_ANIMATION_ID,
    language,
    candidateId: candidate.candidateId,
    candidateFingerprintSha256: candidate.candidateFingerprintSha256,
    preparationReportSha256: preparationSha256,
    kitManifestSha256: null,
    owner: blankPerson("owner"),
    containmentApprover: blankPerson("containment-approver"),
    operator: blankPerson("original-runtime-operator"),
    independentVisualReviewer: blankPerson("independent-visual-reviewer"),
    releaseCustodian: blankPerson("release-custodian"),
    approvedControlIds: [],
    containmentControls: containmentMechanismCandidates.controls.map(
      (control, index) => {
        invariant(
          control.controlId === CONTROL_IDS[index] &&
            typeof control.selectedMechanism === "string" &&
            control.selectedMechanism.length > 10 &&
            control.candidateImplementationPresent === true &&
            control.offlineOrDiagnosticVerified === true &&
            control.ownerTechnicalApprovalEstablished === false &&
            control.liveSessionVerified === false,
          `${language}: ${CONTROL_IDS[index]} machine-candidate boundary drifted`,
        );
        return {
          controlId: control.controlId,
          selectedMechanism: control.selectedMechanism,
          candidateImplementationPresent: true,
          offlineOrDiagnosticVerified: true,
          ownerTechnicalApprovalEstablished: false,
          liveSessionVerified: false,
          approved: false,
          verified: false,
          externalReceiptOpaqueId: null,
        };
      },
    ),
    exactHostIdentifier: null,
    readOnlyHostTreeManifestSha256: null,
    disposableProfileRoot: null,
    launchPath: null,
    launchCommand: null,
    stopConditions: [],
    validFrom: null,
    expiresAt: null,
    runtimeExecutionAuthorized: false,
    externalSignatureEnvelope: null,
  };
}

function buildPreflight(language, candidate, preparationSha256) {
  return {
    schemaVersion: 1,
    templateType: "g5-l4-shell-rw002-original-runtime-preflight",
    status: "blank-unexecuted",
    language,
    candidateId: candidate.candidateId,
    candidateFingerprintSha256: candidate.candidateFingerprintSha256,
    preparationReportSha256: preparationSha256,
    sessionId: null,
    exactHostIdentifier: null,
    operatorExternalSubjectId: null,
    checkedAt: null,
    checks: {
      immutableAuthorizationVerified: false,
      allEightControlsApproved: false,
      allEightControlsLiveVerified: false,
      outboundNetworkDenyVerified: false,
      completeReadOnlyHostTreeVerified: false,
      missingDependencyDispositionVerified: false,
      disposableProfileEmptyVerified: false,
      flashSharedObjectStoreEmptyVerified: false,
      sourceHashesVerified: false,
      freeSpaceReserveVerified: false,
      stopConditionsReviewed: false,
    },
    availableBytes: null,
    requiredAvailableBytes: null,
    networkAuditReceiptSha256: null,
    hostTreeManifestSha256: null,
    disposableProfileRoot: null,
    passed: false,
    operatorSignatureEnvelope: null,
  };
}

function buildLaunchReceipt(language, candidate, preparationSha256) {
  return {
    schemaVersion: 1,
    templateType: "g5-l4-shell-rw002-original-runtime-launch-receipt",
    status: "blank-not-launched",
    language,
    candidateId: candidate.candidateId,
    candidateFingerprintSha256: candidate.candidateFingerprintSha256,
    preparationReportSha256: preparationSha256,
    sessionId: null,
    exactHostIdentifier: null,
    operatorExternalSubjectId: null,
    launchedAt: null,
    exitedAt: null,
    runtimeExecutablePath: null,
    runtimeExecutableSha256: null,
    runtimeVersion: null,
    processId: null,
    disposableProfileRoot: null,
    launchMethod: null,
    guiMenuAction: null,
    commandLineSwfArgument: null,
    openedShellPath: null,
    openedShellSha256: null,
    runtimeSessionExecuted: false,
    operatorSignatureEnvelope: null,
  };
}

function buildObservation(language, candidate, preparationSha256) {
  return {
    schemaVersion: 1,
    templateType: "g5-l4-shell-rw002-original-runtime-observation",
    status: "blank-no-observation",
    language,
    candidateId: candidate.candidateId,
    candidateFingerprintSha256: candidate.candidateFingerprintSha256,
    preparationReportSha256: preparationSha256,
    sessionId: null,
    runtimeSessionExecuted: false,
    orderedEvents: [],
    orderedStateHashChain: [],
    observedLoadedResources: [],
    attemptedNetworkRequests: [],
    capturedFrames: [],
    activeFrameDomains: [],
    shellNaturalIntroductionObserved: false,
    shellNativeNextObserved: false,
    rw002NaturalEntryObserved: false,
    exactRw002SourceVerified: false,
    replayTarget: null,
    replayCompleteResetVerified: false,
    terminalStateSha256: null,
    audio: {
      candidatePath: language === "es"
        ? SOURCE_PINS.spanishAudioCandidate.lessonPath
        : null,
      candidateSha256: language === "es"
        ? SOURCE_PINS.spanishAudioCandidate.sha256
        : null,
      catalogLanguage: language === "es" ? "und" : null,
      triggered: false,
      spokenLanguage: null,
      audible: false,
      cue: null,
      synchronized: false,
      replayBehaviorVerified: false,
    },
    unexpectedDialogs: [],
    unexpectedHostEffects: [],
    persistentSharedObjectWrites: [],
    postflightComplete: false,
    observationAccepted: false,
  };
}

function buildAttestation(language, candidate, preparationSha256) {
  return {
    schemaVersion: 1,
    templateType: "g5-l4-shell-rw002-original-runtime-session-attestation",
    status: "blank-unsigned",
    language,
    candidateId: candidate.candidateId,
    candidateFingerprintSha256: candidate.candidateFingerprintSha256,
    preparationReportSha256: preparationSha256,
    sessionId: null,
    operator: blankPerson("original-runtime-operator"),
    sameSessionWitness: blankPerson("same-session-witness"),
    independentVisualReviewer: blankPerson("independent-visual-reviewer"),
    statement: null,
    attestedAt: null,
    finalEventChainSha256: null,
    finalStateChainSha256: null,
    captureManifestSha256: null,
    operatorSignatureEnvelope: null,
    witnessSignatureEnvelope: null,
    reviewerSignatureEnvelope: null,
    runtimeObservationAccepted: false,
    fidelityAccepted: false,
  };
}

function operatorCard(language, candidate) {
  return `# G5 L4 Shell → RW02 ${language.toUpperCase()} Session Kit\n\n`
    + `Status: **unsigned, empty, non-runnable**.\n\n`
    + `Candidate: \`${candidate.candidateId}\`\n\n`
    + `The authorization worksheet carries eight acceptance-neutral machine-selected containment candidates with offline or diagnostic checks. It carries no Owner technical approval, live-session verification, or execution authority.\n\n`
    + `Do not launch Flash from this kit. First copy the authorization worksheet to the approved external signing system and bind the exact kit-manifest hash, named people, approved host, complete read-only host tree, disposable profile, CR-01 through CR-08 decisions, stop conditions, and validity window.\n\n`
    + `If a separately authorized live session is later approved, the human operator must enter through the exact lesson Shell, observe the active \`IR/L4RW01.swf\` start, use the Shell-native Next control, and then verify the exact \`RW/L4RW02.swf\` load. Direct child opening, direct seek, guessed coordinates, and guessed delays are forbidden.\n\n`
    + `Root frame counts are not complete coverage. Shell nested domains remain unresolved. RW02 \`sprite-341\` is only a conservatively declared source-static engineering-candidate domain without authoritative runtime reachability; \`sprite-43\` and \`sprite-208\` remain unresolved. The Spanish audio candidate remains language \`und\` until named-human listening evidence proves otherwise.\n\n`
    + `Any unexpected dialog, network success, host effect, resource request, source mismatch, profile contamination, or missing authorization is a stop condition. Nothing in this directory is an acceptance or release record.\n`;
}

function legacyRootOnlyOperatorCard(language, candidate) {
  return `# G5 L4 Shell → RW02 ${language.toUpperCase()} Session Kit\n\n`
    + `Status: **unsigned, empty, non-runnable**.\n\n`
    + `Candidate: \`${candidate.candidateId}\`\n\n`
    + `Do not launch Flash from this kit. First copy the authorization worksheet to the approved external signing system and bind the exact kit-manifest hash, named people, approved host, complete read-only host tree, disposable profile, CR-01 through CR-08 decisions, stop conditions, and validity window.\n\n`
    + `If a separately authorized live session is later approved, the human operator must enter through the exact lesson Shell, observe the active \`IR/L4RW01.swf\` start, use the Shell-native Next control, and then verify the exact \`RW/L4RW02.swf\` load. Direct child opening, direct seek, guessed coordinates, and guessed delays are forbidden.\n\n`
    + `Root frame counts are not complete coverage. Shell nested domains and RW02 \`sprite-43\`, \`sprite-208\`, and \`sprite-341\` remain unresolved. The Spanish audio candidate remains language \`und\` until named-human listening evidence proves otherwise.\n\n`
    + `Any unexpected dialog, network success, host effect, resource request, source mismatch, profile contamination, or missing authorization is a stop condition. Nothing in this directory is an acceptance or release record.\n`;
}

function legacySelectedFrameDomainOperatorCard(language, candidate) {
  return `# G5 L4 Shell → RW02 ${language.toUpperCase()} Session Kit\n\n`
    + `Status: **unsigned, empty, non-runnable**.\n\n`
    + `Candidate: \`${candidate.candidateId}\`\n\n`
    + `Do not launch Flash from this kit. First copy the authorization worksheet to the approved external signing system and bind the exact kit-manifest hash, named people, approved host, complete read-only host tree, disposable profile, CR-01 through CR-08 decisions, stop conditions, and validity window.\n\n`
    + `If a separately authorized live session is later approved, the human operator must enter through the exact lesson Shell, observe the active \`IR/L4RW01.swf\` start, use the Shell-native Next control, and then verify the exact \`RW/L4RW02.swf\` load. Direct child opening, direct seek, guessed coordinates, and guessed delays are forbidden.\n\n`
    + `Root frame counts are not complete coverage. Shell nested domains remain unresolved. RW02 \`sprite-341\` is only a conservatively declared source-static engineering-candidate domain without authoritative runtime reachability; \`sprite-43\` and \`sprite-208\` remain unresolved. The Spanish audio candidate remains language \`und\` until named-human listening evidence proves otherwise.\n\n`
    + `Any unexpected dialog, network success, host effect, resource request, source mismatch, profile contamination, or missing authorization is a stop condition. Nothing in this directory is an acceptance or release record.\n`;
}

function buildKit(language, preparation, preparationBinding, generatorBinding) {
  const candidate = traceCandidate(preparation, language);
  const jsonTemplates = {
    "AUTHORIZATION.template.json": buildAuthorization(
      language,
      candidate,
      preparationBinding.sha256,
      preparation.containmentMechanismCandidates,
    ),
    "PREFLIGHT.template.json": buildPreflight(
      language, candidate, preparationBinding.sha256,
    ),
    "LAUNCH_RECEIPT.template.json": buildLaunchReceipt(
      language, candidate, preparationBinding.sha256,
    ),
    "RUNTIME_OBSERVATION.template.json": buildObservation(
      language, candidate, preparationBinding.sha256,
    ),
    "SESSION_ATTESTATION.template.json": buildAttestation(
      language, candidate, preparationBinding.sha256,
    ),
  };
  const files = Object.fromEntries(
    Object.entries(jsonTemplates).map(([name, value]) => [name, stableJson(value)]),
  );
  files["OPERATOR_CARD.md"] = operatorCard(language, candidate);
  const templateDescriptors = TEMPLATE_NAMES.map((name) =>
    descriptorForText(name, files[name]));
  const manifestWithoutFingerprint = {
    schemaVersion: 1,
    kitType: "g5-l4-shell-rw002-original-runtime-session-kit",
    status: "unsigned-empty-non-runnable",
    authority: AUTHORITY,
    generator: generatorBinding,
    preparationReport: preparationBinding,
    sessionIdentity: {
      releaseId: RELEASE_ID,
      shellAnimationId: SHELL_ANIMATION_ID,
      targetAnimationId: RW002_ANIMATION_ID,
      language,
      candidateId: candidate.candidateId,
      candidateFingerprintSha256: candidate.candidateFingerprintSha256,
      sessionSlotId: candidate.sessionIsolation.sessionSlotId,
      sessionId: null,
      immutableAuthorizationSha256: null,
    },
    sourceIdentity: {
      shell: {
        lessonPath: SOURCE_PINS.shellSwf.lessonPath,
        bytes: SOURCE_PINS.shellSwf.bytes,
        sha256: SOURCE_PINS.shellSwf.sha256,
      },
      activeIntroduction: {
        lessonPath: SOURCE_PINS.introductionSwf.lessonPath,
        bytes: SOURCE_PINS.introductionSwf.bytes,
        sha256: SOURCE_PINS.introductionSwf.sha256,
      },
      rw002: {
        lessonPath: SOURCE_PINS.rw002Swf.lessonPath,
        bytes: SOURCE_PINS.rw002Swf.bytes,
        sha256: SOURCE_PINS.rw002Swf.sha256,
      },
    },
    isolation: {
      separateFromOtherLanguage: true,
      mayShareMutableProfileWithOtherLanguage: false,
      exactHostIdentifier: null,
      completeReadOnlyHostTreeManifestSha256: null,
      disposableProfileRoot: null,
      disposableProfileBound: false,
    },
    templateFiles: templateDescriptors,
    executionGate: {
      ownerSignatureBound: false,
      containmentApproverSignatureBound: false,
      namedOperatorBound: false,
      independentVisualReviewerBound: false,
      exactHostBound: false,
      completeReadOnlyHostTreeBound: false,
      disposableProfileBound: false,
      allEightControlsApproved: false,
      allEightControlsVerified: false,
      launchPathPresent: false,
      launchCommandPresent: false,
      runtimeSessionExecuted: false,
      originalRuntimeExecutionReady: false,
      runnable: false,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      behaviorAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
  const manifest = {
    ...manifestWithoutFingerprint,
    manifestFingerprintSha256: fingerprint(manifestWithoutFingerprint),
  };
  files["kit-manifest.json"] = stableJson(manifest);
  return {
    language,
    candidate,
    manifest,
    files,
    descriptors: KIT_FILE_NAMES.map((name) => descriptorForText(name, files[name])),
  };
}

function validateBlankPerson(person, role, label) {
  exactKeys(person, [
    "decidedAt", "externalSubjectId", "fullName", "role", "signatureEnvelope",
  ], label);
  invariant(
    person.role === role &&
      person.externalSubjectId === null &&
      person.fullName === null &&
      person.decidedAt === null &&
      person.signatureEnvelope === null,
    `${label}: identity or signature was filled`,
  );
}

function validateSessionKitManifestShape(manifest, language) {
  exactKeys(manifest, [
    "acceptanceEffects", "authority", "executionGate", "generator", "isolation",
    "kitType", "manifestFingerprintSha256", "preparationReport", "schemaVersion",
    "sessionIdentity", "sourceIdentity", "status", "templateFiles",
  ], `${language} manifest`);
  invariant(
    manifest.schemaVersion === 1 &&
      manifest.kitType === "g5-l4-shell-rw002-original-runtime-session-kit" &&
      manifest.status === "unsigned-empty-non-runnable" &&
      manifest.authority === AUTHORITY,
    `${language}: kit identity drifted`,
  );
  validateDescriptor(
    manifest.generator,
    {
      path:
        "scripts/prepare-g5-l4-shell-rw002-original-runtime-session-kits.mjs",
    },
    `${language} generator`,
  );
  validateDescriptor(
    manifest.preparationReport,
    {path: PREPARATION_REPORT_PATH},
    `${language} preparation report`,
  );
  exactKeys(
    manifest.sourceIdentity,
    ["activeIntroduction", "rw002", "shell"],
    `${language} source identity`,
  );
  for (const [key, pinKey] of [
    ["shell", "shellSwf"],
    ["activeIntroduction", "introductionSwf"],
    ["rw002", "rw002Swf"],
  ]) {
    const identity = manifest.sourceIdentity[key];
    const pin = SOURCE_PINS[pinKey];
    exactKeys(
      identity,
      ["bytes", "lessonPath", "sha256"],
      `${language} source identity ${key}`,
    );
    invariant(
      identity.lessonPath === pin.lessonPath &&
        identity.bytes === pin.bytes &&
        identity.sha256 === pin.sha256,
      `${language}: ${key} source identity drifted`,
    );
  }
  exactKeys(manifest.sessionIdentity, [
    "candidateFingerprintSha256", "candidateId", "immutableAuthorizationSha256",
    "language", "releaseId", "sessionId", "sessionSlotId", "shellAnimationId",
    "targetAnimationId",
  ], `${language} session identity`);
  invariant(
    manifest.sessionIdentity.releaseId === RELEASE_ID &&
      manifest.sessionIdentity.shellAnimationId === SHELL_ANIMATION_ID &&
      manifest.sessionIdentity.targetAnimationId === RW002_ANIMATION_ID &&
      manifest.sessionIdentity.language === language &&
      manifest.sessionIdentity.candidateId ===
        `g5-l4-shell-rw002-${language}-candidate` &&
      manifest.sessionIdentity.sessionSlotId ===
        `g5-l4-shell-rw002-${language}-session-slot` &&
      HASH.test(manifest.sessionIdentity.candidateFingerprintSha256) &&
      manifest.sessionIdentity.sessionId === null &&
      manifest.sessionIdentity.immutableAuthorizationSha256 === null,
    `${language}: session identity was filled or drifted`,
  );
  exactKeys(manifest.isolation, [
    "completeReadOnlyHostTreeManifestSha256", "disposableProfileBound",
    "disposableProfileRoot", "exactHostIdentifier",
    "mayShareMutableProfileWithOtherLanguage", "separateFromOtherLanguage",
  ], `${language} isolation`);
  invariant(
    manifest.isolation.separateFromOtherLanguage === true &&
      manifest.isolation.mayShareMutableProfileWithOtherLanguage === false &&
      manifest.isolation.exactHostIdentifier === null &&
      manifest.isolation.completeReadOnlyHostTreeManifestSha256 === null &&
      manifest.isolation.disposableProfileRoot === null &&
      manifest.isolation.disposableProfileBound === false,
    `${language}: isolation was filled or weakened`,
  );
  const falseGateKeys = [
    "ownerSignatureBound", "containmentApproverSignatureBound",
    "namedOperatorBound", "independentVisualReviewerBound", "exactHostBound",
    "completeReadOnlyHostTreeBound", "disposableProfileBound",
    "allEightControlsApproved", "allEightControlsVerified", "launchPathPresent",
    "launchCommandPresent", "runtimeSessionExecuted",
    "originalRuntimeExecutionReady", "runnable",
  ];
  exactKeys(manifest.executionGate, falseGateKeys, `${language} execution gate`);
  invariant(falseGateKeys.every((key) => manifest.executionGate[key] === false),
    `${language}: execution gate was promoted`);
  exactKeys(manifest.acceptanceEffects, [
    "audioAccepted", "authoritativeOriginalRuntime", "behaviorAccepted",
    "humanVisualAccepted", "ownerAccepted", "published", "strictComplete",
  ], `${language} acceptance`);
  invariant(Object.values(manifest.acceptanceEffects).every((value) => value === false),
    `${language}: acceptance was promoted`);
  invariant(
    manifest.templateFiles.length === TEMPLATE_NAMES.length &&
      manifest.templateFiles.every((item, index) => {
        exactKeys(item, ["bytes", "mode", "name", "sha256"],
          `${language} template descriptor ${index}`);
        return item.name === TEMPLATE_NAMES[index] &&
          Number.isSafeInteger(item.bytes) && item.bytes > 0 &&
          HASH.test(item.sha256) && item.mode === "0444";
      }),
    `${language}: template file set drifted`,
  );
  const {manifestFingerprintSha256, ...withoutFingerprint} = manifest;
  invariant(
    HASH.test(manifestFingerprintSha256) &&
      manifestFingerprintSha256 === fingerprint(withoutFingerprint),
    `${language}: manifest fingerprint drifted`,
  );
  return manifest;
}

function validateBlankTemplates(
  kit,
  {
    allowKnownHistoricalOperatorCard = false,
    allowKnownHistoricalUnselectedControls = false,
  } = {},
) {
  const authorization = JSON.parse(kit.files["AUTHORIZATION.template.json"]);
  exactKeys(authorization, [
    "approvedControlIds", "candidateFingerprintSha256", "candidateId",
    "containmentApprover", "containmentControls", "disposableProfileRoot",
    "exactHostIdentifier", "expiresAt", "externalSignatureEnvelope",
    "independentVisualReviewer", "kitManifestSha256", "language",
    "launchCommand", "launchPath", "operator", "owner",
    "preparationReportSha256", "readOnlyHostTreeManifestSha256",
    "releaseCustodian", "releaseId", "runtimeExecutionAuthorized",
    "schemaVersion", "shellAnimationId", "status", "stopConditions",
    "targetAnimationId", "templateType", "validFrom",
  ], `${kit.language} authorization template`);
  validateBlankPerson(authorization.owner, "owner", "authorization owner");
  validateBlankPerson(
    authorization.containmentApprover,
    "containment-approver",
    "authorization containment approver",
  );
  validateBlankPerson(
    authorization.operator,
    "original-runtime-operator",
    "authorization operator",
  );
  validateBlankPerson(
    authorization.independentVisualReviewer,
    "independent-visual-reviewer",
    "authorization independent reviewer",
  );
  validateBlankPerson(
    authorization.releaseCustodian,
    "release-custodian",
    "authorization release custodian",
  );
  invariant(
    authorization.schemaVersion === 1 &&
      authorization.templateType ===
        "g5-l4-shell-rw002-original-runtime-session-authorization" &&
      authorization.status === "blank-copy-out-and-sign-externally" &&
      authorization.releaseId === RELEASE_ID &&
      authorization.shellAnimationId === SHELL_ANIMATION_ID &&
      authorization.targetAnimationId === RW002_ANIMATION_ID &&
      authorization.language === kit.language &&
      authorization.candidateId === kit.candidate.candidateId &&
      authorization.candidateFingerprintSha256 ===
        kit.candidate.candidateFingerprintSha256 &&
      authorization.preparationReportSha256 ===
        kit.manifest.preparationReport.sha256 &&
      authorization.kitManifestSha256 === null &&
      authorization.approvedControlIds.length === 0 &&
      authorization.containmentControls.length === 8 &&
      authorization.containmentControls.every((item, index) => {
        const currentKeys = [
          "approved", "candidateImplementationPresent", "controlId",
          "externalReceiptOpaqueId", "liveSessionVerified",
          "offlineOrDiagnosticVerified", "ownerTechnicalApprovalEstablished",
          "selectedMechanism", "verified",
        ];
        const historicalKeys = [
          "approved", "controlId", "externalReceiptOpaqueId",
          "selectedMechanism", "verified",
        ];
        const actualKeys = item && typeof item === "object" &&
            !Array.isArray(item)
          ? Object.keys(item).sort()
          : [];
        const matches = (keys) => {
          const sorted = [...keys].sort();
          return actualKeys.length === sorted.length &&
            actualKeys.every((key, keyIndex) => key === sorted[keyIndex]);
        };
        if (matches(currentKeys)) {
          return item.controlId === CONTROL_IDS[index] &&
            typeof item.selectedMechanism === "string" &&
            item.selectedMechanism.length > 10 &&
            item.candidateImplementationPresent === true &&
            item.offlineOrDiagnosticVerified === true &&
            item.ownerTechnicalApprovalEstablished === false &&
            item.liveSessionVerified === false &&
            item.approved === false &&
            item.verified === false &&
            item.externalReceiptOpaqueId === null;
        }
        return allowKnownHistoricalUnselectedControls &&
          matches(historicalKeys) &&
          item.controlId === CONTROL_IDS[index] &&
          item.selectedMechanism === null &&
          item.approved === false &&
          item.verified === false &&
          item.externalReceiptOpaqueId === null;
      }) &&
      authorization.exactHostIdentifier === null &&
      authorization.readOnlyHostTreeManifestSha256 === null &&
      authorization.disposableProfileRoot === null &&
      authorization.launchPath === null &&
      authorization.launchCommand === null &&
      authorization.stopConditions.length === 0 &&
      authorization.validFrom === null &&
      authorization.expiresAt === null &&
      authorization.runtimeExecutionAuthorized === false &&
      authorization.externalSignatureEnvelope === null,
    `${kit.language}: authorization template was filled`,
  );
  const preflight = JSON.parse(kit.files["PREFLIGHT.template.json"]);
  exactKeys(preflight, [
    "availableBytes", "candidateFingerprintSha256", "candidateId", "checkedAt",
    "checks", "disposableProfileRoot", "exactHostIdentifier",
    "hostTreeManifestSha256", "language", "networkAuditReceiptSha256",
    "operatorExternalSubjectId", "operatorSignatureEnvelope", "passed",
    "preparationReportSha256", "requiredAvailableBytes", "schemaVersion",
    "sessionId", "status", "templateType",
  ], `${kit.language} preflight template`);
  const preflightCheckKeys = [
    "allEightControlsApproved", "allEightControlsLiveVerified",
    "completeReadOnlyHostTreeVerified", "disposableProfileEmptyVerified",
    "flashSharedObjectStoreEmptyVerified", "freeSpaceReserveVerified",
    "immutableAuthorizationVerified", "missingDependencyDispositionVerified",
    "outboundNetworkDenyVerified", "sourceHashesVerified",
    "stopConditionsReviewed",
  ];
  exactKeys(
    preflight.checks,
    preflightCheckKeys,
    `${kit.language} preflight checks`,
  );
  invariant(
    preflight.schemaVersion === 1 &&
      preflight.templateType ===
        "g5-l4-shell-rw002-original-runtime-preflight" &&
      preflight.status === "blank-unexecuted" &&
      preflight.language === kit.language &&
      preflight.candidateId === kit.candidate.candidateId &&
      preflight.candidateFingerprintSha256 ===
        kit.candidate.candidateFingerprintSha256 &&
      preflight.preparationReportSha256 ===
        kit.manifest.preparationReport.sha256 &&
      preflight.sessionId === null &&
      preflight.exactHostIdentifier === null &&
      preflight.operatorExternalSubjectId === null &&
      preflight.checkedAt === null &&
      preflightCheckKeys.every((key) => preflight.checks[key] === false) &&
      preflight.availableBytes === null &&
      preflight.requiredAvailableBytes === null &&
      preflight.networkAuditReceiptSha256 === null &&
      preflight.hostTreeManifestSha256 === null &&
      preflight.disposableProfileRoot === null &&
      preflight.passed === false &&
      preflight.operatorSignatureEnvelope === null,
    `${kit.language}: preflight template was filled`,
  );
  const launch = JSON.parse(kit.files["LAUNCH_RECEIPT.template.json"]);
  exactKeys(launch, [
    "candidateFingerprintSha256", "candidateId", "commandLineSwfArgument",
    "disposableProfileRoot", "exactHostIdentifier", "exitedAt",
    "guiMenuAction", "language", "launchMethod", "launchedAt",
    "openedShellPath", "openedShellSha256", "operatorExternalSubjectId",
    "operatorSignatureEnvelope", "preparationReportSha256", "processId",
    "runtimeExecutablePath", "runtimeExecutableSha256",
    "runtimeSessionExecuted", "runtimeVersion", "schemaVersion", "sessionId",
    "status", "templateType",
  ], `${kit.language} launch receipt template`);
  invariant(
    launch.schemaVersion === 1 &&
      launch.templateType ===
        "g5-l4-shell-rw002-original-runtime-launch-receipt" &&
      launch.status === "blank-not-launched" &&
      launch.language === kit.language &&
      launch.candidateId === kit.candidate.candidateId &&
      launch.candidateFingerprintSha256 ===
        kit.candidate.candidateFingerprintSha256 &&
      launch.preparationReportSha256 ===
        kit.manifest.preparationReport.sha256 &&
      launch.sessionId === null &&
      launch.exactHostIdentifier === null &&
      launch.operatorExternalSubjectId === null &&
      launch.launchedAt === null &&
      launch.exitedAt === null &&
      launch.runtimeExecutablePath === null &&
      launch.runtimeExecutableSha256 === null &&
      launch.runtimeVersion === null &&
      launch.processId === null &&
      launch.disposableProfileRoot === null &&
      launch.launchMethod === null &&
      launch.guiMenuAction === null &&
      launch.commandLineSwfArgument === null &&
      launch.openedShellPath === null &&
      launch.openedShellSha256 === null &&
      launch.runtimeSessionExecuted === false &&
      launch.operatorSignatureEnvelope === null,
    `${kit.language}: launch receipt was filled`,
  );
  const observation = JSON.parse(kit.files["RUNTIME_OBSERVATION.template.json"]);
  exactKeys(observation, [
    "activeFrameDomains", "attemptedNetworkRequests", "audio",
    "candidateFingerprintSha256", "candidateId", "capturedFrames",
    "exactRw002SourceVerified", "language", "observationAccepted",
    "observedLoadedResources", "orderedEvents", "orderedStateHashChain",
    "persistentSharedObjectWrites", "postflightComplete",
    "preparationReportSha256", "replayCompleteResetVerified", "replayTarget",
    "runtimeSessionExecuted", "rw002NaturalEntryObserved", "schemaVersion",
    "sessionId", "shellNativeNextObserved",
    "shellNaturalIntroductionObserved", "status", "templateType",
    "terminalStateSha256", "unexpectedDialogs", "unexpectedHostEffects",
  ], `${kit.language} runtime observation template`);
  exactKeys(observation.audio, [
    "audible", "candidatePath", "candidateSha256", "catalogLanguage", "cue",
    "replayBehaviorVerified", "spokenLanguage", "synchronized", "triggered",
  ], `${kit.language} runtime observation audio`);
  const spanish = kit.language === "es";
  invariant(
    observation.schemaVersion === 1 &&
      observation.templateType ===
        "g5-l4-shell-rw002-original-runtime-observation" &&
      observation.status === "blank-no-observation" &&
      observation.language === kit.language &&
      observation.candidateId === kit.candidate.candidateId &&
      observation.candidateFingerprintSha256 ===
        kit.candidate.candidateFingerprintSha256 &&
      observation.preparationReportSha256 ===
        kit.manifest.preparationReport.sha256 &&
      observation.sessionId === null &&
      observation.runtimeSessionExecuted === false &&
      observation.orderedEvents.length === 0 &&
      observation.orderedStateHashChain.length === 0 &&
      observation.observedLoadedResources.length === 0 &&
      observation.attemptedNetworkRequests.length === 0 &&
      observation.capturedFrames.length === 0 &&
      observation.activeFrameDomains.length === 0 &&
      observation.shellNaturalIntroductionObserved === false &&
      observation.shellNativeNextObserved === false &&
      observation.rw002NaturalEntryObserved === false &&
      observation.exactRw002SourceVerified === false &&
      observation.replayTarget === null &&
      observation.replayCompleteResetVerified === false &&
      observation.terminalStateSha256 === null &&
      observation.audio.candidatePath ===
        (spanish ? SOURCE_PINS.spanishAudioCandidate.lessonPath : null) &&
      observation.audio.candidateSha256 ===
        (spanish ? SOURCE_PINS.spanishAudioCandidate.sha256 : null) &&
      observation.audio.catalogLanguage === (spanish ? "und" : null) &&
      observation.audio.triggered === false &&
      observation.audio.spokenLanguage === null &&
      observation.audio.audible === false &&
      observation.audio.cue === null &&
      observation.audio.synchronized === false &&
      observation.audio.replayBehaviorVerified === false &&
      observation.unexpectedDialogs.length === 0 &&
      observation.unexpectedHostEffects.length === 0 &&
      observation.persistentSharedObjectWrites.length === 0 &&
      observation.postflightComplete === false &&
      observation.observationAccepted === false,
    `${kit.language}: runtime observation was filled`,
  );
  const attestation = JSON.parse(kit.files["SESSION_ATTESTATION.template.json"]);
  exactKeys(attestation, [
    "attestedAt", "candidateFingerprintSha256", "candidateId",
    "captureManifestSha256", "fidelityAccepted", "finalEventChainSha256",
    "finalStateChainSha256", "independentVisualReviewer", "language",
    "operator", "operatorSignatureEnvelope", "preparationReportSha256",
    "reviewerSignatureEnvelope", "runtimeObservationAccepted",
    "sameSessionWitness", "schemaVersion", "sessionId", "statement", "status",
    "templateType", "witnessSignatureEnvelope",
  ], `${kit.language} session attestation template`);
  validateBlankPerson(
    attestation.operator,
    "original-runtime-operator",
    "attestation operator",
  );
  validateBlankPerson(
    attestation.sameSessionWitness,
    "same-session-witness",
    "attestation witness",
  );
  validateBlankPerson(
    attestation.independentVisualReviewer,
    "independent-visual-reviewer",
    "attestation independent reviewer",
  );
  invariant(
    attestation.schemaVersion === 1 &&
      attestation.templateType ===
        "g5-l4-shell-rw002-original-runtime-session-attestation" &&
      attestation.status === "blank-unsigned" &&
      attestation.language === kit.language &&
      attestation.candidateId === kit.candidate.candidateId &&
      attestation.candidateFingerprintSha256 ===
        kit.candidate.candidateFingerprintSha256 &&
      attestation.preparationReportSha256 ===
        kit.manifest.preparationReport.sha256 &&
      attestation.sessionId === null &&
      attestation.statement === null &&
      attestation.attestedAt === null &&
      attestation.finalEventChainSha256 === null &&
      attestation.finalStateChainSha256 === null &&
      attestation.captureManifestSha256 === null &&
      attestation.operatorSignatureEnvelope === null &&
      attestation.witnessSignatureEnvelope === null &&
      attestation.reviewerSignatureEnvelope === null &&
      attestation.runtimeObservationAccepted === false &&
      attestation.fidelityAccepted === false,
    `${kit.language}: session attestation was filled`,
  );
  const operatorCardText = kit.files["OPERATOR_CARD.md"];
  const allowedOperatorCards = allowKnownHistoricalOperatorCard
    ? [
        operatorCard(kit.language, kit.candidate),
        legacySelectedFrameDomainOperatorCard(kit.language, kit.candidate),
        legacyRootOnlyOperatorCard(kit.language, kit.candidate),
      ]
    : [operatorCard(kit.language, kit.candidate)];
  invariant(
    allowedOperatorCards.includes(operatorCardText) &&
      !/\/Applications\/|file:\/\/|open -a|--launch|runtimeExecutionAuthorized": true/u
        .test(operatorCardText),
    `${kit.language}: operator card became runnable or is not a known empty template`,
  );
}

function buildReadiness(kits, preparationBinding, generatorBinding) {
  const withoutFingerprint = {
    schemaVersion: 1,
    reportType: "g5-l4-shell-rw002-original-runtime-session-kit-readiness",
    status: "immutable-empty-kits-prepared-execution-closed",
    authority: AUTHORITY,
    generator: generatorBinding,
    sourceBindings: {
      runtimePreparation: preparationBinding,
    },
    scope: {
      releaseId: RELEASE_ID,
      shellAnimationId: SHELL_ANIMATION_ID,
      targetAnimationId: RW002_ANIMATION_ID,
      languages: [...LANGUAGES],
      kitRoot: SESSION_KIT_ROOT,
      preparationOnly: true,
    },
    kits: kits.map((kit) => ({
      language: kit.language,
      directory: `${SESSION_KIT_ROOT}/${kit.language}`,
      candidateId: kit.candidate.candidateId,
      candidateFingerprintSha256: kit.candidate.candidateFingerprintSha256,
      manifestFingerprintSha256: kit.manifest.manifestFingerprintSha256,
      files: kit.descriptors,
      directoryMode: "0555",
    })),
    summary: {
      languageKitCount: 2,
      filesPerKit: KIT_FILE_NAMES.length,
      totalPreparedFiles: KIT_FILE_NAMES.length * 2,
      namedIdentitiesBound: 0,
      signaturesBound: 0,
      hostsBound: 0,
      disposableProfilesBound: 0,
      machineSelectedContainmentCandidates: 8,
      containmentCandidateImplementationsPresent: 8,
      containmentOfflineOrDiagnosticVerified: 8,
      approvedContainmentControls: 0,
      verifiedContainmentControls: 0,
      launchCommandsPresent: 0,
      runtimeSessionsExecuted: 0,
      observationsRecorded: 0,
    },
    readiness: {
      immutableEmptySessionKitsPrepared: true,
      enEsSessionSlotsDistinct: true,
      currentSourcePreparationBound: true,
      completeReadOnlyHostTreeBound: false,
      immutableSessionAuthorizationBound: false,
      originalRuntimeExecutionReady: false,
      runnable: false,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      audioAccepted: false,
      behaviorAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
  };
  return {
    ...withoutFingerprint,
    reportFingerprintSha256: fingerprint(withoutFingerprint),
  };
}

function validateSessionKitReadinessShape(report) {
  exactKeys(report, [
    "acceptanceEffects", "authority", "generator", "kits",
    "readiness", "reportFingerprintSha256", "reportType", "schemaVersion",
    "scope", "sourceBindings", "status", "summary",
  ], "session-kit readiness");
  invariant(
    report.schemaVersion === 1 &&
      report.reportType ===
        "g5-l4-shell-rw002-original-runtime-session-kit-readiness" &&
      report.status === "immutable-empty-kits-prepared-execution-closed" &&
      report.authority === AUTHORITY &&
      report.scope.releaseId === RELEASE_ID &&
      report.scope.shellAnimationId === SHELL_ANIMATION_ID &&
      report.scope.targetAnimationId === RW002_ANIMATION_ID &&
      report.scope.languages.join("|") === "en|es" &&
      report.scope.kitRoot === SESSION_KIT_ROOT &&
      report.scope.preparationOnly === true,
    "session-kit readiness identity drifted",
  );
  validateDescriptor(
    report.generator,
    {
      path:
        "scripts/prepare-g5-l4-shell-rw002-original-runtime-session-kits.mjs",
    },
    "session-kit readiness generator",
  );
  exactKeys(
    report.sourceBindings,
    ["runtimePreparation"],
    "session-kit readiness source bindings",
  );
  validateDescriptor(
    report.sourceBindings.runtimePreparation,
    {path: PREPARATION_REPORT_PATH},
    "session-kit readiness runtime preparation",
  );
  exactKeys(report.scope, [
    "kitRoot", "languages", "preparationOnly", "releaseId",
    "shellAnimationId", "targetAnimationId",
  ], "session-kit readiness scope");
  invariant(
    report.kits.length === 2 &&
      report.kits.map((kit) => kit.language).join("|") === "en|es" &&
      report.kits.every((kit) => {
        exactKeys(kit, [
          "candidateFingerprintSha256", "candidateId", "directory",
          "directoryMode", "files", "language", "manifestFingerprintSha256",
        ], `session-kit readiness ${kit.language} kit`);
        invariant(
          kit.files.length === KIT_FILE_NAMES.length &&
            kit.files.every((item, index) => {
              exactKeys(
                item,
                ["bytes", "mode", "name", "sha256"],
                `session-kit readiness ${kit.language} file ${index}`,
              );
              return item.name === KIT_FILE_NAMES[index] &&
                Number.isSafeInteger(item.bytes) &&
                item.bytes > 0 &&
                HASH.test(item.sha256) &&
                item.mode === "0444";
            }),
          `session-kit readiness ${kit.language} file descriptors drifted`,
        );
        return kit.directory === `${SESSION_KIT_ROOT}/${kit.language}` &&
        kit.candidateId === `g5-l4-shell-rw002-${kit.language}-candidate` &&
        HASH.test(kit.candidateFingerprintSha256) &&
        HASH.test(kit.manifestFingerprintSha256) &&
        kit.directoryMode === "0555" &&
        kit.files.length === KIT_FILE_NAMES.length;
      }),
    "session-kit readiness file scope drifted",
  );
  const summaryKeys = [
    "approvedContainmentControls", "disposableProfilesBound",
    "machineSelectedContainmentCandidates",
    "containmentCandidateImplementationsPresent",
    "containmentOfflineOrDiagnosticVerified",
    "filesPerKit", "hostsBound", "languageKitCount",
    "launchCommandsPresent", "namedIdentitiesBound", "observationsRecorded",
    "runtimeSessionsExecuted", "signaturesBound", "totalPreparedFiles",
    "verifiedContainmentControls",
  ];
  exactKeys(report.summary, summaryKeys, "session-kit readiness summary");
  invariant(
    report.summary.languageKitCount === 2 &&
      report.summary.filesPerKit === KIT_FILE_NAMES.length &&
      report.summary.totalPreparedFiles === KIT_FILE_NAMES.length * 2 &&
      report.summary.machineSelectedContainmentCandidates === 8 &&
      report.summary.containmentCandidateImplementationsPresent === 8 &&
      report.summary.containmentOfflineOrDiagnosticVerified === 8 &&
      Object.entries(report.summary).every(([key, value]) =>
        [
          "languageKitCount", "filesPerKit", "totalPreparedFiles",
          "machineSelectedContainmentCandidates",
          "containmentCandidateImplementationsPresent",
          "containmentOfflineOrDiagnosticVerified",
        ].includes(key)
          ? value > 0
          : value === 0),
    "session-kit readiness summary was promoted",
  );
  exactKeys(report.readiness, [
    "completeReadOnlyHostTreeBound", "currentSourcePreparationBound",
    "enEsSessionSlotsDistinct", "immutableEmptySessionKitsPrepared",
    "immutableSessionAuthorizationBound", "originalRuntimeExecutionReady",
    "runnable",
  ], "session-kit readiness gate");
  invariant(
    report.readiness.immutableEmptySessionKitsPrepared === true &&
      report.readiness.enEsSessionSlotsDistinct === true &&
      report.readiness.currentSourcePreparationBound === true &&
      report.readiness.completeReadOnlyHostTreeBound === false &&
      report.readiness.immutableSessionAuthorizationBound === false &&
      report.readiness.originalRuntimeExecutionReady === false &&
      report.readiness.runnable === false,
    "session-kit readiness gate was promoted",
  );
  exactKeys(report.acceptanceEffects, [
    "audioAccepted", "authoritativeOriginalRuntime", "behaviorAccepted",
    "humanVisualAccepted", "ownerAccepted", "published", "strictComplete",
  ], "session-kit readiness acceptance effects");
  invariant(Object.values(report.acceptanceEffects).every((value) => value === false),
    "session-kit readiness acceptance was promoted");
  const {reportFingerprintSha256, ...withoutFingerprint} = report;
  invariant(
    HASH.test(reportFingerprintSha256) &&
      reportFingerprintSha256 === fingerprint(withoutFingerprint),
    "session-kit readiness fingerprint drifted",
  );
  return report;
}

export async function buildSessionKitPlan({root = ROOT} = {}) {
  const preparationFile = await ordinaryFileBinding(root, PREPARATION_REPORT_PATH);
  const checkedInText = preparationFile.bytes.toString("utf8");
  const checkedIn = validateRuntimePreparationReport(JSON.parse(checkedInText));
  const rebuilt = await buildRuntimePreparation({root});
  invariant(checkedInText === rebuilt.json,
    "runtime-preparation report is stale against current source inputs");
  const generator = await ordinaryFileBinding(
    root,
    path.relative(root, SCRIPT_PATH).split(path.sep).join("/"),
  );
  const kits = LANGUAGES.map((language) =>
    buildKit(
      language,
      checkedIn,
      preparationFile.descriptor,
      generator.descriptor,
    ));
  for (const kit of kits) {
    validateSessionKitManifestShape(kit.manifest, kit.language);
    validateBlankTemplates(kit);
  }
  invariant(
    new Set(kits.map((kit) => kit.manifest.sessionIdentity.sessionSlotId)).size === 2,
    "EN and ES session slots are not distinct",
  );
  const report = validateSessionKitReadinessShape(
    buildReadiness(kits, preparationFile.descriptor, generator.descriptor),
  );
  return {
    kits,
    report,
    reportJson: stableJson(report),
    reportMarkdown: renderSessionKitReadinessMarkdown(report),
  };
}

export async function validateSessionKitManifest(
  manifest,
  language,
  {root = ROOT} = {},
) {
  validateSessionKitManifestShape(manifest, language);
  const plan = await buildSessionKitPlan({root});
  const matches = plan.kits.filter((kit) => kit.language === language);
  invariant(matches.length === 1, `${language}: current kit is not unique`);
  invariant(
    stableJson(manifest) === stableJson(matches[0].manifest),
    `${language}: manifest does not match the exact current source, generator, preparation, candidate, or template bindings`,
  );
  return manifest;
}

export async function validateSessionKitReadiness(
  report,
  {root = ROOT} = {},
) {
  validateSessionKitReadinessShape(report);
  const plan = await buildSessionKitPlan({root});
  invariant(
    stableJson(report) === plan.reportJson,
    "session-kit readiness does not match the exact current source, generator, preparation, candidate, manifest, or file bindings",
  );
  return report;
}

async function verifyKitTree(root, plan) {
  const rootDirectory = await safeDirectory(root, SESSION_KIT_ROOT);
  invariant((rootDirectory.metadata.mode & 0o777) === 0o555,
    `${SESSION_KIT_ROOT}: expected mode 0555`);
  const rootEntries = (await readdir(rootDirectory.absolute)).sort();
  invariant(rootEntries.join("|") === "en|es",
    `${SESSION_KIT_ROOT}: unexpected directory member`);
  for (const kit of plan.kits) {
    const relativeDirectory = `${SESSION_KIT_ROOT}/${kit.language}`;
    const directory = await safeDirectory(root, relativeDirectory);
    invariant((directory.metadata.mode & 0o777) === 0o555,
      `${relativeDirectory}: expected mode 0555`);
    const names = (await readdir(directory.absolute)).sort();
    invariant(names.join("|") === [...KIT_FILE_NAMES].sort().join("|"),
      `${relativeDirectory}: unexpected or missing file`);
    for (const name of KIT_FILE_NAMES) {
      const relativePath = `${relativeDirectory}/${name}`;
      const current = await ordinaryFileBinding(root, relativePath);
      const metadata = await lstat(projectPath(root, relativePath));
      invariant((metadata.mode & 0o777) === 0o444,
        `${relativePath}: expected mode 0444`);
      invariant(current.bytes.toString("utf8") === kit.files[name],
        `${relativePath}: immutable empty template drifted`);
    }
  }
}

async function inspectExistingBlankKitTree(root) {
  const rootDirectory = await safeDirectory(root, SESSION_KIT_ROOT);
  invariant((rootDirectory.metadata.mode & 0o777) === 0o555,
    `${SESSION_KIT_ROOT}: only an immutable 0555 tree may be refreshed`);
  const rootEntries = (await readdir(rootDirectory.absolute)).sort();
  invariant(rootEntries.join("|") === "en|es",
    `${SESSION_KIT_ROOT}: unsafe or unexpected directory member`);
  const treeBindings = [];
  for (const language of LANGUAGES) {
    const relativeDirectory = `${SESSION_KIT_ROOT}/${language}`;
    const directory = await safeDirectory(root, relativeDirectory);
    invariant((directory.metadata.mode & 0o777) === 0o555,
      `${relativeDirectory}: only an immutable 0555 kit may be refreshed`);
    const names = (await readdir(directory.absolute)).sort();
    invariant(names.join("|") === [...KIT_FILE_NAMES].sort().join("|"),
      `${relativeDirectory}: unsafe or unexpected file set`);
    const files = {};
    const descriptors = {};
    for (const name of KIT_FILE_NAMES) {
      const relativePath = `${relativeDirectory}/${name}`;
      const current = await ordinaryFileBinding(root, relativePath);
      const metadata = await lstat(projectPath(root, relativePath));
      invariant((metadata.mode & 0o777) === 0o444,
        `${relativePath}: only an immutable 0444 file may be refreshed`);
      files[name] = current.bytes.toString("utf8");
      descriptors[name] = current.descriptor;
      treeBindings.push(current.descriptor);
    }
    let manifest;
    try {
      manifest = JSON.parse(files["kit-manifest.json"]);
    } catch (error) {
      throw new Error(
        `${relativeDirectory}/kit-manifest.json is not JSON: ${error.message}`,
      );
    }
    validateSessionKitManifestShape(manifest, language);
    const candidate = {
      candidateId: manifest.sessionIdentity.candidateId,
      candidateFingerprintSha256:
        manifest.sessionIdentity.candidateFingerprintSha256,
    };
    validateBlankTemplates(
      {language, candidate, manifest, files},
      {
        allowKnownHistoricalOperatorCard: true,
        allowKnownHistoricalUnselectedControls: true,
      },
    );
    for (const descriptor of manifest.templateFiles) {
      const current = descriptors[descriptor.name];
      invariant(
        current &&
          descriptor.bytes === current.bytes &&
          descriptor.sha256 === current.sha256 &&
          descriptor.mode === "0444",
        `${relativeDirectory}/${descriptor.name}: manifest binding drifted`,
      );
    }
  }
  return fingerprint(
    treeBindings
      .sort((left, right) => left.path.localeCompare(right.path))
      .map(({path: bindingPath, bytes, sha256: bindingSha256}) => ({
        path: bindingPath,
        bytes,
        sha256: bindingSha256,
      })),
  );
}

async function archiveExistingBlankKitTree(root) {
  const treeFingerprint = await inspectExistingBlankKitTree(root);
  await safeDirectory(root, "work");
  const preimageRoot = projectPath(root, PREIMAGE_ROOT);
  const existingPreimageRoot = await lstat(preimageRoot).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error));
  if (existingPreimageRoot === null) {
    await mkdir(preimageRoot, {mode: 0o700});
  }
  await safeDirectory(root, PREIMAGE_ROOT);
  let archiveRelative = `${PREIMAGE_ROOT}/${treeFingerprint}`;
  let archive = projectPath(root, archiveRelative);
  const collision = await lstat(archive).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error));
  if (collision !== null) {
    archiveRelative =
      `${PREIMAGE_ROOT}/${treeFingerprint}-${randomUUID()}`;
    archive = projectPath(root, archiveRelative);
    const repeatedCollision = await lstat(archive).catch((error) =>
      error.code === "ENOENT" ? null : Promise.reject(error));
    invariant(repeatedCollision === null, `${archiveRelative}: preimage collision`);
  }
  await renameModeLockedDirectory(
    projectPath(root, SESSION_KIT_ROOT),
    archive,
  );
  return {archive, archiveRelative, treeFingerprint};
}

async function materializeKitTree(
  root,
  plan,
  {
    refreshEmptyTemplates = false,
    transactionHooks = {},
  } = {},
) {
  const output = projectPath(root, SESSION_KIT_ROOT);
  const existing = await lstat(output).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error));
  if (existing) {
    try {
      await verifyKitTree(root, plan);
      return {created: false, refreshed: false, preimage: null};
    } catch (error) {
      if (!refreshEmptyTemplates) throw error;
    }
    const preimage = await archiveExistingBlankKitTree(root);
    try {
      const replacement = await materializeKitTree(root, plan, {
        transactionHooks,
      });
      if (typeof transactionHooks.afterReplacement === "function") {
        await transactionHooks.afterReplacement({
          preimage: preimage.archiveRelative,
        });
      }
      return {
        ...replacement,
        refreshed: true,
        preimage: preimage.archiveRelative,
      };
    } catch (error) {
      const replacement = await lstat(output).catch((caught) =>
        caught.code === "ENOENT" ? null : Promise.reject(caught));
      if (replacement !== null) {
        const failedReplacement = projectPath(
          root,
          `${PREIMAGE_ROOT}/failed-replacement-${randomUUID()}`,
        );
        await renameModeLockedDirectory(output, failedReplacement);
      }
      await renameModeLockedDirectory(preimage.archive, output);
      throw error;
    }
  }
  await safeDirectory(root, "work");
  const stagingRelative =
    `work/.g5-l4-shell-rw002-session-kits.${process.pid}.${randomUUID()}.tmp`;
  const staging = projectPath(root, stagingRelative);
  await mkdir(staging, {mode: 0o700});
  try {
    for (const kit of plan.kits) {
      const directory = path.join(staging, kit.language);
      await mkdir(directory, {mode: 0o700});
      for (const name of KIT_FILE_NAMES) {
        const target = path.join(directory, name);
        await writeFile(target, kit.files[name], {
          encoding: "utf8",
          flag: "wx",
          mode: 0o600,
        });
        await chmod(target, 0o444);
      }
      await chmod(directory, 0o555);
    }
    await chmod(staging, 0o555);
    await rename(staging, output);
  } catch (error) {
    await chmod(staging, 0o700).catch(() => {});
    await rm(staging, {recursive: true, force: true}).catch(() => {});
    throw error;
  }
  await verifyKitTree(root, plan);
  return {created: true, refreshed: false, preimage: null};
}

async function replaceReportPair(
  root,
  entries,
  {transactionHooks = {}} = {},
) {
  const transactionId = `${process.pid}-${randomUUID()}`;
  const states = [];
  let committed = false;
  try {
    for (const [relativePath, contents] of entries) {
      const output = projectPath(root, relativePath);
      const parentRelative = path.posix.dirname(relativePath);
      await safeDirectory(root, parentRelative);
      const prior = await optionalOrdinaryFileBinding(root, relativePath);
      const temporary = path.join(
        path.dirname(output),
        `.${path.basename(output)}.${transactionId}.tmp`,
      );
      const backup = path.join(
        path.dirname(output),
        `.${path.basename(output)}.${transactionId}.bak`,
      );
      await writeFile(temporary, contents, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o644,
      });
      const temporaryRelative = path.relative(root, temporary)
        .split(path.sep).join("/");
      const backupRelative = path.relative(root, backup)
        .split(path.sep).join("/");
      const expected = await ordinaryFileBinding(root, temporaryRelative);
      states.push({
        relativePath,
        output,
        temporary,
        backup,
        temporaryRelative,
        backupRelative,
        prior,
        expected,
        backupCreated: false,
        backupBinding: null,
        priorRemoved: false,
        installed: false,
        installedBinding: null,
      });
    }
    for (const state of states) {
      await assertFileBinding(
        root,
        state.relativePath,
        state.prior,
        `${state.relativePath} pre-commit`,
      );
      if (state.prior) {
        await link(state.output, state.backup);
        state.backupCreated = true;
        const linkedBackup = await ownedFileBinding(
          root,
          state.backupRelative,
        );
        invariant(
          sameFileObjectBinding(linkedBackup, state.prior),
          `${state.relativePath}: backup verification failed`,
        );
        await unlinkOwnedFile(
          root,
          state.relativePath,
          state.prior,
          `${state.relativePath} backup source`,
        );
        state.priorRemoved = true;
        state.backupBinding = await ordinaryFileBinding(
          root,
          state.backupRelative,
        );
        invariant(
          sameFileObjectBinding(state.backupBinding, state.prior),
          `${state.relativePath}: post-backup verification failed`,
        );
      }
    }
    for (const [index, state] of states.entries()) {
      await assertFileBinding(
        root,
        state.relativePath,
        null,
        `${state.relativePath} install target`,
      );
      if (typeof transactionHooks.beforeInstall === "function") {
        await transactionHooks.beforeInstall({
          index,
          path: state.relativePath,
        });
      }
      await link(state.temporary, state.output);
      state.installed = true;
      const [linkedTemporary, linkedOutput] = await Promise.all([
        ownedFileBinding(root, state.temporaryRelative),
        ownedFileBinding(root, state.relativePath),
      ]);
      invariant(
        sameFileObjectBinding(linkedTemporary, state.expected) &&
          sameFileObjectBinding(linkedOutput, state.expected),
        `${state.relativePath}: no-replace install link drifted`,
      );
      await unlinkOwnedFile(
        root,
        state.temporaryRelative,
        state.expected,
        `${state.relativePath} install temporary`,
      );
      const installed = await ordinaryFileBinding(root, state.relativePath);
      invariant(
        sameFileObjectBinding(installed, state.expected),
        `${state.relativePath}: installed output verification failed`,
      );
      state.installedBinding = installed;
    }
    committed = true;
  } catch (error) {
    const rollbackErrors = [];
    if (!committed) {
      for (const state of [...states].reverse()) {
        try {
          if (state.installed) {
            await unlinkOwnedFile(
              root,
              state.relativePath,
              state.installedBinding ?? state.expected,
              `${state.relativePath} rollback output`,
            );
            state.installed = false;
          }
          if (state.backupCreated) {
            const backupExpected = state.backupBinding ?? state.prior;
            const backup = await ownedFileBinding(
              root,
              state.backupRelative,
            );
            invariant(
              sameFileObjectBinding(backup, backupExpected),
              `${state.relativePath}: rollback backup changed`,
            );
            if (state.priorRemoved) {
              await link(state.backup, state.output);
              const restoredLink = await ownedFileBinding(
                root,
                state.relativePath,
              );
              invariant(
                sameFileObjectBinding(restoredLink, backupExpected),
                `${state.relativePath}: restored link drifted`,
              );
            } else {
              const activePrior = await ownedFileBinding(
                root,
                state.relativePath,
              );
              invariant(
                sameFileObjectBinding(activePrior, state.prior),
                `${state.relativePath}: active prior changed`,
              );
            }
            await unlinkOwnedFile(
              root,
              state.backupRelative,
              backupExpected,
              `${state.relativePath} rollback backup`,
            );
            state.backupCreated = false;
            state.priorRemoved = false;
            const restored = await ordinaryFileBinding(
              root,
              state.relativePath,
            );
            invariant(
              sameFileObjectBinding(restored, state.prior),
              `${state.relativePath}: restored output drifted`,
            );
          }
          await unlinkOwnedFile(
            root,
            state.temporaryRelative,
            state.expected,
            `${state.relativePath} rollback temporary`,
          );
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "session-kit readiness report transaction failed and rollback was incomplete",
      );
    }
    throw error;
  }
  invariant(committed, "session-kit readiness report transaction did not commit");
  const cleanupErrors = [];
  for (const state of states) {
    try {
      await unlinkOwnedFile(
        root,
        state.temporaryRelative,
        state.expected,
        `${state.relativePath} committed temporary cleanup`,
      );
      if (state.backupCreated) {
        await unlinkOwnedFile(
          root,
          state.backupRelative,
          state.backupBinding ?? state.prior,
          `${state.relativePath} committed backup cleanup`,
        );
        state.backupCreated = false;
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      cleanupErrors,
      "session-kit readiness report pair committed but cleanup was incomplete",
    );
  }
}

async function isolatedSessionKitTestRoot(root) {
  const resolvedRoot = path.resolve(root);
  const canonicalRoot = await realpath(resolvedRoot);
  invariant(
    path.basename(canonicalRoot).startsWith("g5-l4-session-kit-test-"),
    "test-only helper requires an isolated g5-l4-session-kit-test-* root",
  );
  invariant(
    !contained(ROOT, canonicalRoot) && !contained(canonicalRoot, ROOT),
    "test-only helper refuses the project tree and its ancestors",
  );
  return canonicalRoot;
}

export async function materializeSessionKitTreeForTesting({
  root,
  refreshEmptyTemplates = false,
  transactionHooks = {},
} = {}) {
  invariant(root, "test-only materializer requires a root");
  const resolvedRoot = await isolatedSessionKitTestRoot(root);
  const plan = await buildSessionKitPlan();
  return materializeKitTree(resolvedRoot, plan, {
    refreshEmptyTemplates,
    transactionHooks,
  });
}

export async function replaceSessionKitReportPairForTesting({
  root,
  entries,
  transactionHooks = {},
} = {}) {
  invariant(root, "test-only report writer requires a root");
  const resolvedRoot = await isolatedSessionKitTestRoot(root);
  invariant(
    Array.isArray(entries) && entries.length === 2,
    "test-only report writer requires exactly two outputs",
  );
  return replaceReportPair(resolvedRoot, entries, {transactionHooks});
}

export function renderSessionKitReadinessMarkdown(report) {
  validateSessionKitReadinessShape(report);
  const rows = report.kits.map((kit) =>
    `| ${kit.language.toUpperCase()} | \`${kit.candidateId}\` | ${kit.files.length} | 0555 / 0444 | unsigned, empty, non-runnable |`).join("\n");
  return `# G5 L4 Shell → RW02 Original-Runtime Session-Kit Readiness\n\n`
    + `Status: **immutable empty kits prepared; execution closed**.\n\n`
    + `${report.authority}\n\n`
    + `Each authorization worksheet carries **8/8 machine-selected containment candidates / 8/8 candidate implementations / 8/8 offline or diagnostic checks**. Owner technical approvals / live-session verifications / runnable kits / runtime sessions remain **0 / 0 / 0 / 0**.\n\n`
    + `| Language | Candidate | Files | Modes | State |\n|---|---|---:|---|---|\n${rows}\n\n`
    + `EN and ES have distinct session-slot identities and may not share a mutable runtime profile. No person, signature, host, profile, launch path, launch command, PID, timestamp, observation, containment approval, review, or acceptance is bound.\n\n`
    + `The kits must remain unchanged in \`${SESSION_KIT_ROOT}\`. Copy the authorization worksheet outside the repository for any future approved signing workflow; do not fill these canonical empty templates in place.\n\n`
    + `Missing KeyTerm XML, incomplete CR-02 host-tree closure, all live containment verification, per-session authorization, natural runtime evidence, authoritative runtime frame-domain disposition, audio listening, independent review, Owner acceptance, strict completion, and publication remain open.\n`;
}

export async function prepareSessionKits({
  root = ROOT,
  check = false,
  refreshEmptyTemplates = false,
} = {}) {
  invariant(!(check && refreshEmptyTemplates),
    "--check and --refresh-empty-templates are mutually exclusive");
  const plan = await buildSessionKitPlan({root});
  if (check) {
    await verifyKitTree(root, plan);
    const [json, markdown] = await Promise.all([
      ordinaryFileBinding(root, READINESS_JSON),
      ordinaryFileBinding(root, READINESS_MARKDOWN),
    ]);
    invariant(json.bytes.toString("utf8") === plan.reportJson,
      `${READINESS_JSON}: stale`);
    invariant(markdown.bytes.toString("utf8") === plan.reportMarkdown,
      `${READINESS_MARKDOWN}: stale`);
    return {action: "verified", changed: 0, report: plan.report};
  }
  const materialized = await materializeKitTree(root, plan, {
    refreshEmptyTemplates,
  });
  await replaceReportPair(root, [
    [READINESS_JSON, plan.reportJson],
    [READINESS_MARKDOWN, plan.reportMarkdown],
  ]);
  await verifyKitTree(root, plan);
  return {
    action: materialized.refreshed
      ? "refreshed-empty-templates-and-reported"
      : materialized.created
        ? "prepared"
        : "verified-and-reported",
    changed: materialized.created ? KIT_FILE_NAMES.length * 2 + 2 : 2,
    preservedPreimage: materialized.preimage,
    report: plan.report,
  };
}

export function parseArguments(argv) {
  const options = {check: false, refreshEmptyTemplates: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--refresh-empty-templates") {
      options.refreshEmptyTemplates = true;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  invariant(!(options.check && options.refreshEmptyTemplates),
    "--check and --refresh-empty-templates are mutually exclusive");
  return options;
}

function usage() {
  return [
    "Usage: node scripts/prepare-g5-l4-shell-rw002-original-runtime-session-kits.mjs [--check|--refresh-empty-templates]",
    "",
    "Prepares or verifies immutable empty EN/ES Shell→RW02 session kits.",
    "It cannot launch, sign, approve, capture, promote, change coverage, or record runtime evidence.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await prepareSessionKits(options);
  process.stdout.write(
    `${result.action}: 2 immutable empty language kits; 0 identities; 0 signatures; 0 launches; 0 runtime sessions; acceptance effect none.\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
