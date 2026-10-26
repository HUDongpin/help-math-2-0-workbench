import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import geometry from '../../../migrations/shared-alg001-l06-p035/native-v1/native-geometry-v1.json';
import {P035NativeCompanionDraft,p035NativeTextState} from './alg-l06-p035-native-text-v1';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');

test('pins the physical SWF and preserves all authored text, masks and timeline domains',()=>{
 const source=fs.readFileSync(geometry.source.path);
 assert.equal(createHash('sha256').update(source).digest('hex'),
  '9aaf16b58c32b00b056c7c5040b38f9d1391486bb025b71c95fa0326bbae33b3');
 assert.equal(geometry.definitions.length,53);
 assert.equal(geometry.definitions.filter(d=>d.kind==='edit').length,3);
 assert.equal(geometry.timelines['227'].frameCount,534);
 assert.equal(Object.keys(geometry.timelines).length,15);
 assert.equal(geometry.maskPlacements.length,4);
 assert.deepEqual(geometry.maskPlacements.map(m=>[m.owner,m.objectId,m.depth,m.clipDepth]),
  [['95',83,5,9],['126',96,1,8],['227',19,15,24],['227',19,25,32]]);
 assert.equal(geometry.timelines['227'].instances.filter(row=>
  geometry.definitions.some(def=>def.id===row.objectId)).length,85);
 assert.equal(geometry.canvasSourceGlyphsPreserved,true);
 assert.equal(geometry.canvasInstanceSuppressionSupported,false);
});

test('two source masks reveal authored prose across separate frame intervals',()=>{
 const at13=p035NativeTextState(13),at50=p035NativeTextState(50),
  at89=p035NativeTextState(89),at120=p035NativeTextState(120),
  at145=p035NativeTextState(145);
 const instruction='Substitute 25 for x in the equation of the function to find the ';
 const tail='output when the input is 25.';
 assert.equal(at13.prose.some(row=>row.sourceText===instruction&&row.visibleText===''),false);
 const first13=at13.allTextInstances.find(row=>row.sourceText===instruction)!;
 const first50=at50.allTextInstances.find(row=>row.sourceText===instruction)!;
 const first145=at145.prose.find(row=>row.sourceText===instruction)!;
 assert.equal(first13.visibleText,'');
 assert(first50.visibleText.length>0&&first50.visibleText.length<instruction.length);
 assert.equal(first145.visibleText,instruction);
 assert.equal(first13.clippingMaskInstanceIds.length,1);
 const second89=at89.allTextInstances.find(row=>row.sourceText===tail)!;
 const second120=at120.allTextInstances.find(row=>row.sourceText===tail)!;
 assert.equal(second89.visibleText,'');
 assert(second120.visibleText.length>0&&second120.visibleText.length<tail.length);
 assert.equal(at145.prose.find(row=>row.sourceText===tail)?.visibleText,tail);
 assert.notEqual(first145.instanceId,at145.prose.find(row=>row.sourceText===tail)?.instanceId);
});

test('quiz frame 145 binds visible option instances by source placement and hit geometry',()=>{
 const state=p035NativeTextState(145);
 assert.deepEqual(state.choices.map(c=>[c.buttonName,c.buttonId,c.letter,c.value,c.sourceHandler]),[
  ['AnsBtn1',54,'A','50','wrong'],['AnsBtn2',55,'B','51','right'],
  ['AnsBtn3',54,'C','225','wrong'],['AnsBtn4',54,'D','226','wrong']]);
 assert.deepEqual(geometry.quizChoices.map(c=>[c.buttonDepth,c.letter.depth,c.value.depth]),
  [[81,61,62],[83,79,80],[85,70,71],[87,52,53]]);
 assert(geometry.quizChoices.every(c=>c.letter.hitOverlapFraction>=0.3&&
  c.value.hitOverlapFraction>=0.3&&c.sourceVisibilityFrame===145));
 assert.equal(new Set(state.choices.flatMap(c=>
  [c.letterTextInstanceId,c.valueTextInstanceId])).size,8);
 assert.equal(p035NativeTextState(144).choices.length,0);
 assert.equal(p035NativeTextState(146).choices.length,0);
 const sourceWrong=fs.readFileSync(path.join(root,
  'output/alg-l06-p035-source-triage-20261001-v1/ffdec-export/scripts/DefineButton2_54/BUTTONCONDACTION on(release).as'),'utf8');
 const sourceRight=fs.readFileSync(path.join(root,
  'output/alg-l06-p035-source-triage-20261001-v1/ffdec-export/scripts/DefineButton2_55/BUTTONCONDACTION on(release).as'),'utf8');
 assert.match(sourceWrong,/showWrongFeed\(\)/);
 assert.match(sourceRight,/showRightFeed\(\)/);
});

