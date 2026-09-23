import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_VB_011_GLOSSARY_TERMS,
  COURSE_G04_L10_VB_011_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_VB_011_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-vb-011";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-vb-011/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-vb-011/audit/private-product-audio-assets.json",
  import.meta.url,
);

test("VB011 exposes two typed glossary terms, one EN cue, and one ES host track", () => {
  assert.equal(module.key, "course-g04-l10-vb-011");
  assert.equal(module.maturity, "private-current-js");
  assert.deepEqual(module.lessonHost, {
    capabilities: ["glossary"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_VB_011_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {
        id: "formula",
        sourceKeyAttribute: "Formula",
        sourceCharacterId: 10,
        firstFrame: 4,
      },
      {
        id: "equation",
        sourceKeyAttribute: "Equation",
        sourceCharacterId: 11,
        firstFrame: 4,
      },
    ],
  );
  assert.deepEqual(module.audioCues, COURSE_G04_L10_VB_011_PRIVATE_AUDIO_CUES);
  assert.deepEqual(module.audioTracks, COURSE_G04_L10_VB_011_PRIVATE_AUDIO_TRACKS);
});

test("VB011 cue is EN-only and Replay rewind restarts it at source frame 2", () => {
  const cue = COURSE_G04_L10_VB_011_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-31",
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
      frame: 2,
      endFrame: 154,
      durationMs: 12643,
      spokenLanguage: "undetermined",
    },
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_VB_011_PRIVATE_AUDIO_CUES, {
      previousFrame: 153,
      frame: 2,
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

test("VB011 Spanish track is user-activated and pauses the modern timeline", () => {
  assert.deepEqual(
    COURSE_G04_L10_VB_011_PRIVATE_AUDIO_TRACKS.map((track) => ({
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
        frameDomains: ["sprite-31"],
        timelineBehavior: "pause-while-playing",
        durationMs: 13368,
      },
    ],
  );
});

test("VB011 staged audio bytes and receipt remain exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 62920);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "ab8c00ecbf6c90d284a295fee5a785fc7e3478490382fcda0b7064be1bfd1e66",
  );
  assert.equal(spanish.length, 187152);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "1508e26d670d3f53a9e5f3d2b3945c8167d1ba8cd0e7a1959bf726fcb203e87f",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    calibrationId: string;
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v4");
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
      {
        routeLanguage: "es",
        spokenLanguage: "not-established-by-listening",
      },
    ],
  );
  assert.ok(Object.values(receipt.acceptanceEffects).every((value) => !value));
  assert.equal(receipt.strictAcceptanceEffect, "none");
});
