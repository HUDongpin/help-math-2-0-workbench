import assert from "node:assert/strict";
import {constants as fsConstants} from "node:fs";
import {createHash} from "node:crypto";
import {
  copyFile,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildG5L5StaticFrameDomainDispositionCandidates,
  stableJson as candidateStableJson,
} from "./build-g5-l5-static-frame-domain-disposition-candidates.mjs";
import {
  G5_L5_RUNTIME_UNVERIFIED_PLANNING_REGISTRY_RELATIVE_PATH,
  G5_L5_STATIC_SELECTION_RECEIPT_RELATIVE_PATH,
  buildG5L5StaticFrameDomainDispositionSelection,
  commitG5L5StaticSelectionOutputs,
  parseArguments,
  validateG5L5PendingPlanningRegistryShape,
  validateG5L5StaticSelectionReceiptShape,
} from "./build-g5-l5-static-frame-domain-disposition-selection.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const CANDIDATE_REPORT_RELATIVE_PATH =
  "reports/g5-l5-static-frame-domain-disposition-candidates.json";
const SELECTION_SCRIPT_RELATIVE_PATH =
  "scripts/build-g5-l5-static-frame-domain-disposition-selection.mjs";
const EVIDENCE_SCRIPT_RELATIVE_PATH =
  "scripts/build-g5-l5-static-frame-domain-disposition-evidence.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function copyProjectFile(root, relativePath) {
  const destination = path.join(root, relativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(
    path.join(projectRoot, relativePath),
    destination,
    fsConstants.COPYFILE_FICLONE,
  );
}

async function createPhysicalSelectionFixture(t) {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-static-selection-"),
  );
  const root = await realpath(temporary);
  t.after(async () => {
    await rm(root, {recursive: true, force: true});
  });

  const candidate =
    await buildG5L5StaticFrameDomainDispositionCandidates({
      projectRoot,
    });
  const paths = new Set(
    candidate.inputRecords.map(({path: relativePath}) => relativePath),
  );
  paths.add(SELECTION_SCRIPT_RELATIVE_PATH);
  paths.add(EVIDENCE_SCRIPT_RELATIVE_PATH);
  for (const relativePath of paths) {
    await copyProjectFile(root, relativePath);
  }
  await mkdir(path.join(root, "reports"), {recursive: true});
  await writeFile(
    path.join(root, CANDIDATE_REPORT_RELATIVE_PATH),
    candidateStableJson(candidate.report),
    {encoding: "utf8", flag: "wx"},
  );

  const built =
    await buildG5L5StaticFrameDomainDispositionSelection({
      projectRoot: root,
    });
  return {root, built};
}

async function readSelectionOutputs(root) {
  return new Map(
    await Promise.all([
      G5_L5_STATIC_SELECTION_RECEIPT_RELATIVE_PATH,
      G5_L5_RUNTIME_UNVERIFIED_PLANNING_REGISTRY_RELATIVE_PATH,
    ].map(async (relativePath) => [
      relativePath,
      await readFile(path.join(root, relativePath)),
    ])),
  );
}

async function selectionResidue(root) {
  const entries = await readdir(path.join(root, "reports"));
  return entries
    .filter((name) => name.includes(".tmp-") || name.includes(".bak-"))
    .sort();
}

test("selection CLI requires one explicit execution mode", () => {
  assert.deepEqual(parseArguments(["--dry-run"]), {mode: "dry-run"});
  assert.deepEqual(parseArguments(["--apply"]), {mode: "apply"});
  assert.deepEqual(parseArguments(["--check"]), {mode: "check"});
  assert.throws(() => parseArguments([]), /exactly one explicit/);
  assert.throws(
    () => parseArguments(["--apply", "--check"]),
    /exactly one explicit/,
  );
  assert.throws(
    () => parseArguments(["--apply", "--unknown"]),
    /Unknown option/,
  );
});

