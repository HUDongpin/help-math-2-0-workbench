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
  lessonAnimateOneRowAuthorizationV2FixedPaths,
  LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
  LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED,
} from "./lib/lesson-animate-one-row-authorization-v2.mjs";
import {
  LESSON_ANIMATE_PRODUCTION_OWNER_ROOT,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_ROOT,
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
  LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH,
} from "./lib/lesson-animate-production-trust.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = await realpath(path.resolve(path.dirname(SCRIPT_PATH), ".."));
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const REPORT_JSON_RELATIVE =
  "reports/g4-l10-animate-authoring-v2-control-readiness-successor.json";
const REPORT_MARKDOWN_RELATIVE =
  "reports/g4-l10-animate-authoring-v2-control-readiness-successor.md";
const PREDECESSOR_JSON_RELATIVE =
  "reports/g4-l10-animate-authoring-v2-control-readiness.json";
const PREDECESSOR_MARKDOWN_RELATIVE =
  "reports/g4-l10-animate-authoring-v2-control-readiness.md";
const STAGING_RELATIVE =
  "work/animate/release-read-only-fla-copies/lesson-g04-l10-perimeter-area/all/" +
  "manifests/sha256/1266c971b6c2651187e18e37fa7654070aecec1db84e91102b6c6be96399bf57.json";
const RESULT_INDEX_RELATIVE = "reports/g4-l10-animate-authoring-audit-index.json";
const RESULT_INDEX_BUILDER_RELATIVE =
  "scripts/build-lesson-animate-authoring-audit-index.mjs";
const AUTHORIZATION_V2_RELATIVE =
  "scripts/lib/lesson-animate-one-row-authorization-v2.mjs";
const SUCCESSOR_TEST_RELATIVE =
  "scripts/build-g4-l10-animate-authoring-v2-control-readiness-successor.test.mjs";
const HASH = /^[a-f0-9]{64}$/u;

const EXPECTED_PREDECESSORS = Object.freeze({
  json: Object.freeze({
    file: PREDECESSOR_JSON_RELATIVE,
    sha256: "388949eea069fb112c5d05bcdc9697c4dc2a806c5c048b1182850dbe69ee4959",
    bytes: 17_797,
    mode: "0644",
  }),
  markdown: Object.freeze({
    file: PREDECESSOR_MARKDOWN_RELATIVE,
    sha256: "af7ad6655cf362543e8bf01ab57fdfcfc2edb7b6675c337f61a4420eb71dffc4",
    bytes: 3_475,
    mode: "0644",
  }),
});

const EXPECTED_PROJECT_LOCAL_EVIDENCE = Object.freeze({
  runnerSupervisor: Object.freeze({
    source: Object.freeze({
      file: "scripts/lib/lesson-animate-authoring-audit-core.mjs",
      sha256: "68af98cc9ac25f2a0aae421b6cf7fa43f1bb2c118e86598f6df00f53cc2aae85",
      bytes: 48_267,
      mode: "0644",
    }),
    tests: Object.freeze({
      file: "scripts/lib/lesson-animate-authoring-audit-core.test.mjs",
      sha256: "dc534d9ba28054646325d82968f45b2d5d87de041dc514dedbb39d75b9042585",
      bytes: 8_427,
      mode: "0644",
    }),
  }),
  replayHelperSupervisor: Object.freeze({
    source: Object.freeze({
      file: "scripts/lib/lesson-animate-prebuilt-atomic-replay-lock.mjs",
      sha256: "7e6e0a472d449d21d54625649f628b6dba6400a3609b2dcd8fdedea3e9a921df",
      bytes: 31_519,
      mode: "0644",
    }),
    tests: Object.freeze({
      file: "scripts/lib/lesson-animate-prebuilt-atomic-replay-lock.test.mjs",
      sha256: "d98a59e339b9a5f71e096f6d8a09e07f2c67a04a891c5987b57fb965e2728e69",
      bytes: 24_650,
      mode: "0644",
    }),
  }),
  dedicatedEntrypointWiringTests: Object.freeze({
    file: "scripts/run-lesson-g4-l10-authorized-one-row-audit.test.mjs",
    sha256: "d2635a032c4154bfeb4f60c8c9748b713f5b489f22e50c7faef2f4a6a4fe68a1",
    bytes: 7_734,
    mode: "0644",
  }),
});

