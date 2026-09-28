import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In013SegmentLengthPracticeCandidate} from
  "./course-g04-l11-in-013-segment-length-practice-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({
  key: "course-g04-l11-in-013-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333, frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-224", frameCount: 67, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-224"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11In013SegmentLengthPracticeCandidate({
  Renderer: SourceRenderer, module: sourceModule, movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});
const props = Object.freeze({frame: 49, frameDomain: "sprite-224", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps IN013 without registration or the legacy course shell", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.interaction.sourceAnswerControlCount, 3);
  assert.equal(candidate.sourceContract.interaction.sourceGlossaryControlCount, 2);
  assert.equal(candidate.sourceContract.authority.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.authority.legacyCourseShellNavigationIncluded, false);
});

test("renders exact prompt, endpoints, option order, and five source controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /Click the length of this line segment/u);
  assert.match(html, /\(3,5\) → \(7,5\)/u);
  const labels = [...html.matchAll(/data-source-answer-control="([^"]+)"[^>]*[^>]*>([^<]+)/gu)]
    .map((match) => [match[1], match[2]]);
  assert.deepEqual(labels, [["AnsBtn2", "3 units"], ["AnsBtn1", "4 units"],
    ["AnsBtn3", "5 units"]]);
  assert.match(html, /data-animation-internal-pedagogical-control-count="5"/u);
  assert.match(html, /data-modern-replaced-source-answer-visual-count="3"/u);
  assert.match(html, /data-source-key-attribute="Length"/u);
  assert.match(html, /data-source-key-attribute="Line segment"/u);
});

test("uses the pre-button source frame and does not reveal the equation", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-frame="48"/u);
  assert.match(html, /data-source-quiz-stop-frame="49"/u);
  assert.doesNotMatch(html, /7 − 3 = 4/u);
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
  assert.match(html, /Haz clic en la longitud/u);
  assert.match(html, /Elige la longitud/u);
  assert.match(html, />longitud</u); assert.match(html, />segmento de línea</u);
  assert.match(html, /Repetir la práctica/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
});

test("deterministic evidence capture suppresses modern interaction UI", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="49"/u);
  assert.doesNotMatch(html, /data-modern-replaced-source-answer-visual-count/u);
  assert.doesNotMatch(html, /data-animation-internal-pedagogical-control-count/u);
  assert.doesNotMatch(html, /Choose the length/u);
});
