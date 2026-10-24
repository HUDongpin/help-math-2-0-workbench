import {createHash} from 'node:crypto';
import {lstatSync} from 'node:fs';
import {isDeepStrictEqual as exact} from 'node:util';
import {G678_P044_ID,G678_P044_FREEZE,G678_P044_AUTHORITY,G678_P044_CANDIDATE,G678_P044_PREDECESSOR,G678_P044_GLOSSARY,
  validateG678P044Authority,readG678P044FileBinding,readG678P044PhysicalPin,resolveG678P044PhysicalPath,type P044Binding,type P044Pin} from './g678-nms-l01-p044-authority.server';
export const G678_P044_REPAIR_TYPE='g678-nms-l01-p044-live-clock-current-js-fragment-v3';
export const G678_P044_REPAIR_AUTHORITY=Object.freeze({path:'catalog/product-bridge-calibrations/g678-nms-l01-p044-live-clock-current-js-v3.fragment.json',bytes:9153,sha256:'48312fa2a9fba4c1c342e23a3d5b5b77258ce7fb17b699834e57d5b914504575'});
export const G678_P044_REPAIR_CANDIDATE=Object.freeze({path:'catalog/g678-nms-l01-p044-live-clock-candidate-v3.json',bytes:65368,sha256:'efa0bc20a5f8601c0fb2287da22b28f8105cca366d7e30ce86555efd6783e251'});
export const G678_P044_REPAIR_FREEZE=Object.freeze({path:'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.json',bytes:2428383,sha256:'949572a4abc466d30d6bb7ffd52ab3b61f57f7f7dd7497ed5c224b931a88af4d'});
export const G678_P044_REPAIR_REGISTRY=Object.freeze({path:'packages/demos/private-current-js-registry.json',bytes:433976,sha256:'8a9d076d3b8c781e3255163216666e644488f159bbb2eaff41b479a8802b9c0e'});
const RUN=Object.freeze({path:'work/g678-shared-page-factory/g678-nms-l01-p044-live-clock-current-js-v3/run-manifest.json',bytes:58646,sha256:'38c6e57a670df7c7fc4ad9479e7fefa34acdba4b47031fe59da63c22ea05f88a'});
export type P044RepairLineage=Readonly<{predecessor:P044Binding;baseAuthority:P044Binding;baseCandidate:P044Binding}>;
type Json=Record<string,unknown>;
const record=(v:unknown):Json=>v&&typeof v==='object'&&!Array.isArray(v)?v as Json:{};
function requireThat(v:unknown,message:string):asserts v{if(!v)throw Error(`G678_P044_REPAIR_AUTHORITY_INVALID: ${message}`);}
function canonical(v:P044Binding|undefined,p:P044Pin){requireThat(v&&exact(Object.keys(v).sort(),['bytes','path','sha256','value'])&&v.path===p.path&&v.bytes===p.bytes&&v.sha256===p.sha256,`binding ${p.path}`);
  const b=Buffer.from(JSON.stringify(v.value,null,2)+'\n');requireThat(b.length===p.bytes&&createHash('sha256').update(b).digest('hex')===p.sha256,`canonical ${p.path}`);return record(v.value);}
