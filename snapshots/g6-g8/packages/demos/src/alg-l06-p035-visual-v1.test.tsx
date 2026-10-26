import assert from 'node:assert/strict';
import {test} from 'node:test';
import {p035PaintExact,p035VisualGate,type P035CanvasAsset,type P035VisualOwner}
 from './alg-l06-p035-visual-v1';
import {p035NativeTextState} from './alg-l06-p035-native-text-v1';
import {p035CanActivate,p035InteractionState}
 from './alg-l06-p035-native-interaction-v1';

const owner=(frame:number,phase:P035VisualOwner['phase']):P035VisualOwner=>({
 mainFrame:frame,phase,mainAudioToken:Symbol('main'),feedbackEpoch:0,
 spanishEpoch:0,interactionEpoch:0,feedback:null,inputLocked:false,
 glossaryOpen:false,spanishSelected:false,canChoose:true,
 canOpenGlossary:true,canCloseFeedback:true});

function fakeCanvas(){
 const attrs=new Map<string,string>();
 const canvas={width:800,height:600,
  setAttribute:(key:string,value:string)=>attrs.set(key,value),
  getAttribute:(key:string)=>attrs.get(key)??null} as unknown as HTMLCanvasElement;
 return canvas;
}

test('paint must return committed sprite-227 pixels before native can use the frame',()=>{
 const canvas=fakeCanvas();let renderCount=0;
 const asset:P035CanvasAsset={ready:async()=>{},render:(target,request)=>{
  renderCount++;
  target.setAttribute('data-flash-frame',String(request.frame));
  target.setAttribute('data-p035-feedback-sprite',String(request.feedback?.spriteId??'none'));
  target.setAttribute('data-p035-feedback-frame',String(request.feedback?.localFrame??'none'));
  return {frameDomain:'sprite-227',localFrame:request.frame,
   feedback:request.feedback??null};
 }};
 const state=p035PaintExact(asset,canvas,145,{spriteId:80,frame:20});
 assert.equal(renderCount,1);
 assert.equal(state.feedback?.spriteId,80);
 const wrong:P035CanvasAsset={...asset,render:(target,request)=>{
  const state=asset.render(target,request);
  return {...state,localFrame:144};
 }};
 assert.throws(()=>p035PaintExact(wrong,canvas,145,null),/COMMIT_MISMATCH/u);
 assert.throws(()=>p035PaintExact(asset,canvas,145,{spriteId:179,frame:2}),
  /FEEDBACK_SELECTION/u);
 assert.equal(renderCount,2,'held 179 never reaches Canvas render');
});

test('live glossary hit ownership follows the fully mask-visible source label',()=>{
 const cases:[string,number][]=[['Substitute',23],['Equation',62],
  ['Function',76],['Output',109],['Input',127]];
 for(const [key,first] of cases){
  const before=p035InteractionState(p035VisualGate(owner(first-1,'prequiz')));
  const after=p035InteractionState(p035VisualGate(owner(first,'prequiz')));
  assert(!before.glossary.some(row=>row.key===key),`${key} before clipping completes`);
  const control=after.glossary.find(row=>row.key===key);
  assert(control,`${key} source button live`);
  const native=p035NativeTextState(first);
  const label=native.allTextInstances.find(row=>row.instanceId===control.labelInstanceId);
  assert(label);
  assert(label.visibleText.toLowerCase().includes(key.toLowerCase()),
   `${key} complete key segment is visible within the still-clipped sentence`);
  assert(label.clippingMaskInstanceIds.length>0,`${key} source mask bound`);
  assert.match(control.buttonInstanceId,/^227\/depth-\d+\/generation-\d+$/u);
  assert.match(control.actionSha256,/^[a-f0-9]{64}$/u);
 }
});

test('quiz controls require question phase and exact source text/button instances',()=>{
 const question=owner(145,'question');
 const controls=p035InteractionState(p035VisualGate(question)).choices;
 const native=p035NativeTextState(145);
 assert.deepEqual(controls.map(row=>[row.key,row.value,row.sourceHandler]),[
  ['AnsBtn1','50','wrong'],['AnsBtn2','51','right'],
  ['AnsBtn3','225','wrong'],['AnsBtn4','226','wrong']]);
 for(const row of controls){
  const label=native.allTextInstances.find(text=>text.instanceId===row.labelInstanceId);
  assert(label?.complete&&label.visibleText===row.value);
  assert.equal(row.sourceFrame,145);
 }
 assert.equal(p035InteractionState(p035VisualGate(owner(145,'feedback-pending'))).choices.length,0);
 assert.equal(p035InteractionState(p035VisualGate(owner(145,'postquiz'))).choices.length,0);
 assert.throws(()=>p035VisualGate(owner(144,'question')),/PHASE_FRAME/u);
});

