import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P009 display marker:${a}`);return s.replace(a,b);};

/** Preserve source drawing, selecting only the host-named feedback child and its authored frame. */
export function projectP009DisplayState(runtime,branches){
 assert.deepEqual(branches.map(b=>[b.sourceCharacterId,b.kind,b.index,b.frameCount]),[
  [86,'wrong',1,30],[62,'wrong',2,28],[74,'wrong',3,29],
  [128,'right',1,27],[145,'right',2,28],[157,'right',3,25],[171,'right',4,32],
 ]);
 const counts=Object.fromEntries(branches.map(b=>[b.sourceCharacterId,b.frameCount]));
 const prelude=`var P009_ACTIVE = null;
var P009_COUNTS = ${JSON.stringify(counts)};
var P009_FEEDBACK = {sprite62:62,sprite74:74,sprite86:86,sprite103:103,sprite128:128,sprite145:145,sprite157:157,sprite171:171,sprite192:192};
function p009State(input) {
 if(input === undefined)return {feedbackCharacterId:null,feedbackFrame:1,choicesEnabled:false,popupVisible:false};
 if(!input || typeof input.choicesEnabled!=='boolean' || typeof input.popupVisible!=='boolean' || !Number.isSafeInteger(input.feedbackFrame) ||
  (input.feedbackCharacterId===null ? input.feedbackFrame!==1 || input.popupVisible : !Object.prototype.hasOwnProperty.call(P009_COUNTS,input.feedbackCharacterId) || input.feedbackFrame<2 || input.feedbackFrame>P009_COUNTS[input.feedbackCharacterId]))throw new Error('P009_SOURCE_DISPLAY_STATE_INVALID');
 if(input.feedbackCharacterId!==null && input.choicesEnabled)throw new Error('P009_FEEDBACK_DISALLOWS_ANSWERS');
 if(input.popupVisible && ([62,74,86].indexOf(input.feedbackCharacterId)<0 || input.feedbackFrame<16 || input.feedbackFrame>22))throw new Error('P009_POPUP_FRAME_MISMATCH');
 return input;
}
var p009SourcePlace = place;
place = function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time) {
 var s=P009_ACTIVE;
 if(s){
  var id=P009_FEEDBACK[obj];
  if(id){if(id!==s.feedbackCharacterId)return;matrix=matrix.slice();matrix[4]=5;frame=s.feedbackFrame-1;}
  if((obj==='button19'||obj==='button20')&&!s.choicesEnabled)return;
 }
 return p009SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction = p009State(request && request.interaction);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction = P009_ACTIVE;\n    P009_ACTIVE = interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P009_ACTIVE = previousInteraction;');
 return runtime;
}
