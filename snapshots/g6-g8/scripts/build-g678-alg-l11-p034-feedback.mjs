#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,readdir,realpath,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {sanitizeSvg} from './build-g678-alg-l11-tranche-d-instructional-visuals.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const RAW='work/g678-shared-page-factory/g678-alg-l11-p034-feedback-source-v1';
const BASE='work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1/shared-alg001-l11-p034';
const OUT='packages/demos/src/generated/g678-alg-l11-p034-feedback-v1.ts';
const RUN='work/g678-shared-page-factory/g678-alg-l11-p034-feedback-generated-v1';
const PARSER='scripts/g678-alg-l11-p034-feedback-source.py';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=x=>JSON.stringify(x,null,2)+'\n';
const desc=({buffer:_,...rest})=>rest;
async function file(p){const full=path.isAbsolute(p)?p:path.join(ROOT,p),s=await lstat(full);assert.ok(s.isFile()&&!s.isSymbolicLink());const b=await readFile(full);return{path:p,bytes:b.length,sha256:hash(b),buffer:b};}
async function pipe(executable,args,input){return new Promise((resolve,reject)=>{const child=spawn(executable,args,{cwd:ROOT,stdio:['pipe','pipe','pipe']});
  const out=[],err=[];child.stdout.on('data',b=>out.push(b));child.stderr.on('data',b=>err.push(b));child.on('error',reject);
  child.on('close',code=>{const stdout=Buffer.concat(out),stderr=Buffer.concat(err);if(code!==0)reject(Error(`${executable} exit ${code}: ${stderr.toString()}`));else resolve({stdout,stderr});});child.stdin.end(input);});}
