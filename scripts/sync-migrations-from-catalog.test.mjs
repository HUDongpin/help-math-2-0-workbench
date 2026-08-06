import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {syncMigrationsFromCatalog} from "./sync-migrations-from-catalog.mjs";

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
  return "cue_id,language,source_file,sha256,start_frame,duration_ms,format,channels,sample_rate_hz,source_character_id,notes";
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
  const audited = `${audioHeaderForTest()}\naudited,en,source.mp3,${"c".repeat(64)},7,1200,mp3,2,44100,,reviewed\n`;
  await writeFile(inventoryPath, audited);
  await syncMigrationsFromCatalog({catalogPath, migrationsRoot});
  assert.equal(await readFile(inventoryPath, "utf8"), audited);
});
