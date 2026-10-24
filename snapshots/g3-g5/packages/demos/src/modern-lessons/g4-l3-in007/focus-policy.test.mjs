import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';
import{getFocusPlan,nearestScroll,shouldApplyFocus}from'./focus-policy.mjs';
import{getNativeState}from'./state.mjs';
const c=JSON.parse(await readFile(new URL('./source.generated.json',import.meta.url))),plan=(f,r=0)=>getFocusPlan(getNativeState(c,f),r);
assert.equal(plan(256),null);assert.equal(plan(257).target,12);
for(const [f,target]of[[280,9],[290,6],[300,3],[310,0],[383,-3],[429,-6],[483,-9]])assert.equal(plan(f).target,target);
for(const [a,b]of[[257,279],[280,285],[286,289],[290,295],[296,299],[300,305],[306,309],[310,315],[316,382],[383,388],[389,428],[429,434],[435,482],[483,488],[489,555]])for(let f=a+1;f<=b;f++)assert.equal(shouldApplyFocus(plan(f-1).key,plan(f).key),false);
for(const frame of[286,296,306,316,389,435,489]){assert.equal(plan(frame-1).includeMovingLabel,false);assert.equal(plan(frame).includeMovingLabel,true);assert(shouldApplyFocus(plan(frame-1).key,plan(frame).key));}
assert.equal(plan(395).key,plan(396).key);assert.equal(plan(451).key,plan(452).key);assert.equal(plan(506).key,plan(507).key);
assert(shouldApplyFocus(plan(555).key,plan(257,1).key));assert(shouldApplyFocus(plan(395).key,plan(395).key,'resize'));assert(shouldApplyFocus(plan(395).key,plan(395).key,'fonts'));
const p={current:100,maxScroll:1600,viewportWidth:360,margin:18};
assert.deepEqual(nearestScroll({...p,rects:[{left:30,right:90},{left:120,right:180}]}),{left:100,status:'already-visible'});
assert.deepEqual(nearestScroll({...p,rects:[{left:-12,right:50}]}),{left:70,status:'scroll-nearest'});
assert.deepEqual(nearestScroll({...p,rects:[{left:310,right:380}]}),{left:138,status:'scroll-nearest'});
// A visible center never licenses clipping the minus or the last digit.
assert.equal(nearestScroll({...p,rects:[{left:2,right:90}]}).left,84);
assert.equal(nearestScroll({...p,rects:[{left:40,right:400}]}).status,'ink-span-too-wide');
assert.equal(nearestScroll({...p,current:0,rects:[{left:-10,right:40}]}).status,'extent-limited');
// 200% root font: both full minus glyph and digits plus explicit18px margin.
assert.equal(nearestScroll({...p,rects:[{left:280,right:380}]}).left,138);
console.log('PASS semantic target/replay boundaries; stable phases preserve manual pan; full ink/margins/zoom-sized spans');
