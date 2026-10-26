#!/usr/bin/env node
// One source page per invocation. Extraction does not register a renderer or authorize scale-out.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chmod, lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';
import {decompressSwf} from './build-g4-l3-swf-asset-definition-census.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const TASK='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
const TOOLCHAIN_REFERENCE={path:`${TASK}/alg-l01-p006-source-v1/extraction.json`,bytes:21666,sha256:'68e899b3bb4d79bcc8e09f7caa366c7897cf83ad412c12223501da5dad34ffc4'};
const encode=value=>JSON.stringify(value,null,2)+'\n';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pin=(file,bytes)=>({path:file,bytes:bytes.length,sha256:sha(bytes)});
async function readBound(file,expected){
  const full=path.resolve(ROOT,file),before=await lstat(full,{bigint:true});
  assert(before.isFile()&&!before.isSymbolicLink()&&await realpath(full)===full,'ordinary physical input');
  const bytes=await readFile(full),after=await lstat(full,{bigint:true});
  for(const key of ['dev','ino','size','mode','mtimeNs','nlink'])assert.equal(before[key],after[key]);
  if(expected){assert.equal(bytes.length,expected.bytes);assert.equal(sha(bytes),expected.sha256);}
  return {bytes,pin:pin(full,bytes)};
}
async function verifyTools(node,seen=new Set()){
  if(!node||typeof node!=='object')return;
  if(node.realPath&&node.sha256&&node.bytes!==undefined&&!seen.has(node.realPath)){
    seen.add(node.realPath);await readBound(node.realPath,node);
  }
  for(const value of Object.values(node))await verifyTools(value,seen);
}
export function extractTerminalStream(source,domain){
  const {bytes}=decompressSwf(source),rectBytes=Math.ceil((5+4*(bytes[8]>>3))/8);
  const actions=[],heads=[],blocks=[],payload=[];
  function walk(start,end,current){
    let at=start,frame=1;
    while(at<end){
      assert(at+2<=end);const packed=bytes.readUInt16LE(at);at+=2;const code=packed>>6;
      let size=packed&63;if(size===63){assert(at+4<=end);size=bytes.readUInt32LE(at);at+=4;}
      assert(at+size<=end);const body=bytes.subarray(at,at+size);at+=size;
      if(code===39){assert(size>=4);walk(at-size+4,at,`sprite-${body.readUInt16LE(0)}`);}
      if(code===12)actions.push({domain:current,frame,bytes:size,sha256:sha(body),hex:body.toString('hex')});
      if([18,45].includes(code))heads.push({domain:current,frame,hex:body.toString('hex')});
      if(code===19){
        assert.equal(current,domain,'other stream domain needs separate audit');assert(size>=4);
        const mp3=body.subarray(4);blocks.push({frame,samples:body.readUInt16LE(0),seek:body.readInt16LE(2),mp3Bytes:mp3.length});payload.push(mp3);
      }
      if(code===1)frame++;
      if(code===0){assert.equal(at,end);break;}
    }
  }
  walk(8+rectBytes+4,bytes.length,'root');
  return {actions,heads,blocks,mp3:Buffer.concat(payload)};
}

