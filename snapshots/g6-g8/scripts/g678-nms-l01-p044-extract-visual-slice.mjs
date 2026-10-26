#!/usr/bin/env node
// Bounded private compiler front-end; never a renderer/registration/fidelity grant.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,readdir,realpath,statfs,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SELF='scripts/g678-nms-l01-p044-extract-visual-slice.mjs';
const AUDIT='work/g678-shared-page-factory/g678-nms-l01-p044-source-audit-v2';
const TOOLS='work/g678-shared-page-factory/g678-ts07-nms-l1-current-js-1-v1/run-manifest.json';
export const MAIN_FRAMES=Object.freeze([1,20,40,80,120,160,200,240,280,311,312]);
export const LIMITS=Object.freeze({bytes:20*1024*1024,files:250,minimumFreeBytes:2*1024*1024*1024});
export const PINS=Object.freeze({
  'work/g678-shared-page-factory/g678-nms-l01-p044-independent-triage-v1/REPORT.md':'5d5e5c891cc2340fb1830b28babfac67b21456002b6df950b71f7b54d204a0ec',
  [`${AUDIT}/source.swf`]:'8ad8df775eff49a3763f67e95fba4ed211e34912bd63f6602078119240fe6c76',
  [`${AUDIT}/ffdec-source.xml`]:'3a3338eacd66b788cdda556128e0ff4715eb5647f3dfb16d1e5a2e0243d5a1fa',
  'work/g678-shared-page-factory/g678-nms-l01-p044-structural-crosscheck-v4/run.json':'619c6c158288b9f036fd0b4c75bba033d0a1d5f411a5b52894ca37c078c2dc0c',
  'work/g678-shared-page-factory/g678-nms-l01-p044-structural-crosscheck-v4/crosscheck.json':'eb32fbbdfca8d3c7fa5b7e23f582696e19f90ed4bc6188450c10c30684262820',
  [TOOLS]:'248d3c39d3ab09dc231cdd82a629802b0e38a7355fe778e036fd6c0704b5b158',
});
export const GATES=Object.freeze({currentJavaScriptRegistered:false,productCalibrationPassed:false,scaleOutAuthorized:false,
  authoritativeOriginalRuntime:false,visualFidelityAccepted:false,audioIntegrated:false,audioAccepted:false,
  humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false});
const hash=b=>createHash('sha256').update(b).digest('hex'),json=v=>`${JSON.stringify(v,null,2)}\n`;
export async function file(p){const full=path.resolve(ROOT,p),s=await lstat(full,{bigint:true});assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1n);assert.equal(await realpath(full),full);
  const b=await readFile(full),a=await lstat(full,{bigint:true});for(const k of ['ino','dev','size','mode','mtimeNs','nlink'])assert.equal(s[k],a[k]);return {path:p,bytes:b.length,sha256:hash(b)};}
export async function inventory(dir,{hashes=true}={}){const rows=[];async function walk(d){for(const e of await readdir(d,{withFileTypes:true})){assert.ok(!e.isSymbolicLink());const p=path.join(d,e.name);if(e.isDirectory())await walk(p);else {const s=await lstat(p);assert.ok(s.isFile()&&s.nlink===1);rows.push(hashes?await file(path.relative(ROOT,p)):{path:path.relative(ROOT,p),bytes:s.size});}}}await walk(dir);return rows.sort((a,b)=>a.path.localeCompare(b.path));}
export function enforceLimit(rows){assert.ok(rows.length<=LIMITS.files,`File cap exceeded:${rows.length}`);const bytes=rows.reduce((n,r)=>n+r.bytes,0);assert.ok(bytes<=LIMITS.bytes,`20MiB cap exceeded:${bytes}`);return {files:rows.length,bytes};}
export function validateAssetSelection(rows){const main=rows.filter(r=>/main-svg\/DefineSprite_293\/\d+\.svg$/.test(r.path));assert.deepEqual(main.map(r=>Number(path.basename(r.path,'.svg'))).sort((a,b)=>a-b),MAIN_FRAMES);
  assert.equal(rows.filter(r=>/root-svg\/6\.svg$/.test(r.path)).length,1);assert.equal(rows.filter(r=>r.path.endsWith('.html')).length,1);
  assert.equal(rows.filter(r=>/canvas\/DefineSprite_293\/frames\.html$/.test(r.path)).length,1);}
