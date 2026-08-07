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
  buildG5L5StaticFrameDomainDispositionEvidence,
  commitG5L5StaticEvidenceOutputs,
  parseArguments,
  verifyG5L5StaticFrameDomainDispositionEvidence,
} from "./build-g5-l5-static-frame-domain-disposition-evidence.mjs";
import {
  buildG5L5StaticFrameDomainDispositionSelection,
  commitG5L5StaticSelectionOutputs,
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

async function createPhysicalEvidenceFixture(t) {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-static-evidence-physical-"),
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
  const selection =
    await buildG5L5StaticFrameDomainDispositionSelection({
      projectRoot: root,
    });
  await commitG5L5StaticSelectionOutputs({
    projectRoot: root,
    ...selection,
  });
  return {root, selection};
}

async function createIsolatedTransactionFixture(t, count = 3) {
  const temporary = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-static-evidence-transaction-"),
  );
  const root = await realpath(temporary);
  t.after(async () => {
    await rm(root, {recursive: true, force: true});
  });
  const results = [];
  const originals = new Map();
  for (let index = 0; index < count; index += 1) {
    const animationId = `evidence-transaction-${index + 1}`;
    const outputPath = path.join(
      root,
      "migrations",
      animationId,
      "audit",
      "static-frame-domain-disposition-evidence.json",
    );
    await mkdir(path.dirname(outputPath), {recursive: true});
    const original = Buffer.from(`original:${animationId}\n`);
    await writeFile(outputPath, original, {flag: "wx"});
    originals.set(outputPath, original);
    const rendered =
      `${JSON.stringify({animationId, evidence: "static"}, null, 2)}\n`;
    results.push({
      animationId,
      outputPath,
      rendered,
      sha256: sha256(rendered),
    });
  }
  return {root, results, originals};
}

async function evidenceResidue(results) {
  const residue = [];
  for (const parent of new Set(
    results.map(({outputPath}) => path.dirname(outputPath)),
  )) {
    for (const name of await readdir(parent)) {
      if (name.includes(".stage-") || name.includes(".backup-")) {
        residue.push(path.join(parent, name));
      }
    }
  }
  return residue.sort();
}

test("evidence CLI requires explicit mode, exact scope, and unique IDs", async () => {
  assert.deepEqual(
    parseArguments(["--apply", "--all-selected"]),
    {
      check: false,
      apply: true,
      allSelected: true,
      ids: [],
      help: false,
    },
  );
  assert.deepEqual(
    parseArguments(["--check", "--id", "member-a", "--id", "member-b"]),
    {
      check: true,
      apply: false,
      allSelected: false,
      ids: ["member-a", "member-b"],
      help: false,
    },
  );
  assert.throws(() => parseArguments([]), /one explicit mode/);
  assert.throws(
    () => parseArguments(["--apply", "--check", "--all-selected"]),
    /one explicit mode/,
  );
  assert.throws(
    () => parseArguments(["--apply", "--all-selected", "--id", "member-a"]),
    /exactly one scope/,
  );
  assert.throws(
    () => parseArguments([
      "--check",
      "--id",
      "member-a",
      "--id",
      "member-a",
    ]),
    /must not be repeated/,
  );
  await assert.rejects(
    buildG5L5StaticFrameDomainDispositionEvidence({
      projectRoot: path.join(os.tmpdir(), "must-not-be-read"),
      ids: ["member-a", "member-a"],
      check: true,
    }),
    /must not be repeated/,
  );
});

