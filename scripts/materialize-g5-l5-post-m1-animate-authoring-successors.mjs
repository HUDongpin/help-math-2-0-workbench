#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  readFile,
  readdir,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const G5_L5_POST_M1_ANIMATE_RELEASE_ID =
  "lesson-g05-l05-add-subtract-negative-numbers";
export const G5_L5_POST_M1_ANIMATE_RELEASE_FINGERPRINT_SHA256 =
  "c03cf04129a19758f1bbdadbc67c78b26dde783fca1587447bf6ff83f2af7f84";
export const G5_L5_POST_M1_ANIMATE_OUTPUT_NAME =
  "g5-l5-post-m1-animate-authoring-successor.json";
export const G5_L5_POST_M1_ANIMATE_REPORT_PREFIX =
  "reports/g5-l5-post-m1-animate-authoring-readiness";

const GENERATOR_RELATIVE =
  "scripts/materialize-g5-l5-post-m1-animate-authoring-successors.mjs";
const RELEASE_RELATIVE = "catalog/lesson-releases.json";
const HISTORICAL_REPORT_JSON =
  "reports/g5-l5-animate-authoring-operator-readiness.json";
const HISTORICAL_REPORT_MARKDOWN =
  "reports/g5-l5-animate-authoring-operator-readiness.md";
const CURRENT_RESULT_INDEX =
  "reports/g5-l5-animate-authoring-audit-index.json";
const STAGING_ROOT =
  "work/animate/release-read-only-fla-copies/" +
  `${G5_L5_POST_M1_ANIMATE_RELEASE_ID}/all`;
const STAGING_MANIFEST_DIRECTORY = `${STAGING_ROOT}/manifests/sha256`;
const MANIFEST_RELATIVE = "migration.json";
const M1_RECEIPT_RELATIVE =
  "audit/machine/g5-l5-m1-static-reconciliation-receipt.json";
const EXPECTED_MEMBER_COUNT = 57;
const EXPECTED_PAGE_COUNT = 56;
const EXPECTED_SHELL_COUNT = 1;
const EXPECTED_FLA_COUNT = 49;
const EXPECTED_SWF_ONLY_COUNT = 8;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  currentJavaScriptCandidate: false,
  implementationAuthorized: false,
  authoringAuditAccepted: false,
  fidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  publicationAuthorized: false,
  published: false,
});

const EMPTY_OPERATOR_WORKSHEET = Object.freeze({
  state: "empty-non-runnable-planning-only",
  namedOperators: Object.freeze([]),
  operatorRoleAssignments: Object.freeze([]),
  immutableSessionAuthorizations: Object.freeze([]),
  animateSessions: Object.freeze([]),
  guiExecutions: Object.freeze([]),
  conversionWarningAcknowledgements: Object.freeze([]),
  authoringAuditReceipts: Object.freeze([]),
  authoringAuditReports: Object.freeze([]),
  authoringAuditPngs: Object.freeze([]),
  reviewerSignatures: Object.freeze([]),
  ownerSignatures: Object.freeze([]),
});

const EXECUTION_GATE = Object.freeze({
  state: "closed-post-m1-metadata-planning-only",
  runnable: false,
  launchesAnimate: false,
  launchesGui: false,
  interactsWithDialogs: false,
  savesDocuments: false,
  convertsDocuments: false,
  publishesDocuments: false,
  exportsDocuments: false,
  executesShippedSwf: false,
  executesLegacyEndpoints: false,
  createsAuthoringAuditEvidence: false,
  authoringAuditComplete: false,
  namedOperatorCount: 0,
  sessionCount: 0,
  guiExecutionCount: 0,
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
  invariant(isWithin(projectRoot, absoluteTarget), `${label}: target escapes root`);
  const relativeParent = path.relative(projectRoot, path.dirname(absoluteTarget));
  const segments = relativeParent === "" ? [] : relativeParent.split(path.sep);
  let cursor = projectRoot;
  for (const segment of segments) {
    cursor = path.join(cursor, segment);
    const information = await lstat(cursor, {bigint: true}).catch((error) => {
      throw new Error(
        `${label}: ancestor unavailable: ` +
        `${portable(path.relative(projectRoot, cursor))} (${error.message})`,
      );
    });
    invariant(
      information.isDirectory() && !information.isSymbolicLink(),
      `${label}: ancestor must be an ordinary directory: ` +
        portable(path.relative(projectRoot, cursor)),
    );
    const cursorReal = await realpath(cursor);
    invariant(
      isWithin(rootReal, cursorReal),
      `${label}: ancestor resolves outside project root`,
    );
  }
}

async function readFileRecord(projectRoot, relativePath, {
  json = false,
  expectedMode = null,
  retainContents = true,
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
  if (expectedMode !== null) {
    invariant(
      permissionMode(before) === expectedMode,
      `${label}: expected mode ${expectedMode.toString(8).padStart(4, "0")}`,
    );
  }
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
    contents: retainContents || json ? contents : null,
    document,
    sha256: sha256(contents),
    stat: statIdentity(after),
  };
}

function descriptor(record) {
  return {
    path: record.path,
    bytes: Number(record.stat.size),
    sha256: record.sha256,
    mode: modeString(record.stat),
  };
}

function assertDescriptor(binding, record, label, {
  pathKey = "file",
  requireMode = false,
} = {}) {
  invariant(
    binding?.[pathKey] === record.path &&
      binding.bytes === Number(record.stat.size) &&
      binding.sha256 === record.sha256 &&
      (!requireMode || binding.mode === modeString(record.stat)),
    `${label}: descriptor is stale`,
  );
}

function withFingerprint(document, key) {
  return {
    ...document,
    [key]: sha256(Buffer.from(stableJson(document))),
  };
}

function fingerprintDocument(document, key) {
  const projected = structuredClone(document);
  delete projected[key];
  return sha256(Buffer.from(stableJson(projected)));
}

function assertAllFalse(value, label) {
  invariant(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === Object.keys(ACCEPTANCE_EFFECTS).length &&
      Object.keys(ACCEPTANCE_EFFECTS).every((key) => value[key] === false),
    `${label}: acceptance effects must be the exact all-false contract`,
  );
}

function assertEmptyWorksheet(worksheet, label) {
  invariant(
    worksheet?.state === "empty-non-runnable-planning-only" &&
      Object.keys(worksheet).length ===
        Object.keys(EMPTY_OPERATOR_WORKSHEET).length,
    `${label}: worksheet identity drifted`,
  );
  for (const key of Object.keys(EMPTY_OPERATOR_WORKSHEET)) {
    if (key === "state") continue;
    invariant(
      Array.isArray(worksheet[key]) && worksheet[key].length === 0,
      `${label}: ${key} must remain empty`,
    );
  }
}

function assertExecutionGate(gate, label) {
  invariant(
    gate &&
      Object.keys(gate).length === Object.keys(EXECUTION_GATE).length,
    `${label}: execution gate shape drifted`,
  );
  for (const [key, expected] of Object.entries(EXECUTION_GATE)) {
    invariant(gate[key] === expected, `${label}: execution gate ${key} drifted`);
  }
}

function selectRelease(document, {
  expectedMemberCount = EXPECTED_MEMBER_COUNT,
  expectedPageCount = EXPECTED_PAGE_COUNT,
  expectedShellCount = EXPECTED_SHELL_COUNT,
  expectedReleaseFingerprint =
    G5_L5_POST_M1_ANIMATE_RELEASE_FINGERPRINT_SHA256,
} = {}) {
  invariant(
    document?.schemaVersion === 1 && Array.isArray(document.releases),
    "lesson release catalog is malformed",
  );
  const matches = document.releases.filter(
    ({releaseId}) => releaseId === G5_L5_POST_M1_ANIMATE_RELEASE_ID,
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
      release.members.length === expectedMemberCount &&
      sha256(Buffer.from(stableJson(release))) === expectedReleaseFingerprint,
    "G5 L5 release identity, cardinality, or fingerprint drifted",
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
        SHA256_PATTERN.test(member.source?.sha256 || "") &&
        ["active-xml-referenced-page", "course-shell"].includes(
          member.releaseRole,
        ),
      `G5 L5 release member ${index + 1} identity drifted`,
    );
  }
  return release;
}

