import assert from 'node:assert/strict';
import path from 'node:path';
import {readJsonPin,readPin,admissionArtifactPins,admissionSourcePins} from './g678-admission-proof.mjs';

export const P004_ID='shared-alg001-l10-p004';
export const P004_CALIBRATION='g678-alg-l10-p004-maintained-current-js-v1';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const EVIDENCE_ROOT='/Volumes/American Dream';
const SOURCE={path:'G6-G8-shared/ALG001/L10/RW/L10RW04.swf',bytes:259356,sha256:'5ac9be9459e12bdc6552d53a66b67ceb645633d2fe57522639a043d28180f5b2'};
const XML={path:'G6-G8-shared/ALG001/L10/index.xml',bytes:12047,sha256:'da83556a26ef2f33b37dcdc7972c5646e89723ac0819666baf6ed58ba9b955dc'};
const SPANISH={path:'G6-G8-shared/ALG001/L10/SA/L10RW04.mp3',bytes:436800,sha256:'7c52cff0fddc1c54979bd7f9ff039766dac50da92192580e1154a937ecc6134c'};
const STREAM={path:'migrations/shared-alg001-l10-p004/source-v1/source-stream-60.mp3',bytes:225940,sha256:'7b758330f9ed87a2583d728657792362eadbb175ee0206078c3cf798de2da0fd'};
const MODELS={
 sourceModel:{path:'output/g678-alg-l10-p004-product-repair-20261008-v2/source-model-v2.json',bytes:167276,sha256:'cead74c2e8a4642fe3475f0d044d465febdf2b8d3a2bc26597eefb20fb4b9570'},
 nativeBinding:{path:'output/g678-alg-l10-p004-player-preparation-20261008-v1/native-binding-v2.json',bytes:5813,sha256:'82a5b0d1ec56c2c41755c7c75fe33a74e67443811f4f023d4c97aadf85d80d95'},
 readingPreparation:{path:'output/g678-alg-l10-p004-reading-preparation-20261008-v1/preparation-manifest-v1.json',bytes:10106,sha256:'4281777d760903d2f5e159fa5dfb8370d6730fb387d3e6a2e200ca8708291be7'},
};
const RUN='work/g678-shared-page-factory/alg-l10-p004-maintained-real-world-20261008-final-v1';
const PRODUCER=`migrations/${P004_ID}/generator-v1/derive-product-provenance-v1.mjs`;
const CANDIDATE_EVIDENCE=`migrations/${P004_ID}/audit-v1/mylesson-candidate-verified-v1.json`;
const SEGMENTS=[{firstFrame:11,firstDecodedSample:1673,endDecodedSample:745344},{firstFrame:471,firstDecodedSample:745784,endDecodedSample:1001088}];
const REVEALS=[{characterId:29,frame:76},{characterId:36,frame:173},{characterId:40,frame:349},{characterId:44,frame:386},{characterId:47,frame:589}];
const RUNTIME={stage:{width:800,height:600},fps:12,rootFrameCount:10,rootBeginFrame:6,frameDomain:'sprite-60',frameCount:609,playbackMode:'once',terminalFrame:609,hostPlaybackCompletion:false};
const ACCEPTANCE={originalRuntime:false,fidelity:false,listening:false,human:false,owner:false,fullTypography:false,fullAccessibility:false,performance:false,strict:false,release:false,publication:false,deployment:false};
const RUNTIME_FILES=[
 `packages/demos/src/modules/${P004_ID}.tsx`,`packages/demos/src/timelines/${P004_ID}.ts`,
 'packages/demos/src/alg-l10-p004-state-v1.ts','packages/demos/src/alg-l10-p004-v1.css','packages/demos/src/alg-l10-p004-v1.css.d.ts',
 'packages/demos/src/alg-l10-p004-source-model-v1.ts','packages/demos/src/alg-l10-p004-presentation-v1.tsx','packages/demos/src/generated/alg-l10-p004-source-v1.ts',
 'packages/demos/src/alg-l10-p004-player-v2.tsx','packages/demos/src/alg-l10-p004-session-v2.ts','packages/demos/src/alg-l10-p004-playback-v2.ts',
 'packages/demos/src/alg-l10-p004-playback-v1.ts','packages/demos/src/alg-l10-p004-player-v1.css','packages/demos/src/alg-l10-p004-player-v1.css.d.ts',
 'apps/web/components/g678-alg-l10-p004-runtime-v1.tsx','apps/web/components/g678-alg-l10-p004-host-lesson-v1.tsx',
];

