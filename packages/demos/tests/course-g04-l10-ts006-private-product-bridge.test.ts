import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {audioCueMatchesContext, resolveAudioCueTransition} from "../src/runtime";
import module, {
  COURSE_G04_L10_TS_006_PRIVATE_AUDIO_CUES,
  COURSE_G04_L10_TS_006_PRIVATE_AUDIO_TRACKS,
} from "../src/modules/course-g04-l10-ts-006";
import {COURSE_G04_L10_TS_006_CONFIG} from "../src/timelines/course-g04-l10-ts-006";

const assetRoot = new URL(
  "../../../public/flash-assets/courses/course-g04-l10-ts-006/audio/",
  import.meta.url,
);
const receiptUrl = new URL(
  "../../../migrations/course-g04-l10-ts-006/audit/private-product-audio-assets.json",
  import.meta.url,
);

test("TS006 exposes one source-domain EN engineering cue and one ES user track", () => {
  assert.equal(module.key, "course-g04-l10-ts-006");
  assert.equal(module.maturity, "private-current-js");
  assert.deepEqual(module.audioCues, COURSE_G04_L10_TS_006_PRIVATE_AUDIO_CUES);
  assert.deepEqual(module.audioTracks, COURSE_G04_L10_TS_006_PRIVATE_AUDIO_TRACKS);
  assert.match(
    COURSE_G04_L10_TS_006_CONFIG.sourceControlBehaviorLabel ?? "",
    /source-bound engineering audio mappings, not accepted audio parity/,
  );
  assert.doesNotMatch(
    COURSE_G04_L10_TS_006_CONFIG.sourceControlBehaviorLabel ?? "",
    /audio.*disabled/,
  );
  assert.deepEqual(
    COURSE_G04_L10_TS_006_PRIVATE_AUDIO_CUES.map((cue) => ({
      id: cue.id,
      frame: cue.frame,
      endFrame: cue.endFrame,
      frameDomain: cue.frameDomain,
      language: cue.language,
      scenario: cue.scenario,
      durationMs: cue.durationMs,
      spokenLanguage: cue.spokenLanguage,
    })),
    [
      {
        id: "embedded-stream-0001",
        frame: 1,
        endFrame: 246,
        frameDomain: "sprite-13",
        language: "en",
        scenario: "source-static-frame",
        durationMs: 20402,
        spokenLanguage: "undetermined",
      },
    ],
  );
  assert.deepEqual(
    COURSE_G04_L10_TS_006_PRIVATE_AUDIO_TRACKS.map((track) => ({
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
        frameDomains: ["sprite-13"],
        timelineBehavior: "pause-while-playing",
        durationMs: 7632,
      },
    ],
  );
});

test("TS006 cue is EN-only and Replay rewind restarts the exact cue", () => {
  const cue = COURSE_G04_L10_TS_006_PRIVATE_AUDIO_CUES[0]!;
  const base = {
    frameDomain: "sprite-13",
    scenario: "source-static-frame",
    seed: 0,
  } as const;
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "en"}), true);
  assert.equal(audioCueMatchesContext(cue, {...base, lang: "es"}), false);
  assert.deepEqual(
    resolveAudioCueTransition(COURSE_G04_L10_TS_006_PRIVATE_AUDIO_CUES, {
      previousFrame: 245,
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

test("TS006 staged audio bytes and receipt stay exact and acceptance-neutral", async () => {
  const [embedded, spanish, receiptBytes] = await Promise.all([
    readFile(new URL("embedded-stream-0001.mp3", assetRoot)),
    readFile(new URL("spanish-host-narration.mp3", assetRoot)),
    readFile(receiptUrl),
  ]);
  assert.equal(embedded.length, 101530);
  assert.equal(
    createHash("sha256").update(embedded).digest("hex"),
    "d27c65e6bd7b9087b168e2a54ff60568e9481c84bd9996b87ef50392d8cc77e6",
  );
  assert.equal(spanish.length, 106848);
  assert.equal(
    createHash("sha256").update(spanish).digest("hex"),
    "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
  );
  const receipt = JSON.parse(receiptBytes.toString("utf8")) as {
    status: string;
    assets: Array<{routeLanguage: string; spokenLanguage: string}>;
    acceptanceEffects: Record<string, boolean>;
    strictAcceptanceEffect: string;
  };
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
