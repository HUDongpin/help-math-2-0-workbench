import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {
  COURSE_G04_L03_FQ_002_CORRECT_OPTION_NUMBERS,
  COURSE_G04_L03_FQ_002_DISABLED_INTEGRATIONS,
  COURSE_G04_L03_FQ_002_FUNCTIONAL_MASKING_POLICY,
  COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY,
  COURSE_G04_L03_FQ_002_INTERACTION_SOURCE,
  COURSE_G04_L03_FQ_002_OPTION_IDS,
  COURSE_G04_L03_FQ_002_QUESTIONS,
  COURSE_G04_L03_FQ_002_TEXT_BINDING,
  createCourseG04L03Fq002InteractionState,
  getCourseG04L03Fq002ReviewItem,
  gradeCourseG04L03Fq002Score,
  reduceCourseG04L03Fq002Interaction,
  selectCourseG04L03Fq002QuestionOrder,
  type CourseG04L03Fq002InteractionAction,
  type CourseG04L03Fq002InteractionState,
  type CourseG04L03Fq002OptionId,
} from "../src/timelines/course-g04-l03-fq-002-quiz-interaction";

const atomicAnswer = (
  state: CourseG04L03Fq002InteractionState,
  optionId: CourseG04L03Fq002OptionId,
) => {
  const question = state.currentQuestion;
  const sequenceNumber = state.sequenceNumber;
  assert.ok(question);
  assert.ok(sequenceNumber !== null);
  return reduceCourseG04L03Fq002Interaction(state, {
    type: "answer",
    optionId,
    questionId: question.id,
    sequenceNumber,
  });
};

const sha256Json = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

const wrongOptionForCurrentQuestion = (
  state: CourseG04L03Fq002InteractionState,
): CourseG04L03Fq002OptionId => {
  const question = state.currentQuestion;
  assert.ok(question);
  const wrong = question.options.find(({correct}) => !correct);
  assert.ok(wrong);
  return wrong.id;
};

const completeQuizWithScore = (
  score: number,
  seed = 7,
): CourseG04L03Fq002InteractionState => {
  let state = createCourseG04L03Fq002InteractionState(seed);

  while (state.phase === "question") {
    const question = state.currentQuestion;
    assert.ok(question);
    const optionId = state.responses.length < score
      ? question.correctOptionId
      : wrongOptionForCurrentQuestion(state);
    state = atomicAnswer(state, optionId);
  }

  return state;
};

test("FQ002 binds all 25 Q/R pairs, source frames, and exact answer mapping", () => {
  assert.equal(COURSE_G04_L03_FQ_002_QUESTIONS.length, 25);
  assert.deepEqual(
    COURSE_G04_L03_FQ_002_QUESTIONS.map(({id}) => id),
    Array.from({length: 25}, (_, index) => index + 1),
  );
  assert.deepEqual(
    COURSE_G04_L03_FQ_002_QUESTIONS.map(({questionLabel}) => questionLabel),
    Array.from({length: 25}, (_, index) => `Q${index + 1}`),
  );
  assert.deepEqual(
    COURSE_G04_L03_FQ_002_QUESTIONS.map(({reviewLabel}) => reviewLabel),
    Array.from({length: 25}, (_, index) => `R${index + 1}`),
  );
  assert.deepEqual(
    COURSE_G04_L03_FQ_002_QUESTIONS.map(({questionFrame}) => questionFrame),
    Array.from({length: 25}, (_, index) => index + 2),
  );
  assert.deepEqual(
    COURSE_G04_L03_FQ_002_QUESTIONS.map(({reviewFrame}) => reviewFrame),
    Array.from({length: 25}, (_, index) => index + 44),
  );
  assert.deepEqual(
    COURSE_G04_L03_FQ_002_QUESTIONS.map(
      ({correctOptionNumber}) => correctOptionNumber,
    ),
    [
      3, 3, 3, 1, 1,
      2, 1, 2, 1, 2,
      1, 2, 3, 1, 4,
      1, 3, 3, 2, 3,
      4, 1, 1, 1, 2,
    ],
  );
  assert.deepEqual(
    COURSE_G04_L03_FQ_002_CORRECT_OPTION_NUMBERS,
    COURSE_G04_L03_FQ_002_QUESTIONS.map(
      ({correctOptionNumber}) => correctOptionNumber,
    ),
  );
  assert.equal(
    sha256Json(COURSE_G04_L03_FQ_002_QUESTIONS),
    "c90dd650b90bf8fac57dd895a880736058a8f28d4b5b5f87d0b715efa73ab7a2",
  );

  for (const question of COURSE_G04_L03_FQ_002_QUESTIONS) {
    assert.equal(question.questionFrame, question.id + 1);
    assert.equal(question.reviewFrame, question.id + 43);
    assert.equal(question.options.length, 4);
    assert.equal(
      question.options.filter(({correct}) => correct).length,
      1,
    );
    for (const option of question.options) {
      assert.equal(
        option.sourceInstance,
        `A${question.id}Opt${option.optionNumber}`,
      );
    }
  }
});

