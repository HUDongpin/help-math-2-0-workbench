import test from 'node:test';
import assert from 'node:assert/strict';
import {getNmsL2P023FrameState as frame,p023FrameAtMilliseconds,p023SourceFrameAtMilliseconds} from '../src/nms-l02-p023-timeline-v1';
import {p023TeachingState as teaching,p023TextSnapshot} from '../src/nms-l02-p023-text-v1';
import {createP023TermHost,P023_TERM_ENTRIES} from '../src/nms-l02-p023-term-host-v1';
const at=(f:number,replay=0)=>frame(f,{lang:'en',seed:41,replay});
test('source number-line beats and precise cycle boundary remain explicit',()=>{
 assert.equal(teaching(at(197)).redVisible,false);assert(teaching(at(198)).redProgress>0);assert(teaching(at(210)).redProgress<1);assert.equal(teaching(at(211)).redProgress,1);
 assert.equal(teaching(at(211)).blueVisible,false);assert(teaching(at(212)).blueProgress>0);assert(teaching(at(224)).blueProgress<1);assert.equal(teaching(at(225)).blueProgress,1);
 assert.equal(teaching(at(258)).halfAlpha,0);assert.equal(teaching(at(259)).halfAlpha,0);assert.equal(teaching(at(263)).halfAlpha,1);
 assert.equal(p023FrameAtMilliseconds(469000/12-1),469);assert.equal(p023SourceFrameAtMilliseconds(469000/12-1),469);assert.equal(p023FrameAtMilliseconds(469000/12),469);assert.equal(p023SourceFrameAtMilliseconds(469000/12),1);
 const last=teaching(at(469));assert.equal(last.first.map(r=>r.visibleText).join('')+last.second.map(r=>r.visibleText).join(''),'Fractions are parts of a whole. On this number line they are between the numbers zero and one.');
 assert.equal(teaching(at(1,1)).redVisible,false);assert.deepEqual(teaching(at(1,1)).termAvailable,{Fraction:false,Part:false,Whole:false,'Number line':false});
});
test('four source glossary keys are admitted only after complete visible glyphs',()=>{
 for(const[key,f]of Object.entries({Fraction:330,Part:336,Whole:343,'Number line':371})){
  const id=P023_TERM_ENTRIES[key as keyof typeof P023_TERM_ENTRIES],host=createP023TermHost(),request={type:'open-keyterm' as const,entryId:id,sourceAnimationId:'shared-nms002-l02-p023',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume' as const};
  assert.equal(host.dispatch(request,at(f-1)).status,'blocked',key);assert.equal(host.dispatch(request,at(f)).status,'allowed',key);assert.equal(host.dispatch({type:'close-keyterm'},at(f)).status,'allowed');
  assert.equal(host.dispatch({...request,sourceAnimationId:'shared-nms002-l02-p022'},at(f)).status,'blocked');assert.equal(host.dispatch({...request,entryId:'invented'},at(f)).status,'blocked');assert.equal(host.dispatch(request,frame(10,{frameDomain:'root',lang:'en',seed:41})).status,'blocked');
 }
});
test('every source domain remains deterministic with native text disposition',()=>{
 let queries=0;
 for(const[domain,count]of[['root',10],['sprite-28',469]] as const)for(let f=1;f<=count;f++)for(const lang of['en','es']as const)for(const replay of[0,1]){
  const s=frame(f,{frameDomain:domain,lang,seed:41,replay});assert.equal(s.frame,f);assert.equal(p023TextSnapshot(s).status,'ready');assert.deepEqual(s.nodes,frame(f,{frameDomain:domain,lang,seed:41,replay}).nodes);queries++;
 }
 assert.equal(queries,1916);for(const f of[0,470,NaN])assert.throws(()=>at(f));assert.throws(()=>frame(1,{frameDomain:'__proto__',seed:0,lang:'en'}));
});
