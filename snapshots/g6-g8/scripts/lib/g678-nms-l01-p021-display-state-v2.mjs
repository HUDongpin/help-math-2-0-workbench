import assert from 'node:assert/strict';
import {restoreSourceButtonStates} from './g678-source-button-states-v1.mjs';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P021 display marker: ${a}`);return s.replace(a,b);};
function functions(source){return new Map([...source.matchAll(/^(function ((?:shape|sprite|text|button|font)\d+)\([^\n]*\)\{[\s\S]*?^\})/gmu)].map(m=>[m[2],m[1]]));}
/** Restore source571 initialization and reconstruct only the four selected original jump instances. */
export function projectP021DisplayState(runtime,practice){
 assert.equal(practice.sourceCloseButtonStateMatrixUnits,'source-twips');runtime=restoreSourceButtonStates(runtime,150,practice.sourceCloseButtonStates);
 assert.equal(Object.keys(practice.allJumpPlacements).length,30);assert.equal(practice.problems.length,10);
 const compact=practice.problems.map(p=>({cards:p.cards.map(c=>c.id),initial:p.initialQuestion,partial:p.partialQuestion,complete:p.completedQuestion,wrong:p.feedback.en}));
 const names=Object.fromEntries(Object.entries(practice.allJumpPlacements).map(([name,p])=>['sprite'+p.id,name]));
 const prelude=`
var P021_ACTIVE=null,P021_PROBLEMS=${JSON.stringify(compact)},P021_JUMPS=${JSON.stringify(names)};
function p021State(input){
 if(input===undefined)return null;
 if(!input||!Number.isSafeInteger(input.questionIndex)||input.questionIndex<0||input.questionIndex>=10||[0,1,2].indexOf(input.step)<0||['none','wrong'].indexOf(input.popup)<0||!input.positions||typeof input.positions!=='object'||typeof input.closePressed!=='boolean'||!Number.isSafeInteger(input.correctFrame)||input.correctFrame<1||input.correctFrame>25||!Number.isSafeInteger(input.coachFrame)||input.coachFrame<1||input.coachFrame>55||!Number.isSafeInteger(input.buttonFrame)||input.buttonFrame<1||input.buttonFrame>5||input.closePressed&&input.popup!=='wrong'||!input.closePressed&&input.buttonFrame!==1||input.correctFrame>1&&input.step!==2||input.popup==='wrong'&&input.step===2)throw new Error('P021_SOURCE_DISPLAY_STATE_INVALID');
 var names=P021_PROBLEMS[input.questionIndex].cards;if(Object.keys(input.positions).sort().join()!==names.slice().sort().join())throw new Error('P021_SOURCE_CARD_SET_INVALID');
 names.forEach(function(name){var p=input.positions[name];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))throw new Error('P021_SOURCE_CARD_POSITION_INVALID');});return input;
}
var p021SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var s=P021_ACTIVE,name=P021_JUMPS[obj];
 if(name){if(!s||!s.positions[name])return;matrix=matrix.slice();matrix[4]=s.positions[name].x;matrix[5]=s.positions[name].y;frame=0;}
 if(obj==='sprite153'){if(!s||s.popup!=='wrong')return;frame=0;}
 if(obj==='sprite157')frame=s?s.correctFrame-1:0;
 if(obj==='sprite46')frame=s?s.coachFrame-1:0;
 if(obj==='sprite159')frame=0;
 if(obj==='button150')frame=s&&s.closePressed?2:0;
 if(obj==='sprite149')frame=s?s.buttonFrame-1:0;
 return p021SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
function p021Wrapped(ctx,text,width,lineHeight,baseline){
 var words=text.split(/\\s+/),line='',row=0;
 words.forEach(function(word){var next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){ctx.fillText(line,0,baseline+row*lineHeight);row++;line=word;}else line=next;});if(line)ctx.fillText(line,0,baseline+row*lineHeight);
}
`;
 for(const field of practice.fields){
  const old=functions(runtime).get('text'+field.sourceCharacterId);assert(old);
  const value=field.sourceCharacterId===44?"(s.step===0?p.initial:s.step===1?p.partial:p.complete)":"p.wrong";
  const x=field.sourceAlign===1?field.boundsTwips.right-40:0,font=`${field.sourceBold?'bold ':''}${field.sourceFontHeightTwips}px Arial, sans-serif`;
  const draw=field.sourceCharacterId===152?`p021Wrapped(ctx,value,${field.boundsTwips.right-40},${field.lineHeightTwips},${field.baselineTwips});`:`ctx.fillText(value,${x},${field.baselineTwips});`;
  const add=`\n var s=P021_ACTIVE;if(s){var p=P021_PROBLEMS[s.questionIndex],value=${value};ctx.save();ctx.fillStyle=tocolor(ctrans.apply([0,0,0,1]));ctx.font=${JSON.stringify(font)};ctx.textAlign=${JSON.stringify(field.sourceAlign===1?'right':'left')};ctx.textBaseline='alphabetic';${draw}ctx.restore();}\n}`;
  runtime=once(runtime,old,old.replace(/\n\}$/u,add));
 }
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p021State(request && request.interaction);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P021_ACTIVE;\n    P021_ACTIVE=interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P021_ACTIVE=previousInteraction;');
 return runtime;
}