function validateCurrentManifest(manifest, member) {
  invariant(
    manifest?.animationId === member.animationId &&
      manifest.assetId === member.assetId &&
      manifest.source?.swfSha256 === member.source.sha256 &&
      manifest.source?.swf?.endsWith(member.source.path) &&
      manifest.implementation?.rendering === "undecided" &&
      manifest.implementation?.route === "" &&
      manifest.implementation?.component === "" &&
      manifest.implementation?.timelineModule === "",
    `${member.animationId}: current manifest crossed the static boundary`,
  );
}

function validateCurrentM1Receipt(receipt, member) {
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.artifactType ===
        "g5-l5-m1-static-reconciliation-receipt" &&
      receipt.releaseId === G5_L5_POST_M1_ANIMATE_RELEASE_ID &&
      receipt.animationId === member.animationId &&
      receipt.assetId === member.assetId &&
      receipt.releaseMembership?.ordinal === member.ordinal &&
      receipt.releaseMembership.releaseRole === member.releaseRole &&
      receipt.releaseMembership.batchId === member.batchId &&
      receipt.releaseMembership.shardId === member.shardId,
    `${member.animationId}: M1 receipt identity drifted`,
  );
  invariant(
    receipt.reconciliation?.applied === true &&
      receipt.reconciliation.machineOnlyStatic === true &&
      receipt.reconciliation.canonicalOutputCount === 4 &&
      receipt.summary?.manifestStaticFactsReconciled === true &&
      receipt.summary.migrationBriefStaticReconciled === true &&
      receipt.summary.complexityResolved === false &&
      receipt.summary.rendererSelected === false &&
      receipt.summary.runtimeReachabilityResolved === false &&
      receipt.execution?.runtimeSessionsExecuted === 0 &&
      receipt.execution.guiApplicationsLaunched === 0 &&
      receipt.execution.legacyEndpointsExecuted === 0 &&
      Object.values(receipt.acceptanceEffects ?? {}).length === 9 &&
      Object.values(receipt.acceptanceEffects).every((value) => value === false),
    `${member.animationId}: M1 receipt crossed its machine-only boundary`,
  );
  const expectedPaths = {
    migrationManifest: `migrations/${member.animationId}/migration.json`,
    migrationBrief: `migrations/${member.animationId}/MIGRATION_BRIEF.md`,
    scriptInventory:
      `migrations/${member.animationId}/audit/script-inventory.json`,
    dependencyInventory:
      `migrations/${member.animationId}/audit/dependency-inventory.json`,
  };
  invariant(
    Object.keys(receipt.outputs ?? {}).length ===
      Object.keys(expectedPaths).length,
    `${member.animationId}: M1 receipt output count drifted`,
  );
  for (const [key, expectedPath] of Object.entries(expectedPaths)) {
    const output = receipt.outputs[key];
    invariant(
      output?.before?.path === expectedPath &&
        typeof output.before.exists === "boolean" &&
        Number.isSafeInteger(output.before.bytes) &&
        output.after?.path === expectedPath &&
        output.after.exists === true &&
        Number.isSafeInteger(output.after.bytes) &&
        output.after.bytes > 0 &&
        SHA256_PATTERN.test(output.after.sha256 || ""),
      `${member.animationId}: M1 receipt ${key} binding drifted`,
    );
  }
  invariant(
    SHA256_PATTERN.test(receipt.receiptFingerprintSha256 || "") &&
      receipt.receiptFingerprintSha256 ===
        fingerprintDocument(receipt, "receiptFingerprintSha256"),
    `${member.animationId}: M1 receipt fingerprint drifted`,
  );
}

function keyedRows(rows, expectedCount, label) {
  invariant(Array.isArray(rows) && rows.length === expectedCount, `${label}: count drifted`);
  const map = new Map(rows.map((row) => [row.animationId, row]));
  invariant(map.size === rows.length, `${label}: duplicate animation IDs`);
  return map;
}

function validateHistoricalOperatorReport(report, release, {
  expectedMemberCount,
  expectedFlaCount,
  expectedSwfOnlyCount,
}) {
  invariant(
    report?.schemaVersion === 2 &&
      report.reportType ===
        "lesson-release-adobe-animate-human-assisted-authoring-operator-readiness" &&
      report.release?.releaseId === G5_L5_POST_M1_ANIMATE_RELEASE_ID &&
      report.release.selectedMemberCount === expectedMemberCount &&
      report.release.fullReleaseMemberCount === expectedMemberCount &&
      report.summary?.selectedMembers === expectedMemberCount &&
      report.summary.flaBackedItems === expectedFlaCount &&
      report.summary.swfOnlyItems === expectedSwfOnlyCount &&
      report.summary.pendingHumanAssistedRuns === expectedFlaCount &&
      report.summary.namedPrimaryOperatorRoleAssignmentsRecorded === 0 &&
      report.summary.actualSessionOperatorAttestationsRecorded === 0 &&
      report.summary.animateGuiExecutionsByThisBuilder === 0 &&
      report.summary.authoringAuditsEstablished === 0 &&
      report.summary.originalRuntimeBaselinesEstablished === 0 &&
      report.summary.humanVisualReviewsEstablished === 0 &&
      report.summary.ownerAcceptancesEstablished === 0 &&
      report.summary.strictAcceptancesEstablished === 0 &&
      report.summary.strictAcceptanceEffect === false,
    "historical Animate operator report crossed its recorded boundary",
  );
  invariant(
    report.operatorAssignment?.status === "not-supplied" &&
      report.operatorAssignment.assigneeFullName === null &&
      report.operatorAssignment.animateGuiExecutionAuthorized === false &&
      report.operatorAssignment.originalRuntimeExecutionAuthorized === false &&
      report.operatorAssignment.actualSessionOperatorAttestationPresent === false &&
      report.safetyContract?.builderLaunchesOrInteractsWithAnimate === false &&
      report.safetyContract.automatedDialogClicks === 0 &&
      report.safetyContract.documentSaveConvertPublishOrExportActions === 0 &&
      report.processGate?.humanAssistedRunAllowedNow === false,
    "historical Animate operator or process gate was promoted",
  );
  const queue = keyedRows(report.queue, expectedFlaCount, "historical operator queue");
  const noFla = keyedRows(
    report.noFlaDispositions,
    expectedSwfOnlyCount,
    "historical no-FLA dispositions",
  );
  for (const member of release.members) {
    const row = queue.get(member.animationId) ?? noFla.get(member.animationId);
    invariant(
      row &&
        row.assetId === member.assetId &&
        row.releaseOrdinal === member.ordinal &&
        row.releaseRole === member.releaseRole &&
        row.shardId === member.shardId,
      `${member.animationId}: historical operator report member drifted`,
    );
  }
  return {queue, noFla};
}

function validateStagingManifest(document, release, {
  expectedMemberCount,
  expectedFlaCount,
  expectedSwfOnlyCount,
}, label) {
  invariant(
    document?.schemaVersion === 1 &&
      document.evidenceKind ===
        "lesson-release-adobe-animate-prepare-only-fla-staging" &&
      document.release?.releaseId === G5_L5_POST_M1_ANIMATE_RELEASE_ID &&
      document.release.selectedMemberCount === expectedMemberCount &&
      document.release.fullReleaseMemberCount === expectedMemberCount &&
      document.summary?.flaBackedItems === expectedFlaCount &&
      document.summary.swfOnlyItems === expectedSwfOnlyCount &&
      document.summary.animateGuiExecutions === 0 &&
      document.summary.dialogInteractions === 0 &&
      document.summary.authoringAuditsCompleted === 0 &&
      document.summary.migrationOrAcceptanceWrites === 0 &&
      document.summary.strictAcceptanceEffect === false,
    `${label}: staging manifest boundary drifted`,
  );
  const entries = keyedRows(document.entries, expectedFlaCount, `${label} entries`);
  const noFla = keyedRows(
    document.noFlaDispositions,
    expectedSwfOnlyCount,
    `${label} no-FLA`,
  );
  for (const member of release.members) {
    const row = entries.get(member.animationId) ?? noFla.get(member.animationId);
    invariant(
      row &&
        row.assetId === member.assetId &&
        row.releaseOrdinal === member.ordinal &&
        row.releaseRole === member.releaseRole &&
        row.shardId === member.shardId,
      `${label}/${member.animationId}: release member drifted`,
    );
  }
  return {entries, noFla};
}

