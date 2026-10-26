import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {G678_ALG_L11_D_INSTRUCTIONAL_VISUALS as DATA} from
  "../src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1";
import {
  AlgL11DInstructionalAssessmentView,
  AlgL11DInstructionalMatchingRenderer,
  reduceAlgL11DInstructionalAssessment,
  ALG_L11_D_SOURCE_COMPLETION_STOPS,
  G678_ALG_L11_D_INSTRUCTIONAL_P034_MODULE,
  G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE,
} from "../src/g678-alg-l11-tranche-d-instructional-candidates";
import {
  G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY,
  createAlgL11Advanced3AssessmentState,
  reduceAlgL11Advanced3Assessment,
} from "../src/g678-alg-l11-advanced3-tranche-d-state";

test("all 24 prompts and 96 actual source options preserve unique layered glyph vectors and the source answer key", () => {
  assert.deepEqual(DATA.questions.map(q => q.number), Array.from({length: 24}, (_, i) => i + 1));
  const globalIds = new Set<string>();
  for (const question of DATA.questions) {
    assert.equal(question.sourceFrame, question.number + 1);
    assert.equal(question.sourceReviewFrame, question.number + 44);
    assert.equal(question.correctOption, G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY[question.number - 1]);
    assert.equal(question.correctSourceInstanceName, `A${question.number}Opt${question.correctOption}`);
    assert.deepEqual(question.choices.map(c => c.sourceInstanceName), [1,2,3,4].map(o => `A${question.number}Opt${o}`));
    assert.ok(question.sourceText.some(record => record.text.length > 10));
    for (const visual of [question.prompt, ...question.choices.map(choice => choice.visual)]) {
      assert.match(visual.svg, /<path\b/);
      assert.match(visual.svg, /xlink:href="#d-p044-/);
      assert.doesNotMatch(visual.svg, /<image\b|<script\b|<style\b|<foreignObject\b/);
      assert.equal(createHash("sha256").update(visual.svg).digest("hex"), visual.sha256);
      for (const match of visual.svg.matchAll(/\bid="([^"]+)"/g)) {
        assert.ok(!globalIds.has(match[1]), `duplicate SVG ID ${match[1]}`); globalIds.add(match[1]);
      }
    }
  }
  assert.equal(DATA.questions[20].correctSourceInstanceName, "A21Opt4");
  assert.match(DATA.questions[20].sourceText[0].text, /at least 600 miles/);
  assert.equal(DATA.questions[22].correctSourceInstanceName, "A23Opt2");
});

test("elapsed frame count cannot complete unanswered D source interactions and resolution preserves score state",()=>{
  for(const[module,stop,end]of[
    [G678_ALG_L11_D_INSTRUCTIONAL_P034_MODULE,ALG_L11_D_SOURCE_COMPLETION_STOPS.p034,5],
    [G678_ALG_L11_D_INSTRUCTIONAL_P044_MODULE,ALG_L11_D_SOURCE_COMPLETION_STOPS.p044,69],
  ] as const){
    assert.equal(module.interactiveStops[0],stop);assert.equal(stop.stopFrame,1);assert.equal(stop.resumeFrame,end);
    assert.equal(stop.rendererStateOnResume,"preserve");assert.equal(module.reducedMotionFrame,end);
    assert.equal(stop.resolution,"explicit-source-control-finished");assert.equal(stop.strictAcceptanceEffect,"none");
  }
});

test("every answering state displays the exact question and four instructional choice SVGs", () => {
  for (const question of DATA.questions) {
    const state = {...createAlgL11Advanced3AssessmentState(31), questionNumbers: [question.number]};
    const html = renderToStaticMarkup(<AlgL11DInstructionalAssessmentView state={state} paused={false} dispatch={() => {}} replay={() => {}} />);
    assert.match(html, new RegExp(`data-source-question="Q${question.number}"`));
    assert.ok(html.includes(question.prompt.sha256));
    for (const option of question.choices) {
      assert.ok(html.includes(option.visual.sha256));
      assert.ok(html.includes(`data-source-instance-name="${option.sourceInstanceName}"`));
    }
    assert.equal([...html.matchAll(/<svg\b/g)].length, 5);
    assert.doesNotMatch(html, /not presented|diagnostic evidence|>Option [A-D]</);
  }
});

