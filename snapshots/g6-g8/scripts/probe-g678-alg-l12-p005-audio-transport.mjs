import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, lstat, realpath} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.ok(process.argv.length===2||(process.argv.length===3&&['--schedule','--natural-candidate'].includes(process.argv[2])));
const scheduleMode=process.argv[2]==='--schedule';
const naturalMode=process.argv[2]==='--natural-candidate';
const inputSnapshots = new Map();
async function readPhysicalInput(file) {
 const absolute=path.join(root,file);assert.equal(await realpath(absolute),absolute);
 const before=await lstat(absolute,{bigint:true});assert.ok(before.isFile()&&!before.isSymbolicLink());
 const bytes=await readFile(absolute),after=await lstat(absolute,{bigint:true});
 for(const key of ['dev','ino','size','mtimeNs'])assert.equal(before[key],after[key]);
 return {bytes,stat:after,sha256:createHash('sha256').update(bytes).digest('hex')};
}
const inputs = await Promise.all(['scripts/probe-g678-alg-l12-p005-audio-transport.mjs','packages/demos/src/alg-l12-p005-audio-decode.ts','packages/demos/src/alg-l12-p005-audio-transport.ts',...((scheduleMode||naturalMode)?['packages/demos/src/alg-l12-p005-audio-schedule.ts']:[]),...(naturalMode?['packages/demos/src/alg-l12-p005-audio-candidate-clock.ts','scripts/lib/p005-natural-candidate-probe.ts']:[])].map(async file=>{
 const snapshot=await readPhysicalInput(file);inputSnapshots.set(file,snapshot);return {path:file,sha256:snapshot.sha256,bytes:snapshot.bytes.length};
}));
const source = path.join(root, 'migrations/shared-alg001-l12-p005/audio-source-v1/sprite-391-source-stream.mp3');
assert.equal(await realpath(source), source);
const before = await lstat(source, {bigint:true});
assert.ok(before.isFile() && !before.isSymbolicLink());
const mp3 = await readFile(source), after = await lstat(source, {bigint:true});
for (const key of ['dev','ino','size','mtimeNs']) assert.equal(before[key], after[key]);
assert.equal(mp3.length, 597584);
assert.equal(createHash('sha256').update(mp3).digest('hex'), '988a60d21db50f1b70babf7cd9503311c4635be8e46654c8bc6b27fbb26f50af');
const bundle = await build({stdin: {contents: naturalMode ? `
import {runNaturalCandidateProbe} from './scripts/lib/p005-natural-candidate-probe';
window.runProbe=async()=>{document.getElementById('result').textContent='Running muted natural candidate (about 83 seconds)...';window.result={...await runNaturalCandidateProbe(),implementationInputs:${JSON.stringify(inputs)},bundleSha256:document.querySelector('meta[name=probe-bundle-sha256]').content};document.getElementById('result').textContent=JSON.stringify(window.result,null,2);};
` : `
import {decodeP005Audio,P005_AUDIO_SOURCE} from './packages/demos/src/alg-l12-p005-audio-decode';
import {P005AudioTransport} from './packages/demos/src/alg-l12-p005-audio-transport';
import {resolveP005AudioFrame,P005_AUDIO_SCHEDULE} from './packages/demos/src/alg-l12-p005-audio-schedule';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(value,message)=>{if(!value)throw Error(message);};
window.runProbe=async()=>{
 const records=[];const context=new AudioContext({sampleRate:44100});let transport;
 try{
  const encoded=await (await fetch('/source.mp3')).arrayBuffer();
  const buffer=await decodeP005Audio(context,encoded);
  const samples=buffer.getChannelData(0);let peak=0,nonzero=0;for(const sample of samples){check(Number.isFinite(sample),'nonfinite PCM');peak=Math.max(peak,Math.abs(sample));if(sample!==0)nonzero++;}
  check(nonzero>44100,'unexpected silent decode');
  records.push({check:'source-decode',rate:buffer.sampleRate,samples:buffer.length,channels:buffer.numberOfChannels,encodedBytes:encoded.byteLength,peak,nonzero});
  transport=new P005AudioTransport(context,buffer);
  check(transport.snapshot().volume===0,'not muted');
  if(${scheduleMode}){
   const starts=[];const createSource=context.createBufferSource.bind(context);
   context.createBufferSource=()=>{const node=createSource();const start=node.start.bind(node);node.start=(...args)=>{starts.push(args);return start(...args);};return node;};
   for(const frame of [1,22,23,24,25,337,338,339,340,383,384,385,967,968]){
    const plan=resolveP005AudioFrame(frame),before=starts.length;transport.pause();
    if(plan.kind==='active'){
     transport.setWindow(plan.sourceSample,plan.sourceEndSample);check(await transport.play(),'schedule play');
     check(starts.length===before+1,'expected one node');const scheduled=starts.at(-1);
     check(scheduled[1]===plan.sourceSample/44100&&scheduled[2]===(plan.sourceEndSample-plan.sourceSample)/44100,'wrong scheduled window');
     await wait(20);transport.pause();
    }else check(starts.length===before,'unexpected gap node');
    records.push({check:'candidate-frame-window',frame,plan,nodeCreated:starts.length-before,scheduled:starts.length>before?starts.at(-1):null});
   }
  }
  transport.setWindow(0,44100);await transport.play();await wait(120);transport.pause();
  const paused=transport.snapshot();check(paused.sample>0&&paused.sample<44100&&paused.phase==='paused','pause');
  await wait(80);check(transport.snapshot().sample===paused.sample,'pause drift');records.push({check:'pause-freeze',...paused});
  await transport.play();await wait(80);transport.pause();check(transport.snapshot().sample>paused.sample,'resume progression');records.push({check:'resume',...transport.snapshot()});
  transport.seek(22050);check(transport.snapshot().sample===22050,'seek');records.push({check:'seek',...transport.snapshot()});
  await transport.replay();await wait(35);check(transport.snapshot().sample<22050,'replay reset');transport.pause();records.push({check:'replay',...transport.snapshot()});
  transport.setWindow(buffer.length-1000,buffer.length);await transport.play();await wait(100);check(transport.snapshot().phase==='ended','natural completion');records.push({check:'natural-end',...transport.snapshot()});
  check(await transport.play()===false,'terminal replay implicit');await transport.close();await transport.close();
  check(context.state==='closed'&&transport.snapshot().phase==='closed','close');records.push({check:'close',...transport.snapshot()});
  window.result={status:'passed',source:P005_AUDIO_SOURCE,schedule:${scheduleMode}?P005_AUDIO_SCHEDULE:null,implementationInputs:${JSON.stringify(inputs)},userAgent:navigator.userAgent,records,muted:true,frameSynchronization:false,originalRuntime:false,audioAccepted:false};
 }catch(error){window.result={status:'failed',error:String(error),records,muted:true};if(transport)await transport.close();else await context.close();}
 document.getElementById('result').textContent=JSON.stringify(window.result,null,2);
};`, resolveDir:root, loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser',target:'es2022'});
for(const [file,before] of inputSnapshots){
 const after=await readPhysicalInput(file);assert.equal(after.sha256,before.sha256);
 for(const key of ['dev','ino','size','mtimeNs'])assert.equal(after.stat[key],before.stat[key]);
}
const js = bundle.outputFiles[0].contents;
const bundleSha256=createHash('sha256').update(js).digest('hex');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="probe-bundle-sha256" content="${bundleSha256}"><title>P005 muted source audio transport</title><h1>P005 muted source audio transport</h1><p>Local unregistered implementation test. No original-runtime, frame synchronization or listening acceptance.</p><button id="start" onclick="this.disabled=true;runProbe()">Run muted lifecycle checks</button><pre id="result" role="status">Not started</pre><script src="/probe.js"></script></html>`;
const server=createServer((req,res)=>{
 const host='127.0.0.1:'+server.address().port;
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; frame-src 'none'");
 if(req.method!=='GET'||req.headers.host!==host||req.headers['sec-fetch-site']==='cross-site'){res.writeHead(404);res.end();return;}
 const files=new Map([['/',[html,'text/html']],['/probe.js',[js,'application/javascript']],['/source.mp3',[mp3,'audio/mpeg']]]);
 const resource=files.get(req.url);
 if(!resource){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':resource[1]});res.end(resource[0]);
});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:'+server.address().port+'/',scope:naturalMode?'muted-unregistered-natural-candidate':'muted-unregistered-transport-only'})));
