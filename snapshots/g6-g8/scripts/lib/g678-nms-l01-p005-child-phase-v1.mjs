import assert from 'node:assert/strict';

/** Preserve the17-frame grandchild across its14-frame parent's loops.
 * Only the source148/97 ->129/1 ->104 lifetime is admitted here. */
export function normalizeNmsL1P005NestedFrames(html) {
  let source=html.replace(/\r\n?/gu,'\n');
  const parentHeader='function sprite129(ctx,ctrans,frame,ratio,time){';
  const start=source.indexOf(parentHeader),end=source.indexOf('\n}',start)+2;
  assert(start>=0&&end>start&&source.indexOf(parentHeader,start+1)<0,'one parent129 definition');
  let parent=source.slice(start,end);
  assert(parent.includes('var frame_cnt = 14;')&&parent.includes('frame = frame % frame_cnt;'));
  let grandchildCalls=0;
  parent=parent.replace(/(place\("sprite104",[^\n]+,1,)\((\d+)\+time\)%17(,0,time\);)/gu,(_,before,phase,after)=>{
    assert.equal(Number(phase),grandchildCalls++);return `${before}independentFrame%17${after}`;
  });
  assert.equal(grandchildCalls,14);
  parent=parent.replace(parentHeader,`${parentHeader}\n\tvar independentFrame = frame;`);
  source=source.slice(0,start)+parent+source.slice(end);
  const mainStart=source.indexOf('function sprite148(ctx,ctrans,frame,ratio,time){'),mainEnd=source.indexOf('\n}',mainStart)+2;
  assert(mainStart>start&&mainEnd>mainStart,'source main148 follows nested definitions');
  let main=source.slice(mainStart,mainEnd),parentCalls=0;
  main=main.replace(/(place\("sprite129",[^\n]+,1,)\((\d+)\+time\)%14(,75,time\);)/gu,(_,before,phase,after)=>{
    assert.equal(Number(phase),parentCalls%14);parentCalls++;return `${before}(frame-75+time)${after}`;
  });
  assert.equal(parentCalls,144);
  return source.slice(0,mainStart)+main+source.slice(mainEnd);
}
