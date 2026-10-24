import assert from "node:assert/strict";
import test from "node:test";

import {
  COURSE_G04_L03_TS_008_CHOICES,
  COURSE_G04_L03_TS_008_DONOR_POLICY,
  COURSE_G04_L03_TS_008_GLOSSARY,
  COURSE_G04_L03_TS_008_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TS_008_NEED_MORE_HELP,
  COURSE_G04_L03_TS_008_PLAYBACK_POLICY,
  COURSE_G04_L03_TS_008_QUESTION,
  COURSE_G04_L03_TS_008_RIGHT_FEEDBACK_WINDOWS,
  COURSE_G04_L03_TS_008_SOURCE,
  COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS,
  COURSE_G04_L03_TS_008_WRONG_FEEDBACK_WINDOWS,
  createCourseG04L03Ts008InteractionState,
  reduceCourseG04L03Ts008Interaction,
  type CourseG04L03Ts008ChoiceId,
  type CourseG04L03Ts008InteractionState,
} from "../src/timelines/course-g04-l03-ts-008-practice-question-interaction";

const continueWalkthrough = (state: CourseG04L03Ts008InteractionState) =>
  reduceCourseG04L03Ts008Interaction(state, {
    type: "continue-walkthrough",
  });

const revealBox = (state: CourseG04L03Ts008InteractionState) =>
  reduceCourseG04L03Ts008Interaction(state, {
    type: "reveal-walkthrough-box",
  });

const closeBox = (state: CourseG04L03Ts008InteractionState) =>
  reduceCourseG04L03Ts008Interaction(state, {
    type: "close-walkthrough-box",
  });

const choose = (
  state: CourseG04L03Ts008InteractionState,
  choiceId: CourseG04L03Ts008ChoiceId,
) =>
  reduceCourseG04L03Ts008Interaction(state, {
    type: "choose",
    choiceId,
  });

const completeFeedback = (state: CourseG04L03Ts008InteractionState) =>
  reduceCourseG04L03Ts008Interaction(state, {type: "feedback-complete"});

const reachFrame592 = (seed = 0): CourseG04L03Ts008InteractionState =>
  continueWalkthrough(
    continueWalkthrough(createCourseG04L03Ts008InteractionState(seed)),
  );

const reachQuiz = (seed = 0): CourseG04L03Ts008InteractionState => {
  let state = reachFrame592(seed);
  state = revealBox(state);
  state = closeBox(state);
  state = revealBox(state);
  return closeBox(state);
};

test("TS008 locks the SWF-only source identity, question, A-D order, D answer, and stage-space hit bounds", () => {
  assert.deepEqual(COURSE_G04_L03_TS_008_SOURCE, {
    swfPath:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/TS/L3TS08.swf",
    swfSha256:
      "9c7288f67f764e02f4320655b64dbb57d3d690a75951b549ee5113f385e6b885",
    pairedFlaStatus: "missing",
    stage: {width: 800, height: 600},
    backgroundColor: "#b8d8f7",
    fps: 12,
    rootFrameCount: 10,
    rootBeginFrame: 6,
    frameDomain: "sprite-350",
    frameCount: 789,
    liveSourcePlaybackStopFrame: 328,
  });
  assert.deepEqual(COURSE_G04_L03_TS_008_QUESTION, {
    prompt:
      "Toni has $7. Elvin has $3. Susan owes $10. Ricky owes $2. Who has the most money?",
    correctChoiceId: "D",
    quizFrame: 770,
    terminalFrame: 789,
  });
  assert.deepEqual(
    COURSE_G04_L03_TS_008_CHOICES.map(
      ({
        id,
        sourceInstance,
        sourceButtonObjectId,
        person,
        sourceStatement,
        signedValue,
        correct,
        hitBounds,
      }) => ({
        id,
        sourceInstance,
        sourceButtonObjectId,
        person,
        sourceStatement,
        signedValue,
        correct,
        hitBounds,
      }),
    ),
    [
      {
        id: "A",
        sourceInstance: "AnsBtn1",
        sourceButtonObjectId: 159,
        person: "Elvin",
        sourceStatement: "Elvin has $3.",
        signedValue: 3,
        correct: false,
        hitBounds: {x: 574.7, y: 203.9, width: 90.7, height: 40},
      },
      {
        id: "B",
        sourceInstance: "AnsBtn2",
        sourceButtonObjectId: 156,
        person: "Ricky",
        sourceStatement: "Ricky owes $2.",
        signedValue: -2,
        correct: false,
        hitBounds: {x: 575, y: 269.5, width: 95.1, height: 40},
      },
      {
        id: "C",
        sourceInstance: "AnsBtn3",
        sourceButtonObjectId: 158,
        person: "Susan",
        sourceStatement: "Susan owes $10.",
        signedValue: -10,
        correct: false,
        hitBounds: {x: 573.4, y: 327.4, width: 106.3, height: 38},
      },
      {
        id: "D",
        sourceInstance: "AnsBtn4",
        sourceButtonObjectId: 157,
        person: "Toni",
        sourceStatement: "Toni has $7.",
        signedValue: 7,
        correct: true,
        hitBounds: {x: 574.7, y: 386.4, width: 89.3, height: 41},
      },
    ],
  );
});

