import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P011 display marker:${a}`);return s.replace(a,b);};

/** Preserve source drawing, selecting only the host-named feedback child and its authored frame. */
export function projectP011DisplayState(runtime,branches){
 assert.deepEqual(branches.map(b=>[b.sourceCharacterId,b.kind,b.index,b.frameCount]),[[92, "wrong", 1, 30], [68, "wrong", 2, 28], [80, "wrong", 3, 29], [155, "right", 1, 27], [183, "right", 2, 28], [207, "right", 3, 28], [143, "right", 4, 27]]);
 const counts=Object.fromEntries(branches.map(b=>[b.sourceCharacterId,b.frameCount]));
 const prelude=`var P011_ACTIVE = null;
var P011_COUNTS = ${JSON.stringify(counts)};
var P011_FEEDBACK = {"sprite68": 68, "sprite80": 80, "sprite92": 92, "sprite109": 109, "sprite143": 143, "sprite155": 155, "sprite183": 183, "sprite195": 195, "sprite207": 207};
function p011State(input) {
 if(input === undefined)return {feedbackCharacterId:null,feedbackFrame:1,choicesEnabled:false,popupVisible:false};
 if(!input || typeof input.choicesEnabled!=='boolean' || typeof input.popupVisible!=='boolean' || !Number.isSafeInteger(input.feedbackFrame) ||
  (input.feedbackCharacterId===null ? input.feedbackFrame!==1 || input.popupVisible : !Object.prototype.hasOwnProperty.call(P011_COUNTS,input.feedbackCharacterId) || input.feedbackFrame<2 || input.feedbackFrame>P011_COUNTS[input.feedbackCharacterId]))throw new Error('P011_SOURCE_DISPLAY_STATE_INVALID');
 if(input.feedbackCharacterId!==null && input.choicesEnabled)throw new Error('P011_FEEDBACK_DISALLOWS_ANSWERS');
 if(input.popupVisible && ([68,80,92].indexOf(input.feedbackCharacterId)<0 || input.feedbackFrame<16 || input.feedbackFrame>22))throw new Error('P011_POPUP_FRAME_MISMATCH');
 return input;
}
var p011SourcePlace = place;
place = function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time) {
 var s=P011_ACTIVE;
 if(s){
  var id=P011_FEEDBACK[obj];
  if(id){if(id!==s.feedbackCharacterId)return;matrix=matrix.slice();matrix[4]=5;frame=s.feedbackFrame-1;}
  if((obj==='button25'||obj==='button26')&&!s.choicesEnabled)return;
 }
 return p011SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction = p011State(request && request.interaction);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction = P011_ACTIVE;\n    P011_ACTIVE = interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P011_ACTIVE = previousInteraction;');
 return runtime;
}
