#!/usr/bin/env node
/** Read-only credit calculation; writes the requested human-readable status only. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export function ordinaryCredits(runs, members) {
  const sources=new Map(members.map(m=>[m.animationId,m.source.sha256]));
  const passed=new Set(), flagged=new Map();
  for(const run of runs) {
    const groups=new Map();
    for(const row of run.results) {
      assert(sources.has(row.animationId),'result belongs to the active source manifest');
      assert(['en','es'].includes(row.locale),'ordinary result locale');
      const key=row.animationId+':'+row.locale;
      assert(!groups.has(key),'one result per page and locale in a run');
      groups.set(key,row);
      if(row.status!=='ordinary-calibration-pass') {
        if(row.status==='failed'||row.status==='flagged'){passed.delete(row.animationId);flagged.set(row.animationId,row.failureCode??'ORDINARY_CHECK_FAILED');}
        continue;
      }
      assert(Array.isArray(row.logs)&&row.logs.length===0,'a pass has no retained required-resource or page errors');
      assert(Array.isArray(row.checks)&&row.checks.length>0&&row.checks.every(c=>c.status==='pass'),'all ordinary checks passed');
      const identities=[];
      const visit=value=>{if(!value||typeof value!=='object')return;if(value.animationId===row.animationId&&typeof value.sourceSha256==='string')identities.push(value.sourceSha256);for(const child of Object.values(value))visit(child);};
      visit(row);
      assert(identities.length>0&&identities.every(sha=>sha===sources.get(row.animationId)),'actual observations bind the exact page source');
    }
    for(const id of new Set(run.results.map(r=>r.animationId)))if(['en','es'].every(locale=>groups.get(id+':'+locale)?.status==='ordinary-calibration-pass')){passed.add(id);flagged.delete(id);}
  }
  return {passed,flagged};
}

function readPin(root,pin) {
  const file=path.resolve(root,pin.path),before=fs.statSync(file,{bigint:true});
  const bytes=fs.readFileSync(file),after=fs.statSync(file,{bigint:true});
  assert(before.isFile()&&['dev','ino','size','mtimeNs','ctimeNs'].every(k=>before[k]===after[k]),'stable status evidence');
  assert.equal(bytes.length,pin.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),pin.sha256,pin.path);
  return JSON.parse(bytes);
}

export function renderStatus(root) {
  const current=JSON.parse(fs.readFileSync(path.join(root,'work/hfr-typescript/CURRENT.json'),'utf8'));
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'catalog/g678-page-only-release-manifest.v1.json'),'utf8'));
  const runs=[];
  for(const receiptPin of current.scenarioA.ordinaryRunReceipts??[]) {
    const receipt=readPin(root,receiptPin),stable=readPin(root,receipt.stability),result=readPin(root,receipt.result);
    const clean=stable.status==='stable-command-passed';
    const partial=stable.phase==='postflight'&&stable.drift===null&&stable.exitCode===1&&String(stable.error).startsWith('browser command must succeed');
    assert(clean||partial,'source drift or incomplete postflight prevents ordinary credit');
    assert.equal(result.buildId,receipt.buildId,'result belongs to the recorded build');
    assert(result.results.every(r=>stable.animationIds.includes(r.animationId)),'result belongs to the frozen page scope');
    runs.push(result);
  }
  const members=manifest.releases.flatMap(r=>r.members),credit=ordinaryCredits(runs,members);
  assert.equal(members.length,2282);assert.equal(manifest.releases.length,44);
  const sample=current.scenarioA.fullConformanceSamplesPassed,human=current.scenarioA.humanLessonsReviewed,closed=current.stages.closedAtRequestedGate;
  for(const [value,max] of [[sample,1],[human,44],[closed,2282]])assert(Number.isSafeInteger(value)&&value>=0&&value<=max,'existing independent-gate ledger count');
  const lines=['# G6–G8 Scenario A 状态','',`生成时间：${new Date().toLocaleString('sv-SE',{timeZone:'Asia/Taipei',hour12:false})} Asia/Taipei`,'',
    `- 普通页通过：${credit.passed.size}/2,282`,`- 六配置样本通过：${sample}/1`,`- 人工已审课：${human}/44`,`- 请求门闭环：${closed}/2,282`,'',
    `当前 host：${current.scenarioA.currentHost?.path??'未记录'}。构建：${current.activeExecution?.buildId??'进行中'}（${current.activeExecution?.status??current.status}）。`,'',
    '| 课 | 普通页通过 | 已走但未通过 | 首要失败代码 |','| --- | ---: | ---: | --- |'];
  for(const lesson of manifest.releases) {
    const ids=lesson.members.map(m=>m.animationId),passed=ids.filter(id=>credit.passed.has(id)).length,failures=ids.filter(id=>credit.flagged.has(id));
    const codes=new Map();for(const id of failures){const code=credit.flagged.get(id);codes.set(code,(codes.get(code)??0)+1)}
    const top=[...codes].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]??'—';
    lines.push(`| ${lesson.moduleCode} L${lesson.moduleLesson} | ${passed}/${ids.length} | ${failures.length} | ${top} |`);
  }
  lines.push('',`普通页分子按同一次运行的英西两行、原始检查和源身份去重计算；readiness、准备包、构建和单语通过均不计页。`,
    '样本、人工审和请求门闭环读取既有独立门账；本脚本不授予这些信用。未走页面不记为失败。',
    `历史状态：${current.historyArchive?.path??'见原交接记录'}。`,'');
  return {text:lines.join('\n'),counts:{ordinary:credit.passed.size,sample,human,closed}};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),result=renderStatus(root);
  const file=path.join(root,'work/hfr-typescript/STATUS.md'),temporary=file+'.tmp';
  fs.writeFileSync(temporary,result.text,{flag:'wx'});fs.renameSync(temporary,file);
  console.log(JSON.stringify({statusFile:file,counts:result.counts,pageCreditGranted:false}));
}
