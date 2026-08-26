import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  parseArguments,
  resolveLessonReleaseAnimationIds,
  syncMigrationsFromCatalog,
} from "./sync-migrations-from-catalog.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-catalog-sync-"));
  const migrationsRoot = path.join(root, "migrations");
  const workspace = path.join(migrationsRoot, "formula-test");
  await mkdir(workspace, {recursive: true});
  const sha256 = "a".repeat(64);
  const manifest = {
    animationId: "formula-test",
    assetId: `swf-${sha256}`,
    status: "preserved",
    classification: {status: "unresolved"},
    source: {
      placementPath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_FORMULAS/Test.swf",
      swfSha256: sha256,
      aliasOf: null,
      variantOf: null,
    },
    audio: {required: false, reasonNotRequired: "", languages: [], cues: []},
  };
  const catalog = {
    schemaVersion: 1,
    animations: [{
      animationId: "formula-test",
      canonicalAnimationId: "formula-test",
      assetId: `swf-${sha256}`,
      duplicateOf: null,
      source: {path: "HELP_FORMULAS/Test.swf", sha256},
      classification: {
        collection: "formula",
        grade: "elementary",
        lesson: null,
        section: null,
        page: {number: null, ordinal: null},
        domain: "formula-reference",
        titleRaw: "Raw title",
        titleDisplay: "Display title",
        titleEnglish: "English title",
        titleSpanish: "Título español",
        status: "confirmed",
        evidence: [{source: "fixture"}],
      },
      flags: {variant: false, shell: false},
      audio: {exact: [{path: "HELP_FORMULAS/Test.mp3", sha256: "b".repeat(64), language: "en", bytes: 123}], groupIds: []},
    }],
  };
  const catalogPath = path.join(root, "animations.json");
  await writeFile(path.join(workspace, "migration.json"), JSON.stringify(manifest));
  await writeFile(path.join(workspace, "audio-inventory.csv"), `${audioHeaderForTest()}\n`);
  await writeFile(catalogPath, JSON.stringify(catalog));
  return {catalogPath, migrationsRoot, workspace};
}

function audioHeaderForTest() {
  return "cue_id,language,source_file,sha256,start_frame,start_frame_domain_id,start_semantics,duration_ms,format,channels,sample_rate_hz,source_character_id,notes";
}

test("sync imports evidence without advancing migration status", async () => {
  const {catalogPath, migrationsRoot, workspace} = await fixture();
  const result = await syncMigrationsFromCatalog({catalogPath, migrationsRoot});
  assert.equal(result[0].action, "synced");
  const manifest = JSON.parse(await readFile(path.join(workspace, "migration.json"), "utf8"));
  assert.equal(manifest.status, "preserved");
  assert.equal(manifest.classification.grade, "elementary/shared");
  assert.equal(manifest.classification.titleDisplay, "Display title");
  assert.equal(manifest.implementation.registryModule, "");
  assert.equal(manifest.audio.required, true);
  assert.deepEqual(manifest.audio.languages, ["en"]);
  const audio = await readFile(path.join(workspace, "audio-inventory.csv"), "utf8");
  assert.match(audio, /catalog-audio-01,en,.*Test\.mp3/);
  assert.match(audio, /timeline\/audio audit/);
});

test("dry run does not mutate the workspace", async () => {
  const {catalogPath, migrationsRoot, workspace} = await fixture();
  const before = await readFile(path.join(workspace, "migration.json"), "utf8");
  const result = await syncMigrationsFromCatalog({catalogPath, migrationsRoot, dryRun: true});
  assert.equal(result[0].action, "would-sync");
  assert.equal(await readFile(path.join(workspace, "migration.json"), "utf8"), before);
});

