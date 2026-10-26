#!/usr/bin/env node
// Read-only remeasurement of saved PCM plus an exclusive new verification receipt.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SOURCE,METHOD,assertSource,physicalBinding,pcmFromBytes,alignedMetrics,findOrigin,assertMeasuredOrigin} from './g678-nms-l01-p042-audio-decoder-origin.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const INPUT={path:'work/g678-shared-page-factory/g678-nms-l01-p042-audio-decoder-origin-v1/evidence.json',bytes:178406,
  sha256:'35e0ac1d66bcc144309dfa6f65d9782b243a0ff4ac866adf50bf8de31f909104'};
const SELF='scripts/g678-nms-l01-p042-audio-decoder-origin-verify.mjs';
const OUTPUT='work/g678-shared-page-factory/g678-nms-l01-p042-audio-decoder-origin-verification-v1';
const hash=b=>createHash('sha256').update(b).digest('hex');

async function main() {
  assert.deepEqual(process.argv.slice(2),['--verify-v1']);assert.deepEqual(await physicalBinding(INPUT.path),INPUT);
  const evidence=JSON.parse(await readFile(path.join(ROOT,INPUT.path))),negatives=[],comparisons=[];
  assert.equal(evidence.status,'passed');assert.equal(evidence.inputsUnchanged,true);assert.equal(evidence.protectedUnchanged,true);
  assert.deepEqual(evidence.inputs,evidence.inputsAfter);assert.deepEqual(evidence.protectedBefore,evidence.protectedAfter);
  assert.deepEqual(evidence.requests,[]);assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.method,METHOD);
  assert.ok(Object.values(evidence.gates).every(value=>value===false));
  for(const binding of [...evidence.inputs,...evidence.outputs,...evidence.protectedAfter])assert.deepEqual(await physicalBinding(binding.path),binding);
  const source=await readFile(path.join(ROOT,SOURCE.path));assertSource(source);
  for(const [name,bytes] of [['byte-flip',Buffer.from(source)],['truncated',source.subarray(1)],['appended',Buffer.concat([source,Buffer.from([0])])]]){
    if(name==='byte-flip')bytes[300]^=1;assert.throws(()=>assertSource(bytes));negatives.push({name,rejected:true});
  }
  for(const record of evidence.records) {
    assert.equal(new Set(record.repeatHashes).size,1);assert.equal(record.repeatHashes.length,2);
    const reference=pcmFromBytes(await readFile(path.join(ROOT,record.referenceOutput.path))),candidate=pcmFromBytes(await readFile(path.join(ROOT,record.output.path)));
    const origin=findOrigin(reference,candidate,record.decoded.sampleRate);assert.deepEqual(origin,record.origin);assertMeasuredOrigin(origin,0);
    const wrongOffsets=[-1,1,-Math.round(1673*record.decoded.sampleRate/22050),Math.round(1673*record.decoded.sampleRate/22050)].map(lag=>{
      assert.throws(()=>assertMeasuredOrigin(origin,lag));const difference=alignedMetrics(reference,candidate,lag);
      assert.ok(difference.normalizedRmse>METHOD.maximumNormalizedRmse,'Incorrect offset unexpectedly passed difference bound');
      return {...difference,rejectedAsClaimedOrigin:true};
    });
    const gainChanged=Float32Array.from(candidate,value=>value*2),badDifference=alignedMetrics(reference,gainChanged,0);
    assert.ok(badDifference.normalizedRmse>METHOD.maximumNormalizedRmse);negatives.push({name:'actual-PCM-double-gain',sampleRate:record.decoded.sampleRate,rejected:true,metrics:badDifference});
    comparisons.push({sampleRate:record.decoded.sampleRate,reproducedOrigin:origin,wrongOffsets,
      excludedReferenceTail:Array.from(reference.slice(reference.length-origin.fullOverlap.excluded.referenceSuffix))});
  }
  const tests=spawnSync(process.execPath,['--test','scripts/g678-nms-l01-p042-audio-decoder-origin.test.mjs'],{cwd:ROOT,encoding:'utf8',timeout:60000});
  assert.equal(tests.status,0,tests.stderr);assert.equal(tests.error,undefined);assert.match(tests.stdout,/tests 12/u);assert.match(tests.stdout,/pass 12/u);
  const after=await Promise.all(evidence.inputs.map(binding=>physicalBinding(binding.path)));assert.deepEqual(after,evidence.inputs);
  for(const binding of evidence.protectedAfter)assert.deepEqual(await physicalBinding(binding.path),binding);
  await mkdir(path.join(ROOT,OUTPUT));
  const artifacts=[];
  for(const [name,bytes] of [['verifier-byte-exact.mjs',await readFile(path.join(ROOT,SELF))],['unit-tests.stdout.txt',tests.stdout],['unit-tests.stderr.txt',tests.stderr]]){
    const file=`${OUTPUT}/${name}`;await writeFile(path.join(ROOT,file),bytes,{flag:'wx',mode:0o444});artifacts.push(await physicalBinding(file));
  }
  const report={schemaVersion:1,artifactType:'g678-nms-l01-p042-audio-decoder-origin-verification-v1',status:'passed',createdAt:new Date().toISOString(),
    evidence:INPUT,verifier:await physicalBinding(SELF),inputsVerified:evidence.inputs.length,outputsVerified:evidence.outputs.length,
    protectedVerified:evidence.protectedAfter,comparisons,negatives,unitTests:{command:[process.execPath,'--test','scripts/g678-nms-l01-p042-audio-decoder-origin.test.mjs'],passed:12,total:12,
      status:tests.status,stdoutSha256:hash(tests.stdout),stderrSha256:hash(tests.stderr)},artifacts,
    scope:'Saved PCM remeasurement and offline negative checks; no second browser/decoder session or original-runtime listening',gates:evidence.gates};
  const output=`${OUTPUT}/verification.json`;await writeFile(path.join(ROOT,output),`${JSON.stringify(report,null,2)}\n`,{flag:'wx',mode:0o444});
  console.log(JSON.stringify(await physicalBinding(output),null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
