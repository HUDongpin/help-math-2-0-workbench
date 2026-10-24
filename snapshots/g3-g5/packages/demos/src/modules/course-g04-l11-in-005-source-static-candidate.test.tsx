import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In005PointHoverCandidate} from
  "./course-g04-l11-in-005-point-hover-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source {frame}</div>;
}
const module = Object.freeze({key: "course-g04-l11-in-005", movie: Object.freeze({
  stage: Object.freeze({width: 800, height: 600}), fps: 12, frameCount: 10,
  durationMs: 833.333}), runtime: Object.freeze({stage: Object.freeze({width: 800,
    height: 600}), fps: 12, frameCount: 10, durationMs: 833.333,
    frameDomains: Object.freeze([{id: "root", frameCount: 10},
      {id: "sprite-137", frameCount: 661, rootFrame: 6}]),
    defaultFrameDomain: "sprite-137"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype",
  Renderer: SourceRenderer, getFrameState: (frame: number) => ({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11In005PointHoverCandidate({Renderer: SourceRenderer,
  module, movie: module.movie, sourceContract: Object.freeze({status: "candidate"})});
const props = Object.freeze({frame: 647, frameDomain: "sprite-137", rootFrame: 6,
  scenario: "source-static-frame", lang: "en" as const, seed: 0, replay: 0});

test("renders all six exact source points and the accessible coordinate table", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-hover-point-count="6"/u);
  for (const pair of ["2,3", "5,2", "8,1", "10,7", "5,5", "1,8"]) {
    assert.match(html, new RegExp(`data-coordinate="${pair}"`, "u"));
  }
  assert.equal((html.match(/data-point-label=/gu) ?? []).length, 6);
  assert.match(html, /Revealed coordinates/u);
});
test("preserves three internal glossary controls but excludes the old shell", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-control-count="4"/u);
  assert.match(html, /data-glossary-control-count="3"/u);
  for (const id of [67, 68, 106]) assert.match(html,
    new RegExp(`data-source-button-object-id="${id}"`, "u"));
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});
test("source instruction frames remain visible before the hover stop", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} frame={600} />);
  assert.match(html, /data-source-frame="600"/u);
  assert.doesNotMatch(html, /data-source-hover-point-count/u);
});
test("Spanish modern UI is functional but acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Nombra las coordenadas/u); assert.match(html, />Punto</u);
  assert.match(html, />Coordenada</u); assert.match(html, /Repetir la lección/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
});
test("deterministic source evidence capture suppresses modern overlays", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="647"/u);
  assert.doesNotMatch(html, /data-source-hover-point-count|data-glossary-control-count/u);
});
test("source contract remains unregistered and acceptance-neutral", () => {
  assert.equal(candidate.sourceContract.sourcePointCountPreserved, 6);
  assert.equal(candidate.sourceContract.sourceGlossaryControlCountPreserved, 3);
  assert.equal(candidate.sourceContract
    .legacyCourseShellNavigationAndPlayerChromeExcluded, true);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
});
