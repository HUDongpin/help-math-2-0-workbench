import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_VB_002_GLOSSARY_TERMS,
  COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_VB_002_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-vb-002";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-vb-002/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-vb-002/audit/private-product-audio-assets.json",
  import.meta.url,
);

test("VB002 exposes eight exact typed glossary terms, one EN cue, and one ES host track", () => {
  assert.equal(module.key, "course-g04-l10-vb-002");
  assert.equal(module.maturity, "private-current-js");
  assert.deepEqual(module.lessonHost, {
    capabilities: ["glossary"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_VB_002_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {id: "measure", sourceKeyAttribute: "Measure", sourceCharacterId: 10, firstFrame: 4},
      {id: "unit-of-measurement", sourceKeyAttribute: "Unit of measurement", sourceCharacterId: 17, firstFrame: 69},
      {id: "time", sourceKeyAttribute: "Time", sourceCharacterId: 18, firstFrame: 69},
      {id: "width", sourceKeyAttribute: "Width", sourceCharacterId: 19, firstFrame: 69},
      {id: "length", sourceKeyAttribute: "Length", sourceCharacterId: 20, firstFrame: 69},
      {id: "weight", sourceKeyAttribute: "Weight", sourceCharacterId: 21, firstFrame: 69},
      {id: "capacity", sourceKeyAttribute: "Capacity", sourceCharacterId: 22, firstFrame: 69},
      {id: "measurement", sourceKeyAttribute: "Measurement", sourceCharacterId: 31, firstFrame: 174},
    ],
  );
  assert.deepEqual(module.audioCues, COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES);
  assert.deepEqual(module.audioTracks, COURSE_G04_L10_VB_002_PRIVATE_AUDIO_TRACKS);
});

test("VB002 cue is EN-only and Replay rewinds before restarting its frame-4 cue once", () => {
  const cue = COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-84",
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
      frame: 4,
      endFrame: 281,
      durationMs: 23066,
      spokenLanguage: "undetermined",
    },
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES, {
      previousFrame: 280,
      frame: 1,
      fps: 12,
      ...base,
      lang: "en",
    }),
    {start: [], stopIds: ["embedded-stream-0001"]},
  );
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_VB_002_PRIVATE_AUDIO_CUES, {
      previousFrame: 3,
      frame: 4,
      fps: 12,
      ...base,
      lang: "en",
    }),
    {start: [{cue, offsetSeconds: 0}], stopIds: []},
  );
});

test("VB002 Spanish track is user-activated and pauses the modern timeline", () => {
  assert.deepEqual(
    COURSE_G04_L10_VB_002_PRIVATE_AUDIO_TRACKS.map((track) => ({
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
        frameDomains: ["sprite-84"],
        timelineBehavior: "pause-while-playing",
        durationMs: 26880,
      },
    ],
  );
});

test("VB002 staged audio bytes and receipt remain exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 114790);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "d90fda16e08c6886e4bb1f851162c9ffde7747cf2c6ba532d291ed758197ebbf",
  );
  assert.equal(spanish.length, 376320);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "d34075b7bbbf97a731f8fe133b4dea0304f5d69c1bfc825398ec43ff71244548",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    calibrationId: string;
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v18");
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
