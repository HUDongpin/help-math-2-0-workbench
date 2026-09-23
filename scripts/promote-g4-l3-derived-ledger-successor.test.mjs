import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {once} from "node:events";
import test from "node:test";

import {
  applyDerivedLedgerSuccessor,
  checkDerivedLedgerSuccessor,
  dryRunDerivedLedgerSuccessor,
  generateDerivedLedgerSuccessorStateFromCandidates,
  parseArguments,
} from "./promote-g4-l3-derived-ledger-successor.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function completionDocument(marker) {
  return {
    schemaVersion: 1,
    generatedMarker: `sha256:${marker.repeat(64)}`,
    generator: {path: "scripts/build-completion-ledger.mjs", version: "test"},
    validator: {path: "validator.mjs", version: "test", sha256: "1".repeat(64)},
    source: {migrationsRoot: "migrations"},
    summary: {
      migrationDirectories: 1,
      declaredComplete: 0,
      strictComplete: 0,
      strictFailed: 1,
      statusCounts: {preserved: 1},
    },
    diagnostics: [{animationId: "fixture", errors: ["not complete"]}],
    entries: [],
  };
}

function releaseDocument(completionBytes, marker) {
  return {
    schemaVersion: 1,
    generatedMarker: `sha256:${marker.repeat(64)}`,
    generator: {
      path: "scripts/build-lesson-release-ledger.mjs",
      version: "test",
      bytes: 1,
      sha256: "2".repeat(64),
    },
    sources: {
      lessonReleases: {
        path: "catalog/lesson-releases.json",
        bytes: 1,
        sha256: "3".repeat(64),
      },
      completionLedger: {
        path: "catalog/completion-ledger.json",
        bytes: completionBytes.length,
        sha256: sha256(completionBytes),
        generatedMarker: JSON.parse(completionBytes).generatedMarker,
      },
      migrationsRoot: "migrations",
    },
    summary: {
      releaseCount: 1,
      publishedReleaseCount: 0,
      unpublishedReleaseCount: 1,
      memberCount: 40,
      strictCompleteMemberCount: 0,
    },
    releases: [{
      releaseId: "lesson-g04-l03-negative-numbers",
      expectedMemberCount: 40,
      strictCompleteCount: 0,
      missingCount: 40,
      assetMismatchCount: 0,
      published: false,
      status: "unpublished",
      gate: {
        kind: "atomic-all-members-strict",
        requiredCount: 40,
        admittedCount: 0,
        open: false,
      },
      members: [],
    }],
  };
}

async function fixture(t) {
  const root = await realpath(
    await mkdtemp(path.join(os.tmpdir(), "g4-l3-ledger-successor-")),
  );
  t.after(() => rm(root, {recursive: true, force: true}));
  await Promise.all([
    mkdir(path.join(root, "catalog")),
    mkdir(path.join(root, "migrations")),
    mkdir(path.join(root, "reports")),
    mkdir(path.join(root, "work")),
  ]);

  const beforeCompletion = completionDocument("a");
  const beforeCompletionBytes = Buffer.from(stableJson(beforeCompletion));
  const beforeRelease = releaseDocument(beforeCompletionBytes, "b");
  await Promise.all([
    writeFile(
      path.join(root, "catalog/completion-ledger.json"),
      beforeCompletionBytes,
      {mode: 0o644},
    ),
    writeFile(
      path.join(root, "catalog/lesson-release-ledger.json"),
      stableJson(beforeRelease),
      {mode: 0o644},
    ),
  ]);
  await Promise.all([
    chmod(path.join(root, "catalog/completion-ledger.json"), 0o644),
    chmod(path.join(root, "catalog/lesson-release-ledger.json"), 0o644),
  ]);

  const completionCandidate = completionDocument("c");
  completionCandidate.diagnostics[0].errors.push("new reviewed diagnostic");
  const completionBytes = Buffer.from(stableJson(completionCandidate));
  const releaseCandidate = releaseDocument(completionBytes, "d");
  const stateFactory = ({root: selectedRoot}) =>
    generateDerivedLedgerSuccessorStateFromCandidates({
      root: selectedRoot,
      completionCandidate,
      releaseCandidate,
    });
  return {
    root,
    completionCandidate,
    releaseCandidate,
    stateFactory,
  };
}

test("argument parser defaults to a non-writing dry run", () => {
  assert.equal(parseArguments([]).mode, "dry-run");
  assert.equal(parseArguments(["--check"]).mode, "check");
  assert.equal(parseArguments(["--apply"]).mode, "apply");
  assert.throws(
    () => parseArguments(["--apply", "--check"]),
    /mutually exclusive/u,
  );
});

