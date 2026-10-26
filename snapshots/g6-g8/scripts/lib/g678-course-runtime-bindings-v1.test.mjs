import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readG678CourseRuntimeBindings,readG678PresentationMetadata,readG678HostMetadata} from './g678-course-runtime-bindings-v1.mjs';
import {registrySources,sha256,DISPATCH} from '../../lib/g678-admission-proof.mjs';

process.env.HELP_MATH_G678_SOURCE_ROOT='/Volumes/Life /HELP MATH Related Files/AWS Grade-Classified Courseware';
const draft=path.dirname(fileURLToPath(import.meta.url));
const actualRoot='/Volumes/Life /HELP MATH 2.0-g678-implementation';
const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;
const source=fs.readFileSync(path.join(sourceRoot,'G6-G8-shared/NMS002/L1/RW/L1RW02.swf'));
const xml=fs.readFileSync(path.join(sourceRoot,'G6-G8-shared/NMS002/L1/index.xml'));

function fixture() {
  const root=fs.mkdtempSync(path.join(draft,'metadata-test-'));
  const put=(file,body)=>{
    const bytes=Buffer.from(typeof body==='string'?body:JSON.stringify(body));
    fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),bytes);
    return {path:file,bytes:bytes.length,sha256:sha256(bytes)};
  };
  const ids=['shared-nms002-l01-p002','shared-nms002-l01-p003'];
  const packets=[];
  const calibrations=ids.map((id,index)=>{
    const artifacts={module:put(`packages/demos/src/modules/${id}.tsx`,'UNIT TEST ONLY module'),
      timeline:put(`packages/demos/src/timelines/${id}.ts`,'UNIT TEST ONLY timeline'),runtime:put(`work/${id}/canvas-renderer.js`,'UNIT TEST ONLY drawing')};
    const entry={key:id,module:`./modules/${id}`,maturity:'private-current-js',complexityLane:'interactive-understood',artifacts};
    const selected={animationId:id,placementId:id,assetId:`swf-${sha256(source)}`,sourceSha256:sha256(source),globalPageOrdinal:index+2,
      moduleCode:'NMS002',lessonNumber:1,complexityLane:'interactive-understood',runtime:{frameDomain:'sprite-722',scenario:'source-static-frame',language:'fixed-en',seed:'0',canvasRenderer:artifacts.runtime}};
    const packet={schemaVersion:1,calibrationId:`unit-${index}`,deploymentScope:'local-only',selectedPages:[selected],entry,
      source:{path:'G6-G8-shared/NMS002/L1/RW/L1RW02.swf',bytes:source.length,sha256:sha256(source)},
      sourceXml:{path:'G6-G8-shared/NMS002/L1/index.xml',bytes:xml.length,sha256:sha256(xml)},
      inputs:[{path:'missing-historical-build-output',bytes:1,sha256:'f'.repeat(64)}]};
    packets.push(packet);
    const freeze=put(`catalog/test-${index}.json`,packet);
    return {calibrationId:`unit-${index}`,deploymentScope:'local-only',freezeManifest:freeze.path,freezeManifestBytes:freeze.bytes,freezeManifestSha256:freeze.sha256,entries:[entry]};
  });
  const registry={schemaVersion:2,registryScope:'private-engineering',calibrations};
  const refresh=()=>{put('packages/demos/private-current-js-registry.json',registry);registrySources(registry).forEach((source,index)=>put(DISPATCH[index],source));};
  const refreshPacket=index=>{const p=put(calibrations[index].freezeManifest,packets[index]);Object.assign(calibrations[index],{freezeManifestBytes:p.bytes,freezeManifestSha256:p.sha256});refresh();};
  put('catalog/g678-page-only-release-manifest.v1.json',{releases:[{moduleCode:'NMS002',moduleLesson:1,sourceLesson:{path:'G6-G8-shared/NMS002/L1/index.xml',bytes:xml.length,sha256:sha256(xml)},members:ids.map((id,index)=>({animationId:id,placementId:id,ordinal:index+2,assetId:`swf-${sha256(source)}`,source:{path:'HELP_COURSES/NMS002/L1/RW/L1RW02.swf',sha256:sha256(source)}}))}]});
  put('apps/web/lib/g678-nms-l01-p002.server.ts',`const id='${ids[0]}'; const page={presentation:Object.freeze({pageInteractionCompanionTargetIdSuffix:'terminal-source-v1-readable'})};`);
  put('apps/web/lib/g678-nms-l01-story.server.ts',`const id='${ids[1]}'; const page={presentation:Object.freeze({pageInteractionCompanionTargetIdSuffix:'terminal-source-v1-readable'})};`);
  refresh();
  return {root,ids,registry,packets,put,refresh,refreshPacket,dispose:()=>fs.rmSync(root,{recursive:true})};
}

