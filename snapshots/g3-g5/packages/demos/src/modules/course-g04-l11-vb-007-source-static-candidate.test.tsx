import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import candidate, {
  COURSE_G04_L11_VB_007_MOVIE,
  COURSE_G04_L11_VB_007_RUNTIME,
  COURSE_G04_L11_VB_007_SOURCE_CONTRACT,
  CourseG04L11Vb007Renderer,
} from "./course-g04-l11-vb-007";

const render = (uiLanguage: "en" | "es" = "en") =>
  renderToStaticMarkup(<CourseG04L11Vb007Renderer
    frame={69}
    frameDomain="sprite-254"
    lang="en"
    scenario="source-static-frame"
    seed={0}
    uiLanguage={uiLanguage}
  />);

test("keeps the 10-frame root and 107-frame principal separate", () => {
  assert.equal(candidate.movie.frameCount, 107);
  assert.equal(COURSE_G04_L11_VB_007_MOVIE.frameCount, 107);
  assert.equal(COURSE_G04_L11_VB_007_RUNTIME.frameCount, 10);
  assert.deepEqual(COURSE_G04_L11_VB_007_RUNTIME.frameDomains?.map((domain) =>
    [domain.id, domain.frameCount, domain.rootFrame]), [
    ["sprite-254", 107, 6],
  ]);
});

test("renders Point B and modern controls without old Shell chrome", () => {
  const markup = render();
  assert.match(markup, /data-canvas-status="idle"/u);
  assert.match(markup, /data-flash-frame="69"/u);
  assert.match(markup, /data-flash-frame-domain="sprite-254"/u);
  assert.match(markup, /data-legacy-course-shell-included="false"/u);
  assert.match(markup, /data-legacy-player-chrome-included="false"/u);
  assert.match(markup, /data-current-js-functional-candidate="true"/u);
  assert.doesNotMatch(markup, /InternalPreloader|showRightFeed|showWrongFeed/u);
});

test("preserves two answer controls and seven unique glossary terms", () => {
  const markup = render();
  assert.match(markup, /data-answer-control-count="2"/u);
  assert.match(markup, /data-glossary-term-count="7"/u);
  assert.equal((markup.match(/data-answer-outcome=/gu) ?? []).length, 2);
  assert.equal((markup.match(/data-modern-glossary-term=/gu) ?? []).length, 0);
  assert.equal((markup.match(/data-source-button-object-id=/gu) ?? []).length, 9);
  assert.match(markup, /data-source-button-object-id="40"/u);
  assert.match(markup, /data-source-button-object-id="39"/u);
  assert.match(markup, /data-source-button-object-id="9,77"/u);
});

test("supports Spanish modern controls without claiming source parity", () => {
  const markup = render("es");
  assert.match(markup, /Práctica de pares ordenados/u);
  assert.match(markup, /¿Qué par ordenado nombra el punto B\?/u);
  assert.match(markup, />Repetir</u);
  assert.equal(COURSE_G04_L11_VB_007_SOURCE_CONTRACT
    .sourceBranchCausalityEstablished, false);
  assert.equal(COURSE_G04_L11_VB_007_SOURCE_CONTRACT
    .sourceFeedbackVariantParityEstablished, false);
  assert.equal(COURSE_G04_L11_VB_007_SOURCE_CONTRACT.sourceAudioEnabled, false);
});

test("remains unregistered and acceptance neutral", () => {
  assert.equal(COURSE_G04_L11_VB_007_SOURCE_CONTRACT.registeredCurrentJavascript,
    false);
  assert.equal(COURSE_G04_L11_VB_007_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none");
  assert.equal(COURSE_G04_L11_VB_007_SOURCE_CONTRACT.interactionAuthority
    .authoritativeOriginalRuntimeAccepted, false);
  assert.equal(COURSE_G04_L11_VB_007_SOURCE_CONTRACT.interactionAuthority
    .visualFidelityEstablished, false);
  assert.equal(COURSE_G04_L11_VB_007_SOURCE_CONTRACT.interactionAuthority
    .strictMigrationComplete, false);
});
