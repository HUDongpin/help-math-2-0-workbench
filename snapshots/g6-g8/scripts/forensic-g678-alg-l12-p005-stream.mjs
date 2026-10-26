import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {p005ForensicDerivative} from './lib/g678-p005-forensic-derivative.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourceRoot='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const source=path.join(sourceRoot,'G6-G8-shared/ALG001/L12/RW/L12RW05.swf');
const sourceSha='b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function createP005ForensicServer({instrumented=false,entry='jump'}={}) {
  const sourceStat=fs.lstatSync(sourceRoot);
  assert.ok(sourceStat.isDirectory()&&!sourceStat.isSymbolicLink());
  assert.equal(fs.realpathSync(source),source);
  const before=fs.lstatSync(source,{bigint:true}),swf=fs.readFileSync(source),after=fs.lstatSync(source,{bigint:true});
  assert.ok(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n);
  for(const key of ['dev','ino','size','mtimeNs'])assert.equal(after[key],before[key]);
  assert.equal(swf.length,1950595);assert.equal(sha(swf),sourceSha);
  const derivative=instrumented?p005ForensicDerivative(swf,{entry}):null;
  const ruffle=path.join(root,'node_modules/@ruffle-rs/ruffle');
  const files=new Map();
  for(const name of fs.readdirSync(ruffle)) {
    if(name==='ruffle.js'||/^core\.ruffle\.[a-f0-9]+\.js$/u.test(name)||/^[a-f0-9]+\.wasm$/u.test(name)) {
      const file=path.join(ruffle,name),stat=fs.lstatSync(file);
      assert.ok(stat.isFile()&&!stat.isSymbolicLink());
      const bytes=fs.readFileSync(file);files.set('/'+name,bytes);
    }
  }
  assert.ok(files.has('/ruffle.js'));
  const binding={animationId:'shared-alg001-l12-p005',sourceSha256:sourceSha,sourceBytes:swf.length,
    servedSha256:sha(derivative?.swf??swf),servedBytes:(derivative?.swf??swf).length,
    runtime:'Ruffle',version:JSON.parse(fs.readFileSync(path.join(ruffle,'package.json'),'utf8')).version,
    runtimeFiles:[...files].map(([name,bytes])=>({name,bytes:bytes.length,sha256:sha(bytes)})),
    authority:'forensic-compatibility-only',sourceModified:instrumented,derivative:derivative?.receipt??null,audibleOutput:false,
    originalRuntime:false,acceptance:false};
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>P005 source stream forensic probe</title>
<style>body{font:16px system-ui;background:#eef;color:#123}ruffle-player{display:block;width:800px;height:600px}pre{white-space:pre-wrap}</style>
<script>
const binding=${JSON.stringify(binding)};
const events=[],nodes=new WeakMap(),contexts=new Set(),mutes=new WeakMap();let serial=0,player=null,droppedEvents=0;
const eventCapacity=30000;
const record=(type,data={})=>{if(events.length<eventCapacity)events.push({type,wallMs:performance.now(),...data});else droppedEvents++;};
const nativeConnect=AudioNode.prototype.connect;
AudioNode.prototype.connect=function(destination,...args){
  if(destination instanceof AudioDestinationNode){
    let mute=mutes.get(this.context);
    if(!mute){mute=this.context.createGain();mute.gain.value=0;mutes.set(this.context,mute);contexts.add(this.context);nativeConnect.call(mute,destination);}
    record('muted-output',{contextTime:this.context.currentTime});
    return nativeConnect.call(this,mute,...args);
  }
  return nativeConnect.call(this,destination,...args);
};
const nativeStart=AudioBufferSourceNode.prototype.start,nativeStop=AudioBufferSourceNode.prototype.stop;
AudioBufferSourceNode.prototype.start=function(...args){
  const id=++serial;nodes.set(this,id);contexts.add(this.context);
  let peak=0,squares=0,firstNonzero=null,lastNonzero=null;
  if(this.buffer)for(let c=0;c<this.buffer.numberOfChannels;c++){
    const data=this.buffer.getChannelData(c);
    for(let i=0;i<data.length;i++){const v=Math.abs(data[i]);peak=Math.max(peak,v);squares+=v*v;
      if(v>0){firstNonzero=firstNonzero===null?i:Math.min(firstNonzero,i);lastNonzero=Math.max(lastNonzero??0,i);}}
  }
  record('start',{id,contextTime:this.context.currentTime,contextState:this.context.state,args,
    samples:this.buffer?.length??null,sampleRate:this.buffer?.sampleRate??null,
    channels:this.buffer?.numberOfChannels??null,duration:this.buffer?.duration??null,loop:this.loop,
    peak,rms:this.buffer?Math.sqrt(squares/(this.buffer.length*this.buffer.numberOfChannels)):null,firstNonzero,lastNonzero});
  this.addEventListener('ended',()=>record('ended',{id,contextTime:this.context.currentTime}),{once:true});
  return nativeStart.apply(this,args);
};
AudioBufferSourceNode.prototype.stop=function(...args){record('stop',{id:nodes.get(this)??null,contextTime:this.context.currentTime,args});return nativeStop.apply(this,args);};
window.probeSnapshot=()=>({binding,nowMs:performance.now(),eventCapacity,droppedEvents,events:[...events],
  contexts:[...contexts].map(c=>({state:c.state,time:c.currentTime,sampleRate:c.sampleRate,muted:mutes.has(c)})),
  metadata:player?.ruffle().metadata??null,loadedConfig:player?.ruffle().loadedConfig??null});
window.startProbe=async()=>{
  document.getElementById('start').disabled=true;record('load-request');
  player=window.RufflePlayer.newest().createPlayer();document.getElementById('stage').append(player);
  await player.ruffle().load({url:'/source.swf',autoplay:'on',unmuteOverlay:'hidden',allowNetworking:'none',allowScriptAccess:false});
  player.ruffle().traceObserver=message=>record('trace',{message,contextTime:[...contexts][0]?.currentTime??null});
  record('load-returned');document.getElementById('status').textContent=binding.sourceModified?'Instrumented derivative: forced begin entry and frame traces; not original-host or original-Flash evidence. Output muted.':'Unmodified source loaded; output muted. This is not original Flash or listening evidence.';
};
</script><script src="/ruffle.js"></script></head><body>
<h1>P005 source stream forensic probe</h1><p>Ruffle compatibility observation only. Not original-runtime, audio acceptance or fidelity evidence. No audible output.</p>
<button id="start" onclick="startProbe().catch(e=>document.getElementById('status').textContent=String(e))">Start muted source observation</button>
<p id="status" role="status">Not started.</p><div id="stage"></div></body></html>`;
  const server=createServer((req,res)=>{
    const address=server.address(),host=`127.0.0.1:${address?.port}`;
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
    res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-src 'none'");
    if(req.method!=='GET'||req.headers.host!==host||req.headers['sec-fetch-site']==='cross-site') {res.writeHead(404);res.end();return;}
    const url=new URL(req.url,`http://${host}`);
    if(url.search){res.writeHead(404);res.end();return;}
    if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
    if(url.pathname==='/binding.json'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(binding));return;}
    if(url.pathname==='/source.swf'){res.writeHead(200,{'Content-Type':'application/x-shockwave-flash'});res.end(derivative?.swf??swf);return;}
    const bytes=files.get(url.pathname);
    if(!bytes){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':url.pathname.endsWith('.wasm')?'application/wasm':'application/javascript'});res.end(bytes);
  });
  return {server,binding};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert.ok(process.argv.length===2||(process.argv.length===3&&['--instrumented','--instrumented-linear'].includes(process.argv[2])));
  const {server,binding}=createP005ForensicServer({instrumented:process.argv.length===3,entry:process.argv[2]==='--instrumented-linear'?'linear':'jump'});
  server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({url:`http://127.0.0.1:${server.address().port}/`,...binding})));
}
