import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {COURSE_G04_L11_TS_002_AUTHORITY, COURSE_G04_L11_TS_002_RUNTIME,
  COURSE_G04_L11_TS_002_SOURCE, getCourseG04L11Ts002FrameState} from
  "./course-g04-l11-ts-002";

const context = Object.freeze({frame: 1, frameDomain: "sprite-27", scenario: "source-authored-step-1",
  lang: "en" as const, seed: 0});

describe("course-g04-l11-ts-002 authored step-one timeline", () => {
  it("binds root and nested source domains without flattening", () => {
    assert.equal(COURSE_G04_L11_TS_002_SOURCE.rootFrameCount, 10);
    assert.equal(COURSE_G04_L11_TS_002_SOURCE.mainFrameCount, 354);
    assert.deepEqual(COURSE_G04_L11_TS_002_RUNTIME.frameDomains, [
      {id: "root", frameCount: 10, fps: 12},
      {id: "sprite-27", frameCount: 354, fps: 12, rootFrame: 6},
    ]);
  });

  it("preserves every authored phase boundary", () => {
    const expected = [
      [1, "empty-plan"], [88, "empty-plan"], [89, "step-heading-enter"],
      [96, "step-heading-enter"], [97, "step-heading-held"],
      [149, "step-heading-held"], [150, "first-instruction-enter"],
      [157, "first-instruction-enter"], [158, "first-instruction-held"],
      [220, "first-instruction-held"], [221, "second-instruction-enter"],
      [228, "second-instruction-enter"], [229, "complete-step-one"],
      [352, "complete-step-one"], [353, "terminal-cleared"],
      [354, "terminal-cleared"],
    ] as const;
    for (const [frame, phase] of expected) {
      const state = getCourseG04L11Ts002FrameState(frame, context);
      assert.equal(state.status, "ready"); assert.equal(state.phase, phase);
      assert.equal(Object.isFrozen(state), true);
    }
  });

  it("reveals only authored step 1 and keeps steps 2 through 4 empty", () => {
    const complete = getCourseG04L11Ts002FrameState(300, context);
    assert.equal(complete.stepHeadingVisible, true);
    assert.equal(complete.firstCellTextVisible, true);
    assert.equal(complete.firstInstructionVisible, true);
    assert.equal(complete.secondInstructionVisible, true);
    assert.equal(complete.authoredStepCount, 1);
    assert.equal(complete.emptyFutureStepCount, 3);
    const terminal = getCourseG04L11Ts002FrameState(354, context);
    assert.equal(terminal.terminalCleared, true);
    assert.equal(terminal.stepHeadingVisible, false);
    assert.equal(terminal.firstCellTextVisible, false);
  });

  it("keeps source audio and acceptance authority disabled", () => {
    assert.equal(COURSE_G04_L11_TS_002_SOURCE.sourceAudioEnabled, false);
    assert.equal(COURSE_G04_L11_TS_002_SOURCE.sourceAudioAccepted, false);
    assert.equal(COURSE_G04_L11_TS_002_AUTHORITY.registeredCurrentJavascript, false);
    assert.equal(COURSE_G04_L11_TS_002_AUTHORITY.legacyCourseShellNavigationIncluded,
      false);
    assert.equal(COURSE_G04_L11_TS_002_AUTHORITY.strictAcceptanceEffect, "none");
  });

  it("fails closed for invalid domains, scenarios, and frames", () => {
    assert.equal(getCourseG04L11Ts002FrameState(1,
      {...context, frameDomain: "sprite-999"}).blocker, "unsupported-frame-domain");
    assert.equal(getCourseG04L11Ts002FrameState(1,
      {...context, scenario: "default"}).blocker, "unsupported-scenario");
    assert.equal(getCourseG04L11Ts002FrameState(355, context).blocker, "invalid-frame");
  });
});
