import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {RuntimeContext} from '../contract';
import source3 from '../modules/course-g03-l09-rw-003';
import source4 from '../modules/course-g03-l09-rw-004';
import source5 from '../modules/course-g03-l09-rw-005';
import {G3_L9_RW_COMPANION_TITLES} from './generated/g3-l9-rw-companion-titles-v1';
import {G3_L9_RW_FAMILY} from './generated/g3-l9-rw-family-v1';
import {G3L9RwNativeSurface} from './g3-l9-rw-family';
import {G3_L9_RW_KEY_TERMS, G3_L9_RW_KEYTERM_TARGETS, g3L9RwSourceButtonId} from './g3-l9-rw-keyterms';
import {buildG3L9RwBinding, getG3L9RwTeachingState, getG3L9RwSnapshot, RW_ITEM_IDS} from './g3-l9-rw-state';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const sources = [source3, source4, source5];
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const context = (index: number, frame: number, overrides: Partial<RuntimeContext> = {}): RuntimeContext => ({
  frame, frameDomain: G3_L9_RW_FAMILY[index]!.domain, rootFrame: 6, lang: 'en', scenario: 'source-static-frame', seed: 27, replay: 0, ...overrides,
});
const snapshotAt = (index: number, frame: number) => {
  const ctx = context(index, frame), reader = sources[index]!.getFrameState;
  return getG3L9RwSnapshot(G3_L9_RW_FAMILY[index]!, reader, reader(frame, ctx), ctx);
};

