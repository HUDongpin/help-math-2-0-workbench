import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P045 display marker: ${a}`);return s.replace(a,b);};
/** Project only source-visible strategy/feedback children. Static glyphs and masks stay source-bound. */
export function projectP045DisplayState(runtime,practice){
 assert.deepEqual(practice.choices.map(c=>[c.sourceInstanceName,c.value,c.correct]),[['AnsBtn1',65,false],['AnsBtn4',85,false],['AnsBtn3',90,true],['AnsBtn2',100,false]]);
 assert.equal(practice.fields.length,0);assert.equal(practice.strategies.length,2);
 const counts=Object.fromEntries(practice.branches.map(b=>[b.sourceCharacterId,b.frameCount]));
 const prelude=`
var P045_ACTIVE=null;
var P045_COUNTS=${JSON.stringify(counts)};
var P045_STRATEGIES={110:{main:651,wait:15},146:{main:773,wait:55}};
function p045State(input,mainFrame){
 if(input===undefined)return {holdIndex:null,continueEnabled:false,strategyEnabled:false,strategyCharacterId:null,strategyFrame:1,wrongAttempts:0,choicesEnabled:false,helpEnabled:false,helpVisible:false,feedbackCharacterId:null,feedbackFrame:1};
 if(!input||!Number.isSafeInteger(input.wrongAttempts)||input.wrongAttempts<0||input.wrongAttempts>2||['continueEnabled','strategyEnabled','choicesEnabled','helpEnabled','helpVisible'].some(function(k){return typeof input[k]!=='boolean';})||!Number.isSafeInteger(input.strategyFrame)||!Number.isSafeInteger(input.feedbackFrame))throw new Error('P045_SOURCE_DISPLAY_STATE_INVALID');
 if(input.holdIndex!==null&&(!Number.isSafeInteger(input.holdIndex)||input.holdIndex<0||input.holdIndex>3||[388,525,651,773][input.holdIndex]!==mainFrame))throw new Error('P045_SOURCE_HOLD_INVALID');
 if(input.continueEnabled&&(input.holdIndex===null||input.strategyCharacterId!==null)||input.strategyEnabled&&(!input.continueEnabled||input.holdIndex<2))throw new Error('P045_SOURCE_CONTINUE_GUARD');
 if(input.strategyCharacterId===null?input.strategyFrame!==1:!Object.prototype.hasOwnProperty.call(P045_STRATEGIES,input.strategyCharacterId)||P045_STRATEGIES[input.strategyCharacterId].main!==mainFrame||input.strategyFrame<1||input.strategyFrame>P045_STRATEGIES[input.strategyCharacterId].wait)throw new Error('P045_SOURCE_STRATEGY_INVALID');
 if(input.feedbackCharacterId===null?input.feedbackFrame!==1:!Object.prototype.hasOwnProperty.call(P045_COUNTS,input.feedbackCharacterId)||input.feedbackFrame<2||input.feedbackFrame>=P045_COUNTS[input.feedbackCharacterId])throw new Error('P045_SOURCE_FEEDBACK_INVALID');
 if((input.choicesEnabled||input.helpEnabled||input.helpVisible||input.feedbackCharacterId!==null)&&mainFrame!==813)throw new Error('P045_SOURCE_MAIN_GUARD');
 if((input.feedbackCharacterId!==null||input.helpVisible)&&(input.choicesEnabled||input.helpEnabled)||input.helpVisible&&input.feedbackCharacterId!==null||input.choicesEnabled!==input.helpEnabled)throw new Error('P045_SOURCE_INPUT_GUARD');
 return input;
}
var p045SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var s=P045_ACTIVE,id=Number(obj.slice(6));
 if(s){
  if(obj==='sprite88')return;
  if(Object.prototype.hasOwnProperty.call(P045_COUNTS,id)&&obj==='sprite'+id){if(id!==s.feedbackCharacterId)return;matrix=matrix.slice();matrix[4]=5;frame=s.feedbackFrame-1;}
  if(obj==='sprite110'||obj==='sprite146'){if(id!==s.strategyCharacterId)return;frame=s.strategyFrame-1;}
  if(obj==='sprite289'){if(!s.helpVisible)return;frame=0;}
 }
 return p045SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p045State(request && request.interaction,state.localFrame);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P045_ACTIVE;\n    P045_ACTIVE=interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P045_ACTIVE=previousInteraction;');
 return runtime;
}
