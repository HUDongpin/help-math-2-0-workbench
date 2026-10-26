import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P030 display marker:${a}`);return s.replace(a,b);};

/** Preserve source token identity, depth, target visibility and the paired token's own frame2 drawing. */
export function projectP030DisplayState(runtime,practice){
 assert.equal(practice.choices.length,15);assert.equal(practice.targets.length,8);
 assert.deepEqual(practice.choices.filter(c=>c.paired).map(c=>[c.sourceIndex,c.sourceCharacterId]),[[6,69],[4,72],[2,79],[7,80]]);
 const pieces=Object.fromEntries(practice.choices.map(c=>['sprite'+c.sourceCharacterId,{index:c.sourceIndex,paired:c.paired,targets:c.permittedTargets}]));
 const targets=Object.fromEntries(practice.targets.map(t=>['sprite'+t.sourceCharacterId,{index:t.targetIndex,paired:t.paired,position:t.localPosition}]));
 const choices=Object.fromEntries(practice.choices.map(c=>[c.sourceIndex,c.permittedTargets]));
 const positions=Object.fromEntries(practice.targets.map(t=>[t.targetIndex,t.localPosition]));
 const prelude=`var P030_ACTIVE=null;
var P030_PIECES=${JSON.stringify(pieces)},P030_TARGETS=${JSON.stringify(targets)},P030_CHOICES=${JSON.stringify(choices)},P030_POSITIONS=${JSON.stringify(positions)};
function p030Index(n){return Number.isSafeInteger(n)&&n>=1&&n<=15;}
function p030State(input,frame){
 if(input===undefined)return {assignments:[],selectedIndex:null,drag:null,inputEnabled:false,helpEnabled:false,helpVisible:false,wrongVisible:false,wrongFrame:1,coachFrame:1,correctFrame:1};
 if(!input||!Array.isArray(input.assignments)||input.assignments.length>8||input.assignments.some(function(p,i,a){return !p||!p030Index(p.sourceIndex)||!Number.isSafeInteger(p.targetIndex)||P030_CHOICES[p.sourceIndex].indexOf(p.targetIndex)<0||a.some(function(q,j){return j<i&&(q.sourceIndex===p.sourceIndex||q.targetIndex===p.targetIndex);});})||
  (input.selectedIndex!==null&&(!p030Index(input.selectedIndex)||input.assignments.some(function(a){return a.sourceIndex===input.selectedIndex;})))||['inputEnabled','helpEnabled','helpVisible','wrongVisible'].some(function(k){return typeof input[k]!=='boolean';})||
  !Number.isSafeInteger(input.wrongFrame)||input.wrongFrame<1||input.wrongFrame>15||!Number.isSafeInteger(input.coachFrame)||input.coachFrame<1||input.coachFrame>20||!Number.isSafeInteger(input.correctFrame)||input.correctFrame<1||input.correctFrame>25)throw new Error('P030_SOURCE_DISPLAY_STATE_INVALID');
 if(input.drag&&(!p030Index(input.drag.index)||!Number.isFinite(input.drag.x)||!Number.isFinite(input.drag.y)||Math.abs(input.drag.x)>10000||Math.abs(input.drag.y)>10000||input.drag.index!==input.selectedIndex||input.assignments.some(function(a){return a.sourceIndex===input.drag.index;})||!input.inputEnabled))throw new Error('P030_SOURCE_DRAG_INVALID');
 if(input.wrongVisible!==(input.wrongFrame>1)||input.helpVisible&&(frame!==449||input.wrongVisible)||input.inputEnabled&&(frame!==449||input.assignments.length===8||input.helpVisible||input.wrongVisible||input.coachFrame>1||input.correctFrame>1))throw new Error('P030_SOURCE_PHASE_INVALID');
 return input;
}
var p030SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var s=P030_ACTIVE;
 if(s){
  var piece=P030_PIECES[obj],target=P030_TARGETS[obj];
  if(piece){
   var assignment=s.assignments.find(function(a){return a.sourceIndex===piece.index;});
   if(assignment){
    if(!piece.paired)return;
    var location=P030_POSITIONS[assignment.targetIndex];matrix=matrix.slice();matrix[4]=location.x;matrix[5]=location.y;frame=1;
   }else{
    frame=0;
    if(s.drag&&s.drag.index===piece.index){matrix=matrix.slice();matrix[4]+=s.drag.x;matrix[5]+=s.drag.y;}
   }
  }
  if(target){
   if(target.paired||!s.assignments.some(function(a){return a.targetIndex===target.index;}))return;
   ctrans=new cxform(ctrans.r_add,ctrans.g_add,ctrans.b_add,0,ctrans.r_mult,ctrans.g_mult,ctrans.b_mult,255);
  }
  if(obj==='sprite99'){if(!s.helpVisible)return;frame=0;}
  if(obj==='sprite108'){if(!s.wrongVisible)return;frame=s.wrongFrame-1;}
  if(obj==='sprite103'){if(s.correctFrame===1)return;frame=s.correctFrame-1;}
  if(obj==='sprite110'||obj==='sprite112')frame=0;
 }
 return p030SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p030State(request && request.interaction,state.localFrame);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P030_ACTIVE;\n    P030_ACTIVE=interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P030_ACTIVE=previousInteraction;');
 return runtime;
}