for (const [index, config] of G3_L9_RW_FAMILY.entries()) {

  test(`${config.id}: active root6 companion title is source-bound once without offstage duplicate`, async () => {
    const asset=JSON.parse(gunzipSync(await readFile(`${root}catalog/typography-v1/source-catalog/assets/${config.sourceSwfSha256}.json.gz`)).toString());
    const expectedCharacter=[290,333,274][index]!;
    const definition=asset.textDefinitions.find((d:{characterId:number})=>d.characterId===expectedCharacter);
    assert.deepEqual(G3_L9_RW_COMPANION_TITLES[config.id].sourceTextIds,definition.runs.map((r:{sourceTextId:string})=>r.sourceTextId));
    assert.equal(G3_L9_RW_COMPANION_TITLES[config.id].text,definition.runs.map((r:{text:string})=>r.text).join('').trim());
    const binding=buildG3L9RwBinding(config),prior=binding.blocks.filter(b=>b.id!=='root-title');assert.equal(prior.length,23);
    assert.deepEqual(prior.map(b=>b.readingOrder),[1,2,3,4,5,6,7,8,9,10,11,12,13,14,21,22,23,24,25,26,27,28,41]);
    for(const frame of [1,2,config.frameCount])for(const replay of [0,1]){
      const ctx=context(index,frame,{replay}),reader=sources[index]!.getFrameState,snapshot=getG3L9RwSnapshot(config,reader,reader(frame,ctx),ctx);
      const titles=snapshot.blocks.filter(b=>b.id==='root-title');assert.equal(titles.length,1);assert.equal(titles[0]!.text,'Geometry: Your World');assert.equal(titles[0]!.visible,true);
      const html=renderToStaticMarkup(<G3L9RwNativeSurface config={config} snapshot={snapshot} figure={<div/>}/>);
      assert.equal((html.match(/data-lesson-text-block="root-title"/g)??[]).length,1);assert(html.indexOf('Geometry: Your World')<html.indexOf('Geometry Around Us'));
    }
  });


  test(`${config.id}: shared heading token preserves four source headings and interactive keyterm children`, async () => {
    const snapshot=snapshotAt(index,1);
    const asset=JSON.parse(gunzipSync(await readFile(`${root}catalog/typography-v1/source-catalog/assets/${config.sourceSwfSha256}.json.gz`)).toString());
    const sourceRuns=new Map<string,string>(asset.textDefinitions.flatMap((d:{runs:Array<{sourceTextId:string;text:string}>})=>d.runs.map(r=>[r.sourceTextId,r.text])));
    const expected=buildG3L9RwBinding(config).blocks.filter(block=>block.role==='heading');
    assert.equal(expected.length,4);
    for(const interactive of [false,true]){
      const html=renderToStaticMarkup(<G3L9RwNativeSurface config={config} snapshot={snapshot} figure={<div data-test-scene/>}
        onLessonHostRequest={interactive?()=>{}:undefined}/>);
      const headings=[...html.matchAll(/<h3\b([^>]*)>([\s\S]*?)<\/h3>/g)];assert.equal(headings.length,4);
      for(const [i,block]of expected.entries()){
        const [,attrs,content]=headings[i]!;
        const classes=/class="([^"]*)"/.exec(attrs)?.[1].split(/\s+/)??[];
        assert(classes.includes('lesson-text-presentation__block'),'Missing shared base text class');
        assert(classes.includes('lesson-text-presentation__block--heading'),'Missing shared heading class');
        assert(attrs.includes(`id="${config.id}-${block.id}"`));assert(attrs.includes(`data-lesson-text-block="${block.id}"`));
        const exact=block.sourceTextIds.map(id=>sourceRuns.get(id)).join('').replace(/\s+:/g,':').trim();
        assert.equal(content.replace(/<[^>]+>/g,''),exact,'Source heading changed');
        assert.equal((content.match(/<button\b/g)??[]).length,interactive?1:0);
        if(interactive){const target=G3_L9_RW_KEYTERM_TARGETS[block.id as keyof typeof G3_L9_RW_KEYTERM_TARGETS];assert(content.includes(`data-keyterm-entry-id="${target.entryId}"`));assert(content.includes(`data-source-button-id="${g3L9RwSourceButtonId(config.id,target.offset)}"`));}
      }
    }
  });

  test(`${config.id}: native words, glyph decision, adapter and exact source bindings remain hash-bound`, async () => {
    const assetBytes = gunzipSync(await readFile(`${root}catalog/typography-v1/source-catalog/assets/${config.sourceSwfSha256}.json.gz`));
    assert.equal(hash(assetBytes), config.sourceCatalogContentSha256);
    const asset = JSON.parse(assetBytes.toString('utf8'));
    const textIds = new Set<string>(asset.textDefinitions.flatMap((d: {sourceTextId: string; runs: Array<{sourceTextId: string}>}) => [d.sourceTextId, ...d.runs.map(r => r.sourceTextId)]));
    const shapeIds = new Set(asset.shapeDefinitions.map((d: {characterId: number}) => d.characterId));
    const binding = buildG3L9RwBinding(config);
    for (const block of binding.blocks) {
      for (const id of block.sourceTextIds) assert.ok(textIds.has(id), id);
      for (const id of block.sourceShapeIds ?? []) assert.ok(shapeIds.has(id), String(id));
    }
    for (const text of config.texts) {
      const source = asset.textDefinitions.find((d: {characterId: number}) => d.characterId === text.characterId);
      assert.equal(text.text, source.runs.map((r: {text: string}) => r.text).join('').replace(/\s+:/g, ':').trim());
    }
    const tick = asset.textDefinitions.find((d: {characterId: number}) => d.characterId === config.native.tick);
    assert.equal(tick.sourceTagSha256, config.sourceRoles.tick.sourceTagSha256);
    assert.equal(tick.runs[0].glyphs[0].code, 80);
    assert.equal(tick.runs[0].glyphs[0].status, 'symbol-font-semantic-mapping-unresolved');
    assert.equal(config.sourceRoles.tick.semanticValue, '✓');
    assert.equal(hash(await readFile(`${root}apps/web/public${config.adapter.url}`)), config.adapter.sha256);
  });

  test(`${config.id}: every local frame uses exact active source instances and the source check intervals`, async () => {
    const manifest = JSON.parse(await readFile(`${root}work/typography-v1/source-audit/g3-l9-rw-family/rw00${index + 3}/scene-adapter-manifest.json`, 'utf8'));
    assert.equal(manifest.plans.length, config.frameCount);
    for (const plan of manifest.plans) {
      const teaching = getG3L9RwTeachingState(config, plan.frame);
      assert.deepEqual(teaching.suppressedInstances.map(i => i.id).sort(), [...plan.excludedInstanceIds].sort());
      const expected = [...new Set(config.checks.filter(c => plan.frame >= c.firstFrame && plan.frame < c.lastFrameExclusive).map(c => c.id))];
      assert.deepEqual(teaching.checked, expected);
      for (const instance of teaching.suppressedInstances) {
        assert.equal(instance.path.length, 1);
        const p = instance.path[0]!;
        assert.equal(instance.id, `${p.timelineId}/depth-${p.depth}/generation-${p.generation}`);
      }
    }
    assert.equal(manifest.claimBoundary.teachingClockAdded, false);
    assert.equal(manifest.claimBoundary.originalAssetChanged, false);
    assert.equal(manifest.claimBoundary.originalRuntimeEvidence, false);
  });

  test(`${config.id}: native HTML contains all four source groups, eight labels and the source letter H`, () => {
    const snapshot = snapshotAt(index, 1);
    assert.equal(snapshot.status, 'ready');
    const html = renderToStaticMarkup(<G3L9RwNativeSurface config={config} snapshot={snapshot} figure={<div data-test-scene/>}/>);
    assert.equal((html.match(/class="rw-modern__group"/g) ?? []).length, 4);
    assert.equal((html.match(/data-rw-item=/g) ?? []).length, 8);
    assert.equal((html.match(/<button\b/g) ?? []).length, 0);
    assert.ok(!/<(?:img|canvas|audio|video)\b/.test(html));
    assert.match(html, /data-lesson-text-block="symmetry-letter">H</);
    assert.ok(!html.includes('>P<'));
    for (const id of RW_ITEM_IDS) assert.ok(html.includes(`data-lesson-text-block="${id}"`));
    const rhombus = /points="48,12 108,12 72,60 12,60"/.exec(html);
    assert.ok(rhombus, 'native rhombus uses four equal 60-unit sides (36/48/60 triangle)');
  });

  test(`${config.id}: caller state is consumed and source/locale/domain mismatches remain blocked`, () => {
    const ctx = context(index, 1), reader = sources[index]!.getFrameState, state = reader(1, ctx);
    for (const bad of [context(index, 2), context(index, 1, {lang: 'es'}), context(index, 1, {rootFrame: 7}),
      context(index, 1, {frameDomain: 'root'}), context(index, 1, {seed: 28})]) {
      const snapshot = getG3L9RwSnapshot(config, reader, state, bad);
      assert.equal(snapshot.status, 'blocked'); assert.deepEqual(snapshot.blocks, []); assert.deepEqual(snapshot.suppressedInstances, []);
    }
    const replay = getG3L9RwSnapshot(config, reader, state, context(index, 1, {replay: 9}));
    assert.equal(replay.status, 'ready'); assert.equal(replay.identity.replay, 9);
  });
}