test("FQ002 binds authoring question, context, and text option content", () => {
  const q1 = COURSE_G04_L03_FQ_002_QUESTIONS[0];
  const q6 = COURSE_G04_L03_FQ_002_QUESTIONS[5];
  const q13 = COURSE_G04_L03_FQ_002_QUESTIONS[12];
  const q17 = COURSE_G04_L03_FQ_002_QUESTIONS[16];
  const q22 = COURSE_G04_L03_FQ_002_QUESTIONS[21];
  const q25 = COURSE_G04_L03_FQ_002_QUESTIONS[24];

  assert.ok(q1 && q6 && q13 && q17 && q22 && q25);
  assert.equal(
    q1.questionText,
    "The numbers in this pattern decrease by the same amount each time.  \n"
      + "What are the next three numbers in this pattern?",
  );
  assert.deepEqual(q1.contextText, [
    "20, 16, 12, 8, 4, __, __, __",
  ]);
  assert.deepEqual(
    q1.options.map(({sourceText}) => sourceText),
    ["2, 0, –2", "0, –2, –4", "0, –4, –8", "2, –4, –8"],
  );
  assert.deepEqual(
    q6.options.map(({sourceText}) => sourceText),
    ["10, 0, –20", "10, 0, –10", "0, –10, –20", "10, –10, –20"],
  );
  assert.deepEqual(
    q13.options.map(({sourceText}) => sourceText),
    [
      "–10, –6, 2, 8",
      "2, –6, 8, –10",
      "8, 2, –6, –10",
      "–10, 8, –6, 2",
    ],
  );
  assert.equal(
    q17.questionText,
    "Toni has $7.  Elvin has $3.  Susan owes $10.  Ricky owes $2.  \n"
      + "Who has the least amount of money?",
  );
  assert.deepEqual(
    q17.options.map(({sourceText}) => sourceText),
    ["Elvin", "Ricky", "Susan", "Toni"],
  );
  assert.deepEqual(q22.contextText, [
    "State",
    "Lowest Recorded \nTemperature",
    "Alaska",
    "–80° F",
    "Maine",
    "–48° F",
    "Nebraska",
    "–47° F",
    "New York",
    "–52° F",
  ]);
  assert.deepEqual(
    q25.options.map(({sourceText}) => sourceText),
    ["Idaho", "Montana", "Utah", "Washington"],
  );
  assert.match(
    COURSE_G04_L03_FQ_002_TEXT_BINDING.source,
    /L3FQ02\.fla-authoring-audit\.json$/,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_TEXT_BINDING.sourceSha256,
    "7784f27f946e9b3ef78138c04138676d1d6f4acf09412c499d5fc7a9dbc4e05e",
  );
});

test("Q7-Q12 expose only Source symbol A-D and never invent graphical shapes", () => {
  for (const question of COURSE_G04_L03_FQ_002_QUESTIONS.slice(6, 12)) {
    assert.deepEqual(
      question.options.map(
        ({id, sourceText, label, contentKind}) => ({
          id,
          sourceText,
          label,
          contentKind,
        }),
      ),
      COURSE_G04_L03_FQ_002_OPTION_IDS.map((id) => ({
        id,
        sourceText: null,
        label: `Source symbol ${id}`,
        contentKind: "source-symbol-only",
      })),
    );
  }

  assert.deepEqual(
    COURSE_G04_L03_FQ_002_QUESTIONS[6]?.contextText,
    ["–5", "0", "5"],
  );
  assert.deepEqual(
    COURSE_G04_L03_FQ_002_QUESTIONS[10]?.contextText,
    ["-15", "-10", "-5", "0", "5", "10", "15"],
  );
  assert.match(
    COURSE_G04_L03_FQ_002_TEXT_BINDING.graphicalOptionPolicy,
    /Source symbol A-D/,
  );
});