const BLOCKER_DEFINITIONS = Object.freeze([
  Object.freeze({
    blockerId: "root-owned-native-launcher-capability",
    requirement: "A reviewed, fixed, root-owned native launcher/capability must replace mutable JavaScript process identity and plain-context handoff.",
    projectLocalSatisfied: false,
  }),
  Object.freeze({
    blockerId: "bundle-process-family-lifecycle",
    requirement: "Lifecycle proof must cover the full Animate bundle process family, including helpers, CEP/renderer processes, descendants, and reparented descendants.",
    projectLocalSatisfied: false,
  }),
  Object.freeze({
    blockerId: "kill-unconfirmed-supervisor-lifecycle",
    requirement: "Kill-unconfirmed runner and replay-helper supervisors must detach or unref bounded child handles so a residual child cannot retain the Node event loop indefinitely.",
    projectLocalSatisfied: true,
  }),
  Object.freeze({
    blockerId: "native-clean-environment",
    requirement: "The native launcher must supply a fixed clean environment, including HOME, USER, LOGNAME, TMPDIR, PATH, LANG, and LC_ALL.",
    projectLocalSatisfied: false,
  }),
  Object.freeze({
    blockerId: "same-uid-generated-artifact-toctou",
    requirement: "Generated controller, JSFL, launch-intent, and run artifacts must resist same-UID replacement between validation, durable transition, and spawn, using protected custody and stable descriptors.",
    projectLocalSatisfied: false,
  }),
  Object.freeze({
    blockerId: "same-uid-replay-resistance",
    requirement: "Replay state must resist same-UID pre-claim deletion, replacement, and denial-of-service outside project-writable custody.",
    projectLocalSatisfied: false,
  }),
]);

const ACCEPTANCE_EFFECTS = Object.freeze({
  animateAuthoringAudit: false,
  originalRuntimeEvidence: false,
  ruffleBaselineAuthority: false,
  audioCueAcceptance: false,
  currentJavascriptRegistration: false,
  behaviorAcceptance: false,
  fullFrameRmseAcceptance: false,
  humanVisualReview: false,
  engineeringReview: false,
  ownerAcceptance: false,
  strictCompletion: false,
  wholeLessonIntegration: false,
  publication: false,
});

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`G4 L10 Animate v2 control successor: ${message}`);
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function modeOf(info) {
  const value = typeof info.mode === "bigint"
    ? Number(info.mode & 0o7777n) : info.mode & 0o7777;
  return value.toString(8).padStart(4, "0");
}

function sameStableIdentity(left, right) {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mode === right.mode
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs;
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

function projectFile(root, relativeFile) {
  invariant(typeof relativeFile === "string" && relativeFile.length > 0,
    "project file must be a non-empty path");
  const absolute = path.resolve(root, ...relativeFile.split("/"));
  const relative = path.relative(root, absolute);
  invariant(relative === relativeFile.split("/").join(path.sep),
    `${relativeFile} is not one canonical project-relative path`);
  return absolute;
}

async function readStableProjectFile(root, relativeFile) {
  const absolute = projectFile(root, relativeFile);
  invariant(await realpath(absolute) === absolute,
    `${relativeFile} or one of its path components is symbolic`);
  const before = await lstat(absolute, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativeFile} must be one ordinary single-link file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(sameStableIdentity(before, after), `${relativeFile} changed while read`);
  invariant(bytes.length === Number(after.size), `${relativeFile} size drifted while read`);
  return Object.freeze({
    descriptor: Object.freeze({
      file: relativeFile,
      sha256: sha256(bytes),
      bytes: bytes.length,
      mode: modeOf(after),
    }),
    bytes,
  });
}

function assertExactDescriptor(actual, expected, label) {
  invariant(actual.file === expected.file
    && actual.sha256 === expected.sha256
    && actual.bytes === expected.bytes
    && actual.mode === expected.mode,
  `${label} descriptor drifted`);
}

function assertValidDescriptor(value, label) {
  invariant(value && typeof value.file === "string" && value.file.length > 0
    && HASH.test(value.sha256 || "")
    && Number.isSafeInteger(value.bytes) && value.bytes >= 0
    && /^[0-7]{4}$/u.test(value.mode || ""), `${label} descriptor is invalid`);
}

async function collectRegularFiles(directory, relative = "") {
  if (!(await exists(directory))) return [];
  const information = await lstat(directory);
  invariant(information.isDirectory() && !information.isSymbolicLink(),
    `${directory} must be a real directory`);
  const files = [];
  const entries = (await readdir(directory, {withFileTypes: true}))
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
  for (const entry of entries) {
    invariant(!entry.isSymbolicLink(), `${directory} contains a symbolic link`);
    const child = path.join(directory, entry.name);
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await collectRegularFiles(child, childRelative));
    } else {
      invariant(entry.isFile(), `${child} has an unsupported filesystem kind`);
      files.push(childRelative);
    }
  }
  return files;
}

async function inspectAuthorityReceipts(authorityRoot) {
  const files = await collectRegularFiles(authorityRoot);
  const assignments = files.filter((file) =>
    file.startsWith("assignments/sha256/") && file.endsWith(".json"));
  const authorizations = files.filter((file) =>
    file.startsWith("session-authorizations/sha256/") && file.endsWith(".json"));
  const closures = files.filter((file) =>
    file.startsWith("execution-code-closures/sha256/") && file.endsWith(".json"));
  const known = new Set([...assignments, ...authorizations, ...closures]);
  return Object.freeze({
    authorityRootPresent: await exists(authorityRoot),
    assignmentReceipts: assignments.length,
    authorizationReceipts: authorizations.length,
    productionClosureReceipts: closures.length,
    namedOperators: assignments.length,
    unexpectedFiles: files.filter((file) => !known.has(file)),
  });
}

