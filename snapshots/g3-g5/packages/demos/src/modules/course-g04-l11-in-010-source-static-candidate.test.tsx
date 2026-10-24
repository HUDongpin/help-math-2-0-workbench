import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In010PointChoiceCandidate} from
  "./course-g04-l11-in-010-point-choice-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({
  key: "course-g04-l11-in-010-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333, frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-246", frameCount: 277, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-246"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11In010PointChoiceCandidate({
  Renderer: SourceRenderer, module: sourceModule, movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});
const props = Object.freeze({frame: 191, frameDomain: "sprite-246", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps IN010 as a private Current-JS slice without the legacy course shell", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.interaction.sourceAnswerControlCount, 3);
  assert.equal(candidate.sourceContract.interaction.sourceGlossaryControlCount, 4);
  assert.equal(candidate.sourceContract.authority.registeredCurrentJavascript, true);
  assert.equal(candidate.sourceContract.authority.legacyCourseShellNavigationIncluded, false);
});

test("renders the exact equation, option order, and source controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /2x = y/u);
  const labels = [...html.matchAll(/data-source-answer-control="([^"]+)"[^>]*>([^<]+)/gu)]
    .map((match) => [match[1], match[2]]);
  assert.deepEqual(labels, [["AnsBtn2", "(2,3)"], ["AnsBtn3", "(4,6)"],
    ["AnsBtn1", "(4,8)"]]);
  assert.match(html, /data-animation-internal-pedagogical-control-count="8"/u);
});

test("uses frame 190 as the executed quiz background", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-frame="190"/u);
  assert.match(html, /data-source-quiz-stop-frame="191"/u);
  assert.match(html, /data-correct-feedback-source-timing-established="false"/u);
});

test("preserves glossary controls but excludes old Shell controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  for (const label of ["equation", "point", "coordinate", "line"]) {
    assert.match(html, new RegExp(`>${label}<`, "u"));
  }
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});

test("Spanish modern controls remain acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /¿Qué punto está en la línea\?/u);
  assert.match(html, /Elige un punto/u);
  assert.match(html, /Repetir la práctica/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
  assert.match(html, /data-registered-current-javascript="true"/u);
});

test("deterministic evidence capture suppresses modern interaction UI", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="191"/u);
  assert.doesNotMatch(html, /data-animation-internal-pedagogical-control-count/u);
  assert.doesNotMatch(html, /Choose a point/u);
});