test("seeded current-JS selection is deterministic and unique across many seeds", () => {
  for (const seed of [0, 1, 2, 7, 12, 23, 99, -1, Number.NaN]) {
    const first = createCourseG04L03Fq002InteractionState(seed);
    const second = createCourseG04L03Fq002InteractionState(seed);

    assert.deepEqual(first, second);
    assert.equal(first.questionOrder.length, 10);
    assert.equal(new Set(first.questionOrder).size, 10);
    assert.equal(
      first.questionOrder.every((questionId) =>
        Number.isInteger(questionId)
        && questionId >= 1
        && questionId <= 25
      ),
      true,
    );
    assert.deepEqual(
      first.questionOrder,
      selectCourseG04L03Fq002QuestionOrder(seed),
    );
    assert.equal(first.randomDrawCount, 10);
  }

  assert.notDeepEqual(
    selectCourseG04L03Fq002QuestionOrder(0),
    selectCourseG04L03Fq002QuestionOrder(1),
  );
  assert.deepEqual(
    selectCourseG04L03Fq002QuestionOrder(7),
    [1, 3, 25, 18, 13, 11, 12, 7, 16, 20],
  );
  assert.equal(createCourseG04L03Fq002InteractionState(-1).seed, 4_294_967_295);
  assert.equal(createCourseG04L03Fq002InteractionState(Number.NaN).seed, 0);
  assert.equal(
    COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY
      .questionSelectionExecutesAvm1Random,
    false,
  );
  assert.equal(
    COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY
      .sourceRandomParityEstablished,
    false,
  );
});

test("atomic answer mirrors source release shape and advances exactly once", () => {
  const initial = createCourseG04L03Fq002InteractionState(7);
  const question = initial.currentQuestion;
  assert.ok(question);
  const answered = atomicAnswer(initial, question.correctOptionId);

  assert.equal(initial.responses.length, 0);
  assert.equal(answered.phase, "question");
  assert.equal(answered.responses.length, 1);
  assert.equal(answered.responses[0]?.sequenceNumber, 1);
  assert.equal(answered.responses[0]?.questionId, question.id);
  assert.equal(answered.responses[0]?.questionFrame, question.questionFrame);
  assert.equal(answered.responses[0]?.reviewFrame, question.reviewFrame);
  assert.equal(answered.responses[0]?.correct, true);
  assert.equal(answered.score, 1);
  assert.equal(answered.questionIndex, 1);
  assert.equal(answered.sequenceNumber, 2);
  assert.equal(answered.selectedOptionId, null);
  assert.notEqual(answered.currentQuestion?.id, question.id);
});

test("atomic answer rejects delayed and duplicate dispatch identities", () => {
  const initial = createCourseG04L03Fq002InteractionState(7);
  const firstQuestion = initial.currentQuestion;
  const firstSequenceNumber = initial.sequenceNumber;
  assert.ok(firstQuestion);
  assert.ok(firstSequenceNumber !== null);
  const firstAction = {
    type: "answer",
    optionId: firstQuestion.correctOptionId,
    questionId: firstQuestion.id,
    sequenceNumber: firstSequenceNumber,
  } as const;

  const answered = reduceCourseG04L03Fq002Interaction(initial, firstAction);
  assert.equal(answered.responses.length, 1);
  assert.equal(
    reduceCourseG04L03Fq002Interaction(answered, firstAction),
    answered,
  );

  const currentQuestion = answered.currentQuestion;
  const currentSequenceNumber = answered.sequenceNumber;
  assert.ok(currentQuestion);
  assert.ok(currentSequenceNumber !== null);
  assert.equal(
    reduceCourseG04L03Fq002Interaction(answered, {
      type: "answer",
      optionId: currentQuestion.correctOptionId,
      questionId: firstQuestion.id,
      sequenceNumber: currentSequenceNumber,
    }),
    answered,
  );
  assert.equal(
    reduceCourseG04L03Fq002Interaction(answered, {
      type: "answer",
      optionId: currentQuestion.correctOptionId,
      questionId: currentQuestion.id,
      sequenceNumber: firstSequenceNumber,
    }),
    answered,
  );
});