test("review retains actual prompts and all choices, marks selection and correct answer, and pause blocks every transition", () => {
  const seed = 31;
  let state = createAlgL11Advanced3AssessmentState(seed);
  assert.equal(new Set(state.questionNumbers).size, 10);
  while (state.phase === "answering") {
    const questionNumber = state.questionNumbers[state.currentIndex];
    const answer = G678_ALG_L11_ADVANCED3_TRANCHE_D_ANSWER_KEY[questionNumber - 1];
    const option = state.currentIndex % 2 ? answer : (answer % 4 + 1) as 1|2|3|4;
    state = reduceAlgL11Advanced3Assessment(state, {type: "answer", option, input: "mouse"}, seed);
  }
  assert.equal(state.responses.filter(response => response.correct).length, 5);
  assert.equal(state.grade, "Partially Proficient");
  state = reduceAlgL11Advanced3Assessment(state, {type: "begin-review", input: "mouse"}, seed);
  for (let index = 0; index < 10; index += 1) {
    const response = state.responses[index];
    const html = renderToStaticMarkup(<AlgL11DInstructionalAssessmentView state={state} paused dispatch={() => {}} replay={() => {}} />);
    const question = DATA.questions.find(q => q.number === response.questionNumber)!;
    assert.ok(html.includes(question.prompt.sha256));
    for (const option of question.choices) assert.ok(html.includes(option.visual.sha256));
    assert.equal([...html.matchAll(/data-review-selected="true"/g)].length, 1);
    assert.equal([...html.matchAll(/data-review-correct="true"/g)].length, 1);
    assert.equal([...html.matchAll(/<button\b/g)].length, [...html.matchAll(/ disabled=""/g)].length);
    const event = {type: index < 9 ? "next-review" : "finish-review", input: "mouse"} as const;
    assert.equal(reduceAlgL11DInstructionalAssessment(state, event, seed, true), state);
    state = reduceAlgL11DInstructionalAssessment(state, event, seed, false);
  }
  assert.equal(state.phase, "results");
  const replay = reduceAlgL11DInstructionalAssessment(state, {type: "replay", input: "mouse"}, seed, false);
  assert.equal(replay.responses.length, 0); assert.equal(replay.reviewIndex, 0);
  assert.notDeepEqual(replay.questionNumbers, state.questionNumbers);
  assert.deepEqual(replay, createAlgL11Advanced3AssessmentState(seed, 1));
});

test("matching renderer shows all 24 original mathematical card artworks across two levels", () => {
  for (const level of [1, 2] as const) {
    const html = renderToStaticMarkup(<AlgL11DInstructionalMatchingRenderer frame={1}
      frameDomain="sprite-225" lang="en" scenario="advanced3-tranche-d-unregistered-engineering-candidate"
      seed={31} paused replay={0} onReplay={() => {}}
      lessonHostNavigationHandoff={{kind: "game-level", sourceAnimationId: "shared-alg001-l11-p033",
        targetAnimationId: "shared-alg001-l11-p034", level}} />);
    const cards = DATA.cards.filter(card => card.level === level);
    assert.equal(cards.length, 12); assert.equal([...html.matchAll(/<svg\b/g)].length, 12);
    for (const card of cards) {
      assert.ok(html.includes(card.visual.sha256));
      assert.ok(html.includes(`data-source-card-id="${card.id}"`));
      assert.match(card.visual.svg, /<path\b/);
    }
    assert.equal([...html.matchAll(/<button\b/g)].length, [...html.matchAll(/ disabled=""/g)].length);
    assert.doesNotMatch(html, /Text tokens|diagnostic|Mc[1-6]_[12]<\//);
  }
  assert.ok(Object.values(DATA.gates).every(value => value === false));
  assert.equal(DATA.coverage.p033ControllerFullVisualTimelineImplemented, false);
});
