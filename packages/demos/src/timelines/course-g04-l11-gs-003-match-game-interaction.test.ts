import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {COURSE_G04_L11_GS_003_LEVEL_1_CARDS,
  COURSE_G04_L11_GS_003_LEVEL_2_CARDS, createCourseG04L11Gs003State,
  reduceCourseG04L11Gs003State} from
  "./course-g04-l11-gs-003-match-game-interaction";

describe("course-g04-l11-gs-003 modern matching candidate", () => {
  it("binds exact source pair stems and mathematical answers", () => {
    assert.equal(COURSE_G04_L11_GS_003_LEVEL_1_CARDS.length, 12);
    assert.equal(COURSE_G04_L11_GS_003_LEVEL_2_CARDS.length, 12);
    const level1 = Object.fromEntries(COURSE_G04_L11_GS_003_LEVEL_1_CARDS
      .filter((card) => card.side === "answer").map((card) =>
        [card.pairId, card.coordinate]));
    const level2 = Object.fromEntries(COURSE_G04_L11_GS_003_LEVEL_2_CARDS
      .filter((card) => card.side === "answer").map((card) =>
        [card.pairId, card.distanceUnits]));
    assert.deepEqual(level1, {Mc1: "(1,7)", Mc2: "(3,4)", Mc3: "(5,8)",
      Mc4: "(8,6)", Mc5: "(4,3)", Mc6: "(6,1)"});
    assert.deepEqual(level2, {Mc1: 2, Mc2: 3, Mc3: 4, Mc4: 5, Mc5: 7, Mc6: 6});
  });

  it("preserves source level selection and +10/-2 score deltas", () => {
    let state = createCourseG04L11Gs003State();
    state = reduceCourseG04L11Gs003State(state, {type: "continue-to-levels"});
    state = reduceCourseG04L11Gs003State(state,
      {type: "select-level", levelId: "level-2"});
    state = reduceCourseG04L11Gs003State(state, {type: "start"});
    const [first, second, , wrong] = COURSE_G04_L11_GS_003_LEVEL_2_CARDS;
    state = reduceCourseG04L11Gs003State(state,
      {type: "select-card", cardId: first.id});
    state = reduceCourseG04L11Gs003State(state,
      {type: "select-card", cardId: second.id});
    assert.equal(state.score, 10);
    assert.deepEqual(state.matchedPairIds, ["Mc1"]);
    state = reduceCourseG04L11Gs003State(state,
      {type: "select-card", cardId: COURSE_G04_L11_GS_003_LEVEL_2_CARDS[2].id});
    state = reduceCourseG04L11Gs003State(state,
      {type: "select-card", cardId: wrong.id});
    assert.equal(state.score, 8);
    assert.equal(state.feedback, "incorrect");
  });

  it("allows negative source score and treats a repeated modern card as a safe no-op", () => {
    let state = createCourseG04L11Gs003State();
    state = reduceCourseG04L11Gs003State(state, {type: "continue-to-levels"});
    state = reduceCourseG04L11Gs003State(state, {type: "start"});
    const [first, wrong] = COURSE_G04_L11_GS_003_LEVEL_1_CARDS;
    state = reduceCourseG04L11Gs003State(state,
      {type: "select-card", cardId: first.id});
    const repeated = reduceCourseG04L11Gs003State(state,
      {type: "select-card", cardId: first.id});
    assert.equal(repeated, state);
    state = reduceCourseG04L11Gs003State(state,
      {type: "select-card", cardId: wrong.id});
    assert.equal(state.score, -2);
  });

  it("completes after six exact pairs and fully resets on replay", () => {
    let state = createCourseG04L11Gs003State();
    state = reduceCourseG04L11Gs003State(state, {type: "continue-to-levels"});
    state = reduceCourseG04L11Gs003State(state, {type: "start"});
    for (const pairId of ["Mc1", "Mc2", "Mc3", "Mc4", "Mc5", "Mc6"]) {
      const pair = COURSE_G04_L11_GS_003_LEVEL_1_CARDS.filter((card) =>
        card.pairId === pairId);
      state = reduceCourseG04L11Gs003State(state,
        {type: "select-card", cardId: pair[0].id});
      state = reduceCourseG04L11Gs003State(state,
        {type: "select-card", cardId: pair[1].id});
    }
    assert.equal(state.phase, "complete");
    assert.equal(state.score, 60);
    assert.equal(state.completedPairCount, 6);
    state = reduceCourseG04L11Gs003State(state, {type: "replay"});
    assert.deepEqual(state, createCourseG04L11Gs003State());
  });

  it("freezes state and rejects invalid phase transitions", () => {
    const state = createCourseG04L11Gs003State();
    assert.equal(Object.isFrozen(state), true);
    assert.equal(Object.isFrozen(state.matchedPairIds), true);
    assert.throws(() => reduceCourseG04L11Gs003State(state, {type: "start"}));
    assert.throws(() => reduceCourseG04L11Gs003State(state,
      {type: "select-card", cardId: COURSE_G04_L11_GS_003_LEVEL_1_CARDS[0].id}));
  });
});
