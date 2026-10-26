#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {G678_ALG_L11_D_INSTRUCTIONAL_VISUALS as ART} from '../packages/demos/src/generated/g678-alg-l11-tranche-d-instructional-visuals-v1.ts';
import {G678_ALG_L11_ADVANCED3_TRANCHE_D_MATCHING_CARDS as CARDS} from '../packages/demos/src/g678-alg-l11-advanced3-tranche-d-state.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CONFIG='config/g678-alg-l11-p034-math-transcription-v1.json';
const PARSER='scripts/g678-alg-l11-p034-math-source.py';
const XML='work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1/shared-alg001-l11-p034/source.xml';
const OUT='catalog/g678-alg-l11-p034-math-source-map-v1.json';
const RUN='work/g678-shared-page-factory/g678-alg-l11-p034-math-source-map-v1';
const PROJECTION=`${RUN}/source-projection.json`;
const json=x=>JSON.stringify(x,null,2)+'\n',hash=b=>createHash('sha256').update(b).digest('hex');
async function binding(p){const full=path.isAbsolute(p)?p:path.join(ROOT,p),before=await lstat(full);assert.ok(before.isFile()&&!before.isSymbolicLink());
  const b=await readFile(full),after=await lstat(full);assert.equal(before.ino,after.ino);assert.equal(before.mtimeMs,after.mtimeMs);return{path:p,bytes:b.length,sha256:hash(b)};}
