import {createHash} from 'node:crypto';
import {readFile,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
const SHA=/^[a-f0-9]{64}$/;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const REQUIRED=['sourceBinding','semanticText','mathSemantics','timingAndReplay','teachingTextDisposition','hostIntegration',
  'responsiveTypography','accessibility','bilingualPolicy','performance','lifecycle','resourceStability'];

/** Separate from Current-JS registration and acceptance. Existing pages enter a
 * fixed typography backlog; new or changed page modules must bring their own
 * version-bound typography evidence into the normal development check. */
export async function checkG678LessonTypography({root=ROOT,sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT}={}) {
  root=await realpath(root);
  const bytes=async relative=>{
    if(typeof relative!=='string'||!relative||path.isAbsolute(relative)||relative.split(/[\\/]/).some(p=>!p||p==='..'||p==='.'))throw new Error('Unsafe G678 typography evidence path');
    const full=path.join(root,relative),stat=await lstat(full);
    if(!stat.isFile()||stat.isSymbolicLink()||!(await realpath(full)).startsWith(root+path.sep))throw new Error('G678 typography evidence must be an ordinary in-worktree file');
    return readFile(full);
  };
  const json=async relative=>JSON.parse(await bytes(relative));
  const integration=await json('catalog/typography-v1/g678-integration.json');
  if(integration.kind!=='g678-lesson-typography-integration-v1'||!Array.isArray(integration.baselineEntries)||!Array.isArray(integration.sharedFiles))throw new Error('Invalid G678 typography integration baseline');
  const issues=[],shared=[];
  const verifyRefs=async references=>{
    if(!Array.isArray(references)||!references.length)return false;
    const seen=new Set();
    for(const reference of references){
      if(!SHA.test(reference?.sha256??'')||seen.has(reference.path))return false;
      seen.add(reference.path);
      try{if(hash(await bytes(reference.path))!==reference.sha256)return false;}catch{return false;}
    }
    return true;
  };
  for(const file of integration.sharedFiles){
    const current=await verifyRefs([file]);shared.push({path:file.path,current});
    if(!current)issues.push(`shared-typography-file-changed:${file.path}`);
  }
  const manifest=await json('catalog/g678-page-only-release-manifest.v1.json');
  const members=manifest.releases.flatMap(release=>release.members);
  if(members.length!==2282||new Set(members.map(m=>m.placementId)).size!==2282)throw new Error('G678 typography denominator drifted');
  const byAnimation=new Map(members.map(member=>[member.animationId,member]));
  const registry=await json('packages/demos/private-current-js-registry.json');
  const entries=registry.calibrations.flatMap(c=>c.entries).filter(e=>byAnimation.has(e.key));
  const baseline=new Map(integration.baselineEntries.map(entry=>[entry.key,entry]));
  if(baseline.size!==integration.baselineEntries.length)throw new Error('Duplicate G678 typography baseline page');
  const changed=[];
  for(const entry of entries){
    const reference=entry.artifacts?.module;
    if(!reference){issues.push(`registry-module-reference-missing:${entry.key}`);continue;}
    const actual=hash(await bytes(reference.path)),prior=baseline.get(entry.key);
    if(actual!==reference.sha256)issues.push(`registered-module-hash-changed:${entry.key}`);
    if(prior?.modulePath===reference.path&&prior.moduleSha256===actual)continue;
    const member=byAnimation.get(entry.key),row={animationId:entry.key,placementId:member.placementId,kind:prior?'changed-existing-page':'new-page',passed:false};
    changed.push(row);
    try{
      const bindingPath=`catalog/typography-v1/g678-page-bindings/${member.placementId}.json`;
      const bindingBytes=await bytes(bindingPath),binding=JSON.parse(bindingBytes);
      const record=await json(`catalog/typography-v1/g678-checks/${member.placementId}.json`);
      if(!sourceRoot||!path.isAbsolute(sourceRoot)||await realpath(sourceRoot)!==sourceRoot)throw new Error('Exact G678 source root is required for a new or changed page');
      const sourcePath=binding.sourceRelativePath;
      if(typeof sourcePath!=='string'||!/^(?:G6-G8-shared\/)?(?:NMS002|GEO001|ALG001|DAT001)\/L\d+\/[A-Za-z0-9_/-]+\.swf$/i.test(sourcePath))throw new Error('G678 typography source path is outside the course-page scope');
      const sourceFile=path.join(sourceRoot,sourcePath),sourceStat=await lstat(sourceFile);
      if(!sourceStat.isFile()||sourceStat.isSymbolicLink()||!(await realpath(sourceFile)).startsWith(sourceRoot+path.sep))throw new Error('G678 source is not an ordinary bounded file');
      const sourceBytes=await readFile(sourceFile);
      if(hash(sourceBytes)!==member.source.sha256)throw new Error('G678 typography source bytes changed');
      const source=collectSwfTextSourceCatalog(sourceBytes);
      const bounds=source.header.stageBoundsTwips;
      if(bounds.right<=bounds.left||bounds.bottom<=bounds.top||source.unparsedTags?.length)throw new Error('G678 typography source has unsupported structural data');
      const textIds=new Set((source.textDefinitions??[]).flatMap(definition=>[definition.sourceTextId,...(definition.runs??[]).map(run=>run.sourceTextId)]));
      const shapes=new Map((source.shapeDefinitions??[]).map(shape=>[shape.characterId,shape.sourceTagSha256]));
      const blockIds=new Set(),orders=new Set();
      const validBlocks=Array.isArray(binding.blocks)&&binding.blocks.every(block=>{
        const order=`${block.language}:${block.readingOrder}`;
        if(typeof block.id!=='string'||!block.id||blockIds.has(block.id)||orders.has(order)||!Number.isSafeInteger(block.readingOrder)
          ||!['en','es'].includes(block.language)||!['title','heading','body','question','feedback','answer','label'].includes(block.role)
          ||!Array.isArray(block.sourceTextIds)||!block.sourceTextIds.every(id=>textIds.has(id)))return false;
        blockIds.add(block.id);orders.add(order);
        const sourceShapes=block.sourceShapeIds??[];
        return Array.isArray(sourceShapes)&&(block.sourceTextIds.length>0||sourceShapes.length>0)
          &&sourceShapes.every(id=>shapes.has(id)&&binding.sourceRoleDecisions?.some(decision=>decision.kind==='outlined-text'
            &&decision.sourceShapeHashes?.some(shape=>shape.characterId===id&&shape.sourceTagSha256===shapes.get(id))
            &&decision.role===block.role&&typeof decision.semanticValue==='string'&&decision.semanticValue.trim()));
      });
      const sourceRisksResolved=Array.isArray(record.resolvedSourceRisks)&&(source.risks??[]).every(risk=>record.resolvedSourceRisks.includes(risk.kind));
      const references=binding.implementation?.files;
      const evidenceCurrent=await verifyRefs(record.artifacts),implementationCurrent=await verifyRefs(references);
      const actualModuleBound=Array.isArray(references)&&references.some(f=>f.path===reference.path&&f.sha256===actual);
      const expectedSharedBound=integration.sharedFiles.every(f=>references?.some(r=>r.path===f.path&&r.sha256===f.sha256));
      const language=record.languagePolicy;
      const bilingual=language?.en==='source'&&['source','translated','source-fallback'].includes(language.es)
        &&(language.es==='source-fallback'||binding.blocks?.some(block=>block.language==='es'));
      row.passed=binding.schemaVersion===1&&binding.animationId===entry.key&&binding.placementId===member.placementId
        &&binding.sourceSwfSha256===member.source.sha256&&binding.sourceCatalogContentSha256===hash(JSON.stringify(source))
        &&validBlocks&&(binding.blocks.length>0||binding.textDisposition==='no-required-teaching-text')&&sourceRisksResolved
        &&Array.isArray(binding.unresolved)&&binding.unresolved.length===0
        &&record.kind==='g678-lesson-typography-check-v1'&&record.bindingSha256===hash(bindingBytes)
        &&record.placementId===member.placementId&&record.sourceSwfSha256===member.source.sha256
        &&Number.isFinite(Date.parse(record.checkedAt))&&Date.parse(record.checkedAt)<=Date.now()+1000
        &&REQUIRED.every(check=>record.checks?.[check]==='passed')&&bilingual
        &&actualModuleBound&&expectedSharedBound&&implementationCurrent&&evidenceCurrent;
      if(!row.passed)issues.push(`new-or-changed-page-typography-not-verified:${member.placementId}`);
    }catch(error){row.reason=error.code??error.message;issues.push(`new-or-changed-page-typography-evidence-missing:${member.placementId}`);}
  }
  return{schemaVersion:1,kind:'g678-lesson-typography-development-check-v1',checkedAt:new Date().toISOString(),
    passed:issues.length===0,activePlacements:members.length,existingTypographyBacklog:integration.baselineEntries.length,
    changedOrNewPages:changed.length,checkedNewOrChangedPages:changed.filter(row=>row.passed).length,
    sourceCatalogOrCurrentJsIsTypographyAcceptance:false,humanReviewPassed:0,strictCompletionEffect:'none',publicationEffect:'none',
    shared,changed,issues};
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href){
  const args=process.argv.slice(2);
  if(args.length&&!(args.length===2&&args[0]==='--root'))throw new Error('Usage: node scripts/check-g678-lesson-typography-v1.mjs [--root <worktree>]');
  checkG678LessonTypography({root:args[1]??ROOT}).then(result=>{process.stdout.write(JSON.stringify(result,null,2)+'\n');if(!result.passed)process.exitCode=1;})
    .catch(error=>{process.stderr.write(`${error.stack??error}\n`);process.exitCode=1;});
}
