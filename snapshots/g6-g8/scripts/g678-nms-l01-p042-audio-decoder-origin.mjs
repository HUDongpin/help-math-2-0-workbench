#!/usr/bin/env node
// Isolated decoder measurement only. No player, audio URL, source node or product import.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, readdir, writeFile, statfs} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/g678-nms-l01-p042-audio-decoder-origin.mjs';
const STEM = 'work/g678-shared-page-factory/g678-nms-l01-p042-';
export const SOURCE = Object.freeze({path: `${STEM}source-visual-v1/source-stream.mp3`, bytes: 48880,
  sha256: 'e6a32f6230b6195724ad2ce44cd49a560fb71a538bca407081bcce0d5f859bd1'});
const AUDIT = {path: `${STEM}audio-integrity-v1/audit.json`, bytes: 27972,
  sha256: '19af469a15c781c38025c08f3d69cda145867907664fe4808488e593ef587787'};
const PROJECTION = {path: `${STEM}source-visual-v1/source-projection.json`, bytes: 31878,
  sha256: '531370200b14bfa45cbe11c4d3eb3758aa9236cf10ea429316aea8144c28de3e'};
const FFMPEG = {path: '/opt/homebrew/Cellar/ffmpeg/8.1.2_1/bin/ffmpeg', bytes: 426224,
  sha256: 'dad4b30b36a1a999bfa4b6ffbde138bd17ee496c69e12eef638227dff2c6415c'};
const FFPROBE = {path: '/opt/homebrew/Cellar/ffmpeg/8.1.2_1/bin/ffprobe', bytes: 236912,
  sha256: 'cfeefcc9207eb3fa424679228fe3848db2921b15537d26c1ccc4a7a61de95d00'};
export const METHOD = Object.freeze({reference: 'FFmpeg mp3float full EOF, untrimmed native mono float32 little-endian PCM',
  equation: 'candidate[j] approximately equals reference[j + lag]; positive lag means candidate sample zero maps later in reference',
  sampleRate: 22050, lagRadiusNativeSamples: 4096, integerLagStep: 1, probeStride: 32,
  minimumCorrelation: 0.98, maximumNormalizedRmse: 0.1, minimumPeakMargin: 0.00001,
  zeroThreshold: 1e-8, primingAdjustmentApplied: 0, sourceLatencyField: 1673,
  defaultRateReference: 'FFmpeg resampling the native reference PCM; not browser resampler parity or Flash authority',
  edges: 'Report both excluded prefix and suffix lengths; never infer a trim from overlap alone',
  silenceBoundary: 'No AudioBufferSourceNode, connect, start, resume, media element, URL, route or playback'});
