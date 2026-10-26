#!/usr/bin/env node
/** Real Playwright CLI flow, serialized in one owned browser session. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
const directory=process.argv[2]??'output/playwright/g678-engineering-efficiency-20260930';
assert(directory.startsWith('output/playwright/')&&!directory.split('/').includes('..'),'browser output boundary');
fs.mkdirSync(directory,{recursive:true});
const wrapper='/Users/peter/.codex/skills/playwright/scripts/playwright_cli.sh';
const session=`g678-host-${directory.split('/').at(-1)}`;
const plan=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
function verifyServer() {
 assert(Number.isSafeInteger(plan.server.pid)&&plan.server.origin==='http://127.0.0.1:3331','explicit local server identity');
 const cwd=execFileSync('lsof',['-a','-p',String(plan.server.pid),'-d','cwd','-Fn'],{encoding:'utf8'}).split('\n').find(line=>line.startsWith('n'))?.slice(1);
 assert.equal(cwd,`${process.cwd()}/apps/web`,'browser server belongs to frozen worktree');
 const listener=execFileSync('lsof',['-nP','-a','-p',String(plan.server.pid),'-iTCP:3331','-sTCP:LISTEN','-Fn'],{encoding:'utf8'});
 assert(listener.includes('n127.0.0.1:3331'),'same process still owns exact loopback origin');
}
async function cli(args,label) {
 verifyServer();
 const child=spawn(wrapper,[`-s=${session}`,...args],{shell:false,stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',bytes=>output+=bytes);child.stderr.on('data',bytes=>output+=bytes);
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
 fs.writeFileSync(`${directory}/${label}.txt`,output,{flag:'wx'});
 assert.equal(code,0,`${label}: CLI exited unsuccessfully`);
 assert(!output.includes('### Error'),`${label}: browser assertion failed; see retained log`);
 return output;
}
const results=[];
await cli(['open','about:blank'],'open');
for(const locale of ['en','es'])for(const page of ['017','018']) {
 for(const part of ['exercise','finish']) {
  const label=`p${page}-${locale}-${part}`;
  await cli(['run-code',`async page=>{page.__g678HostCase=${JSON.stringify({locale,page,part,output:directory})};return page.__g678HostCase;}`],`${label}-plan`);
  await cli(['snapshot'],`${label}-snapshot`);
  const output=await cli(['run-code','--filename','scripts/browser/g678-source-host-bridge-flow-v1.js'],label);
  const match=output.match(/### Result\n([\s\S]*?)\n### /);assert(match,`${label}: browser result missing`);
  const result=JSON.parse(match[1]);
  fs.writeFileSync(`${directory}/${label}.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  assert.equal(result.status,part==='exercise'?'exercise-passed':'host-flow-passed');
  if(part==='finish')results.push(result);
  verifyServer();
  console.log(JSON.stringify({case:label,status:result.status,cases:result.cases.length}));
 }
}
assert(results.length===4&&results.every(r=>r.pageErrors.length===0),'both consumers and both locales');
const result={kind:'g678-shared-host-browser-verification-v1',checkedAt:new Date().toISOString(),results,pageErrors:[]};
fs.writeFileSync(`${directory}/browser-verification-v1.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
await cli(['close'],'close');
console.log(JSON.stringify({status:'real-host-flows-passed',results:results.length}));
