import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  ALL_FALSE_ACCEPTANCE_EFFECTS,
  CORPUS_PATH,
  OUTPUT_ROOT,
  PROJECT_ROOT,
  selectFactoryMembers,
} from "./build-g4-l5-ffdec-canvas-pcode-product-factory.mjs";

async function readJson(relativePath) {
  return JSON.parse(
    await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"),
  );
}

test("G4 L5 factory locks an exact six-page, page-only calibration set", async () => {
  const corpus = await readJson(CORPUS_PATH);
  const catalog = await readJson("catalog/animations.json");
  const members = selectFactoryMembers(catalog, corpus, "calibrate");

  assert.equal(typeof PROJECT_ROOT, "string");
  assert.equal(
    CORPUS_PATH,
    "tools/g4-l5-ffdec-canvas-pcode-product-factory/corpus.json",
  );
  assert.equal(
    OUTPUT_ROOT,
    "work/g4-l5-ffdec-canvas-pcode-product-factory",
  );
  assert.equal(corpus.release.legacyFlashCourseShellExcluded, true);
  assert.equal(corpus.release.modernMyLessonHostRetained, true);
  assert.equal(
    corpus.productQualification.structuralCompilerOutputAloneQualifies,
    false,
  );
  assert.equal(corpus.productQualification.scaleOutAuthorized, false);
  assert.deepEqual(
    members.map(({entry, ordinal}) => [entry.animationId, ordinal]),
    [
      ["course-g04-l05-rw-002", 2],
      ["course-g04-l05-vb-008", 11],
      ["course-g04-l05-in-013", 30],
      ["course-g04-l05-ti-002", 37],
      ["course-g04-l05-gs-003", 43],
      ["course-g04-l05-fq-002", 52],
    ],
  );
  for (const {entry} of members) {
    assert.equal(entry.flags.referenced, true);
    assert.equal(entry.flags.unreferenced, false);
    assert.equal(entry.flags.variant, false);
    assert.equal(entry.flags.shell, false);
  }
});

test("G4 L5 structural extension resolves 53 source-ordered pages and no shell", async () => {
  const corpus = await readJson(CORPUS_PATH);
  const catalog = await readJson("catalog/animations.json");
  const members = selectFactoryMembers(catalog, corpus, "extend");

  assert.equal(members.length, 53);
  assert.deepEqual(
    members.map(({ordinal}) => ordinal),
    Array.from({length: 53}, (_, index) => index + 1),
  );
  assert.equal(members.some(({entry}) => entry.flags.shell), false);
  assert.equal(members.some(({entry}) => /^shell-/.test(entry.animationId)), false);
  assert.equal(members[0].entry.animationId, "course-g04-l05-ir-001");
  assert.equal(members.at(-1).entry.animationId, "course-g04-l05-fq-003");
  assert.equal(members.filter(({entry}) => entry.pairedFla).length, 47);
  assert.equal(members.filter(({entry}) => !entry.pairedFla).length, 6);
  assert.equal(
    members.filter(({entry}) => entry.audio.exact.length === 1).length,
    48,
  );
  assert.equal(
    members.filter(({entry}) => entry.audio.groupIds.length === 1).length,
    3,
  );
});

test("factory acceptance effects leave product and all acceptance gates closed", () => {
  assert.deepEqual(ALL_FALSE_ACCEPTANCE_EFFECTS, {
    legacyFlashCourseShellConverted: false,
    modernMyLessonHostChanged: false,
    currentJavaScriptRegistered: false,
    avm1BehaviorCompiled: false,
    nestedAudioPlaybackCompiled: false,
    authoritativeOriginalRuntime: false,
    visualFidelityAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    released: false,
    published: false,
  });
});
