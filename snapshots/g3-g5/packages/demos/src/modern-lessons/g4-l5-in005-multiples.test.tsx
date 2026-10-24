import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {NativeMultiples,getTeachingState,getMultiplesTextSnapshot,type Config} from './g4-l5-multiples';
import {G4_L5_IN005_MULTIPLES_CONFIG as c} from './generated/g4-l5-in005-multiples-config';
import {G4_L5_IN005_TEXT_PRESENTATION as presentation} from './g4-l5-in005';
import sourceModule,{getCourseG04L05In005FrameState as getFrameState} from '../modules/course-g04-l05-in-005';
import type {RuntimeContext} from '../contract';
const recipe=JSON.parse(readFileSync(new URL('../../../../scripts/inputs/typography-v1/g4-l5-in005/pages.json',import.meta.url),'utf8'));
const page=recipe.pages[0],asset=JSON.parse(gunzipSync(readFileSync(page.asset.path)).toString()),timeline=asset.timelines.find((t:any)=>t.timelineId===c.frameDomain);
const html=(frame:number,replay=0)=>renderToStaticMarkup(<NativeMultiples config={c} frame={frame} replay={replay}/>);
const dom=(frame:number,replay=0)=>new JSDOM(html(frame,replay)).window.document;
function independentStates(){const current=new Map<number,any>(),states:Map<number,any>[]=[];for(let f=1;f<=539;f++){for(const e of timeline.events.filter((e:any)=>e.frame===f)){if(e.kind==='remove')current.delete(e.depth);else if(e.kind==='place'){const prior=e.move?(current.get(e.depth)??{}):{};current.set(e.depth,{...prior,...Object.fromEntries(Object.entries(e).filter(([k,v])=>!['matrix','colorTransform','characterId','ratio','clipDepth'].includes(k)||v!==null&&v!==undefined))});}}states.push(new Map([...current].map(([d,e])=>[d,{...e}])));}return states;}

test('IN005 retains its 17 text definitions, 9 shape roles and source two-column 11-equation ordering',()=>{
 assert.equal(asset.textDefinitions.length,17);assert.equal(asset.shapeDefinitions.length,9);assert.equal(asset.bitmapDefinitions.length,0);assert.deepEqual(c.textDispositions.map(d=>d.character),asset.textDefinitions.map((d:any)=>d.characterId).sort((a:number,b:number)=>a-b));assert.deepEqual(Object.values(page.shapeRoles).flat().sort((a:any,b:any)=>a-b),asset.shapeDefinitions.map((d:any)=>d.characterId).sort((a:number,b:number)=>a-b));assert.equal(c.tokens.length,114);assert.equal(new Set(c.tokens.map(t=>t.id)).size,114);
 const d=dom(539),groups=[...d.querySelectorAll('[data-lesson-text-block]')];assert.deepEqual(groups.map(e=>e.getAttribute('data-lesson-text-block')),c.binding.blocks.map(b=>b.id));assert.equal(groups.length,16);assert.equal(d.querySelectorAll('canvas,svg text').length,0);assert.deepEqual([...d.querySelectorAll('[data-multiples-source-column]')].map(e=>[...e.querySelectorAll('[data-lesson-text-block]')].map(b=>b.textContent)),[Array.from({length:6},(_,i)=>`2 × ${i+1} = ${2*(i+1)}`),Array.from({length:5},(_,i)=>`2 × ${i+7} = ${2*(i+7)}`)]);
 assert.equal(d.querySelector('[data-lesson-text-block="definition"]')!.textContent,'A multiple is the product of a whole number and an integer.');assert.equal(d.querySelector('[data-lesson-text-block="instruction"]')!.textContent,'Find the multiples of a number by multiplying that number times each of the');assert.equal(d.querySelector('[data-lesson-text-block="counting"]')!.textContent,'counting numbers: 1, 2, 3, 4, and so on.');assert.equal(d.querySelector('[data-lesson-text-block="list-2"]')!.textContent,'Multiples of 2: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, …');
 assert(d.querySelector('[role="region"][tabindex="0"][aria-label="Multiplication equations for 2"]'));assert.equal(c.languagePolicy.es,'source-English-fallback-no-translation');
});

