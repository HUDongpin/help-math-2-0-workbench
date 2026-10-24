import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L11_IN_003_STATIC_EVIDENCE,
  COURSE_G04_L11_IN_003_STATIC_SOURCE_FACTS,
} from "../source-static/g4-l11/course-g04-l11-in-003-static";
import {
  COURSE_G04_L11_IN_003_INTERACTION_AUTHORITY,
  COURSE_G04_L11_IN_003_INTERACTION_SOURCE,
  COURSE_G04_L11_IN_003_TERMS,
  createCourseG04L11In003OrderedPairState,
  getCourseG04L11In003SelectedTerm,
  reduceCourseG04L11In003OrderedPair,
} from "./course-g04-l11-in-003-ordered-pair-interaction";

test("binds the frozen IN003 source-static evidence and product boundary", () => {
  assert.equal(COURSE_G04_L11_IN_003_STATIC_EVIDENCE.swf.bytes, 321_684);
  assert.equal(COURSE_G04_L11_IN_003_STATIC_EVIDENCE.swf.sha256,
    "4e7de4f04322e5460b468c3ea066f56345fc345bcd10fca40ed990eefc695885");
  assert.equal(COURSE_G04_L11_IN_003_STATIC_EVIDENCE
    .frameDomainDisposition.sha256,
  "2db6c59edce70d8029854347282beab257e9da8f1772706fbda3a1e95735cc31");
  assert.equal(COURSE_G04_L11_IN_003_STATIC_SOURCE_FACTS.release.ordinal, 15);
  assert.equal(COURSE_G04_L11_IN_003_STATIC_SOURCE_FACTS
    .productBoundary.legacyCourseShellNavigationAndPlayerChromeIncluded,
  false);
  assert.equal(COURSE_G04_L11_IN_003_STATIC_SOURCE_FACTS
    .principalTimeline.sourceTerminalBehaviorEstablished, false);
  assert.equal(Object.isFrozen(COURSE_G04_L11_IN_003_STATIC_SOURCE_FACTS), true);
});

test("binds the exact 781-frame ordered-pair lesson", () => {
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_SOURCE.sourceTimelineId,
    "sprite-109");
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_SOURCE.sourceFrameCount, 781);
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_SOURCE
    .candidateTerminalHoldFrame, 781);
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_SOURCE.plottingOrder,
    "x-coordinate first; y-coordinate second");
  assert.deepEqual(COURSE_G04_L11_IN_003_INTERACTION_SOURCE.points, [
    {x: 2, y: 7, orderedPair: "(2,7)"},
    {x: 3, y: 5, orderedPair: "(3,5)"},
  ]);
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_SOURCE
    .nextOrderedPairVisualIsScriptedButton, false);
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_SOURCE
    .sourceTerminalBehaviorEstablished, false);
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_SOURCE
    .legacyCourseShellRequired, false);
});

test("preserves all six animation-internal glossary controls", () => {
  assert.deepEqual(COURSE_G04_L11_IN_003_TERMS.map((term) =>
    [term.sourceButtonObjectId, term.sourceKeyAttribute]), [
    ["51", "Locate"], ["52", "Ordered pair"],
    ["53", "Coordinate grid"], ["54", "Pair"],
    ["55", "Number"], ["56", "Point"],
  ]);
  for (const term of COURSE_G04_L11_IN_003_TERMS) {
    const selected = reduceCourseG04L11In003OrderedPair(
      createCourseG04L11In003OrderedPairState(240),
      {type: "select-term", termId: term.id, frame: 240},
    );
    assert.equal(selected.playing, false);
    assert.equal(selected.panelOpen, true);
    assert.equal(selected.legacyHostCallCount, 0);
    assert.equal(selected.audioEnabled, false);
    assert.equal(getCourseG04L11In003SelectedTerm(selected)?.label, term.label);
  }
});

test("host synchronization freezes during glossary help and resumes exactly", () => {
  let state = createCourseG04L11In003OrderedPairState(180);
  state = reduceCourseG04L11In003OrderedPair(state, {
    type: "select-term", termId: "coordinate-grid", frame: 180,
  });
  const frozen = reduceCourseG04L11In003OrderedPair(state,
    {type: "synchronize-frame", frame: 240});
  assert.equal(frozen, state);
  state = reduceCourseG04L11In003OrderedPair(frozen, {type: "close-term"});
  assert.equal(state.frame, 180);
  assert.equal(state.playing, false);
  state = reduceCourseG04L11In003OrderedPair(state,
    {type: "resume", frame: 240});
  assert.equal(state.frame, 240);
  assert.equal(state.playing, true);
});

test("candidate hold and modern Replay do not claim natural terminal parity", () => {
  let state = createCourseG04L11In003OrderedPairState(780);
  state = reduceCourseG04L11In003OrderedPair(state,
    {type: "synchronize-frame", frame: 781});
  assert.equal(state.frame, 781);
  assert.equal(state.playing, false);
  state = reduceCourseG04L11In003OrderedPair(state, {type: "replay"});
  assert.deepEqual(state, createCourseG04L11In003OrderedPairState());
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_AUTHORITY
    .sourceTerminalBehaviorEstablished, false);
});

test("invalid frames and invented controls fail closed", () => {
  assert.throws(() => createCourseG04L11In003OrderedPairState(782),
    /invalid IN003 local frame/u);
  assert.throws(() => reduceCourseG04L11In003OrderedPair(
    createCourseG04L11In003OrderedPairState(),
    {type: "select-term", termId: "old-shell" as "locate", frame: 1},
  ), /unknown IN003 term/u);
});

test("candidate authority does not promote fidelity or release", () => {
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_AUTHORITY
    .sourceCanvasSequenceRetained, true);
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_AUTHORITY
    .animationInternalPedagogicalControlsPreserved, true);
  assert.equal(COURSE_G04_L11_IN_003_INTERACTION_AUTHORITY
    .modernLocalReplayProvided, true);
  for (const [key, value] of Object.entries(
    COURSE_G04_L11_IN_003_INTERACTION_AUTHORITY,
  )) {
    if (["implementationCandidateOnly", "sourceCanvasSequenceRetained",
      "animationInternalPedagogicalControlsPreserved",
      "modernLocalReplayProvided"].includes(key)) continue;
    if (key === "strictAcceptanceEffect") assert.equal(value, "none");
    else assert.equal(value, false, key);
  }
});
