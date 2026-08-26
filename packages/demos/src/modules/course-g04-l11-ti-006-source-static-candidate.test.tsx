import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11Ti006SegmentLengthCandidate} from
  "./course-g04-l11-ti-006-segment-length-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({
  key: "course-g04-l11-ti-006-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333, frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-259", frameCount: 95, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-259"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11Ti006SegmentLengthCandidate({
  Renderer: SourceRenderer, module: sourceModule, movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});
const props = Object.freeze({frame: 76, frameDomain: "sprite-259", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps TI006 without registration or the legacy course shell", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.interaction.sourceAnswerControlCount, 3);
  assert.equal(candidate.sourceContract.interaction.sourceHelpControlCount, 1);
  assert.equal(candidate.sourceContract.interaction.sourceGlossaryControlCount, 8);
  assert.equal(candidate.sourceContract.authority.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.authority.legacyCourseShellNavigationIncluded,
    false);
});

test("renders exact prompt, endpoints, option order, help, and eight terms", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /Click the number of units for the length/u);
  assert.match(html, /\(2,5\) → \(2,8\)/u);
  const labels = [...html.matchAll(
    /data-source-answer-control="([^"]+)"[^>]*[^>]*>([^<]+)/gu)]
    .map((match) => [match[1], match[2]]);
  assert.deepEqual(labels, [["AnsBtn3", "2 units"], ["AnsBtn1", "3 units"],
    ["AnsBtn2", "5 units"]]);
  assert.match(html, /data-animation-internal-pedagogical-control-count="12"/u);
  assert.match(html, /data-modern-replaced-source-answer-visual-count="3"/u);
  assert.match(html, /data-source-help-control="NMHBtn"/u);
  assert.equal((html.match(/data-source-key-attribute=/gu) ?? []).length, 8);
});

test("uses the pre-button source frame and does not reveal the equation", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-frame="75"/u);
  assert.match(html, /data-source-quiz-stop-frame="76"/u);
  assert.doesNotMatch(html, /8 − 5 = 3/u);
});

test("excludes old Shell controls and unaccepted feedback authority", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.match(html, /data-source-feedback-selection-established="false"/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});

test("Spanish modern controls remain acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Longitud de un segmento vertical/u);
  assert.match(html, /Elige la longitud/u);
  assert.match(html, /Necesito más ayuda/u);
  assert.match(html, />coordenada y</u);
  assert.match(html, /Repetir la práctica/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
});

test("deterministic evidence capture suppresses modern interaction UI", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="76"/u);
  assert.doesNotMatch(html, /data-modern-replaced-source-answer-visual-count/u);
  assert.doesNotMatch(html, /data-animation-internal-pedagogical-control-count/u);
  assert.doesNotMatch(html, /Choose the length/u);
});
