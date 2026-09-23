#!/usr/bin/env node

import assert from "node:assert/strict";
import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);

export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_JSON_PATH =
  "reports/g4-l10-vb003-static-specification-gap-closure-v2.json";
export const REPORT_MD_PATH =
  "reports/g4-l10-vb003-static-specification-gap-closure-v2.md";

const WORKSPACE_PATH = "migrations/course-g04-l10-vb-003";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const ANIMATION_ID = "course-g04-l10-vb-003";
const OUTPUT_MODE = 0o444;
const SHA256 = /^[a-f0-9]{64}$/u;
const SHA1 = /^[a-f0-9]{40}$/u;

const EXPECTED_GIT = Object.freeze({
  objectFormat: "sha1",
  headCommit: "42e7f80ce70aaa3819af2f7158e15f5da5470cce",
  workspaceTree: "85fdc417c416ae73185a5fbff7ddfe26fd56bda4",
  trackedFileCount: 37,
});

const FIXED_INPUTS = Object.freeze({
  predecessorBuilder: {
    path: "scripts/build-g4-l10-vb003-static-specification-gap-closure-v1.mjs",
    bytes: 44867,
    sha256: "e91e9c25171bbf3e108a9563db92c5aaa8042523e5c4bd5791d3f9cb226dcb91",
    mode: "0644",
    kind: "text",
  },
  predecessorTest: {
    path: "scripts/build-g4-l10-vb003-static-specification-gap-closure-v1.test.mjs",
    bytes: 6431,
    sha256: "14afd879b1d2ba34001993fc642b92b7907e10437e35e96f5e6579b116a53601",
    mode: "0644",
    kind: "text",
  },
  predecessorReport: {
    path: "reports/g4-l10-vb003-static-specification-gap-closure-v1.json",
    bytes: 43111,
    sha256: "7150708ad2686e95b058b1a3400fc20563779bc6d9b2114378d6f0c321a62f65",
    mode: "0644",
    kind: "json",
  },
  templateContractV13: {
    path: "reports/g4-l10-complete-migration-template-contract-v13-2026-08-07.json",
    bytes: 278558,
    sha256: "fa9719d7950878f4db1b928b9501348b47f37f25273e9459348aeb46f6e1a18b",
    mode: "0444",
    kind: "json",
  },
});

