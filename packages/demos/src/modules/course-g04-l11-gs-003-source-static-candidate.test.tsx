import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11Gs003GameCandidate} from
  "./course-g04-l11-gs-003-game-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({
  key: "course-g04-l11-gs-003-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333, frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-231", frameCount: 6, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-231"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11Gs003GameCandidate({
  Renderer: SourceRenderer, module: sourceModule, movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});
const props = Object.freeze({frame: 3, frameDomain: "sprite-231", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps GS003 without registration or legacy course chrome", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.interaction.sourcePairCountPerLevel, 6);
  assert.equal(candidate.sourceContract.authority.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.authority.legacyCourseShellNavigationIncluded,
    false);
  assert.equal(candidate.sourceContract.exactSourcePairIdentityPreserved, true);
});

test("renders the modern internal game directions and source score rule", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /Coordinate Grid Match Game/u);
  assert.match(html, /Find all six matching pairs/u);
  assert.match(html, /adds 10 points/u); assert.match(html, /subtracts 2/u);
  assert.match(html, /data-animation-internal-pedagogical-controls-preserved="true"/u);
  assert.match(html, /data-exact-source-pair-count="6"/u);
  assert.match(html, /Choose a level/u);
});

test("excludes old Shell, old source controls, and unaccepted audio", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
  assert.match(html, /Original music is not yet accepted/u);
  assert.doesNotMatch(html, /InternalPreloader|doNeedMoreHelp\(|doHyperLinks\(/u);
  assert.doesNotMatch(html, /data-source-frame=/u);
});

test("renders bilingual modern directions without inventing Spanish audio", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Juego de parejas en la cuadrícula/u);
  assert.match(html, /Encuentra las seis parejas/u);
  assert.match(html, /Elegir nivel/u);
  assert.match(html, /La música original aún no está aprobada/u);
  assert.match(html, /data-source-audio-accepted="false"/u);
});

test("deterministic evidence capture suppresses modern UI and exposes source frame", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="3"/u);
  assert.doesNotMatch(html, /Find all six matching pairs/u);
  assert.doesNotMatch(html, /data-animation-internal-pedagogical-controls-preserved/u);
});