test('all 539 states preserve own source instance alpha and 18 result-digit RGB pulses',()=>{
 const states=independentStates();let colors=0,alphas=0;const maskDepths=new Set([3,15,23]);
 for(let frame=1;frame<=539;frame++)for(const token of getTeachingState(c,frame).tokens){if(maskDepths.has(token.depth))continue;const e=states[frame-1].get(token.depth);let alpha=0;const def=asset.textDefinitions.find((d:any)=>d.characterId===token.character),base=def.runs[0].colorRgba;let rgb=base.slice(0,3);if(e?.characterId===token.character){const ct=e.colorTransform;alpha=ct?Math.max(0,Math.min(255,base[3]*ct.multiply[3]/ct.divisor+ct.add[3]))/255:base[3]/255;if(ct)rgb=base.slice(0,3).map((n:number,i:number)=>Math.round(Math.max(0,Math.min(255,n*ct.multiply[i]/ct.divisor+ct.add[i]))*1e7)/1e7);}assert(Math.abs(token.alpha-alpha)<1e-7,`${frame}:${token.id}:alpha`);alphas++;if(token.sourceRgbTransform){assert.deepEqual(token.rgb,rgb,`${frame}:${token.id}:rgb`);colors++;}}
 assert.equal(colors,539*18);assert(alphas>40000);const at329=getTeachingState(c,329).tokens.find(t=>t.depth===76)!;assert.deepEqual(at329.rgb,[255,0,0]);const at334=getTeachingState(c,334).tokens.find(t=>t.depth===76)!;assert.deepEqual(at334.rgb,[204,0,0]);assert.deepEqual(getTeachingState(c,338).tokens.find(t=>t.depth===76)!.rgb,[0,0,0]);
 const d=dom(329),token=d.querySelector('[data-source-depth="76"]')as HTMLElement;assert.equal(token.style.color,'rgb(255, 0, 0)');assert.equal((token.firstElementChild as HTMLElement).style.color,'inherit');assert.equal(d.querySelectorAll('[data-source-token] > span[style="color:inherit"]').length,18);
});

test('word-mask release boundaries, list fade and glossary availability retain authored teaching sequence',()=>{
 const by=(frame:number,text:string,depth:number)=>getTeachingState(c,frame).tokens.find(t=>t.text.trim()===text&&t.depth===depth)!;
 for(const [text,depth,first]of [['A',3,7],['multiple',3,12],['integer.',3,54],['Find',15,144],['multiplying',15,178],['the',15,147],['counting',23,207],['numbers:',23,214],['1,',23,222],['2,',23,241],['on.',23,267]]as const){assert.equal(by(first-1,text,depth).alpha,0);assert.equal(by(first,text,depth).alpha,1);}
 assert.equal(by(309,'Multiples',27).alpha,0);assert.equal(by(310,'Multiples',27).alpha,.125);assert.equal(by(317,'Multiples',27).alpha,1);
 assert.equal((dom(11).querySelector('[data-source-keyterm="Multiple"]')as HTMLButtonElement).disabled,true);assert.equal(c.terms.length,7);assert.equal(c.terms.find(t=>t.key==='Multiplication')!.text,'multiplying');assert.equal(c.terms.find(t=>t.key==='Whole numbers')!.dictionaryBinding.englishTitle,'Whole numbers');
});

