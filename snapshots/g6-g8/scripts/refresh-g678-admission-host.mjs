#!/usr/bin/env node
/** Host changes create a new version; page proof bytes and dates stay intact. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile,readPin,readJsonPin,uniquePins,verifyAdmission,verifyLegacyPageHostPromotions,
 LEGACY_PAGE_HOST_PROMOTION_PATHS,admissionArtifactPins} from '../lib/g678-admission-proof.mjs';
export function preservedHostTransitions(root,host,changed,preserved=[]) {
 assert(new Set(preserved.map(p=>p.path)).size===preserved.length,'distinct preservation paths');
 assert(preserved.every(p=>changed.includes(p.path)),'preserve only reviewed changes');
 const transitions=(host.legacyInputTransitions??[]).map(t=>changed.includes(t.current.path)?
  {...t,current:pinFile(root,t.current.path)}:t);
 for(const item of preserved) {
  const original=host.files.find(p=>p.path===item.path);
  assert(original,'preserved input belongs to predecessor host');
  const snapshot=pinFile(root,item.snapshot);
  assert(snapshot.bytes===original.bytes&&snapshot.sha256===original.sha256,'snapshot retains exact predecessor bytes');
  readPin(root,snapshot);
  if(!transitions.some(t=>t.original.path===original.path&&t.original.bytes===original.bytes&&t.original.sha256===original.sha256))
   transitions.push({original,current:pinFile(root,item.path),snapshot});
 }
 const originals=new Set();
 for(const transition of transitions) {
  const {original,current,snapshot}=transition;
  const identity=JSON.stringify([original.path,original.bytes,original.sha256]);
  assert(!originals.has(identity),'one transition per exact historical host pin');originals.add(identity);
  assert(current.path===original.path&&snapshot.path!==original.path,'exact shared target and distinct snapshot');
  const target=host.files.filter(pin=>pin.path===current.path);
  // Some old route transitions survive a later removal from host membership.
  // Preserve and verify those unchanged records without adding the route back.
  assert(target.length<=1&&(!changed.includes(current.path)||target.length===1),'changed transition belongs to predecessor host');
  if(target.length)assert.deepEqual(current,changed.includes(current.path)?pinFile(root,current.path):target[0],'exact successor transition target');
  assert(snapshot.bytes===original.bytes&&snapshot.sha256===original.sha256,'snapshot retains exact historical host bytes');
  readPin(root,current);readPin(root,snapshot);
 }
 return transitions;
}
export function preservedPageHostPromotions(root,host,proofs,changed,added,preserved=[]) {
 assert(new Set(preserved.map(p=>p.path)).size===preserved.length,'distinct page-host preservation paths');
 const pagePaths=new Set(proofs.flatMap(proof=>proof.files.map(pin=>pin.path)));
 const overlaps=added.filter(file=>pagePaths.has(file));
 assert.deepEqual([...preserved.map(p=>p.path)].sort(),[...overlaps].sort(),
  'exact preservation for newly promoted page-owned shared inputs');
 const transitions=(host.legacyPageHostPromotions??[]).map(t=>changed.includes(t.current.path)?
  {...t,current:pinFile(root,t.current.path)}:t);
 for(const item of preserved) {
  assert(LEGACY_PAGE_HOST_PROMOTION_PATHS.includes(item.path),'reviewed legacy shared path only');
  assert(!host.files.some(pin=>pin.path===item.path),'promotion is a new host input');
  assert(!transitions.some(t=>t.original.path===item.path),'one historical pin per promoted shared path');
  const owners=proofs.filter(proof=>proof.files.some(pin=>pin.path===item.path));
  assert(owners.length>0,'retained page proof owns the shared input');
  for(const proof of owners) {
   assert(proof.packet.entry.artifacts.kind!=='generated-typescript-hfr-v1','HFR page inputs cannot use legacy page-host promotion');
   assert(![...admissionArtifactPins(proof.packet.entry),proof.packet.freezeManifest].some(pin=>pin.path===item.path),
    'page artifacts cannot be promoted into the host');
  }
  const originals=uniquePins(owners.flatMap(proof=>proof.files.filter(pin=>pin.path===item.path)));
  assert(originals.length===1,'one historical pin per promoted shared path');
  const original=originals[0],snapshot=pinFile(root,item.snapshot);
  for(const proof of owners)
   assert.deepEqual(uniquePins(proof.legacyInputs.filter(pin=>pin.path===item.path)),[original],
    'promoted source remains in exact legacy input closure');
  assert(snapshot.bytes===original.bytes&&snapshot.sha256===original.sha256,'snapshot retains exact page-owned bytes');
  transitions.push({original,current:pinFile(root,item.path),snapshot});
 }
 const files=uniquePins([...host.files.map(pin=>changed.includes(pin.path)?pinFile(root,pin.path):pin),...added.map(file=>pinFile(root,file))]);
 verifyLegacyPageHostPromotions(root,{...host,files,legacyPageHostPromotions:transitions});
 return transitions;
}
function main() {
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [version,...raw]=process.argv.slice(2),preserveAt=raw.indexOf('--preserve');
assert(preserveAt<0||preserveAt===raw.length-2,'--preserve <json> must be last');
const preserved=preserveAt<0?[]:JSON.parse(fs.readFileSync(path.join(root,raw[preserveAt+1]),'utf8'));
const args=preserveAt<0?raw:raw.slice(0,preserveAt),separator=args.indexOf('--add');
const changed=separator<0?args:args.slice(0,separator),added=separator<0?[]:args.slice(separator+1);
assert(/^v(?:[2-9]|[1-9][0-9]+)$/.test(version) && changed.length+added.length>0,'version and exact reviewed host paths required');
const activation=fs.readFileSync(path.join(root,'apps/web/lib/g678-admission-activation.ts'),'utf8');
const indexPin=JSON.parse(activation.slice(activation.indexOf('=')+1,activation.lastIndexOf(' as const;')));
const index=readJsonPin(root,indexPin),host=readJsonPin(root,index.host);
assert(changed.every(file=>host.files.some(p=>p.path===file)),'only existing host inputs');
assert(new Set(added).size===added.length && added.every(file=>!host.files.some(p=>p.path===file)),'only distinct new host inputs after --add');
const proofs=index.pages.map(page=>readJsonPin(root,page.proof));
assert(preserved.every(item=>changed.includes(item.path)||added.includes(item.path)),'preserve only reviewed host delta');
const promotions=preservedPageHostPromotions(root,host,proofs,changed,added,preserved.filter(item=>added.includes(item.path)));
const actual=host.files.filter(p=>JSON.stringify(pinFile(root,p.path))!==JSON.stringify(p)).map(p=>p.path).sort();
assert.deepEqual(actual,[...new Set(changed)].sort(),'exact reviewed host delta');
const write=(file,value)=>{fs.writeFileSync(path.join(root,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});return pinFile(root,file);};
const nextHost=write(`catalog/g678-admission-v1/host-${version}.json`,{...host,previous:index.host,
 legacyInputTransitions:preservedHostTransitions(root,host,changed,preserved.filter(item=>changed.includes(item.path))),
 legacyPageHostPromotions:promotions,
 files:uniquePins([...host.files.map(p=>changed.includes(p.path)?pinFile(root,p.path):p),...added.map(file=>pinFile(root,file))])});
const nextIndex=write(`catalog/g678-admission-v1/index-${version}.json`,{...index,host:nextHost});
verifyAdmission(root,nextIndex);
fs.writeFileSync(path.join(root,'apps/web/lib/g678-admission-activation.ts'),
 '// Reviewed split-proof activation. Generated by the admission build, not a page renderer.\nexport const G678_ADMISSION_INDEX = '+JSON.stringify(nextIndex,null,2)+' as const;\n');
console.log(JSON.stringify({index:nextIndex,changed,added,pageProofsUnchanged:index.pages.length}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