const EFFECT_KEYS = Object.freeze([
  "sourcePromotion",
  "sourceMutation",
  "workspaceMutation",
  "authoritativeOriginalRuntimeEvidence",
  "baselineAdoption",
  "rendererAdoption",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "engineeringAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "lessonBatchAdmission",
  "wholeLessonIntegration",
  "atomicLessonPublication",
  "remainingGrade4BatchStart",
  "wholeCourseIntegration",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function gitBlobSha1(bytes) {
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return createHash("sha1").update(header).update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertNoUndefined(value, location = "$") {
  assert.notEqual(value, undefined, `Undefined value at ${location}`);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUndefined(item, `${location}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertNoUndefined(item, `${location}.${key}`);
    }
  }
  return true;
}

function reportFingerprint(report) {
  const projection = structuredClone(report);
  delete projection.reportFingerprintSha256;
  assertNoUndefined(projection);
  return sha256(canonicalJson(projection));
}

function formatMode(info) {
  return Number(info.mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs]
    .map(String).join(":");
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function resolveInsideRoot(projectRoot, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  assert.equal(/[\u0000\r\n]/u.test(relativePath), false,
    `Control character is forbidden in path: ${JSON.stringify(relativePath)}`);
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, relativePath);
  assert.ok(absolute.startsWith(`${root}${path.sep}`),
    `Path escapes project root: ${relativePath}`);
  return absolute;
}

async function canonicalProjectRoot(projectRoot) {
  const lexicalRoot = path.resolve(projectRoot);
  const rootInfo = await lstat(lexicalRoot);
  assert.ok(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(),
    `Project root must be an ordinary non-symlink directory: ${lexicalRoot}`);
  const canonicalRoot = await realpath(lexicalRoot);
  assert.equal(canonicalRoot, lexicalRoot,
    `Project root resolves through a symlink: ${lexicalRoot}`);
  return canonicalRoot;
}

async function resolveExistingFileInsideRoot(projectRoot, relativePath) {
  const canonicalRoot = await canonicalProjectRoot(projectRoot);
  const absolute = resolveInsideRoot(projectRoot, relativePath);
  const canonicalParent = await realpath(path.dirname(absolute));
  assert.equal(canonicalParent, path.dirname(absolute),
    `Parent path resolves through a symlink: ${relativePath}`);
  assert.ok(canonicalParent === canonicalRoot ||
    canonicalParent.startsWith(`${canonicalRoot}${path.sep}`),
  `Parent path escapes canonical project root: ${relativePath}`);
  const canonicalFile = await realpath(absolute);
  assert.equal(canonicalFile, absolute,
    `File path resolves through a symlink: ${relativePath}`);
  return absolute;
}

export async function resolveSafeOutputPath(projectRoot, relativePath) {
  const canonicalRoot = await canonicalProjectRoot(projectRoot);
  const absolute = resolveInsideRoot(projectRoot, relativePath);
  const canonicalParent = await realpath(path.dirname(absolute));
  assert.equal(canonicalParent, path.dirname(absolute),
    `Output parent resolves through a symlink: ${relativePath}`);
  assert.ok(canonicalParent === canonicalRoot ||
    canonicalParent.startsWith(`${canonicalRoot}${path.sep}`),
  `Output parent escapes canonical project root: ${relativePath}`);
  try {
    const info = await lstat(absolute);
    assert.ok(info.isFile() && !info.isSymbolicLink(),
      `Existing output must be an ordinary non-symlink file: ${relativePath}`);
    assert.equal(await realpath(absolute), absolute,
      `Existing output resolves through a symlink: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return absolute;
}

async function readStableBinding(projectRoot, key, specification) {
  const absolute = await resolveExistingFileInsideRoot(projectRoot, specification.path);
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${specification.path} must be an ordinary non-symlink file`);
  assert.equal(before.nlink, 1n,
    `${specification.path} must have exactly one hard link`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${specification.path} changed while read`);
  assert.equal(BigInt(bytes.length), before.size,
    `${specification.path} size drifted while read`);
  const observed = {
    key,
    path: specification.path,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: formatMode(before),
    statIdentity: statIdentity(before),
  };
  assert.equal(observed.bytes, specification.bytes,
    `${specification.path} byte length drifted`);
  assert.equal(observed.sha256, specification.sha256,
    `${specification.path} SHA-256 drifted`);
  assert.equal(observed.mode, specification.mode,
    `${specification.path} mode drifted`);
  if (specification.kind === "text" || specification.kind === "json") {
    observed.text = bytes.toString("utf8");
  }
  if (specification.kind === "json") observed.document = JSON.parse(observed.text);
  return observed;
}

function preimageSetSha256(inputBindings) {
  const payload = Object.values(inputBindings)
    .sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
    .map(({path: itemPath, sha256: digest}) => `${itemPath}\0${digest}\n`)
    .join("");
  return sha256(payload);
}

function validatePredecessor(predecessor) {
  assert.equal(predecessor.schemaVersion, 1);
  assert.equal(predecessor.reportType,
    "g4-l10-vb003-static-specification-gap-closure-v1");
  assert.equal(predecessor.status,
    "acceptance-neutral-static-gap-plan-do-not-apply");
  assert.equal(predecessor.decision, "DO_NOT_APPLY");
  assert.equal(predecessor.reportFingerprintSha256,
    "c49edaa4b1283a6bfa698794ea4992b2bee52b9f50c611eccd4f873963a2f632");
  assert.equal(reportFingerprint(predecessor), predecessor.reportFingerprintSha256,
    "Predecessor report fingerprint is not parse-stable");
  assert.equal(Object.keys(predecessor.inputBindings).length, 26);
  assert.equal(predecessor.preimageSetSha256,
    "e472ce78ecab8658194af162c93eff1cfa7c42117dfa1851f0e78b1372cff043");
  assert.equal(preimageSetSha256(predecessor.inputBindings),
    predecessor.preimageSetSha256);
  assert.equal(predecessor.authorityBoundary.currentWorkspaceIsUntracked, true);
  assert.equal(predecessor.authorityBoundary.workspaceTrackingObservation.statusLine,
    "?? migrations/course-g04-l10-vb-003/");
  assert.deepEqual(predecessor.proposedChanges.map(({id}) => id), [
    "P1-A-audio-manifest-triangle",
    "P1-B-source-definition-and-host-dependency-manifest",
    "P1-C-static-placeholder-reconciliation",
    "P1-D-nested-structural-keyframe-candidates",
    "P2-brief-and-checklist-static-hygiene",
  ]);
  assert.equal(predecessor.currentStaticFacts.frameDomains.unresolvedTimelineCount, 0);
  assert.equal(predecessor.currentStaticFacts.definitions.total, 120);
  assert.equal(predecessor.currentStaticFacts.audio.inventoryRows, 2);
  assert.equal(predecessor.currentStaticFacts.coverage.requirementCount, 4);
  assert.equal(predecessor.currentStaticFacts.coverage.frameIdentityCount, 426);
  assert.equal(predecessor.currentStaticFacts.coverage.authoritativeCapturedFrameCount, 0);
  assert.equal(predecessor.guardedAdopterContract.implementedByThisReport, false);
  assert.ok(Object.values(predecessor.acceptanceEffects).every((value) =>
    value === false));
  return true;
}

function validateTemplateContractV13(template) {
  assert.equal(template.schemaVersion, 13);
  assert.equal(template.status, "fail-closed-template-not-stable");
  assert.equal(template.templateStable, false);
  assert.equal(template.reportFingerprintSha256,
    "da99624f592739da6bffe9368f6e6d97024488a879f1cc2368ee3fd5bcc2cadd");
  assert.equal(reportFingerprint(template), template.reportFingerprintSha256,
    "Template contract v13 fingerprint is not parse-stable");
  assert.equal(template.currentFormalState.requirements.total, 520);
  assert.equal(template.currentFormalState.requirements.naturalScheduleReady, 0);
  assert.equal(template.currentFormalState.frameObligations.authoritativeCaptured, 0);
  assert.equal(template.currentFormalState.originalRuntime.runtimeSessions, 0);
  assert.equal(template.currentFormalState.javascript.registeredFormalRendererCount, 0);
  assert.equal(template.currentFormalState.reviewAndRelease.strictCompleteMembers, 0);
  assert.equal(template.currentFormalState.reviewAndRelease.atomicPublished, false);
  assert.ok(Object.values(template.authorityBoundary).every((value) =>
    value === false || value === true && [
      template.authorityBoundary.readOnlyRecomputation,
      template.authorityBoundary.ruffleIsForensicReferenceOnly,
      template.authorityBoundary.currentJavascriptDiagnosticsAreEngineeringOnly,
    ].includes(value)));
  for (const key of [
    "mayLaunchOriginalRuntime",
    "mayApplyDownstreamTransaction",
    "mayRegisterRenderer",
    "mayMarkAcceptanceOrCompletion",
    "mayIntegrateOrPublish",
    "mayCreateUserOwnedTask",
    "mayImplementOrTestProductionHelper",
    "createsReviewSetManifest",
    "mayRunPhaseAOrPhaseB",
    "mayPerformProtectedInstallation",
    "mayExecuteHelper",
    "mayRecoverDownstreamTransaction",
    "mayPromoteSource",
  ]) assert.equal(template.authorityBoundary[key], false, key);
  return true;
}

async function execGit(projectRoot, args) {
  const result = await execFile("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(result.stderr, "", `git ${args.join(" ")} wrote stderr`);
  return result.stdout;
}

function parseIndexEntries(output) {
  const records = output.split("\0").filter((record) => record.length > 0);
  const entries = records.map((record) => {
    const match = /^([0-7]{6}) ([a-f0-9]{40}) ([0-3])\t(.+)$/u.exec(record);
    assert.ok(match, `Unexpected git ls-files record: ${JSON.stringify(record)}`);
    const [, indexMode, blobSha1, stageText, filePath] = match;
    const stage = Number(stageText);
    assert.equal(stage, 0, `Unmerged index stage for ${filePath}`);
    assert.ok(filePath.startsWith(`${WORKSPACE_PATH}/`),
      `Index entry escapes VB003 workspace: ${filePath}`);
    assert.equal(/[\u0000\r\n]/u.test(filePath), false,
      `Control character in indexed path: ${JSON.stringify(filePath)}`);
    return {path: filePath, indexMode, blobSha1, stage};
  }).sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)));
  assert.equal(new Set(entries.map(({path: itemPath}) => itemPath)).size, entries.length,
    "Duplicate path in Git index snapshot");
  return entries;
}

async function enumerateWorkspaceFiles(projectRoot) {
  const rootAbsolute = resolveInsideRoot(projectRoot, WORKSPACE_PATH);
  const rootInfo = await lstat(rootAbsolute, {bigint: true});
  assert.ok(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(),
    `${WORKSPACE_PATH} must be an ordinary non-symlink directory`);
  assert.equal(await realpath(rootAbsolute), rootAbsolute,
    `${WORKSPACE_PATH} resolves through a symlink`);
  const files = [];
  async function visit(absoluteDirectory, relativeDirectory) {
    const entries = await readdir(absoluteDirectory, {withFileTypes: true});
    entries.sort((left, right) => Buffer.compare(Buffer.from(left.name),
      Buffer.from(right.name)));
    for (const entry of entries) {
      assert.equal(/[\u0000\r\n]/u.test(entry.name), false,
        `Control character in workspace entry: ${JSON.stringify(entry.name)}`);
      const relativePath = `${relativeDirectory}/${entry.name}`;
      const absolutePath = path.join(absoluteDirectory, entry.name);
      if (entry.isDirectory()) {
        const info = await lstat(absolutePath, {bigint: true});
        assert.ok(info.isDirectory() && !info.isSymbolicLink(),
          `${relativePath} must remain an ordinary directory`);
        assert.equal(await realpath(absolutePath), absolutePath,
          `${relativePath} resolves through a symlink`);
        await visit(absolutePath, relativePath);
      } else {
        assert.ok(entry.isFile() && !entry.isSymbolicLink(),
          `${relativePath} is a symlink or special file`);
        files.push(relativePath);
      }
    }
  }
  await visit(rootAbsolute, WORKSPACE_PATH);
  return files.sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
}

async function readWorkspaceFile(projectRoot, entry) {
  const absolute = await resolveExistingFileInsideRoot(projectRoot, entry.path);
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${entry.path} must be an ordinary non-symlink file`);
  assert.equal(before.nlink, 1n, `${entry.path} must have exactly one hard link`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${entry.path} changed while read`);
  assert.equal(BigInt(bytes.length), before.size,
    `${entry.path} size drifted while read`);
  const observedBlobSha1 = gitBlobSha1(bytes);
  assert.equal(observedBlobSha1, entry.blobSha1,
    `${entry.path} working-tree bytes differ from the Git index blob`);
  return {
    path: entry.path,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: formatMode(before),
    indexMode: entry.indexMode,
    gitBlobSha1: observedBlobSha1,
    indexStage: entry.stage,
  };
}