test("TS008 locks all four source steps, reveal/Close obligations, exact normalized text, and geometry", () => {
  assert.deepEqual(
    COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS.map(
      ({
        id,
        sourceStopFrame,
        nextFrame,
        functionalDonorFrame,
        sourceOverlayButtonObjectId,
        sourceUnderlayObjectId,
        sourceOverlayDepth,
        sourceUnderlayDepth,
        revealThenClose,
        sourceRevealSpriteId,
        sourceCloseButtonObjectId,
        hitBounds,
      }) => ({
        id,
        sourceStopFrame,
        nextFrame,
        functionalDonorFrame,
        sourceOverlayButtonObjectId,
        sourceUnderlayObjectId,
        sourceOverlayDepth,
        sourceUnderlayDepth,
        revealThenClose,
        sourceRevealSpriteId,
        sourceCloseButtonObjectId,
        hitBounds,
      }),
    ),
    [
      {
        id: 1,
        sourceStopFrame: 328,
        nextFrame: 465,
        functionalDonorFrame: 328,
        sourceOverlayButtonObjectId: 50,
        sourceUnderlayObjectId: 48,
        sourceOverlayDepth: 73,
        sourceUnderlayDepth: 71,
        revealThenClose: false,
        sourceRevealSpriteId: null,
        sourceCloseButtonObjectId: null,
        hitBounds: {x: 70.3, y: 157.5, width: 219.7, height: 133.1},
      },
      {
        id: 2,
        sourceStopFrame: 465,
        nextFrame: 592,
        functionalDonorFrame: 465,
        sourceOverlayButtonObjectId: 50,
        sourceUnderlayObjectId: 48,
        sourceOverlayDepth: 78,
        sourceUnderlayDepth: 71,
        revealThenClose: false,
        sourceRevealSpriteId: null,
        sourceCloseButtonObjectId: null,
        hitBounds: {x: 70.3, y: 304.5, width: 219.7, height: 167.2},
      },
      {
        id: 3,
        sourceStopFrame: 592,
        nextFrame: 712,
        functionalDonorFrame: 465,
        sourceOverlayButtonObjectId: 50,
        sourceUnderlayObjectId: 48,
        sourceOverlayDepth: 78,
        sourceUnderlayDepth: 72,
        revealThenClose: true,
        sourceRevealSpriteId: "sprite-142",
        sourceCloseButtonObjectId: 141,
        hitBounds: {x: 301.3, y: 161, width: 213.6, height: 126.1},
      },
      {
        id: 4,
        sourceStopFrame: 712,
        nextFrame: 770,
        functionalDonorFrame: 465,
        sourceOverlayButtonObjectId: 50,
        sourceUnderlayObjectId: 48,
        sourceOverlayDepth: 78,
        sourceUnderlayDepth: 71,
        revealThenClose: true,
        sourceRevealSpriteId: "sprite-153",
        sourceCloseButtonObjectId: 141,
        hitBounds: {x: 298.3, y: 304.5, width: 219.7, height: 167.2},
      },
    ],
  );
  assert.deepEqual(
    COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS.map(({visibleText}) => visibleText),
    [
      ["Who has the most money?"],
      [
        "Information given:",
        "Toni has $7.",
        "Elvin has $3.",
        "Susan owes $10.",
        "Ricky owes $2.",
        "Information needed: who has the most money?",
      ],
      [
        "Use strategy: Draw a picture. Make a number line.",
        "Place each person's name on the number line based on the amount of money they have or owe:",
        "Susan −10; Ricky −2; Elvin +3; Toni +7.",
        "Toni has the most money with $7.",
        "The correct answer choice is D.",
      ],
      [
        "Use strategy: Use Logical Reasoning",
        "Having money means you have a positive amount. Owing money means you have a negative amount.",
        "Toni has $7 = +7",
        "Elvin has $3 = +3",
        "Susan owes $10 = −10",
        "Ricky owes $2 = −2",
        "Toni has the most money with $7.",
        "The correct answer choice is D.",
      ],
    ],
  );
});

