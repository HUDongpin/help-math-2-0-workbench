import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11Ti003CoordinatePlotCandidate} from
  "./course-g04-l11-ti-003-coordinate-plot-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({
  key: "course-g04-l11-ti-003-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 799.9, height: 599.75}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 799.9, height: 599.75}),
    fps: 12, frameCount: 10, durationMs: 833.333333,
    frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-346", frameCount: 236, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-346"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11Ti003CoordinatePlotCandidate({
  Renderer: SourceRenderer, module: sourceModule, movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});
const props = Object.freeze({frame: 235, frameDomain: "sprite-346", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps TI003 without registration or legacy course chrome", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.initialCoordinatePoolPreserved, 14);
  assert.equal(candidate.sourceContract.replacementCoordinatePoolRecorded, 18);
  assert.equal(candidate.sourceContract.replacementPoolRepairApplied, false);
  assert.equal(candidate.sourceContract.glossaryVocabularyPreserved, 12);
  assert.equal(candidate.sourceContract.authority.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.authority.legacyCourseShellNavigationIncluded, false);
  assert.equal(candidate.sourceContract.authority.legacyPlayerChromeIncluded, false);
});

test("renders the first exact pair on a modern 0-to-10 coordinate picker", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /Coordinate Grid: Try It!/u);
  assert.match(html, /Click the exact location of the ordered pair/u);
  assert.match(html, /Ordered pair[\s\S]*\(2,[\s\S]*1\)/u);
  assert.match(html, /id="ti003-x" max="10" min="0"/u);
  assert.match(html, /id="ti003-y" max="10" min="0"/u);
  assert.match(html, />Plot this point</u);
  assert.match(html, />Next Ordered Pair</u);
});

test("uses the clean source background and replaces the old control surface", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-frame="230"/u);
  assert.match(html, /aria-hidden="true"[^>]*class="course-g04-l11-ti003-source-stage" hidden=""/u);
  assert.match(html, /data-modern-replaced-source-control-surface="true"/u);
  assert.match(html, /data-source-grid-point-count="121"/u);
  assert.match(html, /data-source-quiz-stop-frame="235"/u);
});

test("preserves help and all twelve glossary teaching controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, />Need More Help</u);
  assert.match(html, /Math words/u);
  assert.equal((html.match(/data-source-glossary-button-object-ids=/gu) ?? []).length, 12);
  for (const term of ["Ordered pair", "Number", "Unit", "Zero", "X-axis",
    "Coordinates", "Point", "Coordinate", "Grid", "Location",
    "Coordinate grid", "Plot"]) assert.match(html, new RegExp(`>${term}<`, "u"));
});

test("excludes duplicate old Shell controls and unresolved authority", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
  assert.match(html, /data-source-point-hit-geometry-established="false"/u);
  assert.match(html, /data-source-replacement-pool-repair-applied="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});

test("Spanish modern teaching controls remain acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Cuadrícula de coordenadas: ¡Inténtalo!/u);
  assert.match(html, /Representar este punto/u);
  assert.match(html, /Siguiente par ordenado/u);
  assert.match(html, /Necesito más ayuda/u);
  assert.match(html, />Par ordenado</u); assert.match(html, />Eje x</u);
  assert.match(html, /Repetir la actividad/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
});

test("deterministic evidence capture suppresses modern interaction UI", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="235"/u);
  assert.doesNotMatch(html, /data-modern-replaced-source-control-surface/u);
  assert.doesNotMatch(html, /data-source-grid-point-count/u);
  assert.doesNotMatch(html, /Plot this point/u);
});
