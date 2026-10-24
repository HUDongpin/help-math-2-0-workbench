import assert from "node:assert/strict";
import {describe, it} from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {CourseG04L11Ts002Renderer, COURSE_G04_L11_TS_002_SOURCE_CONTRACT} from
  "./course-g04-l11-ts-002";

const baseProps = Object.freeze({frameDomain: "sprite-27", rootFrame: 6,
  replay: 0, scenario: "source-authored-step-1", lang: "en" as const,
  seed: 0});

function render(frame: number, uiLanguage: "en" | "es" = "en") {
  return renderToStaticMarkup(<CourseG04L11Ts002Renderer {...baseProps}
    frame={frame} uiLanguage={uiLanguage} />);
}

describe("course-g04-l11-ts-002 unregistered modern candidate", () => {
  it("renders the empty authored four-cell plan before step 1 enters", () => {
    const html = render(1);
    assert.match(html, /data-flash-frame="1"/u);
    assert.match(html, /data-source-phase="empty-plan"/u);
    assert.equal((html.match(/data-authored-content="false"/gu) ?? []).length, 4);
    assert.doesNotMatch(html, /Restate the question\./u);
  });

  it("preserves exact text and only authors the first plan cell", () => {
    const html = render(300);
    assert.match(html, /Restate the question\./u);
    assert.match(html, /Read the .*problem.* and decide what the .*question.* is asking\./u);
    assert.match(html, /Write the question in your own words\./u);
    assert.equal((html.match(/data-authored-content="true"/gu) ?? []).length, 1);
    assert.equal((html.match(/data-authored-content="false"/gu) ?? []).length, 3);
    assert.match(html, /data-steps-two-through-four-empty="true"/u);
  });

  it("keeps the three source glossary terms as modern pedagogical controls", () => {
    const html = render(300);
    assert.match(html, /data-animation-internal-pedagogical-controls-preserved="true"/u);
    assert.match(html, /data-modern-glossary-control-count="3"/u);
    assert.match(html, /data-source-button-object-id="16"/u);
    assert.match(html, /data-source-button-object-id="17"/u);
    assert.match(html, /data-source-button-object-id="23"/u);
    assert.deepEqual(COURSE_G04_L11_TS_002_SOURCE_CONTRACT.sourceGlossaryTerms,
      ["Restate", "question", "problem"]);
  });

  it("clears the authored overlay on the source terminal frames", () => {
    const html = render(354);
    assert.match(html, /data-source-phase="terminal-cleared"/u);
    assert.equal((html.match(/data-authored-content="false"/gu) ?? []).length, 4);
    assert.doesNotMatch(html, /Restate the question\./u);
    assert.doesNotMatch(html, /Write the question in your own words\./u);
  });

  it("uses Spanish only for modern UI and does not invent source translation", () => {
    const html = render(300, "es");
    assert.match(html, /Plan de 4 Pasos/u);
    assert.match(html, /permanece en el inglés original/u);
    assert.match(html, /Restate the question\./u);
    assert.match(html, /data-source-instruction-language="en"/u);
    assert.match(html, /data-source-audio-enabled="false"/u);
  });

  it("excludes old Shell chrome, preloader, and unsourced player controls", () => {
    const html = render(300);
    assert.match(html, /data-legacy-course-shell-included="false"/u);
    assert.match(html, /data-legacy-player-chrome-included="false"/u);
    assert.match(html, /data-registered-current-javascript="false"/u);
    assert.doesNotMatch(html, /InternalPreloader|DoHyperLinks|_global\.KeyAttribute/u);
    assert.doesNotMatch(html, />Replay<|>Repetir<|Source sequence/u);
  });
});