test("TS008 locks the clean-donor policy and explicitly rejects direct functional use of 592, 712, and 770", () => {
  assert.deepEqual(
    COURSE_G04_L03_TS_008_DONOR_POLICY.functionalStateMap.map(
      ({state, sourceFrame, donorFrame}) => ({
        state,
        sourceFrame,
        donorFrame,
      }),
    ),
    [
      {state: "walkthrough-step-1", sourceFrame: 328, donorFrame: 328},
      {state: "walkthrough-step-2", sourceFrame: 465, donorFrame: 465},
      {state: "walkthrough-step-3", sourceFrame: 592, donorFrame: 465},
      {state: "walkthrough-step-4", sourceFrame: 712, donorFrame: 465},
      {state: "quiz", sourceFrame: 770, donorFrame: 769},
      {state: "terminal", sourceFrame: 789, donorFrame: 789},
    ],
  );
  assert.deepEqual(
    COURSE_G04_L03_TS_008_DONOR_POLICY.unsafeDirectSourceFrames.map(
      ({frame}) => frame,
    ),
    [592, 712, 770],
  );
  for (const unsafe of
    COURSE_G04_L03_TS_008_DONOR_POLICY.unsafeDirectSourceFrames) {
    assert.ok(unsafe.reason.length > 40);
  }
  assert.match(
    COURSE_G04_L03_TS_008_DONOR_POLICY.deterministicCapturePolicy,
    /exact requested source frame/,
  );
  assert.equal(
    COURSE_G04_L03_TS_008_DONOR_POLICY.sourceParityEstablished,
    false,
  );
});

test("TS008 begins at 328 and enforces both reveal-then-Close gates before quiz 770", () => {
  let state = createCourseG04L03Ts008InteractionState(9);
  assert.deepEqual(state, {
    seed: 9,
    phase: "walkthrough",
    walkthroughGate: 0,
    walkthroughBoxRevealed: false,
    frame: 328,
    wrongTryCount: 0,
    selectedChoiceId: null,
    feedback: null,
    focusTarget: "walkthrough-step-1",
    needMoreHelpReturnPhase: null,
    needMoreHelpReturnFocus: null,
  });
  assert.equal(revealBox(state), state);
  assert.equal(closeBox(state), state);

  state = continueWalkthrough(state);
  assert.equal(state.frame, 465);
  assert.equal(state.walkthroughGate, 1);
  assert.equal(state.focusTarget, "walkthrough-step-2");

  state = continueWalkthrough(state);
  assert.equal(state.frame, 592);
  assert.equal(state.walkthroughGate, 2);
  assert.equal(state.walkthroughBoxRevealed, false);
  assert.equal(state.focusTarget, "walkthrough-step-3");
  assert.equal(continueWalkthrough(state), state);
  assert.equal(closeBox(state), state);

  state = revealBox(state);
  assert.equal(state.frame, 592);
  assert.equal(state.walkthroughBoxRevealed, true);
  assert.equal(state.focusTarget, "walkthrough-box-3-close");
  assert.equal(revealBox(state), state);
  assert.equal(continueWalkthrough(state), state);

  state = closeBox(state);
  assert.equal(state.frame, 712);
  assert.equal(state.walkthroughGate, 3);
  assert.equal(state.walkthroughBoxRevealed, false);
  assert.equal(state.focusTarget, "walkthrough-step-4");
  assert.equal(closeBox(state), state);

  state = revealBox(state);
  assert.equal(state.frame, 712);
  assert.equal(state.walkthroughBoxRevealed, true);
  assert.equal(state.focusTarget, "walkthrough-box-4-close");

  state = closeBox(state);
  assert.equal(state.phase, "quiz");
  assert.equal(state.frame, 770);
  assert.equal(state.walkthroughGate, null);
  assert.equal(state.walkthroughBoxRevealed, false);
  assert.equal(state.focusTarget, "choice-A");
  assert.equal(continueWalkthrough(state), state);
  assert.equal(revealBox(state), state);
  assert.equal(closeBox(state), state);
});

