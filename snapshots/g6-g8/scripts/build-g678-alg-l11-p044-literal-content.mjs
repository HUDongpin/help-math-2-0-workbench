#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {G678_ALG_L11_D_INSTRUCTIONAL_VISUALS as SOURCE} from '../packages/demos/src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CONFIG='config/g678-alg-l11-p044-literal-content-v1.json';
const XML='work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1/shared-alg001-l11-p044/source.xml';
const PARSER='scripts/g678-alg-l11-p044-literal-source.py';
const OUT='packages/demos/src/generated/g678-alg-l11-p044-literal-content-v1.ts';
const MAP='catalog/g678-alg-l11-p044-literal-content-source-map-v1.json';
const RUN='work/g678-shared-page-factory/g678-alg-l11-p044-literal-content-v1';
const hash=b=>createHash('sha256').update(b).digest('hex'),json=x=>JSON.stringify(x,null,2)+'\n';
async function binding(p){const full=path.isAbsolute(p)?p:path.join(ROOT,p),stat=await lstat(full);assert.ok(stat.isFile()&&!stat.isSymbolicLink());const b=await readFile(full);return{path:p,bytes:b.length,sha256:hash(b)};}
export function speakLiteral(value){return value.replace(/\|([xy])\|/g,'the absolute value of $1').replace(/(^|[<>=≤≥]\s*)−/g,'$1negative ')
  .replaceAll('−',' minus ').replaceAll('≤',' is less than or equal to ').replaceAll('≥',' is greater than or equal to ')
  .replaceAll('<',' is less than ').replaceAll('>',' is greater than ').replaceAll('=',' equals ').replaceAll('+',' plus ')
  .replace(/(\d)([xyn])/g,'$1 $2').replace(/\s+/g,' ').trim();}
