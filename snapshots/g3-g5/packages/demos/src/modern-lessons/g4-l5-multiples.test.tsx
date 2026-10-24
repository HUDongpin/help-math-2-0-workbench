import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {NativeMultiples,getTeachingState,curveAt,type Config} from './g4-l5-multiples';
import {getMultiplesTextSnapshot} from './g4-l5-multiples';
import {G4_L5_MULTIPLES_CONFIGS} from './generated/g4-l5-multiples-config';
import {loadAnimationModuleForPresentation} from '../animation-registry';
import type {RuntimeContext} from '../contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
const configs=G4_L5_MULTIPLES_CONFIGS as readonly Config[];
const recipe=JSON.parse(readFileSync(new URL('../../../../scripts/inputs/typography-v1/g4-l5-multiples/pages.json',import.meta.url),'utf8'));
const dictionary=JSON.parse(readFileSync(recipe.dictionary.path,'utf8'));
const [multiples,chart]=configs;
const dom=(c:Config,f:number,replay=0)=>new JSDOM(renderToStaticMarkup(<NativeMultiples config={c} frame={f} replay={replay}/>)).window.document;
const block=(d:Document,id:string)=>d.querySelector(`[data-lesson-text-block="${id}"]`)!;
type Event=Record<string,any>;
function independentSourceStates(c:Config):Map<number,Event>[] {
 const page=recipe.pages.find((p:any)=>p.animationId===c.animationId),asset=JSON.parse(gunzipSync(readFileSync(page.asset.path)).toString()),timeline=asset.timelines.find((t:any)=>t.timelineId===c.frameDomain),state=new Map<number,Event>(),out:Map<number,Event>[]=[];
 for(let frame=1;frame<=c.frameCount;frame++){
  for(const e of timeline.events.filter((e:Event)=>e.frame===frame)){
   if(e.kind==='remove')state.delete(e.depth);
   else if(e.kind==='place'){const prior=e.move?(state.get(e.depth)??{}):{};state.set(e.depth,{...prior,...Object.fromEntries(Object.entries(e).filter(([k,v])=>!['matrix','colorTransform','characterId','ratio','clipDepth'].includes(k)||v!==null&&v!==undefined))});}
  }
  out.push(new Map([...state].map(([depth,e])=>[depth,{...e}])));
 }
 return out;
}
test('twelve source equations retain independent repeated numeral instances and mathematical read order',()=>{
 const d=dom(multiples,277);assert.equal(d.querySelectorAll('[data-multiples-panel]').length,2);
 for(const n of [4,5])for(let i=1;i<=6;i++){assert.equal(block(d,`equation-${n}-${i}`).textContent,`${n} × ${i} = ${n*i}`);assert.equal(block(d,`equation-${n}-${i}`).querySelectorAll('[data-source-token]').length,5);}
 assert.equal(multiples.tokens.find(t=>t.text==='integer.')!.colorPieces.at(-1)!.text,'.');assert.deepEqual(multiples.tokens.find(t=>t.text==='integer.')!.colorPieces.at(-1)!.rgb,[0,0,0]);assert.equal(block(d,'list-4').textContent,'4, 8, 12, 16, 20, 24, ...');assert.equal(block(d,'list-5').textContent,'5, 10, 15, 20, 25, 30, ...');assert.equal(block(d,'definition').textContent,'A multiple is the product of a whole number and an integer.');
 const four=multiples.tokens.filter(t=>t.character===14);assert.equal(four.length,9);assert.equal(new Set(four.map(t=>t.instance)).size,9);assert.equal(new Set(multiples.tokens.map(t=>t.id)).size,multiples.tokens.length);
});
test('all 541 own-source frames preserve non-mask instance lifetimes and exact authored alpha',()=>{
 let comparisons=0;
 for(const c of configs){const states=independentSourceStates(c),maskedDepths=c===multiples?new Set([3,...Array.from({length:13},(_,i)=>44+i),108]):new Set([...Array.from({length:56},(_,i)=>5+i),171]);
  for(let frame=1;frame<=c.frameCount;frame++)for(const token of getTeachingState(c,frame).tokens){if(maskedDepths.has(token.depth))continue;const e=states[frame-1].get(token.depth);let alpha=0;if(e?.characterId===token.character){const ct=e.colorTransform;alpha=ct?Math.max(0,Math.min(255,255*ct.multiply[3]/ct.divisor+ct.add[3]))/255:1;}assert(Math.abs(token.alpha-alpha)<1e-7,`${c.animationId}:${frame}:${token.id}`);comparisons++;}
 }
 assert(comparisons>50000);
});
test('source outline emphasis begins at frame235; all 55 alias tokens map to distinct underlying tokens',()=>{
 assert.equal(multiples.aliases.length,4);assert.equal(multiples.aliases.reduce((n,a)=>n+a.pairs.length,0),55);for(const alias of multiples.aliases){assert.equal(new Set(alias.pairs.map(p=>p.sourceAliasToken)).size,alias.pairs.length);for(const pair of alias.pairs)assert.equal(multiples.tokens.find(t=>t.id===pair.nativeToken)!.text,multiples.tokens.find(t=>t.id===pair.sourceAliasToken)!.text);}
 assert.equal(dom(multiples,234).querySelectorAll('.g4l5-multiples__emphasis').length,0);const d=dom(multiples,235);assert.equal(d.querySelectorAll('.g4l5-multiples__emphasis').length,4);assert.equal(d.querySelectorAll('[data-source-alias-instances]').length,4);assert.equal(d.querySelectorAll('[data-source-token*="depth-131/"]').length,0);
 for(const h of multiples.highlights){assert.equal(curveAt(h.alpha,234),0);assert.equal(curveAt(h.alpha,235),1);}
});
test('hundreds chart has ten fixed rows and ten fixed columns, all own source numerals, and source cell ownership',()=>{
 const d=dom(chart,264),rows=[...d.querySelectorAll('tr')];assert.equal(rows.length,10);for(const [row,tr]of rows.entries()){assert.equal(tr.children.length,10);for(const [column,td]of [...tr.children].entries()){const n=row*10+column+1;assert.equal(td.textContent,String(n));assert.equal(td.getAttribute('data-chart-number'),String(n));assert.equal(td.getAttribute('data-chart-row'),String(row+1));assert.equal(td.getAttribute('data-chart-column'),String(column+1));}}
 assert.equal(block(d,'definition').textContent,'A hundreds chart is a 10-by-10 array with the numbers 1 through 100.');assert.equal(block(d,'caption').textContent,'Multiples of 3');assert.equal(d.querySelectorAll('svg text,canvas').length,0);assert.equal(d.querySelectorAll('[data-highlighted=true]').length,33);
 assert(d.querySelector('.g4l5-multiples__scroll[tabindex="0"]'));assert.equal(d.querySelector('svg')!.getAttribute('preserveAspectRatio'),'none');
});
test('all 264 source display-list states agree with each of 33 cumulative geometric highlighters',()=>{
 const states=independentSourceStates(chart);assert.equal(chart.highlights.length,33);
 for(let f=1;f<=264;f++){const sourceIds=[...states[f-1].values()].map(e=>e.characterId).filter(cid=>cid>=144&&cid<=176),active=getTeachingState(chart,f).highlights.filter(h=>h.alpha>0);assert.deepEqual(active.map(h=>h.character),sourceIds);for(const h of active){assert.deepEqual(h.cells,Array.from({length:h.character-143},(_,i)=>(i+1)*3));assert(h.paths?.length);}}
 const source156=chart.highlights.find(h=>h.character===156)!;assert.equal(source156.paths!.filter(p=>p.stroke!=='none').length,2);assert.equal(dom(chart,201).querySelectorAll('[data-source-shape="156"] path').length,3);assert.equal(getTeachingState(chart,176).highlights.filter(h=>h.alpha>0).length,0);assert.deepEqual(getTeachingState(chart,177).highlights.find(h=>h.alpha>0)!.cells,[3]);
});
test('source glossary keys preserve spaces and bind whole numbers to its exact English dictionary title',()=>{
 const term=multiples.terms.find(t=>t.key==='Whole numbers')!;const entry=dictionary.entries.find((e:any)=>e.id===term.entryId);assert.equal(entry.titles.en,'Whole numbers');assert.equal(entry.screenKeyTerm,'Whole Numbers');assert.deepEqual(multiples.terms.map(t=>t.key),['Multiple','Whole numbers','Product','Integers']);assert.deepEqual(chart.terms.map(t=>t.key),['Hundreds chart','Array','Number','Multiple']);assert.equal(chart.terms.find(t=>t.key==='Multiple')!.instances.length,2);
});
test('all eight glossary controls issue the actual source-stop host request and Replay disables unrevealed terms',async()=>{
 const window=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}).window,oldWindow=globalThis.window,oldDocument=globalThis.document;Object.assign(globalThis,{window,document:window.document,IS_REACT_ACT_ENVIRONMENT:true});const {createRoot}=await import('react-dom/client'),{act}=await import('react');const root=createRoot(document.getElementById('root')!);const requests:any[]=[];
 try{for(const c of configs){await act(async()=>root.render(<NativeMultiples config={c} frame={c.frameCount} onLessonHostRequest={r=>{requests.push(r);}}/>));for(const t of c.terms){const button=document.querySelector(`[data-source-button="${t.button}"]`)as HTMLButtonElement;assert(button&&!button.disabled);await act(async()=>button.click());assert.deepEqual(requests.at(-1),{type:'open-keyterm',entryId:t.entryId,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});}await act(async()=>root.render(<NativeMultiples config={c} frame={1} replay={7} onLessonHostRequest={r=>{requests.push(r);}}/>));assert([...document.querySelectorAll('button')].every(b=>(b as HTMLButtonElement).disabled));}assert.equal(requests.length,8);}
 finally{await act(async()=>root.unmount());Object.assign(globalThis,{window:oldWindow,document:oldDocument});window.close();}
});
test('all 541 controlled frames render native text deterministically; Replay resets state and reduced motion retains timeline alpha',()=>{
 let frames=0;for(const c of configs){for(let f=1;f<=c.frameCount;f++){const html=renderToStaticMarkup(<NativeMultiples config={c} frame={f}/>);assert(!html.includes('NaN'));assert(!html.includes('<canvas'));assert(html.includes(`data-lesson-frame="${f}"`));frames++;}const opening=dom(c,1),replay=dom(c,1,9);assert.equal(opening.querySelector('section')!.textContent,replay.querySelector('section')!.textContent);assert.equal(replay.querySelector('section')!.getAttribute('data-lesson-replay'),'9');assert.equal(getTeachingState(c,1000).frame,c.frameCount);assert.equal(getTeachingState(c,NaN).frame,1);}
 assert.equal(frames,541);assert(dom(multiples,100).querySelector('style')!.textContent!.includes('prefers-reduced-motion:reduce'));assert(getTeachingState(multiples,52).tokens.some(t=>t.arrival>0&&t.alpha>0&&t.alpha<1));
});
test('all 198 own text definitions and 46 shapes remain inventoried and all native block text ids are source-bound',()=>{
 let texts=0,shapes=0;for(const c of G4_L5_MULTIPLES_CONFIGS){const p=recipe.pages.find((p:any)=>p.animationId===c.animationId),asset=JSON.parse(gunzipSync(readFileSync(p.asset.path)).toString());assert.equal(c.textDispositions.length,asset.textDefinitions.length);assert.deepEqual(c.textDispositions.map(d=>d.character).sort((a,b)=>a-b),asset.textDefinitions.map((d:any)=>d.characterId).sort((a:number,b:number)=>a-b));assert.deepEqual(Object.values(p.shapeRoles).flat().sort((a:any,b:any)=>a-b),asset.shapeDefinitions.map((d:any)=>d.characterId).sort((a:number,b:number)=>a-b));const ids=new Set(asset.textDefinitions.flatMap((d:any)=>[d.sourceTextId,...d.runs.map((r:any)=>r.sourceTextId)]));for(const b of c.binding.blocks)for(const id of b.sourceTextIds)assert(ids.has(id));assert.equal(c.languagePolicy.es,'source-English-fallback-no-translation');texts+=asset.textDefinitions.length;shapes+=asset.shapeDefinitions.length;const d=dom(c,c.frameCount);assert.deepEqual([...d.querySelectorAll('[data-lesson-text-block]')].map(e=>e.getAttribute('data-lesson-text-block')),c.binding.blocks.map(b=>b.id));}
 assert.equal(texts,198);assert.equal(shapes,46);
});
for(const c of configs)test(`${c.animationId} loads through own registry with exact source, original user-started Spanish audio and once/Replay contracts`,async()=>{
 const m=await loadAnimationModuleForPresentation(c.animationId,{modernText:true});assert(m?.textPresentation?.Renderer);assert.equal(m.playbackMode,'once');assert.equal(m.textPresentation.playbackEndFrameByDomain?.[c.frameDomain],c.frameCount);assert.equal(m.textPresentation.reducedMotionFrameByDomain?.[c.frameDomain],c.frameCount);assert.deepEqual(m.textPresentation.sourceTimelineAudioCues,c.sourceAudio);assert.equal(m.audioTracks?.length,1);assert.equal(m.audioTracks?.[0].language,'es');assert.equal(m.audioTracks?.[0].activation,'user');assert.equal(m.audioTracks?.[0].timelineBehavior,'pause-while-playing');assert.deepEqual(m.audioTracks?.[0].frameDomains,[c.frameDomain]);
 const source=await import('../modules/'+c.animationId),getter=source['getCourseG04L05Vb'+c.animationId.slice(-3)+'FrameState'];const context:RuntimeContext={frame:c.frameCount,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en',seed:17,replay:2};const state=getter(context.frame,context);const snapshot=m.textPresentation.getSnapshot?.(state,context);assert.equal(snapshot?.status,'ready');assert.equal(snapshot?.animationId,c.animationId);assert.equal(snapshot?.sourceSwfSha256,c.sourceSwfSha256);assert.deepEqual(snapshot?.blocks.map(b=>b.id),c.binding.blocks.map(b=>b.id));const final=dom(c,c.frameCount);for(const b of snapshot!.blocks)assert.equal(b.text,block(final,b.id).textContent);
 for(const other of configs.filter(other=>other!==c))assert.equal(getMultiplesTextSnapshot(other,state,context).status,'blocked');for(const delta of [{frame:0},{frame:1.5},{frame:c.frameCount+1},{lang:'es' as const},{seed:18},{rootFrame:5},{frameDomain:'root'},{scenario:'other'},{entryStateSha256:'0'.repeat(64)}]){const result=getMultiplesTextSnapshot(c,state,{...context,...delta});assert.equal(result.status,'blocked');assert.deepEqual(result.blocks,[]);}
 const native=renderToStaticMarkup(React.createElement(m.textPresentation.Renderer,{...context,paused:true}));assert(native.includes('g4l5-multiples'));assert(native.includes(`data-modern-text-page="${c.animationId}"`));assert(native.includes('data-lesson-replay="2"'));const fallback=renderToStaticMarkup(React.createElement(m.textPresentation.Renderer,{...context,lang:'es',paused:true}));assert(!fallback.includes('g4l5-multiples'));assert.equal((await loadAnimationModuleForPresentation(c.animationId))?.textPresentation,undefined);
});
