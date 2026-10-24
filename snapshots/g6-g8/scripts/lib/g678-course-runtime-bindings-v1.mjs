/** Read-only current-course metadata overlay. It never renews old admission. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as exact} from 'node:util';
import {
  REGISTRY, DISPATCH, admissionArtifactPins, pinFile, readOrdinary, readPin,
  readJsonPin, readRegistryTransaction, sha256, uniquePins,
} from '../../lib/g678-admission-proof.mjs';
import {
  resolveG678PhysicalPath, resolveG678HistoricalEvidencePath,
} from '../../lib/g678-life-root-binding-v1.mjs';

const MANIFEST='catalog/g678-page-only-release-manifest.v1.json';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const PLACEMENT=/^shared-(nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/;
const PRESENTATION_KEYS=new Set(['pageInteractionCompanionTargetIdSuffix','pageInteractionStageTargetIdSuffix']);

function sourceViewPath(recorded,root) {
  assert(typeof recorded==='string'&&!recorded.split('/').includes('..'),'bounded source reference');
  let relative=recorded;
  if(path.isAbsolute(relative)) {
    const roots=[SOURCE_ROOT,resolveG678PhysicalPath(SOURCE_ROOT,root)];
    const owner=roots.find(value=>relative.startsWith(value+'/'));
    assert(owner,'source path belongs to the recorded or current source root');
    relative=relative.slice(owner.length+1);
  }
  if(relative.startsWith('HELP_COURSES/'))relative='G6-G8-shared/'+relative.slice('HELP_COURSES/'.length);
  else if(/^(NMS002|GEO001|ALG001|DAT001)\//.test(relative))relative='G6-G8-shared/'+relative;
  assert(relative.startsWith('G6-G8-shared/'),'shared source namespace');
  return relative;
}
function countPins(value) {
  if(!value||typeof value!=='object')return 0;
  if(typeof value.path==='string'&&typeof value.sha256==='string'&&Number.isSafeInteger(value.bytes))return 1;
  return Object.values(value).reduce((n,item)=>n+countPins(item),0);
}
function historicalPin(root,pin) {
  assert(pin&&typeof pin.path==='string','exact historical metadata pin');
  const recorded=path.isAbsolute(pin.path)?pin.path:path.resolve(root,pin.path);
  const physical=resolveG678HistoricalEvidencePath(recorded,root);
  const bytes=readPin(path.dirname(physical),{...pin,path:path.basename(physical)});
  return {value:JSON.parse(bytes.toString()),pin:{path:physical,bytes:bytes.length,sha256:sha256(bytes)},recordedPin:pin};
}
function sourcePin(root,sourceRoot,recorded,expectedSha,expectedBytes) {
  const relative=sourceViewPath(recorded,root),bytes=readOrdinary(sourceRoot,relative);
  assert.equal(sha256(bytes),expectedSha,'exact current source hash');
  if(expectedBytes!==undefined)assert.equal(bytes.length,expectedBytes,'exact current source bytes');
  return {path:path.join(sourceRoot,relative),bytes:bytes.length,sha256:expectedSha};
}

// These maintained extenders already define the exact native ALG course query.
// Read their literal projection without executing their historical admission chains.
const ALG_NATIVE_PAGES=new Set([2,3,4,8,10,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,32,33,34,35,38,41,42,43,44,45,46,47,48,49,50,56,57,58]);
const ALG_EXTENSION_PAGES=new Set([4,8,10,13,14,15,16,17,18,19]);
const QUERY_KEYS=new Set(['frameDomain','language','scenario','seed']);
function literalFields(source,label,keys) {
  const blocks=[...source.matchAll(new RegExp(label+':\\s*Object\\.freeze\\(\\{([^{}]*)\\}\\)','g'))];
  const values=blocks.map(block=>{
    const fields={};
    for(const match of block[1].matchAll(/([A-Za-z]\w*)\s*:\s*['"]([^'"]+)['"]/g))if(keys.has(match[1])) {
      assert(!Object.hasOwn(fields,match[1]),'distinct '+label+' literal keys');fields[match[1]]=match[2];
    }
    return fields;
  }).filter(value=>Object.keys(value).length);
  assert(!values.length||values.every(value=>exact(value,values[0])),'unambiguous '+label+' literals');
  return values[0]??null;
}
function boundSourceIdentity(root,file,source,animationId) {
  if(source.includes(`'${animationId}'`)||source.includes(`"${animationId}"`))return [];
  const imports=[...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)];
  const identities=imports.flatMap(match=>match[1].split(',').map(value=>value.trim()).filter(value=>/^(?:ID|[A-Za-z]\w*\s+as\s+ID)$/.test(value)).map(value=>({name:value.split(/\s+/)[0],specifier:match[2]})));
  assert.equal(identities.length,1,'one imported page identity');
  const identity=identities[0];assert(identity.specifier.startsWith('.'),'local page identity import');
  let target=path.relative(root,path.resolve(root,path.dirname(file),identity.specifier));
  if(!path.extname(target))target+='.ts';
  assert(!target.startsWith('..')&&!path.isAbsolute(target),'identity within workspace');
  const pin=pinFile(root,target),text=readPin(root,pin).toString();
  const match=new RegExp('export\\s+const\\s+'+identity.name+"\\s*=\\s*['\"]([^'\"]+)['\"]").exec(text);
  assert.equal(match?.[1],animationId,'exact imported page identity');return [pin];
}
export function readG678HostMetadata(root,animationId) {
  const match=/^shared-alg001-l06-p(\d{3})$/.exec(animationId);
  if(!match||!ALG_NATIVE_PAGES.has(Number(match[1])))return {status:'not-declared',runtimeQuery:null,presentation:null,pins:[]};
  const number=Number(match[1]);
  const file=number===2?'apps/web/lib/g678-alg-l06-p002.server.ts':number===3?'apps/web/lib/alg-l06-p003-continuous-candidate-v2.server.ts':number===35?'apps/web/lib/alg-l06-p035-source-projection-v1.server.ts':
    `apps/web/lib/alg-l06-p${match[1]}-${ALG_EXTENSION_PAGES.has(number)?'descriptor-extension-v1.ts':'candidate-v1.server.ts'}`;
  const pin=pinFile(root,file),source=readPin(root,pin).toString();
  const pins=[pin,...boundSourceIdentity(root,file,source,animationId)];
  const runtimeQuery=literalFields(source,'runtimeQuery',QUERY_KEYS);
  assert(runtimeQuery&&Object.keys(runtimeQuery).length===4&&['fixed-en','route-locale'].includes(runtimeQuery.language),'complete maintained host query');
  return {status:'existing-source-extender-literals',runtimeQuery,presentation:literalFields(source,'presentation',PRESENTATION_KEYS),pins};
}
/** Only literal fields already used by a bounded existing source extender. */
export function readG678PresentationMetadata(root,animationId) {
  const alg=readG678HostMetadata(root,animationId);if(alg.status!=='not-declared')return alg;
  const match=/^shared-nms002-l01-p(\d{3})$/.exec(animationId);
  if(!match)return {status:'not-declared',presentation:null,pins:[]};
  const file=['003','004'].includes(match[1])?'apps/web/lib/g678-nms-l01-story.server.ts':`apps/web/lib/g678-nms-l01-p${match[1]}.server.ts`;
  if(!fs.existsSync(path.join(root,file)))return {status:'not-declared',presentation:null,pins:[]};
  const pin=pinFile(root,file),source=readPin(root,pin).toString();
  assert(source.includes(`'${animationId}'`)||source.includes(`"${animationId}"`),'presentation source names exact placement');
  const presentation=literalFields(source,'presentation',PRESENTATION_KEYS);
  if(!presentation)return {status:'not-declared',presentation:null,pins:[pin]};
  if(animationId==='shared-nms002-l01-p002')assert.equal(presentation.pageInteractionCompanionTargetIdSuffix,'terminal-source-v1-readable');
  return {status:'existing-source-extender-literals',presentation,pins:[pin]};
}

