import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  appendFile,
  chmod,
  copyFile,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
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
  G5_L5_POST_M1_ANIMATE_OUTPUT_NAME,
  G5_L5_POST_M1_ANIMATE_REPORT_PREFIX,
  materializeG5L5PostM1AnimateAuthoringSuccessors,
  parseArguments,
  stableJson,
} from "./materialize-g5-l5-post-m1-animate-authoring-successors.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const releaseId = "lesson-g05-l05-add-subtract-negative-numbers";
const generatorRelative =
  "scripts/materialize-g5-l5-post-m1-animate-authoring-successors.mjs";
const historicalReportJson =
  "reports/g5-l5-animate-authoring-operator-readiness.json";
const historicalReportMarkdown =
  "reports/g5-l5-animate-authoring-operator-readiness.md";
const stagingRoot =
  "work/animate/release-read-only-fla-copies/" +
  `${releaseId}/all`;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeRelative(root, relativePath, value, mode = 0o644) {
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await writeFile(absolutePath, value, {mode});
  await chmod(absolutePath, mode);
  return absolutePath;
}

async function copyRelative(root, relativePath, mode = 0o644) {
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await copyFile(path.join(projectRoot, relativePath), absolutePath);
  await chmod(absolutePath, mode);
  return absolutePath;
}

function adjustReleaseScope(container, count) {
  container.release = {
    ...container.release,
    selectedMemberCount: count,
    fullReleaseMemberCount: count,
  };
}

async function writeContentAddressed(root, directory, document) {
  const bytes = Buffer.from(stableJson(document));
  const digest = sha256(bytes);
  const relativePath = `${directory}/${digest}.json`;
  await writeRelative(root, relativePath, bytes, 0o444);
  return {
    file: relativePath,
    sha256: digest,
    bytes: bytes.length,
    mode: "0444",
  };
}

