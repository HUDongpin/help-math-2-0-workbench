import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_RW_004_GLOSSARY_TERMS,
  COURSE_G04_L10_RW_004_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_RW_004_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-rw-004";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-rw-004/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-rw-004/audit/private-product-audio-assets.json",
  import.meta.url,
);

test("RW004 exposes three exact typed glossary terms, one EN cue, and one ES host track", () => {
  assert.equal(module.key, "course-g04-l10-rw-004");
  assert.equal(module.maturity, "private-current-js");
  assert.deepEqual(module.lessonHost, {
    capabilities: ["glossary"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_RW_004_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {id: "perimeter", sourceKeyAttribute: "Perimeter", sourceCharacterId: 16, firstFrame: 136},
      {id: "foot-feet", sourceKeyAttribute: "Foot/Feet", sourceCharacterId: 67, firstFrame: 751},
      {id: "area", sourceKeyAttribute: "Area", sourceCharacterId: 72, firstFrame: 818},
    ],
  );
  assert.deepEqual(module.audioCues, COURSE_G04_L10_RW_004_PRIVATE_AUDIO_CUES);
  assert.deepEqual(module.audioTracks, COURSE_G04_L10_RW_004_PRIVATE_AUDIO_TRACKS);
});

test("RW004 cue is EN-only and Replay rewind restarts it at source frame 16", () => {
  const cue = COURSE_G04_L10_RW_004_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-109",
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
      frame: 16,
      endFrame: 1326,
      durationMs: 109113,
      spokenLanguage: "undetermined",
    },
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_RW_004_PRIVATE_AUDIO_CUES, {
      previousFrame: 1325,
      frame: 1,
      fps: 12,
      ...base,
      lang: "en",
    }),
    {
      start: [],
      stopIds: ["embedded-stream-0001"],
    },
  );
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_RW_004_PRIVATE_AUDIO_CUES, {
      previousFrame: 1,
      frame: 16,
      fps: 12,
      ...base,
      lang: "en",
    }),
    {
      start: [{cue, offsetSeconds: 0}],
      stopIds: [],
    },
  );
});

test("RW004 Spanish track is user-activated and pauses the modern timeline", () => {
  assert.deepEqual(
    COURSE_G04_L10_RW_004_PRIVATE_AUDIO_TRACKS.map((track) => ({
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
        frameDomains: ["sprite-109"],
        timelineBehavior: "pause-while-playing",
        durationMs: 28056,
      },
    ],
  );
});

test("RW004 staged audio bytes and receipt remain exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 543010);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "92a83e94c3947bcaf30fcc1e1bc2c70625bed4eefd59d5757604073e3f9919d2",
  );
  assert.equal(spanish.length, 392784);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "1b50f6e77e0db24fd34821b330b1838c0b91d392d6a0bbacd733a8494073f535",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    calibrationId: string;
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v10");
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
