import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import candidate, {
  COURSE_G04_L11_VB_006_MOVIE,
  COURSE_G04_L11_VB_006_RUNTIME,
  COURSE_G04_L11_VB_006_SOURCE_CONTRACT,
  CourseG04L11Vb006Renderer,
} from "./course-g04-l11-vb-006";

const render = (frame: number, uiLanguage: "en" | "es" = "en") =>
  renderToStaticMarkup(<CourseG04L11Vb006Renderer
    frame={frame}
    frameDomain="sprite-85"
    lang="en"
    scenario="source-static-frame"
    seed={0}
    uiLanguage={uiLanguage}
  />);

test("keeps the 10-frame root and 439-frame source child separate", () => {
  assert.equal(candidate.movie.frameCount, 439);
  assert.equal(COURSE_G04_L11_VB_006_MOVIE.frameCount, 439);
  assert.equal(COURSE_G04_L11_VB_006_RUNTIME.frameCount, 10);
  assert.deepEqual(COURSE_G04_L11_VB_006_RUNTIME.frameDomains?.map((domain) =>
    [domain.id, domain.frameCount, domain.rootFrame]), [
    ["sprite-85", 439, 6],
  ]);
});

test("renders the source Canvas candidate and excludes old Shell chrome", () => {
  const markup = render(64);
  assert.match(markup, /data-canvas-status="idle"/u);
  assert.match(markup, /data-flash-frame-domain="sprite-85"/u);
  assert.match(markup, /data-legacy-course-shell-included="false"/u);
  assert.match(markup, /data-legacy-player-chrome-included="false"/u);
  assert.match(markup, /data-current-js-functional-candidate="true"/u);
  assert.doesNotMatch(markup, /InternalPreloader|Coach_audio/u);
});

test("reveals source term controls according to their placement frames", () => {
  const frame1 = render(1);
  assert.equal((frame1.match(/data-source-button-object-id=/gu) ?? []).length, 5);
  assert.doesNotMatch(frame1, /data-source-button-object-id="55"/u);
  const frame64 = render(64);
  assert.equal((frame64.match(/data-source-button-object-id=/gu) ?? []).length, 6);
  assert.match(frame64, /data-source-button-object-id="55"/u);
  const frame424 = render(424);
  assert.doesNotMatch(frame424, /data-source-button-object-id="78"/u);
  const frame425 = render(425);
  assert.match(frame425, /data-source-button-object-id="78"/u);
  assert.match(frame425,
    /data-source-button-object-id="78" disabled="" style="opacity:0"/u);
  const frame430 = render(430);
  assert.equal((frame430.match(/data-source-button-object-id=/gu) ?? []).length, 7);
  assert.match(frame430, /style="opacity:1"/u);
});

test("supports Spanish modern controls without claiming source parity", () => {
  const markup = render(64, "es");
  assert.match(markup, /Par ordenado y coordenadas/u);
  assert.match(markup, />Repetir</u);
  assert.equal(COURSE_G04_L11_VB_006_SOURCE_CONTRACT
    .sourceDefinitionTextParityEstablished, false);
  assert.equal(COURSE_G04_L11_VB_006_SOURCE_CONTRACT.sourceAudioEnabled, false);
});

test("remains unregistered and acceptance neutral", () => {
  assert.equal(COURSE_G04_L11_VB_006_SOURCE_CONTRACT.registeredCurrentJavascript,
    false);
  assert.equal(COURSE_G04_L11_VB_006_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none");
  assert.equal(COURSE_G04_L11_VB_006_SOURCE_CONTRACT.interactionAuthority
    .authoritativeOriginalRuntimeAccepted, false);
  assert.equal(COURSE_G04_L11_VB_006_SOURCE_CONTRACT.interactionAuthority
    .visualFidelityEstablished, false);
  assert.equal(COURSE_G04_L11_VB_006_SOURCE_CONTRACT.interactionAuthority
    .strictMigrationComplete, false);
});
