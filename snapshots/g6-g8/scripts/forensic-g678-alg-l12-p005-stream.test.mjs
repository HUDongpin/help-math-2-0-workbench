import assert from 'node:assert/strict';
import {request} from 'node:http';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';
import {createP005ForensicServer} from './forensic-g678-alg-l12-p005-stream.mjs';
import {p005ForensicDerivative} from './lib/g678-p005-forensic-derivative.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const source='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW05.swf';

test('instrumented derivative is deterministic and does not mutate source or embedded audio',async()=>{
 const bytes=await readFile(source),original=Buffer.from(bytes);
 const first=p005ForensicDerivative(bytes),second=p005ForensicDerivative(bytes);
 assert.ok(bytes.equals(original));assert.ok(first.swf.equals(second.swf));
 assert.equal(first.receipt.derivativeSha256,'beaf7a74789fdac131aeef96401a5e725e2e33b4544550e9ae6e63264845b8c8');
 assert.equal(first.receipt.modifiedRootActionCount,1);assert.equal(first.receipt.insertedMainTraceCount,968);
 assert.equal(first.receipt.audioBlockBodiesPreserved,true);assert.equal(first.receipt.originalRuntime,false);
 const linear=p005ForensicDerivative(bytes,{entry:'linear'});
 assert.equal(linear.receipt.derivativeSha256,'ce856f85e3cbc9f5384a437b9c573a58589999f211fdf207774a41d7366c410b');
 assert.equal(linear.receipt.audioBlockBodiesPreserved,true);assert.equal(linear.receipt.insertedMainTraceCount,968);
 const wrong=Buffer.from(bytes);wrong[20]^=1;assert.throws(()=>p005ForensicDerivative(wrong));
});

test('instrumented route explicitly binds served derivative instead of preserved source identity',async()=>{
 const {server,binding}=createP005ForensicServer({instrumented:true,entry:'linear'});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{
  const response=await fetch(`http://127.0.0.1:${server.address().port}/source.swf`);
  assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());
  assert.equal(sha(bytes),binding.servedSha256);assert.equal(bytes.length,binding.servedBytes);
  assert.equal(binding.servedSha256,binding.derivative.derivativeSha256);
  assert.notEqual(binding.servedSha256,binding.sourceSha256);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('local server binds source/runtime and denies alternate hosts, writes, queries and foreign requests',async()=>{
 const {server,binding}=createP005ForensicServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const port=server.address().port;
 const get=(url,headers={},method='GET')=>new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port,path:url,headers,method},res=>{const parts=[];res.on('data',b=>parts.push(b));res.on('end',()=>resolve({status:res.statusCode,bytes:Buffer.concat(parts),headers:res.headers}));});req.on('error',reject);req.end();
 });
 try{
  const sourceResult=await get('/source.swf');assert.equal(sourceResult.status,200);assert.equal(sha(sourceResult.bytes),binding.sourceSha256);
  for(const [url,headers,method]of[['/source.swf',{host:'foreign.invalid'},'GET'],['/source.swf',{'sec-fetch-site':'cross-site'},'GET'],['/source.swf?x=1',{},'GET'],['/unknown',{},'GET'],['/source.swf',{},'POST']])assert.equal((await get(url,headers,method)).status,404);
  const page=await get('/');assert.equal(page.status,200);assert.match(page.bytes.toString(),/mute.gain.value=0/);assert.match(page.bytes.toString(),/allowNetworking:'none'/);
  const recorder=page.bytes.toString().match(/const events=\[\][\s\S]*?(?=const nativeConnect)/u)?.[0];
  assert.ok(recorder);
  const counts=vm.runInNewContext(`${recorder}\nfor(let i=0;i<30003;i++)record('test');({count:events.length,droppedEvents,eventCapacity})`,{performance:{now:()=>1}});
  assert.equal(counts.count,30000);assert.equal(counts.eventCapacity,30000);assert.equal(counts.droppedEvents,3);
  assert.equal(binding.sourceModified,false);assert.equal(binding.acceptance,false);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
