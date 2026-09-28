import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In012LineSegmentCandidate} from
  "./course-g04-l11-in-012-line-segment-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({key: "course-g04-l11-in-012-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333,
    frameDomains: Object.freeze([Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-68", frameCount: 440, fps: 12, rootFrame: 6})]),
    defaultFrameDomain: "sprite-68"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame})} satisfies AnimationModule);
const candidate = createCourseG04L11In012LineSegmentCandidate({Renderer: SourceRenderer,
  module: sourceModule, movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"})});
const props = Object.freeze({frame: 240, frameDomain: "sprite-68", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps the source Canvas candidate without registering IN012", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.exactWorkedExampleDisplayed, true);
  assert.equal(candidate.sourceContract.animationInternalPedagogicalControlsPreserved,
    true);
  assert.equal(candidate.sourceContract.legacyCourseShellNavigationAndPlayerChromeExcluded,
    true);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
});

test("renders the exact vertical example and modern Lesson playback controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /A line segment is part of a line between two points/u);
  assert.match(html, /\(3,1\) → \(3,9\)/u);
  assert.match(html, /9 − 1 = 8/u); assert.match(html, /length = 8 units/u);
  assert.match(html, /Subtract the y-values/u);
  assert.match(html, /data-modern-lesson-playback-controls="true"/u);
  assert.match(html, />Pause</u); assert.match(html, />Replay</u);
});

test("preserves two teaching controls and excludes the old Shell", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-control-count="2"/u);
  for (const [id, key] of [["66", "Length"], ["67", "Unit"]]) {
    assert.match(html, new RegExp(`data-source-button-object-id="${id}"`, "u"));
    assert.match(html, new RegExp(`data-source-key-attribute="${key}"`, "u"));
  }
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.doesNotMatch(html, /DoHyperLinks|InternalPreloader|old course shell/ui);
});

test("Spanish helper UI does not enable unaccepted Spanish audio or visual parity", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Longitud de segmentos verticales/u);
  assert.match(html, /9 − 1 = 8/u); assert.match(html, /8 unidades/u);
  assert.match(html, />Longitud</u); assert.match(html, />Unidad</u);
  assert.match(html, />Repetir</u);
  assert.match(html, /data-external-spanish-audio-enabled="false"/u);
  assert.match(html, /data-spanish-source-visual-parity-established="false"/u);
});

test("deterministic evidence capture suppresses the modern companion", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="240"/u);
  assert.doesNotMatch(html, /data-animation-internal-control-count/u);
  assert.doesNotMatch(html, /Find the Length of a Vertical Segment/u);
});
