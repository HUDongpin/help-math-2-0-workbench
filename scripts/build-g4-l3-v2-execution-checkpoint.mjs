#!/usr/bin/env node

import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, readdir, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_PATH = "catalog/lesson-releases.json";
const COMPLETION_LEDGER_PATH = "catalog/completion-ledger.json";
const RELEASE_LEDGER_PATH = "catalog/lesson-release-ledger.json";
const SOURCE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const REPORT_JSON = "reports/g4-l3-v2-execution-checkpoint.json";
const REPORT_MARKDOWN = "reports/g4-l3-v2-execution-checkpoint.md";
const OWN_OUTPUTS = new Set([REPORT_JSON, REPORT_MARKDOWN]);
const SHA256 = /^[a-f0-9]{64}$/;
const PRIVATE_GIT_PROBES = Object.freeze([
  "private-archive/.g4-l3-v2-checkpoint-probe",
  "artifacts/full-frame/g4-l3/.g4-l3-v2-checkpoint-probe",
  "work/tmp/.g4-l3-v2-checkpoint-probe",
  "work/original-runtime-host-trees/.g4-l3-v2-checkpoint-probe",
  "work/g4-l3-v2-coverage-preimages/.g4-l3-v2-checkpoint-probe",
  "work/g4-l3-v2-ts006-domain-preimages/.g4-l3-v2-checkpoint-probe",
  "work/g4-l3-v2-ts006-static-disposition-preimages/.g4-l3-v2-checkpoint-probe",
  "work/g4-l3-v2-ts006-current-js-binding-preimages/.g4-l3-v2-checkpoint-probe",
]);
const VERCEL_REQUIRED_RULES = Object.freeze([
  "artifacts/",
  "source-assets/",
  "migrations/",
  "output/",
  "outputs/",
  "documentation/",
  "work/",
  "private-archive/",
  "**/*.fla",
  "**/*.swf",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, "project path is required");
  invariant(!path.isAbsolute(relativePath), `project path must be relative: ${relativePath}`);
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`), `project path escapes root: ${relativePath}`);
  return resolved;
}

async function bindFile(relativePath, {expectedSha256 = null, expectedBytes = null} = {}) {
  const absolutePath = projectPath(relativePath);
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  const physical = await stat(absolutePath);
  invariant(physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytes = await readFile(absolutePath);
  const observed = {path: portable(relativePath), bytes: bytes.length, sha256: sha256(bytes)};
  if (expectedSha256 !== null) invariant(observed.sha256 === expectedSha256, `${relativePath} SHA-256 differs from its release pin`);
  if (expectedBytes !== null) invariant(observed.bytes === expectedBytes, `${relativePath} byte length differs from its release pin`);
  return observed;
}

async function readJsonBinding(relativePath) {
  const binding = await bindFile(relativePath);
  return {...binding, value: JSON.parse(await readFile(projectPath(relativePath), "utf8"))};
}

function run(command, args, {allowFailure = false} = {}) {
  const result = spawnSync(command, args, {cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024});
  if (!allowFailure) invariant(result.status === 0, `${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout).trim()}`);
  return {
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

export function summarizePorcelain(raw, excludedPaths = OWN_OUTPUTS) {
  const records = raw.split("\0").filter(Boolean).filter((record) => !excludedPaths.has(portable(record.slice(3))));
  const statusCounts = {};
  for (const record of records) {
    const status = record.slice(0, 2);
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }
  return {
    recordCount: records.length,
    statusCounts: Object.fromEntries(Object.entries(statusCounts).sort(([left], [right]) => left.localeCompare(right))),
    porcelainSha256: sha256(Buffer.from(`${records.sort().join("\0")}\0`)),
    pathsWithheld: true,
  };
}

function exactRelease(document) {
  const release = document.releases?.find(({releaseId}) => releaseId === "lesson-g04-l03-negative-numbers");
  invariant(release?.publicationMode === "atomic", "G4 L3 release is not atomic");
  invariant(release.expectedCounts?.activeXmlReferencedPages === 39, "G4 L3 release no longer declares 39 pages");
  invariant(release.expectedCounts?.courseShells === 1 && release.expectedCounts?.members === 40, "G4 L3 release no longer declares 39 pages plus one shell");
  invariant(release.members?.length === 40 && release.members.every(({ordinal}, index) => ordinal === index + 1), "G4 L3 release membership/order drifted");
  return release;
}

async function bindReleaseSources(release) {
  const sourceLesson = await bindFile(`${SOURCE_ROOT}/${release.sourceLesson.path}`, {
    expectedSha256: release.sourceLesson.sha256,
    expectedBytes: release.sourceLesson.bytes,
  });
  const members = [];
  for (const member of release.members) {
    invariant(member.assetId === `swf-${member.source.sha256}` && SHA256.test(member.source.sha256), `${member.animationId}: release asset/source identity drifted`);
    members.push({
      ordinal: member.ordinal,
      animationId: member.animationId,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
      assetId: member.assetId,
      source: await bindFile(`${SOURCE_ROOT}/${member.source.path}`, {expectedSha256: member.source.sha256}),
    });
  }
  return {sourceLesson, members};
}

async function bindMigrationState(release) {
  const members = [];
  for (const member of release.members) {
    const migrationJson = await bindFile(`migrations/${member.animationId}/migration.json`);
    const fullFrameCoverage = await bindFile(`migrations/${member.animationId}/evidence/full-frame-coverage.json`);
    const [migration, coverage] = await Promise.all([
      readFile(projectPath(migrationJson.path), "utf8").then(JSON.parse),
      readFile(projectPath(fullFrameCoverage.path), "utf8").then(JSON.parse),
    ]);
    invariant(migration.animationId === member.animationId && coverage.animationId === member.animationId, `${member.animationId}: workspace identity drifted`);
    const requirements = coverage.requirements ?? [];
    invariant(requirements.every((requirement) => Number.isSafeInteger(requirement.requiredRange?.firstFrame)
      && Number.isSafeInteger(requirement.requiredRange?.lastFrame)
      && requirement.requiredRange.firstFrame >= 1
      && requirement.requiredRange.lastFrame >= requirement.requiredRange.firstFrame), `${member.animationId}: invalid coverage frame range remains`);
    members.push({
      ordinal: member.ordinal,
      animationId: member.animationId,
      migrationJson,
      fullFrameCoverage,
      status: migration.status ?? null,
      requirements: requirements.length,
      requirementStatusCounts: requirements.reduce((counts, {status}) => ({...counts, [status]: (counts[status] ?? 0) + 1}), {}),
    });
  }
  return members;
}

async function bindG4L3Reports() {
  const names = (await readdir(projectPath("reports")))
    .filter((name) => /^g4-l3-.*\.(?:json|md)$/.test(name))
    .map((name) => `reports/${name}`)
    .filter((name) => !OWN_OUTPUTS.has(name))
    .sort();
  return Promise.all(names.map((name) => bindFile(name)));
}

function gitBoundary() {
  const checks = PRIVATE_GIT_PROBES.map((probe) => {
    const result = run("git", ["check-ignore", "--no-index", "-q", "--", probe], {allowFailure: true});
    return {path: probe, ignored: result.status === 0};
  });
  invariant(checks.every(({ignored}) => ignored), "one or more private/work evidence paths are not ignored by Git");
  const tracked = run("git", ["ls-files", "--", "private-archive", "artifacts/full-frame", "work/tmp", "work/original-runtime-host-trees", "work/g4-l3-v2-coverage-preimages", "work/g4-l3-v2-ts006-domain-preimages", "work/g4-l3-v2-ts006-static-disposition-preimages", "work/g4-l3-v2-ts006-current-js-binding-preimages"]);
  invariant(tracked.stdout === "", "private/full-frame/tmp paths are present in the Git index");
  return {checks, trackedForbiddenPaths: 0};
}

async function vercelBoundary() {
  const binding = await bindFile(".vercelignore");
  const lines = new Set((await readFile(projectPath(".vercelignore"), "utf8"))
    .split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")));
  const checks = VERCEL_REQUIRED_RULES.map((rule) => ({rule, present: lines.has(rule)}));
  invariant(checks.every(({present}) => present), ".vercelignore is missing a private/source/evidence exclusion");
  return {binding, checks};
}

function toolVersions() {
  const git = run("git", ["--version"]).stdout;
  const npm = run("npm", ["--version"]).stdout;
  const osProduct = run("/usr/bin/sw_vers", ["-productVersion"], {allowFailure: true}).stdout || null;
  const osBuild = run("/usr/bin/sw_vers", ["-buildVersion"], {allowFailure: true}).stdout || null;
  const javaResult = run("java", ["-version"], {allowFailure: true});
  return {
    node: process.version,
    npm,
    git,
    platform: process.platform,
    architecture: process.arch,
    macosProductVersion: osProduct,
    macosBuildVersion: osBuild,
    java: (javaResult.stderr || javaResult.stdout).split(/\r?\n/)[0] || null,
  };
}

function markdown(report) {
  return `# G4 L3 Lesson MVP v2 execution checkpoint\n\n`
    + `This is the current, post-M0 engineering checkpoint. It does not rewrite history and does not claim an original-runtime capture, human review, owner acceptance, strict completion, or publication.\n\n`
    + `- Atomic release members: **${report.summary.releaseMembers}/40** (39 pages plus one shell).\n`
    + `- Source hashes reverified: **${report.summary.sourceMembersVerified}/40** plus \`index.xml\`.\n`
    + `- Workspace migration/coverage pairs bound: **${report.summary.workspacePairsBound}/40**.\n`
    + `- Valid coverage requirements: **${report.summary.coverageRequirements}**; invalid ranges: **${report.summary.invalidCoverageRanges}**.\n`
    + `- Current-JavaScript pages: **${report.summary.currentJavascriptPages}/39**.\n`
    + `- Strict completion / publication: **${report.summary.strictCompleteMembers}/40**, **${report.summary.publishedReleases}/1**.\n`
    + `- Bound G4 L3 report files: **${report.summary.boundReportFiles}**.\n`
    + `- Git private/work boundary and Vercel deployment boundary: **pass / pass**.\n`
    + `- Branch: \`${report.git.branch}\`; HEAD: ${report.git.head ?? "unborn"}.\n\n`
    + `The worktree fingerprint deliberately withholds paths. Raw private archives, full-frame captures, temporary fixtures, source binaries, and credentials are not copied into this report.\n`;
}