// Original evidence keeps its actual physical path. This reader never follows a
// symlink or accepts an arbitrary account, disk or task as an evidence root.
function evidenceBytes(root,pin){
 if(!path.isAbsolute(pin?.path??''))return readPin(root,pin);
 if(pin.path.startsWith(root+'/'))return readPin(root,{...pin,path:pin.path.slice(root.length+1)});
 assert(pin.path.startsWith(EVIDENCE_ROOT+'/g678-p004-'),'bounded P004 external evidence');
 return readPin(EVIDENCE_ROOT,{...pin,path:pin.path.slice(EVIDENCE_ROOT.length+1)});
}
const evidenceJson=(root,pin)=>JSON.parse(evidenceBytes(root,pin).toString());
const projectPin=(root,pin)=>({...pin,path:pin.path.startsWith(root+'/')?pin.path.slice(root.length+1):pin.path});
function sourceJson(root,pin){return readJsonPin(root,projectPin(root,pin));}
function exactOne(rows,label){const found=rows.filter(r=>r.label===label);assert.equal(found.length,1,`one ${label}`);return found[0];}

/** Hash-bound source, recovered native measurements and independent reading
 * evidence. The failed native wrapper and unaccepted source alignment remain. */
export function validateP004SourceEvidence(root){
 const model=readJsonPin(root,MODELS.sourceModel),native=readJsonPin(root,MODELS.nativeBinding),reading=readJsonPin(root,MODELS.readingPreparation);
 assert.deepEqual(model.source,{...SOURCE,path:SOURCE_ROOT+'/'+SOURCE.path});
 assert.deepEqual(model.sourceXml,{...XML,path:SOURCE_ROOT+'/'+XML.path});
 sourceJson(root,model.sourceIr);readPin(root,projectPin(root,model.sourceCatalog));
 assert.deepEqual(model.placement,{globalOrdinal:4,sectionCode:'RW',sectionPageOrdinal:3,reference:'RW/L10RW04.swf',titleEnglish:'Page 3',titleSpanish:'Page 3'});
 const product=model.product;
 assert.deepEqual([product.animationId,product.sourceSha256,product.fps,product.rootFrameCount,product.rootEntryFrame,product.mainFrameDomain,product.mainFrameCount],[P004_ID,SOURCE.sha256,12,10,6,'sprite-60',609]);
 assert.deepEqual(Object.keys(product.domains),['root','sprite-60']);
 assert.deepEqual([product.domains.root.events.length,product.domains['sprite-60'].events.length],[3,551]);
 assert.deepEqual(Object.entries(product.buttons).map(([id,b])=>[Number(id),b.term,b.hitShape,b.sourceHitOnly,b.sourceAction]),
  [[31,'Function'],[32,'Relationship'],[37,'Exponent'],[41,'Power'],[42,'Base'],[48,'Relation']].map(([id,term])=>[id,term,30,true,['set-KeyAttribute','DoHyperLinks','stop-main']]));
 assert.deepEqual(Object.keys(product.morphs).map(Number),[23,27,34,38,43,45]);
 assert.deepEqual(Object.keys(product.inlineShapes).map(Number),[28,35,39,46,62]);
 const audio=model.audioPreparation;
 assert.deepEqual([audio.embedded.bytes,audio.embedded.sha256,audio.sampleRate,audio.channels,audio.latencySamples,audio.declaredSamples],[STREAM.bytes,STREAM.sha256,22050,1,1673,1001088]);
 assert.deepEqual(audio.runs.map(r=>({firstFrame:r.firstFrame,firstDecodedSample:r.firstSourceTargetSample,endDecodedSample:r.declaredEndSample})),SEGMENTS);
 assert.deepEqual(audio.negativeBlocks.map(({frame,samples,seek,mp3Bytes})=>({frame,samples,seek,mp3Bytes})),[{frame:417,samples:0,seek:-2150,mp3Bytes:0}]);
 assert.deepEqual(audio.spanishCandidate,{...SPANISH,path:SOURCE_ROOT+'/'+SPANISH.path});
 assert.equal(model.repair.sourceBytesChanged,false);assert.equal(model.repair.stateTimelineAudioChanged,false);
 assert.equal(native.wrapperExecutionPass,false);assert.equal(native.nativeAudioIdentityMeasured,true);
 for(const name of ['sourceAlignmentAccepted','listeningAccepted','originalRuntimeAccepted'])assert.equal(native[name],false);
 assert.deepEqual(native.bindings,{en:{sourceSha256:STREAM.sha256,sourceBytes:STREAM.bytes,sampleRate:22050,channels:1,decodedSamples:1001088,pcmSha256:'8c76d237da04bd906c072f319bb2ac2f4bc587212b203db1cc70cbc25d246d25'},
  es:{sourceSha256:SPANISH.sha256,sourceBytes:SPANISH.bytes,sampleRate:22050,channels:1,decodedSamples:687959,pcmSha256:'d2b7c1204750aa45c0d2c4a11b42e5f664907672ff787de3ee0fd9e460689886'}});
 const recovered=sourceJson(root,native.native),failed=sourceJson(root,native.originalFailedWrapper);
 assert.equal(recovered.pass,true);assert.equal(recovered.wrapperExecutionPass,false);assert.equal(failed.pass,false);
 assert.deepEqual(recovered.originalWrapperReceipt,native.originalFailedWrapper);
 assert.deepEqual(recovered.decoder.results.map(r=>[r.animationId,r.language,r.sourceVerified,r.nativeBrowserDecoded,r.actualContextSampleRate,r.actualBufferSampleRate,r.channels,r.decodedSamples,r.pcmSha256,r.contextClosed,r.contextFinalState]),
  ['en','es'].map(language=>{const d=native.bindings[language];return [P004_ID,language,true,true,22050,22050,1,d.decodedSamples,d.pcmSha256,true,'closed'];}));
 assert.equal(recovered.decoder.sourceAlignmentAccepted,false);assert.equal(recovered.decoder.listeningAccepted,false);assert.equal(recovered.decoder.originalRuntimeAccepted,false);
 const requirements=sourceJson(root,native.sourceRequirements);assert.deepEqual(requirements.source.segments,SEGMENTS);
 assert.deepEqual(projectPin(root,reading.sourceModel),MODELS.sourceModel);
 assert.deepEqual(reading.narrativeBoundaries,REVEALS);assert.equal(reading.logicalAdvanceRangeNotGlyphInkBounds,true);
 assert.equal(reading.wholeDefineTextCounterexampleCount,5);assert.equal(reading.terminalTextPlacementCount,25);
 for(const field of ['sourceBytesChanged','generatedOutputsChanged','rendererVisualChanged','buttonsClockAudioChanged','registered','formalClosure'])assert.equal(reading[field],false);
 const validation=sourceJson(root,reading.validation);
 assert.deepEqual([validation.pass,validation.assertions,validation.frames,validation.oracleTexts,validation.visualMarkupFrames],[true,89780,1238,28540,1238]);
 assert.deepEqual(validation.failures,[]);assert.deepEqual(validation.diagnostics,[]);assert.deepEqual(validation.narrativeBoundaries,REVEALS);
 assert.deepEqual(validation.sourceModel,reading.sourceModel);assert.equal(validation.logicalAdvanceRangeNotGlyphInkBounds,true);
 return {model,native,reading,validation};
}

