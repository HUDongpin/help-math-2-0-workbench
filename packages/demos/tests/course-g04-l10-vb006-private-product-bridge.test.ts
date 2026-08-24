import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_VB_006_GLOSSARY_TERMS,
  COURSE_G04_L10_VB_006_INTERACTIVE_AUDIO_ASSETS,
  COURSE_G04_L10_VB_006_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_VB_006_PRIVATE_AUDIO_TRACKS,
  COURSE_G04_L10_VB_006_RIGHT_BRANCHES,
  COURSE_G04_L10_VB_006_SOURCE,
  COURSE_G04_L10_VB_006_WRONG_BRANCHES,
  COURSE_G04_L10_VB_006_WRONG_FEEDBACK,
  resolveCourseG04L10Vb006FeedbackBranch,
} from "../src/modules/course-g04-l10-vb-006";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-vb-006/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-vb-006/audit/private-product-audio-assets.json",
  import.meta.url,
);

const exactAssets = Object.freeze([
  ["feedback-close.mp3", 1950, "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38"],
  ["wrong-1.mp3", 11570, "187a32ba065a2534843eaef91e70bd2491595f9f00b9598ea15be9a843a24d3d"],
  ["wrong-2.mp3", 10270, "1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e"],
  ["wrong-3.mp3", 10660, "f15c62e4c4bb0fcedbead0d00ae87d569352976cf080edee4a684098cf05017b"],
  ["right-1.mp3", 11050, "b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19"],
  ["right-2.mp3", 12350, "7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11"],
  ["right-3.mp3", 11050, "529ef71f4768ba9c0f830a67547066e4b8b20091bc8e3cd0782e1fbdfbb64085"],
  ["right-4.mp3", 10660, "18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec"],
  ["main-timeline.mp3", 39650, "1bb3a635e39ff8c858f8f3ba9cc8b174bbd2fb6dbc612504140acbb72553b384"],
  ["main-continuation.mp3", 17420, "e643ab8bab5713139c7ffaf39afcfc6f8242b3a9772c5e6f8bfbc0bed1d7258f"],
  ["spanish-host-narration.mp3", 154224, "55b13dade3eae456179c0fefb1d6ca8cc10dd1be583a445e2ba51fdbb9efd2de"],
] as const);

test("VB006 is one private interactive-understood page with a bounded real host contract", () => {
  assert.equal(module.key, "course-g04-l10-vb-006");
  assert.equal(module.maturity, "private-current-js");
  assert.equal(module.playbackEndFrame, 62);
  assert.deepEqual(module.lessonHost, {
    capabilities: ["audio", "glossary", "practice-feedback"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.equal(COURSE_G04_L10_VB_006_SOURCE.registered, true);
  assert.equal(COURSE_G04_L10_VB_006_SOURCE.controlsEnabled, true);
  assert.deepEqual(
    COURSE_G04_L10_VB_006_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      sourceFirstPlacementFrame: term.sourceFirstPlacementFrame,
      productFirstVisibleFrame: term.productFirstVisibleFrame,
    })),
    [
      {id: "rectangle", sourceKeyAttribute: "Rectangle", sourceCharacterId: 10, sourceFirstPlacementFrame: 1, productFirstVisibleFrame: 62},
      {id: "length", sourceKeyAttribute: "Length", sourceCharacterId: 9, sourceFirstPlacementFrame: 1, productFirstVisibleFrame: 62},
    ],
  );
  assert.deepEqual(COURSE_G04_L10_VB_006_WRONG_FEEDBACK, {
    sourceText: "The length is usually the longer measurement. Try again.",
    glossaryEntryIds: ["length", "measurement"],
  });
});

test("VB006 exhausts exactly the shipped shell random(3) and random(4) ranges", () => {
  assert.deepEqual(
    COURSE_G04_L10_VB_006_WRONG_BRANCHES.map((branch) => [branch.branchIndex, branch.instanceName, branch.sourceTimelineId, branch.frameCount]),
    [
      [1, "Mc_Wrong_Feed1", "sprite-85", 29],
      [2, "Mc_Wrong_Feed2", "sprite-41", 28],
      [3, "Mc_Wrong_Feed3", "sprite-59", 27],
    ],
  );
  assert.deepEqual(
    COURSE_G04_L10_VB_006_RIGHT_BRANCHES.map((branch) => [branch.branchIndex, branch.instanceName, branch.sourceTimelineId, branch.frameCount]),
    [
      [1, "Mc_Right_Feed1", "sprite-119", 27],
      [2, "Mc_Right_Feed2", "sprite-173", 32],
      [3, "Mc_Right_Feed3", "sprite-159", 28],
      [4, "Mc_Right_Feed4", "sprite-131", 27],
    ],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6].map((seed) => resolveCourseG04L10Vb006FeedbackBranch(seed, "incorrect").branchIndex),
    [1, 2, 3, 1, 2, 3, 1],
  );
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7].map((seed) => resolveCourseG04L10Vb006FeedbackBranch(seed, "correct").branchIndex),
    [1, 2, 3, 4, 1, 2, 3, 4],
  );
  assert.equal(COURSE_G04_L10_VB_006_WRONG_BRANCHES.some(({sourceTimelineId}) => sourceTimelineId === "sprite-73"), false);
  assert.equal(COURSE_G04_L10_VB_006_RIGHT_BRANCHES.some(({sourceTimelineId}) => sourceTimelineId === "sprite-212"), false);
});