async function makeFixture(t, {swfOnly = false} = {}) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-post-m1-animate-"),
  );
  t.after(async () => {
    await rm(root, {recursive: true, force: true});
  });
  const sourceCatalog = JSON.parse(
    await readFile(
      path.join(projectRoot, "catalog/lesson-releases.json"),
      "utf8",
    ),
  );
  const sourceRelease = sourceCatalog.releases.find(
    ({releaseId: candidate}) => candidate === releaseId,
  );
  const member = structuredClone(sourceRelease.members[swfOnly ? 1 : 0]);
  member.ordinal = 1;
  const release = {
    ...structuredClone(sourceRelease),
    expectedCounts: {
      ...structuredClone(sourceRelease.expectedCounts),
      activeXmlReferencedPages: 1,
      courseShells: 0,
      members: 1,
    },
    members: [member],
  };
  const releaseFingerprint = sha256(Buffer.from(stableJson(release)));
  await writeRelative(
    root,
    "catalog/lesson-releases.json",
    `${JSON.stringify({releases: [release], schemaVersion: 1}, null, 2)}\n`,
  );
  await copyRelative(root, generatorRelative);

  const workspace = `migrations/${member.animationId}`;
  for (const suffix of [
    "migration.json",
    "audit/machine/g5-l5-m1-static-reconciliation-receipt.json",
  ]) {
    await copyRelative(root, `${workspace}/${suffix}`);
  }
  const receiptPath =
    `${workspace}/audit/machine/` +
    "g5-l5-m1-static-reconciliation-receipt.json";
  const receipt = JSON.parse(
    await readFile(path.join(root, receiptPath), "utf8"),
  );
  receipt.releaseMembership.ordinal = member.ordinal;
  delete receipt.receiptFingerprintSha256;
  receipt.receiptFingerprintSha256 =
    sha256(Buffer.from(stableJson(receipt)));
  await writeRelative(root, receiptPath, stableJson(receipt));

  const oldReportSource = JSON.parse(
    await readFile(path.join(projectRoot, historicalReportJson), "utf8"),
  );
  const oldManifestSource = JSON.parse(
    await readFile(
      path.join(
        projectRoot,
        oldReportSource.inputs.releaseStagingManifest.file,
      ),
      "utf8",
    ),
  );
  const oldQueueSource = JSON.parse(
    await readFile(
      path.join(
        projectRoot,
        oldReportSource.inputs.releasePrepareOnlyQueue.file,
      ),
      "utf8",
    ),
  );

  const oldManifest = structuredClone(oldManifestSource);
  adjustReleaseScope(oldManifest, 1);
  oldManifest.entries = swfOnly
    ? []
    : oldManifestSource.entries.filter(
      ({animationId}) => animationId === member.animationId,
    );
  oldManifest.noFlaDispositions = swfOnly
    ? oldManifestSource.noFlaDispositions.filter(
      ({animationId}) => animationId === member.animationId,
    )
    : [];
  for (const row of [
    ...oldManifest.entries,
    ...oldManifest.noFlaDispositions,
  ]) {
    row.releaseOrdinal = member.ordinal;
  }
  Object.assign(oldManifest.summary, {
    selectedMembers: 1,
    flaBackedItems: swfOnly ? 0 : 1,
    swfOnlyItems: swfOnly ? 1 : 0,
    copiesReady: swfOnly ? 0 : 1,
  });
  const manifestBinding = await writeContentAddressed(
    root,
    `${stagingRoot}/manifests/sha256`,
    oldManifest,
  );

  const oldQueue = structuredClone(oldQueueSource);
  adjustReleaseScope(oldQueue, 1);
  oldQueue.queue = swfOnly
    ? []
    : oldQueueSource.queue.filter(
      ({animationId}) => animationId === member.animationId,
    );
  oldQueue.noFlaDispositions = swfOnly
    ? oldQueueSource.noFlaDispositions.filter(
      ({animationId}) => animationId === member.animationId,
    )
    : [];
  for (const row of [...oldQueue.queue, ...oldQueue.noFlaDispositions]) {
    row.releaseOrdinal = member.ordinal;
  }
  oldQueue.stagingManifest = structuredClone(manifestBinding);
  Object.assign(oldQueue.summary, {
    preparedFlaItems: swfOnly ? 0 : 1,
    noFlaDispositions: swfOnly ? 1 : 0,
    pendingAuthoringAudits: swfOnly ? 0 : 1,
  });
  const queueBinding = await writeContentAddressed(
    root,
    `${stagingRoot}/operator-queues/sha256`,
    oldQueue,
  );

  const oldReport = structuredClone(oldReportSource);
  adjustReleaseScope(oldReport, 1);
  oldReport.queue = swfOnly
    ? []
    : oldReportSource.queue.filter(
      ({animationId}) => animationId === member.animationId,
    );
  oldReport.noFlaDispositions = swfOnly
    ? oldReportSource.noFlaDispositions.filter(
      ({animationId}) => animationId === member.animationId,
    )
    : [];
  for (const row of [...oldReport.queue, ...oldReport.noFlaDispositions]) {
    row.releaseOrdinal = member.ordinal;
  }
  Object.assign(oldReport.inputs, {
    releaseStagingManifest: structuredClone(manifestBinding),
    releasePrepareOnlyQueue: structuredClone(queueBinding),
  });
  Object.assign(oldReport.summary, {
    selectedMembers: 1,
    flaBackedItems: swfOnly ? 0 : 1,
    swfOnlyItems: swfOnly ? 1 : 0,
    sourcePairsVerified: swfOnly ? 0 : 1,
    releaseStagingCopiesVerified: swfOnly ? 0 : 1,
    pairedAssistPackagesVerified: swfOnly ? 0 : 1,
    exactPrepareOnlyCommandsRecorded: swfOnly ? 0 : 1,
    exactHumanAssistedCommandTemplatesRecorded: swfOnly ? 0 : 1,
    pendingHumanAssistedRuns: swfOnly ? 0 : 1,
  });
  const oldReportBytes = Buffer.from(stableJson(oldReport));
  await writeRelative(root, historicalReportJson, oldReportBytes);
  await writeRelative(
    root,
    historicalReportMarkdown,
    `# G5 L5 Animate authoring operator readiness\n\n` +
      `Queue JSON SHA-256: \`${sha256(oldReportBytes)}\`\n`,
  );

  const stagingRow = swfOnly
    ? oldManifest.noFlaDispositions[0]
    : oldManifest.entries[0];
  await copyRelative(root, stagingRow.sourceSwf.file);
  if (!swfOnly) {
    await copyRelative(root, stagingRow.sourceFla.file);
    await copyRelative(root, stagingRow.workingCopy.file, 0o444);
  }

  const memberOutput =
    `${workspace}/audit/machine/${G5_L5_POST_M1_ANIMATE_OUTPUT_NAME}`;
  const reportJson = `${G5_L5_POST_M1_ANIMATE_REPORT_PREFIX}.json`;
  const reportMarkdown = `${G5_L5_POST_M1_ANIMATE_REPORT_PREFIX}.md`;
  const outputPaths = [memberOutput, reportJson, reportMarkdown];
  const historicalPaths = [
    historicalReportJson,
    historicalReportMarkdown,
    manifestBinding.file,
    queueBinding.file,
    ...(swfOnly ? [] : [stagingRow.workingCopy.file]),
  ];
  const historicalBytes = new Map(
    await Promise.all(
      historicalPaths.map(async (relativePath) => [
        relativePath,
        await readFile(path.join(root, relativePath)),
      ]),
    ),
  );
  return {
    root,
    member,
    releaseFingerprint,
    swfOnly,
    memberOutput,
    reportJson,
    reportMarkdown,
    outputPaths,
    historicalPaths,
    historicalBytes,
    manifestBinding,
  };
}