function validatePrepareQueue(document, release, {
  expectedMemberCount,
  expectedFlaCount,
  expectedSwfOnlyCount,
}) {
  invariant(
    document?.schemaVersion === 1 &&
      document.evidenceKind ===
        "lesson-release-adobe-animate-prepare-only-operator-queue" &&
      document.release?.releaseId === G5_L5_POST_M1_ANIMATE_RELEASE_ID &&
      document.release.selectedMemberCount === expectedMemberCount &&
      document.release.fullReleaseMemberCount === expectedMemberCount &&
      document.summary?.preparedFlaItems === expectedFlaCount &&
      document.summary.noFlaDispositions === expectedSwfOnlyCount &&
      document.summary.pendingAuthoringAudits === expectedFlaCount &&
      document.summary.authoringAuditsCompleted === 0 &&
      document.summary.strictAcceptanceEffect === false,
    "historical prepare-only queue boundary drifted",
  );
  const queue = keyedRows(document.queue, expectedFlaCount, "prepare-only queue");
  const noFla = keyedRows(
    document.noFlaDispositions,
    expectedSwfOnlyCount,
    "prepare-only no-FLA",
  );
  for (const member of release.members) {
    invariant(
      queue.has(member.animationId) || noFla.has(member.animationId),
      `${member.animationId}: missing from historical prepare-only queue`,
    );
  }
  return {queue, noFla};
}

async function readStagingManifestInventory(
  projectRoot,
  release,
  currentManifestRecords,
  validationOptions,
) {
  const directoryPath = resolveProjectPath(
    projectRoot,
    STAGING_MANIFEST_DIRECTORY,
    "staging manifest directory",
  );
  await assertOrdinaryAncestorTree(
    projectRoot,
    path.join(directoryPath, "candidate.json"),
    "staging manifest directory",
  );
  const before = await lstat(directoryPath, {bigint: true});
  invariant(
    before.isDirectory() && !before.isSymbolicLink(),
    "staging manifest directory must be ordinary",
  );
  const names = (await readdir(directoryPath)).sort();
  invariant(
    names.every((name) => /^[a-f0-9]{64}\.json$/.test(name)),
    "staging manifest directory contains an unmanaged entry",
  );
  const records = [];
  for (const name of names) {
    const relativePath = `${STAGING_MANIFEST_DIRECTORY}/${name}`;
    const record = await readFileRecord(projectRoot, relativePath, {
      json: true,
      expectedMode: 0o444,
      label: `staging manifest candidate ${name}`,
    });
    invariant(
      record.sha256 === name.slice(0, 64),
      `${relativePath}: content address drifted`,
    );
    const maps = validateStagingManifest(
      record.document,
      release,
      validationOptions,
      relativePath,
    );
    let currentBindingCount = 0;
    for (const member of release.members) {
      const row = maps.entries.get(member.animationId) ??
        maps.noFla.get(member.animationId);
      const current = currentManifestRecords.get(member.animationId);
      if (
        row.workspaceManifest?.file === current.path &&
        row.workspaceManifest.sha256 === current.sha256 &&
        row.workspaceManifest.bytes === Number(current.stat.size)
      ) {
        currentBindingCount += 1;
      }
    }
    records.push({record, maps, currentBindingCount});
  }
  const after = await lstat(directoryPath, {bigint: true});
  invariant(
    sameStatIdentity(statIdentity(before), statIdentity(after)),
    "staging manifest directory changed during inventory",
  );
  const current = records.filter(
    ({currentBindingCount}) =>
      currentBindingCount === validationOptions.expectedMemberCount,
  );
  invariant(current.length <= 1, "multiple current post-M1 staging manifests exist");
  return {
    directory: {
      absolutePath: directoryPath,
      path: STAGING_MANIFEST_DIRECTORY,
      stat: statIdentity(after),
      names,
    },
    records,
    current: current[0] ?? null,
  };
}

async function assertDirectoryUnchanged(directory) {
  const current = await lstat(directory.absolutePath, {bigint: true});
  invariant(
    current.isDirectory() &&
      !current.isSymbolicLink() &&
      sameStatIdentity(directory.stat, statIdentity(current)),
    `${directory.path}: directory changed after preflight`,
  );
  const names = (await readdir(directory.absolutePath)).sort();
  invariant(
    JSON.stringify(names) === JSON.stringify(directory.names),
    `${directory.path}: directory entries changed after preflight`,
  );
}

async function assertPathsAbsent(projectRoot, relativePaths) {
  for (const relativePath of relativePaths) {
    const absolutePath = resolveProjectPath(
      projectRoot,
      relativePath,
      `${relativePath}: negative evidence guard`,
    );
    await assertOrdinaryAncestorTree(
      projectRoot,
      absolutePath,
      `${relativePath}: negative evidence guard`,
    );
    invariant(
      await lstatOrNull(absolutePath) === null,
      `${relativePath}: expected current evidence index to remain absent`,
    );
  }
}

function expectedPhysicalSwfPath(member) {
  return "source-assets/flash/HELP MATH_ORIGINAL FILES/" + member.source.path;
}

