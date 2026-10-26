#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,readdir,lstat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUTPUT='work/g678-shared-page-factory/g678-alg-l11-p034-feedback-source-v1';
const FFDEC='/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.sh';
const hash=b=>createHash('sha256').update(b).digest('hex');
async function binding(file){const s=await lstat(file);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1);const b=await readFile(file);return{path:file.startsWith(ROOT+path.sep)?path.relative(ROOT,file):file,bytes:b.length,sha256:hash(b)};}
const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;assert.ok(sourceRoot&&path.isAbsolute(sourceRoot));
const source=path.join(sourceRoot,'G6-G8-shared/ALG001/L11/GS/L11GS03.swf');
const input=await binding(source);assert.equal(input.sha256,'77b4d2a8ee13325bd527f558751ac84e60d1de36d1ff258cb6569f36885ad06c');
assert.equal((await lstat(source)).mode&0o222,0);
const tools={launcher:await binding(FFDEC),jar:await binding(path.join(path.dirname(FFDEC),'ffdec.jar'))};
assert.equal(tools.launcher.sha256,'1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab');
assert.equal(tools.jar.sha256,'090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f');
const out=path.join(ROOT,OUTPUT);await mkdir(out);
const args=['-onerror','abort','-format','sprite:svg','-selectid','105,118',
  '-select','105:1-28,118:1-27','-export','sprite',out,source];
const result=await promisify(execFile)(FFDEC,args,{encoding:'buffer',maxBuffer:16*1024*1024}).catch(async error=>{
  await writeFile(path.join(out,'failed-stdout.txt'),error.stdout??'',{flag:'wx'});
  await writeFile(path.join(out,'failed-stderr.txt'),error.stderr??'',{flag:'wx'});throw error;});
await writeFile(path.join(out,'stdout.txt'),result.stdout,{flag:'wx'});await writeFile(path.join(out,'stderr.txt'),result.stderr,{flag:'wx'});
assert.equal(result.stderr.length,0);assert.ok(result.stdout.toString().startsWith('JPEXS Free Flash Decompiler v.26.2.1'));
assert.equal((await binding(source)).sha256,input.sha256);
const files=[];
async function walk(dir){for(const e of(await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){assert.ok(!e.isSymbolicLink());const f=path.join(dir,e.name);if(e.isDirectory())await walk(f);else files.push({...await binding(f),path:path.relative(out,f)});}}
await walk(out);assert.equal(files.filter(f=>/^DefineSprite_(105|118)\/\d+\.svg$/.test(f.path)).length,55);
await writeFile(path.join(out,'extraction.json'),JSON.stringify({schemaVersion:1,runId:path.basename(OUTPUT),
  builder:await binding(fileURLToPath(import.meta.url)),source:{...input,path:'G6-G8-shared/ALG001/L11/GS/L11GS03.swf'},tools,
  command:[FFDEC,...args.map(a=>a===source?'<hash-bound-source>':a===out?'<exclusive-run-root>':a)],files,
  gates:{currentJavaScriptRegistered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,
    visualFidelityAccepted:false,audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false}},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:OUTPUT,fileCount:files.length,feedbackSourceFrames:55}));