function workspaceSetSha256(entries) {
  const payload = entries.map((entry) => [
    entry.path,
    entry.bytes,
    entry.sha256,
    entry.mode,
    entry.indexMode,
    entry.gitBlobSha1,
    entry.indexStage,
  ].join("\0")).join("\n") + "\n";
  return sha256(payload);
}

export function validateCleanStatus(output) {
  assert.equal(output, "",
    "VB003 scoped Git status is not empty; refuse tracked-clean successor epoch");
  return true;
}

async function readWorkspaceGitIdentity(projectRoot) {
  const objectFormat = (await execGit(projectRoot,
    ["rev-parse", "--show-object-format"])).trim();
  const headCommit = (await execGit(projectRoot,
    ["rev-parse", "--verify", "HEAD"])).trim();
  const workspaceTree = (await execGit(projectRoot,
    ["rev-parse", "--verify", `HEAD:${WORKSPACE_PATH}`])).trim();
  const treeType = (await execGit(projectRoot,
    ["cat-file", "-t", workspaceTree])).trim();
  assert.equal(objectFormat, EXPECTED_GIT.objectFormat,
    "Git object format drifted");
  assert.equal(headCommit, EXPECTED_GIT.headCommit,
    "Git HEAD drifted from the frozen tracked-workspace epoch");
  assert.equal(workspaceTree, EXPECTED_GIT.workspaceTree,
    "VB003 HEAD tree drifted from the frozen tracked-workspace epoch");
  assert.equal(treeType, "tree");
  assert.ok(SHA1.test(headCommit));
  assert.ok(SHA1.test(workspaceTree));

  const statusArgs = [
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
    "--",
    WORKSPACE_PATH,
  ];
  const statusBefore = await execGit(projectRoot, statusArgs);
  validateCleanStatus(statusBefore);
  const indexArgs = ["ls-files", "--stage", "-z", "--", WORKSPACE_PATH];
  const indexEntries = parseIndexEntries(await execGit(projectRoot, indexArgs));
  assert.equal(indexEntries.length, EXPECTED_GIT.trackedFileCount,
    "VB003 tracked-file count drifted");
  const enumeratedPaths = await enumerateWorkspaceFiles(projectRoot);
  assert.deepEqual(enumeratedPaths, indexEntries.map(({path: itemPath}) => itemPath),
    "VB003 ordinary-file path set differs from the tracked index path set");
  const files = [];
  for (const entry of indexEntries) files.push(await readWorkspaceFile(projectRoot, entry));
  const statusAfter = await execGit(projectRoot, statusArgs);
  validateCleanStatus(statusAfter);
  assert.equal((await execGit(projectRoot,
    ["rev-parse", "--verify", "HEAD"])).trim(), headCommit,
  "Git HEAD changed during VB003 identity snapshot");
  assert.equal((await execGit(projectRoot,
    ["rev-parse", "--verify", `HEAD:${WORKSPACE_PATH}`])).trim(), workspaceTree,
  "VB003 HEAD tree changed during identity snapshot");
  const indexEntriesAfter = parseIndexEntries(await execGit(projectRoot, indexArgs));
  assert.deepEqual(indexEntriesAfter, indexEntries,
    "VB003 Git index changed during identity snapshot");
  return {
    objectFormat,
    headCommit,
    workspaceTree,
    treeType,
    statusBefore,
    statusAfter,
    trackedFileCount: indexEntries.length,
    enumeratedOrdinaryFileCount: enumeratedPaths.length,
    trackedWorkspaceSetSha256: workspaceSetSha256(files),
    files,
    commands: {
      objectFormat: ["git", "rev-parse", "--show-object-format"],
      head: ["git", "rev-parse", "--verify", "HEAD"],
      workspaceTree: ["git", "rev-parse", "--verify", `HEAD:${WORKSPACE_PATH}`],
      scopedStatus: ["git", ...statusArgs],
      index: ["git", ...indexArgs],
    },
  };
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const fixedRecords = {};
  for (const [key, specification] of Object.entries(FIXED_INPUTS)) {
    fixedRecords[key] = await readStableBinding(projectRoot, key, specification);
  }
  const predecessor = fixedRecords.predecessorReport.document;
  const template = fixedRecords.templateContractV13.document;
  validatePredecessor(predecessor);
  validateTemplateContractV13(template);
  const predecessorInputRecords = {};
  for (const [key, specification] of Object.entries(predecessor.inputBindings)) {
    predecessorInputRecords[key] = await readStableBinding(projectRoot, key, {
      ...specification,
      kind: "binary",
    });
  }
  const git = await readWorkspaceGitIdentity(projectRoot);
  return {
    projectRoot,
    fixedRecords,
    predecessor,
    template,
    predecessorInputRecords,
    git,
  };
}