test('current P001/P002/P003 source metadata reads without renewing old all-packet admission',()=>{
  const result=readG678CourseRuntimeBindings(actualRoot,['shared-nms002-l01-p001','shared-nms002-l01-p002','shared-nms002-l01-p003']);
  assert.equal(result.status,'ready');
  const p002=result.rows[1];assert.equal(p002.overlay.rendererAvailability.runtimeQuery.frameDomain,'sprite-722');
  assert.equal(p002.overlay.presentation.pageInteractionCompanionTargetIdSuffix,'terminal-source-v1-readable');assert.equal(p002.glossaryEntries.length,3);
  assert.equal(p002.historicalAdmission.status,'not-revalidated');assert.equal(result.acceptanceEffects.technicalPassed,false);
});
test('missing historical build pin is an explicit unvalidated old gate, not source metadata success claim',()=>{
  const f=fixture();try{const r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.status,'ready');assert.equal(r.rows[0].historicalAdmission.inputPinsDeclared,1);assert.equal(r.rows[0].historicalAdmission.status,'not-revalidated');}finally{f.dispose();}
});
test('changed page artifact fails only that page',()=>{
  const f=fixture();try{f.put(f.registry.calibrations[0].entries[0].artifacts.module.path,'changed');const r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.rows[0].status,'failed');assert.equal(r.rows[1].status,'ready');assert.equal(r.status,'partial');}finally{f.dispose();}
});
test('changing immutable packet bytes cannot be hidden by otherwise matching artifacts',()=>{
  const f=fixture();try{fs.appendFileSync(path.join(f.root,f.registry.calibrations[0].freezeManifest),' ');const r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.rows[0].status,'failed');assert.equal(r.rows[1].status,'ready');}finally{f.dispose();}
});
test('wrong or duplicate selected source identity fails after registry/dispatch binds the packet',()=>{
  const f=fixture();try{f.packets[0].selectedPages[0].sourceSha256='e'.repeat(64);f.refreshPacket(0);let r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.rows[0].status,'failed');assert.equal(r.rows[1].status,'ready');f.packets[0].selectedPages[0].sourceSha256=sha256(source);f.packets[0].selectedPages.push(f.packets[0].selectedPages[0]);f.refreshPacket(0);r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.rows[0].status,'failed');}finally{f.dispose();}
});
test('dispatch drift fails shared prerequisite for every selected page',()=>{
  const f=fixture();try{fs.appendFileSync(path.join(f.root,DISPATCH[0]),'// drift');const r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.registry.status,'failed');assert(r.rows.every(row=>row.status==='failed'));}finally{f.dispose();}
});
test('presentation reader reads pinned literals and does not execute server source',()=>{
  const f=fixture();try{f.put('apps/web/lib/g678-nms-l01-p002.server.ts',`globalThis.__metadataSourceExecuted=true; const id='${f.ids[0]}'; const page={presentation:Object.freeze({pageInteractionCompanionTargetIdSuffix:'terminal-source-v1-readable'})};`);const r=readG678PresentationMetadata(f.root,f.ids[0]);assert.equal(r.status,'existing-source-extender-literals');assert.equal(globalThis.__metadataSourceExecuted,undefined);}finally{f.dispose();}
});

