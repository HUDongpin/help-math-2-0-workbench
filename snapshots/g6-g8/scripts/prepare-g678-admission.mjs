#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile, readPin, readJsonPin, uniquePins, verifyAdmission, REGISTRY, DISPATCH} from '../lib/g678-admission-proof.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const STAGE = 'output/g678-admission-decoupling-20260927';
const DEST = 'catalog/g678-admission-v1';
const CONTRACT = 'source-native-current-js-v1';
const ROUTES = ['apps/web/lib/learning-lesson-availability.server.ts',
  ...['006','009','010'].map(n=>`apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p${n}/page.tsx`)];
// This is the independently executed old formal-reader baseline, before routing edits.
const BASELINE = {path:`${STAGE}/legacy-baseline.json`,bytes:0,
  sha256:'e8577fabf2bf021fe03d779b0d643381553c1e9df7f7728fe1cda9eab098fb95'};
function write(relative,value) {
  fs.mkdirSync(path.dirname(path.join(ROOT,relative)),{recursive:true});
  fs.writeFileSync(path.join(ROOT,relative),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
  return pinFile(ROOT,relative);
}
export function stageLegacyInputs() {
  const pin=pinFile(ROOT,BASELINE.path); assert.equal(pin.sha256,BASELINE.sha256,'reviewed baseline');
  const baseline=readJsonPin(ROOT,pin), registry=JSON.parse(fs.readFileSync(path.join(ROOT,REGISTRY),'utf8'));
  const pages=baseline.pages.map(({id,packet})=>{
    const bPath=`catalog/typography-v1/g678-page-bindings/${id}.json`, cPath=`catalog/typography-v1/g678-checks/${id}.json`;
    const binding=JSON.parse(fs.readFileSync(path.join(ROOT,bPath),'utf8'));
    const check=JSON.parse(fs.readFileSync(path.join(ROOT,cPath),'utf8'));
    const files=uniquePins([...packet.integrity.files,...Object.values(packet.entry.artifacts),packet.freezeManifest,
      ...binding.implementation.files,...check.artifacts,pinFile(ROOT,bPath),pinFile(ROOT,cPath)]);
    for(const p of files) readPin(ROOT,p);
    const external=[packet.source,packet.sourceXml,packet.optionalSpanishAudio.source].map(pin=>({root:packet.sourceRoot,pin}));
    // Keep the source-only shell evidence reads, independently of live UI flags.
    const externalPins=value=>{
      if(!value || typeof value!=='object')return;
      if(typeof value.path==='string' && path.isAbsolute(value.path) && /^[a-f0-9]{64}$/.test(value.sha256) && Number.isInteger(value.bytes))
        external.push({root:path.dirname(value.path),pin:{path:path.basename(value.path),bytes:value.bytes,sha256:value.sha256}});
      else Object.values(value).forEach(externalPins);
    };
    for(const p of Object.values(packet.optionalSpanishAudio.sourceHostProof??{})) if(p.path.endsWith(".json")) externalPins(readJsonPin(ROOT,p));
    for(const item of external) readPin(item.root,item.pin);
    const registration=registry.calibrations.find(c=>c.calibrationId===packet.calibrationId);
    assert(registration && registration.entries.length===1 && registration.entries[0].key===id,'one reviewed page');
    return {animationId:id,packet,registration,legacyInputs:files,external};
  });
  // Preserve the old route bytes once; evidence dates and old packages stay intact.
  const historicalRoutes=ROUTES.map(file=>{
    const pin=pinFile(ROOT,file), copy=`${STAGE}/before/${file}`;
    fs.mkdirSync(path.dirname(path.join(ROOT,copy)),{recursive:true});
    fs.writeFileSync(path.join(ROOT,copy),readPin(ROOT,pin),{flag:'wx'});
    return {original:pin,snapshot:pinFile(ROOT,copy)};
  });
  return write(`${STAGE}/staged-inputs.json`,{schemaVersion:1,baseline:pin,pages,historicalRoutes});
}

export function buildAdmission(stagedPin, hostInputs) {
  const stage=readJsonPin(ROOT,stagedPin); readPin(ROOT,stage.baseline);
  const occurrences=new Map();
  for(const page of stage.pages) for(const pin of page.legacyInputs) occurrences.set(pin.path,(occurrences.get(pin.path)??0)+1);
  const shared=uniquePins(stage.pages.flatMap(p=>p.legacyInputs).filter(p=>!DISPATCH.includes(p.path) && !ROUTES.includes(p.path) && occurrences.get(p.path)>1));
  const hostFiles=uniquePins([...shared,...hostInputs.map(p=>pinFile(ROOT,p)),...ROUTES.map(p=>pinFile(ROOT,p)),
    stagedPin,stage.baseline,...stage.historicalRoutes.map(p=>p.snapshot)]);
  const hostPaths=new Set(hostFiles.map(p=>p.path));
  const pages=stage.pages.map(page=>{
    const proof={schemaVersion:1,kind:'g678-page-proof-v1',hostContract:CONTRACT,...page,
      files:page.legacyInputs.filter(p=>!DISPATCH.includes(p.path) && !hostPaths.has(p.path))};
    const proofPin=write(`${DEST}/${page.animationId}.json`,proof);
    return {animationId:page.animationId,proof:proofPin};
  });
  const host=write(`${DEST}/host-v1.json`,{schemaVersion:1,kind:'g678-admission-host-v1',contract:CONTRACT,
    files:hostFiles,replacedRoutes:ROUTES,historicalRoutes:stage.historicalRoutes});
  const index=write(`${DEST}/index.json`,{schemaVersion:1,kind:'g678-admission-index-v1',host,pages});
  // Use the exact serialized product and the real reader, never a mirrored fixture.
  const accepted=verifyAdmission(ROOT,index);
  return {index,pageCount:Object.keys(accepted.packets).length,registrySha256:accepted.registrySha256};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv[2]==='stage') console.log(JSON.stringify(stageLegacyInputs()));
  else if(process.argv[2]==='build') {
    const result=buildAdmission(pinFile(ROOT,`${STAGE}/staged-inputs.json`),[
      'lib/g678-admission-proof.mjs','scripts/prepare-g678-admission.mjs',
      'packages/demos/scripts/generate-registry.mjs','scripts/private-current-js-registry.mjs',
      'apps/web/lib/g678-split-admission.server.ts',
    ]);
    console.log(JSON.stringify(result));
  } else throw Error('Use stage (before edits) or build (exclusive output; no historical overwrite).');
}
