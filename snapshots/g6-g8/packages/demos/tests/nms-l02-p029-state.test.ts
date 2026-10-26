import assert from 'node:assert/strict';
import test from 'node:test';
import {getNmsL2P029FrameState as state,p029CanOpenTerm,p029PresentationTeaching,p029FrameAtMilliseconds,p029SourceFrameAtMilliseconds,P029_SHADED_CELLS} from '../src/nms-l02-p029-timeline-v1';
const context={lang:'en' as const,seed:0};
test('P029 distinct root and main domains reject invalid frame/identity input',()=>{
  assert.equal(state(5,{...context,frameDomain:'root'}).mainFrame,null);
  assert.equal(state(6,{...context,frameDomain:'root'}).mainFrame,1);
  assert.equal(state(10,{...context,frameDomain:'root'}).mainFrame,5);
  assert.equal(state(383,context).rootFrame,6);
  for(const frame of[0,-1,1.5,384,NaN,Infinity])assert.throws(()=>state(frame,context));
  for(const frameDomain of['sprite-29','49','sprite-049','__proto__'])assert.throws(()=>state(1,{...context,frameDomain}));
  assert.throws(()=>state(11,{...context,frameDomain:'root'}));assert.throws(()=>state(1,{...context,rootFrame:1}));
  for(const seed of[-1,1.5,4294967296,NaN])assert.throws(()=>state(1,{...context,seed}));
  assert.throws(()=>state(1,{...context,replay:-1}));
  assert.equal(p029FrameAtMilliseconds(383/12*1000),383);assert.equal(p029SourceFrameAtMilliseconds(383/12*1000),1);
});
test('P029 source base chart, title fade and glossary eligibility retain their separate timings',()=>{
  assert.equal(state(2,context).teaching.tableAlpha,0);assert.equal(state(3,context).teaching.tableAlpha,.16796875);assert.equal(state(8,context).teaching.tableAlpha,1);
  assert.equal(state(47,context).teaching.placeValueAlpha,0);assert.equal(state(48,context).teaching.placeValueAlpha,.19921875);assert.equal(state(52,context).teaching.placeValueAlpha,1);
  for(const id of['ones-group','decimal']){assert.equal(p029CanOpenTerm(state(2,context),id),false);assert.equal(p029CanOpenTerm(state(3,context),id),true);}
  assert.equal(p029CanOpenTerm(state(47,context),'place-value'),false);assert.equal(p029CanOpenTerm(state(48,context),'place-value'),true);
  assert.equal(p029CanOpenTerm(state(383,context),'__proto__'),false);assert.equal(p029CanOpenTerm(state(10,{...context,frameDomain:'root'}),'decimal'),false);
});
test('P029 counts the source fifteen red cells in the authored order',()=>{
  assert.deepEqual(P029_SHADED_CELLS,Array.from({length:10},(_,r)=>[[r,0],...(r<5?[[r,1]]:[])]).flat());
  const sequence:number[][]=[];
  for(let f=1;f<=383;f++){
    const s=state(f,context),cell=s.teaching.highlightCell;
    assert(Object.isFrozen(s)&&Object.isFrozen(s.teaching));
    if(cell){assert(f>=132&&f<=177);assert(P029_SHADED_CELLS.some(c=>c[0]===cell[0]&&c[1]===cell[1]));if(JSON.stringify(sequence.at(-1))!==JSON.stringify(cell))sequence.push([...cell]);}
  }
  assert.deepEqual(sequence,[...Array.from({length:10},(_,i)=>[9-i,0]),...Array.from({length:5},(_,i)=>[i,1])]);
  assert.deepEqual(state(132,context).teaching.highlightCell,[9,0]);assert.equal(state(133,context).teaching.highlightCell,null);assert.deepEqual(p029PresentationTeaching(state(133,context),true).highlightCell,[9,0]);
  assert.deepEqual(state(159,context).teaching.highlightCell,[0,0]);assert.deepEqual(state(164,context).teaching.highlightCell,[0,1]);assert.deepEqual(state(177,context).teaching.highlightCell,[4,1]);assert.equal(p029PresentationTeaching(state(178,context),true).highlightCell,null);
});
test('P029 emphasis follows exact source instances, including reused Ones text',()=>{
  const windows:[number,number,string[]][]=[
    [214,221,['ones-value']],[222,240,['ones-label','ones-value']],
    [250,264,['decimal-point-label','decimal-point-value']],[270,278,['tenths-value']],
    [279,292,['tenths-label','tenths-value']],[301,308,['hundredths-value']],
    [309,327,['hundredths-label','hundredths-value']],[338,356,['tenths-label','tenths-value']],
    [357,380,['hundredths-label','hundredths-value','tenths-label','tenths-value']],
  ];
  for(let f=1;f<=383;f++)for(const lang of['en','es'] as const){
    const s=state(f,{...context,lang,seed:4294967295,replay:3}),window=windows.find(([a,b])=>f>=a&&f<=b);
    assert.deepEqual(s.teaching.emphasisTargets,window?.[2]??[]);
    assert.equal(s.teaching.placeValueBlink,[187,189,191,193,195].includes(f));
    assert.equal(p029PresentationTeaching(s,true).placeValueBlink,f>=187&&f<=195);
    assert.equal(s.replay,3);
  }
  assert.deepEqual(state(383,context).teaching.emphasisTargets,[]);
});
