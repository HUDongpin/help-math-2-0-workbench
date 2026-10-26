import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {G678_ALG_L11_P034_COMPANION_CANDIDATE_MODULE as MODULE} from "../src/g678-alg-l11-p034-companion-candidate";
import {G678_ALG_L11_P034_FEEDBACK_CANDIDATE_MODULE as PREVIOUS} from "../src/g678-alg-l11-p034-feedback-candidate";
import {G678_ALG_L11_P034_LEARNER_MATH as MATH} from "../src/generated/g678-alg-l11-p034-learner-math-v1";
const map=JSON.parse(await readFile(new URL('../../../catalog/g678-alg-l11-p034-math-source-map-v1.json',import.meta.url),'utf8'));
test("learner projection contains all24 literal alternatives and no reviewer solution or pair fields",()=>{
  assert.equal(MATH.length,24);
  for(const row of MATH){assert.deepEqual(Object.keys(row),["cardId","sourceCharacterId","expression","spoken","spokenLanguage"]);
    const source=map.cards.find((c:any)=>c.cardId===row.cardId);assert.equal(row.expression,source.literalAlternative.expression);assert.equal(row.spoken,source.literalAlternative.spoken);}
  assert.ok(!/reviewerOnly|solutionSet|pairId|coefficients/.test(JSON.stringify(MATH)));
});
test("standalone rendering has one native literal card tree and a non-actionable source plane",()=>{
  const Renderer=MODULE.Renderer;
  const markup=renderToStaticMarkup(<Renderer frame={1} seed={31} lang="en" scenario="source-static-frame" replay={0}/>);
  assert.equal((markup.match(/data-p034-action-tree="true"/g)||[]).length,1);
  assert.equal((markup.match(/data-source-card-id=/g)||[]).length,12);
  assert.equal((markup.match(/data-source-art-card=/g)||[]).length,12);
  const plane=markup.slice(markup.indexOf('data-p034-source-plane='));assert.ok(!plane.includes('<button'));
  assert.ok(markup.includes('data-companion-placement="fallback"'));assert.ok(markup.includes('−10 ≤ x ≤ 10'));
  assert.ok(!markup.includes('>Continue<'));
});
test("separate module preserves exact source stops and capability while old renderer stays unchanged",()=>{
  assert.notEqual(MODULE.Renderer,PREVIOUS.Renderer);assert.equal(MODULE.interactiveStops,PREVIOUS.interactiveStops);
  assert.equal(MODULE.lessonHost,PREVIOUS.lessonHost);assert.deepEqual(MODULE.lessonHost.capabilities,["practice-feedback"]);
});