async function inspectRunReceipts(root, animationIds) {
  let runDirectories = 0;
  let runReceipts = 0;
  let incompleteRunDirectories = 0;
  for (const animationId of animationIds) {
    const runsRoot = path.join(root, "work", "animate", "dependency-authoring-audits",
      animationId, "runs");
    if (!(await exists(runsRoot))) continue;
    const information = await lstat(runsRoot);
    invariant(information.isDirectory() && !information.isSymbolicLink(),
      `${animationId} runs root must be one real directory`);
    const entries = (await readdir(runsRoot, {withFileTypes: true}))
      .sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      invariant(entry.isDirectory() && !entry.isSymbolicLink()
        && /^run-[A-Za-z0-9_-]{8,96}$/u.test(entry.name),
      `${animationId} has a malformed run entry`);
      runDirectories += 1;
      const receipt = path.join(runsRoot, entry.name, "assisted-run-result.json");
      if (await exists(receipt)) runReceipts += 1;
      else incompleteRunDirectories += 1;
    }
  }
  return Object.freeze({runDirectories, runReceipts, incompleteRunDirectories});
}

async function probeAbsentProductionPaths() {
  const paths = [
    LESSON_ANIMATE_PRODUCTION_OWNER_ROOT,
    LESSON_ANIMATE_PRODUCTION_TRUST_ROOT_PATH,
    LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_ROOT,
    LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
    LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_ROOT,
  ];
  const probes = [];
  for (const file of paths) probes.push(Object.freeze({file, exists: await exists(file)}));
  invariant(probes.every((probe) => probe.exists === false),
    "fixed /Library production path baseline is no longer wholly absent");
  return Object.freeze(probes);
}

function assertSupervisorContracts(files) {
  const runnerSource = files.runnerSupervisor.source.bytes.toString("utf8");
  const runnerTests = files.runnerSupervisor.tests.bytes.toString("utf8");
  const replaySource = files.replayHelperSupervisor.source.bytes.toString("utf8");
  const replayTests = files.replayHelperSupervisor.tests.bytes.toString("utf8");
  const wiringTests = files.dedicatedEntrypointWiringTests.bytes.toString("utf8");

  for (const required of [
    "const releaseChildResources = ({unrefHandle = false} = {}) =>",
    "releaseChildResources({unrefHandle: killUnconfirmed})",
    "killConfirmationTimer = setTimeout",
    "killUnconfirmed: true",
  ]) invariant(runnerSource.includes(required),
    `runner supervisor lost required contract: ${required}`);
  invariant(runnerTests.includes(
    "kill-unconfirmed child destroys streams, unrefs its active handle, and settles once"),
  "runner supervisor focused test contract drifted");

  for (const required of [
    "const releaseChildResources = ({unrefHandle = false} = {}) =>",
    "EHELPERKILLUNCONFIRMED",
    "rejectOnce(unconfirmed, {unrefHandle: true})",
    "superviseLessonAnimateReplayHelperDiagnostic",
  ]) invariant(replaySource.includes(required),
    `replay-helper supervisor lost required contract: ${required}`);
  invariant(replayTests.includes(
    "kill-unconfirmed helper destroys stdio, unrefs its active handle, and rejects once"),
  "replay-helper supervisor focused test contract drifted");

  invariant(wiringTests.includes("killConfirmationTimer = setTimeout")
    && wiringTests.includes("LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED = false"),
  "dedicated entrypoint wiring regression contract drifted");
  return true;
}

function assertPredecessorSemantics(document) {
  invariant(document?.schemaVersion === 1
    && document.reportType === "g4-l10-animate-authoring-v2-control-readiness"
    && document.release?.releaseId === RELEASE_ID,
  "v2 predecessor schema, type, or release drifted");
  invariant(document.blockers?.length === 6
    && document.blockers.every((blocker) => blocker.satisfied === false),
  "v2 predecessor blocker baseline drifted");
  invariant(document.nativeCapability?.enabled === false
    && document.admission?.admitted === false
    && document.admission?.executionAuthorized === false,
  "v2 predecessor capability or admission baseline drifted");
  invariant(document.receiptInventory?.assignmentReceipts === 0
    && document.receiptInventory?.authorizationReceipts === 0
    && document.receiptInventory?.productionClosureReceipts === 0
    && document.receiptInventory?.namedOperators === 0
    && document.receiptInventory?.runReceipts === 0,
  "v2 predecessor receipt/operator/run baseline drifted");
  invariant(Object.values(document.evidenceEffects || {})
    .every((value) => value === 0 || value === false),
  "v2 predecessor evidence-effect baseline drifted");
  return true;
}

