import assert from 'node:assert/strict';
import test from 'node:test';
import React, {act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {G4L3In006QuizPresentation} from './quiz';
import {
  createCourseG04L03In006NumberLineJumpState as create,
  reduceCourseG04L03In006NumberLineJumpInteraction as reduce,
  COURSE_G04_L03_IN_006_INSTRUCTION,
  type CourseG04L03In006NumberLineJumpState as State,
  type CourseG04L03In006NumberLineJumpAction as Action,
  type CourseG04L03In006JumpMagnitude as Magnitude,
} from '../../timelines/course-g04-l03-in-006-number-line-jump-interaction';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const doc=(state:State,interactive=true)=>new JSDOM(renderToStaticMarkup(<G4L3In006QuizPresentation interaction={state} interactive={interactive} selectedMagnitude={2} onSelect={()=>{}} onAction={()=>{}}/>)).window.document as Document;
const button=(document:Document,id:string)=>document.querySelector(`[data-in006-focus-control="${id}"]`) as HTMLButtonElement;

test('preserved reducer hash remains byte-identical',async()=>{
  const bytes=await readFile(new URL('../../timelines/course-g04-l03-in-006-number-line-jump-interaction.ts',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'c20803c992118ae3faea9954737b76dee63e95f87521b8112013c80859545239');
});

test('all eight question paths retain exact equation, jump geometry and feedback gates',()=>{
  const paths:Magnitude[][]=[[2,1],[5,2],[5,5,1],[5,4],[4],[5,1],[5,5,4],[5,2]];
  for(let seed=0;seed<8;seed++){
    let state=create(seed);const direction=state.target<state.start?-1:1;
    let document=doc(state);
    assert.equal(document.querySelector('[data-lesson-text-block="instruction"]')?.textContent,COURSE_G04_L03_IN_006_INSTRUCTION);
    assert.equal(button(document,'reverse').disabled,true);assert.equal(button(document,'new-number').disabled,true);
    for(const magnitude of paths[seed]!){
      state=reduce(state,{type:'place',magnitude});
      if(direction<0)state=reduce(state,{type:'reverse-last'});
      document=doc(state);
      assert.equal(document.querySelector('[data-lesson-text-block="equation"]')?.textContent,state.equation);
      const arcs=[...document.querySelectorAll('[data-jump-id]')];
      assert.deepEqual(arcs.map(arc=>[Number(arc.getAttribute('data-start')),Number(arc.getAttribute('data-end'))]),state.jumps.map(jump=>[jump.start,jump.end]));
      for(let value=-15;value<=15;value++)assert.equal(document.querySelector(`[data-number-label="${value}"]`)?.textContent,String(value));
    }
    assert.equal(state.currentValue,state.target);assert.equal(state.outcome,'correct-feedback');
    assert.equal(button(document,'place').disabled,true);assert.equal(button(document,'reverse').disabled,true);
    assert.equal(button(document,'clear').disabled,false);assert.equal(button(document,'new-number').disabled,true);
    assert.equal(document.querySelector('[data-lesson-text-block="complete"]')?.textContent,'Correct!!!');
    state=reduce(state,{type:'feedback-complete'});assert.equal(button(doc(state),'new-number').disabled,false);
    state=reduce(state,{type:'clear'});assert.equal(button(doc(state),'new-number').disabled,false);
    state=reduce(state,{type:'new-number'});assert.equal(state.questionRevision,1);assert.equal(button(doc(state),'new-number').disabled,true);
  }
});

test('overshoots extend the figure and keep all source ticks plus recovery controls',()=>{
  for(const seed of [2,6]){
    let state=create(seed);state=reduce(state,{type:'place',magnitude:5});
    if(seed===2)state=reduce(state,{type:'reverse-last'});
    const before=doc(state),value=seed===2?-20:20;
    assert.equal(state.currentValue,value);assert.ok(before.querySelector(`[data-number-label="${value}"]`));
    assert.equal(before.querySelectorAll('[data-number-label]').length,36);
    for(let tick=-15;tick<=15;tick++)assert.ok(before.querySelector(`[data-tick="${tick}"]`));
    state=reduce(state,{type:'place',magnitude:1});const wrong=doc(state);
    assert.equal(wrong.querySelector('[role="alert"]')?.textContent,state.feedback);
    assert.equal(button(wrong,'reverse').disabled,true);assert.equal(button(wrong,'close-wrong').disabled,false);
    assert.equal(wrong.querySelector('[role="dialog"]'),null);
    state=reduce(state,{type:'close-wrong'});assert.equal(button(doc(state),'reverse').disabled,false);
  }
});

test('noninteractive snapshots disable all action controls in ready, wrong and complete states',()=>{
  const base=create(),correct=reduce(reduce(base,{type:'place',magnitude:2}),{type:'place',magnitude:1});
  for(const state of [base,reduce(base,{type:'invalid-drop'}),reduce(correct,{type:'feedback-complete'})]){
    assert.ok([...doc(state,false).querySelectorAll('button')].every(button=>(button as HTMLButtonElement).disabled));
  }
});

test('select plus Place, reverse, Clear, drop and wrong Close emit only caller-owned actions',async()=>{
  const dom=new JSDOM('<div id="root"></div>');
  const originalWindow=globalThis.window,originalDocument=globalThis.document;
  globalThis.window=dom.window;globalThis.document=dom.window.document;
  const root=createRoot(dom.window.document.getElementById('root'));
  const actions:Action[]=[],selections:Magnitude[]=[];
  const render=(state=create(),interactive=true)=>flushSync(()=>root.render(<G4L3In006QuizPresentation interaction={state} interactive={interactive}
    selectedMagnitude={2} onSelect={m=>selections.push(m)} onAction={a=>actions.push(a)}/>));
  try{
    render();button(document,'jump-4').click();assert.deepEqual(selections,[4]);
    button(document,'place').click();assert.deepEqual(actions.pop(),{type:'place',magnitude:2});
    render(reduce(create(),{type:'place',magnitude:2}));button(document,'reverse').click();assert.deepEqual(actions.pop(),{type:'reverse-last'});
    button(document,'clear').click();assert.deepEqual(actions.pop(),{type:'clear'});
    const drop=new dom.window.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(drop,'dataTransfer',{value:{getData:()=> '5'}});
    document.querySelector('.in006-quiz__viewport')!.dispatchEvent(drop);assert.deepEqual(actions.pop(),{type:'place',magnitude:5});
    const invalid=new dom.window.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(invalid,'dataTransfer',{value:{getData:()=> '2'}});
    document.querySelector('.in006-quiz')!.dispatchEvent(invalid);assert.deepEqual(actions.pop(),{type:'invalid-drop'});
    render(reduce(create(),{type:'invalid-drop'}));button(document,'close-wrong').click();assert.deepEqual(actions.pop(),{type:'close-wrong'});
    render(create(),false);button(document,'place').click();assert.equal(actions.length,0);
  }finally{const env=globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?:boolean}; const oldAct=env.IS_REACT_ACT_ENVIRONMENT; env.IS_REACT_ACT_ENVIRONMENT=true; await act(async()=>{root.unmount();});env.IS_REACT_ACT_ENVIRONMENT=oldAct;globalThis.window=originalWindow;globalThis.document=originalDocument;dom.window.close();}
});

test('optional runtime binds source Clear and New Number down/up only, never assistive Close',async()=>{
 const dom=new JSDOM('<div id="root"></div>'),oldWindow=globalThis.window,oldDocument=globalThis.document;
 globalThis.window=dom.window;globalThis.document=dom.window.document;
 const root=createRoot(document.getElementById('root')!),requests:Array<{id:string;phase:string}>=[];
 const runtime={frame:1054,scenario:'source-static-frame',lang:'en' as const,seed:0,onLessonButtonActivityRequest:(request:{id:string;phase:'press'|'release'})=>{requests.push(request);return true;}};
 const render=(state:State)=>flushSync(()=>root.render(<G4L3In006QuizPresentation runtime={runtime} interaction={state} interactive selectedMagnitude={1} onSelect={()=>{}} onAction={()=>{}}/>));
 const downUp=(id:string)=>{const element=button(document,id);element.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));element.dispatchEvent(new dom.window.KeyboardEvent('keyup',{key:' ',bubbles:true}));};
 try{
  render(create());downUp('clear');assert.deepEqual(requests.map(r=>[r.id,r.phase]),[['in006-clear-down','press'],['in006-clear-down','release']]);
  const correct=reduce(reduce(create(),{type:'place',magnitude:2}),{type:'place',magnitude:1});
  render(reduce(correct,{type:'feedback-complete'}));downUp('new-number');assert.deepEqual(requests.slice(-2).map(r=>[r.id,r.phase]),[['in006-new-down','press'],['in006-new-down','release']]);
  render(reduce(create(),{type:'invalid-drop'}));const count=requests.length;downUp('close-wrong');assert.equal(requests.length,count);
 }finally{const env=globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?:boolean},oldAct=env.IS_REACT_ACT_ENVIRONMENT;env.IS_REACT_ACT_ENVIRONMENT=true;await act(async()=>root.unmount());env.IS_REACT_ACT_ENVIRONMENT=oldAct;globalThis.window=oldWindow;globalThis.document=oldDocument;dom.window.close();}
});