function frozenSourceMetadata(root,packet,animationId,expectedSha,pins,seen) {
  assert(packet.schemaVersion===1&&(packet.deploymentScope??'bundled')==='local-only','local immutable metadata packet');
  const rows=(packet.selectedPages??[]).filter(row=>row.animationId===animationId);
  assert.equal(rows.length,1,'one frozen source placement');const own=rows[0];
  if(packet.selectedPages.length===1&&packet.entry)assert.equal(packet.entry.key,animationId,'exact single-page packet entry identity');
  if(packet.meta)assert.equal(packet.meta.key,animationId,'HFR metadata page identity');
  const hashes=[own.sourceSha256,packet.meta?.sourceSha256];
  if(packet.selectedPages.length===1&&packet.source)hashes.push(packet.source.sha256);
  assert(hashes.some(Boolean),'explicit frozen source hash');
  for(const hash of hashes.filter(value=>value!==undefined))assert.equal(hash,expectedSha,'packet source equals source manifest');
  let predecessor=null;
  if(packet.predecessorFreeze) {
    const pin=packet.predecessorFreeze;
    assert(!seen.has(pin.path),'acyclic exact predecessor freeze');seen.add(pin.path);
    predecessor=frozenSourceMetadata(root,readJsonPin(root,pin),animationId,expectedSha,pins,seen);pins.push(pin);
  }
  const inherited=predecessor?.selected??{},runtime={...(inherited.runtime??{}),...(packet.runtimeQuery??{}),...(own.runtime??{})};
  for(const key of ['frameDomain','language','scenario','seed']) {
    const declarations=[inherited.runtime?.[key],packet.runtimeQuery?.[key],own.runtime?.[key]].filter(value=>value!==undefined);
    assert(declarations.every(value=>exact(value,declarations[0])),'conflicting frozen runtime '+key);
  }
  for(const key of ['placementId','assetId','globalPageOrdinal','moduleCode','lessonNumber','complexityLane'])if(own[key]!==undefined&&inherited[key]!==undefined)
    assert(exact(own[key],inherited[key]),'conflicting predecessor '+key);
  return {selected:{...inherited,...own,sourceSha256:expectedSha,runtime},packets:[...(predecessor?.packets??[]),packet]};
}
function currentRuntimeQuery(runtime,host) {
  const query=host.runtimeQuery;
  if(query)for(const key of QUERY_KEYS) {
    const value=runtime[key];
    if(value===undefined)continue;
    if(key==='language'&&value==='source-en'){assert.equal(query.language,'fixed-en','source-en host language');continue;}
    if(key==='scenario'&&value==='source-script-bound-product-behavior-current-js-candidate') {
      assert(['source-static-frame','source-explicit-frames'].includes(query.scenario),'explicit native source host scenario');continue;
    }
    assert.equal(String(value),query[key],'maintained host matches frozen '+key);
  }
  const result=query??Object.fromEntries([...QUERY_KEYS].map(key=>[key,runtime[key]]));
  assert(typeof result.frameDomain==='string'&&typeof result.scenario==='string'&&['fixed-en','route-locale'].includes(result.language)&&result.seed!==undefined,'explicit frozen or maintained runtime query');
  return {...result,seed:String(result.seed)};
}