test("select and submit is an explicit current-JS enhancement and fails closed", () => {
  const initial = createCourseG04L03Fq002InteractionState(12);
  assert.equal(
    reduceCourseG04L03Fq002Interaction(initial, {type: "submit"}),
    initial,
  );

  const invalidAction = {
    type: "select-option",
    optionId: "E",
  } as unknown as CourseG04L03Fq002InteractionAction;
  assert.equal(
    reduceCourseG04L03Fq002Interaction(initial, invalidAction),
    initial,
  );

  const correctOptionId = initial.currentQuestion?.correctOptionId;
  assert.ok(correctOptionId);
  const selected = reduceCourseG04L03Fq002Interaction(initial, {
    type: "select-option",
    optionId: correctOptionId,
  });
  assert.equal(selected.selectedOptionId, correctOptionId);
  assert.equal(selected.responses.length, 0);

  const submitted = reduceCourseG04L03Fq002Interaction(selected, {
    type: "submit",
  });
  assert.equal(submitted.responses.length, 1);
  assert.equal(submitted.responses[0]?.correct, true);
  assert.equal(submitted.sequenceNumber, 2);
  assert.equal(submitted.selectedOptionId, null);
  assert.equal(
    COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY
      .sourceSeparateSelectSubmitParityEstablished,
    false,
  );
});

test("all ten source score bands and result counts are exact", () => {
  const expectedGrades = [
    "Unsatisfactory",
    "Unsatisfactory",
    "Unsatisfactory",
    "Unsatisfactory",
    "Partially Proficient",
    "Partially Proficient",
    "Partially Proficient",
    "Proficient",
    "Proficient",
    "Advanced",
    "Advanced",
  ];

  for (let score = 0; score <= 10; score += 1) {
    assert.equal(gradeCourseG04L03Fq002Score(score), expectedGrades[score]);
    const state = completeQuizWithScore(score, 100 + score);
    assert.equal(state.phase, "results");
    assert.equal(state.responses.length, 10);
    assert.equal(state.score, score);
    assert.deepEqual(state.results, {
      score,
      total: 10,
      wrong: 10 - score,
      grade: expectedGrades[score],
    });
    assert.equal(state.questionIndex, null);
    assert.equal(state.sequenceNumber, null);
    assert.equal(state.currentQuestion, null);
    assert.equal(state.selectedOptionId, null);
  }

  for (const invalid of [-1, 11, 1.5, Number.NaN]) {
    assert.equal(gradeCourseG04L03Fq002Score(invalid), null);
  }
});

test("review follows selected Q/R pairing with bounded previous and next", () => {
  const results = completeQuizWithScore(7, 42);
  assert.equal(
    reduceCourseG04L03Fq002Interaction(results, {
      type: "review-previous",
    }),
    results,
  );

  let review = reduceCourseG04L03Fq002Interaction(results, {
    type: "start-review",
  });
  assert.equal(review.phase, "review");
  assert.equal(review.reviewIndex, 0);
  assert.equal(
    reduceCourseG04L03Fq002Interaction(review, {
      type: "review-previous",
    }),
    review,
  );

  for (let reviewIndex = 0; reviewIndex < 10; reviewIndex += 1) {
    const item = getCourseG04L03Fq002ReviewItem(review);
    const response = review.responses[reviewIndex];
    assert.ok(item && response);
    assert.equal(item.reviewIndex, reviewIndex);
    assert.equal(item.sequenceNumber, reviewIndex + 1);
    assert.equal(item.question.id, review.questionOrder[reviewIndex]);
    assert.equal(item.question.id, response.questionId);
    assert.equal(item.reviewFrame, response.questionId + 43);
    assert.equal(item.reviewFrame, response.reviewFrame);
    assert.equal(item.question.reviewLabel, response.reviewLabel);

    if (reviewIndex < 9) {
      review = reduceCourseG04L03Fq002Interaction(review, {
        type: "review-next",
      });
    }
  }

  assert.equal(review.reviewIndex, 9);
  assert.equal(
    reduceCourseG04L03Fq002Interaction(review, {type: "review-next"}),
    review,
  );
  const previous = reduceCourseG04L03Fq002Interaction(review, {
    type: "review-previous",
  });
  assert.equal(previous.reviewIndex, 8);

  const returned = reduceCourseG04L03Fq002Interaction(previous, {
    type: "return-to-results",
  });
  assert.equal(returned.phase, "results");
  assert.equal(returned.reviewIndex, null);
  assert.equal(returned.reviewFrame, null);
  assert.equal(getCourseG04L03Fq002ReviewItem(returned), null);
});

