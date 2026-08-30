import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11Ti004PointEntryCandidate} from
  "./course-g04-l11-ti-004-point-entry-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({
  key: "course-g04-l11-ti-004-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 799.9, height: 599.75}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 799.9, height: 599.75}),
    fps: 12, frameCount: 10, durationMs: 833.333333,
    frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-423", frameCount: 275, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-423"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11Ti004PointEntryCandidate({
  Renderer: SourceRenderer, module: sourceModule, movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});
const props = Object.freeze({frame: 274, frameDomain: "sprite-423", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps TI004 without registration or legacy course chrome", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.fiveSourcePointsPreserved, true);
  assert.equal(candidate.sourceContract.tenCoordinateInputsPreserved, true);
  assert.equal(candidate.sourceContract.glossaryVocabularyPreserved, 12);
  assert.equal(candidate.sourceContract.sourceClearFieldResetEstablished, false);
  assert.equal(candidate.sourceContract.modernBoundedSelectedRowResetApplied, true);
  assert.equal(candidate.sourceContract.authority.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.authority.legacyCourseShellNavigationIncluded, false);
  assert.equal(candidate.sourceContract.authority.legacyPlayerChromeIncluded, false);
});

test("renders five selectable points and two modern coordinate fields", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /Coordinate Grid: Try It!/u);
  assert.match(html, /Select A, B, C, D, or E/u);
  assert.equal((html.match(/data-source-point-timeline-id=/gu) ?? []).length, 5);
  for (const id of ["A", "B", "C", "D", "E"]) {
    assert.match(html, new RegExp(`Select point ${id}`, "u"));
  }
  assert.match(html, /id="ti004-x"/u); assert.match(html, /id="ti004-y"/u);
  assert.match(html, />Done — check answer</u);
  assert.match(html, />Clear — choose another point</u);
});

test("uses the clean source background and replaces the old control surface", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-frame="273"/u);
  assert.match(html, /aria-hidden="true"[^>]*class="course-g04-l11-ti004-source-stage" hidden=""/u);
  assert.match(html, /data-modern-replaced-source-control-surface="true"/u);
  assert.match(html, /data-source-point-count="5"/u);
  assert.match(html, /data-source-coordinate-input-count="10"/u);
  assert.match(html, /data-source-question-stop-frame="274"/u);
});

test("preserves Need More Help and all twelve glossary controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, />Need More Help</u); assert.match(html, /Math words/u);
  assert.equal((html.match(/data-source-glossary-button-object-ids=/gu) ?? []).length, 12);
  for (const term of ["Ordered pair", "X-coordinate", "Y-coordinate", "Point",
    "Coordinate grid", "Zero", "X-axis", "Locate", "Unit", "Y-axis",
    "Coordinate", "Number"]) assert.match(html, new RegExp(`>${term}<`, "u"));
});

test("excludes duplicate old Shell controls and unresolved authority", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.match(html, /data-duplicate-old-and-modern-controls-included="false"/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
  assert.match(html, /data-source-clear-field-reset-established="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});

test("Spanish modern teaching controls remain acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Cuadrícula de coordenadas: ¡Inténtalo!/u);
  assert.match(html, /Comprobar respuesta/u);
  assert.match(html, /Borrar y elegir otro punto/u);
  assert.match(html, /Necesito más ayuda/u);
  assert.match(html, />Par ordenado</u); assert.match(html, />Coordenada x</u);
  assert.match(html, /Repetir la actividad/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
});

test("deterministic evidence capture suppresses the modern interaction UI", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="274"/u);
  assert.doesNotMatch(html, /data-modern-replaced-source-control-surface/u);
  assert.doesNotMatch(html, /data-source-point-count/u);
  assert.doesNotMatch(html, /Done — check answer/u);
});
