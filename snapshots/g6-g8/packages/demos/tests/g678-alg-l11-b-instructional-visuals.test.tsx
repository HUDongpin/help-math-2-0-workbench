import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';
import {G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES,createAlgL11Behavior10State,reduceAlgL11Behavior10} from '../src/g678-alg-l11-behavior10-tranche-b-state';
import {createAlgL11BInstructionalVisualCandidate, resolveAlgL11BNativeVectorFrame,
  resolveAlgL11BExplanationFrame, sourceInstructionalFeedback, type AlgL11BExplanationBundle,
  visibleAlgL11BSourceGlossary,type AlgL11BSourceGlossaryConfig,
  buildAlgL11BSourceFeedbackIntent,
  type AlgL11BVectorBundle} from '../src/g678-alg-l11-b-instructional-visuals';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const load = (page: string): AlgL11BVectorBundle => JSON.parse(readFileSync(path.join(root,
  `work/g678-shared-page-factory/g678-alg-l11-b-instructional-visuals-v3/shared-alg001-l11-p${page}/vector-bundle.json`),'utf8'));
const bundle = load('026');
const config = G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES[0];

test('p026 has native source content throughout all294 frames with distinct pre/post quiz visual states', () => {
  assert.equal(bundle.frameBodyIndices.length,294);
  assert.equal(bundle.choiceControls.map(x=>x.label).join(''),'ABCD');
  assert.deepEqual(bundle.choiceControls.map(x=>x.instanceName),['AnsBtn1','AnsBtn3','AnsBtn2','AnsBtn4']);
  assert.notEqual(resolveAlgL11BNativeVectorFrame(bundle,100),resolveAlgL11BNativeVectorFrame(bundle,180));
  assert.notEqual(resolveAlgL11BNativeVectorFrame(bundle,180),resolveAlgL11BNativeVectorFrame(bundle,250));
  for(let frame=1; frame<=294; frame++) assert.match(resolveAlgL11BNativeVectorFrame(bundle,frame),new RegExp(`data-source-vector-frame="${frame}"`));
  assert.throws(()=>resolveAlgL11BNativeVectorFrame(bundle,0),/outside/);
  assert.throws(()=>resolveAlgL11BNativeVectorFrame(bundle,295),/outside/);
  assert.equal(bundle.childDomainsPending.length,0);
});

test('real source glyphs are not covered by FFDec hit-test rectangles', async () => {
  const image = await sharp(Buffer.from(resolveAlgL11BNativeVectorFrame(bundle,180))).raw().toBuffer({resolveWithObject:true});
  assert.equal(image.info.width,800);assert.equal(image.info.height,600);
  // Source A row hit rectangle is x486–623,y204–238. Correct vectors have
  // thin black glyph strokes; losing FFDec button CSS makes almost all black.
  let black=0,total=0;
  for(let y=205;y<237;y++) for(let x=487;x<622;x++) {
    const i=(y*800+x)*image.info.channels;
    if(image.data[i]<30&&image.data[i+1]<30&&image.data[i+2]<30) black++;
    total++;
  }
  assert.ok(black/total>0.015,`Missing original formula glyphs: ${black/total}`);
  assert.ok(black/total<0.2,`Hit rectangles cover instructional text: ${black/total}`);
});

test('source help artwork and close control only enter the requested help state', () => {
  const closed=resolveAlgL11BNativeVectorFrame(bundle,180);
  const open=resolveAlgL11BNativeVectorFrame(bundle,180,true);
  assert.ok(open.length>closed.length);
  assert.doesNotMatch(closed,/data-source-instance="CloseBtn"/);
  assert.match(open,/data-source-instance="CloseBtn"/);
  assert.ok(bundle.helpClosePolygon?.length===4);
});

