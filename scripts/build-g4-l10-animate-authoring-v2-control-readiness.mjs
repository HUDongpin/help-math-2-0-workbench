#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildLessonAnimateExecutionCodeClosureManifest,
  describeLessonAnimateExecutionFile,
} from "./lib/lesson-animate-execution-code-closure.mjs";
import {
  lessonAnimateOneRowAuthorizationV2FixedPaths,
  LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
  LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256,
  LESSON_ANIMATE_ONE_ROW_V2_FIXED_SOURCE_FREEZE_SHA256,
  LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256,
  LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED,
  LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT,
} from "./lib/lesson-animate-one-row-authorization-v2.mjs";
import {
  LESSON_ANIMATE_PRODUCTION_OWNER_ROOT,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_ROOT,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
  LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH,
} from "./lib/lesson-animate-production-trust.mjs";
import {stageAnimateReleaseFlaCopies} from "./stage-animate-release-fla-copies.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = await realpath(path.resolve(path.dirname(SCRIPT_PATH), ".."));
const REPORT_JSON_RELATIVE = "reports/g4-l10-animate-authoring-v2-control-readiness.json";
const REPORT_MARKDOWN_RELATIVE = "reports/g4-l10-animate-authoring-v2-control-readiness.md";
const RESULT_INDEX_RELATIVE = "reports/g4-l10-animate-authoring-audit-index.json";
const RESULT_INDEX_BUILDER_RELATIVE = "scripts/build-lesson-animate-authoring-audit-index.mjs";
const DIAGNOSTIC_CLOSURE_TEST_RELATIVE =
  "scripts/lib/lesson-animate-authoring-audit-core.test.mjs";
const DIAGNOSTIC_REPLAY_HELPER_RELATIVE =
  "scripts/fixtures/lesson-animate-diagnostic-replay-lock-helper.sh";
const SOURCE_FREEZE_RELATIVE = "catalog/source-manifest.sha256";
const DEFAULT_ANIMATE_BINARY =
  "/Applications/Adobe Animate 2021/Adobe Animate 2021.app/Contents/MacOS/Adobe Animate 2021";
const HASH = /^[a-f0-9]{64}$/u;

const EXPECTED_DIAGNOSTIC_MODULES = Object.freeze([
  "scripts/lib/lesson-animate-authoring-audit-core.mjs",
  "scripts/lib/lesson-animate-execution-code-closure.mjs",
  "scripts/lib/lesson-animate-one-row-authorization-v2.mjs",
  "scripts/lib/lesson-animate-prebuilt-atomic-replay-lock.mjs",
  "scripts/lib/lesson-animate-production-trust.mjs",
  "scripts/probe-animate-jsfl-cli.mjs",
  LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT,
]);

const PROJECT_CONTROL_FILES = Object.freeze([
  ["generator", "scripts/build-g4-l10-animate-authoring-v2-control-readiness.mjs"],
  ["generatorTests", "scripts/build-g4-l10-animate-authoring-v2-control-readiness.test.mjs"],
  ["packageScripts", "package.json"],
  ["productionTrust", "scripts/lib/lesson-animate-production-trust.mjs"],
  ["executionCodeClosure", "scripts/lib/lesson-animate-execution-code-closure.mjs"],
  ["atomicReplayLock", "scripts/lib/lesson-animate-prebuilt-atomic-replay-lock.mjs"],
  ["authorizationV2", "scripts/lib/lesson-animate-one-row-authorization-v2.mjs"],
  ["authoringAuditCore", "scripts/lib/lesson-animate-authoring-audit-core.mjs"],
  ["dedicatedEntrypoint", LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT],
  ["genericL10Guard", "scripts/run-assisted-animate-authoring-audit.mjs"],
  ["nativeReplayLockSource", "scripts/native/lesson-animate-atomic-replay-lock.c"],
  ["recursiveJsfl", "scripts/animate-audit-current-document.jsfl"],
  ["diagnosticClosureDurableTest", DIAGNOSTIC_CLOSURE_TEST_RELATIVE],
  ["diagnosticReplayHelperFixture", DIAGNOSTIC_REPLAY_HELPER_RELATIVE],
  ["resultIndexBuilder", RESULT_INDEX_BUILDER_RELATIVE],
]);

