import assert from 'node:assert/strict';
import test from 'node:test';
import {nmsL02P056AdmissionDescriptor} from './nms-l02-p056-admission.server';
import {nmsL02P057CandidateDescriptorV1} from './nms-l02-p057-candidate-descriptor-v1';
const clone=<T,>(value:T):T=>structuredClone(value);
type Mutable<T>=T extends object?{-readonly [K in keyof T]:Mutable<T[K]>}:T;
test('P057 real predecessor projects one source-ordered candidate without changing registry count',()=>{
 const original=nmsL02P056AdmissionDescriptor();assert(original.registered);
 const before=JSON.stringify(original.descriptor),next=nmsL02P057CandidateDescriptorV1(original.descriptor);
 assert.equal(JSON.stringify(original.descriptor),before);
 assert.equal(next.productBridge.registeredAnimationCount,56);
 assert.equal(next.pages.filter(p=>p.rendererAvailability.kind==='registered').length,57);
 assert.equal(next.pages[56].rendererAvailability.kind,'registered');
 for(let i=0;i<64;i++)if(i!==56)assert.deepEqual(next.pages[i],original.descriptor.pages[i]);
 assert(next.glossary.some(term=>term.id==='simple-simpler-simplest'&&term.sourceKeyAttribute==='Simple / Simpler / Simplest'));
 assert.throws(()=>nmsL02P057CandidateDescriptorV1(next),/PREDECESSOR/u);
});
test('wrong placement, source identity, predecessor count and glossary collisions are rejected',()=>{
 const base=nmsL02P056AdmissionDescriptor().descriptor;
 for(const mutate of [
  (d:Mutable<typeof base>)=>{d.pages[56].source.assetId='swf-'+'0'.repeat(64);},
  (d:Mutable<typeof base>)=>{d.pages[56].sectionPageOrdinal=2;},
  (d:Mutable<typeof base>)=>{d.pages[56].previousPlacementId=null;},
  (d:Mutable<typeof base>)=>{d.productBridge.registeredAnimationCount=55;},
  (d:Mutable<typeof base>)=>{d.glossary.find(t=>t.id==='problem')!.definitions.en='invented';},
 ]){const bad=clone(base) as Mutable<typeof base>;mutate(bad);assert.throws(()=>nmsL02P057CandidateDescriptorV1(bad),/PREDECESSOR|COLLISION/u);}
});
