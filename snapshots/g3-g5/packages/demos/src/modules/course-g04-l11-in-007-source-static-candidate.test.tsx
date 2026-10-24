import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In007PointZChoiceCandidate} from
  "./course-g04-l11-in-007-point-z-choice-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source {frame}</div>;
}
const module = Object.freeze({key: "course-g04-l11-in-007", movie: Object.freeze({
  stage: Object.freeze({width: 800, height: 600}), fps: 12, frameCount: 10,
  durationMs: 833.333}), runtime: Object.freeze({stage: Object.freeze({width: 800,
    height: 600}), fps: 12, frameCount: 10, durationMs: 833.333,
    frameDomains: Object.freeze([{id: "root", frameCount: 10},
      {id: "sprite-232", frameCount: 137, rootFrame: 6}]),
    defaultFrameDomain: "sprite-232"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype",
  Renderer: SourceRenderer, getFrameState: (frame: number) => ({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11In007PointZChoiceCandidate({Renderer: SourceRenderer,
  module, movie: module.movie, sourceContract: Object.freeze({status: "candidate"})});
const props = Object.freeze({frame: 66, frameDomain: "sprite-232", rootFrame: 6,
  scenario: "source-static-frame", lang: "en" as const, seed: 0, replay: 0});

test("renders point Z and the three exact source choices in visual order", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-point="Z\(7,5\)"/u);
  assert.match(html, /data-source-choice-count="3"/u);
  assert.equal((html.match(/data-choice-id=/gu) ?? []).length, 3);
  const order = [html.indexOf('data-choice-value="(5,7)"'),
    html.indexOf('data-choice-value="(7,5)"'),
    html.indexOf('data-choice-value="(7,7)"')];
  assert.ok(order.every((index) => index >= 0));
  assert.ok(order[0] < order[1] && order[1] < order[2]);
});
test("preserves principal glossary controls and excludes the legacy shell", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-control-count="4"/u);
  assert.match(html, /data-glossary-control-count="3"/u);
  assert.match(html, /data-wrong-feedback-term-count="5"/u);
  for (const id of [25, 26, 27]) assert.match(html,
    new RegExp(`data-source-button-object-id="${id}"`, "u"));
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});
test("source instruction frames remain visible before the question stop", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} frame={65} />);
  assert.match(html, /data-source-frame="65"/u);
  assert.doesNotMatch(html, /data-source-choice-count/u);
});
test("Spanish modern UI is functional and acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Nombra el punto Z/u); assert.match(html, />Punto</u);
  assert.match(html, /Repetir la lección/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
});
test("deterministic source evidence capture suppresses modern overlays", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="66"/u);
  assert.doesNotMatch(html, /data-source-choice-count|data-glossary-control-count/u);
});
test("source contract remains unregistered and acceptance-neutral", () => {
  assert.equal(candidate.sourceContract.sourcePointZCoordinatePreserved, true);
  assert.equal(candidate.sourceContract.sourceChoiceCountPreserved, 3);
  assert.equal(candidate.sourceContract.sourcePrincipalGlossaryControlCountPreserved, 3);
  assert.equal(candidate.sourceContract.sourceWrongFeedbackTermCountPreserved, 5);
  assert.equal(candidate.sourceContract.legacyCourseShellNavigationAndPlayerChromeExcluded,
    true);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
});