function successor(f,mutate=()=>{}) {
  const previous=structuredClone(f.packets[0]);previous.calibrationId+='-predecessor';
  const predecessorFreeze=f.put('catalog/test-predecessor.json',previous);
  f.packets[0].predecessorFreeze=predecessorFreeze;
  f.packets[0].selectedPages[0].runtime={canvasRenderer:previous.selectedPages[0].runtime.canvasRenderer};
  mutate(previous,predecessorFreeze);f.refreshPacket(0);return predecessorFreeze;
}
test('successor inherits exact predecessor query and retains its pin without revalidating old admission',()=>{
  const f=fixture();try{const pin=successor(f),r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.status,'ready');assert.equal(r.rows[0].overlay.rendererAvailability.runtimeQuery.frameDomain,'sprite-722');assert(r.rows[0].inputPins.some(p=>exactPin(p,pin)));assert.equal(r.rows[0].historicalAdmission.status,'not-revalidated');}finally{f.dispose();}
});
const exactPin=(a,b)=>a.path===b.path&&a.sha256===b.sha256&&a.bytes===b.bytes;
test('changed predecessor bytes fail only the dependent page',()=>{
  const f=fixture();try{const pin=successor(f);fs.appendFileSync(path.join(f.root,pin.path),' ');const r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.rows[0].status,'failed');assert.equal(r.rows[1].status,'ready');assert.match(r.rows[0].error,/current bytes/);}finally{f.dispose();}
});
test('a predecessor for a different placement or source is rejected',()=>{
  for(const change of [p=>p.selectedPages[0].animationId='shared-nms002-l01-p099',p=>p.entry.key='shared-nms002-l01-p099',p=>p.selectedPages[0].sourceSha256='d'.repeat(64)]) {
    const f=fixture();try{successor(f,(p,pin)=>{change(p);Object.assign(pin,f.put(pin.path,p));});const r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.rows[0].status,'failed');assert.equal(r.rows[1].status,'ready');}finally{f.dispose();}
  }
});
test('a conflicting successor frame domain is not a permitted metadata override',()=>{
  const f=fixture();try{successor(f);f.packets[0].selectedPages[0].runtime.frameDomain='sprite-999';f.refreshPacket(0);const r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.rows[0].status,'failed');assert.match(r.rows[0].error,/conflicting frozen runtime frameDomain/);}finally{f.dispose();}
});
test('self predecessor cannot recurse past its pinned path',()=>{
  const f=fixture();try{f.packets[0].predecessorFreeze={path:f.registry.calibrations[0].freezeManifest,bytes:1,sha256:'c'.repeat(64)};f.refreshPacket(0);const r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.rows[0].status,'failed');assert.match(r.rows[0].error,/acyclic/);}finally{f.dispose();}
});
function hfr(f) {
  const packet=f.packets[0],selected=packet.selectedPages[0],entry=packet.entry,id=entry.key;
  const member=`work/g678-shared-page-factory/hfr-ts-unit/members/${id}`;
  entry.artifacts={kind:'generated-typescript-hfr-v1',module:entry.artifacts.module,
    generated:f.put(`packages/demos/src/hfr-pages/${id}.ts`,'UNIT TEST ONLY HFR generated'),
    data:f.put(`${member}/${id}.data.json`,{unit:true}),closure:f.put(`${member}/artifact-closure.json`,{unit:true})};
  packet.runtimeQuery={frameDomain:'root',language:'fixed-en',scenario:'hfr',seed:'0'};
  packet.meta={key:id,sourceSha256:sha256(source)};
  delete selected.sourceSha256;selected.runtime={rendererBinding:entry.artifacts};
  f.registry.calibrations[0].entries[0]=entry;f.refreshPacket(0);
}
test('HFR top-level source/meta/runtimeQuery retains exact renderer artifacts',()=>{
  const f=fixture();try{hfr(f);const r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.status,'ready');assert.deepEqual(r.rows[0].overlay.rendererAvailability.runtimeQuery,f.packets[0].runtimeQuery);assert(r.rows[0].inputPins.some(p=>p.path.endsWith('artifact-closure.json')));}finally{f.dispose();}
});
test('HFR top-level source identity, query conflict and renderer binding drift are rejected',()=>{
  const changes=[p=>p.meta.key='shared-nms002-l01-p099',p=>p.meta.sourceSha256='d'.repeat(64),p=>p.selectedPages[0].runtime.frameDomain='sprite-999',p=>p.selectedPages[0].runtime.rendererBinding={...p.entry.artifacts,kind:'maintained-dom-module-v1'}];
  for(const change of changes){const f=fixture();try{hfr(f);change(f.packets[0]);f.refreshPacket(0);const r=readG678CourseRuntimeBindings(f.root,f.ids);assert.equal(r.rows[0].status,'failed');assert.equal(r.rows[1].status,'ready');}finally{f.dispose();}}
});
test('source XML accepts recorded absolute and HFR module-relative paths only when exact bytes and path bind',()=>{
  for(const sourcePath of [path.join(sourceRoot,'G6-G8-shared/NMS002/L1/index.xml'),'NMS002/L1/index.xml']) {
    const f=fixture();try{f.packets[0].sourceXml.path=sourcePath;f.refreshPacket(0);assert.equal(readG678CourseRuntimeBindings(f.root,f.ids).status,'ready');f.packets[0].sourceXml.path='/unrelated/NMS002/L1/index.xml';f.refreshPacket(0);assert.equal(readG678CourseRuntimeBindings(f.root,f.ids).rows[0].status,'failed');}finally{f.dispose();}
  }
});
test('missing language has no default and descriptive source-en needs an inspected maintained host',()=>{
  for(const language of [undefined,'source-en']){const f=fixture();try{f.packets[0].selectedPages[0].runtime.language=language;f.refreshPacket(0);assert.equal(readG678CourseRuntimeBindings(f.root,f.ids).rows[0].status,'failed');}finally{f.dispose();}}
});
test('ALG host literals are not executed and preserve query plus presentation',()=>{
  const f=fixture();try{f.put('apps/web/lib/g678-alg-l06-p002.server.ts',`globalThis.__algHostExecuted=true; const ID='shared-alg001-l06-p002'; const page={runtimeQuery:Object.freeze({frameDomain:'sprite-370',language:'fixed-en',scenario:'source-static-frame',seed:'0'}),presentation:Object.freeze({pageInteractionCompanionTargetIdSuffix:'terminal-source-v1-readable'})};`);const r=readG678HostMetadata(f.root,'shared-alg001-l06-p002');assert.equal(globalThis.__algHostExecuted,undefined);assert.equal(r.runtimeQuery.frameDomain,'sprite-370');assert.equal(r.presentation.pageInteractionCompanionTargetIdSuffix,'terminal-source-v1-readable');assert.equal(r.pins.length,1);}finally{f.dispose();}
});
test('ambiguous, missing and duplicate ALG query literals are rejected',()=>{
  const f=fixture();try{const good=`const ID='shared-alg001-l06-p002'; const page={runtimeQuery:Object.freeze({frameDomain:'sprite-370',language:'fixed-en',scenario:'source-static-frame',seed:'0'})};`;
    for(const text of [good.replace("language:'fixed-en',",''),good+good.replace("frameDomain:'sprite-370'","frameDomain:'root'"),good.replace("seed:'0'","seed:'0',seed:'1'")]){f.put('apps/web/lib/g678-alg-l06-p002.server.ts',text);assert.throws(()=>readG678HostMetadata(f.root,'shared-alg001-l06-p002'));}
  }finally{f.dispose();}
});
test('ALG imported identity is read, pinned, and checked against the requested placement',()=>{
  const f=fixture();try{f.put('apps/web/lib/alg-l06-p035-source-projection-v1.server.ts',`import {P035_ID as ID} from './alg-l06-p035-preview-policy-v1'; const page={runtimeQuery:Object.freeze({frameDomain:'sprite-227',language:'fixed-en',scenario:'source-static-frame',seed:'0'})};`);const file='apps/web/lib/alg-l06-p035-preview-policy-v1.ts';f.put(file,"export const P035_ID='shared-alg001-l06-p035';");const r=readG678HostMetadata(f.root,'shared-alg001-l06-p035');assert.equal(r.pins.length,2);f.put(file,"export const P035_ID='shared-alg001-l06-p036';");assert.throws(()=>readG678HostMetadata(f.root,'shared-alg001-l06-p035'),/exact imported page identity/);}finally{f.dispose();}
});
test('current ALG decoder successor, HFR and registered DOM metadata remain page-specific',()=>{
  const ids=['shared-alg001-l06-p002','shared-alg001-l06-p029','shared-alg001-l06-p060'];const r=readG678CourseRuntimeBindings(actualRoot,ids);assert.equal(r.status,'ready');
  assert.deepEqual(r.rows.map(row=>row.overlay.rendererAvailability.runtimeQuery.frameDomain),['sprite-370','root','sprite-973']);
  assert.deepEqual(r.rows.map(row=>row.overlay.rendererAvailability.runtimeQuery.scenario),['source-static-frame','hfr','source-quiz']);
  assert.equal(r.rows[0].overlay.presentation.pageInteractionCompanionTargetIdSuffix,'terminal-source-v1-readable');
  assert(r.rows[0].inputPins.some(pin=>pin.path==='catalog/product-bridge-calibrations/g678-alg-l06-p002-current-js-v2.json'));
  assert.equal(r.acceptanceEffects.technicalPassed,false);
});
