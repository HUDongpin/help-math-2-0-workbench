import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  audioCueMatchesContext,
  frameAtElapsedMs,
  resolveAudioCueTransition,
} from "../src/runtime";
import module, {
  COURSE_G04_L10_IN_009_GLOSSARY_TERMS,
  COURSE_G04_L10_IN_009_MOVIE,
  COURSE_G04_L10_IN_009_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_IN_009_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-in-009";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-in-009/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-in-009/audit/private-product-audio-assets.json",
  import.meta.url,
);
const moduleSourceUrl = new URL(
  "../src/modules/course-g04-l10-in-009.tsx",
  import.meta.url,
);
const modernHostSourceUrl = new URL(
  "../../../apps/web/components/descriptor-driven-whole-lesson-player.tsx",
  import.meta.url,
);

test("IN009 exposes exactly five source glossary handlers and no answer/random surface", async () => {
  assert.equal(module.key, "course-g04-l10-in-009");
  assert.equal(module.maturity, "private-current-js");
  assert.equal(module.playbackMode, "loop");
  assert.deepEqual(module.lessonHost, {
    capabilities: ["glossary"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_IN_009_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {id: "area", sourceKeyAttribute: "Area", sourceCharacterId: 10, firstFrame: 1},
      {id: "surface", sourceKeyAttribute: "Surface", sourceCharacterId: 11, firstFrame: 1},
      {id: "shape", sourceKeyAttribute: "Shape", sourceCharacterId: 12, firstFrame: 1},
      {id: "length", sourceKeyAttribute: "Length", sourceCharacterId: 50, firstFrame: 167},
      {id: "width", sourceKeyAttribute: "Width", sourceCharacterId: 51, firstFrame: 167},
    ],
  );
  const source = await readFile(moduleSourceUrl, "utf8");
  assert.doesNotMatch(source, /Math\.random|record-practice-feedback|answer/i);
  assert.match(source, /g4-l10-candidate-to-product-v29/);
  assert.match(source, /createPrivateSourceStaticGlossaryCandidate/);
});

test("IN009 reaches all 953 child frames and loops from 953 to 1", () => {
  assert.equal(COURSE_G04_L10_IN_009_MOVIE.frameCount, 953);
  assert.equal(COURSE_G04_L10_IN_009_MOVIE.fps, 12);
  assert.equal(
    frameAtElapsedMs((952 * 1000) / 12, COURSE_G04_L10_IN_009_MOVIE, "loop"),
    953,
  );
  assert.equal(
    frameAtElapsedMs((953 * 1000) / 12, COURSE_G04_L10_IN_009_MOVIE, "loop"),
    1,
  );
  assert.equal(
    frameAtElapsedMs((954 * 1000) / 12, COURSE_G04_L10_IN_009_MOVIE, "loop"),
    2,
  );
});

test("IN009 EN cue stops and restarts on the 953-to-1 loop rewind", () => {
  const cue = COURSE_G04_L10_IN_009_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-89",
    scenario: "source-static-frame",
    seed: 0,
  } as const;
  assert.deepEqual(
    {
      frame: cue.frame,
      endFrame: cue.endFrame,
      durationMs: cue.durationMs,
      spokenLanguage: cue.spokenLanguage,
    },
    {
      frame: 1,
      endFrame: 954,
      durationMs: 79386,
      spokenLanguage: "undetermined",
    },
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_IN_009_PRIVATE_AUDIO_CUES, {
      previousFrame: 953,
      frame: 1,
      fps: 12,
      ...base,
      lang: "en",
    }),
    {
      start: [{cue, offsetSeconds: 0}],
      stopIds: ["embedded-stream-0001"],
    },
  );
});

test("IN009 Spanish track remains user-activated and pauses the modern timeline", () => {
  assert.deepEqual(
    COURSE_G04_L10_IN_009_PRIVATE_AUDIO_TRACKS.map((track) => ({
      id: track.id,
      language: track.language,
      activation: track.activation,
      visibleWhen: track.visibleWhen,
      frameDomains: track.frameDomains,
      timelineBehavior: track.timelineBehavior,
      durationMs: track.durationMs,
    })),
    [
      {
        id: "spanish-host-narration",
        language: "es",
        activation: "user",
        visibleWhen: ["es"],
        frameDomains: ["sprite-89"],
        timelineBehavior: "pause-while-playing",
        durationMs: 43824,
      },
    ],
  );
});

test("IN009 staged audio bytes and receipt remain exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 395070);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "2e124e6fc4fff6b6ca4de03cedb7f6df4e9d3d0ff8436cedb777a71c64cf0334",
  );
  assert.equal(spanish.length, 613536);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "a845df10e8c1e754a481f3c3ef1e7314ad9c9a60e1106c6b1c43e16b21ace4d6",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    calibrationId: string;
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v29");
  assert.equal(
    receipt.status,
    "materialized-and-full-eof-decoded-listening-pending",
  );
  assert.deepEqual(
    receipt.assets.map(({routeLanguage, spokenLanguage}) => ({
      routeLanguage,
      spokenLanguage,
    })),
    [
      {routeLanguage: "en", spokenLanguage: "undetermined"},
      {routeLanguage: "es", spokenLanguage: "not-established-by-listening"},
    ],
  );
  assert.ok(Object.values(receipt.acceptanceEffects).every((value) => !value));
  assert.equal(receipt.strictAcceptanceEffect, "none");
});

test("modern My Lesson Replay remounts IN009 and resets timeline/audio requests", async () => {
  const host = await readFile(modernHostSourceUrl, "utf8");
  assert.match(
    host,
    /const replayCurrentPage = \(\) => \{[\s\S]*?setRuntimeEpoch\(\(value\) => value \+ 1\);[\s\S]*?setPaused\(false\);[\s\S]*?setPlaybackState\(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE\);[\s\S]*?setSeekRequest\(null\);[\s\S]*?setNarrationRequest\(null\);/,
  );
  assert.match(host, /key=\{`\$\{currentPage\.animationId\}:\$\{runtimeEpoch\}`\}/);
});
