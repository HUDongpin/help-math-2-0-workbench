import assert from "node:assert/strict";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  PROJECT_ROOT,
  OUTPUT_DIRECTORY_RELATIVE,
  buildCandidatePackage,
  buildMigrationCandidate,
  checkPackage,
  extractDefinitionInventory,
  parseArguments,
  publishPackageDirectoryNoClobber,
  renderNestedKeyframeCandidates,
} from "./build-g4-l10-vb003-static-specification-candidate-package-v1.mjs";

test("CLI supports only dry-run, immutable publication, and check", () => {
  assert.equal(parseArguments(["--dry-run"]), "--dry-run");
  assert.equal(parseArguments(["--write-no-clobber"]), "--write-no-clobber");
  assert.equal(parseArguments(["--check"]), "--check");
  for (const forbidden of ["--apply", "--recover", "--write", "--force"]) {
    assert.throws(() => parseArguments([forbidden]), /Only --dry-run/u);
  }
  assert.throws(() => parseArguments([]), /Choose exactly one/u);
  assert.throws(() => parseArguments(["--check", "--dry-run"]),
    /Choose exactly one/u);
});

test("definition projection hashes complete nested XML elements", () => {
  const xml = Buffer.from([
    "<swf><tags>",
    '<DefineSprite objectID="9"><tags>',
    '<DefineShape objectID="4"><shapes/></DefineShape>',
    "</tags></DefineSprite>",
    '<DefineText objectID="12"><records/></DefineText>',
    "</tags></swf>",
  ].join(""));
  const result = extractDefinitionInventory(xml, {
    path: "fixture.xml.gz",
    sha256: "a".repeat(64),
    uncompressedSha256: "b".repeat(64),
  });
  assert.deepEqual(result.definitions.map(({objectId, tag}) => [objectId, tag]), [
    [4, "DefineShape"],
    [9, "DefineSprite"],
    [12, "DefineText"],
  ]);
  assert.equal(result.definitions[1].elementBytes,
    Buffer.byteLength('<DefineSprite objectID="9"><tags><DefineShape objectID="4"><shapes/></DefineShape></tags></DefineSprite>'));
  assert.match(result.csv, /exact-decompressed-swfmill-xml-element-v1/u);
  assert.match(result.csv, /runtime_reachability/u);
});

test("real plan produces acceptance-neutral 120-definition candidate package", async () => {
  const candidatePackage = await buildCandidatePackage(PROJECT_ROOT);
  assert.equal(candidatePackage.definitionInventory.definitions.length, 120);
  assert.deepEqual(candidatePackage.definitionInventory.counts, {
    DefineFont2: 6,
    DefineText: 98,
    DefineShape: 4,
    DefineShape3: 7,
    DefineButton2: 3,
    DefineSprite: 2,
  });
  const nestedCsv = renderNestedKeyframeCandidates(candidatePackage.plan);
  assert.equal(nestedCsv.trimEnd().split("\n").length, 13);
  assert.match(nestedCsv, /candidate-only-do-not-write-current-keyframes/u);
  assert.deepEqual(candidatePackage.migrationCandidate.audio.languages,
    ["es", "und"]);
  assert.equal(candidatePackage.migrationCandidate.audio.cues.length, 2);
  assert.equal(candidatePackage.migrationCandidate.status, "preserved");
  assert.equal(candidatePackage.migrationCandidate.baseline.authority, "undecided");
  assert.equal(candidatePackage.receipt.decision, "DO_NOT_APPLY");
  assert.ok(Object.values(candidatePackage.receipt.acceptanceEffects)
    .every((value) => value === false));
});

test("migration candidate patches exact plan pointers without authority escalation", async () => {
  const candidatePackage = await buildCandidatePackage(PROJECT_ROOT);
  const current = JSON.parse(await readFile(
    path.join(PROJECT_ROOT, "migrations/course-g04-l10-vb-003/migration.json"),
    "utf8",
  ));
  const candidate = buildMigrationCandidate(current, candidatePackage.plan);
  assert.equal(candidate.audit.assetsRequired, true);
  assert.equal(candidate.runtime.fonts.length, 6);
  assert.equal(candidate.audit.masks.length, 3);
  assert.equal(candidate.runtime.externalDependencies.length, 6);
  assert.equal(candidate.confidence, "medium");
  assert.deepEqual(candidate.baseline.viewport,
    {width: 800, height: 600, deviceScaleFactor: 1});
  assert.equal(candidate.baseline.authority, current.baseline.authority);
  assert.deepEqual(candidate.acceptance, current.acceptance);
  assert.deepEqual(candidate.evidence, current.evidence);
});

test("immutable candidate publication is no-clobber and check rejects tamper", async () => {
  const candidatePackage = await buildCandidatePackage(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-candidate-"),
  ));
  const workspaceParent = path.join(
    temporaryRoot,
    "migrations/course-g04-l10-vb-003/audit",
  );
  await mkdir(workspaceParent, {recursive: true, mode: 0o755});
  const fixturePackage = {...candidatePackage, root: temporaryRoot};
  const published = await publishPackageDirectoryNoClobber(fixturePackage);
  assert.equal(published.disposition, "checked");
  assert.equal(published.outputCount, 5);
  await assert.rejects(() => publishPackageDirectoryNoClobber(fixturePackage),
    /already exists; refusing overwrite/u);

  const target = path.join(temporaryRoot, OUTPUT_DIRECTORY_RELATIVE);
  const migrationPath = path.join(target, "migration.candidate.json");
  await chmod(target, 0o755);
  await chmod(migrationPath, 0o644);
  await writeFile(migrationPath, "foreign replacement\n", "utf8");
  await chmod(migrationPath, 0o444);
  await chmod(target, 0o555);
  await assert.rejects(() => checkPackage(fixturePackage),
    /Input SHA-256 drifted/u);
});

test("pre-receipt failure preserves partial custody without cleanup", async () => {
  const candidatePackage = await buildCandidatePackage(PROJECT_ROOT);
  const temporaryRoot = await realpath(await mkdtemp(
    path.join(os.tmpdir(), "g4-l10-vb003-candidate-partial-"),
  ));
  await mkdir(path.join(
    temporaryRoot,
    "migrations/course-g04-l10-vb-003/audit",
  ), {recursive: true, mode: 0o755});
  const fixturePackage = {...candidatePackage, root: temporaryRoot};
  await assert.rejects(() => publishPackageDirectoryNoClobber(fixturePackage, {
    beforeReceipt: async () => {
      throw new Error("simulated exact-preimage drift");
    },
  }), /simulated exact-preimage drift/u);
  const target = path.join(temporaryRoot, OUTPUT_DIRECTORY_RELATIVE);
  assert.deepEqual((await readdir(target)).sort(), [
    "MIGRATION_BRIEF.candidate.md",
    "migration.candidate.json",
    "nested-structural-keyframes.candidate.csv",
    "swf-definition-inventory.candidate.csv",
  ]);
  assert.equal((await stat(target)).mode & 0o777, 0o700);
});
