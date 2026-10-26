/** Thin exact-browser adapter for the existing native collector and PCM assessor. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
import {deriveSourceVmAudioFlowWindows,deriveSourceVmLifecycleAudioWindows} from './g678-source-vm-audio-windows-v1.mjs';
const exec=promisify(execFile),sha=b=>createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function pin(file){const b=fs.readFileSync(file);return{path:file,bytes:b.length,sha256:sha(b)};}
function put(directory,name,value){const file=path.join(directory,name);assert(file.startsWith(directory+'/'));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});return pin(file);}
function exactPin(a,b){return a&&b&&a.bytes===b.bytes&&a.sha256===b.sha256;}
function checked(root,p,inputs){assert(p&&inputs.some(i=>path.resolve(root,i.path)===path.resolve(root,p.path)&&exactPin(i,p)),'audio dependency must be frozen: '+p?.path);const file=path.resolve(root,p.path);assert.equal(fs.realpathSync(file),file);const current=pin(file);assert(exactPin(current,p),'audio dependency drift: '+p.path);return current;}
function json(root,p,inputs){return JSON.parse(fs.readFileSync(checked(root,p,inputs).path));}
export async function qualifyAudioTools({root,inputPins,audioConfig,outputDirectory}) {
 assert(audioConfig?.enabled===true,'explicit actual audio collection configuration');
 for(const name of ['binary','source','buildReport','assessor','analysis','exporter','negativeHelper','ffmpeg','ffprobe'])checked(root,audioConfig[name],inputPins);
 const tools=audioConfig,build=json(root,tools.buildReport,inputPins);assert(exactPin(build.binary,tools.binary)&&exactPin(build.source,tools.source),'same built native binary/source');
 assert.equal(path.dirname(path.resolve(root,tools.assessor.path)),path.dirname(path.resolve(root,tools.exporter.path)),'existing exporter/assessor siblings');
 assert.equal(path.join(path.dirname(path.resolve(root,tools.assessor.path)),'audio-analysis.mjs'),path.resolve(root,tools.analysis.path),'existing audio analysis dependency');
 assert.equal(fs.realpathSync('/opt/homebrew/bin/ffmpeg'),path.resolve(root,tools.ffmpeg.path),'actual ffmpeg binding');assert.equal(fs.realpathSync('/opt/homebrew/bin/ffprobe'),path.resolve(root,tools.ffprobe.path),'actual ffprobe binding');
 const previous=json(root,tools.qualification.assessment,inputPins),manifest=json(root,tools.qualification.manifest,inputPins);json(root,tools.qualification.windows,inputPins);
 assert.equal(previous.status,'CAPTURE_QUALIFICATION_PASS');assert.equal(previous.passed,true);assert.equal(manifest.captureTool.executableSHA256,tools.binary.sha256,'qualified exact native binary');
 assert(manifest.backend==='coreaudio-process-tap'&&manifest.screenPixelsRecorded===false,'only private process audio backend');
 for(const p of previous.inputPins)checked(root,p,inputPins);
 const {assessCapture}=await import(pathToFileURL(path.resolve(root,tools.assessor.path)).href);
 const reassessed=await assessCapture({manifestPath:path.resolve(root,tools.qualification.manifest.path),windowsPath:path.resolve(root,tools.qualification.windows.path)});
 assert.equal(reassessed.status,'CAPTURE_QUALIFICATION_PASS');assert.equal(reassessed.passed,true);
 const receipt=put(outputDirectory,'qualification-rechecked.json',{kind:'exact-native-audio-qualification-recheck-v1',binary:tools.binary,source:tools.source,prior:tools.qualification.assessment,reassessed,reusedOnlyAsToolQualification:true,pageCredit:0});
 return{root,inputPins,tools,assessCapture,qualificationReceipt:receipt};
}
async function processRows(args){const {stdout}=await exec('/bin/ps',args,{maxBuffer:1024*1024});return stdout.split('\n').flatMap(line=>{const m=/^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);return m?[{pid:Number(m[1]),parentPID:Number(m[2]),command:m[3]}]:[];});}
export async function inspectOwnedAudioBrowser({audio,profile,mainPid,outputDirectory}) {
 const [main]=await processRows(['-p',String(mainPid),'-o','pid=,ppid=,command=']);assert(main?.pid===mainPid&&main.command.includes('--user-data-dir='+profile)&&!main.command.includes('--type='),'exact owned browser profile');assert(!main.command.includes('--headless')&&!main.command.includes('--mute-audio'),'headed unmuted browser');
 let children=[];try{const {stdout}=await exec('/usr/bin/pgrep',['-P',String(mainPid)],{maxBuffer:65536});const ids=stdout.trim().split(/\s+/).map(Number);if(ids.length)children=await processRows(['-p',ids.join(','),'-o','pid=,ppid=,command=']);}catch(error){if(error.code!==1)throw error;}
 const audioChildren=children.filter(r=>r.parentPID===mainPid&&r.command.includes('audio.mojom.AudioService'));assert.equal(audioChildren.length,1,'one actual owned AudioService after normal gesture');
 const binary=path.resolve(audio.root,audio.tools.binary.path),args=['--inspect','--pid',String(mainPid),'--audio-pid',String(audioChildren[0].pid)];
 const result=await exec(binary,args,{timeout:30000,maxBuffer:1024*1024});const inspection=JSON.parse(result.stdout);
 return retainOwnedAudioBrowserInspection({inspection,profile,mainPid,audioPid:audioChildren[0].pid,args,outputDirectory});
}
/** Preserve the native rejected window/identity facts without relaxing a guard. */
export function retainOwnedAudioBrowserInspection({inspection,profile,mainPid,audioPid,args,outputDirectory}) {
 const observed={...inspection,ownedProfile:profile,arguments:args};
 try {
  assert.equal(inspection.identity.pid,mainPid);assert.equal(inspection.audioProcess.pid,audioPid);assert.equal(inspection.audioProcess.parentPID,mainPid);assert.equal(inspection.windows.length,1,'one owned browser window');assert.equal(inspection.windows[0].pid,mainPid);
 } catch(error) {
  try{error.inspectionPin=put(outputDirectory,'browser-inspection-rejected.json',{...observed,status:'rejected',reason:String(error),acceptance:false});}
  catch(retainError){error.inspectionRetentionError=String(retainError);}
  throw error;
 }
 const receipt=put(outputDirectory,'browser-inspection.json',observed);return{inspection,receipt};
}
export async function runFreshAudioNegatives({audio,inspection,inspectionPin,outputDirectory}) {
 const binary=path.resolve(audio.root,audio.tools.binary.path),helper=path.resolve(audio.root,audio.tools.negativeHelper.path),receipts=[];
 for(const role of ['browser','audio-process']) {
  const receipt=path.join(outputDirectory,'negative-'+role+'.json'),output=path.join(outputDirectory,'must-not-exist-'+role),wrongPID=process.pid;
  const args=[...(role==='audio-process'?['--audio']:[]),binary,inspectionPin.path,String(wrongPID),String(inspection.windows[0].windowID),output,receipt];
  const result=await exec(process.execPath,[helper,...args],{timeout:20000,maxBuffer:1024*1024});const row=JSON.parse(fs.readFileSync(receipt));
  assert(row.executed&&row.expectedPID!==row.attemptedPID&&row.expectedPID===(role==='browser'?inspection.identity.pid:inspection.audioProcess.pid)&&row.exitCode!==0&&row.exitCode!==null&&row.outputCreated===false&&row.stdout==='','fresh exact wrong-PID rejection');
  assert.equal(row.binarySHA256,audio.tools.binary.sha256);assert(!fs.existsSync(output),'negative capture made no output');const error=JSON.parse(row.stderr);assert(/(?:AUDIO_)?PROCESS_(IDENTITY_UNAVAILABLE|BUNDLE_MISMATCH|PARENT_MISMATCH|LAUNCH_TIME_MISMATCH|EXECUTABLE_HASH_MISMATCH)|WINDOW_PID_MISMATCH/.test(error.error??''),'identity negative refused for its actual binding');
  receipts.push(pin(receipt));put(outputDirectory,'negative-'+role+'-command.json',{arguments:args,stdout:result.stdout,receipt:receipts.at(-1)});
 }
 return receipts;
}
export async function beginActualAudioCapture({audio,inspection,outputDirectory,runId,durationSeconds}) {
 assert(/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(runId),'native safe run identity');assert(Number.isFinite(durationSeconds)&&durationSeconds>=1&&durationSeconds<=3600,'bounded capture duration');assert(!fs.existsSync(outputDirectory),'new native capture directory');
 const t=inspection.identity,a=inspection.audioProcess,w=inspection.windows[0];
 const args=['--capture','--pid',String(t.pid),'--window-id',String(w.windowID),'--bundle-id',t.bundleID,'--executable-sha256',t.executableSHA256,'--launch-unix-ms',String(t.launchUnixMs),'--run-id',runId,'--output',outputDirectory,'--duration',String(durationSeconds),'--backend','coreaudio-process-tap','--audio-pid',String(a.pid),'--audio-launch-unix-ms',String(a.launchUnixMs),'--audio-executable-sha256',a.executableSHA256];
 const stdout=fs.createWriteStream(outputDirectory+'.stdout.jsonl',{flags:'wx'}),stderr=fs.createWriteStream(outputDirectory+'.stderr.jsonl',{flags:'wx'});
 const child=spawn(path.resolve(audio.root,audio.tools.binary.path),args,{stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);
 let finished=null;const completion=new Promise(resolve=>{child.once('error',error=>{finished={code:null,signal:null,error:String(error)};resolve(finished);});child.once('exit',(code,signal)=>{finished={code,signal};resolve(finished);});});
 const handle={audio,inspection,outputDirectory,runId,args,child,completion,durationSeconds};
 const start=Date.now(),deadline=start+30000;
 while(!fs.existsSync(path.join(outputDirectory,'ready.json'))) {if(finished)throw Error('NATIVE_CAPTURE_EXITED_BEFORE_READY:'+JSON.stringify(finished));if(Date.now()>deadline){put(path.dirname(outputDirectory),path.basename(outputDirectory)+'-ready-failure.json',{reason:'CAPTURE_READY_TIMEOUT',arguments:args,childPid:child.pid,cleanup:'native finite-duration process still owns its cleanup'});throw Object.assign(Error('CAPTURE_READY_TIMEOUT'),{captureHandle:handle});}await sleep(50);}
 const ready=JSON.parse(fs.readFileSync(path.join(outputDirectory,'ready.json')));assert.equal(ready.runID,runId);assert.equal(ready.target.pid,t.pid);assert.equal(ready.windowID,w.windowID);handle.ready=ready;return handle;
}
export async function finishActualAudioCapture(handle) {
 const exit=await handle.completion;const result=handle.processResultPin??=put(path.dirname(handle.outputDirectory),path.basename(handle.outputDirectory)+'-process-result.json',{binary:handle.audio.tools.binary,arguments:handle.args,exit});
 assert.equal(exit.code,0,'native capture exited successfully');assert.equal(exit.signal,null,'native capture not interrupted');
 const manifestPin=pin(path.join(handle.outputDirectory,'capture-manifest.json')),manifest=JSON.parse(fs.readFileSync(manifestPin.path));
 assert.equal(manifest.status,'RAW_CAPTURE_COMPLETE_UNASSESSED');assert.equal(manifest.captureTool.executableSHA256,handle.audio.tools.binary.sha256);assert(manifest.privateAudioCleanup?.tapAbsentOnReadback&&manifest.privateAudioCleanup?.aggregateAbsentOnReadback,'owned native tap/aggregate cleanup');return{manifestPin,manifest,processResult:result};
}
export function browserClockMapping(records) {
 const rows=[...(records.samples??[]),...(records.events??[]),...(records.starts??[])].filter(r=>Number.isFinite(r.unixMs)&&Number.isFinite(r.atMs));assert(rows.length>=2,'actual browser clock observations');
 const offsets=rows.map(r=>r.unixMs-r.atMs).sort((a,b)=>a-b),offset=offsets[Math.floor(offsets.length/2)];assert(offsets.at(-1)-offsets[0]<=5,'stable browser performance/Unix clock mapping');
 return{unixMinusRunnerMs:offset,minimumOffset:offsets[0],maximumOffset:offsets.at(-1),observations:rows.length};
}
export function deriveAudioFlowWindows(args) {
 const initial=(args.records.samples??[]).find(sample=>sample.sequence===args.flow.before);
 assert(['source-vm','surface-run'].includes(initial?.identity?.ownerKind),'actual audio owner kind required');
 return initial?.identity?.ownerKind==='source-vm' ? deriveSourceVmAudioFlowWindows(args) : deriveLegacyAudioFlowWindows(args);
}
function deriveLegacyAudioFlowWindows({contract,records,flow,decodeReceipt,decodeReceiptPin,captureRunId,captureManifest,entry,entryPin,contractPin,recordsPin,paddingMs=250}) {
 assert(flow.kind==='natural-playback','complete natural playback flow');const samples=records.samples??[],a=samples.find(s=>s.sequence===flow.before),b=samples.find(s=>s.sequence===flow.after);assert(a&&b&&a.identity.playerId===b.identity.playerId,'actual source run range');
 const owner=a.identity,events=records.events??[],clock=browserClockMapping(records);assert(paddingMs>=0&&paddingMs<=250,'bounded existing audio alignment padding');
 let causal;
 if(flow.startKind==='normal-entry') {
  assert(entry&&entryPin&&contractPin&&recordsPin&&contract.terminal.startPolicy==='normal-course-entry-or-play'&&flow.eventSequences.length===0,'source-authorized actual normal entry');
  causal={sequence:null,id:`${records.documentId}:normal-course-entry`,kind:'normal-course-entry',trusted:false,synthetic:false,unixMs:clock.unixMinusRunnerMs+entry.navigation.responseEnd,atMs:entry.navigation.responseEnd,entryPin,contractPin,recordsPin,initialSampleSequence:a.sequence};
 } else {
  causal=flow.eventSequences.map(seq=>events.find(e=>e.sequence===seq)).find(e=>e?.trusted===true&&e.forced===false&&!e.synthetic&&['click','keydown'].includes(e.type)&&['play','replay'].includes(e.action??e.control));assert(causal,'actual trusted play/replay flow trigger');
  if(flow.startKind==='replay'){const old=samples.find(s=>s.sequence===flow.replayFlowBefore);assert(old&&flow.replayFlowAfter===a.sequence&&old.identity.playerId!==owner.playerId&&owner.replay===old.identity.replay+1&&causal.playerId===old.identity.playerId&&causal.atMs>=old.atMs&&causal.atMs<=a.atMs,'actual replay cause before fresh owner');}
  else assert(causal.playerId===owner.playerId&&causal.atMs>=a.atMs,'actual play belongs to current source run');
 }
 const decoded=(records.decodes??[]).filter(d=>d.state==='fulfilled'&&d.sha256===decodeReceipt.source.sha256);
 const buffers=new Set(decoded.map(d=>d.bufferId)),starts=(records.starts??[]).filter(s=>s.started&&s.owner?.playerId===owner.playerId&&s.owner?.replay===owner.replay&&buffers.has(s.bufferId)&&s.atMs>=Math.min(a.atMs,causal.atMs)&&s.atMs<=b.atMs);
 assert.equal(starts.length,1,'natural source segment has exactly one actual source node; paused/split playback needs a separate trace');const start=starts[0],decode=decoded.find(d=>d.bufferId===start.bufferId);
 for(const old of (records.starts??[]).filter(n=>n.started&&buffers.has(n.bufferId)&&n.owner?.playerId!==owner.playerId&&n.atMs<=start.atMs)) {
  const ended=(records.ended??[]).some(e=>e.nodeId===old.nodeId&&e.atMs<=start.atMs);
  const immediateStop=(records.stops??[]).some(s=>s.nodeId===old.nodeId&&s.stopped&&s.effectiveWhen<=s.contextTime&&s.atMs<=start.atMs);
  const closed=(records.contextOps??[]).some(o=>o.contextId===old.contextId&&o.method==='close'&&o.state==='fulfilled'&&o.settled?.atMs<=start.atMs);
  assert(ended||immediateStop||closed,'old or unattributed source node is not actually retired before this run');
 }
 const cues=contract.audio.cues.filter(c=>c.source.sha256===decode.sha256&&c.sourcePCM.sha256===decodeReceipt.originalPCM.sha256);
 const languages=[...new Set(cues.map(c=>c.actualAudioLanguage??c.locale))];assert.equal(languages.length,1,'unique source-bound actual output language');
 const cue=cues.find(c=>c.locale===languages[0])??cues[0];assert(cue,'source cue matches actual decoded buffer');
 assert.equal(decode.sampleRate,cue.sampleRate);assert.equal(decode.channels,cue.channels);assert.equal(decode.samples,decodeReceipt.originalFormat.decodedSamples);
 assert(Math.abs(start.offset-cue.sourceFirstDecodedSample/cue.sampleRate)<=1/cue.sampleRate,'actual start offset equals authored source subrange');
 const sourceDuration=(cue.sourceEndDecodedSample-cue.sourceFirstDecodedSample)/cue.sampleRate;
 assert(start.durationArgument===null||start.durationArgument===undefined||Math.abs(start.durationArgument-sourceDuration)<=1/cue.sampleRate,'actual native source duration equals authored subrange');
 assert(!(records.contextOps??[]).some(o=>o.contextId===start.contextId&&o.method==='suspend'&&o.state==='fulfilled'&&o.atMs>start.atMs&&o.atMs<b.atMs),'natural cue contains no pause');
 assert(!(records.stops??[]).some(s=>s.nodeId===start.nodeId&&s.stopped&&s.effectiveWhen<start.effectiveWhen+sourceDuration-1/cue.sampleRate),'source node not prematurely stopped');
 const actualStartUnixMs=start.unixMs+(start.effectiveWhen-start.contextTime)*1000,playStartUnixMs=actualStartUnixMs-cue.startPlaybackSeconds*1000;
 assert(actualStartUnixMs>=causal.unixMs-5,'native start follows causal public input');
 const before=Math.min(paddingMs,Math.max(0,actualStartUnixMs-causal.unixMs)),after=paddingMs*2-before;
 const eventId=causal.id??`${records.documentId}:event:${causal.sequence}`,mediaInstanceId=owner.playerId;
 const base={mediaInstanceId,triggerEventId:eventId};
 const window={id:`${captureRunId}:cue:${cue.id}`,kind:'audible',cueId:cue.id,sourceSha256:cue.source.sha256,...base,startUnixMs:actualStartUnixMs-before,endUnixMs:actualStartUnixMs+sourceDuration*1000+after,
  reference:{decodeReceiptPath:decodeReceiptPin.path,decodeReceiptSHA256:decodeReceiptPin.sha256,startSeconds:cue.sourceFirstDecodedSample/cue.sampleRate,endSeconds:cue.sourceEndDecodedSample/cue.sampleRate,originalSampleRange:{pcmSha256:cue.sourcePCM.sha256,firstDecodedSample:cue.sourceFirstDecodedSample,endDecodedSample:cue.sourceEndDecodedSample,sampleRate:cue.sampleRate,channels:cue.channels}}};
 const windows=[window],bindings=[{id:window.id,playerId:owner.playerId,replay:owner.replay,mediaInstanceId,sourceNodeIds:[start.nodeId]}];
 for(const silence of contract.audio.expectedSilentWindows??[]) {
  const row={id:`${captureRunId}:silence:${silence.id}`,kind:'silent',cueId:silence.id,sourceWindowId:silence.id,sourceSha256:contract.source.sha256,...base,startUnixMs:playStartUnixMs+silence.startPlaybackSeconds*1000,endUnixMs:playStartUnixMs+silence.endPlaybackSeconds*1000,sourcePlaybackStartSeconds:silence.startPlaybackSeconds,sourcePlaybackEndSeconds:silence.endPlaybackSeconds};windows.push(row);bindings.push({id:row.id,playerId:owner.playerId,replay:owner.replay,mediaInstanceId});
 }
 for(const row of windows)assert(row.startUnixMs>=captureManifest.readyClock.unixMs&&row.endUnixMs<=captureManifest.clockAfter.unixMs,'actual window inside this capture');
 return{windows,bindings,events:[{...causal,id:eventId,kind:causal.kind??causal.action??causal.type,unixMs:causal.unixMs,mediaInstanceId,trusted:causal.trusted,observedEvent:causal,actualOwner:owner}],clock,language:languages[0],actualStart:start,sourceCue:cue,playStartUnixMs};
}
function sourceVmReferenceInputs(audio,contract,records,beforeSequence) {
 const initial=(records.samples??[]).find(sample=>sample.sequence===beforeSequence);
 const cues=(contract.audio.cues??[]).filter(row=>row.locale===initial?.viewport?.locale);assert.equal(cues.length,1,'one calibrated source-vm cue for the observed locale');const cue=cues[0];
 const matches=(audio.tools.references??[]).filter(row=>exactPin(row.source,cue.source)&&exactPin(row.sourcePCM,cue.sourcePCM));assert.equal(matches.length,1,'one exact source-vm native PCM reference');const reference=matches[0];
 for(const p of [reference.source,reference.sourcePCM,reference.measurement,reference.measurementBinding,reference.decodeReceipt,reference.referencePCM,reference.decoder])checked(audio.root,p,audio.inputPins);
 const nativeReference={measurement:json(audio.root,reference.measurement,audio.inputPins),measurementPin:reference.measurement,
  binding:json(audio.root,reference.measurementBinding,audio.inputPins),bindingPin:reference.measurementBinding};
 const nativePcm=cue.transport==='web-audio-buffer'?{pin:reference.sourcePCM,bytes:fs.readFileSync(checked(audio.root,reference.sourcePCM,audio.inputPins).path)}:undefined;
 let mediaResource;
 if(cue.transport==='html-media') {
  const responses=(records.mediaResources??[]).filter(row=>row.documentId===records.documentId&&row.url===cue.sourceUrl&&
   (row.status===200&&row.contentRange===null||row.status===206&&row.contentRange===`bytes 0-${cue.source.bytes-1}/${cue.source.bytes}`));
  assert(responses.length>0&&responses.every(row=>exactPin(row.body,cue.source)),'actual complete HTML media responses bind the exact source');
  mediaResource=responses[0];for(const response of responses){const file=path.resolve(audio.root,response.body.path);assert.equal(fs.realpathSync(file),file);assert(exactPin(pin(file),response.body),'retained media response bytes changed');}
 }
 return{reference,cueId:cue.id,nativeReference,mediaResource,nativePcm};
}

/** A second declared window checks the actual output after an observed stop.
 * It uses the successful full-cue alignment, retains every source sample, and
 * includes the existing minimum silence window after that full cue ends. */
export function exactZeroOutputTailWindow({remainder,cue,declared,measured,afterUnixMs,policy}) {
 const match=measured?.sourceMatch,range=match?.sourceWindow;
 assert(remainder?.kind==='observed-stop-exact-zero-reference-remainder-v1'&&remainder.outputTailAssessmentRequired===true&&
  exactPin(remainder.sourcePCM,cue.sourcePCM)&&remainder.sampleRate===cue.sampleRate&&remainder.channels===cue.channels&&
  Number.isSafeInteger(remainder.firstOmittedDecodedSample)&&remainder.firstOmittedDecodedSample>=0&&
  remainder.firstOmittedDecodedSample<cue.sourceEndDecodedSample&&remainder.endDecodedSample===cue.sourceEndDecodedSample,
 'EXACT_ZERO_OUTPUT_TAIL_REFERENCE_REQUIRED');
 assert(measured.id===declared.id&&measured.status==='PASS'&&match?.passed===true&&
  measured.sourceSha256===cue.source.sha256&&range?.pcmSha256===cue.sourcePCM.sha256&&
  range.firstDecodedSample===0&&range.endDecodedSample===cue.sourceEndDecodedSample&&range.sampleRate===cue.sampleRate&&range.channels===cue.channels&&
  match.frames===Math.round(cue.sourceEndDecodedSample/cue.sampleRate*48000)&&match.overlap===1&&
  Number.isSafeInteger(match.alignmentFrames)&&Math.abs(match.alignmentFrames)<=policy.maxAlignmentMs*48&&policy.edgeTrimMs===0,
 'EXACT_ZERO_OUTPUT_TAIL_NEEDS_COMPLETE_UNTRIMMED_SOURCE_MATCH');
 const alignedStart=measured.startUnixMs+match.alignmentFrames/48;
 const startUnixMs=alignedStart+remainder.firstOmittedDecodedSample/cue.sampleRate*1000;
 const endUnixMs=alignedStart+cue.sourceEndDecodedSample/cue.sampleRate*1000+policy.minimumWindowMs;
 assert(Number.isFinite(startUnixMs)&&Number.isFinite(endUnixMs)&&Number.isFinite(afterUnixMs)&&
  endUnixMs-startUnixMs>=policy.minimumWindowMs&&startUnixMs>=declared.startUnixMs&&endUnixMs<=afterUnixMs,
 'EXACT_ZERO_OUTPUT_TAIL_MUST_FIT_OBSERVED_OWNER_FLOW');
 return{id:declared.id+':exact-zero-tail',kind:'silent',role:'observed-stop-zero-reference-tail',cueId:cue.id,
  sourceSha256:cue.source.sha256,mediaInstanceId:declared.mediaInstanceId,triggerEventId:declared.triggerEventId,startUnixMs,endUnixMs};
}

export async function exportActualFlowAudio({audio,capture,contract,records,flow,outputDirectory,buildId,entry,entryPin,contractPin,replayFlow}) {
 const references=audio.tools.references??[],initial=(records.samples??[]).find(sample=>sample.sequence===flow.before),sourceVm=initial?.identity?.ownerKind==='source-vm';
 let reference,sourceInputs;
 if(sourceVm) {
  checked(audio.root,audio.tools.exportOwnerBinding,audio.inputPins);
  assert.equal(path.resolve(audio.root,audio.tools.exportOwnerBinding.path),path.join(path.dirname(path.resolve(audio.root,audio.tools.exporter.path)),'audio-owner-binding.mjs'),'exact source-vm exporter owner dependency');
  sourceInputs=sourceVmReferenceInputs(audio,contract,records,flow.before);reference=sourceInputs.reference;
 } else {const hashes=new Set((contract.audio.cues??[]).map(c=>c.sourcePCM?.sha256));reference=references.find(r=>hashes.has(r.sourcePCM.sha256));}
 assert(reference,'exact measured source PCM reference configured');
 for(const p of [reference.source,reference.sourcePCM,reference.measurement,reference.measurementBinding,reference.decodeReceipt,reference.referencePCM,reference.decoder])checked(audio.root,p,audio.inputPins);
 const decoded=json(audio.root,reference.decodeReceipt,audio.inputPins);assert.equal(decoded.decodeMode,'pinned-browser-pcm-resample');assert(exactPin(decoded.originalPCM,reference.sourcePCM));
 const recordsPin=put(outputDirectory,'actual-observer-for-audio.json',records);
 const derived=deriveAudioFlowWindows({contract,records,flow,decodeReceipt:decoded,decodeReceiptPin:reference.decodeReceipt,captureRunId:capture.manifest.runID,captureManifest:capture.manifest,entry,entryPin,contractPin,recordsPin,
  ...(sourceVm?{...sourceInputs,replayFlow:replayFlow??flow.replayFlow}:{})});
 const m=capture.manifest,request={kind:'browser-audio-windows-v1',purpose:'page-audit',runID:m.runID,target:{...m.target,windowID:m.window.windowID},audioProcess:m.audioProcess,captureTool:{sha256:audio.tools.binary.sha256},isolatedBrowser:true,singleTaskAudio:true,pageIdentity:{animationId:contract.animationId,sourceSha256:contract.source.sha256,buildId},events:derived.events,windows:derived.windows};
 const windows=put(outputDirectory,'windows.json',request),binding=put(outputDirectory,'runner-binding.json',{kind:'browser-audio-runner-binding-v1',runID:m.runID,unixMinusRunnerMs:derived.clock.unixMinusRunnerMs,pageSource:contract.source,windows:derived.bindings,clockObservations:derived.clock,actualSourceStart:derived.actualStart});
 const exported=path.join(outputDirectory,'export');let commandError=null,stdout='',stderr='';
 try{const result=await exec(process.execPath,[path.resolve(audio.root,audio.tools.exporter.path),capture.manifestPin.path,windows.path,binding.path,exported],{timeout:180000,maxBuffer:1024*1024});stdout=result.stdout;stderr=result.stderr;}catch(error){commandError=String(error);stdout=error.stdout??'';stderr=error.stderr??'';}
 put(outputDirectory,'export-command.json',{tool:audio.tools.exporter,windows,binding,stdout,stderr,error:commandError});
 const reportPath=path.join(exported,'media-checks.json');assert(fs.existsSync(reportPath),'real audio export report exists');let report=JSON.parse(fs.readFileSync(reportPath)),reportPin=pin(reportPath);
 const remainder=derived.actualStart?.exactZeroRemainder;
 if(remainder&&report.mediaChecks.length) {
  assert(report.missing.length===0&&commandError===null,'complete full-cue export before zero-tail assessment');
  assert(report.assessment.path.startsWith(exported+'/')&&exactPin(pin(report.assessment.path),report.assessment),'unchanged actual full-cue assessment');
  const full=JSON.parse(fs.readFileSync(report.assessment.path)),declared=derived.windows.find(row=>row.kind==='audible');
  const measured=full.windows.find(row=>row.id===declared.id),after=records.samples.find(row=>row.sequence===flow.after);
  const {POLICY}=await import(pathToFileURL(checked(audio.root,audio.tools.analysis,audio.inputPins).path).href);
  const tail=exactZeroOutputTailWindow({remainder,cue:derived.sourceCue,declared,measured,afterUnixMs:after.unixMs,policy:POLICY});
  const tailWindows=put(outputDirectory,'complete-source-and-zero-tail-windows.json',{...request,windows:[...request.windows,tail],
   observedStopReferenceEvidence:remainder,sourceStopCausality:'not-established-by-audio-output-comparison'});
  const tailAssessment=await audio.assessCapture({manifestPath:capture.manifestPin.path,windowsPath:tailWindows.path});
  const tailAssessmentPin=put(outputDirectory,'complete-source-and-zero-tail-assessment.json',tailAssessment);
  const measuredTail=tailAssessment.windows.find(row=>row.id===tail.id);
  const nativeTail=measuredTail?.nativeTailCoverage;
  assert(tailAssessment.passed===true&&measuredTail?.status==='PASS'&&nativeTail?.kind==='exact-native-silent-tail-coverage-v1'&&
   nativeTail.startUnixMs===tail.startUnixMs&&nativeTail.endUnixMs===tail.endUnixMs&&nativeTail.sampleRate===48000&&nativeTail.channels===2&&
   nativeTail.complete===true&&nativeTail.observedFrames===nativeTail.requiredFrames&&nativeTail.missingFrames===0&&
   nativeTail.overlapFrames===0&&nativeTail.nonzeroSamples===0&&measuredTail.overlapFrames===0,
   'ACTUAL_OUTPUT_MUST_PRESERVE_COMPLETE_EXACT_ZERO_REFERENCE_TAIL');
  report={...report,fullCueExport:reportPin,exactZeroTailAssessment:tailAssessmentPin,observedStopReferenceEvidence:remainder,
   sourceStopCausality:'not-established-by-audio-output-comparison',nativeSourceEndedNaturally:false};
  reportPin=put(outputDirectory,'complete-output-media-checks.json',report);
 }
 return{reportPin,report,mediaChecks:report.mediaChecks,silenceChecks:report.silenceChecks,language:derived.language,missing:report.missing,commandError};
}

/** Actual pause/resume output windows; these are not a substituted full natural cue. */
export function deriveLifecycleAudioWindows(args) {
 const initial=(args.records.samples??[]).find(sample=>sample.sequence===args.pauseFlow.before);
 assert(['source-vm','surface-run'].includes(initial?.identity?.ownerKind),'actual audio owner kind required');
 return initial.identity.ownerKind==='source-vm'?deriveSourceVmLifecycleAudioWindows(args):deriveLegacyLifecycleAudioWindows(args);
}
function deriveLegacyLifecycleAudioWindows({contract,records,pauseFlow,stopFlow,decodeReceipt,decodeReceiptPin,captureRunId,captureManifest}) {
 const samples=records.samples??[],before=samples.find(s=>s.sequence===pauseFlow.before),paused=samples.find(s=>s.sequence===pauseFlow.paused),held=samples.find(s=>s.sequence===pauseFlow.held),resumed=samples.find(s=>s.sequence===pauseFlow.resumed);assert(before&&paused&&held&&resumed,'actual pause/resume source samples');
 const owner=before.identity;assert([paused,held,resumed].every(s=>s.identity.playerId===owner.playerId),'one actual control run');
 assert(before.atMs<paused.atMs&&paused.atMs<held.atMs&&held.atMs<resumed.atMs&&paused.host.paused===true&&held.host.paused===true&&resumed.host.paused===false&&paused.source.frame===held.source.frame&&paused.source.tick===held.source.tick&&resumed.source.tick>held.source.tick,'actual pause hold and resume state');
 const decoded=(records.decodes??[]).filter(d=>d.state==='fulfilled'&&d.sha256===decodeReceipt.source.sha256),buffers=new Set(decoded.map(d=>d.bufferId));
 const nodes=(records.starts??[]).filter(n=>n.started&&n.owner?.playerId===owner.playerId&&buffers.has(n.bufferId));
 const cue=contract.audio.cues.find(c=>c.source.sha256===decodeReceipt.source.sha256&&c.sourcePCM.sha256===decodeReceipt.originalPCM.sha256);assert(cue,'exact lifecycle source cue');
 const events=[],windows=[],bindings=[];
 const eventFor=(action,ids)=>{const e=ids.map(id=>(records.events??[]).find(e=>e.sequence===id)).find(e=>e?.trusted&&e.forced===false&&!e.synthetic&&e.playerId===owner.playerId&&(e.action??e.control)===action&&['click','keydown'].includes(e.type));assert(e,'actual '+action+' input');const id=`${records.documentId}:event:${e.sequence}`;if(!events.some(row=>row.id===id))events.push({id,kind:action,unixMs:e.unixMs,mediaInstanceId:owner.playerId,trusted:true,observedEvent:e});return id;};
 const pauseEvent=eventFor('pause',pauseFlow.eventSequences),playEvent=eventFor('play',pauseFlow.eventSequences);
 const silence={id:captureRunId+':pause',kind:'pause',cueId:'actual-pause',sourceSha256:contract.source.sha256,mediaInstanceId:owner.playerId,triggerEventId:pauseEvent,startUnixMs:paused.unixMs+200,endUnixMs:held.unixMs};assert(silence.endUnixMs-silence.startUnixMs>=200,'actual pause output interval');windows.push(silence);
 // A source node after Resume must carry its own observed offset; never continue the old node by assumption.
 const node=nodes.find(n=>n.atMs>=held.atMs&&n.atMs<=resumed.atMs);assert(node,'actual resumed source node');assert(Math.abs(node.offset*cue.sampleRate-Math.round(node.offset*cue.sampleRate))<1e-6,'resumed source offset names an actual PCM sample');
 const actualStart=node.unixMs+(node.effectiveWhen-node.contextTime)*1000,rate=cue.sampleRate;
 const first=Math.round(node.offset*rate)+Math.ceil(.2*rate),available=Math.floor((resumed.unixMs-actualStart-.05*1000)*rate/1000),last=Math.min(first+Math.floor(.8*rate),Math.round(node.offset*rate)+available,cue.sourceEndDecodedSample);
 assert(last-first>=Math.ceil(.2*rate),'actual resumed output interval');
 const startUnixMs=actualStart+(first/rate-node.offset)*1000;
 windows.push({id:captureRunId+':resume',kind:'audible',cueId:'actual-resume-subrange',sourceSha256:cue.source.sha256,mediaInstanceId:owner.playerId,triggerEventId:playEvent,startUnixMs,endUnixMs:startUnixMs+(last-first)/rate*1000+250,reference:{decodeReceiptPath:decodeReceiptPin.path,decodeReceiptSHA256:decodeReceiptPin.sha256,startSeconds:first/rate,endSeconds:last/rate,originalSampleRange:{pcmSha256:cue.sourcePCM.sha256,firstDecodedSample:first,endDecodedSample:last,sampleRate:rate,channels:cue.channels}}});
 if(stopFlow){const stopped=samples.find(s=>s.sequence===stopFlow.stopped),after=samples.find(s=>s.sequence===stopFlow.after);assert(stopped&&after&&stopped.identity.playerId===owner.playerId&&after.identity.playerId===owner.playerId,'actual stop source owner');windows.push({id:captureRunId+':stop',kind:'stop',cueId:'actual-stop',sourceSha256:contract.source.sha256,mediaInstanceId:owner.playerId,triggerEventId:eventFor('pause',stopFlow.eventSequences),startUnixMs:stopped.unixMs+200,endUnixMs:after.unixMs});}
 for(const row of windows){assert(row.startUnixMs>=captureManifest.readyClock.unixMs&&row.endUnixMs<=captureManifest.clockAfter.unixMs,'lifecycle window is inside capture');bindings.push({id:row.id,playerId:owner.playerId,replay:owner.replay,sourceNodeIds:nodes.map(n=>n.nodeId)});}
 return{events,windows,bindings,clock:browserClockMapping(records),claim:'measured pause, actual resumed source subrange, and stopped output; not complete cue or navigation cleanup'};
}
export async function assessActualLifecycleAudio({audio,capture,contract,records,pauseFlow,stopFlow,outputDirectory,buildId}) {
 const initial=(records.samples??[]).find(sample=>sample.sequence===pauseFlow.before),sourceVm=initial?.identity?.ownerKind==='source-vm';
 const sourceInputs=sourceVm?sourceVmReferenceInputs(audio,contract,records,pauseFlow.before):null;
 const reference=sourceInputs?.reference??(audio.tools.references??[]).find(r=>contract.audio.cues.some(c=>c.sourcePCM.sha256===r.sourcePCM.sha256));assert(reference,'exact lifecycle source reference');const decoded=json(audio.root,reference.decodeReceipt,audio.inputPins);
 const derived=deriveLifecycleAudioWindows({contract,records,pauseFlow,stopFlow,decodeReceipt:decoded,decodeReceiptPin:reference.decodeReceipt,captureRunId:capture.manifest.runID,captureManifest:capture.manifest,...(sourceInputs??{})});
 const m=capture.manifest,request={kind:'browser-audio-windows-v1',purpose:'page-audit',runID:m.runID,target:{...m.target,windowID:m.window.windowID},audioProcess:m.audioProcess,captureTool:{sha256:audio.tools.binary.sha256},isolatedBrowser:true,singleTaskAudio:true,pageIdentity:{animationId:contract.animationId,sourceSha256:contract.source.sha256,buildId},events:derived.events,windows:derived.windows};
 const windows=put(outputDirectory,'windows.json',request),raw=put(outputDirectory,'observer.json',records),result=await audio.assessCapture({manifestPath:capture.manifestPin.path,windowsPath:windows.path});
 const report=put(outputDirectory,'lifecycle-analysis.json',{kind:'actual-audio-lifecycle-observation-v1',result,windowOwners:derived.bindings,clock:derived.clock,raw,claim:derived.claim,navigationCleanupAccepted:false,completeNaturalCueAccepted:false});return{report,result};
}
