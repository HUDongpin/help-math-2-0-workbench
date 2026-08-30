import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In002CoordinateGridCandidate} from "./course-g04-l11-in-002-coordinate-grid-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}

const sourceModule = Object.freeze({
  key: "course-g04-l11-in-002-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333,
    frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-80", frameCount: 331, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-80"}),
  playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]),
  maturity: "legacy-prototype",
  Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);

const candidate = createCourseG04L11In002CoordinateGridCandidate({
  Renderer: SourceRenderer,
  module: sourceModule,
  movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});

const props = Object.freeze({
  frame: 240,
  frameDomain: "sprite-80",
  rootFrame: 6,
  replay: 0,
  scenario: "source-static-frame",
  lang: "en" as const,
  seed: 0,
});

test("wraps the source Canvas candidate without registering IN002", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.module.key, sourceModule.key);
  assert.equal(candidate.module.Renderer, candidate.Renderer);
  assert.equal(candidate.sourceContract.sourceVisualAuthority,
    "source-canvas-candidate");
  assert.equal(candidate.sourceContract.sourceDefinitionTextDisplayed, true);
  assert.equal(candidate.sourceContract.functionRuleAndFourPointsDisplayed, true);
  assert.equal(candidate.sourceContract
    .animationInternalPedagogicalControlsPreserved, true);
  assert.equal(candidate.sourceContract
    .legacyCourseShellNavigationAndPlayerChromeExcluded, true);
  assert.equal(candidate.sourceContract.sourceTerminalBehaviorEstablished, false);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
});

test("renders the exact definition, function rule, and four points", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html,
    /A coordinate grid is a grid formed by two intersecting number lines/u);
  assert.match(html, /horizontal x-axis and the vertical y-axis/u);
  assert.match(html, /y = x \+ 4/u);
  for (const point of ["(1,5)", "(2,6)", "(3,7)", "(4,8)"]) {
    assert.match(html, new RegExp(point.replace(/[()]/g, "\\$&"), "u"));
  }
});

test("renders all nine source teaching controls and no old shell", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-control-count="9"/u);
  const controls = [
    ["9", "Coordinate grid"], ["10", "Grid"], ["11", "Form"],
    ["12", "Intersect"], ["13", "Number line"],
    ["41", "Horizontal"], ["42", "X-axis"], ["43", "Vertical"],
    ["44", "Y-axis"],
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
  assert.match(html, />Cuadrícula de coordenadas</u);
  assert.match(html, /Suma 4 a cada valor de x/u);
  assert.match(html, />Eje x</u);
  assert.match(html, />Eje y</u);
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
