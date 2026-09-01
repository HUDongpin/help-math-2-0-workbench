import assert from "node:assert/strict";
import {access, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ACCEPTANCE_EFFECTS_FALSE,
  PROJECT_ROOT,
  classifyLane,
  computeCacheKey,
  enumerateSource,
  loadProfile,
  parseLessonXml,
  runFactory,
} from "./build-shared-page-factory.mjs";

const WORK_ROOT = path.join(PROJECT_ROOT, "work");

async function fixture() {
  const root = await (async () => {
    const value = await import("node:fs/promises");
    return value.mkdtemp(path.join(os.tmpdir(), "help-g678-factory-source-"));
  })();
  const moduleRoot = path.join(root, "G6-G8-shared", "NMS002", "L1");
  await mkdir(path.join(moduleRoot, "IR"), {recursive: true});
  await mkdir(path.join(moduleRoot, "RW"), {recursive: true});
  const xml = `\uFEFF<Lesson>\n  <CourseName>Numbers &amp; Sense</CourseName>\n  <LessonName>Fixture & Numbers</LessonName>\n  <Section SName="IR" SNumber="1"><Title><English>Introduction</English><Spanish>Introducción</Spanish></Title>\n    <Page Title="Intro">IR/L1IR01.swf</Page>\n    <!-- <Page Title="inactive">IR/L1IR99.swf</Page> -->\n  </Section>\n  <Section SName="RW" SNumber="2"><Title><English>Real World</English><Spanish>Mundo</Spanish></Title>\n    <Page Title="Practice" RandomAudio="No">RW/L1RW01.swf</Page>\n    <SubPageTitle EngSubTitleName="Practice">RW/L1RW01.swf</SubPageTitle>\n  </Section>\n</Lesson>\n`;
  await writeFile(path.join(moduleRoot, "index.xml"), xml);
  // Valid SWF signatures are enough for the structural front end.  The bytes
  // are intentionally tiny; no FFDec extraction is invoked by this runner.
  await writeFile(path.join(moduleRoot, "IR", "L1IR01.swf"), Buffer.from("FWS\t\x08\x00\x00\x00fixture-ir"));
  await writeFile(path.join(moduleRoot, "RW", "L1RW01.swf"), Buffer.from("CWS\t\x08\x00\x00\x00fixture-rw"));
  const profilePath = path.join(root, "profile.json");
  const profile = {
    schemaVersion: 1,
    profileId: "fixture-g678-shared",
    version: "v1",
    sourceViewPath: root,
    canonicalRootRule: {relativePath: "G6-G8-shared"},
    requireReadOnlySource: false,
    modules: [{
      moduleCode: "NMS002",
      moduleTitle: "Numbers Make Sense",
      sourceRoot: "NMS002",
      lessonNumbers: [1],
      expectedActivePagesByLesson: {"1": 2},
    }],
    activePageCounts: {NMS002: {"1": 2}},
    calibrationSet: [
      {moduleCode: "NMS002", lessonNumber: 1, ordinal: 1, lane: "low", selectionReason: "fixture low"},
      {moduleCode: "NMS002", lessonNumber: 1, ordinal: 2, lane: "interactive-understood", selectionReason: "fixture interaction"},
    ],
    toolchain: {
      ffdec: {version: "fixture", status: "not-invoked"},
      swfmill: {version: "fixture", status: "not-invoked"},
    },
    licenseManifest: {status: "unresolved", entries: []},
  };
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
  return {root, profilePath, profile};
}

async function cleanupFixture(value) {
  await rm(value.root, {recursive: true, force: true});
}

test("parseLessonXml excludes comments and SubPageTitle while preserving source order", () => {
  const result = parseLessonXml(Buffer.from(`<Lesson><LessonName>A & B</LessonName><Section SName="IR"><Page>IR/a.swf</Page><!--<Page>IR/b.swf</Page>--></Section><Section SName="RW"><Page Title="Practice">RW/c.swf</Page><SubPageTitle>RW/c.swf</SubPageTitle></Section></Lesson>`), {
    xmlPath: "fixture/index.xml",
    moduleCode: "NMS002",
    lessonNumber: 1,
  });
  assert.equal(result.pages.length, 2);
  assert.deepEqual(result.pages.map((page) => [page.ordinal, page.sectionCode, page.reference]), [[1, "IR", "IR/a.swf"], [2, "RW", "RW/c.swf"]]);
  assert.ok(result.warnings.some((warning) => warning.code === "XML_BARE_AMPERSAND"));
});

