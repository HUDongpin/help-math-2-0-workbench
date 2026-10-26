#!/usr/bin/env node
import assert from 'node:assert/strict';
import {parse} from 'acorn';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=b=>createHash('sha256').update(b).digest('hex');
export function drawingBodies(code){
  const ast=parse(code,{ecmaVersion:2022,sourceType:'module'}),bodies=[];
  function visit(node,depth=0){if(!node||typeof node!=='object')return;
    const fn=['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(node.type);
    if(fn&&depth>0)bodies.push(code.slice(node.start,node.end));
    for(const[key,value]of Object.entries(node)){if(key==='start'||key==='end')continue;
      if(Array.isArray(value))value.forEach(child=>visit(child,depth+(fn?1:0)));else if(value&&typeof value==='object')visit(value,depth+(fn?1:0));}
  }
  visit(ast);return bodies;
}
export function comparePreparedFunctions(before,after){const original=drawingBodies(before),prepared=drawingBodies(after);
  assert.ok(original.length>100);assert.deepEqual(prepared,original,'Every nested source/helper/drawing function must be byte-identical');return original.length;}
export async function verify(){const beforePath='packages/demos/src/generated/g678-nms-l01-p044-source-canvas-v1.ts',afterPath='packages/demos/src/generated/g678-nms-l01-p044-prepared-source-canvas-v2.ts';
  const before=await readFile(beforePath,'utf8'),after=await readFile(afterPath,'utf8');
  assert.equal(hash(before),'a2c12a7265bdc6f7df923abd966af471d05b36987b1deaa5baf521b8128bc80e');assert.equal(hash(after),'872d1480e729d4807101b4caa58eec01970c08b7b6480d25e327f2047de4b0f0');
  const count=comparePreparedFunctions(before,after);
  assert.throws(()=>comparePreparedFunctions(before,after.replace('ctx.clearRect(0,0,800,600);','ctx.clearRect(0,0,799,600);')));
  const inputs=[];for(const p of [beforePath,afterPath,'scripts/verify-g678-nms-l01-p044-prepared-canvas.mjs','scripts/verify-g678-nms-l01-p044-prepared-canvas.test.mjs']){const b=await readFile(p);inputs.push({path:p,bytes:b.length,sha256:hash(b)});}
  return{status:'ast-function-body-identity-passed-not-original-runtime',inputs,identicalFunctionCount:count,actualSourceDrawMutationRejected:true,
    retainedPriorFailure:'Initial test searched until the next function keyword, accidentally including unrelated image declarations after sprite293. Its2/3 result is retained; this AST-span comparison replaces that invalid test boundary, not source artwork.',
    gates:{currentJavaScriptRegistered:false,productCalibrationPassed:false,originalRuntimeAccepted:false,audioAccepted:false,strictComplete:false,published:false}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert.equal(process.argv.length,2);const report=await verify();const dir='work/g678-shared-page-factory/g678-nms-l01-p044-prepared-canvas-ast-verification-v1';await mkdir(path.join(ROOT,dir));const content=JSON.stringify(report,null,2)+'\n';await writeFile(path.join(ROOT,dir,'verification.json'),content,{flag:'wx',mode:0o444});console.log(JSON.stringify({path:`${dir}/verification.json`,bytes:Buffer.byteLength(content),sha256:hash(content),count:report.identicalFunctionCount},null,2));}
