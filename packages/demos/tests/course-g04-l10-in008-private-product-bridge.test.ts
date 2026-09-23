import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext} from "../src/runtime";
import module, {
  COURSE_G04_L10_IN_008_GLOSSARY_TERMS,
  COURSE_G04_L10_IN_008_INTERACTIVE_AUDIO_ASSETS,
  COURSE_G04_L10_IN_008_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_IN_008_PRIVATE_AUDIO_TRACKS,
  COURSE_G04_L10_IN_008_RIGHT_BRANCHES,
  COURSE_G04_L10_IN_008_SOURCE,
  COURSE_G04_L10_IN_008_WRONG_BRANCHES,
  COURSE_G04_L10_IN_008_WRONG_FEEDBACK,
  resolveCourseG04L10In008FeedbackBranch,
} from "../src/modules/course-g04-l10-in-008";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-in-008/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-in-008/audit/private-product-audio-assets.json",
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
  ["main-timeline.mp3", 47970, "ef5155fcf01f212a2381a273003bf60bb60285b0e0fe3a7b92d9d207b6ad17e3"],
  ["main-continuation.mp3", 28210, "741ba76391efe55455c13a556c5a239abcbb481c8968281b5ec532b478b272a1"],
  ["spanish-host-narration.mp3", 160272, "6a9eb69497f5afcc916fca1dd1f6f757bbcff15833402f77c389e9c3f71bf39b"],
] as const);

test("IN008 is one private interactive-understood page with a bounded real host contract", () => {
  assert.equal(module.key, "course-g04-l10-in-008");
  assert.equal(module.maturity, "private-current-js");
  assert.equal(module.playbackEndFrame, 52);
  assert.deepEqual(module.lessonHost, {
    capabilities: ["audio", "glossary", "practice-feedback"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.equal(COURSE_G04_L10_IN_008_SOURCE.registered, true);
  assert.equal(COURSE_G04_L10_IN_008_SOURCE.controlsEnabled, true);
  assert.deepEqual(
    COURSE_G04_L10_IN_008_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      sourceFirstPlacementFrame: term.sourceFirstPlacementFrame,
      productFirstVisibleFrame: term.productFirstVisibleFrame,
    })),
    [
      {id: "perimeter", sourceKeyAttribute: "Perimeter", sourceCharacterId: 13, sourceFirstPlacementFrame: 6, productFirstVisibleFrame: 6},
      {id: "triangle", sourceKeyAttribute: "Triangle", sourceCharacterId: 14, sourceFirstPlacementFrame: 6, productFirstVisibleFrame: 6},
    ],
  );
  assert.deepEqual(COURSE_G04_L10_IN_008_WRONG_FEEDBACK, {
    sourceText: "Perimeter is the distance around a shape. Find the sum of the measurements of all the sides. Try again.",
    glossaryEntryIds: ["perimeter", "distance", "around", "shape", "sum", "measurement", "side"],
  });
});

test("IN008 exhausts exactly the shipped shell random(3) and random(4) ranges", () => {
  assert.deepEqual(
    COURSE_G04_L10_IN_008_WRONG_BRANCHES.map((branch) => [branch.branchIndex, branch.instanceName, branch.sourceTimelineId, branch.frameCount]),
    [
      [1, "Mc_Wrong_Feed1", "sprite-79", 28],
      [2, "Mc_Wrong_Feed2", "sprite-90", 28],
      [3, "Mc_Wrong_Feed3", "sprite-102", 31],
    ],
  );
  assert.deepEqual(
    COURSE_G04_L10_IN_008_RIGHT_BRANCHES.map((branch) => [branch.branchIndex, branch.instanceName, branch.sourceTimelineId, branch.frameCount]),
    [
      [1, "Mc_Right_Feed1", "sprite-178", 28],
      [2, "Mc_Right_Feed2", "sprite-128", 31],
      [3, "Mc_Right_Feed3", "sprite-145", 28],
      [4, "Mc_Right_Feed4", "sprite-166", 33],
    ],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6].map((seed) => resolveCourseG04L10In008FeedbackBranch(seed, "incorrect").branchIndex),
    [1, 2, 3, 1, 2, 3, 1],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7].map((seed) => resolveCourseG04L10In008FeedbackBranch(seed, "correct").branchIndex),
    [1, 2, 3, 4, 1, 2, 3, 4],
  );
  assert.equal(COURSE_G04_L10_IN_008_WRONG_BRANCHES.some(({sourceTimelineId}) => sourceTimelineId === "sprite-51"), false);
  assert.equal(COURSE_G04_L10_IN_008_RIGHT_BRANCHES.some(({sourceTimelineId}) => sourceTimelineId === "sprite-209"), false);
});

