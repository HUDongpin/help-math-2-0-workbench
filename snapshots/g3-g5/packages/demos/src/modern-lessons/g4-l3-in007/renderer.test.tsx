import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {In007Renderer,deliverKeyword,requestIn007KeyTerm,IN007_PRESENTATION} from './index';
import {snapshot,BINDING,KEY_TERMS,ID,DOMAIN} from './binding';
import {getCourseG04L03In007FrameState as getState} from '../../modules/course-g04-l03-in-007';
import {validateLessonTextBinding} from '../../lesson-text-snapshot';
import {validateLessonTextKeyTerms} from '../../lesson-text-keyterms';
const context=(frame:number)=>({frame,frameDomain:DOMAIN,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0,replay:0});
const view=(frame:number)=>snapshot(getState(frame,context(frame)),context(frame));
const html=(frame:number,extra={})=>renderToStaticMarkup(<In007Renderer {...context(frame)} {...extra}/>);
validateLessonTextKeyTerms(KEY_TERMS);validateLessonTextBinding(BINDING);
assert.equal(IN007_PRESENTATION.sourceTimelineAudioCues?.length,1);
assert.equal(IN007_PRESENTATION.playbackEndFrameByDomain?.[DOMAIN],555);
assert.equal(IN007_PRESENTATION.reducedMotionFrameByDomain?.[DOMAIN],555);
assert.equal(IN007_PRESENTATION.completion,undefined);
assert.equal(IN007_PRESENTATION.frameControl,undefined);
assert.equal(IN007_PRESENTATION.activityTimelines,undefined);
for(let f=1;f<=555;f++){const s=view(f);assert.equal(s.status,'ready');for(const b of s.blocks)if(b.visible&&/^tick--/.test(b.id))assert(b.text.startsWith('−'));}
for(const f of[252,253,256])assert(!html(f).includes('data-number-label='));
for(const f of[257,285,395,403,406,451,462,506,517,555]){const h=html(f);assert.equal((h.match(/data-number-label=/g)||[]).length,25);assert(!h.includes('<text'));assert(h.includes('font-size:max(18px,1.125rem)'));assert(h.includes('--lesson-font-body'));}
const filled=(frame:number)=>view(frame).blocks.filter(b=>b.id.startsWith('fill-')&&b.visible).map(b=>b.text);
assert.deepEqual(filled(405),[]);assert.deepEqual(filled(406),['−3']);assert.deepEqual(filled(462),['−3','−6']);assert.deepEqual(filled(517),['−3','−6','−9']);
assert(html(395).includes('data-emphasized="true"'));assert(!html(396).includes('data-emphasized="true"'));
for(const[key,frame]of[['Pattern',23],['Set',29],['Symbol',57],['Rule',98]] as const){let got:any=null;const trigger={} as HTMLElement;const runtime={...context(frame),onLessonHostRequest:(request:any,options:any)=>{got={request,options};}};assert.equal(deliverKeyword(runtime,frame-1,key,trigger),false);assert.equal(got,null);assert.equal(deliverKeyword(runtime,frame,key,trigger),true);assert.equal((got as any).options.trigger,trigger);assert.equal((got as any).options.keyTermIndexLanguage,'en');assert.equal((got as any).request.sourceAnimationId,ID);assert.equal((got as any).request.playbackDisposition,'source-stop-timeline-and-audio-until-explicit-resume');assert.equal(deliverKeyword({...runtime,entryStateSha256:'a'.repeat(64)},frame,key,trigger),false);}
assert.equal((html(98,{onLessonHostRequest:()=>{}}).match(/data-keyterm-entry-id=/g)||[]).length,4);
assert.equal((html(98,{entryStateSha256:'a'.repeat(64),onLessonHostRequest:()=>{}}).match(/data-keyterm-entry-id=/g)||[]).length,0);
assert.equal(html(98,{uiLanguage:'es',onLessonHostRequest:()=>{}}),html(98,{uiLanguage:'en',onLessonHostRequest:()=>{}}));
for(const change of[{frameDomain:'root'},{rootFrame:1},{lang:'es'},{seed:-1},{frame:556},{replay:-1},{scenario:'other'}])assert.equal(snapshot(getState(98,context(98)),{...context(98),...change} as any).status,'blocked');
const cat=JSON.parse(gunzipSync(await readFile(new URL('../../../../../scripts/inputs/typography-v1/g4-l3-in007/source-catalog.json.gz',import.meta.url))).toString());const textIds=new Set(cat.textDefinitions.flatMap((d:any)=>d.runs.map((r:any)=>r.sourceTextId))),shapes=new Set(cat.shapeDefinitions.map((s:any)=>s.characterId));
for(const block of BINDING.blocks){for(const id of block.sourceTextIds)assert(textIds.has(id),id);for(const id of block.sourceShapeIds??[])assert(shapes.has(id),String(id));}
const implementation=await readFile(new URL('./renderer.tsx',import.meta.url),'utf8');assert(!/setInterval|setTimeout|requestAnimationFrame|<canvas|<img/.test(implementation));
console.log('PASS555snapshots,sourcebindings,25signedHTMLlabels,alpha-boundaries,4host-trigger-requests,ENfallback,noadditionalclock');

