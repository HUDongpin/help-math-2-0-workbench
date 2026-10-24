import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import React,{act,createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {getCourseG04L03Vb009FrameState as frameState} from '../timelines/course-g04-l03-vb-009';
import {G4_L3_VB009_NATIVE_CONFIG as C} from './generated/g4-l3-vb009-native-config';
import {G4_L3_VB009_TEXT_PRESENTATION as P,getG4L3Vb009TextSnapshot,getVb009PatternTeachingState} from './g4-l3-vb009';
const root=process.env.VB009_SOURCE_ROOT??path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
const asset=JSON.parse(gunzipSync(fs.readFileSync(path.join(root,`catalog/typography-v1/source-catalog/assets/${C.sourceSwfSha256}.json.gz`))).toString());
const main=asset.timelines.find((t:any)=>t.timelineId==='sprite-24');
const request=(frame:number,extra:Partial<AnimationRendererProps>={}):AnimationRendererProps=>({frame,frameDomain:'sprite-24',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:23,replay:0,...extra});
const snap=(frame:number,extra:Partial<RuntimeContext>={})=>{const context=request(frame,extra);return getG4L3Vb009TextSnapshot(frameState(frame,context),context);};
const render=(frame:number,extra:Partial<AnimationRendererProps>={})=>renderToStaticMarkup(createElement(P.Renderer!,request(frame,extra)));
const rightEdges:Readonly<Record<number,readonly number[]>>={9:[238.90625,1738.953125,2147.3125,2508.15625,3204.0390625,3714.9296875,5527.0703125,6945.0703125,8710.0703125,9249.65625,10796.3125,11671.0390625],15:[1427.3125,3317.15625,3824.4453125,4182.15625,5105.5078125],19:[321.0703125,919.0703125,1517.0703125,2115.0703125,2713.0703125,3311.0703125,3909.0703125,4507.0703125,5006.578125],20:[238.90625,499.0390625,747.0390625,998.90625,1259.0390625,1507.0390625,1758.90625,2019.0390625,2267.0390625,2518.90625,2779.0390625,3027.0390625,3278.90625,3539.0390625,3787.0390625,4038.90625,4299.0390625,4547.0390625,4798.90625,5216.734375],23:[319.6875,879.75,1417.375,1940.375,2418.6875,2978.75,3516.375,4039.375,4517.6875,5077.75,5615.375,6093.6875,6653.75,7191.375,7714.375,8224.9140625]};
function stateAt(frame:number){const state=new Map<number,any>();for(const e of main.events){if(e.frame>frame)break;if(e.kind==='remove')state.delete(e.depth);else if(e.kind==='place')state.set(e.depth,{...(e.move?state.get(e.depth):{}),...e});}return state;}
// Exact font-ink right extrema above are independent fixed source facts. The
// assertion below uses actual cached mask updates at and before each threshold.
test('VB009 every complete token threshold agrees with actual source mask before/at',()=>{
 for(const body of C.bodies){const td=asset.textDefinitions.find((d:any)=>d.characterId===body.sourceCharacter),instance=main.instances.find((i:any)=>i.characterId===body.sourceCharacter),mask=main.events.find((e:any)=>e.clipDepth!==undefined&&e.depth<instance.depth&&instance.depth<=e.clipDepth),right=mask.characterId===7?2640:3360;
  assert.equal(rightEdges[body.sourceCharacter].length,body.tokens.length);
  body.tokens.forEach((token,index)=>{if(token.thresholdKind!=='complete-horizontal-ink')return;assert(token.frame!==null);
   for(const [frame,expected] of [[token.frame-1,false],[token.frame,true]]as const){const state=stateAt(frame),mp=state.get(mask.depth),tp=state.get(instance.depth),visible=Boolean(mp&&tp&&tp.matrix[4]+td.matrix[4]+rightEdges[body.sourceCharacter][index]<=mp.matrix[0]*right+mp.matrix[4]);assert.equal(visible,expected,`${body.id} token${index} frame${frame}`);}
   const before=snap(token.frame-1).blocks.find(b=>b.id===body.id)!,after=snap(token.frame).blocks.find(b=>b.id===body.id)!;
   assert.equal(before.text,body.tokens.filter(t=>t.frame!==null&&t.frame<token.frame!).map(t=>t.text).join(''));
   assert.equal(after.text,body.tokens.filter(t=>t.frame!==null&&t.frame<=token.frame!).map(t=>t.text).join(''));
  });
 }
});
test('VB009 all seven definitions and 44 runs bind, with source punctuation/irregular sequence unchanged',()=>{
 validateLessonTextBinding(P.binding);const ids=asset.textDefinitions.flatMap((d:any)=>d.runs.map((r:any)=>r.sourceTextId));assert.equal(ids.length,44);assert.deepEqual([...new Set(P.binding.blocks.flatMap(b=>b.sourceTextIds))].sort(),ids.sort());
 assert.equal(P.binding.blocks.length,6);assert.deepEqual(P.binding.blocks.map(b=>b.readingOrder),[0,1,2,3,4,5]);
 for(const body of C.bodies){const td=asset.textDefinitions.find((d:any)=>d.characterId===body.sourceCharacter);assert.equal(body.text,td.runs.map((r:any)=>r.text).join(''));assert.equal(body.tokens.map(t=>t.text).join(''),body.text);}
 assert.equal(C.bodies[4].text,'♥ ● ■ ■ ♥ ● ■ ■ ♥ ● ■ ♥ ● ■ ■ … ');
 assert.equal(snap(118).blocks.find(b=>b.id==='example-numbers')!.text,'5,10,15,20,25,30,35,40,45');assert.equal(snap(132).blocks.find(b=>b.id==='example-letters')!.text,'ABBABBABBABBABBABBA…');
});
test('VB009 clipped final circle and never-intersecting suffix have distinct truthful dispositions',()=>{
 const tokens=C.bodies[4].tokens;assert.deepEqual(tokens.slice(12).map(t=>[t.core,t.frame,t.thresholdKind]),[['●',146,'partial-only-horizontal-ink'],['■',null,'never-intersects-horizontal-mask'],['■',null,'never-intersects-horizontal-mask'],['…',null,'never-intersects-horizontal-mask']]);
 const mask=stateAt(146).get(25),placed=stateAt(146).get(26);assert.equal(mask.matrix[4]+3360*mask.matrix[0],3833);assert.equal(placed.matrix[4]-1904+rightEdges[23][12],3847.75);
 assert.equal(snap(145).blocks.find(b=>b.id==='example-pictures')!.text,'♥ ● ■ ■ ♥ ● ■ ■ ♥ ● ■ ♥ ');assert.equal(snap(146).blocks.find(b=>b.id==='example-pictures')!.text,'♥ ● ■ ■ ♥ ● ■ ■ ♥ ● ■ ♥ ● ');assert.equal(snap(175).blocks.find(b=>b.id==='example-pictures')!.text,snap(146).blocks.find(b=>b.id==='example-pictures')!.text);
 assert.match(render(175),/data-source-threshold-kind="partial-only-horizontal-ink"/);assert.doesNotMatch(render(175).match(/<p[^>]*data-lesson-text-block="example-pictures"[^>]*>([\s\S]*?)<\/p>/)![1],/data-source-token-index="13"|data-source-token-index="14"|data-source-token-index="15"/);
});
test('VB009 source panel alpha and pure Replay preserve the host frame clock',()=>{
 assert.deepEqual([98,99,100,101,102,103,104].map(f=>getVb009PatternTeachingState(f).panelAlpha),[0,43/256,85/256,.5,171/256,213/256,1]);
 assert.deepEqual(getVb009PatternTeachingState(1),getVb009PatternTeachingState(1));assert.deepEqual(snap(1,{replay:9,seed:999}).blocks,snap(1).blocks);assert.equal(snap(1).blocks.filter(b=>b.visible).length,1);assert.equal(P.reducedMotionFrameByDomain!['sprite-24'],175);assert.equal(P.playbackMode,'once');assert.equal(P.activityTimelines,undefined);assert.equal(P.frameControl,undefined);
});
test('VB009 unsupported source/state/capture paths expose no native controls; ES UI uses verified EN fallback',()=>{
 for(const extra of [{lang:'es' as const},{frameDomain:'root'},{scenario:'source-companion-static-frame'},{rootFrame:1},{entryStateSha256:'capture'}]){assert.equal(snap(175,extra).status,'blocked');assert.equal(render(175,extra),'');}
 const state=frameState(175,request(175));for(const changed of [{...state,sourceSwfSha256:'0'.repeat(64)},{...state,seed:24},{...state,frame:174}])assert.equal(getG4L3Vb009TextSnapshot(changed,request(175)).status,'blocked');
 assert.match(render(175,{uiLanguage:'es'}),/lang="en"/);assert.doesNotMatch(render(175,{uiLanguage:'es'}),/<canvas|<svg|foreignObject/);
});
test('VB009 glossary visibility follows complete native word and actual source button lifetime',()=>{
 const expected=[[11,14],[13,23],[12,54],[16,96]]as const;
 for(const [button,frame]of expected){assert(!render(frame-1,{onLessonHostRequest:()=>{}}).includes(`data-source-button="${button}"`));assert(render(frame,{onLessonHostRequest:()=>{}}).includes(`data-source-button="${button}"`));}
 const disabled=render(175);for(const tag of disabled.match(/<button\b[^>]*>/g)??[])assert.match(tag,/disabled=""/);
 const index=JSON.parse(fs.readFileSync(path.join(root,'apps/web/public/generated/g4-grade-wide-keyterms-en.json'),'utf8'));for(const term of C.terms)assert.equal(index.entries.find((e:any)=>e.id===term.entryId).screenKeyTerm,term.keyAttribute);
});
test('VB009 actual paused term clicks stop source through exact host request and restore focus eligibility',async()=>{
 const {JSDOM}=createRequire(path.join(root,'package.json'))('jsdom'),dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),w=dom.window;Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});const {createRoot}=await import('react-dom/client'),mount=createRoot(document.getElementById('root')!);const calls:any[]=[];
 try{await act(async()=>mount.render(createElement(P.Renderer!,request(175,{paused:true,onLessonHostRequest:(...c)=>{calls.push(c);}}))));const buttons=[...document.querySelectorAll<HTMLButtonElement>('button[data-source-keyterm]')];assert.equal(buttons.length,4);
  for(const button of buttons){assert.equal(button.disabled,false);button.focus();assert.equal(document.activeElement,button);await act(async()=>button.click());}
  assert.equal(calls.length,4);for(const [i,button]of buttons.entries()){const term=C.terms.find(t=>t.keyAttribute===button.dataset.sourceKeyterm)!;assert.deepEqual(calls[i][0],{type:'open-keyterm',entryId:term.entryId,sourceAnimationId:C.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});assert.equal(calls[i][1].trigger,button);assert.equal(calls[i][1].keyTermIndexLanguage,'en');}
  await act(async()=>mount.render(createElement(P.Renderer!,request(1,{replay:1,onLessonHostRequest:()=>{throw Error('Replay cannot dispatch');}}))));assert.equal(document.querySelectorAll('button').length,0);assert.equal(document.querySelectorAll('.vb009-pattern__sequence').length,0);
 }finally{await act(async()=>mount.unmount());dom.window.close();}
});
test('VB009 sequence keyboard respects child targets/modifiers and only Replay resets manual scroll',async()=>{
 const {JSDOM}=createRequire(path.join(root,'package.json'))('jsdom'),dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),w=dom.window;Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});const {createRoot}=await import('react-dom/client'),mount=createRoot(document.getElementById('root')!);
 try{await act(async()=>mount.render(createElement(P.Renderer!,request(175))));const port=document.querySelector<HTMLElement>('.vb009-pattern__sequence')!;Object.defineProperties(port,{scrollWidth:{value:900},clientWidth:{value:300}});
  const key=(target:HTMLElement,name:string,extra:Record<string,unknown>={})=>target.dispatchEvent(new w.KeyboardEvent('keydown',{key:name,bubbles:true,cancelable:true,...extra}));key(port,'End');assert.equal(port.scrollLeft,600);key(port,'ArrowLeft');assert.equal(port.scrollLeft,540);key(port,'Home',{ctrlKey:true});assert.equal(port.scrollLeft,540);key(port.firstElementChild as HTMLElement,'Home');assert.equal(port.scrollLeft,540);
  await act(async()=>mount.render(createElement(P.Renderer!,request(174))));assert.equal(port.scrollLeft,540);await act(async()=>mount.render(createElement(P.Renderer!,request(175,{replay:1}))));assert.equal(port.scrollLeft,0);
 }finally{await act(async()=>mount.unmount());dom.window.close();}
});
test('VB009 original main cue and explicit Spanish host policy are retained, with no injected teaching timer',()=>{
 assert.deepEqual(P.sourceTimelineAudioCues!.map(c=>[c.id,c.source,c.sha256,c.frame,c.endFrame,c.frameDomain,c.language,c.manualNarration]),[['course-g04-l03-vb-009-embedded-stream-0001','/flash-assets/courses/course-g04-l03-vb-009/audio/embedded-stream-0001.mp3','b78159a3003a0a2e4b56fa1298bebc08d1ebf7084d4c1c91b9ef622620ad389e',7,176,'sprite-24','en',false]]);
 const old=fs.readFileSync(path.join(root,'packages/demos/src/g4-l3-main-timeline-audio.generated.ts'),'utf8'),part=old.slice(old.indexOf("'course-g04-l03-vb-009':"));assert.match(part,/activation: 'user'/);assert.match(part,/timelineBehavior: 'pause-while-playing'/);assert.match(part,/e2896cb3b7b1816b1f48f5df451d3663736344b052ca8d096db96e2c692cb094/);
});

test('VB009 source alpha/reveal targets explicitly remove the independent global CSS transition clock',()=>{
 const html=render(99),css=html.match(/<style>([\s\S]*?)<\/style>/)![1],postcss=createRequire(path.join(root,'package.json'))('postcss'),parsed=postcss.parse(css);let found=false;
 parsed.walkRules((rule:any)=>{if(rule.selector!=='.vb009-pattern__examples,.vb009-pattern [data-lesson-text-block]:not([data-lesson-text-block="root-title"])')return;const transition=rule.nodes.find((node:any)=>node.type==='decl'&&node.prop==='transition');assert.equal(transition.value,'none');assert.equal(transition.important,true);found=true;});
 assert(found);assert.match(html,/<div class="vb009-pattern__examples" data-source-panel-character="17" style="opacity:0.16796875"/);assert.doesNotMatch(css,/^\s*\*\s*\{/m);
});