export async function generateCheckpoint() {
  const [releaseBinding, completionBinding, releaseLedgerBinding, currentJsBinding, reportFiles, gitignore, vercel] = await Promise.all([
    readJsonBinding(RELEASE_PATH),
    readJsonBinding(COMPLETION_LEDGER_PATH),
    readJsonBinding(RELEASE_LEDGER_PATH),
    readJsonBinding("reports/g4-l3-current-javascript-progress.json"),
    bindG4L3Reports(),
    bindFile(".gitignore"),
    vercelBoundary(),
  ]);
  const release = exactRelease(releaseBinding.value);
  const [sources, workspaces] = await Promise.all([bindReleaseSources(release), bindMigrationState(release)]);
  const releaseLedger = releaseLedgerBinding.value.releases?.find(({releaseId}) => releaseId === release.releaseId);
  invariant(completionBinding.value.summary?.strictComplete === 0, "strict completion is no longer 0; checkpoint acceptance text must be reviewed");
  invariant(releaseLedger?.strictCompleteCount === 0 && releaseLedger?.published === false, "atomic release is no longer closed at 0/40");
  invariant(currentJsBinding.value.summary?.currentJavaScriptModules === 39, "current-JavaScript page count is no longer 39/39");
  const coverageRequirements = workspaces.reduce((total, item) => total + item.requirements, 0);
  const invalidCoverageRanges = 0;
  const branch = run("git", ["symbolic-ref", "--short", "HEAD"]).stdout;
  const headResult = run("git", ["rev-parse", "--verify", "HEAD"], {allowFailure: true});
  const rawStatus = run("git", ["status", "--porcelain=v1", "--untracked-files=all", "--no-renames", "-z"]).stdout;
  const base = {
    reportType: "g4-l3-v2-execution-checkpoint",
    checkpointKind: "post-m0-current-state-not-prechange-freeze",
    generator: await bindFile(portable(path.relative(ROOT, SCRIPT_PATH))),
    git: {
      branch,
      head: headResult.status === 0 ? headResult.stdout : null,
      unborn: headResult.status !== 0,
      worktree: summarizePorcelain(rawStatus),
    },
    tools: toolVersions(),
    boundaries: {
      gitignore,
      git: gitBoundary(),
      vercel,
      rawPrivateEvidenceCopiedIntoCheckpoint: false,
      secretsCopiedIntoCheckpoint: false,
    },
    release: {
      manifest: {path: releaseBinding.path, bytes: releaseBinding.bytes, sha256: releaseBinding.sha256},
      releaseId: release.releaseId,
      publicationMode: release.publicationMode,
      sourceLesson: sources.sourceLesson,
      members: sources.members,
    },
    workspaces,
    ledgers: {
      completion: {path: completionBinding.path, bytes: completionBinding.bytes, sha256: completionBinding.sha256, strictComplete: 0},
      lessonRelease: {path: releaseLedgerBinding.path, bytes: releaseLedgerBinding.bytes, sha256: releaseLedgerBinding.sha256, published: false, strictCompleteCount: 0},
    },
    currentJavascript: {
      report: {path: currentJsBinding.path, bytes: currentJsBinding.bytes, sha256: currentJsBinding.sha256},
      pages: 39,
      acceptanceEffect: "none",
    },
    reports: reportFiles,
    summary: {
      releaseMembers: release.members.length,
      sourceMembersVerified: sources.members.length,
      workspacePairsBound: workspaces.length,
      coverageRequirements,
      invalidCoverageRanges,
      currentJavascriptPages: 39,
      strictCompleteMembers: 0,
      publishedReleases: 0,
      boundReportFiles: reportFiles.length,
      privateGitBoundariesPassed: PRIVATE_GIT_PROBES.length,
      vercelBoundariesPassed: VERCEL_REQUIRED_RULES.length,
    },
    acceptance: {
      currentEngineeringStateBound: true,
      authoritativeRuntimeSessionsExecuted: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      publicRelease: false,
    },
  };
  return {schemaVersion: 1, checkpointSha256: sha256(Buffer.from(pretty(base))), ...base};
}

async function emit(relativePath, bytes, check) {
  const target = projectPath(relativePath);
  if (check) {
    invariant((await readFile(target)).equals(bytes), `${relativePath} is stale`);
    return;
  }
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

export async function runCheckpoint({check = false} = {}) {
  const report = await generateCheckpoint();
  await emit(REPORT_JSON, Buffer.from(pretty(report)), check);
  await emit(REPORT_MARKDOWN, Buffer.from(markdown(report)), check);
  return report;
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCheckpoint(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(`PASS: G4 L3 v2 checkpoint bound ${report.summary.releaseMembers}/40 sources/workspaces, ${report.summary.coverageRequirements} valid requirements, strict ${report.summary.strictCompleteMembers}/40.\n`);
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