test('feedback uses its own frame domain and keeps repeated authored instances',()=>{
 const idle=p035NativeTextState(145);
 assert.equal(idle.feedback,null);
 assert.equal(idle.feedbackText.length,0);
 const wrong=p035NativeTextState(145,{feedbackSpriteId:80,feedbackFrame:20,wrongTryCount:0});
 assert.deepEqual(wrong.feedback,{spriteId:80,frame:20});
 assert.deepEqual(wrong.feedbackText.filter(x=>x.visibleText==='Incorrect!')
  .map(x=>x.sourceTextId),[60,61]);
 assert(wrong.feedbackText.some(x=>x.visibleText==='Sorry! Try Again.'&&x.sourceTextId===78));
 assert(wrong.feedbackText.some(x=>x.visibleText==='Close'&&x.sourceTextId===71));
 const second=p035NativeTextState(145,{feedbackSpriteId:80,feedbackFrame:20,wrongTryCount:1});
 assert(second.feedbackText.some(x=>x.visibleText==='Sorry.'&&x.sourceTextId===78));
 const right=p035NativeTextState(145,{feedbackSpriteId:207,feedbackFrame:20});
 assert.deepEqual(right.feedbackText.map(x=>x.visibleText),['Great Job!','Great Job!']);
 assert.equal(right.choices.length,0);
 assert.throws(()=>p035NativeTextState(144,{feedbackSpriteId:80,feedbackFrame:20}),
  /P035_FEEDBACK_DOMAIN_OR_FRAME/);
 assert.throws(()=>p035NativeTextState(145,{feedbackSpriteId:80,feedbackFrame:30}),
  /P035_FEEDBACK_DOMAIN_OR_FRAME/);
});

test('all 534 main and 193 separate feedback frames retain unique source instances',()=>{
 let partial=0;
 for(let frame=1;frame<=534;frame++){
  const state=p035NativeTextState(frame);
  assert.equal(state.mainFrame,frame);
  assert.equal(new Set(state.allTextInstances.map(row=>row.instanceId)).size,
   state.allTextInstances.length);
  partial+=state.allTextInstances.filter(row=>!row.complete).length;
 }
 assert(partial>0,'authored mask reveals cannot collapse to one static text snapshot');
 const domains:Array<[number,number]>=[
  [80,29],[95,28],[126,28],[154,28],[179,27],[195,28],[207,25]];
 assert.equal(domains.reduce((sum,[,frames])=>sum+frames,0),193);
 for(const [spriteId,frames] of domains)for(let frame=1;frame<=frames;frame++){
  const state=p035NativeTextState(145,{feedbackSpriteId:spriteId,feedbackFrame:frame,
   wrongTryCount:[80,95,126].includes(spriteId)?0:undefined});
  assert.deepEqual(state.feedback,{spriteId,frame});
  assert.equal(new Set(state.allTextInstances.map(row=>row.instanceId)).size,
   state.allTextInstances.length);
 }
});

test('companion keeps source English, separates prose, choices and diagram labels',()=>{
 const html=renderToStaticMarkup(<P035NativeCompanionDraft mainFrame={145} language="es"/>);
 assert.match(html,/lang="en"/);
 assert.match(html,/data-p035-language-policy="source-en-fallback"/);
 assert.match(html,/data-p035-canvas-source-glyphs="preserved"/);
 assert.match(html,/data-p035-section="source-quiz-choices"/);
 assert.equal((html.match(/data-source-button-instance-id=/g)??[]).length,4);
 assert.match(html,/B\. 51/);
 assert.match(html,/data-p035-section="source-diagram-label-inventory"/);
 assert.match(html,/<details[^>]*><summary>Source diagram labels<\/summary>/);
 assert(!html.includes('Sustituye')&&!html.includes('Respuesta correcta'));
 const clipped=renderToStaticMarkup(<P035NativeCompanionDraft mainFrame={50}/>);
 assert(!clipped.includes('Substitute 25 for x in the equation of the function to find the '));
});
