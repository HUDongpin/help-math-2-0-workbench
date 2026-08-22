import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, readFile, readlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const TASK_ID = "HELP-MATH-426-PAGE-ONLY-BASELINE-20260822";
const EXPECTED_HEAD = "93fb79aa16e68d32edb43b864a1c8972d59b219f";
const EXPECTED_BRANCH = "codex/g4-l5-l10-l11-page-only-integration";
const PRESERVED_CHECKOUT = "/Volumes/WestWorld/HELP MATH 2.0";
const PRESERVED_STATUS = Object.freeze({
  modified: 111,
  deleted: 663,
  untracked: 73,
  statusSha256: "7f844e2820d1dd0e79365e3989c5567c7e2aa3cae2cd55566716fe3b5d7f5fb6",
});
const MAX_BUFFER = 256 * 1024 * 1024;

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..");
const reports = Object.freeze({
  inputPlan: "reports/help-math-426-page-only-baseline-input-plan-2026-08-22.json",
  worktrees: "reports/help-math-426-page-only-baseline-worktree-audit-2026-08-22.json",
  allowlist: "reports/help-math-426-page-only-baseline-changed-path-allowlist-2026-08-22.json",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function gitBytes(cwd, args) {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: null,
    maxBuffer: MAX_BUFFER,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitText(cwd, args) {
  return gitBytes(cwd, args).toString("utf8").trim();
}

function parseStatus(raw) {
  const fields = raw.toString("utf8").split("\0");
  const entries = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (!field) continue;
    const status = field.slice(0, 2);
    const entry = {status, path: field.slice(3)};
    if (status.includes("R") || status.includes("C")) {
      index += 1;
      entry.originalPath = fields[index];
    }
    entries.push(entry);
  }
  return entries;
}

function summarizeStatus(entries) {
  const summary = {
    modified: 0,
    deleted: 0,
    added: 0,
    renamed: 0,
    copied: 0,
    unmerged: 0,
    untracked: 0,
    total: entries.length,
  };
  for (const {status} of entries) {
    if (status === "??") {
      summary.untracked += 1;
      continue;
    }
    if (status.includes("M")) summary.modified += 1;
    if (status.includes("D")) summary.deleted += 1;
    if (status.includes("A")) summary.added += 1;
    if (status.includes("R")) summary.renamed += 1;
    if (status.includes("C")) summary.copied += 1;
    if (status.includes("U") || ["AA", "DD"].includes(status)) summary.unmerged += 1;
  }
  return summary;
}

function captureStatus(cwd, untrackedMode) {
  const raw = gitBytes(cwd, [
    "status",
    "--porcelain=v1",
    "-z",
    `--untracked-files=${untrackedMode}`,
  ]);
  const entries = parseStatus(raw);
  return {
    mode: `git status --porcelain=v1 -z --untracked-files=${untrackedMode}`,
    counts: summarizeStatus(entries),
    statusSha256: sha256(raw),
    entries,
  };
}

function parseWorktrees(raw) {
  return raw
    .trim()
    .split(/\n\n+/)
    .filter(Boolean)
    .map((block) => {
      const record = {};
      for (const line of block.split("\n")) {
        const space = line.indexOf(" ");
        const key = space === -1 ? line : line.slice(0, space);
        const value = space === -1 ? true : line.slice(space + 1);
        if (key === "worktree") record.path = value;
        else if (key === "HEAD") record.head = value;
        else if (key === "branch") record.branchRef = value;
        else record[key] = value;
      }
      return record;
    });
}

function insertSyntheticUntracked(status, paths) {
  const byPath = new Map(status.entries.map((entry) => [entry.path, entry]));
  for (const relativePath of paths) {
    if (!byPath.has(relativePath)) byPath.set(relativePath, {status: "??", path: relativePath});
  }
  const entries = [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path, "en"));
  return {
    ...status,
    counts: summarizeStatus(entries),
    statusSha256: null,
    statusSha256Meaning: "null because the two report paths were inserted before their final bytes existed",
    entries,
  };
}

async function inspectPath(absolutePath) {
  try {
    const metadata = await lstat(absolutePath);
    return {
      path: absolutePath,
      exists: true,
      kind: metadata.isSymbolicLink()
        ? "symbolic-link"
        : metadata.isDirectory()
          ? "directory"
          : metadata.isFile()
            ? "file"
            : "other",
      mode: (metadata.mode & 0o777).toString(8).padStart(4, "0"),
      ...(metadata.isSymbolicLink() ? {target: await readlink(absolutePath)} : {}),
    };
  } catch (error) {
    if (error?.code === "ENOENT") return {path: absolutePath, exists: false};
    throw error;
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

const branch = gitText(repositoryRoot, ["branch", "--show-current"]);
const head = gitText(repositoryRoot, ["rev-parse", "HEAD"]);
assertEqual(branch, EXPECTED_BRANCH, "integration branch");
assertEqual(head, EXPECTED_HEAD, "integration HEAD");

const preserved = captureStatus(PRESERVED_CHECKOUT, "normal");
assertEqual(preserved.counts.modified, PRESERVED_STATUS.modified, "preserved modified count");
assertEqual(preserved.counts.deleted, PRESERVED_STATUS.deleted, "preserved deleted count");
assertEqual(preserved.counts.untracked, PRESERVED_STATUS.untracked, "preserved untracked count");
assertEqual(preserved.statusSha256, PRESERVED_STATUS.statusSha256, "preserved status SHA-256");

// Create the report path before the final status capture so both generated
// reports appear in the integration checkout's stable allowlist.
await writeFile(path.join(repositoryRoot, reports.worktrees), "{}\n");

const worktreeRecords = parseWorktrees(gitText(repositoryRoot, ["worktree", "list", "--porcelain"]));
const subjectByHead = new Map();
const syntheticReportPaths = [reports.worktrees, reports.allowlist];
const worktrees = [];
for (const record of worktreeRecords) {
  let subject = subjectByHead.get(record.head);
  if (!subject) {
    subject = gitText(repositoryRoot, ["show", "-s", "--format=%s", record.head]);
    subjectByHead.set(record.head, subject);
  }
  let status = null;
  let statusError = null;
  try {
    status = captureStatus(record.path, "normal");
    if (record.path === repositoryRoot) {
      status = insertSyntheticUntracked(status, syntheticReportPaths);
    }
  } catch (error) {
    statusError = String(error?.message ?? error).split("\n")[0];
  }
  worktrees.push({
    path: record.path,
    head: record.head,
    subject,
    ...(record.branchRef
      ? {branch: record.branchRef.replace(/^refs\/heads\//, "")}
      : {detached: true}),
    ...(record.locked ? {locked: record.locked} : {}),
    ...(record.prunable ? {prunable: record.prunable} : {}),
    ...(status
      ? {
          status: {
            mode: status.mode,
            counts: status.counts,
            statusSha256: status.statusSha256,
            ...(status.statusSha256Meaning ? {statusSha256Meaning: status.statusSha256Meaning} : {}),
          },
        }
      : {status: {unavailable: true, error: statusError}}),
  });
}

const inputPlanBytes = await readFile(path.join(repositoryRoot, reports.inputPlan));
const worktreeAudit = {
  schemaVersion: 1,
  artifactType: "help-math-linked-worktree-baseline-audit",
  taskId: TASK_ID,
  capturedAt: new Date().toISOString(),
  inputPlan: {
    path: reports.inputPlan,
    sha256: sha256(inputPlanBytes),
  },
  integrationCheckout: {
    path: repositoryRoot,
    branch,
    head,
    baselineState: "clean at task start",
    mergeSource: PRESERVED_CHECKOUT,
    mergeMethod: "manual path-by-path review; no reset, clean, stash, checkout --, git add -A, commit, push, or deploy",
  },
  preservedDirtyCheckout: {
    path: PRESERVED_CHECKOUT,
    branch: gitText(PRESERVED_CHECKOUT, ["branch", "--show-current"]),
    head: gitText(PRESERVED_CHECKOUT, ["rev-parse", "HEAD"]),
    status: {
      mode: preserved.mode,
      counts: preserved.counts,
      statusSha256: preserved.statusSha256,
    },
  },
  linkedWorktreeCount: worktrees.length,
  inspectableWorktreeCount: worktrees.filter(({status}) => !status.unavailable).length,
  unavailableWorktreeCount: worktrees.filter(({status}) => status.unavailable).length,
  uniqueHeads: [...subjectByHead.entries()]
    .map(([commit, subject]) => ({commit, subject}))
    .sort((left, right) => left.commit.localeCompare(right.commit, "en")),
  worktrees,
  evidenceBoundary: [
    "Worktree status is a dated read-only snapshot and does not authorize cleanup of prunable or dirty worktrees.",
    "The preserved root status is asserted byte-for-byte against the frozen input plan status SHA-256.",
    "The integration worktree status summary includes both generated report paths synthetically so it describes the final checkout shape.",
  ],
};
await writeFile(path.join(repositoryRoot, reports.worktrees), `${JSON.stringify(worktreeAudit, null, 2)}\n`);

const allowlistBeforeWrite = insertSyntheticUntracked(captureStatus(repositoryRoot, "all"), [reports.allowlist]);
const allowlistEntries = allowlistBeforeWrite.entries;
const canonicalAllowlistBytes = Buffer.from(
  allowlistEntries
    .map(({status, path: relativePath, originalPath = ""}) => `${status}\0${relativePath}\0${originalPath}\0`)
    .join(""),
  "utf8",
);
const prefixCounts = {};
for (const entry of allowlistEntries) {
  const prefix = entry.path.includes("/") ? entry.path.slice(0, entry.path.indexOf("/")) : entry.path;
  prefixCounts[prefix] = (prefixCounts[prefix] ?? 0) + 1;
}

const taskSpecificIgnoredBindings = await Promise.all([
  path.join(repositoryRoot, "HELP MATH_ORIGINAL FILES"),
  path.join(repositoryRoot, "source-assets/flash/HELP MATH_ORIGINAL FILES"),
  path.join(repositoryRoot, "artifacts/full-frame/pilot-baselines/course-g03-l08-re-001"),
  path.join(repositoryRoot, "artifacts/full-frame/pilot-baselines/course-g04-l01-ir-001"),
  path.join(repositoryRoot, "artifacts/full-frame/pilot-baselines/course-g04-l09-gs-002"),
  path.join(repositoryRoot, "artifacts/g4-l3-embedded-audio"),
  path.join(repositoryRoot, "output/playwright/help-math-426-smoke"),
  "/Volumes/WestWorld/HELP MATH 2.0-g4-l5-l10-l11-integration-source-recovery-20260822/HELP MATH_ORIGINAL FILES",
].map(inspectPath));

const changedPathAllowlist = {
  schemaVersion: 1,
  artifactType: "help-math-426-page-only-baseline-changed-path-allowlist",
  taskId: TASK_ID,
  capturedAt: new Date().toISOString(),
  exactCheckout: repositoryRoot,
  branch,
  head,
  statusCommand: allowlistBeforeWrite.mode,
  counts: allowlistBeforeWrite.counts,
  exactEntryCount: allowlistEntries.length,
  canonicalPathAllowlistSha256: sha256(canonicalAllowlistBytes),
  topLevelPrefixCounts: Object.fromEntries(Object.entries(prefixCounts).sort(([left], [right]) => left.localeCompare(right, "en"))),
  entries: allowlistEntries,
  taskSpecificIgnoredBindings,
  preservedDirtyCheckout: {
    path: PRESERVED_CHECKOUT,
    counts: preserved.counts,
    statusSha256: preserved.statusSha256,
  },
  exclusions: {
    privateArchiveChanges: 0,
    newlyRegisteredMigrationPages: 0,
    commitsCreated: 0,
    pushes: 0,
    deployments: 0,
  },
};
await writeFile(path.join(repositoryRoot, reports.allowlist), `${JSON.stringify(changedPathAllowlist, null, 2)}\n`);

const finalStatus = captureStatus(repositoryRoot, "all");
const finalCanonicalBytes = Buffer.from(
  finalStatus.entries
    .sort((left, right) => left.path.localeCompare(right.path, "en"))
    .map(({status, path: relativePath, originalPath = ""}) => `${status}\0${relativePath}\0${originalPath}\0`)
    .join(""),
  "utf8",
);
assertEqual(finalStatus.entries.length, allowlistEntries.length, "final allowlist entry count");
assertEqual(sha256(finalCanonicalBytes), changedPathAllowlist.canonicalPathAllowlistSha256, "final path allowlist SHA-256");

console.log(JSON.stringify({
  taskId: TASK_ID,
  worktreeAudit: reports.worktrees,
  changedPathAllowlist: reports.allowlist,
  linkedWorktrees: worktrees.length,
  inspectableWorktrees: worktrees.filter(({status}) => !status.unavailable).length,
  integrationCounts: finalStatus.counts,
  canonicalPathAllowlistSha256: changedPathAllowlist.canonicalPathAllowlistSha256,
  preservedDirtyStatusSha256: preserved.statusSha256,
}, null, 2));