test('new maintained module uses actual full-frame visuals and exact positioned controls without old placeholders', () => {
  const {Renderer,module}=createAlgL11BInstructionalVisualCandidate(config,bundle);
  const markup=renderToStaticMarkup(<Renderer frame={180} lang="en" paused={false}
    scenario="source-static-frame" seed={1} frameDomain="sprite-228" rootFrame={6}/>);
  assert.match(markup,/data-source-vector-frame="180"/);
  for(const label of ['A','B','C','D']) assert.match(markup,new RegExp(`aria-label="Answer ${label}"`));
  assert.doesNotMatch(markup,/Source vector option|Choose the source-visible label|Exact source help artwork/);
  assert.match(markup,/data-product-calibration-passed="false"/);
  assert.equal(module.interactiveStops?.length,1);
  assert.throws(()=>createAlgL11BInstructionalVisualCandidate(config,{...bundle,source:{...bundle.source,sha256:'0'.repeat(64)}}),/does not match/);
});

test('all10 source main timelines retain exact frame domains and all40 option controls', () => {
  let frameCount=0;
  for(const page of G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES) {
    const version=page.guidedHits.length?4:3;
    const b: AlgL11BVectorBundle=JSON.parse(readFileSync(path.join(root,
      `work/g678-shared-page-factory/g678-alg-l11-b-instructional-visuals-v${version}/${page.animationId}/vector-bundle.json`),'utf8'));
    assert.equal(b.frameCount,page.frameCount);assert.equal(b.frameBodyIndices.length,page.frameCount);
    assert.equal(b.choiceControls.length,4);assert.equal(b.source.sha256,page.source.sha256);
    for(const choice of b.choiceControls) assert.equal(choice.polygon.length,4);
    assert.notEqual(b.frameBodyIndices[0],b.frameBodyIndices[b.quizFrame-1]);
    frameCount+=b.frameCount;
  }
  assert.equal(frameCount,4787);
});

test('guided explanation clock stops at source15 and closes through16–20', () => {
  assert.equal(resolveAlgL11BExplanationFrame(0),1);
  assert.equal(resolveAlgL11BExplanationFrame(250),4);
  assert.equal(resolveAlgL11BExplanationFrame(5000),15);
  assert.equal(resolveAlgL11BExplanationFrame(0,true),16);
  assert.equal(resolveAlgL11BExplanationFrame(250,true),19);
  assert.equal(resolveAlgL11BExplanationFrame(5000,true),20);
  assert.throws(()=>resolveAlgL11BExplanationFrame(-1),/Invalid/);
});

test('three guided pages expose source explanation vectors and label the maintained empty-hit continuation', () => {
  for(const page of G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES.filter(x=>x.guidedHits.length)) {
    const b: AlgL11BVectorBundle=JSON.parse(readFileSync(path.join(root,
      `work/g678-shared-page-factory/g678-alg-l11-b-instructional-visuals-v4/${page.animationId}/vector-bundle.json`),'utf8'));
    const e: AlgL11BExplanationBundle=JSON.parse(readFileSync(path.join(root,
      `work/g678-shared-page-factory/g678-alg-l11-b-guided-explanation-vectors-v1/${page.animationId}/explanation-bundle.json`),'utf8'));
    assert.equal(e.branches.length,2);assert.equal(e.branches.reduce((n,x)=>n+x.frameBodies.length,0),41);
    for(const branch of e.branches) assert.notEqual(branch.frameBodies[0],branch.frameBodies[14]);
    const {Renderer}=createAlgL11BInstructionalVisualCandidate(page,b,e);
    const markup=renderToStaticMarkup(<Renderer frame={e.branches[0].mainFrame} lang="en" paused={false}
      scenario="source-static-frame" seed={1} frameDomain={page.frameDomain} rootFrame={6}/>);
    assert.match(markup,/data-maintained-empty-source-hit-adapter="true"/);
    assert.match(markup,/Show the explanation for this answer/);
    assert.match(markup,/data-guided-explanation-rendered="true"/);
    assert.match(markup,/data-product-calibration-passed="false"/);
  }
});

