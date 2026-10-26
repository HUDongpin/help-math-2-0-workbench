import assert from 'node:assert/strict';
import {lstat,mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {Script} from 'node:vm';
import {ROOT,encode,sha,pin,readBound,composeStageMatrix} from './g678-nms-l01-p005-generator-v1.mjs';
export {ROOT,encode,sha,pin,readBound} from './g678-nms-l01-p005-generator-v1.mjs';
import {normalizeSourceClipMasks} from './g678-source-clip-masks-v2.mjs';
import {projectP037DisplayState} from './g678-nms-l01-p037-display-state-v1.mjs';
import {buildSafeRuntime} from '../build-safe-ffdec-canvas-adapter.mjs';
function metadata(html, objectId, frameCount) {
  const source = html.replace(/\r\n?/gu, '\n');
  const start = source.indexOf('var scalingGrids = {};'), end = source.indexOf('\nvar frame = -1;', start);
  assert(start >= 0 && end > start, 'FFDec definition boundaries');
  const definitions = source.slice(start, end), canvas = source.match(/<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/u);
  const header = definitions.match(new RegExp(`function sprite${objectId}\\(ctx,ctrans,frame,ratio,time\\)\\{\\s*ctx.save\\(\\);\\s*ctx.transform\\(1,0,0,1,([-0-9.]+),([-0-9.]+)\\);\\s*var clips = \\[\\];\\s*var frame_cnt = (\\d+);`, 'u'));
  assert(canvas && header && Number(header[3]) === frameCount, 'exact source sprite');
  const placed = [...new Set([...definitions.matchAll(/place\("([A-Za-z_$][A-Za-z0-9_$]*)"/gu)].map(m => m[1]))].sort();
  const fonts = [...definitions.matchAll(/function\s+(font\d+)\(ctx,ch,textColor\)\{/gu)].map(m => m[1]);
  const images = [...definitions.matchAll(/var\s+(imageObj\d+)\s*=\s*document.createElement\("img"\);\s*\1.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/gu)].map(m => m[1]);
  return {exportCanvas: {width: Number(canvas[1]), height: Number(canvas[2])},
    internal: {x: Number(header[1]), y: Number(header[2])}, placed, fonts, images};
}
export async function buildP037({ID,CALIBRATION,SPEC,SOURCE},{check=false,prepare=false}={}){
 const RUN=`work/g678-shared-page-factory/${CALIBRATION}`,FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
 const sourceSpec=JSON.parse((await readBound(SPEC.path,SPEC)).bytes);
 assert.equal(sourceSpec.animationId,ID);assert.equal(sourceSpec.calibrationId,CALIBRATION);assert.deepEqual(sourceSpec.source,SOURCE);
 assert.deepEqual(sourceSpec.main,{objectId:636,frameDomain:'sprite-636',frameCount:601,entryRootFrame:6,instructionStopFrame:595,questionStopFrame:596,hostTerminalStopFrame:601,endChildId:635,endChildFrames:111});
 const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;assert(sourceRoot&&path.isAbsolute(sourceRoot)&&await realpath(sourceRoot)===sourceRoot);
 const original=await readBound(path.join(sourceRoot,SOURCE.path));assert.deepEqual({...original.binding,path:SOURCE.path},SOURCE);assert.equal((await lstat(path.join(sourceRoot,SOURCE.path))).mode&0o222,0);
 const inputs=[SPEC,original.binding];for(const b of [sourceSpec.catalog,...sourceSpec.inputs]){await readBound(b.path,b);inputs.push(b);}
 const catalog=JSON.parse((await readBound(sourceSpec.catalog.path)).bytes),lesson=catalog.lessons.find(l=>l.stableLessonKey===sourceSpec.lesson.stableLessonKey),page=lesson.pages[36];
 assert.equal(page.animationId,ID);assert.equal(page.sourceSha256,SOURCE.sha256);assert.equal(lesson.activePageCount,47);assert.deepEqual(lesson.sourceXml,sourceSpec.lessonXml);
 const xml=await readBound(path.join(sourceRoot,lesson.sourceXml.path));assert.deepEqual({...xml.binding,path:lesson.sourceXml.path},{path:lesson.sourceXml.path,bytes:lesson.sourceXml.bytes,sha256:lesson.sourceXml.sha256});inputs.push(xml.binding);
 const raw=sourceSpec.inputs.find(p=>p.path.endsWith('/DefineSprite_636/frames.html')),helper=sourceSpec.inputs.find(p=>p.path.endsWith('/DefineSprite_636/canvas.js'));
 assert(raw&&helper);const frames=(await readBound(raw.path,raw)).bytes.toString(),helperSource=(await readBound(helper.path,helper)).bytes.toString();
 const facts=JSON.parse((await readBound(sourceSpec.inputs.find(p=>p.path.endsWith('/source-facts.json')).path)).bytes),mainFacts=facts.frameDomains.domains.find(d=>d.domainId==='sprite-636');
 assert.equal(facts.header.rootFrameCount,10);assert.equal(mainFacts.declaredFrameCount,601);assert.equal(mainFacts.scriptTagCount,3);assert.equal(facts.tagCounts.DoAction,21);assert.equal(facts.tagCounts.DefineButton2,5);
 assert.deepEqual(sourceSpec.practice.actions.mainStops,[595,596,601]);assert.equal(sourceSpec.practice.actions.actualClickSites,101);assert.equal(sourceSpec.practice.rows.length,14);
 assert.deepEqual(sourceSpec.practice.rows.map(r=>r.answer),[8,-2,28,25,40,47,45,54,43,64,71,78,74,80]);assert(sourceSpec.practice.rows.every(r=>r.start+r.delta===r.answer&&r.correctClickIndex===r.answer+21));
 assert.deepEqual(sourceSpec.practice.clickSites.map(p=>p.lineNumber),Array.from({length:101},(_,i)=>i-20));
 assert.equal(facts.tagCounts.DefineMorphShape,7);assert.equal(facts.tagCounts.DefineBitsJPEG3,1);assert.equal(facts.tagCounts.DefineBitsLossless2,1);assert.equal(facts.tagCounts.DefineEditText,4);assert.equal(sourceSpec.clipMasks.length,3);
 const terminal=JSON.parse((await readBound(sourceSpec.practice.hostTerminal.path,sourceSpec.practice.hostTerminal)).bytes);
 assert.equal(terminal.mainFrameCount,601);assert.equal(terminal.endChildFrames,111);assert.equal(terminal.endChildMain601Frame,4);assert.equal(terminal.remainingChildFramesAfterMainStop,107);assert.equal(terminal.operationTicks.totalAfterFinalAnswer,129);
 const guard=JSON.parse((await readBound(sourceSpec.practice.orderedPlayGuard.path,sourceSpec.practice.orderedPlayGuard)).bytes);assert.equal(guard.originalRuntimeParityClaim,false);assert.equal(guard.sourceAnswersChanged,0);assert.equal(guard.sourcePlayOrderChanged,false);
 assert.deepEqual(sourceSpec.sourceGlossary.entries,[]);assert.equal(sourceSpec.sourceGlossary.sourceActionCount,0);
 const reach=JSON.parse((await readBound(sourceSpec.practice.hostReachability.path,sourceSpec.practice.hostReachability)).bytes);
 for(const binding of [reach.sourceHostBinding,...reach.hostInputs]){await readBound(binding.path,binding);inputs.push(binding);}
 for(const binding of reach.searchedHostScripts){const b={path:binding.path,bytes:binding.bytes,sha256:binding.sha256};await readBound(b.path,b);assert.equal(binding.hits.CMc,0);assert.equal(binding.hits.Mc_Dummy,0);assert.equal(binding.hits.Right_Feed,0);inputs.push(b);}
 assert.equal(reach.searchedHostScripts.length,713);assert.equal(reach.missingSourceTarget.placementCount,0);assert.equal(reach.legacyClipActions.length,2);
 const payloads={};assert.deepEqual(sourceSpec.audio.clips.map(c=>c.frameDomain),['sprite-636','sprite-569','sprite-635']);
 for(const c of sourceSpec.audio.clips){const b=await readBound(c.source.path,c.source);assert.equal(b.binding.sha256,c.decoder.sourceSha256);assert.equal(b.binding.bytes,c.decoder.sourceBytes);payloads[c.frameDomain]=b.bytes.toString('base64');}
 const meta=metadata(frames,636,601);assert.equal(meta.images.length,2);const placement=sourceSpec.rootPlacements.find(p=>p.objectID==='636'),matrix=placement.transform;
 const tx=Number(matrix.transX)/20,ty=Number(matrix.transY)/20,rootMatrix={a:1,b:0,c:0,d:1,tx,ty};assert.deepEqual([tx,ty],[412.4,283.3]);
 const runtimePath=`${RUN}/members/${ID}/canvas-renderer.js`,modulePath='packages/demos/src/modules/g678-nms-l01-p037.tsx',timelinePath=`packages/demos/src/timelines/${ID}.ts`;
 const spec={schemaVersion:1,animationId:`course-${ID}`,finalAnimationId:ID,classification:'private-source-locked-integer-football-game-v1',title:'Integer Football',source:{swf:`$HELP_MATH_G678_SOURCE_ROOT/${SOURCE.path}`,swfBytes:SOURCE.bytes,swfSha256:SOURCE.sha256},
 evidence:{scenarioInventory:SPEC.path,scenarioInventorySha256:SPEC.sha256,audioAudit:sourceSpec.inputs.find(p=>p.path.endsWith('/raw-streams-audit.json')).path,audioAuditSha256:sourceSpec.inputs.find(p=>p.path.endsWith('/raw-streams-audit.json')).sha256},
 ffdecExport:{tool:'JPEXS Free Flash Decompiler26.2.1 Canvas export',helper:helper.path,helperSha256:helper.sha256,helperBytes:helper.bytes,framesHtml:raw.path,framesHtmlSha256:raw.sha256,framesHtmlBytes:raw.bytes,targetSpriteObjectId:636,targetSpriteFunction:'sprite636',exportCanvas:meta.exportCanvas,exportInternalTranslation:meta.internal,expectedPlacedFunctionCount:meta.placed.length,expectedPlacedFunctionsSha256:sha(JSON.stringify(meta.placed)),expectedFontFunctionCount:meta.fonts.length,expectedFontFunctionsSha256:sha(JSON.stringify(meta.fonts)),embeddedImageVariableCount:meta.images.length,embeddedImageVariablesSha256:sha(JSON.stringify(meta.images))},
 timeline:{fps:12,stage:sourceSpec.stage,root:{frameCount:10,preloaderStopFrame:1,beginFrame:6,beginLabel:'begin',placementName:placement.name,placementDepth:placement.depth,placementTwips:{x:Number(matrix.transX),y:Number(matrix.transY)},placementMatrix:rootMatrix,placementPixels:{x:tx,y:ty}},local:{timelineId:'sprite-636',frameCount:601,livePlaybackEndFrame:601,playbackMode:'once',publicFrameIndexing:'one-indexed'},stageRenderOffset:{x:tx-meta.internal.x,y:ty-meta.internal.y}},
 runtimeContract:{kind:'structural-local-frame',scenarios:['source-static-frame'],defaultScenario:'source-static-frame',supportedLanguages:['en'],seedMapping:'fixed-zero-drawing-with-source-14play-integer-football-state',blockedLocalFrameRanges:[],currentCanonicalFrameDomainDispositionAsserted:false,unresolved:['Original-runtime, source-audio listening, visual, human, Owner, strict completion and publication remain independent.']},
 output:{script:runtimePath,manifest:`${RUN}/members/${ID}/member-manifest.json`,spec:`${RUN}/adapter-spec.json`,globalRegistry:'HELP_MATH_CANVAS_ASSETS'},strictAcceptanceEffect:'none'};
 let runtime=buildSafeRuntime({helperSource,framesHtml:frames,spec}).runtime;
 runtime=normalizeSourceClipMasks(runtime,sourceSpec.clipMasks,(await readBound(sourceSpec.practice.sourceXml.path,sourceSpec.practice.sourceXml)).bytes.toString());
 runtime=projectP037DisplayState(runtime,sourceSpec.practice).split(JSON.stringify(spec.animationId)).join(JSON.stringify(ID));
 const registryLine=`registry[${JSON.stringify(ID)}] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});`;assert.equal(runtime.split(registryLine).length,2);
 runtime=runtime.replace(registryLine,`Object.defineProperty(registry,${JSON.stringify(ID)},{value:Object.freeze({metadata:METADATA,ready:ready,resolveFrameState:resolveFrameState,render:render}),configurable:false,enumerable:true,writable:false});`);
 new Script(runtime);assert(!/\b(?:eval|Function|fetch|XMLHttpRequest|WebSocket|setInterval|setTimeout|requestAnimationFrame|addEventListener)\s*\(/u.test(runtime));
 const runtimePin=pin(runtimePath,runtime),config={animationId:ID,title:spec.title,sourceSwfSha256:SOURCE.sha256,assetSource:`/flash-assets/g678-local/${ID}/canvas-renderer.js`,assetSha256:runtimePin.sha256,stage:sourceSpec.stage,nativeStage:sourceSpec.stage,backingStage:{width:800,height:600},fps:12,rootFrameCount:10,rootBeginFrame:6,mainFrameDomain:'sprite-636',mainFrameCount:601,livePlaybackEndFrame:601,playbackMode:'once',strictCaptureIdentity:true,blockedFrameRanges:[],showEngineeringDisclosure:false,visualMarkers:[{id:'sprite-636-source-drawing',firstFrame:1,lastFrame:601}]};
 const productAudio=sourceSpec.audio;
 const audio={...productAudio,clips:sourceSpec.audio.clips.map(({source,...c})=>c)},practice={rows:sourceSpec.practice.rows,clickSites:sourceSpec.practice.clickSites,correctPictures:sourceSpec.practice.correctPictures,arrow:sourceSpec.practice.arrow,wrong:sourceSpec.practice.wrong,buttons:sourceSpec.practice.buttons,deviceFields:sourceSpec.practice.deviceFields,clipMasks:sourceSpec.clipMasks,introMotionKeyframes:[1,2,82,100,200,229,300,400,500,594,595,596,597,598,601],primaryControls:[],hotspots:[],glossary:[]};
 const timeline=`// Generated by g678-nms-l01-p037-generator-v1.mjs; do not edit.\nimport type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';\nimport type {P037AudioPlan} from '../nms-l01-p037-source-clock-v1';\nexport const CONFIG=${encode(config).trim()} as const satisfies SourceStaticCanvasCandidateConfig;\nexport const PLAN=${encode(audio).trim()} as const satisfies P037AudioPlan;\nexport const PRACTICE=${encode(practice).trim()} as const;\n`;
 const module=`// Generated by g678-nms-l01-p037-generator-v1.mjs; do not edit.\n'use client';\nimport {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';\nimport {prepareFrozenGlossaryCanvas} from '../frozen-glossary-canvas-preparation';\nimport {CONFIG,PLAN,PRACTICE} from '../timelines/${ID}';\nconst candidate=createSourceStaticCanvasCandidate(CONFIG);\nconst sourceAudioPayloads=${JSON.stringify(payloads)};\nexport default Object.freeze({...candidate.module,maturity:'private-current-js' as const,privateP037Practice:Object.freeze({version:1 as const,CONFIG,PLAN,PRACTICE,sourceAudioPayloads,prepare:()=>prepareFrozenGlossaryCanvas(CONFIG)})});\n`;
 const outputs=new Map([[runtimePath,runtime],[timelinePath,timeline],[modulePath,module],[`${RUN}/adapter-spec.json`,encode(spec)]]);
 if(!prepare){
  for(const file of ['scripts/build-g678-nms-l01-p037.mjs','scripts/lib/g678-nms-l01-p037-generator-v1.mjs','scripts/lib/g678-nms-l01-p037-display-state-v1.mjs','scripts/lib/g678-nms-l01-p005-generator-v1.mjs','scripts/lib/g678-source-clip-masks-v2.mjs','scripts/build-safe-ffdec-canvas-adapter.mjs','packages/demos/src/source-static-canvas-candidate.tsx','packages/demos/src/frozen-glossary-canvas-preparation.ts','packages/demos/src/nms-l01-p037-source-clock-v1.ts','packages/demos/src/decoded-source-stream-transport.ts','apps/web/components/nms-l01-p037-source-runtime-v1.tsx','apps/web/components/g678-nms-l01-p037-lesson.tsx','apps/web/components/g678-multi-page-lesson-player-v3.generated.tsx'])inputs.push((await readBound(file)).binding);
  const entry={key:ID,module:'./modules/g678-nms-l01-p037',maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts:{module:pin(modulePath,module),timeline:pin(timelinePath,timeline),runtime:runtimePin}};
  const boundary={runtimeKind:'source-script-bound-product-behavior-current-js-candidate',actionScriptExecution:'not-executed',naturalTraceValidation:'not-established',audioAcceptance:'not-established',replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established',productBehavior:'maintained-javascript-state-machine-implemented'};
  const selected={animationId:ID,placementId:ID,assetId:page.assetId,stableLessonKey:page.stableLessonKey,sourceSha256:SOURCE.sha256,moduleCode:sourceSpec.lesson.moduleCode,lessonNumber:sourceSpec.lesson.lessonNumber,globalPageOrdinal:37,sectionCode:sourceSpec.placement.sectionCode,sectionPageOrdinal:sourceSpec.placement.sectionPageOrdinal,complexityLane:entry.complexityLane,implementationLane:'advanced-manual',laneReason:sourceSpec.laneReason,runtime:{stage:{width:800,height:600},rootFrameCount:10,rootBeginFrame:6,frameDomain:'sprite-636',frameCount:601,livePlaybackEndFrame:601,language:'fixed-en',scenario:'source-static-frame',seed:'0',canvasRenderer:{...runtimePin,url:config.assetSource}},runtimeEvidenceBoundary:boundary,originalRuntimeAccepted:false,audioAccepted:false};
  const manifest={schemaVersion:1,calibrationId:CALIBRATION,deploymentScope:'local-only',selectedPages:[selected],source:SOURCE,sourceGlossary:sourceSpec.sourceGlossary,sourceSpec:SPEC,sourceCatalog:sourceSpec.catalog,sourceXml:lesson.sourceXml,inputs,outputs:[...outputs].map(([p,b])=>pin(p,b)),entry,audioPlan:sourceSpec.audio,practice:sourceSpec.practice,productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects:sourceSpec.acceptanceEffects};
  const bytes=encode(manifest),binding=pin(FREEZE,bytes),calibration={calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:binding.bytes,freezeManifestSha256:binding.sha256,entries:[entry]};outputs.set(FREEZE,bytes);outputs.set(FRAGMENT,encode({schemaVersion:1,calibration}));
  outputs.set(`${RUN}/run-manifest.json`,encode({schemaVersion:1,animationId:ID,source:SOURCE,inputs,outputs:[...outputs].map(([p,b])=>pin(p,b)),frozenCandidate:binding,registrationChanged:false,scaleOutAuthorized:false}));
 }
 for(const[file,bytes]of outputs){const existing=await readFile(path.join(ROOT,file)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(check||existing)assert(existing&&existing.equals(Buffer.from(bytes)),`generated output drift:${file}`);}
 if(!check)for(const[file,bytes]of outputs){const full=path.join(ROOT,file);await mkdir(path.dirname(full),{recursive:true});try{await writeFile(full,bytes,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}}
 return{prepare,check,outputs:[...outputs].map(([p,b])=>pin(p,b)),registrationChanged:false};
}
