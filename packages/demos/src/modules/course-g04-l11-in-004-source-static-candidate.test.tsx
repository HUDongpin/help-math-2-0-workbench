import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In004CoordinateQuizCandidate} from "./course-g04-l11-in-004-coordinate-quiz-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}

const sourceModule = Object.freeze({
  key: "course-g04-l11-in-004-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333,
    frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-127", frameCount: 233, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-127"}),
  playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]),
  maturity: "legacy-prototype",
  Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);

const candidate = createCourseG04L11In004CoordinateQuizCandidate({
  Renderer: SourceRenderer,
  module: sourceModule,
  movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});

const props = Object.freeze({
  frame: 228,
  frameDomain: "sprite-127",
  rootFrame: 6,
  replay: 0,
  scenario: "source-static-frame",
  lang: "en" as const,
  seed: 0,
});

test("wraps IN004 without registering or importing the legacy course shell", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.module.key, sourceModule.key);
  assert.equal(candidate.sourceContract.sourceTargetCountPreserved, 18);
  assert.equal(candidate.sourceContract.sourceGridHitTargetCountPreserved, 121);
  assert.equal(candidate.sourceContract.sourceGlossaryControlCountPreserved, 8);
  assert.equal(candidate.sourceContract
    .sourceCorrectWrongNextAndReplayFunctionsImplemented, true);
  assert.equal(candidate.sourceContract
    .animationInternalPedagogicalControlsPreserved, true);
  assert.equal(candidate.sourceContract
    .legacyCourseShellNavigationAndPlayerChromeExcluded, true);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
});

test("renders the exact first source target and all 121 modern grid locations", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /Plot the point/u);
  assert.match(html, /\(5,4\)/u);
  assert.match(html, /data-grid-hit-target-count="121"/u);
  assert.equal((html.match(/data-coordinate="/gu) ?? []).length, 121);
  assert.match(html, /data-coordinate="5,4"/u);
  assert.match(html, /data-source-quiz-stop-frame="228"/u);
  assert.match(html, />Next ordered pair</u);
  assert.match(html, />Replay lesson</u);
});

test("keeps all eight animation-internal term controls in the modern contract", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-control-count="10"/u);
  assert.match(html, /data-glossary-control-count="8"/u);
  for (const id of ["74", "75", "76"]) {
    assert.match(html, new RegExp(`data-source-button-object-id="${id}"`, "u"));
  }
  assert.match(html, />Location</u);
  assert.match(html, />Ordered pair</u);
  assert.match(html, />Coordinate grid</u);
});

test("does not reconstruct legacy shell navigation or player chrome", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|legacy navigation|DoHyperLinks/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
});

test("source instruction sequence remains visible before the natural quiz stop", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} frame={120} />);
  assert.match(html, /data-source-frame="120"/u);
  assert.match(html, /Next ordered pair becomes available after the example/u);
  assert.doesNotMatch(html, /data-grid-hit-target-count="121"/u);
});

test("Spanish modern controls remain acceptance-neutral", () => {
  const html = renderToStaticMarkup(
    <candidate.Renderer {...props} uiLanguage="es" />,
  );
  assert.match(html, /Traza el punto/u);
  assert.match(html, /Siguiente par ordenado/u);
  assert.match(html, /Repetir la lección/u);
  assert.match(html, />Ubicación</u);
  assert.match(html, /data-spanish-source-visual-parity-established="false"/u);
});

test("deterministic evidence capture suppresses every modern interaction overlay", () => {
  const html = renderToStaticMarkup(
    <candidate.Renderer {...props} entryStateSha256={"a".repeat(64)} />,
  );
  assert.match(html, /data-source-frame="228"/u);
  assert.doesNotMatch(html, /data-grid-hit-target-count/u);
  assert.doesNotMatch(html, /data-animation-internal-control-count/u);
});
