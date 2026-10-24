import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {resolveSourceGlossary} from './build-g678-alg-l11-instructional-successor-glossary.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const PAIR_OUTPUT='output/alg-l12-next-glossary-20260927';
export const PAIR_SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const PAIR_PAGES=Object.freeze([
 {id:'shared-alg001-l12-p013',short:'p013',stem:'L12VB08',sha256:'056fb04850a10cd8888112e4c4fe5730bf475e559f0904b7841545c099536424',bytes:145346,sprite:63,frames:372,buttons:{6:'X-axis',7:'Coordinate plane',8:'Y-axis',31:'Quadrant'}},
 {id:'shared-alg001-l12-p015',short:'p015',stem:'L12VB10',sha256:'b14f5cec27090f38053e46ea7ef90beaeabab75a6aabe278955477e34bcc68c4',bytes:187238,sprite:76,frames:474,buttons:{23:'Plot',24:'Locate',25:'Point',26:'Grid',27:'Ordered pair',31:'Coordinate'}},
]);
const DICTIONARY='/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const DICT={en:{name:'L1KTE01.xml',sha256:'14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},es:{name:'L1KTS01.xml',sha256:'3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'}};
const hash=b=>createHash('sha256').update(b).digest('hex');
export function physicalPairInput(file,expected){
 const full=path.resolve(file),before=fs.lstatSync(full,{bigint:true});
 assert(before.isFile()&&before.nlink===1n&&fs.realpathSync(full)===full,'ordinary physical source');
 const bytes=fs.readFileSync(full),after=fs.lstatSync(full,{bigint:true});
 for(const k of ['dev','ino','size','mtimeNs','ctimeNs','mode','nlink'])assert.equal(before[k],after[k]);
 if(expected?.sha256)assert.equal(hash(bytes),expected.sha256,'source hash drift');
 if(expected?.bytes!==undefined)assert.equal(bytes.length,expected.bytes,'source size drift');
 return {bytes,pin:{path:full.startsWith(ROOT+'/')?path.relative(ROOT,full):full,bytes:bytes.length,sha256:hash(bytes)}};
}
export function validatePairGlossaryAction(text,key,additionalReadPosition=null){
 const statements=text.replace(/\r/g,'').trim().replace(/^on\(release\)\{\s*/,'').replace(/\s*\}$/,'').split('\n').map(x=>x.trim()).filter(Boolean);
 const expected=[`_global.KeyAttribute = "${key}";`,'_root.DoHyperLinks();','_root.animation_mc.animation.stop();'];
 if(additionalReadPosition!==null)expected.splice(additionalReadPosition,0,'S;');
 assert.deepEqual(statements,expected,'unexpected source glossary action');
 return {operation:'open-glossary',sourceKeyAttribute:key,sourceStop:'animation_mc.animation',additionalSourceReads:additionalReadPosition===null?[]:['S'],additionalReadPosition};
}
/** One producer, two actual pages; raw extraction and dictionaries are inspected
 * before any runtime/registration work. No case-folded lookup is admitted here. */