test('selected feedback owns local frame, Close and branch-specific native text',()=>{
 const feedback={...owner(145,'feedback-held'),feedback:{spriteId:80,frame:20},
  wrongTryCount:0 as const};
 const controls=p035InteractionState(p035VisualGate(feedback));
 assert.equal(controls.choices.length,0);
 assert.equal(controls.glossary.length,0);
 assert.equal(controls.close.length,1);
 const label=p035NativeTextState(145,{feedbackSpriteId:80,feedbackFrame:20,
  wrongTryCount:0}).feedbackText.find(row=>
   row.instanceId===controls.close[0].labelInstanceId);
 assert(label?.complete&&label.visibleText==='Close');
 assert.equal(controls.close[0].feedbackSpriteId,80);
 assert.equal(controls.close[0].feedbackFrame,20);
 assert.throws(()=>p035VisualGate({...feedback,feedback:{spriteId:179,frame:20}}),
  /FEEDBACK_SELECTION/u);
 assert.throws(()=>p035VisualGate({...feedback,feedback:{spriteId:154,frame:20}}),
  /FEEDBACK_SELECTION/u);
 assert.throws(()=>p035VisualGate({...feedback,wrongTryCount:undefined}),
  /FEEDBACK_SELECTION/u);
 assert.throws(()=>p035VisualGate({...feedback,feedback:{spriteId:80,frame:19}}),
  /FEEDBACK_SELECTION/u);
});

test('wrong Close follows the positive-alpha source button window before hold',()=>{
 for(const [id,first,hold,destination,button] of [
  [80,14,20,21,76],[95,15,21,22,89],[126,16,22,23,115]]){
  const at=(frame:number,phase:P035VisualOwner['phase']):P035VisualOwner=>({
   ...owner(145,phase),feedback:{spriteId:id,frame},wrongTryCount:0,
   canChoose:false,canOpenGlossary:false,canCloseFeedback:true});
  const alphaZero=p035InteractionState(p035VisualGate(at(first-1,'feedback-playing')));
  assert.equal(alphaZero.close.length,0,`sprite ${id} alpha-zero placement`);
  const early=p035InteractionState(p035VisualGate(at(first,'feedback-playing')));
  assert.equal(early.close.length,1,`sprite ${id} early positive-alpha Close`);
  assert.equal(early.close[0].buttonId,button);
  assert.equal(early.close[0].feedbackFrame,first);
  assert.equal(early.close[0].destinationFrame,destination);
  assert.equal(p035InteractionState(p035VisualGate(at(hold,'feedback-held'))).close.length,1);
  assert.equal(p035InteractionState(p035VisualGate(at(destination,'feedback-playing'))).close.length,0);
  assert.throws(()=>p035VisualGate(at(first,'feedback-held')),/FEEDBACK_SELECTION/u);
 }
});

test('early Close activation still binds current owner, local frame and DOM source identity',()=>{
 const now: P035VisualOwner={...owner(145,'feedback-playing'),
  feedback:{spriteId:80,frame:14},wrongTryCount:0,
  canChoose:false,canOpenGlossary:false,canCloseFeedback:true};
 const rendered=p035VisualGate(now),control=p035InteractionState(rendered).close[0];
 assert(control);
 const attrs=new Map<string,string>([
  ['data-p035-kind','close'],['data-p035-key','Close'],
  ['data-source-button-id',String(control.buttonId)],
  ['data-source-button-instance-id',control.buttonInstanceId],
  ['data-source-action-sha256',control.actionSha256],
  ['data-source-label-instance-id',control.labelInstanceId],
  ['data-source-label-text-id',String(control.labelTextId)],
  ['data-p035-main-frame','145'],['data-p035-feedback-sprite-id','80'],
  ['data-p035-feedback-frame','14'],
 ]);
 let trigger:HTMLButtonElement;
 const scope={isConnected:true,contains:(x:unknown)=>x===trigger,
  getAttribute:(key:string)=>key==='data-p035-interaction'?'source-only':
   key==='data-p035-main-frame'?'145':null} as unknown as HTMLElement;
 trigger={isConnected:true,disabled:false,
  getAttribute:(key:string)=>attrs.get(key)??null,
  closest:()=>scope} as unknown as HTMLButtonElement;
 const allowed=(current:P035VisualOwner|null)=>p035CanActivate(control,trigger,scope,
  rendered,()=>current?p035VisualGate(current):null);
 assert(allowed(now));
 assert(!allowed({...now,feedbackEpoch:1}));
 assert(!allowed({...now,interactionEpoch:1}));
 assert(!allowed({...now,feedback:{spriteId:80,frame:15}}));
 attrs.set('data-source-button-instance-id','foreign-instance');
 assert(!allowed(now));
});