test("VB006 main audio stops at frame 62 and the correct branch owns an exact 63-104 continuation", () => {
  assert.equal(COURSE_G04_L10_VB_006_PRIVATE_AUDIO_CUES.length, 1);
  const cue = COURSE_G04_L10_VB_006_PRIVATE_AUDIO_CUES[0]!;
  assert.equal(cue.frame, 9);
  assert.equal(cue.endFrame, 62);
  assert.equal(cue.frameDomain, "sprite-213");
  assert.equal(audioCueMatchesContext(cue, {
    frameDomain: "sprite-213",
    lang: "en",
    scenario: "source-static-frame",
    seed: 0,
  }), true);
  assert.deepEqual(resolveAudioCueTransition(COURSE_G04_L10_VB_006_PRIVATE_AUDIO_CUES, {
    previousFrame: 61,
    frame: 62,
    fps: 12,
    frameDomain: "sprite-213",
    scenario: "source-static-frame",
    seed: 0,
    lang: "en",
  }), {start: [], stopIds: ["vb006-main"]});
  const continuation = COURSE_G04_L10_VB_006_INTERACTIVE_AUDIO_ASSETS.find(
    ({id}) => id === "vb006-main-continuation",
  );
  assert.equal(continuation?.sha256, "e643ab8bab5713139c7ffaf39afcfc6f8242b3a9772c5e6f8bfbc0bed1d7258f");
  assert.deepEqual(COURSE_G04_L10_VB_006_PRIVATE_AUDIO_TRACKS.map((track) => ({
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

test("VB006 binds the exact five source handlers and blocks legacy reporting", async () => {
  const inventory = await readFile(
    new URL("../../../migrations/course-g04-l10-vb-006/audit/scenario-inventory.json", import.meta.url),
    "utf8",
  );
  for (const bodySha256 of [
    "ecbceb5c1144eefb2814285b93466ef47fadf02b4b374aa1d6b6f3e5089d5bb6",
    "d4481ebffa6b83402415f08234e1113d51a51c924f3fb97529b82058888bcf14",
    "b4aa857c8e5164048d6ef6b85e89a798074871cd0fa48e023e62c4a919e27c36",
    "eae4d185152e7f61470c9a29a3c1b3037bb5c653723325cc9db4bf3d0cf9e4e8",
    "d01495fa1517134ea916832054354e9ac10f404bb5320332f8986f0578269ff2",
  ]) assert.match(inventory, new RegExp(bodySha256));
  const source = await readFile(
    new URL("../src/modules/course-g04-l10-vb-006.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /data-legacy-reporting="blocked"/);
  assert.match(source, /data-source-instance="AnsBtn2"[\s\S]*?chooseAnswer\("incorrect"\)/);
  assert.match(source, /data-source-instance="AnsBtn1"[\s\S]*?chooseAnswer\("correct"\)/);
  assert.match(source, /data-source-instance="BtnClose"[\s\S]*?closeWrongFeedback/);
  assert.match(source, /pageInteractionStageTargetId/);
  assert.match(source, /<candidate\.Renderer \{\.\.\.props\} frame=\{renderFrame\} state=\{undefined\} \/>/);
});

test("VB006 Replay clears feedback timers, continuation frame, host audio, and memory-only practice state", async () => {
  const source = await readFile(
    new URL("../src/modules/course-g04-l10-vb-006.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /const onLessonHostRequestRef = useRef\(props\.onLessonHostRequest\)/);
  assert.match(source, /setContinuationFrame\(1\);[\s\S]*?setPractice\(INITIAL_PRACTICE_STATE\);[\s\S]*?type: "stop-audio"[\s\S]*?type: "reset-practice-feedback"[\s\S]*?\[clearTimers, props\.replay\]/);
  assert.match(source, /CORRECT_CONTINUATION_FIRST_FRAME = 63/);
  assert.match(source, /CORRECT_TERMINAL_FRAME = 104/);
  assert.match(source, /practice\.phase !== "right-continuing" \|\| props\.paused/);
});

test("VB006 private audio assets are exact and the receipt remains acceptance-neutral", async () => {
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
