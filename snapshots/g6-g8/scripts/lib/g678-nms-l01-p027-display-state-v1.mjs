import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P027 display marker:${a}`);return s.replace(a,b);};

/** Preserve authored drawing while projecting the four term identities and stopped child clocks. */
export function projectP027DisplayState(runtime,practice){
 assert.deepEqual(practice.choices.map(c=>[c.sourceIndex,c.sourceCharacterId,c.target.sourceCharacterId]),[[1,93,92],[2,94,91],[3,95,89],[4,96,90]]);
 assert.deepEqual(practice.pictures.map(p=>p.sourceCharacterId),[98,100,103,106]);
 const pieces=Object.fromEntries(practice.choices.map(c=>['sprite'+c.sourceCharacterId,c.sourceIndex]));
 const targets=Object.fromEntries(practice.choices.map(c=>['sprite'+c.target.sourceCharacterId,c.sourceIndex]));
 const prelude=`var P027_ACTIVE=null;
var P027_PIECES=${JSON.stringify(pieces)},P027_TARGETS=${JSON.stringify(targets)},P027_PICTURES={sprite98:1,sprite100:2,sprite103:3,sprite106:4};
function p027Index(n){return Number.isSafeInteger(n)&&n>=1&&n<=4;}
function p027Indices(a){return Array.isArray(a)&&!a.some(function(n,i){return !p027Index(n)||a.indexOf(n)!==i;});}
function p027State(input,frame){
 if(input===undefined)return {solvedIndices:[],selectedIndex:null,drag:null,inputEnabled:false,expandedPictures:[],wrongVisible:false,wrongFrame:1,coachFrame:1,correctFrame:1};
 if(!input||!p027Indices(input.solvedIndices)||!p027Indices(input.expandedPictures)||
  (input.selectedIndex!==null&&!p027Index(input.selectedIndex))||typeof input.inputEnabled!=='boolean'||typeof input.wrongVisible!=='boolean'||
  !Number.isSafeInteger(input.wrongFrame)||input.wrongFrame<1||input.wrongFrame>15||
  !Number.isSafeInteger(input.coachFrame)||input.coachFrame<1||input.coachFrame>20||
  !Number.isSafeInteger(input.correctFrame)||input.correctFrame<1||input.correctFrame>25)throw new Error('P027_SOURCE_DISPLAY_STATE_INVALID');
 if(input.drag&&(!p027Index(input.drag.index)||!Number.isFinite(input.drag.x)||!Number.isFinite(input.drag.y)||Math.abs(input.drag.x)>10000||Math.abs(input.drag.y)>10000||input.drag.index!==input.selectedIndex||input.solvedIndices.indexOf(input.drag.index)>=0||!input.inputEnabled))throw new Error('P027_SOURCE_DRAG_INVALID');
 if(input.wrongVisible!==(input.wrongFrame>1)||input.expandedPictures.length&&frame<330||
  input.inputEnabled&&(frame!==330||input.wrongVisible||input.coachFrame>1||input.correctFrame>1)||
  (input.wrongFrame>1||input.coachFrame>1||input.correctFrame>1)&&frame!==330)throw new Error('P027_SOURCE_PHASE_INVALID');
 return input;
}
var p027SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var s=P027_ACTIVE;
 if(s){
  var i=P027_PIECES[obj],target=P027_TARGETS[obj],picture=P027_PICTURES[obj];
  if(i){if(s.solvedIndices.indexOf(i)>=0)return;if(s.drag&&s.drag.index===i){matrix=matrix.slice();matrix[4]+=s.drag.x;matrix[5]+=s.drag.y;}}
  if(target){if(s.solvedIndices.indexOf(target)<0)return;ctrans=new cxform(ctrans.r_add,ctrans.g_add,ctrans.b_add,0,ctrans.r_mult,ctrans.g_mult,ctrans.b_mult,255);}
  if(picture)frame=s.expandedPictures.indexOf(picture)>=0?1:0;
  if(obj==='sprite335'){if(!s.wrongVisible)return;frame=s.wrongFrame-1;}
  if(obj==='sprite339'){if(s.correctFrame===1)return;frame=s.correctFrame-1;}
  if(['sprite159','sprite200','sprite219','sprite322','sprite341','sprite343'].indexOf(obj)>=0)frame=0;
 }
 return p027SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p027State(request&&request.interaction,state.localFrame);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P027_ACTIVE;\n    P027_ACTIVE=interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P027_ACTIVE=previousInteraction;');
 return runtime;
}