test("TS008 exhausts A-D and binds seed modulo 3/4 to the exact reachable feedback copy pools", () => {
  for (const choiceId of ["A", "B", "C", "D"] as const) {
    const feedback = choose(reachQuiz(5), choiceId);
    assert.equal(feedback.phase, "feedback");
    assert.equal(feedback.feedback?.choiceId, choiceId);
    assert.equal(feedback.feedback?.kind, choiceId === "D" ? "right" : "wrong");
    assert.equal(
      feedback.feedback?.branch,
      choiceId === "D" ? (5 % 4) + 1 : (5 % 3) + 1,
    );
    assert.equal(feedback.feedback?.copy, feedback.feedback?.sourceWindow.copy);
  }

  assert.deepEqual(
    COURSE_G04_L03_TS_008_WRONG_FEEDBACK_WINDOWS.map(
      ({branch, copy, sourceInstance, sourceSpriteId, sourceEndFrame}) => ({
        branch,
        copy,
        sourceInstance,
        sourceSpriteId,
        sourceEndFrame,
      }),
    ),
    [
      {
        branch: 1,
        copy: "That's incorrect!",
        sourceInstance: "Mc_Wrong_Feed1",
        sourceSpriteId: "sprite-197",
        sourceEndFrame: 28,
      },
      {
        branch: 2,
        copy: "Incorrect!",
        sourceInstance: "Mc_Wrong_Feed2",
        sourceSpriteId: "sprite-232",
        sourceEndFrame: 31,
      },
      {
        branch: 3,
        copy: "Try Again!",
        sourceInstance: "Mc_Wrong_Feed3",
        sourceSpriteId: "sprite-208",
        sourceEndFrame: 28,
      },
    ],
  );
  assert.deepEqual(
    COURSE_G04_L03_TS_008_RIGHT_FEEDBACK_WINDOWS.map(
      ({branch, copy, sourceInstance, sourceSpriteId, sourceEndFrame}) => ({
        branch,
        copy,
        sourceInstance,
        sourceSpriteId,
        sourceEndFrame,
      }),
    ),
    [
      {
        branch: 1,
        copy: "YOU GOT IT!",
        sourceInstance: "Mc_Right_Feed1",
        sourceSpriteId: "sprite-284",
        sourceEndFrame: 27,
      },
      {
        branch: 2,
        copy: "Correct!",
        sourceInstance: "Mc_Right_Feed2",
        sourceSpriteId: "sprite-300",
        sourceEndFrame: 28,
      },
      {
        branch: 3,
        copy: "Great Job!",
        sourceInstance: "Mc_Right_Feed3",
        sourceSpriteId: "sprite-324",
        sourceEndFrame: 28,
      },
      {
        branch: 4,
        copy: "Great Job!",
        sourceInstance: "Mc_Right_Feed4",
        sourceSpriteId: "sprite-312",
        sourceEndFrame: 25,
      },
    ],
  );

  for (let seed = 0; seed < 3; seed += 1) {
    const feedback = choose(reachQuiz(seed), "A");
    assert.equal(feedback.feedback?.branch, seed + 1);
    assert.equal(
      feedback.feedback?.sourceWindow,
      COURSE_G04_L03_TS_008_WRONG_FEEDBACK_WINDOWS[seed],
    );
  }
  for (let seed = 0; seed < 4; seed += 1) {
    const feedback = choose(reachQuiz(seed), "D");
    assert.equal(feedback.feedback?.branch, seed + 1);
    assert.equal(
      feedback.feedback?.sourceWindow,
      COURSE_G04_L03_TS_008_RIGHT_FEEDBACK_WINDOWS[seed],
    );
  }
});

