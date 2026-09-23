import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_VB_008_GLOSSARY_TERMS,
  COURSE_G04_L10_VB_008_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_VB_008_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-vb-008";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-vb-008/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-vb-008/audit/private-product-audio-assets.json",
  import.meta.url,
);

test("VB008 exposes eight exact typed glossary terms, one EN cue, and one ES host track", () => {
  assert.equal(module.key, "course-g04-l10-vb-008");
  assert.equal(module.maturity, "private-current-js");
  assert.deepEqual(module.lessonHost, {
    capabilities: ["glossary"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_VB_008_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {id: "perimeter", sourceKeyAttribute: "Perimeter", sourceCharacterId: 10, firstFrame: 4},
      {id: "distance", sourceKeyAttribute: "Distance", sourceCharacterId: 11, firstFrame: 4},
      {id: "around", sourceKeyAttribute: "Around", sourceCharacterId: 12, firstFrame: 4},
      {id: "shape", sourceKeyAttribute: "Shape", sourceCharacterId: 13, firstFrame: 4},
      {id: "rectangle", sourceKeyAttribute: "Rectangle", sourceCharacterId: 50, firstFrame: 265},
      {id: "unit-of-measurement", sourceKeyAttribute: "Unit of measurement", sourceCharacterId: 53, firstFrame: 329},
      {id: "measure", sourceKeyAttribute: "Measure", sourceCharacterId: 59, firstFrame: 383},
      {id: "side", sourceKeyAttribute: "Side", sourceCharacterId: 60, firstFrame: 383},
    ],
  );
  assert.deepEqual(module.audioCues, COURSE_G04_L10_VB_008_PRIVATE_AUDIO_CUES);
  assert.deepEqual(module.audioTracks, COURSE_G04_L10_VB_008_PRIVATE_AUDIO_TRACKS);
});

test("VB008 cue is EN-only and Replay rewinds before restarting its frame-5 cue once", () => {
  const cue = COURSE_G04_L10_VB_008_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-62",
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
      frame: 5,
      endFrame: 414,
      durationMs: 24059,
      spokenLanguage: "undetermined",
    },
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_VB_008_PRIVATE_AUDIO_CUES, {
      previousFrame: 413,
      frame: 1,
      fps: 12,
      ...base,
      lang: "en",
    }),
    {start: [], stopIds: ["embedded-stream-0001"]},
  );
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_VB_008_PRIVATE_AUDIO_CUES, {
      previousFrame: 4,
      frame: 5,
      fps: 12,
      ...base,
      lang: "en",
    }),
    {start: [{cue, offsetSeconds: 0}], stopIds: []},
  );
});

test("VB008 Spanish track is user-activated and pauses the modern timeline", () => {
  assert.deepEqual(
    COURSE_G04_L10_VB_008_PRIVATE_AUDIO_TRACKS.map((track) => ({
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
        frameDomains: ["sprite-62"],
        timelineBehavior: "pause-while-playing",
        durationMs: 28368,
      },
    ],
  );
});

test("VB008 staged audio bytes and receipt remain exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 119730);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "905f086003308e1769b8e4ab30a0fcaf9483fe73d56620c32f05dfc3ffcb6ab7",
  );
  assert.equal(spanish.length, 397152);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "411a95e4132bda8195b03ef0617443895c14c279992c8421ea70e48f86048e4b",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    calibrationId: string;
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v20");
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