test("lane classification is conservative and fail-closed", () => {
  const unknown = classifyLane({swfSignature: "FWS", hint: null, sourceOnly: true});
  assert.equal(unknown.lane, "unknown");
  assert.equal(unknown.laneDisposition, "hold-needs-source-audit");
  assert.equal(unknown.generationEligible, false);
  const unsupported = classifyLane({swfSignature: "CWS", hint: {lane: "low", unsupportedFeatures: ["random"]}, sourceOnly: true});
  assert.equal(unsupported.laneDisposition, "hold-unsupported");
  assert.equal(unsupported.generationEligible, false);
  const badMagic = classifyLane({swfSignature: "???", hint: {lane: "low"}, sourceOnly: true});
  assert.equal(badMagic.unsupportedReasons.includes("invalid-or-unknown-swf-signature"), true);
});

test("profile supports sourceViewPath/modules and enumerates fixture pages", async (t) => {
  const value = await fixture();
  t.after(() => cleanupFixture(value));
  const profile = await loadProfile(value.profilePath);
  const source = await enumerateSource(profile, [
    {moduleCode: "NMS002", lessonNumber: 1, ordinal: null, placementId: null, lane: "low"},
  ]);
  assert.equal(source.lessons.length, 1);
  assert.equal(source.lessons[0].activePageCount, 2);
  assert.equal(source.placements.length, 2);
  assert.equal(source.placements[0].assetId.startsWith("swf-"), true);
  assert.equal(source.placements.every((entry) => entry.swfOnly), true);
  assert.equal(source.placements.every((entry) => entry.acceptanceEffects.currentJavaScriptRegistered === false), true);
});

test("calibrate build writes FactoryRunManifestV2 atomically and check is read-only", async (t) => {
  const value = await fixture();
  const output = await import("node:fs/promises").then(({mkdtemp}) => mkdtemp(path.join(WORK_ROOT, "g678-factory-test-")));
  const runOutput = path.join(output, "calibration-v1");
  const cache = path.join(output, "cache");
  const runOutputRelative = path.relative(PROJECT_ROOT, runOutput);
  const cacheRelative = path.relative(PROJECT_ROOT, cache);
  t.after(async () => {
    await cleanupFixture(value);
    await rm(output, {recursive: true, force: true});
  });
  const built = await runFactory({
    mode: "calibrate",
    profile: value.profilePath,
    output: runOutputRelative,
    cache: cacheRelative,
    runId: "fixture-run-001",
  });
  assert.equal(built.status, "structural-audit-only");
  assert.equal(built.lessonCount, 1);
  assert.equal(built.placementCount, 2);
  assert.equal(built.cacheHit, false);
  assert.deepEqual(built.acceptanceEffects, ACCEPTANCE_EFFECTS_FALSE);
  const manifest = JSON.parse(await readFile(path.join(runOutput, "run-manifest.json"), "utf8"));
  assert.equal(manifest.manifestKind, "FactoryRunManifestV2");
  assert.equal(manifest.generator.runtimeInvoked, false);
  assert.equal(manifest.generator.extractionInvoked, false);
  assert.equal(manifest.placementIds.length, 2);
  assert.equal(manifest.acceptanceEffects.currentJavaScriptRegistered, false);
  const checked = await runFactory({mode: "check", profile: value.profilePath, output: runOutputRelative, cache: cacheRelative});
  assert.equal(checked.status, "PASS");
  assert.equal(checked.runId, "fixture-run-001");
});

