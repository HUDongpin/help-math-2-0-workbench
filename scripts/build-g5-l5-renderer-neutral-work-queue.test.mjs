import assert from "node:assert/strict";
import {
  chmod,
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  G5_L5_RENDERER_NEUTRAL_REPORT_JSON,
  buildG5L5RendererNeutralWorkQueue,
  classifyRendererNeutralScript,
  commitRendererNeutralBatch,
  g5L5RendererNeutralWorkPackagePath,
  parseArguments,
  readRendererNeutralInput,
  readRendererNeutralOutputSnapshot,
  validateG5L5RendererNeutralWorkPackage,
  validateG5L5RendererNeutralWorkQueue,
  withRendererNeutralArtifactFingerprint,
  withRendererNeutralReportFingerprint,
} from "./build-g5-l5-renderer-neutral-work-queue.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

function scenarioEntry({
  kind = "non-event",
  categories = [],
  calls = [],
  assignments = [],
  references = [],
  sideEffects = [],
} = {}) {
  return {
    kind,
    unit: {
      id: "script-0001",
      script: "frame_1/DoAction.as",
      categories,
      event: kind === "handler" ? ["release"] : [],
      signals: {
        calls,
        assignments,
        transitions: [],
        conditionals: [],
        randomCalls: [],
        scopeReferences: references,
        sideEffects,
      },
    },
  };
}

const pageMember = {
  animationId: "course-g05-l05-test-001",
  releaseRole: "active-xml-referenced-page",
};
const shellMember = {
  animationId: "shell-course-g05-l05-index-local",
  releaseRole: "course-shell",
};
const scriptCandidate = {
  scriptId: "ffdec-script-0001",
  sourcePath: "frame_1/DoAction.as",
  externalApiOccurrences: [],
};

async function currentFrameDomainAccounting(animationId) {
  const disposition = JSON.parse(
    await readFile(
      path.join(
        projectRoot,
        "migrations",
        animationId,
        "audit/frame-domain-disposition.json",
      ),
      "utf8",
    ),
  );
  return {
    structurallyReachableChildTimelineCount:
      disposition.summary.reachableChildTimelineCount,
    evidenceBoundCompositeFrameDomainCount:
      disposition.summary.dispositionCounts["composite-child-with-parent"],
    unresolvedFrameDomainCount:
      disposition.summary.dispositionCounts.unresolved,
    excludedNotProvenTimelineCount:
      disposition.summary.excludedNotProvenTimelineCount,
    proofBoundCompositeOnly:
      disposition.summary.dispositionCounts["composite-child-with-parent"] >
      0,
  };
}

test("CLI requires exactly one explicit mode", () => {
  assert.throws(
    () => parseArguments([]),
    /explicitly choose one/,
  );
  assert.throws(
    () => parseArguments(["--dry-run", "--check"]),
    /choose exactly one/,
  );
  assert.deepEqual(parseArguments(["--apply"]), {
    help: false,
    mode: "apply",
  });
  assert.deepEqual(parseArguments(["--help"]), {help: true});
});

test("script routing is renderer-neutral and based only on static evidence", () => {
  const cases = [
    {
      expected: "external-side-effects",
      entry: scenarioEntry({sideEffects: [{api: "getURL"}]}),
    },
    {
      expected: "audio",
      entry: scenarioEntry({categories: ["audio-control"]}),
    },
    {
      expected: "text-localization",
      entry: scenarioEntry({
        assignments: [{target: "_root.language"}],
      }),
    },
    {
      expected: "controls-interactions",
      entry: scenarioEntry({kind: "handler"}),
    },
    {
      expected: "shell-host",
      member: shellMember,
      entry: scenarioEntry(),
    },
    {
      expected: "shell-host",
      entry: scenarioEntry({
        references: ["_level0.InternalPreloader.gotoAndPlay"],
      }),
    },
    {
      expected: "timeline-behavior",
      entry: scenarioEntry({categories: ["navigation-or-timeline"]}),
    },
  ];
  for (const item of cases) {
    const result = classifyRendererNeutralScript({
      member: item.member || pageMember,
      script: structuredClone(scriptCandidate),
      scenarioEntry: item.entry,
    });
    assert.equal(result.packageId, item.expected);
    assert.equal(
      result.classificationState,
      "source-static-review-route-only",
    );
  }
  const external = structuredClone(scriptCandidate);
  external.externalApiOccurrences = [{api: "getURL"}];
  assert.equal(
    classifyRendererNeutralScript({
      member: shellMember,
      script: external,
      scenarioEntry: scenarioEntry({categories: ["audio-control"]}),
    }).packageId,
    "external-side-effects",
  );
});

