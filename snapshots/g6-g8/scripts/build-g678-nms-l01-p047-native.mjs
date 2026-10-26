import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {ROOT,encode,pin,readBound} from './lib/g678-nms-l01-p005-generator-v1.mjs';
export const ID='shared-nms002-l01-p047',CALIBRATION='g678-nms-l01-p047-native-quiz-current-js-v1';
export const RUN=`work/g678-shared-page-factory/${CALIBRATION}`,FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const T='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',B=T+'/nms-l01-p047-behavior-source-v1';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE={path:'G6-G8-shared/NMS002/L1/FQ/L1FQ02.swf',bytes:78002,sha256:'748d7393d44dcfe9110ff429d0d8adcd6ec872bbf28a4ab6d2c4a4237f394647'};
const SPEC={path:T+'/nms-l01-p047-source-spec-v3.json',bytes:50310,sha256:'ea54eac728d26bf92aac482d33a380ecd071a4622dbda8c4ffbab4421071e0e2'};
const modulePath='packages/demos/src/modules/g678-nms-l01-native-quiz-p047.tsx';
const timelinePath='packages/demos/src/timelines/g678-nms-l01-native-quiz-p047.ts';
export async function buildP047({check=false}={}){
 const inputs=new Map();
 const add=async(p,expected)=>{const file=await readBound(p,expected);inputs.set(file.binding.path,file.binding);return file;};
 const spec=JSON.parse((await add(SPEC.path,SPEC)).bytes);assert.equal(spec.animationId,ID);assert.equal(spec.registered,false);
 const original=await add(path.join(SOURCE_ROOT,SOURCE.path));assert.deepEqual({...original.binding,path:SOURCE.path},SOURCE);
 for(const item of [...spec.inputs,...spec.additionalEvidence,...spec.sourceScripts])await add(item.path,item);
 const catalog=JSON.parse((await add('catalog/g678-shared-catalog.v1.json')).bytes),lesson=catalog.lessons.find(l=>l.stableLessonKey==='shared-nms002-l01'),page=lesson.pages[46];
 assert.equal(page.animationId,ID);assert.equal(page.sourceSha256,SOURCE.sha256);assert.equal(lesson.activePageCount,47);assert.equal(page.sectionCode,'FQ');assert.equal(page.sectionPageOrdinal,2);
 const xml=await add(path.join(SOURCE_ROOT,lesson.sourceXml.path));assert.deepEqual({...xml.binding,path:lesson.sourceXml.path},{path:lesson.sourceXml.path,bytes:lesson.sourceXml.bytes,sha256:lesson.sourceXml.sha256});
 assert.equal(xml.bytes.subarray(0,3).equals(Buffer.from([0xef,0xbb,0xbf])),lesson.sourceXml.hasUtf8Bom);
 const integration=JSON.parse((await add('catalog/typography-v1/g678-integration.json')).bytes);for(const item of integration.sharedFiles)await add(item.path,item);
 for(const file of [modulePath,timelinePath,'scripts/build-g678-nms-l01-p047-native.mjs',
  'packages/demos/src/nms-l01-p047-source-data-v1.ts','packages/demos/src/nms-l01-p047-quiz-v1.ts','packages/demos/src/nms-l01-p047-text-v1.ts',
  'packages/demos/src/nms-l01-p047-audio-v1.ts','packages/demos/src/nms-l01-p047-audio-loader-v1.ts','packages/demos/src/nms-l01-p047-session-v1.ts',
  'packages/demos/src/nms-l01-p047-quiz-player-v1.tsx','packages/demos/src/nms-l01-p047-native-renderer-v1.tsx','packages/demos/src/nms-l01-p047-quiz-presentation-v1.tsx',
  'packages/demos/src/nms-l01-p047-quiz-v1.css','packages/demos/src/nms-l01-p047-quiz-v1.css.d.ts','packages/demos/src/nms-l01-p047-source-evidence-v1.tsx',
  'packages/demos/src/generated/nms-l01-p047-source-canvas-v4.ts','scripts/build-nms-l01-p047-source-canvas-v4.mjs',
  'scripts/generate-nms-l01-p047-quiz-data-v1.mjs','scripts/g678-nms-l01-p044-build-source-canvas.mjs'])await add(file);
 const inventory=JSON.parse((await add(B+'/source-host-audio-dependency-inventory-v1.json')).bytes);
 const measurement=JSON.parse((await add(B+'/audio-browser-decode-v1/receipt.json')).bytes);assert.equal(inventory.files.length,270);assert.equal(measurement.status,'passed');
 const audioAssets=[];
 for(const asset of inventory.files){const source=await add(asset.sourceAbsolutePath);assert.deepEqual({...source.binding,path:asset.source.path},asset.source);
  const measured=measurement.records.find(r=>r.question===asset.question&&r.language===asset.language&&r.choice===asset.choice);assert.equal(measured.source.sha256,source.binding.sha256);assert.equal(measured.native.channels,1);assert.equal(measured.native.sampleRate,44100);
  const id=`p047-q${asset.question}-${asset.choice??'question'}-${asset.language}`;
  audioAssets.push({id,question:asset.question,choice:asset.choice,language:asset.language,source:source.binding,
    url:`/flash-assets/g678-local/${ID}/quiz-audio/${id}`,samples:measured.native.samples,sampleRate:44100,channels:1});
 }
 assert.equal(new Set(audioAssets.map(a=>a.id)).size,270);
 const runtimeEvidenceBoundary={runtimeKind:'source-script-bound-product-behavior-current-js-candidate',actionScriptExecution:'not-executed',naturalTraceValidation:'not-established',audioAcceptance:'not-established',replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established',productBehavior:'maintained-javascript-state-machine-implemented'};
 const effects=Object.fromEntries(['productCalibrationPassed','browserProductCalibrationPassed','authoritativeOriginalRuntime','visualFidelityAccepted','audioAccepted','humanVisualAccepted','ownerAccepted','strictComplete','released','published'].map(k=>[k,false]));
 const module=(await add(modulePath)).binding,timeline=(await add(timelinePath)).binding;
 const memberPath=`${RUN}/members/${ID}/member-manifest.json`,sourceRunPath=`${RUN}/run-manifest.json`;
 const runtimeContract={stage:{width:800,height:600},fps:12,rootFrameCount:10,rootBeginFrame:6,frameDomain:'sprite-1024',frameCount:74,language:'fixed-en',scenario:'source-quiz',seed:'0',sourceCaptureScenarios:['source-quiz','source-review-A','source-review-B','source-review-C','source-review-D']};
 const member={schemaVersion:1,artifactType:'maintained-native-quiz-member-v1',animationId:ID,source:SOURCE,moduleFile:module,timeline,runtimeContract,
  sourceCapture:(await add('packages/demos/src/generated/nms-l01-p047-source-canvas-v4.ts')).binding,questionCount:27,sessionQuestionCount:10,audioAssets,inputs:[...inputs.values()],acceptanceEffects:effects};
 const outputs=new Map(),memberBytes=encode(member),memberPin=pin(memberPath,memberBytes);outputs.set(memberPath,memberBytes);
 const run={schemaVersion:1,calibrationId:CALIBRATION,animationId:ID,source:SOURCE,inputs:[...inputs.values()],outputs:[memberPin,module,timeline],registrationChanged:false,acceptanceEffects:effects};
 const runBytes=encode(run),runPin=pin(sourceRunPath,runBytes);outputs.set(sourceRunPath,runBytes);
 const entry={key:ID,module:'./modules/g678-nms-l01-native-quiz-p047',maturity:'private-current-js',complexityLane:'behavior-heavy',
  artifacts:{kind:'maintained-dom-module-v1',module,timeline,memberManifest:memberPin,sourceRun:runPin}};
 const packet={schemaVersion:1,calibrationId:CALIBRATION,deploymentScope:'local-only',source:SOURCE,sourceXml:lesson.sourceXml,
  sourceCatalog:inputs.get('catalog/g678-shared-catalog.v1.json'),sourceSpec:SPEC,entry,inputs:[...inputs.values()],outputs:[memberPin,runPin],
  selectedPages:[{animationId:ID,sourceSha256:SOURCE.sha256,stableLessonKey:lesson.stableLessonKey,moduleCode:'NMS002',lessonNumber:1,globalPageOrdinal:47,sectionCode:'FQ',sectionPageOrdinal:2,
    implementationLane:'advanced-manual',complexityLane:'behavior-heavy',runtime:{...runtimeContract,rendererBinding:entry.artifacts},runtimeEvidenceBoundary}],
  questionCount:27,sessionQuestionCount:10,audioAssets,productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects:effects};
 const freezeBytes=encode(packet),freezePin=pin(FREEZE,freezeBytes);outputs.set(FREEZE,freezeBytes);
 outputs.set(FREEZE.replace('.json','.fragment.json'),encode({schemaVersion:1,calibration:{calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:freezePin.bytes,freezeManifestSha256:freezePin.sha256,entries:[entry]}}));
 for(const [file,bytes]of outputs){const old=await readFile(path.join(ROOT,file)).catch(e=>{if(e.code==='ENOENT')return null;throw e});if(check||old)assert(old&&old.equals(Buffer.from(bytes)),`P047 candidate drift:${file}`);}
 if(!check)for(const[file,bytes]of outputs){const target=path.join(ROOT,file);await mkdir(path.dirname(target),{recursive:true});try{await writeFile(target,bytes,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}}
 return {freeze:freezePin,files:outputs.size,inputs:inputs.size,audioFiles:audioAssets.length,registrationChanged:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.join(ROOT,'scripts/build-g678-nms-l01-p047-native.mjs')){
 assert(process.argv.slice(2).every(a=>a==='--check'));console.log(JSON.stringify(await buildP047({check:process.argv.includes('--check')}),null,2));
}