function noTemporalDriftKeys(value, label = "report") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => noTemporalDriftKeys(item, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    invariant(!/(?:generated|checked|observed|created|updated)At$|timestamp|currentTime/iu.test(key),
      `${label}.${key} introduces wall-clock drift`);
    noTemporalDriftKeys(item, `${label}.${key}`);
  }
}

function makeBlockers() {
  return BLOCKER_DEFINITIONS.map((definition) => ({
    blockerId: definition.blockerId,
    severity: "P1",
    projectLocalSatisfied: definition.projectLocalSatisfied,
    satisfied: false,
    productionSatisfied: false,
    formalSatisfied: false,
    requirement: definition.requirement,
    disposition: definition.projectLocalSatisfied
      ? "project-local-lifecycle-contract-and-focused-tests-only; production/formal blocker remains open"
      : "unresolved; no project-local, production, or formal satisfaction claimed",
  }));
}

export function assertG4L10AnimateAuthoringV2ControlReadinessSuccessor(report) {
  invariant(report?.schemaVersion === 1
    && report.reportType
      === "g4-l10-animate-authoring-v2-control-readiness-successor"
    && report.releaseId === RELEASE_ID,
  "successor schema, type, or release drifted");
  assertExactDescriptor(report.predecessor.json, EXPECTED_PREDECESSORS.json,
    "v2 JSON predecessor");
  assertExactDescriptor(report.predecessor.markdown, EXPECTED_PREDECESSORS.markdown,
    "v2 Markdown predecessor");
  invariant(report.predecessor.rewritten === false
    && report.predecessor.superseded === false,
  "v2 predecessor mutation boundary drifted");

  for (const key of ["runnerSupervisor", "replayHelperSupervisor"]) {
    for (const child of ["source", "tests"]) {
      assertExactDescriptor(report.projectLocalEvidence[key][child],
        EXPECTED_PROJECT_LOCAL_EVIDENCE[key][child], `${key}.${child}`);
    }
  }
  assertExactDescriptor(report.projectLocalEvidence.dedicatedEntrypointWiringTests,
    EXPECTED_PROJECT_LOCAL_EVIDENCE.dedicatedEntrypointWiringTests,
    "dedicated entrypoint wiring tests");
  assertValidDescriptor(report.receiptTooling.generator, "successor generator");
  assertValidDescriptor(report.receiptTooling.focusedTests,
    "successor focused tests");

  invariant(report.focusedTestObservation.executedByThisGenerator === false
    && report.focusedTestObservation.nodeVersion === "v24.18.0"
    && report.focusedTestObservation.result.tests === 33
    && report.focusedTestObservation.result.pass === 33
    && report.focusedTestObservation.result.fail === 0
    && report.focusedTestObservation.result.cancelled === 0
    && report.focusedTestObservation.result.skipped === 0
    && report.focusedTestObservation.result.todo === 0,
  "focused 33/33 project-local observation drifted");

  invariant(report.blockers.length === BLOCKER_DEFINITIONS.length,
    "six-blocker set drifted");
  for (const [index, blocker] of report.blockers.entries()) {
    const expected = BLOCKER_DEFINITIONS[index];
    invariant(blocker.blockerId === expected.blockerId
      && blocker.projectLocalSatisfied === expected.projectLocalSatisfied
      && blocker.satisfied === false
      && blocker.productionSatisfied === false
      && blocker.formalSatisfied === false
      && blocker.requirement === expected.requirement,
    `blocker ${index + 1} semantics drifted`);
  }
  invariant(report.blockerCounts.projectLocalSatisfied === 1
    && report.blockerCounts.projectLocalUnsatisfied === 5
    && report.blockerCounts.satisfied === 0
    && report.blockerCounts.productionSatisfied === 0
    && report.blockerCounts.formalSatisfied === 0
    && report.blockerCounts.productionOrFormalOpen === 6,
  "dual-layer blocker counts drifted");

  invariant(report.productionPathProbe.allAbsent === true
    && report.productionPathProbe.paths.length === 5
    && report.productionPathProbe.paths.every((item) => item.exists === false),
  "production path baseline drifted");
  invariant(report.nativeCapability.enabled === false
    && report.nativeCapability.sourceConstantVerifiedFalse === true,
  "native capability must remain false");
  invariant(report.admission.admitted === false
    && report.admission.executionAuthorized === false
    && report.admission.productionClosureBuildable === false,
  "admission/execution baseline must remain false");
  invariant(report.receiptInventory.assignmentReceipts === 0
    && report.receiptInventory.authorizationReceipts === 0
    && report.receiptInventory.productionClosureReceipts === 0
    && report.receiptInventory.namedOperators === 0
    && report.receiptInventory.runDirectories === 0
    && report.receiptInventory.runReceipts === 0
    && report.receiptInventory.incompleteRunDirectories === 0
    && report.receiptInventory.unexpectedAuthorityFiles.length === 0,
  "receipt/operator/run zero baseline drifted");
  invariant(report.resultIndexAdmission.enabled === false
    && report.resultIndexAdmission.sourceConstantVerifiedFalse === true
    && report.resultIndexAdmission.totalAttemptReceipts === 0
    && report.resultIndexAdmission.verifiedWorkOnlyAuthoringAudits === 0,
  "result-index admission baseline drifted");
  invariant(JSON.stringify(report.acceptanceEffects)
    === JSON.stringify(ACCEPTANCE_EFFECTS)
    && Object.values(report.acceptanceEffects).every((value) => value === false),
  "acceptance effect advanced");
  invariant(report.strictAcceptanceEffect === "none"
    && report.safety.v2ReportRewritten === false
    && report.safety.capabilityChanged === false
    && report.safety.animateLaunched === false
    && report.safety.gitInvoked === false
    && report.safety.checkModeWrites === 0,
  "successor safety or strict boundary drifted");
  noTemporalDriftKeys(report);
  return true;
}

