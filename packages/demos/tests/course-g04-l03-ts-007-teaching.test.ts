import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import test from "node:test";

import {
  getCourseG04L3Ts007RevealedSteps,
  Ts007NumberLine,
  Ts007WalkthroughReading,
} from "../src/modules/course-g04-l03-ts-007-teaching";
import {
  createCourseG04L03Ts007InteractionState,
  reduceCourseG04L03Ts007Interaction,
} from "../src/timelines/course-g04-l03-ts-007-practice-question-interaction";

test("TS007 readable solution follows the four source reveal gates and resets on Replay", () => {
  let interaction = createCourseG04L03Ts007InteractionState();
  for (let gate = 0; gate <= 4; gate += 1) {
    assert.equal(getCourseG04L3Ts007RevealedSteps(interaction), gate);
    const markup = renderToStaticMarkup(createElement(Ts007WalkthroughReading, {interaction}));
    assert.equal((markup.match(/<h3>/g) ?? []).length, gate);
    assert.doesNotMatch(markup, /right angle|acute|obtuse|terminal state/);
    if (gate >= 1) assert.match(markup, /Where is −2\?/);
    if (gate >= 2) assert.match(markup, /Information given: a number line with symbols/);
    if (gate < 3) assert.doesNotMatch(markup, /correct answer choice is B/);
    if (gate >= 3) assert.match(markup, /draw a picture/);
    if (gate === 4) assert.match(markup, /guess and check/);
    interaction = reduceCourseG04L03Ts007Interaction(interaction, {type: "continue-walkthrough"});
  }
  interaction = reduceCourseG04L03Ts007Interaction(interaction, {type: "replay"});
  assert.equal(getCourseG04L3Ts007RevealedSteps(interaction), 0);
});

test("TS007 readable number line has equally spaced unit ticks and the four source symbols", () => {
  const markup = renderToStaticMarkup(createElement(Ts007NumberLine));
  const ticks = [...markup.matchAll(/data-number-line-value="(-?\d+)" transform="translate\((\d+), 0\)"/g)]
    .map(match => ({value: Number(match[1]), x: Number(match[2])}));
  assert.deepEqual(ticks.map(tick => tick.value), [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
  assert.ok(ticks.slice(1).every((tick, i) => tick.x - ticks[i]!.x === 28));
  const symbols = [...markup.matchAll(/data-number-line-symbol="([ABCD])" data-number-line-location="(-?\d+)"/g)]
    .map(match => [match[1], Number(match[2])]);
  assert.deepEqual(symbols, [["A", -4], ["B", -2], ["C", 2], ["D", 4]]);
  assert.match(markup, /heart at negative two/);
  assert.match(markup, /Each tick is 1 unit/);
  assert.match(markup, /Negative numbers are to the left of 0/);
});