export function buildGlossaryPairInputs(){
 const index=physicalPairInput(`${PAIR_SOURCE_ROOT}/G6-G8-shared/ALG001/L12/index.xml`,{sha256:'0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325'});
 const xml={},dictionarySources={},pins=[index.pin];
 for(const [lang,d]of Object.entries(DICT)){const file=physicalPairInput(`${DICTIONARY}/${d.name}`,d);xml[lang]=file.bytes.toString();pins.push(file.pin);dictionarySources[lang]={assetId:`G678${d.name}`,path:`HELP_KEYTERMS/KT/XML/${d.name}`,sha256:d.sha256};assert(index.bytes.includes(`HELP_KEYTERMS/KT/XML/${d.name}`));}
 const pages=PAIR_PAGES.map(config=>{
  const base=path.join(ROOT,PAIR_OUTPUT,config.short),source=physicalPairInput(`${PAIR_SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/${config.stem}.swf`,config);
  const copy=physicalPairInput(`${base}/${config.stem}.swf`,config);assert(copy.bytes.equals(source.bytes));
  const catalog=collectSwfTextSourceCatalog(source.bytes);assert.equal(catalog.unparsedTags.length,0);
  const main=catalog.timelines.find(t=>t.timelineId===`sprite-${config.sprite}`);assert.equal(main.declaredFrameCount,config.frames);
  assert.equal(catalog.timelines.length,2);assert.equal(catalog.header.frameCount,10);assert.equal(catalog.header.frameRate,12);
  const scripts=path.join(base,'scripts/scripts'),ownedPins=[source.pin,copy.pin,physicalPairInput(`${base}/movie.xml`).pin];
  for(const [frame,body]of [[1,'_level0.InternalPreloader.gotoAndPlay("jump_check");\nstop();'],[6,'stop();']]){const file=physicalPairInput(`${scripts}/frame_${frame}/DoAction.as`);assert.equal(file.bytes.toString().replace(/\r/g,'').trim(),body);ownedPins.push(file.pin);}
  const glossary=resolveSourceGlossary(xml,Object.values(config.buttons),dictionarySources);
  assert.equal(glossary.length,Object.keys(config.buttons).length);
  const controls=Object.entries(config.buttons).flatMap(([rawId,key])=>{
   const characterId=Number(rawId),script=physicalPairInput(`${scripts}/DefineButton2_${characterId}/BUTTONCONDACTION on(release).as`);
   const position=config.short==='p015'?(characterId===24?2:characterId===25?3:null):null;
   const action=validatePairGlossaryAction(script.bytes.toString(),key,position);ownedPins.push(script.pin);
   if(position!==null){const pcode=physicalPairInput(`${base}/pcode/scripts/DefineButton2_${characterId}/BUTTONCONDACTION on(release).pcode`);assert.match(pcode.bytes.toString().replace(/\r/g,''),/Push "S"\nGetVariable\nPop/);ownedPins.push(pcode.pin);}
   const entry=glossary.find(t=>t.sourceKeyAttribute===key);assert(entry,`exact dictionary key missing: ${key}`);
   const definition=catalog.buttonDefinitions.find(b=>b.characterId===characterId);assert(definition&&definition.statePlacements.every(p=>p.flags===8),'hit-only controls required');
   const instances=main.instances.filter(i=>i.characterId===characterId);assert(instances.length>0);
   return instances.map(instance=>({id:instance.instanceId,entryId:entry.id,characterId,firstFrame:instance.firstFrame,lastFrameExclusive:instance.lastFrameExclusive,action,sourceTagSha256:definition.sourceTagSha256}));
  });
  return {animationId:config.id,source:source.pin,rootFrame:6,rootFrameCount:10,frameDomain:`sprite-${config.sprite}`,frameCount:config.frames,fps:12,controls,glossary,sourcePins:ownedPins,sourceCatalogSha256:hash(JSON.stringify(catalog)),unresolvedSourceRisks:catalog.risks,additionalGlobalReadParity:config.short==='p015'?'unestablished':'not-applicable',registrationEffect:'none'};
 });
 return {schemaVersion:1,kind:'g678-glossary-pair-source-inputs-v1',sharedInputs:pins,pages,registered:false,scaleOutAuthorized:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert(['--write','--check'].includes(process.argv[2]));const output=path.join(ROOT,PAIR_OUTPUT,'source-inputs.json'),data=JSON.stringify(buildGlossaryPairInputs(),null,2)+'\n';
 if(process.argv[2]==='--write')fs.writeFileSync(output,data,{flag:'wx'});else assert.equal(fs.readFileSync(output,'utf8'),data);
 const readBack=JSON.parse(fs.readFileSync(output));assert.deepEqual(readBack,buildGlossaryPairInputs());console.log(JSON.stringify({pages:readBack.pages.map(p=>({id:p.animationId,controls:p.controls.length,definitions:p.glossary.length})),registered:false}));
}