export async function writeOrCheckSuccessorReport(root, relativeFile, bytes, check) {
  const reportsRoot = path.join(root, "reports");
  const target = projectFile(root, relativeFile);
  invariant(path.dirname(target) === reportsRoot,
    `${relativeFile} is outside the reports root`);
  if (check) {
    const existing = await readFile(target);
    invariant(existing.equals(bytes), `${relativeFile} is stale`);
    return "checked";
  }
  await mkdir(reportsRoot, {recursive: true});
  if (await exists(target)) {
    const targetInfo = await lstat(target);
    invariant(targetInfo.isFile() && !targetInfo.isSymbolicLink(),
      `${relativeFile} must be a regular file`);
    if ((await readFile(target)).equals(bytes)) return "unchanged";
  }
  const temporary = `${target}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
  return "written";
}

function renderMarkdown(report, jsonIdentity) {
  const local = report.blockers.find((item) => item.projectLocalSatisfied);
  return [
    "# G4 L10 Animate authoring v2 control-readiness successor",
    "",
    "This deterministic successor records one project-local lifecycle improvement without rewriting the v2 predecessor or advancing production, formal, runtime, migration, review, strict, integration, or publication state.",
    "",
    "## Outcome",
    "",
    `- Project-local satisfied controls: **${report.blockerCounts.projectLocalSatisfied}/6**`,
    `- Production/formal satisfied controls: **${report.blockerCounts.productionSatisfied}/${report.blockerCounts.formalSatisfied}**`,
    `- Project-local-only control: \`${local.blockerId}\``,
    `- Native capability enabled: **${report.nativeCapability.enabled}**`,
    `- Admission / execution authorized: **${report.admission.admitted} / ${report.admission.executionAuthorized}**`,
    `- Assignment / authorization / closure receipts: **${report.receiptInventory.assignmentReceipts} / ${report.receiptInventory.authorizationReceipts} / ${report.receiptInventory.productionClosureReceipts}**`,
    `- Named operators / run receipts: **${report.receiptInventory.namedOperators} / ${report.receiptInventory.runReceipts}**`,
    `- Focused supervisor and wiring tests: **${report.focusedTestObservation.result.pass}/${report.focusedTestObservation.result.tests} pass**`,
    `- JSON identity: \`${jsonIdentity.sha256}\` (${jsonIdentity.bytes} bytes)`,
    "",
    "## Immutable predecessor",
    "",
    `- JSON: \`${report.predecessor.json.file}\` / \`${report.predecessor.json.sha256}\` / ${report.predecessor.json.bytes} bytes / mode ${report.predecessor.json.mode}`,
    `- Markdown: \`${report.predecessor.markdown.file}\` / \`${report.predecessor.markdown.sha256}\` / ${report.predecessor.markdown.bytes} bytes / mode ${report.predecessor.markdown.mode}`,
    "- Rewritten: **false**",
    "",
    "## Dual-layer blocker state",
    "",
    "| Blocker | Project-local | Satisfied | Production | Formal |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...report.blockers.map((item) =>
      `| \`${item.blockerId}\` | ${item.projectLocalSatisfied} | ${item.satisfied} | ${item.productionSatisfied} | ${item.formalSatisfied} |`),
    "",
    "The kill-unconfirmed result is limited to the exact bound project source and tests. It does not prove the root-owned launcher, the complete Animate bundle process family, a native clean environment, protected generated-artifact custody, or same-UID replay resistance.",
    "",
    "## Bound project-local evidence",
    "",
    ...[report.projectLocalEvidence.runnerSupervisor.source,
      report.projectLocalEvidence.runnerSupervisor.tests,
      report.projectLocalEvidence.replayHelperSupervisor.source,
      report.projectLocalEvidence.replayHelperSupervisor.tests,
      report.projectLocalEvidence.dedicatedEntrypointWiringTests]
      .map((binding) => `- \`${binding.file}\` / \`${binding.sha256}\` / ${binding.bytes} bytes / mode ${binding.mode}`),
    "",
    "## Acceptance boundary",
    "",
    ...Object.entries(report.acceptanceEffects)
      .map(([key, value]) => `- ${key}: \`${value}\``),
    "",
    `Strict acceptance effect: **${report.strictAcceptanceEffect}**.`,
    "",
    "The report does not launch Animate, enable the native capability, create authority or run receipts, write `/Library`, invoke Git, or authorize any original-runtime or migration action.",
    "",
  ].join("\n");
}

