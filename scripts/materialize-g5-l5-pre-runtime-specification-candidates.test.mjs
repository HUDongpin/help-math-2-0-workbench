import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";
import {gzipSync} from "node:zlib";

import {
  assertPriorOwnership,
  classifyStaticReconciliationReceiptState,
  materializeG5L5PreRuntimeSpecificationCandidates,
  parseArguments,
  parseFfdecScriptBundle,
  preflightOutput,
  validatePriorReceipt,
  validateHistoricalCandidateDescriptor,
  writeTransaction,
} from "./materialize-g5-l5-pre-runtime-specification-candidates.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function machineForBundle(animationId, compressed, expanded, count) {
  return {
    animationId,
    outputs: [{
      path: "audit/machine/ffdec-scripts.txt.gz",
      bytes: compressed.length,
      sha256: sha256(compressed),
      uncompressedBytes: expanded.length,
      uncompressedSha256: sha256(expanded),
    }],
    findings: {exportedScriptFileCount: count},
  };
}

async function withTemporaryRoot(callback) {
  const root = await mkdtemp(path.join(tmpdir(), "g5-l5-candidates-"));
  try {
    await mkdir(path.join(root, "migrations/a/audit/machine"), {
      recursive: true,
    });
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

async function inputGuard(absolutePath, relativePath) {
  const bytes = await readFile(absolutePath);
  const info = await lstat(absolutePath);
  return {
    absolutePath,
    relativePath,
    bytes,
    sha256: sha256(bytes),
    identity: {
      dev: info.dev,
      ino: info.ino,
      mode: info.mode,
      uid: info.uid,
      gid: info.gid,
      size: info.size,
      nlink: info.nlink,
      mtimeMs: info.mtimeMs,
    },
  };
}

async function stageNames(root) {
  return (await readdir(path.join(root, "migrations/a/audit/machine")))
    .filter((name) => name.includes(".desired-") || name.includes(".backup-"));
}

test("argument parser exposes only full-release check/dry-run controls", () => {
  assert.equal(parseArguments([]).check, false);
  assert.equal(parseArguments(["--check"]).check, true);
  assert.equal(parseArguments(["--dry-run"]).dryRun, true);
  assert.throws(
    () => parseArguments(["--check", "--dry-run"]),
    /mutually exclusive/,
  );
  assert.throws(() => parseArguments(["--member", "1"]), /unknown option/);
  assert.throws(() => parseArguments(["--runtime"]), /unknown option/);
});

test("static reconciliation transition is exactly 0 or 57 receipts", () => {
  assert.equal(
    classifyStaticReconciliationReceiptState(Array(57).fill(false)),
    "pre-adoption",
  );
  assert.equal(
    classifyStaticReconciliationReceiptState(Array(57).fill(true)),
    "historical-post-adoption",
  );
  const partial = Array(57).fill(false);
  partial[56] = true;
  assert.throws(
    () => classifyStaticReconciliationReceiptState(partial),
    /partial \(1\/57\)/,
  );
});

test("historical candidate descriptors reject post-adoption tampering", () => {
  const member = {animationId: "course-g05-l05-test"};
  const expected = {
    path:
      "migrations/course-g05-l05-test/audit/machine/candidate.json",
    bytes: 8,
    sha256: "a".repeat(64),
  };
  assert.equal(
    validateHistoricalCandidateDescriptor({
      member,
      actualBinding: structuredClone(expected),
      expected,
      expectedPath: expected.path,
      label: "candidate",
    }),
    expected,
  );
  assert.throws(
    () =>
      validateHistoricalCandidateDescriptor({
        member,
        actualBinding: {...expected, sha256: "b".repeat(64)},
        expected,
        expectedPath: expected.path,
        label: "candidate",
      }),
    /differs from its static reconciliation receipt/,
  );
});

test("FFDec bundle parser retains the final script without a following header", () => {
  const expanded = Buffer.from(
    "===== scripts/first.as =====\nstop();\n" +
      "===== scripts/final.as =====\ngetURL(\"review-only\");",
  );
  const compressed = gzipSync(expanded);
  const parsed = parseFfdecScriptBundle(
    compressed,
    machineForBundle("synthetic-final-script", compressed, expanded, 2),
  );
  assert.equal(parsed.records.length, 2);
  assert.equal(parsed.records[1].sourcePath, "scripts/final.as");
  assert.equal(parsed.records[1].lineCount, 1);
  assert.deepEqual(parsed.records[1].externalApiOccurrences, [
    {api: "getURL", occurrences: 1},
  ]);
});

test("real first member and shell FFDec bundles match machine counts", async () => {
  const cases = [
    ["course-g05-l05-ir-001-664ab764", 9, []],
    [
      "shell-course-g05-l05-index-local",
      540,
      [
        {api: "SharedObject", occurrences: 1},
        {api: "fscommand", occurrences: 5},
        {api: "getURL", occurrences: 3},
        {api: "loadMovie", occurrences: 5},
      ],
    ],
  ];
  for (const [animationId, expectedCount, expectedCalls] of cases) {
    const workspace = path.join(projectRoot, "migrations", animationId);
    const machine = JSON.parse(
      await readFile(
        path.join(workspace, "audit/machine/report.json"),
        "utf8",
      ),
    );
    const compressed = await readFile(
      path.join(workspace, "audit/machine/ffdec-scripts.txt.gz"),
    );
    const parsed = parseFfdecScriptBundle(compressed, machine);
    assert.equal(parsed.records.length, expectedCount);
    const totals = new Map();
    for (const record of parsed.records) {
      for (const {api, occurrences} of record.externalApiOccurrences) {
        totals.set(api, (totals.get(api) || 0) + occurrences);
      }
    }
    assert.deepEqual(
      [...totals]
        .map(([api, occurrences]) => ({api, occurrences}))
        .sort((left, right) => left.api.localeCompare(right.api)),
      [...expectedCalls].sort((left, right) =>
        left.api.localeCompare(right.api)),
    );
  }
});

test("real full-release dry-run preflights 57 packages and 399 outputs", async () => {
  const result =
    await materializeG5L5PreRuntimeSpecificationCandidates({
      root: projectRoot,
      dryRun: true,
    });
  assert.ok(
    ["dry-run", "dry-run-historical"].includes(result.mode),
  );
  const expected = {
    memberCount: 57,
    outputCount: 399,
    definitionCount: 9767,
    scriptCount: 2456,
    dependencyApiCandidateCount: 6,
    dependencyOccurrenceCount: 17,
    candidatePackageCompleteCount:
      result.mode === "dry-run-historical" ? 57 : 0,
    canonicalFilesChanged: 0,
    runtimeSessionsExecuted: 0,
    guiApplicationsLaunched: 0,
    legacyEndpointsExecuted: 0,
    implementationReadyCount: 0,
    implementationAuthorizedCount: 0,
    strictCompleteCount: 0,
    publishedCount: 0,
  };
  if (result.mode === "dry-run-historical") {
    expected.staticReconciliationCount = 57;
  }
  assert.deepEqual(result.summary, expected);
  assert.ok(
    result.members.every(
      ({outputCount, outputs, guards}) =>
        outputCount === 7 && outputs === undefined && guards === undefined,
    ),
  );
  assert.ok(Object.values(result.acceptanceEffects).every((value) => !value));
});

test("transaction rolls back newly created outputs after a middle failure", async () => {
  await withTemporaryRoot(async (root) => {
    const paths = [
      "migrations/a/audit/machine/one.json",
      "migrations/a/audit/machine/two.json",
    ];
    const outputs = await Promise.all([
      preflightOutput(root, paths[0], Buffer.from("one\n")),
      preflightOutput(root, paths[1], Buffer.from("two\n")),
    ]);
    await assert.rejects(
      writeTransaction(outputs, {
        hooks: {
          beforeCommit({index}) {
            if (index === 1) throw new Error("injected middle failure");
          },
        },
      }),
      /injected middle failure/,
    );
    await assert.rejects(readFile(path.join(root, paths[0])), /ENOENT/);
    await assert.rejects(readFile(path.join(root, paths[1])), /ENOENT/);
    assert.deepEqual(await stageNames(root), []);
  });
});

test("transaction restores prior bytes after a middle failure", async () => {
  await withTemporaryRoot(async (root) => {
    const paths = [
      "migrations/a/audit/machine/one.json",
      "migrations/a/audit/machine/two.json",
    ];
    await writeFile(path.join(root, paths[0]), "prior-one\n");
    await writeFile(path.join(root, paths[1]), "prior-two\n");
    const outputs = await Promise.all([
      preflightOutput(root, paths[0], Buffer.from("next-one\n")),
      preflightOutput(root, paths[1], Buffer.from("next-two\n")),
    ]);
    await assert.rejects(
      writeTransaction(outputs, {
        hooks: {
          beforeCommit({index}) {
            if (index === 1) throw new Error("injected replacement failure");
          },
        },
      }),
      /injected replacement failure/,
    );
    assert.equal(await readFile(path.join(root, paths[0]), "utf8"), "prior-one\n");
    assert.equal(await readFile(path.join(root, paths[1]), "utf8"), "prior-two\n");
    assert.deepEqual(await stageNames(root), []);
  });
});

test("input drift immediately before commit is detected and outputs roll back", async () => {
  await withTemporaryRoot(async (root) => {
    const relativeInput = "guarded-input.txt";
    const absoluteInput = path.join(root, relativeInput);
    await writeFile(absoluteInput, "stable input\n");
    const guard = await inputGuard(absoluteInput, relativeInput);
    const paths = [
      "migrations/a/audit/machine/one.json",
      "migrations/a/audit/machine/two.json",
    ];
    const outputs = await Promise.all([
      preflightOutput(root, paths[0], Buffer.from("one\n")),
      preflightOutput(root, paths[1], Buffer.from("two\n")),
    ]);
    await assert.rejects(
      writeTransaction(outputs, {
        inputGuards: [guard],
        hooks: {
          async beforeCommit({index}) {
            if (index === 1) await writeFile(absoluteInput, "drifted input\n");
          },
        },
      }),
      /input identity changed after preflight/,
    );
    await assert.rejects(readFile(path.join(root, paths[0])), /ENOENT/);
    await assert.rejects(readFile(path.join(root, paths[1])), /ENOENT/);
    assert.deepEqual(await stageNames(root), []);
  });
});

test("output preflight rejects path escape, symlink parent, and hard-linked target", async () => {
  await withTemporaryRoot(async (root) => {
    await assert.rejects(
      preflightOutput(
        root,
        "migrations/a/audit/machine/../../escape.json",
        Buffer.from("x"),
      ),
      /not normalized/,
    );

    await mkdir(path.join(root, "outside"), {recursive: true});
    await symlink(
      path.join(root, "outside"),
      path.join(root, "migrations/symlinked"),
    );
    await assert.rejects(
      preflightOutput(
        root,
        "migrations/symlinked/audit/machine/candidate.json",
        Buffer.from("x"),
      ),
      /real directory/,
    );

    const original = path.join(root, "owned.txt");
    const linkedTarget =
      path.join(root, "migrations/a/audit/machine/hard-linked.json");
    await writeFile(original, "owned\n");
    await link(original, linkedTarget);
    await assert.rejects(
      preflightOutput(
        root,
        "migrations/a/audit/machine/hard-linked.json",
        Buffer.from("x"),
      ),
      /single-link file/,
    );
  });
});

test("foreign or acceptance-promoting prior receipt is rejected", () => {
  const member = {
    animationId: "page-1",
    assetId: `swf-${"a".repeat(64)}`,
  };
  assert.throws(
    () => validatePriorReceipt({
      schemaVersion: 1,
      artifactType: "g5-l5-pre-runtime-specification-candidate-receipt",
      releaseId: "lesson-g05-l05-add-subtract-negative-numbers",
      animationId: member.animationId,
      assetId: member.assetId,
      generatedBy: {
        path: "scripts/materialize-g5-l5-pre-runtime-specification-candidates.mjs",
        sha256: "b".repeat(64),
      },
      ownership: {
        safeToReplaceOnlyWithThisMaterializer: true,
        canonicalFile: false,
      },
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      legacyEndpointsExecuted: 0,
      workspaceCanonicalFilesChanged: 0,
      sourceAssetsChanged: false,
      acceptanceEffects: {strictComplete: true},
    }, member),
    /foreign or crossed a protected boundary/,
  );
});

test("an unreceipted foreign candidate file is rejected", async () => {
  await withTemporaryRoot(async (root) => {
    const outputPaths = {
      manifestRuntimeFacts:
        "migrations/a/audit/machine/manifest-runtime-facts-candidate.json",
      receipt:
        "migrations/a/audit/machine/pre-runtime-specification-candidate-receipt.json",
    };
    await writeFile(
      path.join(root, outputPaths.manifestRuntimeFacts),
      "{\"foreign\":true}\n",
    );
    await assert.rejects(
      assertPriorOwnership(
        root,
        {animationId: "a", assetId: `swf-${"a".repeat(64)}`},
        outputPaths,
      ),
      /foreign unowned output exists/,
    );
  });
});