export function commandsFor({java,jar,out,source}){const prefix=['-Djava.net.preferIPv4Stack=true','-Djna.nosys=true','-Djava.util.Arrays.useLegacyMergeSort=true','-Xmx1024m','-Djava.awt.headless=true','-jar',jar], common=['-config','packJavaScripts=false','-onerror','abort'];return [
  {name:'current-export-help',executable:java,args:[...prefix,'-help','-export']},
  {name:'main293-compact-canvas',executable:java,args:[...prefix,...common,'-selectid','293','-format','sprite:canvas','-export','sprite',path.join(out,'canvas'),source]},
  {name:'root6-source-svg',executable:java,args:[...prefix,...common,'-select','0:6','-format','frame:svg','-export','frame',path.join(out,'root-svg'),source]},
  {name:'main293-selected-svg',executable:java,args:[...prefix,...common,'-selectid','293','-select',`293:${MAIN_FRAMES.join(',')}`,'-format','sprite:svg','-export','sprite',path.join(out,'main-svg'),source]},
];}
export async function extract(runName){assert.match(runName,/^[a-z0-9-]+$/u);const out=path.join(ROOT,'work/g678-shared-page-factory',`g678-nms-l01-p044-visual-slice-${runName}`);
  for(const key of ['FFDEC_JARFILENAME','FFDEC_MEMORY','FFDEC_STACK_SIZE','JAVA_TOOL_OPTIONS','JDK_JAVA_OPTIONS','_JAVA_OPTIONS','CLASSPATH'])assert.equal(process.env[key],undefined,`Unsupported override:${key}`);
  const inputs=[];for(const[p,sha]of Object.entries(PINS)){const b=await file(p);assert.equal(b.sha256,sha);inputs.push(b);}
  const toolchain=JSON.parse(await readFile(path.join(ROOT,TOOLS),'utf8')).toolchain;
  for(const v of [toolchain.ffdec.java,toolchain.ffdec.jar,...toolchain.ffdec.jarManifest.classPath]){const b=await file(v.realPath);assert.equal(b.bytes,v.bytes);assert.equal(b.sha256,v.sha256);inputs.push(b);}
  inputs.push(await file(SELF),await file('scripts/g678-nms-l01-p044-extract-visual-slice.test.mjs'));const capacity=await statfs(ROOT);assert.ok(capacity.bavail*capacity.bsize>=LIMITS.minimumFreeBytes);
  await mkdir(out);const save=(p,b)=>writeFile(path.join(out,p),b,{flag:'wx',mode:0o444});await save('source.swf',await readFile(path.join(ROOT,AUDIT,'source.swf')));await save('generator-source.mjs',await readFile(path.join(ROOT,SELF)));
  const receipt={schemaVersion:1,artifactType:'g678-nms-l01-p044-bounded-source-visual-slice',animationId:'shared-nms002-l01-p044',startedAt:new Date().toISOString(),inputs,
    limits:LIMITS,capacity:{availableBytes:capacity.bavail*capacity.bsize},commands:[],selection:{rootFrame:6,mainObjectId:293,mainFrames:MAIN_FRAMES,mainCanvas:'one compact object document, not759 SVG exports'},
    opaqueResidual:{domain:'sprite-196',offsetStart:517626,offsetEndExclusive:518012,bytes:386,nonzero:17,sha256:'d14a608f74eab33aa50401e45f0226b845a8b29aa02417254d15dc8675accaa0',semantics:'uninterpreted; never removed or deemed harmless'},
    distribution:'Private local raw tool outputs only; generated helper/font/image licensing/distribution review remains closed. No public bundle or source-to-fidelity claim.',gates:GATES};
  async function run(command){const started=Date.now();let timer,checking=false,capFailure;const result=await new Promise((resolve,reject)=>{const child=execFile(command.executable,command.args,{cwd:ROOT,encoding:'buffer',maxBuffer:2*1024*1024,timeout:120000},(err,stdout,stderr)=>{clearInterval(timer);resolve({err,stdout,stderr});});
      timer=setInterval(async()=>{if(checking)return;checking=true;try{enforceLimit(await inventory(out,{hashes:false}));}catch(e){capFailure=e;child.kill('SIGTERM');}finally{checking=false;}},100);});
    await save(`${command.name}.stdout.txt`,result.stdout);await save(`${command.name}.stderr.txt`,result.stderr);
    receipt.commands.push({...command,exitCode:result.err?.code??0,elapsedMs:Date.now()-started,stdout:await file(path.relative(ROOT,path.join(out,`${command.name}.stdout.txt`))),stderr:await file(path.relative(ROOT,path.join(out,`${command.name}.stderr.txt`)))});
    if(capFailure)throw capFailure;if(result.err)throw result.err;assert.equal(result.stderr.length,0,`${command.name} stderr`);enforceLimit(await inventory(out,{hashes:false}));return result.stdout.toString();}
  try{const commands=commandsFor({java:toolchain.ffdec.java.realPath,jar:toolchain.ffdec.jar.realPath,out,source:path.join(out,'source.swf')});
    const help=await run(commands[0]);for(const word of ['sprite:canvas','frame:svg','sprite:svg','-selectid','characterId','-select'])assert.ok(help.includes(word));
    for(const c of commands.slice(1)){await run(c);console.log(json({command:c.name,...enforceLimit(await inventory(out,{hashes:false}))}));}
    validateAssetSelection(await inventory(out));
    receipt.status='selected-raw-visuals-extracted-not-renderer';
  }catch(error){receipt.status='failed';receipt.failure={message:error.message,stack:error.stack};process.exitCode=1;}
  receipt.inputsAfter=await Promise.all(inputs.map(i=>file(i.path)));assert.deepEqual(receipt.inputsAfter,inputs);receipt.inputsUnchanged=true;
  receipt.outputs=await inventory(out);receipt.size=enforceLimit(receipt.outputs);receipt.completedAt=new Date().toISOString();await save('run.json',json(receipt));enforceLimit(await inventory(out,{hashes:false}));
  return {path:path.relative(ROOT,out),status:receipt.status,size:receipt.size,receipt:await file(path.relative(ROOT,path.join(out,'run.json')))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){assert.equal(process.argv.length,4);assert.equal(process.argv[2],'--run');console.log(json(await extract(process.argv[3])));}
