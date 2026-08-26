import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11Ti002TermMatchingCandidate} from
  "./course-g04-l11-ti-002-term-matching-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({
  key: "course-g04-l11-ti-002-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333, frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-325", frameCount: 247, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-325"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11Ti002TermMatchingCandidate({
  Renderer: SourceRenderer, module: sourceModule, movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});
const props = Object.freeze({frame: 230, frameDomain: "sprite-325", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps TI002 without registration or the legacy course shell", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.exactTermTargetMappingsPreserved, 5);
  assert.equal(candidate.sourceContract.pictureEnlargementFunctionsPreserved, 5);
  assert.equal(candidate.sourceContract.glossaryVocabularyPreserved, 15);
  assert.equal(candidate.sourceContract.authority.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.authority.legacyCourseShellNavigationIncluded, false);
  assert.equal(candidate.sourceContract.authority.legacyPlayerChromeIncluded, false);
});

test("renders the five exact source terms in source order", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  const terms = [...html.matchAll(/data-source-instance-name="([^"]+)"[^>]*data-source-object-id="([^"]+)"[^>]*>\s*([^<]+)/gu)]
    .map((match) => [match[1], Number(match[2]), match[3].trim()]);
  assert.deepEqual(terms, [
    ["Src_1", 68, "coordinate grid"], ["Src_2", 70, "coordinates"],
    ["Src_3", 72, "plot"], ["Src_4", 75, "x-axis"],
    ["Src_5", 77, "y-axis"],
  ]);
  assert.match(html, /data-source-term-control-count="5"/u);
  assert.match(html, /data-source-target-control-count="5"/u);
});

test("renders all target mappings and uses the clean pre-interaction frame", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-frame="229"/u);
  assert.match(html, /data-source-target-instance-name="Mc_Tar_2"/u);
  assert.match(html, /data-source-target-instance-name="Mc_Tar_3"/u);
  assert.match(html, /data-source-target-instance-name="Mc_Tar_1"/u);
  assert.match(html, /data-source-target-instance-name="Mc_Tar_5"/u);
  assert.match(html, /data-source-target-instance-name="Mc_Tar_4"/u);
  assert.doesNotMatch(html, /You matched all five/u);
});

test("preserves five picture and fifteen glossary teaching controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.equal((html.match(/data-source-picture-button-object-id=/gu) ?? []).length, 5);
  assert.equal((html.match(/data-source-glossary-button-object-id=/gu) ?? []).length, 15);
  assert.match(html, /data-source-picture-control-count="5"/u);
  assert.match(html, /data-source-glossary-control-count="15"/u);
  assert.match(html, /Math words/u);
  assert.match(html, /View enlarged picture for definition 5/u);
});

test("excludes old shell controls and unresolved source authority", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
  assert.match(html, /data-source-drag-geometry-established="false"/u);
  assert.match(html, /data-source-picture-visual-fidelity-established="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});

test("Spanish modern controls remain acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Cuadrícula de coordenadas: ¡Inténtalo!/u);
  assert.match(html, /Primero elige un término/u);
  assert.match(html, />cuadrícula de coordenadas</u);
  assert.match(html, />coordenadas</u); assert.match(html, />representar</u);
  assert.match(html, />eje x</u); assert.match(html, />eje y</u);
  assert.match(html, />Pareja</u); assert.match(html, />Recta numérica</u);
  assert.match(html, /Repetir la actividad/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
});

test("deterministic evidence capture suppresses modern interaction UI", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="230"/u);
  assert.doesNotMatch(html, /data-source-term-control-count/u);
  assert.doesNotMatch(html, /Choose a key term/u);
  assert.doesNotMatch(html, /Math words/u);
});
