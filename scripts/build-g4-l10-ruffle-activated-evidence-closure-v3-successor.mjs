#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {constants} from "node:fs";
import {
  chmod,
  link,
  lstat,
  open,
  readdir,
  realpath,
  unlink,
} from "node:fs/promises";
import {isDeepStrictEqual} from "node:util";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const GENERATOR_PATH =
  "scripts/build-g4-l10-ruffle-activated-evidence-closure-v3-successor.mjs";
export const TEST_PATH =
  "scripts/build-g4-l10-ruffle-activated-evidence-closure-v3-successor.test.mjs";
export const REPORT_JSON_PATH =
  "reports/g4-l10-ruffle-activated-evidence-closure-v3-successor.json";
export const REPORT_MARKDOWN_PATH =
  "reports/g4-l10-ruffle-activated-evidence-closure-v3-successor.md";

export const V2_JSON_DESCRIPTOR = Object.freeze({
  path: "reports/g4-l10-ruffle-activated-evidence-closure-v2.json",
  bytes: 265_884,
  sha256: "fade8fb8dfd4a61ee8e723e28df31c64d0eaefa02a0dafa07b155e65fc0bc8d0",
});
export const V2_MARKDOWN_DESCRIPTOR = Object.freeze({
  path: "reports/g4-l10-ruffle-activated-evidence-closure-v2.md",
  bytes: 4_693,
  sha256: "844e4fa31ca603b4cb7db770539cac162e72361f8263dbd615b60987d261019f",
});
export const HISTORICAL_V2_PACKAGE_DESCRIPTOR = Object.freeze({
  path: "package.json",
  bytes: 79_537,
  sha256: "e8272ad34234cbe8dedaf2dc529e3c95f81383b813ff0239b661c2c58d8c791c",
});
export const CURRENT_PACKAGE_DESCRIPTOR = Object.freeze({
  path: "package.json",
  bytes: 81_122,
  sha256: "a12edbbd41cb3bda4c73077db3a1ca3da300b1b00f744eac9cee1c7a1423793a",
});

const CLOSURE_ENCODING = "sorted-portable-path-nul-sha256-lf-v1";
const DESCRIPTOR_ENCODING = "sorted-canonical-json-path-bytes-sha256-v1";
const EXPECTED_RELEASE_ID = "lesson-g04-l10-perimeter-area";
const EXPECTED_RUN_ID = "l10-full-current-binding-v1-20260803";
const EXPECTED_LANGUAGES = Object.freeze(["en", "es"]);
const EXPECTED_MEMBER_COUNT = 47;
const EXPECTED_RUN_COUNT = 94;
const EXPECTED_RAW_ARTIFACT_COUNT = 282;
const EXPECTED_RAW_FILE_COUNT = 283;
const EXPECTED_V2_TOOL_FILE_COUNT = 22;
const EXPECTED_V2_RUN_TREE_DIRECTORY_COUNT = 142;
const EXPECTED_CHANGED_TOOL_PATHS = Object.freeze(["package.json"]);

export const ACCEPTANCE_EFFECT_KEYS = Object.freeze([
  "acceptance",
  "audioAcceptance",
  "authoritativeOriginalRuntimeEvidence",
  "behaviorAcceptance",
  "canonicalEvidencePromotion",
  "currentJavascriptImplementation",
  "deterministicFrameEvidence",
  "fidelityAcceptance",
  "humanVisualReview",
  "languageAcceptance",
  "lessonPublication",
  "migrationCompletion",
  "naturalTraceEvidence",
  "originalRuntimeAuthority",
  "ownerAcceptance",
  "releaseApproval",
  "rmseAcceptance",
  "runtimeExecution",
  "runtimeLaunchAuthorization",
  "strictCompletion",
  "wholeLessonIntegration",
]);

const DEFAULT_CONTEXT = Object.freeze({
  v2JsonDescriptor: V2_JSON_DESCRIPTOR,
  v2MarkdownDescriptor: V2_MARKDOWN_DESCRIPTOR,
  historicalPackageDescriptor: HISTORICAL_V2_PACKAGE_DESCRIPTOR,
  currentPackageDescriptor: CURRENT_PACKAGE_DESCRIPTOR,
  releaseId: EXPECTED_RELEASE_ID,
  runId: EXPECTED_RUN_ID,
  languages: EXPECTED_LANGUAGES,
  memberCount: EXPECTED_MEMBER_COUNT,
  runCount: EXPECTED_RUN_COUNT,
  rawArtifactCount: EXPECTED_RAW_ARTIFACT_COUNT,
  rawFileCount: EXPECTED_RAW_FILE_COUNT,
  toolFileCount: EXPECTED_V2_TOOL_FILE_COUNT,
  runTreeDirectoryCount: EXPECTED_V2_RUN_TREE_DIRECTORY_COUNT,
  changedToolPaths: EXPECTED_CHANGED_TOOL_PATHS,
});

function invariant(value, message) {
  if (!value) throw new Error(message);
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isInside(root, absolute, {allowRoot = false} = {}) {
  const relative = path.relative(root, absolute);
  return (allowRoot && relative === "") || (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function assertExactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const actual = Object.keys(value).sort(compareStrings);
  const wanted = [...expected].sort(compareStrings);
  invariant(isDeepStrictEqual(actual, wanted), `${label} keys drifted: ${actual.join(",")}`);
}

function assertDescriptor(descriptor, label) {
  assertExactKeys(descriptor, ["path", "bytes", "sha256"], label);
  invariant(typeof descriptor.path === "string" && descriptor.path.length > 0, `${label} path is missing`);
  invariant(!path.posix.isAbsolute(descriptor.path), `${label} path must be relative`);
  invariant(
    descriptor.path === path.posix.normalize(descriptor.path) &&
      descriptor.path !== ".." &&
      !descriptor.path.startsWith("../") &&
      !descriptor.path.includes("\\") &&
      !descriptor.path.includes("\0") &&
      !descriptor.path.includes("\n"),
    `${label} path is unsafe`,
  );
  invariant(Number.isSafeInteger(descriptor.bytes) && descriptor.bytes >= 0, `${label} bytes are invalid`);
  invariant(/^[a-f0-9]{64}$/.test(descriptor.sha256), `${label} SHA-256 is invalid`);
}

function descriptorFrom(relativePath, bytes) {
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

function bindingOnly(value, label) {
  const descriptor = {path: value?.path, bytes: value?.bytes, sha256: value?.sha256};
  assertDescriptor(descriptor, label);
  return descriptor;
}

function sortedObject(value) {
  if (Array.isArray(value)) return value.map(sortedObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, child]) => [key, sortedObject(child)]),
    );
  }
  return value;
}