function successorInputSetSha256(report) {
  return sha256(canonicalJson({
    fixedInputBindings: report.fixedInputBindings,
    predecessorInputPreimageSetSha256:
      report.predecessorInputValidation.preimageSetSha256,
    templateFingerprintSha256: report.templateCurrentness.reportFingerprintSha256,
    gitHeadCommit: report.workspaceIdentity.gitHeadCommit,
    workspaceTree: report.workspaceIdentity.workspaceTree,
    trackedWorkspaceSetSha256: report.workspaceIdentity.trackedWorkspaceSetSha256,
  }));
}

export function deriveReport(snapshot) {
  const {predecessor, template, git} = snapshot;
  const fixedInputBindings = Object.fromEntries(Object.keys(snapshot.fixedRecords).sort()
    .map((key) => [key, binding(snapshot.fixedRecords[key])]));
  const predecessorInputBindings = Object.fromEntries(
    Object.keys(snapshot.predecessorInputRecords).sort()
      .map((key) => [key, binding(snapshot.predecessorInputRecords[key])]),
  );
  assert.deepEqual(predecessorInputBindings, predecessor.inputBindings,
    "Live predecessor inputs no longer match the predecessor input bindings");

  const report = {
    schemaVersion: 2,
    reportType: "g4-l10-vb003-static-specification-gap-closure-currentness-v2",
    evidenceDate: "2026-08-07",
    status: "acceptance-neutral-static-gap-plan-current-tracked-workspace-do-not-apply",
    releaseId: RELEASE_ID,
    animationId: ANIMATION_ID,
    decision: "DO_NOT_APPLY",
    successorOf: {
      ...fixedInputBindings.predecessorReport,
      schemaVersion: predecessor.schemaVersion,
      reportType: predecessor.reportType,
      reportFingerprintSha256: predecessor.reportFingerprintSha256,
      preimageSetSha256: predecessor.preimageSetSha256,
      historicalTrackingState: "untracked-directory",
    },
    trackingEpochTransition: {
      from: {
        state: "untracked-directory",
        statusLine:
          predecessor.authorityBoundary.workspaceTrackingObservation.statusLine,
        evidenceScope: "historical-v1-bound-observation",
      },
      to: {
        state: "tracked-clean-ordinary-file-set",
        statusOutput: git.statusAfter,
        gitHeadCommit: git.headCommit,
        workspaceTree: git.workspaceTree,
        trackedFileCount: git.trackedFileCount,
        trackedWorkspaceSetSha256: git.trackedWorkspaceSetSha256,
        evidenceScope: "current-read-only-git-index-and-working-tree-recomputation",
      },
      interpretation:
        "The Git bootstrap changed the custody/tracking epoch only. It does not adopt the v1 candidate patch and creates no runtime, renderer, review, acceptance, integration, release, or publication evidence.",
    },
    authorityBoundary: {
      readOnlyRecomputation: true,
      exactPreimageBound: true,
      noClobberOutputs: true,
      predecessorModified: false,
      workspaceModified: false,
      sourceModified: false,
      candidatePatchApplied: false,
      productionHelperImplementedOrTested: false,
      reviewerTaskCreated: false,
      hmg4rb4Created: false,
      phaseAOrPhaseBRun: false,
      originalRuntimeLaunched: false,
      protectedInstallationPerformed: false,
      helperExecuted: false,
      recoveryExecuted: false,
      rendererCreatedOrRegistered: false,
      acceptanceGranted: false,
      promotionAuthorized: false,
      integrationAuthorized: false,
      releaseOrPublicationAuthorized: false,
      rule:
        "This successor repairs only the stale untracked-workspace epoch assumption. All proposed mutations remain guarded candidates under the exact v1 report and require separate authorization and review.",
    },
    predecessorInputValidation: {
      validatedCount: Object.keys(predecessorInputBindings).length,
      expectedCount: 26,
      allOrdinaryNonSymlinkSingleLink: true,
      allSizeSha256AndModeExact: true,
      inputBindings: predecessorInputBindings,
      preimageSetSha256: preimageSetSha256(predecessorInputBindings),
    },
    candidatePlanCarryForward: {
      decision: predecessor.decision,
      proposedChangeIds: predecessor.proposedChanges.map(({id}) => id),
      requiredPreimageSetSha256:
        predecessor.guardedAdopterContract.requiredPreimageSetSha256,
      candidatePatchFingerprintSha256:
        predecessor.guardedAdopterContract.candidatePatchFingerprintSha256,
      guardedAdopterRequired: predecessor.guardedAdopterContract.required,
      guardedAdopterImplementedByV1: false,
      guardedAdopterImplementedByV2: false,
      applyAttempted: false,
    },
    currentStaticFacts: structuredClone(predecessor.currentStaticFacts),
    templateCurrentness: {
      ...fixedInputBindings.templateContractV13,
      schemaVersion: template.schemaVersion,
      status: template.status,
      templateStable: template.templateStable,
      reportFingerprintSha256: template.reportFingerprintSha256,
      totalRequirements: template.currentFormalState.requirements.total,
      naturalScheduleReady:
        template.currentFormalState.requirements.naturalScheduleReady,
      authoritativeCapturedFrames:
        template.currentFormalState.frameObligations.authoritativeCaptured,
      originalRuntimeSessions:
        template.currentFormalState.originalRuntime.runtimeSessions,
      registeredFormalRenderers:
        template.currentFormalState.javascript.registeredFormalRendererCount,
      strictCompleteMembers:
        template.currentFormalState.reviewAndRelease.strictCompleteMembers,
      atomicPublished: template.currentFormalState.reviewAndRelease.atomicPublished,
      acceptanceEffect: "none",
    },
    workspaceIdentity: {
      scope: WORKSPACE_PATH,
      objectFormat: git.objectFormat,
      gitHeadCommit: git.headCommit,
      workspaceTree: git.workspaceTree,
      treeType: git.treeType,
      scopedStatusBefore: git.statusBefore,
      scopedStatusAfter: git.statusAfter,
      trackedFileCount: git.trackedFileCount,
      enumeratedOrdinaryFileCount: git.enumeratedOrdinaryFileCount,
      trackedWorkspaceSetSha256: git.trackedWorkspaceSetSha256,
      primaryByteIdentityAlgorithm: "sha256",
      gitIndexCrossCheckAlgorithm: "git-blob-sha1",
      files: git.files,
      commands: git.commands,
      claimScope:
        "Current checked-out VB003 ordinary-file path and byte set matched the stage-0 Git index at the fixed HEAD/tree. This does not attest Git binary provenance, commit authorship, repository history, or any migration acceptance gate.",
    },
    fixedInputBindings,
    successorInputSetSha256: null,
    deferredEvidence: structuredClone(predecessor.deferredEvidence),
    acceptanceEffects: Object.fromEntries(EFFECT_KEYS.map((key) => [key, false])),
  };
  report.successorInputSetSha256 = successorInputSetSha256(report);
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateReport(report, {predecessor, template});
  return report;
}

