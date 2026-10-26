import {currentTypographyHostBinding,resolveTypographyHostClosurePins} from '../lib/g678-typography-host-successor.server';
import test from 'node:test';
import assert from 'node:assert/strict';
import {realpathSync} from 'node:fs';
import {G678_P044_AUTHORITY,G678_P044_CANDIDATE,G678_P044_FREEZE,G678_P044_GLOSSARY,G678_P044_PREDECESSOR,
  G678_P044_ID,G678_P044_SUFFIX,G678_P044_WITNESS,readG678P044FileBinding,readG678P044PhysicalPin,resolveG678P044PhysicalPath,validateG678P044Authority,validateG678P044PhysicalClosure} from '../lib/g678-nms-l01-p044-authority.server';
const root=realpathSync(new URL('../../../',import.meta.url));
function fixture(){const read=(pin:Parameters<typeof readG678P044FileBinding>[1])=>readG678P044FileBinding(root,pin);
  return{authority:read(G678_P044_AUTHORITY),candidate:read(G678_P044_CANDIDATE),predecessor:read(G678_P044_PREDECESSOR),freeze:read(G678_P044_FREEZE),glossary:read(G678_P044_GLOSSARY)};}
test('canonical379 admits exact p044 with original compiler origin and stable177-file input lineage',()=>{
  const input=fixture(),before=JSON.stringify(input),result=validateG678P044Authority(input);assert.equal(JSON.stringify(input),before);
  assert.equal(result.entry.key,G678_P044_ID);assert.equal(result.entry.runtimeContract.frameCount,759);assert.equal(result.entry.runtimeContract.livePlaybackEndFrame,756);
  assert.deepEqual(result.entry.runtimeContract.lessonHostCapabilities,['glossary','practice-feedback']);assert.equal(result.proposedPresentation.pageInteractionCompanionTargetIdSuffix,G678_P044_SUFFIX);
  assert.ok(result.compilerRun.path.includes('current-js-v1/'));assert.ok(result.validationRun.path.includes('current-js-v2/'));
  assert.deepEqual(result.glossaryEntries.map(e=>(e as {id:string}).id),['multiplication','solve','total']);
  assert.ok(result.physicalPins.some(p=>p.path===G678_P044_WITNESS.path));assert.ok(!result.physicalPins.some(p=>p.path==='packages/demos/private-current-js-registry.json'));
});
test('all canonical envelopes reject alias, size/hash or value mutation',()=>{
  for(const key of['authority','candidate','predecessor','freeze','glossary'] as const)for(const change of['path','bytes','sha256','value']){
    const input=fixture(),b=input[key];
    if(change==='path')input[key]={...b,path:b.path+'.alias'};if(change==='bytes')input[key]={...b,bytes:b.bytes+1};
    if(change==='sha256')input[key]={...b,sha256:'0'.repeat(64)};if(change==='value')input[key]={...b,value:{...b.value as object,accepted:true}};
    assert.throws(()=>validateG678P044Authority(input),/P044_AUTHORITY_INVALID/);
  }
});
test('old page edits, new page gates and scope changes cannot borrow frozen379 authority',()=>{
  for(const mutate of[(f:any)=>f.selectedPages[0].runtime.seed='3',(f:any)=>f.selectedPages.reverse(),(f:any)=>f.selectedPages.find((p:any)=>p.animationId===G678_P044_ID).productCalibrationPassed=true,
    (f:any)=>f.registrationCandidatePlacementCount=380]){const input=fixture();mutate(input.freeze.value);assert.throws(()=>validateG678P044Authority(input),/canonical bytes/);}
});
test('actual physical closure rehashes source, decoded-art inputs, package and immutable witness',()=>{
  const result=validateG678P044Authority(fixture());
  const successor=currentTypographyHostBinding(root);
  if(successor)assert.throws(()=>validateG678P044PhysicalClosure(root,result),/physical drift/);
  const paths=successor?resolveTypographyHostClosurePins(root,result.physicalPins).map(p=>{readG678P044PhysicalPin(root,p);return resolveG678P044PhysicalPath(root,p.path);}):validateG678P044PhysicalClosure(root,result);assert.ok(paths.length>=177);
  assert.ok(paths.some(p=>p.endsWith('L1TS08.swf')));assert.ok(paths.some(p=>p.endsWith('g678-current-js-378-private-registry-witness-v1.json')));
});
