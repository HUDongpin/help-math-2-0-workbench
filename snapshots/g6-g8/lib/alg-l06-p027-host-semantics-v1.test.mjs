import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readP027CanonicalSource} from './alg-l06-p027-admission-semantics-v1.mjs';
import * as H from './alg-l06-p027-host-semantics-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rawFiles={nativeMainEn:'native-en.json',nativeMainEs:'native-es.json',
 controls:'controls-v1.json',navigation:'navigation-v1.json',
 http:'http-boundary-v1.json',responsive:'responsive-v1.json'};
const raw=()=>Object.fromEntries(Object.entries(rawFiles).map(([key,file])=>
 [key,JSON.parse(fs.readFileSync(path.join(root,H.BROWSER_DIR,file)))]));

test('six actual P027 real-host cases retain source and response semantics',()=>{
 const source=readP027CanonicalSource(root);
 assert.equal(H.validateP027EngineeringRaw(raw(),source,root),true);
});

test('browser evidence rejects autoplay, fabricated glossary and reused cleanup event',()=>{
 const source=readP027CanonicalSource(root),cases=raw();
 cases.nativeMainEs.initial.saRequests=1;
 assert.throws(()=>H.validateP027EngineeringRaw(cases,source,root),
  /no autoplay/);
 cases.nativeMainEs=raw().nativeMainEs;
 cases.controls.glossary[0].iid='invented';
 assert.throws(()=>H.validateP027EngineeringRaw(cases,source,root),
  /source button instance/);
 cases.controls=raw().controls;
 cases.navigation.previous.events=cases.navigation.before.events;
 assert.throws(()=>H.validateP027EngineeringRaw(cases,source,root),
  /newly closed/);
});

test('HTTP evidence rejects a substituted inherited asset and lost no-store',()=>{
 const source=readP027CanonicalSource(root),cases=raw();
 cases.http.requests[4].sha256='0'.repeat(64);
 assert.throws(()=>H.validateP027EngineeringRaw(cases,source,root),
  /exact inherited P026 asset/);
 cases.http=raw().http;
 delete cases.http.requests[2].responseHeaders['cache-control'];
 assert.throws(()=>H.validateP027EngineeringRaw(cases,source,root),
  /asset protection/);
});

test('receipt reader requires byte-pinned raw and stable candidate evidence',t=>{
 const file=path.join(root,H.BROWSER_DIR,'engineering-receipt-v1.json');
 if(!fs.existsSync(file)){t.skip('root engineering receipt pending');return;}
 const source=readP027CanonicalSource(root),
  receipt=JSON.parse(fs.readFileSync(file));
 const engineering=H.validateP027EngineeringReceipt(receipt,root,source);
 assert.equal(engineering.raw.nativeMainEn.status,'passed');
 assert.equal(engineering.candidates.length,2);
 assert(engineering.runtimeBindingPin.path===H.RUNTIME_BINDING);
 const changed=structuredClone(receipt);
 changed.artifacts=changed.artifacts.filter(pin=>
  pin.path!==changed.raw.navigation);
 assert.throws(()=>H.validateP027EngineeringReceipt(changed,root,source),
  /raw navigation is included/);
 const forged=structuredClone(receipt);
 forged.stableRuns.nativeMainEs.sha256='0'.repeat(64);
 assert.throws(()=>H.validateP027EngineeringReceipt(forged,root,source),
  /stable nativeMainEs is included/);
});

test('actual Chrome runtime binding rejects a substituted source packet or PCM',()=>{
 const source=readP027CanonicalSource(root),
  text=fs.readFileSync(path.join(root,H.RUNTIME_BINDING),'utf8'),
  binding=JSON.parse(text.match(/export const P027_CANDIDATE_BINDING = ([\s\S]*?) as const;/)[1]),
  receipt=JSON.parse(fs.readFileSync(path.join(root,H.BROWSER_DIR,
   'engineering-receipt-v1.json'))),
  stable=JSON.parse(fs.readFileSync(path.join(root,
   receipt.stableRuns.nativeMainEn.path))),
  registry=stable.registrySha256;
 assert.equal(H.validateP027RuntimeBinding(binding,source,registry),true);
 const packet=structuredClone(binding);
 packet.packet.sha256='0'.repeat(64);
 assert.throws(()=>H.validateP027RuntimeBinding(packet,source,registry),
  /actual runtime binding/);
 const pcm=structuredClone(binding);
 pcm.browserMain.pcmSha256='0'.repeat(64);
 assert.throws(()=>H.validateP027RuntimeBinding(pcm,source,registry),
  /actual runtime binding/);
});