test("TS008 first wrong returns to the attempted option and second wrong advances to terminal 789", () => {
  let state = choose(reachQuiz(2), "C");
  assert.equal(state.feedback?.kind, "wrong");
  assert.equal(state.feedback?.copy, "Try Again!");
  assert.equal(choose(state, "D"), state);

  state = completeFeedback(state);
  assert.equal(state.phase, "quiz");
  assert.equal(state.frame, 770);
  assert.equal(state.wrongTryCount, 1);
  assert.equal(state.selectedChoiceId, null);
  assert.equal(state.focusTarget, "choice-C");

  state = choose(state, "A");
  assert.equal(state.feedback?.kind, "wrong");
  state = completeFeedback(state);
  assert.equal(state.phase, "terminal");
  assert.equal(state.frame, 789);
  assert.equal(state.wrongTryCount, 0);
  assert.equal(state.selectedChoiceId, "A");
  assert.equal(state.focusTarget, "terminal");
  assert.equal(completeFeedback(state), state);
  assert.equal(choose(state, "D"), state);
});

test("TS008 every seed-selected correct feedback for D advances directly to terminal 789", () => {
  for (let seed = 0; seed < 8; seed += 1) {
    const feedback = choose(reachQuiz(seed), "D");
    assert.equal(feedback.feedback?.kind, "right");
    assert.equal(feedback.feedback?.branch, (seed % 4) + 1);
    const terminal = completeFeedback(feedback);
    assert.equal(terminal.phase, "terminal");
    assert.equal(terminal.frame, 789);
    assert.equal(terminal.wrongTryCount, 0);
    assert.equal(terminal.selectedChoiceId, "D");
    assert.equal(terminal.focusTarget, "terminal");
  }
});

test("TS008 Need More Help opens only after a source-evidenced reveal or at quiz, then restores focus without mutating progress", () => {
  const initial = createCourseG04L03Ts008InteractionState(7);
  assert.equal(
    reduceCourseG04L03Ts008Interaction(initial, {
      type: "open-need-more-help",
    }),
    initial,
  );

  const frame592 = reachFrame592(7);
  assert.equal(
    reduceCourseG04L03Ts008Interaction(frame592, {
      type: "open-need-more-help",
    }),
    frame592,
  );

  const revealed = revealBox(frame592);
  const openFromWalkthrough = reduceCourseG04L03Ts008Interaction(revealed, {
    type: "open-need-more-help",
  });
  assert.equal(openFromWalkthrough.phase, "need-more-help");
  assert.equal(openFromWalkthrough.frame, 592);
  assert.equal(openFromWalkthrough.walkthroughGate, 2);
  assert.equal(openFromWalkthrough.walkthroughBoxRevealed, true);
  assert.equal(openFromWalkthrough.focusTarget, "need-more-help-close");
  assert.equal(openFromWalkthrough.needMoreHelpReturnPhase, "walkthrough");
  assert.equal(choose(openFromWalkthrough, "D"), openFromWalkthrough);
  assert.equal(revealBox(openFromWalkthrough), openFromWalkthrough);

  const closedToWalkthrough = reduceCourseG04L03Ts008Interaction(
    openFromWalkthrough,
    {type: "close-need-more-help"},
  );
  assert.equal(closedToWalkthrough.phase, "walkthrough");
  assert.equal(closedToWalkthrough.frame, 592);
  assert.equal(closedToWalkthrough.walkthroughBoxRevealed, true);
  assert.equal(closedToWalkthrough.focusTarget, "need-more-help");
  assert.equal(closedToWalkthrough.needMoreHelpReturnPhase, null);
  assert.equal(closedToWalkthrough.needMoreHelpReturnFocus, null);

  const quiz = reachQuiz(7);
  const openFromQuiz = reduceCourseG04L03Ts008Interaction(quiz, {
    type: "open-need-more-help",
  });
  assert.equal(openFromQuiz.phase, "need-more-help");
  assert.equal(openFromQuiz.frame, 770);
  assert.equal(openFromQuiz.needMoreHelpReturnPhase, "quiz");

  const closedToQuiz = reduceCourseG04L03Ts008Interaction(openFromQuiz, {
    type: "close-need-more-help",
  });
  assert.equal(closedToQuiz.phase, "quiz");
  assert.equal(closedToQuiz.frame, 770);
  assert.equal(closedToQuiz.focusTarget, "need-more-help");

  const feedback = choose(quiz, "D");
  assert.equal(
    reduceCourseG04L03Ts008Interaction(feedback, {
      type: "open-need-more-help",
    }),
    feedback,
  );
});