export function stableJson(value, spaces = 0) {
  return JSON.stringify(sortedObject(value), null, spaces);
}

export function checksumClosure(entries, label = "closure") {
  invariant(Array.isArray(entries) && entries.length > 0, `${label} must not be empty`);
  const sorted = entries.map((entry, index) => {
    const descriptor = bindingOnly(entry, `${label}[${index}]`);
    return descriptor;
  }).sort((left, right) => compareStrings(left.path, right.path));
  invariant(new Set(sorted.map(({path: entryPath}) => entryPath)).size === sorted.length, `${label} paths are not unique`);
  const encoded = Buffer.from(
    sorted.map(({path: entryPath, sha256: digest}) => `${entryPath}\0${digest}\n`).join(""),
    "utf8",
  );
  return {encoding: CLOSURE_ENCODING, count: sorted.length, sha256: sha256(encoded)};
}

export function descriptorClosure(entries, label = "descriptor closure") {
  invariant(Array.isArray(entries) && entries.length > 0, `${label} must not be empty`);
  const sorted = entries.map((entry, index) => bindingOnly(entry, `${label}[${index}]`))
    .sort((left, right) => compareStrings(left.path, right.path));
  invariant(new Set(sorted.map(({path: entryPath}) => entryPath)).size === sorted.length, `${label} paths are not unique`);
  return {
    encoding: DESCRIPTOR_ENCODING,
    count: sorted.length,
    sha256: sha256(Buffer.from(`${stableJson(sorted)}\n`, "utf8")),
  };
}

function statIdentity(information) {
  return {
    dev: information.dev.toString(),
    ino: information.ino.toString(),
    mode: information.mode.toString(),
    nlink: information.nlink.toString(),
    uid: information.uid.toString(),
    gid: information.gid.toString(),
    size: information.size.toString(),
    mtimeNs: information.mtimeNs.toString(),
    ctimeNs: information.ctimeNs.toString(),
  };
}

function sameStatIdentity(left, right) {
  return isDeepStrictEqual(statIdentity(left), statIdentity(right));
}

function permissionMode(information) {
  return Number(information.mode & 0o7777n);
}

async function resolvePhysicalRoot(root) {
  const absolute = path.resolve(root);
  invariant(await realpath(absolute) === absolute, "project root must be a physical canonical directory");
  const information = await lstat(absolute, {bigint: true});
  invariant(information.isDirectory() && !information.isSymbolicLink(), "project root must be a physical directory");
  return absolute;
}

export async function readPhysicalFile({
  root,
  relativePath,
  label,
  expected = null,
  requireSingleLink = true,
  requiredMode = null,
}) {
  const resolvedRoot = await resolvePhysicalRoot(root);
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label} path is missing`);
  invariant(!path.isAbsolute(relativePath), `${label} path must be relative`);
  const absolute = path.resolve(resolvedRoot, relativePath);
  invariant(isInside(resolvedRoot, absolute), `${label} escaped the project root`);
  invariant(await realpath(absolute) === absolute, `${label} must not traverse a symbolic link`);

  const flags = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0);
  const handle = await open(absolute, flags);
  let before;
  let after;
  let bytes;
  try {
    before = await handle.stat({bigint: true});
    invariant(before.isFile(), `${label} must be a regular file`);
    if (requireSingleLink) invariant(before.nlink === 1n, `${label} must not be hard linked`);
    if (requiredMode !== null) invariant(permissionMode(before) === requiredMode, `${label} mode drifted`);
    bytes = await handle.readFile();
    after = await handle.stat({bigint: true});
  } finally {
    await handle.close();
  }
  invariant(sameStatIdentity(before, after), `${label} changed while its descriptor was open`);
  const pathnameAfter = await lstat(absolute, {bigint: true});
  invariant(
    pathnameAfter.dev === after.dev && pathnameAfter.ino === after.ino,
    `${label} pathname changed after descriptor read`,
  );
  invariant(await realpath(absolute) === absolute, `${label} parent identity changed after descriptor read`);
  const descriptor = descriptorFrom(portable(path.relative(resolvedRoot, absolute)), bytes);
  if (expected) {
    assertDescriptor(expected, `${label} expected descriptor`);
    invariant(isDeepStrictEqual(descriptor, expected), `${label} exact descriptor drifted`);
  }
  return {absolute, bytes, descriptor, stat: after};
}

async function readPhysicalJson(options) {
  const physical = await readPhysicalFile(options);
  let value;
  try {
    value = JSON.parse(physical.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${options.label} is not valid JSON: ${error.message}`);
  }
  return {...physical, value};
}

function assertFalse(value, label) {
  invariant(value === false, `${label} must remain false`);
}

function assertV2Semantics(v2, context) {
  invariant(v2?.schemaVersion === 2, "V2 schemaVersion drifted");
  invariant(
    v2.reportType === "g4-l10-ruffle-activated-fixed-capture-evidence-closure-v2",
    "V2 reportType drifted",
  );
  invariant(v2.fixedScope?.releaseId === context.releaseId, "V2 releaseId drifted");
  invariant(v2.fixedScope?.runId === context.runId, "V2 runId drifted");
  invariant(v2.fixedScope?.memberCount === context.memberCount, "V2 member count drifted");
  invariant(v2.fixedScope?.runCount === context.runCount, "V2 run count drifted");
  invariant(isDeepStrictEqual(v2.fixedScope?.languages, [...context.languages]), "V2 languages drifted");
  invariant(v2.modeFrozenRun?.fileCount === context.rawFileCount, "V2 frozen file count drifted");
  invariant(
    v2.modeFrozenRun?.directoryCount === context.runTreeDirectoryCount,
    "V2 frozen directory count drifted",
  );
  invariant(v2.modeFrozenRun?.requiredFileMode === "0444", "V2 frozen file mode drifted");
  invariant(v2.modeFrozenRun?.requiredDirectoryMode === "0555", "V2 frozen directory mode drifted");
  invariant(v2.modeFrozenRun?.exactEnumeratedFileAndDirectorySets === true, "V2 exact frozen tree flag drifted");
  invariant(v2.acceptanceBoundary?.acceptanceNeutral === true, "V2 acceptance-neutral boundary drifted");
  invariant(v2.acceptanceBoundary?.strictAcceptanceEffect === "none", "V2 strict effect drifted");
  for (const key of [
    "originalRuntimeAuthority",
    "deterministicFrameEvidence",
    "audioEvidence",
    "languageStateEvidence",
    "fidelityEvidence",
    "rmseEvidence",
    "currentJavascriptRenderer",
    "humanReview",
    "ownerReview",
    "migrationCompletion",
    "strictComplete",
    "wholeLessonIntegration",
    "publication",
  ]) assertFalse(v2.acceptanceBoundary?.[key], `V2 acceptanceBoundary.${key}`);
  assertFalse(
    v2.toolBoundary?.fullBrowserRuntimeDependencyClosure,
    "V2 full browser/runtime dependency closure",
  );
  assertFalse(
    v2.toolBoundary?.historicalServerResponseBodyClosure,
    "V2 historical server response closure",
  );
}