export async function prepare({id,output}){
  assert(/^shared-(alg001|nms002|geo001|dat001)-l\d{2}-p\d{3}$/u.test(id));
  assert(path.isAbsolute(output)&&output.startsWith(TASK+'/'));
  const catalogFile=await readBound('catalog/g678-shared-catalog.v1.json');
  const catalog=JSON.parse(catalogFile.bytes),matches=catalog.lessons.flatMap(lesson=>lesson.pages.filter(page=>page.animationId===id).map(page=>({lesson,page})));
  assert.equal(matches.length,1);const {lesson,page}=matches[0];
  const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;assert(sourceRoot&&await realpath(sourceRoot)===sourceRoot);
  assert(typeof page.viewPath==='string'&&page.viewPath.startsWith('G6-G8-shared/'));
  const sourcePath=path.join(sourceRoot,page.viewPath);
  // Catalog source spelling is resolved once below; no filename search or alias substitution.
  const source=await readBound(sourcePath);assert.equal(source.pin.sha256,page.sourceSha256);
  assert.equal((await lstat(sourcePath)).mode&0o222,0,'source archive must stay read-only');
  const facts=parseSwfSourceFacts(source.bytes),main=facts.frameDomains.domains.filter(d=>d.kind==='sprite'&&d.scriptTagCount===1&&d.declaredFrameCount>1);
  assert.equal(main.length,1);assert.equal(main[0].placedSpriteIds.length,0);assert.equal(facts.tagCounts.DefineButton??0,0);assert.equal(facts.tagCounts.DefineButton2??0,0);
  const stream=extractTerminalStream(source.bytes,main[0].domainId);
  assert.equal(stream.heads.length,1);assert.equal(stream.heads[0].domain,main[0].domainId);
  assert.equal(stream.actions.length,3);assert.deepEqual(stream.actions.filter(a=>a.domain===main[0].domainId).map(a=>({frame:a.frame,hex:a.hex})),[{frame:main[0].declaredFrameCount,hex:'0700'}]);
  const audioFirstFrame=stream.blocks[0].frame,audioLastFrame=stream.blocks.at(-1).frame;
  assert.equal(audioLastFrame,main[0].declaredFrameCount);
  assert.deepEqual(stream.blocks.map(b=>b.frame),Array.from({length:audioLastFrame-audioFirstFrame+1},(_,i)=>i+audioFirstFrame));
  assert(stream.blocks.every(b=>b.seek>=0),'negative seek needs another lane');
  const head=Buffer.from(stream.heads[0].hex,'hex');assert.equal(head[1]>>4,2);assert.equal((head[1]>>2)&3,2);assert.equal(head[1]&1,0);
  const reference=JSON.parse((await readBound(TOOLCHAIN_REFERENCE.path,TOOLCHAIN_REFERENCE)).bytes);await verifyTools(reference.toolchain);
  for(const key of ['FFDEC_JARFILENAME','FFDEC_MEMORY','FFDEC_STACK_SIZE','JAVA_TOOL_OPTIONS','JDK_JAVA_OPTIONS','_JAVA_OPTIONS','CLASSPATH'])assert(!process.env[key],`unexpected ${key}`);
  await mkdir(output);const sourceOut=`${output}/source`,audioOut=`${output}/audio`;await mkdir(sourceOut);await mkdir(audioOut);
  const copy=`${sourceOut}/source.swf`;await writeFile(copy,source.bytes,{flag:'wx'});await chmod(copy,0o444);
  await writeFile(`${sourceOut}/source-facts.json`,encode(facts),{flag:'wx'});
  const commands=[];
  async function command(name,executable,args){
    const started=Date.now();const result=await new Promise((resolve,reject)=>{
      const child=spawn(executable,args,{cwd:ROOT,env:{...process.env,LC_ALL:'C.UTF-8',LANG:'C.UTF-8'},stdio:['ignore','pipe','pipe']});
      const stdout=[],stderr=[];child.stdout.on('data',b=>stdout.push(b));child.stderr.on('data',b=>stderr.push(b));child.on('error',reject);child.on('close',code=>resolve({code,stdout:Buffer.concat(stdout),stderr:Buffer.concat(stderr)}));
    });
    await writeFile(`${output}/${name}.stdout.log`,result.stdout,{flag:'wx'});await writeFile(`${output}/${name}.stderr.log`,result.stderr,{flag:'wx'});
    commands.push({name,command:executable,args,exitCode:result.code,elapsedMs:Date.now()-started});assert.equal(result.code,0,`${name} failed`);
  }
  const java=reference.toolchain.ffdec.java.realPath,jar=reference.toolchain.ffdec.jar.realPath;
  const prefix=['-Djava.net.preferIPv4Stack=true','-Djna.nosys=true','-Djava.util.Arrays.useLegacyMergeSort=true','-Xmx1024m','-Djava.awt.headless=true','-jar',jar];
  await command('audit',java,[...prefix,'-config','packJavaScripts=false','-onerror','abort','-format','script:as,text:plain,shape:svg,morphshape:svg','-export','script,text,shape,morphshape,image',`${sourceOut}/audit`,copy]);
  await command('canvas',java,[...prefix,'-config','packJavaScripts=false','-onerror','abort','-format','frame:canvas,sprite:canvas','-export','frame,sprite',`${sourceOut}/canvas`,copy]);
  await command('swfmill',reference.toolchain.swfmill.realPath,['-n','swf2xml',copy,`${sourceOut}/source.xml`]);
  const mp3Path=`${audioOut}/source-stream.mp3`;await writeFile(mp3Path,stream.mp3,{flag:'wx'});
  const {mp3,...audioAudit}=stream;await writeFile(`${audioOut}/source-audio-audit.json`,encode({animationId:id,sourceSwfSha256:source.pin.sha256,...audioAudit,payload:pin(mp3Path,mp3),audioAccepted:false,originalRuntimeAccepted:false}),{flag:'wx'});
  const ffmpeg=await realpath('/opt/homebrew/bin/ffmpeg'),ffmpegPin=(await readBound(ffmpeg)).pin;
  await command('ffmpeg-eof',ffmpeg,['-v','error','-nostdin','-xerror','-i',mp3Path,'-f','f32le','-acodec','pcm_f32le',`${audioOut}/ffmpeg-full.f32le`]);
  const browser=await chromium.launch({headless:true}),requests=[];let decoded;
  try{
    const page=await browser.newPage();page.on('request',r=>requests.push(r.url()));
    decoded=await page.evaluate(async base64=>{
      const source=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const result=[];
      for(let i=0;i<2;i++){
        const context=new OfflineAudioContext(1,1,22050),buffer=await context.decodeAudioData(source.buffer.slice(0));
        const bytes=new Uint8Array(buffer.length*buffer.numberOfChannels*4),view=new DataView(bytes.buffer);
        for(let ch=0;ch<buffer.numberOfChannels;ch++){const samples=buffer.getChannelData(ch);for(let n=0;n<samples.length;n++)view.setFloat32((ch*buffer.length+n)*4,samples[n],true);}
        let binary='';for(let n=0;n<bytes.length;n+=32768)binary+=String.fromCharCode(...bytes.subarray(n,n+32768));
        result.push({sampleRate:buffer.sampleRate,channels:buffer.numberOfChannels,decodedSamples:buffer.length,pcmBase64:btoa(binary)});
      }return result;
    },mp3.toString('base64'));
    assert.deepEqual(decoded[0],decoded[1]);assert.deepEqual(requests,[]);
    const pcm=Buffer.from(decoded[0].pcmBase64,'base64');await writeFile(`${audioOut}/browser-full.f32le`,pcm,{flag:'wx'});
    const {pcmBase64,...format}=decoded[0];const plan={sourceSwfSha256:source.pin.sha256,frameDomain:main[0].domainId,firstFrame:1,lastFrame:main[0].declaredFrameCount,audioFirstFrame,fps:facts.header.fps,latencySamples:head.readInt16LE(4),sourceSegmentCount:1,sourceHasNegativeSeek:false,decoder:{sourceSha256:sha(mp3),sourceBytes:mp3.length,...format,pcmSha256:sha(pcm)}};
    await writeFile(`${audioOut}/plan.json`,encode(plan),{flag:'wx'});
    await writeFile(`${audioOut}/measurement.json`,encode({plan,ffmpeg:ffmpegPin,browserExecutable:(await readBound(await realpath(chromium.executablePath()))).pin,browserVersion:browser.version(),repeatedDecodeIdentical:true,ffmpegFullEofPassed:true,requests,audioAccepted:false,originalRuntimeAccepted:false}),{flag:'wx'});
  }finally{await browser.close();}
  await readBound(sourcePath,source.pin);await verifyTools(reference.toolchain);
  const receipt={schemaVersion:1,animationId:id,source:source.pin,sourceCatalog:catalogFile.pin,lesson:{stableLessonKey:lesson.stableLessonKey,activePageCount:lesson.activePageCount},placement:page,main:main[0],toolchainProvenance:TOOLCHAIN_REFERENCE,toolchain:reference.toolchain,commands,preparationScript:(await readBound(fileURLToPath(import.meta.url))).pin,registrationChanged:false,scaleOutAuthorized:false};
  await writeFile(`${output}/extraction.json`,encode(receipt),{flag:'wx'});
  return {animationId:id,output,mainFrameCount:main[0].declaredFrameCount,audioFirstFrame,registrationChanged:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert(process.argv.length===6&&process.argv[2]==='--id'&&process.argv[4]==='--output');
  console.log(encode(await prepare({id:process.argv[3],output:process.argv[5]})));
}