function readCliResult(root,pin){
 assert(pin.bytes<=65536,'complete bounded CLI log');
 const text=evidenceBytes(root,pin).toString(),marker='### Result\n';
 assert(text.startsWith(marker)&&text.indexOf(marker,marker.length)===-1,'one actual CLI result');
 const rest=text.slice(marker.length),at=rest.indexOf('\n### Page\n');
 const body=at<0?rest:rest.slice(0,at),tail=at<0?'':rest.slice(at);
 assert(!tail||/^\s*### Page\n(?:- [^\n]*\n?)*\s*$/.test(tail),'actual CLI Page trailer');
 const result=JSON.parse(body);assert(result&&typeof result==='object'&&!Array.isArray(result));return result;
}

function validateRealCase(root,c){
 const raw=evidenceJson(root,c.result),wrapper=evidenceJson(root,c.wrapperReceipt),served=evidenceJson(root,c.servedBuild),binding=evidenceJson(root,c.binding),cleanup=evidenceJson(root,c.cleanup);
 assert.deepEqual(readCliResult(root,c.cliLog),raw,'actual CLI result equals preserved JSON');
 assert.deepEqual([raw.pass,raw.problem,raw.spec.language,raw.spec.width,raw.spec.origin,raw.stage],[true,null,c.locale,c.width,'http://127.0.0.1:3331','negative-resource-and-route-scope']);
 assert.deepEqual([raw.realProductControls,raw.sourceFrameSetterUsed,raw.localOnly,raw.nativeVolumeMutedThroughUI,raw.myLessonObserved,raw.actualContextClosed],[true,false,true,true,true,true]);
 for(const flag of ['registered','listeningAccepted','originalRuntimeAccepted','formalClosure'])assert.equal(raw[flag],false);
 for(const field of ['errors','consoleMessages','failedRequests','denied'])assert.deepEqual(raw[field],[]);
 assert.deepEqual(raw.spec.executionBinding,{buildReceipt:c.servedBuild,inputCount:4868});
 assert.deepEqual(wrapper.binding,c.binding);assert.deepEqual(wrapper.actualServedBuild,c.servedBuild);assert.deepEqual(wrapper.cleanup,c.cleanup);
 const selected=wrapper.cases.filter(r=>r.language===c.locale);assert.equal(selected.length,1);assert.equal(selected[0].pass,true);assert.deepEqual(selected[0].result,c.result);
 const execution=selected[0].execution;assert.deepEqual(execution.log,c.cliLog);assert.deepEqual([execution.exitCode,execution.error,execution.completeOutput],[0,null,true]);
 assert.equal(wrapper.pass,c.locale==='es');assert.equal(wrapper.registered,false);assert.equal(wrapper.registrationDelta,0);
 // The failed two-case wrapper never reached its success-only postflight.
 // The independent terminal review below records the exact EN readback instead.
 if(c.locale==='en')assert.equal(wrapper.postflight,null);
 else {assert.equal(wrapper.postflight.pass,true);assert.equal(wrapper.postflight.inputCount,4868);}
 assert.equal(served.pass,true);assert.deepEqual(served.binding,c.binding);assert.deepEqual(served.inputPins,binding.inputPins);
 assert.deepEqual(served.installReceipt,binding.installReceipt);
 assert.equal(binding.kind,'g678-p004-root-runtime-binding-v1');assert.equal(binding.registrationCount,615);
 assert.equal(binding.inputPins.length,4868);assert.equal(new Set(binding.inputPins.map(p=>p.path)).size,4868);
 const types=evidenceJson(root,binding.typecheck);
 assert.equal(types.pass,true);assert.equal(types.diagnosticCount,0);assert.deepEqual(types.currentDrift,[]);assert.deepEqual(types.loadedDrift,[]);assert.equal(types.nextEnvChanged,false);
 assert.deepEqual(types.receipt,binding.installReceipt);assert.deepEqual(types.installationPlan,binding.installationPlan);assert.deepEqual(types.nextEnvAfter,binding.nextEnv);
 assert.equal(types.loadedPins.length,3600);
 const historicalInputs=new Map(binding.inputPins.map(pin=>[pin.path,pin]));
 for(const pin of types.loadedPins)assert.deepEqual(historicalInputs.get(root+'/'+pin.path),{...pin,path:root+'/'+pin.path},'actual compiler input belongs to served historical binding');
 assert.equal(cleanup.pass,true);assert.equal(cleanup.portClosed,true);assert.equal(cleanup.temporaryRootRemoved,true);assert.equal(cleanup.dedicatedDaemonDirectoryRemoved,true);
 assert.deepEqual(cleanup.remainingOwnedProcesses,[]);assert.deepEqual(cleanup.unresolvedIdentityQuarantines,[]);assert.equal(cleanup.error,null);
 assert.equal(cleanup.nextEnv.pass,true);assert.deepEqual(cleanup.nextEnv.restored,binding.nextEnv);assert.deepEqual(cleanup.nextEnv.tsconfigUnchanged,binding.tsconfig);
 assert.equal(raw.http.url,`http://127.0.0.1:3331/${c.locale}/migration-status/g678-calibration/${P004_ID}/candidate-v1?mode=focus`);
 assert.equal(raw.http.status,200);assert(raw.http.noindex.includes('noindex')&&raw.http.meta.includes('noindex'));
 assert.equal(raw.checks.length,c.locale==='en'?57:68);
 assert.deepEqual(raw.captures.map(r=>r.label),c.locale==='en'?
  ['initial-controls','glossary-hold','replay-controls','P005-natural-paused','P006-natural-paused','navigation-return-controls']:
  ['initial-controls','glossary-hold','spanish-independent','replay-controls','P005-natural-paused','P006-natural-paused','navigation-return-controls']);
 assert.deepEqual(raw.negativeChecks.map(r=>[r.name,r.status,r.bytes,r.sha256]),['missing-source-hash','wrong-source-hash','invalid-resource-referer','candidate-invalid-mode','unadmitted-registered-document'].map(name=>[name,404,9,'0019dfc4b32d63c1392aa264aed2253c1e0c2fb09216f8e2cc269bbfb8bb49b5']));
 for(const item of raw.resourceChecks){assert.equal(item.status,200);assert(item.noindex.includes('noindex'));assert.equal(new URL(item.url).origin,'http://127.0.0.1:3331');assert.equal(new URL(item.url).searchParams.get('sha256'),item.sha256);}
 const streams=raw.resourceChecks.filter(r=>r.id==='source-stream');assert(streams.length>0&&streams.every(r=>r.sha256===STREAM.sha256&&r.bytes===STREAM.bytes));
 const spanish=raw.resourceChecks.filter(r=>r.id==='optional-spanish-audio');assert.equal(spanish.length,c.locale==='es'?1:0);if(spanish.length)assert.deepEqual([spanish[0].sha256,spanish[0].bytes],[SPANISH.sha256,SPANISH.bytes]);
 assert.equal(raw.probeBeforeClose.pendingClose,0);assert.equal(raw.probeBeforeClose.contexts.length,c.locale==='en'?5:6);
 assert(raw.probeBeforeClose.contexts.every(r=>r.sampleRate===22050&&r.state==='closed'&&r.closeCalls===1));
 const initial=exactOne(raw.observations,'initial'),held=exactOne(raw.observations,'natural-playback-paused'),glossary=exactOne(raw.observations,'source-glossary-open'),replay=exactOne(raw.observations,'replayed'),returned=exactOne(raw.observations,'P004-return');
 for(const observation of raw.observations){assert.equal(observation.animationId,P004_ID);assert.equal(observation.sourceSha256,SOURCE.sha256);assert.equal(observation.visualLanguage,'en');assert.equal(observation.fallback,c.locale==='es'?'source-en':null);assert(observation.documentWidth<=observation.viewportWidth);}
 assert.deepEqual([initial.frame,initial.phase,initial.mainAudio,initial.spanishAudio],[1,'paused','idle','idle']);
 assert(held.frame>=76&&held.frame<173&&held.phase==='paused'&&held.reading.some(r=>r.id==='character-29')&&!held.reading.some(r=>r.id==='character-36'));
 assert.equal(glossary.frame,held.frame);assert.equal(glossary.phase,'paused');assert(glossary.glossary);
 assert(replay.frame<30&&replay.replay===1&&replay.mode==='main'&&!replay.glossary&&!replay.reading.some(r=>r.id==='character-29'));
 assert.deepEqual([returned.frame,returned.phase,returned.mainAudio,returned.spanishAudio],[1,'paused','idle','idle']);
 if(c.locale==='es'){
  assert.deepEqual(exactOne(raw.observations,'volume-closed').volumeControl,{state:'muted',expanded:'false',hidden:true,value:0});
  const playing=exactOne(raw.observations,'spanish-playing'),back=exactOne(raw.observations,'spanish-return');
  assert.deepEqual([playing.mode,playing.phase,playing.spanishAudio,playing.frame],['spanish','playing','playing',held.frame]);
  assert.deepEqual([back.mode,back.phase,back.frame],['main','paused',held.frame]);
 }
 assert.deepEqual(raw.retainedObservations.map(r=>r.label),['P005-entered-paused','P005-natural-playback-paused','P005-replayed-paused','P006-entered-paused','P006-natural-playback-paused','P006-replayed-paused','P005-return']);
 for(const number of ['005','006']){
  const entered=exactOne(raw.retainedObservations,`P${number}-entered-paused`).retained,natural=exactOne(raw.retainedObservations,`P${number}-natural-playback-paused`).retained,replayed=exactOne(raw.retainedObservations,`P${number}-replayed-paused`).retained;
  assert.equal(entered.id,`shared-alg001-l10-p${number}`);assert.equal(entered.frame,1);assert.equal(entered.sample,1673);
  for(const row of [entered,natural,replayed])assert(row.phase==='paused'&&row.ready==='true'&&row.canvasRendered==='ready'&&row.channels===1&&row.volume===0&&row.frame===row.audioFrame&&!row.error);
  assert(natural.frame>entered.frame&&natural.sample>entered.sample&&replayed.frame<30&&replayed.frame<natural.frame&&replayed.sample<natural.sample);
 }
 return {raw,wrapper,served,binding,cleanup};
}

/** Candidate observations are preserved historical inputs. Registration changes
 * the host separately; it must never make the old failed bilingual run pass. */
export function validateP004CandidateEvidence(root,evidencePin){
 assert.equal(evidencePin.path,CANDIDATE_EVIDENCE);const evidence=readJsonPin(root,evidencePin);
 assert.equal(evidence.kind,'g678-p004-verified-mylesson-candidate-v1');assert.equal(evidence.pass,true);
 assert.deepEqual(evidence.cases.map(c=>[c.locale,c.width]),[['en',1360],['es',390]]);
 assert.deepEqual([evidence.registrationDelta,evidence.registered,evidence.originalRuntimeAccepted,evidence.listeningAccepted],[0,false,false,false]);
 assert.equal(evidence.formalClosure,false);assert.deepEqual(evidence.acceptanceEffects,ACCEPTANCE);
 const [english,spanish]=evidence.cases.map(c=>validateRealCase(root,c));
 assert.deepEqual(english.binding.inputPins,spanish.binding.inputPins,'same historical candidate input bytes');
 assert.deepEqual(evidence.priorFailedReceipts,[evidence.cases[0].wrapperReceipt]);
 assert.equal(evidenceJson(root,evidence.priorFailedReceipts[0]).pass,false);
 assert.deepEqual(spanish.wrapper.priorCombinedReceipt,evidence.cases[0].wrapperReceipt);
 assert.equal(spanish.wrapper.combinedBilingualPass,false);
 const reviews=evidence.reviews;assert.deepEqual(Object.keys(reviews).sort(),['applicability','rawEnglish','rawSpanish','visualEnglish','visualSpanish']);
 for(const [locale,rawKey,visualKey] of [['en','rawEnglish','visualEnglish'],['es','rawSpanish','visualSpanish']]){
  const c=evidence.cases.find(x=>x.locale===locale),actual=locale==='en'?english:spanish;
  const rawReview=evidenceJson(root,reviews[rawKey]);assert.equal(rawReview.reviewPass,true);assert.deepEqual(rawReview.receipt,c.wrapperReceipt);
  assert.equal(rawReview.all4868CurrentInputPinsRehashed,true);assert.equal(rawReview.actualCliResultsExactlyMatchStoredJson,true);
  assert.equal(rawReview.overallBrowserRunPass,locale==='es');
  const reviewed=rawReview.cases.filter(r=>r.language===locale);assert.equal(reviewed.length,1);assert.equal(reviewed[0].pass,true);assert.deepEqual(reviewed[0].result,c.result);
  const visual=evidenceJson(root,reviews[visualKey]);assert.equal(visual.reviewComplete,true);assert.deepEqual(visual[locale==='en'?'rawEnglish':'rawSpanish'],c.result);
  assert.equal(visual.actualRunPass,locale==='es');if(locale==='en')assert.equal(visual.candidateBilingualProductPass,false);
  assert.deepEqual(visual.terminalReceipt,c.wrapperReceipt);assert.deepEqual(visual.build,c.servedBuild);assert.deepEqual(visual.cleanup,c.cleanup);
  assert(visual[locale==='en'?'englishSupported':'spanishSupported']);
  assert.equal(visual.captures.filter(r=>r.language===locale).length,actual.raw.captures.length,'all selected captures reviewed');
  for(const capture of actual.raw.captures){
   const rows=visual.captures.filter(r=>r.capture.path===capture.path&&r.label===capture.label&&r.language===locale&&r.viewedIndividuallyWithViewImage===true);
   assert.equal(rows.length,1,'individually reviewed actual capture');evidenceBytes(root,rows[0].capture);
  }
 }
 const applicability=evidenceJson(root,reviews.applicability);
 assert.equal(applicability.pass,true);assert.equal(applicability.priorCombinedPass,false);
 assert.deepEqual(applicability.sourceBinding,evidence.cases[0].binding);
 assert.deepEqual(applicability.englishCase.result,evidence.cases[0].result);
 assert.equal(applicability.currentInputPinsReverified,4868);assert.equal(applicability.actualCompilerLoadedPinsReverified,3600);
 assert.deepEqual(spanish.wrapper.priorEnglishApplicability,reviews.applicability);
 if(evidence.combinedRawReview!==undefined)assert.equal(evidenceJson(root,evidence.combinedRawReview).pass,true);
 return {status:'Actual EN1360 and ES390 candidate controls, native contexts, resource denials, independent reviews and cleanup verified; prior failed run retained',evidence};
}

export function validateP004Admission(root,packet,registration){
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.scope,packet.deploymentScope,packet.sourceRoot],[1,P004_CALIBRATION,'private-engineering','local-only',SOURCE_ROOT]);
 assert.deepEqual(packet.source,SOURCE);assert.deepEqual(packet.sourceXml,XML);
 assert.deepEqual(packet.optionalSpanishAudio,{source:SPANISH,trigger:{kind:'explicit-user-only',localeAutoplay:false,timelineBehavior:'pause-and-return-held',splicedIntoNarration:false}});
 assert.deepEqual(admissionSourcePins(packet),[SOURCE,XML,SPANISH]);
 assert.deepEqual(packet.embeddedSourceAudio,[{spriteId:60,source:STREAM,segments:SEGMENTS}]);readPin(root,STREAM);
 assert.equal(packet.selectedPages.length,1);const page=packet.selectedPages[0],runtime=page.runtime;
 assert.deepEqual([page.animationId,page.placementId,page.assetId,page.sourceSha256,page.moduleCode,page.lessonNumber,page.globalPageOrdinal,page.sourceOccurrence,page.sectionCode,page.sectionPageOrdinal,page.complexityLane],[P004_ID,P004_ID,`swf-${SOURCE.sha256}`,SOURCE.sha256,'ALG001',10,4,4,'RW',3,'behavior-heavy']);
 assert.deepEqual([runtime.frameDomain,runtime.frameCount,runtime.rootFrameCount,runtime.rootBeginFrame,runtime.beginFrame,runtime.fps,runtime.stage,runtime.scenario,String(runtime.seed),runtime.language,runtime.playbackMode,runtime.terminalFrame,runtime.originalRuntimeTimingAccepted],['sprite-60',609,10,6,1,12,{width:800,height:600},'source-static-frame','0','source-en','once',609,false]);
 assert(runtime.hostPlaybackCompletion===undefined||runtime.hostPlaybackCompletion===false,'terminal hold is not whole-lesson completion');
 assert.deepEqual(runtime.rendererBinding,packet.entry.artifacts);
 assert.deepEqual([packet.entry.key,packet.entry.module,packet.entry.maturity,packet.entry.complexityLane,packet.entry.artifacts.kind],[P004_ID,`./modules/${P004_ID}`,'private-current-js','behavior-heavy','maintained-dom-module-v1']);
 assert.equal(packet.entry.artifacts.module.path,`packages/demos/src/modules/${P004_ID}.tsx`);assert.equal(packet.entry.artifacts.timeline.path,`packages/demos/src/timelines/${P004_ID}.ts`);
 assert.equal(packet.entry.artifacts.memberManifest.path,`${RUN}/members/${P004_ID}/member-manifest.json`);assert.equal(packet.entry.artifacts.sourceRun.path,`${RUN}/run-manifest.json`);
 for(const pin of admissionArtifactPins(packet.entry))readPin(root,pin);
 const member=readJsonPin(root,packet.entry.artifacts.memberManifest),run=readJsonPin(root,packet.entry.artifacts.sourceRun);
 assert.deepEqual([member.schemaVersion,member.artifactType,member.animationId,member.source,member.runtime],[1,'g678-maintained-real-world-p004-member-v1',P004_ID,SOURCE,RUNTIME]);
 assert.deepEqual([run.schemaVersion,run.artifactType,run.animationId,run.source,run.implementationLane],[1,'g678-maintained-real-world-p004-run-v1',P004_ID,SOURCE,'advanced-manual']);
 assert.deepEqual(run.members,[packet.entry.artifacts.memberManifest]);assert.equal(run.producer.path,PRODUCER);readPin(root,run.producer);
 for(const [key,pin] of Object.entries(MODELS)){assert.deepEqual(member[key],pin);assert.deepEqual(run[key],pin);}
 assert.equal(member.files.length,16);assert.deepEqual(member.files.map(p=>p.path).sort(),[...RUNTIME_FILES].sort());
 for(const pin of member.files)readPin(root,pin);
 for(const pin of [packet.entry.artifacts.module,packet.entry.artifacts.timeline])assert.deepEqual(member.files.find(p=>p.path===pin.path),pin);
 for(const value of [member,run]){assert.equal(value.currentJsRegistered,false);assert.equal(value.acceptance,false);}
 assert.deepEqual(run.acceptanceEffects,ACCEPTANCE);
 const {model,native,reading,validation}=validateP004SourceEvidence(root);
 const generated=member.files.find(p=>p.path==='packages/demos/src/generated/alg-l10-p004-source-v1.ts'),generatedText=readPin(root,generated).toString();
 const sourceMatch=generatedText.match(/export const ALG_L10_P004_SOURCE:AlgL10P004SourceModel=(\{.*\});\s*$/s);assert(sourceMatch,'maintained generated source export');assert.deepEqual(JSON.parse(sourceMatch[1]),model.product);
 const state=member.files.find(p=>p.path==='packages/demos/src/alg-l10-p004-state-v1.ts');assert.deepEqual([state.bytes,state.sha256],[validation.draft.bytes,validation.draft.sha256]);
 const playback=member.files.find(p=>p.path==='packages/demos/src/alg-l10-p004-playback-v2.ts'),playbackText=readPin(root,playback).toString();
 const playbackMatch=playbackText.match(/export const ALG_L10_P004_PLAYBACK=(\{.*\}) as const satisfies AlgL10P004Playback;\s*$/s);assert(playbackMatch);const plan=JSON.parse(playbackMatch[1]);
 assert.deepEqual(plan.mainPlan.segments,SEGMENTS);assert.deepEqual(plan.mainPlan.decoder,native.bindings.en);assert.deepEqual(plan.spanish,native.bindings.es);assert.deepEqual(plan.nativeReceipt,projectPin(root,native.native));
 assert.deepEqual(plan.mainPlan.emptyNegativeBlocks,[{frame:417,samples:0,seek:-2150,mp3Bytes:0}]);
 assert.deepEqual([plan.animationId,plan.mainPlan.sourceSwfSha256,plan.mainPlan.frameDomain,plan.mainPlan.firstFrame,plan.mainPlan.lastFrame,plan.mainPlan.fps],[P004_ID,SOURCE.sha256,'sprite-60',1,609,12]);
 assert.deepEqual(reading.narrativeBoundaries,REVEALS);
 assert.equal(packet.browserEvidence.kind,'g678-p004-reviewed-bilingual-candidate-composite-v1');
 assert.deepEqual(run.candidateEvidence,packet.browserEvidence.composite);validateP004CandidateEvidence(root,packet.browserEvidence.composite);
 assert.equal(registration.calibrationId,P004_CALIBRATION);assert.equal(registration.deploymentScope,'local-only');assert.deepEqual(registration.entries,[packet.entry]);
 assert.equal(packet.implementationLane,'advanced-manual');assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);assert.equal(packet.registeredAtProofPreparation,false);
 assert.deepEqual(packet.acceptanceEffects,ACCEPTANCE);
 return {status:'P004 exact source placement, maintained runtime, two-run 22050Hz audio, six glossary actions, reading boundaries and reviewed candidate My Lesson evidence verified'};
}
