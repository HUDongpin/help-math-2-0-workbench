import assert from "node:assert/strict";
import test from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {loadAnimationModule} from "../src/animation-registry";
import {
  G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS,
  G5_L4_PAGE_AUDIO_CANDIDATES,
  getG5L4FqInteractiveAudioAsset,
} from "../src/g5-l4-audio.generated";
import {
  G5_L4_FQ23_ATLAS_FRAME_DOMAIN,
  G5_L4_FQ23_SCENARIO,
} from "../src/g5-l4-fq23-question-atlas-candidate";

function assertExactAudioSource(source: string, digest: string) {
  assert.match(digest, /^[0-9a-f]{64}$/u);
  assert.match(
    source,
    new RegExp(`^/flash-assets/courses/course-g05-l04-[a-z0-9-]+/.+\\.mp3\\?sha256=${digest}$`, "u"),
  );
}

test("all 50 ordinary pages plus IR load the generated exact audio mappings", async () => {
  const entries = Object.entries(G5_L4_PAGE_AUDIO_CANDIDATES);
  assert.equal(entries.length, 51);
  assert.equal(
    entries.filter(([, candidate]) => candidate.audioTracks.length === 1).length,
    50,
  );
  assert.equal(
    entries.filter(([, candidate]) => candidate.audioCues.length === 2).length,
    1,
  );

  for (const [animationId, candidate] of entries) {
    const module = await loadAnimationModule(animationId);
    assert.ok(module, `${animationId}: registered module`);
    assert.deepEqual(module.audioCues, candidate.audioCues, `${animationId}: cues`);
    assert.deepEqual(module.audioTracks ?? [], candidate.audioTracks, `${animationId}: tracks`);
    for (const cue of candidate.audioCues) {
      assert.ok(cue.sha256, `${animationId}: cue SHA-256`);
      assertExactAudioSource(cue.source, cue.sha256);
      assert.equal(cue.spokenLanguage, "undetermined");
    }
    for (const track of candidate.audioTracks) {
      assertExactAudioSource(track.source, track.sha256);
      assert.equal(track.activation, "user");
      assert.equal(track.timelineBehavior, "pause-while-playing");
    }
  }

  const introduction = G5_L4_PAGE_AUDIO_CANDIDATES[
    "course-g05-l04-ir-001-a662633d"
  ];
  assert.ok(introduction);
  assert.deepEqual(
    introduction.audioCues.map(({frame, seedModulo}) => ({frame, seedModulo})),
    [
      {frame: 5, seedModulo: {divisor: 2, remainder: 0}},
      {frame: 5, seedModulo: {divisor: 2, remainder: 1}},
    ],
  );
  assert.deepEqual(introduction.audioTracks, []);
});

test("FQ002/FQ003 expose only the 83 canonical interactive assets while FQ001 stays unavailable", async () => {
  assert.equal(G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS.length, 83);
  assert.equal(
    G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS.filter(({language}) => language === "en").length,
    41,
  );
  assert.equal(
    G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS.filter(({language}) => language === "es").length,
    42,
  );
  assert.equal(new Set(
    G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS.map(({id}) => id),
  ).size, 83);
  for (const asset of G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS) {
    assertExactAudioSource(asset.source, asset.sha256);
  }

  const [fq001, fq002, fq003] = await Promise.all([
    loadAnimationModule("course-g05-l04-fq-001"),
    loadAnimationModule("course-g05-l04-fq-002"),
    loadAnimationModule("course-g05-l04-fq-003"),
  ]);
  assert.ok(fq001);
  assert.ok(fq002);
  assert.ok(fq003);
  assert.deepEqual(fq001.audioCues, []);
  assert.equal(fq001.audioTracks, undefined);
  assert.equal(fq001.interactiveAudioAssets, undefined);
  assert.equal(fq001.lessonHost, undefined);
  for (const module of [fq002, fq003]) {
    assert.deepEqual(
      module.interactiveAudioAssets,
      G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS,
    );
    assert.deepEqual(module.lessonHost?.capabilities, ["audio"]);
    assert.equal(module.lessonHost?.legacyOperations, "blocked");
    assert.equal(module.lessonHost?.auditStorage, "memory-only");
    assert.equal(module.lessonHost?.storesPersonalData, false);
  }

  assert.equal(getG5L4FqInteractiveAudioAsset("en", 1, "A"), undefined);
  assert.ok(getG5L4FqInteractiveAudioAsset("en", 1, null));
  assert.ok(getG5L4FqInteractiveAudioAsset("en", 1, "B"));
  assert.equal(getG5L4FqInteractiveAudioAsset("es", 1, null), undefined);
  assert.ok(getG5L4FqInteractiveAudioAsset("es", 1, "B"));
});

test("FQ003 speaker controls follow the UI locale and disable missing exact assets", async () => {
  const module = await loadAnimationModule("course-g05-l04-fq-003");
  assert.ok(module);
  const baseProps = {
    audioEnabled: true,
    frame: 1,
    frameDomain: G5_L4_FQ23_ATLAS_FRAME_DOMAIN,
    scenario: G5_L4_FQ23_SCENARIO,
    lang: "en" as const,
    seed: 0,
    requirementId: "req-fq23-audio",
    traceId: "trace-fq23-audio",
    entryStateSha256: "",
    onLessonHostRequest: () => undefined,
  };
  const english = renderToStaticMarkup(createElement(module.Renderer, {
    ...baseProps,
    uiLanguage: "en",
  }));
  assert.equal(
    (english.match(/data-interactive-audio-status="available"/g) ?? []).length,
    3,
  );
  assert.equal(
    (english.match(/data-interactive-audio-status="missing"/g) ?? []).length,
    2,
  );
  assert.match(english, /Question audio: Play audio/);
  assert.match(english, /Answer A audio: Audio unavailable/);

  const spanish = renderToStaticMarkup(createElement(module.Renderer, {
    ...baseProps,
    uiLanguage: "es",
  }));
  assert.equal(
    (spanish.match(/data-interactive-audio-status="available"/g) ?? []).length,
    2,
  );
  assert.equal(
    (spanish.match(/data-interactive-audio-status="missing"/g) ?? []).length,
    3,
  );
  assert.match(spanish, /Audio de la pregunta: Audio no disponible/);
  assert.match(spanish, /Audio de la respuesta B: Reproducir audio/);

  const questionAudio = getG5L4FqInteractiveAudioAsset("en", 1, null);
  assert.ok(questionAudio);
  const sounding = renderToStaticMarkup(createElement(module.Renderer, {
    ...baseProps,
    activeInteractiveAudioId: questionAudio.id,
    uiLanguage: "en",
  }));
  assert.match(sounding, /Question audio: Stop audio/);
  assert.match(
    sounding,
    new RegExp(
      `aria-pressed="true"[^>]*data-interactive-audio-asset-id="${questionAudio.id}"`,
      "u",
    ),
  );
});
