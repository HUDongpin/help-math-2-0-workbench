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
  materializeG4L10NestedDeclaredParentStaticComposites,
  parseArguments,
} from "./materialize-g4-l10-nested-declared-parent-static-composites.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const materializerRelative =
  "scripts/materialize-g4-l10-nested-declared-parent-static-composites.mjs";
const historicalPreApplyTestRelative =
  "scripts/materialize-g4-l10-nested-declared-parent-static-composites.preapply-tests.mjs";
const expectedFiles = Object.freeze({
  materializer: Object.freeze({
    path: materializerRelative,
    bytes: 52836,
    sha256: "d7a619b3fdcf6a186dc1b3fdcde4e2fb00b8fba24d89d01551a3d35870eadeea",
  }),
  historicalPreApplyTest: Object.freeze({
    path: historicalPreApplyTestRelative,
    bytes: 19379,
    sha256: "be315ace74e62deafd4fce433ad1e95ef8ee08ff56cdb5ed86b6d5c4764a44c9",
  }),
  report: Object.freeze({
    path: G4_L10_NESTED_PARENT_REPORT_RELATIVE,
    bytes: 263901,
    sha256: "0b31c8f8c9188bb9e2b35010389adf81214a0969a84e5cc969d6e3d09d659c01",
  }),
});
const targetFiles = Object.freeze([
  Object.freeze({
    path: "migrations/course-g04-l10-ts-007/audit/static-frame-domain-disposition-evidence.json",
    bytes: 165860,
    sha256: "3e965e69081ce4affedfcfa86ff02b14559d5fbee73039539b8e475a57a2aaea",
  }),
  Object.freeze({
    path: "migrations/course-g04-l10-ts-007/audit/frame-domain-disposition.json",
    bytes: 100597,
    sha256: "b5495a553e3663dad5083bca04b82d06756912a8496617f8dc231014866c36da",
  }),
  Object.freeze({
    path: "migrations/course-g04-l10-ts-008/audit/static-frame-domain-disposition-evidence.json",
    bytes: 146886,
    sha256: "9a906cfa7e8e680e3fa5f0552639e2322a5f6de8c1080416b533520f6f2f05b7",
  }),
  Object.freeze({
    path: "migrations/course-g04-l10-ts-008/audit/frame-domain-disposition.json",
    bytes: 83928,
    sha256: "8f4f4d32b532b58711ea09237184e27b121a721af1a05d378bb894cde1e54733",
  }),
  expectedFiles.report,
]);

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

async function exactFile(root, expected) {
  const contents = await readFile(path.join(root, expected.path));
  assert.equal(contents.length, expected.bytes, `${expected.path}: byte count`);
  assert.equal(sha256(contents), expected.sha256, `${expected.path}: SHA-256`);
  return contents;
}

async function snapshot(root, relative) {
  const absolute = path.join(root, relative);
  try {
    const [metadata, contents] = await Promise.all([
      lstat(absolute, {bigint: true}),
      readFile(absolute),
    ]);
    return {
      path: relative,
      exists: true,
      dev: String(metadata.dev),
      ino: String(metadata.ino),
      size: String(metadata.size),
      mtimeNs: String(metadata.mtimeNs),
      ctimeNs: String(metadata.ctimeNs),
      sha256: sha256(contents),
    };
  } catch (error) {
    if (error?.code === "ENOENT") return {path: relative, exists: false};
    throw error;
  }
}

async function copyFixtureFile(root, relative) {
  const destination = path.join(root, relative);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(path.join(projectRoot, relative), destination);
}

async function createSuccessorFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "l10-nested-parent-successor-"));
  const predecessorReport = JSON.parse(await readFile(path.join(
    projectRoot,
    "reports/g4-l10-post-declaration-static-composites.json",
  ), "utf8"));
  const dispositionPaths = [
    ...predecessorReport.members.map(
      (member) => member.successor.frameDomainDisposition.path,
    ),
    ...predecessorReport.unchangedDispositionBindings.map(({path: value}) => value),
  ];
  const fixedPaths = [
    materializerRelative,
    "scripts/build-static-frame-domain-disposition-evidence.mjs",
    "scripts/build-frame-domain-dispositions.mjs",
    "reports/g4-l10-post-declaration-static-composites.json",
    G4_L10_NESTED_PARENT_REPORT_RELATIVE,
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
  for (const relative of new Set([...dispositionPaths, ...fixedPaths])) {
    await copyFixtureFile(root, relative);
  }
  return root;
}

async function transactionArtifacts(root) {
  const matches = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (/\.(stage|backup)$/u.test(entry.name)) {
        matches.push(path.relative(root, absolute));
      }
    }
  }
  await walk(root);
  return matches.sort();
}

test("preserves the exact pre-apply transaction test as a non-current historical record", async () => {
  await exactFile(projectRoot, expectedFiles.materializer);
  await exactFile(projectRoot, expectedFiles.historicalPreApplyTest);
  assert.equal(parseArguments(["--check"]).mode, "check");
  assert.equal(parseArguments(["--dry-run"]).mode, "dry-run");
});

