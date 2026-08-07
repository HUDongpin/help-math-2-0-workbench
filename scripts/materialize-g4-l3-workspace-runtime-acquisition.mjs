#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {isDeepStrictEqual} from "node:util";
import {fileURLToPath} from "node:url";

import {
  buildAuthoritativeRuntimeAcquisitionContract,
  validateAuthoritativeRuntimeAcquisitionContract,
} from "./build-g4-l3-authoritative-runtime-acquisition-contract.mjs";
import {
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const MATERIALIZER_VERSION = 1;
const CONTRACT_RELATIVE = "reports/g4-l3-authoritative-runtime-acquisition-contract.json";
const TS006_ANIMATION_ID = "course-g04-l03-ts-006";
const TS006_HOST_TREE_RELATIVE =
  "work/original-runtime-host-trees/course-g04-l03-ts-006/root/staging-manifest.json";
export const WORKSPACE_ARTIFACT_RELATIVE = "audit/machine/g4-l3-runtime-acquisition-plan.json";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function projectRelative(filePath, root = PROJECT_ROOT) {
  const relative = portable(path.relative(root, filePath));
  invariant(relative && !relative.startsWith("../") && !path.isAbsolute(relative),
    `${filePath} escapes the project root`);
  return relative;
}

async function readJson(filePath, label) {
  const bytes = await readFile(filePath);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
  return {value, bytes};
}

async function validateRealDirectory(filePath, parentReal, label) {
  const information = await lstat(filePath).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(information.isDirectory() && !information.isSymbolicLink(), `${label}: must be a real directory`);
  const resolved = await realpath(filePath);
  invariant(resolved !== parentReal && resolved.startsWith(`${parentReal}${path.sep}`),
    `${label}: resolves outside the expected parent`);
  return resolved;
}

async function validateOutputTarget(filePath, workspaceReal, label) {
  const parent = path.dirname(filePath);
  const parentInfo = await lstat(parent).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (parentInfo) {
    invariant(parentInfo.isDirectory() && !parentInfo.isSymbolicLink(), `${label}: output parent must be a real directory`);
    const parentResolved = await realpath(parent);
    invariant(parentResolved.startsWith(`${workspaceReal}${path.sep}`), `${label}: output parent escapes the workspace`);
  }
  const targetInfo = await lstat(filePath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (targetInfo) {
    invariant(targetInfo.isFile() && !targetInfo.isSymbolicLink(), `${label}: existing output must be a regular file`);
    invariant(targetInfo.nlink === 1, `${label}: existing output must not be hard-linked`);
  }
}

async function verifySourceFile({root, sourceRootReal, descriptor, label}) {
  invariant(descriptor && typeof descriptor.path === "string" && /^[a-f0-9]{64}$/.test(descriptor.sha256),
    `${label}: source descriptor is incomplete`);
  const absolute = path.join(root, ...descriptor.path.split("/"));
  const information = await lstat(absolute).catch((error) => {
    throw new Error(`${label}: unavailable (${error.message})`);
  });
  invariant(information.isFile() && !information.isSymbolicLink() && information.nlink === 1,
    `${label}: must be one regular, non-linked source file`);
  const resolved = await realpath(absolute);
  invariant(resolved.startsWith(`${sourceRootReal}${path.sep}`), `${label}: resolves outside source-assets`);
  const bytes = await readFile(absolute);
  invariant(bytes.length === descriptor.bytes, `${label}: byte count drifted`);
  invariant(sha256(bytes) === descriptor.sha256, `${label}: SHA-256 drifted`);
  return {path: descriptor.path, bytes: bytes.length, sha256: descriptor.sha256};
}

function validateManifestIdentity(manifest, item) {
  invariant(manifest?.schemaVersion === 2, `${item.animationId}: migration schema drifted`);
  invariant(manifest.animationId === item.animationId, `${item.animationId}: migration animationId mismatch`);
  invariant(manifest.assetId === item.assetId, `${item.animationId}: migration assetId mismatch`);
  invariant(manifest.source?.swf === item.source.swf.path
    && manifest.source?.swfSha256 === item.source.swf.sha256,
  `${item.animationId}: migration SWF identity mismatch`);
  invariant((manifest.source?.fla || null) === (item.source.fla?.path || null)
    && (manifest.source?.flaSha256 || null) === (item.source.fla?.sha256 || null),
  `${item.animationId}: migration FLA identity mismatch`);
  invariant(manifest.runtime?.stage?.width === item.nativeRuntimeFacts.stage.width
    && manifest.runtime?.stage?.height === item.nativeRuntimeFacts.stage.height
    && manifest.runtime?.fps === item.nativeRuntimeFacts.fps
    && manifest.runtime?.frameCount === item.nativeRuntimeFacts.rootFrameCount,
  `${item.animationId}: migration root runtime identity mismatch`);
}

export async function readTs006PreparedContainmentArtifact(root = PROJECT_ROOT) {
  const manifestPath = path.join(root, ...TS006_HOST_TREE_RELATIVE.split("/"));
  const information = await lstat(manifestPath);
  invariant(information.isFile() && !information.isSymbolicLink() && information.nlink === 1,
    "TS006 read-only host-tree manifest must be one regular file");
  const manifestFile = await readJson(manifestPath, TS006_HOST_TREE_RELATIVE);
  const hostTree = manifestFile.value;
  invariant(hostTree.schemaVersion === 1
    && hostTree.reportType === "g4-l3-ts006-read-only-original-runtime-host-tree"
    && hostTree.selectedCandidate.animationId === TS006_ANIMATION_ID
    && hostTree.summary.files === 657
    && hostTree.summary.bytes === 35_469_789
    && isDeepStrictEqual(hostTree.summary.filesByExtension, {mp3: 146, swf: 508, xml: 3})
    && /^[a-f0-9]{64}$/.test(hostTree.fileSetSha256)
    && /^[a-f0-9]{64}$/.test(hostTree.manifestFingerprintSha256)
    && hostTree.stagedRoot.fileMode === "0444"
    && hostTree.stagedRoot.directoryMode === "0555"
    && hostTree.stagedRoot.regularCopiedFilesOnly === true
    && hostTree.stagedRoot.symbolicLinks === 0
    && hostTree.stagedRoot.hardLinks === 0
    && hostTree.executionGate.cr02TechnicalArtifactPrepared === true
    && hostTree.executionGate.cr02Approved === false
    && hostTree.executionGate.originalRuntimeExecutionReady === false,
  "TS006 read-only CR-02 artifact drifted or was promoted");
  return {
    controlId: "CR-02",
    state: "technical-artifact-prepared-not-approved",
    manifest: {
      path: projectRelative(manifestPath, root),
      bytes: manifestFile.bytes.length,
      sha256: sha256(manifestFile.bytes),
      reportType: hostTree.reportType,
      schemaVersion: hostTree.schemaVersion,
    },
    stagedRoot: hostTree.stagedRoot,
    fileSetSha256: hostTree.fileSetSha256,
    manifestFingerprintSha256: hostTree.manifestFingerprintSha256,
    summary: {
      files: hostTree.summary.files,
      bytes: hostTree.summary.bytes,
      filesByExtension: hostTree.summary.filesByExtension,
    },
    approved: false,
    verifiedForExecution: false,
  };
}

export function buildWorkspaceRuntimeAcquisitionArtifact({
  item,
  itemIndex,
  manifest,
  contractBinding,
  materializerBinding,
  preparedContainmentArtifacts,
}) {
  validateManifestIdentity(manifest, item);
  const artifact = {
    schemaVersion: 1,
    artifactType: "g4-l3-workspace-runtime-acquisition-plan",
    ownership: {
      owner: "machine-generated-acceptance-neutral-planning",
      canonicalAcceptanceEvidence: false,
      migrationManifestBindingCreated: false,
      safeToReplaceOnlyWithThisMaterializer: true,
    },
    identity: {
      releaseId: "lesson-g04-l03-negative-numbers",
      sequence: item.sequence,
      animationId: item.animationId,
      assetId: item.assetId,
      releaseRole: item.releaseRole,
      batch: item.batch,
      classification: item.classification,
    },
    provenance: {
      lessonAcquisitionContract: {
        ...contractBinding,
        itemJsonPointer: `/items/${itemIndex}`,
        itemSha256: sha256(Buffer.from(stableJson(item))),
      },
      migrationTechnicalManifest: {
        path: `migrations/${item.animationId}/migration.json`,
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        sha256: technicalManifestSha256(manifest),
      },
      materializer: materializerBinding,
    },
    source: item.source,
    nativeRuntimeFacts: item.nativeRuntimeFacts,
    authoringGate: item.authoringGate,
    acquisitionRequirements: item.acquisitionRequirements,
    captureIdentityContract: item.captureIdentityContract,
    directSeekPolicy: item.directSeekPolicy,
    forensicReferenceBoundary: item.forensicReferenceBoundary,
    runtimeEnvironmentPrerequisite: item.runtimeEnvironmentPrerequisite,
    runtimeContainmentPrerequisite: item.runtimeContainmentPrerequisite,
    preparedContainmentArtifacts,
    operatorWorksheet: {
      status: "empty-template-planning-only",
      namedAnimateDialogOperator: null,
      namedOriginalRuntimeOperator: null,
      authorizedRuntimeExecutable: null,
      authorizedRuntimeVersion: null,
      launchPath: null,
      hostContext: null,
      sessionId: null,
      captureSchedule: [],
      eventSchedule: [],
      runtimeScenarioIds: [],
      traceIds: [],
      deterministicSeedBindings: [],
      baselineManifests: [],
      pngFiles: [],
      audioListeningRecords: [],
      runtimeReceipts: [],
      reviewerOrOwnerSignatures: [],
    },
    executionGate: {
      state: "closed-empty-planning-artifact",
      runnable: false,
      launchesAnimate: false,
      launchesOriginalRuntime: false,
      executesLegacyEndpoints: false,
      createsCaptureEvidence: false,
      authorizesDirectSeek: false,
      preparedContainmentControlIds: preparedContainmentArtifacts.map((artifact) => artifact.controlId),
      nextPrerequisite: item.authoringGate.required && !item.authoringGate.authoringAuditEstablished
        ? "complete and validate the named-human Animate authoring audit, then resolve authoritative runtime and natural trace schedules"
        : item.animationId === TS006_ANIMATION_ID
          ? "obtain owner approval for the hash-bound runtime candidate and CR-02 prepared tree, then bind the remaining containment mechanisms, authorized host context, named operator, and natural trace schedules"
          : "obtain owner approval for the hash-bound runtime candidate, then bind network containment, authorized host context, named operator, and natural trace schedules",
    },
    currentEvidenceState: item.currentEvidenceState,
    acceptance: {
      acceptanceNeutral: true,
      planningArtifactMaterialized: true,
      authoringAccepted: false,
      authoritativeRuntimeAccepted: false,
      implementationAuthorized: false,
      visualOrBehaviorParityAccepted: false,
      rmseAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      statement: "This machine-owned workspace artifact copies one row of the fail-closed lesson acquisition contract, binds the installed-but-unapproved runtime candidate and unapproved eight-control side-effect containment prerequisite, and, for FLA-backed items, binds its validated work-only authoring audit. TS006 additionally binds one unapproved read-only CR-02 technical artifact. Its operator worksheet is empty and non-runnable; it is not runtime or containment approval, authoring acceptance, an original-runtime session, a baseline, a trace, a specification approval, implementation authorization, RMSE/audio/human/owner acceptance, or migration completion.",
    },
  };
  return {
    ...artifact,
    artifactFingerprintSha256: sha256(Buffer.from(stableJson(artifact))),
  };
}

async function writeAtomic(filePath, bytes) {
  const temporary = `${filePath}.tmp-${process.pid}-${Math.random().toString(16).slice(2)}`;
  try {
    await writeFile(temporary, bytes);
    await rename(temporary, filePath);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

async function writeTransaction(operations) {
  if (!operations.length) return;
  const transactionId = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const staged = [];
  try {
    for (const [index, operation] of operations.entries()) {
      await mkdir(path.dirname(operation.filePath), {recursive: true});
      const temporaryPath = `${operation.filePath}.stage-${transactionId}-${index}`;
      await writeFile(temporaryPath, operation.nextBytes);
      staged.push({...operation, temporaryPath});
    }
  } catch (error) {
    await Promise.all(staged.map(({temporaryPath}) => unlink(temporaryPath).catch(() => {})));
    throw new Error(`G4 L3 runtime-acquisition transaction staging failed before commit (${error.message})`);
  }
  const applied = [];
  try {
    for (const operation of staged) {
      await rename(operation.temporaryPath, operation.filePath);
      applied.push(operation);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const operation of [...applied].reverse()) {
      try {
        if (operation.previousBytes === null) await unlink(operation.filePath);
        else await writeAtomic(operation.filePath, operation.previousBytes);
      } catch (rollbackError) {
        rollbackErrors.push(`${operation.filePath}: ${rollbackError.message}`);
      }
    }
    await Promise.all(staged.slice(applied.length).map(({temporaryPath}) => unlink(temporaryPath).catch(() => {})));
    throw new Error(`G4 L3 runtime-acquisition transaction commit failed (${error.message})` +
      (rollbackErrors.length ? `; rollback failures: ${rollbackErrors.join("; ")}` : "; all applied files were rolled back"));
  }
}

export async function materializeG4L3WorkspaceRuntimeAcquisition({
  root = PROJECT_ROOT,
  migrationsRoot = path.join(root, "migrations"),
  contractPath = path.join(root, ...CONTRACT_RELATIVE.split("/")),
  dryRun = false,
  check = false,
} = {}) {
  invariant(!(dryRun && check), "--dry-run and --check are mutually exclusive");
  const [contractFile, materializerBytes, currentContract] = await Promise.all([
    readJson(contractPath, CONTRACT_RELATIVE),
    readFile(SCRIPT_PATH),
    buildAuthoritativeRuntimeAcquisitionContract(),
  ]);
  const contract = validateAuthoritativeRuntimeAcquisitionContract(contractFile.value);
  invariant(isDeepStrictEqual(contract, currentContract),
    "G4 L3 authoritative runtime acquisition contract is stale or not the current deterministic projection");
  const contractBinding = {
    path: projectRelative(contractPath, root),
    bytes: contractFile.bytes.length,
    sha256: sha256(contractFile.bytes),
    reportType: contract.reportType,
    schemaVersion: contract.schemaVersion,
  };
  const materializerBinding = {
    path: "scripts/materialize-g4-l3-workspace-runtime-acquisition.mjs",
    version: MATERIALIZER_VERSION,
    sha256: sha256(materializerBytes),
  };
  const sourceRootReal = await realpath(path.join(root, "source-assets"));
  const migrationsRootReal = await realpath(migrationsRoot);
  const ts006PreparedContainmentArtifact = await readTs006PreparedContainmentArtifact(root);
  const plans = [];

  invariant(contract.items.length === 40, "G4 L3 acquisition contract no longer has exactly 40 items");
  for (const [itemIndex, item] of contract.items.entries()) {
    const workspace = path.join(migrationsRoot, item.animationId);
    const workspaceReal = await validateRealDirectory(workspace, migrationsRootReal, item.animationId);
    const manifestPath = path.join(workspace, "migration.json");
    const manifestFile = await readJson(manifestPath, `${item.animationId} migration.json`);
    validateManifestIdentity(manifestFile.value, item);
    await verifySourceFile({root, sourceRootReal, descriptor: item.source.swf, label: `${item.animationId} SWF`});
    if (item.source.fla) {
      await verifySourceFile({root, sourceRootReal, descriptor: item.source.fla, label: `${item.animationId} FLA`});
    }
    const artifact = buildWorkspaceRuntimeAcquisitionArtifact({
      item,
      itemIndex,
      manifest: manifestFile.value,
      contractBinding,
      materializerBinding,
      preparedContainmentArtifacts:
        item.animationId === TS006_ANIMATION_ID ? [ts006PreparedContainmentArtifact] : [],
    });
    const artifactBytes = Buffer.from(stableJson(artifact));
    const artifactPath = path.join(workspace, ...WORKSPACE_ARTIFACT_RELATIVE.split("/"));
    await validateOutputTarget(artifactPath, workspaceReal, item.animationId);
    const currentArtifact = await readFile(artifactPath).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    plans.push({
      animationId: item.animationId,
      artifactPath,
      artifactBytes,
      previousBytes: currentArtifact,
      manifestPath,
      manifestBytes: manifestFile.bytes,
      changed: !currentArtifact || !currentArtifact.equals(artifactBytes),
      artifactFingerprintSha256: artifact.artifactFingerprintSha256,
    });
  }

  const changed = plans.filter((plan) => plan.changed);
  if (check && changed.length) {
    throw new Error(`G4 L3 workspace runtime-acquisition plans are stale or missing: ${changed.map((plan) => plan.animationId).join(", ")}`);
  }
  if (!check && !dryRun) {
    await writeTransaction(changed.map((plan) => ({
      filePath: plan.artifactPath,
      nextBytes: plan.artifactBytes,
      previousBytes: plan.previousBytes,
    })));
    for (const plan of plans) {
      invariant((await readFile(plan.manifestPath)).equals(plan.manifestBytes),
        `${plan.animationId}: migration manifest changed during artifact-only publication`);
    }
  }
  return {
    mode: check ? "check" : dryRun ? "dry-run" : "write",
    members: plans.length,
    changed: changed.length,
    contractSha256: contractBinding.sha256,
    artifactSetSha256: sha256(Buffer.from(plans.map((plan) => plan.artifactFingerprintSha256).join("\n"))),
    manifestChanges: 0,
    runtimeSessionsExecuted: 0,
    acceptanceChanges: 0,
    results: plans.map((plan) => ({
      animationId: plan.animationId,
      action: plan.changed ? (check ? "stale" : dryRun ? "would-write" : "wrote") : "up-to-date",
      artifactFingerprintSha256: plan.artifactFingerprintSha256,
    })),
  };
}

export function parseArguments(argv) {
  const options = {};
  for (const argument of argv) {
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  invariant(!(options.dryRun && options.check), "--dry-run and --check are mutually exclusive");
  return options;
}

function usage() {
  return [
    "Usage: node scripts/materialize-g4-l3-workspace-runtime-acquisition.mjs [--dry-run | --check]",
    "",
    `Writes only ${WORKSPACE_ARTIFACT_RELATIVE} for each exact G4 L3 member.`,
    "The artifact contains an empty, non-runnable operator worksheet and creates no manifest,",
    "runtime-session, capture, review, approval, acceptance, or completion binding.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result = await materializeG4L3WorkspaceRuntimeAcquisition(options);
  const label = result.mode === "check" ? "PASS" : result.mode === "dry-run" ? "DRY-RUN" : "WROTE";
  process.stdout.write(`${label}: ${result.members}/40 workspace runtime-acquisition planning artifacts; ` +
    `${result.changed} change(s); runtime sessions 0; acceptance/status effect none; set ${result.artifactSetSha256}.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
