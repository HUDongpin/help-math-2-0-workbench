import assert from 'node:assert/strict';
import {after, test} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DISPATCH, REGISTRY, pinFile, readJsonPin, readPin, registrySources, verifyAdmission} from './g678-admission-proof.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const activation=fs.readFileSync(path.join(root,'apps/web/lib/g678-admission-activation.ts'),'utf8');
const indexPin=JSON.parse(activation.slice(activation.indexOf('=')+1,activation.lastIndexOf(' as const;')));
const index=readJsonPin(root,indexPin), host=readJsonPin(root,index.host);
const proofs=index.pages.map(page=>readJsonPin(root,page.proof));
// The real proof closure includes large retained browser evidence. Keep its
// disposable copy on the source volume and use APFS copy-on-write when available.
const fixtureParent=path.join(root,'work');fs.mkdirSync(fixtureParent,{recursive:true});
const fixture=fs.realpathSync(fs.mkdtempSync(path.join(fixtureParent,'g678-proof-test-')));
after(()=>fs.rmSync(fixture,{recursive:true,force:true}));
const paths=new Set([indexPin.path,index.host.path,...index.pages.map(p=>p.proof.path),
 ...host.files.map(p=>p.path),...(host.legacyInputTransitions??[]).map(t=>t.snapshot.path),
 ...(host.legacyPageHostPromotions??[]).map(t=>t.snapshot.path),
 ...proofs.flatMap(p=>p.files.map(p=>p.path)),REGISTRY,...DISPATCH]);
try {for(const relative of paths) {
 fs.mkdirSync(path.dirname(path.join(fixture,relative)),{recursive:true});
 fs.copyFileSync(path.join(root,relative),path.join(fixture,relative),fs.constants.COPYFILE_FICLONE);
}
 // Empty source-bound media directories are part of HFR's exact closure too.
 for(const proof of proofs)if(proof.packet.entry.artifacts.kind==='generated-typescript-hfr-v1') {
  const media=path.join(path.dirname(proof.packet.entry.artifacts.data.path),'media');
  assert(fs.lstatSync(path.join(root,media)).isDirectory(),'original HFR media directory exists');
  fs.mkdirSync(path.join(fixture,media),{recursive:true});
 }
} catch(error) {fs.rmSync(fixture,{recursive:true,force:true});throw error;}
function changed(relative,body,check) {
 const file=path.join(fixture,relative), before=fs.readFileSync(file);
 try {fs.writeFileSync(file,body);check();} finally {fs.writeFileSync(file,before);}
}
function transaction(registry,check) {
 const rendered=registrySources(registry);
 changed(REGISTRY,JSON.stringify(registry),()=>changed(DISPATCH[0],rendered[0],()=>changed(DISPATCH[1],rendered[1],check)));
}
test('real serialized producer output passes the common reader',()=>{
 assert.equal(Object.keys(verifyAdmission(fixture,indexPin).packets).length,index.pages.length);
});
test('unrelated registration plus real generated outputs leaves every old proof byte unchanged',()=>{
 const before=index.pages.map(p=>pinFile(fixture,p.proof.path));
 const registry=JSON.parse(fs.readFileSync(path.join(fixture,REGISTRY),'utf8'));
 const extra=structuredClone(proofs[2].registration);
 extra.calibrationId='g678-unrelated-transaction-test';extra.entries[0].key='shared-test-unrelated-p001';
 registry.calibrations.push(extra);
 transaction(registry,()=>assert.equal(Object.keys(verifyAdmission(fixture,indexPin).packets).length,index.pages.length));
 assert.deepEqual(index.pages.map(p=>pinFile(fixture,p.proof.path)),before);
});
test('changing an admitted registration is rejected even with canonical regenerated files',()=>{
 const registry=JSON.parse(fs.readFileSync(path.join(fixture,REGISTRY),'utf8'));
 registry.calibrations.find(c=>c.calibrationId===proofs[0].registration.calibrationId).entries[0].complexityLane='low';
 transaction(registry,()=>assert.throws(()=>verifyAdmission(fixture,indexPin),/exact own registration/));
});
test('dispatch body or production guard tampering is rejected',()=>{
 const file=DISPATCH[0], body=fs.readFileSync(path.join(fixture,file),'utf8').replace("=== 'production'","=== 'never'");
 changed(file,body,()=>assert.throws(()=>verifyAdmission(fixture,indexPin),/canonical registry output/));
});
for(const [name,select] of [
 ['native renderer',p=>p.path==='packages/demos/src/alg-l12-p010-typography.ts'],
 ['real producer-reader closure',p=>p.path==='scripts/prepare-g678-alg-l12-p009-typography-binding.mts'],
 ['historical observation',p=>p.path.includes('output/') && p.path.endsWith('.png')],
 ['shared host',p=>p.path==='apps/web/lib/g678-split-admission.server.ts'],
]) test(`${name} drift still fails closed`,()=>{
 const pin=[...host.files,...proofs.flatMap(p=>p.files)].find(select);assert(pin,`fixture has ${name}`);
 changed(pin.path,Buffer.from('corrupted'),()=>assert.throws(()=>verifyAdmission(fixture,indexPin),/current bytes/));
});
test('source bytes are verified with physical path and digest checks',()=>{
 const source=proofs[0].external[0], relative='source-copy.swf';
 fs.writeFileSync(path.join(fixture,relative),readPin(source.root,source.pin));
 const pin={...source.pin,path:relative};readPin(fixture,pin);
 changed(relative,'changed source',()=>assert.throws(()=>readPin(fixture,pin),/current bytes/));
});
test('page-proof omission is rejected by the frozen index',()=>{
 const proof=structuredClone(proofs[1]);proof.files.pop();
 changed(index.pages[1].proof.path,JSON.stringify(proof),()=>assert.throws(()=>verifyAdmission(fixture,indexPin),/current bytes/));
});
test('symlinked evidence is rejected',()=>{
 const pin=proofs[0].files[0], file=path.join(fixture,pin.path), bytes=fs.readFileSync(file);
 fs.unlinkSync(file);fs.symlinkSync(path.join(root,pin.path),file);
 try {assert.throws(()=>verifyAdmission(fixture,indexPin),/physical path/);}
 finally {fs.unlinkSync(file);fs.writeFileSync(file,bytes);}
});
