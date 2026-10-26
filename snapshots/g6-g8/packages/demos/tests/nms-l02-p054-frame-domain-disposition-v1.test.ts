import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const file=new URL('../../../migrations/shared-nms002-l02-p054/audit/frame-domain-disposition.json',import.meta.url);
const script=new URL('../../../scripts/build-nms-l02-p054-frame-domain-disposition-v1.mjs',import.meta.url);
const bytes=readFileSync(file),value=JSON.parse(bytes.toString('utf8')) as {
 animationId:string;totalDefinedSpriteCount:number;
 staticPlacementGraphDomainCount:number;outsideStaticPlacementGraphCount:number;
 domains:{frameDomainId:string;sourceCharacterId:number|null;sourceFrames:number;
  placementSites:{parentFrameDomainId:string;sourceFrame:number;depth:number}[];
  sourceRole:string;disposition:string;runtimeReachabilityAccepted:boolean;
  originalNaturalTraceAccepted:boolean}[];
 outsideStaticPlacementGraph:{frameDomainId:string;sourceCharacterId:number;
  dynamicOrButtonStateReachability:string;disposition:string}[];
 status:string;limitations:string[];originalRuntimeAccepted:boolean;strictComplete:boolean;
};
const sha=(bytes: Buffer)=>createHash('sha256').update(bytes).digest('hex');
const domain=(id:number)=>value.domains.find(item=>item.sourceCharacterId===id);

test('P054 disposition enumerates every sprite without turning static graph into runtime proof',()=>{
 assert.equal(sha(bytes),'d90afecdd3893c150f733585490afa8172a7d064879505919d5b3a68c119cc21');
 assert.equal(value.animationId,'shared-nms002-l02-p054');
 assert.equal(value.totalDefinedSpriteCount,128);
 assert.equal(value.staticPlacementGraphDomainCount,66);
 assert.equal(value.domains.length,66);
 assert.equal(value.outsideStaticPlacementGraphCount,63);
 assert.equal(value.outsideStaticPlacementGraph.length,63);
 const ids=[...value.domains,...value.outsideStaticPlacementGraph]
  .map(item=>item.sourceCharacterId).filter((id):id is number=>id!==null);
 assert.equal(new Set(ids).size,128);
 assert.equal(value.domains[0]?.frameDomainId,'root');
 assert.equal(value.domains[0]?.sourceFrames,10);
 assert.ok(value.domains.every(item=>item.disposition==='unresolved'&&
  !item.runtimeReachabilityAccepted&&!item.originalNaturalTraceAccepted));
 assert.ok(value.outsideStaticPlacementGraph.every(item=>item.disposition==='unresolved'&&
  item.dynamicOrButtonStateReachability==='unresolved'));
 assert.equal(value.originalRuntimeAccepted,false);
 assert.equal(value.strictComplete,false);
});

test('important game domains retain their exact static parent/frame evidence',()=>{
 assert.deepEqual(domain(731)?.placementSites,
  [{parentFrameDomainId:'root',sourceFrame:6,depth:3,sourceInstanceName:''}]);
 assert.deepEqual(domain(194)?.placementSites.map(item=>item.sourceFrame),[2,4]);
 assert.deepEqual(domain(208)?.placementSites.map(item=>item.sourceFrame),[2,4]);
 assert.deepEqual(domain(648)?.placementSites.map(item=>item.sourceFrame),[3]);
 assert.deepEqual(domain(729)?.placementSites.map(item=>item.sourceFrame),[5]);
 assert.equal(domain(648)?.sourceRole,'level-1-result-content');
 assert.equal(domain(729)?.sourceRole,'level-2-result-content');
 assert.equal(value.status,'source-static-enumeration-with-unresolved-runtime-dispositions');
 assert.ok(value.limitations.some(item=>item.includes('Button-state')));
});

test('frame-domain generator refuses to overwrite the frozen audit',()=>{
 const before=sha(readFileSync(file));
 const result=spawnSync(process.execPath,[fileURLToPath(script),'--write'],{encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/EEXIST/);
 assert.equal(sha(readFileSync(file)),before);
});