test(
  "isolated evidence transaction is repeatable, stage-clean, and inode-safe",
  {timeout: 120_000},
  async (t) => {
    const {root, results, originals} =
      await createIsolatedTransactionFixture(t);

    await t.test("apply and same-content reapply leave no residue", async () => {
      await commitG5L5StaticEvidenceOutputs({
        projectRoot: root,
        results,
        inputRecords: [],
      });
      await commitG5L5StaticEvidenceOutputs({
        projectRoot: root,
        results,
        inputRecords: [],
      });
      for (const result of results) {
        assert.equal(await readFile(result.outputPath, "utf8"), result.rendered);
        assert.equal(
          (await lstat(result.outputPath, {bigint: true})).nlink,
          1n,
        );
      }
      assert.deepEqual(await evidenceResidue(results), []);
    });

    await t.test("stage-N failure removes every owned stage", async () => {
      const before = new Map(
        await Promise.all(results.map(async ({outputPath}) => [
          outputPath,
          await readFile(outputPath),
        ])),
      );
      await assert.rejects(
        commitG5L5StaticEvidenceOutputs({
          projectRoot: root,
          results,
          inputRecords: [],
          hooks: {
            afterStage({index}) {
              if (index === 1) throw new Error("injected evidence stage-N");
            },
          },
        }),
        /injected evidence stage-N/,
      );
      for (const [outputPath, expected] of before) {
        assert.deepEqual(await readFile(outputPath), expected);
      }
      assert.deepEqual(await evidenceResidue(results), []);
    });

    await t.test("output ancestor symlink is refused", async () => {
      const first = results[0];
      const audit = path.dirname(first.outputPath);
      const auditReal = `${audit}-real`;
      await rename(audit, auditReal);
      await symlink(path.basename(auditReal), audit);
      try {
        await assert.rejects(
          commitG5L5StaticEvidenceOutputs({
            projectRoot: root,
            results: [first],
            inputRecords: [],
          }),
          /ancestor must be an ordinary directory/,
        );
      } finally {
        await unlink(audit);
        await rename(auditReal, audit);
      }
      assert.deepEqual(await evidenceResidue(results), []);
    });

    await t.test(
      "backup cleanup failure never rolls back committed evidence",
      async () => {
        let foreignBackupPath;
        let foreignIdentity;
        await assert.rejects(
          commitG5L5StaticEvidenceOutputs({
            projectRoot: root,
            results,
            inputRecords: [],
            hooks: {
              async beforeCleanup({entries}) {
                const entry = entries[1];
                const bytes = await readFile(entry.backupPath);
                await unlink(entry.backupPath);
                await writeFile(entry.backupPath, bytes, {flag: "wx"});
                foreignBackupPath = entry.backupPath;
                const information = await lstat(
                  entry.backupPath,
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
        for (const result of results) {
          assert.equal(
            await readFile(result.outputPath, "utf8"),
            result.rendered,
          );
        }
        const current = await lstat(foreignBackupPath, {bigint: true});
        assert.deepEqual(
          {dev: current.dev, ino: current.ino},
          foreignIdentity,
        );
        await unlink(foreignBackupPath);
        assert.deepEqual(await evidenceResidue(results), []);
      },
    );

    await t.test(
      "rollback preserves a same-bytes foreign replacement inode",
      async () => {
        let foreignIdentity;
        let foreignBytes;
        await assert.rejects(
          commitG5L5StaticEvidenceOutputs({
            projectRoot: root,
            results,
            inputRecords: [],
            hooks: {
              async afterFirstInstall({entries}) {
                const [entry] = entries;
                foreignBytes = await readFile(entry.outputPath);
                const installed = await lstat(
                  entry.outputPath,
                  {bigint: true},
                );
                const foreignSource = `${entry.outputPath}.foreign`;
                await writeFile(foreignSource, foreignBytes, {flag: "wx"});
                const foreign = await lstat(foreignSource, {bigint: true});
                assert.notDeepEqual(
                  {dev: foreign.dev, ino: foreign.ino},
                  {dev: installed.dev, ino: installed.ino},
                );
                await unlink(entry.outputPath);
                await rename(foreignSource, entry.outputPath);
                foreignIdentity = {dev: foreign.dev, ino: foreign.ino};
              },
            },
          }),
          /rollback was incomplete/,
        );
        const current = await lstat(results[0].outputPath, {bigint: true});
        assert.deepEqual(
          {dev: current.dev, ino: current.ino},
          foreignIdentity,
        );
        assert.deepEqual(await readFile(results[0].outputPath), foreignBytes);
        assert.notDeepEqual(
          await readFile(results[0].outputPath),
          originals.get(results[0].outputPath),
        );
      },
    );
  },
);

test(
  "evidence check and exported verifier reject symlink and hard-link outputs",
  {timeout: 240_000},
  async (t) => {
    const {root, selection} = await createPhysicalEvidenceFixture(t);
    const animationId =
      selection.receipt.acceptedSet.members[0].animationId;
    const [written] =
      await buildG5L5StaticFrameDomainDispositionEvidence({
        projectRoot: root,
        ids: [animationId],
      });
    assert.equal(written.action, "written");
    const [checked] =
      await buildG5L5StaticFrameDomainDispositionEvidence({
        projectRoot: root,
        ids: [animationId],
        check: true,
      });
    assert.equal(checked.action, "verified");
    assert.equal(
      (
        await verifyG5L5StaticFrameDomainDispositionEvidence(
          animationId,
          {projectRoot: root},
        )
      ).action,
      "verified",
    );

    const outputPath = written.outputPath;
    await t.test("symbolic-link output", async () => {
      const referent = `${outputPath}.referent`;
      await rename(outputPath, referent);
      await symlink(path.basename(referent), outputPath);
      try {
        await assert.rejects(
          buildG5L5StaticFrameDomainDispositionEvidence({
            projectRoot: root,
            ids: [animationId],
            check: true,
          }),
          /ordinary single-link file/,
        );
        await assert.rejects(
          verifyG5L5StaticFrameDomainDispositionEvidence(
            animationId,
            {projectRoot: root},
          ),
          /ordinary single-link file/,
        );
      } finally {
        await unlink(outputPath);
        await rename(referent, outputPath);
      }
    });

    await t.test("hard-linked output", async () => {
      const secondLink = `${outputPath}.second-link`;
      await link(outputPath, secondLink);
      try {
        await assert.rejects(
          buildG5L5StaticFrameDomainDispositionEvidence({
            projectRoot: root,
            ids: [animationId],
            check: true,
          }),
          /ordinary single-link file/,
        );
        await assert.rejects(
          verifyG5L5StaticFrameDomainDispositionEvidence(
            animationId,
            {projectRoot: root},
          ),
          /ordinary single-link file/,
        );
      } finally {
        await unlink(secondLink);
      }
    });
  },
);
