#!/usr/bin/env node
// Invoke with node --import tsx. Pure candidate audit: no browser or audio device.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdir,readFile,writeFile,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {G678_NMS_L01_P042_AUDIO_SESSION_IR as IR,createP042AudioSession,reduceP042AudioSession,inspectP042DecoderCursor} from '../packages/demos/src/g678-nms-l01-p042-audio-session-candidate.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SELF='scripts/g678-nms-l01-p042-audit-audio-session-candidate.mjs';
const MODULE='packages/demos/src/g678-nms-l01-p042-audio-session-candidate.ts';
const TEST='packages/demos/tests/g678-nms-l01-p042-audio-session-candidate.test.ts';
const BUILDER='scripts/g678-nms-l01-p042-build-audio-session-ir.mjs';
const IRROOT='work/g678-shared-page-factory/g678-nms-l01-p042-audio-session-ir-v1';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function binding(file){const p=path.resolve(ROOT,file),s=await lstat(p);assert.ok(s.isFile()&&s.nlink===1);assert.equal(await realpath(p),p);
  const bytes=await readFile(p);return {path:file,bytes:bytes.length,sha256:sha(bytes)};}
async function main(){
  assert.deepEqual(process.argv.slice(2),['--run','v1']);
  const output='work/g678-shared-page-factory/g678-nms-l01-p042-audio-session-candidate-v1';
  const files=[SELF,MODULE,TEST,BUILDER,`${IRROOT}/ir.json`,`${IRROOT}/manifest.json`,
    'packages/demos/src/generated/g678-nms-l01-p042-audio-timing-ir-v1.ts',
    'work/g678-shared-page-factory/g678-nms-l01-p042-audio-decoder-origin-verification-v1/verification.json',
    'reports/g678-nms-l01-p042-audio-decoder-origin-measurement-2026-09-05-v1.md',
    ...IR.sourceBindings.map(b=>b.path),IR.sourceStream.path,'package-lock.json','packages/demos/tsconfig.json',
    await realpath(process.execPath),await realpath(path.join(ROOT,'node_modules/tsx/package.json'))];
  const protectedFiles=['packages/demos/private-current-js-registry.json','packages/demos/src/contract.ts','packages/demos/src/runtime.ts',
    'apps/web/components/animation-runtime.tsx','apps/web/app/[locale]/migration-status/g678-calibration/[placementId]/page.tsx'];
  const inputs=await Promise.all(files.map(binding)),protectedBefore=await Promise.all(protectedFiles.map(binding));
  const sourceModule=await readFile(path.join(ROOT,MODULE),'utf8');
  assert.doesNotMatch(sourceModule,/new Audio|createBufferSource|\.connect\(|\.start\(|fetch\(|setTimeout\(|requestAnimationFrame\(|https?:\/\//u);
  assert.equal([...sourceModule.matchAll(/^import /gmu)].length,1);
  await mkdir(path.join(ROOT,output));const outputs=[];
  const save=async(name,bytes)=>{const file=`${output}/${name}`;await writeFile(path.join(ROOT,file),bytes,{flag:'wx',mode:0o444});const b=await binding(file);outputs.push(b);return b;};
  const evidence={schemaVersion:1,artifactType:'g678-nms-l01-p042-pure-audio-session-candidate-v1',animationId:IR.animationId,status:'running',
    startedAt:new Date().toISOString(),module:inputs.find(b=>b.path===MODULE),moduleExports:['createP042AudioSession','reduceP042AudioSession','inspectP042FrameEntry','inspectP042DecoderCursor'],
    inputs,protectedBefore,outputs,commands:[],traces:[],gates:IR.gates,
    boundary:'Pure reducer/cursor candidate, not AnimationModule, actual audio transport, registered Current-JS audio or original-runtime behavior',
    earlierLocalFailure:{kind:'test-type-narrowing',command:'npm run typecheck --workspace @helpmath/demos',
      priorTestSha256:'a0aa7679b4b82a374287fbdf297f20016364992f4a156e1ab4e8cb182dee4522',
      diagnostics:'TS2339 at test line27: decodedSampleTarget/sourceAlignmentProven absent on invalid-source-frame branch.',
      disposition:'Explicit branch assertion added to test;30/30 runtime unit assertions had already passed. No frozen source or product change.'}};
  try{
    for(const file of [SELF,MODULE,TEST,BUILDER])await save(path.basename(file),await readFile(path.join(ROOT,file)));
    const commands=[[process.execPath,[BUILDER,'--check']],
      [process.execPath,['--import','tsx','--test',TEST]],
      [process.execPath,['node_modules/typescript/bin/tsc','--project','packages/demos/tsconfig.json','--noEmit']],
      [process.execPath,['packages/demos/scripts/generate-registry.mjs','--check']]];
    for(const[executable,args]of commands){const result=spawnSync(executable,args,{cwd:ROOT,encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});
      const index=evidence.commands.length;const stdout=await save(`command-${index}.stdout.txt`,result.stdout??''),stderr=await save(`command-${index}.stderr.txt`,result.stderr??'');
      evidence.commands.push({executable,args,status:result.status,signal:result.signal,stdout,stderr});assert.equal(result.error,undefined);assert.equal(result.status,0,result.stderr);}
    for(const p of IR.decoderProfiles){let state=createP042AudioSession(p.id,'en');const records=[];
      const act=intent=>{const previous=state,result=reduceP042AudioSession(state,intent);assert.equal(result.accepted,true,result.reason);state=result.state;
        records.push({intent,previousPhase:previous.phase,accepted:result.accepted,reason:result.reason,state,cursor:inspectP042DecoderCursor(state),effects:result.effects});};
      act({type:'request-load',nowMs:1});act({type:'buffer-ready',nowMs:5,epoch:state.epoch,sampleRate:p.sampleRate,length:p.length,channels:1,pcmSha256:p.pcmSha256});
      act({type:'request-play',nowMs:10,activation:'user'});act({type:'play-result',nowMs:40,epoch:state.epoch,playRequest:state.playRequest,allowed:true});
      act({type:'tick',nowMs:40.125});act({type:'pause',nowMs:41.125});
      act({type:'request-play',nowMs:500,activation:'user'});act({type:'play-result',nowMs:600,epoch:state.epoch,playRequest:state.playRequest,allowed:true});
      act({type:'tick',nowMs:600.0625});act({type:'source-terminal',nowMs:650,frame:125});act({type:'replay',nowMs:700});act({type:'close',nowMs:701});
      evidence.traces.push({profile:p.id,records});}
    evidence.inputsAfter=await Promise.all(files.map(binding));evidence.protectedAfter=await Promise.all(protectedFiles.map(binding));
    assert.deepEqual(evidence.inputsAfter,inputs);assert.deepEqual(evidence.protectedAfter,protectedBefore);
    evidence.inputsUnchanged=true;evidence.protectedUnchanged=true;evidence.unitTestsPassed=30;evidence.typecheckPassed=true;evidence.registryCheckPassed=true;evidence.irCheckPassed=true;evidence.status='passed';
  }catch(error){evidence.status='failed';evidence.failure={message:error.message,stack:error.stack};throw error;}
  finally{evidence.finishedAt=new Date().toISOString();await writeFile(path.join(ROOT,output,'run.json'),`${JSON.stringify(evidence,null,2)}\n`,{flag:'wx',mode:0o444});}
  console.log(JSON.stringify(await binding(`${output}/run.json`),null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
