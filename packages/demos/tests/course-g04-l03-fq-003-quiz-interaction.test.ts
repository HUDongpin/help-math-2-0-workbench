import assert from "node:assert/strict";
import test from "node:test";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import fq003, {
  COURSE_G04_L03_FQ_003_SOURCE_CONTRACT,
} from "../src/modules/course-g04-l03-fq-003";
import {
  COURSE_G04_L03_FQ_003_INTERACTION_AUTHORITY,
  COURSE_G04_L03_FQ_003_INTERACTION_SOURCE,
  COURSE_G04_L03_FQ_003_QUESTION_ORDER,
  createCourseG04L03Fq003InteractionState,
  getCourseG04L03Fq003ReviewItem,
  gradeCourseG04L03Fq003LegacyScore,
  reduceCourseG04L03Fq003Interaction,
} from "../src/timelines/course-g04-l03-fq-003-quiz-interaction";
import type {
  CourseG04L03Fq002InteractionAction,
  CourseG04L03Fq002InteractionState,
  CourseG04L03Fq002OptionId,
} from "../src/timelines/course-g04-l03-fq-002-quiz-interaction";

const atomicAnswer = (
  state: CourseG04L03Fq002InteractionState,
  optionId: CourseG04L03Fq002OptionId,
) => {
  assert.ok(state.currentQuestion);
  assert.ok(state.sequenceNumber !== null);
  return reduceCourseG04L03Fq003Interaction(state, {
    type: "answer",
    optionId,
    questionId: state.currentQuestion.id,
    sequenceNumber: state.sequenceNumber,
  });
};

const wrongOption = (
  state: CourseG04L03Fq002InteractionState,
): CourseG04L03Fq002OptionId => {
  const option = state.currentQuestion?.options.find(({correct}) => !correct);
  assert.ok(option);
  return option.id;
};

const completeQuiz = (
  correctAnswerCount: number,
  seed = 7,
): CourseG04L03Fq002InteractionState => {
  let state = createCourseG04L03Fq003InteractionState(seed);
  while (state.phase === "question") {
    assert.ok(state.currentQuestion);
    const optionId = state.responses.length < correctAnswerCount
      ? state.currentQuestion.correctOptionId
      : wrongOption(state);
    state = atomicAnswer(state, optionId);
  }
  return state;
};

test("FQ003 always presents the source 25-question sequence", () => {
  const expectedOrder = Array.from({length: 25}, (_, index) => index + 1);
  assert.deepEqual(COURSE_G04_L03_FQ_003_QUESTION_ORDER, expectedOrder);

  for (const seed of [0, 1, 7, 99, -1, Number.NaN]) {
    const state = createCourseG04L03Fq003InteractionState(seed);
    assert.deepEqual(state.questionOrder, expectedOrder);
    assert.equal(state.randomDrawCount, 0);
    assert.equal(state.sequenceNumber, 1);
    assert.equal(state.currentQuestion?.id, 1);
    assert.equal(state.currentQuestion?.questionFrame, 2);
  }

  assert.equal(createCourseG04L03Fq003InteractionState(-1).seed, 4_294_967_295);
  assert.equal(createCourseG04L03Fq003InteractionState(Number.NaN).seed, 0);
});

test("FQ003 advances atomically and rejects stale or duplicate answers", () => {
  const initial = createCourseG04L03Fq003InteractionState(7);
  const question = initial.currentQuestion;
  const sequenceNumber = initial.sequenceNumber;
  assert.ok(question);
  assert.ok(sequenceNumber !== null);

  const action = {
    type: "answer",
    optionId: question.correctOptionId,
    questionId: question.id,
    sequenceNumber,
  } as const;
  const answered = reduceCourseG04L03Fq003Interaction(initial, action);
  assert.equal(answered.responses.length, 1);
  assert.equal(answered.score, 1);
  assert.equal(answered.currentQuestion?.id, 2);
  assert.equal(answered.sequenceNumber, 2);
  assert.equal(
    reduceCourseG04L03Fq003Interaction(answered, action),
    answered,
  );
  assert.equal(
    reduceCourseG04L03Fq003Interaction(answered, {
      ...action,
      optionId: answered.currentQuestion?.correctOptionId ?? "A",
    }),
    answered,
  );
});

test("FQ003 completes all 25 questions and preserves source legacy bands", () => {
  const perfect = completeQuiz(25);
  assert.equal(perfect.phase, "results");
  assert.equal(perfect.responses.length, 25);
  assert.deepEqual(perfect.results, {
    score: 25,
    total: 25,
    wrong: 0,
    grade: "Advanced",
  });

  const eightCorrect = completeQuiz(8, 8);
  assert.deepEqual(eightCorrect.results, {
    score: 8,
    total: 25,
    wrong: 17,
    grade: "Proficient",
  });
  assert.equal(gradeCourseG04L03Fq003LegacyScore(3), "Unsatisfactory");
  assert.equal(gradeCourseG04L03Fq003LegacyScore(4), "Partially Proficient");
  assert.equal(gradeCourseG04L03Fq003LegacyScore(7), "Proficient");
  assert.equal(gradeCourseG04L03Fq003LegacyScore(9), "Advanced");
  assert.equal(gradeCourseG04L03Fq003LegacyScore(26), null);
  assert.equal(
    COURSE_G04_L03_FQ_003_INTERACTION_AUTHORITY
      .sourceLegacyGradeBandsFitTwentyFiveQuestionTotal,
    false,
  );
});

