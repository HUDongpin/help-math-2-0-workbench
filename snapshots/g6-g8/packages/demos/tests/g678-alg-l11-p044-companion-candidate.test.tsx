import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {G678_ALG_L11_P044_LITERAL_CONTENT as CONTENT} from "../src/generated/g678-alg-l11-p044-literal-content-v1";
import {G678_ALG_L11_P044_COMPANION_CANDIDATE_MODULE as MODULE} from "../src/g678-alg-l11-p044-companion-candidate";
import {G678_ALG_L11_P044_HOST_SCORE_CANDIDATE_MODULE as PREVIOUS} from "../src/g678-alg-l11-p044-host-score-candidate";
import {createAlgL11Advanced3AssessmentState} from "../src/g678-alg-l11-advanced3-tranche-d-state";
test("all24 literal questions and96 source choices omit answer and solved-question metadata",()=>{
  assert.equal(CONTENT.length,24);assert.equal(CONTENT.flatMap(q=>q.choices).length,96);
  assert.equal(CONTENT.filter(q=>q.promptGraphDescription).length,6);assert.equal(CONTENT.flatMap(q=>q.choices).filter(c=>c.graphic).length,12);
  assert.ok(!/correctOption|correctSourceInstanceName|solutionSet|reviewerOnly/.test(JSON.stringify(CONTENT)));
  for(const q of CONTENT){assert.deepEqual(q.choices.map(c=>c.sourceInstanceName),[1,2,3,4].map(i=>`A${q.number}Opt${i}`));
    for(const c of q.choices){assert.ok(c.text.length>0&&c.spoken.length>0);assert.equal(typeof c.graphic,"boolean");}}
  assert.equal(CONTENT[7].prompt.endsWith("≥ 20"),true);assert.equal(CONTENT[8].prompt.endsWith("≤ 20"),true);
  assert.equal(CONTENT[22].choices[2].text,"1200 ≤ v ≤ 1200");
});
test("all24 standalone first-question states contain a single accessible choice tree and readonly source art",()=>{
  const seen=new Set<number>(),Renderer=MODULE.Renderer;
  for(let seed=0;seen.size<24&&seed<1000;seed++){
    const number=createAlgL11Advanced3AssessmentState(seed).questionNumbers[0];if(seen.has(number))continue;seen.add(number);
    const markup=renderToStaticMarkup(<Renderer frame={1} seed={seed} lang="en" scenario="source-static-frame" replay={0}/>);
    assert.equal((markup.match(/data-p044-action-tree="true"/g)||[]).length,1);assert.equal((markup.match(/data-literal-choice="true"/g)||[]).length,4);
    assert.ok(markup.includes(`data-source-question="Q${number}"`));
    assert.ok(!markup.slice(markup.indexOf('data-p044-source-plane=')).includes('<button'));
    assert.ok(!markup.includes('>Continue<'));
  }
  assert.equal(seen.size,24);
});
test("new presentation inherits the exact typed score capability, completion stop and source identity",()=>{
  assert.notEqual(MODULE.Renderer,PREVIOUS.Renderer);assert.equal(MODULE.lessonHost,PREVIOUS.lessonHost);
  assert.equal(MODULE.interactiveStops,PREVIOUS.interactiveStops);assert.equal(MODULE.key,PREVIOUS.key);assert.deepEqual(MODULE.lessonHost.capabilities,["fq-scoring"]);
});

test("source and companion graph instances never share SVG element IDs",()=>{
  const Renderer=MODULE.Renderer;
  const seed=Array.from({length:100},(_,i)=>i).find(i=>createAlgL11Advanced3AssessmentState(i).questionNumbers[0]===7)!;
  const markup=renderToStaticMarkup(<Renderer frame={1} seed={seed} lang="en" scenario="source-static-frame" replay={0}/>);
  const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
});
