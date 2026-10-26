import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P020 display marker: ${a}`);return s.replace(a,b);};
function functions(source){return new Map([...source.matchAll(/^(function ((?:shape|sprite|text|button|font)\d+)\([^\n]*\)\{[\s\S]*?^\})/gmu)].map(m=>[m[2],m[1]]));}
/** Restore only the source569 initialized fields and the selected answer's own clock. */
export function projectP020DisplayState(runtime,practice){
 assert.deepEqual(practice.problems.map(p=>p.answerCharacterId),[75,80,83,88,93,96,101,105,109,113]);
 const prelude=`
var P020_ACTIVE=null;
var P020_PROBLEMS=${JSON.stringify(practice.problems.map(p=>({question:p.question,result:p.result,answerCharacterId:p.answerCharacterId})))};
var P020_ANSWER_NAMES=P020_PROBLEMS.map(function(p){return 'sprite'+p.answerCharacterId;});
function p020State(input){
 if(input===undefined)return null;
 if(!input||!Number.isSafeInteger(input.questionIndex)||input.questionIndex<0||input.questionIndex>=10||typeof input.revealed!=='boolean'||!Number.isSafeInteger(input.answerFrame)||input.answerFrame<1||input.answerFrame>20||!input.revealed&&input.answerFrame!==1)throw new Error('P020_SOURCE_DISPLAY_STATE_INVALID');
 return input;
}
function p020Values(){
 if(!P020_ACTIVE)return null;
 var p=P020_PROBLEMS[P020_ACTIVE.questionIndex],parts=p.question.split('-'),negative=P020_ACTIVE.revealed&&p.result<0;
 return {first:parts[0],second:parts[1]+(P020_ACTIVE.revealed&&!negative?' '+p.result:''),third:negative?String(-p.result):'',negative:negative,minusX:parts[1].length===4?263.7:280.7,resultX:parts[1].length===4?272.5:289.5,answerName:'sprite'+p.answerCharacterId};
}
var p020SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var values=p020Values();
 if(P020_ANSWER_NAMES.indexOf(obj)>=0){if(!values||!P020_ACTIVE.revealed||obj!==values.answerName)return;frame=P020_ACTIVE.answerFrame-1;}
 if(obj==='sprite70'){if(!values||!values.negative)return;matrix=matrix.slice();matrix[4]=values.minusX;}
 if(obj==='text69'&&values){matrix=matrix.slice();matrix[4]=values.resultX;}
 return p020SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 for(const field of practice.fields){
  const name=`text${field.sourceCharacterId}`,old=functions(runtime).get(name);assert(old);
  const key=field.sourceCharacterId===67?'first':field.sourceCharacterId===68?'second':'third';
  const x=field.sourceAlign===1?field.boundsTwips.right-40:0;
  const add=`\n var v=p020Values();if(v){ctx.save();ctx.fillStyle=tocolor(ctrans.apply([0,0,0,1]));ctx.font=${JSON.stringify(`bold ${field.sourceFontHeightTwips}px Arial, sans-serif`)};ctx.textAlign=${JSON.stringify(field.sourceAlign===1?'right':'left')};ctx.textBaseline='alphabetic';ctx.fillText(v.${key},${x},${field.baselineTwips});ctx.restore();}\n}`;
  runtime=once(runtime,old,old.replace(/\n\}$/u,add));
 }
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p020State(request && request.interaction);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P020_ACTIVE;\n    P020_ACTIVE=interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P020_ACTIVE=previousInteraction;');
 return runtime;
}