test("dry-run does not create an output and computes a content-addressed key", async (t) => {
  const value = await fixture();
  const output = await import("node:fs/promises").then(({mkdtemp}) => mkdtemp(path.join(WORK_ROOT, "g678-factory-dry-run-")));
  t.after(async () => {
    await cleanupFixture(value);
    await rm(output, {recursive: true, force: true});
  });
  const result = await runFactory({mode: "calibrate", profile: value.profilePath, output: path.join(output, "would-not-write"), dryRun: true});
  assert.equal(result.status, "dry-run-structural-only");
  assert.match(result.cacheKey, /^[a-f0-9]{64}$/);
  assert.equal(result.acceptanceEffects.currentJavaScriptRegistered, false);
  await assert.rejects(() => access(path.join(output, "would-not-write")));
});

test("missing source view fails closed with a diagnostic code", async () => {
  await assert.rejects(
    () => loadProfile(path.join(os.tmpdir(), "does-not-exist-g678-profile.json")),
    (error) => error.code === "PROFILE_MISSING",
  );
});

test("source-root override supports the profile's sourceView shape", async (t) => {
  const value = await fixture();
  t.after(() => cleanupFixture(value));
  const profile = {...value.profile};
  delete profile.sourceViewPath;
  delete profile.canonicalRootRule;
  profile.sourceView = {kind: "private-external-read-only", rootEnv: "G678_TEST_ROOT", relativeRoot: "G6-G8-shared"};
  await writeFile(value.profilePath, `${JSON.stringify(profile)}\n`);
  const loaded = await loadProfile(value.profilePath, {sourceRootOverride: value.root});
  assert.equal(loaded.sourceViewPath, value.root);
  assert.equal(loaded.canonicalRoot, "G6-G8-shared");
  const source = await enumerateSource(loaded, [{moduleCode: "NMS002", lessonNumber: 1, ordinal: 1, placementId: null, lane: "low"}]);
  assert.equal(source.placements.length, 1);
});

test("a cache collision/corruption retains an explicit failure staging directory", async (t) => {
  const value = await fixture();
  const output = await import("node:fs/promises").then(({mkdtemp}) => mkdtemp(path.join(WORK_ROOT, "g678-factory-failure-")));
  const outputRelative = path.relative(PROJECT_ROOT, path.join(output, "run"));
  const cacheRelative = path.relative(PROJECT_ROOT, path.join(output, "cache"));
  t.after(async () => {
    await cleanupFixture(value);
    await rm(output, {recursive: true, force: true});
  });
  const dryRun = await runFactory({mode: "calibrate", profile: value.profilePath, output: outputRelative, cache: cacheRelative, dryRun: true});
  const corruptCache = path.join(output, "cache", dryRun.cacheKey);
  await mkdir(corruptCache, {recursive: true});
  await writeFile(path.join(corruptCache, "README.txt"), "intentionally corrupt fixture\n");
  let failure;
  try {
    await runFactory({mode: "calibrate", profile: value.profilePath, output: outputRelative, cache: cacheRelative, runId: "failure-run-001"});
  } catch (error) {
    failure = error;
  }
  assert.equal(failure?.code, "CACHE_CORRUPT");
  const staging = failure?.details?.staging;
  assert.equal(typeof staging, "string");
  await access(path.resolve(PROJECT_ROOT, staging, "failure.json"));
});

test("cache key changes when source identity changes but excludes CLI check mode", () => {
  const profile = {profileId: "p", version: "v1", profileSha256: "p-hash", sourceManifestSha256: null, mappingManifestSha256: null, toolchain: {}, license: {status: "unresolved"}};
  const selected = [{placementId: "shared-nms002-l01-p001", source: {sha256: "a".repeat(64)}, sourceXml: {sha256: "b".repeat(64)}, lane: "low", unsupportedReasons: []}];
  const base = {profile, selected, source: {}, options: {mode: "calibrate", moduleCode: null, lesson: null, batch: null}, scriptSha256: "c".repeat(64)};
  const calibrate = computeCacheKey(base).cacheKey;
  const check = computeCacheKey({...base, options: {...base.options, mode: "check"}}).cacheKey;
  assert.equal(calibrate, check);
  const changed = computeCacheKey({...base, selected: [{...selected[0], source: {sha256: "d".repeat(64)}}]}).cacheKey;
  assert.notEqual(calibrate, changed);
});