const P1_BLOCKERS = Object.freeze([
  {
    blockerId: "root-owned-native-launcher-capability",
    severity: "P1",
    satisfied: false,
    requirement: "A reviewed, fixed, root-owned native launcher/capability must replace mutable JavaScript process identity and plain-context handoff.",
  },
  {
    blockerId: "bundle-process-family-lifecycle",
    severity: "P1",
    satisfied: false,
    requirement: "Lifecycle proof must cover the full Animate bundle process family, including helpers, CEP/renderer processes, descendants, and reparented descendants.",
  },
  {
    blockerId: "kill-unconfirmed-supervisor-lifecycle",
    severity: "P1",
    satisfied: false,
    requirement: "Kill-unconfirmed runner and replay-helper supervisors must detach or unref bounded child handles so a residual child cannot retain the Node event loop indefinitely.",
  },
  {
    blockerId: "native-clean-environment",
    severity: "P1",
    satisfied: false,
    requirement: "The native launcher must supply a fixed clean environment, including HOME, USER, LOGNAME, TMPDIR, PATH, LANG, and LC_ALL.",
  },
  {
    blockerId: "same-uid-generated-artifact-toctou",
    severity: "P1",
    satisfied: false,
    requirement: "Generated controller, JSFL, launch-intent, and run artifacts must resist same-UID replacement between validation, durable transition, and spawn, using protected custody and stable descriptors.",
  },
  {
    blockerId: "same-uid-replay-resistance",
    severity: "P1",
    satisfied: false,
    requirement: "Replay state must resist same-UID pre-claim deletion, replacement, and denial-of-service outside project-writable custody.",
  },
]);

