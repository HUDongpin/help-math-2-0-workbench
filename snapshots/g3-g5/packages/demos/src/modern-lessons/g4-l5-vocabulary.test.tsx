import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {NativeVocabulary,getTeachingState,curveAt,type Config} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
import {getVocabularyTextSnapshot} from './g4-l5-vocabulary';
import {loadAnimationModuleForPresentation} from '../animation-registry';
const configs=G4_L5_VOCABULARY_CONFIGS as readonly Config[];
const [multiply,product]=configs;
const text=(c:Config,f:number,id:string)=>getTeachingState(c,f).blocks.find(b=>b.id===id)!.tokens.filter(t=>t.alpha>0).map(t=>t.text).join('');
const doc=(c:Config,f:number,replay=0)=>new JSDOM(renderToStaticMarkup(<NativeVocabulary config={c} frame={f} replay={replay}/>)).window.document;
test('source math retains three corresponding products and repeated sums',()=>{
 assert.equal(text(multiply,220,'text-16'),'6 × 4 = 24 ');assert.deepEqual(['text-20','text-21','text-17','text-19'].map(id=>text(multiply,220,id)),['37','×','5','185']);assert.equal(37*5,185);
 assert.equal(text(multiply,220,'text-22'),'3 groups of 5 =');assert.equal(text(multiply,220,'text-23'),'= 15');
 assert.deepEqual(['text-33','text-34','text-35'].map(id=>text(multiply,220,id)),['6 + 6 + 6 + 6 = 24','37 + 37 + 37 + 37 + 37 = 185','5 + 5 + 5 = 15']);
});
test('source RGB multiplication is not mistaken for alpha and authored fades stay delayed',()=>{
 for(const id of ['text-17','text-18','text-19','text-20','text-21']){assert.equal(text(multiply,49,id),'');assert.notEqual(text(multiply,50,id),'');assert.equal(getTeachingState(multiply,50).blocks.find(b=>b.id===id)!.tokens[0].alpha,1);}
 for(const [id,frame]of [['text-16',45],['text-22',56],['text-33',94],['text-34',100],['text-35',107]]as const){assert.equal(text(multiply,frame,id),'');assert.notEqual(text(multiply,frame+1,id),'');}
});
test('product result remains absent until its complete source mask allows the whole 24',()=>{
 const block=product.blocks.find(b=>b.id==='text-16')!;const first=block.tokens[4].alpha.find(p=>p[1]>0)![0];
 assert(first>118&&first<=134);assert(!text(product,first-1,'text-16').includes('24'));assert(text(product,first,'text-16').endsWith('24'));assert.equal(text(product,169,'text-16'),'6 × 4 = 24');
 assert.equal(text(product,143,'text-18'),'');assert.equal(text(product,144,'text-18'),'Product');
});
test('source outlined teaching text uses one native semantic target, and exact highlight lifetime',()=>{
 assert.deepEqual(product.outlinedTextAliases.map(a=>[a.sourceShape,a.sourceCharacters,a.text]),[[25,[27,26],'24'],[28,[29],'Product']]);
 for(const frame of [156,157,164,165]){const d=doc(product,frame);assert.equal(d.querySelectorAll('.g4l5-vocabulary__emphasis').length,frame>=157&&frame<=164?2:0);assert.equal(d.querySelectorAll('[data-source-character="26"],[data-source-character="27"],[data-source-character="29"]').length,0);}
 const d=doc(product,169);assert.equal(d.querySelectorAll('[data-lesson-text-block="text-18"]').length,1);assert(d.querySelector('[data-lesson-text-block="text-16"]')!.textContent!.endsWith('24'));
});
test('graphic and calculation-line accessible states do not reveal future teaching content',()=>{
 let d=doc(multiply,1);assert.equal(d.querySelector('img')?.getAttribute('aria-hidden'),'true');assert.equal(d.querySelector('[role="separator"]')?.getAttribute('aria-hidden'),'true');
 d=doc(multiply,57);assert.equal(d.querySelector('img')?.getAttribute('aria-hidden'),null);assert.equal(d.querySelector('img')?.getAttribute('alt'),'Three rows of five green dots');
 const svg=Buffer.from(multiply.sourceGroupSvg!.split(',')[1],'base64').toString();assert(!/<text\b/.test(svg));assert.equal(d.querySelectorAll('[data-lesson-text-block="text-18"]').length,1);
});
test('every controlled source frame renders deterministic native text and Replay restores the opening state',()=>{
 for(const c of configs){for(let frame=1;frame<=c.frameCount;frame++){const markup=renderToStaticMarkup(<NativeVocabulary config={c} frame={frame}/>);assert(!markup.includes('NaN'));assert(!markup.includes('<canvas'));assert(markup.includes(`data-lesson-frame="${frame}"`));}
  const opening=doc(c,1,0),replay=doc(c,1,4);assert.equal(opening.querySelector('section')!.textContent,replay.querySelector('section')!.textContent);assert.equal(replay.querySelector('section')!.getAttribute('data-lesson-replay'),'4');assert.equal(text(c,1,'text-8'),'');assert.equal(getTeachingState(c,c.frameCount+100).frame,c.frameCount);
 }
});
test('dictionary targets follow source key identities and exact host stop request',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});const oldWindow=globalThis.window,oldDocument=globalThis.document;Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 const {createRoot}=await import('react-dom/client');const {act}=await import('react');const root=createRoot(document.getElementById('root')!);const requests:unknown[]=[];
 try{await act(async()=>root.render(<NativeVocabulary config={product} frame={169} onLessonHostRequest={(request)=>{requests.push(request);}}/>));const button=document.querySelector('[data-source-keyterm="Product"]') as HTMLButtonElement;assert(button&&!button.disabled);await act(async()=>button.click());assert.deepEqual(requests,[{type:'open-keyterm',entryId:product.terms.find(t=>t.key==='Product')!.entryId,sourceAnimationId:product.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'}]);
  await act(async()=>root.render(<NativeVocabulary config={product} frame={1} replay={1} onLessonHostRequest={(request)=>{requests.push(request);}}/>));assert((document.querySelector('[data-source-keyterm="Product"]')as HTMLButtonElement).disabled);
 }finally{await act(async()=>root.unmount());Object.assign(globalThis,{window:oldWindow,document:oldDocument});dom.window.close();}
});

test('narrow-column stacking keeps each repeated sum inside its own multiplication card',()=>{
 const d=doc(multiply,220),cards=[...d.querySelectorAll('.g4l5-vocabulary__card')];assert.equal(cards.length,3);for(const [i,ids]of [['text-16','text-33'],['text-20','text-34'],['text-22','text-35']].entries())for(const id of ids)assert(cards[i].querySelector('[data-lesson-text-block="'+id+'"]'));
});

for(const c of configs)test(`${c.animationId} integrates through real presentation registry and rejects unsupported context`,async()=>{
 const m=await loadAnimationModuleForPresentation(c.animationId,{modernText:true});assert(m?.textPresentation?.Renderer);assert.equal(m.playbackMode,'once');
 assert.equal(m.textPresentation.playbackEndFrameByDomain?.[c.frameDomain],c.frameCount);assert.equal(m.textPresentation.sourceTimelineAudioCues?.length,1);assert.equal(m.audioTracks?.length,1);assert.equal(m.audioTracks?.[0].language,'es');
 const source=await import('../modules/'+c.animationId);const getter=source['getCourseG04L05Vb'+c.animationId.slice(-3)+'FrameState'];
 const context={frame:c.frameCount,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:17,replay:2};const state=getter(context.frame,context);
 const snapshot=getVocabularyTextSnapshot(c,state,context);assert.equal(snapshot.status,'ready');assert(snapshot.blocks.every(b=>!['text-26','text-27','text-29'].includes(b.id)));
 for(const other of configs.filter(other=>other!==c))assert.equal(getVocabularyTextSnapshot(other,state,context).status,'blocked');
 for(const delta of [{frame:0},{frame:1.5},{frame:c.frameCount+1},{lang:'es' as const},{seed:18},{rootFrame:5},{frameDomain:'root'},{scenario:'other'},{entryStateSha256:'0'.repeat(64)}])assert.equal(getVocabularyTextSnapshot(c,state,{...context,...delta}).status,'blocked');
 assert.equal(getVocabularyTextSnapshot(c,{...state,sourceSwfSha256:'0'.repeat(64)},context).status,'blocked');
 const native=renderToStaticMarkup(React.createElement(m.textPresentation.Renderer,{...context,paused:true}));assert(native.includes('g4l5-vocabulary'));
 const fallback=renderToStaticMarkup(React.createElement(m.textPresentation.Renderer,{...context,lang:'es',paused:true}));assert(!fallback.includes('g4l5-vocabulary'));
 const plain=await loadAnimationModuleForPresentation(c.animationId);assert.equal(plain?.textPresentation,undefined);
});

const [factors,arrays]=configs.slice(2);
const graphics=(c:Config,f:number)=>getTeachingState(c,f).graphics.map(p=>p.value).filter(p=>p&&p.alpha>0);
test('Factors retains equation and delayed label arrival, then two different native numeral emphasis lifetimes',()=>{
 assert.equal(text(factors,180,'text-17'),'6 × 4 = 24');assert.equal(text(factors,143,'text-18'),'');assert.equal(text(factors,144,'text-18'),'Factors');
 for(const [frame,count]of [[156,0],[157,1],[175,1],[176,2],[180,2]]){const d=doc(factors,frame);assert.equal(d.querySelectorAll('.g4l5-vocabulary__emphasis').length,count);assert.equal(d.querySelectorAll('[data-source-character="22"],[data-source-character="28"]').length,0);}
 assert.deepEqual(factors.outlinedTextAliases.map(a=>[a.sourceShapes,a.sourceCharacters]),[[[21],[22]],[[26],[22]],[[27],[28]]]);
});
test('mixed shape26 separates its two arrow paths and native6 alias; morph strokes and heads remain visible',()=>{
 const shape=factors.shapes.find(s=>s.character===26)!;assert.equal(shape.paths.length,2);assert(shape.paths.every(p=>(p.fill??'').includes('0,0,0')||(p.stroke??'').includes('0,0,0')));assert(!shape.paths.some(p=>(p.stroke??'').includes('255,0,255')));
 for(const frame of [152,157]){const g=graphics(factors,frame);assert(g.some(p=>p!.character===19&&p!.paths?.some(path=>path.stroke!=='none'&&path.width===40)));assert(g.some(p=>p!.character===20&&p!.paths?.some(path=>path.fill!=='none'&&path.d.includes('Q '))));}
 assert.notDeepEqual(graphics(factors,152).find(p=>p!.character===19)!.paths,graphics(factors,157).find(p=>p!.character===19)!.paths);assert(graphics(factors,180).some(p=>p!.character===26));
});
test('array labels preserve repeated character instance identities and read in source x order',()=>{
 assert.deepEqual(arrays.nativeGroups.map(g=>g.text),['[3×3array]','[2×7array]']);assert.equal(new Set(arrays.blocks.map(b=>b.id)).size,arrays.blocks.length);assert.deepEqual([...doc(arrays,124).querySelectorAll('[data-array-label]')].map(e=>e.textContent),['[3 × 3 array]','[2 × 7 array]']);
 for(const [groupIndex,zero,first,full]of [[0,83,84,88],[1,99,100,104]]){const group=arrays.nativeGroups[groupIndex];assert.equal(group.blockIds.map(id=>text(arrays,zero,id)).join(''),'');assert.equal(group.blockIds.map(id=>text(arrays,first,id)).join(''),group.text);assert(group.blockIds.every(id=>getTeachingState(arrays,full).blocks.find(b=>b.id===id)!.tokens.every(t=>t.alpha===1)));}
 assert.equal(text(arrays,124,'text-38'),'3 × 3 = 9');assert.equal(text(arrays,124,'text-41'),'2 × 7 = 14');assert.equal(text(arrays,91,'text-38'),'');assert.equal(text(arrays,92,'text-38'),'3 × 3 = 9');assert.equal(text(arrays,107,'text-41'),'');assert.equal(text(arrays,108,'text-41'),'2 × 7 = 14');
});
test('row and column flash overlays last one source frame per flash and source translations stay distinct',()=>{
 const expected=new Map([[39,22],[41,22],[43,23],[45,23],[47,24],[49,24],[51,25],[53,25],[55,27],[57,27],[59,28],[61,28],[63,29],[65,29],[67,30],[69,30],[71,30],[73,30],[75,30],[77,30]]);
 for(let f=1;f<=124;f++){const active=graphics(arrays,f).filter(p=>arrays.shapes.find(s=>s.character===p!.character)?.role==='highlights');assert.deepEqual(active.map(p=>p!.character),expected.has(f)?[expected.get(f)]:[]);}
 assert.deepEqual(graphics(arrays,39).find(p=>p!.character===15)!.matrix,[1,0,0,1,-291,172]);assert.deepEqual(graphics(arrays,39).find(p=>p!.character===22)!.matrix,[1,0,0,1,-3,0]);assert.deepEqual([67,71,75].map(f=>graphics(arrays,f).find(p=>p!.character===30)!.matrix[4]),[-1571,-787,-3]);
});
test('two responsive array cards retain own native labels, equations and complete source coordinate bounds',()=>{
 const d=doc(arrays,124),cards=[...d.querySelectorAll('[data-array-card]')];assert.equal(cards.length,2);for(const [i,ids]of [['text-16','text-18','text-38'],['text-17','text-19','text-41']].entries())for(const id of ids)assert(cards[i].querySelector('[data-lesson-text-block="'+id+'"]'));
 assert.equal(cards[0].querySelector('svg')!.getAttribute('viewBox'),'-5800 -1510 3820 3630');assert.equal(cards[1].querySelector('svg')!.getAttribute('viewBox'),'-820 -1130 6650 2590');assert.equal(d.querySelectorAll('svg text').length,0);assert.equal(doc(arrays,21).querySelector('svg')!.getAttribute('aria-hidden'),'true');assert.equal(doc(arrays,22).querySelector('svg')!.getAttribute('aria-hidden'),null);
});
test('each page glossary uses exact source identity and stop-until-explicit-resume request',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'}),oldWindow=globalThis.window,oldDocument=globalThis.document;Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});const {createRoot}=await import('react-dom/client');const {act}=await import('react');const root=createRoot(document.getElementById('root')!);const requests:unknown[]=[];
 try{for(const c of configs){await act(async()=>root.render(<NativeVocabulary config={c} frame={c.frameCount} onLessonHostRequest={r=>{requests.push(r);}}/>));for(const term of c.terms){const button=document.querySelector('[data-source-keyterm="'+term.key+'"]')as HTMLButtonElement;assert(button&&!button.disabled);await act(async()=>button.click());assert.deepEqual(requests.at(-1),{type:'open-keyterm',entryId:term.entryId,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});}await act(async()=>root.render(<NativeVocabulary config={c} frame={1} replay={1} onLessonHostRequest={r=>{requests.push(r);}}/>));assert([...document.querySelectorAll('button')].every(b=>(b as HTMLButtonElement).disabled));}}
 finally{await act(async()=>root.unmount());Object.assign(globalThis,{window:oldWindow,document:oldDocument});dom.window.close();}
});