async function loadMember({
  projectRoot,
  member,
  operatorMaps,
  stagingMaps,
  prepareMaps,
  stagingInventory,
}) {
  const workspace = `migrations/${member.animationId}`;
  const manifest = await readFileRecord(
    projectRoot,
    `${workspace}/${MANIFEST_RELATIVE}`,
    {json: true, expectedMode: 0o644, label: `${member.animationId}: current manifest`},
  );
  const m1Receipt = await readFileRecord(
    projectRoot,
    `${workspace}/${M1_RECEIPT_RELATIVE}`,
    {json: true, expectedMode: 0o644, label: `${member.animationId}: M1 receipt`},
  );
  validateCurrentManifest(manifest.document, member);
  validateCurrentM1Receipt(m1Receipt.document, member);
  const receiptManifest = m1Receipt.document.outputs?.migrationManifest?.after;
  invariant(
    receiptManifest?.path === manifest.path &&
      receiptManifest.exists === true &&
      receiptManifest.bytes === Number(manifest.stat.size) &&
      receiptManifest.sha256 === manifest.sha256,
    `${member.animationId}: M1 receipt does not bind current manifest`,
  );

  const operatorRow = operatorMaps.queue.get(member.animationId) ??
    operatorMaps.noFla.get(member.animationId);
  const stagingRow = stagingMaps.entries.get(member.animationId) ??
    stagingMaps.noFla.get(member.animationId);
  const prepareRow = prepareMaps.queue.get(member.animationId) ??
    prepareMaps.noFla.get(member.animationId);
  const flaBacked = stagingMaps.entries.has(member.animationId);
  invariant(
    flaBacked === operatorMaps.queue.has(member.animationId) &&
      flaBacked === prepareMaps.queue.has(member.animationId),
    `${member.animationId}: historical FLA/SWF-only classifications disagree`,
  );
  if (flaBacked) {
    invariant(
      operatorRow.sourcePair?.sourceKind === "fla+swf" &&
        operatorRow.sourcePair.fla?.file === stagingRow.sourceFla?.file &&
        operatorRow.sourcePair.fla.sha256 === stagingRow.sourceFla.sha256 &&
        operatorRow.sourcePair.swf?.file === stagingRow.sourceSwf?.file &&
        operatorRow.sourcePair.swf.sha256 === stagingRow.sourceSwf.sha256 &&
        operatorRow.releaseStagingCopy?.file === stagingRow.workingCopy?.file &&
        operatorRow.releaseStagingCopy.sha256 ===
          stagingRow.workingCopy.sha256 &&
        prepareRow.sourceFla?.file === stagingRow.sourceFla.file &&
        prepareRow.sourceFla.sha256 === stagingRow.sourceFla.sha256 &&
        prepareRow.sourceSwf?.file === stagingRow.sourceSwf.file &&
        prepareRow.sourceSwf.sha256 === stagingRow.sourceSwf.sha256 &&
        prepareRow.workingCopy?.file === stagingRow.workingCopy.file &&
        prepareRow.workingCopy.sha256 === stagingRow.workingCopy.sha256,
      `${member.animationId}: historical FLA staging rows disagree`,
    );
  } else {
    invariant(
      operatorRow.sourceSwf?.file === stagingRow.sourceSwf?.file &&
        operatorRow.sourceSwf.sha256 === stagingRow.sourceSwf.sha256 &&
        prepareRow.sourceSwf?.file === stagingRow.sourceSwf.file &&
        prepareRow.sourceSwf.sha256 === stagingRow.sourceSwf.sha256,
      `${member.animationId}: historical SWF-only rows disagree`,
    );
  }

  const swfBinding = stagingRow.sourceSwf;
  invariant(
    swfBinding?.file === expectedPhysicalSwfPath(member) &&
      swfBinding.sha256 === member.source.sha256 &&
      swfBinding.sourceFreezeBound === true,
    `${member.animationId}: physical SWF source binding drifted`,
  );
  const sourceSwf = await readFileRecord(projectRoot, swfBinding.file, {
    retainContents: false,
    label: `${member.animationId}: physical source SWF`,
  });
  assertDescriptor(swfBinding, sourceSwf, `${member.animationId}: source SWF`);

  let sourceFla = null;
  let stagedFla = null;
  if (flaBacked) {
    invariant(
      stagingRow.sourceFla?.sourceFreezeBound === true &&
        stagingRow.sourceFla.flaContainer === "legacy-ole-compound" &&
        stagingRow.workingCopy?.readOnly === true &&
        stagingRow.workingCopy.byteIdenticalToSource === true &&
        stagingRow.workingCopy.separateRegularFile === true,
      `${member.animationId}: historical FLA staging declaration drifted`,
    );
    sourceFla = await readFileRecord(projectRoot, stagingRow.sourceFla.file, {
      retainContents: false,
      label: `${member.animationId}: physical source FLA`,
    });
    stagedFla = await readFileRecord(projectRoot, stagingRow.workingCopy.file, {
      expectedMode: 0o444,
      retainContents: false,
      label: `${member.animationId}: release staged FLA`,
    });
    assertDescriptor(
      stagingRow.sourceFla,
      sourceFla,
      `${member.animationId}: source FLA`,
    );
    assertDescriptor(
      stagingRow.workingCopy,
      stagedFla,
      `${member.animationId}: staged FLA`,
      {requireMode: true},
    );
    invariant(
      sourceFla.sha256 === stagedFla.sha256 &&
        Number(sourceFla.stat.size) === Number(stagedFla.stat.size) &&
        !(sourceFla.stat.dev === stagedFla.stat.dev &&
          sourceFla.stat.ino === stagedFla.stat.ino),
      `${member.animationId}: staged FLA is not a separate byte-identical copy`,
    );
  } else {
    invariant(
      stagingRow.disposition === "swf-only-no-fla-in-catalog-or-workspace" &&
        stagingRow.authoringAuditApplicability ===
          "not-applicable-no-fla-source" &&
        stagingRow.inferredAuthoringStructureAllowed === false &&
        stagingRow.strictAcceptanceEffect === false,
      `${member.animationId}: SWF-only source-gap disposition drifted`,
    );
  }

  const historicalWorkspaceBinding = stagingRow.workspaceManifest;
  const receiptPreimage =
    m1Receipt.document.outputs.migrationManifest.before;
  invariant(
    historicalWorkspaceBinding?.file === manifest.path &&
      SHA256_PATTERN.test(historicalWorkspaceBinding.sha256 || "") &&
      historicalWorkspaceBinding.sha256 !== manifest.sha256 &&
      receiptPreimage.path === historicalWorkspaceBinding.file &&
      receiptPreimage.exists === true &&
      receiptPreimage.bytes === historicalWorkspaceBinding.bytes &&
      receiptPreimage.sha256 === historicalWorkspaceBinding.sha256,
    `${member.animationId}: historical stage -> M1 before lineage is not closed`,
  );
  const currentStaging = stagingInventory.current;
  const currentRow = currentStaging
    ? currentStaging.maps.entries.get(member.animationId) ??
      currentStaging.maps.noFla.get(member.animationId)
    : null;
  const records = [
    manifest,
    m1Receipt,
    sourceSwf,
    ...(sourceFla ? [sourceFla] : []),
    ...(stagedFla ? [stagedFla] : []),
  ];
  return {
    member,
    manifest,
    m1Receipt,
    sourceSwf,
    sourceFla,
    stagedFla,
    flaBacked,
    operatorRow,
    stagingRow,
    prepareRow,
    historicalWorkspaceBinding,
    currentStaging,
    currentRow,
    records,
  };
}

function outputRelative(animationId) {
  invariant(SAFE_ID.test(animationId || ""), "invalid animation ID");
  return `migrations/${animationId}/audit/machine/` +
    G5_L5_POST_M1_ANIMATE_OUTPUT_NAME;
}

function rowFingerprint(row) {
  return sha256(Buffer.from(stableJson(row)));
}

function buildMemberDocument({
  loaded,
  generator,
  releaseFingerprint,
  historicalReportJson,
  historicalReportMarkdown,
  historicalManifest,
  historicalPrepareQueue,
  stagingInventory,
}) {
  const {
    member,
    manifest,
    m1Receipt,
    sourceSwf,
    sourceFla,
    stagedFla,
    flaBacked,
    operatorRow,
    stagingRow,
    prepareRow,
    historicalWorkspaceBinding,
    currentStaging,
    currentRow,
  } = loaded;
  const currentStagingDescriptor = currentStaging
    ? descriptor(currentStaging.record)
    : null;
  const document = {
    schemaVersion: 1,
    artifactType: "g5-l5-post-m1-animate-authoring-successor",
    evidenceState: flaBacked
      ? "fla-backed-authoring-audit-pending-post-m1-metadata-only"
      : "swf-only-authoring-source-gap-post-m1-metadata-only",
    generatedBy: {
      script: GENERATOR_RELATIVE,
      sha256: generator.sha256,
      deterministic: true,
    },
    releaseId: G5_L5_POST_M1_ANIMATE_RELEASE_ID,
    animationId: member.animationId,
    releaseMembership: {
      ordinal: member.ordinal,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
      releaseFingerprintSha256: releaseFingerprint,
    },
    currentBindings: {
      migrationManifest: descriptor(manifest),
      m1StaticReconciliationReceipt: descriptor(m1Receipt),
      physicalSourceSwf: descriptor(sourceSwf),
      physicalSourceFla: sourceFla ? descriptor(sourceFla) : null,
      releaseReadOnlyFlaCopy: stagedFla ? descriptor(stagedFla) : null,
    },
    historicalLineage: {
      operatorReadinessReportJson: descriptor(historicalReportJson),
      operatorReadinessReportMarkdown: descriptor(historicalReportMarkdown),
      stagingManifest: descriptor(historicalManifest),
      prepareOnlyQueue: descriptor(historicalPrepareQueue),
      operatorRowSha256: rowFingerprint(operatorRow),
      stagingRowSha256: rowFingerprint(stagingRow),
      prepareQueueRowSha256: rowFingerprint(prepareRow),
      historicalArtifactsModified: false,
      historicalWorkspaceManifestBinding: {
        path: historicalWorkspaceBinding.file,
        bytes: historicalWorkspaceBinding.bytes,
        sha256: historicalWorkspaceBinding.sha256,
        matchesCurrentPostM1Manifest: false,
      },
    },
    currentStagingLineage: {
      candidateManifestCount: stagingInventory.records.length,
      candidateManifestSetSha256: sha256(Buffer.from(stableJson(
        stagingInventory.records.map(({record, currentBindingCount}) => ({
          ...descriptor(record),
          currentWorkspaceBindingCount: currentBindingCount,
        })),
      ))),
      currentPostM1Manifest: currentStagingDescriptor,
      currentMemberRowSha256: currentRow ? rowFingerprint(currentRow) : null,
      status: currentStaging
        ? "current-post-m1-staging-manifest-present"
        : "historical-staging-present-current-post-m1-manifest-missing",
      lineageGap: !currentStaging,
      lineageGapCode: currentStaging
        ? null
        : "current-post-m1-staging-manifest-missing",
      preservedPhysicalStagingEvidenceUsableForPlanning:
        flaBacked && stagedFla !== null,
      authoringAuditEffect: false,
    },
    currentAuthoringResultIndex: {
      path: CURRENT_RESULT_INDEX,
      status: "absent",
      validatedAuthoringAuditCount: 0,
    },
    sourceDisposition: {
      sourceKind: flaBacked ? "fla+swf" : "swf-only",
      status: flaBacked
        ? "audit-pending"
        : "source-gap-no-fla",
      flaAuthoringSourcePresent: flaBacked,
      releaseReadOnlyFlaCopyVerified: flaBacked,
      swfSourceVerified: true,
      authoringAuditApplicable: flaBacked,
      authoringAuditComplete: false,
      inferredAuthoringStructureAllowed: false,
      shippedSwfExecuted: false,
      flaSwfEquivalenceProven: false,
    },
    namedOperatorRoleAssignment: null,
    emptyOperatorWorksheet: structuredClone(EMPTY_OPERATOR_WORKSHEET),
    executionGate: structuredClone(EXECUTION_GATE),
    counts: {
      namedOperators: 0,
      sessions: 0,
      guiExecutions: 0,
      conversionWarningAcknowledgements: 0,
      authoringAuditReceipts: 0,
      authoringAuditsComplete: 0,
      implementationsAuthorized: 0,
      acceptances: 0,
      strictComplete: 0,
      publications: 0,
    },
    acceptanceNeutral: true,
    acceptanceEffects: structuredClone(ACCEPTANCE_EFFECTS),
    strictAcceptanceEffect:
      "none; post-M1 Animate authoring metadata successor only",
  };
  return withFingerprint(document, "artifactFingerprintSha256");
}