function runOptions(fixture, mode, transactionHooks = {}) {
  return {
    projectRoot: fixture.root,
    mode,
    expectedMemberCount: 1,
    expectedPageCount: 1,
    expectedShellCount: 0,
    expectedFlaCount: fixture.swfOnly ? 0 : 1,
    expectedSwfOnlyCount: fixture.swfOnly ? 1 : 0,
    expectedReleaseFingerprint: fixture.releaseFingerprint,
    transactionHooks,
  };
}

async function assertOutputsAbsent(fixture) {
  for (const relativePath of fixture.outputPaths) {
    await assert.rejects(
      readFile(path.join(fixture.root, relativePath)),
      {code: "ENOENT"},
    );
  }
}

async function assertHistoricalUnchanged(fixture) {
  for (const relativePath of fixture.historicalPaths) {
    assert.deepEqual(
      await readFile(path.join(fixture.root, relativePath)),
      fixture.historicalBytes.get(relativePath),
    );
  }
}

test("argument parser is fail-closed", () => {
  assert.deepEqual(parseArguments([]), {mode: "dry-run", help: false});
  assert.deepEqual(parseArguments(["--apply"]), {mode: "apply", help: false});
  assert.deepEqual(parseArguments(["--check"]), {mode: "check", help: false});
  assert.deepEqual(parseArguments(["--help"]), {
    mode: "dry-run",
    help: true,
  });
  assert.throws(
    () => parseArguments(["--dry-run", "--apply"]),
    /choose exactly one/,
  );
  assert.throws(() => parseArguments(["--unknown"]), /unknown option/);
});

test("FLA-backed dry-run, apply, and check remain metadata-only", async (t) => {
  const fixture = await makeFixture(t);
  const dryRun =
    await materializeG5L5PostM1AnimateAuthoringSuccessors(
      runOptions(fixture, "dry-run"),
    );
  assert.equal(dryRun.outputCount, 3);
  assert.equal(dryRun.staleOutputCount, 3);
  assert.equal(dryRun.flaBackedMemberCount, 1);
  assert.equal(dryRun.currentPostM1StagingManifestCount, 0);
  assert.equal(dryRun.stagingLineageGapCount, 1);
  await assertOutputsAbsent(fixture);

  const applied =
    await materializeG5L5PostM1AnimateAuthoringSuccessors(
      runOptions(fixture, "apply"),
    );
  assert.equal(applied.action, "applied");
  assert.equal(applied.namedOperatorCount, 0);
  assert.equal(applied.sessionCount, 0);
  assert.equal(applied.guiExecutionCount, 0);
  assert.equal(applied.authoringAuditCompleteCount, 0);
  const checked =
    await materializeG5L5PostM1AnimateAuthoringSuccessors(
      runOptions(fixture, "check"),
    );
  assert.equal(checked.action, "verified");
  assert.equal(checked.staleOutputCount, 0);

  for (const relativePath of fixture.outputPaths) {
    const information = await lstat(path.join(fixture.root, relativePath), {
      bigint: true,
    });
    assert.equal(Number(information.mode & 0o777n), 0o644);
    assert.equal(information.nlink, 1n);
  }
  const memberText = await readFile(
    path.join(fixture.root, fixture.memberOutput),
    "utf8",
  );
  const member = JSON.parse(memberText);
  assert.equal(memberText, stableJson(member));
  assert.equal(member.sourceDisposition.sourceKind, "fla+swf");
  assert.equal(member.sourceDisposition.status, "audit-pending");
  assert.equal(member.currentStagingLineage.lineageGap, true);
  assert.equal(member.currentStagingLineage.currentPostM1Manifest, null);
  assert.equal(member.executionGate.runnable, false);
  assert.ok(Object.values(member.counts).every((value) => value === 0));
  assert.ok(
    Object.values(member.acceptanceEffects).every((value) => value === false),
  );
  await assertHistoricalUnchanged(fixture);
});

