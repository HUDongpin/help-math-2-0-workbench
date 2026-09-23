import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_IN_016_GLOSSARY_TERMS,
  COURSE_G04_L10_IN_016_INTERACTIVE_AUDIO_ASSETS,
  COURSE_G04_L10_IN_016_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_IN_016_PRIVATE_AUDIO_TRACKS,
  COURSE_G04_L10_IN_016_RIGHT_BRANCHES,
  COURSE_G04_L10_IN_016_WRONG_BRANCHES,
  COURSE_G04_L10_IN_016_WRONG_FEEDBACK,
  resolveCourseG04L10In016FeedbackBranch,
} from "../src/modules/course-g04-l10-in-016";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-in-016/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-in-016/audit/private-product-audio-assets.json",
  import.meta.url,
);

const exactAssets = Object.freeze([
  ["feedback-close.mp3", 1950, "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38"],
  ["wrong-1.mp3", 11050, "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1"],
  ["wrong-2.mp3", 11050, "d7a98a5d899d27fb01a48d98e1a3957f03edfe8c7f68dddfb40fe552e311c0d0"],
  ["wrong-3.mp3", 11960, "c374d3f9cf0f5fd1adfbd46c74abd7d3bd2d0b1d41bf15b3758a87386a6ca7d1"],
  ["right-1.mp3", 11570, "ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8"],
  ["right-2.mp3", 11960, "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b"],
  ["right-3.mp3", 11050, "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7"],
  ["right-4.mp3", 12740, "c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e"],
  ["main-timeline.mp3", 31850, "af1e23de4f23ab35bc815e860463f2dbc42ed7ac1f7b9db5794fb0078ed327ca"],
  ["spanish-host-narration.mp3", 112224, "fbb761b5332c0190ba6ab51f228c9b191fcb7a56bc4b6852ba214562c71956c0"],
] as const);

test("IN016 is one private interactive-understood page with a bounded real host contract", () => {
  assert.equal(module.key, "course-g04-l10-in-016");
  assert.equal(module.maturity, "private-current-js");
  assert.equal(module.playbackEndFrame, 57);
  assert.deepEqual(module.lessonHost, {
    capabilities: ["audio", "glossary", "practice-feedback"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_IN_016_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {id: "statement", sourceKeyAttribute: "Statement", sourceCharacterId: 14, firstFrame: 6},
      {id: "shape", sourceKeyAttribute: "Shape", sourceCharacterId: 15, firstFrame: 6},
    ],
  );
  assert.deepEqual(COURSE_G04_L10_IN_016_WRONG_FEEDBACK, {
    sourceText: "Find the area and perimeter of each shape and compare them. Try again.",
    glossaryEntryIds: ["area", "perimeter", "shape", "compare"],
  });
});

test("IN016 resets typed practice state only on Replay, not host callback identity changes", async () => {
  const source = await readFile(
    new URL("../src/modules/course-g04-l10-in-016.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /const onLessonHostRequestRef = useRef\(props\.onLessonHostRequest\)/);
  assert.match(source, /onLessonHostRequestRef\.current = props\.onLessonHostRequest/);
  assert.match(
    source,
    /setPractice\(INITIAL_PRACTICE_STATE\);[\s\S]*?onLessonHostRequestRef\.current\?\.\(\{type: "reset-practice-feedback"[\s\S]*?\}, \[clearTimers, props\.replay\]\);/,
  );
  assert.doesNotMatch(
    source,
    /setPractice\(INITIAL_PRACTICE_STATE\);[\s\S]*?\}, \[clearTimers, props\.onLessonHostRequest, props\.replay\]\);/,
  );
  assert.match(
    source,
    /<candidate\.Renderer \{\.\.\.props\} frame=\{renderFrame\} state=\{undefined\} \/>/,
  );
});

test("IN016 exhausts exactly the shipped shell random(3) and random(4) branch ranges", () => {
  assert.deepEqual(
    COURSE_G04_L10_IN_016_WRONG_BRANCHES.map((branch) => [
      branch.branchIndex,
      branch.instanceName,
      branch.sourceTimelineId,
      branch.frameCount,
    ]),
    [
      [1, "Mc_Wrong_Feed1", "sprite-78", 28],
      [2, "Mc_Wrong_Feed2", "sprite-89", 28],
      [3, "Mc_Wrong_Feed3", "sprite-101", 31],
    ],
  );
  assert.deepEqual(
    COURSE_G04_L10_IN_016_RIGHT_BRANCHES.map((branch) => [
      branch.branchIndex,
      branch.instanceName,
      branch.sourceTimelineId,
      branch.frameCount,
    ]),
    [
      [1, "Mc_Right_Feed1", "sprite-177", 28],
      [2, "Mc_Right_Feed2", "sprite-127", 31],
      [3, "Mc_Right_Feed3", "sprite-144", 28],
      [4, "Mc_Right_Feed4", "sprite-165", 33],
    ],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6].map((seed) =>
      resolveCourseG04L10In016FeedbackBranch(seed, "incorrect").branchIndex
    ),
    [1, 2, 3, 1, 2, 3, 1],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7].map((seed) =>
      resolveCourseG04L10In016FeedbackBranch(seed, "correct").branchIndex
    ),
    [1, 2, 3, 4, 1, 2, 3, 4],
  );
  assert.equal(COURSE_G04_L10_IN_016_WRONG_BRANCHES.some(({instanceName}) => instanceName.endsWith("4")), false);
  assert.equal(COURSE_G04_L10_IN_016_RIGHT_BRANCHES.some(({instanceName}) => instanceName.endsWith("5")), false);
});