function sourceGlossary(root,packet,selected,entry) {
  const member=(packet.members??[]).find(item=>item.animationId===entry.key);
  const exactSingle=(packet.selectedPages??[]).length===1&&packet.selectedPages[0].animationId===entry.key;
  const declared=member?.sourceGlossary??selected.sourceGlossary??(exactSingle?packet.sourceGlossary:undefined);
  const entries=declared?.entries??selected.glossaryEntries??[];
  const pins=[],external=[];
  if(declared?.binding) {
    const binding=historicalPin(root,declared.binding);
    assert.equal(binding.value.animationId,entry.key,'source glossary exact placement');
    assert(exact(binding.value.entries,entries),'frozen glossary equals exact extracted source entries');
    external.push(binding.pin);
    // Bind the actual dictionary source bytes named by the extracted entries.
    const required=new Set(entries.flatMap(item=>Object.values(item.source??{}).map(s=>s.sha256)));
    for(const hash of required) {
      const candidates=(binding.value.inputs??[]).filter(pin=>pin.sha256===hash);
      assert.equal(candidates.length,1,'one actual source dictionary pin');
      const p=candidates[0],recorded=path.isAbsolute(p.path)?p.path:path.resolve(root,p.path);
      const physical=resolveG678HistoricalEvidencePath(recorded,root);
      readPin(path.dirname(physical),{...p,path:path.basename(physical)});
      external.push({...p,path:physical});
    }
  }
  const projected=entries.map(item=>{
    assert(typeof item.id==='string'&&typeof item.sourceKeyAttribute==='string'&&item.labels?.en&&item.labels?.es&&item.definitions?.en&&item.definitions?.es,'complete frozen bilingual glossary metadata');
    return {id:item.id,sourceKeyAttribute:item.sourceKeyAttribute,labels:item.labels,definitions:item.definitions,source:item.source};
  });
  assert(new Set(projected.map(item=>item.id)).size===projected.length,'distinct glossary metadata');
  for(const control of declared?.controls??[])assert(projected.some(item=>item.id===control.entryId&&item.sourceKeyAttribute.toLowerCase()===control.sourceKeyAttribute.toLowerCase()),'every source control resolves');
  return {entries:projected,pins,external,coverage:declared?.binding?'exact-source-glossary-binding':entries.length?'immutable-freeze-declarations':'not-declared'};
}

