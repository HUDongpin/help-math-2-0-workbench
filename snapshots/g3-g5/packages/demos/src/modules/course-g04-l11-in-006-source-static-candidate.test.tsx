import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11In006NamePointsPracticeCandidate} from
  "./course-g04-l11-in-006-name-points-practice-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source {frame}</div>;
}
const module = Object.freeze({key: "course-g04-l11-in-006", movie: Object.freeze({
  stage: Object.freeze({width: 800, height: 600}), fps: 12, frameCount: 10,
  durationMs: 833.333}), runtime: Object.freeze({stage: Object.freeze({width: 800,
    height: 600}), fps: 12, frameCount: 10, durationMs: 833.333,
    frameDomains: Object.freeze([{id: "root", frameCount: 10},
      {id: "sprite-137", frameCount: 287, rootFrame: 6}]),
    defaultFrameDomain: "sprite-137"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype",
  Renderer: SourceRenderer, getFrameState: (frame: number) => ({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11In006NamePointsPracticeCandidate({
  Renderer: SourceRenderer, module, movie: module.movie,
  sourceContract: Object.freeze({status: "candidate"})});
const props = Object.freeze({frame: 275, frameDomain: "sprite-137", rootFrame: 6,
  scenario: "source-static-frame", lang: "en" as const, seed: 0, replay: 0});

test("renders four exact source points and all eight accessible coordinate fields", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-practice-point-count="4"/u);
  assert.match(html, /data-source-coordinate-field-count="8"/u);
  for (const pair of ["6,8", "4,2", "1,4", "9,5"]) {
    assert.match(html, new RegExp(`data-coordinate="${pair}"`, "u"));
  }
  assert.equal((html.match(/data-point-label=/gu) ?? []).length, 4);
  assert.equal((html.match(/data-coordinate-field=/gu) ?? []).length, 8);
  assert.match(html, />Done</u); assert.match(html, />Clear button</u);
});
test("preserves six glossary controls and excludes the legacy course shell", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-control-count="9"/u);
  assert.match(html, /data-glossary-control-count="6"/u);
  for (const id of [8, 9, 10, 60, 61, 79]) assert.match(html,
    new RegExp(`data-source-button-object-id="${id}"`, "u"));
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|legacy navigation/u);
});
test("source instruction frames remain visible before the practice stop", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} frame={274} />);
  assert.match(html, /data-source-frame="274"/u);
  assert.doesNotMatch(html, /data-source-practice-point-count/u);
});
test("Spanish modern UI is functional and remains acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Nombra los puntos/u); assert.match(html, />Punto</u);
  assert.match(html, />Listo</u); assert.match(html, />Borrar</u);
  assert.match(html, /Repetir la lección/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
});
test("deterministic source evidence capture suppresses modern overlays", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="275"/u);
  assert.doesNotMatch(html, /data-source-practice-point-count|data-glossary-control-count/u);
});
test("source contract records controls without registration or acceptance expansion", () => {
  assert.equal(candidate.sourceContract.sourcePointCountPreserved, 4);
  assert.equal(candidate.sourceContract.sourceEditableCoordinateFieldCountPreserved, 8);
  assert.equal(candidate.sourceContract.sourceGlossaryControlCountPreserved, 6);
  assert.equal(candidate.sourceContract.sourceDoneClearAndTwoStepRemediationPreserved, true);
  assert.equal(candidate.sourceContract
    .legacyCourseShellNavigationAndPlayerChromeExcluded, true);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
});
