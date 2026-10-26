import test from'node:test';import assert from'node:assert/strict';
import{p031Initial,p031Advance,p031OpenHelp,p031Answer,P031_ID}from'../src/nms-l02-p031-state-v1';
import{createP031TermHost,p031SourceTerm,p031CanOpenTerm}from'../src/nms-l02-p031-term-host-v1';
test('main glossary gates exact terms by source visibility and blocks feedback-phase access',()=>{
 const host=createP031TermHost(),q={type:'open-keyterm' as const,entryId:'decimal',sourceAnimationId:P031_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume' as const};
 assert.equal(host.dispatch(q,p031Initial()).status,'blocked');assert.equal(host.dispatch(q,p031Advance(p031Initial(),48)).status,'allowed');
 assert.equal(host.dispatch({...q,entryId:'tenth'},p031Advance(p031Initial(),146)).status,'blocked');assert.equal(host.dispatch({...q,sourceAnimationId:'shared-nms002-l02-p030'},p031Advance(p031Initial(),146)).status,'blocked');
 const right=p031Answer(p031Advance(p031Initial(),146),2);assert.equal(host.dispatch(q,right).status,'blocked');
 const final=p031Advance(right,1000);for(const id of['decimal','ones-group','place-value-chart'])assert(p031CanOpenTerm(final,id));assert(!p031CanOpenTerm(final,'hundredth'));
});
test('help resolves all six exact definitions with one explicit source alias',()=>{
 const s=p031OpenHelp(p031Advance(p031Initial(),146)),host=createP031TermHost();
 for(const id of['decimal','hundredth','ones-group','place-value','place-value-chart','tenth']){
  const term=p031SourceTerm(id);assert(term?.definitions.en&&term.definitions.es);assert.equal(host.dispatch({type:'open-keyterm',entryId:id,sourceAnimationId:P031_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},s).status,'allowed');assert.equal(host.dispatch({type:'close-keyterm'},s).status,'allowed');
 }
 assert.equal(p031SourceTerm('hundredth')?.sourceKeyAttribute,'Hundredths');assert.equal(p031SourceTerm('__proto__'),undefined);
});