test("dry run binds canonical paths and remains strict-zero unpublished", async (t) => {
  const current = await fixture(t);
  const result = await dryRunDerivedLedgerSuccessor({
    root: current.root,
    stateFactory: current.stateFactory,
  });
  assert.equal(result.status, "ready-no-write");
  assert.deepEqual(
    result.transitions.map(({path: target}) => target),
    [
      "catalog/completion-ledger.json",
      "catalog/lesson-release-ledger.json",
    ],
  );
  assert.equal(result.semanticState.completion.strictComplete, 0);
  assert.equal(result.semanticState.g4LessonRelease.strictCompleteCount, 0);
  assert.equal(result.semanticState.g4LessonRelease.published, false);
  await assert.rejects(
    stat(path.join(
      current.root,
      "work/g4-l3-derived-ledger-successor-transactions",
    )),
    {code: "ENOENT"},
  );
});

test("apply uses two-file CAS, preserves immutable preimages, and emits a receipt", async (t) => {
  const current = await fixture(t);
  const result = await applyDerivedLedgerSuccessor({
    root: current.root,
    stateFactory: current.stateFactory,
  });
  assert.equal(result.status, "created-and-verified");
  assert.equal(result.installed.length, 2);
  assert.equal(result.semanticState.completion.strictComplete, 0);
  assert.equal(result.semanticState.g4LessonRelease.published, false);

  assert.deepEqual(
    JSON.parse(await readFile(
      path.join(current.root, "catalog/completion-ledger.json"),
      "utf8",
    )),
    current.completionCandidate,
  );
  assert.deepEqual(
    JSON.parse(await readFile(
      path.join(current.root, "catalog/lesson-release-ledger.json"),
      "utf8",
    )),
    current.releaseCandidate,
  );

  const receiptPath = path.join(current.root, result.receipt.path);
  assert.equal((await stat(receiptPath)).mode & 0o777, 0o444);
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  assert.equal(receipt.semanticState.completion.strictComplete, 0);
  assert.equal(receipt.semanticState.g4LessonRelease.published, false);
  assert.equal(receipt.authorityBoundary.strictAcceptanceEffect, "none");

  for (const [index, transition] of receipt.transitions.entries()) {
    const preimage = await readFile(path.join(
      current.root,
      transition.immutablePreimageCopy,
    ));
    assert.equal(sha256(preimage), transition.preimage.sha256);
    assert.equal(
      (await stat(path.join(
        current.root,
        transition.immutablePreimageCopy,
      ))).mode & 0o777,
      0o444,
    );
    assert.equal(index + 1, transition.ordinal);
  }

  const check = await checkDerivedLedgerSuccessor({
    root: current.root,
    stateFactory: current.stateFactory,
  });
  assert.equal(check.status, "current-strict-zero-unpublished");
  assert.equal(check.receiptCount, 1);
});

test("concurrent target drift fails closed and retains the transaction lock", async (t) => {
  const current = await fixture(t);
  const state = await current.stateFactory({root: current.root});
  await assert.rejects(
    applyDerivedLedgerSuccessor({
      root: current.root,
      stateFactory: current.stateFactory,
      hooks: {
        afterLockedSnapshot: async () => {
          await writeFile(
            path.join(current.root, "catalog/completion-ledger.json"),
            "foreign concurrent bytes\n",
          );
        },
      },
    }),
    /exact preimage|foreign|requires every item/u,
  );
  const lockPath = path.join(
    current.root,
    state.transactionRoot,
    "lock",
  );
  assert.equal((await stat(lockPath)).isDirectory(), true);
});

