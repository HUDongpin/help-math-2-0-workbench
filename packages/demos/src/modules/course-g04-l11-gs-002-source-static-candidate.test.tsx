import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11Gs002GameDirectionsCandidate} from
  "./course-g04-l11-gs-002-game-directions-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}
const sourceModule = Object.freeze({
  key: "course-g04-l11-gs-002-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
    frameCount: 10, durationMs: 833.333333, frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-227", frameCount: 729, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-227"}), playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]), maturity: "legacy-prototype", Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);
const candidate = createCourseG04L11Gs002GameDirectionsCandidate({
  Renderer: SourceRenderer, module: sourceModule, movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "source-canvas-candidate"}),
});
const props = Object.freeze({frame: 728, frameDomain: "sprite-227", rootFrame: 6,
  replay: 0, scenario: "source-static-frame", lang: "en" as const, seed: 0});

test("wraps GS002 without registration or the legacy course shell", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.sourceContract.interaction.sourceDirectionAndLaunchControlCount, 6);
  assert.equal(candidate.sourceContract.interaction.sourceGlossaryControlCount, 1);
  assert.equal(candidate.sourceContract.authority.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.authority.legacyCourseShellNavigationIncluded,
    false);
});

test("renders exact directions, score rule, levels, and internal controls", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /Find the matching pairs/u);
  assert.match(html, /Click one box then find the next box/u);
  assert.match(html, />\+10</u); assert.match(html, />−2</u);
  assert.match(html, /data-source-control="mcL1"/u);
  assert.match(html, /data-source-control="mcL2"/u);
  assert.match(html, /data-source-control="mcStart"/u);
  assert.match(html, /data-source-control="mcRepeat"/u);
  assert.match(html, /data-source-key-attribute="Pair"/u);
  assert.match(html, /data-animation-internal-pedagogical-control-count="7"/u);
});

test("uses the clean pre-popup frame and masks six old control visuals", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-source-frame="727"/u);
  assert.match(html, /data-source-select-level-frame="728"/u);
  assert.match(html, /data-modern-replaced-source-control-visual-count="6"/u);
  assert.doesNotMatch(html, /Select the Level and Click Start to Begin the Game or/u);
});

test("excludes old Shell and refuses to manufacture the unresolved GS003 handoff", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-legacy-course-shell-included="false"/u);
  assert.match(html, /data-legacy-player-chrome-included="false"/u);
  assert.match(html, /data-host-handoff-semantics-established="false"/u);
  assert.match(html, /data-delegated-game-mounted="false"/u);
  assert.match(html, /data-source-audio-enabled="false"/u);
  assert.doesNotMatch(html, /InternalPreloader|doNeedMoreHelp\(/u);
});

test("Spanish modern directions remain acceptance-neutral", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} uiLanguage="es" />);
  assert.match(html, /Juego de parejas en la cuadrícula/u);
  assert.match(html, /Elige un nivel/u);
  assert.match(html, />Nivel 1</u); assert.match(html, />Nivel 2</u);
  assert.match(html, /Repetir instrucciones/u);
  assert.match(html, /data-registered-current-javascript="false"/u);
});

test("deterministic evidence capture suppresses modern interaction UI", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props}
    entryStateSha256={"a".repeat(64)} />);
  assert.match(html, /data-source-frame="728"/u);
  assert.doesNotMatch(html, /data-modern-replaced-source-control-visual-count/u);
  assert.doesNotMatch(html, /data-animation-internal-pedagogical-control-count/u);
  assert.doesNotMatch(html, /Choose a level/u);
});
