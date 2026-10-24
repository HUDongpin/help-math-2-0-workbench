import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_VB_005_GLOSSARY_TERMS,
  COURSE_G04_L10_VB_005_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_VB_005_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-vb-005";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-vb-005/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-vb-005/audit/private-product-audio-assets.json",
  import.meta.url,
);

test("VB005 exposes five exact typed glossary terms, one EN cue, and one ES host track", () => {
  assert.equal(module.key, "course-g04-l10-vb-005");
  assert.equal(module.maturity, "private-current-js");
  assert.deepEqual(module.lessonHost, {
    capabilities: ["glossary"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_VB_005_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {id: "width", sourceKeyAttribute: "Width", sourceCharacterId: 10, firstFrame: 4},
      {id: "measure", sourceKeyAttribute: "Measure", sourceCharacterId: 11, firstFrame: 4},
      {id: "distance", sourceKeyAttribute: "Distance", sourceCharacterId: 12, firstFrame: 4},
      {id: "side", sourceKeyAttribute: "Side", sourceCharacterId: 13, firstFrame: 4},
      {id: "shape", sourceKeyAttribute: "Shape", sourceCharacterId: 14, firstFrame: 4},
    ],
  );
  assert.deepEqual(module.audioCues, COURSE_G04_L10_VB_005_PRIVATE_AUDIO_CUES);
  assert.deepEqual(module.audioTracks, COURSE_G04_L10_VB_005_PRIVATE_AUDIO_TRACKS);
});

test("VB005 cue is EN-only and Replay rewind restarts it at source frame 4", () => {
  const cue = COURSE_G04_L10_VB_005_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-44",
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
      endFrame: 218,
      durationMs: 17816,
      spokenLanguage: "undetermined",
    },
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_VB_005_PRIVATE_AUDIO_CUES, {
      previousFrame: 217,
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
    resolveAudioCueTransition(COURSE_G04_L10_VB_005_PRIVATE_AUDIO_CUES, {
      previousFrame: 1,
      frame: 4,
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

test("VB005 Spanish track is user-activated and pauses the modern timeline", () => {
  assert.deepEqual(
    COURSE_G04_L10_VB_005_PRIVATE_AUDIO_TRACKS.map((track) => ({
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
        frameDomains: ["sprite-44"],
        timelineBehavior: "pause-while-playing",
        durationMs: 21792,
      },
    ],
  );
});

test("VB005 staged audio bytes and receipt remain exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 88660);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "becb287076eea596cb19cded297f390b7c242706367cf1d2bb42bdb2b7b04208",
  );
  assert.equal(spanish.length, 305088);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "be425939acfbbee527a239ce8a78a798a43d78521ac0b9056ada2074adceb77b",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    calibrationId: string;
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v14");
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
