import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_VB_004_GLOSSARY_TERMS,
  COURSE_G04_L10_VB_004_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_VB_004_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-vb-004";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-vb-004/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-vb-004/audit/private-product-audio-assets.json",
  import.meta.url,
);

test("VB004 exposes three typed glossary terms, one EN cue, and one ES host track", () => {
  assert.equal(module.key, "course-g04-l10-vb-004");
  assert.equal(module.maturity, "private-current-js");
  assert.deepEqual(module.lessonHost, {
    capabilities: ["glossary"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_VB_004_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {id: "length", sourceKeyAttribute: "Length", sourceCharacterId: 10, firstFrame: 4},
      {id: "measure", sourceKeyAttribute: "Measure", sourceCharacterId: 11, firstFrame: 4},
      {id: "distance", sourceKeyAttribute: "Distance", sourceCharacterId: 12, firstFrame: 4},
    ],
  );
  assert.deepEqual(module.audioCues, COURSE_G04_L10_VB_004_PRIVATE_AUDIO_CUES);
  assert.deepEqual(module.audioTracks, COURSE_G04_L10_VB_004_PRIVATE_AUDIO_TRACKS);
});

test("VB004 cue is EN-only and Replay rewind restarts it at source frame 4", () => {
  const cue = COURSE_G04_L10_VB_004_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-45",
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
      endFrame: 214,
      durationMs: 17476,
      spokenLanguage: "undetermined",
    },
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_VB_004_PRIVATE_AUDIO_CUES, {
      previousFrame: 213,
      frame: 4,
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

test("VB004 Spanish track is user-activated and pauses the modern timeline", () => {
  assert.deepEqual(
    COURSE_G04_L10_VB_004_PRIVATE_AUDIO_TRACKS.map((track) => ({
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
        frameDomains: ["sprite-45"],
        timelineBehavior: "pause-while-playing",
        durationMs: 21504,
      },
    ],
  );
});

test("VB004 staged audio bytes and receipt remain exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 86970);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "71710f405912d55cf4ac1dcf1c39d5b782cd7a4cb987f649c0a9de4f2b1a672d",
  );
  assert.equal(spanish.length, 301056);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "98aeaa8f5d7f1352f215e36c5bc1d8094b9ed761281ba7d53e425eb95e35ee26",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    calibrationId: string;
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v6");
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