export async function build({check=false}={}){
  const extraction=await file(`${RAW}/extraction.json`),raw=JSON.parse(extraction.buffer);
  assert.deepEqual(desc(await file(raw.builder.path)),raw.builder);
  for(const item of raw.files){const f=await file(`${RAW}/${item.path}`);assert.equal(f.sha256,item.sha256);assert.equal(f.bytes,item.bytes);}
  const xml=await file(`${BASE}/source.xml`);assert.equal(xml.sha256,'25d66465e54bffe8065ea812cbb606f6212c64869a6716eacdabbdf6231e4ee5');
  const parsed=JSON.parse((await promisify(execFile)('python3',[PARSER,xml.path],{cwd:ROOT,maxBuffer:1024*1024})).stdout);
  const scripts=[];
  for(const [id,last]of[[105,28],[118,27]])for(const frame of[1,last])scripts.push(await file(`${BASE}/ffdec-export/scripts/DefineSprite_${id}/frame_${frame}/DoAction.as`));
  assert.match(scripts[1].buffer.toString(),/^stop\(\);\s*_parent.enableMc\(\);\s*$/);
  assert.match(scripts[3].buffer.toString(),/stop\(\);\s*_parent.enableMc\(\);\s*_global.totAnsCount\+\+/);
  assert.match(scripts[3].buffer.toString(),/if\(_global.totAnsCount >= 6\)[\s\S]*_parent.nextFrame\(\)/);
  const releases=[];
  async function walk(dir){for(const e of await readdir(path.join(ROOT,dir),{withFileTypes:true})){const p=`${dir}/${e.name}`;if(e.isDirectory())await walk(p);else if(e.name==='CLIPACTIONRECORD on(release).as'){
    const f=await file(p),s=f.buffer.toString();if(s.includes('Mc_Feed1.gotoAndPlay'))releases.push(f);
  }}}
  await walk(`${BASE}/ffdec-export/scripts/DefineSprite_225`);assert.equal(releases.length,24);
  for(const f of releases){const s=f.buffer.toString();assert.match(s,/_global.score \+= 10;[\s\S]*Mc_Feed2.gotoAndPlay\(2\)/);
    assert.match(s,/_global.score -= 2;[\s\S]*Mc_Feed1.gotoAndPlay\(2\)/);assert.match(s,/setInterval\(fadeOut[12],100\)/);}
  const feedback=[];const assets=[];const machine=[];
  const ffmpeg=await realpath('/opt/homebrew/bin/ffmpeg'),ffprobe=await realpath('/opt/homebrew/bin/ffprobe');
  for(const item of parsed.feedback){
    const {payloadBase64,...metadata}=item,payload=Buffer.from(payloadBase64,'base64');assert.equal(hash(payload),item.payloadSha256);
    const audioPath=`${RUN}/sprite-${item.characterId}-stream.mp3`;assets.push({path:audioPath,bytes:payload.length,sha256:hash(payload),buffer:payload});
    const probeArgs=['-v','error','-show_streams','-show_format','-of','json','-i','pipe:0'];
    const decodeArgs=['-v','error','-i','pipe:0','-f','null','-'];
    const probe=await pipe(ffprobe,probeArgs,payload),decode=await pipe(ffmpeg,decodeArgs,payload);
    assert.equal(probe.stderr.length,0);assert.equal(decode.stderr.length,0);
    const info=JSON.parse(probe.stdout);assert.equal(info.streams.length,1);assert.equal(info.streams[0].codec_name,'mp3');
    assert.equal(info.streams[0].sample_rate,'22050');assert.equal(info.streams[0].channels,1);
    machine.push({characterId:item.characterId,probe:{command:[ffprobe,...probeArgs],result:info},decode:{command:[ffmpeg,...decodeArgs],exitCode:0,stderrBytes:0}});
    const frames=[];
    for(let f=1;f<=item.frameCount;f++){
      const input=await file(`${RAW}/DefineSprite_${item.characterId}/${f}.svg`);let svg=input.buffer.toString();
      const width=parseFloat(svg.match(/\bwidth="([^"]+)/)[1]),height=parseFloat(svg.match(/\bheight="([^"]+)/)[1]);
      if(!svg.includes('<defs>'))svg=svg.replace('</svg>','<defs></defs></svg>');
      // FFDec places clip paths beside their uses. Move their definitions only;
      // the clip reference and mask geometry remain unchanged.
      const clips=[];svg=svg.replace(/<clipPath\b[^>]*>[\s\S]*?<\/clipPath>/g,node=>{clips.push(node);return'';});
      svg=svg.replace('<defs>','<defs>'+clips.join(''));
      svg=svg.replace(/<svg\b([^>]*)>/,`<svg$1 viewBox="0 0 ${width} ${height}">`);
      const normalized=sanitizeSvg(svg,`p034-feedback-${item.characterId}-${f}`);
      frames.push({frame:f,svg:normalized,width,height,sha256:hash(normalized),source:desc(input)});
    }
    feedback.push({...metadata,sourceInstanceName:item.characterId===105?'Mc_Feed1':'Mc_Feed2',
      outcome:item.characterId===105?'incorrect':'correct',branchIndex:item.characterId===105?1:2,branchCount:2,
      pointsDelta:item.characterId===105?-2:10,durationMs:(item.terminalFrame-item.startFrame)*1000/parsed.fps,
      frames,audioAsset:desc(assets.at(-1)),audioDelivery:{status:'unrouted-source-candidate',url:null},
      audioTiming:'Full original MP3 payload retained including priming; start child2, preserve head latencySeek and all block sample/seek metadata; no assumed playback offset.'});
  }
  const data={schemaVersion:1,fps:parsed.fps,sourceRootFrames:10,feedback,gates:raw.gates};
  const generated='// Generated by build-g678-alg-l11-p034-feedback.mjs. Do not hand edit.\nexport const G678_ALG_L11_P034_SOURCE_FEEDBACK = '+JSON.stringify(data)+' as const;\n';
  const receipt={schemaVersion:1,builder:desc(await file(path.relative(ROOT,fileURLToPath(import.meta.url)))),parser:desc(await file(PARSER)),
    svgCompiler:desc(await file('scripts/build-g678-alg-l11-tranche-d-instructional-visuals.mjs')),extraction:desc(extraction),sourceXml:desc(xml),
    frameActions:scripts.map(desc),releaseActions:releases.sort((a,b)=>a.path.localeCompare(b.path)).map(desc),
    audioTools:{ffmpeg:desc(await file(ffmpeg)),ffprobe:desc(await file(ffprobe))},machine,audioAssets:assets.map(desc),
    generated:{path:OUT,bytes:Buffer.byteLength(generated),sha256:hash(generated)},gates:raw.gates};
  if(check){assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),generated);assert.equal(await readFile(path.join(ROOT,RUN,'run.json'),'utf8'),json(receipt));
    for(const asset of assets)assert.deepEqual(desc(await file(asset.path)),desc(asset));}
  else{await mkdir(path.join(ROOT,RUN));for(const asset of assets)await writeFile(path.join(ROOT,asset.path),asset.buffer,{flag:'wx'});
    await writeFile(path.join(ROOT,OUT),generated,{flag:'wx'});await writeFile(path.join(ROOT,RUN,'run.json'),json(receipt),{flag:'wx'});}
  console.log(json({check,sourceFrames:55,audioAssets:assets.map(desc),generated:receipt.generated}));return data;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
