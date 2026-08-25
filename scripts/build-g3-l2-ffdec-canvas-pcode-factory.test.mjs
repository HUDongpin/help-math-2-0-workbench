import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  ALL_FALSE_ACCEPTANCE_EFFECTS,
  buildCanvasSmokeEvidence,
  CORPUS_PATH,
  parseArguments,
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

test("Gate 0A regeneration-only mode accepts an explicit source root and never invokes browser capture", async () => {
  const options = parseArguments([
    "--mode",
    "extend",
    "--output",
    "work/g3-l2-ffdec-canvas-pcode-factory/gate0a-fresh-v1",
    "--source-root",
    "/canonical/read-only/source-root",
    "--regeneration-only",
  ]);

  assert.deepEqual(options, {
    mode: "extend",
    output: "work/g3-l2-ffdec-canvas-pcode-factory/gate0a-fresh-v1",
    sourceRoot: "/canonical/read-only/source-root",
    regenerationOnly: true,
  });

  let captureCalls = 0;
  const evidence = await buildCanvasSmokeEvidence({
    regenerationOnly: true,
    canvasHtml: "/not-read/frames.html",
    capturesRoot: "/not-created/canvas-smoke",
    rootFrameCount: 3,
    capture: async () => {
      captureCalls += 1;
      throw new Error("browser capture must not run");
    },
  });

  assert.equal(captureCalls, 0);
  assert.deepEqual(evidence, {
    headlessCallable: false,
    browserLaunched: false,
    captureScope: "deferred-to-post-gate0a-browser-fidelity-gate",
    regenerationOnly: true,
    captures: [],
  });
});

test("standard factory mode retains the browser smoke callback", async () => {
  let captureCalls = 0;
  const expected = Object.freeze({headlessCallable: true, captures: [{frame: 1}]});
  const observed = await buildCanvasSmokeEvidence({
    regenerationOnly: false,
    canvasHtml: "/fixture/frames.html",
    capturesRoot: "/fixture/canvas-smoke",
    rootFrameCount: 3,
    capture: async (request) => {
      captureCalls += 1;
      assert.deepEqual(request, {
        canvasHtml: "/fixture/frames.html",
        capturesRoot: "/fixture/canvas-smoke",
        rootFrameCount: 3,
      });
      return expected;
    },
  });

  assert.equal(captureCalls, 1);
  assert.equal(observed, expected);
});