test("SWF-only member remains an explicit authoring source gap", async (t) => {
  const fixture = await makeFixture(t, {swfOnly: true});
  await materializeG5L5PostM1AnimateAuthoringSuccessors(
    runOptions(fixture, "apply"),
  );
  const member = JSON.parse(
    await readFile(path.join(fixture.root, fixture.memberOutput), "utf8"),
  );
  assert.equal(member.sourceDisposition.sourceKind, "swf-only");
  assert.equal(member.sourceDisposition.status, "source-gap-no-fla");
  assert.equal(member.currentBindings.physicalSourceFla, null);
  assert.equal(member.currentBindings.releaseReadOnlyFlaCopy, null);
  assert.equal(member.sourceDisposition.authoringAuditApplicable, false);
  assert.equal(member.sourceDisposition.inferredAuthoringStructureAllowed, false);
  await materializeG5L5PostM1AnimateAuthoringSuccessors(
    runOptions(fixture, "check"),
  );
  await assertHistoricalUnchanged(fixture);
});

test("check rejects wrong-mode, stale, and missing managed outputs", async (t) => {
  const fixture = await makeFixture(t);
  await materializeG5L5PostM1AnimateAuthoringSuccessors(
    runOptions(fixture, "apply"),
  );
  const reportPath = path.join(fixture.root, fixture.reportMarkdown);
  await chmod(reportPath, 0o600);
  await assert.rejects(
    materializeG5L5PostM1AnimateAuthoringSuccessors(
      runOptions(fixture, "check"),
    ),
    /mode-0644/,
  );
  await chmod(reportPath, 0o644);
  await appendFile(reportPath, "\n");
  await assert.rejects(
    materializeG5L5PostM1AnimateAuthoringSuccessors(
      runOptions(fixture, "check"),
    ),
    /missing or stale \(1 file\(s\)\)/,
  );
  await unlink(reportPath);
  await assert.rejects(
    materializeG5L5PostM1AnimateAuthoringSuccessors(
      runOptions(fixture, "check"),
    ),
    /missing or stale \(1 file\(s\)\)/,
  );
});

test("input symlinks and hardlinks are rejected", async (t) => {
  await t.test("symlink", async (subtest) => {
    const fixture = await makeFixture(subtest);
    const releasePath = path.join(
      fixture.root,
      "catalog/lesson-releases.json",
    );
    const peerPath = path.join(fixture.root, "catalog/release-peer.json");
    await writeFile(peerPath, await readFile(releasePath));
    await unlink(releasePath);
    await symlink("release-peer.json", releasePath);
    await assert.rejects(
      materializeG5L5PostM1AnimateAuthoringSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /expected one ordinary non-linked file/,
    );
  });
  await t.test("hardlink", async (subtest) => {
    const fixture = await makeFixture(subtest);
    const releasePath = path.join(
      fixture.root,
      "catalog/lesson-releases.json",
    );
    await link(
      releasePath,
      path.join(fixture.root, "catalog/release-hardlink.json"),
    );
    await assert.rejects(
      materializeG5L5PostM1AnimateAuthoringSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /expected one ordinary non-linked file/,
    );
  });
});