test('wrong feedback teaches the exact source concept rather than metadata about a source label', () => {
  const initial=createAlgL11Behavior10State(config,config.quizFrame,0);
  const wrong=reduceAlgL11Behavior10(config,initial,{type:'choose',choiceId:'A',input:'mouse',hostAllowed:true,feedbackBranch:3});
  assert.equal(sourceInstructionalFeedback(config,wrong),'Find the inequality symbol for greater than or equal to. Try again.');
  const p030=G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES.find(p=>p.animationId.endsWith('p030'))!;
  const wrong030=reduceAlgL11Behavior10(p030,createAlgL11Behavior10State(p030,p030.quizFrame,0),
    {type:'choose',choiceId:'A',input:'mouse',hostAllowed:true,feedbackBranch:3});
  assert.match(sourceInstructionalFeedback(p030,wrong030)!,/all numbers within a certain distance from zero/);
  assert.doesNotMatch(sourceInstructionalFeedback(p030,wrong030)!,/source-labeled/);
});

test('B10 source glossary controls retain exact source term targets and frame/surface boundaries',()=>{
  let count=0;
  for(const page of G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES){
    const g:AlgL11BSourceGlossaryConfig=JSON.parse(readFileSync(path.join(root,
      `work/g678-shared-page-factory/g678-alg-l11-b-source-glossary-v1/${page.animationId}.json`),'utf8'));
    assert.equal(g.sourceSha256,page.source.sha256);
    for(const control of g.controls){
      assert.equal(control.polygon.length,4);
      assert.ok(g.entries.some(e=>e.id===control.entryId&&e.key===control.sourceKey));
      assert.ok(visibleAlgL11BSourceGlossary(g,control.firstFrame,control.surface).includes(control));
      assert.ok(!visibleAlgL11BSourceGlossary(g,control.lastFrame+1,control.surface).includes(control));
      assert.ok(!visibleAlgL11BSourceGlossary(g,control.firstFrame,'wrong-surface').includes(control));
      count++;
    }
  }
  assert.equal(count,270);
});

test('source words are keyboard-addressable controls with declared glossary host capability',()=>{
  const g:AlgL11BSourceGlossaryConfig=JSON.parse(readFileSync(path.join(root,
    'work/g678-shared-page-factory/g678-alg-l11-b-source-glossary-v1/shared-alg001-l11-p026.json'),'utf8'));
  const {Renderer,module}=createAlgL11BInstructionalVisualCandidate(config,bundle,undefined,g);
  const html=renderToStaticMarkup(<Renderer frame={180} lang="en" paused={false} scenario="source-static-frame" seed={1} frameDomain="sprite-228"/>);
  assert.match(html,/aria-label="Define Translate"/);
  assert.match(html,/aria-label="Define Sentence"/);
  assert.match(html,/data-source-glossary-enabled="true"/);
  assert.ok(module.lessonHost?.capabilities.includes('glossary'));
  const paused=renderToStaticMarkup(<Renderer frame={180} lang="en" paused={true} scenario="source-static-frame" seed={1} frameDomain="sprite-228"/>);
  assert.doesNotMatch(paused,/tabindex="0"/);
  assert.throws(()=>createAlgL11BInstructionalVisualCandidate(config,bundle,undefined,{...g,animationId:'wrong'}),/does not match/);
});

test('source feedback adapters use valid one-based host IDs and reduced mode targets the source stop chain',()=>{
  const intent=buildAlgL11BSourceFeedbackIntent(config,'A',0);
  assert.equal(intent.request.branchIndex,4);assert.equal(intent.request.branchCount,4);
  const guided=G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES.find(p=>p.animationId.endsWith('p040'))!;
  assert.equal(buildAlgL11BSourceFeedbackIntent(guided,'C',0).request.branchIndex,1);
  assert.equal(buildAlgL11BSourceFeedbackIntent(guided,'C',3).request.branchIndex,4);
  assert.equal(createAlgL11BInstructionalVisualCandidate(config,bundle).module.reducedMotionFrame,config.quizFrame);
});