export async function buildG4L10AnimateAuthoringV2ControlReadinessSuccessor({
  root = ROOT,
  persist = true,
  check = false,
} = {}) {
  invariant(typeof root === "string" && path.isAbsolute(root),
    "root must be one absolute path");
  const resolvedRoot = await realpath(root);
  invariant(resolvedRoot === root, "root must be canonical");
  invariant(LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID === RELEASE_ID,
    "authorization-v2 release identity drifted");
  invariant(LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED === false,
    "native launch capability is no longer false");
  invariant(process.version === "v24.18.0",
    "focused observation is bound to Node v24.18.0");

  const predecessorJson = await readStableProjectFile(resolvedRoot,
    PREDECESSOR_JSON_RELATIVE);
  const predecessorMarkdown = await readStableProjectFile(resolvedRoot,
    PREDECESSOR_MARKDOWN_RELATIVE);
  assertExactDescriptor(predecessorJson.descriptor, EXPECTED_PREDECESSORS.json,
    "v2 JSON predecessor");
  assertExactDescriptor(predecessorMarkdown.descriptor,
    EXPECTED_PREDECESSORS.markdown, "v2 Markdown predecessor");
  const predecessorDocument = JSON.parse(predecessorJson.bytes.toString("utf8"));
  assertPredecessorSemantics(predecessorDocument);

  const supervisorFiles = {
    runnerSupervisor: {
      source: await readStableProjectFile(resolvedRoot,
        EXPECTED_PROJECT_LOCAL_EVIDENCE.runnerSupervisor.source.file),
      tests: await readStableProjectFile(resolvedRoot,
        EXPECTED_PROJECT_LOCAL_EVIDENCE.runnerSupervisor.tests.file),
    },
    replayHelperSupervisor: {
      source: await readStableProjectFile(resolvedRoot,
        EXPECTED_PROJECT_LOCAL_EVIDENCE.replayHelperSupervisor.source.file),
      tests: await readStableProjectFile(resolvedRoot,
        EXPECTED_PROJECT_LOCAL_EVIDENCE.replayHelperSupervisor.tests.file),
    },
    dedicatedEntrypointWiringTests: await readStableProjectFile(resolvedRoot,
      EXPECTED_PROJECT_LOCAL_EVIDENCE.dedicatedEntrypointWiringTests.file),
  };
  for (const key of ["runnerSupervisor", "replayHelperSupervisor"]) {
    for (const child of ["source", "tests"]) {
      assertExactDescriptor(supervisorFiles[key][child].descriptor,
        EXPECTED_PROJECT_LOCAL_EVIDENCE[key][child], `${key}.${child}`);
    }
  }
  assertExactDescriptor(supervisorFiles.dedicatedEntrypointWiringTests.descriptor,
    EXPECTED_PROJECT_LOCAL_EVIDENCE.dedicatedEntrypointWiringTests,
    "dedicated entrypoint wiring tests");
  assertSupervisorContracts(supervisorFiles);

  const [generator, focusedTests, authorizationV2, resultIndexBuilder,
    resultIndexFile, stagingFile] = await Promise.all([
    readStableProjectFile(resolvedRoot,
      "scripts/build-g4-l10-animate-authoring-v2-control-readiness-successor.mjs"),
    readStableProjectFile(resolvedRoot, SUCCESSOR_TEST_RELATIVE),
    readStableProjectFile(resolvedRoot, AUTHORIZATION_V2_RELATIVE),
    readStableProjectFile(resolvedRoot, RESULT_INDEX_BUILDER_RELATIVE),
    readStableProjectFile(resolvedRoot, RESULT_INDEX_RELATIVE),
    readStableProjectFile(resolvedRoot, STAGING_RELATIVE),
  ]);
  const authorizationSource = authorizationV2.bytes.toString("utf8");
  invariant(authorizationSource.includes(
    "export const LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED = false;"),
  "authorization-v2 native capability source constant is no longer false");
  invariant(!authorizationSource.includes(
    "export const LESSON_ANIMATE_ONE_ROW_V2_NATIVE_LAUNCH_CAPABILITY_ENABLED = true;"),
  "authorization-v2 native capability source constant was enabled");
  const resultIndexBuilderSource = resultIndexBuilder.bytes.toString("utf8");
  invariant(resultIndexBuilderSource.includes(
    "const PASSING_RECEIPT_ADMISSION_ENABLED = false;"),
  "result-index passing admission source constant is no longer false");
  invariant(!resultIndexBuilderSource.includes(
    "const PASSING_RECEIPT_ADMISSION_ENABLED = true;"),
  "result-index passing admission source constant was enabled");

  const resultIndex = JSON.parse(resultIndexFile.bytes.toString("utf8"));
  invariant(resultIndex.passingReceiptAdmission?.enabled === false
    && resultIndex.summary?.totalAttemptReceipts === 0
    && resultIndex.summary?.verifiedWorkOnlyAuthoringAudits === 0,
  "current result-index zero-admission baseline drifted");
  const staging = JSON.parse(stagingFile.bytes.toString("utf8"));
  invariant(staging.summary?.selectedMembers === 47
    && staging.release?.selectedMemberCount === 47
    && staging.release?.fullReleaseMemberCount === 47,
  "staging release count no longer proves 47 selected members");
  invariant(Array.isArray(staging.entries) && staging.entries.length === 34,
    "staging FLA-backed entry set no longer contains 34 members");
  const animationIds = staging.entries.map((entry) => entry.animationId);
  invariant(animationIds.every((item) => typeof item === "string" && item.length > 0)
    && new Set(animationIds).size === 34,
  "staging animation IDs are invalid or duplicated");

  const fixedPaths = lessonAnimateOneRowAuthorizationV2FixedPaths(resolvedRoot);
  const [authority, runs, productionPaths] = await Promise.all([
    inspectAuthorityReceipts(fixedPaths.authorityRoot),
    inspectRunReceipts(resolvedRoot, animationIds),
    probeAbsentProductionPaths(),
  ]);
  invariant(authority.assignmentReceipts === 0
    && authority.authorizationReceipts === 0
    && authority.productionClosureReceipts === 0
    && authority.namedOperators === 0
    && authority.unexpectedFiles.length === 0,
  "current authority receipt/operator baseline is no longer zero");
  invariant(runs.runDirectories === 0 && runs.runReceipts === 0
    && runs.incompleteRunDirectories === 0,
  "current dedicated run baseline is no longer zero");

  const report = {
    schemaVersion: 1,
    reportType: "g4-l10-animate-authoring-v2-control-readiness-successor",
    releaseId: RELEASE_ID,
    evidenceDate: "2026-08-04",
    status: "project-local-kill-unconfirmed-lifecycle-satisfied-production-closed",
    classification: "deterministic-acceptance-neutral-project-local-control-successor",
    scope: "One project-local lifecycle delta only; no v2 rewrite, native capability, admission, execution, original-runtime, migration, review, strict, integration, or publication effect",
    predecessor: {
      json: predecessorJson.descriptor,
      markdown: predecessorMarkdown.descriptor,
      rewritten: false,
      superseded: false,
      relationship: "append-only successor; v2 remains immutable historical evidence",
    },
    receiptTooling: {
      generator: generator.descriptor,
      focusedTests: focusedTests.descriptor,
    },
    projectLocalEvidence: {
      runnerSupervisor: {
        source: supervisorFiles.runnerSupervisor.source.descriptor,
        tests: supervisorFiles.runnerSupervisor.tests.descriptor,
        establishedContract: "kill-unconfirmed settlement destroys stdio, unrefs the residual child handle, and settles once",
      },
      replayHelperSupervisor: {
        source: supervisorFiles.replayHelperSupervisor.source.descriptor,
        tests: supervisorFiles.replayHelperSupervisor.tests.descriptor,
        establishedContract: "kill-unconfirmed rejection destroys stdio, unrefs the residual helper handle, and rejects once",
      },
      dedicatedEntrypointWiringTests:
        supervisorFiles.dedicatedEntrypointWiringTests.descriptor,
    },
    focusedTestObservation: {
      evidenceDate: "2026-08-04",
      command: [
        "node",
        "--test",
        EXPECTED_PROJECT_LOCAL_EVIDENCE.runnerSupervisor.tests.file,
        EXPECTED_PROJECT_LOCAL_EVIDENCE.replayHelperSupervisor.tests.file,
        EXPECTED_PROJECT_LOCAL_EVIDENCE.dedicatedEntrypointWiringTests.file,
      ],
      nodeVersion: "v24.18.0",
      result: {
        tests: 33,
        suites: 0,
        pass: 33,
        fail: 0,
        cancelled: 0,
        skipped: 0,
        todo: 0,
      },
      durationExcludedFromDeterministicReceipt: true,
      exactSourceAndTestDescriptorsRequired: true,
      executedByThisGenerator: false,
      authority: "project-local-control-test-observation-only",
    },
    blockers: makeBlockers(),
    blockerCounts: {
      projectLocalSatisfied: 1,
      projectLocalUnsatisfied: 5,
      satisfied: 0,
      productionSatisfied: 0,
      formalSatisfied: 0,
      productionOrFormalOpen: 6,
    },
    productionPathProbe: {
      readOnly: true,
      allAbsent: true,
      paths: productionPaths,
      writes: 0,
    },
    nativeCapability: {
      source: authorizationV2.descriptor,
      enabled: false,
      sourceConstantVerifiedFalse: true,
      changedByThisSuccessor: false,
    },
    admission: {
      admitted: false,
      executionAuthorized: false,
      productionClosureBuildable: false,
      reason: "Five controls lack even project-local satisfaction, all six remain production/formal-open, fixed production paths are absent, and no authority/operator/run receipt exists.",
    },
    receiptInventory: {
      authorityRootPresent: authority.authorityRootPresent,
      assignmentReceipts: 0,
      authorizationReceipts: 0,
      productionClosureReceipts: 0,
      namedOperators: 0,
      runDirectories: 0,
      runReceipts: 0,
      incompleteRunDirectories: 0,
      unexpectedAuthorityFiles: [],
    },
    resultIndexAdmission: {
      report: resultIndexFile.descriptor,
      builder: resultIndexBuilder.descriptor,
      sourceConstantVerifiedFalse: true,
      enabled: false,
      totalAttemptReceipts: 0,
      verifiedWorkOnlyAuthoringAudits: 0,
      changedByThisSuccessor: false,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    strictAcceptanceEffect: "none",
    determinism: {
      reportIncludesWallClock: false,
      wallClockReadForReportContent: false,
      testDurationIncluded: false,
      sourceOrder: "fixed blocker and descriptor order",
      checkMode: "recompute exact bytes and compare without writes",
    },
    safety: {
      writeAllowlist: [REPORT_JSON_RELATIVE, REPORT_MARKDOWN_RELATIVE],
      v2ReportRewritten: false,
      capabilityChanged: false,
      resultIndexChanged: false,
      sourceOrMigrationWritten: false,
      libraryWritten: false,
      animateLaunched: false,
      browserOrServerLaunched: false,
      libraryPathWritten: false,
      gitInvoked: false,
      checkModeWrites: 0,
    },
    limitations: [
      "Project-local source and focused tests do not prove a root-owned native launcher or any installed production capability.",
      "The complete Animate bundle process family, native clean environment, generated-artifact custody, and same-UID replay controls remain unresolved.",
      "No Adobe Animate authoring audit, original-runtime behavior, audio, JavaScript fidelity, human review, owner acceptance, strict completion, integration, or publication state is advanced.",
    ],
  };
  assertG4L10AnimateAuthoringV2ControlReadinessSuccessor(report);

  const jsonBytes = Buffer.from(stableJson(report));
  const jsonIdentity = Object.freeze({
    file: REPORT_JSON_RELATIVE,
    sha256: sha256(jsonBytes),
    bytes: jsonBytes.length,
  });
  const markdownBytes = Buffer.from(renderMarkdown(report, jsonIdentity));
  const markdownIdentity = Object.freeze({
    file: REPORT_MARKDOWN_RELATIVE,
    sha256: sha256(markdownBytes),
    bytes: markdownBytes.length,
  });
  let writeResults = null;
  if (persist) {
    writeResults = {
      json: await writeOrCheckSuccessorReport(resolvedRoot,
        REPORT_JSON_RELATIVE, jsonBytes, check),
      markdown: await writeOrCheckSuccessorReport(resolvedRoot,
        REPORT_MARKDOWN_RELATIVE, markdownBytes, check),
    };
  }
  return Object.freeze({
    report,
    jsonBytes,
    markdownBytes,
    jsonIdentity,
    markdownIdentity,
    writeResults,
  });
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
    } else {
      throw new Error(`G4 L10 Animate v2 control successor: unknown option ${value}`);
    }
  }
  invariant(!(options.check && options.help),
    "--check and --help cannot be combined");
  return options;
}