test('same Wingdings character at different depths maps to two distinct native checklist checks', () => {
  const config = G3_L9_RW_FAMILY[0], before = getG3L9RwTeachingState(config, 789), after = getG3L9RwTeachingState(config, 790);
  assert.deepEqual(before.checked, ['trapezoid']);
  assert.deepEqual(after.checked, ['trapezoid', 'rhombus']);
  const ticks = after.suppressedInstances.filter(i => i.path[0]!.characterId === 162);
  assert.equal(ticks.length, 2); assert.equal(new Set(ticks.map(i => i.id)).size, 2);
  assert.deepEqual(getG3L9RwTeachingState(config, 812).checked, []);
  assert.deepEqual(getG3L9RwTeachingState(config, 1).checked, []);
});

test('RW003 retains the real-world trapezoid outline and replaces only its separate checklist outline', () => {
  const config = G3_L9_RW_FAMILY[0];
  assert.ok(!config.exclusions.some(i => Number(i.path[0]!.characterId) === 124));
  assert.ok(config.exclusions.some(i => i.path[0]!.characterId === 138));
  assert.deepEqual(getG3L9RwTeachingState(config, 448).emphasized, ['trapezoid']);
  assert.deepEqual(getG3L9RwTeachingState(config, 449).emphasized, []);
});

