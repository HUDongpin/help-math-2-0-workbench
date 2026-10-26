import assert from 'node:assert/strict';
import {pinFile,readJsonPin,readPin,admissionArtifactPins,admissionSourcePins} from './g678-admission-proof.mjs';
export const P002_ID='shared-alg001-l07-p002';
export const P002_CALIBRATION='g678-alg-l07-p002-current-js-20261003-v1';
export const P002_SWF='be4379b92c4a214b6a00d655cee930dbdba0a018c0b1dcb89be855e4a8c8f996';
export const P002_STREAM='e016378323f1bec789386fccb3ddd723ddd857394249752a12114d7b15434b97';
export const P002_SA='1bbe047ac9df1f924560264c03525304c80248dee73a29776aa5f43c73e9f667';
const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware',migration=`migrations/${P002_ID}`;
export function assertP002SourceAudio(audio,extracted){assert.deepEqual(audio,{kind:'embedded-source-stream-v1',sourceCharacterId:452,extracted});}
export function validateP002Admission(root,packet,registration){
 const own=(path)=>readJsonPin(root,pinFile(root,`${migration}/${path}`));
 const model=own('native-v1/source-model-v1.json'),teaching=own('native-v1/teaching-state-v2.json'),decode=own('audit-v1/decode-v1.json'),sa=own('audit-v1/sa-decode-v1.json'),saHost=own('audit-v1/sa-host-binding-v1.json'),canvas=own('canvas-v1/native-canvas-manifest-v2.json');
 assert.deepEqual([packet.schemaVersion,packet.calibrationId,packet.deploymentScope,packet.sourceRoot],[1,P002_CALIBRATION,'local-only',sourceRoot]);
 assert.deepEqual(packet.source,{path:'G6-G8-shared/ALG001/L7/RW/L7RW02.swf',bytes:1603537,sha256:P002_SWF});
 assert.deepEqual(packet.sourceXml,{path:'G6-G8-shared/ALG001/L7/index.xml',bytes:13727,sha256:'5eac052615476e688afc1e69391c17bb0c20db8200e7be3f7ea1f9bb778d85f6'});
 assert.deepEqual(admissionSourcePins(packet),[packet.source,packet.sourceXml]);
 assert.equal(packet.selectedPages.length,1);const page=packet.selectedPages[0],runtime=page.runtime;
 assert.deepEqual([page.animationId,page.placementId,page.assetId,page.sourceSha256,page.moduleCode,page.lessonNumber,page.globalPageOrdinal,page.sourceOccurrence,page.sectionCode,page.sectionPageOrdinal,page.complexityLane],
 [P002_ID,P002_ID,`swf-${P002_SWF}`,P002_SWF,'ALG001',7,2,2,'RW',1,'behavior-heavy']);
 assert.deepEqual([runtime.frameDomain,runtime.frameCount,runtime.rootFrameCount,runtime.rootBeginFrame,runtime.beginFrame,runtime.fps,runtime.stage],['sprite-452',1195,10,6,1,12,{width:800,height:600}]);
 assert.deepEqual([runtime.scenario,runtime.seed,runtime.playbackMode,runtime.terminalStopFrame,runtime.hostPlaybackCompletion,runtime.originalRuntimeTimingAccepted],['source-static-frame','0','once',1195,false,false]);
 assert.deepEqual(runtime.rendererBinding,packet.entry.artifacts);assert.equal(packet.entry.artifacts.kind,'maintained-dom-module-v1');
 for(const pin of admissionArtifactPins(packet.entry))readPin(root,pin);
 const member=readJsonPin(root,packet.entry.artifacts.memberManifest),run=readJsonPin(root,packet.entry.artifacts.sourceRun);
 assert.equal(member.animationId,P002_ID);assert.equal(member.source.sha256,P002_SWF);assert.deepEqual(run.members,[packet.entry.artifacts.memberManifest]);for(const pin of member.files)readPin(root,pin);
 assert.deepEqual([model.animationId,model.physicalSource.sha256,model.frameDomain,model.frameCount,model.rootFrameCount,model.rootEntryFrame,model.fps,model.terminalStopFrame],[P002_ID,P002_SWF,'sprite-452',1195,10,6,12,1195]);
 assert.equal(model.frames.length,1195);assert.equal(model.stream.blockCount,1177);assert.equal(model.stream.pin.sha256,P002_STREAM);
 assert.deepEqual(model.stream.segments.map(s=>[s.firstFrame,s.firstDecodedSample,s.endDecodedSample]),[[2,1673,776448],[433,776607,2098944],[1164,2099294,2157696]]);
 assert.deepEqual(model.stream.emptyNegativeBlocks,[{frame:425,samples:0,seek:-2275,mp3Bytes:0},{frame:1153,samples:0,seek:-2139,mp3Bytes:0}]);
 assert.deepEqual(teaching.rows.map(r=>[r.plan,r.monthly,r.rate]),[['Smooth Talk','0','$.20/minute'],['Easy Talk','$50','$.05/minute'],['Super Talk','$60','$.03/minute']]);
 assert.equal(teaching.frames[694].tableVisible,false);assert.equal(teaching.frames[695].tableVisible,true);
 for(const [frame,row]of [[900,0],[1077,2]])assert(teaching.frames[frame-1].accents.length>0&&teaching.frames[frame-1].accents.every(a=>a.row===row&&a.cell==='rate'));
 assert.equal(canvas.replacements.length,33);assert.equal(canvas.nonTeachingArtPreserved,true);assert.equal(canvas.renderer.sha256,'d02d235aadd0e0a258adc2de7e4526d8b329908f8db302c70ab14c031e2c7a2e');readPin(root,canvas.renderer);readPin(root,canvas.input);
 assertP002SourceAudio(packet.sourceAudio,pinFile(root,`${migration}/source-v1/source-stream-452.mp3`));
 assert.deepEqual([decode.pass,decode.sourceBytes,decode.sourceSha256,decode.sampleRate,decode.channels,decode.decodedSamples,decode.pcmSha256,decode.contextClosed,decode.listeningAccepted,decode.originalRuntimeAccepted],[true,486980,P002_STREAM,22050,1,2157696,'b0897d1c83d064b2d66b20969df17b1ff2e57211b17b9f0deafdfb7dfbc1db4d',true,false,false]);
 assert.deepEqual(packet.audio,{trigger:'explicit-user-only',localeAutoplay:false,playbackMode:'source-runs-once',sourceFrameCount:1195,sourceBlockCount:1177,firstSeekSamples:1673,decodedSamples:2157696,sampleRate:22050,originalHostTerminationEstablished:false,originalRuntimeTimingAccepted:false,listeningAccepted:false,measurement:pinFile(root,`${migration}/audit-v1/decode-v1.json`),separateSpanish:{source:{path:'G6-G8-shared/ALG001/L7/SA/L7RW02.mp3',bytes:342384,sha256:P002_SA},hostBinding:pinFile(root,`${migration}/audit-v1/sa-host-binding-v1.json`),measurement:pinFile(root,`${migration}/audit-v1/sa-decode-v1.json`),trigger:'explicit-user-only',mainStreamSpliced:false,listeningAccepted:false}});
 readPin(sourceRoot,packet.audio.separateSpanish.source);
 assert.deepEqual([sa.pass,sa.sourceBytes,sa.sourceSha256,sa.sampleRate,sa.channels,sa.decodedSamples,sa.pcmSha256,sa.contextClosed,sa.listeningAccepted,sa.originalRuntimeAccepted],[true,342384,P002_SA,48000,1,1173888,'d8cad874cd84307062a6d9136dc730e67b1bf6066ce3035c7c938d2bfe29fafa',true,false,false]);
 assert.equal(saHost.applicability.currentPageLogicalPath,'HELP_COURSES/ALG001/L7/RW/L7RW02.swf');assert.equal(saHost.applicability.derivedUrlTemplate,'<ServerRoot>/HELP_COURSES/ALG001/L7/SA/L7RW02.mp3');
 assert.equal(registration.calibrationId,P002_CALIBRATION);assert.equal(registration.entries.length,1);assert.deepEqual(packet.entry,registration.entries[0]);
 assert.equal(packet.productCalibrationPassed,false);assert.equal(packet.scaleOutAuthorized,false);assert(Object.values(packet.acceptanceEffects).every(v=>v===false));
 return {status:'P002 exact source service plans,1195 stop,source-run stream and optional explicit SA verified'};
}
