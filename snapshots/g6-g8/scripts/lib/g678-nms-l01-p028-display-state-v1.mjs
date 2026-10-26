import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P028 display marker:${a}`);return s.replace(a,b);};

/** Project authored clip visibility, eight source identities and drag offsets into preserved source drawing. */
export function projectP028DisplayState(runtime,practice){
 assert.deepEqual(practice.choices.map(c=>[c.sourceIndex,c.sourceCharacterId,c.target.sourceCharacterId]),[[1,80,79],[2,81,73],[3,82,74],[4,83,71],[5,84,75],[6,85,76],[7,86,77],[8,87,78]]);
 const pieces=Object.fromEntries(practice.choices.map(c=>['sprite'+c.sourceCharacterId,c.sourceIndex]));
 const targets=Object.fromEntries(practice.choices.map(c=>['sprite'+c.target.sourceCharacterId,c.sourceIndex]));
 const prelude=`var P028_ACTIVE = null;
var P028_PIECES = ${JSON.stringify(pieces)}, P028_TARGETS = ${JSON.stringify(targets)};
function p028Index(n){return Number.isSafeInteger(n)&&n>=1&&n<=8;}
function p028State(input,frame){
 if(input===undefined)return {solvedIndices:[],selectedIndex:null,drag:null,inputEnabled:false,helpEnabled:false,helpVisible:false,wrongVisible:false,wrongFrame:1,coachFrame:1,correctFrame:1};
 if(!input||!Array.isArray(input.solvedIndices)||input.solvedIndices.some(function(n,i,a){return !p028Index(n)||a.indexOf(n)!==i;})||
  (input.selectedIndex!==null&&!p028Index(input.selectedIndex))||['inputEnabled','helpEnabled','helpVisible','wrongVisible'].some(function(k){return typeof input[k]!=='boolean';})||
  !Number.isSafeInteger(input.wrongFrame)||input.wrongFrame<1||input.wrongFrame>15||!Number.isSafeInteger(input.coachFrame)||input.coachFrame<1||input.coachFrame>20||!Number.isSafeInteger(input.correctFrame)||input.correctFrame<1||input.correctFrame>25)throw new Error('P028_SOURCE_DISPLAY_STATE_INVALID');
 if(input.drag&&(!p028Index(input.drag.index)||!Number.isFinite(input.drag.x)||!Number.isFinite(input.drag.y)||Math.abs(input.drag.x)>10000||Math.abs(input.drag.y)>10000||input.drag.index!==input.selectedIndex||input.solvedIndices.indexOf(input.drag.index)>=0||!input.inputEnabled))throw new Error('P028_SOURCE_DRAG_INVALID');
 if(input.wrongVisible!==(input.wrongFrame>1)||input.helpVisible&&(frame!==194||input.wrongVisible)||input.inputEnabled&&(frame!==194||input.helpVisible||input.wrongVisible||input.coachFrame>1||input.correctFrame>1))throw new Error('P028_SOURCE_PHASE_INVALID');
 return input;
}
var p028SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var s=P028_ACTIVE;
 if(s){
  var i=P028_PIECES[obj],target=P028_TARGETS[obj];
  if(i){if(s.solvedIndices.indexOf(i)>=0)return;if(s.drag&&s.drag.index===i){matrix=matrix.slice();matrix[4]+=s.drag.x;matrix[5]+=s.drag.y;}}
  if(target){if(s.solvedIndices.indexOf(target)<0)return;ctrans=new cxform(ctrans.r_add,ctrans.g_add,ctrans.b_add,0,ctrans.r_mult,ctrans.g_mult,ctrans.b_mult,255);}
  if(obj==='sprite109'){if(!s.helpVisible)return;frame=0;}
  if(obj==='sprite118'){if(!s.wrongVisible)return;frame=s.wrongFrame-1;}
  if(obj==='sprite113'){if(s.correctFrame===1)return;frame=s.correctFrame-1;}
  if(obj==='sprite120'||obj==='sprite122')return;
 }
 return p028SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction = p028State(request && request.interaction,state.localFrame);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction = P028_ACTIVE;\n    P028_ACTIVE = interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P028_ACTIVE = previousInteraction;');
 return runtime;
}
