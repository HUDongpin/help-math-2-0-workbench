import assert from 'node:assert/strict';
import {lstat,mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {Script} from 'node:vm';
import {ROOT,encode,sha,pin,readBound,composeStageMatrix} from './g678-nms-l01-p005-generator-v1.mjs';
export {ROOT,encode,sha,pin,readBound} from './g678-nms-l01-p005-generator-v1.mjs';
import {normalizeSourceClipMasks} from './g678-source-clip-masks-v2.mjs';
import {normalizeP032MaskStroke} from './g678-nms-l01-p032-mask-semantics-v1.mjs';
import {projectP032DisplayState} from './g678-nms-l01-p032-display-state-v1.mjs';
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
export async function buildP032({ID,CALIBRATION,SPEC,SOURCE},{check=false,prepare=false}={}){
 const RUN=`work/g678-shared-page-factory/${CALIBRATION}`,FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`,FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
 const sourceSpec=JSON.parse((await readBound(SPEC.path,SPEC)).bytes);
 assert.equal(sourceSpec.animationId,ID);assert.equal(sourceSpec.calibrationId,CALIBRATION);assert.deepEqual(sourceSpec.source,SOURCE);
 assert.deepEqual(sourceSpec.main,{objectId:239,frameDomain:'sprite-239',frameCount:346,entryRootFrame:6,questionStopFrame:230,hostTerminalStopFrame:346,livePlaybackEndFrame:346});
 const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;assert(sourceRoot&&path.isAbsolute(sourceRoot)&&await realpath(sourceRoot)===sourceRoot);
 const original=await readBound(path.join(sourceRoot,SOURCE.path));assert.deepEqual({...original.binding,path:SOURCE.path},SOURCE);assert.equal((await lstat(path.join(sourceRoot,SOURCE.path))).mode&0o222,0);
 const inputs=[SPEC,original.binding];for(const b of [sourceSpec.catalog,...sourceSpec.inputs]){await readBound(b.path,b);inputs.push(b);}
 const catalog=JSON.parse((await readBound(sourceSpec.catalog.path)).bytes),lesson=catalog.lessons.find(l=>l.stableLessonKey===sourceSpec.lesson.stableLessonKey),page=lesson.pages[31];
 assert.equal(page.animationId,ID);assert.equal(page.sourceSha256,SOURCE.sha256);assert.equal(lesson.activePageCount,47);assert.deepEqual(lesson.sourceXml,sourceSpec.lessonXml);
 const xml=await readBound(path.join(sourceRoot,lesson.sourceXml.path));assert.deepEqual({...xml.binding,path:lesson.sourceXml.path},{path:lesson.sourceXml.path,bytes:lesson.sourceXml.bytes,sha256:lesson.sourceXml.sha256});inputs.push(xml.binding);
 const raw=sourceSpec.inputs.find(p=>p.path.endsWith('/DefineSprite_239/frames.html')),helper=sourceSpec.inputs.find(p=>p.path.endsWith('/DefineSprite_239/canvas.js'));
 assert(raw&&helper);const frames=(await readBound(raw.path,raw)).bytes.toString(),helperSource=(await readBound(helper.path,helper)).bytes.toString();
 const facts=JSON.parse((await readBound(sourceSpec.inputs.find(p=>p.path.endsWith('/source-facts.json')).path)).bytes);
 assert.equal(facts.header.rootFrameCount,10);assert.equal(facts.frameDomains.domains.find(d=>d.domainId==='sprite-239').declaredFrameCount,346);
 assert.deepEqual(sourceSpec.practice.choices.map(c=>[c.sourceCharacterId,c.value,c.correct]),[[31,4000,false],[33,4500,true],[32,5000,false],[34,5500,false]]);
 assert.deepEqual(sourceSpec.practice.actions.mainStops,[230]);assert.equal(sourceSpec.practice.actions.hostTerminalStop,346);
 assert.equal(facts.tagCounts.DefineMorphShape,46);assert.equal(facts.tagCounts.DefineEditText,4);assert.equal(sourceSpec.clipMasks.length,2);
 const terminal=JSON.parse((await readBound(sourceSpec.practice.hostTerminal.path,sourceSpec.practice.hostTerminal)).bytes);
 const maskSemantics=JSON.parse((await readBound(sourceSpec.practice.maskSemantics.path,sourceSpec.practice.maskSemantics)).bytes);
 const glossary=JSON.parse((await readBound(sourceSpec.sourceGlossary.binding.path,sourceSpec.sourceGlossary.binding)).bytes);assert.deepEqual(glossary.entries,sourceSpec.sourceGlossary.entries);
 for(const b of [...glossary.inputs,glossary.parser]){await readBound(b.path,b);inputs.push(b);}
 const host=JSON.parse((await readBound(sourceSpec.practice.sourceHostBinding.path,sourceSpec.practice.sourceHostBinding)).bytes);
 assert.equal(host.logicalSourcePath,'NewHelpProgram/HELP_COURSES/indexMI.swf');
 for(const b of [host.source,host.sourceExtraction,host.functionExcerpts,host.enteredHostFrameObserver,host.nmsCourseGalleryEvidence]){await readBound(b.path,b);inputs.push(b);}
 const reach=JSON.parse((await readBound(sourceSpec.practice.hostReachability.path,sourceSpec.practice.hostReachability)).bytes);
 assert.equal(reach.activeAudioStreams,11);assert.equal(reach.dormantAudioStreams,2);assert.equal(reach.hostScriptScan.length,713);assert.equal(reach.pageScriptScan.length,70);
 async function verifyNested(value){if(!value||typeof value!=='object')return;if(typeof value.path==='string'&&Number.isSafeInteger(value.bytes)&&typeof value.sha256==='string'){const b={path:value.path,bytes:value.bytes,sha256:value.sha256};await readBound(b.path,b);inputs.push(b);return;}for(const v of Object.values(value))await verifyNested(v);}
 await verifyNested(reach);await verifyNested(terminal);await verifyNested(maskSemantics);

 const payloads={};assert.deepEqual(sourceSpec.audio.clips.map(c=>c.frameDomain),['sprite-239', 'sprite-88', 'sprite-103', 'sprite-117', 'sprite-144', 'sprite-172', 'sprite-232', 'sprite-204']);
 for(const c of sourceSpec.audio.clips){const b=await readBound(c.source.path,c.source);assert.equal(b.binding.sha256,c.decoder.sourceSha256);assert.equal(b.binding.bytes,c.decoder.sourceBytes);payloads[c.frameDomain]=b.bytes.toString('base64');}
 const meta=metadata(frames,239,346);assert.equal(meta.images.length,13);const placement=sourceSpec.rootPlacements.find(p=>p.objectID==='239'),matrix=placement.transform;
 const tx=Number(matrix.transX)/20,ty=Number(matrix.transY)/20,rootMatrix={a:1,b:0,c:0,d:1,tx,ty};assert.deepEqual([tx,ty],[412.4,283.3]);
 const runtimePath=`${RUN}/members/${ID}/canvas-renderer.js`,modulePath='packages/demos/src/modules/g678-nms-l01-p032.tsx',timelinePath=`packages/demos/src/timelines/${ID}.ts`;
 const spec={schemaVersion:1,animationId:`course-${ID}`,finalAnimationId:ID,classification:'private-source-locked-mountain-descent-practice-v1',title:'Subtracting Integers',source:{swf:`$HELP_MATH_G678_SOURCE_ROOT/${SOURCE.path}`,swfBytes:SOURCE.bytes,swfSha256:SOURCE.sha256},
 evidence:{scenarioInventory:SPEC.path,scenarioInventorySha256:SPEC.sha256,audioAudit:sourceSpec.inputs.find(p=>p.path.endsWith('/raw-streams-audit.json')).path,audioAuditSha256:sourceSpec.inputs.find(p=>p.path.endsWith('/raw-streams-audit.json')).sha256},
 ffdecExport:{tool:'JPEXS Free Flash Decompiler26.2.1 Canvas export',helper:helper.path,helperSha256:helper.sha256,helperBytes:helper.bytes,framesHtml:raw.path,framesHtmlSha256:raw.sha256,framesHtmlBytes:raw.bytes,targetSpriteObjectId:239,targetSpriteFunction:'sprite239',exportCanvas:meta.exportCanvas,exportInternalTranslation:meta.internal,expectedPlacedFunctionCount:meta.placed.length,expectedPlacedFunctionsSha256:sha(JSON.stringify(meta.placed)),expectedFontFunctionCount:meta.fonts.length,expectedFontFunctionsSha256:sha(JSON.stringify(meta.fonts)),embeddedImageVariableCount:meta.images.length,embeddedImageVariablesSha256:sha(JSON.stringify(meta.images))},
 timeline:{fps:12,stage:sourceSpec.stage,root:{frameCount:10,preloaderStopFrame:1,beginFrame:6,beginLabel:'begin',placementName:placement.name,placementDepth:placement.depth,placementTwips:{x:Number(matrix.transX),y:Number(matrix.transY)},placementMatrix:rootMatrix,placementPixels:{x:tx,y:ty}},local:{timelineId:'sprite-239',frameCount:346,livePlaybackEndFrame:346,playbackMode:'once',publicFrameIndexing:'one-indexed'},stageRenderOffset:{x:tx-meta.internal.x,y:ty-meta.internal.y}},
 runtimeContract:{kind:'structural-local-frame',scenarios:['source-static-frame'],defaultScenario:'source-static-frame',supportedLanguages:['en'],seedMapping:'bounded-host-seed-feedback-and-four-choice-state',blockedLocalFrameRanges:[],currentCanonicalFrameDomainDispositionAsserted:false,unresolved:['Original-runtime, source-audio listening, visual, human, Owner, strict completion and publication remain independent.']},
 output:{script:runtimePath,manifest:`${RUN}/members/${ID}/member-manifest.json`,spec:`${RUN}/adapter-spec.json`,globalRegistry:'HELP_MATH_CANVAS_ASSETS'},strictAcceptanceEffect:'none'};
 let runtime=buildSafeRuntime({helperSource,framesHtml:frames,spec}).runtime;
 runtime=normalizeP032MaskStroke(runtime,maskSemantics);
 runtime=normalizeSourceClipMasks(runtime,sourceSpec.clipMasks,(await readBound(sourceSpec.practice.sourceXml.path,sourceSpec.practice.sourceXml)).bytes.toString());
 runtime=projectP032DisplayState(runtime,sourceSpec.practice).split(JSON.stringify(spec.animationId)).join(JSON.stringify(ID));
 const registryLine=`registry[${JSON.stringify(ID)}] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});`;assert.equal(runtime.split(registryLine).length,2);
 runtime=runtime.replace(registryLine,`Object.defineProperty(registry,${JSON.stringify(ID)},{value:Object.freeze({metadata:METADATA,ready:ready,resolveFrameState:resolveFrameState,render:render}),configurable:false,enumerable:true,writable:false});`);
 new Script(runtime);assert(!/\b(?:eval|Function|fetch|XMLHttpRequest|WebSocket|setInterval|setTimeout|requestAnimationFrame|addEventListener)\s*\(/u.test(runtime));
 const runtimePin=pin(runtimePath,runtime),config={animationId:ID,title:spec.title,sourceSwfSha256:SOURCE.sha256,assetSource:`/flash-assets/g678-local/${ID}/canvas-renderer.js`,assetSha256:runtimePin.sha256,stage:sourceSpec.stage,nativeStage:sourceSpec.stage,backingStage:{width:800,height:600},fps:12,rootFrameCount:10,rootBeginFrame:6,mainFrameDomain:'sprite-239',mainFrameCount:346,livePlaybackEndFrame:346,playbackMode:'once',strictCaptureIdentity:true,blockedFrameRanges:[],showEngineeringDisclosure:false,visualMarkers:[{id:'sprite-239-source-drawing',firstFrame:1,lastFrame:346}]};
 const productAudio=sourceSpec.audio;
 const audio={...productAudio,clips:sourceSpec.audio.clips.map(({source,...c})=>c)},practice={prompt:sourceSpec.practice.prompt,choices:sourceSpec.practice.choices,fields:sourceSpec.practice.fields,branches:sourceSpec.practice.branches,help:sourceSpec.practice.help,introMotionKeyframes:sourceSpec.practice.introMotionKeyframes,wrongText:sourceSpec.practice.wrongText,wrongRetrySuffix:sourceSpec.practice.wrongRetrySuffix,primaryControls:sourceSpec.practice.primaryControls.filter(c=>sourceSpec.sourceHotspots.some(h=>h.sourceCharacterId===c.sourceCharacterId&&h.ranges.length)),hotspots:sourceSpec.sourceHotspots.filter(h=>h.ranges.length).map(({sourceCharacterId,entryId,ranges})=>({sourceCharacterId,entryId,ranges})),glossary:sourceSpec.sourceGlossary.entries};
 const timeline=`// Generated by g678-nms-l01-p032-generator-v1.mjs; do not edit.\nimport type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';\nimport type {P032AudioPlan} from '../nms-l01-p032-source-clock-v1';\nexport const CONFIG=${encode(config).trim()} as const satisfies SourceStaticCanvasCandidateConfig;\nexport const PLAN=${encode(audio).trim()} as const satisfies P032AudioPlan;\nexport const PRACTICE=${encode(practice).trim()} as const;\n`;
 const module=`// Generated by g678-nms-l01-p032-generator-v1.mjs; do not edit.\n'use client';\nimport {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';\nimport {prepareFrozenGlossaryCanvas} from '../frozen-glossary-canvas-preparation';\nimport {CONFIG,PLAN,PRACTICE} from '../timelines/${ID}';\nconst candidate=createSourceStaticCanvasCandidate(CONFIG);\nconst sourceAudioPayloads=${JSON.stringify(payloads)};\nexport default Object.freeze({...candidate.module,maturity:'private-current-js' as const,privateP032Practice:Object.freeze({version:1 as const,CONFIG,PLAN,PRACTICE,sourceAudioPayloads,prepare:()=>prepareFrozenGlossaryCanvas(CONFIG)})});\n`;
 const outputs=new Map([[runtimePath,runtime],[timelinePath,timeline],[modulePath,module],[`${RUN}/adapter-spec.json`,encode(spec)]]);
 if(!prepare){
  for(const file of ['scripts/build-g678-nms-l01-p032.mjs','scripts/lib/g678-nms-l01-p032-generator-v1.mjs','scripts/lib/g678-nms-l01-p032-display-state-v1.mjs','scripts/lib/g678-nms-l01-p005-generator-v1.mjs','scripts/lib/g678-source-clip-masks-v2.mjs','scripts/lib/g678-nms-l01-p032-mask-semantics-v1.mjs','scripts/build-safe-ffdec-canvas-adapter.mjs','packages/demos/src/source-static-canvas-candidate.tsx','packages/demos/src/frozen-glossary-canvas-preparation.ts','packages/demos/src/nms-l01-p032-source-clock-v1.ts','packages/demos/src/decoded-source-stream-transport.ts','apps/web/components/nms-l01-p032-source-runtime-v1.tsx','apps/web/components/g678-nms-l01-p032-lesson.tsx','apps/web/components/g678-multi-page-lesson-player-v3.generated.tsx'])inputs.push((await readBound(file)).binding);
  const entry={key:ID,module:'./modules/g678-nms-l01-p032',maturity:'private-current-js',complexityLane:'behavior-heavy',artifacts:{module:pin(modulePath,module),timeline:pin(timelinePath,timeline),runtime:runtimePin}};
  const boundary={runtimeKind:'source-script-bound-product-behavior-current-js-candidate',actionScriptExecution:'not-executed',naturalTraceValidation:'not-established',audioAcceptance:'not-established',replaySemantics:'product-complete-state-reset-original-runtime-parity-not-established',productBehavior:'maintained-javascript-state-machine-implemented'};
  const selected={animationId:ID,placementId:ID,assetId:page.assetId,stableLessonKey:page.stableLessonKey,sourceSha256:SOURCE.sha256,moduleCode:sourceSpec.lesson.moduleCode,lessonNumber:sourceSpec.lesson.lessonNumber,globalPageOrdinal:32,sectionCode:sourceSpec.placement.sectionCode,sectionPageOrdinal:sourceSpec.placement.sectionPageOrdinal,complexityLane:entry.complexityLane,implementationLane:'advanced-manual',laneReason:sourceSpec.laneReason,runtime:{stage:{width:800,height:600},rootFrameCount:10,rootBeginFrame:6,frameDomain:'sprite-239',frameCount:346,livePlaybackEndFrame:346,language:'fixed-en',scenario:'source-static-frame',seed:'0',canvasRenderer:{...runtimePin,url:config.assetSource}},runtimeEvidenceBoundary:boundary,originalRuntimeAccepted:false,audioAccepted:false};
  const manifest={schemaVersion:1,calibrationId:CALIBRATION,deploymentScope:'local-only',selectedPages:[selected],source:SOURCE,sourceGlossary:sourceSpec.sourceGlossary,sourceSpec:SPEC,sourceCatalog:sourceSpec.catalog,sourceXml:lesson.sourceXml,inputs,outputs:[...outputs].map(([p,b])=>pin(p,b)),entry,audioPlan:sourceSpec.audio,practice:sourceSpec.practice,productCalibrationPassed:false,scaleOutAuthorized:false,acceptanceEffects:sourceSpec.acceptanceEffects};
  const bytes=encode(manifest),binding=pin(FREEZE,bytes),calibration={calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:binding.bytes,freezeManifestSha256:binding.sha256,entries:[entry]};outputs.set(FREEZE,bytes);outputs.set(FRAGMENT,encode({schemaVersion:1,calibration}));
  outputs.set(`${RUN}/run-manifest.json`,encode({schemaVersion:1,animationId:ID,source:SOURCE,inputs,outputs:[...outputs].map(([p,b])=>pin(p,b)),frozenCandidate:binding,registrationChanged:false,scaleOutAuthorized:false}));
 }
 for(const[file,bytes]of outputs){const existing=await readFile(path.join(ROOT,file)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(check||existing)assert(existing&&existing.equals(Buffer.from(bytes)),`generated output drift:${file}`);}
 if(!check)for(const[file,bytes]of outputs){const full=path.join(ROOT,file);await mkdir(path.dirname(full),{recursive:true});try{await writeFile(full,bytes,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}}
 return{prepare,check,outputs:[...outputs].map(([p,b])=>pin(p,b)),registrationChanged:false};
}
