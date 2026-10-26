// Preserve canonical source timelines; bind supplemental controls separately.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PRIOR='work/g678-shared-page-factory/frozen16-glossary-candidates-v1/manifest.json';
const OUTPUT='work/g678-shared-page-factory/frozen16-glossary-candidates-v2';
const pin=(p,b)=>({path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
async function main(){
  assert(process.argv.length===2||process.argv.length===3&&process.argv[2]==='--check');
  const checked=spawnSync(process.execPath,['scripts/build-g678-frozen16-glossary-candidates.mjs','--check'],{cwd:ROOT,encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);
  const bytes=await readFile(path.join(ROOT,PRIOR)),prior=JSON.parse(bytes),next=structuredClone(prior);
  assert.equal(pin(PRIOR,bytes).sha256,'317f4871a3e8bac50b708acd772e8323d2e3c248667040769a1c6ac02f1716f4');
  next.artifactType='g678-frozen16-glossary-candidates-v2';
  next.entries=prior.entries.map(e=>({...e,controlsConfiguration:e.artifacts.timeline,
    artifacts:{...e.artifacts,timeline:e.predecessorTimeline},
    timelineBindingDisposition:'unchanged-canonical-source-timeline-with-separately-bound-controls-configuration'}));
  next.inputs.push(pin(PRIOR,bytes),pin('scripts/prepare-g678-frozen16-glossary-canvas-binding.mjs',await readFile(fileURLToPath(import.meta.url))));
  next.predecessor=pin(PRIOR,bytes);next.productFilesChanged=0;
  const result=JSON.stringify(next,null,2)+'\n';
  if(process.argv[2]==='--check')assert.equal((await readFile(path.join(ROOT,OUTPUT,'manifest.json'))).toString(),result);
  else{await mkdir(path.join(ROOT,OUTPUT));await writeFile(path.join(ROOT,OUTPUT,'manifest.json'),result,{flag:'wx'});}
  console.log(JSON.stringify(pin(`${OUTPUT}/manifest.json`,Buffer.from(result))));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e);process.exitCode=1;});
