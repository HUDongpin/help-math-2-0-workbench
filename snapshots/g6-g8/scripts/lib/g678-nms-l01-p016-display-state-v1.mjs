import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P016 display marker:${a}`);return s.replace(a,b);};

/** Preserve source drawing, selecting only the host-named feedback child and its authored frame. */
export function projectP016DisplayState(runtime,branches){
 assert.deepEqual(branches.map(b=>[b.sourceCharacterId,b.kind,b.index,b.frameCount]),[
  [132,'wrong',1,29],[144,'wrong',2,29],[157,'wrong',3,28],
  [50,'right',2,25],[86,'right',3,28],[58,'right',4,27],[107,'right',5,33],
 ]);
 const counts=Object.fromEntries(branches.map(b=>[b.sourceCharacterId,b.frameCount]));
 const prelude=`var P016_ACTIVE = null;
var P016_COUNTS = ${JSON.stringify(counts)};
var P016_FEEDBACK = {sprite50:50,sprite58:58,sprite86:86,sprite107:107,sprite132:132,sprite144:144,sprite157:157};
function p016State(input) {
 if(input === undefined)return {feedbackCharacterId:null,feedbackFrame:1,choicesEnabled:false,popupVisible:false};
 if(!input || typeof input.choicesEnabled!=='boolean' || typeof input.popupVisible!=='boolean' || !Number.isSafeInteger(input.feedbackFrame) ||
  (input.feedbackCharacterId===null ? input.feedbackFrame!==1 || input.popupVisible : !Object.prototype.hasOwnProperty.call(P016_COUNTS,input.feedbackCharacterId) || input.feedbackFrame<2 || input.feedbackFrame>P016_COUNTS[input.feedbackCharacterId]))throw new Error('P016_SOURCE_DISPLAY_STATE_INVALID');
 if(input.feedbackCharacterId!==null && input.choicesEnabled)throw new Error('P016_FEEDBACK_DISALLOWS_ANSWERS');
 if(input.popupVisible && ([132,144,157].indexOf(input.feedbackCharacterId)<0 || input.feedbackFrame<16 || input.feedbackFrame>(input.feedbackCharacterId===132?23:28)))throw new Error('P016_POPUP_FRAME_MISMATCH');
 return input;
}
var p016SourcePlace = place;
place = function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time) {
 var s=P016_ACTIVE;
 if(s){
  var id=P016_FEEDBACK[obj];
  if(id){if(id!==s.feedbackCharacterId)return;matrix=matrix.slice();matrix[4]=5;frame=s.feedbackFrame-1;}
  if((obj==='button17'||obj==='button18')&&!s.choicesEnabled)return;
 }
 return p016SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction = p016State(request && request.interaction);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction = P016_ACTIVE;\n    P016_ACTIVE = interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P016_ACTIVE = previousInteraction;');
 return runtime;
}
