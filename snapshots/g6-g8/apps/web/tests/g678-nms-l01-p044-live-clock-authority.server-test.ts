import {readG678P044PhysicalPin,resolveG678P044PhysicalPath} from '../lib/g678-nms-l01-p044-authority.server';
import {currentTypographyHostBinding,resolveTypographyHostClosurePins} from '../lib/g678-typography-host-successor.server';
import test from 'node:test';
import assert from 'node:assert/strict';
import {realpathSync} from 'node:fs';
import {readG678P044RepairPackage,validateG678P044RepairAuthority,validateG678P044RepairPhysicalClosure} from '../lib/g678-nms-l01-p044-live-clock-authority.server';
const root=realpathSync(new URL('../../../',import.meta.url));
test('exact repaired379 v2 preserves original runtime metadata and258-file candidate plus historical source authority',()=>{
  const i=readG678P044RepairPackage(root),before=JSON.stringify(i),r=validateG678P044RepairAuthority(i);assert.equal(JSON.stringify(i),before);
  assert.equal(r.entry.key,'shared-nms002-l01-p044');assert.equal(r.entry.module,'./modules/g678-nms-l01-live-clock-current-js-p044');
  assert.equal(r.entry.runtimeContract.frameCount,759);assert.equal(r.entry.runtimeContract.livePlaybackEndFrame,756);
  assert.ok(r.compilerRun.path.includes('live-clock-current-js-v3'));assert.ok(r.physicalPins.length>=258);
  assert.ok(!r.physicalPins.some(p=>p.path==='packages/demos/private-current-js-registry.json'));
});
test('missing or modified separate base lineage is rejected without borrowing predecessor authority',()=>{
  const i=readG678P044RepairPackage(root);assert.throws(()=>validateG678P044RepairAuthority({...i,lineage:undefined}));
  for(const key of['predecessor','baseAuthority','baseCandidate'] as const){const j=structuredClone(i);j.lineage={...j.lineage,[key]:{...j.lineage[key],value:{}}};assert.throws(()=>validateG678P044RepairAuthority(j));}
});
test('repair source, candidate, freeze, glossary and source ancestor reject aliases and value changes',()=>{
  for(const key of['authority','candidate','freeze','glossary','predecessor'] as const){const i=readG678P044RepairPackage(root),j=structuredClone(i);
    i[key]={...i[key],path:i[key].path+'.alias'};assert.throws(()=>validateG678P044RepairAuthority(i));j[key]={...j[key],value:{}};assert.throws(()=>validateG678P044RepairAuthority(j));}
});
test('actual complete physical closure verifies old source witnesses and the exact new callback/view/module',()=>{
  const r=validateG678P044RepairAuthority(readG678P044RepairPackage(root));
  const successor=currentTypographyHostBinding(root);
  if(successor)assert.throws(()=>validateG678P044RepairPhysicalClosure(root,r),/physical drift/);
  const paths=successor?resolveTypographyHostClosurePins(root,r.physicalPins).map(p=>{readG678P044PhysicalPin(root,p);return resolveG678P044PhysicalPath(root,p.path);}):validateG678P044RepairPhysicalClosure(root,r);
  for(const suffix of['L1TS08.swf','g678-nms-l01-p044-live-frame-callback.ts','g678-nms-l01-p044-product-candidate-v2.tsx','g678-current-js-379-v1-product-bridge-witness.ts'])assert.ok(paths.some(p=>p.endsWith(suffix)));
});