const point=n=>n<0?`negative ${-n}`:String(n);
export function describeGraph(graph){
  assert.ok(graph&&['ray','segment'].includes(graph.kind));
  if(graph.kind==='ray'){assert.ok(Number.isInteger(graph.endpoint)&&['left','right'].includes(graph.direction)&&typeof graph.closed==='boolean');
    return`Number line marked from negative 9 to 9. ${graph.closed?'Filled':'Open'} circle at ${point(graph.endpoint)}; the ray extends to the ${graph.direction}.`;}
  assert.ok(Number.isInteger(graph.left)&&Number.isInteger(graph.right)&&graph.left<graph.right);
  return`Number line marked from negative 9 to 9. A line segment joins ${graph.leftClosed?'a filled':'an open'} circle at ${point(graph.left)} to ${graph.rightClosed?'a filled':'an open'} circle at ${point(graph.right)}.`;
}
export async function build({check=false}={}){
  const config=JSON.parse(await readFile(path.join(ROOT,CONFIG),'utf8'));assert.equal(config.questions.length,24);assert.equal(config.ambiguities.length,0);
  assert.deepEqual(config.questions.map(q=>q.number),Array.from({length:24},(_,i)=>i+1));
  const xml=await binding(XML);assert.equal(xml.sha256,'0b0e3dc5ad42c1aebc8d702bb1b1df01d457c8774be5783c88202aa00a15ea89');
  const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;assert.ok(sourceRoot&&path.isAbsolute(sourceRoot));
  const swfPath=path.join(sourceRoot,'G6-G8-shared/ALG001/L11/FQ/L11FQ02.swf'),swf=await binding(swfPath);
  assert.equal(swf.sha256,'d17c24baef9bf9ea87eefae6cf5d317ad50a211035cd997e0cfba16eb6390ff1');assert.equal((await lstat(swfPath)).mode&0o222,0);
  const ids=[...new Set(SOURCE.questions.flatMap(q=>[...q.promptCharacterIds,...q.choices.map(c=>c.sourceCharacterId)]))];
  const projection=JSON.parse((await promisify(execFile)('python3',[PARSER,XML,JSON.stringify(ids)],{cwd:ROOT,maxBuffer:8*1024*1024})).stdout);
  const projected=json(projection),projectionBinding={path:`${RUN}/source-projection.json`,bytes:Buffer.byteLength(projected),sha256:hash(projected)};
  const proofs=[],content=[];
  for(const row of config.questions){const q=SOURCE.questions.find(q=>q.number===row.number);assert.equal(row.choices.length,4);
    const files=[q.sourceFrameSvg,q.sourceReviewFrameSvg,...q.sourceText.map(t=>t.source),...q.choices.flatMap(c=>[c.sourceSvg,...c.sourceText.map(t=>t.source)])];
    for(const file of files)assert.deepEqual(await binding(file.path),file);
    assert.equal(hash(q.prompt.svg),q.prompt.sha256);for(const choice of q.choices)assert.equal(hash(choice.visual.svg),choice.visual.sha256);
    proofs.push({number:q.number,promptCharacterIds:q.promptCharacterIds,sourceFrame:q.sourceFrame,sourceReviewFrame:q.sourceReviewFrame,files,
      normalizedPromptSha256:q.prompt.sha256,choices:q.choices.map(c=>({option:c.option,sourceInstanceName:c.sourceInstanceName,sourceCharacterId:c.sourceCharacterId,normalizedSvgSha256:c.visual.sha256})),
      fullSizeEngineeringInspection:await binding(`work/g678-shared-page-factory/g678-alg-l11-tranche-d-instructional-inspection-v1/q${String(q.number).padStart(2,'0')}.png`)});
    content.push({number:q.number,label:q.label,prompt:row.prompt,promptSpoken:speakLiteral(row.prompt),
      promptGraphDescription:row.promptGraph?describeGraph(row.promptGraph):null,
      choices:row.choices.map((literal,index)=>{const choice=q.choices[index];assert.equal(choice.sourceInstanceName,`A${q.number}Opt${index+1}`);
        const text=typeof literal==='string'?literal:describeGraph(literal);return{option:index+1,sourceInstanceName:choice.sourceInstanceName,sourceCharacterId:choice.sourceCharacterId,
          text,spoken:typeof literal==='string'?speakLiteral(literal):text,graphic:typeof literal!=='string'};})});
  }
  const generated='// Generated literal source content only; no answer key, correctness or solved-question metadata.\nexport const G678_ALG_L11_P044_LITERAL_CONTENT = '+JSON.stringify(content)+' as const;\n';
  assert.ok(!/correctOption|correctSourceInstanceName|solutionSet|reviewerOnly/.test(generated));
  const manifest={schemaVersion:1,artifactType:'p044-literal-question-choice-source-map',builder:await binding(path.relative(ROOT,fileURLToPath(import.meta.url))),
    config:await binding(CONFIG),parser:await binding(PARSER),source:{...swf,path:'G6-G8-shared/ALG001/L11/FQ/L11FQ02.swf'},sourceXml:xml,sourceProjection:projectionBinding,
    questions:proofs,prompts:24,choices:96,numberLineDescriptions:18,sourceTranscriptionNotes:config.sourceTranscriptionNotes,ambiguities:config.ambiguities,
    generated:{path:OUT,bytes:Buffer.byteLength(generated),sha256:hash(generated)},
    verification:'Literal transcription checked against full-size source SVG renders and exact text/glyph/vector identities; source distractors retained. Not solved-answer metadata.',
    gates:{installedInRenderer:false,registered:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,published:false}};
  if(check){assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),generated);assert.equal(await readFile(path.join(ROOT,MAP),'utf8'),json(manifest));assert.equal(await readFile(path.join(ROOT,projectionBinding.path),'utf8'),projected);}
  else{await mkdir(path.join(ROOT,RUN));await writeFile(path.join(ROOT,OUT),generated,{flag:'wx'});await writeFile(path.join(ROOT,MAP),json(manifest),{flag:'wx'});await writeFile(path.join(ROOT,projectionBinding.path),projected,{flag:'wx'});}
  console.log(json({check,map:MAP,...manifest.generated,prompts:24,choices:96,graphDescriptions:18}));return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