function help() {
  return [
    "Usage: node scripts/build-g4-l10-animate-authoring-v2-control-readiness-successor.mjs [--check]",
    "",
    "Builds an append-only, acceptance-neutral successor to the exact v2 control",
    "readiness report. It records only the project-local kill-unconfirmed supervisor",
    "lifecycle contract. All six production/formal blockers remain open; native",
    "capability, admission, execution, receipts, operators, runs, and acceptance",
    "effects remain false or zero.",
    "",
    "Normal mode writes only the two successor reports. --check recomputes and",
    "compares exact bytes without writing. Neither mode runs tests, Git, Animate,",
    "a browser, a server, or any /Library mutation.",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(help());
    return;
  }
  const result = await buildG4L10AnimateAuthoringV2ControlReadinessSuccessor({
    root: ROOT,
    persist: true,
    check: options.check,
  });
  console.log(JSON.stringify({
    status: options.check ? "checked" : "built",
    blockerCounts: result.report.blockerCounts,
    nativeCapability: result.report.nativeCapability.enabled,
    admitted: result.report.admission.admitted,
    executionAuthorized: result.report.admission.executionAuthorized,
    receiptInventory: result.report.receiptInventory,
    focusedTests: result.report.focusedTestObservation.result,
    reports: {
      json: result.jsonIdentity,
      markdown: result.markdownIdentity,
    },
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
