import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext} from "../src/runtime";
import module, {
  COURSE_G04_L10_VB_007_GLOSSARY_TERMS,
  COURSE_G04_L10_VB_007_INTERACTIVE_AUDIO_ASSETS,
  COURSE_G04_L10_VB_007_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_VB_007_PRIVATE_AUDIO_TRACKS,
  COURSE_G04_L10_VB_007_RIGHT_BRANCHES,
  COURSE_G04_L10_VB_007_SOURCE,
  COURSE_G04_L10_VB_007_WRONG_BRANCHES,
  COURSE_G04_L10_VB_007_WRONG_FEEDBACK,
  resolveCourseG04L10Vb007FeedbackBranch,
} from "../src/modules/course-g04-l10-vb-007";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-vb-007/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-vb-007/audit/private-product-audio-assets.json",
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
  ["main-timeline.mp3", 50050, "3ac4c7a2e3d153a3f39427b519de2bf3d87f5d4873fcd9d2c4a655ed6c7aabd6"],
  ["main-continuation.mp3", 28600, "55aea0a63242d214a9b5b828347236971fc7083334da945d45e31507f2cb56b2"],
  ["spanish-host-narration.mp3", 159600, "af50406afceff38f9395907b0b059dbe980f60e5b14eead7d6e3832e51b10396"],
] as const);

test("VB007 is one private interactive-understood page with a bounded real host contract", () => {
  assert.equal(module.key, "course-g04-l10-vb-007");
  assert.equal(module.maturity, "private-current-js");
  assert.equal(module.playbackEndFrame, 61);
  assert.deepEqual(module.lessonHost, {
    capabilities: ["audio", "glossary", "practice-feedback"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.equal(COURSE_G04_L10_VB_007_SOURCE.registered, true);
  assert.equal(COURSE_G04_L10_VB_007_SOURCE.controlsEnabled, true);
  assert.deepEqual(
    COURSE_G04_L10_VB_007_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      sourceFirstPlacementFrame: term.sourceFirstPlacementFrame,
      productFirstVisibleFrame: term.productFirstVisibleFrame,
    })),
    [
      {id: "rectangle", sourceKeyAttribute: "Rectangle", sourceCharacterId: 10, sourceFirstPlacementFrame: 1, productFirstVisibleFrame: 61},
      {id: "width", sourceKeyAttribute: "Width", sourceCharacterId: 9, sourceFirstPlacementFrame: 1, productFirstVisibleFrame: 61},
    ],
  );
  assert.deepEqual(COURSE_G04_L10_VB_007_WRONG_FEEDBACK, {
    sourceText: "The width is usually the shorter measurement. Try again.",
    glossaryEntryIds: ["width", "measurement"],
  });
});

test("VB007 exhausts exactly the shipped shell random(3) and random(4) ranges", () => {
  assert.deepEqual(
    COURSE_G04_L10_VB_007_WRONG_BRANCHES.map((branch) => [branch.branchIndex, branch.instanceName, branch.sourceTimelineId, branch.frameCount]),
    [
      [1, "Mc_Wrong_Feed1", "sprite-73", 28],
      [2, "Mc_Wrong_Feed2", "sprite-84", 28],
      [3, "Mc_Wrong_Feed3", "sprite-96", 31],
    ],
  );
  assert.deepEqual(
    COURSE_G04_L10_VB_007_RIGHT_BRANCHES.map((branch) => [branch.branchIndex, branch.instanceName, branch.sourceTimelineId, branch.frameCount]),
    [
      [1, "Mc_Right_Feed1", "sprite-172", 28],
      [2, "Mc_Right_Feed2", "sprite-122", 31],
      [3, "Mc_Right_Feed3", "sprite-139", 28],
      [4, "Mc_Right_Feed4", "sprite-160", 33],
    ],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6].map((seed) => resolveCourseG04L10Vb007FeedbackBranch(seed, "incorrect").branchIndex),
    [1, 2, 3, 1, 2, 3, 1],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7].map((seed) => resolveCourseG04L10Vb007FeedbackBranch(seed, "correct").branchIndex),
    [1, 2, 3, 4, 1, 2, 3, 4],
  );
  assert.equal(COURSE_G04_L10_VB_007_WRONG_BRANCHES.some(({sourceTimelineId}) => sourceTimelineId === "sprite-45"), false);
  assert.equal(COURSE_G04_L10_VB_007_RIGHT_BRANCHES.some(({sourceTimelineId}) => sourceTimelineId === "sprite-203"), false);
});