test("TS008 locks the NMH geometry and keeps all three source glossary callbacks safe-disabled", () => {
  assert.deepEqual(COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds, {
    x: 601.4,
    y: 130.8,
    width: 118.5,
    height: 27.5,
  });
  assert.deepEqual(COURSE_G04_L03_TS_008_NEED_MORE_HELP.popupBounds, {
    x: 63.5,
    y: 157.9,
    width: 651,
    height: 181.5,
  });
  assert.deepEqual(
    COURSE_G04_L03_TS_008_GLOSSARY.map(
      ({
        term,
        visibleText,
        sourceButtonObjectId,
        sourceHitBoundsResolved,
        hostAction,
        hostContentResolved,
        enabled,
        mode,
      }) => ({
        term,
        visibleText,
        sourceButtonObjectId,
        sourceHitBoundsResolved,
        hostAction,
        hostContentResolved,
        enabled,
        mode,
      }),
    ),
    [
      {
        term: "Positive number",
        visibleText: "positive numbers",
        sourceButtonObjectId: 166,
        sourceHitBoundsResolved: false,
        hostAction: "DoHyperLinks",
        hostContentResolved: false,
        enabled: false,
        mode: "safe-disabled-unresolved-host-callback",
      },
      {
        term: "Owe",
        visibleText: "Owing",
        sourceButtonObjectId: 167,
        sourceHitBoundsResolved: false,
        hostAction: "DoHyperLinks",
        hostContentResolved: false,
        enabled: false,
        mode: "safe-disabled-unresolved-host-callback",
      },
      {
        term: "Negative number",
        visibleText: "negative numbers",
        sourceButtonObjectId: 168,
        sourceHitBoundsResolved: false,
        hostAction: "DoHyperLinks",
        hostContentResolved: false,
        enabled: false,
        mode: "safe-disabled-unresolved-host-callback",
      },
    ],
  );

  const open = reduceCourseG04L03Ts008Interaction(reachQuiz(3), {
    type: "open-need-more-help",
  });
  for (const {term} of COURSE_G04_L03_TS_008_GLOSSARY) {
    assert.equal(
      reduceCourseG04L03Ts008Interaction(open, {
        type: "open-glossary",
        term,
      }),
      open,
    );
  }
});

test("TS008 Replay resets the entire vector from feedback, NMH, and terminal and can replace the seed", () => {
  const initial = createCourseG04L03Ts008InteractionState(8);
  const feedback = choose(reachQuiz(8), "A");
  assert.deepEqual(
    reduceCourseG04L03Ts008Interaction(feedback, {type: "replay"}),
    initial,
  );

  const open = reduceCourseG04L03Ts008Interaction(
    revealBox(reachFrame592(8)),
    {type: "open-need-more-help"},
  );
  assert.deepEqual(
    reduceCourseG04L03Ts008Interaction(open, {type: "replay"}),
    initial,
  );

  const terminal = completeFeedback(choose(reachQuiz(8), "D"));
  assert.deepEqual(
    reduceCourseG04L03Ts008Interaction(terminal, {type: "replay"}),
    initial,
  );
  assert.deepEqual(
    reduceCourseG04L03Ts008Interaction(terminal, {
      type: "replay",
      seed: 11,
    }),
    createCourseG04L03Ts008InteractionState(11),
  );
  assert.equal(createCourseG04L03Ts008InteractionState(Number.NaN).seed, 0);
  assert.equal(
    createCourseG04L03Ts008InteractionState(Number.MAX_SAFE_INTEGER + 1).seed,
    0,
  );
});