export function validateReport(report, context = {}) {
  assertNoUndefined(report);
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.reportType,
    "g4-l10-vb003-static-specification-gap-closure-currentness-v2");
  assert.equal(report.status,
    "acceptance-neutral-static-gap-plan-current-tracked-workspace-do-not-apply");
  assert.equal(report.releaseId, RELEASE_ID);
  assert.equal(report.animationId, ANIMATION_ID);
  assert.equal(report.decision, "DO_NOT_APPLY");
  assert.equal(report.successorOf.reportFingerprintSha256,
    "c49edaa4b1283a6bfa698794ea4992b2bee52b9f50c611eccd4f873963a2f632");
  assert.equal(report.successorOf.preimageSetSha256,
    "e472ce78ecab8658194af162c93eff1cfa7c42117dfa1851f0e78b1372cff043");
  assert.equal(report.trackingEpochTransition.from.state, "untracked-directory");
  assert.equal(report.trackingEpochTransition.to.state,
    "tracked-clean-ordinary-file-set");
  assert.equal(report.trackingEpochTransition.to.statusOutput, "");
  assert.equal(report.predecessorInputValidation.validatedCount, 26);
  assert.equal(report.predecessorInputValidation.expectedCount, 26);
  assert.equal(report.predecessorInputValidation.preimageSetSha256,
    report.successorOf.preimageSetSha256);
  assert.equal(preimageSetSha256(report.predecessorInputValidation.inputBindings),
    report.predecessorInputValidation.preimageSetSha256);
  assert.equal(report.candidatePlanCarryForward.decision, "DO_NOT_APPLY");
  assert.equal(report.candidatePlanCarryForward.guardedAdopterImplementedByV1, false);
  assert.equal(report.candidatePlanCarryForward.guardedAdopterImplementedByV2, false);
  assert.equal(report.candidatePlanCarryForward.applyAttempted, false);
  assert.equal(report.currentStaticFacts.frameDomains.unresolvedTimelineCount, 0);
  assert.equal(report.currentStaticFacts.definitions.total, 120);
  assert.equal(report.currentStaticFacts.audio.inventoryRows, 2);
  assert.equal(report.currentStaticFacts.coverage.requirementCount, 4);
  assert.equal(report.currentStaticFacts.coverage.frameIdentityCount, 426);
  assert.equal(report.currentStaticFacts.coverage.authoritativeCapturedFrameCount, 0);
  assert.equal(report.templateCurrentness.status, "fail-closed-template-not-stable");
  assert.equal(report.templateCurrentness.templateStable, false);
  assert.equal(report.templateCurrentness.naturalScheduleReady, 0);
  assert.equal(report.templateCurrentness.authoritativeCapturedFrames, 0);
  assert.equal(report.templateCurrentness.originalRuntimeSessions, 0);
  assert.equal(report.templateCurrentness.registeredFormalRenderers, 0);
  assert.equal(report.templateCurrentness.strictCompleteMembers, 0);
  assert.equal(report.templateCurrentness.atomicPublished, false);
  assert.equal(report.workspaceIdentity.objectFormat, EXPECTED_GIT.objectFormat);
  assert.equal(report.workspaceIdentity.gitHeadCommit, EXPECTED_GIT.headCommit);
  assert.equal(report.workspaceIdentity.workspaceTree, EXPECTED_GIT.workspaceTree);
  assert.equal(report.workspaceIdentity.treeType, "tree");
  assert.equal(report.workspaceIdentity.scopedStatusBefore, "");
  assert.equal(report.workspaceIdentity.scopedStatusAfter, "");
  assert.equal(report.workspaceIdentity.trackedFileCount,
    EXPECTED_GIT.trackedFileCount);
  assert.equal(report.workspaceIdentity.enumeratedOrdinaryFileCount,
    EXPECTED_GIT.trackedFileCount);
  assert.equal(report.workspaceIdentity.files.length, EXPECTED_GIT.trackedFileCount);
  assert.deepEqual(report.workspaceIdentity.files.map(({path: itemPath}) => itemPath),
    [...report.workspaceIdentity.files.map(({path: itemPath}) => itemPath)]
      .sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right))));
  assert.equal(new Set(report.workspaceIdentity.files.map(({path: itemPath}) =>
    itemPath)).size, EXPECTED_GIT.trackedFileCount);
  for (const file of report.workspaceIdentity.files) {
    assert.ok(file.path.startsWith(`${WORKSPACE_PATH}/`));
    assert.ok(SHA256.test(file.sha256));
    assert.ok(SHA1.test(file.gitBlobSha1));
    assert.equal(file.indexStage, 0);
    assert.ok(["100644", "100755"].includes(file.indexMode));
  }
  assert.equal(report.workspaceIdentity.trackedWorkspaceSetSha256,
    workspaceSetSha256(report.workspaceIdentity.files));
  assert.ok(Object.values(report.authorityBoundary).every((value) =>
    typeof value === "string" || typeof value === "boolean"));
  for (const [key, value] of Object.entries(report.authorityBoundary)) {
    if (["readOnlyRecomputation", "exactPreimageBound", "noClobberOutputs"].includes(key)) {
      assert.equal(value, true, key);
    } else if (key !== "rule") {
      assert.equal(value, false, key);
    }
  }
  assert.deepEqual(Object.keys(report.acceptanceEffects), EFFECT_KEYS);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.successorInputSetSha256, successorInputSetSha256(report));
  assert.ok(SHA256.test(report.reportFingerprintSha256));
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
  const reparsed = JSON.parse(JSON.stringify(report));
  assert.deepEqual(reparsed, report, "Report is not JSON round-trip stable");
  assert.equal(reportFingerprint(reparsed), report.reportFingerprintSha256,
    "Report fingerprint is not parse-stable");
  if (context.predecessor) {
    assert.deepEqual(report.currentStaticFacts, context.predecessor.currentStaticFacts);
    assert.deepEqual(report.candidatePlanCarryForward.proposedChangeIds,
      context.predecessor.proposedChanges.map(({id}) => id));
  }
  if (context.template) {
    assert.equal(report.templateCurrentness.reportFingerprintSha256,
      context.template.reportFingerprintSha256);
  }
  return true;
}

