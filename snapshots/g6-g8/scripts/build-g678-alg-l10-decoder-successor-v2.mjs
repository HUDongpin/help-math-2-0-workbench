#!/usr/bin/env node
// Source-bound decoder fingerprint successor. Drawings, source streams and modules are retained.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat,readFile,realpath,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderTerminalSourceTimeline} from './lib/g678-terminal-source-timeline-emitter-v1.mjs';
const encode=value=>JSON.stringify(value,null,2)+'\n';
const pin=(file,bytes)=>({path:file,bytes:Buffer.byteLength(bytes),sha256:hash(bytes)});
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const CALIBRATION='g678-alg-l10-p005-p006-native-decoder-v2';
export const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
export const RUN=`work/g678-shared-page-factory/${CALIBRATION}`;
export const BUILDER='scripts/build-g678-alg-l10-decoder-successor-v2.mjs';
const EMITTER='scripts/lib/g678-terminal-source-timeline-emitter-v1.mjs';
const BINDINGS={
  "workspaceRoot": "/Volumes/WestWorld/HELP MATH 2.0-g678-implementation",
  "previousFreeze": {
    "path": "catalog/product-bridge-calibrations/g678-alg-l10-p005-p006-current-js-v3.json",
    "bytes": 68806,
    "sha256": "5aa5a358aed5f2bd427b3471b7f6318222d22d51f1af3a8a22e9a337bbc4a41b"
  },
  "previousEmitter": {
    "path": "scripts/lib/g678-terminal-source-generator-v6.mjs",
    "bytes": 19242,
    "sha256": "487d1ab7037065f62ab44fd7007e9c6606b54aa08f218d0e6bd383b9acb53801"
  },
  "historicalCanvasGenerator": {
    "path": "scripts/build-safe-ffdec-canvas-adapter.mjs",
    "bytes": 115553,
    "sha256": "1d1dd117dd59a6b7191f2fa8488249ece09bfb1da8837be146677f88a01315dd"
  },
  "currentCanvasGenerator": {
    "path": "scripts/build-safe-ffdec-canvas-adapter.mjs",
    "bytes": 115564,
    "sha256": "22fc00187e15c34883905423f4be3a837832fd060287d8b6b25e9ddab660f8c1"
  },
  "measurements": [
    {
      "id": "shared-alg001-l10-p005",
      "receipt": {
        "path": "/Volumes/American Dream/g678-p005-native-diagnostic-20261008-v1/receipt-v1.json",
        "bytes": 3070,
        "sha256": "c13162147aa1b9ea374c0d85bf5ef98a1e926bd05714ac2062b2e68e58345dec"
      },
      "result": {
        "path": "/Volumes/American Dream/g678-p005-native-diagnostic-20261008-v1/native-result-v1.json",
        "bytes": 4664,
        "sha256": "4c22198c8f5d27905b00c6adbc3b93cd6fa8f3e8a33dd0d7f0d0df07d60d34bb"
      },
      "cleanup": {
        "path": "/Volumes/American Dream/g678-p005-native-diagnostic-20261008-v1/cleanup-v1.json",
        "bytes": 8938,
        "sha256": "009be5cc94718805170bef4feaf8c0903c2c0de8e4fad1fa0d840d67acfe71b9"
      },
      "plan": {
        "path": "/Volumes/American Dream/g678-p005-native-diagnostic-preparation-20261008-v1/plan-v1.json",
        "bytes": 2231,
        "sha256": "8adf0425761dd71f74fefa5a4c1540dbc3fa0ca8e2251a2c9b8d7578be8e8916"
      },
      "preparation": {
        "path": "/Volumes/American Dream/g678-p005-native-diagnostic-preparation-20261008-v1/manifest-v1.json",
        "bytes": 4999,
        "sha256": "b716749355501863ecb0c447ea0ea0d59c0d088dae138a8375414a034044ebcb"
      }
    },
    {
      "id": "shared-alg001-l10-p006",
      "receipt": {
        "path": "/Volumes/American Dream/g678-p006-native-diagnostic-20261008-v1/receipt-v1.json",
        "bytes": 3070,
        "sha256": "0f03c8636294f988071de905229d8b2cd6a04302bc2241144a81815771f03d07"
      },
      "result": {
        "path": "/Volumes/American Dream/g678-p006-native-diagnostic-20261008-v1/native-result-v1.json",
        "bytes": 4662,
        "sha256": "c5ccc5ff3e5e510a066cafe7fb2e283464c3f0eae7eb20f6346a147be1cade26"
      },
      "cleanup": {
        "path": "/Volumes/American Dream/g678-p006-native-diagnostic-20261008-v1/cleanup-v1.json",
        "bytes": 9125,
        "sha256": "083bbefc04e73d3efd9224591203424296c551a4dab8711127725e01ff802f36"
      },
      "plan": {
        "path": "/Volumes/American Dream/g678-p006-native-diagnostic-preparation-20261008-v1/plan-v1.json",
        "bytes": 2231,
        "sha256": "ccb73f4bdfaadc9ab64e50963fec577b43373bcc8dea6277c6186ea387346905"
      },
      "preparation": {
        "path": "/Volumes/American Dream/g678-p006-native-diagnostic-preparation-20261008-v1/manifest-v1.json",
        "bytes": 5541,
        "sha256": "a3f73dd1f3f1ca5a4e98522139b45e2e523ea33f8be3841b4dae25a4aebc1634"
      }
    }
  ]
};
const SOURCE_ROOT=BINDINGS.workspaceRoot;
export const IDS=Object.freeze(BINDINGS.measurements.map(row=>row.id));
const hash=b=>createHash('sha256').update(b).digest('hex');
const stableKeys=['dev','ino','size','mode','mtimeNs','nlink'];
async function exact(binding,base=SOURCE_ROOT) {
 const file=path.resolve(base,binding.path),before=await lstat(file,{bigint:true});
 assert(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n&&await realpath(file)===file,`ordinary input: ${file}`);
 const bytes=await readFile(file),after=await lstat(file,{bigint:true});
 for(const key of stableKeys)assert.equal(before[key],after[key],`unstable input: ${file}`);
 assert.equal(bytes.length,binding.bytes,`input size: ${file}`);assert.equal(hash(bytes),binding.sha256,`input hash: ${file}`);return bytes;
}
async function ownPin(file) {const bytes=await readFile(path.join(ROOT,file));const binding=pin(file,bytes);await exact(binding,ROOT);return binding;}
const json=bytes=>JSON.parse(bytes.toString());
function parseTimeline(text) {
 const prefix="// Generated by g678-terminal-source-generator-v6.mjs; do not edit.\nimport type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';\nimport type {ContinuousSourceClockPlan} from '../continuous-source-stream-clock-candidate';\nexport const CONFIG = ";
 const middle=' as const satisfies SourceStaticCanvasCandidateConfig;\nexport const PLAN = ',suffix=' as const satisfies ContinuousSourceClockPlan;\n';
 assert(text.startsWith(prefix)&&text.endsWith(suffix),'exact maintained timeline format');
 const content=text.slice(prefix.length,-suffix.length),parts=content.split(middle);assert.equal(parts.length,2,'two JSON literals');
 return {config:JSON.parse(parts[0]),audio:JSON.parse(parts[1])};
}
export function validateMeasurement(result,receipt,old,entry,legacy) {
 assert.equal(receipt.diagnosticExecutionPass,true);assert.equal(receipt.error,null);assert.equal(receipt.execution.exitCode,0);assert.equal(receipt.execution.completeOutput,true);
 for(const key of ['measurementExecuted','contextsClosed','observerAndNativeEqual'])assert.equal(receipt[key],true,key);
 for(const key of ['measurementExecuted','contextsClosed','measurementPass','observerAndNativeEqual','actualContextClosed'])assert.equal(result[key],true,key);
 assert.equal(result.actualBrowserVersion,'154.0.8037.98');assert.equal(result.problem,null);
 assert.equal(result.registrationDelta,0);assert.equal(result.productPageAccepted,false);assert.equal(result.audioAccepted,false);assert.equal(result.originalRuntimeAccepted,false);
 assert.deepEqual(result.denied,[]);assert.deepEqual(result.pageErrors,[]);
 const data=result.result;assert.equal(data.secureContext,true);assert.equal(data.audioPlaybackScheduled,false);assert.equal(data.syntheticPcm,false);assert.equal(data.actualSourceStillIntact,true);
 assert.equal(data.decodeMethod,'actual native AudioContext.decodeAudioData');assert.equal(data.pcmHashEncoding,'channel-major finite Float32 little-endian; source transport algorithm');
 assert.deepEqual(data.expectedDecoder,old.decoder);assert.deepEqual(data.actualSource,{bytes:old.decoder.sourceBytes,sha256:old.decoder.sourceSha256});
 for(const key of ['module','timeline'])assert.deepEqual(result.sourceBinding[key],{...entry.artifacts[key],path:path.join(SOURCE_ROOT,entry.artifacts[key].path)});
 assert.equal(result.sourceBinding.sourceSwfSha256,old.sourceSwfSha256);assert.deepEqual(legacy.plan,old);assert.equal(legacy.browserVersion,'149.0.7827.55');assert.equal(legacy.repeatedDecodeIdentical,true);
 assert.equal(data.rows.length,2);assert.deepEqual(data.rows.map(row=>row.label),['unmodified-native-constructor','mylesson-close-observer']);
 assert.deepEqual(data.rows[0].actual,data.rows[1].actual);
 for(const row of data.rows) {
  assert.equal(row.measurementExecuted,true);assert.equal(row.problem,null);assert.equal(row.closeResolved,true);assert.equal(row.contextStateAfterClose,'closed');
  for(const key of ['sampleRate','channels','decodedSamples'])assert.equal(row.actual[key],old.decoder[key],`preserve ${key}`);
  assert.match(row.actual.pcmSha256,/^[0-9a-f]{64}$/u);assert.notEqual(row.actual.pcmSha256,old.decoder.pcmSha256);
  assert.deepEqual(row.equal,{sampleRate:true,channels:true,decodedSamples:true,pcmSha256:false});
  assert.equal(row.actual.durationSeconds,row.actual.decodedSamples/row.actual.sampleRate);
 }
 assert.deepEqual(data.observerAudit,{nativeDecodeInherited:true,ownDecodeOverride:false,nativeCreateBufferInherited:true});
 assert.equal(data.pendingClose,0);assert(data.observedContexts.length===1&&data.observedContexts.every(row=>row.state==='closed'&&row.closeCalls===1));
 return {...old,decoder:{...old.decoder,pcmSha256:data.rows[0].actual.pcmSha256}};
}
export async function prepare() {
 const previousBytes=await exact(BINDINGS.previousFreeze),previous=json(previousBytes);
 assert.equal(previous.calibrationId,'g678-alg-l10-p005-p006-current-js-v3');assert.deepEqual(previous.entries.map(e=>e.key),IDS);
 const outputs=new Map(),timelines=new Set(previous.entries.map(entry=>entry.artifacts.timeline.path));
 const activeInputs=new Map(),historicalInputs=[];
 const add=entry=>{const prior=activeInputs.get(entry.path);if(prior)assert.deepEqual(prior,entry);activeInputs.set(entry.path,entry);};
 // Verify unchanged source/runtime inputs without pretending the dated generator can be replayed unchanged.
 for(const binding of previous.inputs) {
  if(timelines.has(binding.path))continue;
  if(binding.path===BINDINGS.historicalCanvasGenerator.path){historicalInputs.push(binding);continue;}
  await exact(binding);add(binding);
 }
 await exact(BINDINGS.currentCanvasGenerator);
 const originalGenerator=(await exact(BINDINGS.previousEmitter)).toString();
 const start=originalGenerator.indexOf('  const timeline = `'),end=originalGenerator.indexOf('\n  const module = ',start);assert(start>=0&&end>start);
 const originalLine=originalGenerator.slice(start,end);assert.equal(originalLine.split('sourceSpec.audio').length,2);
 const extracted='export function renderTerminalSourceTimeline(config, audio) {\n  return '+originalLine.slice(originalLine.indexOf(' = ')+3).replace('sourceSpec.audio','audio')+'\n}\n';
 const expectedEmitter="// Pure timeline template extracted from the pinned v6 generator; predecessor source remains unchanged.\nconst encode = value => JSON.stringify(value, null, 2) + '\\n';\n"+extracted;
 assert.equal((await readFile(path.join(ROOT,EMITTER))).toString(),expectedEmitter,'exact pure template extraction from unchanged pinned v6');
 const emitter=await ownPin(EMITTER),builder=await ownPin(BUILDER);add(emitter);add(builder);add(BINDINGS.previousFreeze);
 const inheritedOutputs=new Map(previous.outputs.map(binding=>[binding.path,binding]));
 for(const binding of previous.outputs)if(!timelines.has(binding.path))await exact(binding);
 const members=[],entries=[],changes=[],checks=[];
 for(let i=0;i<IDS.length;i++) {
  const measurement=BINDINGS.measurements[i],entry=previous.entries[i],member=previous.members[i];assert.equal(member.animationId,IDS[i]);
  const sourceSpec=json(await exact(member.sourceSpec));assert.deepEqual(sourceSpec.audio,member.audioPlan);assert.deepEqual(sourceSpec.source,member.source);
  const oldTimeline=entry.artifacts.timeline,snapshot=`${RUN}/predecessor/${IDS[i]}.ts`,snapshotBinding={...oldTimeline,path:snapshot};
  let oldBytes;
  try {oldBytes=await exact(snapshotBinding,ROOT);}catch(error){if(error.code!=='ENOENT')throw error;oldBytes=await exact(oldTimeline);}
  outputs.set(snapshot,oldBytes);add(snapshotBinding);
  const oldText=oldBytes.toString(),{config,audio}=parseTimeline(oldText);
  assert.deepEqual(audio,sourceSpec.audio);assert.equal(renderTerminalSourceTimeline(config,audio),oldText,'old emitter exact byte reconstruction');
  assert.equal(config.animationId,IDS[i]);assert.equal(config.sourceSwfSha256,member.source.sha256);assert.equal(config.assetSha256,entry.artifacts.runtime.sha256);
  assert.equal(config.assetSource,`/flash-assets/g678-local/${IDS[i]}/canvas-renderer.js`);assert.equal(config.mainFrameCount,audio.lastFrame);assert.equal(config.mainFrameDomain,audio.frameDomain);
  const legacyPin=sourceSpec.inputs.find(row=>row.path.endsWith('/audio/measurement.json'));assert(legacyPin);
  const legacy=json(await exact(legacyPin)),receipt=json(await exact(measurement.receipt)),result=json(await exact(measurement.result));
  assert.deepEqual(receipt.result,measurement.result);assert.deepEqual(receipt.cleanup,measurement.cleanup);assert.deepEqual(receipt.plan,measurement.plan);assert.deepEqual(receipt.manifest,measurement.preparation);
  for(const binding of [measurement.cleanup,measurement.plan,measurement.preparation])await exact(binding);
  const cleanup=json(await exact(measurement.cleanup));assert.equal(cleanup.pass,true);assert.equal(cleanup.error,null);assert.deepEqual(cleanup.remainingOwnedProcesses,[]);assert.deepEqual(cleanup.unresolvedIdentityQuarantines,[]);assert.equal(cleanup.close.exitCode,0);assert.equal(cleanup.temporaryRootRemoved,true);assert.equal(cleanup.dedicatedDaemonDirectoryRemoved,true);
  assert.deepEqual(result.sourceBinding.legacyMeasurement,legacyPin);assert.deepEqual(result.sourceBinding.transportAlgorithm,{...previous.inputs.find(row=>row.path==='packages/demos/src/decoded-source-stream-transport.ts'),path:path.join(SOURCE_ROOT,'packages/demos/src/decoded-source-stream-transport.ts')});
  const newAudio=validateMeasurement(result,receipt,audio,entry,legacy),newText=renderTerminalSourceTimeline(config,newAudio);
  assert.equal(oldText.split(audio.decoder.pcmSha256).length,2);assert.equal(newText,oldText.replace(audio.decoder.pcmSha256,newAudio.decoder.pcmSha256),'only the measured PCM fingerprint changes');
  const timeline=pin(oldTimeline.path,newText),nextEntry={...entry,artifacts:{...entry.artifacts,timeline}};
  outputs.set(timeline.path,newText);inheritedOutputs.set(timeline.path,timeline);entries.push(nextEntry);
  members.push({...member,entry:nextEntry,audioPlan:newAudio,sourceFreezeDisposition:'preserved predecessor generation; new decoder binding below',decoderBinding:{legacyMeasurement:legacyPin,nativeMeasurement:measurement.result,nativeReceipt:measurement.receipt,browserVersion:result.actualBrowserVersion}});
  for(const binding of Object.values(measurement).filter(value=>value&&typeof value==='object'&&value.path))add(binding);
  changes.push({animationId:IDS[i],timelineBefore:oldTimeline,timelineAfter:timeline,oldPcmSha256:audio.decoder.pcmSha256,newPcmSha256:newAudio.decoder.pcmSha256,unchangedDecoderFields:['sourceSha256','sourceBytes','sampleRate','channels','decodedSamples'],unchangedAudioTimeline:true,unchangedModule:entry.artifacts.module,unchangedDrawing:entry.artifacts.runtime});
  checks.push({animationId:IDS[i],oldEmitterByteIdentical:true,newTimelineOnlyPcmShaChanged:true,nativeAndObserverEqual:true,sourceSpecPreserved:true});
 }
 const freeze={...previous,calibrationId:CALIBRATION,entries,members,inputs:[...activeInputs.values()],outputs:[...inheritedOutputs.values()],
  supersedes:{freeze:BINDINGS.previousFreeze,scope:'two native decoder PCM bindings only',changes,
   historicalGenerationInputs:historicalInputs,observedCurrentCanvasGenerator:BINDINGS.currentCanvasGenerator,canvasGeneratorRevalidated:false,
   drawingRegenerated:false,sharedV6GeneratorChanged:false,legacyBuildCheckDisposition:'Predecessor page/pair builders remain historical and must not validate this successor. Use this maintained successor builder for these two timelines.',
   sourceSpecsAndOldMeasurements:'preserved byte-for-byte; sourceSpec audio is the legacy plan, members[].audioPlan is the explicit decoder successor',
   predecessorTimelineSnapshots:changes.map(change=>({...change.timelineBefore,path:`${RUN}/predecessor/${change.animationId}.ts`}))},
  productCalibrationPassed:false,scaleOutAuthorized:false,decoderBindingValidated:true,productBrowserValidationPending:true,registrationDelta:0};
 assert(Object.values(freeze.acceptanceEffects).every(value=>value===false));
 const freezeBytes=encode(freeze),freezePin=pin(FREEZE,freezeBytes);outputs.set(FREEZE,freezeBytes);
 outputs.set(FRAGMENT,encode({schemaVersion:1,calibration:{calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,freezeManifestBytes:freezePin.bytes,freezeManifestSha256:freezePin.sha256,entries}}));
 outputs.set(`${RUN}/run-manifest.json`,encode({schemaVersion:1,kind:'two-page-native-decoder-binding-successor',checks,freeze:freezePin,outputs:[...outputs].map(([file,bytes])=>pin(file,bytes)),registrationChanged:false,registrationDelta:0,drawingRegenerated:false,sourceAudioChanged:false,productBrowserValidationPending:true,productCalibrationPassed:false,scaleOutAuthorized:false}));
 return {outputs,freeze:freezePin,checks,changes,inputCount:activeInputs.size};
}
export async function build({check=false}={}) {
 const prepared=await prepare();
 // Generate all bytes first. Existing files must already be the exact successor; installation is a separate reviewed transaction.
 for(const [file,bytes] of prepared.outputs) {
  const existing=await readFile(path.join(ROOT,file)).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  if(check||existing)assert(existing&&existing.equals(Buffer.from(bytes)),`successor output mismatch: ${file}`);
 }
 if(!check)for(const [file,bytes] of prepared.outputs){const full=path.join(ROOT,file);await mkdir(path.dirname(full),{recursive:true});try{await writeFile(full,bytes,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;}}
 return {check,freeze:prepared.freeze,checks:prepared.checks,outputCount:prepared.outputs.size,registrationChanged:false,drawingRegenerated:false,productBrowserValidationPending:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {assert.equal(process.argv.length,3);assert(['--write','--check'].includes(process.argv[2]));console.log(encode(await build({check:process.argv[2]==='--check'})));}
