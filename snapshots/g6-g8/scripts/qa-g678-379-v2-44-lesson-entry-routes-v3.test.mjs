import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import test from 'node:test';
import {APPROVED_REGISTRY,APPROVED_ACTIVATION,parse379EntryArgs,build379EntrySelections} from './qa-g678-379-v2-44-lesson-entry-routes-v3.mjs';
import {G678_P042_AUTHORITY,G678_P042_BASE,G678_P042_READABLE,G678_P042_PREDECESSOR,readG678P042FileBinding,
  validateG678P042CompanionAuthority,validateG678P042PhysicalClosure} from '../apps/web/lib/g678-nms-l01-p042-companion-authority.server.ts';
const ROOT=new URL('../',import.meta.url).pathname.replace(/%20/g,' ').replace(/\/$/,'');
const parse=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url)));
async function inputs(){return{
  freeze:await parse('catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.json'),
  fragment:await parse('catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.fragment.json'),
  registry:await parse('packages/demos/private-current-js-registry.json'),catalog:await parse('catalog/g678-shared-catalog.v1.json'),
  activation:await parse('catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.activation.json')};}
test('exact379 registry and actual activation hashes required; no arbitrary run path,URL or stale377 identity',()=>{
  const args=['--run','prepared-test','--activated-registry-sha256',APPROVED_REGISTRY,'--activation-sha256',APPROVED_ACTIVATION];
  assert.deepEqual(parse379EntryArgs(args),{run:'prepared-test'});
  for(const bad of [args.slice(0,4),[...args,'--url','https://example.invalid'],['--run','../old',...args.slice(2)],
    [...args.slice(0,3),'dbb6093d6e36041a99474530c16d76541cfef608fc25a309cdcd8befc0b173c8',...args.slice(4)],
    [...args.slice(0,5),'0'.repeat(64)]])assert.throws(()=>parse379EntryArgs(bad));
});
test('actual379 source-ordered maps produce44 Canvas entries,1903unavailable,NMS12/47 and exactly2complete lessons',async()=>{
  const i=await inputs(),r=build379EntrySelections(i);assert.equal(r.selections.length,44);
  assert.equal(r.selections.reduce((sum,item)=>sum+item.registeredPageCount,0),379);
  assert.equal(r.selections.reduce((sum,item)=>sum+item.unavailablePageCount,0),1903);
  assert.deepEqual(r.completeLessons,['shared-alg001-l09','shared-alg001-l11']);
  const nms=r.selections.find(item=>item.stableLessonKey==='shared-nms002-l01');assert.deepEqual([nms.registeredPageCount,nms.activePageCount],[12,47]);
  assert.equal(nms.orderedMap.find(p=>p.animationId==='shared-nms002-l01-p044').availability,'registered');
  assert.ok(r.selections.every(item=>item.selected.runtime.canvasRenderer));
});
test('the44 selected earliest routes remain the same as retainedV4; addingp044 does not masquerade as visitingp044',async()=>{
  const r=build379EntrySelections(await inputs()),old=await parse('catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v4.json');
  const expected=r.selections.map(item=>old.selectedPages.filter(p=>p.stableLessonKey===item.stableLessonKey).sort((a,b)=>a.globalPageOrdinal-b.globalPageOrdinal)[0].animationId);
  assert.deepEqual(r.selections.map(item=>item.selected.animationId),expected);assert.ok(!expected.includes('shared-nms002-l01-p044'));
});
test('wrong catalog order,sourceidentity,registration count or acceptance flag fails before browserwork',async()=>{
  for(const mutate of [i=>i.freeze.selectedPages.pop(),i=>i.freeze.selectedPages[0].sourceSha256='0'.repeat(64),
    i=>i.catalog.lessons[0].pages.reverse(),i=>i.activation.registrationCount=377,i=>i.activation.acceptanceEffects.audioAccepted=true]){
    const i=await inputs();mutate(i);assert.throws(()=>build379EntrySelections(i));}
});
test('actual p042 helper independently verifies322 canonical source/tool/candidate files without a browser',async()=>{
  const i=await inputs(),authority=validateG678P042CompanionAuthority({authority:readG678P042FileBinding(ROOT,G678_P042_AUTHORITY),
    baseCandidate:readG678P042FileBinding(ROOT,G678_P042_BASE),readableCandidate:readG678P042FileBinding(ROOT,G678_P042_READABLE),
    predecessorFreeze:readG678P042FileBinding(ROOT,G678_P042_PREDECESSOR),freeze:await parse('catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.json')});
  assert.equal(validateG678P042PhysicalClosure(ROOT,authority).length,322);
});
test('help and imports do not start browser; script retains actualloader entry-only and no fakeclock/injection',async()=>{
  const file=new URL('./qa-g678-379-v2-44-lesson-entry-routes-v3.mjs',import.meta.url),source=await readFile(file,'utf8');
  const help=await promisify(execFile)(process.execPath,['--import','tsx',file.pathname.replace(/%20/g,' '),'--help']);assert.match(help.stdout,/After root browser GO/);assert.equal(help.stderr,'');
  assert.match(source,/export async function run379EntryAudit/);assert.match(source,/page\.goto/);assert.match(source,/sourceOrderedMap/);
  assert.match(source,/wholeLessonCompletionAudited:false/);assert.match(source,/fullInstructionalTimelineAudited:false/);
  assert.doesNotMatch(source,/page\.setContent\(|\.clock\.(?:install|runFor)|addScriptTag\(|force:\s*true/);
});
