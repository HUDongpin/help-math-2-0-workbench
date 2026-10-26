#!/usr/bin/env node
// Source-only timing audit. No playback, network, registry, or product writes.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, lstatSync, realpathSync, mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inflateSync} from 'node:zlib';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ID='shared-alg001-l12-p002';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SWF_REL='G6-G8-shared/ALG001/L12/RW/L12RW02.swf';
const SA_REL='G6-G8-shared/ALG001/L12/SA/L12RW02.mp3';
const AUDIT_REL=`migrations/${ID}/audit/audio-timing-v1`;
const IDENT_REL=`migrations/${ID}/candidate/audio-identification.json`;
const EXPECTED={swf:'15e67732b739f0194087ded0748c2d23f9871363ed33388807c351f2aad6fb62',sa:'cad83108fed08731582e639c0ef8c5886a5c56dab710c277c639cc0603c0fcf3',ident:'6f05919910e6c7a2d8bfc4f922b27df42beab3032639cb82fca3fa06bba6bdfc'};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
function readPinned(file,expected){
  const full=path.resolve(file),before=lstatSync(full,{bigint:true});
  assert(before.isFile()&&!before.isSymbolicLink()&&realpathSync(full)===full,`physical file required: ${full}`);
  const bytes=readFileSync(full),after=lstatSync(full,{bigint:true});
  for(const key of ['dev','ino','size','mtimeNs'])assert.equal(before[key],after[key],`changed while reading: ${full}`);
  assert.equal(sha(bytes),expected,`source hash drift: ${full}`);
  return bytes;
}
function uncompressSwf(source){
  assert.equal(source.subarray(0,3).toString(),'CWS');
  const body=inflateSync(source.subarray(8));
  assert.equal(body.length+8,source.readUInt32LE(4));
  return Buffer.concat([Buffer.from('FWS'),source.subarray(3,8),body]);
}
function parseSwf(source){
  const bytes=uncompressSwf(source);
  const rectBytes=Math.ceil((5+4*(bytes[8]>>3))/8);
  const fps=bytes.readUInt16LE(8+rectBytes)/256;
  let rootFrames=bytes.readUInt16LE(10+rectBytes),spriteFrames;
  const heads=[],blocks=[];
  function tags(start,end,domain){
    let at=start,frame=1,ended=false;
    while(at<end){
      assert(at+2<=end,'truncated tag');
      const packed=bytes.readUInt16LE(at);at+=2;
      const code=packed>>6;let length=packed&63;
      if(length===63){assert(at+4<=end);length=bytes.readUInt32LE(at);at+=4;}
      assert(at+length<=end,'tag exceeds domain');
      const body=bytes.subarray(at,at+length);at+=length;
      if(code===39){
        assert(length>=4);
        const id=body.readUInt16LE(0),nested=`sprite-${id}`;
        if(id===454){assert.equal(spriteFrames,undefined);spriteFrames=body.readUInt16LE(2);}
        tags(at-length+4,at,nested);
      }
      if(code===18||code===45)heads.push({domain,frame,code,hex:body.toString('hex')});
      if(code===19){
        assert(length>=4,'MP3 block header');
        blocks.push({domain,frame,samples:body.readUInt16LE(0),seek:body.readInt16LE(2),mp3:body.subarray(4)});
      }
      if(code===1)frame++;
      if(code===0){assert.equal(at,end,'bytes after End tag');ended=true;break;}
    }
    assert(ended,`missing End tag in ${domain}`);
  }
  tags(12+rectBytes,bytes.length,'root');
  assert.equal(fps,12);assert.equal(rootFrames,10);assert.equal(spriteFrames,1951);
  assert.equal(heads.length,1);assert.equal(heads[0].domain,'sprite-454');
  assert(blocks.every(b=>b.domain==='sprite-454'));
  const head=Buffer.from(heads[0].hex,'hex');
  assert.equal(head.length,6);assert.equal(head[1]>>4,2,'MP3 compression');
  assert.equal((head[1]>>2)&3,2,'22.05 kHz rate');
  return {fps,rootFrames,spriteFrames,head:{tagCode:heads[0].code,frame:heads[0].frame,hex:heads[0].hex,sampleRateHz:22050,samplesPerSwfFrame:head.readUInt16LE(2),latencySeekSamples:head.readInt16LE(4)},blocks};
}
function inspectMp3(payload){
  let at=0,count=0,samples=0;
  while(at<payload.length){
    assert(at+4<=payload.length,'short MP3 frame header');
    const h=payload.readUInt32BE(at);
    assert.equal(h>>>21,0x7ff,'MP3 sync');
    assert.equal((h>>>19)&3,2,'MPEG-2');
    assert.equal((h>>>17)&3,1,'Layer III');
    const bitrateIndex=(h>>>12)&15,rateIndex=(h>>>10)&3,padding=(h>>>9)&1;
    const kbps=[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160][bitrateIndex];
    const hz=[22050,24000,16000][rateIndex];
    assert(kbps&&hz,'valid MP3 bitrate and rate');
    assert.equal(hz,22050);
    const size=Math.floor(72*kbps*1000/hz)+padding;
    assert(at+size<=payload.length,'truncated MP3 frame');
    at+=size;count++;samples+=576;
  }
  return {codecFrames:count,codecSamples:samples};
}
function windowsAndGaps(rows){
  const windows=[],gaps=[];
  for(let i=0;i<rows.length;){
    const present=rows[i].blockPresent,first=rows[i].frame;
    let j=i;while(j<rows.length&&rows[j].blockPresent===present)j++;
    const last=rows[j-1].frame;
    if(present)windows.push({index:windows.length+1,firstFrame:first,lastFrame:last,blocks:j-i});
    else gaps.push({firstFrame:first,lastFrame:last,frames:j-i,nominalDurationSeconds:(j-i)/12});
    i=j;
  }
  return {windows,gaps};
}
function run(binary,args,input,maxBuffer=32*1024*1024){
  const result=spawnSync(binary,args,{input,maxBuffer,encoding:null,env:{...process.env,LC_ALL:'C'}});
  if(result.error)throw result.error;
  assert.equal(result.status,0,`${binary} exited ${result.status}: ${String(result.stderr).slice(0,500)}`);
  return result.stdout;
}
function measureMp3(payload,expectedRate){
  const probe=JSON.parse(run('/opt/homebrew/bin/ffprobe',['-v','error','-f','mp3','-count_frames','-show_entries','stream=codec_name,sample_rate,channels,nb_read_frames','-of','json','pipe:0'],payload));
  assert.equal(probe.streams?.length,1);const stream=probe.streams[0];
  assert.equal(stream.codec_name,'mp3');assert.equal(Number(stream.sample_rate),expectedRate);assert.equal(stream.channels,1);
  const pcm=run('/opt/homebrew/bin/ffmpeg',['-v','error','-nostdin','-xerror','-f','mp3','-i','pipe:0','-f','s16le','-acodec','pcm_s16le','-ac','1','-ar',String(expectedRate),'pipe:1'],payload);
  assert.equal(pcm.length%2,0);
  return {codec:stream.codec_name,sampleRateHz:expectedRate,channels:stream.channels,ffmpegDecodedSamples:pcm.length/2,ffmpegPcmSha256:sha(pcm)};
}
function audit(){
  assert.equal(realpathSync(SOURCE_ROOT),SOURCE_ROOT,'real source root');
  const source=readPinned(path.join(SOURCE_ROOT,SWF_REL),EXPECTED.swf);
  const sa=readPinned(path.join(SOURCE_ROOT,SA_REL),EXPECTED.sa);
  const ident=JSON.parse(readPinned(path.join(ROOT,IDENT_REL),EXPECTED.ident));
  const swf=parseSwf(source),byFrame=new Map();
  for(const block of swf.blocks){assert(!byFrame.has(block.frame));byFrame.set(block.frame,block);}
  assert.equal(swf.blocks.length,1927);
  const rows=[];
  for(let frame=1;frame<=swf.spriteFrames;frame++){
    const block=byFrame.get(frame),mp3=block?inspectMp3(block.mp3):{codecFrames:0,codecSamples:0};
    if(block)assert.equal(block.samples,mp3.codecSamples,`sample mismatch frame ${frame}`);
    rows.push({frame,blockPresent:Boolean(block),declaredSamples:block?.samples??0,seekSamples:block?.seek??null,mp3Bytes:block?.mp3.length??0,...mp3});
  }
  const {windows,gaps}=windowsAndGaps(rows);
  assert.deepEqual(windows.map(w=>[w.firstFrame,w.lastFrame,w.blocks]),[[1,415,415],[435,1115,681],[1121,1951,831]]);
  assert.deepEqual(gaps.map(g=>[g.firstFrame,g.lastFrame,g.frames]),[[416,434,19],[1116,1120,5]]);
  let payloadBytes=0,declaredSamples=0,codecFrames=0;
  for(const w of windows){
    const selected=swf.blocks.filter(b=>b.frame>=w.firstFrame&&b.frame<=w.lastFrame);
    const payload=Buffer.concat(selected.map(b=>b.mp3));
    w.mp3Bytes=payload.length;w.payloadSha256=sha(payload);
    w.declaredSamples=selected.reduce((n,b)=>n+b.samples,0);
    w.codecFrames=w.declaredSamples/576;
    w.nominalFrameSpanSeconds=w.blocks/swf.fps;
    w.declaredSampleDurationSeconds=w.declaredSamples/swf.head.sampleRateHz;
    w.firstSeekSamples=selected[0].seek;w.lastSeekSamples=selected.at(-1).seek;
    w.decode=measureMp3(payload,22050);
    payloadBytes+=payload.length;declaredSamples+=w.declaredSamples;codecFrames+=w.codecFrames;
  }
  const allPayload=Buffer.concat(swf.blocks.map(b=>b.mp3));
  assert.equal(allPayload.length,payloadBytes);assert.equal(payloadBytes,ident.embedded.payloadBytes);
  assert.equal(sha(allPayload),ident.embedded.payloadSha256);
  assert.deepEqual(rows.filter(r=>r.blockPresent&&r.mp3Bytes===0).map(r=>r.frame),ident.embedded.emptyBlockFrames);
  assert.deepEqual(rows.filter(r=>r.seekSamples<0).map(r=>r.frame),ident.embedded.negativeSeekFrames);
  assert.deepEqual(windows.map(w=>({firstFrame:w.firstFrame,lastFrame:w.lastFrame,blocks:w.blocks,declaredSamples:w.declaredSamples,mp3Bytes:w.mp3Bytes})),ident.embedded.windows);
  const negativeSeekMarkers=rows.filter(r=>r.seekSamples<0).map(({frame,seekSamples,declaredSamples,mp3Bytes})=>({frame,seekSamples,declaredSamples,mp3Bytes}));
  const emptyBlocks=rows.filter(r=>r.blockPresent&&r.mp3Bytes===0).map(({frame,seekSamples,declaredSamples})=>({frame,seekSamples,declaredSamples}));
  const summary={schemaVersion:1,animationId:ID,scope:'static SWF stream structure and local decoder measurement only',source:{path:SWF_REL,bytes:source.length,sha256:sha(source)},identification:{path:IDENT_REL,sha256:EXPECTED.ident},sprite:{domain:'sprite-454',frameCount:swf.spriteFrames,fps:swf.fps,rootFrameCount:swf.rootFrames},streamHead:swf.head,totals:{blockCount:swf.blocks.length,framesWithoutBlock:swf.spriteFrames-swf.blocks.length,payloadBytes,payloadSha256:sha(allPayload),declaredSamples,codecFrames,codecSampleDurationSeconds:declaredSamples/22050,nominalSpriteDurationSeconds:swf.spriteFrames/swf.fps},windows,gaps,emptyBlocks,negativeSeekMarkers,separateSA:{path:SA_REL,bytes:sa.length,sha256:sha(sa),decode:measureMp3(sa,48000)},limits:['Missing SoundStreamBlock tags are timeline gaps; they do not alone prove silence or pause semantics.','Negative SeekSamples values are preserved as signed source markers; no playback trimming rule is asserted.','ffmpeg decoding and source sample counts do not establish original Flash playback, language, cue meaning, synchronization, or listening acceptance.']};
  const columns=['frame','blockPresent','declaredSamples','seekSamples','mp3Bytes','codecFrames','codecSamples'];
  const csv=columns.join(',')+'\n'+rows.map(r=>columns.map(c=>r[c]===null?'':r[c]===true?'1':r[c]===false?'0':r[c]).join(',')).join('\n')+'\n';
  return {summary:json(summary),csv};
}
function selfTest(){
  assert.deepEqual(windowsAndGaps([{frame:1,blockPresent:true},{frame:2,blockPresent:false},{frame:3,blockPresent:false},{frame:4,blockPresent:true}]).gaps,[{firstFrame:2,lastFrame:3,frames:2,nominalDurationSeconds:2/12}]);
  assert.throws(()=>inspectMp3(Buffer.from([0,0,0,0])),/MP3 sync/);
  assert.throws(()=>inspectMp3(Buffer.from([0xff,0xf3,0x50,0xc0])),/truncated MP3 frame/);
  return 'self-test passed';
}
const mode=process.argv[2];assert(['--self-test','--write','--check'].includes(mode)&&process.argv.length===3,'usage: --self-test | --write | --check');
if(mode==='--self-test')console.log(selfTest());
else{
  const files=audit(),dir=path.join(ROOT,AUDIT_REL);
  if(mode==='--write'){
    mkdirSync(dir,{recursive:true});
    for(const [name,content] of [['timing-summary.json',files.summary],['frame-ledger.csv',files.csv]])writeFileSync(path.join(dir,name),content,{flag:'wx'});
  }else{
    for(const [name,content] of [['timing-summary.json',files.summary],['frame-ledger.csv',files.csv]])assert.equal(readFileSync(path.join(dir,name),'utf8'),content,`audit drift: ${name}`);
  }
  console.log(JSON.stringify({mode,output:AUDIT_REL,summarySha256:sha(files.summary),ledgerSha256:sha(files.csv)}));
}