test("staged FLA symlinks and hardlinks are rejected", async (t) => {
  await t.test("symlink", async (subtest) => {
    const fixture = await makeFixture(subtest);
    const manifest = JSON.parse(
      await readFile(
        path.join(fixture.root, fixture.manifestBinding.file),
        "utf8",
      ),
    );
    const staged = manifest.entries[0].workingCopy.file;
    const absolute = path.join(fixture.root, staged);
    const peer = `${absolute}.peer`;
    await writeFile(peer, await readFile(absolute));
    await chmod(peer, 0o444);
    await unlink(absolute);
    await symlink(path.basename(peer), absolute);
    await assert.rejects(
      materializeG5L5PostM1AnimateAuthoringSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /expected one ordinary non-linked file/,
    );
  });
  await t.test("hardlink", async (subtest) => {
    const fixture = await makeFixture(subtest);
    const manifest = JSON.parse(
      await readFile(
        path.join(fixture.root, fixture.manifestBinding.file),
        "utf8",
      ),
    );
    const staged = path.join(
      fixture.root,
      manifest.entries[0].workingCopy.file,
    );
    await link(staged, `${staged}.peer`);
    await assert.rejects(
      materializeG5L5PostM1AnimateAuthoringSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /expected one ordinary non-linked file/,
    );
  });
});

test("output symlinks, hardlinks, and unmanaged Markdown are rejected", async (t) => {
  await t.test("symlink", async (subtest) => {
    const fixture = await makeFixture(subtest);
    const peer = await writeRelative(
      fixture.root,
      "reports/output-peer.json",
      "{}\n",
    );
    await symlink(
      path.basename(peer),
      path.join(fixture.root, fixture.reportJson),
    );
    await assert.rejects(
      materializeG5L5PostM1AnimateAuthoringSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /mode-0644/,
    );
  });
  await t.test("hardlink", async (subtest) => {
    const fixture = await makeFixture(subtest);
    const peer = await writeRelative(
      fixture.root,
      "reports/output-peer.json",
      "{}\n",
    );
    await link(peer, path.join(fixture.root, fixture.reportJson));
    await assert.rejects(
      materializeG5L5PostM1AnimateAuthoringSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /mode-0644/,
    );
  });
  await t.test("unmanaged", async (subtest) => {
    const fixture = await makeFixture(subtest);
    await writeRelative(
      fixture.root,
      fixture.reportMarkdown,
      "# Unmanaged\n",
    );
    await assert.rejects(
      materializeG5L5PostM1AnimateAuthoringSuccessors(
        runOptions(fixture, "dry-run"),
      ),
      /refusing unmanaged Markdown/,
    );
  });
});

test("input CAS failure leaves every output uncommitted", async (t) => {
  const fixture = await makeFixture(t);
  let mutated = false;
  await assert.rejects(
    materializeG5L5PostM1AnimateAuthoringSuccessors(
      runOptions(fixture, "apply", {
        beforeCommit: async () => {
          if (mutated) return;
          mutated = true;
          await appendFile(
            path.join(fixture.root, "catalog/lesson-releases.json"),
            " ",
          );
        },
      }),
    ),
    /input changed after preflight/,
  );
  await assertOutputsAbsent(fixture);
  await assertHistoricalUnchanged(fixture);
});

test("staging directory CAS rejects an injected candidate", async (t) => {
  const fixture = await makeFixture(t);
  let mutated = false;
  await assert.rejects(
    materializeG5L5PostM1AnimateAuthoringSuccessors(
      runOptions(fixture, "apply", {
        beforeCommit: async () => {
          if (mutated) return;
          mutated = true;
          await writeRelative(
            fixture.root,
            `${stagingRoot}/manifests/sha256/` +
              `${"a".repeat(64)}.json`,
            "{}\n",
            0o444,
          );
        },
      }),
    ),
    /directory changed after preflight|directory entries changed after preflight/,
  );
  await assertOutputsAbsent(fixture);
});

test("transaction failure rolls back all committed and staged outputs", async (t) => {
  const fixture = await makeFixture(t);
  await assert.rejects(
    materializeG5L5PostM1AnimateAuthoringSuccessors(
      runOptions(fixture, "apply", {
        afterCommit: ({index}) => {
          if (index === 0) throw new Error("injected transaction failure");
        },
      }),
    ),
    /injected transaction failure/,
  );
  await assertOutputsAbsent(fixture);
  await assertHistoricalUnchanged(fixture);
});