test("IN008 main audio stops at frame 52 and the correct branch owns the exact gapped 53-129 continuation", () => {
  assert.equal(COURSE_G04_L10_IN_008_PRIVATE_AUDIO_CUES.length, 1);
  const cue = COURSE_G04_L10_IN_008_PRIVATE_AUDIO_CUES[0]!;
  assert.equal(cue.frame, 5);
  assert.equal(cue.endFrame, 52);
  assert.equal(cue.frameDomain, "sprite-210");
  assert.equal(audioCueMatchesContext(cue, {
    frameDomain: "sprite-210",
    lang: "en",
    scenario: "source-static-frame",
    seed: 0,
  }), true);
  const continuation = COURSE_G04_L10_IN_008_INTERACTIVE_AUDIO_ASSETS.find(
    ({id}) => id === "in008-main-continuation",
  );
  assert.equal(continuation?.sha256, "741ba76391efe55455c13a556c5a239abcbb481c8968281b5ec532b478b272a1");
  assert.deepEqual(COURSE_G04_L10_IN_008_PRIVATE_AUDIO_TRACKS.map((track) => ({
    id: track.id,
    language: track.language,
    activation: track.activation,
    timelineBehavior: track.timelineBehavior,
  })), [{
    id: "spanish-host-narration",
    language: "es",
    activation: "user",
    timelineBehavior: "pause-while-playing",
  }]);
});

test("IN008 binds the exact five source handlers, all three answer instances, and blocks legacy reporting", async () => {
  const inventory = await readFile(
    new URL("../../../migrations/course-g04-l10-in-008/audit/scenario-inventory.json", import.meta.url),
    "utf8",
  );
  for (const bodySha256 of [
    "9f18331ad0af36e5216c185443fd67f5a892f6bc9adb0fe72a0e3b312c02198d",
    "36ccb493004144b6e1d0899a3cac75859750e9b046ad76e92b970afa70ac5ebf",
    "eae4d185152e7f61470c9a29a3c1b3037bb5c653723325cc9db4bf3d0cf9e4e8",
    "1df338cab146df889fed18a5d1afbfaa4612ace607c8b84e5a3cebf334a59e8b",
    "d01495fa1517134ea916832054354e9ac10f404bb5320332f8986f0578269ff2",
  ]) assert.match(inventory, new RegExp(bodySha256));
  const source = await readFile(
    new URL("../src/modules/course-g04-l10-in-008.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /data-legacy-reporting="blocked"/);
  assert.match(source, /data-source-instance="AnsBtn1"[\s\S]*?chooseAnswer\("incorrect"\)/);
  assert.match(source, /data-source-instance="AnsBtn2"[\s\S]*?chooseAnswer\("correct"\)/);
  assert.match(source, /data-source-instance="AnsBtn3"[\s\S]*?chooseAnswer\("incorrect"\)/);
  assert.match(source, /data-source-instance="BtnClose"[\s\S]*?closeWrongFeedback/);
  assert.match(source, /pageInteractionStageTargetId/);
  assert.match(source, /<candidate\.Renderer \{\.\.\.props\} frame=\{renderFrame\} state=\{undefined\} \/>/);
});

test("IN008 Replay clears feedback timers, continuation frame, host audio, and memory-only practice state", async () => {
  const source = await readFile(
    new URL("../src/modules/course-g04-l10-in-008.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /const onLessonHostRequestRef = useRef\(props\.onLessonHostRequest\)/);
  assert.match(source, /setContinuationFrame\(1\);[\s\S]*?setPractice\(INITIAL_PRACTICE_STATE\);[\s\S]*?type: "stop-audio"[\s\S]*?type: "reset-practice-feedback"[\s\S]*?\[clearTimers, props\.replay\]/);
  assert.match(source, /CORRECT_CONTINUATION_FIRST_FRAME = 53/);
  assert.match(source, /CORRECT_TERMINAL_FRAME = 129/);
  assert.match(source, /practice\.phase !== "right-continuing" \|\| props\.paused/);
});

test("IN008 private audio assets are exact and the receipt remains acceptance-neutral", async () => {
  for (const [name, bytes, sha256] of exactAssets) {
    const observed = await readFile(new URL(name, assetRoot));
    assert.equal(observed.length, bytes, name);
    assert.equal(createHash("sha256").update(observed).digest("hex"), sha256, name);
  }
  const receipt = JSON.parse(await readFile(receiptUrl, "utf8")) as {
    assets: Array<{id: string; media: {fullEofDecodePassed: boolean}}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.assets.length, 11);
  assert.ok(receipt.assets.every((asset) => asset.media.fullEofDecodePassed));
  assert.ok(Object.values(receipt.acceptanceEffects).every((value) => value === false));
  assert.equal(receipt.strictAcceptanceEffect, "none");
});
