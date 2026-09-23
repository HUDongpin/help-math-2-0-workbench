import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In008PlotLineCandidate} from
  "./course-g04-l11-in-008-plot-line-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({key: "course-g04-l11-in-008-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333, frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-129", frameCount: 1_478, fps: 12, rootFrame: 6})]),
    defaultFrameDomain: "sprite-129"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame})} satisfies AnimationModule);
const candidate = createCourseG04L11In008PlotLineCandidate({Renderer: SourceRenderer,
  module: sourceModule, movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"})});
const props = Object.freeze({frame: 1_100, frameDomain: "sprite-129", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps IN008 without registration or old course shell", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.sourceEquationDisplayed, true);
  assert.equal(candidate.sourceContract.plottedPointCountDisplayed, 9);
  assert.equal(candidate.sourceContract.sourceTableRowCountDisplayed, 7);
  assert.equal(candidate.sourceContract.sourceAnimationInternalControlCount, 0);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
});

test("renders the exact source equation and all nine plotted points", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /x \+ 1 = y/u);
  for (const point of ["(1,2)", "(2,3)", "(3,4)", "(4,5)", "(5,6)",
    "(6,7)", "(7,8)", "(8,9)", "(9,10)"]) {
    assert.match(html, new RegExp(point.replace(/[()]/g, "\\$&"), "u"));
  }
});

test("distinguishes source table rows from plotted points", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.equal((html.match(/<tr>/gu) ?? []).length, 8);
  assert.match(html, /Source table rows/u);
  assert.match(html, /Frame/u);
});

test("provides only modern Lesson playback controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-pedagogical-control-count="0"/u);
  assert.match(html, /data-modern-lesson-playback-control-count="2"/u);
  assert.match(html, />Pause</u); assert.match(html, />Replay</u);
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});

test("Spanish helper copy is modern UI and acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Traza puntos para formar una línea/u);
  assert.match(html, /Cada valor de y es uno más que x/u);
  assert.match(html, />Pausar</u); assert.match(html, />Repetir</u);
  assert.match(html, /data-source-audio-enabled="false"/u);
});

test("deterministic evidence capture suppresses the modern companion", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="1100"/u);
  assert.doesNotMatch(html, /data-modern-lesson-playback-control-count/u);
  assert.doesNotMatch(html, /Plotted points/u);
});
