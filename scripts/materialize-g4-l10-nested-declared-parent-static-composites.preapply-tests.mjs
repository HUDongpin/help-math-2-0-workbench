import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  G4_L10_NESTED_PARENT_REPORT_RELATIVE,
  assertNestedParentAcceptanceNeutral,
  assertNestedParentTransitionTotals,
  buildWave3PredecessorDispositionMap,
  canonicalNestedParentPairSet,
  materializeG4L10NestedDeclaredParentStaticComposites,
  parseArguments,
} from "./materialize-g4-l10-nested-declared-parent-static-composites.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const selectedPairs = [
  {animationId: "course-g04-l10-ts-007", timelineId: "sprite-355"},
  {animationId: "course-g04-l10-ts-007", timelineId: "sprite-379"},
  {animationId: "course-g04-l10-ts-008", timelineId: "sprite-354"},
  {animationId: "course-g04-l10-ts-008", timelineId: "sprite-378"},
];
const before = {
  declared: 260,
  composite: 754,
  independentRequired: 0,
  unresolved: 74,
  nonvisual: 0,
  excludedNotProven: 210,
};
const after = {
  declared: 260,
  composite: 758,
  independentRequired: 0,
  unresolved: 70,
  nonvisual: 0,
  excludedNotProven: 210,
};
const targetPaths = [
  "migrations/course-g04-l10-ts-007/audit/static-frame-domain-disposition-evidence.json",
  "migrations/course-g04-l10-ts-007/audit/frame-domain-disposition.json",
  "migrations/course-g04-l10-ts-008/audit/static-frame-domain-disposition-evidence.json",
  "migrations/course-g04-l10-ts-008/audit/frame-domain-disposition.json",
  G4_L10_NESTED_PARENT_REPORT_RELATIVE,
];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function snapshot(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  try {
    const [metadata, contents] = await Promise.all([
      lstat(absolutePath, {bigint: true}),
      readFile(absolutePath),
    ]);
    return {
      relativePath,
      exists: true,
      dev: String(metadata.dev),
      ino: String(metadata.ino),
      size: String(metadata.size),
      mtimeNs: String(metadata.mtimeNs),
      ctimeNs: String(metadata.ctimeNs),
      sha256: digest(contents),
    };
  } catch (error) {
    if (error?.code === "ENOENT") return {relativePath, exists: false};
    throw error;
  }
}

async function copyOrdinaryFixtureFile(root, relativePath) {
  const source = path.join(projectRoot, relativePath);
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  await copyFile(source, target);
}

async function createFullPredecessorFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "l10-nested-parent-full-"));
  const predecessor = JSON.parse(await readFile(
    path.join(projectRoot, "reports/g4-l10-post-declaration-static-composites.json"),
    "utf8",
  ));
  const dispositionPaths = [
    ...predecessor.members.map(
      (member) => member.successor.frameDomainDisposition.path,
    ),
    ...predecessor.unchangedDispositionBindings.map(({path: value}) => value),
  ];
  const fixedPaths = [
    "scripts/materialize-g4-l10-nested-declared-parent-static-composites.mjs",
    "scripts/build-static-frame-domain-disposition-evidence.mjs",
    "scripts/build-frame-domain-dispositions.mjs",
    "reports/g4-l10-post-declaration-static-composites.json",
    "catalog/lesson-releases.json",
    "migrations/course-g04-l10-ts-007/migration.json",
    "migrations/course-g04-l10-ts-007/audit/scenario-inventory.json",
    "migrations/course-g04-l10-ts-007/audit/machine/swfmill.xml.gz",
    "migrations/course-g04-l10-ts-007/audit/machine/ffdec-scripts.txt.gz",
    "migrations/course-g04-l10-ts-007/audit/static-frame-domain-disposition-evidence.json",
    "migrations/course-g04-l10-ts-008/migration.json",
    "migrations/course-g04-l10-ts-008/audit/scenario-inventory.json",
    "migrations/course-g04-l10-ts-008/audit/machine/swfmill.xml.gz",
    "migrations/course-g04-l10-ts-008/audit/machine/ffdec-scripts.txt.gz",
    "migrations/course-g04-l10-ts-008/audit/static-frame-domain-disposition-evidence.json",
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS07.swf",
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TS/L10TS08.swf",
  ];
  for (const relativePath of new Set([...dispositionPaths, ...fixedPaths])) {
    await copyOrdinaryFixtureFile(root, relativePath);
  }
  return root;
}

async function transactionArtifacts(root) {
  const matches = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
      } else if (/\.(stage|backup)$/.test(entry.name)) {
        matches.push(path.relative(root, absolutePath));
      }
    }
  }
  await walk(root);
  return matches.sort();
}