test("full 57-member dry-run is deterministic, complete, and non-runnable", async () => {
  const guarded = [
    "catalog/lesson-releases.json",
    "migrations/course-g05-l05-rw-002/migration.json",
    "migrations/course-g05-l05-rw-002/audit/machine/g5-l5-m1-static-reconciliation-receipt.json",
    "migrations/course-g05-l05-rw-002/audit/script-inventory.json",
    "migrations/course-g05-l05-rw-002/audit/dependency-inventory.json",
  ];
  const before = await Promise.all(
    guarded.map((relativePath) =>
      readRendererNeutralInput(projectRoot, relativePath)),
  );
  const first = await buildG5L5RendererNeutralWorkQueue({
    projectRoot,
    mode: "dry-run",
  });
  const second = await buildG5L5RendererNeutralWorkQueue({
    projectRoot,
    mode: "dry-run",
  });
  assert.deepEqual(first, second);
  assert.equal(first.action, "planned");
  assert.equal(first.memberCount, 57);
  assert.equal(first.outputCount, 59);
  assert.equal(first.definitionCandidateCount, 9767);
  assert.equal(first.scriptCandidateCount, 2456);
  assert.equal(first.dependencyCandidateCount, 6);
  assert.equal(first.dependencyOccurrenceCount, 17);
  assert.equal(first.structurallyReachableChildTimelineCount, 1047);
  assert.equal(first.evidenceBoundCompositeFrameDomainCount, 696);
  assert.equal(first.unresolvedFrameDomainCount, 351);
  assert.equal(first.excludedNotProvenTimelineCount, 185);
  assert.equal(first.rendererUndecidedCount, 57);
  assert.equal(first.implementationAuthorizedCount, 0);
  assert.equal(first.implementationStartedCount, 0);
  assert.equal(first.canonicalAssetInventoryWriteCount, 0);
  assert.equal(first.canonicalKeyframeWriteCount, 0);
  assert.equal(first.canonicalCoverageWriteCount, 0);
  assert.equal(first.runtimeSessionCount, 0);
  assert.equal(first.guiLaunchCount, 0);
  assert.equal(first.runnable, false);
  assert.deepEqual(first.commands, []);
  assert(first.outputs.every(({mode}) => mode === "0644"));
  const after = await Promise.all(
    guarded.map((relativePath) =>
      readRendererNeutralInput(projectRoot, relativePath)),
  );
  assert.deepEqual(
    after.map(({path: filePath, bytes, sha256}) => ({
      path: filePath,
      bytes,
      sha256,
    })),
    before.map(({path: filePath, bytes, sha256}) => ({
      path: filePath,
      bytes,
      sha256,
    })),
  );
});

async function makeTransactionFixture() {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-renderer-neutral-"),
  );
  await mkdir(path.join(root, "out"));
  await mkdir(path.join(root, "inputs"));
  const allowedOutputs = new Set(["out/a.json", "out/b.json"]);
  return {root, allowedOutputs};
}

async function snapshots(root, allowedOutputs) {
  return Promise.all(
    [...allowedOutputs].map((relativePath) =>
      readRendererNeutralOutputSnapshot(
        root,
        relativePath,
        allowedOutputs,
      )),
  );
}

function transactionItems(outputSnapshots, rendered = ["new-a\n", "new-b\n"]) {
  return outputSnapshots.map((snapshot, index) => ({
    id: `item-${index}`,
    output: snapshot.path,
    rendered: rendered[index],
    snapshot,
  }));
}

async function assertNoTransactionResidue(root) {
  const names = await readdir(path.join(root, "out"));
  assert.equal(
    names.filter((name) =>
      name.includes(".stage") || name.includes(".backup")).length,
    0,
  );
}