export function renderMarkdown(report) {
  validateReport(report);
  return `# G4 L10 VB003 Static Specification Gap Currentness v2\n\n` +
    `- Status: \`${report.status}\`\n` +
    `- Decision: \`${report.decision}\`\n` +
    `- Predecessor report SHA-256: \`${report.successorOf.sha256}\`\n` +
    `- Predecessor fingerprint: \`${report.successorOf.reportFingerprintSha256}\`\n` +
    `- Current Git HEAD: \`${report.workspaceIdentity.gitHeadCommit}\`\n` +
    `- Current VB003 tree: \`${report.workspaceIdentity.workspaceTree}\`\n` +
    `- Tracked ordinary files: ${report.workspaceIdentity.trackedFileCount}/${report.workspaceIdentity.enumeratedOrdinaryFileCount}\n` +
    `- Tracked workspace SHA-256 set: \`${report.workspaceIdentity.trackedWorkspaceSetSha256}\`\n` +
    `- Validated v1 input bindings: ${report.predecessorInputValidation.validatedCount}/${report.predecessorInputValidation.expectedCount}\n` +
    `- Template stable: \`${report.templateCurrentness.templateStable}\`\n` +
    `- Original-runtime sessions: ${report.templateCurrentness.originalRuntimeSessions}\n` +
    `- Registered formal renderers: ${report.templateCurrentness.registeredFormalRenderers}\n` +
    `- Strict-complete members: ${report.templateCurrentness.strictCompleteMembers}\n` +
    `- Report fingerprint: \`${report.reportFingerprintSha256}\`\n\n` +
    `## Tracking epoch\n\n` +
    `v1 bound an untracked-directory observation. This successor proves that the same ` +
    `VB003 ordinary-file byte set is now tracked and clean at the fixed HEAD/tree by ` +
    `matching all ${report.workspaceIdentity.trackedFileCount} working-tree files to ` +
    `their stage-0 Git index blobs while retaining SHA-256 as the primary byte identity.\n\n` +
    `## Boundary\n\n` +
    `${report.trackingEpochTransition.interpretation} The five v1 proposed changes ` +
    `remain candidate-only. No Phase A/Phase B, reviewer task, HMG4RB4, production ` +
    `helper, original runtime, apply, recovery, renderer, acceptance, promotion, ` +
    `integration, release, or publication action is authorized or performed.\n`;
}

