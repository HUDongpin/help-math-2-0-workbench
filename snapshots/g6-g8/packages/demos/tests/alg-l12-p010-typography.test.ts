import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {p010FigureDescription,p010GraphLabels,p010TextSnapshot} from '../src/alg-l12-p010-typography';
const context=(frame:number)=>({frame,frameDomain:'sprite-96',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0,replay:0});
const block=(frame:number,depth:number)=>p010TextSnapshot(context(frame)).blocks.find(b=>b.id===`sprite-96/depth-${depth}/generation-1`)!;

test('whole-run reveal follows P010 mask bounds and preserves exact prose',()=>{
  assert.equal(block(11,3).visible,false);
  assert.equal(block(12,3).text,'A');
  assert.equal(block(16,3).text,'A');
  assert.equal(block(17,3).text,'A point');
  assert.equal(block(85,13).visible,false);
  assert.equal(block(86,13).text,'length, width');
  assert.equal(block(97,13).text,'length, width, or height.');
  assert.equal(block(173,23).text,'On a coordinate plane, a point is identified by coordinates which an ');
  assert.equal(block(194,31).text,'ordered pair is showing the');
  assert.equal(block(195,31).text,'ordered pair is showing the position.');
});

test('all465 native snapshots fulfill the separately generated exact source suppression rules',()=>{
  const metadata=JSON.parse(readFileSync(new URL('../../../migrations/shared-alg001-l12-p010/typography-v1/runtime-meta.json',import.meta.url),'utf8'));
  const rules=metadata.exactSuppressionInstances as {id:string;firstFrame:number;lastFrameExclusive:number}[];
  assert.equal(rules.length,58);
  for(let frame=1;frame<=465;frame++){
    const s=p010TextSnapshot(context(frame));assert.equal(s.status,'ready');
    assert.equal(s.identity.frame,frame);
    assert.deepEqual(s.suppressedInstances.map(i=>i.id).sort(),rules.filter(r=>frame>=r.firstFrame&&frame<r.lastFrameExclusive).map(r=>r.id).sort());
    assert.deepEqual(p010TextSnapshot({...context(frame),replay:9}).blocks,s.blocks);
  }
});

test('reused coordinate fragments preserve their distinct anchors and independent fades',()=>{
  assert.equal(p010GraphLabels(248).find(l=>l.characterId===50)!.alpha,0);
  assert.equal(p010GraphLabels(266).find(l=>l.characterId===50)!.alpha,1);
  const reused=p010GraphLabels(432).filter(l=>l.characterId===50);
  assert.equal(reused.length,2);assert.notEqual(reused[0].id,reused[1].id);
  assert.notEqual(reused[0].y,reused[1].y);
  assert.equal(reused[0].alpha,1);assert.equal(reused[1].alpha,0);
  assert.equal(p010GraphLabels(438).filter(l=>l.characterId===50)[1].alpha,1);
});

test('all four source callouts retain three separate line baselines and exact mathematical statements',()=>{
  const labels=p010GraphLabels(465);
  assert.equal(new Set(labels.map(l=>l.id)).size,labels.length);
  for(const [id,text]of [[56,'Point A has coordinates of (5,3).'],[70,'Point B has    coordinates of (-4,2).'],[85,'Point C has coordinates of (-3,-5).'],[95,'Point D has coordinates of (5,-3).']]as const){
    const lines=labels.filter(l=>l.characterId===id);assert.equal(lines.length,3);
    assert.equal(new Set(lines.map(l=>l.y)).size,3);assert.equal(lines.map(l=>l.text).join(''),text);
    assert(lines.every(l=>l.callout&&l.alpha===1&&Number.isFinite(l.x)&&Number.isFinite(l.y)));
  }
  assert.equal(labels.filter(l=>l.text==='-').length,10);
});

test('unsupported context blocks both text and suppression',()=>{
  for(const changed of [{frame:0},{frame:466},{frame:1.5},{lang:'es' as const},{rootFrame:1},{frameDomain:'root'},{scenario:'glossary'},{seed:1},{replay:-1},{replay:NaN}]){
    const s=p010TextSnapshot({...context(465),...changed});assert.equal(s.status,'blocked');
    assert.deepEqual(s.blocks,[]);assert.deepEqual(s.suppressedInstances,[]);
  }
});

test('figure description does not announce axes or point answers before source visibility',()=>{
  assert.equal(p010FigureDescription(1),'Coordinate-plane lesson figure.');
  assert.match(p010FigureDescription(12),/with x- and y-axes/);
  assert.doesNotMatch(p010FigureDescription(266),/Point [ABCD] has/);
  assert.match(p010FigureDescription(330),/Point A has coordinates of \(5,3\)\./);
  assert.doesNotMatch(p010FigureDescription(330),/Point [BCD] has/);
  for(const coordinate of ['(5,3).','(-4,2).','(-3,-5).','(5,-3).'])
    assert(p010FigureDescription(465).includes(coordinate));
});