test('seven source glossary controls send exact source-stop requests and fresh Replay removes their interaction',async()=>{
 const window=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}).window,oldWindow=globalThis.window,oldDocument=globalThis.document;Object.assign(globalThis,{window,document:window.document,IS_REACT_ACT_ENVIRONMENT:true});const {createRoot}=await import('react-dom/client'),{act}=await import('react');const root=createRoot(document.getElementById('root')!),requests:any[]=[];
 try{await act(async()=>root.render(<NativeMultiples config={c} frame={539} onLessonHostRequest={r=>{requests.push(r);}}/>));for(const t of c.terms){const button=document.querySelector(`[data-source-button="${t.button}"]`)as HTMLButtonElement;assert(button&&!button.disabled);await act(async()=>button.click());assert.deepEqual(requests.at(-1),{type:'open-keyterm',entryId:t.entryId,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});}assert.equal(requests.length,7);await act(async()=>root.render(<NativeMultiples config={c} frame={1} replay={3} onLessonHostRequest={r=>{requests.push(r);}}/>));assert([...document.querySelectorAll('button')].every(b=>(b as HTMLButtonElement).disabled));}
 finally{await act(async()=>root.unmount());Object.assign(globalThis,{window:oldWindow,document:oldDocument});window.close();}
});

test('all 539 native frames render and snapshot deterministically with actual fallback guards and explicit once UX',()=>{
 const context:RuntimeContext={frame:539,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en',seed:17,replay:2};const state=getFrameState(539,context);assert.equal(presentation.getSnapshot!(state,context).status,'ready');assert.equal(c.sourceTerminalStop,false);assert.equal(c.playbackDisposition.originalRuntimeEquivalence,false);assert.equal(presentation.playbackMode,'once');assert.equal(presentation.playbackEndFrameByDomain?.[c.frameDomain],539);assert.equal(presentation.reducedMotionFrameByDomain?.[c.frameDomain],539);
 for(let frame=1;frame<=539;frame++){const h=html(frame);assert(!h.includes('NaN'));assert(!h.includes('<canvas'));assert(h.includes(`data-lesson-frame="${frame}"`));const ctx={...context,frame},s=getFrameState(frame,ctx),snapshot=presentation.getSnapshot!(s,ctx);assert.equal(snapshot.status,'ready');assert.equal(snapshot.blocks.length,16);const native=getTeachingState(c,frame);for(const b of snapshot.blocks){if(b.id==='title')assert.equal(b.text,c.title);else{const group=c.groups.find(g=>g.id===b.id)!;assert.equal(b.visible,group.tokens.some(id=>native.tokens.find(t=>t.id===id)!.alpha>0));}}}
 for(const delta of [{frame:0},{frame:1.5},{frame:540},{lang:'es'as const},{seed:18},{rootFrame:5},{frameDomain:'root'},{scenario:'other'},{entryStateSha256:'0'.repeat(64)}]){const result=getMultiplesTextSnapshot(c,state,{...context,...delta});assert.equal(result.status,'blocked');assert.deepEqual(result.blocks,[]);}
 assert.equal(dom(1).querySelector('section')!.textContent,dom(1,9).querySelector('section')!.textContent);assert.equal(dom(1,9).querySelector('section')!.getAttribute('data-lesson-replay'),'9');assert.equal(getTeachingState(c,NaN).frame,1);assert.equal(getTeachingState(c,999).frame,539);
 assert(presentation.Renderer);const NativeRenderer=presentation.Renderer;const native=renderToStaticMarkup(<NativeRenderer {...context} paused={true}/>);assert(native.includes('g4l5-multiples'));const fallback=renderToStaticMarkup(<NativeRenderer {...context} lang="es" paused={true}/>);assert(!fallback.includes('g4l5-multiples'));
});

test('own continuous English stream and user-started Spanish track retain exact cue/source and pause behavior',()=>{
 assert.equal(presentation.sourceTimelineAudioCues?.length,1);const cue=presentation.sourceTimelineAudioCues![0];assert.equal(cue.frame,1);assert.equal(cue.endFrame,540);assert.equal(cue.frameDomain,'sprite-37');assert.equal(cue.scenario,'source-static-frame');assert.equal(sourceModule.audioTracks?.length,1);const spanish=sourceModule.audioTracks![0];assert.equal(spanish.language,'es');assert.equal(spanish.activation,'user');assert.equal(spanish.timelineBehavior,'pause-while-playing');assert.deepEqual(spanish.frameDomains,['sprite-37']);assert.deepEqual(spanish.visibleWhen,['es']);assert.equal(spanish.source,'/lesson-typography-v1/audio/course-g04-l05-in-005/spanish-host-narration.mp3');
});