test("binds the installed five-file successor and its neutral/stale boundaries", async () => {
  const report = JSON.parse((await exactFile(
    projectRoot,
    expectedFiles.report,
  )).toString("utf8"));
  for (const file of targetFiles.slice(0, -1)) await exactFile(projectRoot, file);
  assert.equal(report.reportType,
    "g4-l10-nested-declared-parent-static-composite-successor");
  assert.equal(report.releaseId, "lesson-g04-l10-perimeter-area");
  assert.equal(report.generatedBy.sha256, expectedFiles.materializer.sha256);
  assert.deepEqual(report.summary.beforeDispositionTotals, {
    declared: 260,
    composite: 754,
    independentRequired: 0,
    unresolved: 74,
    nonvisual: 0,
    excludedNotProven: 210,
  });
  assert.deepEqual(report.summary.afterDispositionTotals, {
    declared: 260,
    composite: 758,
    independentRequired: 0,
    unresolved: 70,
    nonvisual: 0,
    excludedNotProven: 210,
  });
  assert.equal(report.summary.newCompositeClaims, 4);
  assert.equal(report.unchangedDispositionBindings.length, 45);
  assert.equal(report.downstreamBoundary.staleArtifacts.length, 5);
  assert.equal(report.downstreamBoundary.staleArtifacts.every((artifact) => (
    artifact.stale === true
      && artifact.currentCheck === false
      && artifact.rebuildRequired === true
  )), true);
  assert.equal(Object.values(report.acceptanceBoundary).every((value) => value === false), true);
  assert.match(report.strictAcceptanceEffect, /^none;/u);
});

test("live successor dry-run is deterministic, read-only, and reports verified-plan", async () => {
  const before = await Promise.all(targetFiles.map(({path: relative}) => (
    snapshot(projectRoot, relative)
  )));
  const first = await materializeG4L10NestedDeclaredParentStaticComposites({
    mode: "dry-run",
    projectRoot,
  });
  const second = await materializeG4L10NestedDeclaredParentStaticComposites({
    mode: "dry-run",
    projectRoot,
  });
  const after = await Promise.all(targetFiles.map(({path: relative}) => (
    snapshot(projectRoot, relative)
  )));
  assert.equal(first.action, "verified-plan");
  assert.equal(first.inputState, "nested-parent-successor");
  assert.deepEqual(first.reportRecord, second.reportRecord);
  assert.deepEqual(first.targetRecords, second.targetRecords);
  assert.deepEqual(before, after);
  assert.deepEqual(first.targetRecords, targetFiles);
});

test("live successor check accepts only the exact installed five-file state", async () => {
  const checked = await materializeG4L10NestedDeclaredParentStaticComposites({
    mode: "check",
    projectRoot,
  });
  assert.equal(checked.action, "verified");
  assert.equal(checked.inputState, "nested-parent-successor");
  assert.deepEqual(checked.targetRecords, targetFiles);
});

test("a complete temp successor fixture remains exactly checkable", async () => {
  const root = await createSuccessorFixture();
  try {
    const checked = await materializeG4L10NestedDeclaredParentStaticComposites({
      mode: "check",
      projectRoot: root,
    });
    assert.equal(checked.action, "verified");
    assert.deepEqual(checked.targetRecords, targetFiles);
    assert.deepEqual(await transactionArtifacts(root), []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("temp successor rejects target drift without staging or repair", async () => {
  const root = await createSuccessorFixture();
  try {
    const target = path.join(root, targetFiles[0].path);
    const foreign = "{\n  \"foreignSuccessorTarget\": true\n}\n";
    await writeFile(target, foreign, "utf8");
    await assert.rejects(
      materializeG4L10NestedDeclaredParentStaticComposites({
        mode: "dry-run",
        projectRoot: root,
      }),
      /successor lost predecessor release lineage|neither exact predecessor nor exact successor/u,
    );
    assert.equal(await readFile(target, "utf8"), foreign);
    assert.deepEqual(await transactionArtifacts(root), []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("temp successor rejects a foreign append-only report without overwriting it", async () => {
  const root = await createSuccessorFixture();
  try {
    const report = path.join(root, G4_L10_NESTED_PARENT_REPORT_RELATIVE);
    const foreign = "{\n  \"foreignReport\": true\n}\n";
    await writeFile(report, foreign, "utf8");
    await assert.rejects(
      materializeG4L10NestedDeclaredParentStaticComposites({
        mode: "check",
        projectRoot: root,
      }),
      /append-only report must be absent.*foreign\/nonexact content is never overwritten/u,
    );
    assert.equal(await readFile(report, "utf8"), foreign);
    assert.deepEqual(await transactionArtifacts(root), []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("temp successor rejects any exact-hash drift among the 45 non-target dispositions", async () => {
  const root = await createSuccessorFixture();
  try {
    const relative =
      "migrations/course-g04-l10-ir-001/audit/frame-domain-disposition.json";
    const absolute = path.join(root, relative);
    const original = await readFile(absolute, "utf8");
    await writeFile(absolute, `${original}\n`, "utf8");
    await assert.rejects(
      materializeG4L10NestedDeclaredParentStaticComposites({
        mode: "dry-run",
        projectRoot: root,
      }),
      /course-g04-l10-ir-001: immutable wave3 non-target disposition: exact descriptor drifted/u,
    );
    assert.equal(await readFile(absolute, "utf8"), `${original}\n`);
    assert.deepEqual(await transactionArtifacts(root), []);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
