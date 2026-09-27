import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";

import candidate, {
  COURSE_G04_L11_VB_005_RUNTIME,
  COURSE_G04_L11_VB_005_SOURCE_CONTRACT,
  CourseG04L11Vb005AxisPracticeRenderer,
  getCourseG04L11Vb005FrameState,
} from "./course-g04-l11-vb-005-axis-practice-candidate";

const props = Object.freeze({
  frame: 102,
  frameDomain: "sprite-101",
  rootFrame: 6,
  scenario: "source-static-axis-practice-candidate",
  lang: "en" as const,
  seed: 0,
});

test("keeps the source root and 142-frame child domains separate", () => {
  assert.equal(candidate.movie.frameCount, 10);
  assert.equal(COURSE_G04_L11_VB_005_RUNTIME.frameCount, 10);
  assert.deepEqual(COURSE_G04_L11_VB_005_RUNTIME.frameDomains?.map((domain) =>
    [domain.id, domain.frameCount, domain.rootFrame]), [
    ["root", 10, undefined], ["sprite-101", 142, 6],
  ]);
  assert.equal(getCourseG04L11Vb005FrameState(102, props)
    .functionalInteractionVisible, true);
  assert.throws(() => getCourseG04L11Vb005FrameState(143, props),
    /invalid VB005 sprite-101 frame/u);
});

test("renders modern internal controls without the old shell or player chrome", () => {
  const markup = renderToStaticMarkup(
    <CourseG04L11Vb005AxisPracticeRenderer {...props} />,
  );
  assert.match(markup, /data-legacy-course-shell-included="false"/u);
  assert.match(markup, /data-legacy-player-chrome-included="false"/u);
  assert.match(markup,
    /data-animation-internal-pedagogical-controls-preserved="true"/u);
  assert.match(markup, /data-source-instance="Scr_1"/u);
  assert.match(markup, /data-source-instance="Scr_2"/u);
  assert.match(markup, /data-axis-target="horizontal-axis"/u);
  assert.match(markup, /data-axis-target="vertical-axis"/u);
  assert.doesNotMatch(markup, /InternalPreloader|Coach_audio_1|old course shell/iu);
});

test("exposes all five modernized source term controls and Replay", () => {
  const markup = renderToStaticMarkup(
    <CourseG04L11Vb005AxisPracticeRenderer {...props} />,
  );
  for (const id of ["54", "55", "56", "57", "89"]) {
    assert.match(markup, new RegExp(`data-source-button-object-id="${id}"`, "u"));
  }
  assert.match(markup, />Replay</u);
  assert.match(markup, /aria-live="polite"/u);
});

test("Spanish changes modern UI copy without claiming source parity", () => {
  const markup = renderToStaticMarkup(
    <CourseG04L11Vb005AxisPracticeRenderer {...props} uiLanguage="es" />,
  );
  assert.match(markup, /Práctica de ejes/u);
  assert.equal(COURSE_G04_L11_VB_005_SOURCE_CONTRACT
    .sourceSpanishParityEstablished, false);
  assert.equal(COURSE_G04_L11_VB_005_SOURCE_CONTRACT.sourceAudioEnabled, false);
  assert.equal(COURSE_G04_L11_VB_005_SOURCE_CONTRACT.registeredCurrentJavascript,
    false);
});

test("keeps every acceptance and release claim false", () => {
  assert.equal(COURSE_G04_L11_VB_005_SOURCE_CONTRACT.status,
    "unregistered-functional-engineering-candidate");
  assert.equal(COURSE_G04_L11_VB_005_SOURCE_CONTRACT
    .sourceVisualSequenceReconstructed, false);
  for (const key of [
    "registeredCurrentJavascript", "authoritativeOriginalRuntimeAccepted",
    "behaviorParityEstablished", "visualFidelityEstablished",
    "humanVisualReviewAccepted", "ownerAccepted", "strictMigrationComplete",
    "lessonReleased", "published",
  ] as const) {
    assert.equal(COURSE_G04_L11_VB_005_SOURCE_CONTRACT[key], false, key);
  }
  assert.equal(COURSE_G04_L11_VB_005_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none");
});
