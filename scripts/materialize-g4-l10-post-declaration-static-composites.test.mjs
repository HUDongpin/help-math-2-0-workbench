import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  G4_L10_WAVE3_CONTRACT,
  G4_L10_WAVE3_REPORT_RELATIVE,
  assertExactWave3CandidateSpec,
  assertWave3AcceptanceNeutralDocument,
  canonicalWave3PairSet,
  materializeG4L10PostDeclarationStaticComposites,
  parseArguments,
} from "./materialize-g4-l10-post-declaration-static-composites.mjs";
import {
  commitAtomicEntries,
} from "./materialize-g4-l10-independent-frame-domain-declarations.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function entry(relativePath, rendered) {
  const bytes = Buffer.from(rendered, "utf8");
  return {
    path: relativePath,
    rendered,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

test("CLI accepts exactly one bounded wave3 mode", () => {
  assert.deepEqual(parseArguments(["--dry-run"]), {help: false, mode: "dry-run"});
  assert.deepEqual(parseArguments(["--apply"]), {help: false, mode: "apply"});
  assert.deepEqual(parseArguments(["--check"]), {help: false, mode: "check"});
  assert.throws(() => parseArguments([]), /choose exactly one/);
  assert.throws(() => parseArguments(["--apply", "--check"]), /choose exactly one/);
  assert.throws(() => parseArguments(["--publish"]), /Unknown option/);
});

test("pair digests bind exact animation and timeline identities", () => {
  const selected = canonicalWave3PairSet([
    {animationId: "course-g04-l10-rw-003", timelineId: "sprite-17"},
    {animationId: "course-g04-l10-rw-002", timelineId: "sprite-131"},
    {animationId: "course-g04-l10-rw-005", timelineId: "sprite-101"},
  ]);
  assert.equal(selected.count, 3);
  assert.equal(
    selected.sha256,
    G4_L10_WAVE3_CONTRACT.expected.accepted.sha256,
  );
  assert.notEqual(
    selected.sha256,
    canonicalWave3PairSet([
      {animationId: "course-g04-l10-rw-003", timelineId: "sprite-18"},
      {animationId: "course-g04-l10-rw-002", timelineId: "sprite-131"},
      {animationId: "course-g04-l10-rw-005", timelineId: "sprite-101"},
    ]).sha256,
  );
  assert.throws(
    () => canonicalWave3PairSet([
      {animationId: "x", timelineId: "sprite-1"},
      {animationId: "x", timelineId: "sprite-1"},
    ]),
    /duplicates/,
  );
});

test("reviewed candidate pin rejects parent, lifecycle, or selected-set drift", () => {
  assert.throws(
    () => assertExactWave3CandidateSpec(
      "course-g04-l10-rw-002",
      [{
        proofType: "multi-frame-scriptless-parent-clock-composite-child",
        expectedTimelineCount: 1,
        parentTimelineId: "sprite-999",
        timelines: [{timelineId: "sprite-131"}],
      }],
    ),
    /candidate spec hash drifted/,
  );
  assert.throws(
    () => assertExactWave3CandidateSpec(
      "course-g04-l10-rw-002",
      [{expectedTimelineCount: 1, timelines: [{timelineId: "sprite-132"}]}],
    ),
    /selected set drifted/,
  );
});

test("acceptance guard rejects any review, RMSE, audio, behavior, or status promotion", () => {
  const neutral = {
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none; structural classification only",
    acceptanceEffects: {
      buttonAccepted: false,
      interactionAccepted: false,
      audioAccepted: false,
      behaviorAccepted: false,
      fullFrameAccepted: false,
      rmseAccepted: false,
      humanReviewAccepted: false,
      ownerReviewAccepted: false,
    },
  };
  assert.equal(assertWave3AcceptanceNeutralDocument(neutral), true);
  const promoted = structuredClone(neutral);
  promoted.acceptanceEffects.ownerReviewAccepted = true;
  assert.throws(
    () => assertWave3AcceptanceNeutralDocument(promoted),
    /ownerReviewAccepted must remain false/,
  );
  const completed = structuredClone(neutral);
  completed.migrationStatusChanged = true;
  assert.throws(
    () => assertWave3AcceptanceNeutralDocument(completed),
    /migration status changed/,
  );
});

test("wave3 transaction rolls back every target after a late install fault", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "l10-wave3-rollback-"));
  try {
    await mkdir(path.join(root, "x"));
    await writeFile(path.join(root, "x", "a.json"), "old-a\n");
    await writeFile(path.join(root, "x", "b.json"), "old-b\n");
    await assert.rejects(
      commitAtomicEntries([
        entry("x/a.json", "new-a\n"),
        entry("x/b.json", "new-b\n"),
      ], {
        projectRoot: root,
        hooks: {
          afterInstall: ({index}) => {
            if (index === 1) throw new Error("synthetic wave3 late fault");
          },
        },
      }),
      /synthetic wave3 late fault/,
    );
    assert.equal(await readFile(path.join(root, "x", "a.json"), "utf8"), "old-a\n");
    assert.equal(await readFile(path.join(root, "x", "b.json"), "utf8"), "old-b\n");
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("wave3 transaction CAS refuses to overwrite a post-preflight race", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "l10-wave3-cas-"));
  try {
    await mkdir(path.join(root, "x"));
    await writeFile(path.join(root, "x", "a.json"), "old-a\n");
    await assert.rejects(
      commitAtomicEntries([entry("x/a.json", "new-a\n")], {
        projectRoot: root,
        hooks: {
          afterStage: async () => {
            await writeFile(path.join(root, "x", "a.json"), "raced\n");
          },
        },
      }),
      /changed after preflight/,
    );
    assert.equal(await readFile(path.join(root, "x", "a.json"), "utf8"), "raced\n");
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("live L10 derives or verifies the exact acceptance-neutral wave3 successor", async () => {
  const result = await materializeG4L10PostDeclarationStaticComposites({
    mode: "dry-run",
  });
  assert(["planned", "verified-plan"].includes(result.action));
  assert.equal(result.reportRecord.path, G4_L10_WAVE3_REPORT_RELATIVE);
  assert.deepEqual(result.report.exactPairSets.accepted, {
    count: 3,
    sha256:
      "f65d4dabb98ad5f4a175bafd03c591edd86f1b11247c01b47375723fef1e22f7",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.deepEqual(result.report.exactPairSets.rejected, {
    count: 26,
    sha256:
      "6e15d1aec32e81fc78227dfae44f6047d2099f8840ad81b9b14895ad94ff04c2",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.deepEqual(result.report.exactPairSets.remainingUnresolved, {
    count: 74,
    sha256:
      "3f2adcef24544cff58cf36fa940abae25e3441c8486062100ea368aa858e3962",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.deepEqual(result.report.summary.afterDispositionTotals, {
    declared: 260,
    composite: 754,
    independentRequired: 0,
    unresolved: 74,
    nonvisual: 0,
    excludedNotProven: 210,
  });
  assert.equal(result.report.members.length, 3);
  assert(result.report.members.every(
    ({compositeClaim}) => (
      compositeClaim.role
        === "multi-frame-scriptless-parent-clock-composite-child"
      && compositeClaim.disposition === "composite-child-with-parent"
    ),
  ));
  assert(Object.values(result.report.acceptanceBoundary).every((value) => value === false));
  assert.match(result.report.strictAcceptanceEffect, /^none;/);
  if (result.inputState === "wave3-successor") {
    const checked = await materializeG4L10PostDeclarationStaticComposites({
      mode: "check",
    });
    assert.equal(checked.action, "verified");
    assert.equal(checked.reportRecord.sha256, result.reportRecord.sha256);
  }
});