const sha = b => createHash('sha256').update(b).digest('hex');
const json = x => `${JSON.stringify(x, null, 2)}\n`;
export function assertSource(bytes) { assert.equal(bytes.length, SOURCE.bytes); assert.equal(sha(bytes), SOURCE.sha256, 'Exact p042 MP3 bytes required'); }
export function parseArgs(args) {
  assert.equal(args.length, 2); assert.equal(args[0], '--run'); assert.match(args[1], /^v[1-9][0-9]*$/u);
  return args[1];
}
export async function physicalBinding(file) {
  const absolute = path.resolve(ROOT, file), s = await lstat(absolute);
  assert.ok(s.isFile() && !s.isSymbolicLink() && s.nlink === 1, `Ordinary single-link file required: ${file}`);
  assert.equal(await realpath(absolute), absolute, `Canonical path required: ${file}`);
  const bytes = await readFile(absolute), after = await lstat(absolute);
  assert.deepEqual([after.dev, after.ino, after.size, after.mtimeMs], [s.dev, s.ino, s.size, s.mtimeMs]);
  return {path: file, bytes: bytes.length, sha256: sha(bytes)};
}
export function pcmFromBytes(bytes) {
  assert.ok(bytes.length > 0 && bytes.length % 4 === 0, 'Nonempty whole float32 PCM required');
  const result = new Float32Array(bytes.length / 4);
  for (let i = 0; i < result.length; i++) { result[i] = bytes.readFloatLE(i * 4); assert.ok(Number.isFinite(result[i]), 'Nonfinite PCM'); }
  return result;
}
function rangeMetrics(reference, candidate, lag, start, end, stride = 1) {
  let n=0,sx=0,sy=0,sxx=0,syy=0,sxy=0,sse=0,maxAbs=0;
  for(let j=start;j<end;j+=stride) {const x=reference[j+lag],y=candidate[j],d=x-y;n++;sx+=x;sy+=y;sxx+=x*x;syy+=y*y;sxy+=x*y;sse+=d*d;maxAbs=Math.max(maxAbs,Math.abs(d));}
  const vx=sxx-sx*sx/n,vy=syy-sy*sy/n,denominator=Math.sqrt(vx*vy);
  return {sampleCount:n,correlation:denominator>1e-20?Math.max(-1,Math.min(1,(sxy-sx*sy/n)/denominator)):null,
    rmse:Math.sqrt(sse/n),referenceRms:Math.sqrt(sxx/n),normalizedRmse:sxx>1e-20?Math.sqrt(sse/sxx):null,maxAbs};
}
export function alignedMetrics(reference, candidate, lag) {
  assert.ok(Number.isSafeInteger(lag));
  const start=Math.max(0,-lag),end=Math.min(candidate.length,reference.length-lag);
  assert.ok(end>start, 'Offset has no overlap');
  return {lag, candidateRange:[start,end],referenceRange:[start+lag,end+lag],
    excluded:{referencePrefix:start+lag,referenceSuffix:reference.length-end-lag,candidatePrefix:start,candidateSuffix:candidate.length-end},
    ...rangeMetrics(reference,candidate,lag,start,end)};
}
export function findOrigin(reference, candidate, rate, options={}) {
  assert.ok(Number.isSafeInteger(rate)&&rate>0&&rate<=192000);
  const radius=options.radius??Math.ceil(METHOD.lagRadiusNativeSamples*rate/METHOD.sampleRate),stride=options.stride??METHOD.probeStride;
  assert.ok(Number.isSafeInteger(radius)&&radius>0&&radius<=40000&&Number.isSafeInteger(stride)&&stride>0);
  const end=Math.min(reference.length,candidate.length)-radius,start=radius;
  assert.ok(end-start>=512,'Not enough common PCM for bounded origin search');
  const ranked=[];
  for(let lag=-radius;lag<=radius;lag++) {const m=rangeMetrics(reference,candidate,lag,start,end,stride);ranked.push({lag,correlation:m.correlation});}
  ranked.sort((a,b)=>(b.correlation??-2)-(a.correlation??-2)||Math.abs(a.lag)-Math.abs(b.lag)||a.lag-b.lag);
  const best=ranked[0],margin=best.correlation===null?null:best.correlation-(ranked[1].correlation??-1);
  const full=alignedMetrics(reference,candidate,best.lag),length=full.sampleCount;
  const windows=[0,.45,.9].map(fraction=>{const begin=full.candidateRange[0]+Math.floor(length*fraction),end=Math.min(full.candidateRange[1],begin+Math.floor(length*.1));
    const local=[];for(let lag=Math.max(-radius,best.lag-8);lag<=Math.min(radius,best.lag+8);lag++) {
      const lo=Math.max(begin,0,-lag),hi=Math.min(end,candidate.length,reference.length-lag);
      local.push({lag,...rangeMetrics(reference,candidate,lag,lo,hi)});
    }local.sort((a,b)=>(b.correlation??-2)-(a.correlation??-2));
    return {candidateRange:[begin,end],atGlobalLag:rangeMetrics(reference,candidate,best.lag,begin,end),localSearch:local[0]};});
  const matched=best.correlation!==null&&best.correlation>=METHOD.minimumCorrelation&&full.normalizedRmse!==null&&
    full.normalizedRmse<=METHOD.maximumNormalizedRmse&&margin>=METHOD.minimumPeakMargin&&Math.abs(best.lag)<radius&&
    windows.every(w=>w.localSearch.lag===best.lag&&w.atGlobalLag.correlation>=METHOD.minimumCorrelation);
  return {status:matched?'measured-relative-origin':'unresolved',rate,lagSamples:best.lag,lagMs:best.lag/rate*1000,
    physicalRadiusMs:radius/rate*1000,search:{minimumLag:-radius,maximumLag:radius,step:1,probeStride:stride,commonProbeRange:[start,end]},
    topFive:ranked.slice(0,5),peakMargin:margin,fullOverlap:full,windows};
}
export function assertMeasuredOrigin(measurement, expectedLag) {
  assert.equal(measurement.status,'measured-relative-origin','Origin is unresolved');
  assert.equal(measurement.lagSamples,expectedLag,'Claimed decoder origin differs from measurement');
}
function describePcm(bytes,rate) {
  const pcm=pcmFromBytes(bytes);let peak=0,squares=0,first=-1,last=-1;
  for(let i=0;i<pcm.length;i++){const a=Math.abs(pcm[i]);peak=Math.max(peak,a);squares+=pcm[i]*pcm[i];if(a>METHOD.zeroThreshold){if(first<0)first=i;last=i;}}
  return {bytes:bytes.length,sha256:sha(bytes),sampleRate:rate,channels:1,samples:pcm.length,durationSeconds:pcm.length/rate,
    peak,rms:Math.sqrt(squares/pcm.length),threshold:METHOD.zeroThreshold,firstAboveThreshold:first,lastAboveThreshold:last,
    thresholdMeaning:'Numeric nonzero threshold only; not an audible onset or spoken-content claim'};
}
function command(executable,argv,input) {
  const result=spawnSync(executable,argv,{cwd:ROOT,input,encoding:null,timeout:60000,maxBuffer:16*1024*1024});
  assert.equal(result.error,undefined); assert.equal(result.status,0,`${executable}: ${result.stderr?.toString()}`);
  return {stdout:result.stdout,record:{executable,argv,stdin:input?{bytes:input.length,sha256:sha(input)}:null,
    status:result.status,signal:result.signal,stdout:{bytes:result.stdout.length,sha256:sha(result.stdout)},stderr:result.stderr.toString()}};
}
async function toolClosure() {
  const files=new Set([FFMPEG.path,FFPROBE.path,await realpath(process.execPath),await realpath(chromium.executablePath())]),linkage=[];
  const queue=[FFMPEG.path,FFPROBE.path],visited=new Set();
  while(queue.length){const file=queue.shift();if(visited.has(file))continue;visited.add(file);
    const result=command('/usr/bin/otool',['-L',file]);linkage.push({...result.record,text:result.stdout.toString()});
    for(const line of result.stdout.toString().split('\n').slice(1)){const dependency=line.trim().split(' (')[0];
      if(dependency.startsWith('/opt/homebrew/')){const target=await realpath(dependency);files.add(target);if(!visited.has(target))queue.push(target);}
      else assert.ok(!dependency||dependency.startsWith('/System/')||dependency.startsWith('/usr/lib/'),'Unresolved tool library identity');
    }
  }
  const app=path.resolve(chromium.executablePath(),'../../..');
  // Pin the actual large Chromium implementation, not only its tiny app launcher.
  files.add(await realpath(path.join(app,'Contents/Frameworks/Google Chrome for Testing Framework.framework/Versions/Current/Google Chrome for Testing Framework')));
  async function packageFiles(directory){for(const item of await readdir(directory,{withFileTypes:true})){const file=path.join(directory,item.name);
    if(item.isDirectory())await packageFiles(file);else if(item.isFile())files.add(file);else throw Error(`Unexpected package alias ${file}`);}}
  for(const name of ['playwright','playwright-core'])await packageFiles(await realpath(path.join(ROOT,'node_modules',name)));
  return {files:[...files].sort(),linkage};
}
async function browserDecode(page,base64,requestedRate) {
  return page.evaluate(async({base64,requestedRate})=>{
    const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    const context=new AudioContext(requestedRate===null?{}:{sampleRate:requestedRate});
    const beforeState=context.state;await context.suspend();
    try {const beforeDecode={state:context.state,currentTime:context.currentTime,sampleRate:context.sampleRate};
      const decoded=await context.decodeAudioData(bytes.buffer),channels=[];
      for(let channel=0;channel<decoded.numberOfChannels;channel++) {const floats=decoded.getChannelData(channel),raw=new Uint8Array(floats.length*4),view=new DataView(raw.buffer);
        for(let i=0;i<floats.length;i++)view.setFloat32(i*4,floats[i],true);
        let binary='';for(let i=0;i<raw.length;i+=16384)binary+=String.fromCharCode(...raw.subarray(i,i+16384));channels.push(btoa(binary));}
      const result={requestedRate,beforeState,beforeDecode,afterDecode:{state:context.state,currentTime:context.currentTime,sampleRate:context.sampleRate},
        decoded:{sampleRate:decoded.sampleRate,channels:decoded.numberOfChannels,length:decoded.length,duration:decoded.duration},channels,
        sourceNodesCreated:0,connectCalls:0,startCalls:0,resumeCalls:0,mediaElements:document.querySelectorAll('audio,video').length};
      await context.close();result.closedState=context.state;return result;
    }finally{if(context.state!=='closed')await context.close();}
  },{base64,requestedRate});
}
export async function runMeasurement(run) {
  assert.match(run,/^v[1-9][0-9]*$/u);
  assert.equal(ROOT,'/Volumes/WestWorld/HELP MATH 2.0-g678-implementation');
  for(const pin of [SOURCE,AUDIT,PROJECTION,FFMPEG,FFPROBE])assert.deepEqual(await physicalBinding(pin.path),pin);
  const source=await readFile(path.join(ROOT,SOURCE.path));assertSource(source);
  const audit=JSON.parse(await readFile(path.join(ROOT,AUDIT.path))),projection=JSON.parse(await readFile(path.join(ROOT,PROJECTION.path)));
  assert.deepEqual(audit.sourceTiming.blocks,projection.main.blocks);assert.equal(projection.audio.latencySeek,1673);
  assert.equal(projection.main.blocks.length,118);assert.equal(projection.main.blocks[0].frame,8);assert.equal(projection.main.blocks.at(-1).frame,125);
  const preservedSourcePath=path.join('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware',audit.source.path);
  assert.deepEqual(await physicalBinding(preservedSourcePath),{...audit.source,path:preservedSourcePath});
  const tools=await toolClosure(),files=new Set([SELF,SELF.replace('.mjs','.test.mjs'),SOURCE.path,AUDIT.path,PROJECTION.path,preservedSourcePath,
    'package-lock.json','catalog/toolchain.json',audit.visualRun.path,...audit.outputs.map(x=>x.path),
    ...audit.codeDependencyClosure.map(x=>x.path),...tools.files]);
  for(const item of [...audit.outputs,...audit.codeDependencyClosure,audit.visualRun])assert.deepEqual(await physicalBinding(item.path),item);
  const protectedFiles=['packages/demos/private-current-js-registry.json','packages/demos/src/contract.ts','packages/demos/src/runtime.ts',
    'apps/web/components/animation-runtime.tsx','apps/web/app/[locale]/migration-status/g678-calibration/[placementId]/page.tsx'];
  const inputPaths=[...files].sort(),inputs=await Promise.all(inputPaths.map(physicalBinding)),protectedBefore=await Promise.all(protectedFiles.map(physicalBinding));
  const capacity=await statfs(ROOT);assert.ok(capacity.bavail*capacity.bsize>64*1024*1024,'Need64MiB free for bounded measurement');
  const output=`${STEM}audio-decoder-origin-${run}`;await mkdir(path.join(ROOT,output));
  const outputs=[];const save=async(name,bytes)=>{const file=`${output}/${name}`;await writeFile(path.join(ROOT,file),bytes,{flag:'wx',mode:0o444});const b=await physicalBinding(file);outputs.push(b);return b;};
  const evidence={schemaVersion:1,artifactType:'g678-nms-l01-p042-audio-decoder-origin-measurement-v1',animationId:'shared-nms002-l01-p042',
    status:'running',startedAt:new Date().toISOString(),method:METHOD,source:SOURCE,audit:AUDIT,projection:PROJECTION,
    sourceFacts:{latency:1673,firstStreamFrame:8,lastStreamFrame:125,fps:12,blocks:projection.main.blocks,sampleCountSum:projection.main.blocks.reduce((n,b)=>n+b.sampleCount,0)},
    inputs,protectedBefore,environment:{platform:process.platform,arch:process.arch,osRelease:os.release(),node:process.version,endianness:os.endianness()},
    toolLinkage:tools.linkage,commands:[],records:[],requests:[],errors:[],outputs,
    gates:{sourceRuntimeAuthority:false,audioIntegrated:false,audioSynchronized:false,audioAccepted:false,spokenLanguageEstablished:false,
      humanListening:false,humanVisualReview:false,ownerAccepted:false,strictComplete:false,releaseEligible:false,published:false}};
  let browser;
  try {
    await save('runner-byte-exact.mjs',await readFile(path.join(ROOT,SELF)));
    await save('tests-byte-exact.mjs',await readFile(path.join(ROOT,SELF.replace('.mjs','.test.mjs'))));
    for(const executable of [FFMPEG.path,FFPROBE.path]){const v=command(executable,['-version']);evidence.commands.push(v.record);await save(`${path.basename(executable)}-version.txt`,v.stdout);}
    const probe=command(FFPROBE.path,['-v','error','-f','mp3','-show_streams','-show_frames','-show_format','-of','json','pipe:0'],source);
    evidence.commands.push(probe.record);await save('ffprobe-full-frames.json',probe.stdout);
    const frames=JSON.parse(probe.stdout);assert.equal(frames.streams.length,1);assert.equal(frames.streams[0].sample_rate,'22050');assert.equal(frames.streams[0].channels,1);
    evidence.ffprobeSummary={frameCount:frames.frames.length,sampleCountSum:frames.frames.reduce((n,f)=>n+f.nb_samples,0),sideData:frames.frames.flatMap((f,i)=>(f.side_data_list??[]).map(data=>({frame:i,data})))};
    const nativeArgs=['-v','error','-nostdin','-f','mp3','-c:a','mp3float','-i','pipe:0','-map','0:a:0','-vn','-sn','-dn','-c:a','pcm_f32le','-f','f32le','pipe:1'];
    const refs=[0,1].map(()=>command(FFMPEG.path,nativeArgs,source));evidence.commands.push(...refs.map(r=>r.record));assert.deepEqual(refs[0].stdout,refs[1].stdout,'FFmpeg native repeats differ');
    const native=refs[0].stdout;const nativeBinding=await save('ffmpeg-native-22050.f32le',native);evidence.reference={...describePcm(native,22050),output:nativeBinding,repeatHashes:refs.map(r=>sha(r.stdout))};
    const executablePath=await realpath(chromium.executablePath()),args=['--mute-audio','--autoplay-policy=user-gesture-required'];
    browser=await chromium.launch({executablePath,headless:true,args});evidence.browser={version:browser.version(),executablePath,launch:{headless:true,args}};
    const context=await browser.newContext({serviceWorkers:'block'});await context.route('**/*',async route=>{evidence.requests.push(route.request().url());await route.abort();});
    const page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
    await page.setContent('<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; connect-src \'none\'; media-src \'none\'; worker-src \'none\'"><title>p042 silent decoder measurement</title>');
    for(const requestedRate of [22050,null]) {
      const results=[];for(let repeat=0;repeat<2;repeat++)results.push(await browserDecode(page,source.toString('base64'),requestedRate));
      const decoded=results[0].decoded,rate=decoded.sampleRate;assert.equal(decoded.channels,1);assert.ok(rate>=8000&&rate<=192000);
      if(requestedRate!==null)assert.equal(rate,requestedRate);
      for(const result of results){assert.equal(result.beforeDecode.state,'suspended');assert.equal(result.afterDecode.state,'suspended');assert.equal(result.closedState,'closed');assert.equal(result.afterDecode.currentTime,result.beforeDecode.currentTime);assert.deepEqual(result.decoded,decoded);}
      const pcm=Buffer.from(results[0].channels[0],'base64');assert.equal(pcm.length,decoded.length*4);
      assert.equal(results[0].channels[0],results[1].channels[0],'Browser repeat PCM differs');
      let reference=native,referenceOutput=nativeBinding;
      if(rate!==22050){const resampleArgs=['-v','error','-nostdin','-f','f32le','-ar','22050','-ac','1','-i','pipe:0','-ar',String(rate),'-c:a','pcm_f32le','-f','f32le','pipe:1'];
        const rs=[0,1].map(()=>command(FFMPEG.path,resampleArgs,native));evidence.commands.push(...rs.map(r=>r.record));assert.deepEqual(rs[0].stdout,rs[1].stdout);
        reference=rs[0].stdout;referenceOutput=await save(`ffmpeg-resampled-${rate}.f32le`,reference);}
      const origin=findOrigin(pcmFromBytes(reference),pcmFromBytes(pcm),rate);
      const pcmOutput=await save(`chromium-${requestedRate===null?'default':'requested'}-${rate}.f32le`,pcm);
      evidence.records.push({requestedRate,decoded,pcm:describePcm(pcm,rate),output:pcmOutput,reference:describePcm(reference,rate),referenceOutput,
        repeatHashes:results.map(r=>sha(Buffer.from(r.channels[0],'base64'))),contexts:results.map(({channels,...r})=>r),origin,
        durationDifferenceSeconds:pcm.length/4/rate-native.length/4/22050,
        resamplingLengthDelta:reference.length/4-native.length/4*rate/22050});
      console.log(JSON.stringify({requestedRate,rate,decodedSamples:decoded.length,referenceSamples:reference.length/4,originStatus:origin.status,lag:origin.lagSamples,correlation:origin.fullOverlap.correlation,rmse:origin.fullOverlap.rmse}));
    }
    await context.close();await browser.close();browser=undefined;
    assert.deepEqual(evidence.requests,[]);assert.deepEqual(evidence.errors,[]);
    evidence.inputsAfter=await Promise.all(inputPaths.map(physicalBinding));evidence.protectedAfter=await Promise.all(protectedFiles.map(physicalBinding));
    assert.deepEqual(evidence.inputsAfter,inputs);assert.deepEqual(evidence.protectedAfter,protectedBefore);evidence.inputsUnchanged=true;evidence.protectedUnchanged=true;
    evidence.status='passed';
  }catch(error){evidence.status='failed';evidence.failure={message:error.message,stack:error.stack};throw error;}
  finally {if(browser)await browser.close();evidence.finishedAt=new Date().toISOString();await writeFile(path.join(ROOT,output,'evidence.json'),json(evidence),{flag:'wx',mode:0o444});}
  return physicalBinding(`${output}/evidence.json`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))runMeasurement(parseArgs(process.argv.slice(2))).then(x=>console.log(json(x))).catch(error=>{console.error(error);process.exitCode=1;});