// Current staged capability, not a separately reconstructed test object.
assert.equal(IN007_PRESENTATION.Renderer,In007Renderer);
assert.equal(IN007_PRESENTATION.getSnapshot,snapshot);
for(let frame=1;frame<=555;frame++){
 const ctx=context(frame),state=getState(frame,ctx),snap=IN007_PRESENTATION.getSnapshot(state,ctx);
 const markup=renderToStaticMarkup(React.createElement(IN007_PRESENTATION.Renderer!,{...ctx,state}));
 assert.equal(snap.status,'ready');assert(markup.includes('lang="en"'));
 assert(markup.indexOf('data-lesson-text-block="title"')<markup.indexOf('<div class="in007-modern__prose"'));
 assert(markup.includes('font-size:max(22px,1.35rem)'));
 if(frame>=110){assert.equal((markup.match(/class="in007-modern__slot"/g)||[]).length,3);assert.equal((markup.match(/<span aria-hidden="true">,<\/span><\/span>/g)||[]).length,2);}
 for(const b of snap.blocks.filter(b=>b.id.startsWith('fill-')&&!b.visible))assert(!markup.includes('data-lesson-text-block="'+b.id+'" data-emphasized="false" data-filled="true"'));
}
const ready=context(98),source=getState(98,ready),trigger={} as HTMLElement;let calls=0;
const base={...ready,onLessonHostRequest:()=>{calls++;}};
for(const change of[{lang:'es'},{frameDomain:'root'},{rootFrame:1},{scenario:'other'},{seed:-1},{replay:-1},{frame:556},{state:{...source,status:'blocked'}},{state:{...source,blocker:'blocked'}},{state:{...source,sourceSwfSha256:'0'.repeat(64)}},{state:{...source,frame:97}}]){
 assert.equal(deliverKeyword({...base,...change} as any,98,'Rule',trigger),false);assert.equal(calls,0);
 assert.equal(requestIn007KeyTerm({...base,...change} as any,15,trigger,true),null);assert.equal(calls,0);
 assert(!renderToStaticMarkup(<In007Renderer {...base} {...change as any}/>).includes('data-keyterm-entry-id'));
}
assert.equal(deliverKeyword(base,98,'Rule',trigger),true);assert.equal(calls,1);
assert.equal(deliverKeyword({...base,entryStateSha256:'a'.repeat(64)},98,'Rule',trigger),false);assert.equal(calls,1);
assert.equal(requestIn007KeyTerm({...base,frame:97},15,trigger,true),null);assert.equal(calls,1);
assert.equal(requestIn007KeyTerm(base,15,trigger,false),null);assert.equal(calls,1);
console.log('PASS actual staged capability555SSR,ready-only keyword requests,22px internal-region heading; no browser claim');