test("Replay and Reset restore the complete seed-bound state vector", () => {
  const initial = createCourseG04L03Fq002InteractionState(42);
  const results = completeQuizWithScore(6, 42);
  const review = reduceCourseG04L03Fq002Interaction(results, {
    type: "start-review",
  });
  const advanced = reduceCourseG04L03Fq002Interaction(review, {
    type: "review-next",
  });

  assert.deepEqual(
    reduceCourseG04L03Fq002Interaction(advanced, {type: "replay"}),
    initial,
  );
  assert.deepEqual(
    reduceCourseG04L03Fq002Interaction(advanced, {type: "reset"}),
    initial,
  );
  assert.deepEqual(
    reduceCourseG04L03Fq002Interaction(advanced, {
      type: "replay",
      seed: 99,
    }),
    createCourseG04L03Fq002InteractionState(99),
  );
  assert.deepEqual(
    reduceCourseG04L03Fq002Interaction(advanced, {
      type: "reset",
      seed: 23,
    }),
    createCourseG04L03Fq002InteractionState(23),
  );
});

test("wrong-phase, invalid-answer, and disabled-integration actions fail closed", () => {
  const initial = createCourseG04L03Fq002InteractionState(7);
  for (const action of [
    {type: "start-review"},
    {type: "review-previous"},
    {type: "review-next"},
    {type: "return-to-results"},
  ] as const) {
    assert.equal(
      reduceCourseG04L03Fq002Interaction(initial, action),
      initial,
    );
  }

  const invalidAnswer = {
    type: "answer",
    optionId: "E",
    questionId: initial.currentQuestion?.id,
    sequenceNumber: initial.sequenceNumber,
  } as unknown as CourseG04L03Fq002InteractionAction;
  assert.equal(
    reduceCourseG04L03Fq002Interaction(initial, invalidAnswer),
    initial,
  );

  for (const integration of [
    "lms",
    "get-url",
    "host-close-report",
    "audio",
    "spanish",
  ] as const) {
    assert.equal(
      reduceCourseG04L03Fq002Interaction(initial, {
        type: "request-disabled-integration",
        integration,
      }),
      initial,
    );
  }

  const results = completeQuizWithScore(10);
  assert.equal(
    reduceCourseG04L03Fq002Interaction(results, {
      type: "answer",
      optionId: "A",
      questionId: 1,
      sequenceNumber: 1,
    }),
    results,
  );
  assert.equal(
    reduceCourseG04L03Fq002Interaction(results, {
      type: "select-option",
      optionId: "A",
    }),
    results,
  );
  assert.equal(
    reduceCourseG04L03Fq002Interaction(results, {type: "submit"}),
    results,
  );

  const unknownAction = {
    type: "unknown-action",
    payload: "must-not-mutate-state",
  } as unknown as CourseG04L03Fq002InteractionAction;
  assert.equal(
    reduceCourseG04L03Fq002Interaction(initial, unknownAction),
    initial,
  );
});