const relations={'<':'is less than','≤':'is less than or equal to','>':'is greater than','≥':'is greater than or equal to'};
const wordValues={0:'zero',1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',10:'ten',11:'eleven',12:'twelve',27:'twenty-seven',28:'twenty-eight',77:'seventy-seven'};
const num=n=>`${n<0?'−':''}${Math.abs(n)}`;
function words(n){assert.ok(Object.hasOwn(wordValues,Math.abs(n)));return`${n<0?'negative ':''}${wordValues[Math.abs(n)]}`;}
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const numberXml=n=>`${n<0?'<mo>−</mo>':''}<mn>${Math.abs(n)}</mn>`;
export function describeMath(m){
  if(m.kind==='compound'){
    const op=m.inclusive?'≤':'<';return{expression:`${num(m.lower)} ${op} x ${op} ${num(m.upper)}`,
      spoken:`${words(m.lower)} ${relations[op]} x, and x ${relations[op]} ${words(m.upper)}.`,
      xml:`${numberXml(m.lower)}<mo>${escape(op)}</mo><mi>x</mi><mo>${escape(op)}</mo>${numberXml(m.upper)}`};
  }
  assert.ok(Object.hasOwn(relations,m.operator));
  if(m.kind==='absolute')return{expression:`|x| ${m.operator} ${num(m.right)}`,
    spoken:`The absolute value of x ${relations[m.operator]} ${words(m.right)}.`,
    xml:`<mo>|</mo><mi>x</mi><mo>|</mo><mo>${escape(m.operator)}</mo>${numberXml(m.right)}`};
  assert.equal(m.kind,'linear');assert.ok(m.coefficients.length>0&&m.coefficients.every(n=>Number.isSafeInteger(n)&&n!==0));
  const terms=m.coefficients.map(n=>({n,variable:true}));if(m.constant!==0)terms.push({n:m.constant,variable:false});
  let expression='',spoken='',xml='';
  terms.forEach(({n,variable},index)=>{
    const value=variable?(Math.abs(n)===1?'x':`${Math.abs(n)}x`):String(Math.abs(n));
    const speech=variable?(Math.abs(n)===1?'x':`${words(Math.abs(n))} x`):words(Math.abs(n));
    expression+=`${index?(n<0?' − ':' + '):(n<0?'−':'')}${value}`;
    spoken+=`${index?(n<0?' minus ':' plus '):(n<0?'negative ':'')}${speech}`;
    xml+=`${index?`<mo>${n<0?'−':'+'}</mo>`:n<0?'<mo>−</mo>':''}${variable?(Math.abs(n)===1?'':`<mn>${Math.abs(n)}</mn>`)+`<mi>x</mi>`:`<mn>${Math.abs(n)}</mn>`}`;
  });
  return{expression:`${expression} ${m.operator} ${num(m.right)}`,spoken:`${spoken} ${relations[m.operator]} ${words(m.right)}.`,
    xml:`${xml}<mo>${escape(m.operator)}</mo>${numberXml(m.right)}`};
}
export function solutionSet(m){
  if(m.kind==='compound')return{lower:m.lower,upper:m.upper,lowerInclusive:m.inclusive,upperInclusive:m.inclusive};
  if(m.kind==='absolute'){assert.ok(m.right>0&&['<','≤'].includes(m.operator));return{lower:-m.right,upper:m.right,lowerInclusive:m.operator==='≤',upperInclusive:m.operator==='≤'};}
  const coefficient=m.coefficients.reduce((a,b)=>a+b,0);assert.notEqual(coefficient,0);
  const threshold=(m.right-m.constant)/coefficient;assert.ok(Number.isSafeInteger(threshold));
  const op=coefficient<0?({'<':'>','≤':'≥','>':'<','≥':'≤'})[m.operator]:m.operator;
  return op==='<'||op==='≤'?{lower:null,upper:threshold,lowerInclusive:false,upperInclusive:op==='≤'}
    :{lower:threshold,upper:null,lowerInclusive:op==='≥',upperInclusive:false};
}
export async function build({check=false}={}){
  const xml=await binding(XML);assert.equal(xml.sha256,'25d66465e54bffe8065ea812cbb606f6212c64869a6716eacdabbdf6231e4ee5');
  const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;assert.ok(sourceRoot&&path.isAbsolute(sourceRoot));
  const sourcePath=path.join(sourceRoot,'G6-G8-shared/ALG001/L11/GS/L11GS03.swf'),source=await binding(sourcePath);
  assert.equal(source.sha256,'77b4d2a8ee13325bd527f558751ac84e60d1de36d1ff258cb6569f36885ad06c');assert.equal((await lstat(sourcePath)).mode&0o222,0);
  const config=JSON.parse(await readFile(path.join(ROOT,CONFIG),'utf8'));assert.equal(config.cards.length,24);
  const projection=JSON.parse((await promisify(execFile)('python3',[PARSER,XML],{cwd:ROOT,maxBuffer:4*1024*1024})).stdout);
  const projectionBytes=json(projection),projectionBinding={path:PROJECTION,bytes:Buffer.byteLength(projectionBytes),sha256:hash(projectionBytes)};
  const rows=[];
  for(const row of config.cards){
    const card=CARDS.find(c=>c.level===row.level&&c.sourceInstanceName===row.name),art=ART.cards.find(c=>c.level===row.level&&c.sourceInstanceName===row.name);
    const proof=projection.cards.find(c=>c.level===row.level&&c.sourceInstanceName===row.name);
    assert.ok(card&&art&&proof);assert.equal(card.sourceCharacterId,row.characterId);assert.equal(proof.sourceCharacterId,row.characterId);
    assert.deepEqual(await binding(art.sourceSvg.path),art.sourceSvg);assert.equal(hash(art.visual.svg),art.visual.sha256);
    for(const text of art.sourceText){assert.deepEqual(await binding(text.source.path),text.source);
      assert.ok(proof.texts.some(t=>t.characterId===text.characterId&&t.text===text.text));}
    for(const vector of row.vectorSymbols)assert.ok(proof.vectors.some(v=>v.characterId===vector.characterId));
    const description=describeMath(row.math);assert.equal(description.expression,row.expected);
    rows.push({cardId:card.id,sourceCharacterId:row.characterId,sourceInstanceName:row.name,level:row.level,pairId:card.pairId,side:card.side,
      literalAlternative:{expression:description.expression,spokenLanguage:'en',spoken:description.spoken,
        mathMl:`<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mrow>${description.xml}</mrow></math>`,
        solutionDetailsIncluded:false},
      reviewerOnly:{math:row.math,solutionSet:solutionSet(row.math),doNotExposeAsLearnerLabel:true},
      evidence:{sourceXml:xml,sourceProjection:projectionBinding,sourceSpriteSubtreeSha256:proof.sourceSpriteSubtreeSha256,
        sourceSvg:art.sourceSvg,normalizedSvgSha256:art.visual.sha256,textBindings:art.sourceText.map(t=>({characterId:t.characterId,...t.source})),
        textPlacementCount:proof.texts.length,glyphCount:proof.texts.reduce((sum,t)=>sum+t.glyphs.length,0),
        vectorAuthoredSymbols:row.vectorSymbols,placementNote:row.placementNote??null},
      transcriptionStatus:'source-xml-glyph-and-vector-verified-engineering',ambiguity:null});
  }
  assert.deepEqual(rows.map(r=>r.cardId),CARDS.map(c=>c.id));
  const pairs=[];
  for(const level of[1,2])for(let pairId=1;pairId<=6;pairId++){
    const pair=rows.filter(row=>row.level===level&&row.pairId===pairId);assert.equal(pair.length,2);
    assert.deepEqual(pair[0].reviewerOnly.solutionSet,pair[1].reviewerOnly.solutionSet,`source pairing math mismatch L${level} pair${pairId}`);
    pairs.push({level,pairId,cardIds:pair.map(c=>c.cardId),solutionSet:pair[0].reviewerOnly.solutionSet,mathematicallyEquivalent:true,reviewerOnly:true});
  }
  const screenshotPaths=['work/g678-shared-page-factory/g678-alg-l11-tranche-d-instructional-inspection-v1/matching-level-1.png',
    'work/g678-shared-page-factory/g678-alg-l11-tranche-d-instructional-inspection-v1/matching-level-2.png',
    'output/playwright/g678-alg-l11-p034-feedback-v1/correct-paused-reduce-390.png'];
  const manifest={schemaVersion:1,artifactType:'g678-alg-l11-p034-source-mathematical-alternatives-preparation',builder:await binding(path.relative(ROOT,fileURLToPath(import.meta.url))),
    config:await binding(CONFIG),parser:await binding(PARSER),source:{...source,path:'G6-G8-shared/ALG001/L11/GS/L11GS03.swf'},sourceXml:xml,sourceProjection:projectionBinding,
    cards:rows,pairs,screenshotEvidence:await Promise.all(screenshotPaths.map(binding)),
    method:'Read source text glyph map and exact placements; recover non-text mathematical signs from hash-bound vector symbols and full-size source SVG inspection; derive reviewer-only intervals independently.',
    normalization:'Spaces around operators and Unicode mathematical minus/≤/≥ standardize typography without changing source expression, strictness, order or meaning.',
    ambiguities:config.ambiguities,limitations:config.limitations,
    gates:{installedInRenderer:false,mobileCompanionImplemented:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,
      audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false}};
  const bytes=json(manifest);
  if(check){assert.equal(await readFile(path.join(ROOT,PROJECTION),'utf8'),projectionBytes);assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),bytes);}
  else{await mkdir(path.join(ROOT,RUN));await writeFile(path.join(ROOT,PROJECTION),projectionBytes,{flag:'wx'});await writeFile(path.join(ROOT,OUT),bytes,{flag:'wx'});}
  console.log(json({check,path:OUT,bytes:Buffer.byteLength(bytes),sha256:hash(bytes),cards:24,equivalentPairs:12,ambiguities:manifest.ambiguities.length}));return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
