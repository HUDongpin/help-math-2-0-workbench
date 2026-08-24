import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_VB_010_GLOSSARY_TERMS,
  COURSE_G04_L10_VB_010_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_VB_010_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-vb-010";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-vb-010/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-vb-010/audit/private-product-audio-assets.json",
  import.meta.url,
);

test("VB010 exposes five exact typed glossary terms, one EN cue, and one ES host track", () => {
  assert.equal(module.key, "course-g04-l10-vb-010");
  assert.equal(module.maturity, "private-current-js");
  assert.deepEqual(module.lessonHost, {
    capabilities: ["glossary"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(
    COURSE_G04_L10_VB_010_GLOSSARY_TERMS.map((term) => ({
      id: term.id,
      sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: term.sourceCharacterId,
      firstFrame: term.firstFrame,
    })),
    [
      {id: "square-unit", sourceKeyAttribute: "Square unit", sourceCharacterId: 10, firstFrame: 4},
      {id: "square", sourceKeyAttribute: "Square", sourceCharacterId: 11, firstFrame: 4},
      {id: "measure", sourceKeyAttribute: "Measure", sourceCharacterId: 12, firstFrame: 4},
      {id: "unit", sourceKeyAttribute: "Unit", sourceCharacterId: 13, firstFrame: 4},
      {id: "area", sourceKeyAttribute: "Area", sourceCharacterId: 33, firstFrame: 63},
    ],
  );
  assert.deepEqual(module.audioCues, COURSE_G04_L10_VB_010_PRIVATE_AUDIO_CUES);
  assert.deepEqual(module.audioTracks, COURSE_G04_L10_VB_010_PRIVATE_AUDIO_TRACKS);
});

test("VB010 cue is EN-only and Replay rewind restarts it at source frame 3", () => {
  const cue = COURSE_G04_L10_VB_010_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-36",
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
      frame: 3,
      endFrame: 129,
      durationMs: 10475,
      spokenLanguage: "undetermined",
    },
  );
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_VB_010_PRIVATE_AUDIO_CUES, {
      previousFrame: 128,
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
    resolveAudioCueTransition(COURSE_G04_L10_VB_010_PRIVATE_AUDIO_CUES, {
      previousFrame: 1,
      frame: 3,
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

test("VB010 Spanish track is user-activated and pauses the modern timeline", () => {
  assert.deepEqual(
    COURSE_G04_L10_VB_010_PRIVATE_AUDIO_TRACKS.map((track) => ({
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
        frameDomains: ["sprite-36"],
        timelineBehavior: "pause-while-playing",
        durationMs: 13152,
      },
    ],
  );
});

test("VB010 staged audio bytes and receipt remain exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 52130);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "a75e01d6a5e30f1f665c8ba31776ea7396129d449d804834f06370979f79132b",
  );
  assert.equal(spanish.length, 184128);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "60cbeacba48c3db11409fef5732336ffbfd04f6d3da7572b891284ac991ee33c",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    calibrationId: string;
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
  assert.equal(receipt.calibrationId, "g4-l10-candidate-to-product-v12");
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