function deriveV2RawDescriptors(v2, context) {
  invariant(Array.isArray(v2.runs) && v2.runs.length === context.runCount, "V2 runs are incomplete");
  const keys = new Set();
  const diagnostics = [];
  const before = [];
  const after = [];
  for (const [index, run] of v2.runs.entries()) {
    invariant(Number.isInteger(run.ordinal) && run.ordinal >= 1 && run.ordinal <= context.memberCount, `V2 run ${index} ordinal drifted`);
    invariant(context.languages.includes(run.language), `V2 run ${index} language drifted`);
    const key = `${run.ordinal}\0${run.animationId}\0${run.language}`;
    invariant(!keys.has(key), `V2 run key is duplicated: ${run.ordinal}/${run.animationId}/${run.language}`);
    keys.add(key);
    diagnostics.push(bindingOnly(run.report, `V2 run ${index} diagnostic`));
    before.push(bindingOnly(run.beforeExplicitActivation, `V2 run ${index} before PNG`));
    after.push(bindingOnly(
      run.afterExplicitActivationAndFixedDelay,
      `V2 run ${index} after PNG`,
    ));
  }
  invariant(keys.size === context.runCount, "V2 run-key cardinality drifted");
  const batch = bindingOnly(v2.boundInput?.batch, "V2 batch");
  const artifacts = [...diagnostics, ...before, ...after];
  invariant(artifacts.length === context.rawArtifactCount, "V2 raw artifact count drifted");
  const all = [batch, ...artifacts].sort((left, right) => compareStrings(left.path, right.path));
  invariant(all.length === context.rawFileCount, "V2 total raw file count drifted");
  invariant(new Set(all.map(({path: entryPath}) => entryPath)).size === all.length, "V2 raw paths are not unique");

  const closures = {
    diagnosticJson: checksumClosure(diagnostics, "V2 diagnostic JSON closure"),
    beforeExplicitActivationPng: checksumClosure(before, "V2 before PNG closure"),
    afterExplicitActivationPng: checksumClosure(after, "V2 after PNG closure"),
    allBeforeAfterPng: checksumClosure([...before, ...after], "V2 all PNG closure"),
    allDiagnosticJsonAndPng: checksumClosure(artifacts, "V2 all artifact closure"),
  };
  invariant(
    isDeepStrictEqual(closures, v2.artifactClosures),
    "V2 artifact closure descriptors do not reproduce from its raw descriptors",
  );
  const runRoot = path.posix.dirname(batch.path);
  for (const descriptor of all) {
    invariant(
      descriptor.path === runRoot || descriptor.path.startsWith(`${runRoot}/`),
      `V2 raw descriptor escaped the fixed run tree: ${descriptor.path}`,
    );
  }
  return {batch, diagnostics, before, after, artifacts, all, closures, runRoot};
}

async function verifyFrozenTree({root, runRoot, descriptors, expectedDirectoryCount}) {
  const resolvedRoot = await resolvePhysicalRoot(root);
  const absoluteRoot = path.resolve(resolvedRoot, runRoot);
  invariant(isInside(resolvedRoot, absoluteRoot), "V2 frozen run root escaped the project root");
  const expectedFiles = new Set(descriptors.map(({path: entryPath}) => entryPath));
  const actualFiles = new Set();
  const actualDirectories = new Set();

  async function visit(absolute) {
    const information = await lstat(absolute, {bigint: true});
    invariant(!information.isSymbolicLink(), `V2 frozen run contains a symbolic link: ${portable(path.relative(resolvedRoot, absolute))}`);
    invariant(await realpath(absolute) === absolute, `V2 frozen run traverses a symbolic-link parent: ${portable(path.relative(resolvedRoot, absolute))}`);
    const relative = portable(path.relative(resolvedRoot, absolute));
    if (information.isDirectory()) {
      invariant(permissionMode(information) === 0o555, `V2 frozen run directory mode drifted: ${relative}`);
      actualDirectories.add(relative);
      const entries = await readdir(absolute, {withFileTypes: true});
      for (const entry of entries.sort((left, right) => compareStrings(left.name, right.name))) {
        await visit(path.join(absolute, entry.name));
      }
      return;
    }
    invariant(information.isFile(), `V2 frozen run contains a special entry: ${relative}`);
    invariant(information.nlink === 1n, `V2 frozen run file is hard linked: ${relative}`);
    invariant(permissionMode(information) === 0o444, `V2 frozen run file mode drifted: ${relative}`);
    actualFiles.add(relative);
  }

  await visit(absoluteRoot);
  invariant(
    isDeepStrictEqual([...actualFiles].sort(compareStrings), [...expectedFiles].sort(compareStrings)),
    "V2 frozen run file set drifted",
  );
  invariant(actualDirectories.size === expectedDirectoryCount, "V2 frozen run directory set cardinality drifted");
  return {
    exactFileSet: true,
    fileCount: actualFiles.size,
    directoryCount: actualDirectories.size,
    requiredFileMode: "0444",
    requiredDirectoryMode: "0555",
    noSymlinksHardlinksOrSpecialEntries: true,
    physicalImmutabilityEstablished: false,
    statement: "The historical tree remains exact and mode-frozen for tamper evidence, but the owner UID can replace it; this is not cryptographic or physical immutability.",
  };
}

async function assertBindingsStable(root, descriptors, label) {
  for (const [index, descriptor] of descriptors.entries()) {
    await readPhysicalFile({
      root,
      relativePath: descriptor.path,
      label: `${label}[${index}]`,
      expected: descriptor,
      requireSingleLink: descriptor.path.startsWith("node_modules/") ? false : true,
    });
  }
}

function contextWith(overrides = {}) {
  return {
    ...DEFAULT_CONTEXT,
    ...overrides,
    languages: [...(overrides.languages ?? DEFAULT_CONTEXT.languages)],
    changedToolPaths: [...(overrides.changedToolPaths ?? DEFAULT_CONTEXT.changedToolPaths)],
  };
}

function makeAcceptanceEffects() {
  return Object.fromEntries(ACCEPTANCE_EFFECT_KEYS.map((key) => [key, false]));
}

function fingerprintPayload(report) {
  const {reportFingerprint: _ignored, ...payload} = report;
  return payload;
}

