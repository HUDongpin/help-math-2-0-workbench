import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In009LinePracticeCandidate} from
  "./course-g04-l11-in-009-line-practice-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({
  key: "course-g04-l11-in-009-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333, frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-288", frameCount: 421, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-288"}),
  playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11In009LinePracticeCandidate({
  Renderer: SourceRenderer,
  module: sourceModule,
  movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});
const props = Object.freeze({frame: 407, frameDomain: "sprite-288", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps IN009 without registration or the legacy course shell", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.interaction.sourcePlotPointControlCount, 5);
  assert.equal(candidate.sourceContract.interaction.sourceDrawLineControlCount, 1);
  assert.equal(candidate.sourceContract.interaction.sourceGlossaryControlCount, 4);
  assert.equal(candidate.sourceContract.authority.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.authority.legacyCourseShellNavigationIncluded, false);
});

test("renders all five source rows and the exact x plus two rule", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /x \+ 2 = y/u);
  assert.equal((html.match(/data-source-control="plot[1-5]"/gu) ?? []).length, 5);
  assert.equal((html.match(/<tbody>.*?<tr/gu) ?? []).length, 1);
  for (const x of [1, 2, 3, 4, 5]) {
    assert.match(html, new RegExp(`y-value for x ${x}`, "u"));
  }
  assert.match(html, /data-source-control="drawline_btn"/u);
});

test("uses the pre-script source background for the executed quiz state", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-frame="406"/u);
  assert.match(html, /data-source-quiz-stop-frame="407"/u);
  assert.match(html, /data-animation-internal-pedagogical-control-count="10"/u);
});

test("preserves glossary controls but excludes old Shell controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  for (const label of ["column", "plot", "line", "point"]) {
    assert.match(html, new RegExp(`>${label}<`, "u"));
  }
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});

test("Spanish modern controls are functional but acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Traza puntos para formar una línea/u);
  assert.match(html, /Dibujar línea/u);
  assert.match(html, /Repetir la práctica/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
});

test("deterministic evidence capture suppresses all modern interaction UI", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="407"/u);
  assert.doesNotMatch(html, /data-animation-internal-pedagogical-control-count/u);
  assert.doesNotMatch(html, /Complete the y-values/u);
});
