import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11Vb010LineSegmentCandidate} from "./course-g04-l11-vb-010-line-segment-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}

const sourceModule = Object.freeze({
  key: "course-g04-l11-vb-010-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333,
    frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-43", frameCount: 66, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-43"}),
  playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]),
  maturity: "legacy-prototype",
  Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);

const candidate = createCourseG04L11Vb010LineSegmentCandidate({
  Renderer: SourceRenderer,
  module: sourceModule,
  movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});

const props = Object.freeze({
  frame: 40,
  frameDomain: "sprite-43",
  rootFrame: 6,
  replay: 0,
  scenario: "source-static-frame",
  lang: "en" as const,
  seed: 0,
});

test("wraps the source Canvas candidate without registering VB010", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.module.key, sourceModule.key);
  assert.equal(candidate.module.Renderer, candidate.Renderer);
  assert.equal(candidate.sourceContract.sourceVisualAuthority,
    "source-canvas-candidate");
  assert.equal(candidate.sourceContract.sourceDefinitionTextDisplayed, true);
  assert.equal(candidate.sourceContract.lineSegmentEndpointInstructionDisplayed,
    true);
  assert.equal(candidate.sourceContract
    .animationInternalPedagogicalControlsPreserved, true);
  assert.equal(candidate.sourceContract
    .legacyCourseShellNavigationAndPlayerChromeExcluded, true);
  assert.equal(candidate.sourceContract.sourceTerminalBehaviorEstablished, false);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
});

test("renders the exact definition and endpoint construction", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html,
    /A line segment is part of a line between two points\./u);
  assert.match(html, />Upper endpoint</u);
  assert.match(html, /\(2,6\)/u);
  assert.match(html, />Lower endpoint</u);
  assert.match(html, /\(2,2\)/u);
  assert.match(html, /Vertical segment at x = 2/u);
});

test("renders all three source teaching controls and no old shell", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-control-count="3"/u);
  for (const [id, key, label] of [["10", "Line segment", "Line segment"],
    ["11", "Line", "Line"], ["12", "Point", "Points"]]) {
    assert.match(html, new RegExp(`data-source-button-object-id="${id}"`, "u"));
    assert.match(html, new RegExp(`data-source-key-attribute="${key}"`, "u"));
    assert.match(html, new RegExp(`>${label}<`, "u"));
  }
  assert.match(html, />Replay</u);
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.doesNotMatch(html, /DoHyperLinks|InternalPreloader|legacy navigation/u);
});

test("Spanish helper copy is modern UI and does not claim source parity", () => {
  const html = renderToStaticMarkup(
    <candidate.Renderer {...props} uiLanguage="es" />,
  );
  assert.match(html, />Segmento de línea</u);
  assert.match(html, /Extremo superior/u);
  assert.match(html, /Segmento vertical en x = 2/u);
  assert.match(html, />Repetir</u);
  assert.match(html, /data-spanish-source-visual-parity-established="false"/u);
  assert.match(html, />Puntos</u);
});

test("deterministic evidence capture suppresses the modern companion", () => {
  const html = renderToStaticMarkup(
    <candidate.Renderer {...props} entryStateSha256={"a".repeat(64)} />,
  );
  assert.match(html, /data-source-frame="40"/u);
  assert.doesNotMatch(html, /data-animation-internal-control-count/u);
  assert.doesNotMatch(html, /How the segment is formed/u);
});