export function computeReportFingerprint(report) {
  return {
    algorithm: "sha256",
    canonicalization: "recursive-lexicographic-object-keys-array-order-preserved-v1",
    sha256: sha256(Buffer.from(`${stableJson(fingerprintPayload(report))}\n`, "utf8")),
  };
}

function expectedTopLevelKeys() {
  return [
    "acceptanceEffects",
    "authorityBoundary",
    "forensicRawEvidence",
    "generatorBoundary",
    "limitations",
    "packageSnapshotBinding",
    "predecessorClosureDescriptors",
    "predecessors",
    "reportFingerprint",
    "reportType",
    "schemaVersion",
    "scope",
    "status",
    "toolBoundaryReconciliation",
    "verification",
  ];
}

export function validateSuccessorReport(report, contextOverrides = {}) {
  const context = contextWith(contextOverrides);
  assertExactKeys(report, expectedTopLevelKeys(), "V3 successor report");
  invariant(report.schemaVersion === 3, "V3 schemaVersion drifted");
  invariant(
    report.reportType === "g4-l10-ruffle-forensic-evidence-closure-v3-successor",
    "V3 reportType drifted",
  );
  invariant(
    report.status === "forensic-raw-closure-current-successor-only",
    "V3 status drifted",
  );
  invariant(report.scope.releaseId === context.releaseId, "V3 releaseId drifted");
  invariant(report.scope.runId === context.runId, "V3 runId drifted");
  invariant(report.scope.memberCount === context.memberCount, "V3 member count drifted");
  invariant(report.scope.runCount === context.runCount, "V3 run count drifted");
  invariant(isDeepStrictEqual(report.scope.languages, context.languages), "V3 languages drifted");
  invariant(report.scope.appendOnly === true, "V3 append-only scope drifted");
  invariant(report.scope.successorReportPath === REPORT_JSON_PATH, "V3 successor report path drifted");

  invariant(
    isDeepStrictEqual(report.predecessors, [context.v2JsonDescriptor, context.v2MarkdownDescriptor]),
    "V3 predecessor descriptors drifted",
  );
  invariant(report.predecessorClosureDescriptors.source === context.v2JsonDescriptor.path, "V3 closure source drifted");
  invariant(report.predecessorClosureDescriptors.adoptedClaims === false, "V3 improperly adopts predecessor claims");
  invariant(report.forensicRawEvidence.rawFiles.length === context.rawFileCount, "V3 raw descriptor list is incomplete");
  invariant(report.forensicRawEvidence.rawArtifactCount === context.rawArtifactCount, "V3 raw artifact count drifted");
  invariant(report.forensicRawEvidence.totalRawFileCount === context.rawFileCount, "V3 total raw count drifted");
  invariant(
    isDeepStrictEqual(
      descriptorClosure(report.forensicRawEvidence.rawFiles, "V3 raw descriptor closure"),
      report.forensicRawEvidence.rawDescriptorClosure,
    ),
    "V3 raw descriptor closure drifted",
  );
  invariant(
    isDeepStrictEqual(
      checksumClosure(report.forensicRawEvidence.rawFiles, "V3 raw content closure"),
      report.forensicRawEvidence.rawContentClosure,
    ),
    "V3 raw content closure drifted",
  );
  invariant(
    isDeepStrictEqual(
      report.forensicRawEvidence.artifactClosures,
      report.predecessorClosureDescriptors.artifactClosures,
    ),
    "V3 raw closures drifted from the exact V2 closure descriptors",
  );
  invariant(report.forensicRawEvidence.bytesRehashedWithoutExecution === true, "V3 raw rehash boundary drifted");
  invariant(report.forensicRawEvidence.historicalBytesModified === false, "V3 claims historical-byte mutation");
  invariant(report.forensicRawEvidence.frozenTree.physicalImmutabilityEstablished === false, "V3 invented physical immutability");

  invariant(
    isDeepStrictEqual(report.packageSnapshotBinding.historicalV2Descriptor, context.historicalPackageDescriptor),
    "V3 historical package descriptor drifted",
  );
  invariant(
    isDeepStrictEqual(report.packageSnapshotBinding.currentDescriptor, context.currentPackageDescriptor),
    "V3 current package descriptor drifted",
  );
  invariant(report.packageSnapshotBinding.byteIdentical === false, "V3 package snapshot must record drift");
  invariant(
    report.packageSnapshotBinding.role === "post-capture-current-repository-snapshot-not-retroactive-runtime-provenance",
    "V3 package snapshot role drifted",
  );

  const reconciliation = report.toolBoundaryReconciliation;
  invariant(reconciliation.historicalFileCount === context.toolFileCount, "V3 historical tool count drifted");
  invariant(reconciliation.currentFileCount === context.toolFileCount, "V3 current tool count drifted");
  invariant(reconciliation.historicalV2BoundaryStillCurrent === false, "V3 improperly declares the V2 tool boundary current");
  invariant(reconciliation.successorReconciliationCurrent === true, "V3 successor reconciliation must be current");
  invariant(
    isDeepStrictEqual(reconciliation.changedPaths, context.changedToolPaths),
    "V3 changed tool path set drifted",
  );
  invariant(reconciliation.changes.length === context.changedToolPaths.length, "V3 tool change detail count drifted");
  invariant(
    isDeepStrictEqual(reconciliation.changes[0]?.historical, report.packageSnapshotBinding.historicalV2Descriptor) &&
      isDeepStrictEqual(reconciliation.changes[0]?.current, report.packageSnapshotBinding.currentDescriptor),
    "V3 package change detail drifted from the package snapshot binding",
  );
  invariant(reconciliation.fullBrowserRuntimeDependencyClosure === false, "V3 invented full browser/runtime closure");
  invariant(reconciliation.historicalServerResponseBodyClosure === false, "V3 invented response-body closure");
  invariant(reconciliation.captureExecutedUnderCurrentToolBoundary === false, "V3 invented capture execution under the current tool boundary");

  invariant(
    isDeepStrictEqual(
      report.generatorBoundary.closure,
      checksumClosure(report.generatorBoundary.files, "V3 generator boundary validation"),
    ),
    "V3 generator boundary closure drifted",
  );
  invariant(
    isDeepStrictEqual(
      report.generatorBoundary.files.map(({path: entryPath}) => entryPath).sort(compareStrings),
      [GENERATOR_PATH, TEST_PATH].sort(compareStrings),
    ),
    "V3 generator boundary paths drifted",
  );
  assertFalse(report.generatorBoundary.processLaunchCapability, "V3 generator process-launch capability");
  assertFalse(report.generatorBoundary.runtimeExecutionCapability, "V3 generator runtime-execution capability");

  assertExactKeys(report.acceptanceEffects, ACCEPTANCE_EFFECT_KEYS, "V3 acceptanceEffects");
  for (const [key, value] of Object.entries(report.acceptanceEffects)) assertFalse(value, `V3 acceptanceEffects.${key}`);
  for (const key of [
    "originalRuntimeAuthority",
    "runtimeLaunchAuthority",
    "runtimeExecutionAuthority",
    "acceptanceAuthority",
    "strictAuthority",
    "publicationAuthority",
  ]) assertFalse(report.authorityBoundary[key], `V3 authorityBoundary.${key}`);
  invariant(report.authorityBoundary.ruffleForensicReferenceOnly === true, "V3 Ruffle forensic-only boundary drifted");
  for (const phrase of [
    "forensic reference only",
    "not an authoritative original-runtime baseline",
    "does not authorize launch",
    "does not establish acceptance",
  ]) invariant(report.authorityBoundary.statement.includes(phrase), `V3 authority statement lost: ${phrase}`);

  const verification = report.verification;
  invariant(verification.predecessorBytesExact === true, "V3 predecessor verification drifted");
  invariant(verification.historicalRawBytesExact === true, "V3 raw verification drifted");
  invariant(verification.historicalArtifactClosuresReproduced === true, "V3 closure verification drifted");
  invariant(verification.modeFrozenTreeExact === true, "V3 tree verification drifted");
  invariant(verification.onlyPackageJsonToolBoundaryDrift === true, "V3 exact package-only drift disposition drifted");
  invariant(verification.currentPackageDescriptorExact === true, "V3 current package verification drifted");
  invariant(verification.generatorBoundaryCurrent === true, "V3 generator boundary drifted");
  invariant(verification.currentForensicSuccessor === true, "V3 current successor flag drifted");
  assertFalse(verification.captureRerun, "V3 capture rerun");
  assertFalse(verification.ruffleLaunched, "V3 Ruffle launch");
  assertFalse(verification.originalRuntimeLaunched, "V3 original-runtime launch");
  assertFalse(verification.animateLaunched, "V3 Animate launch");

  invariant(Array.isArray(report.limitations) && report.limitations.length >= 6, "V3 limitations are incomplete");
  invariant(
    report.limitations.some((value) => value.includes("does not prove that the historical capture ran under the current package.json")),
    "V3 package-snapshot limitation is missing",
  );
  invariant(
    isDeepStrictEqual(report.reportFingerprint, computeReportFingerprint(report)),
    "V3 report fingerprint drifted",
  );
  return report;
}

