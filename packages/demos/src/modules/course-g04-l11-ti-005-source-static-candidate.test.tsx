import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11Ti005EquationPlotCandidate} from
  "./course-g04-l11-ti-005-equation-plot-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({key: "course-g04-l11-ti-005-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 799.9, height: 599.75}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 799.9, height: 599.75}),
    fps: 12, frameCount: 10, durationMs: 833.333333,
    frameDomains: Object.freeze([Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-342", frameCount: 433, fps: 12, rootFrame: 6})]),
    defaultFrameDomain: "sprite-342"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11Ti005EquationPlotCandidate({Renderer: SourceRenderer,
  module: sourceModule, movie: sourceModule.movie, sourceContract: Object.freeze({})});
const props = Object.freeze({frame: 419, frameDomain: "sprite-342", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps TI005 without registration or legacy course chrome", () => {
  assert.equal(candidate.sourceContract.exactEquationPreserved, "x + 3 = y");
  assert.equal(candidate.sourceContract.fiveRowsPreserved, true);
  assert.equal(candidate.sourceContract.drawLineThresholdPreserved, 5);
  assert.equal(candidate.sourceContract.glossaryVocabularyPreserved, 11);
  assert.equal(candidate.sourceContract.authority.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.authority.legacyCourseShellNavigationIncluded, false);
});

test("renders five exact rows and their Plot Point teaching controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /Coordinate Grid: Try It!/u); assert.match(html, /x \+ 3 = y/u);
  assert.equal((html.match(/data-source-plot-button-object-id=/gu) ?? []).length, 5);
  assert.equal((html.match(/>Plot Point</gu) ?? []).length, 5);
  for (const x of [1, 2, 3, 4, 5]) assert.match(html,
    new RegExp(`y-value for x equals ${x}`, "u"));
  assert.match(html, />Draw Line</u); assert.match(html, /disabled=""[^>]*>Draw Line</u);
});

test("uses clean source frame 418 and replaces the old control surface", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-frame="418"/u);
  assert.match(html, /data-modern-replaced-source-control-surface="true"/u);
  assert.match(html, /data-source-row-count="5"/u);
  assert.match(html, /data-source-draw-line-threshold="5"/u);
  assert.match(html, /data-legacy-course-shell-included="false"/u);
});

test("preserves help and all eleven glossary controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, />Need More Help</u); assert.match(html, /Math words/u);
  assert.equal((html.match(/data-source-glossary-button-object-ids=/gu) ?? []).length, 11);
  for (const term of ["Value", "Equation", "Connected", "Line segment", "Coordinate",
    "Grid", "Ordered pair", "Plot", "Column", "Line", "Point"]) {
    assert.match(html, new RegExp(`>${term}<`, "u"));
  }
});

test("excludes duplicate old Shell and all unresolved authority", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.match(html, /data-duplicate-old-and-modern-controls-included="false"/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});

test("Spanish modern controls remain acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Completa la columna y/u); assert.match(html, />Representar punto</u);
  assert.match(html, />Dibujar línea</u); assert.match(html, />Necesito más ayuda</u);
  assert.match(html, />Par ordenado</u); assert.match(html, /Repetir la actividad/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
});

test("deterministic evidence capture suppresses modern controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"b".repeat(64)} />);
  assert.match(html, /data-source-frame="419"/u);
  assert.doesNotMatch(html, /data-modern-replaced-source-control-surface/u);
  assert.doesNotMatch(html, /data-source-row-count/u);
  assert.doesNotMatch(html, /Plot Point/u);
});
