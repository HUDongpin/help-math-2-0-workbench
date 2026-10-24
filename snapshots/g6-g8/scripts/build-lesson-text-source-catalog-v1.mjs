#!/usr/bin/env node
import {readFile,writeFile,mkdir,lstat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {gzipSync,gunzipSync} from "node:zlib";
import {collectSwfTextSourceCatalog,sha256} from "./lib/swf-text-source-catalog.mjs";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const MANIFEST="catalog/page-only-program-manifest.v2.json";
const OUTPUT="catalog/typography-v1/source-catalog";
const SOURCE_ROOTS=[
  "/Volumes/WestWorld/HELP MATH 2.0-factory-v2/source-assets/flash/HELP MATH_ORIGINAL FILES",
  "/Volumes/WestWorld/HELP MATH 2.0/source-assets/flash/HELP MATH_ORIGINAL FILES",
];
const assert=(test,message)=>{if(!test)throw new Error(message);};
const json=object=>`${JSON.stringify(object)}\n`;

export async function readTextSourceAsset(root,assetEntry){
  const absolute=path.resolve(root,assetEntry.path);assert(absolute.startsWith(`${path.resolve(root)}${path.sep}`),"asset path escapes root");
  assert(assetEntry.artifactEncoding==="gzip-json","unsupported asset artifact encoding");
  const compressed=await readFile(absolute);assert(compressed.length===assetEntry.outputBytes&&sha256(compressed)===assetEntry.outputSha256,"compressed asset integrity mismatch");
  const content=gunzipSync(compressed,{maxOutputLength:256*1024*1024});assert(content.length===assetEntry.contentBytes&&sha256(content)===assetEntry.contentSha256,"asset content integrity mismatch");
  const parsed=JSON.parse(content);assert(parsed.assetId===assetEntry.assetId&&parsed.sourceSha256===assetEntry.sourceSha256,"asset identity mismatch");return parsed;
}

export function validateManifestRows(rows,expectedCount=1751){
  assert(Array.isArray(rows)&&rows.length===expectedCount,`expected ${expectedCount} active page placements`);
  const seen=new Set();
  for(const row of rows){
    assert(typeof row.placementId==="string"&&!seen.has(row.placementId),"missing or duplicate placementId");seen.add(row.placementId);
    assert(typeof row.animationId==="string"&&row.animationId.startsWith("course-"),"only active lesson-page animations are in scope");
    assert(/^[a-f0-9]{64}$/.test(row.sourceSha256??"")&&row.assetId===`swf-${row.sourceSha256}`,"source/asset SHA binding is invalid");
    assert(typeof row.sourcePath==="string"&&!path.isAbsolute(row.sourcePath)&&!row.sourcePath.split(/[\\/]/).includes("..")&&/\.swf$/i.test(row.sourcePath),"source path is unsafe or not SWF");
  }
  return rows;
}

async function readSource(row,sourceRoots){
  for(let i=0;i<sourceRoots.length;i++){
    const absolutePath=path.resolve(sourceRoots[i],row.sourcePath);assert(absolutePath.startsWith(`${path.resolve(sourceRoots[i])}${path.sep}`),"source path escaped root");
    let stat;try{stat=await lstat(absolutePath);}catch(error){if(error.code==="ENOENT")continue;throw error;}
    assert(stat.isFile()&&!stat.isSymbolicLink(),"source is not an ordinary file");
    const bytes=await readFile(absolutePath),actualSha256=sha256(bytes);
    if(actualSha256!==row.sourceSha256)return {status:"hash-mismatch",sourceRootIndex:i,actualSha256,bytes:bytes.length};
    return {status:"verified",sourceRootIndex:i,actualSha256,bytes};
  }
  return {status:"source-unavailable"};
}

export async function buildLessonTextSourceCatalog({root=ROOT,sourceRoots=SOURCE_ROOTS,check=false,expectedCount=1751,onProgress=()=>{}}={}){
  const manifestBytes=await readFile(path.join(root,MANIFEST)),manifest=JSON.parse(manifestBytes),rows=validateManifestRows(manifest.rows,expectedCount);
  const sourceByPath=new Map(),assetBySha=new Map(),assets=[],placements=[];
  const outputDir=path.join(root,OUTPUT);if(!check)await mkdir(path.join(outputDir,"assets"),{recursive:true});
  async function output(relative,content){const absolute=path.join(root,relative);if(check){const existing=await readFile(absolute);assert(existing.equals(Buffer.isBuffer(content)?content:Buffer.from(content)),`generated output is stale: ${relative}`);}else await writeFile(absolute,content);}
  for(const row of rows){
    const pathKey=`${row.sourcePath}\0${row.sourceSha256}`;let source=sourceByPath.get(pathKey);
    if(!source){try{source=await readSource(row,sourceRoots);}catch(error){source={status:"source-read-failed",error:error.message};}sourceByPath.set(pathKey,{...source,bytes:Buffer.isBuffer(source.bytes)?source.bytes.length:source.bytes});}
    let asset=assetBySha.get(row.sourceSha256);
    if(!asset){
      const relative=`${OUTPUT}/assets/${row.sourceSha256}.json.gz`;
      asset={assetId:row.assetId,sourceSha256:row.sourceSha256,path:relative,status:source.status,summary:null,risks:[]};
      let record;
      if(source.status==="verified"){
        // A deduplicated source path may have been verified earlier; read it only
        // when its bytes are actually needed for this unique asset.
        if(!Buffer.isBuffer(source.bytes))source=await readSource(row,sourceRoots);
        try{record=collectSwfTextSourceCatalog(source.bytes);asset.summary=record.summary;asset.risks=record.risks.map(r=>r.kind);asset.status=record.unparsedTags.length?"parsed-with-gaps":"parsed";}catch(error){asset.status="parse-failed";asset.risks=["asset-parse-failed"];record={schemaVersion:1,kind:"swf-text-source-catalog-v1",sourceSha256:row.sourceSha256,error:error.message,claimBoundary:{structuralOnly:true,runtimeVisibilityEstablished:false,modernizationComplete:false}};}
      }else record={schemaVersion:1,kind:"swf-text-source-catalog-v1",sourceSha256:row.sourceSha256,error:source.status,claimBoundary:{structuralOnly:true,runtimeVisibilityEstablished:false,modernizationComplete:false}};
      record.assetId=row.assetId;record.source={path:row.sourcePath,sha256:row.sourceSha256,actualSha256:source.actualSha256??null,sourceRootIndex:source.sourceRootIndex??null,bytes:Buffer.isBuffer(source.bytes)?source.bytes.length:source.bytes??null,status:source.status};
      const serialized=Buffer.from(json(record)),compressed=gzipSync(serialized,{level:9,mtime:0});asset.artifactEncoding="gzip-json";asset.contentSha256=sha256(serialized);asset.contentBytes=serialized.length;asset.outputSha256=sha256(compressed);asset.outputBytes=compressed.length;await output(relative,compressed);assets.push(asset);assetBySha.set(row.sourceSha256,asset);
    }
    placements.push({placementId:row.placementId,animationId:row.animationId,assetId:row.assetId,grade:row.grade,lesson:row.lesson,globalPageOrdinal:row.globalPageOrdinal,sourcePath:row.sourcePath,sourceSha256:row.sourceSha256,assetPath:asset.path,sourceStatus:source.status,status:source.status==="verified"?asset.status:source.status});
    if(placements.length%100===0)onProgress({placements:placements.length,assets:assets.length});
  }
  const sum=key=>assets.reduce((n,a)=>n+(a.summary?.[key]??0),0),byStatus={};for(const a of assets)byStatus[a.status]=(byStatus[a.status]??0)+1;
  const riskCounts={};for(const a of assets)for(const kind of new Set(a.risks))riskCounts[kind]=(riskCounts[kind]??0)+1;
  const summary={activePlacements:rows.length,lessons:new Set(rows.map(r=>`${r.grade}/${r.lesson}`)).size,uniqueSourceAssets:assets.length,uniqueSourcePaths:sourceByPath.size,sourcePathsVerified:[...sourceByPath.values()].filter(s=>s.status==="verified").length,assetsByStatus:byStatus,riskAssetCounts:riskCounts,compressedAssetBytes:assets.reduce((n,a)=>n+a.outputBytes,0),uncompressedAssetBytes:assets.reduce((n,a)=>n+a.contentBytes,0),...Object.fromEntries(["fontRecords","textDefinitions","staticTextDefinitions","dynamicFields","textRuns","decodedRuns","unresolvedRuns","timelines","placementInstances","placementEvents","buttonDefinitions","buttonStatePlacements","shapeDefinitions","bitmapDefinitions","unparsedTags"].map(k=>[k,sum(k)]))};
  const generatorInputs=await Promise.all(["scripts/build-lesson-text-source-catalog-v1.mjs","scripts/lib/swf-text-source-catalog.mjs"].map(async relative=>{const bytes=await readFile(path.join(ROOT,relative));return {path:relative,sha256:sha256(bytes),bytes:bytes.length};}));
  const generator={version:"1.0.0",inputs:generatorInputs,fingerprintSha256:sha256(json(generatorInputs)),nodeVersion:process.versions.node,zlibVersion:process.versions.zlib};
  const index={schemaVersion:1,kind:"lesson-text-source-catalog-v1",generator,manifest:{path:MANIFEST,sha256:sha256(manifestBytes)},sourceRoots,artifactPolicy:{purpose:"local-source-build-evidence",webBundleAllowed:false,deploymentUploadAllowed:false,gzip:{level:9,mtime:0}},claimBoundary:{structuralOnly:true,runtimeVisibilityEstablished:false,semanticReadingOrderEstablished:false,modernizationComplete:false,legacyCourseShellsIncluded:false},summary,assets,placements};
  await output(`${OUTPUT}/index.json`,`${JSON.stringify(index,null,2)}\n`);
  return index;
}

if(import.meta.url===pathToFileURL(process.argv[1]??"").href){
  const args=process.argv.slice(2);assert(args.length<=1&&args.every(a=>a==="--check"),"Usage: node scripts/build-lesson-text-source-catalog-v1.mjs [--check]");
  buildLessonTextSourceCatalog({check:args.includes("--check"),onProgress:p=>process.stderr.write(`Text source catalog: ${p.placements}/1751 placements; ${p.assets} assets\n`)}).then(index=>process.stdout.write(`${JSON.stringify(index.summary,null,2)}\n`)).catch(error=>{process.stderr.write(`${error.stack??error}\n`);process.exitCode=1;});
}