test("identity conflicts fail instead of importing unrelated evidence", async () => {
  const {catalogPath, migrationsRoot, workspace} = await fixture();
  const manifestPath = path.join(workspace, "migration.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.assetId = `swf-${"f".repeat(64)}`;
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(
    syncMigrationsFromCatalog({catalogPath, migrationsRoot}),
    /assetId conflicts/,
  );
});

test("a repeated sync does not replace an audited audio inventory", async () => {
  const {catalogPath, migrationsRoot, workspace} = await fixture();
  await syncMigrationsFromCatalog({catalogPath, migrationsRoot});
  const inventoryPath = path.join(workspace, "audio-inventory.csv");
  const audited = `${audioHeaderForTest()}\naudited,en,source.mp3,${"c".repeat(64)},7,timeline-frame,1200,mp3,2,44100,,reviewed\n`;
  await writeFile(inventoryPath, audited);
  await syncMigrationsFromCatalog({catalogPath, migrationsRoot});
  assert.equal(await readFile(inventoryPath, "utf8"), audited);
});

test("an explicit animation selection cannot mutate or silently omit another workspace", async () => {
  const {catalogPath, migrationsRoot, workspace} = await fixture();
  const otherWorkspace = path.join(migrationsRoot, "other-workspace");
  await mkdir(otherWorkspace, {recursive: true});
  const untouched = JSON.stringify({animationId: "other-workspace", status: "preserved"});
  await writeFile(path.join(otherWorkspace, "migration.json"), untouched);

  const result = await syncMigrationsFromCatalog({
    catalogPath,
    migrationsRoot,
    animationIds: ["formula-test"],
  });
  assert.deepEqual(result.map(({id}) => id), ["formula-test"]);
  assert.equal(await readFile(path.join(otherWorkspace, "migration.json"), "utf8"), untouched);
  assert.equal(JSON.parse(await readFile(path.join(workspace, "migration.json"), "utf8")).classification.status, "confirmed");

  await assert.rejects(
    syncMigrationsFromCatalog({catalogPath, migrationsRoot, animationIds: ["missing-workspace"]}),
    /missing or unmatched/,
  );
});

async function orderedReleaseFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-release-catalog-sync-"));
  const migrationsRoot = path.join(root, "migrations");
  const ids = ["formula-zeta", "formula-alpha"];
  const animations = [];
  for (const [index, id] of ids.entries()) {
    const sha256 = String(index + 1).repeat(64);
    const sourcePath = `HELP_FORMULAS/${id}.swf`;
    await mkdir(path.join(migrationsRoot, id), {recursive: true});
    await writeFile(path.join(migrationsRoot, id, "migration.json"), JSON.stringify({
      animationId: id,
      assetId: `swf-${sha256}`,
      status: "preserved",
      classification: {status: "unresolved"},
      source: {
        placementPath: `source-assets/flash/HELP MATH_ORIGINAL FILES/${sourcePath}`,
        swfSha256: sha256,
      },
      audio: {required: false, languages: [], cues: []},
    }));
    animations.push({
      animationId: id,
      canonicalAnimationId: id,
      assetId: `swf-${sha256}`,
      source: {path: sourcePath, sha256},
      classification: {status: "confirmed"},
      flags: {variant: false, shell: false},
      audio: {exact: [], groupIds: []},
    });
  }
  const catalogPath = path.join(root, "animations.json");
  const lessonReleasesPath = path.join(root, "lesson-releases.json");
  await writeFile(catalogPath, JSON.stringify({schemaVersion: 1, animations}));
  await writeFile(lessonReleasesPath, JSON.stringify({
    schemaVersion: 1,
    releases: [{
      releaseId: "lesson-fixture-order",
      publicationMode: "atomic",
      expectedCounts: {members: ids.length},
      members: ids.map((animationId, index) => ({ordinal: index + 1, animationId})),
    }],
  }));
  return {root, migrationsRoot, catalogPath, lessonReleasesPath, ids};
}

test("lesson release selection is exact and drives sync in catalog ordinal order", async () => {
  const fixture = await orderedReleaseFixture();
  try {
    const complete = await resolveLessonReleaseAnimationIds({
      releaseId: "lesson-fixture-order",
      lessonReleasesPath: fixture.lessonReleasesPath,
    });
    assert.deepEqual(complete, fixture.ids);

    const subset = await resolveLessonReleaseAnimationIds({
      releaseId: "lesson-fixture-order",
      requestedAnimationIds: [...fixture.ids].reverse(),
      lessonReleasesPath: fixture.lessonReleasesPath,
    });
    assert.deepEqual(subset, fixture.ids);

    const results = await syncMigrationsFromCatalog({
      catalogPath: fixture.catalogPath,
      migrationsRoot: fixture.migrationsRoot,
      dryRun: true,
      animationIds: subset,
    });
    assert.deepEqual(results.map(({id}) => id), fixture.ids);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("CLI selection semantics reject ambiguous and non-member release requests", async () => {
  const fixture = await orderedReleaseFixture();
  try {
    const options = parseArguments([
      "--dry-run",
      "--release-id", "lesson-fixture-order",
      "--id", "formula-alpha",
      "--id", "formula-zeta",
    ]);
    assert.equal(options.releaseId, "lesson-fixture-order");
    assert.deepEqual(options.animationIds, ["formula-alpha", "formula-zeta"]);
    assert.throws(() => parseArguments(["--release-id"]), /requires a value/);
    assert.throws(
      () => parseArguments(["--release-id", "lesson-one", "--release-id", "lesson-two"]),
      /only once/,
    );
    await assert.rejects(
      resolveLessonReleaseAnimationIds({
        releaseId: "lesson-missing",
        lessonReleasesPath: fixture.lessonReleasesPath,
      }),
      /Unknown lesson release/,
    );
    await assert.rejects(
      resolveLessonReleaseAnimationIds({
        releaseId: "lesson-fixture-order",
        requestedAnimationIds: ["formula-outside"],
        lessonReleasesPath: fixture.lessonReleasesPath,
      }),
      /not members of lesson release/,
    );
    await assert.rejects(
      resolveLessonReleaseAnimationIds({
        releaseId: "lesson-fixture-order",
        requestedAnimationIds: ["formula-alpha", "formula-alpha"],
        lessonReleasesPath: fixture.lessonReleasesPath,
      }),
      /must not be repeated/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});