const EXPECTED_RESULT_INDEX_AUTHORITY_BOUNDARY = Object.freeze({
  sourcePairsReverified: true,
  adobeAnimateAuthoringStructureForPassingItems: false,
  originalRuntimeBehavior: false,
  javascriptImplementationOrFidelity: false,
  rmse: false,
  audioListeningOrSynchronization: false,
  humanVisualReview: false,
  ownerAcceptance: false,
  strictAcceptance: false,
  migrationCompletion: false,
  publication: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(`G4 L10 Animate v2 control readiness: ${message}`);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(root, file) {
  const relative = path.relative(root, file);
  invariant(relative && !path.isAbsolute(relative)
    && relative !== ".." && !relative.startsWith(`..${path.sep}`),
  `path escapes project root: ${file}`);
  return relative.split(path.sep).join("/");
}

async function exists(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function bindProjectFile(root, relativeFile, {executable = false} = {}) {
  return describeLessonAnimateExecutionFile({
    projectRoot: root,
    file: relativeFile,
    scope: "project",
    executable,
  });
}

async function bindAbsoluteFile(root, file) {
  return describeLessonAnimateExecutionFile({
    projectRoot: root,
    file,
    scope: "absolute",
    executable: true,
  });
}

async function readBoundProjectFile(root, relativeFile) {
  const binding = await bindProjectFile(root, relativeFile);
  const bytes = await readFile(path.join(root, ...relativeFile.split("/")));
  invariant(sha256(bytes) === binding.sha256 && bytes.length === binding.bytes,
    `${relativeFile} changed around its control binding read`);
  return {binding, bytes};
}

async function readBoundJson(root, relativeFile) {
  const bound = await readBoundProjectFile(root, relativeFile);
  let document;
  try {
    document = JSON.parse(bound.bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`G4 L10 Animate v2 control readiness: ${relativeFile} is invalid JSON: ${error.message}`);
  }
  return {...bound, document};
}

async function probeFixedPath(file) {
  try {
    const information = await lstat(file);
    invariant(!information.isSymbolicLink(), `${file} must not be a symbolic link`);
    return {
      file,
      exists: true,
      kind: information.isDirectory() ? "directory" : information.isFile() ? "file" : "other",
      mode: (information.mode & 0o7777).toString(8).padStart(4, "0"),
      uid: information.uid,
      gid: information.gid,
    };
  } catch (error) {
    if (error.code === "ENOENT") return {file, exists: false, kind: "absent"};
    throw error;
  }
}

async function collectRegularFiles(directory, relative = "") {
  if (!(await exists(directory))) return [];
  const information = await lstat(directory);
  invariant(information.isDirectory() && !information.isSymbolicLink(),
    `${directory} must be a real directory`);
  const files = [];
  for (const entry of (await readdir(directory, {withFileTypes: true}))
    .sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    invariant(!entry.isSymbolicLink(), `${directory} contains a symbolic link: ${entry.name}`);
    const child = path.join(directory, entry.name);
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await collectRegularFiles(child, childRelative));
    else {
      invariant(entry.isFile(), `${child} has an unsupported filesystem kind`);
      files.push(childRelative);
    }
  }
  return files;
}

async function inspectAuthorityReceipts(root, authorityRoot) {
  const files = await collectRegularFiles(authorityRoot);
  const categories = {
    assignments: files.filter((file) => file.startsWith("assignments/sha256/") && file.endsWith(".json")),
    sessionAuthorizations: files.filter((file) => file.startsWith("session-authorizations/sha256/") && file.endsWith(".json")),
    executionCodeClosures: files.filter((file) => file.startsWith("execution-code-closures/sha256/") && file.endsWith(".json")),
  };
  const known = new Set(Object.values(categories).flat());
  const unexpected = files.filter((file) => !known.has(file));
  return {
    root: portable(root, authorityRoot),
    rootPresent: await exists(authorityRoot),
    assignmentReceipts: categories.assignments.length,
    authorizationReceipts: categories.sessionAuthorizations.length,
    productionClosureReceipts: categories.executionCodeClosures.length,
    unexpectedFiles: unexpected,
  };
}

async function inspectRunReceipts(root, entries) {
  const observations = [];
  let runDirectories = 0;
  let resultReceipts = 0;
  let incompleteRunDirectories = 0;
  for (const entry of entries) {
    const runsRoot = path.join(root, "work", "animate", "dependency-authoring-audits",
      entry.animationId, "runs");
    if (!(await exists(runsRoot))) continue;
    const information = await lstat(runsRoot);
    invariant(information.isDirectory() && !information.isSymbolicLink(),
      `${entry.animationId} runs root must be a real directory`);
    for (const candidate of (await readdir(runsRoot, {withFileTypes: true}))
      .sort((left, right) => left.name.localeCompare(right.name, "en"))) {
      invariant(!candidate.isSymbolicLink() && candidate.isDirectory()
        && /^run-[A-Za-z0-9_-]{8,96}$/u.test(candidate.name),
      `${entry.animationId} has a malformed run entry: ${candidate.name}`);
      runDirectories += 1;
      const receipt = path.join(runsRoot, candidate.name, "assisted-run-result.json");
      const present = await exists(receipt);
      if (present) {
        const receiptInfo = await lstat(receipt);
        invariant(receiptInfo.isFile() && !receiptInfo.isSymbolicLink(),
          `${receipt} must be a regular file`);
        resultReceipts += 1;
      } else incompleteRunDirectories += 1;
      observations.push({animationId: entry.animationId, runId: candidate.name,
        resultReceiptPresent: present});
    }
  }
  return {runDirectories, resultReceipts, incompleteRunDirectories, observations};
}

function verifyDiagnosticClosureContract(source) {
  invariant(source.includes("actual dedicated entrypoint builds one minimal diagnostic closure graph"),
    "durable diagnostic closure test title drifted");
  invariant(source.includes("buildLessonAnimateExecutionCodeClosureManifest"),
    "durable diagnostic closure test no longer invokes the real closure builder");
  for (const file of EXPECTED_DIAGNOSTIC_MODULES) {
    invariant(source.includes(JSON.stringify(file)),
      `durable diagnostic closure test lost module ${file}`);
  }
  for (const forbidden of ["run-assisted-animate-authoring-audit", "g5-", "finalize-",
    "stage-animate", "materialize-g5", "node:zlib"]) {
    invariant(source.includes(JSON.stringify(forbidden)),
      `durable diagnostic closure test lost forbidden-module guard ${forbidden}`);
  }
  return true;
}

function noTemporalDriftKeys(value, pathLabel = "report") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => noTemporalDriftKeys(item, `${pathLabel}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    invariant(!/(?:generated|checked|observed|created|updated)At$|timestamp|currentTime/iu.test(key),
      `${pathLabel}.${key} introduces time drift`);
    noTemporalDriftKeys(item, `${pathLabel}.${key}`);
  }
}

export function assertG4L10AnimateAuthoringV2ControlReadinessReport(report) {
  invariant(report?.schemaVersion === 1
    && report.reportType === "g4-l10-animate-authoring-v2-control-readiness",
  "report schema or type drifted");
  invariant(report.release?.releaseId === LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID
    && report.release.memberCount === 47
    && report.release.flaBackedCount === 34
    && report.release.swfOnlyCount === 13,
  "release 47=34 FLA+13 SWF-only partition drifted");
  invariant(report.fixedInputs.queue.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256
    && report.fixedInputs.queue.mode === "0444"
    && report.fixedInputs.staging.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256
    && report.fixedInputs.staging.mode === "0444"
    && report.fixedInputs.sourceFreeze.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_SOURCE_FREEZE_SHA256
    && report.fixedInputs.sourceFreeze.mode === "0600",
  "fixed queue, staging, or source-freeze binding drifted");
  for (const [name, binding] of Object.entries(report.controlBindings.project)) {
    invariant(typeof name === "string" && binding && HASH.test(binding.sha256 || "")
      && Number.isSafeInteger(binding.bytes) && /^[0-7]{4}$/u.test(binding.mode || ""),
    `project control binding ${name} is invalid`);
  }
  for (const key of ["node", "processProbe", "aclProbe", "adobeAnimate"]) {
    const binding = report.controlBindings.external[key];
    invariant(binding && path.isAbsolute(binding.file) && HASH.test(binding.sha256 || "")
      && Number.isSafeInteger(binding.bytes) && /^[0-7]{4}$/u.test(binding.mode || ""),
    `external control binding ${key} is invalid`);
  }
  invariant(report.diagnosticClosure.referenceType === "actual-read-only-diagnostic-closure-rebuild"
    && report.diagnosticClosure.actualBuildPerformedByThisBuilder === true
    && report.diagnosticClosure.diagnosticReplayHelper.executed === false
    && report.diagnosticClosure.diagnosticReplayHelper.productionAuthority === false
    && report.diagnosticClosure.replayLockHelperAuthority === "diagnostic-project-fixture"
    && report.diagnosticClosure.moduleCount === 7
    && JSON.stringify(report.diagnosticClosure.expectedModules)
      === JSON.stringify(EXPECTED_DIAGNOSTIC_MODULES)
    && JSON.stringify(report.diagnosticClosure.modules.map(({file}) => file))
      === JSON.stringify(EXPECTED_DIAGNOSTIC_MODULES),
  "diagnostic exact seven-module closure contract drifted");
  invariant(report.productionClosure.buildableNow === false
    && report.productionClosure.buildAttemptedByThisBuilder === false
    && report.productionClosure.fixedHelperAbsent === true,
  "production closure must remain explicitly unbuildable while the fixed helper is absent");
  invariant(report.fixedProductionPathProbe.allAbsent === true
    && report.fixedProductionPathProbe.paths.every((item) => item.exists === false),
  "fixed /Library production trust/helper/replay paths are no longer all absent");
  invariant(report.receiptInventory.assignmentReceipts === 0
    && report.receiptInventory.authorizationReceipts === 0
    && report.receiptInventory.productionClosureReceipts === 0
    && report.receiptInventory.namedOperators === 0
    && report.receiptInventory.runDirectories === 0
    && report.receiptInventory.runReceipts === 0,
  "current receipt/operator/run zero baseline drifted");
  invariant(report.resultIndexAdmission.sourceConstantVerifiedFalse === true
    && report.resultIndexAdmission.enabled === false
    && report.resultIndexAdmission.verifiedWorkOnlyAuthoringAudits === 0
    && JSON.stringify(report.resultIndexAdmission.authorityBoundary)
      === JSON.stringify(EXPECTED_RESULT_INDEX_AUTHORITY_BOUNDARY)
    && Object.values(report.resultIndexAdmission.acceptanceCounters)
      .every((value) => value === 0 || value === false),
  "result-index admission or authoring-zero boundary drifted");
  invariant(report.nativeCapability.enabled === false
    && report.nativeCapability.requiredStateForAdmission === true
    && report.nativeCapability.currentState
      === "disabled-pending-reviewed-root-owned-native-launcher-capability",
  "native launch capability must remain explicitly disabled");
  invariant(report.admission.admitted === false && report.admission.executionAuthorized === false,
    "control readiness must not grant admission or execution authority");
  invariant(Object.values(report.evidenceEffects).every((value) => value === 0 || value === false),
    "acceptance-neutral report advanced an evidence or acceptance state");
  invariant(report.blockers.length === P1_BLOCKERS.length
    && report.blockers.every((item, index) => item.blockerId === P1_BLOCKERS[index].blockerId
      && item.severity === "P1" && item.satisfied === false
      && item.requirement === P1_BLOCKERS[index].requirement),
  "required P1 blocker set drifted");
  invariant(report.safety.animateLaunched === false
    && report.safety.libraryWritten === false
    && report.safety.gitInvoked === false
    && report.safety.resultIndexAdmissionConstantChanged === false
    && report.safety.reportOnlyWrites === true,
  "builder safety boundary drifted");
  noTemporalDriftKeys(report);
  return true;
}

export async function writeOrCheckReport(root, relativeFile, bytes, check) {
  const reportsRoot = path.join(root, "reports");
  const target = path.join(root, ...relativeFile.split("/"));
  invariant(path.dirname(target) === reportsRoot, `${relativeFile} is outside the reports root`);
  if (await exists(target)) {
    const targetInfo = await lstat(target);
    invariant(targetInfo.isFile() && !targetInfo.isSymbolicLink(), `${relativeFile} must be a regular file`);
  }
  if (check) {
    invariant((await readFile(target)).equals(bytes), `${relativeFile} is stale`);
    return;
  }
  await mkdir(reportsRoot, {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, bytes, {flag: "wx"});
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

function renderMarkdown(report, jsonIdentity) {
  return [
    "# G4 L10 Animate authoring v2 control readiness",
    "",
    "This is a deterministic, acceptance-neutral control-readiness snapshot. It re-verifies fixed custody and code/tool identities, but it does not authorize or launch Adobe Animate and does not advance any migration or acceptance gate.",
    "",
    "## Outcome",
    "",
    `- Control admission: **${report.admission.admitted}**`,
    `- Execution authorized: **${report.admission.executionAuthorized}**`,
    `- Release partition: **${report.release.memberCount} = ${report.release.flaBackedCount} FLA-backed + ${report.release.swfOnlyCount} SWF-only**`,
    `- Fixed queue: \`${report.fixedInputs.queue.sha256}\``,
    `- Fixed staging manifest: \`${report.fixedInputs.staging.sha256}\``,
    `- Fixed source freeze: \`${report.fixedInputs.sourceFreeze.sha256}\``,
    `- Actual read-only diagnostic closure rebuild: **${report.diagnosticClosure.moduleCount} exact modules**`,
    `- Production closure buildable now: **${report.productionClosure.buildableNow}**`,
    `- Native launch capability: **${report.nativeCapability.enabled}**`,
    `- Assignment / authorization / production-closure receipts: **${report.receiptInventory.assignmentReceipts} / ${report.receiptInventory.authorizationReceipts} / ${report.receiptInventory.productionClosureReceipts}**`,
    `- Named operators / run receipts: **${report.receiptInventory.namedOperators} / ${report.receiptInventory.runReceipts}**`,
    `- Existing result-index passing admission: **${report.resultIndexAdmission.enabled}**`,
    `- JSON: \`${jsonIdentity.file}\` / \`${jsonIdentity.sha256}\``,
    "",
    "The fixed `/Library` trust root, replay helper, and replay root are absent. Therefore the production closure cannot be constructed, and no owner-authorized one-row execution can be admitted.",
    "",
    "## P1 blockers",
    "",
    ...report.blockers.map((item) => `- \`${item.blockerId}\`: ${item.requirement}`),
    "",
    "## Evidence effects",
    "",
    ...Object.entries(report.evidenceEffects).map(([key, value]) => `- ${key}: \`${value}\``),
    "",
    "## Boundaries",
    "",
    "- This builder actually rediscovers the dedicated entrypoint's static module graph with a non-authoritative, never-executed diagnostic helper fixture and requires the exact seven-module set. That diagnostic graph is not a production closure receipt or execution authority.",
    "- The production closure was not attempted because its fixed root-owned `/Library` helper is absent.",
    "- Ruffle remains a forensic reference only. No original-runtime, Ruffle, audio, current-JavaScript, human, owner, migration-completion, strict, whole-lesson integration, or publication state is advanced.",
    "- The existing result-index admission constant remains false and was not modified.",
    "",
  ].join("\n");
}

export async function buildG4L10AnimateAuthoringV2ControlReadiness({
  root = ROOT,
  check = false,
  persist = true,
} = {}) {
  const resolvedRoot = await realpath(root);
  invariant(resolvedRoot === path.resolve(root), "project root must be a real canonical directory");
  const fixedPaths = lessonAnimateOneRowAuthorizationV2FixedPaths(resolvedRoot);

  const stage = await stageAnimateReleaseFlaCopies({
    root: resolvedRoot,
    releaseId: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
    check: true,
  });
  invariant(stage.manifestSha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256,
    "recomputed staging manifest differs from the fixed v2 hash");
  invariant(stage.queueSha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256,
    "recomputed queue differs from the fixed v2 hash");
  invariant(stage.manifest.release.selectedMemberCount === 47
    && stage.manifest.entries.length === 34
    && stage.manifest.noFlaDispositions.length === 13,
  "recomputed release is not 47=34 FLA+13 SWF-only");

  const queueRelative = portable(resolvedRoot, fixedPaths.queue);
  const stagingRelative = portable(resolvedRoot, fixedPaths.staging);
  const [queueBinding, stagingBinding, sourceFreezeBinding] = await Promise.all([
    bindProjectFile(resolvedRoot, queueRelative),
    bindProjectFile(resolvedRoot, stagingRelative),
    bindProjectFile(resolvedRoot, SOURCE_FREEZE_RELATIVE),
  ]);
  invariant(queueBinding.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_QUEUE_SHA256
    && stagingBinding.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_STAGING_SHA256
    && sourceFreezeBinding.sha256 === LESSON_ANIMATE_ONE_ROW_V2_FIXED_SOURCE_FREEZE_SHA256,
  "fixed input content address drifted");

  const projectBindings = {};
  for (const [key, file] of PROJECT_CONTROL_FILES) {
    projectBindings[key] = await bindProjectFile(resolvedRoot, file);
  }
  const externalBindings = {};
  for (const [key, file] of [
    ["node", process.execPath],
    ["processProbe", "/bin/ps"],
    ["aclProbe", "/bin/ls"],
    ["adobeAnimate", DEFAULT_ANIMATE_BINARY],
  ]) externalBindings[key] = await bindAbsoluteFile(resolvedRoot, file);

  const diagnosticTest = await readBoundProjectFile(resolvedRoot,
    DIAGNOSTIC_CLOSURE_TEST_RELATIVE);
  verifyDiagnosticClosureContract(diagnosticTest.bytes.toString("utf8"));
  const diagnosticClosureManifest = await buildLessonAnimateExecutionCodeClosureManifest({
    projectRoot: resolvedRoot,
    entrypoint: LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT,
    toolchain: {
      aclProbe: "/bin/ls",
      nodeExecutable: process.execPath,
      processProbe: "/bin/ps",
      jsfl: "scripts/animate-audit-current-document.jsfl",
      animateExecutable: DEFAULT_ANIMATE_BINARY,
      replayLockHelper: DIAGNOSTIC_REPLAY_HELPER_RELATIVE,
    },
  });
  const actualDiagnosticModules = diagnosticClosureManifest.modules.map(({file}) => file);
  invariant(JSON.stringify(actualDiagnosticModules)
    === JSON.stringify(EXPECTED_DIAGNOSTIC_MODULES),
  "actual dedicated-entrypoint diagnostic closure is not the exact seven-module set");
  invariant(diagnosticClosureManifest.replayLockHelperAuthority
    === "diagnostic-project-fixture",
  "actual diagnostic closure must use only the non-authoritative project fixture");
  invariant(diagnosticClosureManifest.toolchain.replayLockHelper.sha256
    === projectBindings.diagnosticReplayHelperFixture.sha256
    && diagnosticClosureManifest.toolchain.replayLockHelper.mode === "0555",
  "actual diagnostic closure helper binding drifted");

  const productionPaths = await Promise.all([
    LESSON_ANIMATE_PRODUCTION_OWNER_ROOT,
    LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH,
    LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_ROOT,
    LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
    LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
  ].map((file) => probeFixedPath(file)));
  const allProductionPathsAbsent = productionPaths.every((item) => item.exists === false);
  const helperAbsent = productionPaths
    .find((item) => item.file === LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH)?.exists === false;

  const authority = await inspectAuthorityReceipts(resolvedRoot, fixedPaths.authorityRoot);
  const runs = await inspectRunReceipts(resolvedRoot, stage.manifest.entries);
  invariant(authority.assignmentReceipts === 0 && authority.authorizationReceipts === 0
    && authority.productionClosureReceipts === 0 && authority.unexpectedFiles.length === 0,
  "v2 authority receipt baseline is no longer zero and clean");
  invariant(runs.runDirectories === 0 && runs.resultReceipts === 0,
    "dedicated run receipt baseline is no longer zero");

  const resultIndex = await readBoundJson(resolvedRoot, RESULT_INDEX_RELATIVE);
  const resultIndexBuilder = await readBoundProjectFile(resolvedRoot,
    RESULT_INDEX_BUILDER_RELATIVE);
  const resultIndexSource = resultIndexBuilder.bytes.toString("utf8");
  invariant(resultIndexSource.includes("const PASSING_RECEIPT_ADMISSION_ENABLED = false;"),
    "result-index passing-receipt admission constant is no longer false");
  invariant(!resultIndexSource.includes("const PASSING_RECEIPT_ADMISSION_ENABLED = true;"),
    "result-index passing-receipt admission was enabled");
  invariant(resultIndex.document.passingReceiptAdmission?.enabled === false
    && resultIndex.document.summary?.selectedReleaseMembers === 47
    && resultIndex.document.summary?.flaApplicableItems === 34
    && resultIndex.document.summary?.swfOnlyNotApplicableItems === 13
    && resultIndex.document.summary?.totalAttemptReceipts === 0
    && resultIndex.document.summary?.verifiedWorkOnlyAuthoringAudits === 0
    && resultIndex.document.inputs?.namedOperatorAssignmentReceipt === null
    && Array.isArray(resultIndex.document.inputs?.perRowSessionAuthorizationReceipts)
    && resultIndex.document.inputs.perRowSessionAuthorizationReceipts.length === 0,
  "current L10 result index no longer records the zero, fail-closed baseline");
  invariant(JSON.stringify(resultIndex.document.authorityBoundary)
    === JSON.stringify(EXPECTED_RESULT_INDEX_AUTHORITY_BOUNDARY),
  "current L10 result-index authority boundary drifted");
  for (const [key, expected] of Object.entries({
    primaryRowsTouched: 0,
    observedIncompleteRunDirectories: 0,
    totalAttemptReceipts: 0,
    passedAttemptReceipts: 0,
    failedAttemptReceipts: 0,
    verifiedWorkOnlyAuthoringAudits: 0,
    flaApplicableAuthoringCoverageComplete: false,
    originalRuntimeBaselinesEstablished: 0,
    humanVisualReviewsEstablished: 0,
    ownerAcceptancesEstablished: 0,
    strictAcceptancesEstablished: 0,
    strictAcceptanceEffect: false,
  })) invariant(resultIndex.document.summary?.[key] === expected,
    `current L10 result-index summary ${key} drifted`);

  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-animate-authoring-v2-control-readiness",
    scope: "Deterministic acceptance-neutral control readiness only; no Animate launch, production authority, evidence promotion, acceptance, integration, or publication",
    release: {
      releaseId: LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
      grade: 4,
      lesson: 10,
      publicationMode: "atomic",
      memberCount: 47,
      flaBackedCount: 34,
      swfOnlyCount: 13,
      partitionRecomputedFromCurrentCatalogsAndPhysicalSources: true,
    },
    fixedInputs: {
      queue: queueBinding,
      staging: stagingBinding,
      sourceFreeze: sourceFreezeBinding,
      releaseStagingCheckModeRecomputed: true,
      sourceAndReadOnlyCopyRowsReverified: 34,
      swfOnlyDispositionsReverified: 13,
    },
    controlBindings: {
      project: projectBindings,
      external: {
        node: {...externalBindings.node, version: process.version},
        processProbe: externalBindings.processProbe,
        aclProbe: externalBindings.aclProbe,
        adobeAnimate: externalBindings.adobeAnimate,
      },
    },
    diagnosticClosure: {
      referenceType: "actual-read-only-diagnostic-closure-rebuild",
      test: diagnosticTest.binding,
      actualBuildPerformedByThisBuilder: true,
      entrypoint: LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT,
      moduleCount: diagnosticClosureManifest.modules.length,
      expectedModules: EXPECTED_DIAGNOSTIC_MODULES,
      modules: diagnosticClosureManifest.modules,
      replayLockHelperAuthority: diagnosticClosureManifest.replayLockHelperAuthority,
      diagnosticReplayHelper: {
        ...diagnosticClosureManifest.toolchain.replayLockHelper,
        executed: false,
        productionAuthority: false,
      },
      excludesGenericG5FinalizeStagingAndZlib: true,
      productionAuthorityEffect: false,
    },
    productionClosure: {
      buildableNow: false,
      buildAttemptedByThisBuilder: false,
      fixedHelper: LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
      fixedHelperAbsent: helperAbsent,
      reason: "The fixed /Library root-owned replay-lock helper is absent; a production execution-code closure cannot be constructed or receipted.",
      receiptCount: authority.productionClosureReceipts,
    },
    fixedProductionPathProbe: {
      readOnly: true,
      allAbsent: allProductionPathsAbsent,
      paths: productionPaths,
      writes: 0,
    },
    nativeCapability: {
      enabled: LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED,
      requiredStateForAdmission: true,
      currentState: "disabled-pending-reviewed-root-owned-native-launcher-capability",
    },
    receiptInventory: {
      authorityRoot: authority.root,
      authorityRootPresent: authority.rootPresent,
      assignmentReceipts: authority.assignmentReceipts,
      authorizationReceipts: authority.authorizationReceipts,
      productionClosureReceipts: authority.productionClosureReceipts,
      namedOperators: authority.assignmentReceipts,
      runDirectories: runs.runDirectories,
      runReceipts: runs.resultReceipts,
      incompleteRunDirectories: runs.incompleteRunDirectories,
      unexpectedAuthorityFiles: authority.unexpectedFiles,
    },
    resultIndexAdmission: {
      report: resultIndex.binding,
      builder: projectBindings.resultIndexBuilder,
      sourceConstantVerifiedFalse: true,
      enabled: false,
      state: resultIndex.document.passingReceiptAdmission.state,
      totalAttemptReceipts: resultIndex.document.summary.totalAttemptReceipts,
      verifiedWorkOnlyAuthoringAudits:
        resultIndex.document.summary.verifiedWorkOnlyAuthoringAudits,
      authorityBoundary: resultIndex.document.authorityBoundary,
      acceptanceCounters: {
        primaryRowsTouched: resultIndex.document.summary.primaryRowsTouched,
        observedIncompleteRunDirectories:
          resultIndex.document.summary.observedIncompleteRunDirectories,
        totalAttemptReceipts: resultIndex.document.summary.totalAttemptReceipts,
        passedAttemptReceipts: resultIndex.document.summary.passedAttemptReceipts,
        failedAttemptReceipts: resultIndex.document.summary.failedAttemptReceipts,
        verifiedWorkOnlyAuthoringAudits:
          resultIndex.document.summary.verifiedWorkOnlyAuthoringAudits,
        flaApplicableAuthoringCoverageComplete:
          resultIndex.document.summary.flaApplicableAuthoringCoverageComplete,
        originalRuntimeBaselinesEstablished:
          resultIndex.document.summary.originalRuntimeBaselinesEstablished,
        humanVisualReviewsEstablished:
          resultIndex.document.summary.humanVisualReviewsEstablished,
        ownerAcceptancesEstablished:
          resultIndex.document.summary.ownerAcceptancesEstablished,
        strictAcceptancesEstablished:
          resultIndex.document.summary.strictAcceptancesEstablished,
        strictAcceptanceEffect: resultIndex.document.summary.strictAcceptanceEffect,
      },
      changedByThisBuilder: false,
    },
    admission: {
      admitted: false,
      executionAuthorized: false,
      reasons: [
        "fixed production trust/helper/replay custody is absent",
        "native launch capability is disabled",
        "assignment, one-row authorization, and production closure receipts are absent",
        "named operator and run receipts are absent",
        "six P1 control blockers remain unresolved",
        "existing result-index passing-receipt admission remains false",
      ],
    },
    evidenceEffects: {
      authoringAuditsEstablished: 0,
      originalRuntimeEvidence: 0,
      ruffleBaseline: 0,
      audioCueAcceptance: 0,
      currentJavaScript: 0,
      humanVisualReview: 0,
      ownerAcceptance: 0,
      strictCompletion: 0,
      migrationCompletion: 0,
      wholeLessonIntegration: 0,
      publication: 0,
      anyGateAdvanced: false,
    },
    blockers: P1_BLOCKERS,
    determinism: {
      reportIncludesWallClock: false,
      wallClockReadForReportContent: false,
      processTableSnapshotRecorded: false,
      sourceOrder: "fixed arrays and ascending release order",
      checkMode: "recompute exact bytes and compare without writes",
    },
    safety: {
      animateLaunched: false,
      animateProcessProbeExecuted: false,
      libraryWritten: false,
      sourceOrMigrationWritten: false,
      gitInvoked: false,
      resultIndexAdmissionConstantChanged: false,
      reportOnlyWrites: true,
      normalModeWriteAllowlist: [REPORT_JSON_RELATIVE, REPORT_MARKDOWN_RELATIVE],
      checkModeWrites: 0,
    },
    limitations: [
      "Hash/mode bindings and source/copy revalidation establish only current control inputs and custody; they do not establish an Adobe Animate authoring audit.",
      "The durable diagnostic closure test is not a production closure receipt and grants no execution authority.",
      "The installed Animate executable is hash-bound but is not launched or treated as proof of legacy-FLA behavior.",
      "Ruffle remains a forensic reference and cannot establish authoritative original-runtime behavior or fidelity.",
      "This report cannot advance audio, current-JavaScript, human, owner, strict, whole-lesson integration, or publication state.",
    ],
  };
  assertG4L10AnimateAuthoringV2ControlReadinessReport(report);

  const jsonBytes = Buffer.from(stableJson(report));
  const jsonIdentity = {
    file: REPORT_JSON_RELATIVE,
    sha256: sha256(jsonBytes),
    bytes: jsonBytes.length,
  };
  const markdownBytes = Buffer.from(renderMarkdown(report, jsonIdentity));
  const markdownIdentity = {
    file: REPORT_MARKDOWN_RELATIVE,
    sha256: sha256(markdownBytes),
    bytes: markdownBytes.length,
  };
  if (persist) {
    await writeOrCheckReport(resolvedRoot, REPORT_JSON_RELATIVE, jsonBytes, check);
    await writeOrCheckReport(resolvedRoot, REPORT_MARKDOWN_RELATIVE, markdownBytes, check);
  }
  return {report, jsonIdentity, markdownIdentity, jsonBytes, markdownBytes};
}