test('all four source-backed text bindings follow actual semantic DOM order without alias duplicates',()=>{
 for(const c of configs){const d=doc(c,c.frameCount),ids=[...d.querySelectorAll('[data-lesson-text-block]')].map(e=>e.getAttribute('data-lesson-text-block'));assert.equal(new Set(ids).size,ids.length);assert.deepEqual(c.binding.blocks.map(b=>b.id),ids);assert.deepEqual(c.binding.blocks.map(b=>b.readingOrder),ids.map((_,i)=>i));for(const alias of c.outlinedTextAliases){assert(!ids.some(id=>c.blocks.find(b=>b.id===id)?.alias));const target=c.binding.blocks.find(b=>b.id===alias.targetBlock)!;assert(target.sourceShapeIds?.includes(alias.sourceShape));}}
});
test('native title keeps exact source text and identifiers with a normal wrapping rule',()=>{
 for(const c of configs){const d=doc(c,1),title=d.querySelector('h2')!,source=c.blocks.find(b=>b.id==='title')!;assert.equal(title.textContent,source.text);assert.equal(title.querySelector('[data-source-text-ids]')!.getAttribute('data-source-text-ids'),source.tokens[0].sourceTextIds.join(','));assert(d.querySelector('style')!.textContent!.includes('h2 .g4l5-vocabulary__word{display:inline;white-space:normal;overflow-wrap:normal}'));}
});
