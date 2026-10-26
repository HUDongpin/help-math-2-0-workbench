import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P024 display marker: ${a}`);return s.replace(a,b);};
function functions(source){return new Map([...source.matchAll(/^(function ((?:shape|sprite|text|button|font)\d+)\([^\n]*\)\{[\s\S]*?^\})/gmu)].map(m=>[m[2],m[1]]));}
/** Restore source468 readonly fields and only the selected answer's local clock. */
export function projectP024DisplayState(runtime,practice){
 assert.deepEqual(practice.problems.map(p=>[p.answerCharacterId,p.frameCount]),[[58,68],[64,42],[63,42],[69,39],[86,64],[102,67],[119,75],[126,56],[131,60],[136,9]]);
 const prelude=`
var P024_ACTIVE=null;
var P024_PROBLEMS=${JSON.stringify(practice.problems.map(p=>({left:p.left,right:p.right,result:p.result,answerCharacterId:p.answerCharacterId,frameCount:p.frameCount})))};
var P024_ANSWER_NAMES=P024_PROBLEMS.map(function(p){return 'sprite'+p.answerCharacterId;});
function p024State(input){
 if(input===undefined)return null;
 if(!input||!Number.isSafeInteger(input.questionIndex)||input.questionIndex<0||input.questionIndex>=10||typeof input.revealed!=='boolean'||!Number.isSafeInteger(input.answerFrame)||input.answerFrame<1||input.answerFrame>P024_PROBLEMS[input.questionIndex].frameCount||!input.revealed&&input.answerFrame!==1||input.revealed&&input.answerFrame<2)throw new Error('P024_SOURCE_DISPLAY_STATE_INVALID');
 return input;
}
function p024Values(){
 if(!P024_ACTIVE)return null;
 var p=P024_PROBLEMS[P024_ACTIVE.questionIndex];
 return {first:String(p.left),second:String(p.right)+' = '+(P024_ACTIVE.revealed?String(p.result):''),answerName:'sprite'+p.answerCharacterId};
}
var p024SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var values=p024Values();
 if(P024_ANSWER_NAMES.indexOf(obj)>=0){if(!values||!P024_ACTIVE.revealed||obj!==values.answerName)return;frame=P024_ACTIVE.answerFrame-1;}
 return p024SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 assert.deepEqual(practice.fields.map(f=>[f.sourceCharacterId,f.readOnly]),[[49,true],[50,true]]);
 for(const field of practice.fields){
  const name=`text${field.sourceCharacterId}`,old=functions(runtime).get(name);assert(old);
  const key=field.sourceCharacterId===49?'first':'second',x=field.sourceAlign===1?field.boundsTwips.right-40:0;
  const add=`\n var v=p024Values();if(v){ctx.save();ctx.fillStyle=tocolor(ctrans.apply([0,0,0,1]));ctx.font=${JSON.stringify(`bold ${field.sourceFontHeightTwips}px Arial, sans-serif`)};ctx.textAlign=${JSON.stringify(field.sourceAlign===1?'right':'left')};ctx.textBaseline='alphabetic';ctx.fillText(v.${key},${x},${field.baselineTwips});ctx.restore();}\n}`;
  runtime=once(runtime,old,old.replace(/\n\}$/u,add));
 }
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p024State(request && request.interaction);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P024_ACTIVE;\n    P024_ACTIVE=interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P024_ACTIVE=previousInteraction;');
 return runtime;
}