function pin(v:unknown):P044Pin{const p=record(v);requireThat(typeof p.path==='string'&&Number.isSafeInteger(p.bytes)&&Number(p.bytes)>0&&typeof p.sha256==='string'&&/^[a-f0-9]{64}$/.test(p.sha256),'invalid physical pin');return{path:p.path,bytes:Number(p.bytes),sha256:p.sha256};}
export function validateG678P044RepairAuthority(input:{authority:P044Binding;candidate:P044Binding|undefined;predecessor:P044Binding|undefined;freeze:P044Binding;glossary:P044Binding|undefined;lineage:P044RepairLineage|undefined}){
  const a=canonical(input.authority,G678_P044_REPAIR_AUTHORITY),c=canonical(input.candidate,G678_P044_REPAIR_CANDIDATE),f=canonical(input.freeze,G678_P044_REPAIR_FREEZE);
  requireThat(input.lineage&&exact(Object.keys(input.lineage).sort(),['baseAuthority','baseCandidate','predecessor']),'separate immutable base lineage');
  const prior=canonical(input.lineage.predecessor,G678_P044_FREEZE);canonical(input.lineage.baseAuthority,G678_P044_AUTHORITY);canonical(input.lineage.baseCandidate,G678_P044_CANDIDATE);
  const base=validateG678P044Authority({authority:input.lineage.baseAuthority,candidate:input.lineage.baseCandidate,predecessor:input.predecessor,freeze:input.lineage.predecessor,glossary:input.glossary});
  requireThat(a.artifactType===G678_P044_REPAIR_TYPE&&exact(a.baseSourceAuthority,G678_P044_AUTHORITY)&&exact(a.candidateManifest,G678_P044_REPAIR_CANDIDATE)&&exact(a.compilerRun,RUN),'exact repair package');
  requireThat(Array.isArray(a.entries)&&a.entries.length===1,'one repair entry');const entry=record(a.entries[0]);
  requireThat(entry.key===G678_P044_ID&&entry.module==='./modules/g678-nms-l01-live-clock-current-js-p044'&&entry.adapterFamily===base.entry.adapterFamily,'exact repair module');
  const original=record((record(input.lineage.baseAuthority.value).entries as unknown[])[0]);
  for(const key of['runtimeContract','source','proposedPresentation','acceptanceEffects'])requireThat(exact(entry[key],original[key]),`preserved ${key}`);
  for(const value of[a.acceptanceEffects,c.gates,f.acceptanceEffects]){const gates=Object.values(record(value));requireThat(gates.length>0&&gates.every(v=>v===false),'independent gates');}
  requireThat(Array.isArray(f.selectedPages)&&Array.isArray(prior.selectedPages)&&f.selectedPages.length===379&&prior.selectedPages.length===379&&
    exact(f.selectedPages.filter(p=>record(p).animationId!==G678_P044_ID),prior.selectedPages.filter(p=>record(p).animationId!==G678_P044_ID)),'all378 other pages unchanged');
  const selected=record(f.selectedPages.find(p=>record(p).animationId===G678_P044_ID)),{rendererBinding,...flat}=record(selected.runtime);
  requireThat(exact(flat,base.entry.runtimeContract)&&exact(rendererBinding,{kind:'maintained-dom-module-v1',module:entry.moduleFile,timeline:entry.timeline,memberManifest:entry.memberManifest,sourceRun:RUN}), 'same runtime, exact new renderer');
  requireThat(selected.productCalibrationPassed===false&&selected.engineeringPreviewReady===false&&f.productCalibrationPassed===false&&f.scaleOutAuthorized===false,'pending product gates');
  requireThat(Array.isArray(c.physicalFiles)&&c.physicalFiles.length===258,'explicit258 physical inputs');const physical=c.physicalFiles.map(pin);
  requireThat(!physical.some(p=>p.path===G678_P044_REPAIR_REGISTRY.path||p.path==='apps/web/lib/g678-calibration-product-bridge.server.ts'),'mutable predecessor references excluded');
  const witnesses=c.historicalInputWitnesses;requireThat(Array.isArray(witnesses)&&witnesses.length===2,'two exact witness mappings');
  const normalizedEntry:Json&{runtimeContract:typeof base.entry.runtimeContract}={...entry,runtimeContract:base.entry.runtimeContract};
  return{...base,entry:normalizedEntry,compilerRun:RUN,validationRun:RUN,historicalWitnesses:witnesses.map(w=>pin(record(w).physicalWitness)),
    physicalPins:Object.freeze([...new Map([...base.physicalPins,...physical,G678_P044_REPAIR_AUTHORITY,G678_P044_REPAIR_CANDIDATE,G678_P044_REPAIR_FREEZE,RUN,
      pin(entry.moduleFile),pin(entry.timeline),pin(entry.memberManifest)].map(p=>[p.path,p])).values()])};
}
export function readG678P044RepairLineage(root:string):P044RepairLineage{return{predecessor:readG678P044FileBinding(root,G678_P044_FREEZE),
  baseAuthority:readG678P044FileBinding(root,G678_P044_AUTHORITY),baseCandidate:readG678P044FileBinding(root,G678_P044_CANDIDATE)};}
export function readG678P044RepairPackage(root:string){return{authority:readG678P044FileBinding(root,G678_P044_REPAIR_AUTHORITY),candidate:readG678P044FileBinding(root,G678_P044_REPAIR_CANDIDATE),
  predecessor:readG678P044FileBinding(root,G678_P044_PREDECESSOR),freeze:readG678P044FileBinding(root,G678_P044_REPAIR_FREEZE),glossary:readG678P044FileBinding(root,G678_P044_GLOSSARY),lineage:readG678P044RepairLineage(root)};}
export function validateG678P044RepairPhysicalClosure(root:string,validated:ReturnType<typeof validateG678P044RepairAuthority>){
  for(const p of validated.physicalPins)readG678P044PhysicalPin(root,p);
  for(const p of validated.historicalWitnesses)requireThat((lstatSync(resolveG678P044PhysicalPath(root,p.path)).mode&0o222)===0,'read-only predecessor witness');
  return validated.physicalPins.map(p=>resolveG678P044PhysicalPath(root,p.path));
}