async function fixtureSnapshots(root) {
  return Promise.all(targetPaths.map(async (relativePath) => {
    const absolutePath = path.join(root, relativePath);
    try {
      const contents = await readFile(absolutePath);
      return {relativePath, exists: true, bytes: contents.length, sha256: digest(contents)};
    } catch (error) {
      if (error?.code === "ENOENT") return {relativePath, exists: false};
      throw error;
    }
  }));
}

test("parses only one explicit dry-run/apply/check mode", () => {
  assert.deepEqual(parseArguments(["--dry-run"]), {help: false, mode: "dry-run"});
  assert.deepEqual(parseArguments(["--apply"]), {help: false, mode: "apply"});
  assert.deepEqual(parseArguments(["--check"]), {help: false, mode: "check"});
  assert.deepEqual(parseArguments(["--help"]), {help: true, mode: ""});
  assert.throws(() => parseArguments([]), /choose exactly one/);
  assert.throws(() => parseArguments(["--dry-run", "--apply"]), /choose exactly one/);
  assert.throws(() => parseArguments(["--dry-run", "--unknown"]), /unknown argument/);
});

test("pins exactly the four TS007/TS008 pairs and rejects duplicates or substitutions", () => {
  assert.deepEqual(canonicalNestedParentPairSet(selectedPairs), {
    count: 4,
    sha256: "24e6fabe063f6b32bd14b1359961b09ae895d18369ecb48aaa70ad233523bfff",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.throws(
    () => canonicalNestedParentPairSet([...selectedPairs, selectedPairs[0]]),
    /duplicates/,
  );
  assert.notEqual(
    canonicalNestedParentPairSet([
      ...selectedPairs.slice(0, -1),
      {animationId: "course-g04-l10-ts-008", timelineId: "sprite-377"},
    ]).sha256,
    "24e6fabe063f6b32bd14b1359961b09ae895d18369ecb48aaa70ad233523bfff",
  );
});

test("accepts only the exact 754-to-758 and 74-to-70 neutral transition", () => {
  assert.equal(assertNestedParentTransitionTotals(before, after), true);
  assert.throws(
    () => assertNestedParentTransitionTotals(before, {...after, unresolved: 69}),
    /successor totals drifted/,
  );
  const neutral = {
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none; source-static classification only",
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
  assert.equal(assertNestedParentAcceptanceNeutral(neutral), true);
  const forged = structuredClone(neutral);
  forged.acceptanceEffects.ownerReviewAccepted = true;
  assert.throws(
    () => assertNestedParentAcceptanceNeutral(forged),
    /ownerReviewAccepted must remain false/,
  );
});

test("immutable wave3 builds one exact descriptor for every release member", async () => {
  const [predecessor, catalog] = await Promise.all([
    readFile(
      path.join(projectRoot, "reports/g4-l10-post-declaration-static-composites.json"),
      "utf8",
    ).then(JSON.parse),
    readFile(path.join(projectRoot, "catalog/lesson-releases.json"), "utf8")
      .then(JSON.parse),
  ]);
  const release = catalog.releases.find(({releaseId}) => (
    releaseId === "lesson-g04-l10-perimeter-area"
  ));
  const map = buildWave3PredecessorDispositionMap(predecessor, release.members);
  assert.equal(map.size, 47);
  assert.equal(
    map.get("course-g04-l10-ts-007").sha256,
    "ebc6e4aafdf48f7beb6752f437e21a5fdd1986e4b5209362c0c94628e830b3c2",
  );
  assert.equal(
    map.get("course-g04-l10-ts-008").sha256,
    "37a0d679f6829ea2ace2c377e0f2d9e2907e755bb72efff278d966d2fa780c8c",
  );

  const duplicate = structuredClone(predecessor);
  duplicate.unchangedDispositionBindings[1] = structuredClone(
    duplicate.unchangedDispositionBindings[0],
  );
  assert.throws(
    () => buildWave3PredecessorDispositionMap(duplicate, release.members),
    /duplicated/,
  );

  const missing = structuredClone(predecessor);
  missing.unchangedDispositionBindings.pop();
  assert.throws(
    () => buildWave3PredecessorDispositionMap(missing, release.members),
    /descriptor count drifted/,
  );
});

test("live dry-run proves the exact five-file plan without materializing any target", async () => {
  const beforeSnapshots = await Promise.all(targetPaths.map(snapshot));
  const first = await materializeG4L10NestedDeclaredParentStaticComposites({
    mode: "dry-run",
    projectRoot,
  });
  const second = await materializeG4L10NestedDeclaredParentStaticComposites({
    mode: "dry-run",
    projectRoot,
  });
  const afterSnapshots = await Promise.all(targetPaths.map(snapshot));

  assert.equal(first.action, "planned");
  assert.equal(first.inputState, "wave3-predecessor");
  assert.deepEqual(first.reportRecord, second.reportRecord);
  assert.deepEqual(first.targetRecords, second.targetRecords);
  assert.deepEqual(beforeSnapshots, afterSnapshots);
  assert.equal(afterSnapshots.at(-1).exists, false);
  assert.equal(new Set(first.targetRecords.map(({path: value}) => value)).size, 5);
  assert.deepEqual(first.targetRecords.map(({path: value}) => value), targetPaths);
  assert.deepEqual(first.report.summary.beforeDispositionTotals, before);
  assert.deepEqual(first.report.summary.afterDispositionTotals, after);
  assert.equal(first.report.summary.newCompositeClaims, 4);
  assert.equal(first.report.summary.remainingUnresolved, 70);
  assert.deepEqual(first.report.exactPairSets.selected, {
    count: 4,
    sha256: "24e6fabe063f6b32bd14b1359961b09ae895d18369ecb48aaa70ad233523bfff",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.deepEqual(first.report.exactPairSets.residualParentBlockers, {
    count: 22,
    sha256: "cd2d739cc94bba5e026b5ee2f84c27270327f7d33d6b31f79c3f46db2ea1879b",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.deepEqual(first.report.exactPairSets.successorRemaining, {
    count: 70,
    sha256: "13df4a13d684c1900c138ba08cd8b7e5c61c4c4f8be050558d71fc2c8a219852",
    encoding: "sorted-animationId-tab-timelineId-newline-v1",
  });
  assert.deepEqual(first.report.proofContract, {
    retainedClaimRole: "multi-frame-scriptless-parent-clock-composite-child",
    parentBindingMode: "nested-declared-parent-local-clock-only",
    parentEntryStateEstablished: false,
    genericDirectRootAuditRemainsFailClosed: true,
    successorSelectionIsExactAllowlistOnly: true,
    rootPlacementNullAloneIsInsufficient: true,
  });
  assert.equal(first.report.members.length, 2);
  assert.equal(first.report.members.every((member) => (
    member.newCompositeClaims.length === 2
      && member.parentEntryStateEstablished === false
      && member.parentRootPath.length === 2
      && member.genericInspectionDisqualifiers.every(({disqualifiers}) => (
        JSON.stringify(disqualifiers)
          === JSON.stringify(["declared-parent-does-not-have-one-direct-root-placement"])
      ))
      && member.newCompositeClaims.every((claim) => (
        claim.role === "multi-frame-scriptless-parent-clock-composite-child"
        && claim.parentBinding.parentBindingMode
          === "nested-declared-parent-local-clock-only"
        && claim.parentBinding.parentEntryStateEstablished === false
        && claim.parentBinding.rootPlacement === null
        && claim.parentBinding.parentRootPath.length === 2
        && Object.values(claim.preservedObligations).every(
          ({satisfiedByDisposition}) => satisfiedByDisposition === false,
        )
      ))
  )), true);
  assert.equal(Object.values(first.report.acceptanceBoundary).every((value) => value === false), true);
  assert.match(first.report.strictAcceptanceEffect, /^none;/);
  assert.equal(first.report.mutationScope.explicitlyNotRebuilt.includes("trace index"), true);
  assert.equal(first.report.mutationScope.explicitlyNotRebuilt.includes("keyframes"), true);
  assert.equal(first.report.unchangedDispositionBindings.length, 45);
  assert.equal(first.report.downstreamBoundary.dispositionTransitions.length, 2);
  assert.deepEqual(
    first.report.downstreamBoundary.dispositionTransitions.map(
      ({predecessor}) => predecessor.sha256,
    ),
    [
      "ebc6e4aafdf48f7beb6752f437e21a5fdd1986e4b5209362c0c94628e830b3c2",
      "37a0d679f6829ea2ace2c377e0f2d9e2907e755bb72efff278d966d2fa780c8c",
    ],
  );
  assert.deepEqual(
    first.report.downstreamBoundary.staleArtifacts.map(({artifactClass}) => artifactClass),
    [
      "lesson-release-trace-index",
      "member-trace-specifications",
      "member-keyframes",
      "member-full-frame-coverage",
      "member-release-runtime-acquisition-plan",
    ],
  );
  assert.equal(first.report.downstreamBoundary.staleArtifacts.every((artifact) => (
    artifact.stale === true
      && artifact.currentCheck === false
      && artifact.rebuildRequired === true
  )), true);
  assert.equal(first.report.downstreamBoundary.historicalPredecessorReports.length, 3);
  assert.equal(
    first.report.downstreamBoundary.historicalPredecessorReports.every((report) => (
      report.immutable === true && report.rewrittenByThisTransition === false
    )),
    true,
  );
  assert.equal(
    (JSON.stringify(first.report).match(/"strictCompletionEstablished"/g) || []).length,
    1,
  );
});

test("check refuses the unmaterialized predecessor instead of writing it", async () => {
  await assert.rejects(
    materializeG4L10NestedDeclaredParentStaticComposites({
      mode: "check",
      projectRoot,
    }),
    /requires both target workspaces to be exact successors/,
  );
});

test("temp full apply installs exactly five targets and verifies the append-only successor", async () => {
  const root = await createFullPredecessorFixture();
  try {
    const beforeInstall = await fixtureSnapshots(root);
    assert.equal(beforeInstall.at(-1).exists, false);
    const applied = await materializeG4L10NestedDeclaredParentStaticComposites({
      mode: "apply",
      projectRoot: root,
    });
    assert.equal(applied.action, "written");
    assert.equal(applied.inputState, "nested-parent-successor");
    assert.equal(applied.targetRecords.length, 5);
    assert.deepEqual(applied.targetRecords.map(({path: value}) => value), targetPaths);
    const installed = await fixtureSnapshots(root);
    assert.deepEqual(
      installed.map(({relativePath, bytes, sha256, exists}) => ({
        path: relativePath,
        bytes,
        sha256,
        exists,
      })),
      applied.targetRecords.map((record) => ({...record, exists: true})),
    );
    const checked = await materializeG4L10NestedDeclaredParentStaticComposites({
      mode: "check",
      projectRoot: root,
    });
    assert.equal(checked.action, "verified");
    assert.deepEqual(checked.targetRecords, applied.targetRecords);
    assert.deepEqual(await transactionArtifacts(root), []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("temp apply refuses a foreign successor report without staging or overwriting it", async () => {
  const root = await createFullPredecessorFixture();
  try {
    const reportPath = path.join(root, G4_L10_NESTED_PARENT_REPORT_RELATIVE);
    const foreign = "{\n  \"foreign\": true\n}\n";
    await writeFile(reportPath, foreign, "utf8");
    await assert.rejects(
      materializeG4L10NestedDeclaredParentStaticComposites({
        mode: "apply",
        projectRoot: root,
      }),
      /append-only report must be absent.*foreign\/nonexact content is never overwritten/,
    );
    assert.equal(await readFile(reportPath, "utf8"), foreign);
    assert.deepEqual(await transactionArtifacts(root), []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("temp apply preserves shared stage CAS after expected-preimage validation", async () => {
  const root = await createFullPredecessorFixture();
  try {
    const racedRelative = targetPaths[0];
    const racedPath = path.join(root, racedRelative);
    const raced = "{\n  \"postPreflightRace\": true\n}\n";
    await assert.rejects(
      materializeG4L10NestedDeclaredParentStaticComposites({
        mode: "apply",
        projectRoot: root,
        transactionHooks: {
          afterStage: async () => {
            await writeFile(racedPath, raced, "utf8");
          },
        },
      }),
      /changed after preflight/,
    );
    assert.equal(await readFile(racedPath, "utf8"), raced);
    assert.equal((await fixtureSnapshots(root)).at(-1).exists, false);
    assert.deepEqual(await transactionArtifacts(root), []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("temp apply rolls back all five targets after an after-N install fault", async () => {
  const root = await createFullPredecessorFixture();
  try {
    const beforeInstall = await fixtureSnapshots(root);
    await assert.rejects(
      materializeG4L10NestedDeclaredParentStaticComposites({
        mode: "apply",
        projectRoot: root,
        transactionHooks: {
          afterInstall: ({index}) => {
            if (index === 2) throw new Error("synthetic nested-parent after-N fault");
          },
        },
      }),
      /synthetic nested-parent after-N fault/,
    );
    assert.deepEqual(await fixtureSnapshots(root), beforeInstall);
    assert.deepEqual(await transactionArtifacts(root), []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("temp dry-run rejects exact-hash drift in any of the 45 non-target dispositions", async () => {
  const root = await createFullPredecessorFixture();
  try {
    const nonTarget =
      "migrations/course-g04-l10-ir-001/audit/frame-domain-disposition.json";
    const nonTargetPath = path.join(root, nonTarget);
    const original = await readFile(nonTargetPath, "utf8");
    await writeFile(nonTargetPath, `${original}\n`, "utf8");
    await assert.rejects(
      materializeG4L10NestedDeclaredParentStaticComposites({
        mode: "dry-run",
        projectRoot: root,
      }),
      /course-g04-l10-ir-001: immutable wave3 non-target disposition: exact descriptor drifted/,
    );
    assert.equal(await readFile(nonTargetPath, "utf8"), `${original}\n`);
    assert.deepEqual(await transactionArtifacts(root), []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
