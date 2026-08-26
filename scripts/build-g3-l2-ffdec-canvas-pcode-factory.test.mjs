import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  ALL_FALSE_ACCEPTANCE_EFFECTS,
  CORPUS_PATH,
  PROJECT_ROOT,
  selectFactoryMembers,
} from "./build-g3-l2-ffdec-canvas-pcode-factory.mjs";

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"));
}

test("G3 L2 factory locks an exact six-page, page-only calibration set", async () => {
  const corpus = await readJson("tools/g3-l2-ffdec-canvas-pcode-factory/corpus.json");
  const catalog = await readJson("catalog/animations.json");
  const members = selectFactoryMembers(catalog, corpus, "calibrate");

  assert.equal(typeof PROJECT_ROOT, "string");
  assert.equal(CORPUS_PATH, "tools/g3-l2-ffdec-canvas-pcode-factory/corpus.json");
  assert.equal(corpus.release.legacyFlashCourseShellExcluded, true);
  assert.equal(corpus.release.modernMyLessonHostRetained, true);
  assert.deepEqual(
    members.map(({entry, ordinal}) => [entry.animationId, ordinal]),
    [
      ["course-g03-l02-rw-002", 2],
      ["course-g03-l02-vb-010", 14],
      ["course-g03-l02-in-014", 31],
      ["course-g03-l02-ti-004", 52],
      ["course-g03-l02-gs-002", 59],
      ["course-g03-l02-fq-002", 69],
    ],
  );
  for (const {entry} of members) {
    assert.equal(entry.flags.referenced, true);
    assert.equal(entry.flags.unreferenced, false);
    assert.equal(entry.flags.variant, false);
    assert.equal(entry.flags.shell, false);
  }
});

test("G3 L2 factory extension resolves all 70 active source-ordered pages and no shell", async () => {
  const corpus = await readJson("tools/g3-l2-ffdec-canvas-pcode-factory/corpus.json");
  const catalog = await readJson("catalog/animations.json");
  const members = selectFactoryMembers(catalog, corpus, "extend");

  assert.equal(members.length, 70);
  assert.deepEqual(members.map(({ordinal}) => ordinal), Array.from({length: 70}, (_, index) => index + 1));
  assert.equal(members.some(({entry}) => entry.flags.shell), false);
  assert.equal(members.some(({entry}) => /^shell-/.test(entry.animationId)), false);
  assert.equal(members[0].entry.animationId, "course-g03-l02-ir-001-87689b4b");
  assert.equal(members.at(-1).entry.animationId, "course-g03-l02-fq-003");
  assert.equal(members.filter(({entry}) => entry.pairedFla).length, 56);
  assert.equal(members.filter(({entry}) => !entry.pairedFla).length, 14);
  assert.equal(members.filter(({entry}) => entry.audio.exact.length === 1).length, 62);
  assert.equal(members.filter(({entry}) => entry.audio.exact.length === 0).length, 8);
});

test("factory acceptance effects retain AVM1, audio, fidelity, review, and release gates as false", () => {
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