test("transaction writes exact 0644 files even under restrictive umask", async () => {
  const fixture = await makeTransactionFixture();
  const previousUmask = process.umask(0o077);
  try {
    const outputSnapshots = await snapshots(
      fixture.root,
      fixture.allowedOutputs,
    );
    await commitRendererNeutralBatch({
      root: fixture.root,
      items: transactionItems(outputSnapshots),
      allowedOutputs: fixture.allowedOutputs,
    });
    assert.equal(
      await readFile(path.join(fixture.root, "out/a.json"), "utf8"),
      "new-a\n",
    );
    assert.equal(
      await readFile(path.join(fixture.root, "out/b.json"), "utf8"),
      "new-b\n",
    );
    for (const name of ["a.json", "b.json"]) {
      const information = await stat(path.join(fixture.root, "out", name));
      assert.equal(information.mode & 0o777, 0o644);
      assert.equal(information.nlink, 1);
    }
    await assertNoTransactionResidue(fixture.root);
  } finally {
    process.umask(previousUmask);
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("path safety refuses symlink ancestors and linked final outputs", async () => {
  const fixture = await makeTransactionFixture();
  const outside = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-renderer-neutral-outside-"),
  );
  try {
    await symlink(outside, path.join(fixture.root, "linked"));
    await assert.rejects(
      () =>
        readRendererNeutralOutputSnapshot(
          fixture.root,
          "linked/a.json",
          new Set(["linked/a.json"]),
        ),
      /ancestor must be a real directory/,
    );

    await writeFile(path.join(fixture.root, "out/source.json"), "{}\n");
    await chmod(path.join(fixture.root, "out/source.json"), 0o644);
    await link(
      path.join(fixture.root, "out/source.json"),
      path.join(fixture.root, "out/a.json"),
    );
    await assert.rejects(
      () =>
        readRendererNeutralOutputSnapshot(
          fixture.root,
          "out/a.json",
          fixture.allowedOutputs,
        ),
      /ordinary non-linked 0644 file/,
    );
    await rm(path.join(fixture.root, "out/a.json"));
    await symlink(
      path.join(fixture.root, "out/source.json"),
      path.join(fixture.root, "out/a.json"),
    );
    await assert.rejects(
      () =>
        readRendererNeutralOutputSnapshot(
          fixture.root,
          "out/a.json",
          fixture.allowedOutputs,
        ),
      /ordinary non-linked 0644 file/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
    await rm(outside, {recursive: true, force: true});
  }
});

test("first committed output rolls back when a later commit fails", async () => {
  const fixture = await makeTransactionFixture();
  try {
    await writeFile(path.join(fixture.root, "out/a.json"), "old-a\n");
    await writeFile(path.join(fixture.root, "out/b.json"), "old-b\n");
    await chmod(path.join(fixture.root, "out/a.json"), 0o644);
    await chmod(path.join(fixture.root, "out/b.json"), 0o644);
    const outputSnapshots = await snapshots(
      fixture.root,
      fixture.allowedOutputs,
    );
    await assert.rejects(
      () =>
        commitRendererNeutralBatch({
          root: fixture.root,
          items: transactionItems(outputSnapshots),
          allowedOutputs: fixture.allowedOutputs,
          hooks: {
            beforeCommit({index}) {
              if (index === 1) throw new Error("injected second commit failure");
            },
          },
        }),
      /injected second commit failure/,
    );
    assert.equal(
      await readFile(path.join(fixture.root, "out/a.json"), "utf8"),
      "old-a\n",
    );
    assert.equal(
      await readFile(path.join(fixture.root, "out/b.json"), "utf8"),
      "old-b\n",
    );
    await assertNoTransactionResidue(fixture.root);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("output CAS failure restores earlier committed output", async () => {
  const fixture = await makeTransactionFixture();
  try {
    await writeFile(path.join(fixture.root, "out/a.json"), "old-a\n");
    await writeFile(path.join(fixture.root, "out/b.json"), "old-b\n");
    await chmod(path.join(fixture.root, "out/a.json"), 0o644);
    await chmod(path.join(fixture.root, "out/b.json"), 0o644);
    const outputSnapshots = await snapshots(
      fixture.root,
      fixture.allowedOutputs,
    );
    await assert.rejects(
      () =>
        commitRendererNeutralBatch({
          root: fixture.root,
          items: transactionItems(outputSnapshots),
          allowedOutputs: fixture.allowedOutputs,
          hooks: {
            async beforeCommit({index}) {
              if (index === 1) {
                await writeFile(
                  path.join(fixture.root, "out/b.json"),
                  "external-change\n",
                );
              }
            },
          },
        }),
      /output changed during commit CAS/,
    );
    assert.equal(
      await readFile(path.join(fixture.root, "out/a.json"), "utf8"),
      "old-a\n",
    );
    assert.equal(
      await readFile(path.join(fixture.root, "out/b.json"), "utf8"),
      "external-change\n",
    );
    await assertNoTransactionResidue(fixture.root);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("input CAS failure restores committed outputs", async () => {
  const fixture = await makeTransactionFixture();
  try {
    await writeFile(path.join(fixture.root, "out/a.json"), "old-a\n");
    await writeFile(path.join(fixture.root, "out/b.json"), "old-b\n");
    await chmod(path.join(fixture.root, "out/a.json"), 0o644);
    await chmod(path.join(fixture.root, "out/b.json"), 0o644);
    await writeFile(path.join(fixture.root, "inputs/source.json"), "input\n");
    const input = await readRendererNeutralInput(
      fixture.root,
      "inputs/source.json",
    );
    const outputSnapshots = await snapshots(
      fixture.root,
      fixture.allowedOutputs,
    );
    await assert.rejects(
      () =>
        commitRendererNeutralBatch({
          root: fixture.root,
          items: transactionItems(outputSnapshots),
          inputRecords: [input],
          allowedOutputs: fixture.allowedOutputs,
          hooks: {
            async afterCommit({index}) {
              if (index === 0) {
                await writeFile(
                  path.join(fixture.root, "inputs/source.json"),
                  "changed\n",
                );
              }
            },
          },
        }),
      /input changed after preflight/,
    );
    assert.equal(
      await readFile(path.join(fixture.root, "out/a.json"), "utf8"),
      "old-a\n",
    );
    assert.equal(
      await readFile(path.join(fixture.root, "out/b.json"), "utf8"),
      "old-b\n",
    );
    await assertNoTransactionResidue(fixture.root);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("materialized packages and report reject renderer, implementation, and write promotion", async () => {
  const release = JSON.parse(
    await readFile(
      path.join(projectRoot, "catalog/lesson-releases.json"),
      "utf8",
    ),
  ).releases.find(
    ({releaseId}) =>
      releaseId === "lesson-g05-l05-add-subtract-negative-numbers",
  );
  const member = release.members[0];
  const memberPath = path.join(
    projectRoot,
    g5L5RendererNeutralWorkPackagePath(member.animationId),
  );
  const reportPath = path.join(
    projectRoot,
    G5_L5_RENDERER_NEUTRAL_REPORT_JSON,
  );
  let document = JSON.parse(await readFile(memberPath, "utf8"));
  let report = JSON.parse(await readFile(reportPath, "utf8"));
  document.bindings.staticDispositionEvidence = null;
  document.frameDomainAccounting =
    await currentFrameDomainAccounting(member.animationId);
  document = withRendererNeutralArtifactFingerprint(document);
  const reportAccounting = await Promise.all(
    report.members.map(async (entry) => {
      const frameDomainAccounting =
        await currentFrameDomainAccounting(entry.animationId);
      entry.frameDomainAccounting = frameDomainAccounting;
      return frameDomainAccounting;
    }),
  );
  report.summary.structurallyReachableChildTimelineCount =
    reportAccounting.reduce(
      (total, item) =>
        total + item.structurallyReachableChildTimelineCount,
      0,
    );
  report.summary.evidenceBoundCompositeFrameDomainCount =
    reportAccounting.reduce(
      (total, item) =>
        total + item.evidenceBoundCompositeFrameDomainCount,
      0,
    );
  report.summary.unresolvedFrameDomainCount = reportAccounting.reduce(
    (total, item) => total + item.unresolvedFrameDomainCount,
    0,
  );
  report.summary.excludedNotProvenTimelineCount =
    reportAccounting.reduce(
      (total, item) => total + item.excludedNotProvenTimelineCount,
      0,
    );
  report = withRendererNeutralReportFingerprint(report);
  assert.equal(
    validateG5L5RendererNeutralWorkPackage(document, member),
    true,
  );
  assert.equal(validateG5L5RendererNeutralWorkQueue(report), true);

  const renderer = structuredClone(document);
  renderer.workPackages[0].renderer = "svg";
  assert.throws(
    () =>
      validateG5L5RendererNeutralWorkPackage(
        withRendererNeutralArtifactFingerprint(renderer),
        member,
      ),
    /work-package order or accounting drifted/,
  );

  const implementation = structuredClone(document);
  implementation.authority.implementationAuthorized = true;
  assert.throws(
    () =>
      validateG5L5RendererNeutralWorkPackage(
        withRendererNeutralArtifactFingerprint(implementation),
        member,
      ),
    /implementationAuthorized must remain false/,
  );

  const canonicalWrite = structuredClone(document);
  canonicalWrite.execution.canonicalCoverageWrites = 1;
  assert.throws(
    () =>
      validateG5L5RendererNeutralWorkPackage(
        withRendererNeutralArtifactFingerprint(canonicalWrite),
        member,
      ),
    /execution\/canonical-write boundary drifted/,
  );

  const misroutedDefinition = structuredClone(document);
  const sourcePackage = misroutedDefinition.workPackages.find(
    ({candidates}) => candidates.definitions.length > 0,
  );
  const targetPackage = misroutedDefinition.workPackages.find(
    ({packageId}) => packageId !== sourcePackage.packageId,
  );
  const [movedDefinition] = sourcePackage.candidates.definitions.splice(0, 1);
  sourcePackage.counts.definitionCandidates -= 1;
  targetPackage.candidates.definitions.push(movedDefinition);
  targetPackage.counts.definitionCandidates += 1;
  assert.throws(
    () =>
      validateG5L5RendererNeutralWorkPackage(
        withRendererNeutralArtifactFingerprint(misroutedDefinition),
        member,
      ),
    /definition candidate routed to the wrong work package/,
  );

  const resolvedWithoutEvidence = structuredClone(document);
  for (const key of Object.keys(
    resolvedWithoutEvidence.unresolvedBoundary,
  )) {
    resolvedWithoutEvidence.unresolvedBoundary[key] = "resolved";
  }
  for (const workPackage of resolvedWithoutEvidence.workPackages) {
    for (const key of Object.keys(workPackage.unresolvedBoundary)) {
      workPackage.unresolvedBoundary[key] = "resolved";
    }
  }
  assert.throws(
    () =>
      validateG5L5RendererNeutralWorkPackage(
        withRendererNeutralArtifactFingerprint(resolvedWithoutEvidence),
        member,
      ),
    /unresolved boundary was promoted/,
  );

  const compositeWithoutProof = structuredClone(document);
  compositeWithoutProof.frameDomainAccounting
    .evidenceBoundCompositeFrameDomainCount += 1;
  compositeWithoutProof.frameDomainAccounting.unresolvedFrameDomainCount -= 1;
  assert.throws(
    () =>
      validateG5L5RendererNeutralWorkPackage(
        withRendererNeutralArtifactFingerprint(compositeWithoutProof),
        member,
      ),
    /proof-bound frame-domain accounting drifted/,
  );

  const promotedReport = structuredClone(report);
  promotedReport.summary.implementationStartedCount = 1;
  assert.throws(
    () =>
      validateG5L5RendererNeutralWorkQueue(
        withRendererNeutralReportFingerprint(promotedReport),
    ),
    /protected boundary drifted/,
  );

  const reuseApproved = structuredClone(report);
  reuseApproved.exactReuseAnalysis.reuseAuthorizedCount = 999;
  reuseApproved.exactReuseAnalysis.boundary = "reuse approved";
  assert.throws(
    () =>
      validateG5L5RendererNeutralWorkQueue(
        withRendererNeutralReportFingerprint(reuseApproved),
      ),
    /exact reuse analysis was promoted or drifted/,
  );
});

test("all 59 managed materialized targets remain ordinary 0644 files", async () => {
  const planned = await buildG5L5RendererNeutralWorkQueue({
    projectRoot,
    mode: "dry-run",
  });
  assert.equal(planned.outputCount, 59);
  for (const output of planned.outputs) {
    const information = await stat(path.join(projectRoot, output.path));
    assert.equal(information.mode & 0o777, 0o644);
    assert.equal(information.nlink, 1);
  }
});
