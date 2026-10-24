import assert from 'node:assert/strict';import {test}from'node:test';
import {G4_L4_NUMBER_LINE_CONFIGS as raw}from'./generated/g4-l4-number-line-config';
import {getNumberLineTeachingState,getNumberLineTextSnapshot,requestNumberLineContinuation,numberLineValue,type NumberLineConfig}from'./g4-l4-number-line';
const configs=raw as readonly NumberLineConfig[],text=(c:NumberLineConfig,f:number,id:string)=>getNumberLineTeachingState(c,f).blocks.find(b=>b.id===id)!.text,equation=(c:NumberLineConfig,f:number)=>c.equation.map(id=>text(c,f,id)).join('');
for(const c of configs)test(`${c.animationId}: rejects mismatched source identity and host context`,async()=>{
 const module=await import('../modules/'+c.animationId),getter=module['getCourseG04L04Vb'+c.animationId.slice(-3)+'FrameState'];const context={frame:c.frameCount,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:17,replay:2},state=getter(context.frame,context);assert.equal(getNumberLineTextSnapshot(c,state,context).status,'ready');
 for(const other of configs.filter(x=>x!==c))assert.equal(getNumberLineTextSnapshot(other,state,context).status,'blocked');
 for(const delta of [{frame:0},{frame:1.5},{frame:c.frameCount+1},{lang:'es' as const},{seed:18},{rootFrame:5},{frameDomain:'root'},{scenario:'other'},{entryStateSha256:'0'.repeat(64)}])assert.equal(getNumberLineTextSnapshot(c,state,{...context,...delta}).status,'blocked');
});
test('Definition keeps 21 ticks and distinct complete-word and whole-number reveal',()=>{
 const c=configs[0];assert.deepEqual(c.graph.axisValues,Array.from({length:21},(_,i)=>i-10));assert.equal(text(c,14,'definition'),'A ');assert.equal(text(c,15,'definition'),'A number ');assert.equal(text(c,18,'definition'),'A number line ');assert.equal(text(c,22,'tick--10'),'');assert.equal(text(c,23,'tick--10'),'–10');assert.equal(text(c,38,'tick-10'),'');assert.equal(text(c,39,'tick-10'),'10');assert.equal(text(c,76,'increases'),'');assert.equal(text(c,77,'increases'),'increases');assert.equal(text(c,111,'decreases'),'');assert.equal(text(c,112,'decreases'),'decreases');assert.deepEqual(c.terms.map(t=>t.key),['Number line','Order','Increase','Decrease']);
});
test('Addition preserves lower 8/7 arcs while exposing 3 + 4 = 7 in source order',()=>{
 const c=configs[1];assert.equal(c.holdFrame,103);assert.equal(equation(c,120),'');assert.equal(equation(c,121),'3');assert.equal(equation(c,136),'3+');assert.equal(equation(c,138),'3+4');assert.equal(equation(c,143),'3+4=');assert.equal(equation(c,145),'3+4=7');const shown=getNumberLineTeachingState(c,184).blocks.filter(b=>b.id.startsWith('arc-')&&b.visible).map(b=>b.text);assert.deepEqual(shown,['8','7','4','3']);
});
test('Subtraction keeps the native negative-seven token and result 8 − 7 = 1',()=>{
 const c=configs[2];assert.equal(c.holdFrame,52);assert.equal(equation(c,69),'');assert.equal(equation(c,70),'8');assert.equal(equation(c,85),'8–');assert.equal(equation(c,86),'8–7');assert.equal(equation(c,91),'8–7=');assert.equal(equation(c,94),'8–7=1');const shown=getNumberLineTeachingState(c,128).blocks.filter(b=>b.id.startsWith('arc-')&&b.visible).map(b=>b.text);assert.deepEqual(shown,['3','4','8','–7']);assert.equal(c.blocks.find(b=>b.id==='arc-negative-seven')!.tokens.length,1);
});
for(const c of configs.slice(1))test(`${c.animationId}: only an enabled own hold requests the host continuation`,()=>{
 let requests=0;const props:any={frame:c.holdFrame,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en',seed:17,replay:2,onLessonFrameRequest:(edge:any)=>{requests++;assert.deepEqual(edge,{fromFrame:c.holdFrame,toFrame:c.holdFrame!+1,stopFrame:c.frameCount});return true;}};
 assert(requestNumberLineContinuation(c,props));for(const delta of [{paused:true},{frame:1},{frame:c.holdFrame!+1},{frameDomain:'root'},{rootFrame:5},{lang:'es'},{entryStateSha256:'capture'},{scenario:'other'}])assert.equal(requestNumberLineContinuation(c,{...props,...delta}),false);assert.equal(requests,1);assert.equal(requestNumberLineContinuation(c,{...props,onLessonFrameRequest:()=>false}),false);assert.equal(requestNumberLineContinuation(c,{...props,onLessonFrameRequest:undefined}),false);
 const initial=getNumberLineTeachingState(c,1);assert.equal(initial.blocks.filter(b=>b.visible).length,1);assert.equal(equation(c,1),'');assert.deepEqual(c.graph.axisValues,Array.from({length:31},(_,i)=>i-10));for(const depth of [3,5,7,9])assert.equal(numberLineValue(c.graph.placements.find(p=>p.depth===depth)!.states,c.frameCount,null)!.alpha,1);
});

test('All three pages load through the real modern-presentation boundary with only source-owned capabilities',async()=>{
 const {loadAnimationModuleForPresentation}=await import('../animation-registry');
 for(const c of configs){const module=await loadAnimationModuleForPresentation(c.animationId,{modernText:true});assert(module?.textPresentation);const cap=module.textPresentation;assert.equal(cap.binding.animationId,c.animationId);assert.equal(Boolean(cap.keyTerms),c.terms.length>0);assert.equal(Boolean(cap.frameControl),c.holdFrame!==null);assert.deepEqual(cap.sourceTimelineAudioCues,c.sourceAudio);}
});
