import assert from'node:assert/strict';import{test}from'node:test';import{createRequire}from'node:module';const{JSDOM}=createRequire(import.meta.url)('jsdom');
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});const w=dom.window;
Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,HTMLInputElement:w.HTMLInputElement,Event:w.Event,MouseEvent:w.MouseEvent,KeyboardEvent:w.KeyboardEvent,IS_REACT_ACT_ENVIRONMENT:true,ResizeObserver:class{observe(){}disconnect(){}}});Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});
const React=await import('react'),{act}=React,{createRoot}=await import('react-dom/client');
const{In008Renderer,IN008_PRESENTATION}=await import('./index');
const{beginSourceClockActivity,releaseSourceButtonActivity,advanceSourceActivities}=await import('../../lesson-source-clock');
const{createCourseG04L03In008InteractionState:create}=await import('../../timelines/course-g04-l03-in-008-interaction');
const{in008WrongBranch}=await import('./activity-adapter');
const root=createRoot(document.getElementById('root')!);let activities:any[]=[],revision=0;const events:any[]=[];
const runtime={frame:216,seed:17,lang:'en'as const,frameDomain:'sprite-57',rootFrame:6,scenario:'source-static-frame',replay:0,requirementId:'work-dom',traceId:'work-dom',paused:false,onLessonActivityRequest:(r:any)=>{events.push({kind:'coach',...r});activities=[...beginSourceClockActivity(activities,IN008_PRESENTATION.activityTimelines!.find(x=>x.id===r.id)!,++revision)!];return true;},onLessonButtonActivityRequest:(r:any)=>{events.push({kind:'button',...r});if(r.phase==='release'){const next=releaseSourceButtonActivity(activities,r.id,r.token);if(next)activities=[...next];return Boolean(next);}activities=[...beginSourceClockActivity(activities,IN008_PRESENTATION.activityTimelines!.find(x=>x.id===r.id)!,++revision)!].map(x=>x.id===r.id?{...x,pressToken:r.token}:x);return true;}};
async function render(props:any=runtime){await act(async()=>root.render(React.createElement(In008Renderer,{...props,lessonActivities:activities})));}
async function submit(){await act(async()=>document.querySelector('form')!.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true})));}
function button(text:string){return [...document.querySelectorAll('button')].find(b=>b.textContent===text)!;}
async function click(b:HTMLButtonElement){await act(async()=>b.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true})));}
async function input(index:number,value:string){await act(async()=>{const el=document.querySelectorAll('input')[index];Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new w.Event('input',{bubbles:true}));});}
async function key(b:HTMLButtonElement,type:string,key:string){await act(async()=>b.dispatchEvent(new w.KeyboardEvent(type,{key,bubbles:true,cancelable:true})));}
test('actual composed DOM routes admitted check generation, close-down release, no close/new coach cancel, separate coach concurrency, replay reset',async()=>{
 await render();assert.deepEqual(JSON.parse(document.querySelector<HTMLElement>('[data-modern-text-page]')!.dataset.lessonActivities!),[]);await submit();assert.equal(events[0].id,in008WrongBranch(17,1));assert.equal(button('Check Answer').disabled,true);await submit();assert.equal(events.length,1);
 const close=button('Close');await key(close,'keydown',' ');assert.equal(events.at(-1).phase,'press');const pressedToken=events.at(-1).token;await key(close,'keyup',' ');assert.equal(events.at(-1).phase,'release');assert.equal(events.at(-1).token,pressedToken);await click(close);assert.equal(activities.length,1);assert(activities[0].id.startsWith('in008-wrong'));const oldWrong=activities[0];
 const q=create(17);await input(0,q.currentQuestion.firstAnswer);await input(1,q.currentQuestion.secondAnswer);await submit();await submit();assert.deepEqual(events.filter(x=>x.kind==='coach').map(x=>x.id),[in008WrongBranch(17,1),'in008-correct-coach','in008-correct-coach']);assert.equal(activities.length,2);assert(activities.includes(oldWrong));const correctRevision=activities.find(x=>x.id==='in008-correct-coach').revision;await render();assert.deepEqual(JSON.parse(document.querySelector<HTMLElement>('[data-modern-text-page]')!.dataset.lessonActivities!),activities);
 await click(button('New Problem'));assert.equal(activities.length,2);assert.equal(activities.find(x=>x.id==='in008-correct-coach').revision,correctRevision);
 await submit();assert.equal(events.at(-1).id,in008WrongBranch(17,4));assert.equal(activities.length,2);assert.equal(activities.find(x=>x.id==='in008-correct-coach').revision,correctRevision);
 // Captured release callback remains valid if pause updates then hides the control.
 const close2=button('Close');await key(close2,'keydown','Enter');const token2=events.at(-1).token;await render({...runtime,paused:true});assert.equal(events.at(-1).phase,'release');assert.equal(events.at(-1).token,token2);assert.equal(activities.length,2);
 activities=advanceSourceActivities(activities,10000);assert(activities.every(x=>x.status==='completed'));
 // Real host owns teardown; test stub clears on lifecycle before new renderer identity.
 activities=[];await render({...runtime,replay:1});assert.equal(document.querySelectorAll('input')[0].value,'');await submit();assert.equal(events.at(-1).id,in008WrongBranch(17,1));
 await act(async()=>root.unmount());dom.window.close();
});