async function assertSnapshotCurrent(snapshot) {
  const current = await readSnapshot(snapshot.projectRoot);
  for (const key of Object.keys(FIXED_INPUTS)) {
    assert.deepEqual(binding(current.fixedRecords[key]),
      binding(snapshot.fixedRecords[key]),
    `${FIXED_INPUTS[key].path} changed after snapshot`);
  }
  for (const key of Object.keys(snapshot.predecessorInputRecords)) {
    assert.deepEqual(binding(current.predecessorInputRecords[key]),
      binding(snapshot.predecessorInputRecords[key]),
    `${snapshot.predecessorInputRecords[key].path} changed after snapshot`);
  }
  assert.deepEqual(current.git, snapshot.git,
    "VB003 tracked-clean identity changed after snapshot");
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1, "Usage: ... --write | --check");
  assert.ok(["--write", "--check"].includes(args[0]),
    "Expected --write or --check; --apply is deliberately unsupported");
  return args[0];
}

export async function writeNoClobber(absolute, contents, expectedMode = OUTPUT_MODE) {
  const expectedBytes = Buffer.from(contents, "utf8");
  try {
    const before = await lstat(absolute, {bigint: true});
    assert.ok(before.isFile() && !before.isSymbolicLink(),
      `${absolute} must be an ordinary non-symlink file`);
    assert.equal(before.nlink, 1n, `${absolute} must have exactly one hard link`);
    assert.equal(await realpath(absolute), absolute,
      `${absolute} resolves through a symlink`);
    const current = await readFile(absolute);
    const after = await lstat(absolute, {bigint: true});
    assert.equal(statIdentity(after), statIdentity(before),
      `${absolute} changed while checking no-clobber output`);
    assert.deepEqual(current, expectedBytes,
      `${absolute} exists with different bytes; refusing overwrite`);
    assert.equal(Number(before.mode & 0o777n), expectedMode,
      `${absolute} exists with unexpected mode; refusing metadata mutation`);
    return "already-current";
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await writeFile(absolute, expectedBytes, {flag: "wx", mode: expectedMode});
  const written = await lstat(absolute, {bigint: true});
  assert.ok(written.isFile() && !written.isSymbolicLink(),
    `${absolute} write did not create an ordinary non-symlink file`);
  assert.equal(written.nlink, 1n, `${absolute} must have exactly one hard link`);
  assert.equal(Number(written.mode & 0o777n), expectedMode,
    `${absolute} was not created with the frozen output mode`);
  assert.equal(await realpath(absolute), absolute,
    `${absolute} written output resolves through a symlink`);
  assert.deepEqual(await readFile(absolute), expectedBytes,
    `${absolute} written bytes do not match`);
  return "created";
}

async function checkExactOutput(absolute, contents) {
  const info = await lstat(absolute, {bigint: true});
  assert.ok(info.isFile() && !info.isSymbolicLink(),
    `${absolute} must be an ordinary non-symlink file`);
  assert.equal(info.nlink, 1n, `${absolute} must have exactly one hard link`);
  assert.equal(Number(info.mode & 0o777n), OUTPUT_MODE,
    `${absolute} output mode drifted`);
  assert.equal(await realpath(absolute), absolute,
    `${absolute} resolves through a symlink`);
  assert.deepEqual(await readFile(absolute), Buffer.from(contents, "utf8"),
    `${absolute} output bytes are stale`);
}

export async function runCli(args = process.argv.slice(2), projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveReport(snapshot);
  const jsonContents = `${JSON.stringify(report, null, 2)}\n`;
  const markdownContents = renderMarkdown(report);
  await assertSnapshotCurrent(snapshot);
  const jsonOutput = await resolveSafeOutputPath(projectRoot, REPORT_JSON_PATH);
  const markdownOutput = await resolveSafeOutputPath(projectRoot, REPORT_MD_PATH);
  if (mode === "--write") {
    const markdownDisposition = await writeNoClobber(markdownOutput, markdownContents);
    const jsonDisposition = await writeNoClobber(jsonOutput, jsonContents);
    await checkExactOutput(markdownOutput, markdownContents);
    await checkExactOutput(jsonOutput, jsonContents);
    await assertSnapshotCurrent(snapshot);
    return {mode, report, jsonDisposition, markdownDisposition};
  }
  await checkExactOutput(markdownOutput, markdownContents);
  await checkExactOutput(jsonOutput, jsonContents);
  await assertSnapshotCurrent(snapshot);
  return {mode, report, checked: [REPORT_JSON_PATH, REPORT_MD_PATH]};
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(
      `${result.mode === "--write" ? "WROTE" : "CHECKED"} ` +
      `${REPORT_JSON_PATH} ${REPORT_MD_PATH}\n`,
    );
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