export async function buildG4L10RuffleEvidenceClosureV3Successor({
  root = projectRoot,
  context: contextOverrides = {},
} = {}) {
  const context = contextWith(contextOverrides);
  const resolvedRoot = await resolvePhysicalRoot(root);
  const [v2JsonPhysical, v2MarkdownPhysical] = await Promise.all([
    readPhysicalJson({
      root: resolvedRoot,
      relativePath: context.v2JsonDescriptor.path,
      label: "immutable V2 JSON predecessor",
      expected: context.v2JsonDescriptor,
      requiredMode: 0o444,
    }),
    readPhysicalFile({
      root: resolvedRoot,
      relativePath: context.v2MarkdownDescriptor.path,
      label: "immutable V2 Markdown predecessor",
      expected: context.v2MarkdownDescriptor,
      requiredMode: 0o444,
    }),
  ]);
  const v2 = v2JsonPhysical.value;
  assertV2Semantics(v2, context);
  const raw = deriveV2RawDescriptors(v2, context);

  const rawPhysical = [];
  for (const [index, descriptor] of raw.all.entries()) {
    rawPhysical.push(await readPhysicalFile({
      root: resolvedRoot,
      relativePath: descriptor.path,
      label: `historical V2 raw file[${index}]`,
      expected: descriptor,
      requiredMode: 0o444,
    }));
  }
  const frozenTree = await verifyFrozenTree({
    root: resolvedRoot,
    runRoot: raw.runRoot,
    descriptors: raw.all,
    expectedDirectoryCount: context.runTreeDirectoryCount,
  });

  invariant(Array.isArray(v2.toolBoundary?.files), "V2 tool-boundary descriptors are missing");
  invariant(v2.toolBoundary.files.length === context.toolFileCount, "V2 tool-boundary file count drifted");
  const historicalToolFiles = v2.toolBoundary.files.map((entry, index) =>
    bindingOnly(entry, `V2 tool-boundary file[${index}]`));
  invariant(
    isDeepStrictEqual(checksumClosure(historicalToolFiles, "V2 tool boundary"), v2.toolBoundary.closure),
    "V2 tool-boundary closure does not reproduce",
  );
  const currentToolFiles = [];
  for (const [index, historical] of historicalToolFiles.entries()) {
    const physical = await readPhysicalFile({
      root: resolvedRoot,
      relativePath: historical.path,
      label: `current V2-enumerated tool file[${index}]`,
      requireSingleLink: historical.path.startsWith("node_modules/") ? false : true,
    });
    currentToolFiles.push(physical.descriptor);
  }
  const currentToolByPath = new Map(currentToolFiles.map((entry) => [entry.path, entry]));
  const changes = historicalToolFiles
    .filter((historical) => !isDeepStrictEqual(historical, currentToolByPath.get(historical.path)))
    .map((historical) => ({
      path: historical.path,
      historical,
      current: currentToolByPath.get(historical.path),
      disposition: historical.path === "package.json"
        ? "bind-current-post-capture-package-snapshot-without-retroactive-runtime-claim"
        : "unreviewed-unexpected-tool-drift",
    }));
  invariant(
    isDeepStrictEqual(changes.map(({path: entryPath}) => entryPath), context.changedToolPaths),
    `unexpected V2 tool-boundary drift: ${changes.map(({path: entryPath}) => entryPath).join(",") || "none"}`,
  );
  const historicalPackage = historicalToolFiles.find(({path: entryPath}) => entryPath === "package.json");
  const currentPackage = currentToolByPath.get("package.json");
  invariant(isDeepStrictEqual(historicalPackage, context.historicalPackageDescriptor), "historical V2 package descriptor drifted");
  invariant(isDeepStrictEqual(currentPackage, context.currentPackageDescriptor), "current package.json exact descriptor drifted");
  invariant(!isDeepStrictEqual(historicalPackage, currentPackage), "package.json no longer records the required successor drift");

  const [generatorPhysical, testPhysical] = await Promise.all([
    readPhysicalFile({root: resolvedRoot, relativePath: GENERATOR_PATH, label: "V3 successor generator"}),
    readPhysicalFile({root: resolvedRoot, relativePath: TEST_PATH, label: "V3 successor test"}),
  ]);
  const generatorFiles = [generatorPhysical.descriptor, testPhysical.descriptor]
    .sort((left, right) => compareStrings(left.path, right.path));

  const report = {
    schemaVersion: 3,
    reportType: "g4-l10-ruffle-forensic-evidence-closure-v3-successor",
    status: "forensic-raw-closure-current-successor-only",
    scope: {
      releaseId: context.releaseId,
      runId: context.runId,
      languages: context.languages,
      memberCount: context.memberCount,
      runCount: context.runCount,
      successorReportPath: REPORT_JSON_PATH,
      appendOnly: true,
    },
    predecessors: [context.v2JsonDescriptor, context.v2MarkdownDescriptor],
    predecessorClosureDescriptors: {
      source: context.v2JsonDescriptor.path,
      artifactClosures: v2.artifactClosures,
      toolBoundaryClosure: v2.toolBoundary.closure,
      fixedCaptureWitness: v2.fixedCaptureWitness,
      frozenTree: {
        fileCount: v2.modeFrozenRun.fileCount,
        directoryCount: v2.modeFrozenRun.directoryCount,
        requiredFileMode: v2.modeFrozenRun.requiredFileMode,
        requiredDirectoryMode: v2.modeFrozenRun.requiredDirectoryMode,
      },
      adoptedClaims: false,
      statement: "V3 binds V2's exact closure descriptors without rewriting V2 or inheriting broader runtime, currentness, or acceptance claims.",
    },
    forensicRawEvidence: {
      descriptorSource: context.v2JsonDescriptor,
      runRoot: raw.runRoot,
      batch: raw.batch,
      runCount: context.runCount,
      rawArtifactCount: raw.artifacts.length,
      totalRawFileCount: raw.all.length,
      rawFiles: raw.all,
      rawDescriptorClosure: descriptorClosure(raw.all, "historical V2 raw descriptor set"),
      rawContentClosure: checksumClosure(raw.all, "historical V2 raw content set"),
      artifactClosures: raw.closures,
      frozenTree,
      bytesRehashedWithoutExecution: true,
      historicalBytesModified: false,
    },
    packageSnapshotBinding: {
      historicalV2Descriptor: historicalPackage,
      currentDescriptor: currentPackage,
      byteIdentical: false,
      onlyObservedV2ToolBoundaryDrift: true,
      role: "post-capture-current-repository-snapshot-not-retroactive-runtime-provenance",
      statement: "The exact current package.json descriptor is bound as successor currentness evidence only. It does not prove that any historical Ruffle capture ran under these current package bytes.",
    },
    toolBoundaryReconciliation: {
      kind: "exact-v2-enumerated-partial-tool-boundary-post-capture-reconciliation",
      historicalFileCount: historicalToolFiles.length,
      currentFileCount: currentToolFiles.length,
      historicalClosure: v2.toolBoundary.closure,
      currentClosure: checksumClosure(currentToolFiles, "current reconciled V2 tool boundary"),
      changedPaths: changes.map(({path: entryPath}) => entryPath),
      changes,
      historicalV2BoundaryStillCurrent: false,
      successorReconciliationCurrent: true,
      fullBrowserRuntimeDependencyClosure: false,
      historicalServerResponseBodyClosure: false,
      captureExecutedUnderCurrentToolBoundary: false,
      statement: "Exactly package.json drifted inside V2's enumerated 22-file partial tool boundary. V3 reconciles that current descriptor but cannot retroactively repair the incomplete historical runtime or HTTP-response closure.",
    },
    generatorBoundary: {
      files: generatorFiles,
      closure: checksumClosure(generatorFiles, "V3 generator boundary"),
      processLaunchCapability: false,
      runtimeExecutionCapability: false,
      statement: "The V3 builder only reads, hashes, validates, renders, and append-only publishes this successor pair.",
    },
    verification: {
      predecessorBytesExact: true,
      historicalRawBytesExact: true,
      historicalArtifactClosuresReproduced: true,
      modeFrozenTreeExact: true,
      onlyPackageJsonToolBoundaryDrift: true,
      currentPackageDescriptorExact: true,
      generatorBoundaryCurrent: true,
      currentForensicSuccessor: true,
      captureRerun: false,
      ruffleLaunched: false,
      originalRuntimeLaunched: false,
      animateLaunched: false,
    },
    authorityBoundary: {
      ruffleForensicReferenceOnly: true,
      originalRuntimeAuthority: false,
      runtimeLaunchAuthority: false,
      runtimeExecutionAuthority: false,
      acceptanceAuthority: false,
      strictAuthority: false,
      publicationAuthority: false,
      statement: "Ruffle remains a forensic reference only. This is not an authoritative original-runtime baseline, does not authorize launch or execution, and does not establish acceptance, strict completion, integration, release, or publication.",
    },
    acceptanceEffects: makeAcceptanceEffects(),
    limitations: [
      "This successor re-hashes preserved historical files; it does not rerun Ruffle, Adobe Flash Player Projector, Adobe Animate, a browser, or the original host.",
      "Binding the current package.json descriptor does not prove that the historical capture ran under the current package.json.",
      "The V2 tool boundary remains an enumerated partial subset and omits a complete historical browser, Node, Playwright, Next build, and HTTP response-body closure.",
      "The historical probe authored its own activation and playback diagnostics, so independent UI causality and a natural trace remain unestablished.",
      "The EN/ES route labels do not establish SWF-language state, and the preserved run contains no authoritative audio listening evidence.",
      "Ruffle observations cannot serve as authoritative original-runtime, deterministic frame, behavior, fidelity, RMSE, human-review, owner, strict, integration, release, or publication evidence.",
      "Mode 0444 files and 0555 directories are tamper-evident for ordinary use but are not signed, cryptographic, physical, or owner-UID-enforced immutability.",
    ],
    reportFingerprint: null,
  };
  report.reportFingerprint = computeReportFingerprint(report);
  validateSuccessorReport(report, context);

  const allInputBindings = [
    v2JsonPhysical.descriptor,
    v2MarkdownPhysical.descriptor,
    ...rawPhysical.map(({descriptor}) => descriptor),
    ...currentToolFiles,
    ...generatorFiles,
  ];
  const uniqueBindings = [...new Map(allInputBindings.map((entry) => [entry.path, entry])).values()];
  await assertBindingsStable(resolvedRoot, uniqueBindings, "V3 final input CAS");
  await Promise.all([
    readPhysicalFile({
      root: resolvedRoot,
      relativePath: context.v2JsonDescriptor.path,
      label: "V3 final V2 JSON mode CAS",
      expected: context.v2JsonDescriptor,
      requiredMode: 0o444,
    }),
    readPhysicalFile({
      root: resolvedRoot,
      relativePath: context.v2MarkdownDescriptor.path,
      label: "V3 final V2 Markdown mode CAS",
      expected: context.v2MarkdownDescriptor,
      requiredMode: 0o444,
    }),
  ]);
  await verifyFrozenTree({
    root: resolvedRoot,
    runRoot: raw.runRoot,
    descriptors: raw.all,
    expectedDirectoryCount: context.runTreeDirectoryCount,
  });
  return {report, inputBindings: uniqueBindings};
}

