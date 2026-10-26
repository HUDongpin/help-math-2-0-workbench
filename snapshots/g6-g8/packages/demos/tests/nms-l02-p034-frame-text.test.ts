import test from 'node:test';import assert from 'node:assert/strict';
import {p034ModuleFrame,p034LiveFrame,p034LocalPoses,P034_SCENARIOS} from '../src/nms-l02-p034-frame-v1';
import {p034TextSnapshot} from '../src/nms-l02-p034-text-v1';
import {P034_FRAME_DATA as DATA} from '../src/generated/nms-l02-p034-frame-data-v1';
import {p034Initial,p034Advance,p034SetValue} from '../src/nms-l02-p034-state-v1';
test('seven reachable source domains and415frames bind deterministic native text for all contexts',()=>{
 let queries=0;for(const[d,info]of Object.entries(DATA.domains))for(let frame=1;frame<=info.frameCount;frame++)for(const lang of['en','es']as const)for(const scenario of P034_SCENARIOS)for(const seed of[0,4294967295])for(const replay of[0,1]){
  const s=p034ModuleFrame(frame,{frame,frameDomain:d==='root'?'root':'sprite-'+d,rootFrame:d==='root'?frame:6,lang,scenario:scenario.id,seed,replay});assert.equal(s.frame,frame);assert.equal(s.domain,d);assert.equal(s.seed,seed);assert.equal(s.replay,replay);assert(Object.isFrozen(s.poses));assert.equal(p034TextSnapshot(s).status,'ready');queries++;
 }assert.equal(queries,13280);
});
test('live value history is retained and reset inspection distinguishes release from down-state audio',()=>{
 const live=p034LiveFrame(p034SetValue(p034Advance(p034Initial(),395),73),'en');assert.equal(live.state.value,73);assert.equal(p034TextSnapshot(live).blocks.find(b=>b.id==='decimal-value')?.text,'0.73');
 const context={frame:395,frameDomain:'sprite-172',rootFrame:6,lang:'en' as const,scenario:'reset',seed:0};assert.equal(p034ModuleFrame(395,context).state.value,0);assert.equal(p034ModuleFrame(1,{...context,frame:1,frameDomain:'sprite-167'}).state.value,15);assert.equal(p034ModuleFrame(396,{...context,frame:396}).mainFrame,396);
 const root=p034ModuleFrame(5,{...context,frame:5,frameDomain:'root',rootFrame:5});assert.equal(root.mainFrame,null);assert(p034TextSnapshot(root).blocks.every(b=>!b.visible));
});
test('unplaced definitions and ambiguous frame identities cannot become page modules',()=>{
 const c={frame:1,frameDomain:'sprite-172',rootFrame:6,lang:'en' as const,scenario:'source-decimal-practice',seed:0};for(const d of ['172','sprite-0172','sprite-90','__proto__','sprite-7'])assert.throws(()=>p034ModuleFrame(1,{...c,frameDomain:d}));assert.throws(()=>p034ModuleFrame(2,c));assert.throws(()=>p034ModuleFrame(1,{...c,rootFrame:1}));assert.throws(()=>p034LocalPoses('172',397));assert.throws(()=>p034LocalPoses('172',NaN));
});