test("inventory, state, results, responses, and review projections are immutable", () => {
  const initial = createCourseG04L03Fq002InteractionState(7);
  const firstQuestion = initial.currentQuestion;
  assert.ok(firstQuestion);
  const answered = atomicAnswer(initial, firstQuestion.correctOptionId);
  const results = completeQuizWithScore(10, 7);
  const review = reduceCourseG04L03Fq002Interaction(results, {
    type: "start-review",
  });
  const reviewItem = getCourseG04L03Fq002ReviewItem(review);
  assert.ok(reviewItem);

  assert.equal(Object.isFrozen(COURSE_G04_L03_FQ_002_QUESTIONS), true);
  assert.equal(Object.isFrozen(firstQuestion), true);
  assert.equal(Object.isFrozen(firstQuestion.contextText), true);
  assert.equal(Object.isFrozen(firstQuestion.options), true);
  assert.equal(Object.isFrozen(firstQuestion.options[0]), true);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.questionOrder), true);
  assert.equal(Object.isFrozen(initial.responses), true);
  assert.equal(Object.isFrozen(answered), true);
  assert.equal(Object.isFrozen(answered.responses), true);
  assert.equal(Object.isFrozen(answered.responses[0]), true);
  assert.equal(Object.isFrozen(results.results), true);
  assert.equal(Object.isFrozen(reviewItem), true);
  assert.equal(initial.responses.length, 0);
  assert.equal(initial.score, 0);
});

test("static Canvas masking policy preserves capture while closing every gate", () => {
  assert.deepEqual(COURSE_G04_L03_FQ_002_FUNCTIONAL_MASKING_POLICY, {
    sourceScriptMcFinishInitialVisibility: "hidden",
    sourceStaticCanvasFinishArtifact:
      "sprite-16-finish-artifact-is-always-drawn",
    sourceStaticCanvasQuestionCounters:
      "QuestNo-and-CQ-retain-source-question-id",
    sourceStaticDynamicVisibilityAndCounterParityEstablished: false,
    functionalPresentationMask:
      "modern-DOM-mask-covers-static-finish-artifact-and-source-counters",
    functionalSequenceCounter: "selected-order-1-through-10",
    deterministicCaptureMask: "none",
    deterministicCaptureCanvas: "preserve-unmodified-source-static-drawing",
    canvasAssetMutation: "forbidden",
  });
  assert.deepEqual(COURSE_G04_L03_FQ_002_DISABLED_INTEGRATIONS, {
    lms: {enabled: false},
    getUrl: {enabled: false},
    hostCloseReport: {enabled: false},
    audio: {enabled: false},
    spanish: {enabled: false},
  });

  const authority = COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY;
  assert.equal(authority.sourceRandomParityEstablished, false);
  assert.equal(authority.sourceSeparateSelectSubmitParityEstablished, false);
  assert.equal(authority.sourceReviewPreviousParityEstablished, false);
  assert.equal(authority.sourceReviewVisualParityEstablished, false);
  assert.equal(authority.sourceResultsVisualParityEstablished, false);
  assert.equal(
    authority.sourceStaticDynamicVisibilityAndCounterParityEstablished,
    false,
  );
  assert.equal(authority.lmsIntegrationEnabled, false);
  assert.equal(authority.legacyGetUrlEnabled, false);
  assert.equal(authority.hostCloseReportEnabled, false);
  assert.equal(authority.audioEnabled, false);
  assert.equal(authority.spanishEnabled, false);
  assert.equal(authority.behaviorParityEstablished, false);
  assert.equal(authority.replayParityEstablished, false);
  assert.equal(authority.authoritativeOriginalRuntimeAccepted, false);
  assert.equal(authority.naturalRuntimeTraceAccepted, false);
  assert.equal(authority.humanVisualReviewAccepted, false);
  assert.equal(authority.ownerAccepted, false);
  assert.equal(authority.strictMigrationComplete, false);
  assert.equal(authority.strictAcceptanceEffect, "none");

  assert.deepEqual(COURSE_G04_L03_FQ_002_INTERACTION_SOURCE, {
    animationId: "course-g04-l03-fq-002",
    swf:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/"
      + "HELP_COURSES/ELMGR4/L3/FQ/L3FQ02.swf",
    swfSha256:
      "ab1940815259d7b73f9e9bf6e1f33351e00d3ec02e37286e480806409955882b",
    fla:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/"
      + "HELP_COURSES/ELMGR4/L3/FQ/L3FQ02.fla",
    flaSha256:
      "146bbfa62ccb6cbd38d3a6f3f1bd4c5312a65821608bcdc0c081b43d3a6ebc77",
    frameDomain: "sprite-899",
    questionFrames: {first: 2, last: 26},
    reviewFrames: {first: 44, last: 68},
    selectedQuestionCount: 10,
    sourceQuestionCount: 25,
  });
});