export function renderMarkdown(report) {
  validateSuccessorReport(report, {
    v2JsonDescriptor: report.predecessors[0],
    v2MarkdownDescriptor: report.predecessors[1],
    historicalPackageDescriptor: report.packageSnapshotBinding.historicalV2Descriptor,
    currentPackageDescriptor: report.packageSnapshotBinding.currentDescriptor,
    releaseId: report.scope.releaseId,
    runId: report.scope.runId,
    languages: report.scope.languages,
    memberCount: report.scope.memberCount,
    runCount: report.scope.runCount,
    rawArtifactCount: report.forensicRawEvidence.rawArtifactCount,
    rawFileCount: report.forensicRawEvidence.totalRawFileCount,
    toolFileCount: report.toolBoundaryReconciliation.historicalFileCount,
    runTreeDirectoryCount: report.forensicRawEvidence.frozenTree.directoryCount,
    changedToolPaths: report.toolBoundaryReconciliation.changedPaths,
  });
  const packageBinding = report.packageSnapshotBinding;
  const raw = report.forensicRawEvidence;
  return `# G4 L10 Ruffle Forensic Evidence Closure v3 Successor

## Outcome

- Status: **forensic raw-closure current successor only**.
- Immutable predecessors: \`${report.predecessors[0].path}\` / \`${report.predecessors[0].sha256}\`; \`${report.predecessors[1].path}\` / \`${report.predecessors[1].sha256}\`.
- Historical run: \`${report.scope.runId}\`, ${report.scope.memberCount} release members × EN/ES = ${report.scope.runCount} run descriptors.
- Historical raw bytes re-hashed: **${raw.totalRawFileCount} files** (${raw.rawArtifactCount} diagnostic/PNG artifacts plus one batch file).
- Historical raw descriptor closure: \`${raw.rawDescriptorClosure.sha256}\`.
- Historical raw content closure: \`${raw.rawContentClosure.sha256}\`.
- Frozen tree: ${raw.frozenTree.fileCount} files / ${raw.frozenTree.directoryCount} directories, exact 0444/0555 sets.
- V2 enumerated tool-boundary currentness: **stale**.
- V3 successor reconciliation currentness: **current**.

## Exact package.json Drift

- Historical V2 descriptor: ${packageBinding.historicalV2Descriptor.bytes} bytes / \`${packageBinding.historicalV2Descriptor.sha256}\`.
- Current successor descriptor: ${packageBinding.currentDescriptor.bytes} bytes / \`${packageBinding.currentDescriptor.sha256}\`.
- Exactly one of V2's ${report.toolBoundaryReconciliation.historicalFileCount} enumerated partial tool files drifted: \`package.json\`.
- The current descriptor is a **post-capture repository snapshot**. It does not prove that the historical Ruffle run executed under current package bytes.

## Preserved V2 Closures

- Diagnostic JSON (${report.predecessorClosureDescriptors.artifactClosures.diagnosticJson.count}): \`${report.predecessorClosureDescriptors.artifactClosures.diagnosticJson.sha256}\`.
- Before-activation PNG (${report.predecessorClosureDescriptors.artifactClosures.beforeExplicitActivationPng.count}): \`${report.predecessorClosureDescriptors.artifactClosures.beforeExplicitActivationPng.sha256}\`.
- Post-activation PNG (${report.predecessorClosureDescriptors.artifactClosures.afterExplicitActivationPng.count}): \`${report.predecessorClosureDescriptors.artifactClosures.afterExplicitActivationPng.sha256}\`.
- All diagnostic JSON + PNG (${report.predecessorClosureDescriptors.artifactClosures.allDiagnosticJsonAndPng.count}): \`${report.predecessorClosureDescriptors.artifactClosures.allDiagnosticJsonAndPng.sha256}\`.
- Historical V2 partial tool closure: \`${report.toolBoundaryReconciliation.historicalClosure.sha256}\`.
- Current reconciled partial tool closure: \`${report.toolBoundaryReconciliation.currentClosure.sha256}\`.

## Evidence and Authority Boundary

Ruffle is a forensic reference only. This successor did not launch Ruffle, Projector, Animate, a browser, or an original runtime. It is not original-runtime authority, launch authority, deterministic frame or natural-trace evidence, language/audio proof, behavior/fidelity/RMSE acceptance, human or owner review, strict completion, whole-lesson integration, release approval, or publication authority.

Every value in \`acceptanceEffects\` is boolean \`false\`. The V2 JSON/Markdown and all 94-run historical bytes remain untouched; this pair is append-only.

## Limitations

${report.limitations.map((limitation) => `- ${limitation}`).join("\n")}

Report fingerprint: \`${report.reportFingerprint.sha256}\`.
`;
}

