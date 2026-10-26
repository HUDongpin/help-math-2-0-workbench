#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=b=>createHash('sha256').update(b).digest('hex');
const auditBytes=await readFile(path.join(root,'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json'));
if(hash(auditBytes)!=='2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8')throw Error('Source audit changed');
const audit=JSON.parse(auditBytes);
const rows={};
for(const member of audit.members){
 const scripts=[];
 for(const file of member.answerVisibleGeometryCrosswalk.sourceWrongActions){
  const relative=file.path.replace(member.animationId+'/',member.animationId+'/ffdec-export/scripts/');
  const bytes=await readFile(path.join(root,'work/g678-shared-page-factory/g678-alg-l11-behavior10-tranche-b-audit-v1',relative));
  if(hash(bytes)!==file.sha256)throw Error('Wrong feedback source changed');
  scripts.push({text:bytes.toString('utf8'),sha256:file.sha256});
 }
 const assignments=[...scripts[0].text.matchAll(/_global\.WrongFeed\s*=\s*("(?:[^"\\]|\\.)*");/gu)].map(m=>JSON.parse(m[1]));
 if(assignments.length===2){
  if(scripts.some(s=>![...s.text.matchAll(/_global\.WrongFeed\s*=\s*("(?:[^"\\]|\\.)*");/gu)].every((m,i)=>JSON.parse(m[1])===assignments[i])))throw Error('Different choice-specific feedback');
  rows[member.animationId]={firstWrong:assignments[1],secondWrong:assignments[0],sourceScriptSha256:scripts[0].sha256};
 }else if(assignments.length!==0)throw Error('Unreviewed feedback assignment form');
}
const output='// Generated from exact source WrongFeed assignments; do not hand-edit.\n'+
 'export const G678_ALG_L11_B_SOURCE_FEEDBACK = '+JSON.stringify(rows,null,2)+' as const;\n';
const target=path.join(root,'packages/demos/src/g678-alg-l11-b-source-feedback.generated.ts');
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==output)throw Error('Generated feedback drift');}
else await writeFile(target,output,{flag:'wx'});
console.log(JSON.stringify({sourceSpecificPages:Object.keys(rows).length,bytes:Buffer.byteLength(output),sha256:hash(output)}));
