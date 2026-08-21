import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_TS_005_GLOSSARY_TERMS,
  COURSE_G04_L10_TS_005_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_TS_005_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-ts-005";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-ts-005/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-ts-005/audit/private-product-audio-assets.json",
  import.meta.url,
);

test("TS005 exposes five exact typed glossary terms, one EN cue, and one ES host track", () => {
  assert.equal(module.key, "course-g04-l10-ts-005");
  assert.equal(module.maturity, "private-current-js");
  assert.deepEqual(module.lessonHost, {
    capabilities: ["glossary"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_TS_005_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {id: "strategy", sourceKeyAttribute: "strategy", sourceCharacterId: 22, firstFrame: 106},
      {id: "equation", sourceKeyAttribute: "equation", sourceCharacterId: 26, firstFrame: 144},
      {id: "pattern", sourceKeyAttribute: "Pattern", sourceCharacterId: 27, firstFrame: 144},
      {id: "simple-simpler-simplest", sourceKeyAttribute: "Simple / Simpler / Simplest", sourceCharacterId: 28, firstFrame: 144},
      {id: "table", sourceKeyAttribute: "Table", sourceCharacterId: 29, firstFrame: 144},
    ],
  );
  assert.deepEqual(module.audioCues, COURSE_G04_L10_TS_005_PRIVATE_AUDIO_CUES);
  assert.deepEqual(module.audioTracks, COURSE_G04_L10_TS_005_PRIVATE_AUDIO_TRACKS);
});

test("TS005 cue is EN-only and Replay rewinds, stops, and restarts its frame-1 cue", () => {
  const cue = COURSE_G04_L10_TS_005_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-32",
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
      endFrame: 235,
      durationMs: 19461,
      spokenLanguage: "undetermined",
    },
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_TS_005_PRIVATE_AUDIO_CUES, {
      previousFrame: 234,
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

test("TS005 Spanish track is user-activated and pauses the modern timeline", () => {
  assert.deepEqual(
    COURSE_G04_L10_TS_005_PRIVATE_AUDIO_TRACKS.map((track) => ({
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
        frameDomains: ["sprite-32"],
        timelineBehavior: "pause-while-playing",
        durationMs: 15240,
      },
    ],
  );
});

test("TS005 staged audio bytes and receipt remain exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 96850);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "8fcd79a8d7ba008b1f8846485c14f5c6e9277dc2dae07a3decf92e903025680d",
  );
  assert.equal(spanish.length, 213360);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "153f3ec94840fbc958e67c5209abdc25e403c0afe9424529e80343befd8c3c6c",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    calibrationId: string;
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v16");
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