test("a new process adopts a dead crash lock, rolls back, and reapplies", async (t) => {
  const current = await fixture(t);
  const moduleUrl = new URL(
    "./promote-g4-l3-derived-ledger-successor.mjs",
    import.meta.url,
  ).href;
  const childSource = `
    import {
      applyDerivedLedgerSuccessor,
      generateDerivedLedgerSuccessorStateFromCandidates,
    } from ${JSON.stringify(moduleUrl)};
    const root = process.env.HELPMATH_LEDGER_FIXTURE_ROOT;
    const completionCandidate = JSON.parse(
      Buffer.from(
        process.env.HELPMATH_LEDGER_COMPLETION_CANDIDATE,
        "base64",
      ).toString("utf8"),
    );
    const releaseCandidate = JSON.parse(
      Buffer.from(
        process.env.HELPMATH_LEDGER_RELEASE_CANDIDATE,
        "base64",
      ).toString("utf8"),
    );
    const stateFactory = ({root: selectedRoot}) =>
      generateDerivedLedgerSuccessorStateFromCandidates({
        root: selectedRoot,
        completionCandidate,
        releaseCandidate,
      });
    try {
      await applyDerivedLedgerSuccessor({
        root,
        stateFactory,
        hooks: {
          leaveInterruptedForTest: true,
          cas: {
            afterState(event) {
              if (
                event.index === 0 &&
                event.state === "S3_TARGET_LINKED"
              ) {
                throw new Error("synthetic child crash");
              }
            },
          },
        },
      });
      process.exitCode = 87;
    } catch (error) {
      if (/synthetic child crash/u.test(error.message)) {
        process.exitCode = 86;
      } else {
        process.stderr.write(String(error.stack || error));
        process.exitCode = 88;
      }
    }
  `;
  const child = spawn(
    process.execPath,
    ["--input-type=module", "-e", childSource],
    {
      env: {
        ...process.env,
        HELPMATH_LEDGER_FIXTURE_ROOT: current.root,
        HELPMATH_LEDGER_COMPLETION_CANDIDATE:
          Buffer.from(JSON.stringify(current.completionCandidate))
            .toString("base64"),
        HELPMATH_LEDGER_RELEASE_CANDIDATE:
          Buffer.from(JSON.stringify(current.releaseCandidate))
            .toString("base64"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const stderr = [];
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  const [exitCode] = await once(child, "close");
  assert.equal(
    exitCode,
    86,
    Buffer.concat(stderr).toString("utf8"),
  );

  const result = await applyDerivedLedgerSuccessor({
    root: current.root,
    stateFactory: current.stateFactory,
  });
  assert.equal(result.status, "created-and-verified");
  assert.equal(result.recoveries.length, 1);
  assert.equal(result.recoveries[0].status, "recovered-rolled-back");
  assert.deepEqual(
    JSON.parse(await readFile(
      path.join(current.root, "catalog/completion-ledger.json"),
      "utf8",
    )),
    current.completionCandidate,
  );
  assert.deepEqual(
    JSON.parse(await readFile(
      path.join(current.root, "catalog/lesson-release-ledger.json"),
      "utf8",
    )),
    current.releaseCandidate,
  );
});

test("a durable receipt is treated as the commit point after a dead-process crash", async (t) => {
  const current = await fixture(t);
  const moduleUrl = new URL(
    "./promote-g4-l3-derived-ledger-successor.mjs",
    import.meta.url,
  ).href;
  const childSource = `
    import {
      applyDerivedLedgerSuccessor,
      generateDerivedLedgerSuccessorStateFromCandidates,
    } from ${JSON.stringify(moduleUrl)};
    const root = process.env.HELPMATH_LEDGER_FIXTURE_ROOT;
    const completionCandidate = JSON.parse(
      Buffer.from(
        process.env.HELPMATH_LEDGER_COMPLETION_CANDIDATE,
        "base64",
      ).toString("utf8"),
    );
    const releaseCandidate = JSON.parse(
      Buffer.from(
        process.env.HELPMATH_LEDGER_RELEASE_CANDIDATE,
        "base64",
      ).toString("utf8"),
    );
    const stateFactory = ({root: selectedRoot}) =>
      generateDerivedLedgerSuccessorStateFromCandidates({
        root: selectedRoot,
        completionCandidate,
        releaseCandidate,
      });
    try {
      await applyDerivedLedgerSuccessor({
        root,
        stateFactory,
        hooks: {
          afterReceiptDurable() {
            throw new Error("synthetic post-receipt crash");
          },
        },
      });
      process.exitCode = 87;
    } catch (error) {
      if (/synthetic post-receipt crash/u.test(error.message)) {
        process.exitCode = 86;
      } else {
        process.stderr.write(String(error.stack || error));
        process.exitCode = 88;
      }
    }
  `;
  const child = spawn(
    process.execPath,
    ["--input-type=module", "-e", childSource],
    {
      env: {
        ...process.env,
        HELPMATH_LEDGER_FIXTURE_ROOT: current.root,
        HELPMATH_LEDGER_COMPLETION_CANDIDATE:
          Buffer.from(JSON.stringify(current.completionCandidate))
            .toString("base64"),
        HELPMATH_LEDGER_RELEASE_CANDIDATE:
          Buffer.from(JSON.stringify(current.releaseCandidate))
            .toString("base64"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const stderr = [];
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  const [exitCode] = await once(child, "close");
  assert.equal(
    exitCode,
    86,
    Buffer.concat(stderr).toString("utf8"),
  );

  const result = await applyDerivedLedgerSuccessor({
    root: current.root,
    stateFactory: current.stateFactory,
  });
  assert.equal(result.status, "current-strict-zero-unpublished");
  assert.equal(result.recoveries.length, 1);
  assert.equal(result.recoveries[0].status, "recovered-committed");
  assert.equal(result.semanticState.completion.strictComplete, 0);
  assert.equal(result.semanticState.g4LessonRelease.published, false);
});