export function validateG5L5PostM1AnimateAuthoringSuccessor(
  document,
  member,
  {
    expectedReleaseFingerprint =
      G5_L5_POST_M1_ANIMATE_RELEASE_FINGERPRINT_SHA256,
  } = {},
) {
  const id = member.animationId;
  invariant(
    document?.schemaVersion === 1 &&
      document.artifactType ===
        "g5-l5-post-m1-animate-authoring-successor" &&
      document.releaseId === G5_L5_POST_M1_ANIMATE_RELEASE_ID &&
      document.animationId === id &&
      [
        "fla-backed-authoring-audit-pending-post-m1-metadata-only",
        "swf-only-authoring-source-gap-post-m1-metadata-only",
      ].includes(document.evidenceState),
    `${id}: Animate successor identity drifted`,
  );
  invariant(
    document.generatedBy?.script === GENERATOR_RELATIVE &&
      SHA256_PATTERN.test(document.generatedBy.sha256 || "") &&
      document.generatedBy.deterministic === true &&
      document.releaseMembership?.ordinal === member.ordinal &&
      document.releaseMembership.assetId === member.assetId &&
      document.releaseMembership.releaseRole === member.releaseRole &&
      document.releaseMembership.batchId === member.batchId &&
      document.releaseMembership.shardId === member.shardId &&
      document.releaseMembership.releaseFingerprintSha256 ===
        expectedReleaseFingerprint,
    `${id}: generated or release binding drifted`,
  );
  for (const key of [
    "migrationManifest",
    "m1StaticReconciliationReceipt",
    "physicalSourceSwf",
  ]) {
    const binding = document.currentBindings?.[key];
    invariant(
      typeof binding?.path === "string" &&
        Number.isSafeInteger(binding.bytes) &&
        binding.bytes > 0 &&
        SHA256_PATTERN.test(binding.sha256 || ""),
      `${id}: current ${key} binding drifted`,
    );
  }
  const flaBacked = document.sourceDisposition?.sourceKind === "fla+swf";
  invariant(
    (flaBacked
      ? document.evidenceState ===
          "fla-backed-authoring-audit-pending-post-m1-metadata-only" &&
        document.sourceDisposition.status === "audit-pending" &&
        document.sourceDisposition.flaAuthoringSourcePresent === true &&
        document.sourceDisposition.releaseReadOnlyFlaCopyVerified === true &&
        document.sourceDisposition.authoringAuditApplicable === true &&
        document.currentBindings.physicalSourceFla !== null &&
        document.currentBindings.releaseReadOnlyFlaCopy !== null
      : document.evidenceState ===
          "swf-only-authoring-source-gap-post-m1-metadata-only" &&
        document.sourceDisposition.status === "source-gap-no-fla" &&
        document.sourceDisposition.flaAuthoringSourcePresent === false &&
        document.sourceDisposition.releaseReadOnlyFlaCopyVerified === false &&
        document.sourceDisposition.authoringAuditApplicable === false &&
        document.currentBindings.physicalSourceFla === null &&
        document.currentBindings.releaseReadOnlyFlaCopy === null) &&
      document.sourceDisposition.authoringAuditComplete === false &&
      document.sourceDisposition.inferredAuthoringStructureAllowed === false &&
      document.sourceDisposition.shippedSwfExecuted === false &&
      document.sourceDisposition.flaSwfEquivalenceProven === false,
    `${id}: source disposition drifted`,
  );
  invariant(
    document.historicalLineage?.historicalArtifactsModified === false &&
      document.historicalLineage.historicalWorkspaceManifestBinding
        ?.matchesCurrentPostM1Manifest === false &&
      document.currentStagingLineage?.lineageGap ===
        (document.currentStagingLineage.currentPostM1Manifest === null) &&
      document.currentStagingLineage.authoringAuditEffect === false,
    `${id}: historical/current staging lineage drifted`,
  );
  invariant(
    document.currentAuthoringResultIndex?.path === CURRENT_RESULT_INDEX &&
      document.currentAuthoringResultIndex.status === "absent" &&
      document.currentAuthoringResultIndex.validatedAuthoringAuditCount === 0,
    `${id}: current authoring result-index boundary drifted`,
  );
  invariant(
    document.namedOperatorRoleAssignment === null &&
      Object.values(document.counts ?? {}).every((value) => value === 0),
    `${id}: operator, execution, or authority count is nonzero`,
  );
  assertEmptyWorksheet(document.emptyOperatorWorksheet, id);
  assertExecutionGate(document.executionGate, id);
  invariant(document.acceptanceNeutral === true, `${id}: not acceptance neutral`);
  assertAllFalse(document.acceptanceEffects, id);
  invariant(
    document.strictAcceptanceEffect ===
      "none; post-M1 Animate authoring metadata successor only" &&
      SHA256_PATTERN.test(document.artifactFingerprintSha256 || "") &&
      document.artifactFingerprintSha256 ===
        fingerprintDocument(document, "artifactFingerprintSha256"),
    `${id}: strict effect or fingerprint drifted`,
  );
  return true;
}

function renderMemberOutput(member, document) {
  const rendered = stableJson(document);
  const bytes = Buffer.from(rendered);
  return {
    member,
    document,
    relativePath: outputRelative(member.animationId),
    bytes,
    sha256: sha256(bytes),
  };
}