/**
 * Metadata-only reader for the registered source-ordered course.
 * Shared registry/dispatch failure stops all selected rows; a page/artifact
 * failure affects only that page. No old packet.inputs verdict is fabricated.
 */
export function readG678CourseRuntimeBindings(root,ids) {
  assert(path.isAbsolute(root)&&fs.realpathSync(root)===root,'physical workspace');
  assert(Array.isArray(ids)&&ids.length&&ids.every(id=>PLACEMENT.test(id))&&new Set(ids).size===ids.length,'distinct exact placement IDs');
  let transaction,registryPin,dispatchPins,manifestPin,manifest;
  try {
    transaction=readRegistryTransaction(root);
    registryPin=pinFile(root,REGISTRY);assert.equal(registryPin.sha256,transaction.sha256,'stable registry transaction');
    dispatchPins=DISPATCH.map(file=>pinFile(root,file));
    manifestPin=pinFile(root,MANIFEST);manifest=readJsonPin(root,manifestPin);
  }catch(error) {
    return {kind:'g678-course-runtime-bindings-v1',status:'failed',registry:{status:'failed',error:String(error)},rows:ids.map(animationId=>({animationId,status:'failed',error:'shared-registry-dispatch-or-source-manifest: '+String(error)})),acceptanceEffects:{technicalPassed:false,registeredDelta:0}};
  }
  const sourceRoot=resolveG678PhysicalPath(SOURCE_ROOT,root);
  const entries=new Map();
  for(const calibration of transaction.registry.calibrations)for(const entry of calibration.entries)entries.set(entry.key,{calibration,entry});
  const membership=new Map();
  for(const release of manifest.releases??[])for(const member of release.members??[]) {
    assert(!membership.has(member.animationId),'distinct source manifest placement');membership.set(member.animationId,{release,member});
  }
  const cache=new Map();
  const rows=ids.map(animationId=>{
    try {
      const record=entries.get(animationId),placement=membership.get(animationId);
      assert(record&&placement,'registered active source placement');
      const {calibration,entry}=record,{release,member}=placement;
      assert.equal(calibration.deploymentScope,'local-only');assert.equal(entry.maturity,'private-current-js');
      const freezePin={path:calibration.freezeManifest,bytes:calibration.freezeManifestBytes,sha256:calibration.freezeManifestSha256};
      const key=JSON.stringify(freezePin);
      if(!cache.has(key))cache.set(key,readJsonPin(root,freezePin));
      const packet=cache.get(key);
      assert(packet.schemaVersion===1&&packet.calibrationId===calibration.calibrationId&&(packet.deploymentScope??'bundled')==='local-only','exact immutable registration packet');
      const lineagePins=[];
      const metadata=frozenSourceMetadata(root,packet,animationId,member.source.sha256,lineagePins,new Set([freezePin.path]));
      const selected=metadata.selected;
      assert.equal(selected.sourceSha256,member.source.sha256,'packet source equals source manifest');
      assert.equal(member.assetId,`swf-${member.source.sha256}`,'exact source asset identity');
      assert.equal(member.placementId,animationId,'exact placement identity');
      if(selected.placementId!==undefined)assert.equal(selected.placementId,member.placementId,'frozen placement identity');
      if(selected.assetId!==undefined)assert.equal(selected.assetId,member.assetId,'frozen asset identity');
      if(selected.globalPageOrdinal!==undefined)assert.equal(selected.globalPageOrdinal,member.ordinal,'source-ordered placement');
      if(selected.moduleCode!==undefined)assert.equal(selected.moduleCode,release.moduleCode,'source lesson module');
      if(selected.lessonNumber!==undefined)assert.equal(selected.lessonNumber,release.moduleLesson,'source lesson number');
      assert.equal(selected.complexityLane,entry.complexityLane,'registered source behavior lane');
      const artifactPins=admissionArtifactPins(entry);artifactPins.forEach(pin=>readPin(root,pin));
      const declaredEntry=packet.entry?.key===animationId?packet.entry:(packet.entries??[]).find(item=>item.key===animationId);
      if(declaredEntry)assert(exact(declaredEntry,entry),'registration equals packet entry');
      const runtime=selected.runtime;
      assert(runtime,'frozen runtime declaration');
      const host=readG678HostMetadata(root,animationId),runtimeQuery=currentRuntimeQuery(runtime,host);
      if(entry.artifacts.runtime) {
        const declaration=runtime.canvasRenderer;
        assert(declaration&&['path','bytes','sha256'].every(key=>declaration[key]===entry.artifacts.runtime[key]),'exact frozen runtime artifact');
      }
      if(['maintained-dom-module-v1','generated-typescript-hfr-v1'].includes(entry.artifacts.kind))assert(exact(runtime.rendererBinding,entry.artifacts),'exact frozen maintained DOM binding');
      const source=sourcePin(root,sourceRoot,member.source.path,member.source.sha256,packet.source?.sha256===member.source.sha256?packet.source.bytes:undefined);
      const xml=sourcePin(root,sourceRoot,release.sourceLesson.path,release.sourceLesson.sha256,release.sourceLesson.bytes);
      for(const declaration of metadata.packets.flatMap(value=>value.sourceXml?[value.sourceXml]:[]))assert(declaration.sha256===xml.sha256&&declaration.bytes===xml.bytes&&sourceViewPath(declaration.path,root)===sourceViewPath(release.sourceLesson.path,root),'exact lesson XML binding');
      const glossary=sourceGlossary(root,packet,selected,entry);
      const presentation=selected.presentation?{status:'immutable-freeze-declaration',presentation:selected.presentation,pins:[]}:readG678PresentationMetadata(root,animationId);
      const overlay={rendererAvailability:{kind:'registered',moduleKey:animationId,runtimeQuery},
        ...(selected.runtimeEvidenceBoundary?{runtimeEvidenceBoundary:selected.runtimeEvidenceBoundary}:{}),...(presentation.presentation?{presentation:presentation.presentation}:{})};
      return {animationId,status:'ready',overlay,glossaryEntries:glossary.entries,
        metadataCoverage:{runtimeQuery:host.runtimeQuery?'source-bound-freeze-and-maintained-host':'immutable-source-bound-freeze',glossary:glossary.coverage,presentation:presentation.status},
        inputPins:uniquePins([registryPin,...dispatchPins,manifestPin,freezePin,...lineagePins,...artifactPins,...host.pins,...presentation.pins,...glossary.pins]),sourcePins:uniquePins([source,xml,...glossary.external]),
        historicalAdmission:{status:'not-revalidated',inputPinsDeclared:countPins(packet.inputs),reason:'This source-metadata reader verifies only selected current artifacts/source bindings. Old packet inputs, build receipts and acceptance remain separate; no historical pin is renewed.'},
        acceptanceEffects:{technicalPassed:false,registeredDelta:0,audioAccepted:false,humanAccepted:false,ownerAccepted:false,published:false}};
    }catch(error){return {animationId,status:'failed',error:String(error),acceptanceEffects:{technicalPassed:false,registeredDelta:0}};}
  });
  // Keep the transaction anchors fresh across every selected-page read.
  readPin(root,registryPin);dispatchPins.forEach(pin=>readPin(root,pin));readPin(root,manifestPin);
  return {kind:'g678-course-runtime-bindings-v1',status:rows.every(row=>row.status==='ready')?'ready':'partial',registry:{status:'verified',pin:registryPin,dispatchPins},manifest:manifestPin,rows,
    acceptanceEffects:{technicalPassed:false,registeredDelta:0,audioAccepted:false,humanAccepted:false,ownerAccepted:false,published:false}};
}