test("IN016 main audio stops at the authored quiz stop and Replay rewinds its cue", () => {
  const cue = COURSE_G04_L10_IN_016_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-209",
    scenario: "source-static-frame",
    seed: 0,
  } as const;
  assert.deepEqual(
    {frame: cue.frame, endFrame: cue.endFrame, durationMs: cue.durationMs},
    {frame: 5, endFrame: 57, durationMs: 6400},
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(resolveAudioCueTransition(COURSE_G04_L10_IN_016_PRIVATE_AUDIO_CUES, {
    previousFrame: 56,
    frame: 57,
    fps: 12,
    ...base,
    lang: "en",
  }), {start: [], stopIds: ["in016-main"]});
  assert.deepEqual(resolveAudioCueTransition(COURSE_G04_L10_IN_016_PRIVATE_AUDIO_CUES, {
    previousFrame: 57,
    frame: 1,
    fps: 12,
    ...base,
    lang: "en",
  }), {start: [], stopIds: ["in016-main"]});
});

test("IN016 exposes eight exact EN interaction assets and one user-activated ES host track", () => {
  assert.equal(COURSE_G04_L10_IN_016_INTERACTIVE_AUDIO_ASSETS.length, 8);
  assert.ok(COURSE_G04_L10_IN_016_INTERACTIVE_AUDIO_ASSETS.every((asset) =>
    asset.language === "en" && asset.source.endsWith(`?sha256=${asset.sha256}`)
  ));
  assert.deepEqual(COURSE_G04_L10_IN_016_PRIVATE_AUDIO_TRACKS.map((track) => ({
    id: track.id,
    language: track.language,
    activation: track.activation,
    timelineBehavior: track.timelineBehavior,
    durationMs: track.durationMs,
  })), [{
    id: "spanish-host-narration",
    language: "es",
    activation: "user",
    timelineBehavior: "pause-while-playing",
    durationMs: 8016,
  }]);
});

test("IN016 staged audio remains exact, source-reachable, full-decoded, and acceptance-neutral", async () => {
  for (const [name, expectedBytes, expectedSha256] of exactAssets) {
    const bytes = await readFile(new URL(name, assetRoot));
    assert.equal(bytes.length, expectedBytes, name);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedSha256, name);
  }
  const receipt = JSON.parse((await readFile(receiptUrl)).toString("utf8")) as {
    calibrationId: string;
    status: string;
    productReachability: {
      includedEmbeddedCharacterIds: number[];
      excludedByShippedHostCardinality: Array<{characterId: number}>;
    };
    assets: Array<{media: {fullEofDecodePassed: boolean}}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v22");
  assert.equal(receipt.status, "materialized-and-full-eof-decoded-listening-pending");
  assert.deepEqual(receipt.productReachability.includedEmbeddedCharacterIds, [44, 78, 89, 101, 177, 127, 144, 165, 209]);
  assert.deepEqual(receipt.productReachability.excludedByShippedHostCardinality.map(({characterId}) => characterId), [50, 208]);
  assert.ok(receipt.assets.every(({media}) => media.fullEofDecodePassed));
  assert.ok(Object.values(receipt.acceptanceEffects).every((value) => !value));
  assert.equal(receipt.strictAcceptanceEffect, "none");
});