export function outputBytes(report) {
  return {
    json: `${stableJson(report, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

async function safeOutputLocation(root, relativePath, label) {
  const resolvedRoot = await resolvePhysicalRoot(root);
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath), `${label} path must be relative`);
  const absolute = path.resolve(resolvedRoot, relativePath);
  invariant(isInside(resolvedRoot, absolute), `${label} escaped the project root`);
  const parent = path.dirname(absolute);
  const parentInformation = await lstat(parent, {bigint: true});
  invariant(parentInformation.isDirectory() && !parentInformation.isSymbolicLink(), `${label} parent must be a physical directory`);
  invariant(await realpath(parent) === parent, `${label} parent must not traverse a symbolic link`);
  return {resolvedRoot, absolute, parent};
}

async function inspectOutput({root, relativePath, expected, label, allowAbsent}) {
  const location = await safeOutputLocation(root, relativePath, label);
  let information;
  try {
    information = await lstat(location.absolute, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT" && allowAbsent) return {...location, exists: false};
    if (error?.code === "ENOENT") throw new Error(`${label} is missing`);
    throw error;
  }
  invariant(information.isFile() && !information.isSymbolicLink(), `${label} must be a regular non-symlink file`);
  invariant(information.nlink === 1n, `${label} must not be hard linked`);
  invariant(permissionMode(information) === 0o444, `${label} must be mode 0444`);
  const physical = await readPhysicalFile({
    root: location.resolvedRoot,
    relativePath,
    label,
    requireSingleLink: true,
    requiredMode: 0o444,
  });
  invariant(physical.bytes.equals(Buffer.from(expected, "utf8")), `${label} is stale and will not be overwritten or rebased`);
  return {...location, exists: true, information: physical.stat, descriptor: physical.descriptor};
}

export async function inspectOutputPair({root, outputs, allowAbsent}) {
  invariant(Array.isArray(outputs) && outputs.length === 2, "V3 output set must contain exactly two files");
  invariant(new Set(outputs.map(({relativePath}) => relativePath)).size === 2, "V3 output paths must be distinct");
  const inspected = [];
  for (const output of outputs) inspected.push(await inspectOutput({...output, root, allowAbsent}));
  const existing = inspected.filter(({exists}) => exists).length;
  invariant(existing === 0 || existing === outputs.length, "V3 append-only output pair is partial");
  return {state: existing === 0 ? "absent" : "current", inspected};
}

async function createStage(location, expected, label) {
  const stage = `${location.absolute}.stage-${process.pid}-${randomUUID()}`;
  const handle = await open(stage, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600);
  let information;
  try {
    await handle.writeFile(expected, "utf8");
    await handle.sync();
    await handle.chmod(0o444);
    await handle.sync();
    information = await handle.stat({bigint: true});
    invariant(information.isFile() && information.nlink === 1n, `${label} stage identity drifted`);
    invariant(permissionMode(information) === 0o444, `${label} stage mode drifted`);
  } catch (error) {
    await handle.close().catch(() => {});
    await unlink(stage).catch(() => {});
    throw error;
  }
  await handle.close();
  return {path: stage, information};
}

async function syncDirectory(directory, label) {
  const handle = await open(directory, constants.O_RDONLY);
  try {
    const information = await handle.stat({bigint: true});
    invariant(information.isDirectory(), `${label} sync target must be a directory`);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function unlinkIfOwned(absolute, information, label) {
  let current;
  try {
    current = await lstat(absolute, {bigint: true});
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  invariant(
    current.dev === information.dev && current.ino === information.ino,
    `${label} cleanup refused a foreign replacement`,
  );
  await unlink(absolute);
}

export async function appendOnlyPublishPair({
  root,
  outputs,
  beforeInstall = async () => {},
  injectFailureAfterLink = null,
}) {
  const preflight = await inspectOutputPair({root, outputs, allowAbsent: true});
  if (preflight.state === "current") return {created: false, state: "current"};
  const stages = [];
  const installed = [];
  try {
    for (const [index, output] of outputs.entries()) {
      stages.push({
        output,
        location: preflight.inspected[index],
        stage: await createStage(preflight.inspected[index], output.expected, output.label),
      });
    }
    await beforeInstall();
    for (const [index, item] of stages.entries()) {
      await link(item.stage.path, item.location.absolute);
      const target = await lstat(item.location.absolute, {bigint: true});
      invariant(
        target.dev === item.stage.information.dev && target.ino === item.stage.information.ino,
        `${item.output.label} no-replace link identity drifted`,
      );
      installed.push({...item, target});
      if (injectFailureAfterLink === index + 1) throw new Error(`injected failure after output link ${index + 1}`);
    }
    await syncDirectory(stages[0].location.parent, "V3 installed output pair parent");
    for (const item of stages) await unlinkIfOwned(item.stage.path, item.stage.information, `${item.output.label} stage`);
    await syncDirectory(stages[0].location.parent, "V3 stage-cleaned output pair parent");
    await inspectOutputPair({root, outputs, allowAbsent: false});
    return {created: true, state: "current"};
  } catch (error) {
    const rollbackErrors = [];
    for (const item of [...installed].reverse()) {
      try {
        await unlinkIfOwned(item.location.absolute, item.stage.information, `${item.output.label} installed output`);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError.message);
      }
    }
    for (const item of stages) {
      try {
        await unlinkIfOwned(item.stage.path, item.stage.information, `${item.output.label} stage`);
      } catch (cleanupError) {
        rollbackErrors.push(cleanupError.message);
      }
    }
    if (stages.length > 0) {
      try {
        await syncDirectory(stages[0].location.parent, "V3 rollback output pair parent");
      } catch (syncError) {
        rollbackErrors.push(syncError.message);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new Error(`${error.message}; rollback conflicts: ${rollbackErrors.join("; ")}`);
    }
    throw error;
  }
}

export function parseArguments(argv) {
  if (argv.length === 1 && argv[0] === "--help") return {mode: "help"};
  invariant(argv.length === 1, "exactly one of --dry-run, --check, or --apply is required");
  const modes = {"--dry-run": "dry-run", "--check": "check", "--apply": "apply"};
  invariant(modes[argv[0]], `unknown or unsafe option: ${argv[0] ?? "<missing>"}`);
  return {mode: modes[argv[0]]};
}

function usage() {
  return "usage: node scripts/build-g4-l10-ruffle-activated-evidence-closure-v3-successor.mjs (--dry-run|--check|--apply)";
}

async function main() {
  const {mode} = parseArguments(process.argv.slice(2));
  if (mode === "help") {
    console.log(usage());
    return;
  }
  const first = await buildG4L10RuffleEvidenceClosureV3Successor({root: projectRoot});
  const bytes = outputBytes(first.report);
  const outputs = [
    {relativePath: REPORT_JSON_PATH, expected: bytes.json, label: "V3 successor JSON"},
    {relativePath: REPORT_MARKDOWN_PATH, expected: bytes.markdown, label: "V3 successor Markdown"},
  ];
  if (mode === "dry-run") {
    const outputState = await inspectOutputPair({root: projectRoot, outputs, allowAbsent: true});
    console.log(stableJson({mode, outputState: outputState.state, reportFingerprint: first.report.reportFingerprint, acceptanceEffectsAllFalse: Object.values(first.report.acceptanceEffects).every((value) => value === false)}));
    return;
  }
  if (mode === "check") {
    await inspectOutputPair({root: projectRoot, outputs, allowAbsent: false});
    console.log(stableJson({mode, current: true, reportFingerprint: first.report.reportFingerprint}));
    return;
  }
  const result = await appendOnlyPublishPair({
    root: projectRoot,
    outputs,
    beforeInstall: async () => {
      const current = await buildG4L10RuffleEvidenceClosureV3Successor({root: projectRoot});
      const currentBytes = outputBytes(current.report);
      invariant(currentBytes.json === bytes.json && currentBytes.markdown === bytes.markdown, "V3 inputs drifted after staging and before no-replace publication");
    },
  });
  console.log(stableJson({mode, ...result, reportFingerprint: first.report.reportFingerprint}));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
