import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In003OrderedPairCandidate} from "./course-g04-l11-in-003-coordinate-grid-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}

const sourceModule = Object.freeze({
  key: "course-g04-l11-in-003-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333,
    frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-109", frameCount: 781, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-109"}),
  playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]),
  maturity: "legacy-prototype",
  Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);

const candidate = createCourseG04L11In003OrderedPairCandidate({
  Renderer: SourceRenderer,
  module: sourceModule,
  movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});

const props = Object.freeze({
  frame: 240,
  frameDomain: "sprite-109",
  rootFrame: 6,
  replay: 0,
  scenario: "source-static-frame",
  lang: "en" as const,
  seed: 0,
});

test("wraps the source Canvas candidate without registering IN003", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.module.key, sourceModule.key);
  assert.equal(candidate.module.Renderer, candidate.Renderer);
  assert.equal(candidate.sourceContract.sourceVisualAuthority,
    "source-canvas-candidate");
  assert.equal(candidate.sourceContract.sourceDefinitionTextDisplayed, true);
  assert.equal(candidate.sourceContract
    .orderedPairDefinitionAndTwoExamplesDisplayed, true);
  assert.equal(candidate.sourceContract
    .sourceNextOrderedPairClickBehaviorEstablished, false);
  assert.equal(candidate.sourceContract
    .animationInternalPedagogicalControlsPreserved, true);
  assert.equal(candidate.sourceContract
    .legacyCourseShellNavigationAndPlayerChromeExcluded, true);
  assert.equal(candidate.sourceContract.sourceTerminalBehaviorEstablished, false);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
});

test("renders the exact ordered-pair definition and two examples", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html,
    /An ordered pair is a pair of numbers used to locate a point/u);
  assert.match(html, /x → y/u);
  assert.match(html, /Move along x first, then move along y/u);
  for (const point of ["(2,7)", "(3,5)"]) {
    assert.match(html, new RegExp(point.replace(/[()]/g, "\\$&"), "u"));
  }
});

test("renders all six source teaching controls and no old shell", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-control-count="6"/u);
  const controls = [
    ["51", "Locate"], ["52", "Ordered pair"],
    ["53", "Coordinate grid"], ["54", "Pair"],
    ["55", "Number"], ["56", "Point"],
  ];
  for (const [id, key] of controls) {
    assert.match(html, new RegExp(`data-source-button-object-id="${id}"`, "u"));
    assert.match(html, new RegExp(`data-source-key-attribute="${key}"`, "u"));
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
  assert.match(html, /Localizar puntos en una cuadrícula de coordenadas/u);
  assert.match(html, /Muévete primero por x y después por y/u);
  assert.match(html, />Par ordenado</u);
  assert.match(html, />Punto</u);
  assert.match(html, />Repetir</u);
  assert.match(html, /data-spanish-source-visual-parity-established="false"/u);
});

test("deterministic evidence capture suppresses the modern companion", () => {
  const html = renderToStaticMarkup(
    <candidate.Renderer {...props} entryStateSha256={"a".repeat(64)} />,
  );
  assert.match(html, /data-source-frame="240"/u);
  assert.doesNotMatch(html, /data-animation-internal-control-count/u);
  assert.doesNotMatch(html, /How to plot a point/u);
});
