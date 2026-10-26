import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P029 display marker:${a}`);return s.replace(a,b);};

/** Project authored clip visibility, thirteen source identities and five targets and drag offsets into preserved source drawing. */
export function projectP029DisplayState(runtime,practice){
 assert.deepEqual(practice.choices.map(c=>[c.sourceIndex,c.sourceCharacterId,c.target?.sourceCharacterId??null]),[[5,51,null],[2,63,48],[6,52,null],[7,53,null],[0,54,46],[8,55,null],[4,56,50],[9,57,null],[10,58,null],[11,59,null],[3,60,49],[12,61,null],[1,62,47]]);
 assert.deepEqual(practice.targets.map(t=>[t.sourceIndex,t.sourceCharacterId]),[[0,46],[1,47],[2,48],[3,49],[4,50]]);
 const pieces=Object.fromEntries(practice.choices.map(c=>['sprite'+c.sourceCharacterId,c.sourceIndex]));
 const targets=Object.fromEntries(practice.targets.map(t=>['sprite'+t.sourceCharacterId,t.sourceIndex]));
 const prelude=`var P029_ACTIVE = null;
var P029_PIECES = ${JSON.stringify(pieces)}, P029_TARGETS = ${JSON.stringify(targets)};
function p029Index(n){return Number.isSafeInteger(n)&&n>=0&&n<=12;}
function p029State(input,frame){
 if(input===undefined)return {solvedIndices:[],selectedIndex:null,drag:null,inputEnabled:false,helpEnabled:false,helpVisible:false,wrongVisible:false,wrongFrame:1,coachFrame:1,correctFrame:1};
 if(!input||!Array.isArray(input.solvedIndices)||input.solvedIndices.some(function(n,i,a){return !p029Index(n)||n>4||a.indexOf(n)!==i;})||
  (input.selectedIndex!==null&&!p029Index(input.selectedIndex))||['inputEnabled','helpEnabled','helpVisible','wrongVisible'].some(function(k){return typeof input[k]!=='boolean';})||
  !Number.isSafeInteger(input.wrongFrame)||input.wrongFrame<1||input.wrongFrame>15||!Number.isSafeInteger(input.coachFrame)||input.coachFrame<1||input.coachFrame>20||!Number.isSafeInteger(input.correctFrame)||input.correctFrame<1||input.correctFrame>25)throw new Error('P029_SOURCE_DISPLAY_STATE_INVALID');
 if(input.drag&&(!p029Index(input.drag.index)||!Number.isFinite(input.drag.x)||!Number.isFinite(input.drag.y)||Math.abs(input.drag.x)>10000||Math.abs(input.drag.y)>10000||input.drag.index!==input.selectedIndex||input.solvedIndices.indexOf(input.drag.index)>=0||!input.inputEnabled))throw new Error('P029_SOURCE_DRAG_INVALID');
 if(input.wrongVisible!==(input.wrongFrame>1)||input.helpVisible&&(frame!==396||input.wrongVisible)||input.inputEnabled&&(frame!==396||input.helpVisible||input.wrongVisible||input.coachFrame>1||input.correctFrame>1))throw new Error('P029_SOURCE_PHASE_INVALID');
 return input;
}
var p029SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var s=P029_ACTIVE;
 if(s){
  var i=P029_PIECES[obj],target=P029_TARGETS[obj];
  if(i!==undefined){if(s.solvedIndices.indexOf(i)>=0)return;if(s.drag&&s.drag.index===i){matrix=matrix.slice();matrix[4]+=s.drag.x;matrix[5]+=s.drag.y;}}
  if(target!==undefined){if(s.solvedIndices.indexOf(target)<0)return;ctrans=new cxform(ctrans.r_add,ctrans.g_add,ctrans.b_add,0,ctrans.r_mult,ctrans.g_mult,ctrans.b_mult,255);}
  if(obj==='sprite97'){if(!s.helpVisible)return;frame=0;}
  if(obj==='sprite318'){if(!s.wrongVisible)return;frame=s.wrongFrame-1;}
  if(obj==='sprite322'){if(s.correctFrame===1)return;frame=s.correctFrame-1;}
  if(['sprite118','sprite158','sprite199','sprite245','sprite309','sprite324','sprite326'].indexOf(obj)>=0)frame=0;
 }
 return p029SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction = p029State(request && request.interaction,state.localFrame);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction = P029_ACTIVE;\n    P029_ACTIVE = interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P029_ACTIVE = previousInteraction;');
 return runtime;
}
