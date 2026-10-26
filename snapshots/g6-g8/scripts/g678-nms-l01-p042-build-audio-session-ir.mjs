#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SELF='scripts/g678-nms-l01-p042-build-audio-session-ir.mjs';
const WORK='work/g678-shared-page-factory/g678-nms-l01-p042-audio-session-ir-v1';
const GENERATED='packages/demos/src/generated/g678-nms-l01-p042-audio-timing-ir-v1.ts';
const PINS=[
  ['work/g678-shared-page-factory/g678-nms-l01-p042-source-visual-v1/source-projection.json',31878,'531370200b14bfa45cbe11c4d3eb3758aa9236cf10ea429316aea8144c28de3e'],
  ['work/g678-shared-page-factory/g678-nms-l01-p042-audio-integrity-v1/audit.json',27972,'19af469a15c781c38025c08f3d69cda145867907664fe4808488e593ef587787'],
  ['work/g678-shared-page-factory/g678-nms-l01-p042-audio-decoder-origin-v1/evidence.json',178406,'35e0ac1d66bcc144309dfa6f65d9782b243a0ff4ac866adf50bf8de31f909104'],
  ['work/g678-shared-page-factory/g678-nms-l01-p042-source-visual-v1/source-stream.mp3',48880,'e6a32f6230b6195724ad2ce44cd49a560fb71a538bca407081bcce0d5f859bd1'],
];
const sha=b=>createHash('sha256').update(b).digest('hex'),json=x=>`${JSON.stringify(x,null,2)}\n`;
async function binding(file){const p=path.resolve(ROOT,file),s=await lstat(p);assert.ok(s.isFile()&&s.nlink===1);assert.equal(await realpath(p),p);const b=await readFile(p);return{path:file,bytes:b.length,sha256:sha(b)};}
export async function build({check=false}={}) {
  const inputs=[];for(const [file,bytes,sha256]of PINS){const b=await binding(file);assert.deepEqual(b,{path:file,bytes,sha256});inputs.push(b);}
  const [projection,audit,measurement]=await Promise.all(PINS.slice(0,3).map(async([file])=>JSON.parse(await readFile(path.join(ROOT,file)))));
  assert.deepEqual(projection.main.blocks,audit.sourceTiming.blocks);assert.deepEqual(measurement.sourceFacts.blocks,projection.main.blocks);
  assert.equal(measurement.status,'passed');assert.equal(measurement.inputsUnchanged,true);
  for(const record of measurement.records){assert.equal(record.origin.status,'measured-relative-origin');assert.equal(record.origin.lagSamples,0);
    assert.equal(record.decoded.channels,1);for(const file of [record.output,record.referenceOutput])assert.deepEqual(await binding(file.path),file);}
  let prefix=0;const blocks=projection.main.blocks.map(block=>{const row={...block,declaredSamplesBeforeBlock:prefix};prefix+=block.sampleCount;return row;});
  assert.equal(prefix,216576);assert.equal(blocks.length,118);
  const ir={schemaVersion:1,artifactType:'g678-nms-l01-p042-pure-audio-timing-ir-v1',animationId:'shared-nms002-l01-p042',
    source:audit.source,sourceStream:inputs[3],sourceBindings:inputs.slice(0,3),
    timeline:{rootFrameCount:10,rootEntryFrame:6,frameDomain:'sprite-23',frameCount:125,fps:12,firstStreamFrame:8,lastStreamFrame:125},
    sourceTiming:{nativeRate:22050,declaredSampleCount:prefix,latencyField:1673,automaticPrimingTrim:0,continuousOrigin:'unresolved',frameEntrySeekPolicy:'unresolved',terminalPhase:'unresolved',blocks},
    decoderProfiles:measurement.records.map(record=>({id:`chromium-149-${record.requestedRate===null?'default':'requested'}-${record.decoded.sampleRate}`,
      sampleRate:record.decoded.sampleRate,channels:record.decoded.channels,length:record.decoded.length,pcmSha256:record.pcm.sha256,
      relativeOriginSamples:record.origin.lagSamples,referenceRate:record.origin.rate,nativeCoordinateScale:{numerator:22050,denominator:record.decoded.sampleRate},
      referenceLength:record.reference.samples,referenceExcludedSuffix:record.origin.fullOverlap.excluded.referenceSuffix,
      sourceAlignmentProven:false,spokenLanguage:'unestablished'})),
    policy:{kind:'pure-engineering-candidate-only',source125:'hold-decoder-cursor-pending-source-boundary-decision',decoderEof:'hold-no-lesson-completion',
      frameEntry:'return-source-facts-without-seek',sourceAlignment:'unresolved',audioNodes:false,delivery:false},
    gates:{registered:false,productCalibrationPassed:false,audioIntegrated:false,audioSynchronized:false,audioAccepted:false,
      originalRuntime:false,humanListening:false,humanVisual:false,ownerAccepted:false,strictComplete:false,releaseEligible:false,published:false}};
  const values=new Map([[`${WORK}/ir.json`,json(ir)],[GENERATED,`// Generated from exact pinned source and decoder measurement; do not hand-edit.\nexport const G678_NMS_L01_P042_AUDIO_TIMING_IR = ${JSON.stringify(ir,null,2)} as const;\n`]]);
  const generator=await binding(SELF),outputs=[...values].map(([file,bytes])=>({path:file,bytes:Buffer.byteLength(bytes),sha256:sha(bytes)}));
  values.set(`${WORK}/manifest.json`,json({schemaVersion:1,artifactType:'g678-nms-l01-p042-pure-audio-timing-ir-build-v1',inputs,generator,outputs,gates:ir.gates}));
  if(check){for(const[file,bytes]of values){assert.equal(await readFile(path.join(ROOT,file),'utf8'),bytes);await binding(file);}}
  else {await mkdir(path.join(ROOT,WORK));for(const[file,bytes]of values)await writeFile(path.join(ROOT,file),bytes,{flag:'wx',mode:0o444});}
  return{check,writes:check?0:values.size,outputs:await Promise.all([...values.keys()].map(binding))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert.ok(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');
  build({check:process.argv[2]==='--check'}).then(x=>console.log(json(x))).catch(e=>{console.error(e);process.exitCode=1;});
}