test('RW005 source Move updates can move an existing glyph to another checklist row', async () => {
  const config = G3_L9_RW_FAMILY[2];
  const asset = JSON.parse(gunzipSync(await readFile(`${root}catalog/typography-v1/source-catalog/assets/${config.sourceSwfSha256}.json.gz`)).toString('utf8'));
  const timeline = asset.timelines.find((t: {timelineId: string}) => t.timelineId === config.domain);
  const moved = timeline.events.filter((event: {kind: string; depth: number; frame: number; matrix?: number[]}) =>
    event.kind === 'place' && event.depth === 138 && event.frame <= 992 && event.matrix).at(-1);
  assert.equal(moved.frame, 992); assert.equal(moved.matrix[5], 1194);
  assert.equal(getG3L9RwTeachingState(config, 991).checked.includes('rotational-symmetry'), false);
  assert.equal(getG3L9RwTeachingState(config, 992).checked.includes('rotational-symmetry'), true);
  assert.equal(getG3L9RwTeachingState(config, 992).checked.length, 8);
  assert.deepEqual(getG3L9RwTeachingState(config, 1007).checked, []);
});

test('all 36 native glossary targets bind to the exported source action and the exact canonical index entry', async () => {
  const index = JSON.parse(await readFile(`${root}apps/web/public/generated/g4-grade-wide-keyterms-en.json`, 'utf8'));
  const actions = JSON.parse(await readFile(`${root}work/typography-v1/source-audit/g3-l9-rw-family/glossary-actions.json`, 'utf8')).rows;
  assert.equal(index.source.assetId, G3_L9_RW_KEY_TERMS.sourceAssetId);
  assert.equal(index.source.sha256, G3_L9_RW_KEY_TERMS.sourceSha256);
  assert.equal(G3_L9_RW_KEY_TERMS.entryIds.length, 12);
  for (const config of G3_L9_RW_FAMILY) {
    for (const target of Object.values(G3_L9_RW_KEYTERM_TARGETS)) {
      const action = actions.find((a: {animationId: string; sourceButtonId: number}) =>
        a.animationId === config.animationId && a.sourceButtonId === g3L9RwSourceButtonId(config.id, target.offset));
      assert.equal(action.keyAttribute, target.sourceKey); assert.equal(action.sourceStopsTimeline, true);
      assert.equal(action.sourceDoHyperLinks, true);
      const entry = index.entries.find((e: {id: string}) => e.id === target.entryId);
      assert.equal(entry.titles.en.toLowerCase(), target.sourceKey.toLowerCase());
    }
    const snapshot = snapshotAt(G3_L9_RW_FAMILY.indexOf(config), 1);
    const html = renderToStaticMarkup(<G3L9RwNativeSurface config={config} snapshot={snapshot} figure={<div/>} onLessonHostRequest={() => {}}/>);
    assert.equal((html.match(/<button\b/g) ?? []).length, 12);
    assert.equal((html.match(/data-source-button-id=/g) ?? []).length, 12);
  }
});

test('shared heading token CSS remains authoritative over RW local heading rules',async()=>{
 const css=await readFile(`${root}apps/web/app/lesson-typography.css`,'utf8');
 const heading=/\.lesson-text-presentation__block--heading\s*\{([^}]+)\}/.exec(css)?.[1]??'';
 assert.match(heading,/font-family:\s*var\(--lesson-text-font-heading\)/);
 assert.match(heading,/font-size:\s*clamp\(1\.375rem,\s*1\.25rem \+ 0\.5cqi,\s*1\.625rem\)/);
 assert.match(heading,/line-height:\s*1\.3/);assert.match(heading,/font-weight:\s*500/);
 const html=renderToStaticMarkup(<G3L9RwNativeSurface config={G3_L9_RW_FAMILY[0]!} snapshot={snapshotAt(0,1)} figure={<div/>}/>);
 const local=/<style>([\s\S]*?)<\/style>/.exec(html)?.[1]??'';
 for(const match of local.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  if(match[1].split(',').some(selector=>/\bh3\b/.test(selector)))assert.doesNotMatch(match[2],/(?:font(?:-[a-z-]+)?|line-height)\s*:/,'Local h3 selector outranks the shared role class');
 }
});
