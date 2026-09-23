import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_TS_002_GLOSSARY_TERMS,
  COURSE_G04_L10_TS_002_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_TS_002_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-ts-002";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-ts-002/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-ts-002/audit/private-product-audio-assets.json",
  import.meta.url,
);

test("TS002 exposes three typed glossary terms, one EN cue, and one ES host track", () => {
  assert.equal(module.key, "course-g04-l10-ts-002");
  assert.equal(module.maturity, "private-current-js");
  assert.deepEqual(module.lessonHost, {
    capabilities: ["glossary"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_TS_002_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {id: "restate", sourceKeyAttribute: "Restate", sourceCharacterId: 16, firstFrame: 93},
      {id: "question", sourceKeyAttribute: "question", sourceCharacterId: 17, firstFrame: 93},
      {id: "problem", sourceKeyAttribute: "problem", sourceCharacterId: 23, firstFrame: 142},
    ],
  );
  assert.deepEqual(module.audioCues, COURSE_G04_L10_TS_002_PRIVATE_AUDIO_CUES);
  assert.deepEqual(module.audioTracks, COURSE_G04_L10_TS_002_PRIVATE_AUDIO_TRACKS);
});

test("TS002 cue is EN-only and Replay rewind restarts it at source frame 1", () => {
  const cue = COURSE_G04_L10_TS_002_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-29",
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
      endFrame: 325,
      durationMs: 26984,
      spokenLanguage: "undetermined",
    },
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_TS_002_PRIVATE_AUDIO_CUES, {
      previousFrame: 324,
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

test("TS002 Spanish track is user-activated and pauses the modern timeline", () => {
  assert.deepEqual(
    COURSE_G04_L10_TS_002_PRIVATE_AUDIO_TRACKS.map((track) => ({
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
        frameDomains: ["sprite-29"],
        timelineBehavior: "pause-while-playing",
        durationMs: 20592,
      },
    ],
  );
});

test("TS002 staged audio bytes and receipt remain exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 134290);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "fcec76dfe76c74823aa819fce5e08f7f7f322a014dc38d7561f39a688534a556",
  );
  assert.equal(spanish.length, 288288);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "148a963e1d0e87136cc65b36a73d97625170f53865842c6a12cda2a94c7df576",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    calibrationId: string;
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v8");
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