function buildAggregateReport({
  release,
  releaseFingerprint,
  releaseRecord,
  generator,
  historicalReportJson,
  historicalReportMarkdown,
  historicalManifest,
  historicalPrepareQueue,
  stagingInventory,
  memberOutputs,
}) {
  const flaCount = memberOutputs.filter(
    ({document}) => document.sourceDisposition.sourceKind === "fla+swf",
  ).length;
  const swfOnlyCount = memberOutputs.length - flaCount;
  const gapCount = memberOutputs.filter(
    ({document}) => document.currentStagingLineage.lineageGap,
  ).length;
  const report = {
    schemaVersion: 1,
    reportType: "g5-l5-post-m1-animate-authoring-readiness",
    evidenceState:
      "post-m1-metadata-only-no-animate-no-operator-no-authority",
    generatedBy: {
      script: GENERATOR_RELATIVE,
      sha256: generator.sha256,
      deterministic: true,
    },
    releaseId: G5_L5_POST_M1_ANIMATE_RELEASE_ID,
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
      historicalOperatorReadinessJson: descriptor(historicalReportJson),
      historicalOperatorReadinessMarkdown: descriptor(historicalReportMarkdown),
      historicalStagingManifest: descriptor(historicalManifest),
      historicalPrepareOnlyQueue: descriptor(historicalPrepareQueue),
      stagingManifestCandidateSetSha256: sha256(Buffer.from(stableJson(
        stagingInventory.records.map(({record, currentBindingCount}) => ({
          ...descriptor(record),
          currentWorkspaceBindingCount: currentBindingCount,
        })),
      ))),
      currentAuthoringResultIndex: {
        path: CURRENT_RESULT_INDEX,
        status: "absent",
      },
    },
    lineage: {
      historicalArtifactsModified: false,
      historicalStagingManifestCandidateCount:
        stagingInventory.records.length,
      currentPostM1StagingManifestCount: stagingInventory.current ? 1 : 0,
      currentPostM1StagingManifest: stagingInventory.current
        ? descriptor(stagingInventory.current.record)
        : null,
      historicalWorkspaceBindingsCurrentCount: 0,
      historicalWorkspaceBindingsStaleCount: memberOutputs.length,
      lineageGapCount: gapCount,
      policy:
        "Historical staging manifests, queues, reports, and read-only copies remain immutable. A metadata successor records any missing current post-M1 staging lineage without fabricating or rewriting staging evidence.",
    },
    summary: {
      releaseMemberCount: memberOutputs.length,
      currentMigrationManifestCount: memberOutputs.length,
      currentM1ReceiptCount: memberOutputs.length,
      physicalSwfSourceCount: memberOutputs.length,
      flaBackedMemberCount: flaCount,
      swfOnlySourceGapCount: swfOnlyCount,
      physicalFlaSourceCount: flaCount,
      verifiedReadOnlyStagedFlaCount: flaCount,
      authoringAuditPendingCount: flaCount,
      authoringSourceGapCount: swfOnlyCount,
      successorArtifactCount: memberOutputs.length,
      emptyWorksheetCount: memberOutputs.length,
      nonRunnableCount: memberOutputs.length,
      namedOperatorCount: 0,
      sessionCount: 0,
      guiExecutionCount: 0,
      conversionWarningAcknowledgementCount: 0,
      authoringAuditReceiptCount: 0,
      authoringAuditCompleteCount: 0,
      implementationAuthorizedCount: 0,
      acceptedReviewCount: 0,
      ownerAcceptedCount: 0,
      strictCompleteCount: 0,
      publishedCount: 0,
    },
    items: memberOutputs.map(
      ({member, document, relativePath, bytes, sha256: digest}) => ({
        ordinal: member.ordinal,
        animationId: member.animationId,
        assetId: member.assetId,
        releaseRole: member.releaseRole,
        shardId: member.shardId,
        sourceKind: document.sourceDisposition.sourceKind,
        planningState: document.sourceDisposition.status,
        currentStagingLineageStatus:
          document.currentStagingLineage.status,
        lineageGap: document.currentStagingLineage.lineageGap,
        successorArtifact: {
          path: relativePath,
          bytes: bytes.length,
          sha256: digest,
          artifactFingerprintSha256:
            document.artifactFingerprintSha256,
        },
        runnable: false,
        namedOperatorCount: 0,
        sessionCount: 0,
        guiExecutionCount: 0,
        authoringAuditComplete: false,
      }),
    ),
    acceptanceNeutral: true,
    acceptanceEffects: structuredClone(ACCEPTANCE_EFFECTS),
    strictAcceptanceEffect:
      "none; post-M1 Animate authoring metadata readiness only",
  };
  return withFingerprint(report, "reportFingerprintSha256");
}

export function validateG5L5PostM1AnimateAuthoringReport(
  report,
  release,
  {
    expectedMemberCount = EXPECTED_MEMBER_COUNT,
    expectedPageCount = EXPECTED_PAGE_COUNT,
    expectedShellCount = EXPECTED_SHELL_COUNT,
    expectedFlaCount = EXPECTED_FLA_COUNT,
    expectedSwfOnlyCount = EXPECTED_SWF_ONLY_COUNT,
    expectedReleaseFingerprint =
      G5_L5_POST_M1_ANIMATE_RELEASE_FINGERPRINT_SHA256,
  } = {},
) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l5-post-m1-animate-authoring-readiness" &&
      report.evidenceState ===
        "post-m1-metadata-only-no-animate-no-operator-no-authority" &&
      report.releaseId === G5_L5_POST_M1_ANIMATE_RELEASE_ID &&
      report.release?.titleDisplay === release.titleDisplay &&
      report.release.publicationMode === "atomic" &&
      report.release.memberCount === expectedMemberCount &&
      report.release.activePageCount === expectedPageCount &&
      report.release.shellCount === expectedShellCount &&
      report.release.releaseFingerprintSha256 ===
        expectedReleaseFingerprint,
    "post-M1 Animate report identity or release scope drifted",
  );
  const summary = report.summary;
  for (const key of [
    "releaseMemberCount",
    "currentMigrationManifestCount",
    "currentM1ReceiptCount",
    "physicalSwfSourceCount",
    "successorArtifactCount",
    "emptyWorksheetCount",
    "nonRunnableCount",
  ]) {
    invariant(summary?.[key] === expectedMemberCount, `report ${key} drifted`);
  }
  for (const key of [
    "flaBackedMemberCount",
    "physicalFlaSourceCount",
    "verifiedReadOnlyStagedFlaCount",
    "authoringAuditPendingCount",
  ]) {
    invariant(summary?.[key] === expectedFlaCount, `report ${key} drifted`);
  }
  for (const key of ["swfOnlySourceGapCount", "authoringSourceGapCount"]) {
    invariant(summary?.[key] === expectedSwfOnlyCount, `report ${key} drifted`);
  }
  for (const key of [
    "namedOperatorCount",
    "sessionCount",
    "guiExecutionCount",
    "conversionWarningAcknowledgementCount",
    "authoringAuditReceiptCount",
    "authoringAuditCompleteCount",
    "implementationAuthorizedCount",
    "acceptedReviewCount",
    "ownerAcceptedCount",
    "strictCompleteCount",
    "publishedCount",
  ]) {
    invariant(summary?.[key] === 0, `report ${key} must remain zero`);
  }
  invariant(
    report.lineage?.historicalArtifactsModified === false &&
      report.lineage.historicalWorkspaceBindingsCurrentCount === 0 &&
      report.lineage.historicalWorkspaceBindingsStaleCount ===
        expectedMemberCount &&
      report.lineage.currentPostM1StagingManifestCount >= 0 &&
      report.lineage.currentPostM1StagingManifestCount <= 1 &&
      report.lineage.lineageGapCount ===
        (report.lineage.currentPostM1StagingManifestCount === 0
          ? expectedMemberCount
          : 0) &&
      Array.isArray(report.items) &&
      report.items.length === expectedMemberCount &&
      report.sourceBindings?.currentAuthoringResultIndex?.path ===
        CURRENT_RESULT_INDEX &&
      report.sourceBindings.currentAuthoringResultIndex.status === "absent",
    "post-M1 Animate lineage or item count drifted",
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
        item.runnable === false &&
        item.namedOperatorCount === 0 &&
        item.sessionCount === 0 &&
        item.guiExecutionCount === 0 &&
        item.authoringAuditComplete === false,
      `${member.animationId}: aggregate item drifted`,
    );
  }
  invariant(report.acceptanceNeutral === true, "aggregate is not neutral");
  assertAllFalse(report.acceptanceEffects, "aggregate report");
  invariant(
    report.strictAcceptanceEffect ===
      "none; post-M1 Animate authoring metadata readiness only" &&
      SHA256_PATTERN.test(report.reportFingerprintSha256 || "") &&
      report.reportFingerprintSha256 ===
        fingerprintDocument(report, "reportFingerprintSha256"),
    "aggregate strict effect or fingerprint drifted",
  );
  return true;
}