test("TS008 unknown actions, choices, invalid callbacks, and out-of-phase events fail closed", () => {
  const quiz = reachQuiz(4);
  assert.equal(
    reduceCourseG04L03Ts008Interaction(quiz, {
      type: "choose",
      choiceId: "Z",
    } as never),
    quiz,
  );
  assert.equal(
    reduceCourseG04L03Ts008Interaction(quiz, {
      type: "open-glossary",
      term: "Unknown",
    } as never),
    quiz,
  );
  assert.equal(
    reduceCourseG04L03Ts008Interaction(quiz, {type: "unknown"} as never),
    quiz,
  );
  assert.equal(completeFeedback(quiz), quiz);
  assert.equal(
    reduceCourseG04L03Ts008Interaction(quiz, {
      type: "close-need-more-help",
    }),
    quiz,
  );
  assert.equal(continueWalkthrough(quiz), quiz);
  assert.equal(revealBox(quiz), quiz);
  assert.equal(closeBox(quiz), quiz);

  const initial = createCourseG04L03Ts008InteractionState();
  assert.equal(choose(initial, "D"), initial);
});

test("TS008 metadata and every nested reducer result are frozen, with pause/reduced policies explicit and every authority gate false", () => {
  const initial = createCourseG04L03Ts008InteractionState(1);
  const frame592 = reachFrame592(1);
  const revealed = revealBox(frame592);
  const feedback = choose(reachQuiz(1), "A");

  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_008_SOURCE), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_008_SOURCE.stage), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_008_CHOICES), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_008_CHOICES[0]), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TS_008_CHOICES[0]?.hitBounds),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS),
    true,
  );
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TS_008_WALKTHROUGH_STEPS[2]?.visibleText),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_008_DONOR_POLICY), true);
  assert.equal(
    Object.isFrozen(
      COURSE_G04_L03_TS_008_DONOR_POLICY.unsafeDirectSourceFrames[0],
    ),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_008_GLOSSARY), true);
  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_008_NEED_MORE_HELP), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TS_008_NEED_MORE_HELP.buttonBounds),
    true,
  );
  assert.equal(Object.isFrozen(COURSE_G04_L03_TS_008_PLAYBACK_POLICY), true);
  assert.equal(
    Object.isFrozen(COURSE_G04_L03_TS_008_PLAYBACK_POLICY.pause),
    true,
  );
  assert.equal(
    COURSE_G04_L03_TS_008_PLAYBACK_POLICY.pause.sourceParityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TS_008_PLAYBACK_POLICY.reducedMotion
      .sourceParityEstablished,
    false,
  );
  assert.match(
    COURSE_G04_L03_TS_008_PLAYBACK_POLICY.pause.policy,
    /freeze/,
  );
  assert.match(
    COURSE_G04_L03_TS_008_PLAYBACK_POLICY.reducedMotion.policy,
    /static/,
  );
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(frame592), true);
  assert.equal(Object.isFrozen(revealed), true);
  assert.equal(Object.isFrozen(feedback), true);
  assert.equal(Object.isFrozen(feedback.feedback), true);
  assert.equal(Object.isFrozen(feedback.feedback?.sourceWindow), true);

  for (const value of Object.values(
    COURSE_G04_L03_TS_008_INTERACTION_AUTHORITY,
  )) {
    if (typeof value === "boolean") assert.equal(value, false);
  }
  assert.equal(
    COURSE_G04_L03_TS_008_INTERACTION_AUTHORITY.strictAcceptanceEffect,
    "none",
  );
});
