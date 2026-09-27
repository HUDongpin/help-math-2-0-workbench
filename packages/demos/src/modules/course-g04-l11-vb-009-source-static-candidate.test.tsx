import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11Vb009PointCandidate} from "./course-g04-l11-vb-009-point-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}

const sourceModule = Object.freeze({
  key: "course-g04-l11-vb-009-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333,
    frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-60", frameCount: 217, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-60"}),
  playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]),
  maturity: "legacy-prototype",
  Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);

const candidate = createCourseG04L11Vb009PointCandidate({
  Renderer: SourceRenderer,
  module: sourceModule,
  movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});

const props = Object.freeze({
  frame: 120,
  frameDomain: "sprite-60",
  rootFrame: 6,
  replay: 0,
  scenario: "source-static-frame",
  lang: "en" as const,
  seed: 0,
});

test("wraps the source Canvas candidate without registering VB009", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.module.key, sourceModule.key);
  assert.equal(candidate.module.Renderer, candidate.Renderer);
  assert.equal(candidate.sourceContract.sourceVisualAuthority,
    "source-canvas-candidate");
  assert.equal(candidate.sourceContract.sourceDefinitionTextDisplayed, true);
  assert.equal(candidate.sourceContract.pointAProjectionInstructionDisplayed,
    true);
  assert.equal(candidate.sourceContract
    .animationInternalPedagogicalControlsPreserved, true);
  assert.equal(candidate.sourceContract
    .legacyCourseShellNavigationAndPlayerChromeExcluded, true);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
});

test("renders the exact definition and Point A projection instruction", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html,
    /A point is an exact location on a coordinate grid, named by an ordered pair\./u);
  assert.match(html, />x first</u);
  assert.match(html, /Move 4 units right\./u);
  assert.match(html, />then y</u);
  assert.match(html, /Move 3 units up\./u);
  assert.match(html, /Point A/u);
  assert.match(html, /\(4,3\)/u);
});

test("renders all four source teaching controls and no old shell", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-control-count="4"/u);
  for (const [id, term] of [["11", "Point"], ["12", "Location"],
    ["13", "Coordinate grid"], ["9", "Ordered pair"]]) {
    assert.match(html, new RegExp(`data-source-button-object-id="${id}"`, "u"));
    assert.match(html, new RegExp(`data-source-key-attribute="${term}"`, "u"));
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
  assert.match(html, />Punto</u);
  assert.match(html, /Primero x/u);
  assert.match(html, /Sube 3 unidades\./u);
  assert.match(html, />Repetir</u);
  assert.match(html, /data-spanish-source-visual-parity-established="false"/u);
  assert.match(html, />Ordered pair</u);
});

test("deterministic evidence capture suppresses the modern companion", () => {
  const html = renderToStaticMarkup(
    <candidate.Renderer {...props} entryStateSha256={"a".repeat(64)} />,
  );
  assert.match(html, /data-source-frame="120"/u);
  assert.doesNotMatch(html, /data-animation-internal-control-count/u);
  assert.doesNotMatch(html, /How to locate Point A/u);
});