export function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const value of argv) {
    if (value === "--check") {
      invariant(options.check === false, "--check may be supplied only once");
      options.check = true;
    } else if (value === "--help" || value === "-h") {
      invariant(options.help === false, "help may be supplied only once");
      options.help = true;
    } else throw new Error(`G4 L10 Animate v2 control readiness: unknown option ${value}`);
  }
  invariant(!(options.help && options.check), "--help and --check cannot be combined");
  return options;
}

function help() {
  return [
    "Usage: node scripts/build-g4-l10-animate-authoring-v2-control-readiness.mjs [--check]",
    "",
    "Re-verifies the fixed 47-member G4 L10 release, v2 queue/staging/source-freeze",
    "bindings, code/tool modes and hashes, absent fixed /Library controls, zero",
    "authority/operator/run receipts, an actual read-only exact-seven-module",
    "diagnostic closure rebuild, and the still-false result-index admission constant.",
    "",
    "Normal mode writes only the deterministic acceptance-neutral JSON/Markdown",
    "reports. --check writes nothing. Neither mode launches Animate, writes /Library,",
    "runs Git, or advances authoring/runtime/JavaScript/review/strict/release state.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const result = await buildG4L10AnimateAuthoringV2ControlReadiness(options);
  console.log(JSON.stringify({
    status: options.check ? "checked" : "built",
    admission: result.report.admission.admitted,
    release: result.report.release,
    receiptInventory: result.report.receiptInventory,
    diagnosticModuleCount: result.report.diagnosticClosure.moduleCount,
    productionClosureBuildable: result.report.productionClosure.buildableNow,
    animateLaunched: false,
    reports: {json: result.jsonIdentity, markdown: result.markdownIdentity},
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
