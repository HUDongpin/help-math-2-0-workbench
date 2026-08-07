import assert from "node:assert/strict";
import {
  link,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildG5L4WorkspaceReadinessRefresh,
  parseArguments,
  readStableSingleLinkFile,
} from "./refresh-g5-l4-workspace-readiness.mjs";

test("CLI requires exactly one explicit non-mutating or report-write mode", () => {
  assert.deepEqual(parseArguments(["--dry-run"]), {
    mode: "dry-run",
    help: false,
  });
  assert.deepEqual(parseArguments(["--check"]), {
    mode: "check",
    help: false,
  });
  assert.deepEqual(parseArguments(["--write"]), {
    mode: "write",
    help: false,
  });
  assert.deepEqual(parseArguments(["--help"]), {
    mode: null,
    help: true,
  });
  assert.throws(() => parseArguments([]), /choose --dry-run/);
  assert.throws(
    () => parseArguments(["--check", "--write"]),
    /choose exactly one mode/,
  );
  assert.throws(() => parseArguments(["--apply"]), /unknown argument/);
});

test("real dry-run and check revalidate 55 drafts without changing reports", async () => {
  const paths = [
    "reports/g5-l4-workspace-readiness.json",
    "reports/g5-l4-workspace-readiness.md",
  ];
  const before = await Promise.all(paths.map((candidate) => readFile(candidate)));
  const dryRun = await buildG5L4WorkspaceReadinessRefresh({
    mode: "dry-run",
  });
  const checked = await buildG5L4WorkspaceReadinessRefresh({
    mode: "check",
  });
  const after = await Promise.all(paths.map((candidate) => readFile(candidate)));
  assert.equal(dryRun.action, "planned");
  assert.equal(checked.action, "verified");
  assert.equal(dryRun.memberCount, 55);
  assert.equal(dryRun.draftValidationPassCount, 55);
  assert.equal(dryRun.workspaceFilesWritten, 0);
  assert.equal(dryRun.reportFilesWritten, 0);
  assert.equal(dryRun.implementationStarted, 52);
  assert.equal(dryRun.strictComplete, 0);
  assert.equal(dryRun.published, 0);
  assert.deepEqual(after, before);
});

test("stable reader rejects symbolic links and multiply linked files", async (t) => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l4-readiness-reader-"),
  );
  t.after(() => rm(root, {recursive: true, force: true}));
  const canonicalRoot = await realpath(root);
  await mkdir(path.join(canonicalRoot, "reports"));
  await writeFile(
    path.join(canonicalRoot, "reports", "ordinary.json"),
    "{}\n",
  );
  await symlink(
    "ordinary.json",
    path.join(canonicalRoot, "reports", "symbolic.json"),
  );
  await link(
    path.join(canonicalRoot, "reports", "ordinary.json"),
    path.join(canonicalRoot, "reports", "hard.json"),
  );
  await assert.rejects(
    readStableSingleLinkFile(canonicalRoot, "reports/symbolic.json"),
    /ordinary single-link file/,
  );
  await assert.rejects(
    readStableSingleLinkFile(canonicalRoot, "reports/hard.json"),
    /ordinary single-link file/,
  );
});

test("a validator that does not report PASS fails the whole preflight", async () => {
  await assert.rejects(
    buildG5L4WorkspaceReadinessRefresh({
      mode: "dry-run",
      validatorRunner: async () => ({
        stdout: "not accepted",
        stderr: "",
      }),
    }),
    /draft validator did not report PASS/,
  );
});