test("VB007 main audio stops at frame 61 and the correct branch owns an exact 62-130 continuation", () => {
  assert.equal(COURSE_G04_L10_VB_007_PRIVATE_AUDIO_CUES.length, 1);
  const cue = COURSE_G04_L10_VB_007_PRIVATE_AUDIO_CUES[0]!;
  assert.equal(cue.frame, 10);
  assert.equal(cue.endFrame, 61);
  assert.equal(cue.frameDomain, "sprite-204");
  assert.equal(audioCueMatchesContext(cue, {
    frameDomain: "sprite-204",
    lang: "en",
    scenario: "source-static-frame",
    seed: 0,
  }), true);
  const continuation = COURSE_G04_L10_VB_007_INTERACTIVE_AUDIO_ASSETS.find(
    ({id}) => id === "vb007-main-continuation",
  );
  assert.equal(continuation?.sha256, "55aea0a63242d214a9b5b828347236971fc7083334da945d45e31507f2cb56b2");
  assert.deepEqual(COURSE_G04_L10_VB_007_PRIVATE_AUDIO_TRACKS.map((track) => ({
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

test("VB007 binds the exact five source handlers and blocks legacy reporting", async () => {
  const inventory = await readFile(
    new URL("../../../migrations/course-g04-l10-vb-007/audit/scenario-inventory.json", import.meta.url),
    "utf8",
  );
  for (const bodySha256 of [
    "ecbceb5c1144eefb2814285b93466ef47fadf02b4b374aa1d6b6f3e5089d5bb6",
    "f3fb37e82ec9910fb04208a167813af1a5a9b9ac17bc225b768f5f088bf9f8dc",
    "f26c408bffe996373503e28b4b0bf5d8095483cb68b885f2bab3246caa9fb8a7",
    "eae4d185152e7f61470c9a29a3c1b3037bb5c653723325cc9db4bf3d0cf9e4e8",
    "d01495fa1517134ea916832054354e9ac10f404bb5320332f8986f0578269ff2",
  ]) assert.match(inventory, new RegExp(bodySha256));
  const source = await readFile(
    new URL("../src/modules/course-g04-l10-vb-007.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /data-legacy-reporting="blocked"/);
  assert.match(source, /data-source-instance="AnsBtn1"[\s\S]*?chooseAnswer\("incorrect"\)/);
  assert.match(source, /data-source-instance="AnsBtn2"[\s\S]*?chooseAnswer\("correct"\)/);
  assert.match(source, /data-source-instance="BtnClose"[\s\S]*?closeWrongFeedback/);
  assert.match(source, /pageInteractionStageTargetId/);
  assert.match(source, /<candidate\.Renderer \{\.\.\.props\} frame=\{renderFrame\} state=\{undefined\} \/>/);
});

test("VB007 Replay clears feedback timers, continuation frame, host audio, and memory-only practice state", async () => {
  const source = await readFile(
    new URL("../src/modules/course-g04-l10-vb-007.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /const onLessonHostRequestRef = useRef\(props\.onLessonHostRequest\)/);
  assert.match(source, /setContinuationFrame\(1\);[\s\S]*?setPractice\(INITIAL_PRACTICE_STATE\);[\s\S]*?type: "stop-audio"[\s\S]*?type: "reset-practice-feedback"[\s\S]*?\[clearTimers, props\.replay\]/);
  assert.match(source, /CORRECT_CONTINUATION_FIRST_FRAME = 62/);
  assert.match(source, /CORRECT_TERMINAL_FRAME = 130/);
  assert.match(source, /practice\.phase !== "right-continuing" \|\| props\.paused/);
});

test("VB007 private audio assets are exact and the receipt remains acceptance-neutral", async () => {
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