test(
  "selection physical transaction is repeatable, stage-clean, and inode-safe",
  {timeout: 240_000},
  async (t) => {
    const {root, built} = await createPhysicalSelectionFixture(t);
    assert.equal(validateG5L5StaticSelectionReceiptShape(built.receipt), true);
    assert.equal(
      validateG5L5PendingPlanningRegistryShape(built.registry),
      true,
    );
    assert.equal(built.receipt.acceptedSet.memberCount, 28);
    assert.equal(built.receipt.acceptedSet.candidateCount, 696);
    assert.equal(built.registry.summary.pendingTimelineCount, 351);

    await t.test(
      "apply, check, and same-content reapply leave no residue",
      async () => {
        const first = await commitG5L5StaticSelectionOutputs({
          projectRoot: root,
          ...built,
        });
        assert.equal(first.action, "written");
        const checked = await commitG5L5StaticSelectionOutputs({
          projectRoot: root,
          ...built,
          check: true,
        });
        assert.equal(checked.action, "verified");
        const reapplied = await commitG5L5StaticSelectionOutputs({
          projectRoot: root,
          ...built,
        });
        assert.equal(reapplied.action, "written");
        for (const [relativePath, expected] of built.outputs) {
          const actual = await readFile(path.join(root, relativePath));
          assert.deepEqual(actual, expected);
          assert.equal(sha256(actual), sha256(expected));
          assert.equal(
            (await lstat(path.join(root, relativePath), {bigint: true})).nlink,
            1n,
          );
        }
        assert.deepEqual(await selectionResidue(root), []);
      },
    );

    await t.test("check rejects symlink and hard-link outputs", async () => {
      const outputPath = path.join(
        root,
        G5_L5_STATIC_SELECTION_RECEIPT_RELATIVE_PATH,
      );
      const referent = `${outputPath}.referent`;
      await rename(outputPath, referent);
      await symlink(path.basename(referent), outputPath);
      try {
        await assert.rejects(
          commitG5L5StaticSelectionOutputs({
            projectRoot: root,
            ...built,
            check: true,
          }),
          /ordinary single-link file/,
        );
      } finally {
        await unlink(outputPath);
        await rename(referent, outputPath);
      }
      const hardLink = `${outputPath}.hard-link`;
      await link(outputPath, hardLink);
      try {
        await assert.rejects(
          commitG5L5StaticSelectionOutputs({
            projectRoot: root,
            ...built,
            check: true,
          }),
          /ordinary single-link file/,
        );
      } finally {
        await unlink(hardLink);
      }
    });

    await t.test("stage-N failure removes every owned stage", async () => {
      const before = await readSelectionOutputs(root);
      await assert.rejects(
        commitG5L5StaticSelectionOutputs({
          projectRoot: root,
          ...built,
          hooks: {
            afterEachStage({index}) {
              if (index === 1) throw new Error("injected selection stage-N");
            },
          },
        }),
        /injected selection stage-N/,
      );
      for (const [relativePath, expected] of before) {
        assert.deepEqual(
          await readFile(path.join(root, relativePath)),
          expected,
        );
      }
      assert.deepEqual(await selectionResidue(root), []);
    });

    await t.test("output ancestor symlink is refused", async () => {
      const reports = path.join(root, "reports");
      const reportsReal = path.join(root, "reports-real");
      await rename(reports, reportsReal);
      await symlink("reports-real", reports);
      try {
        await assert.rejects(
          commitG5L5StaticSelectionOutputs({
            projectRoot: root,
            ...built,
          }),
          /ancestor must be an ordinary directory/,
        );
      } finally {
        await unlink(reports);
        await rename(reportsReal, reports);
      }
      assert.deepEqual(await selectionResidue(root), []);
    });

    await t.test(
      "backup cleanup failure never rolls back committed targets",
      async () => {
        let foreignBackupPath;
        let foreignIdentity;
        await assert.rejects(
          commitG5L5StaticSelectionOutputs({
            projectRoot: root,
            ...built,
            hooks: {
              async beforeCleanup({entries}) {
                const entry = entries[1];
                const bytes = await readFile(entry.backup);
                await unlink(entry.backup);
                await writeFile(entry.backup, bytes, {flag: "wx"});
                foreignBackupPath = entry.backup;
                const information = await lstat(
                  entry.backup,
                  {bigint: true},
                );
                foreignIdentity = {
                  dev: information.dev,
                  ino: information.ino,
                };
              },
            },
          }),
          /backup cleanup was incomplete/,
        );
        for (const [relativePath, expected] of built.outputs) {
          assert.deepEqual(
            await readFile(path.join(root, relativePath)),
            expected,
          );
        }
        const current = await lstat(foreignBackupPath, {bigint: true});
        assert.deepEqual(
          {dev: current.dev, ino: current.ino},
          foreignIdentity,
        );
        await unlink(foreignBackupPath);
        assert.deepEqual(await selectionResidue(root), []);
      },
    );

    await t.test(
      "rollback preserves a same-bytes foreign replacement inode",
      async () => {
        let foreignIdentity;
        let foreignBytes;
        await assert.rejects(
          commitG5L5StaticSelectionOutputs({
            projectRoot: root,
            ...built,
            hooks: {
              async afterInstall({entry, index}) {
                if (index !== 0) return;
                foreignBytes = await readFile(entry.snapshot.absolutePath);
                const installed = await lstat(
                  entry.snapshot.absolutePath,
                  {bigint: true},
                );
                const foreignSource =
                  `${entry.snapshot.absolutePath}.foreign`;
                await writeFile(foreignSource, foreignBytes, {flag: "wx"});
                const foreign = await lstat(foreignSource, {bigint: true});
                assert.notDeepEqual(
                  {dev: foreign.dev, ino: foreign.ino},
                  {dev: installed.dev, ino: installed.ino},
                );
                await unlink(entry.snapshot.absolutePath);
                await rename(foreignSource, entry.snapshot.absolutePath);
                foreignIdentity = {dev: foreign.dev, ino: foreign.ino};
              },
            },
          }),
          /rollback was incomplete/,
        );
        const outputPath = path.join(
          root,
          G5_L5_STATIC_SELECTION_RECEIPT_RELATIVE_PATH,
        );
        const current = await lstat(outputPath, {bigint: true});
        assert.deepEqual(
          {dev: current.dev, ino: current.ino},
          foreignIdentity,
        );
        assert.deepEqual(await readFile(outputPath), foreignBytes);
      },
    );
  },
);
