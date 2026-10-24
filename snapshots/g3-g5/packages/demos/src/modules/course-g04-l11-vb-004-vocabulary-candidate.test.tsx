import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import type {AnimationModule, AnimationRendererProps} from "../contract";
import {createCourseG04L11Vb004VocabularyCandidate} from "./course-g04-l11-vb-004-vocabulary-candidate";

function SourceRenderer({frame}: AnimationRendererProps) {
  return <div data-source-frame={frame}>source frame {frame}</div>;
}

const sourceModule = Object.freeze({
  key: "course-g04-l11-vb-004-source-static-candidate",
  movie: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333}),
  runtime: Object.freeze({stage: Object.freeze({width: 800, height: 600}),
    fps: 12, frameCount: 10, durationMs: 833.333333,
    frameDomains: Object.freeze([
      Object.freeze({id: "root", frameCount: 10, fps: 12}),
      Object.freeze({id: "sprite-71", frameCount: 157, fps: 12, rootFrame: 6}),
    ]), defaultFrameDomain: "sprite-71"}),
  playbackMode: "once",
  scenarios: Object.freeze([{id: "source-static-frame", label: "Source frame"}]),
  audioCues: Object.freeze([]),
  maturity: "legacy-prototype",
  Renderer: SourceRenderer,
  getFrameState: (frame: number) => Object.freeze({frame}),
} satisfies AnimationModule);

const candidate = createCourseG04L11Vb004VocabularyCandidate({
  Renderer: SourceRenderer,
  module: sourceModule,
  movie: sourceModule.movie,
  sourceContract: Object.freeze({sourceVisualAuthority: "future-source-canvas"}),
});

const props = Object.freeze({
  frame: 9,
  frameDomain: "sprite-71",
  rootFrame: 6,
  replay: 0,
  scenario: "source-static-frame",
  lang: "en" as const,
  seed: 0,
});

test("wraps the future source Canvas candidate without registering VB004", () => {
  assert.notEqual(candidate.Renderer, SourceRenderer);
  assert.equal(candidate.module.key, sourceModule.key);
  assert.equal(candidate.module.Renderer, candidate.Renderer);
  assert.equal(candidate.sourceContract.sourceVisualAuthority,
    "future-source-canvas");
  assert.equal(candidate.sourceContract.animationInternalPedagogicalControlsPreserved,
    true);
  assert.equal(candidate.sourceContract
    .legacyCourseShellNavigationAndPlayerChromeExcluded, true);
  assert.equal(candidate.sourceContract.registeredCurrentJavascript, false);
  assert.equal(candidate.sourceContract.strictAcceptanceEffect, "none");
});

test("renders all four source-bound controls with accessible modern copy", () => {
  const html = renderToStaticMarkup(<candidate.Renderer {...props} />);
  assert.match(html, /data-animation-internal-control-count="4"/u);
  assert.match(html, /data-source-button-object-id="46"/u);
  assert.match(html, /data-source-key-attribute="Y-axis"/u);
  assert.match(html, /data-source-key-attribute="Vertical"/u);
  assert.match(html, /data-source-key-attribute="Number line"/u);
  assert.match(html, /data-source-key-attribute="Coordinate grid"/u);
  assert.match(html, />Replay</u);
  assert.match(html, /data-source-replay-parity="unvalidated"/u);
  assert.match(html,
    /\[data-source-replay-parity=&quot;unvalidated&quot;\]|\[data-source-replay-parity="unvalidated"\]/u);
  assert.doesNotMatch(html, /DoHyperLinks|InternalPreloader|legacy navigation/u);
});

test("Spanish UI retains exact English source terms without claiming parity", () => {
  const html = renderToStaticMarkup(
    <candidate.Renderer {...props} uiLanguage="es" />,
  );
  assert.match(html, /Eje vertical y/u);
  assert.match(html, /Los términos de la fuente se conservan en inglés/u);
  assert.match(html, /data-source-definition-parity-established="false"/u);
  assert.match(html, />Y-axis</u);
  assert.match(html, />Repetir</u);
});

test("deterministic evidence capture suppresses the modern interaction overlay", () => {
  const html = renderToStaticMarkup(
    <candidate.Renderer {...props} entryStateSha256={"a".repeat(64)} />,
  );
  assert.match(html, /data-source-frame="9"/u);
  assert.doesNotMatch(html, /data-animation-internal-control-count/u);
  assert.doesNotMatch(html, /data-modern-pedagogical-emphasis/u);
});
