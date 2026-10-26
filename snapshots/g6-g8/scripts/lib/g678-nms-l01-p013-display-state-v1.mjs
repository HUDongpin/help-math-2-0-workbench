import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P013 display marker:${a}`);return s.replace(a,b);};

/** Project authored clip visibility, eight source identities and drag offsets into preserved source drawing. */
export function projectP013DisplayState(runtime,practice,meta){
 assert.deepEqual(practice.choices.map(c=>[c.sourceIndex,c.sourceCharacterId,c.target.sourceCharacterId]),[[1,70,58],[2,71,60],[3,72,64],[4,73,62],[5,74,65],[6,75,66],[7,76,67],[8,77,68]]);
 const pieces=Object.fromEntries(practice.choices.map(c=>['sprite'+c.sourceCharacterId,c.sourceIndex]));
 const targets=Object.fromEntries(practice.choices.map(c=>['sprite'+c.target.sourceCharacterId,c.sourceIndex]));
 const prelude=`var P013_ACTIVE = null;
var P013_PIECES = ${JSON.stringify(pieces)}, P013_TARGETS = ${JSON.stringify(targets)};
function p013Index(n){return Number.isSafeInteger(n)&&n>=1&&n<=8;}
function p013State(input,frame){
 if(input===undefined)return {solvedIndices:[],selectedIndex:null,drag:null,inputEnabled:false,helpEnabled:false,helpVisible:false,wrongVisible:false,wrongFrame:1,coachFrame:1,correctFrame:1};
 if(!input||!Array.isArray(input.solvedIndices)||input.solvedIndices.some(function(n,i,a){return !p013Index(n)||a.indexOf(n)!==i;})||
  (input.selectedIndex!==null&&!p013Index(input.selectedIndex))||['inputEnabled','helpEnabled','helpVisible','wrongVisible'].some(function(k){return typeof input[k]!=='boolean';})||
  !Number.isSafeInteger(input.wrongFrame)||input.wrongFrame<1||input.wrongFrame>15||!Number.isSafeInteger(input.coachFrame)||input.coachFrame<1||input.coachFrame>20||!Number.isSafeInteger(input.correctFrame)||input.correctFrame<1||input.correctFrame>25)throw new Error('P013_SOURCE_DISPLAY_STATE_INVALID');
 if(input.drag&&(!p013Index(input.drag.index)||!Number.isFinite(input.drag.x)||!Number.isFinite(input.drag.y)||Math.abs(input.drag.x)>10000||Math.abs(input.drag.y)>10000||input.drag.index!==input.selectedIndex||input.solvedIndices.indexOf(input.drag.index)>=0||!input.inputEnabled))throw new Error('P013_SOURCE_DRAG_INVALID');
 if(input.wrongVisible!==(input.wrongFrame>1)||input.helpVisible&&(frame<171||frame>196||input.wrongVisible)||input.inputEnabled&&(frame!==196||input.helpVisible||input.wrongVisible||input.coachFrame>1||input.correctFrame>1))throw new Error('P013_SOURCE_PHASE_INVALID');
 return input;
}
var p013SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var s=P013_ACTIVE;
 if(s){
  var i=P013_PIECES[obj],target=P013_TARGETS[obj];
  if(i){if(s.solvedIndices.indexOf(i)>=0)return;if(s.drag&&s.drag.index===i){matrix=matrix.slice();matrix[4]+=s.drag.x;matrix[5]+=s.drag.y;}}
  if(target){if(s.solvedIndices.indexOf(target)<0)return;ctrans=new cxform(ctrans.r_add,ctrans.g_add,ctrans.b_add,0,ctrans.r_mult,ctrans.g_mult,ctrans.b_mult,255);}
  if(obj==='sprite99'){if(!s.helpVisible)return;frame=0;}
  if(obj==='sprite103'){if(!s.wrongVisible)return;frame=s.wrongFrame-1;}
  if(obj==='sprite107'){if(s.correctFrame===1)return;frame=s.correctFrame-1;}
  if(obj==='sprite109'||obj==='sprite111')return;
 }
 return p013SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction = p013State(request && request.interaction,state.localFrame);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction = P013_ACTIVE;\n    P013_ACTIVE = interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P013_ACTIVE = previousInteraction;');
 const draw='        sprite112(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);';
 // Source9 appears171; its future popup99 is projected at the exact196 source placement for usable early Help.
 const t=practice.help.placement.transform,m=[.05,0,0,.05,meta.internal.x+Number(t.transX)/20,meta.internal.y+Number(t.transY)/20];
 runtime=once(runtime,draw,draw+`\n        if(interaction.helpVisible && state.localFrame<196)p013SourcePlace('sprite99',canvas,ctx,${JSON.stringify(m)},new cxform(0,0,0,0,255,255,255,255),1,0,0,0);`);
 return runtime;
}