function renderMarkdown(report) {
  const rows = report.items.map((item) =>
    `| ${item.ordinal} | \`${item.animationId}\` | ${item.sourceKind} | ` +
    `${item.planningState} | ${item.lineageGap ? "yes" : "no"} |`,
  ).join("\n");
  return `# G5 L5 post-M1 Animate authoring readiness

State: **metadata-only; no Animate, GUI, operator, session, audit completion, or authority**

This successor binds all **${report.release.memberCount}** release members to their current post-M1 migration manifests and M1 reconciliation receipts while preserving the earlier staging manifests, queues, reports, and read-only FLA copies as immutable historical evidence.

## Current counts

| Measure | Count |
|---|---:|
| Release members | ${report.summary.releaseMemberCount} |
| FLA-backed, audit pending | ${report.summary.authoringAuditPendingCount} |
| SWF-only authoring source gaps | ${report.summary.authoringSourceGapCount} |
| Verified 0444 release-staged FLA copies | ${report.summary.verifiedReadOnlyStagedFlaCount} |
| Current post-M1 staging manifests | ${report.lineage.currentPostM1StagingManifestCount} |
| Members with staging-lineage gap | ${report.lineage.lineageGapCount} |
| Named operators / sessions / GUI executions | 0 / 0 / 0 |
| Authoring audits complete | 0 |
| Strict complete / published | 0 / 0 |

The historical staging artifacts remain valid only for the source and read-only copy facts they prove. A stale workspace-manifest binding is recorded as a lineage gap; it is not repaired by inventing a new staging manifest.

## Member successor set

| # | Animation | Source | Planning state | Lineage gap |
|---:|---|---|---|---|
${rows}

No Animate process was launched, no dialog was clicked, no document was saved, converted, published, or exported, and no implementation, review, acceptance, strict-completion, or publication authority was created. Report fingerprint: \`${report.reportFingerprintSha256}\`.
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
  const record = await readFileRecord(projectRoot, relativePath, {
    expectedMode: 0o644,
    label,
  });
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

async function assertInputsUnchanged(
  projectRoot,
  records,
  directory,
  absentPaths,
) {
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
  await assertDirectoryUnchanged(directory);
  await assertPathsAbsent(projectRoot, absentPaths);
}

function assertOwnedExistingOutput(output, context) {
  if (!output.snapshot.exists) return;
  if (output.kind === "member-json") {
    let document;
    try {
      document = JSON.parse(output.snapshot.contents.toString("utf8"));
    } catch {
      throw new Error(`${output.relativePath}: refusing non-JSON output`);
    }
    validateG5L5PostM1AnimateAuthoringSuccessor(
      document,
      output.member,
      {expectedReleaseFingerprint: context.releaseFingerprint},
    );
  } else if (output.kind === "report-json") {
    let report;
    try {
      report = JSON.parse(output.snapshot.contents.toString("utf8"));
    } catch {
      throw new Error(`${output.relativePath}: refusing non-JSON report`);
    }
    validateG5L5PostM1AnimateAuthoringReport(
      report,
      context.release,
      context.validationOptions,
    );
  } else {
    invariant(
      output.snapshot.contents.toString("utf8").startsWith(
        "# G5 L5 post-M1 Animate authoring readiness\n",
      ),
      `${output.relativePath}: refusing unmanaged Markdown`,
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
    `${candidate}: staged bytes changed`,
  );
}

async function removeOwned(candidate, expectedSha256) {
  const information = await lstatOrNull(candidate);
  if (!information) return;
  invariant(
    information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1n,
    `${candidate}: refusing to remove changed transaction file`,
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
  const errors = [];
  for (const transaction of [...transactions].reverse()) {
    try {
      if (transaction.committed) {
        const current = await readFile(transaction.snapshot.absolutePath);
        invariant(
          sha256(current) === transaction.desiredSha256,
          `${transaction.relativePath}: committed output changed before rollback`,
        );
        if (transaction.snapshot.exists) {
          await rename(transaction.backupPath, transaction.snapshot.absolutePath);
        } else {
          await unlink(transaction.snapshot.absolutePath);
        }
      }
      await cleanupTransaction(transaction);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) {
    throw new AggregateError(
      [originalError, ...errors],
      `post-M1 Animate transaction had ${errors.length} rollback failure(s)`,
    );
  }
  throw originalError;
}

async function commitOutputs(
  projectRoot,
  outputs,
  inputRecords,
  inputDirectory,
  absentPaths,
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
    await assertInputsUnchanged(
      projectRoot,
      inputRecords,
      inputDirectory,
      absentPaths,
    );
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
      await assertInputsUnchanged(
        projectRoot,
        inputRecords,
        inputDirectory,
        absentPaths,
      );
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
      await assertInputsUnchanged(
        projectRoot,
        inputRecords,
        inputDirectory,
        absentPaths,
      );
      if (transaction.snapshot.exists) {
        await rename(transaction.stagePath, transaction.snapshot.absolutePath);
      } else {
        await link(transaction.stagePath, transaction.snapshot.absolutePath);
        await unlink(transaction.stagePath);
      }
      transaction.committed = true;
      const committed = await lstat(
        transaction.snapshot.absolutePath,
        {bigint: true},
      );
      invariant(
        permissionMode(committed) === 0o644 &&
          sha256(await readFile(transaction.snapshot.absolutePath)) ===
            transaction.desiredSha256,
        `${transaction.relativePath}: committed mode or bytes drifted`,
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

export async function materializeG5L5PostM1AnimateAuthoringSuccessors({
  projectRoot = DEFAULT_PROJECT_ROOT,
  mode = "dry-run",
  expectedMemberCount = EXPECTED_MEMBER_COUNT,
  expectedPageCount = EXPECTED_PAGE_COUNT,
  expectedShellCount = EXPECTED_SHELL_COUNT,
  expectedFlaCount = EXPECTED_FLA_COUNT,
  expectedSwfOnlyCount = EXPECTED_SWF_ONLY_COUNT,
  expectedReleaseFingerprint =
    G5_L5_POST_M1_ANIMATE_RELEASE_FINGERPRINT_SHA256,
  transactionHooks = {},
} = {}) {
  const root = await realpath(path.resolve(projectRoot));
  invariant(["dry-run", "apply", "check"].includes(mode), "invalid mode");
  invariant(
    Number.isSafeInteger(expectedMemberCount) &&
      expectedMemberCount > 0 &&
      expectedPageCount + expectedShellCount === expectedMemberCount &&
      expectedFlaCount + expectedSwfOnlyCount === expectedMemberCount,
    "expected release counts are inconsistent",
  );
  invariant(
    SHA256_PATTERN.test(expectedReleaseFingerprint || ""),
    "expected release fingerprint is invalid",
  );
  const validationOptions = {
    expectedMemberCount,
    expectedPageCount,
    expectedShellCount,
    expectedFlaCount,
    expectedSwfOnlyCount,
    expectedReleaseFingerprint,
  };
  const absentPaths = [CURRENT_RESULT_INDEX];
  await assertPathsAbsent(root, absentPaths);
  const [
    releaseRecord,
    generator,
    historicalReportJson,
    historicalReportMarkdown,
  ] = await Promise.all([
    readFileRecord(root, RELEASE_RELATIVE, {
      json: true,
      expectedMode: 0o644,
      label: "G5 L5 release manifest",
    }),
    readFileRecord(root, GENERATOR_RELATIVE, {
      expectedMode: 0o644,
      label: "post-M1 Animate successor generator",
    }),
    readFileRecord(root, HISTORICAL_REPORT_JSON, {
      json: true,
      expectedMode: 0o644,
      label: "historical Animate operator report JSON",
    }),
    readFileRecord(root, HISTORICAL_REPORT_MARKDOWN, {
      expectedMode: 0o644,
      label: "historical Animate operator report Markdown",
    }),
  ]);
  const release = selectRelease(releaseRecord.document, validationOptions);
  const releaseFingerprint = expectedReleaseFingerprint;
  const operatorMaps = validateHistoricalOperatorReport(
    historicalReportJson.document,
    release,
    validationOptions,
  );
  invariant(
    historicalReportMarkdown.contents.toString("utf8").startsWith(
      "# G5 L5 Animate authoring operator readiness\n",
    ) &&
      historicalReportMarkdown.contents.toString("utf8").includes(
        historicalReportJson.sha256,
      ),
    "historical Animate Markdown does not bind its JSON",
  );
  const oldManifestBinding =
    historicalReportJson.document.inputs?.releaseStagingManifest;
  const oldQueueBinding =
    historicalReportJson.document.inputs?.releasePrepareOnlyQueue;
  const [historicalManifest, historicalPrepareQueue] = await Promise.all([
    readFileRecord(root, oldManifestBinding?.file, {
      json: true,
      expectedMode: 0o444,
      label: "historical release staging manifest",
    }),
    readFileRecord(root, oldQueueBinding?.file, {
      json: true,
      expectedMode: 0o444,
      label: "historical prepare-only queue",
    }),
  ]);
  assertDescriptor(
    oldManifestBinding,
    historicalManifest,
    "historical release staging manifest",
    {requireMode: true},
  );
  assertDescriptor(
    oldQueueBinding,
    historicalPrepareQueue,
    "historical prepare-only queue",
    {requireMode: true},
  );
  invariant(
    path.basename(historicalManifest.path, ".json") ===
      historicalManifest.sha256 &&
      path.basename(historicalPrepareQueue.path, ".json") ===
        historicalPrepareQueue.sha256,
    "historical staging content address drifted",
  );
  const stagingMaps = validateStagingManifest(
    historicalManifest.document,
    release,
    validationOptions,
    "historical staging manifest",
  );
  const prepareMaps = validatePrepareQueue(
    historicalPrepareQueue.document,
    release,
    validationOptions,
  );
  assertDescriptor(
    historicalPrepareQueue.document.stagingManifest,
    historicalManifest,
    "prepare-only queue staging-manifest lineage",
  );

  const currentManifestRecords = new Map();
  for (const member of release.members) {
    const relativePath =
      `migrations/${member.animationId}/${MANIFEST_RELATIVE}`;
    currentManifestRecords.set(
      member.animationId,
      await readFileRecord(root, relativePath, {
        json: true,
        expectedMode: 0o644,
        label: `${member.animationId}: current manifest pre-inventory`,
      }),
    );
  }
  const stagingInventory = await readStagingManifestInventory(
    root,
    release,
    currentManifestRecords,
    validationOptions,
  );
  const loadedMembers = [];
  for (const member of release.members) {
    const loaded = await loadMember({
      projectRoot: root,
      member,
      operatorMaps,
      stagingMaps,
      prepareMaps,
      stagingInventory,
    });
    invariant(
      loaded.manifest.sha256 ===
        currentManifestRecords.get(member.animationId).sha256,
      `${member.animationId}: manifest changed between inventory and load`,
    );
    loadedMembers.push(loaded);
  }
  const observedFlaCount =
    loadedMembers.filter(({flaBacked}) => flaBacked).length;
  invariant(
    observedFlaCount === expectedFlaCount &&
      loadedMembers.length - observedFlaCount === expectedSwfOnlyCount,
    "observed FLA/SWF-only counts drifted",
  );

  const memberOutputs = loadedMembers.map((loaded) => {
    const document = buildMemberDocument({
      loaded,
      generator,
      releaseFingerprint,
      historicalReportJson,
      historicalReportMarkdown,
      historicalManifest,
      historicalPrepareQueue,
      stagingInventory,
    });
    validateG5L5PostM1AnimateAuthoringSuccessor(document, loaded.member, {
      expectedReleaseFingerprint,
    });
    return renderMemberOutput(loaded.member, document);
  });
  const report = buildAggregateReport({
    release,
    releaseFingerprint,
    releaseRecord,
    generator,
    historicalReportJson,
    historicalReportMarkdown,
    historicalManifest,
    historicalPrepareQueue,
    stagingInventory,
    memberOutputs,
  });
  validateG5L5PostM1AnimateAuthoringReport(
    report,
    release,
    validationOptions,
  );
  const markdown = renderMarkdown(report);
  const desired = [
    ...memberOutputs.map((output) => ({
      kind: "member-json",
      member: output.member,
      relativePath: output.relativePath,
      desiredBytes: output.bytes,
    })),
    {
      kind: "report-json",
      relativePath: `${G5_L5_POST_M1_ANIMATE_REPORT_PREFIX}.json`,
      desiredBytes: Buffer.from(stableJson(report)),
    },
    {
      kind: "report-markdown",
      relativePath: `${G5_L5_POST_M1_ANIMATE_REPORT_PREFIX}.md`,
      desiredBytes: Buffer.from(markdown),
    },
  ];
  invariant(
    desired.length === expectedMemberCount + 2 &&
      new Set(desired.map(({relativePath}) => relativePath)).size ===
        desired.length,
    "post-M1 Animate output set is incomplete or duplicated",
  );
  const context = {release, releaseFingerprint, validationOptions};
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
    historicalReportJson,
    historicalReportMarkdown,
    historicalManifest,
    historicalPrepareQueue,
    ...currentManifestRecords.values(),
    ...stagingInventory.records.map(({record}) => record),
    ...loadedMembers.flatMap(({records}) => records),
  ];
  const uniqueInputs = [
    ...new Map(inputRecords.map((record) => [record.absolutePath, record]))
      .values(),
  ];
  await assertInputsUnchanged(
    root,
    uniqueInputs,
    stagingInventory.directory,
    absentPaths,
  );
  if (mode === "check") {
    invariant(
      stale.length === 0,
      `post-M1 Animate outputs are missing or stale (${stale.length} file(s))`,
    );
  } else if (mode === "apply" && stale.length > 0) {
    await commitOutputs(
      root,
      outputs,
      uniqueInputs,
      stagingInventory.directory,
      absentPaths,
      transactionHooks,
    );
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
    await assertInputsUnchanged(
      root,
      uniqueInputs,
      stagingInventory.directory,
      absentPaths,
    );
  }
  return {
    action: mode === "check"
      ? "verified"
      : mode === "apply"
        ? stale.length ? "applied" : "already-current"
        : "dry-run",
    releaseId: G5_L5_POST_M1_ANIMATE_RELEASE_ID,
    releaseFingerprintSha256: releaseFingerprint,
    memberCount: expectedMemberCount,
    flaBackedMemberCount: expectedFlaCount,
    swfOnlySourceGapCount: expectedSwfOnlyCount,
    outputCount: outputs.length,
    staleOutputCount: stale.length,
    currentPostM1StagingManifestCount: stagingInventory.current ? 1 : 0,
    stagingLineageGapCount: stagingInventory.current ? 0 : expectedMemberCount,
    verifiedReadOnlyStagedFlaCount: expectedFlaCount,
    namedOperatorCount: 0,
    sessionCount: 0,
    guiExecutionCount: 0,
    authoringAuditCompleteCount: 0,
    implementationAuthorizedCount: 0,
    acceptanceCount: 0,
    strictCompleteCount: 0,
    published: false,
    historicalArtifactsModified: 0,
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
    if (["--dry-run", "--apply", "--check"].includes(argument)) {
      invariant(
        !modeSeen,
        "choose exactly one of --dry-run, --apply, or --check",
      );
      mode = argument.slice(2);
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
  migrations/<57 exact G5 L5 members>/audit/machine/${G5_L5_POST_M1_ANIMATE_OUTPUT_NAME}
  ${G5_L5_POST_M1_ANIMATE_REPORT_PREFIX}.json
  ${G5_L5_POST_M1_ANIMATE_REPORT_PREFIX}.md

Historical staging manifests, queues, copies, and operator reports are read-only.
No Animate/GUI/dialog/runtime is launched and no operator, implementation,
acceptance, strict-completion, publication, budget, or procurement authority is
created.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const result =
    await materializeG5L5PostM1AnimateAuthoringSuccessors(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