test("FQ003 review follows R1-R25 and Replay resets the whole state", () => {
  const initial = createCourseG04L03Fq003InteractionState(42);
  const results = completeQuiz(18, 42);
  let review = reduceCourseG04L03Fq003Interaction(results, {
    type: "start-review",
  });

  for (let index = 0; index < 25; index += 1) {
    const item = getCourseG04L03Fq003ReviewItem(review);
    assert.ok(item);
    assert.equal(item.reviewIndex, index);
    assert.equal(item.sequenceNumber, index + 1);
    assert.equal(item.question.id, index + 1);
    assert.equal(item.reviewFrame, index + 44);
    if (index < 24) {
      review = reduceCourseG04L03Fq003Interaction(review, {
        type: "review-next",
      });
    }
  }

  assert.equal(
    reduceCourseG04L03Fq003Interaction(review, {type: "review-next"}),
    review,
  );
  const previous = reduceCourseG04L03Fq003Interaction(review, {
    type: "review-previous",
  });
  assert.equal(previous.reviewIndex, 23);
  const returned = reduceCourseG04L03Fq003Interaction(previous, {
    type: "return-to-results",
  });
  assert.equal(returned.phase, "results");
  assert.deepEqual(
    reduceCourseG04L03Fq003Interaction(returned, {type: "replay"}),
    initial,
  );
});

test("FQ003 disabled integrations and unknown actions fail closed", () => {
  const initial = createCourseG04L03Fq003InteractionState(7);
  for (const integration of [
    "lms",
    "get-url",
    "host-close-report",
    "audio",
    "spanish",
  ] as const) {
    assert.equal(
      reduceCourseG04L03Fq003Interaction(initial, {
        type: "request-disabled-integration",
        integration,
      }),
      initial,
    );
  }
  assert.equal(
    reduceCourseG04L03Fq003Interaction(initial, {
      type: "unknown-action",
    } as unknown as CourseG04L03Fq002InteractionAction),
    initial,
  );
});

test("FQ003 binds evidence without raising any acceptance gate", () => {
  assert.equal(
    COURSE_G04_L03_FQ_003_INTERACTION_SOURCE.swfSha256,
    "f40e24b47e05de7dce02ac98344c8748b5941a67d908f85fc1fe152fe684b7dc",
  );
  assert.equal(
    COURSE_G04_L03_FQ_003_INTERACTION_SOURCE.mainScript.sha256,
    "ea7d8027281fd28b100b15117522e2103b97799120d84b19ff64fcf41411db78",
  );
  assert.equal(
    COURSE_G04_L03_FQ_003_SOURCE_CONTRACT
      .currentJavascriptInteractionStatus,
    "source-script-bound-functional-final-quiz-candidate",
  );
  for (const value of [
    COURSE_G04_L03_FQ_003_SOURCE_CONTRACT.behaviorParityEstablished,
    COURSE_G04_L03_FQ_003_SOURCE_CONTRACT.replayParityEstablished,
    COURSE_G04_L03_FQ_003_SOURCE_CONTRACT.authoritativeOriginalRuntimeAccepted,
    COURSE_G04_L03_FQ_003_SOURCE_CONTRACT.humanVisualReviewAccepted,
    COURSE_G04_L03_FQ_003_SOURCE_CONTRACT.ownerAccepted,
    COURSE_G04_L03_FQ_003_SOURCE_CONTRACT.strictMigrationComplete,
    COURSE_G04_L03_FQ_003_SOURCE_CONTRACT.lessonPublished,
  ]) {
    assert.equal(value, false);
  }
  assert.equal(
    COURSE_G04_L03_FQ_003_SOURCE_CONTRACT.strictAcceptanceEffect,
    "none",
  );
  assert.equal(
    COURSE_G04_L03_FQ_003_SOURCE_CONTRACT.sourceLegacyGradePresentationLabel,
    "Legacy source performance level",
  );
});

test("FQ003 functional renderer exposes 25-question responsive controls", () => {
  const markup = renderToStaticMarkup(createElement(fq003.Renderer, {
    frame: 1,
    frameDomain: "sprite-899",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  }));
  assert.match(
    markup,
    /data-current-js-functional-scope="fq003-sequential-twenty-five-source-bound-final-quiz"/,
  );
  assert.match(markup, /data-final-quiz-question-count="25"/);
  assert.match(
    markup,
    /data-results-grade-label="Legacy source performance level"/,
  );
  assert.match(
    markup,
    /data-current-js-functional-host-frame-window="1-43"/,
  );
  assert.match(markup, /data-current-js-functional-overlay="course-g04-l03-fq-003-quiz"/);
  assert.match(markup, /Question 1 of 25/);
  assert.match(markup, /data-source-lms-enabled="false"/);
  assert.doesNotMatch(markup, /data-owner-accepted="true"/);

  const deterministicMarkup = renderToStaticMarkup(
    createElement(fq003.Renderer, {
      frame: 1,
      frameDomain: "sprite-899",
      scenario: "source-static-frame",
      lang: "en",
      seed: 7,
      entryStateSha256: "0".repeat(64),
    }),
  );
  assert.doesNotMatch(
    deterministicMarkup,
    /data-current-js-functional-overlay=/,
  );

  const hostStopMarkup = renderToStaticMarkup(createElement(fq003.Renderer, {
    frame: 43,
    frameDomain: "sprite-899",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  }));
  assert.match(hostStopMarkup, /Question 1 of 25/);
  assert.match(
    hostStopMarkup,
    /data-current-js-functional-overlay="course-g04-l03-fq-003-quiz"/,
  );
});
